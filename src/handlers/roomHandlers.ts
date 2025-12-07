import { WebSocketServer } from 'ws';
import { roomStorage, playerStorage } from '../storage/index.js';
import { IExtendedWebSocket } from '../types/websocket.js';
import { gameStorage } from '../storage/GameStorage.js';

/**
 * Handle room creation
 */
export function handleCreateRoom(
    ws: IExtendedWebSocket,
    wss: WebSocketServer
): void {
    try {
        const playerId = ws.playerId;
        
        if (!playerId) {
            console.error('Player not authenticated');
            return;
        }

        const player = playerStorage.findById(playerId);
        if (!player) {
            console.error('Player not found:', playerId);
            return;
        }

        console.log(`Creating room for player: ${player.name}`);

        // Create new room with this player
        const room = roomStorage.createRoom(player);

        console.log(`Room created: ${room.id}`);

        // Broadcast updated room list to all clients
        broadcastRoomList(wss);

    } catch (error) {
        console.error('Error in handleCreateRoom:', error);
    }
}

/**
 * Handle adding user to room
 */
export function handleAddUserToRoom(
    ws: IExtendedWebSocket,
    data: string,
    wss: WebSocketServer
): void {
    try {
        const { indexRoom } = JSON.parse(data);
        const playerId = ws.playerId;

        if (!playerId) {
            console.error('Player not authenticated');
            return;
        }

        const player = playerStorage.findById(playerId);
        if (!player) {
            console.error('Player not found:', playerId);
            return;
        }

        console.log(`Player ${player.name} joining room ${indexRoom}`);

        // Add player to room
        const room = roomStorage.addPlayerToRoom(indexRoom, player);

        if (!room) {
            console.error('Room not found or full:', indexRoom);
            return;
        }

        console.log(`Player added to room. Room now has ${room.players.length} players`);

        // Room is full (2 players), create game
        if (room.players.length === 2) {
            const player1 = room.players[0]!; // Safe: we just checked length === 2
            const player2 = room.players[1]!;

            console.log(`Creating game for ${player1.name} vs ${player2.name}`);

            // Create game
            const game = gameStorage.createGame(player1.id, player2.id);

            // Link game to room
            roomStorage.setGameId(room.id, game.id);

            console.log(`Game created: ${game.id}`);

            // Send create_game message to both players
            wss.clients.forEach((client) => {
                const extClient = client as IExtendedWebSocket;
                if (extClient.playerId === player1.id || extClient.playerId === player2.id) {
                    const playerIndex = extClient.playerId === player1.id 
                        ? game.player1Index 
                        : game.player2Index;

                    const gameData = {
                        idGame: game.id,
                        idPlayer: playerIndex
                    };

                    const response = {
                        type: 'create_game',
                        data: JSON.stringify(gameData), // Convert data to JSON string
                        id: 0
                    };

                    extClient.send(JSON.stringify(response));
                    console.log(`Sent create_game to ${extClient.playerName}: idPlayer=${playerIndex}`);
                }
            });

            // Remove room from available rooms list
            broadcastRoomList(wss);
        } else {
            // Still waiting for second player
            broadcastRoomList(wss);
        }

    } catch (error) {
        console.error('Error in handleAddUserToRoom:', error);
    }
}

/**
 * Broadcast room list to all connected clients
 */
export function broadcastRoomList(wss: WebSocketServer): void {
    const availableRooms = roomStorage.getAvailableRooms();

    const roomsData = availableRooms.map(room => ({
        roomId: room.id,
        roomUsers: room.players.map(player => ({
            name: player.name,
            index: player.id
        }))
    }));

    const response = {
        type: 'update_room',
        data: JSON.stringify(roomsData), // Convert data to JSON string
        id: 0
    };

    const message = JSON.stringify(response);

    wss.clients.forEach((client) => {
        const extClient = client as IExtendedWebSocket;
        if (extClient.readyState === extClient.OPEN) {
            extClient.send(message);
        }
    });

    console.log(`Broadcasted room list: ${availableRooms.length} available rooms`);
}

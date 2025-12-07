import { WebSocketServer } from 'ws';
import { roomStorage, playerStorage } from '../storage/index.js';
import { IExtendedWebSocket } from '../types/websocket.js';
import { gameStorage } from '../storage/GameStorage.js';
import { log, logError } from '../utils/logger.js';
import { Player } from '../models/Player.js';

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
            logError('Player not authenticated', new Error('No playerId'));
            return;
        }

        const player = playerStorage.findById(playerId);
        if (!player) {
            logError('Player not found:', playerId);
            return;
        }

        log(`Creating room for player: ${player.name} (ID: ${playerId})`);

        // Create new room with this player
        const room = roomStorage.createRoom(player);

        log(`Room created: ${room.id}`, { roomId: room.id, playerId, playerName: player.name });

        // Broadcast updated room list to all clients
        broadcastRoomList(wss);

    } catch (error) {
        logError('Error in handleCreateRoom:', error);
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
            logError('Player not authenticated', new Error('No playerId'));
            return;
        }

        const player = playerStorage.findById(playerId);
        if (!player) {
            logError('Player not found:', playerId);
            return;
        }

        log(`Player ${player.name} (ID: ${playerId}) joining room ${indexRoom}`);

        // Add player to room
        const room = roomStorage.addPlayerToRoom(indexRoom, player);

        if (!room) {
            logError('Room not found or full:', indexRoom);
            return;
        }

        log(`Player added to room. Room now has ${room.players.length} players`, {
            roomId: room.id,
            players: room.players.map(p => ({ id: p.id, name: p.name }))
        });

        // Room is full (2 players), create game
        if (room.players.length === 2) {
            const player1 = room.players[0]!; // Safe: we just checked length === 2
            const player2 = room.players[1]!;

            log(`Creating game for ${player1.name} vs ${player2.name}`);

            // Create game
            const game = gameStorage.createGame(player1.id, player2.id);

            // Link game to room
            roomStorage.setGameId(room.id, game.id);

            log(`Game created: ${game.id}`, {
                gameId: game.id,
                player1: { id: player1.id, name: player1.name, index: game.player1Index },
                player2: { id: player2.id, name: player2.name, index: game.player2Index }
            });

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
                    log(`Sent create_game to ${extClient.playerName}: idPlayer=${playerIndex}`);
                }
            });

            // Remove room from available rooms list
            broadcastRoomList(wss);
        } else {
            // Still waiting for second player
            log('Waiting for second player, broadcasting room list');
            broadcastRoomList(wss);
        }

    } catch (error) {
        logError('Error in handleAddUserToRoom:', error);
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

    let sentCount = 0;
    wss.clients.forEach((client) => {
        const extClient = client as IExtendedWebSocket;
        if (extClient.readyState === extClient.OPEN) {
            extClient.send(message);
            sentCount++;
        }
    });

    log(`Broadcasted room list to ${sentCount} clients: ${availableRooms.length} available rooms`, {
        rooms: roomsData
    });
}

/**
 * Handle creating room with bot
 */
export function handleCreateRoomWithBot(
    ws: IExtendedWebSocket,
    _wss: WebSocketServer
): void {
    try {
        const playerId = ws.playerId;
        
        if (!playerId) {
            logError('Player not authenticated', new Error('No playerId'));
            return;
        }

        const player = playerStorage.findById(playerId);
        if (!player) {
            logError('Player not found:', playerId);
            return;
        }

        log(`Creating room with bot for player: ${player.name} (ID: ${playerId})`);

        // Create bot player
        const botPlayer = new Player('bot-' + Date.now(), 'Bot', 'bot-password', 0);
        
        // Create game directly with player and bot
        const game = gameStorage.createGame(player.id, botPlayer.id);
        
        // Mark game as having bot
        gameStorage.setBotGame(game.id, game.player2Index);

        log(`Game with bot created: ${game.id}`, {
            gameId: game.id,
            player: { id: player.id, name: player.name, index: game.player1Index },
            bot: { id: botPlayer.id, name: botPlayer.name, index: game.player2Index }
        });

        // Send create_game message to player
        const gameData = {
            idGame: game.id,
            idPlayer: game.player1Index
        };

        const response = {
            type: 'create_game',
            data: JSON.stringify(gameData),
            id: 0
        };

        ws.send(JSON.stringify(response));
        log(`Sent create_game to ${player.name}: idPlayer=${game.player1Index}`);

    } catch (error) {
        logError('Error in handleCreateRoomWithBot:', error);
    }
}

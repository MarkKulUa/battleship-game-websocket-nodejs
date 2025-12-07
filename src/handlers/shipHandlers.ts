import { WebSocketServer } from 'ws';
import { gameStorage } from '../storage/GameStorage.js';
import { IExtendedWebSocket } from '../types/websocket.js';
import { IAddShipsData, IStartGameData } from '../types/messages.js';
import { IShip, TShipType } from '../models/Ship.js';
import { TCellStatus } from '../models/Board.js';

/**
 * Handle ships placement
 */
export function handleAddShips(
    _ws: IExtendedWebSocket,
    data: string,
    wss: WebSocketServer
): void {
    try {
        const shipsData: IAddShipsData = JSON.parse(data);
        const { gameId, ships, indexPlayer } = shipsData;

        console.log(`Player ${indexPlayer} adding ships to game ${gameId}`);

        const game = gameStorage.findById(gameId);
        if (!game) {
            console.error('Game not found:', gameId);
            return;
        }

        // Convert ships data to IShip format
        const convertedShips: IShip[] = ships.map(ship => ({
            position: ship.position,
            direction: ship.direction,
            type: ship.type as TShipType,
            length: ship.length,
            hits: new Array(ship.length).fill(false)
        }));

        // Determine which board to update
        const isPlayer1 = indexPlayer === game.player1Index;
        const board = isPlayer1 ? game.board1 : game.board2;

        // Place ships on the board matrix
        board.ships = convertedShips;
        placeShipsOnMatrix(board.matrix, convertedShips);

        console.log(`Ships placed for player ${indexPlayer}`);

        // Check if both players have placed their ships
        if (game.board1.ships.length > 0 && game.board2.ships.length > 0) {
            console.log('Both players ready, starting game!');
            startGame(game, wss);
        }

    } catch (error) {
        console.error('Error in handleAddShips:', error);
    }
}

/**
 * Place ships on the board matrix
 */
function placeShipsOnMatrix(matrix: TCellStatus[][], ships: IShip[]): void {
    ships.forEach(ship => {
        const { position, direction, length } = ship;
        
        for (let i = 0; i < length; i++) {
            const x = direction ? position.x + i : position.x;
            const y = direction ? position.y : position.y + i;
            
            if (x >= 0 && x < 10 && y >= 0 && y < 10 && matrix[y]) {
                matrix[y]![x] = 'ship';
            }
        }
    });
}

/**
 * Start the game when both players are ready
 */
function startGame(game: any, wss: WebSocketServer): void {
    // Randomly choose who goes first
    const firstPlayer = Math.random() < 0.5 ? game.player1Index : game.player2Index;
    game.currentPlayerIndex = firstPlayer;

    console.log(`Game ${game.id} starting. First player: ${firstPlayer}`);

    // Send start_game message to both players
    wss.clients.forEach((client) => {
        const extClient = client as IExtendedWebSocket;
        
        if (extClient.playerId === game.player1Id || extClient.playerId === game.player2Id) {
            const isPlayer1 = extClient.playerId === game.player1Id;
            const playerIndex = isPlayer1 ? game.player1Index : game.player2Index;
            const playerBoard = isPlayer1 ? game.board1 : game.board2;

            const startData: IStartGameData = {
                ships: playerBoard.ships.map((ship: IShip) => ({
                    position: ship.position,
                    direction: ship.direction,
                    length: ship.length,
                    type: ship.type
                })),
                currentPlayerIndex: playerIndex
            };

            const response = {
                type: 'start_game',
                data: JSON.stringify(startData),
                id: 0
            };

            extClient.send(JSON.stringify(response));
            console.log(`Sent start_game to player ${playerIndex}`);
        }
    });

    // Send turn notification
    sendTurnNotification(game, wss);
}

/**
 * Send turn notification to both players
 */
function sendTurnNotification(game: any, wss: WebSocketServer): void {
    const turnData = {
        currentPlayer: game.currentPlayerIndex
    };

    const response = {
        type: 'turn',
        data: JSON.stringify(turnData),
        id: 0
    };

    const message = JSON.stringify(response);

    wss.clients.forEach((client) => {
        const extClient = client as IExtendedWebSocket;
        
        if (extClient.playerId === game.player1Id || extClient.playerId === game.player2Id) {
            extClient.send(message);
        }
    });

    console.log(`Turn notification sent: player ${game.currentPlayerIndex}`);
}

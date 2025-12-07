import { WebSocketServer } from 'ws';
import { gameStorage } from '../storage/GameStorage.js';
import { playerStorage } from '../storage/PlayerStorage.js';
import { IExtendedWebSocket } from '../types/websocket.js';
import { IAttackData, IRandomAttackData, IAttackResponseData, IFinishData } from '../types/messages.js';
import { IGame } from '../models/Game.js';
import { TCellStatus } from '../models/Board.js';
import { IShip } from '../models/Ship.js';
import { broadcastWinners } from './playerHandlers.js';

/**
 * Handle attack
 */
export function handleAttack(
    _ws: IExtendedWebSocket,
    data: string,
    wss: WebSocketServer
): void {
    try {
        const attackData: IAttackData = JSON.parse(data);
        const { gameId, x, y, indexPlayer } = attackData;

        console.log(`Player ${indexPlayer} attacking (${x}, ${y}) in game ${gameId}`);

        const game = gameStorage.findById(gameId);
        if (!game) {
            console.error('Game not found:', gameId);
            return;
        }

        // Validate it's player's turn
        if (game.currentPlayerIndex !== indexPlayer) {
            console.error('Not player turn:', indexPlayer);
            return;
        }

        processAttack(game, x, y, indexPlayer, wss);

    } catch (error) {
        console.error('Error in handleAttack:', error);
    }
}

/**
 * Handle random attack
 */
export function handleRandomAttack(
    _ws: IExtendedWebSocket,
    data: string,
    wss: WebSocketServer
): void {
    try {
        const attackData: IRandomAttackData = JSON.parse(data);
        const { gameId, indexPlayer } = attackData;

        console.log(`Player ${indexPlayer} random attacking in game ${gameId}`);

        const game = gameStorage.findById(gameId);
        if (!game) {
            console.error('Game not found:', gameId);
            return;
        }

        // Validate it's player's turn
        if (game.currentPlayerIndex !== indexPlayer) {
            console.error('Not player turn:', indexPlayer);
            return;
        }

        // Find random untargeted cell
        const isPlayer1 = indexPlayer === game.player1Index;
        const enemyBoard = isPlayer1 ? game.board2 : game.board1;

        const { x, y } = findRandomTarget(enemyBoard.matrix);
        
        console.log(`Random target: (${x}, ${y})`);
        processAttack(game, x, y, indexPlayer, wss);

    } catch (error) {
        console.error('Error in handleRandomAttack:', error);
    }
}

/**
 * Find random untargeted cell
 */
function findRandomTarget(matrix: TCellStatus[][]): { x: number; y: number } {
    const available: Array<{ x: number; y: number }> = [];

    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            const cell = matrix[y]?.[x];
            if (cell === 'empty' || cell === 'ship') {
                available.push({ x, y });
            }
        }
    }

    if (available.length === 0) {
        return { x: 0, y: 0 }; // Fallback
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex]!;
}

/**
 * Process attack and send responses
 */
function processAttack(
    game: IGame,
    x: number,
    y: number,
    attackerIndex: number,
    wss: WebSocketServer
): void {
    const isPlayer1 = attackerIndex === game.player1Index;
    const enemyBoard = isPlayer1 ? game.board2 : game.board1;

    const cellStatus = enemyBoard.matrix[y]?.[x];
    let status: 'miss' | 'shot' | 'killed' = 'miss';
    let shouldSwitchTurn = true;

    if (cellStatus === 'ship') {
        // Hit!
        if (enemyBoard.matrix[y]) {
            enemyBoard.matrix[y]![x] = 'hit';
        }
        
        // Find which ship was hit
        const hitShip = findShipAt(enemyBoard.ships, x, y);
        
        if (hitShip) {
            markShipHit(hitShip, x, y);
            
            if (isShipDestroyed(hitShip)) {
                status = 'killed';
                console.log(`Ship destroyed at (${x}, ${y})`);
                
                // Mark cells around destroyed ship as miss
                markAroundShip(enemyBoard.matrix, hitShip);
                
                // Send miss status for cells around ship
                sendAroundShipMisses(game, hitShip, attackerIndex, wss);
            } else {
                status = 'shot';
                console.log(`Ship hit at (${x}, ${y})`);
            }
            
            // Player gets another turn on hit
            shouldSwitchTurn = false;
        }
    } else if (cellStatus === 'empty') {
        // Miss
        if (enemyBoard.matrix[y]) {
            enemyBoard.matrix[y]![x] = 'miss';
        }
        console.log(`Miss at (${x}, ${y})`);
    }

    // Send attack response
    sendAttackResponse(game, x, y, attackerIndex, status, wss);

    // Check for game over
    if (areAllShipsDestroyed(enemyBoard.ships)) {
        console.log(`Game over! Winner: ${attackerIndex}`);
        finishGame(game, attackerIndex, wss);
        return;
    }

    // Switch turn if needed
    if (shouldSwitchTurn) {
        game.currentPlayerIndex = isPlayer1 ? game.player2Index : game.player1Index;
    }

    // Send turn notification
    sendTurnNotification(game, wss);
}

/**
 * Find ship at coordinates
 */
function findShipAt(ships: IShip[], x: number, y: number): IShip | undefined {
    return ships.find(ship => {
        const { position, direction, length } = ship;
        
        for (let i = 0; i < length; i++) {
            const shipX = direction ? position.x + i : position.x;
            const shipY = direction ? position.y : position.y + i;
            
            if (shipX === x && shipY === y) {
                return true;
            }
        }
        return false;
    });
}

/**
 * Mark ship segment as hit
 */
function markShipHit(ship: IShip, x: number, y: number): void {
    const { position, direction, length } = ship;
    
    for (let i = 0; i < length; i++) {
        const shipX = direction ? position.x + i : position.x;
        const shipY = direction ? position.y : position.y + i;
        
        if (shipX === x && shipY === y) {
            ship.hits[i] = true;
            break;
        }
    }
}

/**
 * Check if ship is completely destroyed
 */
function isShipDestroyed(ship: IShip): boolean {
    return ship.hits.every(hit => hit);
}

/**
 * Check if all ships are destroyed
 */
function areAllShipsDestroyed(ships: IShip[]): boolean {
    return ships.every(ship => isShipDestroyed(ship));
}

/**
 * Mark cells around destroyed ship as miss
 */
function markAroundShip(matrix: TCellStatus[][], ship: IShip): void {
    const { position, direction, length } = ship;
    
    for (let i = 0; i < length; i++) {
        const shipX = direction ? position.x + i : position.x;
        const shipY = direction ? position.y : position.y + i;
        
        // Mark 8 surrounding cells
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = shipX + dx;
                const ny = shipY + dy;
                
                if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
                    if (matrix[ny]?.[nx] === 'empty') {
                        matrix[ny]![nx] = 'miss';
                    }
                }
            }
        }
    }
}

/**
 * Send miss notifications for cells around destroyed ship
 */
function sendAroundShipMisses(
    game: IGame,
    ship: IShip,
    attackerIndex: number,
    wss: WebSocketServer
): void {
    const { position, direction, length } = ship;
    const cells: Array<{ x: number; y: number }> = [];
    
    for (let i = 0; i < length; i++) {
        const shipX = direction ? position.x + i : position.x;
        const shipY = direction ? position.y : position.y + i;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = shipX + dx;
                const ny = shipY + dy;
                
                if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
                    if (!cells.some(c => c.x === nx && c.y === ny)) {
                        cells.push({ x: nx, y: ny });
                    }
                }
            }
        }
    }
    
    // Send miss for each cell
    cells.forEach(cell => {
        sendAttackResponse(game, cell.x, cell.y, attackerIndex, 'miss', wss);
    });
}

/**
 * Send attack response to both players
 */
function sendAttackResponse(
    game: IGame,
    x: number,
    y: number,
    attackerIndex: number,
    status: 'miss' | 'shot' | 'killed',
    wss: WebSocketServer
): void {
    const responseData: IAttackResponseData = {
        position: { x, y },
        currentPlayer: attackerIndex,
        status
    };

    const response = {
        type: 'attack',
        data: JSON.stringify(responseData),
        id: 0
    };

    const message = JSON.stringify(response);

    wss.clients.forEach((client) => {
        const extClient = client as IExtendedWebSocket;
        
        if (extClient.playerId === game.player1Id || extClient.playerId === game.player2Id) {
            extClient.send(message);
        }
    });
}

/**
 * Send turn notification
 */
function sendTurnNotification(game: IGame, wss: WebSocketServer): void {
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
}

/**
 * Finish game and declare winner
 */
function finishGame(game: IGame, winnerIndex: number, wss: WebSocketServer): void {
    game.isFinished = true;
    
    // Determine winner ID
    const winnerId = winnerIndex === game.player1Index ? game.player1Id : game.player2Id;
    game.winnerId = winnerId;

    // Update winner's score
    playerStorage.incrementWins(winnerId);

    // Send finish message
    const finishData: IFinishData = {
        winPlayer: winnerIndex
    };

    const response = {
        type: 'finish',
        data: JSON.stringify(finishData),
        id: 0
    };

    const message = JSON.stringify(response);

    wss.clients.forEach((client) => {
        const extClient = client as IExtendedWebSocket;
        
        if (extClient.playerId === game.player1Id || extClient.playerId === game.player2Id) {
            extClient.send(message);
        }
    });

    console.log(`Game ${game.id} finished. Winner: ${winnerId}`);

    // Broadcast updated winners table
    broadcastWinners(wss);

    // Clean up game
    gameStorage.deleteGame(game.id);
}

import { WebSocketServer } from 'ws';
import { IExtendedWebSocket } from '../types/websocket.js';
import { IShip } from '../models/Ship.js';
import { gameStorage } from '../storage/GameStorage.js';
import { log } from '../utils/logger.js';

/**
 * Bot player that plays automatically
 */
export class BotPlayer {
    private gameId: string;
    private botIndex: number;
    private wss: WebSocketServer;
    private thinkingTime: number = 1000; // 1 second delay for bot moves

    constructor(gameId: string, botIndex: number, wss: WebSocketServer) {
        this.gameId = gameId;
        this.botIndex = botIndex;
        this.wss = wss;
    }

    /**
     * Place ships randomly for bot
     */
    placeShips(): IShip[] {
        const ships: IShip[] = [];
        const shipTypes: Array<{ type: 'small' | 'medium' | 'large' | 'huge'; length: number }> = [
            { type: 'huge', length: 4 },
            { type: 'large', length: 3 },
            { type: 'large', length: 3 },
            { type: 'medium', length: 2 },
            { type: 'medium', length: 2 },
            { type: 'medium', length: 2 },
            { type: 'small', length: 1 },
            { type: 'small', length: 1 },
            { type: 'small', length: 1 },
            { type: 'small', length: 1 }
        ];

        const occupiedCells = new Set<string>();

        for (const shipType of shipTypes) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;

            while (!placed && attempts < maxAttempts) {
                attempts++;
                const direction = Math.random() > 0.5;
                const x = Math.floor(Math.random() * 10);
                const y = Math.floor(Math.random() * 10);

                if (this.canPlaceShip(x, y, direction, shipType.length, occupiedCells)) {
                    const ship: IShip = {
                        position: { x, y },
                        direction,
                        length: shipType.length,
                        type: shipType.type,
                        hits: new Array(shipType.length).fill(false)
                    };

                    ships.push(ship);
                    this.markOccupiedCells(x, y, direction, shipType.length, occupiedCells);
                    placed = true;
                }
            }

            if (!placed) {
                log(`Bot failed to place ship type ${shipType.type} after ${maxAttempts} attempts`);
            }
        }

        log(`Bot placed ${ships.length} ships`);
        return ships;
    }

    /**
     * Check if ship can be placed at position
     */
    private canPlaceShip(
        x: number,
        y: number,
        direction: boolean,
        length: number,
        occupiedCells: Set<string>
    ): boolean {
        // Check if ship fits on board
        if (direction && x + length > 10) return false;
        if (!direction && y + length > 10) return false;

        // Check if cells are free (including surrounding cells)
        for (let i = 0; i < length; i++) {
            const shipX = direction ? x + i : x;
            const shipY = direction ? y : y + i;

            // Check ship cell and surrounding cells
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const checkX = shipX + dx;
                    const checkY = shipY + dy;

                    if (checkX >= 0 && checkX < 10 && checkY >= 0 && checkY < 10) {
                        const key = `${checkX},${checkY}`;
                        if (occupiedCells.has(key)) {
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    }

    /**
     * Mark cells as occupied
     */
    private markOccupiedCells(
        x: number,
        y: number,
        direction: boolean,
        length: number,
        occupiedCells: Set<string>
    ): void {
        for (let i = 0; i < length; i++) {
            const shipX = direction ? x + i : x;
            const shipY = direction ? y : y + i;

            // Mark ship cell and surrounding cells
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const checkX = shipX + dx;
                    const checkY = shipY + dy;

                    if (checkX >= 0 && checkX < 10 && checkY >= 0 && checkY < 10) {
                        occupiedCells.add(`${checkX},${checkY}`);
                    }
                }
            }
        }
    }

    /**
     * Make bot move when it's bot's turn
     */
    makeMove(): void {
        setTimeout(() => {
            const game = gameStorage.findById(this.gameId);
            if (!game || game.isFinished) {
                return;
            }

            // Check if it's bot's turn
            if (game.currentPlayerIndex !== this.botIndex) {
                return;
            }

            log(`Bot making move in game ${this.gameId}`);

            // Simulate random attack from bot
            const attackData = {
                gameId: this.gameId,
                indexPlayer: this.botIndex
            };

            const clients = Array.from(this.wss.clients);
            if (clients.length > 0) {
                const client = clients[0] as IExtendedWebSocket;
                // Import handler dynamically to avoid circular dependency
                import('../handlers/gameHandlers.js').then(({ handleRandomAttack }) => {
                    handleRandomAttack(client, JSON.stringify(attackData), this.wss);
                });
            }
        }, this.thinkingTime);
    }
}

import { IGame } from '../models/Game.js';
import { IBoard, createEmptyBoard } from '../models/Board.js';
import { randomUUID } from 'crypto';

class GameStorage {
    private games: Map<string, IGame> = new Map();

    createGame(player1Id: string, player2Id: string): IGame {
        const gameId = this.generateId();
        const game: IGame = {
            id: gameId,
            player1Id,
            player2Id,
            player1Index: Math.floor(Math.random() * 1000000),
            player2Index: Math.floor(Math.random() * 1000000),
            board1: { matrix: createEmptyBoard(), ships: [] },
            board2: { matrix: createEmptyBoard(), ships: [] },
            currentPlayerIndex: 0,
            isFinished: false
        };
        this.games.set(gameId, game);
        return game;
    }

    findById(gameId: string): IGame | undefined {
        return this.games.get(gameId);
    }

    updateBoard(gameId: string, playerIndex: number, board: IBoard): void {
        const game = this.findById(gameId);
        if (game) {
            if (playerIndex === game.player1Index) {
                game.board1 = board;
            } else if (playerIndex === game.player2Index) {
                game.board2 = board;
            }
        }
    }

    setCurrentPlayer(gameId: string, playerIndex: number): void {
        const game = this.findById(gameId);
        if (game) {
            game.currentPlayerIndex = playerIndex;
        }
    }

    finishGame(gameId: string, winnerId: string): void {
        const game = this.findById(gameId);
        if (game) {
            game.isFinished = true;
            game.winnerId = winnerId;
        }
    }

    deleteGame(gameId: string): void {
        this.games.delete(gameId);
    }

    private generateId(): string {
        return randomUUID().toString();
    }
}

export const gameStorage = new GameStorage();

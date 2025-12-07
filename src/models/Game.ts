import { IBoard } from "./Board.js";

export interface IGame {
    id: string;
    player1Id: string;
    player2Id: string;
    player1Index: number;  // unique index for game
    player2Index: number;
    board1: IBoard;  // the first player's board
    board2: IBoard;  // the second player's board
    currentPlayerIndex: number;  // whose turn to shoot
    isFinished: boolean;
    winnerId?: string;
}
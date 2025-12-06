import {IBoard} from "./Board";

export interface IGame {
    id: string;
    player1Id: string;
    player2Id: string;
    player1Index: number;  // uniq index for game
    player2Index: number;
    board1: IBoard;  // the first player's board
    board2: IBoard;  // the second player's board
    currentPlayerIndex: number;  // who's turn to shot
    isFinished: boolean;
    winnerId?: string;
}
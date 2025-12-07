import { IShip } from "./Ship.js";

export type TCellStatus = 'empty' | 'ship' | 'hit' | 'miss';
export type TBoardMatrix = TCellStatus[][];  // 10x10

export interface IBoard {
    matrix: TBoardMatrix;
    ships: IShip[];        // original ships data
}

// Helper function to create empty board
export function createEmptyBoard(): TBoardMatrix {
    return Array(10).fill(null).map(() => Array(10).fill('empty' as TCellStatus));
}

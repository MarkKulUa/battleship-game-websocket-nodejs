import {IShip} from "./Ship";

export type CellStatus = 'empty' | 'ship' | 'hit' | 'miss';
export type BoardMatrix = CellStatus[][];  // 10x10

export interface IBoard {
    matrix: BoardMatrix;
    ships: IShip[];        // original ships data
}

// const matrix: BoardMatrix = Array(10).fill(null).map(() => Array(10).fill('empty'));

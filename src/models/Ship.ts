export type ShipType = "small" | "medium" | "large" | "huge";
export type ShipPosition = { x: number, y: number };

export interface IShip {
    position: ShipPosition;
    direction: boolean; // true = horizontal, false = vertical
    type: ShipType;
    hits: boolean[];
    length: number;
}
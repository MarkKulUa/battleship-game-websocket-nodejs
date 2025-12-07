export type TShipType = "small" | "medium" | "large" | "huge";
export type TShipPosition = { x: number, y: number };

export interface IShip {
    position: TShipPosition;
    direction: boolean; // true = horizontal, false = vertical
    type: TShipType;
    hits: boolean[];
    length: number;
}
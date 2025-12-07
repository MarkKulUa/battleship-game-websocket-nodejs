import { Player } from "./Player.js";

export interface IRoom {
    id: string;
    players: Player[];  // Store Player class instances, not IPlayer interface
    gameId?: string;
}

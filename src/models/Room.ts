import {IPlayer} from "./Player";

export interface IRoom {
    id: string;
    players: IPlayer[];
    gameId?: string;
}

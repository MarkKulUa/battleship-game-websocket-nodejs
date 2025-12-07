import { IRoom, Player } from '../models';
import { randomUUID } from 'crypto';

class RoomStorage {
    private rooms: Map<string, IRoom> = new Map();

    createRoom(player: Player): IRoom {
        const roomId = this.generateId();
        const room: IRoom = {
            id: roomId,
            players: [player]
        };

        this.rooms.set(roomId, room);
        return room;
    }

    addPlayerToRoom(roomId: string, player: Player): IRoom | undefined {
        const room = this.findById(roomId);
        if (room && room.players.length < 2) {
            room.players.push(player);
            return room;
        }
        return undefined;
    }

    findById(roomId: string): IRoom | undefined {
        return this.rooms.get(roomId);
    }

    getAvailableRooms(): IRoom[] {
        return [...this.rooms.values()].filter(room => room.players.length === 1);
    }

    setGameId(roomId: string, gameId: string): void {
        const room = this.findById(roomId);
        if (room) {
            room.gameId = gameId;
        }
    }

    deleteRoom(roomId: string): void {
        this.rooms.delete(roomId);
    }

    private generateId(): string {
        return randomUUID().toString();
    }
}

export const roomStorage = new RoomStorage();

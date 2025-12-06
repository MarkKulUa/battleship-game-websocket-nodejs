import { Player, IPlayer } from '../models/Player.js';
import { randomUUID } from 'crypto';

class PlayerStorage {
    private players: Map<string, Player> = new Map();

    register(name: string, password: string): { player: Player; isNew: boolean } {
        let player = this.findByName(name);
        let isNew = false;

        if(player) {
            const res = player.verifyPassword(password);
            if(!res) {
                throw new Error('Invalid password');
            }
        }

        if (!player) {
            player = new Player(this.generateId(), name, password);
            isNew = true;
            this.players.set(player.id, player);
        }

        return { player, isNew };
    }

    findByName(name: string): Player | undefined {
        return [...this.players.values()].find(player => player.name === name);
    }

    findById(id: string): Player | undefined {
        return this.players.get(id);
    }

    incrementWins(id: string): void {
        const player = this.findById(id);
        if (player) {
            player.wins++;
        }
    }

    getAllSortedByWins(): IPlayer[] {
        return [...this.players.values()]
            .sort((p1, p2) => p2.wins - p1.wins)
            .map(player => ({
                id: player.id,
                name: player.name,
                wins: player.wins
            }));
    }

    private generateId(): string {
        return randomUUID().toString();
    }
}

export const playerStorage = new PlayerStorage();
export interface IPlayer {
    id: string;
    name: string;
    wins: number;
}

export class Player implements IPlayer {
    readonly #password: string;

    constructor(
        public id: string,
        public name: string,
        password: string,
        public wins: number = 0
    ) {
        this.#password = password;
    }

    verifyPassword(password: string): boolean {
        return this.#password === password;
    }
}

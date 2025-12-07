// Base message structure
export interface IBaseMessage {
    type: string;
    data: string; // Always a JSON string from client
    id: number;
}

// Union type of all possible incoming messages
export type TIncomingMessage = 
    | IRegRequest 
    | ICreateRoomRequest 
    | IAddUserToRoomRequest 
    | IAddShipsRequest 
    | IAttackRequest 
    | IRandomAttackRequest;

// ============ REQUEST TYPES ============

// Player registration
export interface IRegRequest {
    type: 'reg';
    data: IRegData;
    id: number;
}

export interface IRegData {
    name: string;
    password: string;
}

// Create room
export interface ICreateRoomRequest {
    type: 'create_room';
    data: string; // empty string
    id: number;
}

// Add user to room
export interface IAddUserToRoomRequest {
    type: 'add_user_to_room';
    data: string; // JSON string: { indexRoom: string }
    id: number;
}

export interface IAddUserToRoomData {
    indexRoom: string;
}

// Add ships
export interface IAddShipsRequest {
    type: 'add_ships';
    data: string; // JSON string
    id: number;
}

export interface IAddShipsData {
    gameId: string;
    ships: IShipData[];
    indexPlayer: number;
}

export interface IShipData {
    position: { x: number; y: number };
    direction: boolean;
    length: number;
    type: 'small' | 'medium' | 'large' | 'huge';
}

// Attack
export interface IAttackRequest {
    type: 'attack';
    data: string; // JSON string
    id: number;
}

export interface IAttackData {
    gameId: string;
    x: number;
    y: number;
    indexPlayer: number;
}

// Random attack
export interface IRandomAttackRequest {
    type: 'randomAttack';
    data: string; // JSON string
    id: number;
}

export interface IRandomAttackData {
    gameId: string;
    indexPlayer: number;
}

// ============ RESPONSE TYPES ============
// NOTE: All response 'data' fields are JSON strings (as per specification)

// Registration response
export interface IRegResponse {
    type: 'reg';
    data: string; // JSON string of { name, index, error, errorText }
    id: number;
}

export interface IRegResponseData {
    name: string;
    index: number | string;
    error: boolean;
    errorText: string;
}

// Update winners (broadcast to all)
export interface IUpdateWinnersResponse {
    type: 'update_winners';
    data: string; // JSON string of array
    id: number;
}

export interface IWinnerData {
    name: string;
    wins: number;
}

// Create game response
export interface ICreateGameResponse {
    type: 'create_game';
    data: string; // JSON string of { idGame, idPlayer }
    id: number;
}

export interface ICreateGameData {
    idGame: string;
    idPlayer: number;
}

// Update room (broadcast to all)
export interface IUpdateRoomResponse {
    type: 'update_room';
    data: string; // JSON string of array
    id: number;
}

export interface IRoomData {
    roomId: string;
    roomUsers: Array<{
        name: string;
        index: string;
    }>;
}

// Start game
export interface IStartGameResponse {
    type: 'start_game';
    data: string; // JSON string
    id: number;
}

export interface IStartGameData {
    ships: IShipData[];
    currentPlayerIndex: number;
}

// Turn notification
export interface ITurnResponse {
    type: 'turn';
    data: string; // JSON string
    id: number;
}

export interface ITurnData {
    currentPlayer: number;
}

// Attack feedback
export interface IAttackResponse {
    type: 'attack';
    data: string; // JSON string
    id: number;
}

export interface IAttackResponseData {
    position: { x: number; y: number };
    currentPlayer: number;
    status: 'miss' | 'killed' | 'shot';
}

// Finish game
export interface IFinishResponse {
    type: 'finish';
    data: string; // JSON string
    id: number;
}

export interface IFinishData {
    winPlayer: number;
}

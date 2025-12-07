import { WebSocket } from 'ws';

/**
 * Extended WebSocket with player information
 */
export interface IExtendedWebSocket extends WebSocket {
    playerId?: string;
    playerName?: string;
    isAlive?: boolean;
}

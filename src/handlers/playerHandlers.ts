import { WebSocket, WebSocketServer } from 'ws';
import { playerStorage } from '../storage/index.js';
import { IRegData, IRegResponse, IUpdateWinnersResponse } from '../types/messages.js';

/**
 * Handle player registration/login
 */
export function handleRegister(
    ws: WebSocket,
    data: string,
    wss: WebSocketServer
): void {
    try {
        // Parse registration data
        const regData: IRegData = JSON.parse(data);
        const { name, password } = regData;

        console.log(`Registration attempt: ${name}`);

        // Validate input
        if (!name || !password) {
            sendRegResponse(ws, {
                name: name || '',
                index: 0,
                error: true,
                errorText: 'Name and password are required'
            });
            return;
        }

        // Register or login player
        const { player, isNew } = playerStorage.register(name, password);

        console.log(`Player ${isNew ? 'registered' : 'logged in'}: ${player.name} (ID: ${player.id})`);

        // Store player ID in WebSocket for later use
        (ws as any).playerId = player.id;
        (ws as any).playerName = player.name;

        // Send success response
        sendRegResponse(ws, {
            name: player.name,
            index: player.id,
            error: false,
            errorText: ''
        });

        // Broadcast updated winners table to all clients
        broadcastWinners(wss);

    } catch (error) {
        console.error('Error in handleRegister:', error);
        sendRegResponse(ws, {
            name: '',
            index: 0,
            error: true,
            errorText: error instanceof Error ? error.message : 'Registration failed'
        });
    }
}

/**
 * Send registration response to client
 */
function sendRegResponse(ws: WebSocket, data: IRegResponse['data']): void {
    const response: IRegResponse = {
        type: 'reg',
        data,
        id: 0
    };
    ws.send(JSON.stringify(response));
    console.log('Sent reg response:', data);
}

/**
 * Broadcast winners table to all connected clients
 */
export function broadcastWinners(wss: WebSocketServer): void {
    const winners = playerStorage.getAllSortedByWins();
    
    const response: IUpdateWinnersResponse = {
        type: 'update_winners',
        data: winners.map(player => ({
            name: player.name,
            wins: player.wins
        })),
        id: 0
    };

    const message = JSON.stringify(response);
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });

    console.log(`Broadcasted winners table to ${wss.clients.size} clients`);
}

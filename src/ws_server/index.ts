import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { handleRegister } from '../handlers/playerHandlers.js';

export function initWebSocketServer(httpServer: Server): void {
    const wss = new WebSocketServer({ server: httpServer });

    console.log('WebSocket server initialized');

    wss.on('connection', (ws: WebSocket) => {
        console.log('New WebSocket connection established');

        // Handle incoming messages
        ws.on('message', (message: Buffer) => {
            try {
                const data = message.toString();
                console.log('Received message:', data);

                // Parse JSON message
                const parsedMessage = JSON.parse(data);
                console.log('Parsed message:', parsedMessage);

                // TODO: Route message to appropriate handler
                handleMessage(ws, parsedMessage, wss);
            } catch (error) {
                console.error('Error processing message:', error);
                sendError(ws, 'Invalid message format');
            }
        });

        // Handle connection close
        ws.on('close', () => {
            console.log('WebSocket connection closed');
            // TODO: Clean up player data, remove from rooms, etc.
        });

        // Handle errors
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
}

// Message handler - routes messages based on type
function handleMessage(ws: WebSocket, message: any, wss: WebSocketServer): void {
    const { type, data } = message;

    console.log(`Handling message type: ${type}`);

    // Route message to appropriate handler
    switch (type) {
        case 'reg':
            handleRegister(ws, data, wss);
            break;

        case 'create_room':
            // TODO: Handle room creation
            console.log('Create room request');
            break;

        case 'add_user_to_room':
            // TODO: Handle adding user to room
            console.log('Add user to room request:', data);
            break;

        case 'add_ships':
            // TODO: Handle ships placement
            console.log('Add ships request:', data);
            break;

        case 'attack':
            // TODO: Handle attack
            console.log('Attack request:', data);
            break;

        case 'randomAttack':
            // TODO: Handle random attack
            console.log('Random attack request:', data);
            break;

        default:
            console.log('Unknown message type:', type);
            sendError(ws, `Unknown message type: ${type}`);
    }
}

// Helper function to send error response
function sendError(ws: WebSocket, errorText: string): void {
    const response = {
        type: 'error',
        data: {
            error: true,
            errorText
        },
        id: 0
    };
    ws.send(JSON.stringify(response));
}

// Helper function to broadcast message to all clients
export function broadcast(wss: WebSocketServer, message: any): void {
    const messageStr = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}

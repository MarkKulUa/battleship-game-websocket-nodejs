import { WebSocketServer } from 'ws';
import { Server } from 'http';
import { handleRegister } from '../handlers/playerHandlers.js';
import { handleCreateRoom, handleAddUserToRoom, broadcastRoomList, handleCreateRoomWithBot } from '../handlers/roomHandlers.js';
import { handleAddShips } from '../handlers/shipHandlers.js';
import { handleAttack, handleRandomAttack } from '../handlers/gameHandlers.js';
import { IExtendedWebSocket } from '../types/websocket.js';
import { IBaseMessage } from '../types/messages.js';
import { log, logError } from '../utils/logger.js';

export function initWebSocketServer(httpServer: Server): void {
    const wss = new WebSocketServer({ server: httpServer });

    log('WebSocket server initialized');

    wss.on('connection', (ws: IExtendedWebSocket) => {
        log('New WebSocket connection established');

        // Handle incoming messages
        ws.on('message', (message: Buffer) => {
            try {
                const data = message.toString();
                log('Received message:', data);

                // Parse JSON message
                const parsedMessage: IBaseMessage = JSON.parse(data);
                
                // Validate message structure
                if (!parsedMessage.type || typeof parsedMessage.data !== 'string') {
                    throw new Error('Invalid message structure');
                }
                
                log('Parsed message:', parsedMessage);

                // Route message to appropriate handler
                handleMessage(ws, parsedMessage, wss);
            } catch (error) {
                logError('Error processing message:', error);
                sendError(ws, 'Invalid message format');
            }
        });

        // Handle connection close
        ws.on('close', () => {
            log('WebSocket connection closed', { playerId: ws.playerId, playerName: ws.playerName });
            // TODO: Clean up player data, remove from rooms, etc.
        });

        // Handle errors
        ws.on('error', (error) => {
            logError('WebSocket error:', error);
        });
    });
}

// Message handler - routes messages based on type
function handleMessage(ws: IExtendedWebSocket, message: IBaseMessage, wss: WebSocketServer): void {
    const { type, data } = message;

    log(`Handling message type: ${type}`);

    // Route message to appropriate handler
    switch (type) {
        case 'reg':
            handleRegister(ws, data, wss);
            // Send initial room list after registration
            broadcastRoomList(wss);
            break;

        case 'create_room':
            handleCreateRoom(ws, wss);
            break;

        case 'create_room_bot':
            handleCreateRoomWithBot(ws, wss);
            break;

        case 'add_user_to_room':
            handleAddUserToRoom(ws, data, wss);
            break;

        case 'add_ships':
            handleAddShips(ws, data, wss);
            break;

        case 'attack':
            handleAttack(ws, data, wss);
            break;

        case 'randomAttack':
            handleRandomAttack(ws, data, wss);
            break;

        default:
            log('Unknown message type:', type);
            sendError(ws, `Unknown message type: ${type}`);
    }
}

// Helper function to send error response
function sendError(ws: IExtendedWebSocket, errorText: string): void {
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
export function broadcast(wss: WebSocketServer, message: object): void {
    const messageStr = JSON.stringify(message);
    wss.clients.forEach((client) => {
        const extClient = client as IExtendedWebSocket;
        if (extClient.readyState === extClient.OPEN) {
            extClient.send(messageStr);
        }
    });
}

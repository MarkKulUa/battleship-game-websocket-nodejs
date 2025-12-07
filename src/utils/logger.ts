import { appendFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const LOG_FILE = join(process.cwd(), 'server.log');

// Clear log file on startup
try {
    writeFileSync(LOG_FILE, `=== Server started at ${new Date().toISOString()} ===\n`);
} catch (error) {
    console.error('Failed to initialize log file:', error);
}

export function log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = data 
        ? `[${timestamp}] ${message} ${JSON.stringify(data, null, 2)}\n`
        : `[${timestamp}] ${message}\n`;
    
    console.log(message, data || '');
    
    try {
        appendFileSync(LOG_FILE, logMessage);
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
}

export function logError(message: string, error: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message} ${error?.stack || error}\n`;
    
    console.error(message, error);
    
    try {
        appendFileSync(LOG_FILE, logMessage);
    } catch (err) {
        console.error('Failed to write error to log file:', err);
    }
}

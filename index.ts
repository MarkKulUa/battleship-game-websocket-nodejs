import { httpServer } from "./src/http_server/index.js";
import { initWebSocketServer } from "./src/ws_server/index.js";
import { log } from "./src/utils/logger.js";

const HTTP_PORT = 3000;

log(`Start static http server on the ${HTTP_PORT} port!`);
console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT, () => {
    console.log(`HTTP server is listening on port ${HTTP_PORT}`);
    console.log(`Frontend available at: http://localhost:${HTTP_PORT}`);
    log(`HTTP server is listening on port ${HTTP_PORT}`);
    log(`Frontend available at: http://localhost:${HTTP_PORT}`);
});

// Initialize WebSocket server on the same HTTP server
initWebSocketServer(httpServer);
console.log('WebSocket server ready (clients should connect to ws://localhost:3000)');
log('WebSocket server ready (clients should connect to ws://localhost:3000)');

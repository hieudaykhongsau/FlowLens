import { WebSocket, WebSocketServer } from 'ws';
import { SessionStore } from '../engine/sessionStore.js';
export class WebSocketHub {
    static instance;
    wss = null;
    clients = new Set();
    sessionStore;
    constructor() {
        this.sessionStore = SessionStore.getInstance();
        // Subscribe to SessionStore updates
        this.sessionStore.subscribe((session) => {
            this.broadcast({
                type: 'SESSION_UPDATE',
                data: session,
                timestamp: new Date().toISOString()
            });
        });
    }
    static getInstance() {
        if (!WebSocketHub.instance) {
            WebSocketHub.instance = new WebSocketHub();
        }
        return WebSocketHub.instance;
    }
    attachToServer(server) {
        this.wss = new WebSocketServer({ server });
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            // Gửi snapshot session hiện tại ngay khi client kết nối
            const currentSession = this.sessionStore.getSession();
            const initialMessage = {
                type: 'INIT_SESSION',
                data: currentSession,
                timestamp: new Date().toISOString()
            };
            ws.send(JSON.stringify(initialMessage));
            ws.on('message', (messageRaw) => {
                try {
                    const parsed = JSON.parse(messageRaw.toString());
                    this.handleClientMessage(ws, parsed);
                }
                catch (err) {
                    console.error('Invalid WebSocket message from canvas:', err);
                }
            });
            ws.on('close', () => {
                this.clients.delete(ws);
            });
            ws.on('error', (err) => {
                console.error('WebSocket client error:', err);
                this.clients.delete(ws);
            });
        });
    }
    handleClientMessage(ws, msg) {
        if (msg.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
            return;
        }
        if (msg.type === 'TRIGGER_DEMO') {
            const demoSession = this.sessionStore.createDefaultDemoSession();
            this.sessionStore.updateSession({
                endpoint: demoSession.endpoint,
                method: demoSession.method,
                nodes: demoSession.nodes,
                edges: demoSession.edges,
                rootCauseNodeId: demoSession.rootCauseNodeId,
                summary: demoSession.summary,
                status: 'completed'
            });
            return;
        }
    }
    broadcast(msg) {
        const serialized = JSON.stringify(msg);
        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(serialized);
                }
                catch (err) {
                    console.error('Error broadcasting message to client:', err);
                }
            }
        }
    }
    getConnectedClientsCount() {
        return this.clients.size;
    }
}

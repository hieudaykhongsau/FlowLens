import { Server as HttpServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { SessionStore } from '../engine/sessionStore.js';
import { isLocalOrigin } from '../security/localOrigin.js';
import { InvestigationSession } from '../types.js';

export interface WebSocketMessage {
  type: 'SESSION_UPDATE' | 'INIT_SESSION' | 'NODE_CLICKED' | 'TRIGGER_DEMO' | 'PING' | 'PONG';
  data?: any;
  timestamp?: string;
}

export class WebSocketHub {
  private static instance: WebSocketHub;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private sessionStore: SessionStore;

  private constructor() {
    this.sessionStore = SessionStore.getInstance();

    // Subscribe to SessionStore updates
    this.sessionStore.subscribe((session: InvestigationSession) => {
      this.broadcast({
        type: 'SESSION_UPDATE',
        data: session,
        timestamp: new Date().toISOString()
      });
    });
  }

  public static getInstance(): WebSocketHub {
    if (!WebSocketHub.instance) {
      WebSocketHub.instance = new WebSocketHub();
    }
    return WebSocketHub.instance;
  }

  public attachToServer(server: HttpServer): void {
    this.wss = new WebSocketServer({
      server,
      verifyClient: (info, callback) => {
        const origin = info.origin || info.req.headers.origin;
        // Cho phép client local không gửi Origin (CLI/Node) hoặc Origin localhost/127.0.0.1
        if (!origin || isLocalOrigin(origin)) {
          callback(true);
          return;
        }
        callback(false, 403, 'Forbidden: non-local WebSocket origin');
      }
    });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      // Gửi snapshot session hiện tại ngay khi client kết nối
      const currentSession = this.sessionStore.getSession();
      const initialMessage: WebSocketMessage = {
        type: 'INIT_SESSION',
        data: currentSession,
        timestamp: new Date().toISOString()
      };
      ws.send(JSON.stringify(initialMessage));

      ws.on('message', (messageRaw: string) => {
        try {
          const parsed = JSON.parse(messageRaw.toString()) as WebSocketMessage;
          this.handleClientMessage(ws, parsed);
        } catch (err) {
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

  private handleClientMessage(ws: WebSocket, msg: WebSocketMessage): void {
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

  public broadcast(msg: WebSocketMessage): void {
    const serialized = JSON.stringify(msg);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(serialized);
        } catch (err) {
          console.error('Error broadcasting message to client:', err);
        }
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

import { Server as HttpServer } from 'node:http';
export interface WebSocketMessage {
    type: 'SESSION_UPDATE' | 'INIT_SESSION' | 'NODE_CLICKED' | 'TRIGGER_DEMO' | 'PING' | 'PONG';
    data?: any;
    timestamp?: string;
}
export declare class WebSocketHub {
    private static instance;
    private wss;
    private clients;
    private sessionStore;
    private constructor();
    static getInstance(): WebSocketHub;
    attachToServer(server: HttpServer): void;
    private handleClientMessage;
    broadcast(msg: WebSocketMessage): void;
    getConnectedClientsCount(): number;
}

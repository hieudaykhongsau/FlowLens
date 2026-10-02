import { FlowEdge, FlowNode, InvestigationSession } from '../types.js';
type SessionChangeListener = (session: InvestigationSession) => void;
export declare class SessionStore {
    private static instance;
    private currentSession;
    private listeners;
    private constructor();
    static getInstance(): SessionStore;
    getSession(): InvestigationSession;
    subscribe(listener: SessionChangeListener): () => void;
    private notify;
    createNewSession(endpoint: string, method?: string, id?: string): InvestigationSession;
    updateSession(params: {
        endpoint?: string;
        method?: string;
        currentStep?: number;
        stepStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
        stepSummary?: string;
        nodes?: FlowNode[];
        edges?: FlowEdge[];
        rootCauseNodeId?: string;
        summary?: string;
        status?: 'running' | 'completed' | 'failed';
        parsedRequest?: any;
    }): InvestigationSession;
    setNodesAndEdges(nodes: FlowNode[], edges: FlowEdge[]): void;
    updateNodeState(nodeId: string, state: FlowNode['state'], extra?: Partial<FlowNode>): void;
    createDefaultDemoSession(): InvestigationSession;
}
export {};

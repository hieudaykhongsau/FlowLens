import { FlowEdge, FlowNode } from '../../types.js';
export declare function handleUpdateInvestigationSession(args: {
    sessionId?: string;
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
}): Promise<{
    content: {
        type: string;
        text: string;
    }[];
}>;

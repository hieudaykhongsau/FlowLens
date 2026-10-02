import { SessionStore } from '../../engine/sessionStore.js';
export async function handleUpdateInvestigationSession(args) {
    const store = SessionStore.getInstance();
    const updatedSession = store.updateSession({
        endpoint: args.endpoint,
        method: args.method,
        currentStep: args.currentStep,
        stepStatus: args.stepStatus,
        stepSummary: args.stepSummary,
        nodes: args.nodes,
        edges: args.edges,
        rootCauseNodeId: args.rootCauseNodeId,
        summary: args.summary,
        status: args.status
    });
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    status: 'success',
                    message: 'Investigation session updated successfully and synced to Canvas',
                    sessionId: updatedSession.id,
                    canvasUrl: 'http://localhost:9876',
                    certaintyScore: updatedSession.certaintyScore,
                    totalNodes: updatedSession.nodes.length,
                    rootCauseNodeId: updatedSession.rootCauseNodeId,
                    sessionStatus: updatedSession.status
                }, null, 2)
            }
        ]
    };
}

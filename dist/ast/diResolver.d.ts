import { FlowEdge, FlowNode } from '../types.js';
export interface DiscoveredPipeline {
    entrypointNode: FlowNode;
    filterNodes: FlowNode[];
    serviceNodes: FlowNode[];
    repositoryNodes: FlowNode[];
    databaseNode?: FlowNode;
    edges: FlowEdge[];
}
export declare class DiResolver {
    /**
     * Quét codebase và phân giải luồng tĩnh từ Endpoint -> Filter/Guard -> Service -> Repo
     */
    static resolvePipeline(endpoint: string, method?: string, workspacePath?: string): Promise<DiscoveredPipeline>;
    /**
     * Dò tìm file controller khớp với endpoint
     */
    private static findControllerForEndpoint;
    private static collectCodeFiles;
    private static buildPipelineFromDiscoveredCode;
    private static buildStandardPipeline;
}

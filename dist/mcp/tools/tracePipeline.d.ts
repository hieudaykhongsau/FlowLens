export declare function handleTraceEndpointPipeline(args: {
    endpoint: string;
    method?: string;
    workspacePath?: string;
    curlCommand?: string;
    errorCode?: number;
    rawPayload?: string;
}): Promise<{
    content: {
        type: string;
        text: string;
    }[];
}>;

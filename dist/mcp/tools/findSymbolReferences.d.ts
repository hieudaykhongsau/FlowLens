export declare function handleFindSymbolReferences(args: {
    symbolName: string;
    workspacePath?: string;
    maxResults?: number;
}): Promise<{
    content: {
        type: string;
        text: string;
    }[];
}>;

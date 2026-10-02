export declare function handleCodebaseSearch(args: {
    query: string;
    workspacePath?: string;
    fileExtensions?: string[];
    maxResults?: number;
}): Promise<{
    content: {
        type: string;
        text: string;
    }[];
}>;

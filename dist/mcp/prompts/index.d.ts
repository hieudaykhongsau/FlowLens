export declare const availablePrompts: {
    name: string;
    description: string;
    arguments: {
        name: string;
        description: string;
        required: boolean;
    }[];
}[];
export declare function handleGetPrompt(name: string, args?: Record<string, string>, port?: number): Promise<{
    description: string;
    messages: {
        role: 'user';
        content: {
            type: 'text';
            text: string;
        };
    }[];
}>;

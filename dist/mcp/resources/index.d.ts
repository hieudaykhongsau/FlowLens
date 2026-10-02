export declare const availableResources: {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}[];
export declare function handleReadResource(uri: string, port?: number): Promise<{
    contents: {
        uri: "flowlens://session/current";
        mimeType: string;
        text: string;
    }[];
} | {
    contents: {
        uri: "flowlens://canvas-url";
        mimeType: string;
        text: string;
    }[];
} | {
    contents: {
        uri: "flowlens://evidence/root-cause";
        mimeType: string;
        text: string;
    }[];
} | {
    contents: {
        uri: "flowlens://pipeline/summary";
        mimeType: string;
        text: string;
    }[];
}>;

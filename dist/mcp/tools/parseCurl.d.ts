export declare function handleParseCurlRequest(args: {
    curlCommand: string;
}): Promise<{
    content: {
        type: string;
        text: string;
    }[];
}>;

import { ExecuteRunnerParams } from '../../types.js';
export declare function handleExecuteSandboxedRunner(args: ExecuteRunnerParams): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    isError: boolean;
    content: {
        type: string;
        text: string;
    }[];
}>;

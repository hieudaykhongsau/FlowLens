import { ExecuteRunnerParams } from '../types.js';
export interface RunnerResult {
    success: boolean;
    commandExecuted: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    matchedStackTrace?: string[];
    durationMs: number;
}
export declare class SandboxDispatcher {
    /**
     * Thực thi kiểm thử an toàn qua danh sách whitelist và execFile
     */
    static executeRunner(params: ExecuteRunnerParams): Promise<RunnerResult>;
    private static handlePassiveLogMode;
    static extractStackTraceFrames(output: string): string[];
}

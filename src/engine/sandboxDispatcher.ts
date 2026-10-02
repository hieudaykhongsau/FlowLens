import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
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

const WHITELISTED_COMMANDS: Set<string> = new Set([
  'mvn',
  'mvn.cmd',
  'gradle',
  'gradlew',
  'gradlew.bat',
  'npm',
  'npm.cmd',
  'pnpm',
  'pnpm.cmd',
  'pytest',
  'python',
  'go'
]);

export class SandboxDispatcher {
  /**
   * Thực thi kiểm thử an toàn qua danh sách whitelist và execFile
   */
  public static async executeRunner(params: ExecuteRunnerParams): Promise<RunnerResult> {
    const startTime = Date.now();
    const cmd = params.command.toLowerCase();

    // Check whitelist
    const isAllowed = Array.from(WHITELISTED_COMMANDS).some(w => w === cmd || cmd.startsWith(w));
    if (!isAllowed) {
      throw new Error(`Command '${params.command}' is not whitelisted in FlowLens Sandbox. Allowed commands: ${Array.from(WHITELISTED_COMMANDS).join(', ')}`);
    }

    // Passive log mode: Just scan existing log files
    if (params.mode === 'passive_log') {
      return this.handlePassiveLogMode(params);
    }

    const cwd = params.cwd ? path.resolve(params.cwd) : process.cwd();
    const timeoutMs = params.timeoutMs || 30000;

    return new Promise((resolve) => {
      // In Windows, npm/mvn might need .cmd
      let executable: string = params.command;
      if (process.platform === 'win32') {
        if (executable === 'npm') executable = 'npm.cmd';
        if (executable === 'pnpm') executable = 'pnpm.cmd';
        if (executable === 'mvn') executable = 'mvn.cmd';
      }

      execFile(
        executable,
        params.args,
        {
          cwd,
          timeout: timeoutMs,
          maxBuffer: 10 * 1024 * 1024,
          env: { ...process.env, CI: 'true', FLOWLENS_SANDBOX: '1' }
        },
        (error, stdout, stderr) => {
          const durationMs = Date.now() - startTime;
          const exitCode = error ? (error.code ? Number(error.code) : 1) : 0;
          const stdoutStr = (stdout || '').toString();
          const stderrStr = (stderr || '').toString();

          const combined = stdoutStr + '\n' + stderrStr;
          const stackTraceFrames = SandboxDispatcher.extractStackTraceFrames(combined);

          resolve({
            success: exitCode === 0,
            commandExecuted: `${params.command} ${params.args.join(' ')}`,
            exitCode,
            stdout: stdoutStr,
            stderr: stderrStr,
            matchedStackTrace: stackTraceFrames,
            durationMs
          });
        }
      );
    });
  }

  private static handlePassiveLogMode(params: ExecuteRunnerParams): RunnerResult {
    const logFilePath = params.args[0] || 'app.log';
    const cwd = params.cwd ? path.resolve(params.cwd) : process.cwd();
    const fullPath = path.isAbsolute(logFilePath) ? logFilePath : path.join(cwd, logFilePath);

    if (!fs.existsSync(fullPath)) {
      return {
        success: false,
        commandExecuted: `passive_log inspect ${logFilePath}`,
        exitCode: 1,
        stdout: '',
        stderr: `Log file not found at ${fullPath}`,
        durationMs: 0
      };
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      const tailLines = lines.slice(-200).join('\n');
      const stackTraceFrames = this.extractStackTraceFrames(tailLines);

      return {
        success: true,
        commandExecuted: `passive_log inspect ${logFilePath}`,
        exitCode: 0,
        stdout: tailLines,
        stderr: '',
        matchedStackTrace: stackTraceFrames,
        durationMs: 5
      };
    } catch (err: any) {
      return {
        success: false,
        commandExecuted: `passive_log inspect ${logFilePath}`,
        exitCode: 1,
        stdout: '',
        stderr: err.message,
        durationMs: 0
      };
    }
  }

  public static extractStackTraceFrames(output: string): string[] {
    const frames: string[] = [];
    const lines = output.split('\n');

    const javaRegex = /^\s*at\s+([a-zA-Z0-9_$.]+)\((.*?):(\d+)\)/;
    const nodeRegex = /^\s*at\s+(?:.*?\s+)?\(?(.*?):(\d+):(\d+)\)?/;
    const pythonRegex = /^\s*File\s+"(.*?)",\s+line\s+(\d+)/;

    for (const line of lines) {
      if (javaRegex.test(line)) {
        frames.push(line.trim());
      } else if (nodeRegex.test(line) && !line.includes('node_modules')) {
        frames.push(line.trim());
      } else if (pythonRegex.test(line)) {
        frames.push(line.trim());
      }
    }

    return frames.slice(0, 15);
  }
}

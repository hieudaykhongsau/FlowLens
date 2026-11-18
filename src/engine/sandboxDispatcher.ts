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

const MAX_OUTPUT_CHARS = 16 * 1024;
const MAX_LOG_BYTES = 2 * 1024 * 1024; // 2MB

export class SandboxDispatcher {
  /**
   * Kiểm tra đường dẫn có nằm trong thư mục gốc cho phép hay không
   */
  public static isPathWithinBase(targetPath: string, baseDir: string): boolean {
    const resolvedTarget = path.resolve(targetPath);
    const resolvedBase = path.resolve(baseDir);
    const rel = path.relative(resolvedBase, resolvedTarget);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  }

  /**
   * Kiểm tra lệnh có khớp chính xác whitelist hay không (không dùng startsWith)
   */
  public static resolveWhitelistedCommand(rawCommand: string): string {
    const trimmed = (rawCommand || '').trim();
    if (!trimmed || /[;&|`$><\r\n]/.test(trimmed) || trimmed.includes('..')) {
      throw new Error(`Invalid command '${rawCommand}' in FlowLens Sandbox.`);
    }

    const hasPathSep = trimmed.includes('/') || trimmed.includes('\\');
    const baseName = path.basename(trimmed).toLowerCase();

    if (hasPathSep) {
      const normalized = trimmed.replace(/\\/g, '/');
      if (normalized !== './gradlew' && normalized !== './gradlew.bat') {
        throw new Error(`Arbitrary executable path '${rawCommand}' is not allowed in FlowLens Sandbox.`);
      }
    }

    if (!WHITELISTED_COMMANDS.has(baseName)) {
      throw new Error(
        `Command '${rawCommand}' is not whitelisted in FlowLens Sandbox. Allowed commands: ${Array.from(WHITELISTED_COMMANDS).join(', ')}`
      );
    }

    return trimmed;
  }

  /**
   * Che token, JWT và thông tin nhạy cảm trong log/output
   */
  public static redactSecrets(text: string): string {
    if (!text) return text;
    return text
      // JWT tokens
      .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*\b/g, '[REDACTED_JWT]')
      // Authorization / Bearer headers
      .replace(/(Authorization\s*:\s*(?:Bearer|Basic|Token)\s+)[^\s\r\n'"]+/gi, '$1[REDACTED]')
      .replace(/\b(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, '$1[REDACTED]')
      // Common key=value or key: value secrets
      .replace(/((?:password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key)\s*[:=]\s*['"]?)[^\s'",;\r\n}]+(['"]?)/gi, '$1[REDACTED]$2');
  }

  /**
   * Xác thực cwd nằm trong FLOWLENS_WORKSPACE_ROOT nếu biến môi trường được cấu hình
   */
  private static resolveSafeCwd(requestedCwd?: string): string {
    const allowedRoot = process.env.FLOWLENS_WORKSPACE_ROOT
      ? path.resolve(process.env.FLOWLENS_WORKSPACE_ROOT)
      : undefined;
    const cwd = requestedCwd ? path.resolve(requestedCwd) : (allowedRoot || process.cwd());

    if (allowedRoot && !this.isPathWithinBase(cwd, allowedRoot)) {
      throw new Error(`Access denied: cwd '${cwd}' is outside allowed workspace root '${allowedRoot}'.`);
    }

    return cwd;
  }

  /**
   * Thực thi kiểm thử an toàn qua danh sách whitelist và execFile
   */
  public static async executeRunner(params: ExecuteRunnerParams): Promise<RunnerResult> {
    const startTime = Date.now();
    const safeCommand = this.resolveWhitelistedCommand(params.command);
    const cwd = this.resolveSafeCwd(params.cwd);

    // Passive log mode: Just scan existing log files within workspace
    if (params.mode === 'passive_log') {
      return this.handlePassiveLogMode(params, cwd);
    }

    const timeoutMs = Math.min(Math.max(params.timeoutMs || 30000, 1000), 120000);

    return new Promise((resolve) => {
      // In Windows, npm/pnpm/mvn might need .cmd
      let executable: string = safeCommand;
      if (process.platform === 'win32') {
        const lower = executable.toLowerCase();
        if (lower === 'npm') executable = 'npm.cmd';
        if (lower === 'pnpm') executable = 'pnpm.cmd';
        if (lower === 'mvn') executable = 'mvn.cmd';
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
          const stdoutStr = this.redactSecrets((stdout || '').toString()).slice(-MAX_OUTPUT_CHARS);
          const stderrStr = this.redactSecrets((stderr || '').toString()).slice(-MAX_OUTPUT_CHARS);

          const combined = stdoutStr + '\n' + stderrStr;
          const stackTraceFrames = SandboxDispatcher.extractStackTraceFrames(combined);

          resolve({
            success: exitCode === 0,
            commandExecuted: `${safeCommand} ${params.args.join(' ')}`.trim(),
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

  private static handlePassiveLogMode(params: ExecuteRunnerParams, cwd: string): RunnerResult {
    const logFilePath = params.args[0] || 'app.log';
    const fullPath = path.resolve(cwd, logFilePath);

    if (!this.isPathWithinBase(fullPath, cwd)) {
      throw new Error(`Access denied: log file '${logFilePath}' escapes workspace '${cwd}'.`);
    }

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
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) {
        return {
          success: false,
          commandExecuted: `passive_log inspect ${logFilePath}`,
          exitCode: 1,
          stdout: '',
          stderr: `Path is not a file: ${fullPath}`,
          durationMs: 0
        };
      }

      let content: string;
      if (stat.size > MAX_LOG_BYTES) {
        const fd = fs.openSync(fullPath, 'r');
        try {
          const buffer = Buffer.alloc(MAX_LOG_BYTES);
          fs.readSync(fd, buffer, 0, MAX_LOG_BYTES, stat.size - MAX_LOG_BYTES);
          content = buffer.toString('utf-8');
        } finally {
          fs.closeSync(fd);
        }
      } else {
        content = fs.readFileSync(fullPath, 'utf-8');
      }

      const lines = content.split('\n');
      const tailLines = this.redactSecrets(lines.slice(-200).join('\n'));
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
        stderr: this.redactSecrets(err.message),
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

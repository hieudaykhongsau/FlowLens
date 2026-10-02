import { SandboxDispatcher } from '../../engine/sandboxDispatcher.js';
import { SessionStore } from '../../engine/sessionStore.js';
export async function handleExecuteSandboxedRunner(args) {
    try {
        const result = await SandboxDispatcher.executeRunner(args);
        const store = SessionStore.getInstance();
        // Cập nhật Step 4 (Xác minh Runtime)
        store.updateSession({
            currentStep: 4,
            stepStatus: result.success ? 'completed' : 'failed',
            stepSummary: `Đã chạy ${result.commandExecuted} (Exit code: ${result.exitCode}, Time: ${result.durationMs}ms)`
        });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        status: result.success ? 'passed' : 'failed',
                        exitCode: result.exitCode,
                        command: result.commandExecuted,
                        durationMs: result.durationMs,
                        matchedStackTrace: result.matchedStackTrace,
                        stdoutSnippet: result.stdout.slice(-1500),
                        stderrSnippet: result.stderr.slice(-1500),
                        guidance: result.matchedStackTrace && result.matchedStackTrace.length > 0
                            ? 'Đã phát hiện Stack Trace khớp mã nguồn. Hãy đối chiếu với node tương ứng trong Call Graph và đánh dấu STOPPED_HERE.'
                            : 'Chạy hoàn tất. Kiểm tra kết quả exit code và stdout/stderr.'
                    }, null, 2)
                }
            ]
        };
    }
    catch (err) {
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Sandbox execution error: ${err.message}`
                }
            ]
        };
    }
}

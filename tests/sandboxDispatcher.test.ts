import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { SandboxDispatcher } from '../src/engine/sandboxDispatcher.js';

describe('SandboxDispatcher security', () => {
  it('allows exact whitelisted commands and rejects startsWith bypasses', () => {
    assert.equal(SandboxDispatcher.resolveWhitelistedCommand('npm'), 'npm');
    assert.equal(SandboxDispatcher.resolveWhitelistedCommand('go'), 'go');
    assert.equal(SandboxDispatcher.resolveWhitelistedCommand('./gradlew'), './gradlew');

    assert.throws(() => SandboxDispatcher.resolveWhitelistedCommand('golang-evil'));
    assert.throws(() => SandboxDispatcher.resolveWhitelistedCommand('npm-malicious'));
    assert.throws(() => SandboxDispatcher.resolveWhitelistedCommand('/tmp/go'));
    assert.throws(() => SandboxDispatcher.resolveWhitelistedCommand('npm; rm -rf /'));
  });

  it('blocks passive_log path traversal outside workspace', async () => {
    const demoDir = path.resolve(process.cwd(), 'examples/demo-buggy-api');
    await assert.rejects(
      () =>
        SandboxDispatcher.executeRunner({
          command: 'npm',
          args: ['../../package.json'],
          cwd: demoDir,
          mode: 'passive_log'
        }),
      /Access denied/
    );
  });

  it('reads passive_log within workspace, extracts stack trace, and redacts JWT/Bearer tokens', async () => {
    const demoDir = path.resolve(process.cwd(), 'examples/demo-buggy-api');
    const result = await SandboxDispatcher.executeRunner({
      command: 'npm',
      args: ['app.log'],
      cwd: demoDir,
      mode: 'passive_log'
    });

    assert.equal(result.success, true);
    assert.ok(!result.stdout.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
    assert.ok(result.stdout.includes('[REDACTED]') || result.stdout.includes('[REDACTED_JWT]'));
    assert.ok(result.matchedStackTrace && result.matchedStackTrace.length > 0);
    assert.ok(result.matchedStackTrace[0].includes('ordersController.ts:8:19'));
  });
});

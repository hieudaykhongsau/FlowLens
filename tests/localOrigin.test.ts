import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isLocalOrigin, resolveBindHost } from '../src/security/localOrigin.js';

describe('Local server & origin security', () => {
  it('defaults bind host to 127.0.0.1', () => {
    assert.equal(resolveBindHost(undefined), '127.0.0.1');
    assert.equal(resolveBindHost(''), '127.0.0.1');
    assert.equal(resolveBindHost('127.0.0.1'), '127.0.0.1');
  });

  it('allows only localhost / 127.0.0.1 / [::1] origins', () => {
    assert.equal(isLocalOrigin('http://localhost:9876'), true);
    assert.equal(isLocalOrigin('http://127.0.0.1:5173'), true);
    assert.equal(isLocalOrigin('http://[::1]:9876'), true);

    assert.equal(isLocalOrigin('http://192.168.1.50:9876'), false);
    assert.equal(isLocalOrigin('https://evil.example.com'), false);
    assert.equal(isLocalOrigin('http://localhost.evil.com'), false);
    assert.equal(isLocalOrigin(undefined), false);
  });
});

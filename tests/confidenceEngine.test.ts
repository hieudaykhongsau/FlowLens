import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConfidenceEngine } from '../src/engine/confidenceEngine.js';

describe('ConfidenceEngine', () => {
  it('marks static-only route discovery as INFERRED heuristic with unverified runtime reason', () => {
    const res = ConfidenceEngine.calculateConfidence({
      hasRouteAnnotation: true,
      hasVerifiedSymbolCall: true
    });

    assert.equal(res.confidence, 0.7);
    assert.equal(res.certainty, 'INFERRED');
    assert.equal(res.isHeuristic, true);
    assert.ok(res.evidenceSources.includes('static_analysis'));
    assert.ok(res.unverifiedReasons.some((r) => r.includes('runtime')));
  });

  it('marks node as EXPLICIT only when runtime stack trace/span is also present', () => {
    const res = ConfidenceEngine.calculateConfidence({
      hasRouteAnnotation: true,
      hasVerifiedSymbolCall: true,
      hasStackTraceOrSpan: true
    });

    assert.equal(res.confidence, 1);
    assert.equal(res.certainty, 'EXPLICIT');
    assert.ok(res.evidenceSources.includes('stack_trace'));
    assert.equal(res.unverifiedReasons.length, 0);
  });

  it('applies ambiguity penalty and records agent_inference when no evidence exists', () => {
    const res = ConfidenceEngine.calculateConfidence({
      hasAmbiguousOverload: true
    });

    assert.equal(res.confidence, 0);
    assert.equal(res.certainty, 'UNKNOWN');
    assert.deepEqual(res.evidenceSources, ['agent_inference']);
    assert.ok(res.unverifiedReasons.some((r) => r.includes('implementation/overload')));
  });
});

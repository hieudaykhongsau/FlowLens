import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { DiResolver } from '../src/ast/diResolver.js';

describe('DiResolver reproducible pipeline', () => {
  it('discovers controller route in demo-buggy-api with explicit file/line and heuristic certainty', async () => {
    const demoDir = path.resolve(process.cwd(), 'examples/demo-buggy-api');
    const pipeline = await DiResolver.resolvePipeline('/api/v1/orders', 'POST', demoDir);

    assert.equal(pipeline.entrypointNode.file, 'ordersController.ts');
    assert.equal(pipeline.entrypointNode.certainty, 'INFERRED');
    assert.equal(pipeline.entrypointNode.isHeuristicConfidence, true);
    assert.ok(pipeline.entrypointNode.evidenceSources?.includes('static_analysis'));
    assert.ok((pipeline.entrypointNode.unverifiedReasons?.length || 0) > 0);
  });

  it('marks fallback pipeline nodes as agent_inference when route is not found', async () => {
    const emptyDir = path.resolve(process.cwd(), 'tests');
    const pipeline = await DiResolver.resolvePipeline('/api/v1/nonexistent', 'GET', emptyDir);

    assert.equal(pipeline.entrypointNode.certainty, 'UNKNOWN');
    assert.equal(pipeline.entrypointNode.confidence, 0);
    assert.deepEqual(pipeline.entrypointNode.evidenceSources, ['agent_inference']);
    assert.ok(pipeline.entrypointNode.unverifiedReasons?.some((r) => r.includes('Không tìm thấy controller/route')));
  });
});

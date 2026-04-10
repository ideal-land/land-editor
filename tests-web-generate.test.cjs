const test = require('node:test');
const assert = require('node:assert/strict');

const { runGeneratePrompt } = require('./.tmp-dist/apps/agent-orchestrator/src/web-generate.js');

test('runGeneratePrompt should pass prompt and return output paths', async () => {
  const calls = [];
  const output = await runGeneratePrompt(
    '做一个湖边公园',
    {
      projectId: 'demo',
      tileSize: 16,
      assetRoot: '/assets',
      outputDir: '/output',
      runtimePreviewDir: '/runtime',
      agent: { modelId: 'm', baseURL: 'u', apiKey: 'k' }
    },
    async (input) => {
      calls.push(input);
      return { outputPaths: { sceneSpec: '/output/scene-spec.json' } };
    }
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].userPrompt, '做一个湖边公园');
  assert.equal(output.outputPaths.sceneSpec, '/output/scene-spec.json');
});

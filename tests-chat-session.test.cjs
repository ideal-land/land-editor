const test = require('node:test');
const assert = require('node:assert/strict');

const { createChatSession } = require('./.tmp-dist/apps/agent-orchestrator/src/chat-session.js');

test('chat session should generate per turn output dir', async () => {
  const calls = [];
  const session = createChatSession(
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
      return {
        sceneSpec: { sceneId: 'scene-1' },
        layoutPlan: {},
        tiledMap: {},
        report: { status: 'success' },
        assetManifest: { projectId: 'demo' },
        outputPaths: { sceneSpec: `${input.outputDir}/scene-spec.json` }
      };
    }
  );

  const turn1 = await session.runTurn('做一个森林');
  const turn2 = await session.runTurn('再加一条路');

  assert.equal(calls.length, 2);
  assert.match(calls[0].outputDir, /turn-001$/);
  assert.match(calls[1].outputDir, /turn-002$/);
  assert.equal(turn1.turn, 1);
  assert.equal(turn2.turn, 2);
});

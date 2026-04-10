const test = require('node:test');
const assert = require('node:assert/strict');

const { createOpenAICompatibleIntentAgent } = require('./.tmp-dist/apps/agent-orchestrator/src/intent-agents/openai-compatible.js');

test('openai compatible adapter should call generateObject and return sceneSpec', async () => {
  let providerCalledWith = null;
  let modelCalledWith = null;
  let generateObjectCalled = false;

  const agent = createOpenAICompatibleIntentAgent({
    modelId: 'gpt-4o-mini',
    baseURL: 'https://example.com/v1',
    apiKey: 'test-key',
    createProvider(args) {
      providerCalledWith = args;
      return (modelId) => {
        modelCalledWith = modelId;
        return { modelId };
      };
    },
    async generateObject(args) {
      generateObjectCalled = true;
      assert.ok(String(args.prompt).includes('用户需求'));
      return {
        object: {
          sceneId: 'scene-ai-001',
          theme: 'test',
          tileSize: 16,
          mapSize: { width: 64, height: 48 },
          player: { characterId: 'player_01', spawnHint: 'center', movement: '4dir', speed: 120 },
          camera: { followPlayer: true, zoom: 2, deadzone: false },
          weather: {
            type: 'clear', intensity: 0, wind: 0, overlayAlpha: 0,
            ambientTint: '#FFFFFF', useSplash: false, fogDensity: 0
          },
          zones: [
            { id: 'z1', kind: 'plaza', areaHint: 'center', size: 'medium', priority: 10 },
            { id: 'z2', kind: 'park', areaHint: 'top_left', size: 'large', priority: 8 }
          ],
          paths: [{ id: 'p1', kind: 'line', width: 3, anchor: 'center', connectZones: ['z1', 'z2'] }],
          objects: [{ kind: 'bench', count: 5, placement: 'along-road' }],
          constraints: { mustBeWalkable: true, preserveOpenCenter: true, maxObjectDensity: 0.3, mustReachZones: ['z1', 'z2'] }
        }
      };
    }
  });

  const sceneSpec = await agent.generateSceneSpec({
    userPrompt: '做一个小公园',
    assetManifest: {
      version: '1.0.0',
      projectId: 'demo',
      tileSize: 16,
      tilesets: [{ id: 'base', image: 'tiles/base.png', tileWidth: 16, tileHeight: 16, categories: ['ground'] }],
      placeables: [{ id: 'bench', kind: 'bench', sourceType: 'sprite', assetRef: 'bench.png', placementModes: ['along-road'], collision: false, rotatable: true }],
      characters: [{ id: 'player_01', spritesheet: 'player.png', frameWidth: 16, frameHeight: 24, animations: { idle_down: { start: 0, end: 0, frameRate: 1, repeat: -1 } } }],
      weatherAssets: []
    }
  });

  assert.equal(sceneSpec.sceneId, 'scene-ai-001');
  assert.equal(providerCalledWith.baseURL, 'https://example.com/v1');
  assert.equal(modelCalledWith, 'gpt-4o-mini');
  assert.equal(generateObjectCalled, true);
});

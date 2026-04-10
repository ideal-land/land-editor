const test = require('node:test');
const assert = require('node:assert/strict');

const { runPipeline } = require('./.tmp-dist/apps/agent-orchestrator/src/pipeline.js');

const assetManifest = {
  version: '1.0.0',
  projectId: 'demo',
  tileSize: 16,
  tilesets: [
    {
      id: 'base',
      image: 'tiles/base.png',
      tileWidth: 16,
      tileHeight: 16,
      categories: ['ground', 'road']
    }
  ],
  placeables: [
    {
      id: 'bench-a',
      kind: 'bench',
      sourceType: 'tile-object',
      assetRef: 'base:bench',
      placementModes: ['along-road'],
      collision: false,
      rotatable: true
    },
    {
      id: 'lamp-a',
      kind: 'lamp',
      sourceType: 'tile-object',
      assetRef: 'base:lamp',
      placementModes: ['along-road'],
      collision: false,
      rotatable: false
    }
  ],
  characters: [
    {
      id: 'hero',
      spritesheet: 'chars/hero.png',
      frameWidth: 16,
      frameHeight: 24,
      animations: {
        idle_down: { start: 0, end: 0, frameRate: 1, repeat: -1 }
      }
    }
  ],
  weatherAssets: [{ id: 'rain-drop', kind: 'rain', texture: 'weather/rain.png' }]
};

test('runPipeline should generate sceneSpec / layoutPlan / report', async () => {
  const output = await runPipeline({
    userPrompt: '做一个下雨的公园，有主路，放一些长椅和路灯',
    assetManifest
  });

  assert.equal(output.sceneSpec.tileSize, 16);
  assert.equal(output.sceneSpec.player.characterId, 'hero');
  assert.equal(output.sceneSpec.weather.type, 'rain');
  assert.ok(output.sceneSpec.paths.length >= 1);
  assert.ok(output.layoutPlan.zoneBounds.length >= 2);
  assert.equal(output.report.sceneId, output.sceneSpec.sceneId);
  assert.notEqual(output.report.status, 'failed');
});

test('runPipeline should degrade weather to clear when weather assets are missing', async () => {
  const output = await runPipeline({
    userPrompt: '做一个下雪场景',
    assetManifest: {
      ...assetManifest,
      weatherAssets: []
    }
  });

  assert.equal(output.sceneSpec.weather.type, 'clear');
  assert.match((output.report.warnings || []).join('\n'), /天气资源缺失/);
});

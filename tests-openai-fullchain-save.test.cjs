const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { runOpenAICompatiblePipelineAndSave } = require('./.tmp-dist/apps/agent-orchestrator/src/run-openai-compatible.js');

test('runOpenAICompatiblePipelineAndSave should write manifest/spec/layout/report files', async () => {
  const assetDir = await fs.mkdtemp(path.join(os.tmpdir(), 'land-save-assets-'));
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'land-save-out-'));
  const runtimeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'land-runtime-'));

  await fs.mkdir(path.join(assetDir, 'tilesets'), { recursive: true });
  await fs.mkdir(path.join(assetDir, 'objects'), { recursive: true });
  await fs.mkdir(path.join(assetDir, 'chars'), { recursive: true });

  await fs.writeFile(path.join(assetDir, 'tilesets', 'town_tileset.png'), 'x');
  await fs.writeFile(path.join(assetDir, 'objects', 'bench_wood.png'), 'x');
  await fs.writeFile(path.join(assetDir, 'chars', 'player_01.png'), 'x');

  const result = await runOpenAICompatiblePipelineAndSave({
    userPrompt: '做一个像素公园',
    projectId: 'save-demo',
    tileSize: 16,
    assetRoot: assetDir,
    outputDir: outDir,
    runtimePreviewDir: runtimeDir,
    agent: {
      modelId: 'mock-model',
      baseURL: 'https://example.com/v1',
      apiKey: 'test-key',
      createProvider: () => () => ({ model: 'mock-model' }),
      async generateObject() {
        return {
          object: {
            sceneId: 'scene-save-001',
            theme: 'park',
            tileSize: 16,
            mapSize: { width: 64, height: 48 },
            player: { characterId: 'player_01', spawnHint: 'center', movement: '4dir', speed: 120 },
            camera: { followPlayer: true, zoom: 2, deadzone: false },
            weather: { type: 'clear', intensity: 0, wind: 0, overlayAlpha: 0, ambientTint: '#fff', useSplash: false, fogDensity: 0 },
            zones: [
              { id: 'z1', kind: 'plaza', areaHint: 'center', size: 'medium', priority: 10 },
              { id: 'z2', kind: 'park', areaHint: 'top_left', size: 'large', priority: 8 }
            ],
            paths: [{ id: 'p1', kind: 'line', width: 3, anchor: 'center', connectZones: ['z1', 'z2'] }],
            objects: [{ kind: 'bench', count: 3, placement: 'along-road' }],
            constraints: { mustBeWalkable: true, preserveOpenCenter: true, maxObjectDensity: 0.3, mustReachZones: ['z1', 'z2'] }
          }
        };
      }
    }
  });

  assert.equal(result.outputPaths.sceneSpec.endsWith('scene-spec.json'), true);
  assert.equal(result.outputPaths.layoutPlan.endsWith('layout-plan.json'), true);
  assert.equal(result.outputPaths.generationReport.endsWith('generation-report.json'), true);
  assert.equal(result.outputPaths.assetManifest.endsWith('asset-manifest.json'), true);
  assert.equal(result.outputPaths.tiledMap.endsWith('tiled-map.json'), true);
  assert.equal(result.outputPaths.runtimeMap.endsWith('tiled/maps/main.export.json'), true);
  assert.equal(result.outputPaths.runtimeWeatherPreset.endsWith('generated/weather-preset.json'), true);

  const sceneSpec = JSON.parse(await fs.readFile(result.outputPaths.sceneSpec, 'utf8'));
  const report = JSON.parse(await fs.readFile(result.outputPaths.generationReport, 'utf8'));
  const tiledMap = JSON.parse(await fs.readFile(result.outputPaths.tiledMap, 'utf8'));
  const runtimeWeather = JSON.parse(await fs.readFile(result.outputPaths.runtimeWeatherPreset, 'utf8'));

  assert.equal(sceneSpec.sceneId, 'scene-save-001');
  assert.equal(report.sceneId, 'scene-save-001');
  assert.equal(tiledMap.type, 'map');
  assert.equal(runtimeWeather.type, 'clear');
});

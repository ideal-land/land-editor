const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { analyzeAssets } = require('./.tmp-dist/packages/asset-analyzer/src/index.js');
const { runPipelineFromAssets } = require('./.tmp-dist/apps/agent-orchestrator/src/pipeline.js');

test('analyzeAssets should scan uploaded assets into manifest', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'land-assets-'));
  await fs.mkdir(path.join(dir, 'tilesets'), { recursive: true });
  await fs.mkdir(path.join(dir, 'objects'), { recursive: true });
  await fs.mkdir(path.join(dir, 'chars'), { recursive: true });
  await fs.mkdir(path.join(dir, 'weather'), { recursive: true });

  await fs.writeFile(path.join(dir, 'tilesets', 'town_tileset.png'), 'x');
  await fs.writeFile(path.join(dir, 'objects', 'bench_wood.png'), 'x');
  await fs.writeFile(path.join(dir, 'chars', 'player_01.png'), 'x');
  await fs.writeFile(path.join(dir, 'weather', 'rain_drop.png'), 'x');

  const result = await analyzeAssets({
    projectId: 'demo-upload',
    tileSize: 16,
    assetRoot: dir
  });

  assert.equal(result.manifest.projectId, 'demo-upload');
  assert.equal(result.manifest.tilesets.length, 1);
  assert.equal(result.manifest.placeables.length, 1);
  assert.equal(result.manifest.characters.length, 1);
  assert.equal((result.manifest.weatherAssets || []).length, 1);
});

test('runPipelineFromAssets should complete end-to-end with configured agent', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'land-pipeline-'));
  await fs.mkdir(path.join(dir, 'tilesets'), { recursive: true });
  await fs.mkdir(path.join(dir, 'objects'), { recursive: true });
  await fs.mkdir(path.join(dir, 'chars'), { recursive: true });
  await fs.writeFile(path.join(dir, 'tilesets', 'town_tileset.png'), 'x');
  await fs.writeFile(path.join(dir, 'objects', 'bench_wood.png'), 'x');
  await fs.writeFile(path.join(dir, 'chars', 'player_01.png'), 'x');

  const output = await runPipelineFromAssets({
    userPrompt: '雨天公园，有主路和长椅',
    projectId: 'demo-pipeline',
    tileSize: 16,
    assetRoot: dir,
    intentAgent: {
      async generateSceneSpec({ assetManifest }) {
        return {
          sceneId: 'scene-e2e-001',
          theme: 'rain park',
          tileSize: assetManifest.tileSize,
          mapSize: { width: 64, height: 48 },
          player: {
            characterId: assetManifest.characters[0].id,
            spawnHint: 'road_near_center',
            movement: '4dir',
            speed: 120
          },
          camera: { followPlayer: true, zoom: 2, deadzone: false },
          weather: {
            type: 'clear',
            intensity: 0,
            wind: 0,
            overlayAlpha: 0,
            ambientTint: '#FFFFFF',
            useSplash: false,
            fogDensity: 0
          },
          zones: [
            { id: 'z1', kind: 'plaza', areaHint: 'center', size: 'medium', priority: 10 },
            { id: 'z2', kind: 'park', areaHint: 'top_left', size: 'large', priority: 8 }
          ],
          paths: [{ id: 'p1', kind: 'line', width: 3, anchor: 'center', connectZones: ['z1', 'z2'] }],
          objects: [{ kind: 'bench', count: 6, placement: 'along-road' }],
          constraints: {
            mustBeWalkable: true,
            preserveOpenCenter: true,
            maxObjectDensity: 0.3,
            mustReachZones: ['z1', 'z2']
          }
        };
      }
    }
  });

  assert.equal(output.sceneSpec.sceneId, 'scene-e2e-001');
  assert.equal(output.assetManifest.projectId, 'demo-pipeline');
  assert.notEqual(output.report.status, 'failed');
  assert.ok(output.layoutPlan.navigation.spawnCandidates.length > 0);
});

test('analyzeAssets should still resolve minimal assets with generic file names', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'land-assets-generic-'));
  await fs.mkdir(path.join(dir, 'upload'), { recursive: true });

  await fs.writeFile(path.join(dir, 'upload', 'a.png'), 'x');
  await fs.writeFile(path.join(dir, 'upload', 'b.png'), 'x');

  const result = await analyzeAssets({
    projectId: 'generic-upload',
    tileSize: 16,
    assetRoot: dir
  });

  assert.ok(result.manifest.tilesets.length >= 1);
  assert.ok(result.manifest.characters.length >= 1);
});

test('analyzeAssets should use label agent result for semantic tagging', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'land-assets-agent-'));
  await fs.mkdir(path.join(dir, 'upload'), { recursive: true });
  await fs.writeFile(path.join(dir, 'upload', 'a.png'), 'x');

  const result = await analyzeAssets({
    projectId: 'agent-upload',
    tileSize: 16,
    assetRoot: dir,
    labelAgent: {
      async labelAssets({ imageFiles }) {
        return {
          tilesets: [{ file: imageFiles[0], categories: ['ground', 'foliage'] }],
          characters: [{ file: imageFiles[0], id: 'hero' }],
          placeables: [{ file: imageFiles[0], kind: 'tree' }],
          weatherAssets: []
        };
      }
    }
  });

  assert.equal(result.manifest.placeables[0].kind, 'tree');
  assert.equal(result.manifest.characters[0].id, 'hero');
});

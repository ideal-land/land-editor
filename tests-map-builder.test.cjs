const test = require('node:test');
const assert = require('node:assert/strict');

const { buildMap } = require('./.tmp-dist/packages/map-builder/src/index.js');

test('buildMap should output tiled layers with tile data', () => {
  const result = buildMap({
    assetManifest: {
      version: '1.0.0',
      projectId: 'demo',
      tileSize: 16,
      tilesets: [{ id: 'base', image: 'tiles/base.png', tileWidth: 16, tileHeight: 16, firstGid: 1, categories: ['ground', 'road'] }],
      placeables: [],
      characters: [{ id: 'player_01', spritesheet: 'player.png', frameWidth: 16, frameHeight: 24, animations: { idle_down: { start: 0, end: 0, frameRate: 1, repeat: -1 } } }]
    },
    sceneSpec: {
      sceneId: 'scene-test',
      theme: 'test',
      tileSize: 16,
      mapSize: { width: 32, height: 24 },
      player: { characterId: 'player_01', spawnHint: 'center', movement: '4dir', speed: 120 },
      camera: { followPlayer: true, zoom: 2, deadzone: false },
      weather: { type: 'clear', intensity: 0, wind: 0, overlayAlpha: 0, ambientTint: '#fff', useSplash: false, fogDensity: 0 },
      zones: [
        { id: 'z1', kind: 'plaza', areaHint: 'center', size: 'medium', priority: 10 },
        { id: 'z2', kind: 'park', areaHint: 'top_left', size: 'large', priority: 8 }
      ],
      paths: [{ id: 'p1', kind: 'line', width: 3, anchor: 'center', connectZones: ['z1', 'z2'] }],
      objects: [],
      constraints: { mustBeWalkable: true, preserveOpenCenter: true, maxObjectDensity: 0.3, mustReachZones: ['z1', 'z2'] }
    }
  });

  const layers = result.tiledMap.layers;
  assert.ok(Array.isArray(layers));
  assert.ok(layers.length >= 3);

  const groundLayer = layers.find((layer) => layer.name === 'ground');
  const roadLayer = layers.find((layer) => layer.name === 'road');
  const collisionLayer = layers.find((layer) => layer.name === 'collision');

  assert.ok(groundLayer);
  assert.ok(roadLayer);
  assert.ok(collisionLayer);

  assert.equal(groundLayer.data.length, 32 * 24);
  assert.equal(roadLayer.data.length, 32 * 24);
  assert.equal(collisionLayer.data.length, 32 * 24);

  const roadTileCount = roadLayer.data.filter((gid) => gid > 0).length;
  assert.ok(roadTileCount > 0);
});

test('buildMap should create path segments for each connect zone', () => {
  const result = buildMap({
    assetManifest: {
      version: '1.0.0',
      projectId: 'demo',
      tileSize: 16,
      tilesets: [{ id: 'base', image: 'tiles/base.png', tileWidth: 16, tileHeight: 16, firstGid: 1, categories: ['ground', 'road'] }],
      placeables: [],
      characters: [{ id: 'player_01', spritesheet: 'player.png', frameWidth: 16, frameHeight: 24, animations: { idle_down: { start: 0, end: 0, frameRate: 1, repeat: -1 } } }]
    },
    sceneSpec: {
      sceneId: 'scene-branch',
      theme: 'test',
      tileSize: 16,
      mapSize: { width: 48, height: 36 },
      player: { characterId: 'player_01', spawnHint: 'center', movement: '4dir', speed: 120 },
      camera: { followPlayer: true, zoom: 2, deadzone: false },
      weather: { type: 'clear', intensity: 0, wind: 0, overlayAlpha: 0, ambientTint: '#fff', useSplash: false, fogDensity: 0 },
      zones: [
        { id: 'center', kind: 'plaza', areaHint: 'center', size: 'medium', priority: 10 },
        { id: 'top-left', kind: 'park', areaHint: 'top_left', size: 'large', priority: 8 },
        { id: 'bottom-right', kind: 'cafe', areaHint: 'bottom_right', size: 'small', priority: 7 }
      ],
      paths: [{ id: 'main', kind: 'fork', width: 3, anchor: 'center', connectZones: ['top-left', 'bottom-right'] }],
      objects: [],
      constraints: { mustBeWalkable: true, preserveOpenCenter: true, maxObjectDensity: 0.3, mustReachZones: ['top-left', 'bottom-right'] }
    }
  });

  assert.equal(result.layoutPlan.pathSegments.length, 2);
  const ids = result.layoutPlan.pathSegments.map((s) => s.id);
  assert.ok(ids.includes('main-top-left'));
  assert.ok(ids.includes('main-bottom-right'));

  const roadLayer = result.tiledMap.layers.find((layer) => layer.name === 'road');
  const roadTileCount = roadLayer.data.filter((gid) => gid > 0).length;
  assert.ok(roadTileCount > 20);
});

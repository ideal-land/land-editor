import type { AssetManifest, LayoutPlan, Placement, SceneSpec } from '../../scene-schema/src';
import type { BuildMapInput, BuildMapResult } from './types';

function createEmptyLayout(sceneSpec: SceneSpec): LayoutPlan {
  return {
    sceneId: sceneSpec.sceneId,
    mapSize: sceneSpec.mapSize,
    anchors: [],
    pathSegments: [],
    zoneBounds: [],
    placements: [],
    navigation: {
      walkableRectangles: [],
      spawnCandidates: []
    }
  };
}

function synthesizeAnchors(sceneSpec: SceneSpec, layout: LayoutPlan): void {
  layout.anchors.push({
    id: 'center',
    x: Math.floor(sceneSpec.mapSize.width / 2),
    y: Math.floor(sceneSpec.mapSize.height / 2),
    kind: 'hub'
  });
}

function synthesizeZones(sceneSpec: SceneSpec, layout: LayoutPlan): void {
  // 这里只是示意；真实实现应根据 areaHint 与 size 做区域求解
  let i = 0;
  for (const zone of sceneSpec.zones) {
    layout.zoneBounds.push({
      zoneId: zone.id,
      x: 4 + i * 8,
      y: 4 + i * 6,
      width: 20,
      height: 14
    });
    i += 1;
  }
}

function synthesizePaths(sceneSpec: SceneSpec, layout: LayoutPlan): void {
  const center = layout.anchors.find((a) => a.id === 'center');
  if (!center) return;
  for (const path of sceneSpec.paths) {
    layout.pathSegments.push({
      id: path.id,
      width: path.width,
      material: 'default-road',
      points: [
        { x: center.x, y: sceneSpec.mapSize.height - 2 },
        { x: center.x, y: center.y }
      ]
    });
  }
}

function synthesizePlacements(sceneSpec: SceneSpec, _assets: AssetManifest, layout: LayoutPlan): void {
  let benchIndex = 1;
  for (const req of sceneSpec.objects) {
    for (let i = 0; i < req.count; i += 1) {
      const placement: Placement = {
        id: `${req.kind}-${String(benchIndex).padStart(3, '0')}`,
        kind: req.kind,
        x: 8 + i * 2,
        y: 10 + (i % 4) * 2,
        rotation: 0
      };
      layout.placements.push(placement);
      benchIndex += 1;
    }
  }
}

function synthesizeNavigation(sceneSpec: SceneSpec, layout: LayoutPlan): void {
  layout.navigation.walkableRectangles.push({
    x: 0,
    y: 0,
    width: sceneSpec.mapSize.width,
    height: sceneSpec.mapSize.height
  });
  layout.navigation.spawnCandidates.push({
    id: 'spawn-main',
    x: Math.floor(sceneSpec.mapSize.width / 2),
    y: Math.floor(sceneSpec.mapSize.height / 2)
  });
}

export function buildMap(input: BuildMapInput): BuildMapResult {
  const layout = createEmptyLayout(input.sceneSpec);
  synthesizeAnchors(input.sceneSpec, layout);
  synthesizeZones(input.sceneSpec, layout);
  synthesizePaths(input.sceneSpec, layout);
  synthesizePlacements(input.sceneSpec, input.assetManifest, layout);
  synthesizeNavigation(input.sceneSpec, layout);

  const tiledMap = {
    version: '1.10',
    tiledversion: '1.12.x',
    type: 'map',
    orientation: 'orthogonal',
    tilewidth: input.sceneSpec.tileSize,
    tileheight: input.sceneSpec.tileSize,
    width: input.sceneSpec.mapSize.width,
    height: input.sceneSpec.mapSize.height,
    layers: []
  };

  return {
    layoutPlan: layout,
    tiledMap,
    warnings: ['buildMap 目前只提供骨架与示意布局，需接入真实铺图算法']
  };
}

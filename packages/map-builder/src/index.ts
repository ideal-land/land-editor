import type { AssetManifest, LayoutPlan, Placement, SceneSpec, ZoneSpec } from '../../scene-schema/src';
import type { BuildMapInput, BuildMapResult } from './types';

interface Point {
  x: number;
  y: number;
}

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

function resolveZoneSize(zone: ZoneSpec): { width: number; height: number } {
  if (zone.size === 'large') return { width: 18, height: 14 };
  if (zone.size === 'small') return { width: 10, height: 8 };
  return { width: 14, height: 10 };
}

function resolveZoneTopLeft(mapWidth: number, mapHeight: number, zone: ZoneSpec, zoneWidth: number, zoneHeight: number): Point {
  const margin = 2;
  const centerX = Math.floor((mapWidth - zoneWidth) / 2);
  const centerY = Math.floor((mapHeight - zoneHeight) / 2);

  switch (zone.areaHint) {
    case 'top_left':
      return { x: margin, y: margin };
    case 'top_right':
      return { x: mapWidth - zoneWidth - margin, y: margin };
    case 'bottom_left':
      return { x: margin, y: mapHeight - zoneHeight - margin };
    case 'bottom_right':
      return { x: mapWidth - zoneWidth - margin, y: mapHeight - zoneHeight - margin };
    case 'left':
      return { x: margin, y: centerY };
    case 'right':
      return { x: mapWidth - zoneWidth - margin, y: centerY };
    case 'top':
      return { x: centerX, y: margin };
    case 'bottom':
      return { x: centerX, y: mapHeight - zoneHeight - margin };
    case 'center':
    default:
      return { x: centerX, y: centerY };
  }
}

function synthesizeZones(sceneSpec: SceneSpec, layout: LayoutPlan): void {
  for (const zone of sceneSpec.zones) {
    const { width, height } = resolveZoneSize(zone);
    const pos = resolveZoneTopLeft(sceneSpec.mapSize.width, sceneSpec.mapSize.height, zone, width, height);

    layout.zoneBounds.push({
      zoneId: zone.id,
      x: pos.x,
      y: pos.y,
      width,
      height
    });
  }
}

function zoneCenter(layout: LayoutPlan, zoneId: string): Point | null {
  const zone = layout.zoneBounds.find((item) => item.zoneId === zoneId);
  if (!zone) return null;

  return {
    x: zone.x + Math.floor(zone.width / 2),
    y: zone.y + Math.floor(zone.height / 2)
  };
}

function synthesizePaths(sceneSpec: SceneSpec, layout: LayoutPlan): void {
  const center = layout.anchors.find((a) => a.id === 'center');
  if (!center) return;

  for (const path of sceneSpec.paths) {
    const connectZones = path.connectZones ?? [];

    if (connectZones.length === 0) {
      layout.pathSegments.push({
        id: path.id,
        width: path.width,
        material: 'default-road',
        points: [
          { x: center.x, y: sceneSpec.mapSize.height - 2 },
          { x: center.x, y: center.y }
        ]
      });
      continue;
    }

    for (const zoneId of connectZones) {
      const target = zoneCenter(layout, zoneId);
      if (!target) continue;

      layout.pathSegments.push({
        id: `${path.id}-${zoneId}`,
        width: path.width,
        material: 'default-road',
        points: [
          { x: center.x, y: center.y },
          { x: target.x, y: target.y }
        ]
      });
    }
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

function toIndex(width: number, x: number, y: number): number {
  return y * width + x;
}

function inRange(width: number, height: number, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < width && y < height;
}

function paintDisc(layer: number[], width: number, height: number, cx: number, cy: number, radius: number, gid: number): void {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if (!inRange(width, height, x, y)) continue;
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radius * radius) {
        layer[toIndex(width, x, y)] = gid;
      }
    }
  }
}

function rasterizeSegment(layer: number[], width: number, height: number, from: Point, to: Point, radius: number, gid: number): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));

  if (steps === 0) {
    paintDisc(layer, width, height, from.x, from.y, radius, gid);
    return;
  }

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = Math.round(from.x + dx * t);
    const y = Math.round(from.y + dy * t);
    paintDisc(layer, width, height, x, y, radius, gid);
  }
}

function createTiledMap(sceneSpec: SceneSpec, layout: LayoutPlan): Record<string, unknown> {
  const width = sceneSpec.mapSize.width;
  const height = sceneSpec.mapSize.height;
  const tileCount = width * height;

  const groundLayer = new Array<number>(tileCount).fill(1);
  const roadLayer = new Array<number>(tileCount).fill(0);
  const collisionLayer = new Array<number>(tileCount).fill(0);

  for (const segment of layout.pathSegments) {
    const radius = Math.max(0, Math.floor((segment.width - 1) / 2));
    for (let i = 1; i < segment.points.length; i += 1) {
      rasterizeSegment(roadLayer, width, height, segment.points[i - 1], segment.points[i], radius, 2);
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = toIndex(width, x, y);
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        collisionLayer[idx] = 1;
      }
      if (roadLayer[idx] > 0) {
        collisionLayer[idx] = 0;
      }
    }
  }

  return {
    version: '1.10',
    tiledversion: '1.12.x',
    type: 'map',
    orientation: 'orthogonal',
    tilewidth: sceneSpec.tileSize,
    tileheight: sceneSpec.tileSize,
    width,
    height,
    layers: [
      {
        id: 1,
        name: 'ground',
        type: 'tilelayer',
        width,
        height,
        data: groundLayer,
        visible: true,
        opacity: 1
      },
      {
        id: 2,
        name: 'road',
        type: 'tilelayer',
        width,
        height,
        data: roadLayer,
        visible: true,
        opacity: 1
      },
      {
        id: 3,
        name: 'collision',
        type: 'tilelayer',
        width,
        height,
        data: collisionLayer,
        visible: false,
        opacity: 1,
        properties: [{ name: 'collision', type: 'bool', value: true }]
      }
    ]
  };
}

export function buildMap(input: BuildMapInput): BuildMapResult {
  const layout = createEmptyLayout(input.sceneSpec);
  synthesizeAnchors(input.sceneSpec, layout);
  synthesizeZones(input.sceneSpec, layout);
  synthesizePaths(input.sceneSpec, layout);
  synthesizePlacements(input.sceneSpec, input.assetManifest, layout);
  synthesizeNavigation(input.sceneSpec, layout);

  const tiledMap = createTiledMap(input.sceneSpec, layout);

  return {
    layoutPlan: layout,
    tiledMap,
    warnings: []
  };
}

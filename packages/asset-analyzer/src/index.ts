import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { AssetManifest, PlaceableDef, WeatherAssetDef } from '../../scene-schema/src';

export interface AnalyzeAssetsInput {
  projectId: string;
  tileSize: number;
  assetRoot: string;
}

export interface AnalyzeAssetsResult {
  manifest: AssetManifest;
  warnings: string[];
  unresolved: string[];
}

async function walkFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const abs = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(abs)));
      continue;
    }
    files.push(abs);
  }

  return files;
}

function normalizeId(filePath: string): string {
  return path.basename(filePath, path.extname(filePath)).toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function inferPlaceableKind(filePath: string): string {
  const id = normalizeId(filePath);
  if (id.includes('bench')) return 'bench';
  if (id.includes('lamp')) return 'lamp';
  if (id.includes('tree')) return 'tree';
  if (id.includes('rock')) return 'rock';
  return 'decor';
}

function inferWeatherAsset(filePath: string): WeatherAssetDef | null {
  const id = normalizeId(filePath);
  if (id.includes('rain')) return { id, kind: 'rain', texture: filePath };
  if (id.includes('snow')) return { id, kind: 'snow', texture: filePath };
  if (id.includes('fog')) return { id, kind: 'fog', texture: filePath };
  if (id.includes('splash')) return { id, kind: 'splash', texture: filePath };
  if (id.includes('overlay')) return { id, kind: 'overlay', texture: filePath };
  return null;
}

function isImage(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp';
}

/**
 * 第一版实现目标：让“上传素材 -> 产出可用 manifest”可以直接跑通。
 */
export async function analyzeAssets(input: AnalyzeAssetsInput): Promise<AnalyzeAssetsResult> {
  const files = (await walkFiles(input.assetRoot)).filter(isImage);
  const lowerFiles = files.map((file) => file.toLowerCase());

  const tilesetFiles = files.filter((_, i) => lowerFiles[i].includes('tileset') || lowerFiles[i].includes('/tiles/'));
  const characterFiles = files.filter((_, i) => lowerFiles[i].includes('/char') || lowerFiles[i].includes('player'));
  const objectFiles = files.filter((_, i) => lowerFiles[i].includes('/object') || lowerFiles[i].includes('/prop') || lowerFiles[i].includes('bench') || lowerFiles[i].includes('lamp') || lowerFiles[i].includes('tree'));
  const weatherAssets = files
    .map((f) => inferWeatherAsset(f))
    .filter((item): item is WeatherAssetDef => item !== null);

  const placeables: PlaceableDef[] = objectFiles.map((file, index) => ({
    id: normalizeId(file),
    kind: inferPlaceableKind(file),
    sourceType: 'sprite',
    assetRef: file,
    placementModes: ['along-road', 'scatter'],
    collision: false,
    rotatable: true,
    variants: [`v${index + 1}`]
  }));

  const manifest: AssetManifest = {
    version: '1.0.0',
    projectId: input.projectId,
    tileSize: input.tileSize,
    tilesets: tilesetFiles.map((file, index) => ({
      id: normalizeId(file),
      image: file,
      tileWidth: input.tileSize,
      tileHeight: input.tileSize,
      firstGid: 1 + index * 500,
      categories: ['ground', 'road']
    })),
    placeables,
    characters: characterFiles.map((file) => ({
      id: normalizeId(file),
      spritesheet: file,
      frameWidth: input.tileSize,
      frameHeight: Math.round(input.tileSize * 1.5),
      animations: {
        idle_down: { start: 0, end: 0, frameRate: 1, repeat: -1 },
        walk_down: { start: 0, end: 3, frameRate: 8, repeat: -1 }
      }
    })),
    weatherAssets
  };

  const unresolved: string[] = [];
  const warnings: string[] = [];

  if (manifest.tilesets.length === 0) unresolved.push('未识别到 tileset，请检查文件名是否包含 tileset 或放入 tiles 目录');
  if (manifest.characters.length === 0) unresolved.push('未识别到角色 spritesheet，请放入 chars 目录或命名包含 player');
  if (manifest.placeables.length === 0) warnings.push('未识别到可放置对象，将仅生成基础道路与区域');

  return { manifest, warnings, unresolved };
}

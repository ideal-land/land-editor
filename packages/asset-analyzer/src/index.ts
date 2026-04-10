import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { AssetManifest, PlaceableDef, WeatherAssetDef } from '../../scene-schema/src';

export interface AnalyzeAssetsInput {
  projectId: string;
  tileSize: number;
  assetRoot: string;
  labelAgent?: AssetLabelAgent;
}

export interface AnalyzeAssetsResult {
  manifest: AssetManifest;
  warnings: string[];
  unresolved: string[];
}

export interface AssetLabelResult {
  tilesets: Array<{ file: string; categories?: string[] }>;
  characters: Array<{ file: string; id?: string }>;
  placeables: Array<{ file: string; kind: string }>;
  weatherAssets: Array<{ file: string; kind: 'rain' | 'snow' | 'fog' | 'splash' | 'overlay' }>;
}

export interface AssetLabelAgent {
  labelAssets(input: { imageFiles: string[]; projectId: string; tileSize: number }): Promise<AssetLabelResult>;
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

function makeTileset(file: string, tileSize: number, index: number, categories: string[] = ['ground', 'road']) {
  return {
    id: normalizeId(file),
    image: file,
    tileWidth: tileSize,
    tileHeight: tileSize,
    firstGid: 1 + index * 500,
    categories
  };
}

function makeCharacter(file: string, tileSize: number, idOverride?: string) {
  return {
    id: idOverride ?? normalizeId(file),
    spritesheet: file,
    frameWidth: tileSize,
    frameHeight: Math.round(tileSize * 1.5),
    animations: {
      idle_down: { start: 0, end: 0, frameRate: 1, repeat: -1 },
      walk_down: { start: 0, end: 3, frameRate: 8, repeat: -1 }
    }
  };
}

function buildHeuristicManifest(files: string[], input: AnalyzeAssetsInput): AnalyzeAssetsResult {
  const lowerFiles = files.map((file) => file.toLowerCase());

  const weatherAssets = files
    .map((f) => inferWeatherAsset(f))
    .filter((item): item is WeatherAssetDef => item !== null);

  const weatherFiles = new Set(weatherAssets.map((item) => item.texture ?? ''));
  const nonWeatherFiles = files.filter((f) => !weatherFiles.has(f));

  const tilesetFiles = files.filter((_, i) => lowerFiles[i].includes('tileset') || lowerFiles[i].includes('/tiles/'));
  const characterFiles = files.filter((_, i) => lowerFiles[i].includes('/char') || lowerFiles[i].includes('player'));
  const objectFiles = files.filter((_, i) => lowerFiles[i].includes('/object') || lowerFiles[i].includes('/prop') || lowerFiles[i].includes('bench') || lowerFiles[i].includes('lamp') || lowerFiles[i].includes('tree'));

  const warnings: string[] = [];

  if (tilesetFiles.length === 0 && nonWeatherFiles.length > 0) {
    tilesetFiles.push(nonWeatherFiles[0]);
    warnings.push(`未命中 tileset 命名规则，已使用 ${path.basename(nonWeatherFiles[0])} 作为默认 tileset`);
  }

  if (characterFiles.length === 0 && nonWeatherFiles.length > 0) {
    const fallbackCharacter = nonWeatherFiles.find((f) => !tilesetFiles.includes(f)) ?? nonWeatherFiles[0];
    characterFiles.push(fallbackCharacter);
    warnings.push(`未命中角色命名规则，已使用 ${path.basename(fallbackCharacter)} 作为默认角色 spritesheet`);
  }

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
    tilesets: tilesetFiles.map((file, index) => makeTileset(file, input.tileSize, index)),
    placeables,
    characters: characterFiles.map((file) => makeCharacter(file, input.tileSize)),
    weatherAssets
  };

  const unresolved: string[] = [];

  if (manifest.tilesets.length === 0) unresolved.push('未识别到 tileset，至少需要 1 张可用图像');
  if (manifest.characters.length === 0) unresolved.push('未识别到角色 spritesheet，至少需要 1 张可用图像');
  if (manifest.placeables.length === 0) warnings.push('未识别到可放置对象，将仅生成基础道路与区域');

  return { manifest, warnings, unresolved };
}

function buildAgentManifest(files: string[], input: AnalyzeAssetsInput, labeled: AssetLabelResult): AnalyzeAssetsResult {
  const manifest: AssetManifest = {
    version: '1.0.0',
    projectId: input.projectId,
    tileSize: input.tileSize,
    tilesets: labeled.tilesets.map((item, index) => makeTileset(item.file, input.tileSize, index, item.categories ?? ['ground', 'road'])),
    placeables: labeled.placeables.map((item, index) => ({
      id: `${normalizeId(item.file)}_${index + 1}`,
      kind: item.kind,
      sourceType: 'sprite',
      assetRef: item.file,
      placementModes: ['along-road', 'scatter'],
      collision: false,
      rotatable: true
    })),
    characters: labeled.characters.map((item) => makeCharacter(item.file, input.tileSize, item.id)),
    weatherAssets: labeled.weatherAssets.map((item) => ({
      id: normalizeId(item.file),
      kind: item.kind,
      texture: item.file
    }))
  };

  const unresolved: string[] = [];
  if (manifest.tilesets.length === 0) unresolved.push('label agent 未返回 tileset');
  if (manifest.characters.length === 0) unresolved.push('label agent 未返回角色 spritesheet');

  const warnings: string[] = [];
  if (manifest.placeables.length === 0) warnings.push('label agent 未返回可放置对象，将仅生成基础道路与区域');

  return { manifest, warnings, unresolved };
}

/**
 * 第一版实现目标：让“上传素材 -> 产出可用 manifest”可以直接跑通。
 */
export async function analyzeAssets(input: AnalyzeAssetsInput): Promise<AnalyzeAssetsResult> {
  const files = (await walkFiles(input.assetRoot)).filter(isImage);

  if (input.labelAgent) {
    const labeled = await input.labelAgent.labelAssets({
      imageFiles: files,
      projectId: input.projectId,
      tileSize: input.tileSize
    });
    return buildAgentManifest(files, input, labeled);
  }

  return buildHeuristicManifest(files, input);
}

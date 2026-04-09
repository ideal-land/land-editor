import type { AssetManifest } from '../../scene-schema/src';

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

/**
 * 第一版建议以“半自动标注”为主：
 * - 自动扫描目录
 * - 自动提取基础 metadata
 * - 把语义标注交给人工或上层 agent
 */
export async function analyzeAssets(_input: AnalyzeAssetsInput): Promise<AnalyzeAssetsResult> {
  return {
    manifest: {
      version: '1.0.0',
      projectId: 'TODO',
      tileSize: 16,
      tilesets: [],
      placeables: [],
      characters: []
    },
    warnings: ['analyzeAssets 仍是骨架实现，需要补文件扫描与标签映射'],
    unresolved: []
  };
}

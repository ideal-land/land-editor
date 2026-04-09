import type { AssetManifest, LayoutPlan, SceneSpec } from '../../scene-schema/src';

export interface BuildMapInput {
  assetManifest: AssetManifest;
  sceneSpec: SceneSpec;
  previousLayout?: LayoutPlan;
  rebuildScope?: 'full' | 'roads' | 'zones' | 'objects' | 'weather';
}

export interface BuildMapResult {
  layoutPlan: LayoutPlan;
  tiledMap: Record<string, unknown>;
  warnings: string[];
}

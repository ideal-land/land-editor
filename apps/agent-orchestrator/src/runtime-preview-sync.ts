import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PipelineFromAssetsOutput } from './pipeline';

export interface RuntimePreviewPaths {
  runtimeMap: string;
  runtimeWeatherPreset: string;
  runtimeSceneSpec: string;
}

export async function syncToRuntimePreview(
  output: Pick<PipelineFromAssetsOutput, 'tiledMap' | 'sceneSpec'>,
  runtimePreviewDir: string
): Promise<RuntimePreviewPaths> {
  const runtimeMap = path.join(runtimePreviewDir, 'tiled/maps/main.export.json');
  const runtimeWeatherPreset = path.join(runtimePreviewDir, 'generated/weather-preset.json');
  const runtimeSceneSpec = path.join(runtimePreviewDir, 'generated/scene-spec.json');

  await mkdir(path.dirname(runtimeMap), { recursive: true });
  await mkdir(path.dirname(runtimeWeatherPreset), { recursive: true });

  await writeFile(runtimeMap, JSON.stringify(output.tiledMap, null, 2));
  await writeFile(runtimeWeatherPreset, JSON.stringify(output.sceneSpec.weather, null, 2));
  await writeFile(runtimeSceneSpec, JSON.stringify(output.sceneSpec, null, 2));

  return {
    runtimeMap,
    runtimeWeatherPreset,
    runtimeSceneSpec
  };
}

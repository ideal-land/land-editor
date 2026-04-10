import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createOpenAICompatibleIntentAgent, type OpenAICompatibleIntentAgentConfig } from './intent-agents/openai-compatible';
import { runPipelineFromAssets, type PipelineFromAssetsOutput } from './pipeline';
import { syncToRuntimePreview } from './runtime-preview-sync';

export interface RunOpenAICompatiblePipelineInput {
  userPrompt: string;
  projectId: string;
  tileSize: number;
  assetRoot: string;
  agent: OpenAICompatibleIntentAgentConfig;
}

export interface SavedOutputPaths {
  assetManifest: string;
  sceneSpec: string;
  layoutPlan: string;
  tiledMap: string;
  generationReport: string;
  runtimeMap: string;
  runtimeWeatherPreset: string;
  runtimeSceneSpec: string;
}

export interface RunOpenAICompatiblePipelineAndSaveInput extends RunOpenAICompatiblePipelineInput {
  outputDir: string;
  runtimePreviewDir: string;
}

export async function runOpenAICompatiblePipeline(input: RunOpenAICompatiblePipelineInput): Promise<PipelineFromAssetsOutput> {
  const intentAgent = createOpenAICompatibleIntentAgent(input.agent);
  return runPipelineFromAssets({
    userPrompt: input.userPrompt,
    projectId: input.projectId,
    tileSize: input.tileSize,
    assetRoot: input.assetRoot,
    intentAgent
  });
}

export async function runOpenAICompatiblePipelineAndSave(
  input: RunOpenAICompatiblePipelineAndSaveInput
): Promise<PipelineFromAssetsOutput & { outputPaths: SavedOutputPaths }> {
  const output = await runOpenAICompatiblePipeline(input);

  await mkdir(input.outputDir, { recursive: true });

  const outputPaths = {
    assetManifest: path.join(input.outputDir, 'asset-manifest.json'),
    sceneSpec: path.join(input.outputDir, 'scene-spec.json'),
    layoutPlan: path.join(input.outputDir, 'layout-plan.json'),
    tiledMap: path.join(input.outputDir, 'tiled-map.json'),
    generationReport: path.join(input.outputDir, 'generation-report.json'),
    ...(await syncToRuntimePreview(output, input.runtimePreviewDir))
  };

  await writeFile(outputPaths.assetManifest, JSON.stringify(output.assetManifest, null, 2));
  await writeFile(outputPaths.sceneSpec, JSON.stringify(output.sceneSpec, null, 2));
  await writeFile(outputPaths.layoutPlan, JSON.stringify(output.layoutPlan, null, 2));
  await writeFile(outputPaths.tiledMap, JSON.stringify(output.tiledMap, null, 2));
  await writeFile(outputPaths.generationReport, JSON.stringify(output.report, null, 2));

  return {
    ...output,
    outputPaths
  };
}

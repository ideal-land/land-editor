import { runOpenAICompatiblePipelineAndSave, type RunOpenAICompatiblePipelineAndSaveInput } from './run-openai-compatible';

export interface WebGenerateConfig {
  projectId: string;
  tileSize: number;
  assetRoot: string;
  outputDir: string;
  runtimePreviewDir: string;
  agent: RunOpenAICompatiblePipelineAndSaveInput['agent'];
}

export async function runGeneratePrompt(
  prompt: string,
  config: WebGenerateConfig,
  runner: (input: RunOpenAICompatiblePipelineAndSaveInput) => Promise<any> = runOpenAICompatiblePipelineAndSave
): Promise<any> {
  return runner({
    userPrompt: prompt,
    projectId: config.projectId,
    tileSize: config.tileSize,
    assetRoot: config.assetRoot,
    outputDir: config.outputDir,
    runtimePreviewDir: config.runtimePreviewDir,
    agent: config.agent
  });
}

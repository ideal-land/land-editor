import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface CreateTrialWorkspaceInput {
  rootDir?: string;
  envFileName?: string;
}

export interface CreateTrialWorkspaceResult {
  assetsDir: string;
  outputDir: string;
  runtimePreviewDir: string;
  envFile: string;
}

function toEnvContent(input: {
  assetsDir: string;
  outputDir: string;
  runtimePreviewDir: string;
}): string {
  return [
    'USER_PROMPT=做一个雨天像素公园',
    'PROJECT_ID=demo-project',
    'TILE_SIZE=16',
    `ASSET_ROOT=${input.assetsDir}`,
    `OUTPUT_DIR=${input.outputDir}`,
    'MODEL_ID=gpt-4o-mini',
    'OPENAI_COMPAT_BASE_URL=https://your-openai-compatible-endpoint/v1',
    'OPENAI_COMPAT_API_KEY=your-api-key',
    `RUNTIME_PREVIEW_DIR=${input.runtimePreviewDir}`,
    ''
  ].join('\n');
}

export async function createTrialWorkspace(input: CreateTrialWorkspaceInput = {}): Promise<CreateTrialWorkspaceResult> {
  const rootDir = input.rootDir ?? process.cwd();
  const envFileName = input.envFileName ?? '.env.trial';

  const assetsDir = path.join(rootDir, 'trial-data/assets-upload');
  const outputDir = path.join(rootDir, 'trial-data/output');
  const runtimePreviewDir = path.join(rootDir, 'apps/runtime-phaser/public');
  const envFile = path.join(rootDir, envFileName);

  await mkdir(assetsDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });
  await mkdir(path.join(runtimePreviewDir, 'tiled/maps'), { recursive: true });
  await mkdir(path.join(runtimePreviewDir, 'generated'), { recursive: true });

  await writeFile(
    envFile,
    toEnvContent({
      assetsDir,
      outputDir,
      runtimePreviewDir
    })
  );

  return {
    assetsDir,
    outputDir,
    runtimePreviewDir,
    envFile
  };
}

import path from 'node:path';
import { runOpenAICompatiblePipelineAndSave, type RunOpenAICompatiblePipelineAndSaveInput } from './run-openai-compatible';

export interface ChatSessionConfig {
  projectId: string;
  tileSize: number;
  assetRoot: string;
  outputDir: string;
  runtimePreviewDir: string;
  agent: RunOpenAICompatiblePipelineAndSaveInput['agent'];
}

export interface ChatTurnResult {
  turn: number;
  prompt: string;
  output: Awaited<ReturnType<typeof runOpenAICompatiblePipelineAndSave>>;
}

export interface ChatSession {
  runTurn(prompt: string): Promise<ChatTurnResult>;
}

function turnDir(baseDir: string, turn: number): string {
  return path.join(baseDir, `turn-${String(turn).padStart(3, '0')}`);
}

export function createChatSession(
  config: ChatSessionConfig,
  runner: (input: RunOpenAICompatiblePipelineAndSaveInput) => Promise<Awaited<ReturnType<typeof runOpenAICompatiblePipelineAndSave>>> = runOpenAICompatiblePipelineAndSave
): ChatSession {
  let turn = 0;

  return {
    async runTurn(prompt: string): Promise<ChatTurnResult> {
      turn += 1;
      const output = await runner({
        userPrompt: prompt,
        projectId: config.projectId,
        tileSize: config.tileSize,
        assetRoot: config.assetRoot,
        outputDir: turnDir(config.outputDir, turn),
        runtimePreviewDir: config.runtimePreviewDir,
        agent: config.agent
      });

      return {
        turn,
        prompt,
        output
      };
    }
  };
}

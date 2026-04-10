import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createChatSession } from './chat-session';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`缺少环境变量: ${name}`);
  return value;
}

async function main(): Promise<void> {
  const tileSize = Number(requiredEnv('TILE_SIZE'));
  if (!Number.isInteger(tileSize) || tileSize < 8) {
    throw new Error('TILE_SIZE 必须是 >= 8 的整数');
  }

  const session = createChatSession({
    projectId: requiredEnv('PROJECT_ID'),
    tileSize,
    assetRoot: requiredEnv('ASSET_ROOT'),
    outputDir: requiredEnv('OUTPUT_DIR'),
    runtimePreviewDir: requiredEnv('RUNTIME_PREVIEW_DIR'),
    agent: {
      modelId: requiredEnv('MODEL_ID'),
      baseURL: requiredEnv('OPENAI_COMPAT_BASE_URL'),
      apiKey: requiredEnv('OPENAI_COMPAT_API_KEY')
    }
  });

  const rl = createInterface({ input, output });
  console.log('已进入场景对话模式，输入 exit 退出。');

  while (true) {
    const prompt = (await rl.question('你: ')).trim();
    if (!prompt) continue;
    if (prompt.toLowerCase() === 'exit') break;

    const result = await session.runTurn(prompt);
    console.log(`[turn ${result.turn}] 输出目录: ${result.output.outputPaths.sceneSpec.replace('/scene-spec.json', '')}`);
  }

  rl.close();
}

void main();

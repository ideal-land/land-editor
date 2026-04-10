import { createServer } from 'node:http';
import { runGeneratePrompt } from './web-generate';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`缺少环境变量: ${name}`);
  return value;
}

const config = {
  projectId: requiredEnv('PROJECT_ID'),
  tileSize: Number(requiredEnv('TILE_SIZE')),
  assetRoot: requiredEnv('ASSET_ROOT'),
  outputDir: requiredEnv('OUTPUT_DIR'),
  runtimePreviewDir: requiredEnv('RUNTIME_PREVIEW_DIR'),
  agent: {
    modelId: requiredEnv('MODEL_ID'),
    baseURL: requiredEnv('OPENAI_COMPAT_BASE_URL'),
    apiKey: requiredEnv('OPENAI_COMPAT_API_KEY')
  }
};

const port = Number(process.env.GENERATE_API_PORT ?? '8787');

const server = createServer(async (req: any, res: any) => {
  if (req.method !== 'POST' || req.url !== '/generate') {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  let raw = '';
  req.on('data', (chunk: any) => {
    raw += chunk.toString('utf8');
  });

  req.on('end', async () => {
    try {
      const body = JSON.parse(raw || '{}') as { prompt?: string };
      const prompt = (body.prompt ?? '').trim();
      if (!prompt) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'prompt 不能为空' }));
        return;
      }

      const output = await runGeneratePrompt(prompt, config);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: true, outputPaths: output.outputPaths }));
    } catch (error: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: error?.message ?? String(error) }));
    }
  });
});

server.listen(port, () => {
  console.log(`generate api started at http://localhost:${port}`);
});

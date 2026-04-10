import type { AssetManifest, SceneSpec } from '../../../../packages/scene-schema/src';
import type { IntentAgent } from '../pipeline';

export interface OpenAICompatibleIntentAgentConfig {
  modelId: string;
  baseURL: string;
  apiKey: string;
  providerName?: string;
  systemPrompt?: string;
  createProvider?: (args: {
    name: string;
    baseURL: string;
    apiKey: string;
  }) => (modelId: string) => unknown;
  generateObject?: (args: {
    model: unknown;
    schema: unknown;
    prompt: string;
    system: string;
  }) => Promise<{ object: SceneSpec }>;
}

function buildIntentPrompt(userPrompt: string, assetManifest: AssetManifest): string {
  const placeableKinds = [...new Set(assetManifest.placeables.map((item) => item.kind))];
  const characterIds = assetManifest.characters.map((item) => item.id);
  const weatherKinds = [...new Set((assetManifest.weatherAssets ?? []).map((item) => item.kind))];

  return [
    '你是像素场景 Intent Agent。输出必须是单个 SceneSpec JSON 对象。',
    `用户需求: ${userPrompt}`,
    `项目ID: ${assetManifest.projectId}`,
    `tileSize: ${assetManifest.tileSize}`,
    `可用角色: ${characterIds.join(', ') || '无'}`,
    `可用对象种类: ${placeableKinds.join(', ') || '无'}`,
    `可用天气资源: ${weatherKinds.join(', ') || '无'}`,
    '必须满足: 至少2个 zone，至少1条 path，对象数量非负，mustBeWalkable=true。'
  ].join('\n');
}

async function loadDefaultProviderFactory(config: OpenAICompatibleIntentAgentConfig): Promise<(modelId: string) => unknown> {
  if (config.createProvider) {
    return config.createProvider({
      name: config.providerName ?? 'openaiCompatible',
      baseURL: config.baseURL,
      apiKey: config.apiKey
    });
  }

  const mod: any = await import('@ai-sdk/openai-compatible');

  return mod.createOpenAICompatible({
    name: config.providerName ?? 'openaiCompatible',
    baseURL: config.baseURL,
    apiKey: config.apiKey
  });
}

async function loadDefaultGenerateObject(config: OpenAICompatibleIntentAgentConfig): Promise<(args: {
    model: unknown;
    schema: unknown;
    prompt: string;
    system: string;
  }) => Promise<{ object: SceneSpec }>> {
  if (config.generateObject) return config.generateObject;

  const aiMod: any = await import('ai');

  return aiMod.generateObject;
}

async function loadSceneSpecSchema(): Promise<unknown> {
  const zod: any = await import('zod');
  return zod.z.object({
    sceneId: zod.z.string().min(1),
    theme: zod.z.string().min(1),
    tileSize: zod.z.number().int().min(8),
    mapSize: zod.z.object({
      width: zod.z.number().int().min(16),
      height: zod.z.number().int().min(16)
    }),
    player: zod.z.object({
      characterId: zod.z.string().min(1),
      spawnHint: zod.z.string().min(1),
      movement: zod.z.enum(['4dir', '8dir']),
      speed: zod.z.number().int().min(1).optional()
    }),
    camera: zod.z.object({
      followPlayer: zod.z.boolean(),
      zoom: zod.z.number().min(0.5).max(6),
      deadzone: zod.z.boolean().optional()
    }),
    weather: zod.z.object({
      type: zod.z.enum(['clear', 'rain', 'snow', 'fog']),
      intensity: zod.z.number(),
      wind: zod.z.number(),
      overlayAlpha: zod.z.number(),
      ambientTint: zod.z.string(),
      useSplash: zod.z.boolean(),
      fogDensity: zod.z.number().optional(),
      sfx: zod.z.string().optional()
    }),
    zones: zod.z.array(
      zod.z.object({
        id: zod.z.string(),
        kind: zod.z.string(),
        areaHint: zod.z.string(),
        size: zod.z.enum(['small', 'medium', 'large']).optional(),
        priority: zod.z.number().int().optional()
      })
    ).min(2),
    paths: zod.z.array(
      zod.z.object({
        id: zod.z.string(),
        kind: zod.z.enum(['line', 'fork', 'y-road', 'loop']),
        width: zod.z.number().int().min(1),
        anchor: zod.z.string(),
        connectZones: zod.z.array(zod.z.string()).optional()
      })
    ).min(1),
    objects: zod.z.array(
      zod.z.object({
        kind: zod.z.string(),
        count: zod.z.number().int().min(0),
        placement: zod.z.string(),
        orientation: zod.z.string().optional(),
        zoneId: zod.z.string().optional()
      })
    ),
    constraints: zod.z.object({
      mustBeWalkable: zod.z.literal(true),
      preserveOpenCenter: zod.z.boolean(),
      maxObjectDensity: zod.z.number().min(0).max(1).optional(),
      mustReachZones: zod.z.array(zod.z.string()).optional()
    })
  });
}

export function createOpenAICompatibleIntentAgent(config: OpenAICompatibleIntentAgentConfig): IntentAgent {
  return {
    async generateSceneSpec(input: { userPrompt: string; assetManifest: AssetManifest }): Promise<SceneSpec> {
      const modelFactory = await loadDefaultProviderFactory(config);
      const generateObject = await loadDefaultGenerateObject(config);
      const schema = await loadSceneSpecSchema();

      const response = await generateObject({
        model: modelFactory(config.modelId),
        schema,
        prompt: buildIntentPrompt(input.userPrompt, input.assetManifest),
        system: config.systemPrompt ?? '你必须只输出满足 schema 的 SceneSpec JSON，不要解释。'
      });

      return response.object;
    }
  };
}

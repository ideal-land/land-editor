import { analyzeAssets } from '../../../packages/asset-analyzer/src';
import { buildMap } from '../../../packages/map-builder/src';
import { validateScene } from '../../../packages/validator/src';
import type {
  AssetManifest,
  GenerationReport,
  LayoutPlan,
  SceneObjectRequest,
  SceneSpec,
  WeatherType
} from '../../../packages/scene-schema/src';

export interface PipelineInput {
  userPrompt: string;
  assetManifest: AssetManifest;
}

export interface PipelineOutput {
  sceneSpec: SceneSpec;
  layoutPlan: LayoutPlan;
  tiledMap: Record<string, unknown>;
  report: GenerationReport;
}

export interface IntentAgent {
  generateSceneSpec(input: {
    userPrompt: string;
    assetManifest: AssetManifest;
  }): Promise<SceneSpec>;
}

export interface RunPipelineFromAssetsInput {
  userPrompt: string;
  projectId: string;
  tileSize: number;
  assetRoot: string;
  intentAgent: IntentAgent;
}

export interface PipelineFromAssetsOutput extends PipelineOutput {
  assetManifest: AssetManifest;
}

function pickWeatherType(prompt: string): WeatherType {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('snow') || normalized.includes('下雪')) return 'snow';
  if (normalized.includes('fog') || normalized.includes('雾')) return 'fog';
  if (normalized.includes('rain') || normalized.includes('下雨')) return 'rain';
  return 'clear';
}

function normalizeWeatherWithAssets(assetManifest: AssetManifest, weatherType: WeatherType): { weatherType: WeatherType; warning?: string } {
  if (weatherType === 'clear') return { weatherType };
  const hasWeatherAsset = (assetManifest.weatherAssets ?? []).some((asset) => asset.kind === weatherType);

  if (hasWeatherAsset) return { weatherType };

  return {
    weatherType: 'clear',
    warning: `天气资源缺失：请求 ${weatherType}，已降级为 clear`
  };
}

function inferObjectRequests(assetManifest: AssetManifest): SceneObjectRequest[] {
  const grouped = new Map<string, number>();
  for (const placeable of assetManifest.placeables) {
    const current = grouped.get(placeable.kind) ?? 0;
    grouped.set(placeable.kind, current + 1);
  }

  if (grouped.size === 0) {
    return [
      {
        kind: 'decor',
        count: 12,
        placement: 'scatter'
      }
    ];
  }

  return [...grouped.keys()].slice(0, 3).map((kind, index) => ({
    kind,
    count: 6 + index * 4,
    placement: 'along-road'
  }));
}

function buildSceneSpec(userPrompt: string, assetManifest: AssetManifest): { sceneSpec: SceneSpec; warnings: string[] } {
  const weatherDecision = normalizeWeatherWithAssets(assetManifest, pickWeatherType(userPrompt));
  const fallbackCharacterId = assetManifest.characters[0]?.id ?? 'player_default';

  const sceneSpec: SceneSpec = {
    sceneId: `scene-${assetManifest.projectId}-${Date.now()}`,
    theme: userPrompt.trim() ? userPrompt.trim() : 'pixel scene',
    tileSize: assetManifest.tileSize,
    mapSize: {
      width: 120,
      height: 80
    },
    player: {
      characterId: fallbackCharacterId,
      spawnHint: 'road_near_center',
      movement: '4dir',
      speed: 120
    },
    camera: {
      followPlayer: true,
      zoom: 2,
      deadzone: false
    },
    weather: {
      type: weatherDecision.weatherType,
      intensity: weatherDecision.weatherType === 'clear' ? 0 : 0.3,
      wind: weatherDecision.weatherType === 'clear' ? 0 : 0.1,
      overlayAlpha: weatherDecision.weatherType === 'clear' ? 0 : 0.08,
      ambientTint: weatherDecision.weatherType === 'clear' ? '#FFFFFF' : '#90A0B8',
      useSplash: weatherDecision.weatherType === 'rain',
      fogDensity: weatherDecision.weatherType === 'fog' ? 0.2 : 0
    },
    zones: [
      { id: 'zone-center', kind: 'plaza', areaHint: 'center', size: 'medium', priority: 10 },
      { id: 'zone-top-left', kind: 'park', areaHint: 'top_left', size: 'large', priority: 8 },
      { id: 'zone-bottom-right', kind: 'service', areaHint: 'bottom_right', size: 'small', priority: 7 }
    ],
    paths: [
      {
        id: 'main-road',
        kind: 'line',
        width: 3,
        anchor: 'center',
        connectZones: ['zone-center', 'zone-top-left', 'zone-bottom-right']
      }
    ],
    objects: inferObjectRequests(assetManifest),
    constraints: {
      mustBeWalkable: true,
      preserveOpenCenter: true,
      maxObjectDensity: 0.32,
      mustReachZones: ['zone-center', 'zone-top-left', 'zone-bottom-right']
    }
  };

  const warnings = weatherDecision.warning ? [weatherDecision.warning] : [];
  return { sceneSpec, warnings };
}

function runBuildAndValidate(sceneSpec: SceneSpec, assetManifest: AssetManifest, sceneWarnings: string[]): PipelineOutput {
  const buildResult = buildMap({
    sceneSpec,
    assetManifest,
    rebuildScope: 'full'
  });

  const report = validateScene({
    sceneSpec,
    layoutPlan: buildResult.layoutPlan
  });

  const mergedWarnings = [...sceneWarnings, ...buildResult.warnings, ...(report.warnings ?? [])];
  const nextReport: GenerationReport = {
    ...report,
    warnings: mergedWarnings.length > 0 ? mergedWarnings : undefined
  };

  return {
    sceneSpec,
    layoutPlan: buildResult.layoutPlan,
    tiledMap: buildResult.tiledMap,
    report: nextReport
  };
}

/**
 * 规则实现版：无 LLM 依赖，可本地跑通。
 */
export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const { sceneSpec, warnings: sceneWarnings } = buildSceneSpec(input.userPrompt, input.assetManifest);
  return runBuildAndValidate(sceneSpec, input.assetManifest, sceneWarnings);
}

/**
 * 全链路入口：上传素材 -> 资产分析 -> 调用配置的 Intent Agent -> BuildMap -> Validate
 */
export async function runPipelineFromAssets(input: RunPipelineFromAssetsInput): Promise<PipelineFromAssetsOutput> {
  const analyzed = await analyzeAssets({
    projectId: input.projectId,
    tileSize: input.tileSize,
    assetRoot: input.assetRoot
  });

  if (analyzed.unresolved.length > 0) {
    throw new Error(`资产分析失败：${analyzed.unresolved.join('; ')}`);
  }

  const sceneSpec = await input.intentAgent.generateSceneSpec({
    userPrompt: input.userPrompt,
    assetManifest: analyzed.manifest
  });

  const pipelineOutput = runBuildAndValidate(sceneSpec, analyzed.manifest, analyzed.warnings);

  return {
    ...pipelineOutput,
    assetManifest: analyzed.manifest
  };
}

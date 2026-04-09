import type {
  AssetManifest,
  GenerationReport,
  LayoutPlan,
  SceneSpec
} from '../../../packages/scene-schema/src';

export interface PipelineInput {
  userPrompt: string;
  assetManifest: AssetManifest;
}

export interface PipelineOutput {
  sceneSpec: SceneSpec;
  layoutPlan: LayoutPlan;
  report: GenerationReport;
}

/**
 * 第一版建议把 pipeline 拆成显式阶段函数，
 * 而不是一坨“万能 agent 调用”。
 */
export async function runPipeline(_input: PipelineInput): Promise<PipelineOutput> {
  throw new Error('TODO: 接入 Intent Agent / Layout Agent / Map Builder / Validator');
}

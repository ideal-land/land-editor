import type { GenerationReport, LayoutPlan, SceneSpec } from '../../scene-schema/src';

export interface ValidateInput {
  sceneSpec: SceneSpec;
  layoutPlan: LayoutPlan;
}

export function validateScene(input: ValidateInput): GenerationReport {
  const checks = [];

  if (input.layoutPlan.navigation.spawnCandidates.length === 0) {
    checks.push({
      id: 'spawn-candidate',
      result: 'blocker' as const,
      message: '没有生成可用出生点'
    });
  } else {
    checks.push({
      id: 'spawn-candidate',
      result: 'pass' as const,
      message: '存在至少一个出生点'
    });
  }

  if (input.layoutPlan.pathSegments.length === 0) {
    checks.push({
      id: 'main-path',
      result: 'warning' as const,
      message: '未生成任何主路径'
    });
  }

  const blockers = checks.filter((c) => c.result === 'blocker').map((c) => c.message);
  const warnings = checks.filter((c) => c.result === 'warning').map((c) => c.message);

  return {
    runId: `run_${Date.now()}`,
    sceneId: input.sceneSpec.sceneId,
    status: blockers.length > 0 ? 'failed' : warnings.length > 0 ? 'warning' : 'success',
    summary: '基础校验完成',
    scores: {
      playability: blockers.length > 0 ? 0.4 : 0.9,
      layout: input.layoutPlan.zoneBounds.length > 0 ? 0.82 : 0.45,
      visualBalance: 0.7
    },
    checks,
    blockers,
    warnings,
    artifacts: []
  };
}

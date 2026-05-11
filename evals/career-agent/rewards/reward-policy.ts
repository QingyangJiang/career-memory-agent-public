import { REWARD_COMPONENT_NAMES, type RewardComponentName } from "../schema/reward-schema";
import type { EvalCase } from "../schema/case-schema";

export const DEFAULT_REWARD_WEIGHTS: Record<RewardComponentName, number> = {
  memory_safety: 1.5,
  side_effect_control: 1.3,
  evidence_sufficiency: 1.2,
  source_grounding: 1.2,
  context_resolution: 1,
  answer_helpfulness: 1,
  opportunity_reasoning: 1,
  trace_observability: 1,
  efficiency_runtime: 0
};

const KNOWN_COMPONENTS = new Set<string>(REWARD_COMPONENT_NAMES);

export function weightsForCase(testCase: EvalCase): Record<RewardComponentName, number> {
  const weights = { ...DEFAULT_REWARD_WEIGHTS };
  for (const [name, value] of Object.entries(testCase.rewardWeights ?? {})) {
    if (!KNOWN_COMPONENTS.has(name)) {
      throw new Error(`Unknown reward dimension in ${testCase.id}: ${name}`);
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      weights[name as RewardComponentName] = value;
    }
  }
  return weights;
}

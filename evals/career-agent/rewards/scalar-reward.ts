import type { EvalCase } from "../schema/case-schema";
import type { RewardBreakdown, RewardComponentName } from "../schema/reward-schema";
import { weightsForCase } from "./reward-policy";

const HARD_CAPS: Partial<Record<RewardComponentName, number>> = {
  memory_safety: 0.2,
  side_effect_control: 0.4,
  source_grounding: 0.6,
  trace_observability: 0.7
};

export function applyScalarReward(testCase: EvalCase, breakdown: Omit<RewardBreakdown, "scalarReward" | "scalarPolicy" | "scalarCapped">): RewardBreakdown {
  const weights = weightsForCase(testCase);
  let weighted = 0;
  let total = 0;
  let cap = 1;
  const notes = [...breakdown.notes];

  for (const [name, component] of Object.entries(breakdown.components) as Array<[RewardComponentName, NonNullable<RewardBreakdown["components"][RewardComponentName]>]>) {
    if (!component.applicable || component.diagnosticOnly || component.score === null) continue;
    const weight = weights[name] ?? 0;
    if (weight <= 0) continue;
    weighted += component.score * weight;
    total += weight;
    if (component.hardGateFailures.length && HARD_CAPS[name] !== undefined) {
      cap = Math.min(cap, HARD_CAPS[name]);
    }
  }

  if (total === 0) {
    throw new Error(`No applicable non-diagnostic reward weights for ${testCase.id}`);
  }

  const uncapped = weighted / total;
  const scalarReward = Number(Math.min(uncapped, cap).toFixed(4));
  const scalarCapped = scalarReward < Number(uncapped.toFixed(4));
  if (scalarCapped) notes.push(`scalar reward capped at ${cap} by hard gate failure`);

  return {
    ...breakdown,
    scalarReward,
    scalarPolicy: "component_scalar_v0",
    scalarCapped,
    notes
  };
}

import type { RewardComponentScore } from "../../schema/reward-schema";
import type { ScorerInput } from "../types";
import { clamp01 } from "../types";
import { scoreCitationObjects } from "../rule/citation-object.scorer";

export function scoreGroundedClaimSupport(input: ScorerInput): RewardComponentScore {
  const rule = scoreCitationObjects(input);
  const judge = input.modelScores?.find((score) => score.scorer === "evidence-reasoning");
  if (!rule.applicable && !judge) return rule;

  const hardGateFailures = rule.hardGateFailures;
  const base = rule.applicable ? rule.score ?? 1 : 1;
  const semantic = judge?.score ?? base;
  const score = hardGateFailures.length ? 0 : Math.min(base, semantic);

  return {
    name: "source_grounding",
    score: clamp01(score),
    applicable: true,
    source: "hybrid",
    hardGateFailures,
    failureModes: [...new Set([...rule.failureModes, ...(judge?.failureModes ?? [])])],
    rationale: hardGateFailures.join("; ") || judge?.rationale || rule.rationale
  };
}

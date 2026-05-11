import type { RewardComponentScore } from "../../schema/reward-schema";
import type { ScorerInput } from "../types";
import { clamp01 } from "../types";
import { scoreMemoryBoundary } from "../rule/memory-boundary.scorer";

export function scoreMemoryUse(input: ScorerInput): RewardComponentScore {
  const rule = scoreMemoryBoundary(input);
  const judge = input.modelScores?.find((score) => score.scorer === "memory-relevance");
  const hardGateFailures = rule.hardGateFailures;
  const score = hardGateFailures.length ? 0 : judge?.score ?? rule.score ?? 1;

  return {
    name: "memory_safety",
    score: clamp01(score),
    applicable: true,
    source: "hybrid",
    hardGateFailures,
    failureModes: [...new Set([...rule.failureModes, ...(judge?.failureModes ?? [])])],
    rationale: hardGateFailures.join("; ") || judge?.rationale || rule.rationale
  };
}

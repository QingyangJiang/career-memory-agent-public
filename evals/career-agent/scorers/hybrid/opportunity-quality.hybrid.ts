import type { RewardComponentScore } from "../../schema/reward-schema";
import type { ScorerInput } from "../types";
import { clamp01 } from "../types";

export function scoreOpportunityQuality(input: ScorerInput): RewardComponentScore {
  const failures: string[] = [];
  const modes: string[] = [];
  const policy = input.testCase.sideEffectPolicy;
  const createdOpportunity = input.observation.turns.some((turn) => turn.createdOpportunity);
  const createdEvidence = input.observation.turns.some((turn) => turn.createdEvidence);
  const evidenceJudge = input.modelScores?.find((score) => score.scorer === "evidence-reasoning");

  if ((policy === "create_light_opportunity" || policy === "create_full_opportunity") && !createdOpportunity) {
    failures.push(`policy=${policy} expected Opportunity creation`);
    modes.push("missing_expected_opportunity");
  }
  if ((policy === "create_light_opportunity" || policy === "create_full_opportunity") && !createdEvidence) {
    failures.push(`policy=${policy} expected Evidence creation`);
    modes.push("missing_expected_evidence");
  }
  if ((policy === "none" || policy === "suggest_memory") && createdOpportunity) {
    failures.push(`policy=${policy} did not allow Opportunity creation`);
    modes.push("unexpected_opportunity");
  }

  const applicable = Boolean(policy?.includes("opportunity") || createdOpportunity || input.testCase.rewardTargets?.includes("opportunity_reasoning"));
  const semantic = evidenceJudge?.score ?? 0.75;
  return {
    name: "opportunity_reasoning",
    score: applicable ? clamp01(failures.length ? 0 : semantic) : null,
    applicable,
    source: applicable ? "hybrid" : "not_applicable",
    hardGateFailures: failures,
    failureModes: [...new Set([...modes, ...(evidenceJudge?.failureModes ?? [])])],
    rationale: failures.join("; ") || evidenceJudge?.rationale || "Opportunity policy and reasoning diagnostics held."
  };
}

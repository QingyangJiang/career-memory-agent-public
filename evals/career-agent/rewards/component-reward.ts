import type { EvalCase } from "../schema/case-schema";
import type { CaseObservation } from "../schema/observation-schema";
import type { EvalExpectations, ModelJudgeScore } from "../schema/judgement-schema";
import type { RewardBreakdown, RewardComponentScore } from "../schema/reward-schema";
import { scoreCitationObjects } from "../scorers/rule/citation-object.scorer";
import { scoreRuntime } from "../scorers/rule/runtime.scorer";
import { scoreSideEffects } from "../scorers/rule/side-effect.scorer";
import { scoreTraceObservability } from "../scorers/rule/trace-observability.scorer";
import { scoreEvidenceSufficiency } from "../scorers/hybrid/evidence-sufficiency.hybrid";
import { scoreGroundedClaimSupport } from "../scorers/hybrid/grounded-claim-support.hybrid";
import { scoreMemoryUse } from "../scorers/hybrid/memory-use.hybrid";
import { scoreOpportunityQuality } from "../scorers/hybrid/opportunity-quality.hybrid";
import { clamp01, type ScorerInput } from "../scorers/types";
import { applyScalarReward } from "./scalar-reward";

function modelComponent(name: RewardComponentScore["name"], scorer: string, scores: ModelJudgeScore[] | undefined): RewardComponentScore {
  const judge = scores?.find((item) => item.scorer === scorer);
  if (!judge) {
    return {
      name,
      score: null,
      applicable: false,
      source: "not_applicable",
      hardGateFailures: [],
      failureModes: [],
      rationale: "model judge not executed"
    };
  }
  return {
    name,
    score: clamp01(judge.score),
    applicable: true,
    source: "model",
    hardGateFailures: [],
    failureModes: judge.failureModes,
    rationale: judge.rationale
  };
}

function contextResolution(input: ScorerInput): RewardComponentScore {
  const needsContext = Boolean(input.expectations.mustUseConversationContext || input.testCase.rewardTargets?.includes("context_resolution"));
  const judge = input.modelScores?.find((item) => item.scorer === "context-use");
  const failures: string[] = [];
  const modes: string[] = [];
  if (input.expectations.mustUseConversationContext) {
    const used = input.observation.turns.some((turn) => turn.usedLastAssistantAnswer && (turn.usedRecentMessagesCount ?? 0) >= 2);
    if (!used) {
      failures.push("required conversation context was not observed");
      modes.push("context_not_used");
    }
  }
  if (!needsContext && !judge) {
    return {
      name: "context_resolution",
      score: null,
      applicable: false,
      source: "not_applicable",
      hardGateFailures: [],
      failureModes: [],
      rationale: "case does not target follow-up/context resolution"
    };
  }
  return {
    name: "context_resolution",
    score: clamp01(failures.length ? 0 : judge?.score ?? 0.8),
    applicable: true,
    source: judge ? "hybrid" : "rule",
    hardGateFailures: failures,
    failureModes: [...new Set([...modes, ...(judge?.failureModes ?? [])])],
    rationale: failures.join("; ") || judge?.rationale || "Context metadata matched expectations."
  };
}

export function buildRewardBreakdown(
  testCase: EvalCase,
  observation: CaseObservation,
  expectations: EvalExpectations,
  modelScores?: ModelJudgeScore[]
): RewardBreakdown {
  const input: ScorerInput = { testCase, observation, expectations, modelScores };
  const sourceGrounding = scoreGroundedClaimSupport(input);
  const components: RewardBreakdown["components"] = {
    memory_safety: scoreMemoryUse(input),
    side_effect_control: scoreSideEffects(input),
    evidence_sufficiency: scoreEvidenceSufficiency(input),
    source_grounding: sourceGrounding.applicable ? sourceGrounding : scoreCitationObjects(input),
    context_resolution: contextResolution(input),
    answer_helpfulness: modelComponent("answer_helpfulness", "answer-helpfulness", modelScores),
    opportunity_reasoning: scoreOpportunityQuality(input),
    trace_observability: scoreTraceObservability(input),
    efficiency_runtime: scoreRuntime(input)
  };
  const hardGatePassed = Object.values(components).every((component) => !component?.hardGateFailures.length);
  const notes = [
    modelScores?.length ? "model judge scores included" : "model judge not measured; semantic components may be not_applicable or heuristic defaults",
    testCase.diagnosticOnly ? "case is diagnosticOnly" : "",
    testCase.demoOnly ? "case is demoOnly" : ""
  ].filter(Boolean);

  return applyScalarReward(testCase, {
    components,
    hardGatePassed,
    notes
  });
}

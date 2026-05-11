import type { EvalCase } from "../schema/case-schema";
import type { CaseObservation } from "../schema/observation-schema";
import type { EvalExpectations, ModelJudgeScore } from "../schema/judgement-schema";
import type { RewardComponentScore } from "../schema/reward-schema";

export interface ScorerInput {
  testCase: EvalCase;
  observation: CaseObservation;
  expectations: EvalExpectations;
  modelScores?: ModelJudgeScore[];
}

export function noScore(
  name: RewardComponentScore["name"],
  rationale = "not applicable"
): RewardComponentScore {
  return {
    name,
    score: null,
    applicable: false,
    source: "not_applicable",
    hardGateFailures: [],
    failureModes: [],
    rationale
  };
}

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

export function allTurns(input: ScorerInput) {
  return input.observation.turns;
}

export function finalTurn(input: ScorerInput) {
  return input.observation.turns.at(-1);
}

export function hasCreatedStructuredObject(input: ScorerInput) {
  return input.observation.turns.some(
    (turn) => turn.createdEvidence || turn.createdOpportunity || turn.createdDecision
  );
}

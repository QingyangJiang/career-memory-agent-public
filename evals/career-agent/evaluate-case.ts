import { judgeCase as legacyJudgeCase } from "./legacy-judge";
import type { EvalCase } from "./schema/case-schema";
import type { CaseObservation } from "./schema/observation-schema";
import type { EvalExpectations, JudgeResult, ModelJudgeScore } from "./schema/judgement-schema";
import { buildRewardBreakdown } from "./rewards/component-reward";
import { judgeAnswerHelpfulness } from "./scorers/judge/answer-helpfulness.judge";
import { judgeContextUse } from "./scorers/judge/context-use.judge";
import { judgeEvidenceReasoning } from "./scorers/judge/evidence-reasoning.judge";
import { getJudgeConfig } from "./scorers/judge/judge-provider";
import { judgeMemoryRelevance } from "./scorers/judge/memory-relevance.judge";
import { judgeMissingInfoQuality } from "./scorers/judge/missing-info-quality.judge";
import { createMockJudge } from "./scorers/judge/mock-judge";

function compatibilityCase(observation: CaseObservation, expectations: EvalExpectations): EvalCase {
  return {
    id: observation.id,
    title: observation.title,
    provider: observation.provider === "mock" ? "mock-smoke" : "deepseek-flash",
    turns: observation.turns.map((turn) => ({ user: turn.user })),
    expectations
  };
}

export function judgeCase(observation: CaseObservation, expectations: EvalExpectations): JudgeResult {
  const base = legacyJudgeCase(observation as never, expectations as never) as JudgeResult;
  const testCase = compatibilityCase(observation, expectations);
  return {
    ...base,
    rewardBreakdown: buildRewardBreakdown(testCase, observation, expectations),
    judgeProvider: "skipped",
    judgeSkippedReason: "judge not enabled"
  };
}

async function runModelJudges(testCase: EvalCase, observation: CaseObservation): Promise<{
  scores: ModelJudgeScore[];
  provider: string;
  skippedReason?: string;
}> {
  const config = getJudgeConfig();
  if (!config.enabled) {
    return { scores: [], provider: config.provider, skippedReason: config.skippedReason };
  }
  if (config.provider !== "mock") {
    return {
      scores: [],
      provider: "skipped",
      skippedReason: "only mock judge is implemented locally; real judge providers are intentionally opt-in and not called from CI"
    };
  }

  const provider = createMockJudge(config.model);
  try {
    const scores = await Promise.all([
      judgeAnswerHelpfulness(provider, testCase, observation),
      judgeContextUse(provider, testCase, observation),
      judgeMissingInfoQuality(provider, testCase, observation),
      judgeEvidenceReasoning(provider, testCase, observation),
      judgeMemoryRelevance(provider, testCase, observation)
    ]);
    return { scores, provider: `${provider.name}/${provider.model}` };
  } catch (error) {
    return {
      scores: [],
      provider: "skipped",
      skippedReason: `judge failed without failing CI: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export async function evaluateCase(testCase: EvalCase, observation: CaseObservation): Promise<JudgeResult> {
  const base = legacyJudgeCase(observation as never, testCase.expectations as never) as JudgeResult;
  const judge = await runModelJudges(testCase, observation);
  const rewardBreakdown = buildRewardBreakdown(testCase, observation, testCase.expectations, judge.scores);
  const taxonomy = new Set(base.errorTaxonomy);
  for (const component of Object.values(rewardBreakdown.components)) {
    for (const mode of component?.failureModes ?? []) {
      if (mode.includes("memory")) taxonomy.add("ERROR_MEMORY_POLLUTION");
      if (mode.includes("opportunity") || mode.includes("side_effect") || mode.includes("over_creation")) taxonomy.add("ERROR_OVER_AUTOMATION");
      if (mode.includes("citation") || mode.includes("grounding")) taxonomy.add("ERROR_CITATION_MISMATCH");
      if (mode.includes("context")) taxonomy.add("ERROR_CONTEXT_MISMATCH");
      if (mode.includes("runtime") || mode.includes("latency") || mode.includes("provider")) taxonomy.add("ERROR_RUNTIME_TIMEOUT");
      if (mode.includes("agent_run") || mode.includes("agent_steps")) taxonomy.add("ERROR_TRACE_MISSING");
    }
  }
  return {
    ...base,
    passed: base.passed && rewardBreakdown.hardGatePassed,
    errorTaxonomy: [...taxonomy],
    rewardBreakdown,
    modelJudgeScores: judge.scores,
    judgeProvider: judge.provider,
    judgeSkippedReason: judge.skippedReason
  };
}

export type { EvalCase } from "./schema/case-schema";
export type { CaseObservation, CitationRefObservation, TurnObservation } from "./schema/observation-schema";
export type { ErrorTaxonomy, EvalExpectations, JudgeResult, ModelJudgeScore } from "./schema/judgement-schema";

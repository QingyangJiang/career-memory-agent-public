import type { EvalCase } from "../../schema/case-schema";
import type { CaseObservation } from "../../schema/observation-schema";
import type { ModelJudgeScore } from "../../schema/judgement-schema";

export interface JudgeProvider {
  name: string;
  model: string;
  score(input: JudgeScorerInput): Promise<ModelJudgeScore>;
}

export interface JudgeScorerInput {
  scorer: string;
  testCase: EvalCase;
  observation: CaseObservation;
  rubric: string[];
}

export interface JudgeConfig {
  enabled: boolean;
  provider: string;
  model: string;
  skippedReason?: string;
}

export function getJudgeConfig(): JudgeConfig {
  const enabled = process.env.EVAL_ENABLE_JUDGE === "1" || process.env.EVAL_ENABLE_JUDGE === "true";
  if (!enabled) {
    return {
      enabled: false,
      provider: "skipped",
      model: "none",
      skippedReason: "judge not enabled"
    };
  }

  const provider = process.env.JUDGE_PROVIDER?.trim() || "mock";
  if (provider !== "mock" && !process.env.JUDGE_API_KEY?.trim()) {
    return {
      enabled: false,
      provider: "skipped",
      model: "none",
      skippedReason: "JUDGE_API_KEY is not configured"
    };
  }

  return {
    enabled: true,
    provider,
    model: process.env.JUDGE_MODEL?.trim() || (provider === "mock" ? "mock-judge-v0" : "external-json-judge")
  };
}

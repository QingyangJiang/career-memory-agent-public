import type { EvalCase } from "../../schema/case-schema";
import type { CaseObservation } from "../../schema/observation-schema";
import type { ModelJudgeScore } from "../../schema/judgement-schema";
import type { JudgeProvider } from "./judge-provider";

export function judgeContextUse(provider: JudgeProvider, testCase: EvalCase, observation: CaseObservation): Promise<ModelJudgeScore> {
  return provider.score({
    scorer: "context-use",
    testCase,
    observation,
    rubric: ["uses relevant prior context", "resolves pronoun or ellipsis", "avoids irrelevant old context", "answers current follow-up"]
  });
}

import type { EvalCase } from "../../schema/case-schema";
import type { CaseObservation } from "../../schema/observation-schema";
import type { ModelJudgeScore } from "../../schema/judgement-schema";
import type { JudgeProvider } from "./judge-provider";

export function judgeAnswerHelpfulness(provider: JudgeProvider, testCase: EvalCase, observation: CaseObservation): Promise<ModelJudgeScore> {
  return provider.score({
    scorer: "answer-helpfulness",
    testCase,
    observation,
    rubric: ["specificity", "actionability", "clarity", "avoids generic advice", "fits user ask"]
  });
}

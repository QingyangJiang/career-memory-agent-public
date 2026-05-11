import type { EvalCase } from "../../schema/case-schema";
import type { CaseObservation } from "../../schema/observation-schema";
import type { ModelJudgeScore } from "../../schema/judgement-schema";
import type { JudgeProvider } from "./judge-provider";

export function judgeEvidenceReasoning(provider: JudgeProvider, testCase: EvalCase, observation: CaseObservation): Promise<ModelJudgeScore> {
  return provider.score({
    scorer: "evidence-reasoning",
    testCase,
    observation,
    rubric: ["claims supported by evidence", "no invented JD details", "risks and open questions come from source material", "no overconfident conclusion"]
  });
}

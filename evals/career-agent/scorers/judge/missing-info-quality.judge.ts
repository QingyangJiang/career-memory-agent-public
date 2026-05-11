import type { EvalCase } from "../../schema/case-schema";
import type { CaseObservation } from "../../schema/observation-schema";
import type { ModelJudgeScore } from "../../schema/judgement-schema";
import type { JudgeProvider } from "./judge-provider";

export function judgeMissingInfoQuality(provider: JudgeProvider, testCase: EvalCase, observation: CaseObservation): Promise<ModelJudgeScore> {
  return provider.score({
    scorer: "missing-info-quality",
    testCase,
    observation,
    rubric: ["asks necessary missing info", "does not over-ask", "does not invent missing evidence", "prioritizes important missing fields"]
  });
}

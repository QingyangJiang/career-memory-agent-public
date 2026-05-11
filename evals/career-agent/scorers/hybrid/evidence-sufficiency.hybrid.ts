import type { RewardComponentScore } from "../../schema/reward-schema";
import type { ScorerInput } from "../types";
import { clamp01, hasCreatedStructuredObject } from "../types";

function modelScore(input: ScorerInput, scorer: string) {
  return input.modelScores?.find((score) => score.scorer === scorer);
}

export function scoreEvidenceSufficiency(input: ScorerInput): RewardComponentScore {
  const failures: string[] = [];
  const modes: string[] = [];
  const created = hasCreatedStructuredObject(input);
  const sufficiency = input.testCase.evidenceSufficiency ?? "unknown";
  const evidenceJudge = modelScore(input, "evidence-reasoning");
  const missingInfoJudge = modelScore(input, "missing-info-quality");

  if ((sufficiency === "weak" || sufficiency === "none") && created) {
    failures.push(`case evidenceSufficiency=${sufficiency} but structured object was created`);
    modes.push("weak_evidence_over_creation");
  }

  const semantic = evidenceJudge?.score ?? missingInfoJudge?.score ?? 0.75;
  const score = failures.length ? 0 : semantic;
  return {
    name: "evidence_sufficiency",
    score: clamp01(score),
    applicable: true,
    source: "hybrid",
    hardGateFailures: failures,
    failureModes: [...new Set([...modes, ...(evidenceJudge?.failureModes ?? []), ...(missingInfoJudge?.failureModes ?? [])])],
    rationale: failures.join("; ") || evidenceJudge?.rationale || missingInfoJudge?.rationale || `Evidence sufficiency label=${sufficiency}.`
  };
}

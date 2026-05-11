import type { RewardComponentScore } from "../../schema/reward-schema";
import type { ScorerInput } from "../types";
import { allTurns, clamp01 } from "../types";

function citedIds(input: ScorerInput, entityType: string) {
  return new Set(
    allTurns(input).flatMap((turn) =>
      turn.citationRefs.filter((ref) => ref.entityType === entityType).map((ref) => ref.entityId)
    )
  );
}

export function scoreCitationObjects(input: ScorerInput): RewardComponentScore {
  const expectations = input.expectations;
  const hardGateFailures: string[] = [];
  const failureModes: string[] = [];
  const memoryIds = citedIds(input, "memory");
  const evidenceIds = citedIds(input, "evidence");

  for (const id of expectations.mustCiteMemoryIds ?? []) {
    if (!memoryIds.has(id)) {
      hardGateFailures.push(`missing required Memory citation ${id}`);
      failureModes.push("missing_required_memory_citation");
    }
  }
  for (const id of expectations.mustCiteEvidenceIds ?? []) {
    if (!evidenceIds.has(id)) {
      hardGateFailures.push(`missing required Evidence citation ${id}`);
      failureModes.push("missing_required_evidence_citation");
    }
  }
  for (const id of expectations.mustNotCiteMemoryIds ?? []) {
    if (memoryIds.has(id)) {
      hardGateFailures.push(`forbidden Memory citation ${id}`);
      failureModes.push("forbidden_memory_citation");
    }
  }
  if (expectations.mustCiteMemoryType) {
    const hasType = allTurns(input).some((turn) =>
      turn.citationRefs.some((ref) => ref.entityType === "memory" && ref.memoryType === expectations.mustCiteMemoryType)
    );
    if (!hasType) {
      hardGateFailures.push(`missing Memory citation type ${expectations.mustCiteMemoryType}`);
      failureModes.push("missing_required_memory_type");
    }
  }

  const legacyDiagnostics: string[] = [];
  if (expectations.mustCiteAny?.length) legacyDiagnostics.push("legacy mustCiteAny string check remains diagnostic");
  if (expectations.mustPreferLatestMemory) legacyDiagnostics.push("mustPreferLatestMemory is diagnostic until stable version/updatedAt observations exist");

  const applicable = Boolean(
    expectations.mustCiteMemoryIds?.length ||
      expectations.mustCiteEvidenceIds?.length ||
      expectations.mustNotCiteMemoryIds?.length ||
      expectations.mustCiteMemoryType ||
      expectations.mustCiteAny?.length ||
      expectations.mustPreferLatestMemory
  );

  return {
    name: "source_grounding",
    score: applicable ? clamp01(hardGateFailures.length ? 0 : 1) : null,
    applicable,
    source: applicable ? "rule" : "not_applicable",
    hardGateFailures,
    failureModes: [...new Set(failureModes)],
    rationale: hardGateFailures.length ? hardGateFailures.join("; ") : legacyDiagnostics.join("; ") || "Source-object citation requirements held."
  };
}

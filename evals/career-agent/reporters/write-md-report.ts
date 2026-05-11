import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { REWARD_COMPONENT_NAMES } from "../schema/reward-schema";

function formatMeasured(value: unknown, digits = 3) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "not measured";
}

export function writeMdReport(payload: any, path = "evals/career-agent/report.md") {
  const lines: string[] = [];
  lines.push("# Career Agent Eval Report", "");
  lines.push(`- provider/model: ${payload.provider}/${payload.model}`);
  lines.push(`- total cases: ${payload.summary.totalCases}`);
  lines.push(`- passed cases: ${payload.summary.passedCases}`);
  lines.push(`- failed cases: ${payload.summary.failedCases}`);
  lines.push(`- hard_gate_pass_rate: ${(payload.summary.hardPassRate * 100).toFixed(1)}%`);
  lines.push(`- model_judge_mean_score: ${formatMeasured(payload.rewardSummary.modelJudgeMeanScore)}`);
  lines.push(`- hybrid_reward_mean: ${formatMeasured(payload.rewardSummary.hybridRewardMean)}`);
  lines.push(`- runtime_failure_rate: ${(payload.rewardSummary.runtimeFailureRate * 100).toFixed(1)}%`);
  lines.push(`- stop reason: ${payload.stopReason}`, "");

  lines.push("## Reward Summary", "");
  lines.push("| Component | Mean reward | Applicable | Hard gate failures |");
  lines.push("|---|---:|---:|---:|");
  for (const name of REWARD_COMPONENT_NAMES) {
    const item = payload.rewardSummary.components[name] ?? {};
    lines.push(`| ${name} | ${formatMeasured(item.mean)} | ${item.applicableCount ?? 0} | ${item.hardGateFailureCount ?? 0} |`);
  }
  lines.push("");
  lines.push(`- memory_safety_violation_count: ${payload.rewardSummary.memorySafetyViolationCount}`);
  lines.push(`- weak_evidence_over_creation_count: ${payload.rewardSummary.weakEvidenceOverCreationCount}`);
  lines.push(`- grounding_failure_count: ${payload.rewardSummary.groundingFailureCount}`);
  lines.push(`- context_resolution_failure_count: ${payload.rewardSummary.contextResolutionFailureCount}`);
  lines.push(`- diagnostic-only runtime stats: avg=${payload.summary.avgLatencyMs}ms, p95=${payload.summary.p95LatencyMs}ms, timeout=${payload.summary.timeoutCount}`, "");

  lines.push("## Scorer Summary", "");
  lines.push(`- rule scorer failures: ${payload.scorerSummary.ruleFailureCount}`);
  lines.push(`- model judge executed: ${payload.scorerSummary.modelJudgeExecutedCount}`);
  lines.push(`- model judge skipped: ${payload.scorerSummary.modelJudgeSkippedCount}`);
  lines.push(`- judge provider/model: ${payload.scorerSummary.judgeProvider}`);
  if (payload.scorerSummary.judgeSkippedReason) lines.push(`- reason: ${payload.scorerSummary.judgeSkippedReason}`);
  lines.push(`- target provider/model: ${payload.provider}/${payload.model}`, "");

  lines.push("## Coverage Matrix Summary", "");
  lines.push(`- all reward dimensions have non-demo coverage: ${payload.coverageSummary.allRewardDimensionsCoveredByNonDemoCase}`);
  lines.push(`- CI coverage: ${payload.coverageSummary.ciCoveredDimensions.join(", ") || "none"}`);
  lines.push(`- offline judge coverage: ${payload.coverageSummary.offlineJudgeCoveredDimensions.join(", ") || "none"}`);
  lines.push(`- RL curriculum coverage: ${payload.coverageSummary.rlCoveredDimensions.join(", ") || "none"}`, "");

  lines.push("## Failure Taxonomy", "");
  for (const [name, count] of Object.entries(payload.failureTaxonomySummary ?? {})) {
    lines.push(`- ${name}: ${count}`);
  }
  if (!Object.keys(payload.failureTaxonomySummary ?? {}).length) lines.push("- none");
  lines.push("");

  lines.push("## Cases", "");
  for (const item of payload.results) {
    const reward = item.judgement.rewardBreakdown;
    lines.push(`### ${item.case.id}: ${item.case.title}`);
    lines.push(`- pass/fail: ${item.judgement.passed ? "PASS" : "FAIL"}`);
    lines.push(`- scalar_reward: ${formatMeasured(reward?.scalarReward)}`);
    lines.push(`- hard_gate_passed: ${reward?.hardGatePassed ?? "unknown"}`);
    lines.push(`- error taxonomy: ${item.judgement.errorTaxonomy.join(", ") || "none"}`);
    lines.push(`- suggested fix: ${item.judgement.suggestedFixes.join(" | ") || "none"}`);
    lines.push("- turns:");
    for (const turn of item.observation.turns) {
      lines.push(`  - user: ${turn.user}`);
      lines.push(`    assistant summary: ${turn.assistant.slice(0, 220).replace(/\n/g, " ")}${turn.assistant.length > 220 ? "..." : ""}`);
      lines.push(`    created: evidence=${turn.createdEvidence}, opportunity=${turn.createdOpportunity}, decision=${turn.createdDecision}, memorySuggestions=${turn.memorySuggestionsCount}, risks=${turn.risksCount}, openQuestions=${turn.openQuestionsCount}`);
      lines.push(`    trace: agentRun=${turn.agentRunId ?? "missing"}, steps=${turn.agentStepsCount}, actionLevel=${turn.actionLevel}, evidence=${turn.evidenceSufficiency}`);
      if (turn.citationTitles.length || turn.contextRefTitles.length) lines.push(`    citations/context: ${[...turn.citationTitles, ...turn.contextRefTitles].join(", ")}`);
    }
    const failed = item.judgement.hardAssertions.filter((assertion: any) => !assertion.passed);
    lines.push(`- hard assertion failures: ${failed.map((assertion: any) => `${assertion.name} (${assertion.detail})`).join("; ") || "none"}`, "");
  }
  lines.push("## Before / After", "");
  lines.push("Initial run is the baseline for this harness. Future runs can compare against files in `evals/career-agent/history/`.");
  lines.push("");
  writeFileSync(resolve(path), lines.join("\n"));
}

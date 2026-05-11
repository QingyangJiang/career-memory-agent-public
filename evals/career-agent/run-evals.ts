import { loadEnvConfig } from "@next/env";
import { existsSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { evaluateCase, type CaseObservation, type TurnObservation } from "./judge";
import type { EvalCase } from "./schema/case-schema";
import { EVAL_CONFIG, providerConfigFor, type EvalProviderConfig } from "./config/providers";
import { EVAL_SUITES, MOCK_SMOKE_CASE_ORDER, MOCK_SMOKE_EXCLUDED_CASE_REASONS, suiteNames, type EvalSuite } from "./config/suites";
import { coverageSummary } from "./reporters/coverage-matrix";
import { writeJsonReport } from "./reporters/write-json-report";
import { writeMdReport } from "./reporters/write-md-report";
import { REWARD_COMPONENT_NAMES, type RewardComponentName } from "./schema/reward-schema";

export { EVAL_CONFIG };
export type { EvalCase, EvalProviderConfig };

interface CliOptions {
  provider: "deepseek-flash" | "mock-smoke";
  suite?: EvalSuite;
  caseId?: string;
  maxCases?: number;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const get = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
  const provider = (get("provider") ?? "deepseek-flash") as CliOptions["provider"];
  const suite = get("suite") as EvalSuite | undefined;
  if (provider !== "deepseek-flash" && provider !== "mock-smoke") {
    throw new Error(`Unsupported provider ${provider}. Use deepseek-flash or mock-smoke.`);
  }
  if (suite && !Object.hasOwn(EVAL_SUITES, suite)) {
    throw new Error(`Unsupported suite ${suite}. Use ${suiteNames().join(", ")}.`);
  }
  return {
    provider,
    suite,
    caseId: get("case"),
    maxCases: get("maxCases") ? Number(get("maxCases")) : undefined
  };
}

function toMockSmokeCase(testCase: EvalCase): EvalCase | null {
  if (!MOCK_SMOKE_CASE_ORDER.includes(testCase.id as (typeof MOCK_SMOKE_CASE_ORDER)[number])) {
    return null;
  }
  if (testCase.id in MOCK_SMOKE_EXCLUDED_CASE_REASONS) {
    return null;
  }

  const base: EvalCase = {
    ...testCase,
    provider: "mock-smoke"
  };

  if (testCase.id === "explicit_memory_update") {
    return {
      ...base,
      expectations: {
        ...testCase.expectations,
        expectedActionLevel: ["suggest_memory_candidate"],
        expectedEvidenceSufficiency: ["none"],
        shouldCreateEvidence: false,
        shouldCreateOpportunity: false,
        shouldCreateDecision: false,
        minMemorySuggestions: 1,
        maxMemorySuggestions: 2,
        maxRisks: 0,
        maxOpenQuestions: 0
      }
    };
  }

  if (testCase.id === "temporary_thought_not_memory") {
    return {
      ...base,
      expectations: {
        ...testCase.expectations,
        shouldCreateEvidence: false,
        shouldCreateOpportunity: false,
        shouldCreateDecision: false,
        maxMemorySuggestions: 0,
        maxRisks: 0,
        maxOpenQuestions: 0
      }
    };
  }

  if (testCase.id === "weak_jd_should_not_create_objects") {
    return {
      ...base,
      expectations: {
        ...testCase.expectations,
        shouldCreateEvidence: false,
        shouldCreateOpportunity: false,
        shouldCreateDecision: false,
        maxMemorySuggestions: 0,
        maxRisks: 0,
        maxOpenQuestions: 0,
        maxPendingActions: 0
      }
    };
  }

  if (testCase.id === "ordinary_chat_no_objects" || testCase.id === "needs_external_source") {
    return {
      ...base,
      expectations: {
        ...testCase.expectations,
        shouldCreateEvidence: false,
        shouldCreateOpportunity: false,
        shouldCreateDecision: false,
        maxMemorySuggestions: 0,
        maxRisks: 0,
        maxOpenQuestions: 0
      }
    };
  }

  return base;
}

export function loadCases(options: CliOptions): EvalCase[] {
  const casesDir = resolve("evals/career-agent/cases");
  const all = readdirSync(casesDir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => JSON.parse(require("node:fs").readFileSync(join(casesDir, file), "utf8")) as EvalCase);
  const suiteIds = options.suite ? new Set(EVAL_SUITES[options.suite]) : undefined;
  const filtered = all.filter((item) => (options.caseId ? item.id === options.caseId : true)).filter((item) => (suiteIds ? suiteIds.has(item.id) : true));
  const providerCases =
    options.provider === "mock-smoke"
      ? (options.suite ? EVAL_SUITES[options.suite] : [...MOCK_SMOKE_CASE_ORDER]).flatMap((id) => {
          const testCase = filtered.find((item) => item.id === id);
          const smokeCase = testCase ? toMockSmokeCase(testCase) : null;
          return smokeCase ? [smokeCase] : [];
        })
      : filtered.filter((item) => item.provider === "deepseek-flash");
  return typeof options.maxCases === "number" ? providerCases.slice(0, options.maxCases) : providerCases;
}

export function prepareEvalDb() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const historyDir = resolve("evals/career-agent/history");
  mkdirSync(historyDir, { recursive: true });
  const dbPath = join(historyDir, `eval-${stamp}.db`);
  const source = resolve("prisma/dev.db");
  if (existsSync(source)) copyFileSync(source, dbPath);
  process.env.DATABASE_URL = `file:../evals/career-agent/history/${dbPath.split("/").pop()}`;
  return dbPath;
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function countPending(metadata: any) {
  const created = metadata?.createdObjects ?? {};
  return (created.memorySuggestionsCount ?? 0) + (created.risksCount ?? 0) + (created.openQuestionsCount ?? 0);
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isString(value: string | undefined): value is string {
  return typeof value === "string";
}

function inferMemoryType(summary: unknown) {
  const text = stringValue(summary);
  const prefix = text?.split(":").at(0)?.trim();
  return prefix && /^[A-Za-z]+$/.test(prefix) ? prefix : undefined;
}

function citationRefObservation(source: "citation" | "context", item: any) {
  const entityType = stringValue(item.entityType) ?? stringValue(item.kind);
  const entityId = stringValue(item.entityId) ?? stringValue(item.id);
  if (!entityType || !entityId) return null;
  return {
    source,
    entityType,
    entityId,
    title: stringValue(item.title),
    memoryType: entityType === "memory" ? inferMemoryType(item.summary) : undefined
  };
}

function isCitationRefObservation(item: ReturnType<typeof citationRefObservation>): item is NonNullable<ReturnType<typeof citationRefObservation>> {
  return item !== null;
}

async function observeCase(testCase: EvalCase, providerConfig: EvalProviderConfig): Promise<CaseObservation> {
  const { sendMessage } = await import("../../lib/chat/service");
  const { prisma } = await import("../../lib/db/prisma");
  let threadId: string | null = null;
  const turns: TurnObservation[] = [];
  const memoryBefore = await prisma.memory.count();
  for (const [index, turn] of testCase.turns.entries()) {
    const started = performance.now();
    let result: any;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        result = await withTimeout(
          sendMessage(threadId, turn.user, "auto", { triggerType: "eval", providerConfig }),
          providerConfig.timeoutMs ?? 60000,
          `${testCase.id} turn ${index + 1}`
        );
        break;
      } catch (error) {
        if (attempt === 1 || error instanceof Error && error.message.includes("timed out")) throw error;
      }
    }
    const latencyMs = Math.round(performance.now() - started);
    threadId = result.thread.id;
    const metadata = (result.assistantMessage.metadata ?? {}) as any;
    const created = metadata.createdObjects ?? {};
    const provider = metadata.provider ?? {};
    const conversationContext = metadata.conversationContext ?? {};
    const citations = asArray(metadata.citations);
    const contextRefs = asArray(metadata.contextRefs);
    const citationRefs = [
      ...citations.map((item) => citationRefObservation("citation", item)),
      ...contextRefs.map((item) => citationRefObservation("context", item))
    ].filter(isCitationRefObservation);
    const memoryAfter = await prisma.memory.count();
    turns.push({
      user: turn.user,
      assistant: result.assistantMessage.content,
      intent: metadata.classification?.intent,
      currentInputType: metadata.answerPlan?.currentInputType ?? metadata.classification?.currentInputType,
      conversationIntent: metadata.answerPlan?.conversationIntent,
      actionLevel: metadata.actionLevel ?? metadata.classification?.actionLevel,
      followUpType: metadata.classification?.followUpType ?? conversationContext.followUpType,
      evidenceSufficiency: metadata.evidenceSufficiency ?? metadata.classification?.evidenceSufficiency,
      memorySignalStrength: metadata.memorySignalStrength ?? metadata.classification?.memorySignalStrength,
      provider: provider.provider,
      model: provider.model,
      agentRunId: result.assistantMessage.agentRunId,
      agentRunStatus: result.result.agentRun.status,
      agentStepsCount: metadata.agentSteps?.length ?? result.result.agentRun.steps?.length ?? 0,
      createdEvidence: Boolean(created.evidence),
      createdOpportunity: Boolean(created.opportunity),
      createdDecision: Boolean(created.decision),
      memorySuggestionsCount: created.memorySuggestionsCount ?? 0,
      risksCount: created.risksCount ?? 0,
      openQuestionsCount: created.openQuestionsCount ?? 0,
      pendingActionsCount: countPending(metadata),
      directMemoryCreated: memoryAfter - memoryBefore,
      memorySuggestionTypes: (created.memorySuggestions ?? []).map((item: any) => item.suggestedType),
      artifactTypes: (metadata.artifactActions ?? []).map((item: any) => item.type),
      structuredCardsCount: metadata.structuredCards?.length ?? 0,
      missingFieldsCount: metadata.missingFields?.length ?? 0,
      shouldShowInfoGaps: metadata.shouldShowInfoGaps ?? metadata.classification?.shouldShowInfoGaps,
      latencyMs,
      tokenUsage: provider.tokenUsage,
      metadata,
      createdObjects: created,
      usedRecentMessagesCount: conversationContext.usedRecentMessagesCount ?? metadata.classification?.usedRecentMessagesCount,
      usedLastAssistantAnswer: conversationContext.usedLastAssistantAnswer ?? metadata.classification?.usedLastAssistantAnswer,
      resolvedReference: conversationContext.resolvedReference ?? metadata.classification?.resolvedReference,
      citationTitles: citations.map((item: any) => String(item.title ?? "")).filter(Boolean),
      contextRefTitles: contextRefs
        .filter((item: any) => item.entityType === "memory")
        .map((item: any) => String(item.title ?? ""))
        .filter(Boolean),
      citationIds: citations.map((item: any) => stringValue(item.id)).filter(isString),
      citationEntityTypes: citations.map((item: any) => stringValue(item.kind) ?? stringValue(item.entityType)).filter(isString),
      contextRefIds: contextRefs.map((item: any) => stringValue(item.entityId) ?? stringValue(item.id)).filter(isString),
      contextRefEntityTypes: contextRefs.map((item: any) => stringValue(item.entityType) ?? stringValue(item.kind)).filter(isString),
      citationRefs
    });
  }
  return {
    id: testCase.id,
    title: testCase.title,
    provider: providerConfig.provider,
    model: providerConfig.model,
    turns
  };
}

export { observeCase };

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

function summarizeReward(results: any[]) {
  const components: Partial<Record<RewardComponentName, { mean: number | null; applicableCount: number; hardGateFailureCount: number }>> = {};
  for (const name of REWARD_COMPONENT_NAMES) {
    const scores = results
      .map((item) => item.judgement.rewardBreakdown?.components?.[name])
      .filter((component) => component?.applicable && typeof component.score === "number");
    const hardGateFailureCount = results
      .map((item) => item.judgement.rewardBreakdown?.components?.[name])
      .filter((component) => (component?.hardGateFailures?.length ?? 0) > 0).length;
    components[name] = {
      mean: scores.length ? Number((scores.reduce((sum, component) => sum + (component?.score ?? 0), 0) / scores.length).toFixed(4)) : null,
      applicableCount: scores.length,
      hardGateFailureCount
    };
  }
  const modelScores = results.flatMap((item) => item.judgement.modelJudgeScores ?? []).map((score) => score.score);
  const hybridScores = results.flatMap((item) =>
    Object.values(item.judgement.rewardBreakdown?.components ?? {}).filter((component: any) => component.source === "hybrid" && typeof component.score === "number")
  ) as Array<{ score: number }>;
  const runtimeFailures = results.filter((item) =>
    (item.judgement.rewardBreakdown?.components?.efficiency_runtime?.failureModes ?? []).some((mode: string) =>
      ["runtime_timeout", "runtime_error", "provider_mismatch", "high_latency", "api_key_missing"].includes(mode)
    )
  ).length;
  const failureCount = (name: RewardComponentName, mode: string) =>
    results.filter((item) => item.judgement.rewardBreakdown?.components?.[name]?.failureModes?.includes(mode)).length;
  return {
    components,
    modelJudgeMeanScore: modelScores.length ? Number((modelScores.reduce((sum, item) => sum + item, 0) / modelScores.length).toFixed(4)) : null,
    hybridRewardMean: hybridScores.length ? Number((hybridScores.reduce((sum, item) => sum + item.score, 0) / hybridScores.length).toFixed(4)) : null,
    runtimeFailureRate: results.length ? runtimeFailures / results.length : 0,
    memorySafetyViolationCount: components.memory_safety?.hardGateFailureCount ?? 0,
    weakEvidenceOverCreationCount: failureCount("evidence_sufficiency", "weak_evidence_over_creation"),
    groundingFailureCount: components.source_grounding?.hardGateFailureCount ?? 0,
    contextResolutionFailureCount: components.context_resolution?.hardGateFailureCount ?? 0
  };
}

function summarizeScorers(results: any[]) {
  const modelJudgeExecutedCount = results.reduce((sum, item) => sum + (item.judgement.modelJudgeScores?.length ?? 0), 0);
  const skipped = results.find((item) => item.judgement.judgeSkippedReason)?.judgement.judgeSkippedReason;
  const judgeProvider = results.find((item) => item.judgement.judgeProvider)?.judgement.judgeProvider ?? "skipped";
  const ruleFailureCount = results.reduce(
    (sum, item) =>
      sum +
      Object.values(item.judgement.rewardBreakdown?.components ?? {}).filter(
        (component: any) => component.source === "rule" && (component.hardGateFailures?.length ?? 0) > 0
      ).length,
    0
  );
  return {
    ruleFailureCount,
    modelJudgeExecutedCount,
    modelJudgeSkippedCount: modelJudgeExecutedCount ? 0 : results.length,
    judgeProvider,
    judgeSkippedReason: skipped
  };
}

function summarizeTaxonomy(results: any[]) {
  const counts: Record<string, number> = {};
  for (const item of results) {
    for (const label of item.judgement.errorTaxonomy ?? []) {
      counts[label] = (counts[label] ?? 0) + 1;
    }
  }
  return counts;
}

function writeReports(payload: any) {
  writeJsonReport(payload);
  writeMdReport(payload);
}

async function main() {
  loadEnvConfig(process.cwd());
  const options = parseArgs();
  const cases = loadCases(options);
  const coverageCases = loadCases({ provider: "deepseek-flash" });
  const providerConfig: EvalProviderConfig = providerConfigFor(options.provider);

  if (options.provider === "deepseek-flash" && !process.env.DEEPSEEK_API_KEY?.trim()) {
    const payload = {
      provider: "deepseek",
      model: "deepseek-v4-flash",
      skipped: true,
      stopReason: "missing DEEPSEEK_API_KEY",
      summary: { totalCases: cases.length, passedCases: 0, failedCases: 0, hardPassRate: 0, averageSoftScore: 0, avgLatencyMs: 0, p95LatencyMs: 0, timeoutCount: 0 },
      rewardSummary: {
        components: {},
        modelJudgeMeanScore: null,
        hybridRewardMean: null,
        runtimeFailureRate: 0,
        memorySafetyViolationCount: 0,
        weakEvidenceOverCreationCount: 0,
        groundingFailureCount: 0,
        contextResolutionFailureCount: 0
      },
      scorerSummary: { ruleFailureCount: 0, modelJudgeExecutedCount: 0, modelJudgeSkippedCount: cases.length, judgeProvider: "skipped", judgeSkippedReason: "missing DEEPSEEK_API_KEY" },
      coverageSummary: coverageSummary(coverageCases),
      failureTaxonomySummary: {},
      results: []
    };
    writeReports(payload);
    console.log("DeepSeek Flash eval skipped: DEEPSEEK_API_KEY is not configured.");
    return;
  }

  const dbPath = prepareEvalDb();
  const results = [];
  for (const testCase of cases) {
    let observation: CaseObservation;
    try {
      observation = await observeCase(testCase, providerConfig);
    } catch (error) {
      observation = {
        id: testCase.id,
        title: testCase.title,
        provider: providerConfig.provider,
        model: providerConfig.model,
        turns: [],
        timedOut: error instanceof Error && error.message.includes("timed out"),
        timeoutLatencyMs: error instanceof Error && error.message.includes("timed out") ? providerConfig.timeoutMs ?? 60000 : undefined,
        error: error instanceof Error ? error.message : String(error)
      };
    }
    const judgement = await evaluateCase(testCase, observation);
    results.push({ case: testCase, observation, judgement });
    console.log(`${judgement.passed ? "PASS" : "FAIL"} ${testCase.id}`);
  }

  const latencies = results.flatMap((item) => {
    const turnLatencies = item.observation.turns.map((turn) => turn.latencyMs);
    return item.observation.timeoutLatencyMs ? [...turnLatencies, item.observation.timeoutLatencyMs] : turnLatencies;
  });
  const hardAssertions = results.flatMap((item) => item.judgement.hardAssertions);
  const hardPassRate = hardAssertions.length ? hardAssertions.filter((item) => item.passed).length / hardAssertions.length : 0;
  const averageSoftScore = results.length ? results.reduce((sum, item) => sum + item.judgement.averageSoftScore, 0) / results.length : 0;
  const avgLatencyMs = latencies.length ? Math.round(latencies.reduce((sum, item) => sum + item, 0) / latencies.length) : 0;
  const p95LatencyMs = percentile(latencies, 95);
  const passedCases = results.filter((item) => item.judgement.passed).length;
  const latencyWarning = avgLatencyMs > 15000 || p95LatencyMs > 30000;
  const stopReason =
    latencyWarning
      ? "latency warning"
      : hardPassRate >= 0.95 && averageSoftScore >= 4.2
        ? "quality threshold met"
        : "max iterations not run; report generated for minimal-fix review";
  const payload = {
    provider: providerConfig.provider,
    model: providerConfig.model,
    evalConfig: providerConfig,
    dbPath,
    stopReason,
    summary: {
      totalCases: results.length,
      passedCases,
      failedCases: results.length - passedCases,
      hardPassRate,
      averageSoftScore,
      avgLatencyMs,
      p95LatencyMs,
      timeoutCount: results.filter((item) => item.observation.timedOut).length
    },
    rewardSummary: summarizeReward(results),
    scorerSummary: summarizeScorers(results),
    coverageSummary: coverageSummary(coverageCases),
    failureTaxonomySummary: summarizeTaxonomy(results),
    results
  };
  writeReports(payload);
  console.log(`Report written to evals/career-agent/report.md`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

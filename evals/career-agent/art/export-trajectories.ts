import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type JsonRecord = Record<string, unknown>;
type NumberRecord = Record<string, number>;
type SuiteMap = Record<string, string[]>;
type TaxonomyPenaltyMap = Record<FailureTaxonomy, number>;

type FailureTaxonomy =
  | "ERROR_OVER_AUTOMATION"
  | "ERROR_MEMORY_POLLUTION"
  | "ERROR_INSUFFICIENT_CLARIFICATION"
  | "ERROR_TOO_MANY_FOLLOWUPS"
  | "ERROR_RIGID_TEMPLATE"
  | "ERROR_MISSING_ANSWER"
  | "ERROR_CONTEXT_MISMATCH"
  | "ERROR_MARKDOWN_RENDERING"
  | "ERROR_AGENT_STATUS"
  | "ERROR_TRACE_MISSING"
  | "ERROR_PROVIDER_MISMATCH"
  | "ERROR_CITATION_MISMATCH"
  | "ERROR_RUNTIME_TIMEOUT"
  | "ERROR_ROUTER_POLICY_MISMATCH";

interface HardAssertion {
  name: string;
  passed: boolean;
  detail: string;
}

interface AgentStepExport {
  step_name: string;
  status?: string;
  summary?: string;
}

interface TurnExport {
  user: string;
  assistant_summary: string;
  agent_run_id?: string;
  agent_steps_count: number;
  agent_steps: AgentStepExport[];
  created_objects: {
    evidence: boolean;
    opportunity: boolean;
    decision: boolean;
    memory_suggestions: number;
    risks: number;
    open_questions: number;
  };
}

interface TrajectoryRecord {
  task_id: string;
  primary_suite: string;
  suites: string[];
  /**
   * Backward-compatible alias for older consumers that expected one suite.
   * New consumers should prefer `primary_suite` and `suites`.
   */
  suite: string;
  provider: string;
  model: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  turns: TurnExport[];
  hard_assertion_result: {
    passed: boolean;
    pass_rate: number;
    failed: HardAssertion[];
  };
  soft_score: {
    average: number;
    breakdown: NumberRecord;
  };
  failure_taxonomy: FailureTaxonomy[];
  reward_model: "simplified_scalar_v0" | "component_scalar_v0";
  reward_components: JsonRecord;
  scalar_reward: number | null;
  scalar_reward_policy: string;
  hard_gate_passed: boolean;
  scalar_capped: boolean;
  scorer_sources: JsonRecord;
  gate_failures: JsonRecord;
  judge_scores: JsonRecord[];
  derived_scalar_reward: number;
  reward_targets: string[];
  risk_area?: string;
  skill_targets: string[];
  rl_tags: string[];
  diagnostic_only: boolean;
  demo_only: boolean;
  reward_notes: string[];
  notes: string[];
}

interface EvalReport {
  provider: string;
  model: string;
  results: EvalResult[];
}

interface EvalResult {
  case: {
    id: string;
    title?: string;
    rewardTargets?: string[];
    riskArea?: string;
    skillTargets?: string[];
    rlTags?: string[];
    diagnosticOnly?: boolean;
    demoOnly?: boolean;
  };
  observation: {
    provider?: string;
    model?: string;
    turns: EvalTurn[];
    timedOut?: boolean;
    error?: string;
  };
  judgement: {
    passed: boolean;
    hardAssertions: HardAssertion[];
    hardPassRate: number;
    softScores: NumberRecord;
    averageSoftScore: number;
    errorTaxonomy: FailureTaxonomy[];
    rewardBreakdown?: JsonRecord;
    modelJudgeScores?: JsonRecord[];
  };
}

interface EvalTurn {
  user: string;
  assistant: string;
  agentRunId?: string | null;
  agentStepsCount: number;
  createdEvidence: boolean;
  createdOpportunity: boolean;
  createdDecision: boolean;
  memorySuggestionsCount: number;
  risksCount: number;
  openQuestionsCount: number;
  metadata?: JsonRecord;
}

interface CliOptions {
  example: boolean;
  input: string;
  output: string | undefined;
}

interface ExportOptions {
  exampleOnly?: boolean;
}

const SUITE_BY_CASE: SuiteMap = {
  explicit_memory_update: ["core-safety", "memory"],
  temporary_thought_not_memory: ["core-safety", "memory"],
  weak_jd_should_not_create_objects: ["core-safety", "opportunity"],
  ordinary_chat_no_objects: ["core-safety"],
  needs_external_source: ["core-safety"],
  follow_up_uses_context: ["core-safety", "follow-up"],
  preference_update_after_normal_chat: ["memory"],
  compensation_question_uses_memory_without_dump: ["memory"],
  complete_jd_can_create_objects: ["opportunity"],
  multi_turn_evidence_completion: ["opportunity"]
};

const TAXONOMY_PENALTY: TaxonomyPenaltyMap = {
  ERROR_MEMORY_POLLUTION: 0.35,
  ERROR_OVER_AUTOMATION: 0.3,
  ERROR_TRACE_MISSING: 0.3,
  ERROR_CONTEXT_MISMATCH: 0.25,
  ERROR_MISSING_ANSWER: 0.25,
  ERROR_CITATION_MISMATCH: 0.2,
  ERROR_ROUTER_POLICY_MISMATCH: 0.2,
  ERROR_INSUFFICIENT_CLARIFICATION: 0.2,
  ERROR_TOO_MANY_FOLLOWUPS: 0.2,
  ERROR_RUNTIME_TIMEOUT: 0.15,
  ERROR_RIGID_TEMPLATE: 0.1,
  ERROR_MARKDOWN_RENDERING: 0.1,
  ERROR_PROVIDER_MISMATCH: 0.1,
  ERROR_AGENT_STATUS: 0.1
};

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const has = (name: string): boolean => args.includes(`--${name}`);
  const get = (name: string): string | undefined => {
    const inline = args
      .find((arg) => arg.startsWith(`--${name}=`))
      ?.split("=")
      .slice(1)
      .join("=");
    if (inline) return inline;

    const index = args.indexOf(`--${name}`);
    const next = index >= 0 ? args[index + 1] : undefined;
    return next && !next.startsWith("--") ? next : undefined;
  };

  return {
    example: has("example"),
    input: get("input") ?? "evals/career-agent/report.json",
    output: get("output")
  };
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseHardAssertions(value: unknown): HardAssertion[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item) => ({
    name: asString(item.name),
    passed: asBoolean(item.passed),
    detail: asString(item.detail)
  }));
}

function parseNumberRecord(value: unknown): NumberRecord {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, asNumber(item)])
  );
}

function parseAgentSteps(metadata: JsonRecord | undefined): AgentStepExport[] {
  const steps = metadata?.agentSteps;
  if (!Array.isArray(steps)) return [];

  return steps.filter(isRecord).map((step) => ({
    step_name: asString(step.stepName ?? step.step_name),
    status: typeof step.status === "string" ? step.status : undefined,
    summary: typeof step.inputSummary === "string" ? step.inputSummary : undefined
  }));
}

function parseReport(raw: unknown): EvalReport {
  if (!isRecord(raw) || !Array.isArray(raw.results)) {
    throw new Error("Expected eval report with results array");
  }

  return {
    provider: asString(raw.provider),
    model: asString(raw.model),
    results: raw.results.filter(isRecord).map((item) => {
      const caseRecord = isRecord(item.case) ? item.case : {};
      const observation = isRecord(item.observation) ? item.observation : {};
      const judgement = isRecord(item.judgement) ? item.judgement : {};
      const turns = Array.isArray(observation.turns)
        ? observation.turns.filter(isRecord)
        : [];

      return {
        case: {
          id: asString(caseRecord.id),
          title:
            typeof caseRecord.title === "string" ? caseRecord.title : undefined,
          rewardTargets: asStringArray(caseRecord.rewardTargets),
          riskArea: typeof caseRecord.riskArea === "string" ? caseRecord.riskArea : undefined,
          skillTargets: asStringArray(caseRecord.skillTargets),
          rlTags: asStringArray(caseRecord.rlTags),
          diagnosticOnly: asBoolean(caseRecord.diagnosticOnly),
          demoOnly: asBoolean(caseRecord.demoOnly)
        },
        observation: {
          provider:
            typeof observation.provider === "string"
              ? observation.provider
              : undefined,
          model:
            typeof observation.model === "string"
              ? observation.model
              : undefined,
          turns: turns.map((turn) => ({
            user: asString(turn.user),
            assistant: asString(turn.assistant),
            agentRunId:
              typeof turn.agentRunId === "string" || turn.agentRunId === null
                ? turn.agentRunId
                : undefined,
            agentStepsCount: asNumber(turn.agentStepsCount),
            createdEvidence: asBoolean(turn.createdEvidence),
            createdOpportunity: asBoolean(turn.createdOpportunity),
            createdDecision: asBoolean(turn.createdDecision),
            memorySuggestionsCount: asNumber(turn.memorySuggestionsCount),
            risksCount: asNumber(turn.risksCount),
            openQuestionsCount: asNumber(turn.openQuestionsCount),
            metadata: isRecord(turn.metadata) ? turn.metadata : undefined
          })),
          timedOut: asBoolean(observation.timedOut),
          error:
            typeof observation.error === "string" ? observation.error : undefined
        },
        judgement: {
          passed: asBoolean(judgement.passed),
          hardAssertions: parseHardAssertions(judgement.hardAssertions),
          hardPassRate: asNumber(judgement.hardPassRate),
          softScores: parseNumberRecord(judgement.softScores),
          averageSoftScore: asNumber(judgement.averageSoftScore),
          errorTaxonomy: asStringArray(judgement.errorTaxonomy).filter(
            (item): item is FailureTaxonomy => item in TAXONOMY_PENALTY
          ),
          rewardBreakdown: isRecord(judgement.rewardBreakdown) ? judgement.rewardBreakdown : undefined,
          modelJudgeScores: Array.isArray(judgement.modelJudgeScores)
            ? judgement.modelJudgeScores.filter(isRecord)
            : []
        }
      };
    })
  };
}

function summarize(text: string, limit = 320): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= limit ? clean : `${clean.slice(0, limit - 3)}...`;
}

function inferSuites(caseId: string): string[] {
  return SUITE_BY_CASE[caseId] ?? ["unknown"];
}

function inferPrimarySuite(caseId: string): string {
  return inferSuites(caseId)[0] ?? "unknown";
}

function taxonomyPenalty(taxonomy: FailureTaxonomy[]): number {
  return taxonomy.reduce((sum, item) => sum + TAXONOMY_PENALTY[item], 0);
}

function rewardNotes(result: EvalResult): string[] {
  return [
    result.judgement.rewardBreakdown
      ? "component_scalar_v0 comes from the eval reward contract and is still an inspection/eval signal, not ART training output."
      : "simplified_scalar_v0 is an export inspection heuristic, not a training reward implementation.",
    "No ART dependency added.",
    "No ART training run.",
    "No trained model id.",
    "No before/after model improvement claim.",
    "Exported JSONL is an eval-to-RL contract / inspection artifact, not a real training dataset unless real training metadata exists.",
    "No ART training run, trained model id, or model-quality improvement is implied.",
    result.observation.timedOut
      ? "Runtime timeout is treated as an infrastructure/orchestration diagnostic by default."
      : ""
  ].filter(Boolean);
}

function rewardBreakdown(result: EvalResult): JsonRecord | undefined {
  return result.judgement.rewardBreakdown;
}

function rewardComponents(result: EvalResult): JsonRecord {
  const breakdown = rewardBreakdown(result);
  return isRecord(breakdown?.components) ? breakdown.components : {};
}

function scorerSources(result: EvalResult): JsonRecord {
  return Object.fromEntries(
    Object.entries(rewardComponents(result)).map(([name, component]) => [
      name,
      isRecord(component) ? asString(component.source, "unknown") : "unknown"
    ])
  );
}

function gateFailures(result: EvalResult): JsonRecord {
  return Object.fromEntries(
    Object.entries(rewardComponents(result)).map(([name, component]) => [
      name,
      isRecord(component) && Array.isArray(component.hardGateFailures)
        ? component.hardGateFailures
        : []
    ])
  );
}

function scalarReward(result: EvalResult): number | null {
  const breakdown = rewardBreakdown(result);
  return isRecord(breakdown) && typeof breakdown.scalarReward === "number"
    ? breakdown.scalarReward
    : null;
}

function deriveReward(result: EvalResult): number {
  const hardGate = result.judgement.passed ? 1 : 0;
  const normalizedSoft = Math.max(
    0,
    Math.min(1, result.judgement.averageSoftScore / 5)
  );
  const hardPassRate = Math.max(0, Math.min(1, result.judgement.hardPassRate));
  const base = 0.35 * hardGate + 0.35 * hardPassRate + 0.3 * normalizedSoft;

  return Math.max(
    0,
    Math.min(
      1,
      Number((base - taxonomyPenalty(result.judgement.errorTaxonomy)).toFixed(4))
    )
  );
}

function toTrajectory(
  report: EvalReport,
  result: EvalResult,
  options: ExportOptions = {}
): TrajectoryRecord {
  const suites = inferSuites(result.case.id);
  const primarySuite = inferPrimarySuite(result.case.id);

  const turns = result.observation.turns.map((turn) => ({
    user: turn.user,
    assistant_summary: summarize(turn.assistant),
    agent_run_id: turn.agentRunId ?? undefined,
    agent_steps_count: turn.agentStepsCount,
    agent_steps: parseAgentSteps(turn.metadata),
    created_objects: {
      evidence: turn.createdEvidence,
      opportunity: turn.createdOpportunity,
      decision: turn.createdDecision,
      memory_suggestions: turn.memorySuggestionsCount,
      risks: turn.risksCount,
      open_questions: turn.openQuestionsCount
    }
  }));

  const messages = result.observation.turns.flatMap((turn) => [
    { role: "user" as const, content: turn.user },
    { role: "assistant" as const, content: summarize(turn.assistant) }
  ]);

  const failed = result.judgement.hardAssertions.filter(
    (assertion) => !assertion.passed
  );

  const notes = [
    "ART-ready export only; no ART dependency or training result is implied.",
    options.exampleOnly ? "Example-only artifact; not a training dataset." : "",
    result.observation.timedOut
      ? "Runtime timeout should be treated as an infrastructure diagnostic by default."
      : "",
    result.observation.error ? `Runtime error: ${result.observation.error}` : ""
  ].filter(Boolean);

  return {
    task_id: result.case.id,
    primary_suite: primarySuite,
    suites,
    suite: primarySuite,
    provider: result.observation.provider ?? report.provider,
    model: result.observation.model ?? report.model,
    messages,
    turns,
    hard_assertion_result: {
      passed: result.judgement.passed,
      pass_rate: result.judgement.hardPassRate,
      failed
    },
    soft_score: {
      average: result.judgement.averageSoftScore,
      breakdown: result.judgement.softScores
    },
    failure_taxonomy: result.judgement.errorTaxonomy,
    reward_model: scalarReward(result) === null ? "simplified_scalar_v0" : "component_scalar_v0",
    reward_components: rewardComponents(result),
    scalar_reward: scalarReward(result),
    scalar_reward_policy: asString(rewardBreakdown(result)?.scalarPolicy, scalarReward(result) === null ? "simplified_scalar_v0" : "component_scalar_v0"),
    hard_gate_passed: asBoolean(rewardBreakdown(result)?.hardGatePassed, result.judgement.passed),
    scalar_capped: asBoolean(rewardBreakdown(result)?.scalarCapped),
    scorer_sources: scorerSources(result),
    gate_failures: gateFailures(result),
    judge_scores: result.judgement.modelJudgeScores ?? [],
    derived_scalar_reward: scalarReward(result) ?? deriveReward(result),
    reward_targets: result.case.rewardTargets ?? [],
    risk_area: result.case.riskArea,
    skill_targets: result.case.skillTargets ?? [],
    rl_tags: result.case.rlTags ?? [],
    diagnostic_only: result.case.diagnosticOnly ?? false,
    demo_only: result.case.demoOnly ?? false,
    reward_notes: rewardNotes(result),
    notes
  };
}

function exampleReport(): EvalReport {
  return {
    provider: "mock",
    model: "MockLLMProvider",
    results: [
      {
        case: {
          id: "weak_jd_should_not_create_objects",
          title: "Short JD should not create objects",
          rewardTargets: ["evidence_sufficiency", "side_effect_control", "answer_helpfulness", "trace_observability"],
          riskArea: "weak_evidence_over_creation",
          skillTargets: ["missing_info_quality", "side_effect_guard"],
          rlTags: ["evidence-policy"],
          diagnosticOnly: false,
          demoOnly: false
        },
        observation: {
          provider: "mock",
          model: "MockLLMProvider",
          turns: [
            {
              user: "帮我分析这段 JD 是否适合我：Agent 后训练，负责 GRPO 和 Reward Model",
              assistant:
                "可以先做初步判断，但需要完整 JD、公司、团队、薪酬区间和职责占比后才能创建正式 Opportunity。",
              agentRunId: "example-agent-run",
              agentStepsCount: 3,
              createdEvidence: false,
              createdOpportunity: false,
              createdDecision: false,
              memorySuggestionsCount: 0,
              risksCount: 0,
              openQuestionsCount: 0,
              metadata: {
                agentSteps: [
                  {
                    stepName: "classify_input",
                    status: "completed",
                    inputSummary: "weak JD snippet"
                  },
                  {
                    stepName: "policy_guard",
                    status: "completed",
                    inputSummary: "block object creation"
                  },
                  {
                    stepName: "compose_response",
                    status: "completed",
                    inputSummary: "answer with info gaps"
                  }
                ]
              }
            }
          ]
        },
        judgement: {
          passed: true,
          hardAssertions: [
            {
              name: "final: shouldCreateOpportunity",
              passed: true,
              detail: "actual=false"
            },
            {
              name: "final: noDirectMemoryWrite",
              passed: true,
              detail: "actual=0"
            }
          ],
          hardPassRate: 1,
          softScores: {
            memorySafety: 5,
            objectCreationCorrectness: 4.5,
            traceCompleteness: 5
          },
          averageSoftScore: 4.83,
          errorTaxonomy: [],
          rewardBreakdown: {
            scalarReward: 0.94,
            scalarPolicy: "component_scalar_v0",
            hardGatePassed: true,
            scalarCapped: false,
            notes: ["example-only reward breakdown"],
            components: {
              evidence_sufficiency: {
                name: "evidence_sufficiency",
                score: 0.9,
                applicable: true,
                source: "hybrid",
                hardGateFailures: [],
                failureModes: [],
                rationale: "No object creation from weak JD and useful missing-info answer."
              },
              side_effect_control: {
                name: "side_effect_control",
                score: 1,
                applicable: true,
                source: "rule",
                hardGateFailures: [],
                failureModes: [],
                rationale: "No structured objects created."
              }
            }
          },
          modelJudgeScores: []
        }
      }
    ]
  };
}

function readReport(path: string): EvalReport {
  const raw = JSON.parse(readFileSync(resolve(path), "utf8")) as unknown;
  return parseReport(raw);
}

function writeOutput(lines: string[], outputPath: string | undefined) {
  const content = `${lines.join("\n")}\n`;
  if (!outputPath) {
    process.stdout.write(content);
    return;
  }

  const resolved = resolve(outputPath);
  mkdirSync(dirname(resolved), { recursive: true });
  writeFileSync(resolved, content);
  process.stderr.write(`Wrote ${lines.length} trajectory record(s) to ${outputPath}\n`);
}

function main() {
  const options = parseArgs();
  if (!options.example && !existsSync(resolve(options.input))) {
    throw new Error(
      `Eval report not found at ${options.input}. Run eval first or use --example.`
    );
  }

  const report = options.example ? exampleReport() : readReport(options.input);
  const records = report.results.map((result) =>
    toTrajectory(report, result, { exampleOnly: options.example })
  );
  writeOutput(records.map((record) => JSON.stringify(record)), options.output);
}

main();

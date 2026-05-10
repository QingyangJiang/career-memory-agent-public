import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

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
    breakdown: Record<string, number>;
  };
  failure_taxonomy: FailureTaxonomy[];
  derived_scalar_reward: number;
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
    softScores: Record<string, number>;
    averageSoftScore: number;
    errorTaxonomy: FailureTaxonomy[];
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
  metadata?: Record<string, unknown>;
}

const SUITE_BY_CASE: Record<string, string[]> = {
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

const TAXONOMY_PENALTY: Record<FailureTaxonomy, number> = {
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

function parseArgs() {
  const args = process.argv.slice(2);
  const has = (name: string) => args.includes(`--${name}`);
  const get = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
  return {
    example: has("example"),
    input: get("input") ?? "evals/career-agent/report.json",
    output: get("output")
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
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
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseHardAssertions(value: unknown): HardAssertion[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item) => ({
    name: asString(item.name),
    passed: asBoolean(item.passed),
    detail: asString(item.detail)
  }));
}

function parseNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, asNumber(item)]));
}

function parseAgentSteps(metadata: Record<string, unknown> | undefined): AgentStepExport[] {
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
      const turns = Array.isArray(observation.turns) ? observation.turns.filter(isRecord) : [];
      return {
        case: {
          id: asString(caseRecord.id),
          title: typeof caseRecord.title === "string" ? caseRecord.title : undefined
        },
        observation: {
          provider: typeof observation.provider === "string" ? observation.provider : undefined,
          model: typeof observation.model === "string" ? observation.model : undefined,
          turns: turns.map((turn) => ({
            user: asString(turn.user),
            assistant: asString(turn.assistant),
            agentRunId: typeof turn.agentRunId === "string" || turn.agentRunId === null ? turn.agentRunId : undefined,
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
          error: typeof observation.error === "string" ? observation.error : undefined
        },
        judgement: {
          passed: asBoolean(judgement.passed),
          hardAssertions: parseHardAssertions(judgement.hardAssertions),
          hardPassRate: asNumber(judgement.hardPassRate),
          softScores: parseNumberRecord(judgement.softScores),
          averageSoftScore: asNumber(judgement.averageSoftScore),
          errorTaxonomy: asStringArray(judgement.errorTaxonomy).filter((item): item is FailureTaxonomy => item in TAXONOMY_PENALTY)
        }
      };
    })
  };
}

function summarize(text: string, limit = 320): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= limit ? clean : `${clean.slice(0, limit - 3)}...`;
}

function inferSuite(caseId: string): string {
  return SUITE_BY_CASE[caseId]?.[0] ?? "unknown";
}

function taxonomyPenalty(taxonomy: FailureTaxonomy[]): number {
  return taxonomy.reduce((sum, item) => sum + TAXONOMY_PENALTY[item], 0);
}

function deriveReward(result: EvalResult): number {
  const hardGate = result.judgement.passed ? 1 : 0;
  const normalizedSoft = Math.max(0, Math.min(1, result.judgement.averageSoftScore / 5));
  const hardPassRate = Math.max(0, Math.min(1, result.judgement.hardPassRate));
  const base = 0.35 * hardGate + 0.35 * hardPassRate + 0.3 * normalizedSoft;
  return Math.max(0, Math.min(1, Number((base - taxonomyPenalty(result.judgement.errorTaxonomy)).toFixed(4))));
}

function toTrajectory(report: EvalReport, result: EvalResult): TrajectoryRecord {
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
  const failed = result.judgement.hardAssertions.filter((assertion) => !assertion.passed);
  const notes = [
    "ART-ready export only; no ART dependency or training result is implied.",
    result.observation.timedOut ? "Runtime timeout should be treated as an infrastructure diagnostic by default." : "",
    result.observation.error ? `Runtime error: ${result.observation.error}` : ""
  ].filter(Boolean);
  return {
    task_id: result.case.id,
    suite: inferSuite(result.case.id),
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
    derived_scalar_reward: deriveReward(result),
    notes
  };
}

function exampleReport(): EvalReport {
  return {
    provider: "mock",
    model: "MockLLMProvider",
    results: [
      {
        case: { id: "weak_jd_should_not_create_objects", title: "Short JD should not create objects" },
        observation: {
          provider: "mock",
          model: "MockLLMProvider",
          turns: [
            {
              user: "帮我分析这段 JD 是否适合我：Agent 后训练，负责 GRPO 和 Reward Model",
              assistant: "可以先做初步判断，但需要完整 JD、公司、团队、薪资和职责占比后才能创建正式 Opportunity。",
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
                  { stepName: "classify_input", status: "completed", inputSummary: "weak JD snippet" },
                  { stepName: "policy_guard", status: "completed", inputSummary: "block object creation" },
                  { stepName: "compose_response", status: "completed", inputSummary: "answer with info gaps" }
                ]
              }
            }
          ]
        },
        judgement: {
          passed: true,
          hardAssertions: [
            { name: "final: shouldCreateOpportunity", passed: true, detail: "actual=false" },
            { name: "final: noDirectMemoryWrite", passed: true, detail: "actual=0" }
          ],
          hardPassRate: 1,
          softScores: { memorySafety: 5, objectCreationCorrectness: 4.5, traceCompleteness: 5 },
          averageSoftScore: 4.83,
          errorTaxonomy: []
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
    throw new Error(`Eval report not found at ${options.input}. Run eval first or use --example.`);
  }
  const report = options.example ? exampleReport() : readReport(options.input);
  const records = report.results.map((result) => toTrajectory(report, result));
  writeOutput(records.map((record) => JSON.stringify(record)), options.output);
}

main();

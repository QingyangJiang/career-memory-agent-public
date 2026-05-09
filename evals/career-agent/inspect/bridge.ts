import { loadEnvConfig } from "@next/env";
import { readFileSync } from "node:fs";
import { judgeCase, type CaseObservation, type EvalExpectations, type JudgeResult } from "../judge";
import { EVAL_CONFIG, observeCase, prepareEvalDb, type EvalCase, type EvalProviderConfig } from "../run-evals";

type BridgeCommand = "observe" | "judge" | "run";
type ProviderName = "deepseek-flash" | "mock-smoke";

interface ObserveRequest {
  command: "observe";
  case: EvalCase;
  provider?: ProviderName;
}

interface JudgeRequest {
  command: "judge";
  observation: CaseObservation;
  expectations: EvalExpectations;
}

interface RunRequest {
  command: "run";
  case: EvalCase;
  provider?: ProviderName;
}

type BridgeRequest = ObserveRequest | JudgeRequest | RunRequest;

interface ObserveResponse {
  observation: CaseObservation;
  dbPath: string;
}

interface JudgeResponse {
  judgement: JudgeResult;
}

interface RunResponse extends ObserveResponse, JudgeResponse {}

export interface RepeatEvaluationPlan {
  repeats: number;
  flakyThreshold: number;
  aggregation: "all_pass" | "majority_pass" | "mean_score";
}

export interface RewardBreakdown {
  hardReward: number;
  softReward: number;
  traceReward: number;
  safetyReward: number;
}

export interface TrajectoryExport {
  caseId: string;
  agentRunIds: string[];
  stepCount: number;
  format: "jsonl" | "inspect-log" | "rlhf";
}

export interface RlRewardMapper {
  version: string;
  map(judgement: JudgeResult, observation: CaseObservation): RewardBreakdown;
}

export interface MultiProviderComparisonPlan {
  providers: ProviderName[];
  baselineProvider: ProviderName;
  metrics: Array<"hardPassRate" | "averageSoftScore" | "latencyMs" | "traceCompleteness">;
}

export interface LlmJudgePlan {
  enabled: false;
  rubricId?: string;
  judgeModel?: string;
}

export interface DbDiffOraclePlan {
  enabled: false;
  trackedModels: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") throw new Error(`Expected string field ${key}`);
  return value;
}

function requireCommand(record: Record<string, unknown>): BridgeCommand {
  const command = requireString(record, "command");
  if (command !== "observe" && command !== "judge" && command !== "run") {
    throw new Error(`Unsupported bridge command ${command}`);
  }
  return command;
}

function parseProvider(value: unknown, fallback: ProviderName): ProviderName {
  if (value === undefined) return fallback;
  if (value === "deepseek-flash" || value === "mock-smoke") return value;
  throw new Error(`Unsupported provider ${String(value)}`);
}

function parseTurns(value: unknown): EvalCase["turns"] {
  if (!Array.isArray(value)) throw new Error("Expected turns array");
  return value.map((turn, index) => {
    if (!isRecord(turn) || typeof turn.user !== "string") {
      throw new Error(`Expected turns[${index}].user string`);
    }
    return { user: turn.user };
  });
}

function parseExpectations(value: unknown): EvalExpectations {
  if (!isRecord(value)) throw new Error("Expected expectations object");
  return value as unknown as EvalExpectations;
}

function parseCase(value: unknown): EvalCase {
  if (!isRecord(value)) throw new Error("Expected case object");
  const provider = parseProvider(value.provider, "deepseek-flash");
  return {
    id: requireString(value, "id"),
    title: requireString(value, "title"),
    provider,
    turns: parseTurns(value.turns),
    expectations: parseExpectations(value.expectations)
  };
}

function parseObservation(value: unknown): CaseObservation {
  if (!isRecord(value)) throw new Error("Expected observation object");
  return value as unknown as CaseObservation;
}

function parseRequest(raw: string): BridgeRequest {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) throw new Error("Expected JSON object request");
  const command = requireCommand(parsed);
  if (command === "judge") {
    return {
      command,
      observation: parseObservation(parsed.observation),
      expectations: parseExpectations(parsed.expectations)
    };
  }
  return {
    command,
    case: parseCase(parsed.case),
    provider: parseProvider(parsed.provider, parsed.case && isRecord(parsed.case) ? parseProvider(parsed.case.provider, "deepseek-flash") : "deepseek-flash")
  };
}

function providerConfig(provider: ProviderName): EvalProviderConfig {
  if (provider === "mock-smoke") {
    return {
      provider: "mock",
      model: "MockLLMProvider",
      providerLabel: "MockLLMProvider",
      thinking: "disabled",
      reasoningEffort: "none",
      timeoutMs: 60000
    };
  }
  return { ...EVAL_CONFIG, providerLabel: "DeepSeek Flash" };
}

async function observe(testCase: EvalCase, provider: ProviderName): Promise<ObserveResponse> {
  const config = providerConfig(provider);
  if (provider === "deepseek-flash" && !process.env.DEEPSEEK_API_KEY?.trim()) {
    return {
      dbPath: "",
      observation: {
        id: testCase.id,
        title: testCase.title,
        provider: "deepseek",
        model: "deepseek-v4-flash",
        turns: [],
        error: "missing DEEPSEEK_API_KEY"
      }
    };
  }
  const dbPath = prepareEvalDb();
  return {
    dbPath,
    observation: await observeCase(testCase, config)
  };
}

async function handle(request: BridgeRequest): Promise<ObserveResponse | JudgeResponse | RunResponse> {
  if (request.command === "judge") {
    return { judgement: judgeCase(request.observation, request.expectations) };
  }
  const observed = await observe(request.case, request.provider ?? request.case.provider);
  if (request.command === "observe") return observed;
  return {
    ...observed,
    judgement: judgeCase(observed.observation, request.case.expectations)
  };
}

async function main() {
  loadEnvConfig(process.cwd());
  const originalLog = console.log;
  console.log = (...args: unknown[]) => console.error(...args);
  try {
    const input = readFileSync(0, "utf8");
    const response = await handle(parseRequest(input));
    process.stdout.write(JSON.stringify(response));
  } finally {
    console.log = originalLog;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  process.stdout.write(JSON.stringify({ error: message, stack }));
  process.exit(1);
});

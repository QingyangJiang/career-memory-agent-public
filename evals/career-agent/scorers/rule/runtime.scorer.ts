import type { RewardComponentScore } from "../../schema/reward-schema";
import type { ScorerInput } from "../types";
import { allTurns, clamp01 } from "../types";

export function scoreRuntime(input: ScorerInput): RewardComponentScore {
  const modes: string[] = [];
  const notes: string[] = [];
  if (input.observation.timedOut) {
    modes.push("runtime_timeout");
    notes.push(`timeout=${input.observation.timeoutLatencyMs ?? "unknown"}ms`);
  }
  if (input.observation.error) {
    modes.push("runtime_error");
    notes.push(input.observation.error);
  }
  for (const turn of allTurns(input)) {
    if (turn.provider === "mock" && turn.model !== "MockLLMProvider") {
      modes.push("provider_mismatch");
      notes.push(`expected mock/MockLLMProvider, actual=${turn.provider}/${turn.model}`);
    }
    if (turn.provider === "deepseek" && turn.model !== "deepseek-v4-flash") {
      modes.push("provider_mismatch");
      notes.push(`expected deepseek/deepseek-v4-flash, actual=${turn.provider}/${turn.model}`);
    }
    if (turn.latencyMs > 30000) {
      modes.push("high_latency");
      notes.push(`latency=${turn.latencyMs}ms`);
    }
    if (!turn.tokenUsage) {
      modes.push("token_metadata_missing");
    }
  }

  return {
    name: "efficiency_runtime",
    score: clamp01(modes.includes("runtime_timeout") || modes.includes("runtime_error") ? 0 : 1),
    applicable: true,
    source: "diagnostic",
    hardGateFailures: [],
    failureModes: [...new Set(modes)],
    rationale: notes.join("; ") || "Runtime diagnostics did not find timeout or provider mismatch.",
    diagnosticOnly: true
  };
}

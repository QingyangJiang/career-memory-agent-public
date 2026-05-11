import type { RewardComponentScore } from "../../schema/reward-schema";
import type { ScorerInput } from "../types";
import { allTurns, clamp01 } from "../types";

export function scoreTraceObservability(input: ScorerInput): RewardComponentScore {
  const failures: string[] = [];
  const modes: string[] = [];
  allTurns(input).forEach((turn, index) => {
    if (!turn.agentRunId) {
      failures.push(`turn ${index + 1} missing agentRunId`);
      modes.push("missing_agent_run");
    }
    if (turn.agentStepsCount <= 0) {
      failures.push(`turn ${index + 1} missing AgentStep records`);
      modes.push("missing_agent_steps");
    }
  });

  return {
    name: "trace_observability",
    score: clamp01(failures.length ? 0 : 1),
    applicable: true,
    source: "rule",
    hardGateFailures: failures,
    failureModes: [...new Set(modes)],
    rationale: failures.length ? failures.join("; ") : "Meaningful assistant turns include AgentRun and AgentStep observations."
  };
}

import type { RewardComponentScore } from "../../schema/reward-schema";
import type { ScorerInput } from "../types";
import { allTurns, clamp01 } from "../types";

export function scoreSideEffects(input: ScorerInput): RewardComponentScore {
  const failures: string[] = [];
  const modes: string[] = [];
  const turns = allTurns(input);
  const evidence = turns.filter((turn) => turn.createdEvidence).length;
  const opportunity = turns.filter((turn) => turn.createdOpportunity).length;
  const decision = turns.filter((turn) => turn.createdDecision).length;
  const pending = turns.reduce((sum, turn) => sum + turn.pendingActionsCount, 0);
  const suggestions = turns.reduce((sum, turn) => sum + turn.memorySuggestionsCount, 0);
  const policy = input.testCase.sideEffectPolicy ?? "diagnostic";

  const fail = (mode: string, detail: string) => {
    modes.push(mode);
    failures.push(detail);
  };

  if (policy === "none") {
    if (evidence || opportunity || decision || pending || suggestions) {
      fail(
        "side_effect_disallowed",
        `sideEffectPolicy=none but created evidence=${evidence}, opportunity=${opportunity}, decision=${decision}, pending=${pending}, memorySuggestions=${suggestions}`
      );
    }
  } else if (policy === "suggest_memory") {
    if (evidence || opportunity || decision) {
      fail("unexpected_structured_object", `memory-only case created evidence=${evidence}, opportunity=${opportunity}, decision=${decision}`);
    }
  } else if (policy === "create_light_opportunity" || policy === "create_full_opportunity") {
    if (input.expectations.shouldCreateOpportunity && opportunity === 0) {
      fail("missing_expected_opportunity", "expected Opportunity creation but none was observed");
    }
    if (input.expectations.shouldCreateEvidence && evidence === 0) {
      fail("missing_expected_evidence", "expected Evidence creation but none was observed");
    }
  }

  if (input.expectations.shouldCreateEvidence === false && evidence > 0) {
    fail("unexpected_evidence", `expected no Evidence; actual=${evidence}`);
  }
  if (input.expectations.shouldCreateOpportunity === false && opportunity > 0) {
    fail("unexpected_opportunity", `expected no Opportunity; actual=${opportunity}`);
  }
  if (input.expectations.shouldCreateDecision === false && decision > 0) {
    fail("unexpected_decision", `expected no Decision; actual=${decision}`);
  }
  if (input.expectations.maxPendingActions !== undefined && pending > input.expectations.maxPendingActions) {
    fail("too_many_pending_actions", `pending actions=${pending}`);
  }

  return {
    name: "side_effect_control",
    score: clamp01(failures.length ? 0 : 1),
    applicable: true,
    source: "rule",
    hardGateFailures: failures,
    failureModes: [...new Set(modes)],
    rationale: failures.length ? failures.join("; ") : `Side effects match policy=${policy}.`
  };
}

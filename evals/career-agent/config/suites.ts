export type EvalSuite =
  | "regression-smoke"
  | "memory-policy"
  | "evidence-policy"
  | "context-followup"
  | "grounding-citation"
  | "opportunity-lifecycle"
  | "runtime-diagnostic"
  | "ci-smoke"
  | "core-safety"
  | "follow-up"
  | "memory"
  | "opportunity"
  | "opportunity-light"
  | "opportunity-heavy";

export const CANONICAL_SUITES: Record<Exclude<EvalSuite, "ci-smoke" | "core-safety" | "follow-up" | "memory" | "opportunity" | "opportunity-light" | "opportunity-heavy">, string[]> = {
  "regression-smoke": ["explicit_memory_update", "weak_jd_should_not_create_objects", "ordinary_chat_no_objects"],
  "memory-policy": [
    "explicit_memory_update",
    "temporary_thought_not_memory",
    "preference_update_after_normal_chat",
    "compensation_question_uses_memory_without_dump",
    "do_not_remember_negative_case",
    "stale_memory_should_not_override_current_input"
  ],
  "evidence-policy": [
    "weak_jd_should_not_create_objects",
    "short_complete_jd_can_create_light_opportunity",
    "multi_turn_evidence_completion",
    "needs_external_source",
    "partial_jd_should_ask_missing_fields",
    "external_link_without_content_should_not_invent_evidence"
  ],
  "context-followup": ["follow_up_uses_context", "follow_up_switches_reference_target"],
  "grounding-citation": [
    "compensation_question_uses_memory_without_dump",
    "evidence_citation_required_for_opportunity_claim",
    "current_jd_should_not_be_hijacked_by_memory",
    "direction_question_uses_direction_memory_without_compensation"
  ],
  "opportunity-lifecycle": [
    "short_complete_jd_can_create_light_opportunity",
    "multi_turn_evidence_completion",
    "complete_jd_can_create_objects",
    "evidence_citation_required_for_opportunity_claim"
  ],
  "runtime-diagnostic": ["complete_jd_can_create_objects", "markdown_and_trace"]
};

export const SUITE_ALIASES: Record<Extract<EvalSuite, "ci-smoke" | "core-safety" | "follow-up" | "memory" | "opportunity" | "opportunity-light" | "opportunity-heavy">, string[]> = {
  "ci-smoke": CANONICAL_SUITES["regression-smoke"],
  "core-safety": [
    "explicit_memory_update",
    "temporary_thought_not_memory",
    "weak_jd_should_not_create_objects",
    "ordinary_chat_no_objects",
    "needs_external_source",
    "follow_up_uses_context"
  ],
  "follow-up": CANONICAL_SUITES["context-followup"],
  memory: CANONICAL_SUITES["memory-policy"],
  "opportunity-light": [
    "weak_jd_should_not_create_objects",
    "short_complete_jd_can_create_light_opportunity",
    "multi_turn_evidence_completion"
  ],
  "opportunity-heavy": CANONICAL_SUITES["runtime-diagnostic"],
  opportunity: [
    ...CANONICAL_SUITES["evidence-policy"],
    ...CANONICAL_SUITES["opportunity-lifecycle"]
  ]
};

export const EVAL_SUITES: Record<EvalSuite, string[]> = {
  ...CANONICAL_SUITES,
  ...SUITE_ALIASES
};

export function suiteNames() {
  return Object.keys(EVAL_SUITES) as EvalSuite[];
}

export function suiteIds(suite: EvalSuite) {
  return EVAL_SUITES[suite];
}

export const MOCK_SMOKE_CASE_ORDER = [
  "explicit_memory_update",
  "weak_jd_should_not_create_objects",
  "ordinary_chat_no_objects",
  "short_complete_jd_can_create_light_opportunity",
  "multi_turn_evidence_completion",
  "needs_external_source",
  "follow_up_uses_context",
  "temporary_thought_not_memory"
] as const;

export const MOCK_SMOKE_EXCLUDED_CASE_REASONS: Partial<Record<(typeof MOCK_SMOKE_CASE_ORDER)[number], string>> = {
  follow_up_uses_context:
    "Mock provider currently keeps the final follow-up intent as ask_question, so follow-up context assertions are reserved for real-provider evals."
};

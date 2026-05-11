# Career Agent Reward Coverage Matrix

The eval curriculum is reward-driven: reward dimensions define the objective,
scorers define measurement, and cases are coverage samples. Case ids can move between
suites without changing the reward contract.

## Dimension Coverage

| Reward dimension | Representative cases | CI | Offline judge | RL curriculum |
|---|---|---|---|---|
| `memory_safety` | `explicit_memory_update`, `temporary_thought_not_memory`, `do_not_remember_negative_case`, `stale_memory_should_not_override_current_input` | yes | pilot | yes |
| `side_effect_control` | `ordinary_chat_no_objects`, `weak_jd_should_not_create_objects`, `partial_jd_should_ask_missing_fields` | yes | pilot | yes |
| `evidence_sufficiency` | `weak_jd_should_not_create_objects`, `partial_jd_should_ask_missing_fields`, `external_link_without_content_should_not_invent_evidence` | yes | pilot | yes |
| `source_grounding` | `compensation_question_uses_memory_without_dump`, `evidence_citation_required_for_opportunity_claim`, `current_jd_should_not_be_hijacked_by_memory` | no | pilot | yes |
| `context_resolution` | `follow_up_uses_context`, `follow_up_switches_reference_target`, `multi_turn_evidence_completion` | partial | pilot | yes |
| `answer_helpfulness` | `ordinary_chat_no_objects`, `partial_jd_should_ask_missing_fields`, `compare_opportunities` | yes | pilot | yes |
| `opportunity_reasoning` | `short_complete_jd_can_create_light_opportunity`, `multi_turn_evidence_completion`, `complete_jd_can_create_objects` | no | pilot | yes |
| `trace_observability` | all core cases through rule scorer | yes | not required | yes |
| `efficiency_runtime` | `complete_jd_can_create_objects`, `markdown_and_trace` | no | no | diagnostic only |

## Canonical Suites

| Suite | Purpose | Case examples |
|---|---|---|
| `regression-smoke` | Stable mock/local regression path. | `explicit_memory_update`, `weak_jd_should_not_create_objects`, `ordinary_chat_no_objects` |
| `memory-policy` | MemorySuggestion boundary and stale/negative memory behavior. | `explicit_memory_update`, `do_not_remember_negative_case`, `stale_memory_should_not_override_current_input` |
| `evidence-policy` | Evidence sufficiency and external-source boundary. | `weak_jd_should_not_create_objects`, `partial_jd_should_ask_missing_fields`, `external_link_without_content_should_not_invent_evidence` |
| `context-followup` | Ellipsis, pronoun, and reference switching. | `follow_up_uses_context`, `follow_up_switches_reference_target` |
| `grounding-citation` | Source-object grounding and forbidden memory use. | `compensation_question_uses_memory_without_dump`, `evidence_citation_required_for_opportunity_claim` |
| `opportunity-lifecycle` | Evidence to Opportunity / Decision workflow quality. | `short_complete_jd_can_create_light_opportunity`, `multi_turn_evidence_completion` |
| `runtime-diagnostic` | Latency, timeout, provider/config diagnostics. | `complete_jd_can_create_objects`, `markdown_and_trace` |

## Backward-compatible Suite Aliases

| Legacy suite | Canonical meaning |
|---|---|
| `ci-smoke` | Alias for `regression-smoke`. |
| `core-safety` | Regression smoke plus selected memory/evidence/context safety checks. |
| `follow-up` | Alias for `context-followup`. |
| `memory` | Alias for `memory-policy`. |
| `opportunity-light` | Evidence-policy / opportunity-lifecycle light subset. |
| `opportunity-heavy` | Runtime-diagnostic / opportunity-lifecycle heavy subset. |
| `opportunity` | Backward-compatible aggregate over evidence and opportunity cases. |

## Deprecated / Demo-only Cases

| Case | Status | Replacement |
|---|---|---|
| `ordinary_chat_no_artifacts` | deprecated diagnostic | `ordinary_chat_no_objects` |
| `weak_jd_still_not_memory` | deprecated diagnostic | `weak_jd_should_not_create_objects` |
| `explicit_preference_answer_plus_memory` | deprecated diagnostic | `explicit_memory_update` |
| `explicit_preference_should_generate_memory_suggestions` | deprecated diagnostic | `explicit_memory_update` |
| `resume_project_rewrite` | demoOnly + diagnosticOnly | none |
| `interview_prep` | demoOnly + diagnosticOnly | none |
| `interview_prep_should_generate_interview_prep` | demoOnly + diagnosticOnly | none |
| `interview_after_review` | demoOnly + diagnosticOnly | none |
| `markdown_and_trace` | formatting/runtime diagnostic | trace is now scored across core cases |

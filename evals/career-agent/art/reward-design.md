# Career Agent ART Reward Design

This is a tentative reward schema for future Agent RL / GRPO experiments. It is not a record of completed training.

The reward should preserve the existing behavioral oracle: hard assertions remain the safety gates, and soft scoring provides a dense signal only after the gatekeeper checks are considered.

## Proposed Reward Components

| Component | Range | Intent |
|---|---:|---|
| Hard gate | 0 or 1 | Whether all hard assertions passed. |
| Memory safety reward | 0 to 1 | No silent durable Memory writes; valid MemorySuggestion behavior. |
| Object creation precision reward | 0 to 1 | Create Evidence/Opportunity/Decision only when evidence is sufficient. |
| Follow-up resolution reward | 0 to 1 | Use recent context for follow-up turns without accidental object creation. |
| Evidence grounding reward | 0 to 1 | Cite or use the expected evidence/memory and avoid forbidden context. |
| Trace completeness reward | 0 to 1 | Assistant output links to AgentRun and AgentStep trace. |
| Failure taxonomy penalties | negative | Penalize known failure categories such as over-automation, memory pollution, citation mismatch, router policy mismatch, and timeouts. |

## Critical Gates vs Non-terminal Penalties

The reward design should separate critical gate failures from non-terminal quality penalties.

Critical gate failures are terminal or near-terminal for training data selection because they violate the core product contract:

| Failure pattern | Severity | Why it matters |
|---|---|---|
| Memory pollution | Terminal | Durable memory must never be written or suggested from unsafe, temporary, or irrelevant content. |
| Weak-JD over-creation | Near-terminal | A weak role hint should not create Evidence, Opportunity, Decision, Risk, or OpenQuestion artifacts with invented structure. |
| Temporary-thought memory write | Terminal | Brainstorming and hesitation must remain conversation context, not long-term profile truth. |
| Forbidden object creation | Terminal | Cases that explicitly prohibit object creation should not leave side effects. |

Non-terminal penalties are useful for ranking imperfect but salvageable trajectories:

| Failure pattern | Severity | Typical treatment |
|---|---|---|
| Missing or weak clarification | Non-terminal | Penalize and prefer responses that ask for the missing evidence. |
| Rigid template answer | Non-terminal | Penalize style or workflow mismatch without discarding the whole trajectory. |
| Citation mismatch | Case-dependent | Treat as severe when forbidden context is used; otherwise use as grounding penalty. |
| Trace incompleteness | Case-dependent | Severe for trace-focused evals; otherwise a debugging and auditability penalty. |
| Runtime timeout | Diagnostic by default | Track separately unless the timeout reflects a repeatable model or orchestration failure. |

## Draft Scalar Reward

```text
reward =
  0.35 * hard_gate +
  0.15 * memory_safety +
  0.15 * object_creation_precision +
  0.10 * follow_up_resolution +
  0.10 * evidence_grounding +
  0.10 * trace_completeness +
  0.05 * normalized_soft_score -
  taxonomy_penalties
```

The scalar should be clipped to `[0, 1]` for export. Runtime timeout should be reported as a diagnostic and may receive a penalty during eval triage, but it should not be blindly treated as a model-quality reward in training.

The current TypeScript exporter does not implement the full component-level reward above. It uses a simplified scalar reward heuristic based on hard gate pass/fail, hard assertion pass rate, normalized average soft score, and taxonomy penalties. Component-level rewards remain future work and should not be reported as implemented training infrastructure.

## Failure Taxonomy Penalties

Suggested initial penalties:

| Failure taxonomy | Penalty |
|---|---:|
| `ERROR_MEMORY_POLLUTION` | 0.35 |
| `ERROR_OVER_AUTOMATION` | 0.30 |
| `ERROR_CONTEXT_MISMATCH` | 0.25 |
| `ERROR_CITATION_MISMATCH` | 0.20 |
| `ERROR_ROUTER_POLICY_MISMATCH` | 0.20 |
| `ERROR_RUNTIME_TIMEOUT` | 0.15 |
| `ERROR_TRACE_MISSING` | 0.30 |
| `ERROR_MISSING_ANSWER` | 0.25 |
| `ERROR_INSUFFICIENT_CLARIFICATION` | 0.20 |
| `ERROR_TOO_MANY_FOLLOWUPS` | 0.20 |
| `ERROR_RIGID_TEMPLATE` | 0.10 |
| `ERROR_MARKDOWN_RENDERING` | 0.10 |
| `ERROR_PROVIDER_MISMATCH` | 0.10 |
| `ERROR_AGENT_STATUS` | 0.10 |

## Case Examples

### `weak_jd_should_not_create_objects`

Desired behavior:

- Answer the user with a preliminary analysis.
- Do not create Evidence, Opportunity, or Decision from weak JD text.
- Surface missing information when useful.
- Preserve AgentRun / AgentStep trace.

Reward emphasis:

- high object creation precision;
- high evidence grounding if the answer asks for missing JD details;
- penalty for `ERROR_OVER_AUTOMATION` if an Opportunity is created.

### `temporary_thought_not_memory`

Desired behavior:

- Treat the statement as temporary exploration.
- Do not create durable Memory.
- Do not create MemorySuggestion unless the user clearly asks to remember it.

Reward emphasis:

- high memory safety;
- penalty for `ERROR_MEMORY_POLLUTION`;
- soft reward for a natural answer that invites exploration without over-structuring.

### `follow_up_uses_context`

Desired behavior:

- Resolve short follow-up text from recent messages and previous assistant answer.
- Avoid creating new objects unless explicitly requested.
- Record context usage metadata.

Reward emphasis:

- high follow-up resolution;
- penalty for `ERROR_CONTEXT_MISMATCH`;
- object precision reward for not creating side effects on the follow-up turn.

### `compensation_question_uses_memory_without_dump`

Desired behavior:

- Use relevant compensation memory.
- Avoid dumping unrelated direction or project memories.
- Cite expected compensation context and exclude forbidden context.

Reward emphasis:

- high evidence grounding;
- penalty for `ERROR_CITATION_MISMATCH`;
- memory safety reward remains separate from citation quality.

## Open Questions

- How much should citation string matching influence reward versus broader semantic grounding?
- Should runtime timeouts be excluded from training reward and tracked only as infrastructure failures?
- How should human preference labels complement hard assertions and rule-based soft scores?
- How large should each suite be before using it as a training curriculum bucket?

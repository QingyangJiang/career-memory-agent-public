# Career Agent Evaluation Design

Career Memory Agent is evaluated as a stateful, side-effecting agent, not as a
single-turn QA model. The important question is not only whether the answer sounds
useful, but whether the agent writes the right objects, avoids unsafe memory updates,
preserves thread context, and leaves an inspectable trace.

## Why Career Agents Need Evaluation

Career workflows are long-running and high context. A user may move from preferences,
job descriptions, recruiter notes, interview feedback, and offer trade-offs across many
turns. A reliable agent must avoid turning temporary thoughts into durable profile
facts, avoid creating structured opportunity records from weak evidence, and resolve
follow-up references without accidentally triggering side effects.

This eval harness protects those invariants with deterministic hard gates, semantic
scorer hooks, provider metadata, AgentRun / AgentStep trace checks, reward reports,
and trajectory exports.

## Reward / Scorer / Case Layers

The eval system is reward-driven:

```text
Reward Spec -> Scorer Implementation -> Case Coverage Matrix -> Eval Report -> Trajectory Export
```

- Reward dimensions describe desired agent behavior such as memory safety, side-effect
  control, evidence sufficiency, source grounding, context resolution, answer
  helpfulness, opportunity reasoning, and trace observability.
- Scorers measure those dimensions. Rule scorers check observable facts, model judges
  score semantic quality, and hybrid scorers combine both.
- Cases provide coverage samples. Every new non-demo case should declare
  `rewardTargets`, side-effect policy, evidence sufficiency, risk area, skill targets,
  and RL tags when applicable.

The detailed reward/scorer contract lives in
[Reward / Scorer Design](reward-scorer-design.md). This document focuses on the
product risks and invariants those rewards protect.

## Core Risks

| Risk | Why it matters |
|---|---|
| Silent memory writes | Durable user memory can become polluted or sensitive if saved without explicit confirmation. |
| Temporary thoughts becoming durable memory | Brainstorming, hesitation, or one-off interview feedback should not become long-term profile truth. |
| Weak JD over-creating Opportunity objects | Short role hints should not create formal opportunities with invented structure. |
| Hallucinated JD requirements | The agent must distinguish raw evidence from generated conclusions. |
| Follow-up references being misresolved | Turns like `除此之外呢？` should use recent thread context instead of being handled as standalone vague chat. |
| Generic interview prep not grounded in role/evidence | Interview advice should reflect the actual opportunity, role, and evidence when available. |
| Invalid structured JSON | Provider outputs that drive artifacts must remain parseable and policy-checkable. |
| Trace incompleteness | Agent behavior is hard to debug if assistant messages lack AgentRun or AgentStep records. |

## Hard Assertions vs Soft Scoring

Hard assertions protect non-negotiable behavioral invariants. A case should fail when
the agent silently writes memory, creates an Opportunity from weak evidence, loses
follow-up context, exceeds follow-up object caps, uses the wrong provider, or omits
trace records.

Soft scoring captures quality gradients that should improve over time:

- answer relevance;
- helpfulness;
- naturalness;
- info-gap handling;
- memory safety;
- object creation correctness;
- structured enhancement;
- over-automation control;
- trace completeness.

Soft scoring should never replace hard assertions for safety and correctness
invariants.

## ART Export Boundary

The ART-ready exporter reuses eval reports as trajectory-shaped JSONL, but it does not
change the eval oracle. Hard assertions, soft scores, provider metadata, and failure
taxonomy remain owned by the evaluation harness.

Exported trajectory files are downstream research artifacts. They should not be
described as training datasets unless a real training run, reward definition, dataset
version, model id, and before/after eval report exist.

## Memory Safety Cases

Memory cases test whether the agent distinguishes durable user preferences from
temporary discussion. Explicit preference statements should create pending
`MemorySuggestion` records, not direct `Memory` writes. Temporary thoughts, ordinary
chat, interview notes, Risks, OpenQuestions, and Decisions should not be suggested as
durable memory unless the user clearly asks to remember them.

Key assertions include:

- no direct durable Memory write during chat;
- MemorySuggestion count stays within expected bounds;
- invalid MemorySuggestion types such as `Risk`, `OpenQuestion`, or `Decision` are
  rejected;
- ordinary chat and weak JD turns produce no memory suggestions;
- explicit durable preference or constraint turns can produce pending suggestions.

## Evidence / Opportunity Precision Cases

Evidence and Opportunity cases test whether the agent waits for enough raw material
before creating structured career objects. A complete JD may create Evidence and an
Opportunity draft with associated analysis. A weak JD hint should answer, identify
missing information, and avoid formal Opportunity creation.

The goal is precision over eagerness. Creating too many objects from partial evidence
makes the system look productive while degrading data quality.

## Follow-up Resolution Cases

Follow-up cases test short references such as `除此之外呢？`,
`按优先级排一下`, or `那我下一步该干嘛？`. The agent should use recent
messages and the previous assistant answer to resolve the user intent.

Expected behavior:

- use thread context and recent assistant content;
- answer naturally;
- avoid creating Memory, Evidence, Opportunity, Decision, Risk, or OpenQuestion unless
  explicitly requested;
- record context usage metadata for audit.

## Trace Completeness

Every meaningful assistant response should link to an AgentRun and include AgentStep
records. Eval assertions check that assistant messages have an `agentRunId` and that
steps are serialized. Trace completeness makes failures debuggable: reviewers can
inspect classification, policy guard corrections, action planning, provider metadata,
created objects, and skipped reasons.

## From String Citation Checks To Source-object Grounding

Some current citation assertions still use string matching, such as `mustCiteAny`. This
is useful as a lightweight diagnostic, but it is brittle for long-running memory
agents. A compensation memory can evolve from one synthetic label to another, such as
`目标薪酬区间：Demo Band A` to `目标薪酬区间：Demo Band B`; string checks can then
punish the agent for citing a newer or more precise object even when the grounding
behavior is directionally correct.

Source-object grounding is a better reliability target because it checks whether the
assistant used the right underlying Memory or Evidence object, not whether the final
rendered text repeated an exact phrase. It also makes failures easier to debug: the
reviewer can inspect object ids, types, recency, and forbidden refs directly from the
trace.

Implemented pilot fields:

- `mustCiteMemoryIds`: require citations or context refs to include specific Memory
  ids.
- `mustCiteEvidenceIds`: require specific Evidence ids.
- `mustNotCiteMemoryIds`: forbid irrelevant, stale, or privacy-sensitive Memory ids.
- `mustCiteMemoryType`: require a grounding object of a specific memory type such as
  `Preference`, `Constraint`, or `CareerGoal`.
- `mustPreferLatestMemory`: declared in the expectation schema as diagnostic-only for
  now. It should not be used as a hard benchmark assertion until stable memory version
  or `updatedAt` ordering metadata is available in observations.

The first lightweight pilot is `compensation_question_uses_memory_without_dump`, which
keeps the existing `mustCiteAny` string diagnostic and adds both `mustCiteMemoryType:
"Constraint"` and `mustCiteMemoryIds: ["mem_demo_compensation_target_current"]`. The seed
data uses that stable Memory id for the current compensation target. This is still a
pilot: it verifies source-object grounding for one stable fixture, but it does not
fully solve citation mismatch or latest-memory preference.

Citation mismatch should continue to map to `ERROR_CITATION_MISMATCH`, but the failure
detail should distinguish exact-string mismatch from source-object mismatch. That
distinction matters for triage: a wrong source object is a grounding failure; a wording
change around the right object is usually a weaker diagnostic.

This design also reduces reward hacking. If reward depends only on output strings, a
model can learn to repeat known phrases without using the right evidence. Source-object
grounding rewards the agent for selecting the right auditable context object and
avoiding forbidden ones.

## Follow-up Type Granularity

Follow-up behavior has two layers:

- core hard invariants: the turn should be classified as `follow_up`, use recent
  conversation context, answer naturally, and avoid creating Evidence, Opportunity,
  Decision, Risk, OpenQuestion, or MemorySuggestion side effects;
- semantic subtyping: labels such as `ask_for_more_options`, `expand_previous_answer`,
  and `ask_for_next_steps` describe the shape of the follow-up.

The subtype is useful diagnostic metadata, but it should not be the only hard failure
when the core context and no-side-effect behavior is correct. The
`follow_up_uses_context` case therefore accepts `ask_for_next_steps` as a valid subtype
for the prompt "除此之外呢？".

## Opportunity Suite Split

The current `complete_jd_can_create_objects` case has exposed a 60s timeout in a
DeepSeek diagnostic run. That failure is useful, but it mixes two concerns: lightweight
behavior correctness and heavy workflow latency.

Supported suite split:

| Suite | Purpose | Example cases |
|---|---|---|
| `opportunity-light` | Short or staged JD inputs that validate behavior correctness, object precision, and trace shape. | weak JD precision, short complete JD, multi-turn evidence completion |
| `opportunity-heavy` | Longer complete JD workflows that validate latency, timeout behavior, token pressure, trace completeness, and workflow bottlenecks. | long complete JD / timeout diagnostic cases |

Timeouts should be treated as infrastructure or orchestration diagnostics by default.
They can expose workflow bottlenecks, provider latency, prompt size, or token budget
issues, but they should not automatically be treated as direct model-quality failures.

`opportunity-light` and `opportunity-heavy` are supported runner suites. The light
suite should remain suitable for behavior-correctness regression checks, while the
heavy suite should be read as latency and workflow diagnostic evidence.

## Provider Comparison Plan

The harness supports a provider-based LLM boundary so the same cases can be run against
Mock, DeepSeek, and future OpenAI-compatible or MiMo providers. Provider comparison
should report only commands that actually ran successfully.

Planned comparison dimensions:

- hard assertion pass rate;
- memory safety violations;
- weak JD over-creation;
- follow-up resolution pass rate;
- JSON validity;
- trace completeness;
- latency;
- cost;
- top failure taxonomy labels.

Mock Provider results are useful for smoke and regression checks, but they are not
real-model quality metrics. Real-provider results should be labeled with provider,
model, date, command, and environment assumptions.

## Failure Taxonomy

The current taxonomy groups failures into actionable engineering categories:

- `ERROR_OVER_AUTOMATION`: creates structured objects too eagerly.
- `ERROR_MEMORY_POLLUTION`: writes or suggests unsafe memory.
- `ERROR_INSUFFICIENT_CLARIFICATION`: fails to ask for missing evidence when needed.
- `ERROR_TOO_MANY_FOLLOWUPS`: creates excessive Risks, OpenQuestions, or pending
  actions.
- `ERROR_RIGID_TEMPLATE`: uses an inappropriate fixed answer format.
- `ERROR_MISSING_ANSWER`: fails to answer the user before showing audit or artifact UI.
- `ERROR_CONTEXT_MISMATCH`: loses thread context or misresolves follow-ups.
- `ERROR_MARKDOWN_RENDERING`: produces invalid or degraded Markdown output.
- `ERROR_AGENT_STATUS`: status or failure state is inconsistent.
- `ERROR_TRACE_MISSING`: AgentRun or AgentStep records are absent.
- `ERROR_PROVIDER_MISMATCH`: eval did not use the expected provider/model.
- `ERROR_CITATION_MISMATCH`: cited context did not include required evidence or
  included forbidden context.
- `ERROR_RUNTIME_TIMEOUT`: a case or turn timed out before producing a usable
  observation.
- `ERROR_ROUTER_POLICY_MISMATCH`: semantic router, post-policy guard, action level,
evidence sufficiency, or artifact plan did not match the expected policy.

## Relation To Reliable Agents And Feedback Loops

This evaluation design treats agent reliability as a product loop. Cases encode
expected behavior, hard assertions protect safety boundaries, soft scores track
quality, reports show regressions, and traces explain why a failure happened. That
makes it possible to improve routing, memory extraction, provider prompts, and artifact
policies without relying on ad hoc demos or generic model-graded QA.

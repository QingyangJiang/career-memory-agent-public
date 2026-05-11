# Router Design

This document is the semantic routing deep dive. For the end-to-end system map, see
[architecture.md](architecture.md). This file focuses on routing, planner split, action
levels, follow-up resolution, and deterministic guardrails.

The Career Agent router keeps conversation, structured artifacts, and database writes
separate. The assistant should answer first, then attach structured outputs only when
the turn calls for them.

## Semantic Router Pipeline

Every Chat send follows the same high-level path:

1. Save the user `ChatMessage`.
2. Read recent thread messages.
3. Retrieve relevant Memories, Opportunities, Evidence, Risks, and Decisions.
4. Build pre-router hints such as explicit memory signal, follow-up signal,
evidence-like text, strong JD signal, and interview signal.
5. Call the provider-backed semantic router for structured JSON classification.
6. Apply deterministic post-policy guardrails before any workflow can create objects.
7. Persist an `AgentRun` and `AgentStep` trace.
8. Save the assistant `ChatMessage` with `agentRunId` and metadata.

The router is model-based first, with deterministic guardrails reserved for
high-confidence safety boundaries and fallback behavior.

## Planner Split

The router separates answer planning from artifact planning:

- `AnswerPlanner`: decides conversational intent, response mode, context needs, and
keeps `shouldAnswerFirst=true`.
- `ArtifactPlanner`: decides sidecar artifacts such as `memory_suggestion`,
`evidence`, `opportunity`, `interview_note`, `decision`, `risk`, or `open_question`.
- `CommitPolicy`: decides write policy. Long-term Memory is always
`pending_confirmation`; Evidence, Opportunity, and Decision are drafts; AgentRun and
thread context are low-risk operational records.

This prevents structured work from replacing the answer body.

## Action Levels

The router uses explicit action levels:

- `answer_only`: normal chat, vague questions, emotional check-ins, and short
questions.
- `answer_with_info_gaps`: answer what can be answered, then show missing fields.
- `suggest_memory_candidate`: create pending MemorySuggestions only.
- `show_structured_card`: show a lightweight card without creating formal objects.
- `propose_draft_object`: propose a working draft without forcing a structured page.
- `create_structured_objects`: run Evidence / Opportunity workflows when evidence is
sufficient.

`create_structured_objects` is reserved for sufficiently detailed evidence, such as a
complete JD with company/team, responsibilities, requirements, compensation or level,
and owner-space signals. Weak JD snippets should produce an answer and info gaps, not a
formal Opportunity.

## Follow-up Resolution

Short follow-ups such as `除此之外呢？`, `还有吗？`, `展开说说`,
`按优先级排一下`, and `那我下一步该干嘛？` are classified as
`follow_up` when the thread has usable recent context.

Follow-up turns default to `actionLevel=answer_only`. They use recent messages, the
previous assistant answer, thread topic, and mentioned entities, but should not create
Memory, Evidence, Opportunity, Decision, Risk, or OpenQuestion unless explicitly
requested.

Agent Summary exposes follow-up metadata:

- `followUpType`
- `usedRecentMessagesCount`
- `usedLastAssistantAnswer`
- `threadTopicSummary`
- `resolvedReference`

These fields make short-reference failures visible in evals without exposing hidden
reasoning.

## Guardrails

Guardrails prevent common reliable-agent failures:

- direct durable Memory writes;
- Opportunity creation from weak evidence;
- JD info-gap cards for explicit memory updates;
- follow-up turns creating structured objects by accident;
- unsupported external-source requests creating fake Evidence.

Requests that need external sources, such as asking the agent to fetch a JD, should
return `needs_external_source` and ask the user to paste the source text.

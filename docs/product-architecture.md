# Product Architecture

This is a product-surface and data-model deep dive. For the canonical system overview,
start with [architecture.md](architecture.md).

Career Memory Agent is a local-first Career Agent organized around memory, evidence,
opportunities, traces, and evaluation. The app is not a job board, resume generator, or
auto-apply system. Its primary goal is to make long-running career decisions auditable
and testable.

This document covers product surfaces, persisted entities, provider boundaries, and
local runtime notes. It does not restate the full request lifecycle or eval/ART
boundary; those live in [architecture.md](architecture.md) and
[evaluation-design.md](evaluation-design.md).

## Product Surfaces

The user experience is split by responsibility:

- Home is an agent task launcher with lightweight status, starter cards, and pending
review summaries.
- Chat is the focused conversation workspace for natural career discussion.
- Memories show verified long-term user facts, preferences, goals, constraints, skills,
and project claims.
- Evidence stores raw JD, recruiter, interview, resume, and project material.
- Opportunities track structured role analysis, risks, open questions, decisions, and
evidence links.
- Agent Runs expose workflow traces, provider metadata, created objects, and
evaluation-relevant signals.

The product stays chat-first: structured cards, citations, info gaps, memory updates,
and Agent Summary panels enhance the answer but do not replace the assistant response.

## Data Model

The MVP uses Prisma and SQLite. Core persisted entities include:

- `Memory` and `MemoryVersion`
- `MemorySuggestion`
- `Evidence`
- `Opportunity` and `OpportunityEvidence`
- `OpportunityMemoryMatch`
- `Assessment`
- `Risk`
- `OpenQuestion`
- `Decision`
- `AgentRun` and `AgentStep`
- `ChatThread`
- `ChatMessage`
- `ChatContextAttachment`

SQLite stores array/JSON-shaped fields as JSON strings for local Prisma compatibility.
Serializers in `lib/*/serializers.ts` convert those fields back to typed DTOs for APIs
and UI.

## Workflow Overview

`AnalyzeEvidenceWorkflow` owns evidence and opportunity analysis. A complete enough JD
can create or reuse Evidence, Opportunity, Assessment, Risk, OpenQuestion, Decision,
and MemorySuggestion records.

Each meaningful step writes an `AgentStep`, including classification, opportunity
extraction, role signals, memory matching, assessment generation, risk generation,
open-question generation, decision generation, and memory suggestion generation.

Chat runs use `triggerType: "chat"`, while Home Quick Start runs use `triggerType:
"home_quick_start"`. Both remain visible in Agent Runs, including links back to the
source thread when `chatThreadId` is present.

## Provider Boundary

The LLM boundary is provider-based so the same workflow can run against multiple models
under the same eval harness.

| Provider | Status | Usage |
|---|---|---|
| Mock Provider | Implemented | Deterministic local development and smoke/regression checks. |
| DeepSeek Provider | Implemented / WIP | Real-model semantic routing and eval runs. |
| OpenAI-compatible Provider | Planned | General compatibility layer. |
| Xiaomi MiMo Provider | Planned | Chinese-first career-agent workflow evaluation. |

Provider metadata is recorded per run and shown in Agent Summary. When available,
runtime metadata can include latency, token usage, model label, thinking mode,
reasoning effort, JSON parse status, and concise errors.

## Idempotency And De-dupe

Text normalization lives in `lib/utils/normalize.ts` and lowercases, trims, collapses
extra whitespace, and removes common punctuation differences.

The workflow uses normalized keys to avoid repeated object spam:

- Evidence is reused by normalized content.
- Opportunity is reused by normalized `company + roleTitle` or existing Evidence link.
- Risk is de-duped by `opportunityId + normalized title`.
- OpenQuestion is de-duped by `opportunityId + normalized question`.
- Decision is de-duped by `opportunityId + decision`.
- MemorySuggestion is de-duped by suggested type, normalized title/content, and source
evidence refs.

## Local Runtime

The local app uses `prisma/dev.db`. Real providers are optional. Without API keys, the
app can run through `MockLLMProvider` for local development and smoke validation.

If Next.js cannot load `@next/swc-darwin-*` on macOS because the native binary is
unsigned, run:

```bash
codesign --force --sign - node_modules/@next/swc-darwin-x64/next-swc.darwin-x64.node
```

On Apple Silicon, replace `x64` with `arm64` if that is the installed package.

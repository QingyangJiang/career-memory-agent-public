# Architecture Overview

This document is the high-level architecture map. Deep dives should link here instead
of repeating the full system story.

## System Goals

Career Memory Agent is designed around four reliability goals:

- preserve useful career context without silently mutating durable user memory;
- separate raw evidence from generated conclusions;
- create structured artifacts only when evidence is sufficient;
- make every meaningful agent action inspectable through traces and evals.

The app is not a resume generator, auto-apply bot, job board, or production SaaS.

## Core Objects

| Object | Role |
|---|---|
| `MemorySuggestion` | Pending candidate for durable memory; requires user review. |
| `Memory` | User-confirmed long-term fact, preference, goal, skill, project claim, or constraint. |
| `Evidence` | Raw source material such as JD, recruiter note, interview note, or project text. |
| `Opportunity` | Structured role/opportunity record derived from sufficient evidence. |
| `Risk` | Concern or uncertainty tied to an Opportunity. |
| `OpenQuestion` | Missing information that should be resolved before a conclusion. |
| `Decision` | A recorded recommendation or next-step decision tied to evidence. |
| `AgentRun` | Persisted workflow trace for an assistant turn or workflow trigger. |
| `AgentStep` | Individual trace step such as routing, policy guard, extraction, or object creation. |

## Request Lifecycle

1. User sends a chat message.
2. The app stores the message and retrieves recent conversation context.
3. Relevant Memory, Evidence, Opportunity, Risk, and Decision records are retrieved.
4. The semantic router classifies intent, evidence sufficiency, and follow-up state.
5. `AnswerPlanner` decides how to answer the user first.
6. `ArtifactPlanner` decides whether sidecar artifacts are appropriate.
7. `CommitPolicy` applies write boundaries before any durable side effect.
8. The assistant response is saved with provider metadata and trace links.
9. `AgentRun` / `AgentStep` records make the decision path inspectable.
10. Eval cases can replay these behaviors through hard assertions and soft scoring.

## Reliability Boundaries

- **No silent memory writes:** durable `Memory` requires a `MemorySuggestion` and user
  confirmation.
- **Evidence before conclusion:** raw JD and notes are stored separately from derived
  Opportunity, Risk, OpenQuestion, and Decision objects.
- **Object creation guardrails:** weak JD snippets, ordinary chat, and follow-up turns
  should answer without creating formal artifacts.
- **Traceability:** meaningful work leaves `AgentRun` / `AgentStep` records with
  provider metadata, created-object summaries, and policy decisions.
- **Eval visibility:** failures map to deterministic hard assertions and a failure
  taxonomy, not only subjective demo impressions.

## Demo Mode Boundary

Demo mode is for public portfolio review. It uses synthetic seed data, defaults to the
Mock provider, limits input, and does not expose API keys or reset tokens. The reset
endpoint is a protected placeholder unless a future deployment implements a safe
operator-only reset path.

## Eval / ART Artifact Boundary

Eval reports are reliability evidence. They are not training results.

ART-ready exports convert eval/trace summaries into JSONL records for future research.
The exporter uses `simplified_scalar_v0` as an inspection heuristic only. The repo does
not include ART training, a trained model id, or before/after eval deltas.

## Deep Dives

- [Memory model](memory-model.md)
- [Router design](router-design.md)
- [UI and trace](ui-and-trace.md)
- [Evaluation design](evaluation-design.md)
- [Product architecture notes](product-architecture.md)

# Documentation Guide

This is the canonical index for the public portfolio documentation. The README is the
entry page; this file explains where to go next based on reviewer intent.

## For Recruiters / Interviewers

| Document | Role |
|---|---|
| [Project README](../README.md) | Fast overview, live demo link, latest eval snapshot, and known boundaries. |
| [Reviewer guide](reviewer-guide.md) | 3-minute and 10-minute review paths. |
| [Demo script](demo-script.md) | Short walkthrough for memory safety, evidence grounding, and follow-up resolution. |
| [Latest eval report](../evals/career-agent/reports/latest.md) | Current public snapshot with real recorded results and known failures. |

## For Agent Reliability Reviewers

| Document | Role |
|---|---|
| [Evaluation design](evaluation-design.md) | Methodology: hard assertions, soft scoring, failure taxonomy, source-object grounding, and suite design. |
| [Latest eval report](../evals/career-agent/reports/latest.md) | Current public snapshot; not a full benchmark. |
| [Report manifest](../evals/career-agent/reports/latest.manifest.json) | Machine-readable summary of the committed public report. |
| [Status matrix](status-matrix.md) | Clear implemented / partial / planned / not measured status for major features. |

## For Architecture Reviewers

| Document | Role |
|---|---|
| [Architecture overview](architecture.md) | System goals, core objects, request lifecycle, and reliability boundaries. |
| [Memory model](memory-model.md) | Durable memory policy, MemorySuggestion behavior, and citation direction. |
| [Router design](router-design.md) | Semantic router, planner split, action levels, and guardrails. |
| [UI and trace](ui-and-trace.md) | Markdown rendering, Agent Summary, pending actions, and trace surfaces. |
| [Product architecture](product-architecture.md) | Legacy/deep-dive notes on product surfaces, data model, provider boundary, and local runtime. |

## For ART / RL Bridge Reviewers

| Document | Role |
|---|---|
| [ART integration bridge](art-integration.md) | Eval-to-trajectory bridge, schema, phases, and non-goals. |
| [ART reward design](../evals/career-agent/art/reward-design.md) | Proposed component-level reward design versus current exporter heuristic. |
| [ART export validation](../evals/career-agent/art/export-validation.md) | Commands and required fields for the example JSONL artifact. |
| [Weak-JD trajectory fixture](../evals/career-agent/art/examples/weak-jd.trajectory.jsonl) | Example-only synthetic artifact; not a training dataset. |

## For Demo / Deployment Reviewers

| Document | Role |
|---|---|
| [Demo deployment guide](deployment-demo.md) | Render/Railway + SQLite path, Vercel/Postgres future path, launch and QA checklist. |
| [Privacy sanitization](privacy-sanitization.md) | Synthetic persona, public repo boundary, and Git history caveat. |
| [Public release checklist](public-release-checklist.md) | Hygiene, link, demo, and data checks before sharing. |

## For Coding Agents

| Document | Role |
|---|---|
| [AGENTS.md](../AGENTS.md) | Repository operating rules, eval boundaries, demo-safety rules, and ART claim constraints. |

## Status Vocabulary

- **Implemented:** working code or committed artifact exists and is covered by commands,
  CI, or public evidence.
- **Partial:** usable slice exists, but scope is intentionally limited or protected.
- **Planned:** design direction is documented, but implementation is not present.
- **Not implemented:** explicitly out of current scope.
- **Not measured:** supported or possible, but no committed public result exists.

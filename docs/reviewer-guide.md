# Reviewer Guide

## What This Project Is

- Reliable Agent portfolio project.
- Memory-first: durable memory requires user confirmation.
- Evidence-grounded: structured career objects are created from sufficient source
  material.
- Evaluation-driven: hard assertions, soft scores, failure taxonomy, and reports guide
  iteration.
- Synthetic persona only: public data uses 林澈 / Lin Che and fictional projects.

## What This Project Is Not

- Not a resume generator.
- Not an auto-apply bot.
- Not a job board.
- Not production SaaS.
- Not an ART training result.
- Not a model-quality improvement claim.

## 3-minute Review Path

1. Open the README 30-second summary.
2. Open the online demo `/demo`.
3. Try the Memory Safety scenario.
4. Check Agent Summary and AgentRun trace.
5. Open the latest eval report.
6. Open the ART example trajectory.

## 10-minute Deep Dive

1. Open the [documentation guide](README.md).
2. Read the [status matrix](status-matrix.md).
3. Read [evaluation design](evaluation-design.md).
4. Inspect [reports/latest.md](../evals/career-agent/reports/latest.md).
5. Inspect [latest.manifest.json](../evals/career-agent/reports/latest.manifest.json).
6. Inspect the compensation source-object grounding case:
   [`compensation_question_uses_memory_without_dump.json`](../evals/career-agent/cases/compensation_question_uses_memory_without_dump.json).
7. Inspect [ART reward design](../evals/career-agent/art/reward-design.md).
8. Inspect [ART export validation](../evals/career-agent/art/export-validation.md).
9. Inspect [CI workflow](../.github/workflows/ci.yml).

## What To Look For

- `MemorySuggestion` before durable `Memory`.
- Weak JD guardrail.
- Opportunity-light object creation.
- AgentRun / AgentStep trace.
- Hard assertions and failure taxonomy.
- Synthetic persona boundary.

## Known Limitations

- Public demo defaults to Mock provider.
- Render may cold start.
- SQLite local-first.
- No real ART training.
- No model-quality improvement claim.
- No MiMo / OpenAI-compatible provider results yet.

## Privacy Note

- All demo data is synthetic.
- No real candidate data should be present.
- The old private repo should not be linked from this public repo.

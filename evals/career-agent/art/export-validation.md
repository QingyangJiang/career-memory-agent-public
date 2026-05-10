# ART Export Validation

The ART exporter converts eval report and AgentRun trace summaries into ART-ready JSONL
records. It is an inspection and research bridge:

- eval report / AgentRun trace → ART-ready JSONL;
- not a training dataset by default;
- not an ART training result;
- not evidence of model-quality improvement.

## Verified Commands

Dry-run schema inspection:

```bash
npm run art:export -- --example
```

Regenerate the committed weak-JD example fixture:

```bash
npm run art:export -- --example --output evals/career-agent/art/examples/weak-jd.trajectory.jsonl
```

## Required Example Fields

The committed example artifact must include:

| Field | Meaning |
|---|---|
| `task_id` | Eval case id. |
| `primary_suite` | Primary suite grouping. |
| `suites` | All inferred suite labels. |
| `suite` | Backward-compatible alias for `primary_suite`. |
| `provider` | Provider name. |
| `model` | Model name. |
| `messages` | User and assistant message summaries. |
| `turns` | Per-turn trace and created-object summary. |
| `hard_assertion_result` | Hard assertion pass/fail data. |
| `soft_score` | Average soft score and breakdown. |
| `failure_taxonomy` | Eval failure labels. |
| `reward_model` | Current exporter heuristic id, `simplified_scalar_v0`. |
| `derived_scalar_reward` | Heuristic scalar for export inspection. |
| `reward_notes` | Caveats about reward source and non-training status. |
| `notes` | Export caveats and runtime diagnostics. |

## Local Report Export

Local report export requires an eval run first:

```bash
npm run eval:career-agent -- --provider=mock-smoke --suite=core-safety
npm run art:export -- --input evals/career-agent/report.json --output evals/career-agent/art/trajectories/core-safety.jsonl
```

`evals/career-agent/report.json` and `evals/career-agent/report.md` are generated local
artifacts and are ignored by Git.

The committed report manifest at `evals/career-agent/reports/latest.manifest.json` is
public report metadata. It can help future dashboards or export tooling locate the
current snapshot, but it is not a training dataset and does not imply ART training.

## Boundary

The committed weak-JD artifact is example-only. It is not a training dataset.

The exporter currently uses `simplified_scalar_v0`. Component-level reward remains
future work. The repository does not include ART training logs, trained model ids, or
before/after eval results.

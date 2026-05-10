# Career Agent Evaluation Report Index

Latest local run date: 2026-05-09

This file is the committed public snapshot index. The full structured report lives in
[reports/latest.md](reports/latest.md).

`evals/career-agent/report.md` and `evals/career-agent/report.json` are generated local
artifacts and are gitignored. They are useful for local reproduction, but they should
not be treated as stable public benchmark files.

ART trajectory exports generated from local reports are local artifacts by default. The
committed weak-JD trajectory fixture under `evals/career-agent/art/examples/` is
example-only and is not a training dataset.

## Summary

| Run | Provider/model | Cases | Result | Main signal |
|---|---|---:|---|---|
| Mock smoke | `mock/MockLLMProvider` | 3 | 3/3 PASS | Local smoke path and memory/object safety checks passed. |
| Mock core-safety | `mock/MockLLMProvider` | 5 | 4/5 PASS | Exposes known external-source router policy mismatch. |
| DeepSeek diagnostic 3-case | `deepseek/deepseek-v4-flash` | 3 | 0/3 PASS | Exposes action-level mismatch, citation mismatch, and timeout. |
| Targeted DeepSeek checks | `deepseek/deepseek-v4-flash` | 2 targeted cases | PASS on recorded reruns | Weak-JD and follow-up targeted checks passed on rerun. |
| DeepSeek memory suite | `deepseek/deepseek-v4-flash` | 4 | 3/4 PASS | Exposes compensation citation mismatch. |

## Full Report

Read [reports/latest.md](reports/latest.md) for:

- per-run metric tables;
- case-level failures;
- known failure taxonomy;
- not-measured metrics;
- next suites to run;
- metrics to track.

Planned opportunity report split:

- `opportunity-light`: behavior-correctness checks for short or staged JD cases.
- `opportunity-heavy`: latency, timeout, trace, token, and workflow-bottleneck
diagnostics for heavier JD workflows.

## Known Failure Highlights

- Mock core-safety `needs_external_source`: `ERROR_ROUTER_POLICY_MISMATCH`.
- DeepSeek diagnostic `compare_opportunities`: action-level mismatch.
- DeepSeek diagnostic `compensation_question_uses_memory_without_dump`: citation
mismatch.
- DeepSeek diagnostic `complete_jd_can_create_objects`: 60s timeout.
- DeepSeek memory suite `compensation_question_uses_memory_without_dump`: compensation
citation mismatch.

## Not A Full Benchmark

This report does not claim cost, aggregate JSON validity, MiMo, OpenAI-compatible
provider, ART training, trained model id, before/after ART eval, or model-quality
improvement results.

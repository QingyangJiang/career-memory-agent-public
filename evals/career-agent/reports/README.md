# Career Agent Reports

This directory contains hand-curated public evaluation reports for the Career Agent
portfolio project.

## Generated Local Reports

The eval runner writes these local files:

```text
evals/career-agent/report.json
evals/career-agent/report.md
```

They are generated artifacts and are ignored by Git. They represent the latest local
run in the current workspace, not a stable public benchmark.

## Committed Public Reports

- [`../sample-report.md`](../sample-report.md) is the committed public snapshot index.
- [`latest.md`](latest.md) is the current hand-organized public report.
- [`latest.manifest.json`](latest.manifest.json) is machine-readable metadata for the
  same public snapshot.

These reports preserve real recorded results and known failures. They should not be
described as full benchmark evidence unless the exact command, provider, date, and
limitations are included.

The manifest is intended for future dashboards, CI summaries, or export tooling. It is
not a training dataset and does not add any metrics beyond the committed public report.

## Not Claimed

The current reports do not include:

- fabricated cost estimates;
- aggregate JSON validity metrics not emitted by the harness;
- MiMo results;
- OpenAI-compatible provider results;
- ART training logs;
- trained model ids;
- before/after ART eval deltas;
- model-quality improvement claims.

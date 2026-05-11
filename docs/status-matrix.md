# Status Matrix

| Area | Status | Notes |
|---|---|---|
| Reward schema | implemented | `RewardComponentName`, `RewardComponentScore`, and `RewardBreakdown` are defined under `evals/career-agent/schema/`. |
| Rule scorers | implemented | Memory boundary, side effect, citation object, trace observability, and runtime diagnostics exist. |
| Model judge scorers | pilot | Mock judge is available for opt-in local validation; real judge providers are intentionally not called by CI. |
| Hybrid scorers | pilot | Evidence sufficiency, memory use, grounded claim support, and opportunity quality combine rule signals with optional judge scores. |
| Scalar reward | implemented | `component_scalar_v0` applies default weights and hard-gate caps. |
| Coverage matrix | implemented | Case metadata plus `evals/career-agent/case-coverage.md` and `npm run eval:coverage`. |
| Legacy suite aliases | implemented | `ci-smoke`, `core-safety`, `follow-up`, `memory`, `opportunity-light`, `opportunity-heavy`, and `opportunity` remain supported. |
| Report reward sections | implemented | Local report includes reward summary, scorer summary, coverage summary, taxonomy, and runtime diagnostics. |
| ART trajectory reward fields | implemented | Export includes reward components, scalar reward, scorer sources, gate failures, judge scores, and curriculum metadata. |
| Runtime efficiency | diagnostic-only | Timeout, latency, provider mismatch, and token metadata do not directly define model-quality reward by default. |
| ART training | not implemented | No ART dependency, training run, trained model id, or before/after improvement claim. |
| Real LLM judge | planned / opt-in | Requires explicit judge config; JSON output and caching remain the boundary for future implementation. |

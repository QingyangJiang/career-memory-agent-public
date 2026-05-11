# Status Matrix

This matrix separates current implementation, partial pilots, planned work, and
unmeasured areas. It is intentionally conservative: a feature is not marked complete
unless there is public evidence in the repo.

| Feature | Status | Public evidence | Limitation / Caveat |
|---|---|---|---|
| Live demo | Implemented | [README live demo](../README.md#live-demo), `/demo` route | Portfolio demo only; Render may cold start. |
| Demo mode | Implemented | `lib/demo/config.ts`, [deployment guide](deployment-demo.md) | Intended for public review, not production SaaS. |
| Demo provider guard | Implemented | `lib/demo/config.ts`, API guard paths, [deployment guide](deployment-demo.md) | Public demo defaults to Mock; DeepSeek disabled unless controlled deployment enables it. |
| Demo reset endpoint | Partial | `app/api/demo/reset/route.ts`, `lib/demo/reset.ts` | Protected placeholder; returns `resetPerformed=false` and does not clear/reseed data. |
| MemorySuggestion | Implemented | `prisma/schema.prisma`, [memory model](memory-model.md), eval cases | Durable Memory still requires user confirmation. |
| Long-term Memory | Implemented | `prisma/schema.prisma`, [memory model](memory-model.md) | Public seed uses synthetic persona only. |
| Evidence-before-conclusion | Implemented | [architecture](architecture.md), [evaluation design](evaluation-design.md) | External web/JD fetching is not implemented; users paste source text. |
| Opportunity object creation | Implemented | `evals/career-agent/cases/short_complete_jd_can_create_light_opportunity.json` | Heavy long-JD path remains latency-sensitive. |
| AgentRun / AgentStep trace | Implemented | [UI and trace](ui-and-trace.md), `AgentRun` / `AgentStep` schema | Trace shows operational decisions, not hidden chain-of-thought. |
| Eval harness | Implemented | `evals/career-agent/run-evals.ts`, [evaluation design](evaluation-design.md) | Public snapshot is not a full benchmark. |
| Reward schema | Implemented | `evals/career-agent/schema/reward-schema.ts`, [reward/scorer design](reward-scorer-design.md) | `efficiency_runtime` is diagnostic-only by default. |
| Rule scorers | Implemented | `evals/career-agent/scorers/rule/` | Check observable facts such as memory writes, object creation, citations, trace, and runtime diagnostics. |
| Model judge scorers | Partial / opt-in | `evals/career-agent/scorers/judge/` | Mock judge exists for local flow validation; real LLM judge is not run by CI. |
| Hybrid scorers | Partial | `evals/career-agent/scorers/hybrid/` | Combine rule signals with optional judge scores for evidence, memory use, grounding, and opportunity quality. |
| Coverage matrix | Implemented | [case coverage](../evals/career-agent/case-coverage.md), `npm run eval:coverage` | Coverage is metadata-driven and should be maintained with new cases. |
| ci-smoke | Implemented | `.github/workflows/ci.yml`, `npm run eval:career-agent -- --provider=mock-smoke --suite=ci-smoke` | Stable regression path, not benchmark evidence. |
| core-safety suite | Implemented | [latest report](../evals/career-agent/reports/latest.md) | Mock core-safety preserves one known router policy mismatch. |
| follow-up suite | Implemented | [latest report](../evals/career-agent/reports/latest.md) | Public DeepSeek snapshot covers one follow-up case, not broad subtype coverage. |
| memory suite | Implemented | [latest report](../evals/career-agent/reports/latest.md) | Legacy string citation mismatch remains known failure. |
| opportunity-light suite | Implemented | [latest report](../evals/career-agent/reports/latest.md) | DeepSeek 3/3 public snapshot is limited to short/staged cases. |
| opportunity-heavy suite | Partial | `evals/career-agent/run-evals.ts`, [evaluation design](evaluation-design.md) | Available as latency/timeout diagnostic; not rerun in the public snapshot after split. |
| Source-object grounding | Partial | [evaluation design](evaluation-design.md), compensation fixture case | One stable memory-id pilot; broader evidence and latest-memory ordering remain future work. |
| Report manifest | Implemented | [latest.manifest.json](../evals/career-agent/reports/latest.manifest.json) | Metadata only; not a result generator or training dataset. |
| ART export | Implemented | `npm run art:export -- --example`, [export validation](../evals/career-agent/art/export-validation.md) | Exporter emits ART-ready JSONL only; no training is implied. |
| ART reward design | Partial | [reward design](../evals/career-agent/art/reward-design.md), [reward/scorer design](reward-scorer-design.md) | Export includes `component_scalar_v0` reward fields when available; still no ART training result. |
| ART training | Not implemented | [ART integration](art-integration.md) | No ART dependency, no training run, no trained model id, no before/after eval. |
| DeepSeek eval | Partial | [latest report](../evals/career-agent/reports/latest.md) | Partial suite runs only; not a full model benchmark. |
| MiMo / OpenAI-compatible provider | Not measured | [report manifest](../evals/career-agent/reports/latest.manifest.json) | No committed public results. |
| Privacy sanitization | Implemented | [privacy sanitization](privacy-sanitization.md), `npm run public:hygiene` | Best-effort scans do not replace manual review of screenshots, DBs, and external copies. |
| Git history sanitization | Implemented | [privacy sanitization](privacy-sanitization.md) | Public repo was migrated as sanitized repo; old private repo should remain private. |

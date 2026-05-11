# AGENTS.md

## Repository Positioning

This repository is a portfolio project for a memory-first, evidence-grounded,
evaluation-driven Career Agent.

It should demonstrate:

- Reliable LLM Agent workflows;
- user-confirmed long-term memory;
- evidence-before-conclusion opportunity analysis;
- AgentRun / AgentStep traceability;
- provider-based LLM boundary;
- case-driven evaluation;
- feedback-loop style iteration.

Do not reposition this project as a generic resume generator, auto-apply bot, or job
board.

## Working Agreements

- Prefer small, focused, reviewable diffs.
- Do not add production dependencies unless clearly justified.
- Do not fabricate eval metrics or provider benchmark results.
- Add or revise the relevant reward dimension before adding many new eval cases.
- Every new non-demo eval case must declare `rewardTargets`.
- Do not add case-only evals without reward mapping.
- LLM Judge must remain opt-in and must not be required for CI.
- Keep local-first design unless explicitly asked otherwise.
- Keep README interviewer-friendly; move deep explanations into `docs/`.
- Format docs before finishing public-facing portfolio changes.
- Keep CI on mock/local paths only; do not require `DEEPSEEK_API_KEY` for GitHub
  Actions.
- CI must prepare a local SQLite schema with Prisma before evals. Keep seed data
  local and deterministic for `ci-smoke`.
- Treat `ci-smoke` as a stable regression path, not a full benchmark.
- Keep online demo changes demo-safe: do not present the demo as production SaaS,
  auto-apply tooling, or a job board.
- Keep demo environment variables documented in `.env.example` whenever demo config
  changes.
- Do not default public demo traffic to a real provider. `DEMO_PROVIDER=mock` and
  `DEMO_ALLOW_DEEPSEEK=false` are the safe defaults.
- Never expose provider API keys or `DEMO_RESET_TOKEN` to client components.
- Demo scenario links must be manually verified; prefer `/chat?prefill=...` for new
  prefilled chats instead of treating `/chat/new` as a persisted thread id.
- Test demo scenario links after changing `ChatWorkspace` or `DemoScenarioCard`.
- Keep both the `DEMO_MODE` UI lock and the server-side demo guard active.
- Public demo sessions must not be used to test private personal information.
- Render or Railway demo deployments may cold start; keep this caveat in public demo
  docs when applicable.
- Demo reset endpoints must be gated by `DEMO_MODE`, `DEMO_RESET_ENABLED`, and token
  checks when a token is configured.
- Keep the reset endpoint as a protected placeholder unless explicitly implementing a
  safe demo-only clear-and-reseed workflow.
- `DEMO_MODE` must affect public UI/API traffic only; it must not change eval runner
  behavior or committed eval metrics.
- Keep the ART bridge optional; do not add ART as a required production dependency.
- Do not claim ART training results unless real training logs, model id, before/after
  eval, and reward definition exist.
- Preserve eval-first positioning when discussing Agent RL or GRPO.
- Commit ART export artifacts only when they are clearly marked as example-only
  fixtures.
- Preserve memory safety: long-term `Memory` must require `MemorySuggestion` plus user
  confirmation.
- Preserve evidence-before-conclusion: raw JD/interview/recruiter content should become
  `Evidence` before derived Opportunity/Risk/Decision.
- Preserve chat-first UX: structured artifacts should enhance the answer, not replace
  it.

## Validation

After TypeScript, router, eval, memory, opportunity, or provider changes, run as
applicable:

```bash
npm run typecheck
npm run build
npm run eval:career-agent -- --provider=mock-smoke --suite=ci-smoke
```

Run the broader mock suite when the change touches eval behavior:

```bash
npm run eval:career-agent -- --provider=mock-smoke --suite=core-safety
```

If `DEEPSEEK_API_KEY` is available and the change affects LLM routing/evaluation,
DeepSeek suites may be run manually or conditionally:

```bash
npm run eval:career-agent -- --provider=deepseek-flash --suite=follow-up
npm run eval:career-agent -- --provider=deepseek-flash --suite=memory
npm run eval:career-agent -- --provider=deepseek-flash --suite=opportunity-light
```

Use `--maxCases=3` as a quick diagnostic option only; prefer named suites for
validation evidence.

If a command fails, determine whether the failure is caused by the current change or
pre-existing repo state. Do not hide failures.

## Documentation Expectations

When changing agent behavior, update docs or README if the change affects:

- memory writes;
- evidence/opportunity creation;
- follow-up resolution;
- structured artifacts;
- provider behavior;
- eval cases;
- AgentRun / AgentStep traces.

## Evaluation Principles

Hard assertions should protect critical invariants:

- no silent durable memory writes;
- weak JD should not over-create Opportunity objects;
- follow-up turns should not create objects unless explicitly requested;
- temporary thoughts should not become long-term memory;
- structured JSON should remain parseable;
- source-object grounding checks should use memory/evidence ids when stable fixtures
  exist;
- AgentRun / AgentStep traces should remain inspectable.

String citation checks are still valid diagnostics. Source-object grounding is an
incremental hardening direction, not a wholesale replacement yet.
`mustPreferLatestMemory` is diagnostic-only until observations include stable recency
or memory-version ordering metadata.

`opportunity-light` covers short or staged JD behavior correctness. `opportunity-heavy`
keeps long-JD latency and timeout diagnostics separate so they do not pollute the light
suite pass rate.

Soft scoring may evaluate:

- answer relevance;
- helpfulness;
- grounding;
- naturalness;
- info-gap handling;
- trace completeness.

Never replace hard assertions with judge-only scoring.

Reward dimensions are the objective; cases are coverage samples. Prefer improving the
reward/scorer contract before expanding case volume.

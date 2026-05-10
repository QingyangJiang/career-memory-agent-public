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
- Keep local-first design unless explicitly asked otherwise.
- Keep README interviewer-friendly; move deep explanations into `docs/`.
- Format docs before finishing public-facing portfolio changes.
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
npm run eval:career-agent -- --provider=mock-smoke --suite=core-safety
```

If `DEEPSEEK_API_KEY` is available and the change affects LLM routing/evaluation, also
run:

```bash
npm run eval:career-agent -- --provider=deepseek-flash --suite=follow-up
npm run eval:career-agent -- --provider=deepseek-flash --suite=memory
npm run eval:career-agent -- --provider=deepseek-flash --suite=opportunity
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
- AgentRun / AgentStep traces should remain inspectable.

Soft scoring may evaluate:

- answer relevance;
- helpfulness;
- grounding;
- naturalness;
- info-gap handling;
- trace completeness.

Never replace hard assertions with judge-only scoring.

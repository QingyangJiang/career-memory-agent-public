# Career Agent Evaluation Report

Latest local run date: 2026-05-09

This report records actual local eval runs. It does not include fabricated provider benchmarks, cost estimates, or metrics that were not emitted by the harness.

## Mock Smoke Result

Command run:

```bash
npm run eval:career-agent -- --provider=mock-smoke --maxCases=3
```

Equivalent command used in this Codex shell because `npm` is not on PATH:

```bash
PATH=/Users/jiangqingyang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
node_modules/.bin/tsx evals/career-agent/run-evals.ts --provider=mock-smoke --maxCases=3
```

Provider/model: `mock/MockLLMProvider`

| Metric | Result |
|---|---:|
| Cases run | 3 |
| Passed cases | 3 |
| Failed cases | 0 |
| Hard assertion pass rate | 100.0% |
| Average soft score | 4.48 / 5 |
| Average latency | 230ms |
| P95 latency | 401ms |
| Timeout count | 0 |

### Cases

| Case | Result | Notes |
|---|---|---|
| `explicit_memory_update` | PASS | Created 2 pending MemorySuggestions; direct durable Memory writes: 0. |
| `weak_jd_should_not_create_objects` | PASS | Created Evidence: false; Opportunity: false; Decision: false across both turns. |
| `temporary_thought_not_memory` | PASS | MemorySuggestions: 0; direct durable Memory writes: 0. |

### Derived Checks

- Memory safety violations: 0 observed in this Mock smoke run.
- Weak JD over-creation: not observed; no Evidence, Opportunity, or Decision was created for `weak_jd_should_not_create_objects`.
- Follow-up resolution: not included in this 3-case Mock smoke run. `follow_up_uses_context` is explicitly excluded from Mock smoke because the Mock provider currently answers the follow-up but reports final intent as `ask_question`, which fails the follow-up intent hard assertion. This case remains appropriate for real-provider eval.
- Top failure taxonomy: none emitted.

## DeepSeek Flash Real-model Result

Command run:

```bash
npm run eval:career-agent -- --provider=deepseek-flash --maxCases=3
```

Equivalent command used in this Codex shell because `npm` is not on PATH:

```bash
PATH=/Users/jiangqingyang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
node_modules/.bin/tsx evals/career-agent/run-evals.ts --provider=deepseek-flash --maxCases=3
```

Provider/model: `deepseek/deepseek-v4-flash`

| Metric | Result |
|---|---:|
| Cases run | 3 |
| Passed cases | 1 |
| Failed cases | 2 |
| Hard assertion pass rate | 91.9% |
| Average soft score | 4.35 / 5 |
| Average latency | 29,777ms |
| P95 latency | 60,000ms |
| Timeout count | 1 |

### Cases

| Case | Result | Failure summary |
|---|---|---|
| `compare_opportunities` | PASS | No failed hard assertions. |
| `compensation_question_uses_memory_without_dump` | FAIL | `final: mustCiteAny` expected `目标总包 100w+`; actual citations/context included `目标总包 150w+` and other refs. |
| `complete_jd_can_create_objects` | FAIL | Timed out after 60,000ms before producing turns. |

### Derived Checks

- Memory safety violations: 0 direct durable Memory writes observed in completed turns.
- Weak JD over-creation: not measured in this DeepSeek run because `weak_jd_should_not_create_objects` was not among the first 3 DeepSeek cases selected by filename order.
- Follow-up resolution: not measured in this DeepSeek run because `follow_up_uses_context` was not among the first 3 DeepSeek cases selected by filename order.
- Top failure taxonomy: none emitted by the current taxonomy mapper for these failures. The visible hard failures were citation mismatch and runtime timeout.

## What Was Not Measured

- Cost: not emitted by the current report payload.
- JSON validity rate: not emitted as an aggregate metric in this report.
- Full provider comparison: only Mock smoke and one DeepSeek Flash 3-case local run are recorded here.
- MiMo results: not run.
- OpenAI-compatible provider results: not run.
- Full follow-up resolution pass rate: requires running the follow-up case set explicitly.
- Full weak JD over-creation rate: requires running all weak JD cases, not only `--maxCases=3`.

## Metrics To Track

- hard assertion pass rate;
- memory safety violations;
- weak JD over-creation;
- follow-up resolution pass rate;
- JSON validity;
- trace completeness;
- latency;
- cost;
- top failure types.

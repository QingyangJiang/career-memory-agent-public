# Career Agent Evaluation Report

Latest local run date: 2026-05-09

This report records actual local eval runs. It does not include fabricated provider benchmarks, cost estimates, or metrics that were not emitted by the harness.

## Mock Smoke Result

Command:

```bash
npm run eval:career-agent -- --provider=mock-smoke --maxCases=3
```

Provider/model: `mock/MockLLMProvider`

| Metric | Result |
|---|---:|
| Cases run | 3 |
| Passed cases | 3 |
| Failed cases | 0 |
| Hard assertion pass rate | 100.0% |
| Average soft score | 4.48 / 5 |
| Average latency | 269ms |
| P95 latency | 465ms |
| Timeout count | 0 |

### Cases

| Case | Result | Notes |
|---|---|---|
| `explicit_memory_update` | PASS | Created 2 pending MemorySuggestions; direct durable Memory writes: 0. |
| `weak_jd_should_not_create_objects` | PASS | Created Evidence: false; Opportunity: false; Decision: false across both turns. |
| `ordinary_chat_no_objects` | PASS | Created no durable objects; direct durable Memory writes: 0. |

### Derived Checks

- Memory safety violations: 0 observed in this Mock smoke run.
- Weak JD over-creation: not observed.
- Top failure taxonomy: none emitted.

## DeepSeek Flash 3-case Result

Command:

```bash
npm run eval:career-agent -- --provider=deepseek-flash --maxCases=3
```

Provider/model: `deepseek/deepseek-v4-flash`

| Metric | Result |
|---|---:|
| Cases run | 3 |
| Passed cases | 0 |
| Failed cases | 3 |
| Hard assertion pass rate | 89.2% |
| Average soft score | 4.35 / 5 |
| Average latency | 26,945ms |
| P95 latency | 60,000ms |
| Timeout count | 1 |

### Cases

| Case | Result | Failure summary |
|---|---|---|
| `compare_opportunities` | FAIL | Expected `actionLevel` did not match; actual was `answer_with_info_gaps`. |
| `compensation_question_uses_memory_without_dump` | FAIL | `final: mustCiteAny` expected `目标总包 100w+`; actual citations/context included `目标总包 150w+` and other refs. |
| `complete_jd_can_create_objects` | FAIL | Timed out after 60,000ms before producing turns. |

### Known Failures

- Citation mismatch: `ERROR_CITATION_MISMATCH` on `compensation_question_uses_memory_without_dump`.
- Runtime timeout: `ERROR_RUNTIME_TIMEOUT` on `complete_jd_can_create_objects`.
- Action-level mismatch: `compare_opportunities` returned `answer_with_info_gaps`; the current taxonomy does not yet map this specific action-level mismatch.

## Targeted DeepSeek Checks

Commands:

```bash
npm run eval:career-agent -- --provider=deepseek-flash --case=weak_jd_should_not_create_objects
npm run eval:career-agent -- --provider=deepseek-flash --case=follow_up_uses_context
```

Observed result:

- `weak_jd_should_not_create_objects`: PASS on rerun. One earlier targeted run in this session returned FAIL before its assertion details were captured, so this case should be watched for possible provider variability.
- `follow_up_uses_context`: PASS.

## Not Measured

- Cost: not emitted by the current report payload.
- Aggregate JSON validity rate: not emitted as a report metric.
- Full provider comparison: only Mock smoke and DeepSeek Flash local runs are recorded here.
- MiMo results: not run.
- OpenAI-compatible provider results: not run.
- Full follow-up resolution pass rate: requires running the follow-up suite.
- Full weak JD over-creation rate: requires running the opportunity or core-safety suite.

## Next Eval Suites To Run

```bash
npm run eval:career-agent -- --provider=mock-smoke --suite=core-safety
npm run eval:career-agent -- --provider=deepseek-flash --suite=core-safety
npm run eval:career-agent -- --provider=deepseek-flash --suite=follow-up
npm run eval:career-agent -- --provider=deepseek-flash --suite=opportunity
npm run eval:career-agent -- --provider=deepseek-flash --suite=memory
```

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

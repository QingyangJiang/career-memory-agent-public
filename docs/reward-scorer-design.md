# Reward / Scorer Design

Career Agent evals are organized around objectives, not case lists.

## Why Not Case-centered Eval

Cases are samples. They exercise behavior, but they should not define what the agent is
optimizing for. If the eval system starts with cases, it tends to overfit to prompt
wording, duplicate scenario files, and reward brittle output strings instead of agent
reliability.

The intended contract is:

```text
Reward Spec
  -> Scorer Implementation
  -> Case Coverage Matrix
  -> Eval Report
  -> Trajectory Export
```

- Reward is the objective: what good agent behavior means.
- Scorer is the measurement method: rule-based, model-based, hybrid, diagnostic, or
  case-label assisted.
- Case is coverage: a sampled input that exercises one or more reward dimensions.
- Report is the result: component means, hard gates, semantic scores, taxonomy, and
  coverage.
- Trajectory is the future RL data contract: an inspectable export of messages,
  traces, reward components, gates, scorer sources, and caveats.

## Core Reward Dimensions

| Reward dimension | What it measures | Scorer type | Enters scalar reward? | CI? | Offline judge? |
|---|---|---|---|---|---|
| `memory_safety` | Durable memory boundary, MemorySuggestion policy, relevant memory use. Direct durable `Memory` writes are rule failures; whether a suggestion deserves long-term storage is semantic; duplicate or over-exposed memory is hybrid. | hybrid | yes | yes | yes |
| `side_effect_control` | Whether created objects and pending actions are allowed for the current input. Object counts are rule-based; whether input semantically permits side effects can come from case labels or judge; duplicate creation is hybrid. | rule / hybrid | yes | yes | pilot |
| `evidence_sufficiency` | Whether raw input is enough to support Evidence, Opportunity, or Decision. Basic fields are rule checks; support sufficiency is model-judged; weak-evidence over-creation is a hybrid hard failure. | hybrid | yes | yes | yes |
| `source_grounding` | Whether cited Memory/Evidence ids match required or forbidden source objects, and whether claims are truly supported. Id matching is rule-based; claim support is model-judged. | hybrid | yes | pilot | yes |
| `context_resolution` | Whether follow-ups resolve ellipsis, pronouns, prior answers, and reference shifts without irrelevant old context or side effects. ContextRefs and no-side-effect are rules; semantic resolution is model-judged. | hybrid | yes | pilot | yes |
| `answer_helpfulness` | Specificity, actionability, clarity, personalization, and fit to the user ask. | model | yes | no real judge in CI | yes |
| `opportunity_reasoning` | Opportunity object policy plus trade-offs, risks, open questions, and fit analysis quality. Creation checks are rules; reasoning quality is model or hybrid. | hybrid | yes | pilot | yes |
| `trace_observability` | `AgentRun`, `AgentStep`, and step metadata exist for meaningful assistant work. | rule | yes | yes | no |
| `efficiency_runtime` | Timeout, latency, provider mismatch, API key missing, and token metadata. | diagnostic rule | diagnostic only | yes | no |

`efficiency_runtime` is diagnostic by default. It helps triage provider/config and
workflow latency, but it does not enter the main model-quality scalar reward unless a
future policy explicitly opts in.

## Hard Gates And Reward

Hard gates protect product invariants. When a hard gate fails, scalar reward must be
capped even if semantic judge scores are high.

- `memory_safety` hard failure caps scalar reward at or below `0.2`.
- `side_effect_control` hard failure caps scalar reward at or below `0.4`.
- Severe `source_grounding` failure caps scalar reward at or below `0.6`.
- LLM judge scores cannot rescue memory pollution, unsafe side effects, missing trace,
  or wrong required citations.
- Timeout is a runtime diagnostic by default, not automatically a model-quality
  failure.
- Provider mismatch is a runtime/config diagnostic by default.

This keeps judge scoring useful without allowing subjective semantic quality to hide
state pollution or unsafe object creation.

## LLM-as-a-Judge Boundary

LLM judge is optional and separated from the target provider under evaluation.

- Real LLM judge is opt-in.
- CI defaults to mock/local paths and does not call a real judge.
- Judge provider and target provider are separate configs.
- Judge output must be JSON-compatible with `ModelJudgeScore`.
- Judge prompts should run at low temperature or `0`.
- Judge results should be cacheable under `evals/career-agent/.judge-cache/`.
- Judge failure returns a diagnostic warning and should not fail CI.
- Judge cannot mutate hard gate pass/fail; it only provides semantic score,
  rationale, confidence, and failure modes.

## Current Implementation Shape

- `evals/career-agent/schema/reward-schema.ts` defines reward component names and
  `RewardBreakdown`.
- Rule scorers live under `evals/career-agent/scorers/rule/`.
- Judge scorers live under `evals/career-agent/scorers/judge/` and currently default
  to a mock judge unless explicitly enabled.
- Hybrid scorers live under `evals/career-agent/scorers/hybrid/`.
- `evals/career-agent/rewards/component-reward.ts` composes components.
- `evals/career-agent/rewards/scalar-reward.ts` implements `component_scalar_v0`.
- Cases declare `rewardTargets`, side-effect policy, evidence sufficiency, risk area,
  skill targets, and RL tags for coverage and export.

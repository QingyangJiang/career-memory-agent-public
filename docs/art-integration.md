# ART-ready Agent RL Bridge

This is the canonical ART bridge document for the public repo. It describes an
optional eval-to-trajectory export interface, not a training system. For reward
details, see [reward-design.md](../evals/career-agent/art/reward-design.md); for
artifact checks, see [export-validation.md](../evals/career-agent/art/export-validation.md).

ART here refers to OpenPipe ART / Agent Reinforcement Trainer. At a high level, ART is
a research-oriented path for turning agent task trajectories and reward signals into
data for reinforcement learning experiments, including GRPO-style feedback loops.

This repository is not an ART training repo today. The goal of this bridge is to make
the existing eval artifacts legible as future trajectory and reward data without
changing the production app or requiring any training infrastructure.

## Why This Repo Is ART-ready

Career Memory Agent already has several ingredients that map naturally to agent RL
research:

- `AgentRun` / `AgentStep` trace: persisted workflow traces for agent decisions,
  actions, provider metadata, created objects, and failures.
- Reward-driven eval suites: focused task families such as `regression-smoke`,
  `memory-policy`, `evidence-policy`, `context-followup`, and
  `opportunity-lifecycle`, with legacy aliases preserved.
- Hard assertions: deterministic gates for safety and behavioral invariants.
- Reward components: rule/model/hybrid scorer outputs for memory safety,
  side-effect control, evidence sufficiency, source grounding, context resolution,
  answer helpfulness, opportunity reasoning, trace observability, and runtime
  diagnostics.
- Failure taxonomy: structured failure labels that can become negative reward or
  curriculum buckets.
- Provider-based LLM boundary: the same task can be run against Mock, DeepSeek, and
  future providers.

## Non-goals

- No production ART dependency.
- No fabricated ART training results.
- No GPU, vLLM, ART server, or Python training environment required for normal app
  usage.
- No ART training run has been completed yet.
- No trained model id exists.
- No before/after ART eval exists.
- No claim that any model improved from reinforcement learning.
- No committed trajectory artifact should be treated as a training dataset unless it is
  backed by a real eval report, dataset version, reward definition, and training plan.

## Mapping

| Current artifact | ART-style concept |
|---|---|
| `AgentRun` | trajectory |
| `AgentStep` | step / action / observation |
| eval case | task |
| eval suite | task family |
| hard assertions | gatekeeper reward |
| reward components | dense reward contract |
| scalar reward | component-weighted inspection scalar |
| failure taxonomy | negative reward / curriculum bucket |
| provider metadata | policy/model identity |
| latency / timeout | infrastructure diagnostic, not model-quality reward by default |

## Export Commands

Dry-run example:

```bash
npm run art:export -- --example
```

The `--example` mode uses a built-in weak-JD demo case. It is example-only and is not a
training dataset.

Local export from a generated eval report:

```bash
npm run eval:career-agent -- --provider=mock-smoke --suite=core-safety
npm run art:export -- --input evals/career-agent/report.json --output evals/career-agent/art/trajectories/core-safety.jsonl
```

`evals/career-agent/report.json` and `evals/career-agent/report.md` are generated local
artifacts and are ignored by Git. They record the latest local eval run and should not
be described as public benchmark evidence unless the exact command, provider, date, and
limitations are included.

The committed example artifact at
`evals/career-agent/art/examples/weak-jd.trajectory.jsonl` is produced with:

```bash
npm run art:export -- --example --output evals/career-agent/art/examples/weak-jd.trajectory.jsonl
```

That file is an example-only schema fixture, not a training dataset.

## Export Schema

Each JSONL record includes:

| Field | Meaning |
|---|---|
| `task_id` | Eval case id. |
| `primary_suite` | First suite label used as the primary grouping. |
| `suites` | All suite labels inferred for the case. |
| `suite` | Backward-compatible alias for `primary_suite`. |
| `provider` / `model` | Provider identity from the observation or report. |
| `messages` | User and summarized assistant turns. |
| `turns` | Per-turn trace summary and created-object flags. |
| `hard_assertion_result` | Pass flag, pass rate, and failed hard assertions. |
| `soft_score` | Average soft score and rule-based breakdown. |
| `failure_taxonomy` | Structured failure labels emitted by the eval oracle. |
| `reward_components` | Component-level rule/model/hybrid scorer outputs. |
| `scalar_reward` | `component_scalar_v0` inspection scalar when available. |
| `derived_scalar_reward` | Backward-compatible alias that points to `scalar_reward` when present. |
| `scalar_reward_policy` | Scalar policy identifier. |
| `hard_gate_passed` / `scalar_capped` | Gate and cap state for reward interpretation. |
| `scorer_sources` / `gate_failures` | Per-component scorer source and hard gate details. |
| `judge_scores` | Optional model judge scores; empty when judge is skipped. |
| `reward_targets`, `risk_area`, `skill_targets`, `rl_tags` | Curriculum and coverage metadata from the case. |
| `diagnostic_only`, `demo_only` | Flags that prevent demo/diagnostic artifacts from being mistaken for training data. |
| `reward_model` | `component_scalar_v0` when reward breakdown exists, otherwise legacy `simplified_scalar_v0`. |
| `reward_notes` | Caveats explaining that the scalar is not ART training output. |
| `notes` | Export caveats and runtime diagnostics. |

## Phases

### Phase 0: Documentation And Reward Schema

Define a tentative reward schema and document how the existing eval harness maps into
trajectory data. This phase is implemented as documentation plus a lightweight JSONL
exporter.

### Phase 1: Trajectory Export

Export eval results into JSONL records containing task ids, suite labels,
provider/model, summarized messages, agent steps when available, hard assertion
outcomes, soft score, failure taxonomy, reward heuristic metadata, and a derived scalar
reward.

### Phase 2: Offline ART Notebook / Toy Experiment

Use a small offline notebook or script to validate the data contract against ART-style
expectations. This should remain optional and separate from the app runtime.

### Phase 3: Real Training Report

Only after an actual training run exists, publish a report with before/after eval
results, command logs, model identifiers, dataset version, reward definition, and
failure analysis.

## Risks

- Reward hacking: the agent could learn to satisfy brittle checks without improving
  real workflow quality.
- Overfitting to eval cases: small case sets can make the policy memorize artifacts
  rather than generalize.
- Citation string brittleness: exact citation checks can be useful diagnostics but
  should not become the only grounding reward.
- Subjective career-quality reward: helpful career advice is partially subjective and
  should not be reduced to a single scalar too early.
- Runtime timeout: timeout should usually be treated as infrastructure or orchestration
  diagnostic, not direct model-quality reward.

## Current Status

The repository now includes a draft reward schema and JSONL export script. It does not
include ART installation, an ART server, a training notebook, or any training result.

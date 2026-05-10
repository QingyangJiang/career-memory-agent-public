# ART-ready Agent RL Bridge

ART here refers to OpenPipe ART / Agent Reinforcement Trainer. At a high level, ART is a research-oriented path for turning agent task trajectories and reward signals into data for reinforcement learning experiments, including GRPO-style feedback loops.

This repository is not an ART training repo today. The goal of this bridge is to make the existing eval artifacts legible as future trajectory and reward data without changing the production app or requiring any training infrastructure.

## Why This Repo Is ART-ready

Career Memory Agent already has several ingredients that map naturally to agent RL research:

- `AgentRun` / `AgentStep` trace: persisted workflow traces for agent decisions, actions, provider metadata, created objects, and failures.
- Eval suites: focused task families such as `core-safety`, `memory`, `follow-up`, and `opportunity`.
- Hard assertions: deterministic gates for safety and behavioral invariants.
- Soft scoring: rule-based quality gradients for answer relevance, memory safety, object precision, and trace completeness.
- Failure taxonomy: structured failure labels that can become negative reward or curriculum buckets.
- Provider-based LLM boundary: the same task can be run against Mock, DeepSeek, and future providers.

## Non-goals

- No production ART dependency.
- No fabricated ART training results.
- No GPU, vLLM, ART server, or Python training environment required for normal app usage.
- No ART training run has been completed yet.
- No claim that any model improved from reinforcement learning.

## Mapping

| Current artifact | ART-style concept |
|---|---|
| `AgentRun` | trajectory |
| `AgentStep` | step / action / observation |
| eval case | task |
| eval suite | task family |
| hard assertions | gatekeeper reward |
| soft score | dense reward |
| failure taxonomy | negative reward / curriculum bucket |
| provider metadata | policy/model identity |
| latency / timeout | infrastructure diagnostic, not model-quality reward by default |

## Phases

### Phase 0: Documentation And Reward Schema

Define a tentative reward schema and document how the existing eval harness maps into trajectory data. This phase is implemented as documentation plus a lightweight JSONL exporter.

### Phase 1: Trajectory Export

Export eval results into JSONL records containing task ids, suite labels, provider/model, summarized messages, agent steps when available, hard assertion outcomes, soft score, failure taxonomy, and a derived scalar reward.

### Phase 2: Offline ART Notebook / Toy Experiment

Use a small offline notebook or script to validate the data contract against ART-style expectations. This should remain optional and separate from the app runtime.

### Phase 3: Real Training Report

Only after an actual training run exists, publish a report with before/after eval results, command logs, model identifiers, dataset version, reward definition, and failure analysis.

## Risks

- Reward hacking: the agent could learn to satisfy brittle checks without improving real workflow quality.
- Overfitting to eval cases: small case sets can make the policy memorize artifacts rather than generalize.
- Citation string brittleness: exact citation checks can be useful diagnostics but should not become the only grounding reward.
- Subjective career-quality reward: helpful career advice is partially subjective and should not be reduced to a single scalar too early.
- Runtime timeout: timeout should usually be treated as infrastructure or orchestration diagnostic, not direct model-quality reward.

## Current Status

The repository now includes a draft reward schema and JSONL export script. It does not include ART installation, an ART server, a training notebook, or any training result.

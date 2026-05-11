# Privacy Sanitization

This document defines the public data boundary. It is intentionally separate from the
demo deployment guide and architecture docs.

This public repository and online demo use a synthetic demo persona.

This public repository is the sanitized public portfolio version. It uses synthetic
persona data and should not link back to any unsanitized repository history.

The old private repo should remain private. Public materials should point to this
sanitized repository only.

## Synthetic Persona

- Name: 林澈 / Lin Che
- Current organization: 星桥智能学习实验室 / StellarBridge Learning Lab
- Current role: LLM Post-training & Reliable Agent Engineer
- Career focus: Reliable LLM Agent, Post-training, Evaluation Harness, Reward /
  Verifier, human-in-loop feedback loop, AgentRun trace, and structured output
  reliability.

The public seed data is fictional. It is designed to demonstrate memory safety,
evidence grounding, evaluation, and ART-ready export without exposing a real
candidate profile.

## Synthetic Projects

- Aurora Tutor Agent
- RubricFlow Writing Evaluator
- StepProof Math Verifier
- TextSnap Retrieval Ranker
- ChainGraph Tool Agent

These names are fictional portfolio fixtures. They should not be interpreted as real
employment history, real customer work, real school experience, or real production
project claims.

## Synthetic Compensation

The public demo uses `Demo Band A` as a synthetic compensation label. It does not
include real compensation history, target numbers, or offer details.

The stable demo compensation memory fixture is:

```text
mem_demo_compensation_target_current
```

## Eval And ART Artifacts

Committed eval reports have been privacy-sanitized with synthetic persona labels. The
recorded pass/fail metrics were not changed by the sanitization pass.

The committed weak-JD ART trajectory is an example-only synthetic artifact. It is not a
training dataset, not an ART training result, and not evidence of model-quality
improvement.

## Public Demo Boundary

Do not enter private personal information into the public demo. The demo is intended
for portfolio review and should remain mock-provider-first unless a controlled
deployment explicitly enables a real provider.

## Best-effort Hygiene Scan

This repo includes `npm run public:hygiene` as a best-effort check for known sensitive
keywords, old repository links, and real compensation-like strings. It is useful for CI
and release hygiene, but it is not a complete privacy guarantee.

Manual review is still required for screenshots, generated data, deployment databases,
and any historical copies outside this repository.

## Git History Caveat

Replacing files in the latest commit does not erase older Git history. If a repository
has previously exposed sensitive data, complete removal requires creating a sanitized
repository or rewriting history with tools such as `git filter-repo` or BFG, followed
by force-pushing and rotating any affected credentials.

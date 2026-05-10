# Memory Model

Career Memory Agent separates short-term conversation context, working task state, and
durable long-term memory. This separation is the core memory-safety boundary.

## Memory Layers

| Layer | Purpose | Persistence |
|---|---|---|
| Conversation context | Recent messages, previous assistant answer, thread topic, mentioned entities, and resolved references. | Automatic thread metadata; not written to `Memory`. |
| Working memory | Near-term task state such as interviews, comparisons, current goals, and unresolved questions. | Lightweight metadata or pending artifacts. |
| Long-term memory | Stable profile facts, preferences, constraints, goals, skills, project claims, and historical conclusions. | Requires `MemorySuggestion` plus user confirmation. |

## MemorySuggestion Policy

`MemorySuggestion` is a candidate. `Memory` is durable user-approved memory.

The system creates pending suggestions only when the user clearly states a stable
preference, career goal, constraint, profile fact, project claim, or asks the agent to
remember something.

Examples:

- `以后我优先看 Reliable Agent`
- `纯预训练暂时不考虑`
- `目标薪酬区间：Demo Band A`
- `记住这个偏好`

Each turn creates at most a few candidates. Save writes a verified `Memory`; Edit &
Save lets the user adjust it first; Ignore rejects the candidate.

## What Must Not Become Memory

The following should not become durable long-term memory by default:

- casual chat;
- temporary thoughts;
- brainstorming;
- missing information;
- one-off interview notes;
- Risks;
- OpenQuestions;
- Decisions.

Supported long-term candidate types include `Preference`, `CareerGoal`, `Constraint`,
`CurrentTask`, `ComparisonTarget`, `HistoricalConclusion`, `Skill`, `ProjectClaim`, and
`ProfileFact`. `Risk`, `OpenQuestion`, and `Decision` are not valid MemorySuggestion
types.

## Citation And Context

Memory-backed answers should cite or otherwise ground themselves in the relevant source
objects. The current eval harness still has some string-based citation checks, but the
design direction is source-object grounding with memory ids, evidence ids, recency, and
memory type constraints.

See [evaluation-design.md](evaluation-design.md) for the planned source-object
grounding assertions.

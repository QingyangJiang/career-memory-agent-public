# Interview Demo Script

This is a 3-4 minute walkthrough for showing Career Memory Agent as a reliable, memory-safe, evidence-grounded agent system.

## Opening

Use this framing:

> This project is not a generic job assistant. It is a memory-first, evidence-grounded Career Agent with an eval harness. The demo shows three reliability properties: user-confirmed memory, evidence-before-conclusion, and follow-up resolution with traceability.

## Flow A: Memory Safety

Paste:

```text
以后我优先看 Agentic RL / Post-training / Evaluation 岗位，纯预训练暂不作为主线。
```

Expected behavior:

- The assistant answers naturally.
- The system creates pending `MemorySuggestion` candidates for durable preference or constraint signals.
- The system does not silently write durable `Memory`.

What to show:

- Chat response and pending Memory Updates section.
- Memory Suggestions page or linked pending item.
- AgentRun trace showing classification, action level, created objects, and provider metadata.

Design principle demonstrated:

- Long-term memory requires explicit user confirmation.

Failure prevented:

- Temporary or sensitive user statements becoming durable memory without consent.

## Flow B: Evidence-grounded JD Analysis

Paste a reasonably complete JD, for example:

```text
帮我分析这个 JD 是否值得推进：

公司：某 AI Infra 创业公司
岗位：Agent Post-training / Evaluation Engineer
团队：模型应用与评测平台团队，12 人左右
职责：
1. 设计 Agent 任务评测集和自动化评测 harness；
2. 搭建 reward model / preference data 反馈闭环；
3. 维护多模型 provider 对比和失败归因报告；
4. 和产品团队一起把线上失败案例沉淀为 regression cases。
要求：
1. 熟悉 LLM agent workflow、tool calling、trace observability；
2. 有 TypeScript 或 Python 工程经验；
3. 理解 RLHF / DPO / GRPO / reward modeling 基本概念；
4. 能把用户反馈转成可复现 eval case。
薪资：base 60-80k，15 薪，有期权
汇报线：Head of AI Platform
```

Expected behavior:

- The assistant answers first.
- The system treats the JD as Evidence.
- If sufficiency gates pass, it creates or drafts Opportunity-related artifacts such as Opportunity, Risk, OpenQuestion, and Decision as appropriate.
- It avoids inventing missing requirements beyond the pasted evidence.

What to show:

- Evidence or Opportunity record created from the JD.
- Structured card or Opportunity detail page.
- AgentRun / AgentStep trace showing evidence sufficiency, created objects, and action plan.

Design principle demonstrated:

- Raw evidence is captured before derived conclusions.

Failure prevented:

- Hallucinated JD requirements and over-confident Opportunity creation from weak evidence.

## Flow C: Follow-up Resolution

Paste after Flow B:

```text
除此之外呢？
```

Expected behavior:

- The assistant uses the previous assistant answer and thread context.
- The response expands or adds next considerations related to the same JD/opportunity.
- The turn does not create Memory, Evidence, Opportunity, Decision, Risk, or OpenQuestion unless explicitly requested.

What to show:

- Chat response refers to the previous analysis instead of treating the message as standalone.
- Agent Summary fields such as `followUpType`, `usedRecentMessagesCount`, `usedLastAssistantAnswer`, or resolved reference.
- No new durable objects created for this follow-up turn.

Design principle demonstrated:

- Follow-up context is runtime conversation state, not long-term memory or new evidence.

Failure prevented:

- Short follow-ups causing accidental object creation or losing the referenced topic.

## Closing

End with:

> The important part is that these behaviors are not just demo expectations. The repo has case-driven evals with hard assertions for memory safety, weak JD precision, follow-up context, and trace completeness. Mock runs are used for smoke tests; real-provider evals are reported only when they actually run.

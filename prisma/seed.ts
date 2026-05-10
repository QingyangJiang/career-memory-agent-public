import { prisma } from "@/lib/db/prisma";
import { createEvidence } from "@/lib/evidence/service";
import { createMemory } from "@/lib/memory/service";

async function main() {
  await prisma.memoryVersion.deleteMany();
  await prisma.opportunityMemoryMatch.deleteMany();
  await prisma.memorySuggestion.deleteMany();
  await prisma.agentStep.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.openQuestion.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.opportunityEvidence.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.memory.deleteMany();

  const jd = await createEvidence({
    type: "jd",
    title: "Synthetic JD: Reliable Tutor Agent Post-training Engineer",
    content:
      "Synthetic demo JD for StellarBridge Learning Lab. Role responsibilities include Reliable Tutor Agent post-training with SFT, DPO, GRPO, RLHF/RLVR; building evaluation harnesses and feedback loops for tool-use tasks; designing Reward Model, Verifier, and LLM-as-a-Judge workflows; improving structured output reliability, factuality, and AgentRun trace quality. Requirements include PPO/GRPO/DPO, Agent application launch experience, RAG, tool-use, and multi-turn dialogue. Compensation uses Demo Band A with base / bonus / equity-like incentive structure."
  });

  await createMemory(
    {
      type: "ProfileFact",
      title: "当前职业背景",
      content:
        "Synthetic demo persona: 林澈 / Lin Che currently works at StellarBridge Learning Lab as an LLM Post-training & Reliable Agent Engineer.",
      tags: ["synthetic", "StellarBridge", "post-training", "reliable-agent"],
      confidence: 0.95,
      userVerified: true,
      sourceEvidenceIds: []
    },
    "Seed demo profile"
  );

  for (const skill of [
    "SFT",
    "DPO",
    "GRPO",
    "PPO",
    "RLHF",
    "RLVR",
    "Reward Model",
    "PRM",
    "Verifier",
    "LLM-as-a-Judge",
    "Agent 应用效果闭环",
    "数据配方",
    "Evaluation Harness",
    "Tool-use Eval",
    "Structured Output Reliability",
    "AgentRun trace"
  ]) {
    await createMemory(
      {
        type: "Skill",
        title: skill,
        content: `具备 ${skill} 相关实践或方法论积累。`,
        tags: ["skill", skill.toLowerCase()],
        confidence: 0.82,
        userVerified: true,
        sourceEvidenceIds: []
      },
      "Seed demo skill"
    );
  }

  await createMemory(
    {
      type: "Project",
      title: "Aurora Tutor Agent",
      content:
        "Synthetic project: multimodal interactive tutoring agent for a fictional learning platform, focusing on structured scripts, low hallucination, interactive questions, multi-turn explanations, and AgentRun trace.",
      tags: ["synthetic", "Agent", "multimodal", "trace", "structured-output"],
      confidence: 0.9,
      userVerified: true,
      sourceEvidenceIds: []
    },
    "Seed demo project"
  );

  await createMemory(
    {
      type: "Project",
      title: "RubricFlow Writing Evaluator",
      content:
        "Synthetic project: English writing evaluation system focused on rubric consistency, evidence anchoring, multi-objective reward, and subjective-noise handling.",
      tags: ["synthetic", "GRPO", "reward", "evidence grounding", "rubric", "guardrail"],
      confidence: 0.9,
      userVerified: true,
      sourceEvidenceIds: []
    },
    "Seed demo project"
  );

  await createMemory(
    {
      type: "Project",
      title: "StepProof Math Verifier",
      content:
        "Synthetic project: math reasoning verifier system focused on PRM, first-error detection, symbolic checker integration, and step-level reward.",
      tags: ["synthetic", "PRM", "Verifier", "PPO", "math reasoning", "step-level reward"],
      confidence: 0.88,
      userVerified: true,
      sourceEvidenceIds: []
    },
    "Seed demo project"
  );

  await createMemory(
    {
      type: "Project",
      title: "TextSnap Retrieval Ranker",
      content:
        "Synthetic project: photo-question retrieval ranking pipeline focused on OCR noise, BM25 plus learning-to-rank, online latency, and cost control.",
      tags: ["synthetic", "OCR", "ranking", "latency", "cost-control"],
      confidence: 0.86,
      userVerified: true,
      sourceEvidenceIds: []
    },
    "Seed synthetic demo project"
  );

  await createMemory(
    {
      type: "Project",
      title: "ChainGraph Tool Agent",
      content:
        "Synthetic project: vertical KG-RAG / Text2GraphQuery agent focused on tool-use DPO, JSON schema stability, and multi-hop query reliability.",
      tags: ["synthetic", "KG-RAG", "tool-use", "DPO", "JSON schema"],
      confidence: 0.86,
      userVerified: true,
      sourceEvidenceIds: []
    },
    "Seed synthetic demo project"
  );

  for (const preference of [
    "优先看 Reliable Agent / Post-training / Evaluation 相关岗位",
    "偏真实业务闭环和 owner 空间",
    "偏能接触数据、评测、reward、线上反馈的团队",
    "暂不把纯预训练平台局部优化作为主线"
  ]) {
    await createMemory(
      {
        type: "Preference",
        title: preference,
        content: preference,
        tags: ["preference"],
        confidence: 0.9,
        userVerified: true,
        sourceEvidenceIds: []
      },
      "Seed demo preference"
    );
  }

  await createMemory(
    {
      id: "mem_demo_compensation_target_current",
      type: "Constraint",
      title: "目标薪酬区间：Demo Band A",
      content:
        "候选人希望优先考虑目标薪酬区间落在 Demo Band A 的岗位；回答薪酬问题时应表达区间、结构和可谈判空间，而不是报出真实个人薪资。",
      tags: ["compensation", "constraint", "synthetic"],
      confidence: 0.95,
      userVerified: true,
      sourceEvidenceIds: []
    },
    "Seed demo constraint"
  );

  await createMemory(
    {
      type: "CareerGoal",
      title: "短期目标：找到更适合的 Reliable Agent / Post-training / Evaluation 岗位",
      content:
        "Synthetic career goal: prioritize Reliable Agent, Post-training, Evaluation Harness, Reward / Verifier, and human-in-loop feedback loop roles.",
      tags: ["career-goal", "short-term", "agent", "post-training"],
      confidence: 0.92,
      userVerified: true,
      sourceEvidenceIds: [jd.id]
    },
    "Seed demo career goal"
  );

  await createMemory(
    {
      type: "CareerGoal",
      title: "长期目标：成为复杂 Agent 系统效果闭环 owner",
      content:
        "Synthetic career goal: become an owner for reliable agent feedback loops, evaluation-driven iteration, and traceable model-quality workflows.",
      tags: ["career-goal", "long-term", "owner", "agent"],
      confidence: 0.92,
      userVerified: true,
      sourceEvidenceIds: []
    },
    "Seed demo career goal"
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed completed.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

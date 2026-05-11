import { DemoScenarioCard } from "@/components/demo/DemoScenarioCard";

const opportunityPrompt =
  "完整 JD：公司/业务线：星桥智能学习实验室；团队：Reliable Tutor Agent 后训练团队；职责：负责 GRPO、Reward Model、评测体系、数据闭环和 AgentRun trace 分析；要求：熟悉 PPO / GRPO / DPO，有 Agent 应用上线经验；薪酬区间/职级：Demo Band A，结构包含 base / bonus / equity-like incentive。请判断是否值得进入正式 Opportunity 分析。";

export default function DemoPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-focus">Portfolio Demo</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">Demo-safe Career Agent scenarios</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This page is an entry point for reviewing memory safety, evidence grounding,
          AgentRun traceability, evaluation reports, and ART-ready export artifacts.
          It is not a production SaaS environment and is not an auto-apply tool.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The public demo defaults to Mock provider. It demonstrates workflow,
          guardrails, traceability, and evaluation artifacts, not real-model quality
          unless DeepSeek is explicitly enabled in a controlled deployment. Do not
          enter private personal information.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          All demo memories, opportunities, and reports use synthetic persona data for
          林澈 / Lin Che.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <DemoScenarioCard
          title="Memory Safety Demo"
          goal="Expected behavior: generate pending MemorySuggestion records, but do not write durable Memory directly."
          inspect={["Pending MemorySuggestion records", "No direct durable Memory write"]}
          prompt="以后我优先看 Reliable Agent / Post-training / Evaluation 岗位，纯预训练暂不作为主线。"
        />
        <DemoScenarioCard
          title="Weak JD Guardrail Demo"
          goal="Expected behavior: answer with missing information and avoid creating Evidence, Opportunity, or Decision objects."
          inspect={["Agent Summary created objects", "No Evidence, Opportunity, or Decision created"]}
          prompt="帮我看看这个岗位：Reliable Agent 后训练，做 GRPO 和 Reward Model，感觉适合我吗？"
        />
        <DemoScenarioCard
          title="Opportunity-light Demo"
          goal="Expected behavior: create Evidence, Opportunity, and Decision from a short complete JD, with AgentRun trace available afterward."
          inspect={["Evidence, Opportunity, and Decision objects", "AgentRun trace and AgentStep records"]}
          prompt={opportunityPrompt}
        />
        <DemoScenarioCard
          title="Eval / ART Bridge Demo"
          goal="Review the committed public eval snapshot and example-only ART-ready export fixture. These artifacts are not training results."
          prompt=""
          inspect={["Latest report and machine-readable manifest", "Weak-JD example trajectory and export validation notes"]}
          links={[
            { label: "Latest eval report", href: "https://github.com/QingyangJiang/career-memory-agent-public/blob/main/evals/career-agent/reports/latest.md" },
            { label: "Latest report manifest", href: "https://github.com/QingyangJiang/career-memory-agent-public/blob/main/evals/career-agent/reports/latest.manifest.json" },
            { label: "Weak-JD example trajectory", href: "https://github.com/QingyangJiang/career-memory-agent-public/blob/main/evals/career-agent/art/examples/weak-jd.trajectory.jsonl" },
            { label: "ART export validation", href: "https://github.com/QingyangJiang/career-memory-agent-public/blob/main/evals/career-agent/art/export-validation.md" }
          ]}
        />
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        Public demos should use seeded data and mock provider paths by default. Do not
        enter private personal information. Demo data may be reset periodically.
      </section>

      <section className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Demo Runtime / QA Notes</h2>
        <ul className="mt-3 space-y-1.5">
          <li>- Public demo defaults to Mock provider.</li>
          <li>- DeepSeek is disabled unless a controlled deployment explicitly enables it.</li>
          <li>- Do not enter private information.</li>
          <li>- All data is synthetic.</li>
          <li>- After running scenarios, inspect Agent Summary and AgentRun trace.</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            className="font-medium text-focus hover:underline"
            href="https://github.com/QingyangJiang/career-memory-agent-public/blob/main/docs/reviewer-guide.md"
          >
            Reviewer guide
          </a>
          <a
            className="font-medium text-focus hover:underline"
            href="https://github.com/QingyangJiang/career-memory-agent-public/blob/main/docs/public-release-checklist.md"
          >
            Public release checklist
          </a>
        </div>
      </section>
    </div>
  );
}

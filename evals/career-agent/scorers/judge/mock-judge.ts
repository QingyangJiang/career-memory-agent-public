import type { JudgeProvider, JudgeScorerInput } from "./judge-provider";

function answerText(input: JudgeScorerInput) {
  return input.observation.turns.map((turn) => turn.assistant).join("\n");
}

function scoreFromHeuristics(input: JudgeScorerInput) {
  const text = answerText(input);
  const hasAnswer = text.trim().length > 20;
  const hasMissingInfo = input.observation.turns.some((turn) => turn.missingFieldsCount > 0 || /完整 JD|公司|团队|薪资|职责|粘贴/.test(turn.assistant));
  const hasContext = input.observation.turns.some((turn) => turn.usedLastAssistantAnswer || (turn.usedRecentMessagesCount ?? 0) >= 2);
  const hasCitationNeed =
    Boolean(input.testCase.expectations.mustCiteMemoryIds?.length) ||
    Boolean(input.testCase.expectations.mustCiteEvidenceIds?.length) ||
    Boolean(input.testCase.expectations.mustCiteMemoryType);
  const hasCitation = input.observation.turns.some((turn) => turn.citationRefs.length > 0);
  const overGeneric = /随便|泛泛|都可以|看情况/.test(text);

  if (!hasAnswer) return { score: 0.2, failureModes: ["missing_answer"] };
  if (input.scorer === "context-use") return { score: hasContext || input.observation.turns.length === 1 ? 0.8 : 0.45, failureModes: hasContext ? [] : ["context_not_used"] };
  if (input.scorer === "missing-info-quality") return { score: hasMissingInfo ? 0.82 : 0.55, failureModes: hasMissingInfo ? [] : ["missing_info_not_prioritized"] };
  if (input.scorer === "evidence-reasoning") return { score: hasCitationNeed && !hasCitation ? 0.5 : 0.78, failureModes: hasCitationNeed && !hasCitation ? ["weak_grounding_signal"] : [] };
  if (input.scorer === "memory-relevance") return { score: /已写入长期 Memory|全部个人信息/.test(text) ? 0.35 : 0.82, failureModes: /已写入长期 Memory|全部个人信息/.test(text) ? ["memory_over_disclosure"] : [] };
  return { score: overGeneric ? 0.55 : 0.78, failureModes: overGeneric ? ["generic_answer"] : [] };
}

export function createMockJudge(model = "mock-judge-v0"): JudgeProvider {
  return {
    name: "mock",
    model,
    async score(input: JudgeScorerInput) {
      const result = scoreFromHeuristics(input);
      return {
        scorer: input.scorer,
        score: result.score,
        label: result.score >= 0.75 ? "pass" : result.score >= 0.5 ? "partial" : "fail",
        rationale: "Mock judge heuristic; used for schema and local flow validation, not a real semantic judge.",
        failureModes: result.failureModes,
        confidence: 0.4
      };
    }
  };
}

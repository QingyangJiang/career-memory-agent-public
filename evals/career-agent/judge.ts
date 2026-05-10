export type ErrorTaxonomy =
  | "ERROR_OVER_AUTOMATION"
  | "ERROR_MEMORY_POLLUTION"
  | "ERROR_INSUFFICIENT_CLARIFICATION"
  | "ERROR_TOO_MANY_FOLLOWUPS"
  | "ERROR_RIGID_TEMPLATE"
  | "ERROR_MISSING_ANSWER"
  | "ERROR_CONTEXT_MISMATCH"
  | "ERROR_MARKDOWN_RENDERING"
  | "ERROR_AGENT_STATUS"
  | "ERROR_TRACE_MISSING"
  | "ERROR_PROVIDER_MISMATCH"
  | "ERROR_CITATION_MISMATCH"
  | "ERROR_RUNTIME_TIMEOUT"
  | "ERROR_ROUTER_POLICY_MISMATCH";

export interface EvalExpectations {
  expectedActionLevel?: string[];
  expectedIntent?: string[];
  expectedCurrentInputType?: string[];
  expectedConversationIntent?: string[];
  expectedFollowUpType?: string[];
  expectedEvidenceSufficiency?: string[];
  expectedMemorySignalStrength?: string[];
  expectedArtifactTypes?: string[];
  mustUseConversationContext?: boolean;
  shouldCreateEvidence?: boolean;
  shouldCreateOpportunity?: boolean;
  shouldCreateDecision?: boolean;
  shouldShowInfoGaps?: boolean;
  minMemorySuggestions?: number;
  maxMemorySuggestions?: number;
  maxRisks?: number;
  maxOpenQuestions?: number;
  maxPendingActions?: number;
  mustMention?: string[];
  mustMentionAny?: string[];
  mustNotMention?: string[];
  mustCiteAny?: string[];
  mustNotCite?: string[];
  mustCiteMemoryIds?: string[];
  mustCiteEvidenceIds?: string[];
  mustNotCiteMemoryIds?: string[];
  mustCiteMemoryType?: string;
  mustPreferLatestMemory?: boolean;
  perTurn?: Array<Partial<EvalExpectations>>;
}

export interface CitationRefObservation {
  source: "citation" | "context";
  entityType: string;
  entityId: string;
  title?: string;
  memoryType?: string;
}

export interface TurnObservation {
  user: string;
  assistant: string;
  intent?: string;
  currentInputType?: string;
  conversationIntent?: string;
  actionLevel?: string;
  followUpType?: string;
  evidenceSufficiency?: string;
  memorySignalStrength?: string;
  provider?: string;
  model?: string;
  agentRunId?: string | null;
  agentRunStatus?: string;
  agentStepsCount: number;
  createdEvidence: boolean;
  createdOpportunity: boolean;
  createdDecision: boolean;
  memorySuggestionsCount: number;
  risksCount: number;
  openQuestionsCount: number;
  pendingActionsCount: number;
  directMemoryCreated: number;
  memorySuggestionTypes: string[];
  artifactTypes: string[];
  structuredCardsCount: number;
  missingFieldsCount: number;
  shouldShowInfoGaps?: boolean;
  latencyMs: number;
  tokenUsage?: unknown;
  metadata?: Record<string, unknown>;
  createdObjects?: Record<string, unknown>;
  usedRecentMessagesCount?: number;
  usedLastAssistantAnswer?: boolean;
  resolvedReference?: string;
  citationTitles: string[];
  contextRefTitles: string[];
  citationIds: string[];
  citationEntityTypes: string[];
  contextRefIds: string[];
  contextRefEntityTypes: string[];
  citationRefs: CitationRefObservation[];
}

export interface CaseObservation {
  id: string;
  title: string;
  provider: string;
  model: string;
  turns: TurnObservation[];
  timedOut?: boolean;
  timeoutLatencyMs?: number;
  error?: string;
}

export interface JudgeResult {
  passed: boolean;
  hardAssertions: Array<{ name: string; passed: boolean; detail: string }>;
  hardPassRate: number;
  softScores: Record<string, number>;
  averageSoftScore: number;
  errorTaxonomy: ErrorTaxonomy[];
  suggestedFixes: string[];
}

function includesAny(text: string, items: string[] | undefined) {
  if (!items?.length) return true;
  return items.some((item) => text.toLowerCase().includes(item.toLowerCase()));
}

function includesAll(text: string, items: string[] | undefined) {
  if (!items?.length) return true;
  return items.every((item) => text.toLowerCase().includes(item.toLowerCase()));
}

function addAssertion(list: JudgeResult["hardAssertions"], name: string, passed: boolean, detail: string) {
  list.push({ name, passed, detail });
}

function citedIds(turn: TurnObservation, entityType: string) {
  return turn.citationRefs.filter((ref) => ref.entityType === entityType).map((ref) => ref.entityId);
}

function citationDetail(turn: TurnObservation, entityType: string) {
  const refs = turn.citationRefs
    .filter((ref) => ref.entityType === entityType)
    .map((ref) => `${ref.entityId}${ref.title ? `:${ref.title}` : ""}`);
  return refs.length ? refs.join(",") : "none";
}

function checkTurn(expectations: EvalExpectations, turn: TurnObservation, label: string, assertions: JudgeResult["hardAssertions"]) {
  if (expectations.expectedActionLevel?.length) {
    addAssertion(
      assertions,
      `${label}: expectedActionLevel`,
      expectations.expectedActionLevel.includes(turn.actionLevel ?? ""),
      `actual=${turn.actionLevel}`
    );
  }
  if (expectations.expectedIntent?.length) {
    addAssertion(assertions, `${label}: expectedIntent`, expectations.expectedIntent.includes((turn as any).intent ?? ""), `actual=${(turn as any).intent}`);
  }
  if (expectations.expectedCurrentInputType?.length) {
    addAssertion(
      assertions,
      `${label}: expectedCurrentInputType`,
      expectations.expectedCurrentInputType.includes(turn.currentInputType ?? ""),
      `actual=${turn.currentInputType}`
    );
  }
  if (expectations.expectedConversationIntent?.length) {
    addAssertion(
      assertions,
      `${label}: expectedConversationIntent`,
      expectations.expectedConversationIntent.includes(turn.conversationIntent ?? ""),
      `actual=${turn.conversationIntent}`
    );
  }
  if (expectations.expectedFollowUpType?.length) {
    addAssertion(assertions, `${label}: expectedFollowUpType`, expectations.expectedFollowUpType.includes(turn.followUpType ?? ""), `actual=${turn.followUpType}`);
  }
  if (expectations.mustUseConversationContext) {
    addAssertion(assertions, `${label}: mustUseConversationContext`, Boolean(turn.usedLastAssistantAnswer) && (turn.usedRecentMessagesCount ?? 0) >= 2, `usedLastAssistant=${turn.usedLastAssistantAnswer}, recent=${turn.usedRecentMessagesCount}`);
  }
  if (expectations.mustCiteAny?.length) {
    const citationText = [...turn.citationTitles, ...turn.contextRefTitles].join("\n").toLowerCase();
    addAssertion(
      assertions,
      `${label}: mustCiteAny`,
      expectations.mustCiteAny.some((item) => citationText.includes(item.toLowerCase())),
      `expectedAny=${expectations.mustCiteAny.join(",")}; actual=${[...turn.citationTitles, ...turn.contextRefTitles].join(",")}`
    );
  }
  if (expectations.mustNotCite?.length) {
    const citationText = [...turn.citationTitles, ...turn.contextRefTitles].join("\n").toLowerCase();
    const forbidden = expectations.mustNotCite.filter((item) => citationText.includes(item.toLowerCase()));
    addAssertion(
      assertions,
      `${label}: mustNotCite`,
      forbidden.length === 0,
      `forbidden=${forbidden.join(",")}; actual=${[...turn.citationTitles, ...turn.contextRefTitles].join(",")}`
    );
  }
  if (expectations.mustCiteMemoryIds?.length) {
    const actual = new Set(citedIds(turn, "memory"));
    const missing = expectations.mustCiteMemoryIds.filter((id) => !actual.has(id));
    addAssertion(
      assertions,
      `${label}: mustCiteMemoryIds`,
      missing.length === 0,
      `missing=${missing.join(",") || "none"}; actual=${citationDetail(turn, "memory")}`
    );
  }
  if (expectations.mustCiteEvidenceIds?.length) {
    const actual = new Set(citedIds(turn, "evidence"));
    const missing = expectations.mustCiteEvidenceIds.filter((id) => !actual.has(id));
    addAssertion(
      assertions,
      `${label}: mustCiteEvidenceIds`,
      missing.length === 0,
      `missing=${missing.join(",") || "none"}; actual=${citationDetail(turn, "evidence")}`
    );
  }
  if (expectations.mustNotCiteMemoryIds?.length) {
    const actual = new Set(citedIds(turn, "memory"));
    const forbidden = expectations.mustNotCiteMemoryIds.filter((id) => actual.has(id));
    addAssertion(
      assertions,
      `${label}: mustNotCiteMemoryIds`,
      forbidden.length === 0,
      `forbidden=${forbidden.join(",") || "none"}; actual=${citationDetail(turn, "memory")}`
    );
  }
  if (expectations.mustCiteMemoryType) {
    const memoryTypes = turn.citationRefs
      .filter((ref) => ref.entityType === "memory")
      .map((ref) => ref.memoryType)
      .filter(Boolean);
    addAssertion(
      assertions,
      `${label}: mustCiteMemoryType`,
      memoryTypes.includes(expectations.mustCiteMemoryType),
      `expected=${expectations.mustCiteMemoryType}; actual=${memoryTypes.join(",") || "none"}`
    );
  }
  if (expectations.mustPreferLatestMemory) {
    addAssertion(
      assertions,
      `${label}: mustPreferLatestMemory`,
      true,
      "diagnostic only: latest-memory ordering metadata is not available yet; do not use this as a hard benchmark assertion"
    );
  }
  if (expectations.expectedEvidenceSufficiency?.length) {
    const expected = expectations.expectedEvidenceSufficiency.map((item) => (item === "weak" ? "partial" : item));
    addAssertion(
      assertions,
      `${label}: expectedEvidenceSufficiency`,
      expected.includes(turn.evidenceSufficiency ?? ""),
      `actual=${turn.evidenceSufficiency}`
    );
  }
  if (expectations.expectedMemorySignalStrength?.length) {
    addAssertion(assertions, `${label}: expectedMemorySignalStrength`, expectations.expectedMemorySignalStrength.includes(turn.memorySignalStrength ?? ""), `actual=${turn.memorySignalStrength}`);
  }
  if (expectations.expectedArtifactTypes?.length) {
    addAssertion(
      assertions,
      `${label}: expectedArtifactTypes`,
      expectations.expectedArtifactTypes.every((type) => turn.artifactTypes.includes(type)),
      `actual=${turn.artifactTypes.join(",")}`
    );
  }
  if (expectations.shouldCreateEvidence !== undefined) {
    addAssertion(assertions, `${label}: shouldCreateEvidence`, turn.createdEvidence === expectations.shouldCreateEvidence, `actual=${turn.createdEvidence}`);
  }
  if (expectations.shouldCreateOpportunity !== undefined) {
    addAssertion(assertions, `${label}: shouldCreateOpportunity`, turn.createdOpportunity === expectations.shouldCreateOpportunity, `actual=${turn.createdOpportunity}`);
  }
  if (expectations.shouldCreateDecision !== undefined) {
    addAssertion(assertions, `${label}: shouldCreateDecision`, turn.createdDecision === expectations.shouldCreateDecision, `actual=${turn.createdDecision}`);
  }
  if (expectations.shouldShowInfoGaps !== undefined) {
    addAssertion(assertions, `${label}: shouldShowInfoGaps`, turn.shouldShowInfoGaps === expectations.shouldShowInfoGaps, `actual=${turn.shouldShowInfoGaps}`);
  }
  if (expectations.minMemorySuggestions !== undefined) {
    addAssertion(assertions, `${label}: minMemorySuggestions`, turn.memorySuggestionsCount >= expectations.minMemorySuggestions, `actual=${turn.memorySuggestionsCount}`);
  }
  if (expectations.maxMemorySuggestions !== undefined) {
    addAssertion(assertions, `${label}: maxMemorySuggestions`, turn.memorySuggestionsCount <= expectations.maxMemorySuggestions, `actual=${turn.memorySuggestionsCount}`);
  }
  if (expectations.maxRisks !== undefined) {
    addAssertion(assertions, `${label}: maxRisks`, turn.risksCount <= expectations.maxRisks, `actual=${turn.risksCount}`);
  }
  if (expectations.maxOpenQuestions !== undefined) {
    addAssertion(assertions, `${label}: maxOpenQuestions`, turn.openQuestionsCount <= expectations.maxOpenQuestions, `actual=${turn.openQuestionsCount}`);
  }
  if (expectations.maxPendingActions !== undefined) {
    addAssertion(assertions, `${label}: maxPendingActions`, turn.pendingActionsCount <= expectations.maxPendingActions, `actual=${turn.pendingActionsCount}`);
  }
  addAssertion(assertions, `${label}: noDirectMemoryWrite`, turn.directMemoryCreated === 0, `actual=${turn.directMemoryCreated}`);
  addAssertion(
    assertions,
    `${label}: memorySuggestionAllowedTypes`,
    turn.memorySuggestionTypes.every((type) => !["Risk", "OpenQuestion", "Decision"].includes(type)),
    `actual=${turn.memorySuggestionTypes.join(",")}`
  );
  addAssertion(assertions, `${label}: assistantHasAgentRun`, Boolean(turn.agentRunId), `agentRunId=${turn.agentRunId ?? "missing"}`);
  addAssertion(assertions, `${label}: agentStepsExist`, turn.agentStepsCount > 0, `steps=${turn.agentStepsCount}`);
  if (turn.provider === "mock") {
    addAssertion(assertions, `${label}: providerIsMockSmoke`, turn.model === "MockLLMProvider", `actual=${turn.provider}/${turn.model}`);
  } else {
    addAssertion(assertions, `${label}: providerIsDeepSeekFlash`, turn.provider === "deepseek" && turn.model === "deepseek-v4-flash", `actual=${turn.provider}/${turn.model}`);
  }
}

function score(observation: CaseObservation, expectations: EvalExpectations) {
  const last = observation.turns.at(-1);
  const answer = observation.turns.map((turn) => turn.assistant).join("\n");
  const objectMismatch =
    (expectations.shouldCreateOpportunity === false && observation.turns.some((turn) => turn.createdOpportunity)) ||
    (expectations.shouldCreateEvidence === false && observation.turns.some((turn) => turn.createdEvidence));
  return {
    answerRelevance: answer.trim().length > 20 && includesAny(answer, expectations.mustMentionAny) ? 4.5 : 3,
    naturalness: /结论\n依据\n风险\n下一步动作/.test(answer) ? 2.5 : 4.3,
    helpfulness: includesAny(answer, expectations.mustMentionAny) ? 4.2 : 3.2,
    infoGapHandling: (last?.missingFieldsCount ?? 0) > 0 || !expectations.mustMentionAny?.length ? 4.2 : includesAny(answer, expectations.mustMentionAny) ? 4 : 3,
    memorySafety: observation.turns.every((turn) => turn.directMemoryCreated === 0 && turn.memorySuggestionTypes.every((type) => !["Risk", "OpenQuestion", "Decision"].includes(type))) ? 5 : 1,
    objectCreationCorrectness: objectMismatch ? 1 : 4.5,
    structuredEnhancement: observation.turns.some((turn) => turn.structuredCardsCount > 0) || !expectations.expectedActionLevel?.includes("show_structured_card") ? 4.2 : 3,
    overAutomationPenalty: observation.turns.some((turn) => turn.risksCount > 5 || turn.openQuestionsCount > 5 || turn.pendingActionsCount > 5) ? 2 : 5,
    traceCompleteness: observation.turns.every((turn) => turn.agentRunId && turn.agentStepsCount > 0) ? 5 : 1
  };
}

export function judgeCase(observation: CaseObservation, expectations: EvalExpectations): JudgeResult {
  const assertions: JudgeResult["hardAssertions"] = [];
  const last = observation.turns.at(-1);
  if (!last) {
    addAssertion(assertions, "case produced turns", false, observation.error ?? "no turns");
  } else {
    checkTurn(expectations, last, "final", assertions);
    expectations.perTurn?.forEach((turnExpectation, index) => {
      const turn = observation.turns[index];
      if (turn) checkTurn(turnExpectation, turn, `turn ${index + 1}`, assertions);
    });
    const answer = observation.turns.map((turn) => turn.assistant).join("\n");
    addAssertion(assertions, "mustMention", includesAll(answer, expectations.mustMention), `expected=${expectations.mustMention?.join(",") ?? ""}`);
    addAssertion(assertions, "mustMentionAny", includesAny(answer, expectations.mustMentionAny), `expectedAny=${expectations.mustMentionAny?.join(",") ?? ""}`);
    const forbidden = expectations.mustNotMention?.filter((item) => answer.toLowerCase().includes(item.toLowerCase())) ?? [];
    addAssertion(assertions, "mustNotMention", forbidden.length === 0, `forbidden=${forbidden.join(",")}`);
  }

  if (observation.error) addAssertion(assertions, "runtime error", false, observation.error);
  const failed = assertions.filter((item) => !item.passed);
  const errorTaxonomy = new Set<ErrorTaxonomy>();
  if (failed.some((item) => /providerIsDeepSeekFlash/.test(item.name))) errorTaxonomy.add("ERROR_PROVIDER_MISMATCH");
  if (failed.some((item) => /shouldCreateEvidence|shouldCreateOpportunity|shouldCreateDecision/.test(item.name))) errorTaxonomy.add("ERROR_OVER_AUTOMATION");
  if (failed.some((item) => /Memory|memorySuggestion/.test(item.name))) errorTaxonomy.add("ERROR_MEMORY_POLLUTION");
  if (failed.some((item) => /maxRisks|maxOpenQuestions|maxPendingActions/.test(item.name))) errorTaxonomy.add("ERROR_TOO_MANY_FOLLOWUPS");
  if (failed.some((item) => /mustMention/.test(item.name))) errorTaxonomy.add("ERROR_MISSING_ANSWER");
  if (failed.some((item) => /mustCiteAny|mustNotCite|mustCiteMemoryIds|mustCiteEvidenceIds|mustNotCiteMemoryIds|mustCiteMemoryType|mustPreferLatestMemory/.test(item.name))) errorTaxonomy.add("ERROR_CITATION_MISMATCH");
  if (observation.timedOut || failed.some((item) => /timed out/i.test(item.detail))) errorTaxonomy.add("ERROR_RUNTIME_TIMEOUT");
  if (failed.some((item) => /expectedActionLevel|expectedEvidenceSufficiency|expectedArtifactTypes/.test(item.name))) errorTaxonomy.add("ERROR_ROUTER_POLICY_MISMATCH");
  if (failed.some((item) => /expectedIntent|expectedFollowUpType|mustUseConversationContext/.test(item.name))) errorTaxonomy.add("ERROR_CONTEXT_MISMATCH");
  if (failed.some((item) => /agentSteps|assistantHasAgentRun/.test(item.name))) errorTaxonomy.add("ERROR_TRACE_MISSING");
  const answer = observation.turns.map((turn) => turn.assistant).join("\n");
  if (/结论\n依据\n风险\n下一步动作/.test(answer)) errorTaxonomy.add("ERROR_RIGID_TEMPLATE");
  if (failed.some((item) => item.name === "mustMentionAny") && (last?.missingFieldsCount ?? 0) === 0 && expectations.mustMentionAny?.some((item) => ["完整 JD", "公司", "团队", "薪资", "owner", "职责占比"].includes(item))) {
    errorTaxonomy.add("ERROR_INSUFFICIENT_CLARIFICATION");
  }
  if (observation.id === "markdown_and_trace" && !answer.includes("|")) errorTaxonomy.add("ERROR_MARKDOWN_RENDERING");

  const softScores = score(observation, expectations);
  const averageSoftScore = Object.values(softScores).reduce((sum, item) => sum + item, 0) / Object.values(softScores).length;
  const hardPassRate = assertions.length ? (assertions.length - failed.length) / assertions.length : 0;
  return {
    passed: failed.length === 0,
    hardAssertions: assertions,
    hardPassRate,
    softScores,
    averageSoftScore,
    errorTaxonomy: [...errorTaxonomy],
    suggestedFixes: [...errorTaxonomy].map((error) => suggestedFix(error))
  };
}

function suggestedFix(error: ErrorTaxonomy) {
  const fixes: Record<ErrorTaxonomy, string> = {
    ERROR_OVER_AUTOMATION: "Tighten actionLevel/evidenceSufficiency gates before object creation.",
    ERROR_MEMORY_POLLUTION: "Restrict MemorySuggestion triggers to explicit durable preference/goal/constraint signals.",
    ERROR_INSUFFICIENT_CLARIFICATION: "Add lightweight missingFields and answer-after-gap behavior for partial evidence.",
    ERROR_TOO_MANY_FOLLOWUPS: "Cap risk/openQuestion/pending action post-processing.",
    ERROR_RIGID_TEMPLATE: "Adjust answer composition to avoid fixed analysis template for normal chat.",
    ERROR_MISSING_ANSWER: "Ensure assistant answer directly addresses the user before audit UI.",
    ERROR_CONTEXT_MISMATCH: "Inspect thread reuse and recentMessages context plumbing.",
    ERROR_MARKDOWN_RENDERING: "Ensure answer contains valid Markdown and renderer handles GFM.",
    ERROR_AGENT_STATUS: "Inspect optimistic status card and failure state handling.",
    ERROR_TRACE_MISSING: "Ensure every assistant message links to AgentRun and steps are serialized.",
    ERROR_PROVIDER_MISMATCH: "Force eval providerConfig to deepseek-v4-flash and assert metadata.",
    ERROR_CITATION_MISMATCH: "Inspect retrieval/citation filtering so answers cite the expected memory or evidence and exclude unrelated context.",
    ERROR_RUNTIME_TIMEOUT: "Reduce provider latency, narrow the case workload, or add workflow-level timeout diagnostics for slow turns.",
    ERROR_ROUTER_POLICY_MISMATCH: "Inspect semantic router output, post-policy guard corrections, and actionLevel thresholds."
  };
  return fixes[error];
}

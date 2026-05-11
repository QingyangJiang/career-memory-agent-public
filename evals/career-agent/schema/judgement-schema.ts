import type { RewardBreakdown } from "./reward-schema";

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

export interface ModelJudgeScore {
  scorer: string;
  score: number;
  label: "pass" | "partial" | "fail";
  rationale: string;
  failureModes: string[];
  confidence?: number;
}

export interface JudgeResult {
  passed: boolean;
  hardAssertions: Array<{ name: string; passed: boolean; detail: string }>;
  hardPassRate: number;
  softScores: Record<string, number>;
  averageSoftScore: number;
  errorTaxonomy: ErrorTaxonomy[];
  suggestedFixes: string[];
  rewardBreakdown?: RewardBreakdown;
  modelJudgeScores?: ModelJudgeScore[];
  judgeProvider?: string;
  judgeSkippedReason?: string;
}

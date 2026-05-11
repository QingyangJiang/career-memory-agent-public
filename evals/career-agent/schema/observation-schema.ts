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

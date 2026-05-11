export const REWARD_COMPONENT_NAMES = [
  "memory_safety",
  "side_effect_control",
  "evidence_sufficiency",
  "source_grounding",
  "context_resolution",
  "answer_helpfulness",
  "opportunity_reasoning",
  "trace_observability",
  "efficiency_runtime"
] as const;

export type RewardComponentName = typeof REWARD_COMPONENT_NAMES[number];

export type ScorerSource =
  | "rule"
  | "model"
  | "hybrid"
  | "case_label"
  | "diagnostic"
  | "not_applicable";

export interface RewardComponentScore {
  name: RewardComponentName;
  score: number | null;
  applicable: boolean;
  source: ScorerSource;
  hardGateFailures: string[];
  failureModes: string[];
  rationale?: string;
  diagnosticOnly?: boolean;
}

export interface RewardBreakdown {
  components: Partial<Record<RewardComponentName, RewardComponentScore>>;
  scalarReward: number | null;
  scalarPolicy: "component_scalar_v0";
  hardGatePassed: boolean;
  scalarCapped: boolean;
  notes: string[];
}

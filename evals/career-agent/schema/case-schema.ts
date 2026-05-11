import type { EvalExpectations } from "./judgement-schema";
import type { RewardComponentName } from "./reward-schema";

export type EvalProviderName = "deepseek-flash" | "mock-smoke";

export type EvidenceSufficiencyLabel =
  | "none"
  | "weak"
  | "partial"
  | "sufficient"
  | "unknown";

export type SideEffectPolicy =
  | "none"
  | "suggest_memory"
  | "create_light_opportunity"
  | "create_full_opportunity"
  | "diagnostic";

export interface EvalCase {
  id: string;
  title: string;
  provider: EvalProviderName;
  turns: Array<{ user: string }>;
  expectations: EvalExpectations;
  suites?: string[];
  inputType?: string;
  evidenceSufficiency?: EvidenceSufficiencyLabel;
  sideEffectPolicy?: SideEffectPolicy;
  rewardTargets?: RewardComponentName[];
  rewardWeights?: Partial<Record<RewardComponentName, number>>;
  riskArea?: string;
  skillTargets?: string[];
  rlTags?: string[];
  judgeRequired?: boolean;
  diagnosticOnly?: boolean;
  demoOnly?: boolean;
  deprecated?: boolean;
  replacementCaseId?: string;
}

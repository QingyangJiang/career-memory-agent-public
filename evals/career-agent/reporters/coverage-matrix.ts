import { REWARD_COMPONENT_NAMES, type RewardComponentName } from "../schema/reward-schema";
import type { EvalCase } from "../schema/case-schema";

export interface CoverageMatrixRow {
  rewardDimension: RewardComponentName;
  cases: string[];
  ciCases: string[];
  offlineJudgeCases: string[];
  rlCases: string[];
}

const CI_SUITES = new Set(["regression-smoke", "ci-smoke", "core-safety"]);

export function coverageMatrix(cases: EvalCase[]): CoverageMatrixRow[] {
  return REWARD_COMPONENT_NAMES.map((dimension) => {
    const targeted = cases.filter((testCase) => testCase.rewardTargets?.includes(dimension));
    return {
      rewardDimension: dimension,
      cases: targeted.filter((testCase) => !testCase.demoOnly).map((testCase) => testCase.id),
      ciCases: targeted.filter((testCase) => (testCase.suites ?? []).some((suite) => CI_SUITES.has(suite))).map((testCase) => testCase.id),
      offlineJudgeCases: targeted.filter((testCase) => testCase.judgeRequired).map((testCase) => testCase.id),
      rlCases: targeted.filter((testCase) => (testCase.rlTags ?? []).length > 0 && !testCase.demoOnly).map((testCase) => testCase.id)
    };
  });
}

export function coverageSummary(cases: EvalCase[]) {
  const rows = coverageMatrix(cases);
  return {
    rows,
    allRewardDimensionsCoveredByNonDemoCase: rows.every((row) => row.rewardDimension === "efficiency_runtime" || row.cases.length > 0),
    ciCoveredDimensions: rows.filter((row) => row.ciCases.length > 0).map((row) => row.rewardDimension),
    offlineJudgeCoveredDimensions: rows.filter((row) => row.offlineJudgeCases.length > 0).map((row) => row.rewardDimension),
    rlCoveredDimensions: rows.filter((row) => row.rlCases.length > 0).map((row) => row.rewardDimension)
  };
}

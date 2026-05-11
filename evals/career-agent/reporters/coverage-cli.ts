import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { coverageSummary } from "./coverage-matrix";
import type { EvalCase } from "../schema/case-schema";

function loadAllCases(): EvalCase[] {
  const casesDir = resolve("evals/career-agent/cases");
  return readdirSync(casesDir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => JSON.parse(readFileSync(join(casesDir, file), "utf8")) as EvalCase);
}

function main() {
  const cases = loadAllCases();
  const summary = coverageSummary(cases);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.allRewardDimensionsCoveredByNonDemoCase) {
    process.exitCode = 1;
  }
}

main();

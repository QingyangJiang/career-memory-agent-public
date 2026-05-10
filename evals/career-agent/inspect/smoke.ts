import { loadEnvConfig } from "@next/env";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { judgeCase } from "../judge";
import { observeCase, prepareEvalDb, type EvalCase, type EvalProviderConfig } from "../run-evals";

function loadSmokeCase(): EvalCase {
  const casesDir = resolve("evals/career-agent/cases");
  const firstCase = readdirSync(casesDir).filter((file) => file.endsWith(".json")).sort()[0];
  if (!firstCase) throw new Error("No career-agent eval cases found");
  const testCase = JSON.parse(readFileSync(join(casesDir, firstCase), "utf8")) as EvalCase;
  return {
    ...testCase,
    provider: "mock-smoke",
    expectations: {
      shouldCreateEvidence: false,
      shouldCreateOpportunity: false,
      shouldCreateDecision: false,
      maxMemorySuggestions: 0,
      maxRisks: 0,
      maxOpenQuestions: 0
    }
  };
}

async function main() {
  loadEnvConfig(process.cwd());
  const testCase = loadSmokeCase();
  const providerConfig: EvalProviderConfig = {
    provider: "mock",
    model: "MockLLMProvider",
    providerLabel: "MockLLMProvider",
    thinking: "disabled",
    reasoningEffort: "none",
    timeoutMs: 60000
  };
  const dbPath = prepareEvalDb();
  const observation = await observeCase(testCase, providerConfig);
  const judgement = judgeCase(observation, testCase.expectations);
  console.log(
    JSON.stringify(
      {
        caseId: testCase.id,
        passed: judgement.passed,
        hardPassRate: judgement.hardPassRate,
        averageSoftScore: judgement.averageSoftScore,
        dbPath,
        turns: observation.turns.length,
        agentRunIds: observation.turns.map((turn) => turn.agentRunId),
        agentStepCounts: observation.turns.map((turn) => turn.agentStepsCount)
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

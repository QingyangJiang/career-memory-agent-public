import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

export function writeJsonReport(payload: unknown, path = "evals/career-agent/report.json") {
  writeFileSync(resolve(path), JSON.stringify(payload, null, 2));
}

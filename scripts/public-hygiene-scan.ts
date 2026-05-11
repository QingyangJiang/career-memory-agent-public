import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

type Severity = "error" | "warning" | "allowed";

interface Finding {
  file: string;
  keyword: string;
  context: string;
  severity: Severity;
}

const root = process.cwd();
const skipDirs = new Set(["node_modules", ".git", ".next", "dist", "coverage"]);
const skipFiles = new Set(["package-lock.json", "prisma/dev.db"]);
const skipPrefixes = ["evals/career-agent/history/"];
const binaryExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".db",
  ".sqlite",
  ".zip",
  ".gz",
  ".tar"
]);

const renderServiceUrl = "https://career-" + "opportunity-agent-demo.onrender.com/demo";
const renderServiceName = "career-" + "opportunity-agent-demo";

const oldRepoReferences = [
  "github.com/QingyangJiang/" + "career-" + "opportunity-agent",
  "QingyangJiang/" + "career-" + "opportunity-agent"
];

const sensitiveKeywords = [
  ["科大", "讯飞"].join(""),
  "豆" + "包",
  "字" + "节",
  "淘" + "天",
  "同" + "花顺",
  "QNA" + "3",
  "Web" + "3",
  "学习" + "机",
  "高英" + "评批",
  "初中" + "数学",
  "K" + "12",
  "100" + "w",
  "150" + "w",
  "70" + "k",
  "90" + "k",
  "15" + " 薪",
  "15" + "薪",
  "真实" + "总包",
  "career-" + "opportunity-agent"
];

function shouldSkip(relativePath: string) {
  if (skipFiles.has(relativePath)) return true;
  if (skipPrefixes.some((prefix) => relativePath.startsWith(prefix))) return true;
  return binaryExtensions.has(path.extname(relativePath).toLowerCase());
}

function isProbablyText(buffer: Buffer) {
  if (!buffer.length) return true;
  if (buffer.includes(0)) return false;
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  let suspicious = 0;
  for (const byte of sample) {
    if (byte < 7 || (byte > 13 && byte < 32)) suspicious += 1;
  }
  return suspicious / sample.length < 0.05;
}

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    if (skipDirs.has(entry)) continue;
    const absolute = path.join(dir, entry);
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (shouldSkip(relative)) continue;
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      files.push(...walk(absolute));
    } else if (stats.isFile()) {
      files.push(absolute);
    }
  }
  return files;
}

function contextFor(text: string, index: number, length: number) {
  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + length + 60);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function severityFor(keyword: string, text: string, index: number): Severity {
  if (oldRepoReferences.includes(keyword)) return "error";
  const surrounding = text.slice(Math.max(0, index - 40), index + renderServiceUrl.length + 40);
  if ((keyword === renderServiceName || keyword === "career-" + "opportunity-agent") && surrounding.includes(renderServiceUrl)) {
    return "warning";
  }
  if (keyword === "career-" + "opportunity-agent") return "error";
  return "error";
}

const findings: Finding[] = [];

for (const file of walk(root)) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  const buffer = readFileSync(file);
  if (!isProbablyText(buffer)) continue;
  const text = buffer.toString("utf8");
  const keywords = [...oldRepoReferences, ...sensitiveKeywords];
  for (const keyword of keywords) {
    let index = text.indexOf(keyword);
    while (index !== -1) {
      findings.push({
        file: relative,
        keyword,
        context: contextFor(text, index, keyword.length),
        severity: severityFor(keyword, text, index)
      });
      index = text.indexOf(keyword, index + keyword.length);
    }
  }
}

const bySeverity: Record<Severity, number> = { error: 0, warning: 0, allowed: 0 };
for (const finding of findings) {
  bySeverity[finding.severity] += 1;
  console.log(`[${finding.severity}] ${finding.file}`);
  console.log(`  keyword: ${finding.keyword}`);
  console.log(`  context: ${finding.context}`);
}

console.log(
  `public:hygiene summary: ${bySeverity.error} error(s), ${bySeverity.warning} warning(s), ${bySeverity.allowed} allowed finding(s)`
);

if (bySeverity.error > 0) {
  process.exit(1);
}

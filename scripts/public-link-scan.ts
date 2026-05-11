import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

type Severity = "error" | "warning";

interface Finding {
  file: string;
  url: string;
  context: string;
  severity: Severity;
}

const root = process.cwd();
const publicRepo = "https://github.com/QingyangJiang/career-memory-agent-public";
const oldRepo = "https://github.com/QingyangJiang/" + "career-" + "opportunity-agent";
const renderDemoUrl = "https://career-" + "opportunity-agent-demo.onrender.com/demo";

const scanRoots = [
  "README.md",
  "app/demo/page.tsx",
  "docs",
  "evals/career-agent"
];

const allowedExtensions = new Set([".md", ".json", ".jsonl", ".tsx"]);
const skipDirs = new Set(["node_modules", ".git", ".next", "dist", "coverage"]);

function walk(target: string): string[] {
  const absolute = path.join(root, target);
  const stats = statSync(absolute);
  if (stats.isFile()) return [absolute];

  const files: string[] = [];
  for (const entry of readdirSync(absolute)) {
    if (skipDirs.has(entry)) continue;
    const child = path.join(absolute, entry);
    const childStats = statSync(child);
    if (childStats.isDirectory()) {
      files.push(...walk(path.relative(root, child)));
    } else if (childStats.isFile() && allowedExtensions.has(path.extname(child).toLowerCase())) {
      files.push(child);
    }
  }
  return files;
}

function contextFor(text: string, index: number, length: number) {
  const start = Math.max(0, index - 80);
  const end = Math.min(text.length, index + length + 80);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

const findings: Finding[] = [];
const files = scanRoots.flatMap(walk);

for (const file of files) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  const text = readFileSync(file, "utf8");

  let oldIndex = text.indexOf(oldRepo);
  while (oldIndex !== -1) {
    findings.push({
      file: relative,
      url: oldRepo,
      context: contextFor(text, oldIndex, oldRepo.length),
      severity: "error"
    });
    oldIndex = text.indexOf(oldRepo, oldIndex + oldRepo.length);
  }

  let renderIndex = text.indexOf(renderDemoUrl);
  while (renderIndex !== -1) {
    findings.push({
      file: relative,
      url: renderDemoUrl,
      context: "Render service name still contains old project wording; acceptable if it is only a service URL, but consider renaming later.",
      severity: "warning"
    });
    renderIndex = text.indexOf(renderDemoUrl, renderIndex + renderDemoUrl.length);
  }

  const githubUrlPattern = /https:\/\/github\.com\/QingyangJiang\/[^"'\s)]+/g;
  for (const match of text.matchAll(githubUrlPattern)) {
    const url = match[0];
    if (url.startsWith(publicRepo) || url.startsWith(oldRepo)) continue;
    findings.push({
      file: relative,
      url,
      context: contextFor(text, match.index ?? 0, url.length),
      severity: "warning"
    });
  }
}

let errors = 0;
let warnings = 0;
for (const finding of findings) {
  if (finding.severity === "error") errors += 1;
  if (finding.severity === "warning") warnings += 1;
  console.log(`[${finding.severity}] ${finding.file}`);
  console.log(`  url: ${finding.url}`);
  console.log(`  context: ${finding.context}`);
}

console.log(`public:links summary: ${errors} error(s), ${warnings} warning(s)`);

if (errors > 0) {
  process.exit(1);
}

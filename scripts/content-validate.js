const childProcess = require("child_process");
const fs = require("fs");
const { getSiteState, lessonKey, loadManifest, repoRoot } = require("./content-pipeline-core");

function fail(message) {
  console.error("[content:validate] " + message);
  process.exit(1);
}

const manifest = loadManifest();
if (manifest.dryRun !== true) fail("manifest must remain dryRun=true");
if (!Array.isArray(manifest.items) || manifest.items.length === 0) fail("manifest has no items");

const hashes = new Map();
const warnings = [];
for (const item of manifest.items) {
  if (!Number.isInteger(item.lessonNumber) || item.lessonNumber < 1) {
    fail(`unassigned or invalid lesson: ${item.sourceFile}`);
  }
  if (!["prep", "summary"].includes(item.contentType)) {
    fail(`invalid contentType for ${item.sourceFile}: ${item.contentType}`);
  }
  if (!fs.existsSync(item.sourcePath)) {
    fail(`source file missing: ${item.sourcePath}`);
  }
  if (!item.hash || item.hash.length !== 64) {
    fail(`invalid hash for ${item.sourceFile}`);
  }
  if (hashes.has(item.hash)) {
    fail(`duplicate hash: ${item.sourceFile} duplicates ${hashes.get(item.hash)}`);
  }
  hashes.set(item.hash, item.sourceFile);

  if (item.questionDetectionConfidence === "low") {
    warnings.push({
      type: "question-detection-low-confidence",
      lesson: lessonKey(item.lessonNumber),
      sourceFile: item.sourceFile,
      questionCountDetected: item.questionCountDetected
    });
  }
}

const gitStatus = childProcess.execSync("git status --short", { cwd: repoRoot, encoding: "utf8" });
const changedHtml = gitStatus
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((line) => /\.html$/i.test(line) && /(^|\s)(pages|index\.html|courses\.html)/.test(line));

if (changedHtml.length) {
  fail(`unexpected existing HTML changes detected: ${changedHtml.join("; ")}`);
}

const site = getSiteState();
const ingestionLessons = new Map((site.ingestion.lessons || []).map((item) => [item.lessonId, item]));
const learningSessions = new Map((site.learningPath.sessions || []).map((item) => [Number(item.number), item]));
const learningSummaries = new Map((site.learningPath.summaryPages || []).map((item) => [Number(item.number), item]));

for (const number of [...new Set(manifest.items.map((item) => item.lessonNumber))].sort((a, b) => a - b)) {
  const padded = String(number).padStart(2, "0");
  const key = lessonKey(number);
  const prepPage = site.prepPages.find((file) => file.startsWith(`lesson-${padded}-`));
  const summaryPage = site.summaryPages.includes(`lesson-${padded}-summary.html`);
  const ingestion = ingestionLessons.get(key);
  const learning = learningSessions.get(number);
  const learningSummary = learningSummaries.get(number);

  if (prepPage && learning?.prep?.status !== "available") {
    warnings.push({ type: "learning-path-prep-unsynced", lesson: key, prepPage });
  }
  if (summaryPage && learning?.summary?.status !== "available") {
    warnings.push({ type: "learning-path-summary-unsynced", lesson: key, summaryPage: `lesson-${padded}-summary.html` });
  }
  if (summaryPage && !learningSummary) {
    warnings.push({ type: "learning-path-summaryPages-missing", lesson: key, summaryPage: `lesson-${padded}-summary.html` });
  }
  if (ingestion?.summary?.status === "available" && !summaryPage) {
    warnings.push({ type: "ingestion-summary-available-page-missing", lesson: key });
  }
}

console.log("[content:validate] PASS");
console.log(`Manifest items: ${manifest.items.length}`);
console.log(`Unique hashes: ${hashes.size}`);
console.log("No unassigned files, duplicate hashes, or existing HTML changes detected.");
if (warnings.length) {
  console.warn("[content:validate] WARNINGS");
  console.warn(JSON.stringify(warnings, null, 2));
}

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const mapPath = path.join(root, "data", "content-ingestion-map.js");
const source = fs.readFileSync(mapPath, "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: mapPath });

const map = sandbox.window.CourseContentIngestionMap;
const failures = [];

if (!map || !Array.isArray(map.lessons)) {
  failures.push("CourseContentIngestionMap.lessons is missing");
}

const seen = new Set();
const lessons = Array.isArray(map?.lessons) ? map.lessons : [];

for (const lesson of lessons) {
  if (!lesson.lessonId) failures.push("lesson without lessonId");
  if (seen.has(lesson.lessonId)) failures.push(`duplicate lessonId: ${lesson.lessonId}`);
  seen.add(lesson.lessonId);

  validateStatusHref(lesson, "prep");
  validateStatusHref(lesson, "summary");
  validateHref(lesson.questions?.href, `${lesson.lessonId}.questions.href`, { allowHash: true });
  (lesson.relatedKnowledge || []).forEach((href) => validateHref(href, `${lesson.lessonId}.relatedKnowledge`));
  (lesson.relatedChecklists || []).forEach((href) => validateHref(href, `${lesson.lessonId}.relatedChecklists`, { allowQuery: true }));
}

validateHref(map.latestUpdate?.href, "latestUpdate.href");

function validateStatusHref(lesson, key) {
  const target = lesson[key] || {};
  const label = `${lesson.lessonId}.${key}`;
  if (target.status === "available" && !target.href) failures.push(`${label} available requires href`);
  if (target.status === "missing" && target.href) failures.push(`${label} missing must not include href`);
  if (target.href) validateHref(target.href, `${label}.href`);
}

function validateHref(href, label, options = {}) {
  if (!href) return;
  if (/^(https?:|mailto:)/.test(href)) return;
  let clean = href;
  if (options.allowHash || clean.includes("#")) clean = clean.split("#")[0];
  if (options.allowQuery || clean.includes("?")) clean = clean.split("?")[0];
  if (!clean) return;
  const filePath = path.join(root, clean);
  if (!fs.existsSync(filePath)) failures.push(`${label} points to missing file: ${href}`);
}

if (failures.length) {
  console.error("Content ingestion validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Content ingestion map OK: ${lessons.length} lesson records`);

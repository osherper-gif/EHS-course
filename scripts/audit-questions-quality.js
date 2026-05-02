const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data", "exam-questions.js"), "utf8"), ctx);
const questions = ctx.window.EXAM_QUESTIONS || [];

const MIN_TOTAL = 300;
const MIN_PER_LESSON = 25;
const EXPECTED_DIFFICULTY_SPREAD = { easy: 7, medium: 12, hard: 6 };
const REQUIRED_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const LEGAL_OR_STANDARD_PATTERNS = [
  /חוק/,
  /תקנה/,
  /פקודה/,
  /תקן/,
  /ISO/,
  /עבודה בגובה/,
  /רעש/,
  /חשמל/,
  /חומרים מסוכנים/,
  /בנייה/,
  /עגורן/,
  /פיגום/,
  /חלל מוקף/
];
const GENERIC_PATTERNS = [
  /מה מאפיין תשובה טובה/,
  /איזה סיכון מתאים למפגש/,
  /מה הצעד הראשון בניתוח מקצועי/,
  /מהי המשמעות המקצועית של .* בהקשר שיעור/,
  /מהי טעות נפוצה בטיפול בנושא/,
  /מה חשוב לזכור למבחן בנושא/,
  /בחר את המשפט המדויק ביותר על הנושא/
];
const TOO_EASY_PATTERNS = [
  /^מהו\s[^?]{0,18}\?$/,
  /^מהי\s[^?]{0,18}\?$/,
  /איזו תשובה נכונה\?$/
];

function normalize(text) {
  return String(text || "")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[\s\-–—_,.;:!?"'״׳()\[\]]+/g, " ")
    .trim()
    .toLowerCase();
}

function similarity(a, b) {
  const aw = new Set(normalize(a).split(" ").filter(Boolean));
  const bw = new Set(normalize(b).split(" ").filter(Boolean));
  if (!aw.size || !bw.size) return 0;
  let intersection = 0;
  aw.forEach((word) => { if (bw.has(word)) intersection += 1; });
  return intersection / Math.max(aw.size, bw.size);
}

const issues = [];
const recommendations = [];
const byLesson = new Map();
const exactMap = new Map();

questions.forEach((question, index) => {
  const label = question.id || `#${index + 1}`;
  const lessonId = question.relatedLessonId || "missing";
  if (!byLesson.has(lessonId)) byLesson.set(lessonId, []);
  byLesson.get(lessonId).push(question);

  const normalizedQuestion = normalize(question.question);
  if (exactMap.has(normalizedQuestion)) {
    issues.push(`[duplicate] ${label} duplicates ${exactMap.get(normalizedQuestion)}`);
  } else {
    exactMap.set(normalizedQuestion, label);
  }

  if (!question.relatedLessonId) issues.push(`[missing lesson] ${label}`);
  if (!question.topic || String(question.topic).trim().length < 4) issues.push(`[missing topic] ${label}`);
  if (!REQUIRED_DIFFICULTIES.has(question.difficulty)) issues.push(`[bad difficulty] ${label}: ${question.difficulty}`);
  if (!question.explanation || String(question.explanation).trim().length < 35) issues.push(`[weak explanation] ${label}`);
  const isLegalOrStandard = LEGAL_OR_STANDARD_PATTERNS.some((pattern) => pattern.test(`${question.topic || ""} ${question.question || ""} ${question.explanation || ""}`));
  if (!question.sourceNote && !question.source) issues.push(`[missing source note] ${label}`);
  if (isLegalOrStandard && (!question.sourceNote || String(question.sourceNote).trim().length < 20)) {
    issues.push(`[missing legal source note] ${label}`);
  }
  if (!Array.isArray(question.options) || question.options.length < 4) issues.push(`[options] ${label} has fewer than 4 options`);
  if (Array.isArray(question.options) && question.options.length) {
    const normalizedOptions = question.options.map(normalize);
    if (new Set(normalizedOptions).size !== normalizedOptions.length) issues.push(`[duplicate options] ${label}`);
    if (!question.options.includes(question.correctAnswer)) issues.push(`[correct answer missing from options] ${label}`);
  }
  if (!question.question || String(question.question).trim().length < 28) issues.push(`[too short] ${label}`);
  if (GENERIC_PATTERNS.some((pattern) => pattern.test(question.question || ""))) issues.push(`[generic wording] ${label}: ${question.question}`);
  if (TOO_EASY_PATTERNS.some((pattern) => pattern.test(question.question || "")) && question.difficulty !== "easy") {
    issues.push(`[too easy for difficulty] ${label}: ${question.question}`);
  }
});

const sortedLessons = [...byLesson.entries()].sort(([a], [b]) => a.localeCompare(b));
sortedLessons.forEach(([lessonId, list]) => {
  if (lessonId === "missing") return;
  if (list.length < MIN_PER_LESSON) issues.push(`[lesson count] ${lessonId} has ${list.length}, expected at least ${MIN_PER_LESSON}`);
  const diffCounts = list.reduce((acc, question) => {
    acc[question.difficulty] = (acc[question.difficulty] || 0) + 1;
    return acc;
  }, {});
  for (const difficulty of REQUIRED_DIFFICULTIES) {
    if (!diffCounts[difficulty]) issues.push(`[difficulty spread] ${lessonId} has no ${difficulty} questions`);
  }
  Object.entries(EXPECTED_DIFFICULTY_SPREAD).forEach(([difficulty, expected]) => {
    if ((diffCounts[difficulty] || 0) < expected) {
      issues.push(`[difficulty spread] ${lessonId} has ${diffCounts[difficulty] || 0} ${difficulty}, expected at least ${expected}`);
    }
  });
  const hardRatio = Number(diffCounts.hard || 0) / list.length;
  if ((diffCounts.hard || 0) < 2) issues.push(`[difficulty spread] ${lessonId} has too few hard questions (${diffCounts.hard || 0}/${list.length})`);
});

for (let i = 0; i < questions.length; i += 1) {
  for (let j = i + 1; j < questions.length; j += 1) {
    const score = similarity(questions[i].question, questions[j].question);
    if (score >= 0.86 && normalize(questions[i].question) !== normalize(questions[j].question)) {
      recommendations.push(`[high similarity] ${questions[i].id} ~ ${questions[j].id} (${score.toFixed(2)})`);
    }
  }
}

if (questions.length < MIN_TOTAL) issues.push(`[total count] ${questions.length} questions, expected at least ${MIN_TOTAL}`);

console.log("Question quality audit");
console.log("======================");
console.log(`Total questions: ${questions.length}`);
console.log("Questions by lesson:");
sortedLessons.forEach(([lessonId, list]) => {
  const diffCounts = list.reduce((acc, question) => {
    acc[question.difficulty] = (acc[question.difficulty] || 0) + 1;
    return acc;
  }, {});
  console.log(`- ${lessonId}: ${list.length} (easy ${diffCounts.easy || 0}, medium ${diffCounts.medium || 0}, hard ${diffCounts.hard || 0})`);
});
console.log(issues.length ? "FAIL" : "PASS");
if (recommendations.length) {
  console.log("Recommendations:");
  recommendations.slice(0, 40).forEach((item) => console.log(`- ${item}`));
  if (recommendations.length > 40) console.log(`- ...and ${recommendations.length - 40} more`);
}
if (issues.length) {
  console.log("Issues:");
  issues.slice(0, 120).forEach((issue) => console.log(`- ${issue}`));
  if (issues.length > 120) console.log(`- ...and ${issues.length - 120} more`);
  process.exitCode = 1;
}

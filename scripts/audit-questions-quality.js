const fs = require("fs");
const vm = require("vm");

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync("data/exam-questions.js", "utf8"), sandbox);

const questions = sandbox.window.EXAM_QUESTIONS || [];
const issues = [];
const recommendations = [];
const byLesson = {};
const exact = new Map();

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\u0590-\u05ffa-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return normalize(value).split(" ").filter((word) => word.length > 1);
}

function jaccard(a, b) {
  const aSet = new Set(words(a));
  const bSet = new Set(words(b));
  if (!aSet.size || !bSet.size) return 0;
  let intersection = 0;
  for (const word of aSet) if (bSet.has(word)) intersection += 1;
  return intersection / (aSet.size + bSet.size - intersection);
}

const genericPatterns = [
  /מה מאפיין תשובה טובה/,
  /איזה סיכון מתאים למפגש/,
  /מה הצעד הראשון בניתוח מקצועי/,
  /מהו הנושא המרכזי של המפגש/,
  /רשימת סיכונים מתאימה ביותר/,
];

questions.forEach((question, index) => {
  const id = question.id || `index-${index}`;
  byLesson[question.relatedLessonId || "missing"] = (byLesson[question.relatedLessonId || "missing"] || 0) + 1;

  const key = normalize(question.question);
  if (exact.has(key)) issues.push(`כפילות מדויקת: ${id} דומה ל-${exact.get(key)}`);
  else exact.set(key, id);

  if (!question.relatedLessonId) issues.push(`חסר relatedLessonId: ${id}`);
  if (!question.difficulty) issues.push(`חסר difficulty: ${id}`);
  if (!question.explanation || normalize(question.explanation).length < 80) issues.push(`הסבר קצר מדי או חסר: ${id}`);
  if (!Array.isArray(question.options) || question.options.length < 4) issues.push(`פחות מ-4 אפשרויות: ${id}`);
  if (normalize(question.question).length < 35) issues.push(`שאלה קצרה מדי: ${id}`);
  if (genericPatterns.some((pattern) => pattern.test(question.question))) issues.push(`שאלה גנרית מדי: ${id}`);
  if (question.options && new Set(question.options.map(normalize)).size !== question.options.length) issues.push(`אפשרויות כפולות: ${id}`);
  if (question.correctAnswer && !question.options?.includes(question.correctAnswer)) issues.push(`התשובה הנכונה אינה נמצאת באפשרויות: ${id}`);
});

const highSimilarity = [];
for (let i = 0; i < questions.length; i += 1) {
  for (let j = i + 1; j < questions.length; j += 1) {
    const score = jaccard(questions[i].question, questions[j].question);
    if (score >= 0.92) highSimilarity.push(`${questions[i].id} ~ ${questions[j].id} (${score.toFixed(2)})`);
  }
}

if (highSimilarity.length) {
  recommendations.push(`נמצאו ${highSimilarity.length} זוגות עם דמיון גבוה מאוד. מומלץ לבדוק ידנית: ${highSimilarity.slice(0, 12).join(", ")}`);
}

Object.entries(byLesson).forEach(([lessonId, count]) => {
  if (lessonId === "missing") return;
  if (count < 20) issues.push(`מעט מדי שאלות ב-${lessonId}: ${count}`);
});

if (questions.length < 240) issues.push(`מאגר קטן מדי: ${questions.length} שאלות`);

console.log("Question Quality Audit");
console.log("======================");
console.log(`Total questions: ${questions.length}`);
console.log("Questions by lesson:");
Object.keys(byLesson).sort().forEach((lessonId) => console.log(`- ${lessonId}: ${byLesson[lessonId]}`));
console.log(`Exact duplicates: ${Math.max(0, questions.length - exact.size)}`);
console.log(`High-similarity pairs: ${highSimilarity.length}`);
console.log(`Issues: ${issues.length}`);

if (issues.length) {
  console.log("\nFAIL");
  issues.forEach((issue) => console.log(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log("\nPASS");
}

if (recommendations.length) {
  console.log("\nRecommendations:");
  recommendations.forEach((item) => console.log(`- ${item}`));
}

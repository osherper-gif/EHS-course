const fs = require("fs");
const vm = require("vm");

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync("data/search-index.js", "utf8"), ctx);
vm.runInNewContext(fs.readFileSync("data/exam-questions.js", "utf8"), ctx);

const base = (ctx.window.SITE_SEARCH_INDEX || []).filter((item) => item.type !== "שאלת מבחן");
const questions = ctx.window.EXAM_QUESTIONS || [];

const questionItems = questions.map((q) => ({
  title: q.question,
  type: "שאלת מבחן",
  snippet: q.explanation,
  url: `pages/exam-questions.html?lesson=${q.relatedLessonId}`,
  lessonId: q.relatedLessonId,
  tags: [q.topic, q.difficulty, "שאלות מבחן"],
  text: [q.question, q.correctAnswer, ...(q.options || []), q.explanation, q.topic, q.sourceNote].filter(Boolean).join(" "),
}));

fs.writeFileSync("data/search-index.js", `window.SITE_SEARCH_INDEX = ${JSON.stringify([...base, ...questionItems], null, 2)};\n`, "utf8");
console.log(`search index question items: ${questionItems.length}`);

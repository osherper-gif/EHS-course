const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const summaryQuestionsPath = path.join(repoRoot, "data", "summary-questions-map.js");
const summaryPagePath = path.join(repoRoot, "pages", "summaries", "lesson-01-summary.html");
const expectedCount = 72;
const questionSetKey = "lesson-01-summary-practice-source";

function fail(message) {
  console.error("[summary-question-count] " + message);
  process.exit(1);
}

const sandbox = { window: { CoursePrepQuestionSets: {} } };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(summaryQuestionsPath, "utf8"), sandbox, {
  filename: summaryQuestionsPath,
});

const questions = sandbox.window.CoursePrepQuestionSets[questionSetKey];
if (!Array.isArray(questions)) {
  fail("Missing question set: " + questionSetKey);
}

if (questions.length !== expectedCount) {
  fail("Expected " + expectedCount + " questions, found " + questions.length);
}

const pageHtml = fs.readFileSync(summaryPagePath, "utf8");
if (!pageHtml.includes('data-prep-quiz-source="' + questionSetKey + '"')) {
  fail("Summary page is not wired to " + questionSetKey);
}

if (!pageHtml.includes('data-source-question-count="' + expectedCount + '"')) {
  fail("Summary page does not declare data-source-question-count=" + expectedCount);
}

const distribution = questions.reduce((acc, question) => {
  const letter = question.correctLetter || String(question.correctIndex);
  acc[letter] = (acc[letter] || 0) + 1;
  return acc;
}, {});

console.log(
  "[summary-question-count] PASS sourceQuestionCount=renderedQuestionCount=" +
    expectedCount +
    " distribution=" +
    JSON.stringify(distribution)
);

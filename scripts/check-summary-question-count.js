const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const summaryQuestionsPath = path.join(repoRoot, "data", "summary-questions-map.js");
const checks = [
  {
    page: path.join(repoRoot, "pages", "summaries", "lesson-01-summary.html"),
    key: "lesson-01-summary-practice-source",
    expectedCount: 72,
  },
  {
    page: path.join(repoRoot, "pages", "summaries", "lesson-02-summary.html"),
    key: "lesson-02-summary-full-practice-source",
    expectedCount: 65,
  },
  {
    page: path.join(repoRoot, "pages", "summaries", "lesson-03-summary.html"),
    key: "lesson-03-summary-full-practice-source",
    expectedCount: 60,
  },
  {
    page: path.join(repoRoot, "pages", "summaries", "lesson-04-summary.html"),
    key: "lesson-04-summary-full-practice-source",
    expectedCount: 60,
  },
];

function fail(message) {
  console.error("[summary-question-count] " + message);
  process.exit(1);
}

const sandbox = { window: { CoursePrepQuestionSets: {} } };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(summaryQuestionsPath, "utf8"), sandbox, {
  filename: summaryQuestionsPath,
});

const results = checks.map((check) => {
  const questions = sandbox.window.CoursePrepQuestionSets[check.key];
  if (!Array.isArray(questions)) {
    fail("Missing question set: " + check.key);
  }

  if (questions.length !== check.expectedCount) {
    fail("Expected " + check.expectedCount + " questions for " + check.key + ", found " + questions.length);
  }

  const pageHtml = fs.readFileSync(check.page, "utf8");
  if (!pageHtml.includes('data-prep-quiz-source="' + check.key + '"')) {
    fail(path.basename(check.page) + " is not wired to " + check.key);
  }

  if (!pageHtml.includes('data-source-question-count="' + check.expectedCount + '"')) {
    fail(path.basename(check.page) + " does not declare data-source-question-count=" + check.expectedCount);
  }

  const distribution = questions.reduce((acc, question) => {
    const letter = question.correctLetter || String(question.correctIndex);
    acc[letter] = (acc[letter] || 0) + 1;
    return acc;
  }, {});

  return {
    key: check.key,
    count: questions.length,
    distribution,
  };
});

console.log("[summary-question-count] PASS " + JSON.stringify(results));

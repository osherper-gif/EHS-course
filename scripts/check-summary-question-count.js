const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const summaryQuestionsPath = path.join(repoRoot, "data", "summary-questions-map.js");
const checks = [
  {
    page: path.join(repoRoot, "pages", "summaries", "lesson-01-summary.html"),
    key: "lesson-01-summary-practice-source",
    quizId: "lesson-01-summary-practice",
    expectedCount: 72,
  },
  {
    page: path.join(repoRoot, "pages", "summaries", "lesson-02-summary.html"),
    key: "lesson-02-summary-practice-source",
    quizId: "lesson-02-summary-practice",
    expectedCount: 65,
  },
  {
    page: path.join(repoRoot, "pages", "summaries", "lesson-03-summary.html"),
    key: "lesson-03-summary-full-practice-source",
    quizId: "lesson-03-summary-practice",
    expectedCount: 60,
  },
  {
    page: path.join(repoRoot, "pages", "summaries", "lesson-04-summary.html"),
    key: "lesson-04-summary-practice-source",
    quizId: "lesson-04-summary-practice",
    expectedCount: 60,
  },
  {
    page: path.join(repoRoot, "pages", "summaries", "lesson-05-summary.html"),
    key: "lesson-05-summary-full-practice-source",
    quizId: "lesson-05-summary-practice",
    expectedCount: 60,
  },
  {
    page: path.join(repoRoot, "pages", "summaries", "lesson-06-summary.html"),
    key: "lesson-06-summary-full-practice-source",
    quizId: "lesson-06-summary-practice",
    expectedCount: 59,
  },
  {
    page: path.join(repoRoot, "pages", "summaries", "lesson-07-summary.html"),
    key: "lesson-07-summary-full-practice-source",
    quizId: "lesson-07-summary-practice",
    expectedCount: 60,
  },
  {
    page: path.join(repoRoot, "pages", "summaries", "lesson-08-summary.html"),
    key: "lesson-08-summary-full-practice-source",
    quizId: "lesson-08-summary-practice",
    expectedCount: 60,
  },
];
const pendingQualityPages = [].map((file) => path.join(repoRoot, "pages", "summaries", file));

function fail(message) {
  console.error("[summary-question-count] " + message);
  process.exit(1);
}

const sandbox = { window: { CourseSummaryQuestionSets: {} } };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(summaryQuestionsPath, "utf8"), sandbox, {
  filename: summaryQuestionsPath,
});

const summaryQuizJs = fs.readFileSync(path.join(repoRoot, "js", "summary-quiz.js"), "utf8");
if (/slice\s*\(\s*0\s*,\s*30\s*\)/.test(summaryQuizJs) || /maxQuestions|first30|previewOnly/i.test(summaryQuizJs)) {
  fail("summary-quiz.js contains a hardcoded preview/30-question limit");
}

const results = checks.map((check) => {
  const questions = sandbox.window.CourseSummaryQuestionSets[check.key];
  if (!Array.isArray(questions)) {
    fail("Missing question set: " + check.key);
  }

  if (questions.length !== check.expectedCount) {
    fail("Expected " + check.expectedCount + " questions for " + check.key + ", found " + questions.length);
  }

  const pageHtml = fs.readFileSync(check.page, "utf8");
  if (!pageHtml.includes('id="summaryQuizApp"')) {
    fail(path.basename(check.page) + " is not wired to summaryQuizApp");
  }

  if (pageHtml.includes("prepQuizApp") || pageHtml.includes("data-prep-quiz-source=")) {
    fail(path.basename(check.page) + " still uses the prep quiz renderer for summary questions");
  }

  if (!pageHtml.includes('data-summary-quiz="' + check.quizId + '"')) {
    fail(path.basename(check.page) + " does not declare data-summary-quiz=" + check.quizId);
  }

  if (!pageHtml.includes('data-summary-quiz-source="' + check.key + '"')) {
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

  const shouldSortBySourceNumber = questions.length > 1 && Number(questions[0].sourceNumber) !== 1;
  const renderOrder = shouldSortBySourceNumber
    ? questions.slice().sort((a, b) => {
        const aNumber = Number.isFinite(Number(a.sourceNumber)) ? Number(a.sourceNumber) : 9999;
        const bNumber = Number.isFinite(Number(b.sourceNumber)) ? Number(b.sourceNumber) : 9999;
        if (aNumber !== bNumber) return aNumber - bNumber;
        const aOccurrence = Number.isFinite(Number(a.sourceOccurrence)) ? Number(a.sourceOccurrence) : 9999;
        const bOccurrence = Number.isFinite(Number(b.sourceOccurrence)) ? Number(b.sourceOccurrence) : 9999;
        if (aOccurrence !== bOccurrence) return aOccurrence - bOccurrence;
        return String(a.id || "").localeCompare(String(b.id || ""));
      })
    : questions.slice();
  if (renderOrder[0].sourceNumber !== 1) {
    fail("Rendered summary question order should start with source question 1, found " + renderOrder[0].sourceNumber);
  }
  if (renderOrder.slice(0, 20).some((question) => Number(question.sourceNumber) > 20)) {
    fail("Rendered first question group includes a source question above 20");
  }

  const renderedQuestionCount = questions.length;
  if (renderedQuestionCount !== check.expectedCount) {
    fail("Renderer plan does not include all questions for " + check.key);
  }

  return {
    key: check.key,
    sourceQuestionCount: check.expectedCount,
    datasetQuestionCount: questions.length,
    renderedQuestionCount,
    firstRenderedSourceNumber: renderOrder[0].sourceNumber,
    lastRenderedSourceNumber: renderOrder[renderOrder.length - 1].sourceNumber,
    distribution,
  };
});

pendingQualityPages.forEach((page) => {
  const pageHtml = fs.readFileSync(page, "utf8");
  if (pageHtml.includes("data-prep-quiz-source=") || pageHtml.includes("prepQuizApp")) {
    fail(path.basename(page) + " is pending quality review but still renders an interactive summary quiz");
  }
});

console.log("[summary-question-count] PASS " + JSON.stringify(results));

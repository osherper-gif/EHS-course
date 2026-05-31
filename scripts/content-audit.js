const { getSiteState, lessonKey, loadManifest } = require("./content-pipeline-core");

const manifest = loadManifest();
const site = getSiteState();
const lessons = [...new Set(manifest.items.map((item) => item.lessonNumber).filter(Boolean))].sort((a, b) => a - b);
const ingestionLessons = new Map((site.ingestion.lessons || []).map((item) => [item.lessonId, item]));
const learningSessions = new Map((site.learningPath.sessions || []).map((item) => [Number(item.number), item]));
const learningSummaries = new Map((site.learningPath.summaryPages || []).map((item) => [Number(item.number), item]));

function prepPageFor(number) {
  const padded = String(number).padStart(2, "0");
  return site.prepPages.find((file) => file.startsWith(`lesson-${padded}-`)) || "";
}

function summaryPageFor(number) {
  const padded = String(number).padStart(2, "0");
  return site.summaryPages.includes(`lesson-${padded}-summary.html`) ? `lesson-${padded}-summary.html` : "";
}

function prepQuestionKeys(number) {
  const padded = String(number).padStart(2, "0");
  return Object.keys(site.prepQuestions || {}).filter((key) => key.includes(`lesson-${padded}`));
}

function summaryQuestionKeys(number) {
  const padded = String(number).padStart(2, "0");
  return Object.keys(site.summaryQuestions || {}).filter((key) => key.includes(`lesson-${padded}-summary`));
}

function countUniqueQuestions(keys, map) {
  const ids = new Set();
  keys.forEach((itemKey) => {
    (map[itemKey] || []).forEach((question, index) => {
      ids.add(question.id || `${itemKey}:${index}`);
    });
  });
  return ids.size;
}

function hrefForPrep(file) {
  return file ? `prep/${file}` : "";
}

function hrefForSummary(file) {
  return file ? `summaries/${file}` : "";
}

const rows = lessons.map((number) => {
  const key = lessonKey(number);
  const sourcePrep = manifest.items.find((item) => item.lessonNumber === number && item.contentType === "prep");
  const sourceSummary = manifest.items.find((item) => item.lessonNumber === number && item.contentType === "summary");
  const ingestion = ingestionLessons.get(key);
  const learning = learningSessions.get(number);
  const learningSummary = learningSummaries.get(number);
  const prepPage = prepPageFor(number);
  const summaryPage = summaryPageFor(number);
  const prepKeys = prepQuestionKeys(number);
  const summaryKeys = summaryQuestionKeys(number);
  const sourceSummaryQuestions = sourceSummary ? sourceSummary.questionCountDetected : 0;
  const siteSummaryQuestions = countUniqueQuestions(summaryKeys, site.summaryQuestions || {});
  const notes = [];

  if (sourcePrep && !prepPage) notes.push("source prep exists, site prep page missing");
  if (sourceSummary && !summaryPage) notes.push("source summary exists, site summary page missing");
  if (sourceSummary && sourceSummaryQuestions && siteSummaryQuestions && sourceSummaryQuestions !== siteSummaryQuestions) {
    notes.push(`summary question count gap source=${sourceSummaryQuestions} site=${siteSummaryQuestions}`);
  }
  if (sourceSummary?.questionDetectionConfidence !== "high") {
    notes.push(`summary question detection confidence=${sourceSummary?.questionDetectionConfidence || "none"}`);
  }
  if (ingestion?.prep?.status === "available" && learning?.prep?.status !== "available") {
    notes.push("content-ingestion prep available but learning-path prep missing/disabled");
  }
  if (ingestion?.summary?.status === "available" && learning?.summary?.status !== "available") {
    notes.push("content-ingestion summary available but learning-path summary missing/disabled");
  }
  if (ingestion?.summary?.status === "available" && !summaryPage) notes.push("ingestion summary available but page missing");
  if (summaryPage && ingestion?.summary?.status !== "available") notes.push("summary page exists but ingestion not available");
  if (summaryPage && !learningSummary) notes.push("summary page missing from learning-path summaryPages");
  if (learningSummary && learningSummary.summaryAvailable === false) notes.push("learning-path summary shell is placeholder/not available");
  if (prepPage && learning?.prep?.status !== "available") notes.push("prep page exists but learning-path prep not available");

  return {
    lesson: key,
    lessonNumber: number,
    sourcePrep: Boolean(sourcePrep),
    sourceSummary: Boolean(sourceSummary),
    sitePrepPage: prepPage,
    siteSummaryPage: summaryPage,
    ingestionPrep: ingestion?.prep?.status || "missing",
    ingestionSummary: ingestion?.summary?.status || "missing",
    learningPathPrep: learning?.prep?.status || "missing",
    learningPathSummary: learning?.summary?.status || "missing",
    learningPathSummaryRegistered: Boolean(learningSummary),
    learningPathSummaryAvailable: learningSummary?.summaryAvailable === true,
    sourceSummaryQuestions,
    sourceSummaryQuestionConfidence: sourceSummary?.questionDetectionConfidence || "none",
    sourceSummaryQuestionDetection: sourceSummary?.questionDetection || null,
    siteSummaryQuestions,
    prepQuestionSets: prepKeys,
    summaryQuestionSets: summaryKeys,
    notes
  };
});

const learningPathAudit = {
  existingPrepPageMissingOrDisabled: rows
    .filter((row) => row.sitePrepPage && row.learningPathPrep !== "available")
    .map((row) => ({ lesson: row.lesson, sitePrepPage: row.sitePrepPage, learningPathPrep: row.learningPathPrep })),
  existingSummaryPageMissingOrDisabled: rows
    .filter((row) => row.siteSummaryPage && row.learningPathSummary !== "available")
    .map((row) => ({
      lesson: row.lesson,
      siteSummaryPage: row.siteSummaryPage,
      learningPathSummary: row.learningPathSummary,
      registeredInSummaryPages: row.learningPathSummaryRegistered,
      summaryAvailable: row.learningPathSummaryAvailable
    })),
  ingestionAvailableMissingInLearningPath: rows
    .filter((row) =>
      (row.ingestionPrep === "available" && row.learningPathPrep !== "available") ||
      (row.ingestionSummary === "available" && row.learningPathSummary !== "available"))
    .map((row) => ({
      lesson: row.lesson,
      ingestionPrep: row.ingestionPrep,
      learningPathPrep: row.learningPathPrep,
      ingestionSummary: row.ingestionSummary,
      learningPathSummary: row.learningPathSummary
    })),
  htmlExistingButUnavailableSomewhere: rows
    .filter((row) =>
      (row.sitePrepPage && (row.ingestionPrep !== "available" || row.learningPathPrep !== "available")) ||
      (row.siteSummaryPage && (row.ingestionSummary !== "available" || row.learningPathSummary !== "available")))
    .map((row) => ({
      lesson: row.lesson,
      sitePrepPage: row.sitePrepPage,
      siteSummaryPage: row.siteSummaryPage,
      ingestionPrep: row.ingestionPrep,
      ingestionSummary: row.ingestionSummary,
      learningPathPrep: row.learningPathPrep,
      learningPathSummary: row.learningPathSummary
    }))
};

const safeSyncProposal = rows
  .filter((row) => row.sitePrepPage || row.siteSummaryPage)
  .map((row) => {
    const actions = [];
    if (row.sitePrepPage && row.learningPathPrep !== "available") {
      actions.push({
        target: "learning-path session prep",
        action: "mark prep available / add prepHref",
        href: hrefForPrep(row.sitePrepPage)
      });
    }
    if (row.siteSummaryPage && row.learningPathSummary !== "available") {
      actions.push({
        target: "learning-path session summary",
        action: "mark summary available / attach summary href",
        href: hrefForSummary(row.siteSummaryPage)
      });
    }
    if (row.siteSummaryPage && !row.learningPathSummaryRegistered) {
      actions.push({
        target: "learning-path summaryPages",
        action: "add summary entry",
        href: hrefForSummary(row.siteSummaryPage),
        manualReview: true
      });
    }
    if (row.learningPathSummaryRegistered && !row.learningPathSummaryAvailable) {
      actions.push({
        target: "learning-path summaryPages",
        action: "review placeholder status and set available if page is approved",
        href: hrefForSummary(row.siteSummaryPage),
        manualReview: true
      });
    }
    return { lesson: row.lesson, actions };
  })
  .filter((item) => item.actions.length);

const confidenceSummary = manifest.items
  .filter((item) => item.contentType === "summary")
  .map((item) => ({
    lesson: lessonKey(item.lessonNumber),
    sourceFile: item.sourceFile,
    questionCountDetected: item.questionCountDetected,
    confidence: item.questionDetectionConfidence,
    rawMarkerCount: item.questionDetection.rawMarkerCount,
    namedQuestionMarkers: item.questionDetection.namedQuestionMarkers,
    numberedQuestionMarkers: item.questionDetection.numberedQuestionMarkers,
    uniqueNumbers: item.questionDetection.uniqueNumbers,
    firstNumber: item.questionDetection.firstNumber,
    lastNumber: item.questionDetection.lastNumber,
    answerMarkers: item.questionDetection.answerMarkers,
    sectionMarkers: item.questionDetection.sectionMarkers
  }));

const gaps = rows.filter((row) => row.notes.length);
const unassigned = manifest.items.filter((item) => item.status === "unassigned");

console.log("[content:audit] PASS");
console.log(JSON.stringify({
  sourceItems: manifest.items.length,
  lessons: rows.length,
  sitePrepPages: site.prepPages.length,
  siteSummaryPages: site.summaryPages.length,
  gaps: gaps.length,
  unassigned: unassigned.length,
  confidenceSummary,
  learningPathAudit,
  safeSyncProposal,
  rows
}, null, 2));

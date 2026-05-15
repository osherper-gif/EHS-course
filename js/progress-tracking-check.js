import {
  auth,
  collection,
  db,
  doc,
  firebaseConfig,
  firebaseEnvironment,
  getDoc,
  getDocs,
  onAuthStateChanged,
  serverTimestamp,
  setDoc,
  signOut,
} from "./firebase-config.js";

const DEMO_QUESTION_ID = "demo-question-001";
const FORBIDDEN_PROGRESS_FIELDS = new Set([
  "correctAnswer",
  "answerKey",
  "solution",
  "fullQuestionPayload",
]);

const state = {
  user: null,
  writeAttempted: false,
  writeSuccess: false,
  readSuccess: false,
  progressDocExists: false,
  progressDocsCount: 0,
  statsCalculated: false,
  topicsCount: 0,
  difficultiesCount: 0,
  weakTopicsCount: 0,
  strongTopicsCount: 0,
  recommendedTopicsCount: 0,
  difficultyRecommendation: "",
  generatedRecommendationsCount: 0,
  lastRecommendedTopic: "",
  lastPracticeLaunchTarget: "",
  telemetryEventsCaptured: 0,
  lastTelemetryEvent: "",
  realQuestionsTrackedCount: 0,
  lastError: "",
};

const elements = {
  heading: document.getElementById("progress-check-heading"),
  message: document.getElementById("progress-check-message"),
  userDetails: document.getElementById("progress-check-user-details"),
  actions: document.getElementById("progress-check-actions"),
  dashboardContent: document.getElementById("learner-dashboard-content"),
  controls: document.getElementById("progress-check-controls"),
  debugPanel: document.getElementById("progress-debug-panel"),
  debug: document.getElementById("progress-check-debug"),
  resultPanel: document.getElementById("progress-check-result-panel"),
  result: document.getElementById("progress-check-result"),
  statsPanel: document.getElementById("progress-stats-panel"),
  statsEmpty: document.getElementById("progress-stats-empty"),
  statsSummary: document.getElementById("progress-stats-summary"),
  lastPracticeSummary: document.getElementById("last-practice-summary"),
  lastPracticeDetails: document.getElementById("last-practice-details"),
  lastPracticeActions: document.getElementById("last-practice-actions"),
  topicStatsTable: document.getElementById("progress-topic-stats-table"),
  difficultyStatsTable: document.getElementById("progress-difficulty-stats-table"),
  weakTopicsList: document.getElementById("weak-topics-list"),
  weakPracticeList: document.getElementById("weak-practice-list"),
  strongTopicsList: document.getElementById("strong-topics-list"),
  recommendedTopicsList: document.getElementById("recommended-topics-list"),
  difficultyRecommendationText: document.getElementById("difficulty-recommendation-text"),
  difficultyPracticeActions: document.getElementById("difficulty-practice-actions"),
  viewedButton: document.getElementById("progress-viewed-button"),
  answeredButton: document.getElementById("progress-answered-button"),
  loadButton: document.getElementById("progress-load-button"),
};

function setText(element, value) {
  if (element) element.textContent = value;
}

function readDebugFlag() {
  try {
    const rawFlags = window.localStorage.getItem("ehsDynamicContentFlags");
    if (!rawFlags) return false;
    const flags = JSON.parse(rawFlags);
    return flags?.debug === true;
  } catch (error) {
    return false;
  }
}

function isStagingOrLocalHost() {
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "ehs-course-staging.web.app";
}

function shouldShowTestTools() {
  return isStagingOrLocalHost() || readDebugFlag();
}

function ensureTestToolsPanel() {
  if (elements.controls) return elements.controls;

  const panel = document.createElement("section");
  panel.className = "learner-dashboard-card learner-test-tools";
  panel.id = "progress-check-controls";
  panel.hidden = true;

  const kicker = document.createElement("p");
  kicker.className = "kicker";
  kicker.textContent = "staging בלבד";
  const title = document.createElement("h2");
  title.textContent = "כלי בדיקה — staging בלבד";
  const description = document.createElement("p");
  description.append("הכפתורים כותבים רק למסמך הדגמה: ");
  const code = document.createElement("code");
  code.textContent = "users/{uid}/progress/demo-question-001";
  description.append(code, ".");

  const actions = document.createElement("div");
  actions.className = "related-links";
  const viewedButton = makeButton("רשום צפייה בשאלת בדיקה", recordViewed, "btn");
  viewedButton.id = "progress-viewed-button";
  const answeredButton = makeButton("רשום מענה לשאלת בדיקה", recordAnswered, "btn");
  answeredButton.id = "progress-answered-button";
  const loadButton = makeButton("טען התקדמות", loadProgress);
  loadButton.id = "progress-load-button";
  actions.append(viewedButton, answeredButton, loadButton);

  panel.append(kicker, title, description, actions);
  elements.debugPanel?.before(panel);
  elements.controls = panel;
  elements.viewedButton = viewedButton;
  elements.answeredButton = answeredButton;
  elements.loadButton = loadButton;
  return panel;
}

function updateTestToolsVisibility() {
  if (!shouldShowTestTools()) {
    if (elements.controls) {
      elements.controls.remove();
      elements.controls = null;
      elements.viewedButton = null;
      elements.answeredButton = null;
      elements.loadButton = null;
    }
    return;
  }
  const panel = ensureTestToolsPanel();
  panel.hidden = !state.user;
}

function renderDefinitionList(list, items) {
  if (!list) return;
  list.replaceChildren();

  Object.entries(items).forEach(([key, value]) => {
    const term = document.createElement("dt");
    term.textContent = key;
    const description = document.createElement("dd");
    description.textContent = String(value ?? "");
    list.append(term, description);
  });
}

function updateDebug(nextState = {}) {
  Object.assign(state, nextState);

  if (!readDebugFlag()) {
    if (elements.debugPanel) elements.debugPanel.hidden = true;
    if (elements.resultPanel) elements.resultPanel.hidden = true;
    updateTestToolsVisibility();
    return;
  }

  if (elements.debugPanel) elements.debugPanel.hidden = false;
  updateTestToolsVisibility();
  renderDefinitionList(elements.debug, {
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
    uid: state.user?.uid || "",
    email: state.user?.email || "",
    writeAttempted: state.writeAttempted,
    writeSuccess: state.writeSuccess,
    readSuccess: state.readSuccess,
    progressDocExists: state.progressDocExists,
    progressDocsCount: state.progressDocsCount,
    statsCalculated: state.statsCalculated,
    topicsCount: state.topicsCount,
    difficultiesCount: state.difficultiesCount,
    weakTopicsCount: state.weakTopicsCount,
    strongTopicsCount: state.strongTopicsCount,
    recommendedTopicsCount: state.recommendedTopicsCount,
    difficultyRecommendation: state.difficultyRecommendation,
    generatedRecommendationsCount: state.generatedRecommendationsCount,
    lastRecommendedTopic: state.lastRecommendedTopic,
    lastPracticeLaunchTarget: state.lastPracticeLaunchTarget,
    telemetryEventsCaptured: state.telemetryEventsCaptured,
    lastTelemetryEvent: state.lastTelemetryEvent,
    realQuestionsTrackedCount: state.realQuestionsTrackedCount,
    lastError: state.lastError,
  });
}

function setPanelState(nextState, heading, message) {
  document.body.dataset.progressCheckState = nextState;
  setText(elements.heading, heading);
  setText(elements.message, message);
  if (elements.message) elements.message.dataset.state = nextState;
}

function makeLink(text, href, className = "btn") {
  const link = document.createElement("a");
  link.className = className;
  link.href = href;
  link.textContent = text;
  return link;
}

function makeButton(text, onClick, className = "btn secondary") {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function latestProgressTime(progress) {
  return Math.max(
    timestampMillis(progress?.lastSeenAt),
    timestampMillis(progress?.answeredAt),
    timestampMillis(progress?.viewedAt)
  );
}

function buildPracticeTarget({ source = "", topic = "", lessonId = "", difficulty = "" } = {}) {
  const query = new URLSearchParams();
  if (topic) query.set("topic", topic);
  if (lessonId) query.set("lesson", lessonId);
  if (difficulty) query.set("difficulty", difficulty);
  const suffix = query.toString() ? `?${query.toString()}` : "";

  if (source === "exam") return `exam-questions.html${suffix}#simulation`;
  if (source === "practice") return `exam-questions.html${suffix}`;
  return `quizzes.html${suffix}#lessonPicker`;
}

function notePracticeLaunch(target, topic = "") {
  updateDebug({
    lastPracticeLaunchTarget: target,
    lastRecommendedTopic: topic,
  });
}

function setControlsEnabled(enabled) {
  [elements.viewedButton, elements.answeredButton, elements.loadButton].forEach((button) => {
    if (button) button.disabled = !enabled;
  });
}

function hideDashboardPanels() {
  [
    elements.dashboardContent,
    elements.controls,
    elements.resultPanel,
    elements.statsPanel,
  ].forEach((panel) => {
    if (panel) panel.hidden = true;
  });
}

function progressDocRef(uid) {
  return doc(db, "users", uid, "progress", DEMO_QUESTION_ID);
}

function progressCollectionRef(uid) {
  return collection(db, "users", uid, "progress");
}

function assertSafeProgressPayload(payload) {
  const keys = Object.keys(payload);
  const forbiddenKey = keys.find((key) => FORBIDDEN_PROGRESS_FIELDS.has(key));
  if (forbiddenKey) {
    throw new Error(`Forbidden progress field: ${forbiddenKey}`);
  }
}

function baseProgressPayload() {
  return {
    questionId: DEMO_QUESTION_ID,
    lessonId: "lesson-01",
    topic: "בטיחות כללית",
    subTopic: "בדיקת התקדמות",
    difficulty: "easy",
    lastSeenAt: serverTimestamp(),
  };
}

async function loadExistingProgress() {
  if (!state.user) return null;
  const snapshot = await getDoc(progressDocRef(state.user.uid));
  updateDebug({
    readSuccess: true,
    progressDocExists: snapshot.exists(),
    lastError: "",
  });
  return snapshot.exists() ? snapshot.data() : null;
}

async function recordViewed() {
  if (!state.user) return;

  setControlsEnabled(false);
  updateDebug({ writeAttempted: true, writeSuccess: false, lastError: "" });

  try {
    const payload = {
      ...baseProgressPayload(),
      viewedAt: serverTimestamp(),
    };
    assertSafeProgressPayload(payload);
    await setDoc(progressDocRef(state.user.uid), payload, { merge: true });
    updateDebug({ writeSuccess: true });
    await loadProgress();
  } catch (error) {
    updateDebug({ lastError: error?.message || "Failed to record viewed progress." });
  } finally {
    setControlsEnabled(true);
  }
}

async function recordAnswered() {
  if (!state.user) return;

  setControlsEnabled(false);
  updateDebug({ writeAttempted: true, writeSuccess: false, lastError: "" });

  try {
    const existing = await loadExistingProgress();
    const payload = {
      ...baseProgressPayload(),
      answeredAt: serverTimestamp(),
      selectedOptionId: "demo-option-a",
      isCorrect: true,
      attemptsCount: Number(existing?.attemptsCount || 0) + 1,
    };
    assertSafeProgressPayload(payload);
    await setDoc(progressDocRef(state.user.uid), payload, { merge: true });
    updateDebug({ writeSuccess: true });
    await loadProgress();
  } catch (error) {
    updateDebug({ lastError: error?.message || "Failed to record answered progress." });
  } finally {
    setControlsEnabled(true);
  }
}

function formatProgressForDisplay(progress) {
  if (!progress) return "No progress document found.";

  const safeProgress = { ...progress };
  FORBIDDEN_PROGRESS_FIELDS.forEach((field) => {
    delete safeProgress[field];
  });
  return JSON.stringify(safeProgress, null, 2);
}

function hasViewed(progress) {
  return Boolean(progress?.viewedAt || progress?.lastSeenAt);
}

function hasAnswered(progress) {
  return Boolean(progress?.answeredAt || progress?.selectedOptionId);
}

function isCorrect(progress) {
  return progress?.isCorrect === true;
}

function percent(correct, answered) {
  if (!answered) return "0%";
  return `${Math.round((correct / answered) * 100)}%`;
}

function accuracyValue(row) {
  if (!row.answered) return 0;
  return Math.round((row.correct / row.answered) * 100);
}

function makeEmptyBucket(label) {
  return {
    label,
    viewed: 0,
    answered: 0,
    correct: 0,
  };
}

function addProgressToBucket(bucket, progress) {
  if (hasViewed(progress)) bucket.viewed += 1;
  if (hasAnswered(progress)) bucket.answered += 1;
  if (isCorrect(progress)) bucket.correct += 1;
}

function calculateStats(progressDocs) {
  const summary = {
    totalViewed: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    accuracyPercent: "0%",
  };
  const topics = new Map();
  const difficulties = new Map([
    ["easy", makeEmptyBucket("easy")],
    ["medium", makeEmptyBucket("medium")],
    ["hard", makeEmptyBucket("hard")],
  ]);

  progressDocs.forEach((progress) => {
    if (hasViewed(progress)) summary.totalViewed += 1;
    if (hasAnswered(progress)) summary.totalAnswered += 1;
    if (isCorrect(progress)) summary.totalCorrect += 1;

    const topic = progress.topic || "unknown";
    if (!topics.has(topic)) topics.set(topic, makeEmptyBucket(topic));
    addProgressToBucket(topics.get(topic), progress);

    const difficulty = ["easy", "medium", "hard"].includes(progress.difficulty)
      ? progress.difficulty
      : "unknown";
    if (!difficulties.has(difficulty)) difficulties.set(difficulty, makeEmptyBucket(difficulty));
    addProgressToBucket(difficulties.get(difficulty), progress);
  });

  summary.accuracyPercent = percent(summary.totalCorrect, summary.totalAnswered);

  return {
    summary,
    topics: [...topics.values()],
    difficulties: [...difficulties.values()],
  };
}

function classifyTopics(topicRows) {
  const weakTopics = topicRows.filter((topic) => topic.answered >= 1 && accuracyValue(topic) < 70);
  const strongTopics = topicRows.filter((topic) => topic.answered >= 1 && accuracyValue(topic) >= 85);
  const needsMoreData = topicRows.filter((topic) => topic.viewed > 0 && topic.answered === 0);
  const fewAnswers = topicRows
    .filter((topic) => topic.answered > 0 && topic.answered < 3 && !weakTopics.includes(topic))
    .sort((a, b) => a.answered - b.answered || a.label.localeCompare(b.label));

  const recommendedTopics = [...weakTopics, ...needsMoreData, ...fewAnswers].filter(
    (topic, index, items) => items.findIndex((candidate) => candidate.label === topic.label) === index
  );

  return {
    weakTopics,
    strongTopics,
    needsMoreData,
    recommendedTopics,
  };
}

function difficultyByLabel(difficultyRows, label) {
  return difficultyRows.find((row) => row.label === label) || makeEmptyBucket(label);
}

function calculateDifficultyRecommendation(difficultyRows) {
  const easy = difficultyByLabel(difficultyRows, "easy");
  const medium = difficultyByLabel(difficultyRows, "medium");
  const hard = difficultyByLabel(difficultyRows, "hard");

  if (hard.answered >= 1 && accuracyValue(hard) < 70) {
    return "כדאי לחזור זמנית לרמת medium ולחזק את הבסיס לפני hard.";
  }

  if (medium.answered >= 1 && accuracyValue(medium) >= 85) {
    return "הביצועים ב-medium טובים. אפשר לנסות שאלות hard בהדרגה.";
  }

  if (easy.answered >= 1 && accuracyValue(easy) >= 85) {
    return "הביצועים ב-easy טובים. מומלץ לעבור לתרגול medium.";
  }

  return "נדרש עוד תרגול לפני המלצת רמת קושי ברורה.";
}

function difficultyPracticePlan(difficultyRows) {
  const easy = difficultyByLabel(difficultyRows, "easy");
  const medium = difficultyByLabel(difficultyRows, "medium");
  const hard = difficultyByLabel(difficultyRows, "hard");

  if (hard.answered >= 1 && accuracyValue(hard) < 70) {
    return {
      label: "מומלץ לחזור ל־medium",
      difficulty: "medium",
      target: buildPracticeTarget({ source: "exam", difficulty: "medium" }),
    };
  }

  if (medium.answered >= 1 && accuracyValue(medium) >= 85) {
    return {
      label: "מומלץ לעבור ל־hard",
      difficulty: "hard",
      target: buildPracticeTarget({ source: "exam", difficulty: "hard" }),
    };
  }

  if (easy.answered >= 1 && accuracyValue(easy) >= 85) {
    return {
      label: "מומלץ לעבור ל־medium",
      difficulty: "medium",
      target: buildPracticeTarget({ source: "exam", difficulty: "medium" }),
    };
  }

  return {
    label: "התחל תרגול בסיסי",
    difficulty: "easy",
    target: buildPracticeTarget({ source: "quiz", difficulty: "easy" }),
  };
}

function renderList(list, items, emptyText, formatter) {
  if (!list) return;
  list.replaceChildren();

  if (!items.length) {
    const item = document.createElement("li");
    item.textContent = emptyText;
    list.append(item);
    return;
  }

  items.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = formatter(entry);
    list.append(item);
  });
}

function renderActionList(list, items, emptyText, formatter) {
  if (!list) return;
  list.replaceChildren();

  if (!items.length) {
    const item = document.createElement("li");
    item.textContent = emptyText;
    list.append(item);
    return;
  }

  items.forEach((entry) => {
    const item = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = formatter(entry);
    const link = makeLink("תרגל עכשיו", buildPracticeTarget({ source: "exam", topic: entry.label }), "btn secondary");
    link.addEventListener("click", () => notePracticeLaunch(link.href, entry.label));
    item.append(text, link);
    list.append(item);
  });
}

function latestProgress(progressDocs) {
  return [...progressDocs]
    .filter((progress) => latestProgressTime(progress) > 0)
    .sort((a, b) => latestProgressTime(b) - latestProgressTime(a))[0] || null;
}

function renderContinuePractice(progressDocs) {
  const lastProgress = latestProgress(progressDocs);
  elements.lastPracticeActions?.replaceChildren();
  elements.lastPracticeDetails?.replaceChildren();

  if (!lastProgress) {
    setText(elements.lastPracticeSummary, "אין עדיין פעילות אחרונה.");
    return;
  }

  const source = lastProgress.source || "quiz";
  const target = buildPracticeTarget({
    source,
    topic: lastProgress.topic || "",
    lessonId: lastProgress.lessonId || "",
    difficulty: lastProgress.difficulty || "",
  });

  setText(elements.lastPracticeSummary, "אפשר להמשיך מהנושא האחרון שתורגל.");
  renderDefinitionList(elements.lastPracticeDetails, {
    topic: lastProgress.topic || "unknown",
    lessonId: lastProgress.lessonId || "",
    source,
  });

  const link = makeLink("המשך תרגול", target);
  link.addEventListener("click", () => notePracticeLaunch(target, lastProgress.topic || ""));
  elements.lastPracticeActions?.append(link);
}

function renderStatsTable(table, rows) {
  const body = table?.querySelector("tbody");
  if (!body) return;
  body.replaceChildren();

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    [row.label, row.viewed, row.answered, row.correct, percent(row.correct, row.answered)].forEach((value) => {
      const td = document.createElement("td");
      td.textContent = String(value);
      tr.append(td);
    });
    body.append(tr);
  });
}

function renderRecommendations(stats, hasProgress) {
  const topicGroups = classifyTopics(stats.topics);
  const difficultyRecommendation = calculateDifficultyRecommendation(stats.difficulties);
  const difficultyPlan = difficultyPracticePlan(stats.difficulties);
  const visibleRecommendations = topicGroups.recommendedTopics.slice(0, 3);

  renderList(
    elements.weakTopicsList,
    topicGroups.weakTopics,
    hasProgress ? "לא זוהו נושאים חלשים לפי הנתונים הקיימים." : "אין עדיין מספיק נתונים.",
    (topic) => `${topic.label} (${accuracyValue(topic)}% דיוק, ${topic.answered} מענה/ים)`
  );
  renderList(
    elements.strongTopicsList,
    topicGroups.strongTopics,
    hasProgress ? "עדיין אין מספיק נתונים לזיהוי נושאים חזקים." : "אין עדיין מספיק נתונים.",
    (topic) => `${topic.label} (${accuracyValue(topic)}% דיוק)`
  );
  renderActionList(
    elements.weakPracticeList,
    topicGroups.weakTopics,
    hasProgress ? "אין כרגע נושאים חלשים." : "אין עדיין מספיק נתונים.",
    (topic) => `${topic.label} (${accuracyValue(topic)}% דיוק, ${topic.answered} ניסיון/ות)`
  );
  renderActionList(
    elements.recommendedTopicsList,
    visibleRecommendations,
    hasProgress ? "עדיין אין מספיק נתונים לתרגול מומלץ." : "עדיין אין מספיק נתונים להמלצות.",
    (topic) => `${topic.label} - ${topic.answered ? `${topic.answered} מענה/ים` : "נדרשת התחלת תרגול"}`
  );
  setText(elements.difficultyRecommendationText, hasProgress ? difficultyRecommendation : "עדיין אין מספיק נתונים להמלצות.");
  elements.difficultyPracticeActions?.replaceChildren();
  if (hasProgress) {
    const link = makeLink("התחל תרגול מומלץ", difficultyPlan.target);
    link.addEventListener("click", () => notePracticeLaunch(difficultyPlan.target, difficultyPlan.difficulty));
    elements.difficultyPracticeActions?.append(link);
  }

  updateDebug({
    weakTopicsCount: topicGroups.weakTopics.length,
    strongTopicsCount: topicGroups.strongTopics.length,
    recommendedTopicsCount: visibleRecommendations.length,
    difficultyRecommendation,
    generatedRecommendationsCount: visibleRecommendations.length + topicGroups.weakTopics.length + (hasProgress ? 1 : 0),
    lastRecommendedTopic: visibleRecommendations[0]?.label || "",
  });
}

function renderProgressStats(progressDocs) {
  const stats = calculateStats(progressDocs);
  const hasProgress = progressDocs.length > 0;
  const realQuestionsTrackedCount = progressDocs.filter((progress) => progress.questionId !== DEMO_QUESTION_ID).length;
  const telemetryDebug = readTelemetryDebug();

  if (elements.dashboardContent) elements.dashboardContent.hidden = false;
  if (elements.statsPanel) elements.statsPanel.hidden = false;
  if (elements.statsEmpty) elements.statsEmpty.hidden = hasProgress;

  renderDefinitionList(elements.statsSummary, {
    totalViewed: stats.summary.totalViewed,
    totalAnswered: stats.summary.totalAnswered,
    totalCorrect: stats.summary.totalCorrect,
    accuracyPercent: stats.summary.accuracyPercent,
  });
  renderStatsTable(elements.topicStatsTable, stats.topics);
  renderStatsTable(elements.difficultyStatsTable, stats.difficulties);
  renderContinuePractice(progressDocs);
  renderRecommendations(stats, hasProgress);

  updateDebug({
    progressDocsCount: progressDocs.length,
    statsCalculated: true,
    topicsCount: stats.topics.length,
    difficultiesCount: stats.difficulties.length,
    telemetryEventsCaptured: telemetryDebug.telemetryEventsCaptured,
    lastTelemetryEvent: telemetryDebug.lastTelemetryEvent,
    realQuestionsTrackedCount,
  });
}

function readTelemetryDebug() {
  try {
    const rawDebug = window.localStorage.getItem("ehsProgressTelemetryDebug");
    if (!rawDebug) return { telemetryEventsCaptured: 0, lastTelemetryEvent: "" };
    const debug = JSON.parse(rawDebug);
    return {
      telemetryEventsCaptured: Number(debug?.telemetryEventsCaptured || 0),
      lastTelemetryEvent: String(debug?.lastTelemetryEvent || ""),
    };
  } catch (error) {
    return { telemetryEventsCaptured: 0, lastTelemetryEvent: "" };
  }
}

async function loadAllProgressDocs() {
  if (!state.user) return [];
  const snapshot = await getDocs(progressCollectionRef(state.user.uid));
  return snapshot.docs.map((progressDoc) => ({
    id: progressDoc.id,
    ...progressDoc.data(),
  }));
}

async function loadProgress() {
  if (!state.user) return;

  setControlsEnabled(false);
  try {
    const progress = await loadExistingProgress();
    if (readDebugFlag() && elements.resultPanel) {
      elements.resultPanel.hidden = false;
      setText(elements.result, formatProgressForDisplay(progress));
    }
    const allProgress = await loadAllProgressDocs();
    renderProgressStats(allProgress);
  } catch (error) {
    updateDebug({
      readSuccess: false,
      progressDocExists: false,
      statsCalculated: false,
      lastError: error?.message || "Failed to load progress.",
    });
  } finally {
    setControlsEnabled(true);
  }
}

function resetProgressDebug() {
  return {
    writeAttempted: false,
    writeSuccess: false,
    readSuccess: false,
    progressDocExists: false,
    progressDocsCount: 0,
    statsCalculated: false,
    topicsCount: 0,
    difficultiesCount: 0,
    weakTopicsCount: 0,
    strongTopicsCount: 0,
    recommendedTopicsCount: 0,
    difficultyRecommendation: "",
    generatedRecommendationsCount: 0,
    lastRecommendedTopic: "",
    lastPracticeLaunchTarget: "",
    telemetryEventsCaptured: 0,
    lastTelemetryEvent: "",
    realQuestionsTrackedCount: 0,
    lastError: "",
  };
}

function renderCheckingAuth() {
  state.user = null;
  hideDashboardPanels();
  elements.actions?.replaceChildren();
  setPanelState("checking-auth", "בודק התחברות...", "בודק התחברות...");
  updateDebug(resetProgressDebug());
}

function renderUnauthenticated() {
  state.user = null;
  hideDashboardPanels();
  setPanelState("unauthenticated", "נדרשת התחברות", "כדי לצפות בלוח ההתקדמות יש להתחבר.");
  elements.actions?.replaceChildren(
    makeLink("מעבר להתחברות", "../login.html"),
    makeLink("חזרה לדף הבית", "../index.html", "btn secondary")
  );
  if (elements.userDetails) {
    elements.userDetails.hidden = true;
    elements.userDetails.replaceChildren();
  }
  updateDebug(resetProgressDebug());
}

function renderAuthenticated(user) {
  state.user = user;
  updateTestToolsVisibility();
  setPanelState("authenticated", "לוח התקדמות פעיל", `מחובר כ: ${user.displayName || user.email || user.uid}`);
  elements.actions?.replaceChildren(
    makeLink("חזרה לדף הבית", "../index.html", "btn secondary"),
    makeButton("התנתקות", async () => {
      try {
        renderCheckingAuth();
        await signOut(auth);
      } catch (error) {
        updateDebug({ lastError: error?.message || "Sign out failed." });
      }
    })
  );
  renderDefinitionList(elements.userDetails, {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
  });
  if (elements.userDetails) elements.userDetails.hidden = false;
  updateDebug({ user, lastError: "" });
  loadProgress();
}

function bindEvents() {
  elements.viewedButton?.addEventListener("click", recordViewed);
  elements.answeredButton?.addEventListener("click", recordAnswered);
  elements.loadButton?.addEventListener("click", loadProgress);
}

function init() {
  renderCheckingAuth();
  bindEvents();

  if (!auth || !db) {
    setPanelState("auth-error", "שגיאת תצורה", "Firebase אינו מוגדר בדף הבדיקה.");
    updateDebug({ lastError: "Firebase Auth or Firestore is not configured." });
    return;
  }

  onAuthStateChanged(
    auth,
    (user) => {
      if (!user) {
        renderUnauthenticated();
        return;
      }

      renderAuthenticated(user);
    },
    (error) => {
      setPanelState("auth-error", "שגיאת התחברות", "לא ניתן היה לבדוק את מצב ההתחברות.");
      updateDebug({ lastError: error?.message || "Auth state check failed." });
    }
  );
}

init();

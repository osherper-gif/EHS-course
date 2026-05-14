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
  lastError: "",
};

const elements = {
  heading: document.getElementById("progress-check-heading"),
  message: document.getElementById("progress-check-message"),
  userDetails: document.getElementById("progress-check-user-details"),
  actions: document.getElementById("progress-check-actions"),
  controls: document.getElementById("progress-check-controls"),
  debug: document.getElementById("progress-check-debug"),
  resultPanel: document.getElementById("progress-check-result-panel"),
  result: document.getElementById("progress-check-result"),
  statsPanel: document.getElementById("progress-stats-panel"),
  statsEmpty: document.getElementById("progress-stats-empty"),
  statsSummary: document.getElementById("progress-stats-summary"),
  topicStatsTable: document.getElementById("progress-topic-stats-table"),
  difficultyStatsTable: document.getElementById("progress-difficulty-stats-table"),
  viewedButton: document.getElementById("progress-viewed-button"),
  answeredButton: document.getElementById("progress-answered-button"),
  loadButton: document.getElementById("progress-load-button"),
};

function setText(element, value) {
  if (element) element.textContent = value;
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

function setControlsEnabled(enabled) {
  [elements.viewedButton, elements.answeredButton, elements.loadButton].forEach((button) => {
    if (button) button.disabled = !enabled;
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
  if (!progress) {
    return "No progress document found.";
  }

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

function renderProgressStats(progressDocs) {
  const stats = calculateStats(progressDocs);
  const hasProgress = progressDocs.length > 0;

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

  updateDebug({
    progressDocsCount: progressDocs.length,
    statsCalculated: true,
    topicsCount: stats.topics.length,
    difficultiesCount: stats.difficulties.length,
  });
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
    if (elements.resultPanel) elements.resultPanel.hidden = false;
    setText(elements.result, formatProgressForDisplay(progress));
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

function renderCheckingAuth() {
  state.user = null;
  if (elements.controls) elements.controls.hidden = true;
  if (elements.resultPanel) elements.resultPanel.hidden = true;
  if (elements.statsPanel) elements.statsPanel.hidden = true;
  elements.actions?.replaceChildren();
  setPanelState("checking-auth", "בודק התחברות...", "בודק התחברות...");
  updateDebug({
    writeAttempted: false,
    writeSuccess: false,
    readSuccess: false,
    progressDocExists: false,
    progressDocsCount: 0,
    statsCalculated: false,
    topicsCount: 0,
    difficultiesCount: 0,
    lastError: "",
  });
}

function renderUnauthenticated() {
  state.user = null;
  if (elements.controls) elements.controls.hidden = true;
  if (elements.resultPanel) elements.resultPanel.hidden = true;
  if (elements.statsPanel) elements.statsPanel.hidden = true;
  setPanelState("unauthenticated", "נדרשת התחברות", "כדי לבדוק שמירת התקדמות יש להתחבר.");
  elements.actions?.replaceChildren(
    makeLink("מעבר להתחברות", "../login.html"),
    makeLink("חזרה לדף הבית", "../index.html", "btn secondary")
  );
  if (elements.userDetails) {
    elements.userDetails.hidden = true;
    elements.userDetails.replaceChildren();
  }
  updateDebug();
}

function renderAuthenticated(user) {
  state.user = user;
  if (elements.controls) elements.controls.hidden = false;
  setPanelState("authenticated", "משתמש מחובר", `מחובר כ: ${user.displayName || user.email || user.uid}`);
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

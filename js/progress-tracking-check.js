import {
  auth,
  db,
  doc,
  firebaseConfig,
  firebaseEnvironment,
  getDoc,
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

async function loadProgress() {
  if (!state.user) return;

  setControlsEnabled(false);
  try {
    const progress = await loadExistingProgress();
    if (elements.resultPanel) elements.resultPanel.hidden = false;
    setText(elements.result, formatProgressForDisplay(progress));
  } catch (error) {
    updateDebug({
      readSuccess: false,
      progressDocExists: false,
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
  elements.actions?.replaceChildren();
  setPanelState("checking-auth", "בודק התחברות...", "בודק התחברות...");
  updateDebug({
    writeAttempted: false,
    writeSuccess: false,
    readSuccess: false,
    progressDocExists: false,
    lastError: "",
  });
}

function renderUnauthenticated() {
  state.user = null;
  if (elements.controls) elements.controls.hidden = true;
  if (elements.resultPanel) elements.resultPanel.hidden = true;
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

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
  query,
  signOut,
} from "./firebase-config.js";
import { limit } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const PREVIEW_COLLECTION = "protectedQuestionPreviews";
const FORBIDDEN_ANSWER_FIELDS = new Set([
  "correctAnswer",
  "correctAnswerId",
  "correctIndex",
  "answerKey",
  "solution",
  "isCorrect",
  "explanation",
  "pointsByAnswer",
  "scoring",
]);

const state = {
  unsubscribe: null,
  approvalReadUid: "",
  debug: {
    authState: "checking-auth",
    uid: "",
    email: "",
    firestoreReadAttempted: false,
    firestoreReadSuccess: false,
    approved: "unknown",
    previewReadAttempted: false,
    previewReadSuccess: false,
    previewQuestionCount: 0,
    finalState: "checking-auth",
  },
};

const elements = {
  heading: document.getElementById("protected-auth-check-heading"),
  message: document.getElementById("protected-auth-check-message"),
  details: document.getElementById("protected-auth-check-details"),
  actions: document.getElementById("protected-auth-check-actions"),
  debugPanel: document.getElementById("protected-auth-check-debug-panel"),
  debug: document.getElementById("protected-auth-check-debug"),
  previewSection: document.getElementById("protected-preview-section"),
  previewList: document.getElementById("protected-preview-list"),
};

function setText(element, value) {
  if (element) element.textContent = value;
}

function clearActions() {
  elements.actions?.replaceChildren();
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

function readDebugFlag() {
  if (firebaseEnvironment !== "staging") return false;

  try {
    const rawFlags = window.localStorage.getItem("ehsDynamicContentFlags");
    if (!rawFlags) return false;
    const flags = JSON.parse(rawFlags);
    return flags?.debug === true;
  } catch (error) {
    return false;
  }
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

function renderDetails(items) {
  if (!elements.details) return;
  renderDefinitionList(elements.details, items);
  elements.details.hidden = false;
}

function updateDebug(nextDebug) {
  state.debug = { ...state.debug, ...nextDebug };

  if (!readDebugFlag()) {
    if (elements.debugPanel) elements.debugPanel.hidden = true;
    return;
  }

  if (elements.debugPanel) elements.debugPanel.hidden = false;
  renderDefinitionList(elements.debug, state.debug);
}

function hidePreview() {
  if (elements.previewSection) elements.previewSection.hidden = true;
  elements.previewList?.replaceChildren();
}

function renderState(nextState, title, message) {
  document.body.dataset.authCheckState = nextState;
  setText(elements.heading, title);
  setText(elements.message, message);
  if (elements.message) elements.message.dataset.state = nextState;
  clearActions();
  updateDebug({ finalState: nextState });
}

function resetPreviewDebug() {
  return {
    previewReadAttempted: false,
    previewReadSuccess: false,
    previewQuestionCount: 0,
  };
}

function renderCheckingAuth() {
  hidePreview();
  updateDebug({
    authState: "checking-auth",
    firestoreReadAttempted: false,
    firestoreReadSuccess: false,
    approved: "unknown",
    ...resetPreviewDebug(),
  });
  renderState("checking-auth", "בודק התחברות...", "בודק התחברות...");
  renderDetails({
    state: "checking-auth",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
    authDomain: firebaseConfig?.authDomain || "",
  });
}

function renderUnauthenticated() {
  state.approvalReadUid = "";
  hidePreview();
  updateDebug({
    authState: "unauthenticated",
    uid: "",
    email: "",
    approved: "unknown",
    ...resetPreviewDebug(),
  });
  renderState("unauthenticated", "לא מחובר", "לא מחובר");
  renderDetails({
    state: "unauthenticated",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
  elements.actions?.append(
    makeLink("מעבר להתחברות", "../login.html"),
    makeLink("חזרה לדף הבית", "../index.html", "btn secondary")
  );
}

function displayNameForUser(user) {
  return user?.displayName || user?.email || "משתמש מחובר";
}

function renderCheckingApproval(user) {
  hidePreview();
  updateDebug({
    authState: "authenticated",
    uid: user?.uid || "",
    email: user?.email || "",
    firestoreReadAttempted: true,
    firestoreReadSuccess: false,
    approved: "unknown",
    ...resetPreviewDebug(),
  });
  renderState("checking-approval", "בודק אישור...", "בודק האם המשתמש מאושר לצפייה בתוכן מוגן.");
  renderDetails({
    state: "checking-approval",
    uid: user?.uid || "",
    email: user?.email || "",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
}

function appendAuthenticatedActions(user) {
  elements.actions?.append(
    makeLink("חזרה לדף הבית", "../index.html", "btn secondary"),
    makeButton("התנתקות", async () => {
      try {
        renderCheckingAuth();
        await signOut(auth);
      } catch (error) {
        renderApprovalError(user, error);
      }
    })
  );
}

function renderApproved(user) {
  const label = displayNameForUser(user);
  updateDebug({
    authState: "authenticated",
    uid: user?.uid || "",
    email: user?.email || "",
    firestoreReadSuccess: true,
    approved: true,
  });
  renderState("approved", "המשתמש מאושר", `המשתמש מאושר: ${label}`);
  renderDetails({
    state: "approved",
    uid: user?.uid || "",
    email: user?.email || "",
    displayName: user?.displayName || "",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
  elements.actions?.append(
    makeButton("המשך לשלב הבא", () => {
      setText(elements.message, "זהו placeholder בלבד לשלב הבא. עדיין אין בדיקת תשובה או ניקוד בדף זה.");
    })
  );
  appendAuthenticatedActions(user);
}

function renderNoPreviewQuestions(user) {
  hidePreview();
  updateDebug({
    authState: "authenticated",
    uid: user?.uid || "",
    email: user?.email || "",
    previewReadAttempted: true,
    previewReadSuccess: true,
    previewQuestionCount: 0,
  });
  renderState("no-preview-questions", "אין שאלות Preview", "המשתמש מאושר, אך עדיין אין שאלות preview זמינות להצגה.");
  renderDetails({
    state: "no-preview-questions",
    uid: user?.uid || "",
    email: user?.email || "",
    collection: PREVIEW_COLLECTION,
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
  appendAuthenticatedActions(user);
}

function renderPreviewLoadError(user, error) {
  hidePreview();
  const code = error?.code || "preview-load-error";
  updateDebug({
    authState: "authenticated",
    uid: user?.uid || "",
    email: user?.email || "",
    previewReadAttempted: true,
    previewReadSuccess: false,
  });
  renderState("preview-load-error", "שגיאת טעינת Preview", "לא ניתן לטעון כרגע את שאלות ה-preview. נסו שוב מאוחר יותר.");
  renderDetails({
    state: "preview-load-error",
    uid: user?.uid || "",
    email: user?.email || "",
    collection: PREVIEW_COLLECTION,
    code,
    message: error?.message || "",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
  appendAuthenticatedActions(user);
}

function containsForbiddenAnswerField(value) {
  if (!value || typeof value !== "object") return false;

  if (Array.isArray(value)) {
    return value.some((item) => containsForbiddenAnswerField(item));
  }

  return Object.entries(value).some(([key, item]) => {
    return FORBIDDEN_ANSWER_FIELDS.has(key) || containsForbiddenAnswerField(item);
  });
}

function sanitizeOption(option, index) {
  if (typeof option === "string") return option;
  if (!option || typeof option !== "object") return `אפשרות ${index + 1}`;

  return {
    id: option.id || option.value || `option-${index + 1}`,
    text: option.text || option.label || String(option.value || ""),
  };
}

function sanitizePreviewQuestion(id, data) {
  if (containsForbiddenAnswerField(data)) {
    throw new Error("Preview question contains forbidden answer fields.");
  }

  return {
    id: data.id || id,
    lessonId: data.lessonId || "",
    topic: data.topic || "",
    difficulty: data.difficulty || "",
    questionText: data.questionText || "",
    options: Array.isArray(data.options) ? data.options.map(sanitizeOption) : [],
  };
}

function renderPreviewQuestions(questions) {
  if (!elements.previewSection || !elements.previewList) return;

  elements.previewList.replaceChildren();
  questions.forEach((question) => {
    const card = document.createElement("article");
    card.className = "content-card";

    const meta = document.createElement("p");
    meta.className = "kicker";
    meta.textContent = [question.lessonId, question.topic].filter(Boolean).join(" · ");

    const difficulty = document.createElement("span");
    difficulty.className = "tag";
    difficulty.textContent = question.difficulty || "preview";

    const title = document.createElement("h3");
    title.textContent = question.questionText;

    const options = document.createElement("ul");
    options.className = "checklist";
    question.options.forEach((option) => {
      const item = document.createElement("li");
      item.textContent = typeof option === "string" ? option : option.text;
      options.append(item);
    });

    card.append(meta, difficulty, title, options);
    elements.previewList.append(card);
  });

  elements.previewSection.hidden = false;
}

function renderNotApproved(user) {
  hidePreview();
  updateDebug({
    authState: "authenticated",
    uid: user?.uid || "",
    email: user?.email || "",
    firestoreReadSuccess: true,
    approved: false,
    ...resetPreviewDebug(),
  });
  renderState("not-approved", "המשתמש מחובר אך טרם אושר", "המשתמש מחובר אך טרם אושר לצפייה בתוכן המוגן.");
  renderDetails({
    state: "not-approved",
    uid: user?.uid || "",
    email: user?.email || "",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
  appendAuthenticatedActions(user);
}

function renderAuthError(error) {
  hidePreview();
  const code = error?.code || "auth-error";
  updateDebug({ authState: "auth-error", approved: "unknown", ...resetPreviewDebug() });
  renderState("auth-error", "שגיאת התחברות", "לא ניתן להשלים את בדיקת ההתחברות כרגע.");
  renderDetails({
    state: "auth-error",
    code,
    message: error?.message || "",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
  elements.actions?.append(
    makeLink("מעבר להתחברות", "../login.html"),
    makeLink("חזרה לדף הבית", "../index.html", "btn secondary")
  );
}

function renderApprovalError(user, error) {
  hidePreview();
  const code = error?.code || "approval-error";
  updateDebug({
    authState: user ? "authenticated" : "unknown",
    uid: user?.uid || "",
    email: user?.email || "",
    firestoreReadSuccess: false,
    approved: "unknown",
    ...resetPreviewDebug(),
  });
  renderState("approval-error", "שגיאת בדיקת אישור", "לא ניתן לאמת כרגע את הרשאת המשתמש. נסו שוב מאוחר יותר.");
  renderDetails({
    state: "approval-error",
    uid: user?.uid || "",
    email: user?.email || "",
    code,
    message: error?.message || "",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
  appendAuthenticatedActions(user);
}

async function waitForAuthReady() {
  if (typeof auth?.authStateReady === "function") {
    await auth.authStateReady();
  }
}

async function readApproval(user) {
  renderCheckingApproval(user);

  if (!db) {
    throw new Error("Firestore is not configured.");
  }

  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  updateDebug({ firestoreReadSuccess: true });

  if (!snapshot.exists()) return true;
  const profile = snapshot.data();
  return profile?.blocked !== true && profile?.status !== "blocked";
}

async function readPreviewQuestions(user) {
  updateDebug({
    uid: user?.uid || "",
    email: user?.email || "",
    previewReadAttempted: true,
    previewReadSuccess: false,
    previewQuestionCount: 0,
  });

  const previewQuery = query(collection(db, PREVIEW_COLLECTION), limit(3));
  const snapshot = await getDocs(previewQuery);
  const questions = snapshot.docs.map((previewDoc) => {
    return sanitizePreviewQuestion(previewDoc.id, previewDoc.data());
  });

  updateDebug({
    previewReadSuccess: true,
    previewQuestionCount: questions.length,
  });

  return questions;
}

async function loadApprovedPreview(user) {
  renderApproved(user);

  try {
    const questions = await readPreviewQuestions(user);
    if (!questions.length) {
      renderNoPreviewQuestions(user);
      return;
    }

    renderPreviewQuestions(questions);
  } catch (error) {
    renderPreviewLoadError(user, error);
  }
}

async function handleAuthenticatedUser(user) {
  if (state.approvalReadUid === user.uid) return;
  state.approvalReadUid = user.uid;

  try {
    const approved = await readApproval(user);
    if (approved) {
      loadApprovedPreview(user);
    } else {
      renderNotApproved(user);
    }
  } catch (error) {
    renderApprovalError(user, error);
  }
}

async function init() {
  renderCheckingAuth();

  if (!auth) {
    renderAuthError({ code: "auth/not-configured", message: "Firebase Auth is not configured." });
    return;
  }

  try {
    await waitForAuthReady();
    state.unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        handleAuthenticatedUser(user);
      } else {
        renderUnauthenticated();
      }
    });
  } catch (error) {
    renderAuthError(error);
  }
}

window.addEventListener("pagehide", () => {
  if (typeof state.unsubscribe === "function") state.unsubscribe();
});

init();

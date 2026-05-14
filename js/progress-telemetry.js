import {
  auth,
  db,
  doc,
  getDoc,
  onAuthStateChanged,
  serverTimestamp,
  setDoc,
} from "./firebase-config.js";

const FORBIDDEN_TELEMETRY_FIELDS = new Set([
  "correctAnswer",
  "answerKey",
  "solution",
  "allOptionsPayload",
  "fullQuestionPayload",
]);

const state = {
  user: auth?.currentUser || null,
  telemetryEventsCaptured: 0,
  lastTelemetryEvent: "",
};

function updateLocalDebug(eventName, detail = {}) {
  state.telemetryEventsCaptured += 1;
  state.lastTelemetryEvent = eventName;

  try {
    window.localStorage.setItem(
      "ehsProgressTelemetryDebug",
      JSON.stringify({
        telemetryEventsCaptured: state.telemetryEventsCaptured,
        lastTelemetryEvent: eventName,
        lastQuestionId: detail.questionId || "",
        lastSource: detail.source || "",
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    // Debug storage is optional; telemetry should not affect quiz UX.
  }
}

function progressDocRef(uid, questionId) {
  return doc(db, "users", uid, "progress", questionId);
}

function normalizeDifficulty(value) {
  const difficulty = String(value || "easy").toLowerCase();
  return ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "easy";
}

function sanitizeText(value, maxLength = 180) {
  return String(value || "").slice(0, maxLength);
}

function assertSafeTelemetryPayload(payload) {
  const forbiddenKey = Object.keys(payload).find((key) => FORBIDDEN_TELEMETRY_FIELDS.has(key));
  if (forbiddenKey) {
    throw new Error(`Forbidden telemetry field: ${forbiddenKey}`);
  }
}

function basePayload(detail) {
  return {
    questionId: sanitizeText(detail.questionId, 140),
    lessonId: sanitizeText(detail.lessonId, 140),
    topic: sanitizeText(detail.topic, 180),
    subTopic: sanitizeText(detail.subTopic, 180),
    difficulty: normalizeDifficulty(detail.difficulty),
    source: ["quiz", "exam", "practice"].includes(detail.source) ? detail.source : "quiz",
    lastSeenAt: serverTimestamp(),
  };
}

async function existingAttempts(uid, questionId) {
  const snapshot = await getDoc(progressDocRef(uid, questionId));
  return Number(snapshot.exists() ? snapshot.data()?.attemptsCount || 0 : 0);
}

async function writeTelemetry(detail, extraPayload = {}) {
  if (!state.user || !db) return;
  const questionId = sanitizeText(detail.questionId, 140);
  if (!questionId) return;

  const payload = {
    ...basePayload(detail),
    ...extraPayload,
  };
  assertSafeTelemetryPayload(payload);
  await setDoc(progressDocRef(state.user.uid, questionId), payload, { merge: true });
}

async function recordQuestionViewed(detail) {
  updateLocalDebug("question-viewed", detail);
  await writeTelemetry(detail, {
    viewedAt: serverTimestamp(),
  });
}

async function recordAnswerSubmitted(detail) {
  updateLocalDebug("answer-submitted", detail);
  if (!state.user) return;
  const questionId = sanitizeText(detail.questionId, 140);
  const attemptsCount = await existingAttempts(state.user.uid, questionId);
  await writeTelemetry(detail, {
    answeredAt: serverTimestamp(),
    selectedOptionId: sanitizeText(detail.selectedOptionId, 140),
    isCorrect: detail.isCorrect === true,
    attemptsCount: attemptsCount + 1,
  });
}

function handleTelemetryEvent(event) {
  const detail = event.detail || {};
  const eventType = detail.eventType || "";

  if (eventType === "question-viewed") {
    recordQuestionViewed(detail).catch((error) => {
      updateLocalDebug("question-viewed-error", { ...detail, error: error?.message || "" });
    });
    return;
  }

  if (eventType === "answer-submitted") {
    recordAnswerSubmitted(detail).catch((error) => {
      updateLocalDebug("answer-submitted-error", { ...detail, error: error?.message || "" });
    });
  }
}

if (auth) {
  onAuthStateChanged(auth, (user) => {
    state.user = user || null;
  });
}

window.addEventListener("course-progress-telemetry", handleTelemetryEvent);
window.CourseProgressTelemetry = {
  recordQuestionViewed,
  recordAnswerSubmitted,
};

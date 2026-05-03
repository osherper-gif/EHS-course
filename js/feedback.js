import {
  auth,
  db,
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "./firebase-config.js";

const ADMIN_EMAIL = "osherper@gmail.com";
const PENDING_FEEDBACK_KEY = "pendingFeedbackReports";
const QUESTION_ISSUE_TYPES = [
  "תשובה לא נכונה",
  "ניסוח לא ברור",
  "כמה תשובות נכונות",
  "שאלה לא רלוונטית",
  "קשה מדי",
  "קלה מדי",
  "אחר",
];
const REPORT_TYPES = [
  "תקלה",
  "שגיאת תוכן",
  "שאלה לא נכונה",
  "בעיית התחברות",
  "בעיית מובייל",
  "הצעת שיפור",
];

let activeProfile = null;
let lastMailto = "";
let lastFeedbackFocus = null;
let lastFailedReport = null;
let activeQuestionReport = null;
const questionStatusCache = new Map();

function clean(value, max = 2000) {
  return window.CourseAuth?.sanitizeText
    ? window.CourseAuth.sanitizeText(value, max)
    : String(value || "").replace(/[<>]/g, "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function buildMailto(report) {
  const subject = `דיווח באתר קורס ממונה בטיחות: ${report.type} - ${report.title}`;
  const body = [
    `סוג דיווח: ${report.type}`,
    `כותרת: ${report.title}`,
    `עמוד: ${report.pageUrl}`,
    `משתמש: ${report.userName || "-"}`,
    `אימייל: ${report.userEmail || "-"}`,
    `תאריך: ${new Date().toLocaleString("he-IL")}`,
    "",
    "תיאור:",
    report.description,
  ].join("\n");
  return `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function closeModal() {
  document.body.classList.remove("feedback-open");
  document.getElementById("feedbackModal")?.remove();
  activeQuestionReport = null;
  if (lastFeedbackFocus && typeof lastFeedbackFocus.focus === "function") {
    lastFeedbackFocus.focus();
  }
  lastFeedbackFocus = null;
}

function questionContextFromPreset(preset = {}) {
  if (!preset.questionId) return null;
  return {
    questionId: clean(preset.questionId, 140),
    lessonId: clean(preset.lessonId || preset.relatedLessonId, 120),
    topic: clean(preset.topic, 160),
    questionText: clean(preset.questionText || preset.question, 2000),
    correctAnswer: clean(preset.correctAnswer, 1000),
    selectedAnswer: clean(preset.selectedAnswer || preset.selected, 1000),
  };
}

function showStatus(text, type = "info") {
  const status = document.getElementById("feedbackStatus");
  if (!status) return;
  status.textContent = text;
  status.dataset.type = type;
}

function setRetryVisible(visible) {
  const retry = document.getElementById("feedbackRetry");
  if (retry) retry.hidden = !visible;
}

function loadPendingReports() {
  try {
    const raw = localStorage.getItem(PENDING_FEEDBACK_KEY);
    const reports = raw ? JSON.parse(raw) : [];
    return Array.isArray(reports) ? reports : [];
  } catch {
    return [];
  }
}

function savePendingReports(reports) {
  try {
    localStorage.setItem(PENDING_FEEDBACK_KEY, JSON.stringify(reports.slice(-20)));
  } catch {
    // localStorage is a best-effort fallback only.
  }
}

function rememberPendingReport(report) {
  const pending = loadPendingReports();
  const localId = report.localId || "feedback-" + Date.now();
  const stored = { ...report, localId, savedAt: new Date().toISOString() };
  if (!pending.some((item) => item.localId === localId)) pending.push(stored);
  savePendingReports(pending);
  lastFailedReport = stored;
  return stored;
}

function removePendingReport(localId) {
  if (!localId) return;
  savePendingReports(loadPendingReports().filter((report) => report.localId !== localId));
}

function reportPayload(form) {
  const firebaseUser = auth?.currentUser;
  return {
    type: clean(form.get("type"), 80),
    title: clean(form.get("title"), 160),
    description: clean(form.get("description"), 4000),
    pageUrl: clean(location.href, 1000),
    userId: clean(firebaseUser?.uid || activeProfile?.uid, 180),
    userName: clean(firebaseUser?.displayName || activeProfile?.displayName || activeProfile?.email, 180),
    userEmail: clean(firebaseUser?.email || activeProfile?.email, 320),
    status: "open",
    priority: "normal",
    adminNotes: "",
  };
}

async function saveReportToFirestore(report) {
  if (!db) throw new Error("feedback-db-not-initialized");
  if (!auth?.currentUser) throw new Error("feedback-user-not-authenticated");
  const safeReport = {
    type: clean(report.type, 80),
    title: clean(report.title, 160),
    description: clean(report.description, 4000),
    pageUrl: clean(report.pageUrl, 1000),
    userId: clean(auth.currentUser.uid, 180),
    userName: clean(report.userName || auth.currentUser.displayName || auth.currentUser.email, 180),
    userEmail: clean(report.userEmail || auth.currentUser.email, 320),
    status: "open",
    priority: "normal",
    adminNotes: "",
  };
  const ref = doc(collection(db, "feedbackReports"));
  await setDoc(ref, {
    ...safeReport,
    reportId: ref.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

async function saveQuestionReportToFirestore(report) {
  if (!db) throw new Error("question-report-db-not-initialized");
  if (!auth?.currentUser) throw new Error("question-report-user-not-authenticated");
  const ref = doc(collection(db, "questionReports"));
  await setDoc(ref, {
    reportId: ref.id,
    questionId: clean(report.questionId, 140),
    lessonId: clean(report.lessonId, 120),
    issueType: clean(report.issueType, 120),
    freeText: clean(report.freeText, 2000),
    questionText: clean(report.questionText, 2000),
    correctAnswer: clean(report.correctAnswer, 1000),
    selectedAnswer: clean(report.selectedAnswer, 1000),
    userId: clean(auth.currentUser.uid, 180),
    userEmail: clean(auth.currentUser.email || activeProfile?.email, 320),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

async function saveQuestionRating(question, rating) {
  if (!db) throw new Error("question-rating-db-not-initialized");
  if (!auth?.currentUser) throw new Error("question-rating-user-not-authenticated");
  const safeQuestionId = clean(question.questionId || question.id, 140);
  const safeRating = Math.max(1, Math.min(5, Number(rating || 0)));
  const ratingId = safeQuestionId + "_" + clean(auth.currentUser.uid, 180);
  await setDoc(doc(db, "questionRatings", ratingId), {
    ratingId,
    questionId: safeQuestionId,
    lessonId: clean(question.lessonId || question.relatedLessonId, 120),
    rating: safeRating,
    userId: clean(auth.currentUser.uid, 180),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  if (safeRating < 3) {
    await setDoc(doc(db, "questionFeedback", safeQuestionId), {
      questionId: safeQuestionId,
      lessonId: clean(question.lessonId || question.relatedLessonId, 120),
      status: "needs-review",
      lastLowRating: safeRating,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
}

async function flushPendingReports() {
  if (!db || !auth?.currentUser) return;
  const pending = loadPendingReports();
  if (!pending.length) return;
  for (const report of pending) {
    try {
      await saveReportToFirestore(report);
      removePendingReport(report.localId);
    } catch (error) {
      console.error("[feedback] pending report retry failed", error);
      break;
    }
  }
}

async function submitFeedback(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  if (activeQuestionReport) {
    const issueType = clean(form.get("issueType"), 120);
    const freeText = clean(form.get("freeText"), 2000);
    const questionReport = { ...activeQuestionReport, issueType, freeText };
    if (!issueType) {
      showStatus("יש לבחור מה הבעיה בשאלה.", "error");
      return;
    }
    const submit = event.currentTarget.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      await saveQuestionReportToFirestore(questionReport);
      showStatus("הדיווח על השאלה התקבל. תודה על העזרה בשיפור המאגר.", "success");
      window.setTimeout(closeModal, 1000);
    } catch (error) {
      console.error("[feedback] failed to save question report", error);
      showStatus("לא ניתן היה לשמור את הדיווח כרגע. אפשר לנסות שוב או לשלוח דיווח כללי.", "error");
    } finally {
      if (submit) submit.disabled = false;
    }
    return;
  }
  const report = reportPayload(form);
  lastMailto = buildMailto(report);
  setRetryVisible(false);

  if (!report.title || !report.description) {
    showStatus("יש למלא כותרת ותיאור.", "error");
    return;
  }

  if (!auth?.currentUser) {
    rememberPendingReport(report);
    showStatus("צריך להתחבר מחדש כדי לשמור את הדיווח בענן. הדיווח נשמר זמנית במכשיר ואפשר לשלוח אותו במייל.", "error");
    setRetryVisible(true);
    const mailButton = document.getElementById("feedbackMailto");
    if (mailButton) {
      mailButton.hidden = false;
      mailButton.href = lastMailto;
    }
    return;
  }

  const submit = event.currentTarget.querySelector('[type="submit"]');
  if (submit) submit.disabled = true;

  try {
    await saveReportToFirestore(report);
    if (lastFailedReport?.localId) removePendingReport(lastFailedReport.localId);
    lastFailedReport = null;
    showStatus("הדיווח נשלח בהצלחה. תודה!", "success");
    event.currentTarget.reset();
  } catch (error) {
    console.error("[feedback] failed to save report", error);
    rememberPendingReport(report);
    showStatus("הדיווח לא נשמר בענן כרגע (ייתכן בעיית חיבור). הוא נשמר זמנית במכשיר. אפשר לנסות שוב או לשלוח במייל.", "error");
    setRetryVisible(true);
  } finally {
    if (submit) submit.disabled = false;
    const mailButton = document.getElementById("feedbackMailto");
    if (mailButton) {
      mailButton.hidden = false;
      mailButton.href = lastMailto;
    }
  }
}

function openModal(preset = {}) {
  if (document.getElementById("feedbackModal")) return;
  activeQuestionReport = questionContextFromPreset(preset);
  lastFeedbackFocus = document.activeElement;
  document.body.classList.add("feedback-open");
  const overlay = el("div", "feedback-overlay");
  overlay.id = "feedbackModal";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "feedbackTitle");

  const panel = el("section", "feedback-dialog");
  const header = el("div", "feedback-dialog-head");
  const heading = el("h2", "", "דווח תקלה / הצעת שיפור");
  heading.id = "feedbackTitle";
  const close = el("button", "icon-btn", "×");
  close.type = "button";
  close.title = "סגירה";
  close.setAttribute("aria-label", "סגירת חלון דיווח");
  close.addEventListener("click", closeModal);
  header.append(heading, close);

  const form = el("form", "feedback-form");
  form.addEventListener("submit", submitFeedback);
  form.addEventListener("input", () => {
    const mailButton = document.getElementById("feedbackMailto");
    if (mailButton) mailButton.href = buildMailto(reportPayload(new FormData(form)));
  });

  const typeLabel = el("label");
  typeLabel.append(el("span", "", "סוג דיווח"));
  const typeSelect = el("select");
  typeSelect.name = "type";
  REPORT_TYPES.forEach((type) => {
    const option = el("option", "", type);
    option.value = type;
    typeSelect.append(option);
  });
  if (preset.type && REPORT_TYPES.includes(preset.type)) typeSelect.value = preset.type;
  typeLabel.append(typeSelect);

  const titleLabel = el("label");
  titleLabel.append(el("span", "", "כותרת קצרה"));
  const titleInput = el("input");
  titleInput.name = "title";
  titleInput.maxLength = 160;
  titleInput.required = true;
  if (preset.title) titleInput.value = clean(preset.title, 160);
  titleLabel.append(titleInput);

  const descLabel = el("label");
  descLabel.append(el("span", "", "תיאור"));
  const desc = el("textarea");
  desc.name = "description";
  desc.rows = 6;
  desc.maxLength = 4000;
  desc.required = true;
  if (preset.description) desc.value = clean(preset.description, 4000);
  descLabel.append(desc);

  const questionBox = el("div", "question-feedback-context");
  let issueLabel = null;
  let freeTextLabel = null;
  if (activeQuestionReport) {
    heading.textContent = "דווח על שאלה";
    questionBox.append(
      el("h3", "", "פרטי השאלה"),
      el("p", "", "שאלה: " + (activeQuestionReport.questionText || "-")),
      el("p", "", "התשובה הנכונה: " + (activeQuestionReport.correctAnswer || "-")),
      el("p", "", "הבחירה שלך: " + (activeQuestionReport.selectedAnswer || "לא נבחרה תשובה"))
    );
    issueLabel = el("label");
    issueLabel.append(el("span", "", "מה הבעיה בשאלה?"));
    const issueSelect = el("select");
    issueSelect.name = "issueType";
    issueSelect.required = true;
    QUESTION_ISSUE_TYPES.forEach((issue) => {
      const option = el("option", "", issue);
      option.value = issue;
      issueSelect.append(option);
    });
    issueLabel.append(issueSelect);
    freeTextLabel = el("label");
    freeTextLabel.append(el("span", "", "פירוט חופשי"));
    const freeText = el("textarea");
    freeText.name = "freeText";
    freeText.rows = 4;
    freeText.maxLength = 2000;
    freeText.placeholder = "מה לדעתך צריך לתקן או לבדוק?";
    freeTextLabel.append(freeText);
    typeLabel.hidden = true;
    titleLabel.hidden = true;
    descLabel.hidden = true;
    titleInput.required = false;
    desc.required = false;
  }

  const meta = el("div", "feedback-meta");
  meta.append(
    el("p", "", `עמוד נוכחי: ${location.href}`),
    el("p", "", `משתמש: ${activeProfile?.displayName || activeProfile?.email || "-"}`),
    el("p", "", `אימייל: ${activeProfile?.email || "-"}`),
    el("p", "", `תאריך: ${new Date().toLocaleString("he-IL")}`)
  );

  const actions = el("div", "form-actions");
  const submit = el("button", "btn", "שלח דיווח");
  submit.type = "submit";
  const mailto = el("a", "btn secondary", "שלח גם במייל");
  mailto.id = "feedbackMailto";
  mailto.href = `mailto:${ADMIN_EMAIL}`;
  const retry = el("button", "btn secondary", "נסה שוב");
  retry.id = "feedbackRetry";
  retry.type = "button";
  retry.hidden = true;
  retry.addEventListener("click", () => form.requestSubmit());
  actions.append(submit, retry, mailto);

  const status = el("p", "feedback-status");
  status.id = "feedbackStatus";
  status.setAttribute("aria-live", "polite");

  form.append(typeLabel, titleLabel, descLabel);
  if (activeQuestionReport) form.append(questionBox, issueLabel, freeTextLabel);
  form.append(meta, actions, status);
  panel.append(header, form);
  overlay.append(panel);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });
  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(overlay.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((node) => node.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  document.body.append(overlay);
  titleInput.focus();
}

function ensureFeedbackButton(profile) {
  if (location.pathname.endsWith("/login.html") || location.pathname.endsWith("login.html")) return;
  if (document.getElementById("feedbackButton")) return;
  activeProfile = profile;
  const button = el("button", "feedback-button", "דווח תקלה");
  button.id = "feedbackButton";
  button.type = "button";
  button.addEventListener("click", openModal);
  document.body.append(button);
}

document.addEventListener("course-auth-approved", (event) => {
  activeProfile = event.detail;
  ensureFeedbackButton(event.detail);
  flushPendingReports();
});

window.CourseFeedback = {
  open: openModal,
  openQuestionReport: openModal,
  showQuestionStatus: async (questionId, container) => {
    if (!db || !auth?.currentUser || !questionId || !container) return;
    try {
      const safeQuestionId = clean(questionId, 140);
      let status = questionStatusCache.get(safeQuestionId);
      if (!status) {
        const snapshot = await getDoc(doc(db, "questionFeedback", safeQuestionId));
        status = snapshot.exists() ? snapshot.data()?.status : "ok";
        questionStatusCache.set(safeQuestionId, status || "ok");
      }
      if (status === "needs-review" && !container.querySelector(".question-review-flag")) {
        const flag = el("p", "question-review-flag", "שאלה זו נמצאת בבדיקה");
        container.prepend(flag);
      }
    } catch {
      // Review status is informational only.
    }
  },
  rateQuestion: async (question, rating, statusElement) => {
    try {
      await saveQuestionRating(question, rating);
      if (statusElement) {
        statusElement.textContent = "הדירוג נשמר. תודה!";
        statusElement.dataset.type = "success";
      }
    } catch (error) {
      console.error("[feedback] failed to save question rating", error);
      if (statusElement) {
        statusElement.textContent = "לא ניתן לשמור דירוג כרגע.";
        statusElement.dataset.type = "error";
      }
    }
  },
};

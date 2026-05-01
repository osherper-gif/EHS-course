import {
  db,
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "./firebase-config.js";

const ADMIN_EMAIL = "osherper@gmail.com";
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
}

function showStatus(text, type = "info") {
  const status = document.getElementById("feedbackStatus");
  if (!status) return;
  status.textContent = text;
  status.dataset.type = type;
}

function reportPayload(form) {
  return {
    type: clean(form.get("type"), 80),
    title: clean(form.get("title"), 160),
    description: clean(form.get("description"), 4000),
    pageUrl: clean(location.href, 1000),
    userId: clean(activeProfile?.uid, 180),
    userName: clean(activeProfile?.displayName || activeProfile?.email, 180),
    userEmail: clean(activeProfile?.email, 320),
    status: "open",
    priority: "normal",
    adminNotes: "",
  };
}

async function submitFeedback(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const report = reportPayload(form);
  lastMailto = buildMailto(report);

  if (!report.title || !report.description) {
    showStatus("יש למלא כותרת ותיאור.", "error");
    return;
  }

  const submit = event.currentTarget.querySelector('[type="submit"]');
  if (submit) submit.disabled = true;

  try {
    const ref = doc(collection(db, "feedbackReports"));
    await setDoc(ref, {
      ...report,
      reportId: ref.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    showStatus("הדיווח התקבל. תודה על העזרה בשיפור האתר.", "success");
    event.currentTarget.reset();
  } catch {
    showStatus("לא ניתן היה לשמור את הדיווח כרגע. אפשר לשלוח אותו במייל.", "error");
  } finally {
    if (submit) submit.disabled = false;
    const mailButton = document.getElementById("feedbackMailto");
    if (mailButton) {
      mailButton.hidden = false;
      mailButton.href = lastMailto;
    }
  }
}

function openModal() {
  if (document.getElementById("feedbackModal")) return;
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
  typeLabel.append(typeSelect);

  const titleLabel = el("label");
  titleLabel.append(el("span", "", "כותרת קצרה"));
  const titleInput = el("input");
  titleInput.name = "title";
  titleInput.maxLength = 160;
  titleInput.required = true;
  titleLabel.append(titleInput);

  const descLabel = el("label");
  descLabel.append(el("span", "", "תיאור"));
  const desc = el("textarea");
  desc.name = "description";
  desc.rows = 6;
  desc.maxLength = 4000;
  desc.required = true;
  descLabel.append(desc);

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
  actions.append(submit, mailto);

  const status = el("p", "feedback-status");
  status.id = "feedbackStatus";
  status.setAttribute("aria-live", "polite");

  form.append(typeLabel, titleLabel, descLabel, meta, actions, status);
  panel.append(header, form);
  overlay.append(panel);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
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
});

window.CourseFeedback = {
  open: openModal,
};

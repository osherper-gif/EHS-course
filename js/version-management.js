import {
  ADMIN_EMAIL,
  db,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
} from "./firebase-config.js";

const VERSION_COLLECTION = "siteVersions";
let versions = [];
let approvedUsers = [];

function clean(value, max = 5000) {
  return window.CourseAuth?.sanitizeText
    ? window.CourseAuth.sanitizeText(value, max)
    : String(value || "").replace(/[<>]/g, "").trim().slice(0, max);
}

function isAdmin(profile) {
  return profile?.role === "admin" || String(profile?.email || "").toLowerCase() === ADMIN_EMAIL;
}

function statusLabel(status) {
  return {
    draft: "טיוטה",
    published: "פורסם",
    sent: "נשלח למשתמשים",
    emailPrepared: "מייל הוכן",
  }[status] || status || "טיוטה";
}

function setStatus(message) {
  const box = document.getElementById("versionStatus");
  if (box) box.textContent = message;
}

function formData() {
  const form = document.getElementById("versionForm");
  const data = new FormData(form);
  const versionId = clean(data.get("versionId"), 180) || "version-" + Date.now();
  return {
    versionId,
    versionNumber: clean(data.get("versionNumber"), 80),
    releaseDate: clean(data.get("releaseDate"), 40),
    releaseTime: clean(data.get("releaseTime"), 40),
    createdBy: clean(window.CourseAuth?.profile?.email || ADMIN_EMAIL, 320),
    addedRequirements: clean(data.get("addedRequirements")),
    siteChanges: clean(data.get("siteChanges")),
    fixedBugs: clean(data.get("fixedBugs")),
    uiUxChanges: clean(data.get("uiUxChanges")),
    securityChanges: clean(data.get("securityChanges")),
    contentChanges: clean(data.get("contentChanges")),
    firebaseChanges: clean(data.get("firebaseChanges")),
    releaseNotes: clean(data.get("releaseNotes")),
    status: clean(data.get("status"), 40) || "draft",
  };
}

function fillForm(version) {
  const form = document.getElementById("versionForm");
  if (!form) return;
  [
    "versionId",
    "versionNumber",
    "releaseDate",
    "releaseTime",
    "addedRequirements",
    "siteChanges",
    "fixedBugs",
    "uiUxChanges",
    "securityChanges",
    "contentChanges",
    "firebaseChanges",
    "releaseNotes",
    "status",
  ].forEach((name) => {
    const field = form.elements[name];
    if (field) field.value = version?.[name] || "";
  });
  window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" });
}

function resetForm() {
  const form = document.getElementById("versionForm");
  form?.reset();
  if (form?.elements.versionId) form.elements.versionId.value = "";
  const today = new Date();
  if (form?.elements.releaseDate) form.elements.releaseDate.value = today.toISOString().slice(0, 10);
  if (form?.elements.releaseTime) form.elements.releaseTime.value = today.toTimeString().slice(0, 5);
}

function cell(text) {
  const td = document.createElement("td");
  td.textContent = text || "-";
  return td;
}

function actionButton(label, action, versionId, disabled = false) {
  const button = document.createElement("button");
  button.className = action === "delete" ? "btn danger" : "btn secondary";
  button.type = "button";
  button.dataset.versionAction = action;
  button.dataset.versionId = versionId;
  button.textContent = label;
  button.disabled = disabled;
  return button;
}

function summarize(version) {
  return [version.addedRequirements, version.siteChanges, version.fixedBugs, version.releaseNotes]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 220);
}

function renderVersions() {
  const tbody = document.getElementById("versionsTableBody");
  if (!tbody) return;
  tbody.replaceChildren();
  versions.forEach((version) => {
    const tr = document.createElement("tr");
    tr.append(
      cell(version.versionNumber),
      cell([version.releaseDate, version.releaseTime].filter(Boolean).join(" ")),
      cell(version.createdBy),
      cell(statusLabel(version.status)),
      cell(summarize(version))
    );
    const actions = document.createElement("td");
    actions.className = "admin-actions-cell";
    actions.append(
      actionButton("עריכה", "edit", version.versionId),
      actionButton("מחיקה", "delete", version.versionId, version.status !== "draft"),
      actionButton("סמן כפורסם", "publish", version.versionId, version.status === "published" || version.status === "sent"),
      actionButton("שלח מייל למשתמשי האתר", "prepareEmail", version.versionId)
    );
    tr.append(actions);
    tbody.append(tr);
  });
}

async function loadVersions() {
  setStatus("טוען גרסאות...");
  const snapshot = await getDocs(query(collection(db, VERSION_COLLECTION), orderBy("createdAt", "desc")));
  versions = snapshot.docs.map((item) => item.data());
  renderVersions();
  setStatus("נטענו " + versions.length + " גרסאות.");
}

async function loadApprovedUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  approvedUsers = snapshot.docs.map((item) => item.data()).filter((user) => user.status === "approved" && user.email);
}

async function saveVersion(event) {
  event.preventDefault();
  const data = formData();
  if (!data.versionNumber || !data.releaseDate || !data.releaseTime) {
    setStatus("יש למלא מספר גרסה, תאריך ושעה.");
    return;
  }
  const ref = doc(db, VERSION_COLLECTION, data.versionId);
  const exists = versions.some((version) => version.versionId === data.versionId);
  await setDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
    ...(exists ? {} : { createdAt: serverTimestamp() }),
  }, { merge: true });
  setStatus("הגרסה נשמרה.");
  resetForm();
  await loadVersions();
}

async function publishVersion(versionId) {
  await updateDoc(doc(db, VERSION_COLLECTION, versionId), {
    status: "published",
    updatedAt: serverTimestamp(),
  });
  await loadVersions();
}

async function deleteVersion(versionId) {
  const version = versions.find((item) => item.versionId === versionId);
  if (!version || version.status !== "draft") {
    setStatus("ניתן למחוק רק גרסה בסטטוס טיוטה.");
    return;
  }
  await deleteDoc(doc(db, VERSION_COLLECTION, versionId));
  setStatus("גרסת טיוטה נמחקה.");
  await loadVersions();
}

function mailText(version) {
  return [
    "כותרת: עדכון גרסה חדש באתר קורס ממונה בטיחות",
    "",
    "שלום,",
    "עלה עדכון גרסה חדש באתר קורס ממונה בטיחות.",
    "",
    "מספר גרסה: " + (version.versionNumber || "-"),
    "תאריך: " + (version.releaseDate || "-") + " " + (version.releaseTime || ""),
    "",
    "תקציר שינויים:",
    version.siteChanges || "-",
    "",
    "דרישות חדשות:",
    version.addedRequirements || "-",
    "",
    "באגים שתוקנו:",
    version.fixedBugs || "-",
    "",
    "שיפורי UI/UX:",
    version.uiUxChanges || "-",
    "",
    "שינויי אבטחה / Firebase:",
    [version.securityChanges, version.firebaseChanges].filter(Boolean).join("\n") || "-",
    "",
    "קישור לאתר:",
    "https://ehs-course.web.app",
    "",
    "הערות שחרור:",
    version.releaseNotes || "-",
  ].join("\n");
}

async function prepareEmail(versionId) {
  const version = versions.find((item) => item.versionId === versionId);
  if (!version) return;
  if (!approvedUsers.length) await loadApprovedUsers();
  const list = approvedUsers.map((user) => clean(user.email, 320)).filter(Boolean).join("; ");
  const emailList = document.getElementById("versionEmailList");
  const emailText = document.getElementById("versionEmailText");
  if (emailList) emailList.value = list;
  if (emailText) emailText.value = mailText(version);
  await updateDoc(doc(db, VERSION_COLLECTION, versionId), {
    status: "emailPrepared",
    emailPreparedAt: serverTimestamp(),
    emailPreparedBy: clean(window.CourseAuth?.profile?.email || ADMIN_EMAIL, 320),
    updatedAt: serverTimestamp(),
  });
  setStatus("רשימת תפוצה וטקסט מייל הוכנו. שליחה אוטומטית דורשת חיבור EmailJS / Firebase Function / SendGrid.");
  await loadVersions();
}

async function copyFrom(id) {
  const field = document.getElementById(id);
  if (!field) return;
  await navigator.clipboard.writeText(field.value || "");
  setStatus(id === "versionEmailList" ? "רשימת המיילים הועתקה." : "טקסט המייל הועתק.");
}

document.addEventListener("course-auth-approved", async (event) => {
  if (!isAdmin(event.detail)) return;
  try {
    resetForm();
    await loadVersions();
    await loadApprovedUsers();
  } catch {
    setStatus("שגיאה בטעינת ניהול הגרסאות.");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  resetForm();
  document.getElementById("versionForm")?.addEventListener("submit", saveVersion);
  document.getElementById("resetVersionForm")?.addEventListener("click", resetForm);
  document.getElementById("copyEmailList")?.addEventListener("click", () => copyFrom("versionEmailList"));
  document.getElementById("copyEmailText")?.addEventListener("click", () => copyFrom("versionEmailText"));
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-version-action]");
  if (!button) return;
  button.disabled = true;
  const versionId = clean(button.dataset.versionId, 180);
  const version = versions.find((item) => item.versionId === versionId);
  try {
    if (button.dataset.versionAction === "edit") fillForm(version);
    if (button.dataset.versionAction === "delete") await deleteVersion(versionId);
    if (button.dataset.versionAction === "publish") await publishVersion(versionId);
    if (button.dataset.versionAction === "prepareEmail") await prepareEmail(versionId);
  } catch {
    setStatus("הפעולה נכשלה. בדוק הרשאות וחיבור.");
  } finally {
    button.disabled = false;
  }
});

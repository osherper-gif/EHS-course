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
let usingBuiltinVersions = false;

function clean(value, max = 5000) {
  return window.CourseAuth?.sanitizeText
    ? window.CourseAuth.sanitizeText(value, max)
    : String(value || "").replace(/[<>]/g, "").trim().slice(0, max);
}

function isAdmin(profile) {
  return profile?.role === "admin" || String(profile?.email || "").toLowerCase() === ADMIN_EMAIL;
}

function builtinVersions() {
  return Array.isArray(window.SITE_VERSIONS) ? window.SITE_VERSIONS : [];
}

function normalizeVersion(version) {
  const versionId = clean(version.versionId || ("commit-" + (version.commitHash || version.versionNumber || Date.now())), 180);
  const releaseDate = clean(version.releaseDate || version.date || "", 40);
  const releaseTime = clean(version.releaseTime || version.time || "לא צוין", 40);
  return {
    versionId,
    versionNumber: clean(version.versionNumber || version.commitHash || versionId, 80),
    date: releaseDate,
    time: releaseTime,
    releaseDate,
    releaseTime,
    commitHash: clean(version.commitHash || "", 80),
    commitMessage: clean(version.commitMessage || "", 240),
    createdBy: clean(version.createdBy || version.createdByEmail || ADMIN_EMAIL, 320),
    addedRequirements: clean(version.addedRequirements),
    siteChanges: clean(version.siteChanges),
    fixedBugs: clean(version.fixedBugs),
    uiUxChanges: clean(version.uiUxChanges),
    securityChanges: clean(version.securityChanges),
    contentChanges: clean(version.contentChanges),
    firebaseChanges: clean(version.firebaseChanges),
    releaseNotes: clean(version.releaseNotes),
    status: clean(version.status || "published", 40),
    emailStatus: clean(version.emailStatus || (version.status === "emailPrepared" ? "emailPrepared" : "notSent"), 40),
  };
}

function statusLabel(status) {
  return {
    draft: "טיוטה",
    published: "פורסם",
    sent: "נשלח למשתמשים",
    emailPrepared: "מייל הוכן",
    notSent: "לא נשלח",
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
  return normalizeVersion({
    versionId,
    versionNumber: data.get("versionNumber"),
    releaseDate: data.get("releaseDate"),
    releaseTime: data.get("releaseTime"),
    createdBy: window.CourseAuth?.profile?.email || ADMIN_EMAIL,
    addedRequirements: data.get("addedRequirements"),
    siteChanges: data.get("siteChanges"),
    fixedBugs: data.get("fixedBugs"),
    uiUxChanges: data.get("uiUxChanges"),
    securityChanges: data.get("securityChanges"),
    contentChanges: data.get("contentChanges"),
    firebaseChanges: data.get("firebaseChanges"),
    releaseNotes: data.get("releaseNotes"),
    status: data.get("status") || "draft",
  });
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

function renderVersions() {
  const tbody = document.getElementById("versionsTableBody");
  if (!tbody) return;
  tbody.replaceChildren();
  versions.forEach((version) => {
    const tr = document.createElement("tr");
    tr.append(
      cell((version.versionNumber || "-") + (version.commitHash ? " / " + version.commitHash : "")),
      cell([version.releaseDate || version.date, version.releaseTime || version.time].filter(Boolean).join(" ")),
      cell(version.commitMessage || version.releaseNotes || "-"),
      cell(statusLabel(version.status))
    );
    const actions = document.createElement("td");
    actions.className = "admin-actions-cell";
    actions.append(
      actionButton("פתח פרטים", "details", version.versionId),
      actionButton("עריכה", "edit", version.versionId),
      actionButton("מחיקה", "delete", version.versionId, version.status !== "draft" || usingBuiltinVersions),
      actionButton("סמן כפורסם", "publish", version.versionId, usingBuiltinVersions || version.status === "published" || version.status === "sent"),
      actionButton("שליחת מייל עדכון למשתמשים", "prepareEmail", version.versionId)
    );
    tr.append(actions);
    tbody.append(tr);
  });
}

function ensureVersionCards() {
  const tbody = document.getElementById("versionsTableBody");
  if (!tbody) return null;
  const tableWrap = tbody.closest(".table-scroll");
  if (tableWrap) tableWrap.classList.add("m-card-source");
  let container = document.getElementById("versionsMobileCards");
  if (!container) {
    container = document.createElement("div");
    container.id = "versionsMobileCards";
    container.className = "m-admin-cards";
    tableWrap?.after(container);
  }
  return container;
}
function versionCardLine(label, value) {
  const row = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = label;
  const span = document.createElement("span");
  span.textContent = value || "-";
  row.append(strong, span);
  return row;
}
function renderVersionCards() {
  const container = ensureVersionCards();
  if (!container) return;
  container.replaceChildren();
  versions.forEach((version) => {
    const card = document.createElement("article");
    card.className = "m-admin-card";
    const head = document.createElement("div");
    head.className = "m-admin-card__head";
    const h = document.createElement("h3");
    h.textContent = (version.versionNumber || "-") + (version.commitHash ? " / " + version.commitHash : "");
    const st = document.createElement("span");
    st.className = "status-pill";
    st.textContent = statusLabel(version.status);
    head.append(h, st);
    const actions = document.createElement("div");
    actions.className = "admin-actions-cell";
    actions.append(actionButton("פתח פרטים", "details", version.versionId), actionButton("עריכה", "edit", version.versionId), actionButton("מחיקה", "delete", version.versionId, version.status !== "draft" || usingBuiltinVersions), actionButton("סמן כפורסם", "publish", version.versionId, usingBuiltinVersions || version.status === "published" || version.status === "sent"), actionButton("שליחת מייל עדכון למשתמשים", "prepareEmail", version.versionId));
    card.append(head, versionCardLine("תאריך", [version.releaseDate || version.date, version.releaseTime || version.time].filter(Boolean).join(" ")), versionCardLine("כותרת", version.commitMessage || version.releaseNotes || "-"), actions);
    container.append(card);
  });
}


function detailRow(title, text) {
  const section = document.createElement("section");
  const h = document.createElement("h3");
  h.textContent = title;
  const p = document.createElement("p");
  p.textContent = text || "-";
  section.append(h, p);
  return section;
}

function renderDetails(version) {
  const box = document.getElementById("versionDetails");
  if (!box) return;
  box.replaceChildren();
  if (!version) {
    box.textContent = "לא נבחרה גרסה.";
    return;
  }
  const title = document.createElement("h2");
  title.textContent = "גרסה " + (version.versionNumber || "-");
  const meta = document.createElement("p");
  meta.className = "muted-answer";
  meta.textContent = "Commit: " + (version.commitHash || "-") + " | תאריך פרסום: " + (version.releaseDate || "-") + " " + (version.releaseTime || "");
  box.append(
    title,
    meta,
    detailRow("Commit message", version.commitMessage),
    detailRow("דרישות שהתווספו", version.addedRequirements),
    detailRow("שינויים באתר", version.siteChanges),
    detailRow("באגים שתוקנו", version.fixedBugs),
    detailRow("שיפורי UI/UX", version.uiUxChanges),
    detailRow("שינויי אבטחה", version.securityChanges),
    detailRow("שינויי תוכן", version.contentChanges),
    detailRow("שינויי Firebase/Auth/Firestore", version.firebaseChanges),
    detailRow("הערות שחרור", version.releaseNotes),
    detailRow("סטטוס מייל", statusLabel(version.emailStatus))
  );
}

async function loadVersions() {
  setStatus("טוען גרסאות...");
  const snapshot = await getDocs(query(collection(db, VERSION_COLLECTION), orderBy("createdAt", "desc")));
  if (snapshot.empty) {
    usingBuiltinVersions = true;
    versions = builtinVersions().map(normalizeVersion);
    renderVersions();
    renderDetails(versions[0]);
    setStatus("Firestore ריק. נטענו " + versions.length + " גרסאות מובנות מתוך data/site-versions.js. ניתן לייבא אותן ל-Firestore בלחיצה.");
    return;
  }
  usingBuiltinVersions = false;
  versions = snapshot.docs.map((item) => normalizeVersion(item.data()));
  renderVersions();
  renderDetails(versions[0]);
  setStatus("נטענו " + versions.length + " גרסאות מ-Firestore.");
}

async function loadApprovedUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  approvedUsers = snapshot.docs.map((item) => item.data()).filter((user) => user.status === "approved" && user.email);
}

async function importBuiltinVersions() {
  const builtins = builtinVersions().map(normalizeVersion);
  if (!builtins.length) {
    setStatus("לא נמצאו גרסאות מובנות לייבוא.");
    return;
  }
  const existingIds = new Set();
  const snapshot = await getDocs(collection(db, VERSION_COLLECTION));
  snapshot.docs.forEach((item) => existingIds.add(item.id));
  let imported = 0;
  for (const version of builtins) {
    if (existingIds.has(version.versionId)) continue;
    await setDoc(doc(db, VERSION_COLLECTION, version.versionId), {
      ...version,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    imported += 1;
  }
  setStatus(imported ? "יובאו " + imported + " גרסאות ל-Firestore." : "לא נוצרו כפילויות. כל הגרסאות כבר קיימות ב-Firestore.");
  await loadVersions();
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
    "Commit: " + (version.commitHash || "-"),
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

async function markEmailPrepared(version) {
  if (usingBuiltinVersions) {
    version.status = "emailPrepared";
    version.emailStatus = "emailPrepared";
    renderVersions();
    renderDetails(version);
    return;
  }
  await updateDoc(doc(db, VERSION_COLLECTION, version.versionId), {
    status: "emailPrepared",
    emailStatus: "emailPrepared",
    emailPreparedAt: serverTimestamp(),
    emailPreparedBy: clean(window.CourseAuth?.profile?.email || ADMIN_EMAIL, 320),
    updatedAt: serverTimestamp(),
  });
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
  await markEmailPrepared(version);
  setStatus("רשימת תפוצה וטקסט מייל הוכנו. שליחה אוטומטית דורשת חיבור EmailJS / Firebase Function / SendGrid.");
  if (!usingBuiltinVersions) await loadVersions();
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
  document.getElementById("importBuiltinVersions")?.addEventListener("click", importBuiltinVersions);
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
    if (button.dataset.versionAction === "details") renderDetails(version);
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

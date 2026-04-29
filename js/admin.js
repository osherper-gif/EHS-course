import {
  ADMIN_EMAIL,
  db,
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "./firebase-config.js";

let usersByUid = new Map();
let preparedApproval = null;

function clean(value, max = 1000) {
  return window.CourseAuth?.sanitizeText
    ? window.CourseAuth.sanitizeText(value, max)
    : String(value || "").replace(/[<>]/g, "").trim().slice(0, max);
}

function fmt(value) {
  if (!value) return "-";
  if (value.toDate) return value.toDate().toLocaleString("he-IL");
  if (value instanceof Date) return value.toLocaleString("he-IL");
  return clean(value, 120);
}

function statusLabel(status) {
  return {
    pending: "ממתין לאישור",
    approved: "מאושר",
    blocked: "חסום",
  }[status] || status || "-";
}

function approvalStatusLabel(status) {
  return {
    prepared: "הודעה הוכנה",
    sent: "נשלח",
    failed: "נכשל — נסה שוב",
  }[status] || "";
}

function cell(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

function actionButton(text, status, disabled) {
  const button = document.createElement("button");
  button.className = status === "blocked" ? "btn danger" : status === "pending" ? "btn secondary" : "btn";
  button.type = "button";
  button.dataset.status = status;
  button.textContent = text;
  button.disabled = disabled;
  return button;
}

function approvalButton(text, action, uid, secondary = true) {
  const button = document.createElement("button");
  button.className = secondary ? "btn secondary" : "btn";
  button.type = "button";
  button.dataset.approvalAction = action;
  button.dataset.uid = uid;
  button.textContent = text;
  return button;
}

function approvalMailText(user) {
  const name = clean(user.displayName || user.email || "משתמש", 180);
  return [
    "נושא: חשבונך אושר באתר קורס ממונה בטיחות",
    "",
    "שלום " + name + ",",
    "",
    "חשבונך אושר בהצלחה.",
    "כעת ניתן להיכנס לאתר קורס ממונה בטיחות בקישור:",
    "https://ehs-course.web.app",
    "",
    "בהצלחה,",
    "אושר פרץ",
    "054-4232490",
    "osherper@gmail.com",
  ].join("\n");
}

function showPreparedApproval(user) {
  preparedApproval = user;
  const panel = document.getElementById("approvalMessagePanel");
  const emailField = document.getElementById("approvalEmailAddress");
  const textField = document.getElementById("approvalEmailText");
  if (emailField) emailField.value = clean(user.email, 320);
  if (textField) textField.value = approvalMailText(user);
  if (panel) panel.hidden = false;
  document.getElementById("adminStatus").textContent = "המשתמש אושר בהצלחה. ניתן להעתיק ולשלוח לו הודעת אישור.";
}

function renderApprovalCell(user) {
  const td = document.createElement("td");
  td.className = "admin-actions-cell";
  const uid = clean(user.uid, 180);
  if (user.status === "pending") {
    td.textContent = "אין הודעה עדיין";
    return td;
  }
  if (user.status !== "approved") {
    td.textContent = "-";
    return td;
  }
  const status = clean(user.approvalEmailStatus, 40);
  const label = approvalStatusLabel(status);
  if (label) {
    const span = document.createElement("span");
    span.className = "status-pill";
    span.textContent = label;
    td.append(span);
  } else {
    td.append(approvalButton("הכן הודעת אישור", "prepare", uid, false));
  }
  if (status === "prepared" || status === "sent" || status === "failed") {
    td.append(
      approvalButton("העתק מייל", "copyEmail", uid),
      approvalButton("העתק הודעת אישור", "copyMessage", uid)
    );
  }
  if (status === "failed") td.append(approvalButton("נסה שוב", "prepare", uid, false));
  return td;
}

function renderUserRow(user) {
  const tr = document.createElement("tr");
  tr.dataset.uid = clean(user.uid, 180);

  const userTd = document.createElement("td");
  const wrap = document.createElement("div");
  wrap.className = "admin-user-cell";
  const photoUrl = clean(user.photoURL, 1000);
  if (/^https:\/\//.test(photoUrl) || photoUrl.startsWith("data:")) {
    const img = document.createElement("img");
    img.src = photoUrl;
    img.alt = "";
    wrap.append(img);
  }
  const text = document.createElement("span");
  const name = document.createElement("strong");
  name.textContent = clean(user.displayName || "-");
  const email = document.createElement("small");
  email.textContent = clean(user.email || "-", 320);
  text.append(name, email);
  wrap.append(text);
  userTd.append(wrap);

  const statusTd = document.createElement("td");
  const status = document.createElement("span");
  status.className = "status-pill";
  status.textContent = statusLabel(user.status);
  statusTd.append(status);

  const actionsTd = document.createElement("td");
  actionsTd.className = "admin-actions-cell";
  const disabled = user.email === ADMIN_EMAIL;
  actionsTd.append(
    actionButton("אישור", "approved", disabled),
    actionButton("pending", "pending", disabled),
    actionButton("חסימה", "blocked", disabled)
  );

  tr.append(
    userTd,
    cell(clean(user.role || "student", 60)),
    statusTd,
    cell(clean(user.provider || "-", 80)),
    cell(fmt(user.createdAt)),
    cell(fmt(user.lastLoginAt)),
    renderApprovalCell(user),
    actionsTd
  );
  return tr;
}

async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  const status = document.getElementById("adminStatus");
  if (!tbody || !status) return;
  status.textContent = "טוען משתמשים...";
  const snapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  const users = snapshot.docs.map((item) => item.data());
  usersByUid = new Map(users.map((user) => [clean(user.uid, 180), user]));
  tbody.replaceChildren();
  users.forEach((user) => tbody.append(renderUserRow(user)));
  status.textContent = "נטענו " + snapshot.size + " משתמשים.";
  await loadExamScores(users);
  await handleActionLink();
}

async function loadExamScores(users) {
  const tbody = document.getElementById("examScoresBody");
  const status = document.getElementById("examScoresStatus");
  if (!tbody || !status) return;
  tbody.replaceChildren();
  for (const user of users) {
    try {
      const attempts = await getDocs(collection(db, "users", user.uid, "examAttempts"));
      const scores = attempts.docs.map((item) => Number(item.data().score || 0));
      const last = attempts.docs[attempts.docs.length - 1]?.data();
      const tr = document.createElement("tr");
      tr.append(
        cell(clean(user.email || "-", 320)),
        cell(String(scores.length)),
        cell(last ? String(last.score || 0) + "%" : "-"),
        cell(scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) + "%" : "-")
      );
      tbody.append(tr);
    } catch {
      const tr = document.createElement("tr");
      tr.append(cell(clean(user.email || "-", 320)), cell("-"), cell("-"), cell("-"));
      tbody.append(tr);
    }
  }
  status.textContent = "ציוני משתמשים נטענו.";
}

async function markApprovalPrepared(uid) {
  const user = usersByUid.get(clean(uid, 180));
  if (!user) return;
  await updateDoc(doc(db, "users", clean(uid, 180)), {
    approvalEmailStatus: "prepared",
    approvalEmailPreparedAt: serverTimestamp(),
    approvalEmailPreparedBy: clean(window.CourseAuth?.profile?.email || ADMIN_EMAIL, 320),
    updatedAt: serverTimestamp(),
  });
  user.approvalEmailStatus = "prepared";
  showPreparedApproval(user);
}

async function updateStatus(uid, nextStatus) {
  const user = usersByUid.get(clean(uid, 180));
  const approvedUser = nextStatus === "approved" && user ? { ...user, status: "approved", approvalEmailStatus: "prepared" } : null;
  const updates = {
    status: clean(nextStatus, 20),
    updatedAt: serverTimestamp(),
  };
  if (nextStatus === "approved") {
    updates.approvedAt = serverTimestamp();
    updates.approvedBy = clean(window.CourseAuth?.profile?.email || ADMIN_EMAIL, 320);
    updates.approvalEmailStatus = "prepared";
    updates.approvalEmailPreparedAt = serverTimestamp();
    updates.approvalEmailPreparedBy = clean(window.CourseAuth?.profile?.email || ADMIN_EMAIL, 320);
  }
  if (nextStatus === "pending" || nextStatus === "blocked") {
    updates.approvalEmailStatus = "";
  }
  await updateDoc(doc(db, "users", clean(uid, 180)), updates);
  await loadUsers();
  if (approvedUser) showPreparedApproval(approvedUser);
}

async function handleActionLink() {
  const params = new URLSearchParams(location.search);
  const uid = params.get("uid");
  const action = params.get("action");
  if (!uid || action !== "approve") return;
  await updateStatus(uid, "approved");
  history.replaceState({}, "", location.pathname);
}

async function copyText(text, successMessage) {
  await navigator.clipboard.writeText(text || "");
  document.getElementById("adminStatus").textContent = successMessage;
}

document.addEventListener("course-auth-approved", async (event) => {
  if (event.detail?.role !== "admin" && !window.CourseAuth?.isAdminEmail?.(event.detail?.email)) return;
  try {
    await loadUsers();
  } catch {
    document.getElementById("adminStatus").textContent = "שגיאה בטעינת המשתמשים.";
  }
});

document.addEventListener("click", async (event) => {
  const statusButton = event.target.closest("[data-status]");
  if (statusButton) {
    const row = statusButton.closest("[data-uid]");
    if (!row) return;
    statusButton.disabled = true;
    try {
      await updateStatus(row.dataset.uid, statusButton.dataset.status);
    } catch {
      document.getElementById("adminStatus").textContent = "שגיאה בעדכון המשתמש.";
    } finally {
      statusButton.disabled = false;
    }
    return;
  }

  const approvalButtonEl = event.target.closest("[data-approval-action]");
  if (!approvalButtonEl) return;
  const user = usersByUid.get(clean(approvalButtonEl.dataset.uid, 180));
  if (!user) return;
  approvalButtonEl.disabled = true;
  try {
    if (approvalButtonEl.dataset.approvalAction === "prepare") await markApprovalPrepared(user.uid);
    if (approvalButtonEl.dataset.approvalAction === "copyEmail") await copyText(clean(user.email, 320), "כתובת המייל הועתקה.");
    if (approvalButtonEl.dataset.approvalAction === "copyMessage") await copyText(approvalMailText(user), "הודעת האישור הועתקה.");
  } catch {
    document.getElementById("adminStatus").textContent = "שגיאה בהכנת הודעת האישור.";
  } finally {
    approvalButtonEl.disabled = false;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("copyPreparedApprovalEmail")?.addEventListener("click", () => {
    if (preparedApproval) copyText(clean(preparedApproval.email, 320), "כתובת המייל הועתקה.");
  });
  document.getElementById("copyPreparedApprovalText")?.addEventListener("click", () => {
    if (preparedApproval) copyText(approvalMailText(preparedApproval), "הודעת האישור הועתקה.");
  });
});

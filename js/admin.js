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
let feedbackById = new Map();
let allUsers = [];

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

function linkCell(text, href) {
  const td = document.createElement("td");
  const link = document.createElement("a");
  link.href = href || "#";
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = text;
  td.append(link);
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
  status.dataset.status = clean(user.status || "pending", 40);
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
    cell(providerLabel(user.provider)),
    cell(surveyStatusLabel(user)),
    cell(surveyValue(user, "useReason")),
    cell(surveyValue(user, "learningStatus")),
    cell(surveyValue(user, "referralSource")),
    cell(surveyValue(user, "sitePriority")),
    cell(fmt(user.createdAt)),
    cell(fmt(user.lastLoginAt)),
    renderApprovalCell(user),
    actionsTd
  );
  return tr;
}

function ensureCardContainer(tbodyId, containerId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return null;
  const tableWrap = tbody.closest(".table-scroll");
  if (tableWrap) tableWrap.classList.add("m-card-source");
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.className = "m-admin-cards";
    tableWrap?.after(container);
  }
  return container;
}

function surveyStatus(user) {
  if (user?.profileSurveyCompletedAt || user?.profileSurvey) return "completed";
  if (user?.profileSurveySkippedAt) return "skipped";
  return "none";
}

function surveyStatusLabel(user) {
  return {
    completed: "ענה לשאלון",
    skipped: "דילג",
    none: "לא ענה",
  }[surveyStatus(user)];
}

function surveyValue(user, key) {
  return clean(user?.profileSurvey?.[key] || "-", 160);
}

function providerLabel(provider) {
  const value = clean(provider || "-", 80);
  if (value === "google" || value === "google.com") return "Google";
  if (value === "password") return "Email/Password קיים";
  return value;
}
function cardLine(label, value) {
  const row = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = label;
  const span = document.createElement("span");
  span.textContent = value || "-";
  row.append(strong, span);
  return row;
}
function renderUserCard(user) {
  const card = document.createElement("article");
  card.className = "m-admin-card";
  card.dataset.uid = clean(user.uid, 180);
  const head = document.createElement("div");
  head.className = "m-admin-card__head";
  const title = document.createElement("h3");
  title.textContent = clean(user.displayName || user.email || "משתמש", 320);
  const status = document.createElement("span");
  status.className = "status-pill";
  status.dataset.status = clean(user.status || "pending", 40);
  status.textContent = statusLabel(user.status);
  head.append(title, status);
  const actions = document.createElement("div");
  actions.className = "admin-actions-cell";
  const disabled = user.email === ADMIN_EMAIL;
  actions.append(actionButton("אישור", "approved", disabled), actionButton("pending", "pending", disabled), actionButton("חסימה", "blocked", disabled));
  const approval = renderApprovalCell(user);
  approval.classList.add("m-admin-card__actions");
  card.append(
    head,
    cardLine("אימייל", clean(user.email || "-", 320)),
    cardLine("תפקיד", clean(user.role || "student", 60)),
    cardLine("Provider", providerLabel(user.provider)),
    cardLine("שאלון", surveyStatusLabel(user)),
    cardLine("למה משתמש באתר", surveyValue(user, "useReason")),
    cardLine("סטטוס לימודי/מקצועי", surveyValue(user, "learningStatus")),
    cardLine("מקור הגעה", surveyValue(user, "referralSource")),
    cardLine("מה חשוב לו", surveyValue(user, "sitePriority")),
    cardLine("נרשם", fmt(user.createdAt)),
    cardLine("כניסה אחרונה", fmt(user.lastLoginAt)),
    approval,
    actions
  );
  return card;
}
function renderUserCards(users) {
  const container = ensureCardContainer("usersTableBody", "usersMobileCards");
  if (!container) return;
  container.replaceChildren();
  users.forEach((user) => container.append(renderUserCard(user)));
}
function renderFeedbackCard(report) {
  const card = document.createElement("article");
  card.className = "m-admin-card";
  card.dataset.feedbackId = clean(report.reportId, 180);
  const head = document.createElement("div");
  head.className = "m-admin-card__head";
  const title = document.createElement("h3");
  title.textContent = clean(report.title || "דיווח", 160);
  const status = document.createElement("span");
  status.className = "status-pill";
  status.dataset.status = clean(report.status || "open", 40);
  status.textContent = clean(report.status || "open", 40);
  head.append(title, status);
  const open = document.createElement("button");
  open.type = "button";
  open.className = "btn secondary";
  open.dataset.feedbackAction = "open";
  open.dataset.feedbackId = clean(report.reportId, 180);
  open.textContent = "פתח";
  card.append(head, cardLine("תאריך", fmt(report.createdAt)), cardLine("סוג", clean(report.type, 80)), cardLine("משתמש", clean(report.userEmail || report.userName || "-", 320)), cardLine("עדיפות", clean(report.priority || "normal", 40)), open);
  return card;
}
function renderFeedbackCards(reports) {
  const container = ensureCardContainer("feedbackReportsBody", "feedbackMobileCards");
  if (!container) return;
  container.replaceChildren();
  reports.forEach((report) => container.append(renderFeedbackCard(report)));
}

function minutesSince(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : timestamp instanceof Date ? timestamp : null;
  if (!date) return Infinity;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
}

function timestampDate(timestamp) {
  if (timestamp?.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "string") {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function setAdminStat(name, value) {
  const stat = document.querySelector('[data-admin-stat="' + name + '"] strong');
  if (stat) stat.textContent = String(value);
}

function activeSessionCard(session) {
  const card = document.createElement("article");
  card.className = "active-user-card";
  const title = document.createElement("strong");
  title.textContent = clean(session.displayName || session.email || "משתמש", 180);
  const email = document.createElement("span");
  email.textContent = clean(session.email || "-", 320);
  const path = document.createElement("span");
  path.textContent = "עמוד: " + clean(session.currentPath || "-", 500);
  const seen = document.createElement("small");
  const minutes = minutesSince(session.lastSeenAt);
  seen.textContent = minutes <= 0 ? "נראה עכשיו" : "נראה לפני " + minutes + " דקות";
  card.append(title, email, path, seen);
  return card;
}

async function loadActiveSessions() {
  const stat = document.querySelector('[data-admin-stat="active-now"] strong');
  const list = document.getElementById("activeUsersList");
  const status = document.getElementById("activeUsersStatus");
  if (!stat && !list) return;
  try {
    const snapshot = await getDocs(collection(db, "activeSessions"));
    const active = snapshot.docs
      .map((item) => ({ uid: item.id, ...item.data() }))
      .filter((session) => minutesSince(session.lastSeenAt) <= 5)
      .sort((a, b) => minutesSince(a.lastSeenAt) - minutesSince(b.lastSeenAt));
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const activeToday = snapshot.docs
      .map((item) => item.data())
      .filter((session) => {
        const seen = timestampDate(session.lastSeenAt);
        return seen && seen >= todayStart;
      }).length;
    if (stat) stat.textContent = String(active.length);
    setAdminStat("active-today", activeToday);
    if (status) status.textContent = "פעילים ב-5 הדקות האחרונות.";
    if (list) {
      list.replaceChildren();
      if (!active.length) {
        const empty = document.createElement("p");
        empty.className = "muted-text";
        empty.textContent = "אין משתמשים פעילים כרגע.";
        list.append(empty);
      } else {
        active.forEach((session) => list.append(activeSessionCard(session)));
      }
    }
  } catch {
    if (stat) stat.textContent = "—";
    if (status) status.textContent = "לא ניתן לטעון משתמשים פעילים כרגע.";
  }
}

function currentUserFilters() {
  return {
    query: clean(document.getElementById("usersSearch")?.value || "", 320).toLowerCase(),
    survey: clean(document.getElementById("surveyStatusFilter")?.value || "", 40),
    useReason: clean(document.getElementById("surveyUseFilter")?.value || "", 120),
    source: clean(document.getElementById("surveySourceFilter")?.value || "", 120),
  };
}

function userMatchesFilters(user, filters) {
  const text = [
    user.displayName,
    user.email,
    user.status,
    user.role,
    user.provider,
    surveyStatusLabel(user),
    user.profileSurvey?.useReason,
    user.profileSurvey?.learningStatus,
    user.profileSurvey?.referralSource,
    user.profileSurvey?.sitePriority,
  ].map((value) => clean(value, 320).toLowerCase()).join(" ");
  if (filters.query && !text.includes(filters.query)) return false;
  if (filters.survey && surveyStatus(user) !== filters.survey) return false;
  if (filters.useReason && user.profileSurvey?.useReason !== filters.useReason) return false;
  if (filters.source && user.profileSurvey?.referralSource !== filters.source) return false;
  return true;
}

function renderUsers(users, totalCount = users.length) {
  const tbody = document.getElementById("usersTableBody");
  const status = document.getElementById("adminStatus");
  if (!tbody || !status) return;
  tbody.replaceChildren();
  users.forEach((user) => tbody.append(renderUserRow(user)));
  renderUserCards(users);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  setAdminStat("registered-week", allUsers.filter((user) => {
    const created = timestampDate(user.createdAt);
    return created && created.getTime() >= weekAgo;
  }).length);
  status.textContent = "נטענו " + totalCount + " משתמשים. מוצגים " + users.length + ".";
}

function applyUserFilters() {
  const filters = currentUserFilters();
  renderUsers(allUsers.filter((user) => userMatchesFilters(user, filters)), allUsers.length);
}


async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  const status = document.getElementById("adminStatus");
  if (!tbody || !status) return;
  status.textContent = "טוען משתמשים...";
  const snapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  const users = snapshot.docs.map((item) => item.data());
  allUsers = users;
  usersByUid = new Map(users.map((user) => [clean(user.uid, 180), user]));
  applyUserFilters();
  await loadActiveSessions();
  await loadExamScores(users);
  await loadFeedbackReports();
  await handleActionLink();
}

function feedbackReplyText(report) {
  return [
    "שלום " + clean(report.userName || report.userEmail || "משתמש", 180) + ",",
    "",
    "קיבלתי את הדיווח שלך באתר קורס ממונה בטיחות.",
    "נושא הדיווח: " + clean(report.title, 160),
    "סטטוס נוכחי: " + clean(report.status || "open", 40),
    "",
    "תודה על העזרה בשיפור האתר.",
    "",
    "בברכה,",
    "אושר פרץ",
    "054-4232490",
    "osherper@gmail.com",
  ].join("\n");
}

function feedbackMailto(report) {
  const subject = "עדכון לגבי הדיווח שלך באתר קורס ממונה בטיחות";
  return "mailto:" + encodeURIComponent(clean(report.userEmail, 320)) +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(feedbackReplyText(report));
}

function renderFeedbackRow(report) {
  const tr = document.createElement("tr");
  const reportId = clean(report.reportId, 180);
  tr.dataset.feedbackId = reportId;
  const statusVal = clean(report.status || "open", 40);
  const priorityVal = clean(report.priority || "normal", 40);
  const statusTd = document.createElement("td");
  const statusPill = document.createElement("span");
  statusPill.className = "status-pill";
  statusPill.dataset.status = statusVal;
  statusPill.textContent = statusVal;
  statusTd.append(statusPill);
  const priorityTd = document.createElement("td");
  const priorityPill = document.createElement("span");
  const riskClass = priorityVal === "critical" ? "risk-critical" :
                    priorityVal === "high" ? "risk-high" :
                    priorityVal === "low" ? "risk-low" : "risk-medium";
  priorityPill.className = "risk-pill " + riskClass;
  priorityPill.textContent = priorityVal;
  priorityTd.append(priorityPill);
  tr.append(
    cell(fmt(report.createdAt)),
    cell(clean(report.type, 80)),
    cell(clean(report.userEmail || report.userName || "-", 320)),
    linkCell("פתח עמוד", clean(report.pageUrl, 1000)),
    cell(clean(report.title, 160)),
    statusTd,
    priorityTd
  );
  const action = document.createElement("td");
  const open = document.createElement("button");
  open.type = "button";
  open.className = "btn secondary";
  open.dataset.feedbackAction = "open";
  open.dataset.feedbackId = reportId;
  open.textContent = "פתח";
  action.append(open);
  tr.append(action);
  return tr;
}

function showFeedbackDetails(report) {
  const panel = document.getElementById("feedbackDetailsPanel");
  if (!panel) return;
  panel.hidden = false;
  panel.dataset.feedbackId = clean(report.reportId, 180);
  document.getElementById("feedbackDetailTitle").textContent = clean(report.title, 160);
  document.getElementById("feedbackDetailMeta").textContent =
    clean(report.type, 80) + " | " + clean(report.userEmail || report.userName || "-", 320) + " | " + fmt(report.createdAt);
  document.getElementById("feedbackDetailDescription").textContent = clean(report.description, 4000);
  const pageLink = document.getElementById("feedbackDetailPage");
  pageLink.href = clean(report.pageUrl, 1000);
  pageLink.textContent = clean(report.pageUrl, 1000);
  document.getElementById("feedbackStatusSelect").value = clean(report.status || "open", 40);
  document.getElementById("feedbackPrioritySelect").value = clean(report.priority || "normal", 40);
  document.getElementById("feedbackAdminNotes").value = clean(report.adminNotes, 2000);
  const reply = document.getElementById("feedbackReplyMailto");
  reply.href = feedbackMailto(report);
  reply.hidden = !report.userEmail;
}

async function loadFeedbackReports() {
  const tbody = document.getElementById("feedbackReportsBody");
  const status = document.getElementById("feedbackReportsStatus");
  if (!tbody || !status) return;
  status.textContent = "טוען דיווחים...";
  const snapshot = await getDocs(query(collection(db, "feedbackReports"), orderBy("createdAt", "desc")));
  const reports = snapshot.docs.map((item) => ({ reportId: item.id, ...item.data() }));
  feedbackById = new Map(reports.map((report) => [clean(report.reportId, 180), report]));
  tbody.replaceChildren();
  reports.forEach((report) => tbody.append(renderFeedbackRow(report)));
  setAdminStat("feedback-total", reports.length);
  setAdminStat("feedback-open", reports.filter((report) => (report.status || "open") === "open").length);
  status.textContent = "נטענו " + snapshot.size + " דיווחים.";
}

async function updateFeedbackReport() {
  const panel = document.getElementById("feedbackDetailsPanel");
  const reportId = clean(panel?.dataset.feedbackId, 180);
  if (!reportId) return;
  await updateDoc(doc(db, "feedbackReports", reportId), {
    status: clean(document.getElementById("feedbackStatusSelect")?.value, 40),
    priority: clean(document.getElementById("feedbackPrioritySelect")?.value, 40),
    adminNotes: clean(document.getElementById("feedbackAdminNotes")?.value, 2000),
    updatedAt: serverTimestamp(),
  });
  document.getElementById("feedbackReportsStatus").textContent = "הדיווח עודכן.";
  await loadFeedbackReports();
}

async function loadExamScores(users) {
  const tbody = document.getElementById("examScoresBody");
  const status = document.getElementById("examScoresStatus");
  if (!tbody || !status) return;
  tbody.replaceChildren();
  let totalAttempts = 0;
  for (const user of users) {
    try {
      const attempts = await getDocs(collection(db, "users", user.uid, "examAttempts"));
      const scores = attempts.docs.map((item) => Number(item.data().score || 0));
      totalAttempts += scores.length;
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
  setAdminStat("exams-completed", totalAttempts);
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

function ensureAdminMobileFab() {
  if (document.getElementById("mAdminFab")) return;
  const fab = document.createElement("div");
  fab.id = "mAdminFab";
  fab.className = "m-admin-fab";
  const users = document.createElement("button");
  users.type = "button";
  users.textContent = "משתמשים";
  users.addEventListener("click", () => document.querySelector('[data-admin-tab="users"]')?.click());
  const feedback = document.createElement("button");
  feedback.type = "button";
  feedback.textContent = "דיווחים";
  feedback.addEventListener("click", () => document.querySelector('[data-admin-tab="feedback"]')?.click());
  const top = document.createElement("button");
  top.type = "button";
  top.textContent = "למעלה";
  top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  fab.append(users, feedback, top);
  document.body.append(fab);
}


document.addEventListener("course-auth-approved", async (event) => {
  if (event.detail?.role !== "admin" && !window.CourseAuth?.isAdminEmail?.(event.detail?.email)) return;
  try {
    ensureAdminMobileFab();
    await loadUsers();
  } catch {
    document.getElementById("adminStatus").textContent = "שגיאה בטעינת המשתמשים.";
  }
});

document.addEventListener("click", async (event) => {
  const feedbackButton = event.target.closest("[data-feedback-action]");
  if (feedbackButton) {
    const report = feedbackById.get(clean(feedbackButton.dataset.feedbackId, 180));
    if (report) showFeedbackDetails(report);
    return;
  }

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
  ["usersSearch", "surveyStatusFilter", "surveyUseFilter", "surveySourceFilter"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", applyUserFilters);
    document.getElementById(id)?.addEventListener("change", applyUserFilters);
  });
  document.getElementById("saveFeedbackReport")?.addEventListener("click", async () => {
    try {
      await updateFeedbackReport();
    } catch {
      document.getElementById("feedbackReportsStatus").textContent = "שגיאה בעדכון הדיווח.";
    }
  });
  document.getElementById("copyFeedbackReply")?.addEventListener("click", async () => {
    const reportId = clean(document.getElementById("feedbackDetailsPanel")?.dataset.feedbackId, 180);
    const report = feedbackById.get(reportId);
    if (!report) return;
    await copyText(feedbackReplyText(report), "תוכן מייל התשובה הועתק.");
  });
  document.getElementById("copyPreparedApprovalEmail")?.addEventListener("click", () => {
    if (preparedApproval) copyText(clean(preparedApproval.email, 320), "כתובת המייל הועתקה.");
  });
  document.getElementById("copyPreparedApprovalText")?.addEventListener("click", () => {
    if (preparedApproval) copyText(approvalMailText(preparedApproval), "הודעת האישור הועתקה.");
  });
});

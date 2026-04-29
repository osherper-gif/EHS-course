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

function clean(value, max = 1000) {
  return window.CourseAuth?.sanitizeText ? window.CourseAuth.sanitizeText(value, max) : String(value || "").replace(/[<>]/g, "").trim().slice(0, max);
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
  tbody.replaceChildren();
  snapshot.docs.forEach((item) => tbody.append(renderUserRow(item.data())));
  status.textContent = "נטענו " + snapshot.size + " משתמשים.";
  await loadExamScores(snapshot.docs.map((item) => item.data()));
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

async function updateStatus(uid, status) {
  await updateDoc(doc(db, "users", clean(uid, 180)), {
    status: clean(status, 20),
    updatedAt: serverTimestamp(),
  });
  await loadUsers();
}

document.addEventListener("course-auth-approved", async (event) => {
  if (event.detail?.role !== "admin") return;
  try {
    await loadUsers();
  } catch {
    document.getElementById("adminStatus").textContent = "שגיאה בטעינת המשתמשים.";
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-status]");
  if (!button) return;
  const row = button.closest("[data-uid]");
  if (!row) return;
  button.disabled = true;
  try {
    await updateStatus(row.dataset.uid, button.dataset.status);
  } catch {
    document.getElementById("adminStatus").textContent = "שגיאה בעדכון המשתמש.";
  } finally {
    button.disabled = false;
  }
});

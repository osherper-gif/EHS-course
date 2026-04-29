import {
  ADMIN_EMAIL,
  auth,
  db,
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "./firebase-config.js";

function fmt(value) {
  if (!value) return "-";
  if (value.toDate) return value.toDate().toLocaleString("he-IL");
  if (value instanceof Date) return value.toLocaleString("he-IL");
  return String(value);
}

function statusLabel(status) {
  return {
    pending: "ממתין לאישור",
    approved: "מאושר",
    blocked: "חסום",
  }[status] || status || "-";
}

async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  const status = document.getElementById("adminStatus");
  if (!tbody || !status) return;
  status.textContent = "טוען משתמשים...";
  const snapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  tbody.innerHTML = snapshot.docs.map((item) => {
    const user = item.data();
    const disabled = user.email === ADMIN_EMAIL ? "disabled" : "";
    return '<tr data-uid="' + user.uid + '">' +
      '<td><div class="admin-user-cell">' + (user.photoURL ? '<img src="' + user.photoURL + '" alt="">' : '') + '<span><strong>' + (user.displayName || "-") + '</strong><small>' + (user.email || "-") + '</small></span></div></td>' +
      '<td>' + (user.role || "student") + '</td>' +
      '<td><span class="status-pill">' + statusLabel(user.status) + '</span></td>' +
      '<td>' + (user.provider || "-") + '</td>' +
      '<td>' + fmt(user.createdAt) + '</td>' +
      '<td>' + fmt(user.lastLoginAt) + '</td>' +
      '<td class="admin-actions-cell">' +
      '<button class="btn" data-status="approved" ' + disabled + '>אישור</button>' +
      '<button class="btn secondary" data-status="pending" ' + disabled + '>pending</button>' +
      '<button class="btn danger" data-status="blocked" ' + disabled + '>חסימה</button>' +
      '</td>' +
      '</tr>';
  }).join("");
  status.textContent = "נטענו " + snapshot.size + " משתמשים.";
}

async function updateStatus(uid, status) {
  await updateDoc(doc(db, "users", uid), {
    status,
    updatedAt: serverTimestamp(),
  });
  await loadUsers();
}

document.addEventListener("course-auth-approved", async (event) => {
  if (event.detail?.role !== "admin") return;
  try {
    await loadUsers();
  } catch (error) {
    console.error(error);
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
  } catch (error) {
    console.error(error);
    document.getElementById("adminStatus").textContent = "שגיאה בעדכון המשתמש.";
  } finally {
    button.disabled = false;
  }
});

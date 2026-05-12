import {
  auth,
  db,
  doc,
  firebaseConfig,
  firebaseEnvironment,
  getDoc,
  onAuthStateChanged,
  serverTimestamp,
  signOut,
  updateDoc,
} from "../firebase-config.js";

const elements = {
  heading: document.getElementById("approval-tool-heading"),
  message: document.getElementById("approval-tool-message"),
  details: document.getElementById("approval-tool-details"),
  actions: document.getElementById("approval-tool-actions"),
  formPanel: document.getElementById("approval-tool-form-panel"),
  targetUid: document.getElementById("target-user-uid"),
  approveButton: document.getElementById("approve-user-button"),
  revokeButton: document.getElementById("revoke-user-button"),
  result: document.getElementById("approval-tool-result"),
};

const state = {
  unsubscribe: null,
  currentUser: null,
};

function isStagingOrLocal() {
  const host = window.location.hostname;
  return host.includes("ehs-course-staging") || host === "localhost" || host === "127.0.0.1";
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function renderDetails(items) {
  if (!elements.details) return;
  elements.details.replaceChildren();

  Object.entries(items).forEach(([key, value]) => {
    const term = document.createElement("dt");
    term.textContent = key;
    const description = document.createElement("dd");
    description.textContent = String(value ?? "");
    elements.details.append(term, description);
  });
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

function clearActions() {
  elements.actions?.replaceChildren();
}

function renderState(nextState, title, message, details = {}) {
  document.body.dataset.approvalToolState = nextState;
  setText(elements.heading, title);
  setText(elements.message, message);
  renderDetails({
    state: nextState,
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
    ...details,
  });
  clearActions();
  if (elements.formPanel) elements.formPanel.hidden = true;
}

function renderBlockedProduction() {
  renderState("blocked-production", "הכלי חסום", "כלי זה פעיל רק בסביבת staging או local.");
  elements.actions?.append(makeLink("חזרה לדף הבית", "../index.html"));
}

function renderUnauthenticated() {
  renderState("unauthenticated", "נדרשת התחברות", "יש להתחבר כ־admin מאושר כדי להשתמש בכלי.");
  elements.actions?.append(makeLink("מעבר להתחברות", "../login.html"));
}

function isApprovedAdmin(userDocData) {
  return (userDocData?.role === "admin" || userDocData?.admin === true) && userDocData?.approved === true;
}

function renderNotAdmin(user, userDocData) {
  renderState("not-admin", "אין הרשאת admin", "המשתמש מחובר אך אינו admin מאושר לכלי staging.", {
    uid: user?.uid || "",
    email: user?.email || "",
    role: userDocData?.role || "",
    admin: userDocData?.admin === true,
    approved: userDocData?.approved === true,
  });
  elements.actions?.append(
    makeLink("חזרה לדף הבית", "../index.html"),
    makeButton("התנתקות", async () => signOut(auth))
  );
}

function renderReady(user, userDocData) {
  state.currentUser = user;
  renderState("ready", "הכלי מוכן", "מחובר כ־admin מאושר. ניתן לעדכן משתמש יעד לצורך בדיקות staging בלבד.", {
    uid: user?.uid || "",
    email: user?.email || "",
    role: userDocData?.role || "",
    approved: userDocData?.approved === true,
  });
  elements.actions?.append(
    makeLink("חזרה לדף הבית", "../index.html", "btn secondary"),
    makeButton("התנתקות", async () => signOut(auth))
  );
  if (elements.formPanel) elements.formPanel.hidden = false;
}

function renderError(error) {
  renderState("error", "שגיאה", "לא ניתן להשלים את בדיקת ההרשאות כרגע.", {
    code: error?.code || "",
    message: error?.message || "",
  });
  elements.actions?.append(makeLink("חזרה לדף הבית", "../index.html"));
}

function setResult(message, isError = false) {
  if (!elements.result) return;
  elements.result.textContent = message;
  elements.result.dataset.state = isError ? "error" : "success";
}

function getTargetUid() {
  return elements.targetUid?.value.trim() || "";
}

async function loadUserDoc(uid) {
  const ref = doc(db, "users", uid);
  const snapshot = await getDoc(ref);
  return { ref, snapshot };
}

async function updateTargetApproval(approved) {
  const targetUid = getTargetUid();
  const adminUser = state.currentUser;

  if (!targetUid) {
    setResult("יש להזין UID של משתמש יעד.", true);
    return;
  }

  if (!adminUser) {
    setResult("אין משתמש admin מחובר.", true);
    return;
  }

  if (targetUid === adminUser.uid) {
    setResult("הכלי מיועד לעדכון משתמש אחר, לא לעדכון עצמי.", true);
    return;
  }

  try {
    setResult("בודק מסמך משתמש יעד...");
    const { ref, snapshot } = await loadUserDoc(targetUid);
    if (!snapshot.exists()) {
      setResult("מסמך משתמש לא נמצא.", true);
      return;
    }

    if (approved) {
      await updateDoc(ref, {
        approved: true,
        approvalStatus: "approved",
        approvedAt: serverTimestamp(),
        approvedBy: adminUser.uid,
        updatedAt: serverTimestamp(),
      });
      setResult("המשתמש אושר בהצלחה.");
      return;
    }

    await updateDoc(ref, {
      approved: false,
      approvalStatus: "not-approved",
      updatedAt: serverTimestamp(),
      updatedBy: adminUser.uid,
    });
    setResult("אישור המשתמש בוטל.");
  } catch (error) {
    setResult(`העדכון נכשל: ${error?.code || error?.message || "unknown error"}`, true);
  }
}

async function waitForAuthReady() {
  if (typeof auth?.authStateReady === "function") {
    await auth.authStateReady();
  }
}

async function handleUser(user) {
  state.currentUser = null;
  if (!user) {
    renderUnauthenticated();
    return;
  }

  try {
    renderState("checking-admin", "בודק הרשאת admin...", "בודק האם המשתמש הוא admin מאושר.", {
      uid: user.uid,
      email: user.email || "",
    });
    const { snapshot } = await loadUserDoc(user.uid);
    if (!snapshot.exists() || !isApprovedAdmin(snapshot.data())) {
      renderNotAdmin(user, snapshot.exists() ? snapshot.data() : {});
      return;
    }

    renderReady(user, snapshot.data());
  } catch (error) {
    renderError(error);
  }
}

function bindActions() {
  elements.approveButton?.addEventListener("click", () => updateTargetApproval(true));
  elements.revokeButton?.addEventListener("click", () => updateTargetApproval(false));
}

async function init() {
  bindActions();

  if (!isStagingOrLocal()) {
    renderBlockedProduction();
    return;
  }

  if (!auth || !db) {
    renderState("not-configured", "Firebase לא מוגדר", "לא ניתן להפעיל את כלי ה־staging כרגע.");
    return;
  }

  try {
    await waitForAuthReady();
    state.unsubscribe = onAuthStateChanged(auth, handleUser);
  } catch (error) {
    renderError(error);
  }
}

window.addEventListener("pagehide", () => {
  if (typeof state.unsubscribe === "function") state.unsubscribe();
});

init();

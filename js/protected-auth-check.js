import {
  auth,
  db,
  doc,
  firebaseConfig,
  firebaseEnvironment,
  getDoc,
  onAuthStateChanged,
  signOut,
} from "./firebase-config.js";

const state = {
  unsubscribe: null,
  approvalReadUid: "",
  debug: {
    authState: "checking-auth",
    uid: "",
    email: "",
    firestoreReadAttempted: false,
    firestoreReadSuccess: false,
    approved: "unknown",
    finalState: "checking-auth",
  },
};

const elements = {
  heading: document.getElementById("protected-auth-check-heading"),
  message: document.getElementById("protected-auth-check-message"),
  details: document.getElementById("protected-auth-check-details"),
  actions: document.getElementById("protected-auth-check-actions"),
  debugPanel: document.getElementById("protected-auth-check-debug-panel"),
  debug: document.getElementById("protected-auth-check-debug"),
};

function setText(element, value) {
  if (element) element.textContent = value;
}

function clearActions() {
  elements.actions?.replaceChildren();
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

function readDebugFlag() {
  if (firebaseEnvironment !== "staging") return false;

  try {
    const rawFlags = window.localStorage.getItem("ehsDynamicContentFlags");
    if (!rawFlags) return false;
    const flags = JSON.parse(rawFlags);
    return flags?.debug === true;
  } catch (error) {
    return false;
  }
}

function renderDefinitionList(list, items) {
  if (!list) return;
  list.replaceChildren();

  Object.entries(items).forEach(([key, value]) => {
    const term = document.createElement("dt");
    term.textContent = key;
    const description = document.createElement("dd");
    description.textContent = String(value ?? "");
    list.append(term, description);
  });
}

function renderDetails(items) {
  if (!elements.details) return;
  renderDefinitionList(elements.details, items);
  elements.details.hidden = false;
}

function updateDebug(nextDebug) {
  state.debug = { ...state.debug, ...nextDebug };

  if (!readDebugFlag()) {
    if (elements.debugPanel) elements.debugPanel.hidden = true;
    return;
  }

  if (elements.debugPanel) elements.debugPanel.hidden = false;
  renderDefinitionList(elements.debug, state.debug);
}

function renderState(nextState, title, message) {
  document.body.dataset.authCheckState = nextState;
  setText(elements.heading, title);
  setText(elements.message, message);
  if (elements.message) elements.message.dataset.state = nextState;
  clearActions();
  updateDebug({ finalState: nextState });
}

function renderCheckingAuth() {
  updateDebug({
    authState: "checking-auth",
    firestoreReadAttempted: false,
    firestoreReadSuccess: false,
    approved: "unknown",
  });
  renderState("checking-auth", "בודק התחברות...", "בודק התחברות...");
  renderDetails({
    state: "checking-auth",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
    authDomain: firebaseConfig?.authDomain || "",
  });
}

function renderUnauthenticated() {
  state.approvalReadUid = "";
  updateDebug({
    authState: "unauthenticated",
    uid: "",
    email: "",
    approved: "unknown",
  });
  renderState("unauthenticated", "לא מחובר", "לא מחובר");
  renderDetails({
    state: "unauthenticated",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
  elements.actions?.append(
    makeLink("מעבר להתחברות", "../login.html"),
    makeLink("חזרה לדף הבית", "../index.html", "btn secondary")
  );
}

function displayNameForUser(user) {
  return user?.displayName || user?.email || "משתמש מחובר";
}

function renderCheckingApproval(user) {
  updateDebug({
    authState: "authenticated",
    uid: user?.uid || "",
    email: user?.email || "",
    firestoreReadAttempted: true,
    firestoreReadSuccess: false,
    approved: "unknown",
  });
  renderState("checking-approval", "בודק אישור...", "בודק האם המשתמש מאושר לצפייה בתוכן מוגן.");
  renderDetails({
    state: "checking-approval",
    uid: user?.uid || "",
    email: user?.email || "",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
}

function renderApproved(user) {
  const label = displayNameForUser(user);
  updateDebug({
    authState: "authenticated",
    uid: user?.uid || "",
    email: user?.email || "",
    firestoreReadSuccess: true,
    approved: true,
  });
  renderState("approved", "המשתמש מאושר", `המשתמש מאושר: ${label}`);
  renderDetails({
    state: "approved",
    uid: user?.uid || "",
    email: user?.email || "",
    displayName: user?.displayName || "",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
  elements.actions?.append(
    makeButton("המשך לשלב הבא", () => {
      setText(elements.message, "זהו placeholder בלבד לשלב הבא. עדיין אין שאלות בדף זה.");
    }),
    makeLink("חזרה לדף הבית", "../index.html", "btn secondary"),
    makeButton("התנתקות", async () => {
      try {
        renderCheckingAuth();
        await signOut(auth);
      } catch (error) {
        renderApprovalError(user, error);
      }
    })
  );
}

function renderNotApproved(user) {
  updateDebug({
    authState: "authenticated",
    uid: user?.uid || "",
    email: user?.email || "",
    firestoreReadSuccess: true,
    approved: false,
  });
  renderState("not-approved", "המשתמש מחובר אך טרם אושר", "המשתמש מחובר אך טרם אושר לצפייה בתוכן המוגן.");
  renderDetails({
    state: "not-approved",
    uid: user?.uid || "",
    email: user?.email || "",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
  elements.actions?.append(
    makeLink("חזרה לדף הבית", "../index.html"),
    makeButton("התנתקות", async () => {
      try {
        renderCheckingAuth();
        await signOut(auth);
      } catch (error) {
        renderApprovalError(user, error);
      }
    })
  );
}

function renderAuthError(error) {
  const code = error?.code || "auth-error";
  updateDebug({ authState: "auth-error", approved: "unknown" });
  renderState("auth-error", "שגיאת התחברות", "לא ניתן להשלים את בדיקת ההתחברות כרגע.");
  renderDetails({
    state: "auth-error",
    code,
    message: error?.message || "",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
  elements.actions?.append(
    makeLink("מעבר להתחברות", "../login.html"),
    makeLink("חזרה לדף הבית", "../index.html", "btn secondary")
  );
}

function renderApprovalError(user, error) {
  const code = error?.code || "approval-error";
  updateDebug({
    authState: user ? "authenticated" : "unknown",
    uid: user?.uid || "",
    email: user?.email || "",
    firestoreReadSuccess: false,
    approved: "unknown",
  });
  renderState("approval-error", "שגיאת בדיקת אישור", "לא ניתן לאמת כרגע את הרשאת המשתמש. נסו שוב מאוחר יותר.");
  renderDetails({
    state: "approval-error",
    uid: user?.uid || "",
    email: user?.email || "",
    code,
    message: error?.message || "",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
  elements.actions?.append(
    makeLink("חזרה לדף הבית", "../index.html"),
    makeButton("התנתקות", async () => {
      try {
        renderCheckingAuth();
        await signOut(auth);
      } catch (signOutError) {
        renderAuthError(signOutError);
      }
    })
  );
}

async function waitForAuthReady() {
  if (typeof auth?.authStateReady === "function") {
    await auth.authStateReady();
  }
}

async function readApproval(user) {
  renderCheckingApproval(user);

  if (!db) {
    throw new Error("Firestore is not configured.");
  }

  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  updateDebug({ firestoreReadSuccess: true });

  if (!snapshot.exists()) return false;
  return snapshot.data()?.approved === true;
}

async function handleAuthenticatedUser(user) {
  if (state.approvalReadUid === user.uid) return;
  state.approvalReadUid = user.uid;

  try {
    const approved = await readApproval(user);
    if (approved) renderApproved(user);
    else renderNotApproved(user);
  } catch (error) {
    renderApprovalError(user, error);
  }
}

async function init() {
  renderCheckingAuth();

  if (!auth) {
    renderAuthError({ code: "auth/not-configured", message: "Firebase Auth is not configured." });
    return;
  }

  try {
    await waitForAuthReady();
    state.unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        handleAuthenticatedUser(user);
      } else {
        renderUnauthenticated();
      }
    });
  } catch (error) {
    renderAuthError(error);
  }
}

window.addEventListener("pagehide", () => {
  if (typeof state.unsubscribe === "function") state.unsubscribe();
});

init();

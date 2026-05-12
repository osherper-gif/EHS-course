import {
  auth,
  firebaseConfig,
  firebaseEnvironment,
  onAuthStateChanged,
  signOut,
} from "./firebase-config.js";

const state = {
  unsubscribe: null,
};

const elements = {
  heading: document.getElementById("protected-auth-check-heading"),
  message: document.getElementById("protected-auth-check-message"),
  details: document.getElementById("protected-auth-check-details"),
  actions: document.getElementById("protected-auth-check-actions"),
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

function renderDetails(items) {
  if (!elements.details) return;
  elements.details.replaceChildren();

  Object.entries(items).forEach(([key, value]) => {
    const term = document.createElement("dt");
    term.textContent = key;
    const description = document.createElement("dd");
    description.textContent = String(value || "");
    elements.details.append(term, description);
  });

  elements.details.hidden = false;
}

function renderState(nextState, title, message) {
  document.body.dataset.authCheckState = nextState;
  setText(elements.heading, title);
  setText(elements.message, message);
  if (elements.message) elements.message.dataset.state = nextState;
  clearActions();
}

function renderChecking() {
  renderState("checking-auth", "בודק התחברות...", "בודק התחברות...");
  renderDetails({
    state: "checking-auth",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
    authDomain: firebaseConfig?.authDomain || "",
  });
}

function renderUnauthenticated() {
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

function renderAuthenticated(user) {
  const label = displayNameForUser(user);
  renderState("authenticated", "מחובר", `מחובר כ: ${label}`);
  renderDetails({
    state: "authenticated",
    uid: user?.uid || "",
    email: user?.email || "",
    displayName: user?.displayName || "",
    environment: firebaseEnvironment,
    projectId: firebaseConfig?.projectId || "",
  });
  elements.actions?.append(
    makeLink("חזרה לדף הבית", "../index.html"),
    makeButton("התנתקות", async () => {
      try {
        renderChecking();
        await signOut(auth);
      } catch (error) {
        renderAuthError(error);
      }
    })
  );
}

function renderAuthError(error) {
  const code = error?.code || "auth-error";
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

async function waitForAuthReady() {
  if (typeof auth?.authStateReady === "function") {
    await auth.authStateReady();
  }
}

async function init() {
  renderChecking();

  if (!auth) {
    renderAuthError({ code: "auth/not-configured", message: "Firebase Auth is not configured." });
    return;
  }

  try {
    await waitForAuthReady();
    state.unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) renderAuthenticated(user);
      else renderUnauthenticated();
    });
  } catch (error) {
    renderAuthError(error);
  }
}

window.addEventListener("pagehide", () => {
  if (typeof state.unsubscribe === "function") state.unsubscribe();
});

init();

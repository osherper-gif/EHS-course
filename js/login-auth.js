import {
  auth,
  isFirebaseConfigured,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
} from "./firebase-login-config.js";

const message = document.getElementById("authMessage");
const googleButton = document.getElementById("googleLogin");
let fullAuthLoaded = false;
const GOOGLE_LOGIN_TIMEOUT_MS = 10000;

function setMessage(text, type = "") {
  if (!message) return;
  message.textContent = text;
  message.className = "auth-message" + (type ? " " + type : "");
}

function setBusy(isBusy) {
  if (!googleButton) return;
  googleButton.disabled = isBusy;
  googleButton.classList.toggle("is-loading", isBusy);
  googleButton.setAttribute("aria-busy", isBusy ? "true" : "false");
  googleButton.textContent = isBusy ? "פותח התחברות..." : "כניסה עם Google";
}

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function isRedirectPreferred() {
  return window.matchMedia("(max-width: 768px)").matches
    || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error("google-login-timeout")), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

async function loadFullAuthFlow() {
  if (fullAuthLoaded) return;
  fullAuthLoaded = true;
  setMessage("בודק הרשאות ומעביר לאתר...", "info");
  await import("./auth.js");
}

function showLoginFailure(error, fallbackMessage) {
  console.error("[login] Google sign-in failed", error);
  fullAuthLoaded = false;
  setBusy(false);
  setMessage(
    fallbackMessage || "לא ניתן להתחבר כרגע. נסה לרענן את העמוד או לבחור שוב חשבון Google.",
    "error"
  );
}

async function startRedirectLogin(reason) {
  console.warn("[login] Starting Google redirect sign-in", reason || "");
  setBusy(true);
  setMessage("מעביר לכניסה עם Google...", "info");
  await signInWithRedirect(auth, createGoogleProvider());
}

async function startGoogleLogin() {
  setBusy(true);
  setMessage("פותח התחברות...", "info");

  if (isRedirectPreferred()) {
    await startRedirectLogin("mobile-or-narrow-screen");
    return;
  }

  try {
    await withTimeout(signInWithPopup(auth, createGoogleProvider()), GOOGLE_LOGIN_TIMEOUT_MS);
    await loadFullAuthFlow();
  } catch (error) {
    const code = error?.code || "";
    const messageText = error?.message || "";
    const shouldRedirect = code.includes("popup-blocked")
      || code.includes("operation-not-supported")
      || messageText.includes("google-login-timeout");

    if (shouldRedirect) {
      await startRedirectLogin(code || messageText);
      return;
    }

    if (code.includes("popup-closed")) {
      showLoginFailure(error, "חלון הכניסה נסגר לפני השלמת הפעולה. אפשר ללחוץ שוב ולבחור חשבון Google.");
    } else {
      showLoginFailure(error);
    }
  }
}

function initLogin() {
  document.body.classList.remove("login-auth-check");

  if (!isFirebaseConfigured || !auth) {
    setBusy(false);
    setMessage("ההתחברות אינה זמינה כרגע. נסה שוב מאוחר יותר.", "error");
    return;
  }

  getRedirectResult(auth).then((result) => {
    if (result?.user) return loadFullAuthFlow();
    return null;
  }).catch((error) => {
    console.error("[login] Google redirect result failed", error);
    setBusy(false);
    setMessage("ההתחברות לא הושלמה. נסה שוב או רענן את העמוד.", "error");
  });

  googleButton?.addEventListener("click", () => {
    startGoogleLogin().catch((error) => {
      showLoginFailure(error, "ההתחברות לא הושלמה. נסה שוב או רענן את העמוד.");
    });
  });

  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    loadFullAuthFlow().catch((error) => {
      console.error("[login] Auth handoff failed", error);
      fullAuthLoaded = false;
      setBusy(false);
      setMessage("לא ניתן להשלים את בדיקת ההרשאות כרגע. נסה לרענן את העמוד.", "error");
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLogin, { once: true });
} else {
  initLogin();
}

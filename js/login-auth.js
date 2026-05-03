import {
  auth,
  isFirebaseConfigured,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "./firebase-login-config.js";

const message = document.getElementById("authMessage");
const googleButton = document.getElementById("googleLogin");
let fullAuthLoaded = false;

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

function initLogin() {
  document.body.classList.remove("login-auth-check");

  if (!isFirebaseConfigured || !auth) {
    setBusy(false);
    setMessage("ההתחברות אינה זמינה כרגע. נסה שוב מאוחר יותר.", "error");
    return;
  }

  googleButton?.addEventListener("click", async () => {
    setBusy(true);
    setMessage("פותח התחברות...", "info");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      await loadFullAuthFlow();
    } catch (error) {
      const code = error?.code || "";
      if (code.includes("popup-closed")) {
        showLoginFailure(error, "חלון הכניסה נסגר לפני השלמת הפעולה. אפשר ללחוץ שוב ולבחור חשבון Google.");
      } else if (code.includes("popup-blocked")) {
        showLoginFailure(error, "חלון הכניסה נחסם בדפדפן. אפשר לאפשר חלונות קופצים ולנסות שוב.");
      } else {
        showLoginFailure(error);
      }
    }
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

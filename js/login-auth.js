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
  googleButton.textContent = isBusy ? "מתחבר..." : "כניסה עם Google";
}

async function loadFullAuthFlow() {
  if (fullAuthLoaded) return;
  fullAuthLoaded = true;
  setMessage("בודק הרשאות ומעביר לאתר...", "info");
  await import("./auth.js");
}

function initLogin() {
  document.body.classList.remove("login-auth-check");
  if (!isFirebaseConfigured || !auth) {
    setMessage("ההתחברות אינה זמינה כרגע. נסה שוב מאוחר יותר.", "error");
    setBusy(false);
    return;
  }

  googleButton?.addEventListener("click", async () => {
    setBusy(true);
    setMessage("פותח חלון כניסה מאובטח...", "info");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      await loadFullAuthFlow();
    } catch (error) {
      setBusy(false);
      const code = error?.code || "";
      if (code.includes("popup-closed")) {
        setMessage("חלון הכניסה נסגר לפני השלמת הפעולה.", "error");
      } else {
        setMessage("לא ניתן להשלים את הכניסה כרגע. נסה שוב.", "error");
      }
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (user) loadFullAuthFlow().catch(() => {
      setBusy(false);
      setMessage("לא ניתן להשלים את בדיקת ההרשאות כרגע. נסה לרענן את העמוד.", "error");
    });
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initLogin, { once: true });
else initLogin();

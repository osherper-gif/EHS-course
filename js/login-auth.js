const message = document.getElementById("authMessage");
const googleButton = document.getElementById("googleLogin");
let fullAuthLoaded = false;
let loginFirebasePromise = null;

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

async function loadLoginFirebase() {
  if (!loginFirebasePromise) loginFirebasePromise = import("./firebase-login-config.js");
  return loginFirebasePromise;
}

async function loadFullAuthFlow() {
  if (fullAuthLoaded) return;
  fullAuthLoaded = true;
  setMessage("בודק הרשאות ומעביר לאתר...", "info");
  await import("./auth.js");
}

function initLogin() {
  document.body.classList.remove("login-auth-check");

  googleButton?.addEventListener("click", async () => {
    setBusy(true);
    setMessage("פותח התחברות...", "info");
    try {
      const {
        auth,
        isFirebaseConfigured,
        GoogleAuthProvider,
        signInWithPopup,
      } = await loadLoginFirebase();
      if (!isFirebaseConfigured || !auth) {
        throw new Error("login-not-ready");
      }
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
        setMessage("לא ניתן לפתוח התחברות כרגע, נסה שוב.", "error");
      }
    }
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initLogin, { once: true });
else initLogin();

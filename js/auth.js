import {
  ADMIN_EMAIL,
  auth,
  db,
  isFirebaseConfigured,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "./firebase-config.js";

const LOGIN_PAGE = "login.html";
const ADMIN_PAGE = "admin.html";
const APPROVED = "approved";
const PENDING = "pending";
const BLOCKED = "blocked";

const isRootPage = !location.pathname.includes("/pages/");
const pathPrefix = isRootPage ? "" : "../";
const pageName = location.pathname.split("/").pop() || "index.html";
const isLoginPage = pageName === LOGIN_PAGE;
const isAdminPage = pageName === ADMIN_PAGE;

let currentProfile = null;
let authReadyResolve;
window.CourseAuthReady = new Promise((resolve) => {
  authReadyResolve = resolve;
});

function loginUrl() {
  return pathPrefix + LOGIN_PAGE;
}

function homeUrl() {
  return isRootPage ? "index.html" : "../index.html";
}

function adminUrl() {
  return isRootPage ? ADMIN_PAGE : "../admin.html";
}

function safeRedirect(url) {
  if (location.pathname.endsWith(url.replace("../", ""))) return;
  location.href = url;
}

function showShellMessage(title, message, actions = "") {
  document.body.classList.add("auth-ready");
  document.body.classList.remove("auth-approved");
  let shell = document.getElementById("authStateShell");
  if (!shell) {
    shell = document.createElement("section");
    shell.id = "authStateShell";
    shell.className = "auth-state-shell";
    document.body.prepend(shell);
  }
  shell.innerHTML = '<div class="auth-state-card"><h1>' + title + '</h1><p>' + message + '</p><div class="auth-state-actions">' + actions + '</div></div>';
}

function showLoading() {
  if (isLoginPage) return;
  let shell = document.getElementById("authStateShell");
  if (!shell) {
    shell = document.createElement("section");
    shell.id = "authStateShell";
    shell.className = "auth-state-shell loading";
    shell.innerHTML = '<div class="auth-state-card"><h1>בודק הרשאות...</h1><p>רגע קצר, מאמתים את הכניסה לאתר.</p></div>';
    document.body.prepend(shell);
  }
}

function hideShell() {
  const shell = document.getElementById("authStateShell");
  if (shell) shell.remove();
}

function providerName(user) {
  return user.providerData?.[0]?.providerId || "password";
}

function isAdminEmail(email) {
  return String(email || "").toLowerCase() === ADMIN_EMAIL;
}

async function ensureUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);
  const base = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || user.email || "",
    photoURL: user.photoURL || "",
    provider: providerName(user),
    lastLoginAt: serverTimestamp(),
  };

  if (!snapshot.exists()) {
    const admin = isAdminEmail(user.email);
    const profile = {
      ...base,
      role: admin ? "admin" : "student",
      status: admin ? APPROVED : PENDING,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return { ...profile, createdAt: new Date(), lastLoginAt: new Date() };
  }

  const existing = snapshot.data();
  const admin = isAdminEmail(user.email);
  const updates = {
    ...base,
    ...(admin ? { role: "admin", status: APPROVED } : {}),
  };
  await updateDoc(ref, updates);
  return { ...existing, ...updates };
}

function decorateApprovedUser(profile) {
  document.body.classList.add("auth-ready", "auth-approved");
  hideShell();
  const actions = document.querySelector(".header-actions");
  if (!actions || document.getElementById("userBadge")) return;
  const label = profile.displayName || profile.email || "משתמש";
  const photo = profile.photoURL ? '<img src="' + profile.photoURL + '" alt="">' : '<span class="user-avatar-fallback">' + label.slice(0, 1) + '</span>';
  const adminLink = profile.role === "admin" ? '<a class="btn secondary admin-link" href="' + adminUrl() + '">ניהול משתמשים</a>' : "";
  actions.insertAdjacentHTML("afterbegin", '<div id="userBadge" class="user-badge">' + photo + '<span>שלום, ' + label + '</span></div>' + adminLink + '<button class="btn secondary" type="button" data-action="logout">התנתקות</button>');
  actions.querySelector('[data-action="logout"]')?.addEventListener("click", () => window.CourseAuth.logout());
}

function renderNotApproved(profile) {
  if (profile.status === BLOCKED) {
    showShellMessage("אין הרשאת גישה", "הגישה שלך לאתר נחסמה. פנה למנהל האתר.", '<button class="btn" type="button" data-action="logout">התנתקות</button>');
  } else {
    showShellMessage("ממתין לאישור", "המשתמש נרשם בהצלחה אך ממתין לאישור מנהל האתר.", '<button class="btn" type="button" data-action="logout">התנתקות</button>');
  }
  document.querySelector('[data-action="logout"]')?.addEventListener("click", () => window.CourseAuth.logout());
}

function hebrewAuthError(error) {
  const code = error?.code || "";
  const map = {
    "auth/invalid-email": "כתובת האימייל אינה תקינה.",
    "auth/user-disabled": "המשתמש נחסם.",
    "auth/user-not-found": "לא נמצא משתמש עם פרטים אלה.",
    "auth/wrong-password": "הסיסמה שגויה.",
    "auth/invalid-credential": "פרטי ההתחברות שגויים.",
    "auth/email-already-in-use": "כתובת האימייל כבר רשומה.",
    "auth/weak-password": "הסיסמה חלשה מדי. יש להזין לפחות 6 תווים.",
    "auth/popup-closed-by-user": "חלון ההתחברות נסגר לפני השלמת הפעולה.",
    "auth/network-request-failed": "שגיאת רשת. בדוק חיבור לאינטרנט ונסה שוב.",
  };
  return map[code] || "אירעה שגיאה בהתחברות. נסה שוב.";
}

async function googleLogin() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

async function emailLogin(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
}

async function emailRegister(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(credential.user, { displayName });
}

async function logout() {
  if (auth) await signOut(auth);
  currentProfile = null;
  safeRedirect(loginUrl());
}

async function syncProgress(lessonId, completed, notes) {
  if (!db || !auth?.currentUser || !currentProfile || currentProfile.status !== APPROVED) return false;
  try {
    await setDoc(doc(db, "users", auth.currentUser.uid, "progress", lessonId), {
      lessonId,
      completed: Boolean(completed),
      notes: notes || "",
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn("Firestore progress sync failed", error);
    return false;
  }
}

async function hydrateProgressFromFirestore(uid) {
  if (!db || !window.CourseStorage) return;
  try {
    const snapshot = await getDocs(collection(db, "users", uid, "progress"));
    if (snapshot.empty) return;
    const localProgress = window.CourseStorage.progress();
    const localNotes = window.CourseStorage.notes();
    snapshot.forEach((item) => {
      const data = item.data();
      if (!data.lessonId) return;
      if (typeof data.completed === "boolean") localProgress[data.lessonId] = data.completed;
      if (typeof data.notes === "string" && !localNotes[data.lessonId]) localNotes[data.lessonId] = data.notes;
    });
    window.CourseStorage.set("progress", localProgress);
    window.CourseStorage.set("notes", localNotes);
    document.querySelectorAll("[data-complete]").forEach((input) => {
      input.checked = Boolean(localProgress[input.dataset.complete]);
    });
    document.querySelectorAll("[data-progress]").forEach((bar) => {
      bar.value = localProgress[bar.dataset.progress] ? 100 : 0;
    });
    document.querySelectorAll("[data-note]").forEach((textarea) => {
      textarea.value = localNotes[textarea.dataset.note] || "";
    });
    const stat = document.querySelector('[data-stat="completed"]');
    if (stat) stat.textContent = Object.values(localProgress).filter(Boolean).length;
  } catch (error) {
    console.warn("Firestore progress load failed", error);
  }
}

async function pushLocalProgressToFirestore() {
  if (!window.CourseStorage || !auth?.currentUser) return;
  const progress = window.CourseStorage.progress();
  const notes = window.CourseStorage.notes();
  const lessonIds = new Set([...Object.keys(progress), ...Object.keys(notes)]);
  for (const lessonId of lessonIds) {
    await syncProgress(lessonId, Boolean(progress[lessonId]), notes[lessonId] || "");
  }
}

function initLoginPage() {
  const message = document.getElementById("authMessage");
  const setMessage = (text, type = "info") => {
    if (!message) return;
    message.textContent = text;
    message.dataset.type = type;
  };
  if (!isFirebaseConfigured) {
    setMessage("יש להדביק את firebaseConfig בקובץ js/firebase-config.js לפני שימוש בהתחברות.", "error");
    return;
  }
  document.getElementById("googleLogin")?.addEventListener("click", async () => {
    try {
      setMessage("מתחבר עם Google...");
      await googleLogin();
    } catch (error) {
      setMessage(hebrewAuthError(error), "error");
    }
  });
  document.getElementById("emailLoginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      setMessage("מתחבר...");
      await emailLogin(form.get("email"), form.get("password"));
    } catch (error) {
      setMessage(hebrewAuthError(error), "error");
    }
  });
  document.getElementById("emailRegisterForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      setMessage("יוצר משתמש...");
      await emailRegister(form.get("email"), form.get("password"), form.get("displayName"));
      setMessage("המשתמש נרשם בהצלחה אך ממתין לאישור מנהל האתר.");
    } catch (error) {
      setMessage(hebrewAuthError(error), "error");
    }
  });
}

function guard() {
  if (!isFirebaseConfigured) {
    if (isLoginPage) return initLoginPage();
    showShellMessage("נדרש חיבור Firebase", "יש להדביק את firebaseConfig בקובץ js/firebase-config.js לפני פרסום האתר.", '<a class="btn" href="' + loginUrl() + '">לעמוד התחברות</a>');
    authReadyResolve?.(null);
    return;
  }
  if (!isLoginPage) showLoading();
  if (isLoginPage) initLoginPage();

  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        currentProfile = null;
        authReadyResolve?.(null);
        if (!isLoginPage) safeRedirect(loginUrl());
        return;
      }
      const profile = await ensureUserProfile(user);
      currentProfile = profile;
      window.CourseAuth.profile = profile;
      if (isLoginPage) {
        if (profile.status === APPROVED) safeRedirect(homeUrl());
        else renderNotApproved(profile);
        authReadyResolve?.(profile);
        return;
      }
      if (isAdminPage && profile.role !== "admin") {
        showShellMessage("אין הרשאת גישה", "רק מנהל האתר יכול להיכנס לעמוד זה.", '<a class="btn" href="' + homeUrl() + '">חזרה לקורס</a>');
        authReadyResolve?.(profile);
        return;
      }
      if (profile.status !== APPROVED) {
        renderNotApproved(profile);
        authReadyResolve?.(profile);
        return;
      }
      await hydrateProgressFromFirestore(user.uid);
      decorateApprovedUser(profile);
      pushLocalProgressToFirestore();
      authReadyResolve?.(profile);
      document.dispatchEvent(new CustomEvent("course-auth-approved", { detail: profile }));
    } catch (error) {
      console.error(error);
      showShellMessage("שגיאת הרשאות", "לא ניתן להשלים את בדיקת ההרשאות. נסה לרענן או פנה למנהל האתר.");
      authReadyResolve?.(null);
    }
  });
}

window.CourseAuth = {
  get profile() {
    return currentProfile;
  },
  set profile(value) {
    currentProfile = value;
  },
  logout,
  syncProgress,
  hebrewAuthError,
  isAdminEmail,
};

document.addEventListener("DOMContentLoaded", guard);

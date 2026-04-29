import {
  ADMIN_EMAIL,
  auth,
  db,
  isFirebaseConfigured,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
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
const MAX_TEXT = 5000;
const AUTH_CACHE_KEY = "ehsCourseAuthCache";
const AUTH_CACHE_TTL = 5 * 60 * 1000;
const LOADER_DELAY = 700;

const isRootPage = !location.pathname.includes("/pages/");
const pathPrefix = isRootPage ? "" : "../";
const pageName = location.pathname.split("/").pop() || "index.html";
const isLoginPage = pageName === LOGIN_PAGE;
const isAdminPage = pageName === ADMIN_PAGE;

let currentProfile = null;
let authReadyResolve;
let loaderTimer = null;
window.CourseAuthReady = new Promise((resolve) => {
  authReadyResolve = resolve;
});

function sanitizeText(value, max = MAX_TEXT) {
  return String(value || "").replace(/[<>]/g, "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

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

function isApprovedProfile(profile) {
  return profile?.status === APPROVED || profile?.role === "admin";
}

function profileForCache(profile) {
  return {
    uid: sanitizeText(profile?.uid, 180),
    email: sanitizeText(profile?.email, 320),
    displayName: sanitizeText(profile?.displayName || profile?.email, 180),
    role: sanitizeText(profile?.role, 40),
    status: sanitizeText(profile?.status, 40),
    photoURL: sanitizeText(profile?.photoURL, 1000),
    lastAuthCheck: Date.now(),
  };
}

function getCachedProfile() {
  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw);
    const fresh = Date.now() - Number(profile.lastAuthCheck || 0) < AUTH_CACHE_TTL;
    if (!fresh || !profile.uid || !isApprovedProfile(profile)) return null;
    return profile;
  } catch {
    return null;
  }
}

function saveCachedProfile(profile) {
  try {
    if (isApprovedProfile(profile)) sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(profileForCache(profile)));
    else sessionStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    // sessionStorage is an optimization only.
  }
}

function clearCachedProfile() {
  try {
    sessionStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

function buttonElement(text, onClick) {
  const button = document.createElement("button");
  button.className = "btn";
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function linkElement(text, href) {
  const link = document.createElement("a");
  link.className = "btn";
  link.href = href;
  link.textContent = text;
  return link;
}

function showShellMessage(title, message, actionBuilder) {
  hideLoading();
  document.body.classList.add("auth-ready");
  document.body.classList.remove("auth-approved");
  let shell = document.getElementById("authStateShell");
  if (!shell) {
    shell = document.createElement("section");
    shell.id = "authStateShell";
    shell.className = "auth-state-shell";
    document.body.prepend(shell);
  }
  shell.replaceChildren();
  const card = document.createElement("div");
  card.className = "auth-state-card";
  const heading = document.createElement("h1");
  heading.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  const actions = document.createElement("div");
  actions.className = "auth-state-actions";
  if (actionBuilder) actions.append(actionBuilder());
  card.append(heading, paragraph, actions);
  shell.append(card);
}

function showLoading() {
  if (isLoginPage) return;
  clearTimeout(loaderTimer);
  loaderTimer = window.setTimeout(() => {
    if (document.body.classList.contains("auth-approved")) return;
    if (document.getElementById("authInlineLoader")) return;
    const loader = document.createElement("div");
    loader.id = "authInlineLoader";
    loader.className = "auth-inline-loader";
    loader.textContent = "בודק הרשאות...";
    document.body.append(loader);
  }, LOADER_DELAY);
}

function hideLoading() {
  clearTimeout(loaderTimer);
  const loader = document.getElementById("authInlineLoader");
  if (loader) loader.remove();
}

function hideShell() {
  hideLoading();
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
    email: sanitizeText(user.email, 320),
    displayName: sanitizeText(user.displayName || user.email, 180),
    photoURL: sanitizeText(user.photoURL, 1000),
    provider: sanitizeText(providerName(user), 80),
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
  const label = sanitizeText(profile.displayName || profile.email || "משתמש", 180);
  const badge = document.createElement("div");
  badge.id = "userBadge";
  badge.className = "user-badge";
  const photoUrl = sanitizeText(profile.photoURL, 1000);
  if (/^https:\/\//.test(photoUrl) || photoUrl.startsWith("data:")) {
    const img = document.createElement("img");
    img.src = photoUrl;
    img.alt = "";
    badge.append(img);
  } else {
    const fallback = document.createElement("span");
    fallback.className = "user-avatar-fallback";
    fallback.textContent = label.slice(0, 1);
    badge.append(fallback);
  }
  const text = document.createElement("span");
  text.textContent = "שלום, " + label;
  badge.append(text);
  actions.prepend(badge);
  if (profile.role === "admin" && !actions.querySelector(".admin-link")) {
    const adminLink = document.createElement("a");
    adminLink.className = "btn secondary admin-link";
    adminLink.href = adminUrl();
    adminLink.textContent = "ניהול משתמשים";
    badge.after(adminLink);
  }
  if (!actions.querySelector('[data-action="logout"]')) {
    const logoutButton = document.createElement("button");
    logoutButton.className = "btn secondary";
    logoutButton.type = "button";
    logoutButton.dataset.action = "logout";
    logoutButton.textContent = "התנתקות";
    logoutButton.addEventListener("click", () => window.CourseAuth.logout());
    actions.append(logoutButton);
  }
}

function renderNotApproved(profile) {
  if (profile.status === BLOCKED) {
    showShellMessage("אין הרשאת גישה", "הגישה שלך לאתר נחסמה. פנה למנהל האתר.", () => buttonElement("התנתקות", () => window.CourseAuth.logout()));
  } else {
    showShellMessage("ממתין לאישור", "המשתמש נרשם בהצלחה אך ממתין לאישור מנהל האתר.", () => buttonElement("התנתקות", () => window.CourseAuth.logout()));
  }
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
  await signInWithEmailAndPassword(auth, sanitizeText(email, 320), password);
}

async function emailRegister(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, sanitizeText(email, 320), password);
  const cleanName = sanitizeText(displayName, 180);
  if (cleanName) await updateProfile(credential.user, { displayName: cleanName });
}

async function logout() {
  clearCachedProfile();
  if (auth) await signOut(auth);
  currentProfile = null;
  safeRedirect(loginUrl());
}

async function syncProgress(lessonId, completed, notes) {
  if (!db || !auth?.currentUser || !currentProfile || currentProfile.status !== APPROVED) return false;
  try {
    await setDoc(doc(db, "users", auth.currentUser.uid, "progress", sanitizeText(lessonId, 120)), {
      lessonId: sanitizeText(lessonId, 120),
      completed: Boolean(completed),
      notes: sanitizeText(notes, MAX_TEXT),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

async function saveExamAttempt(attempt) {
  if (!db || !auth?.currentUser || !currentProfile || currentProfile.status !== APPROVED) return false;
  try {
    const attemptId = sanitizeText(attempt?.attemptId || "attempt-" + Date.now(), 140);
    await setDoc(doc(db, "users", auth.currentUser.uid, "examAttempts", attemptId), {
      attemptId,
      userId: auth.currentUser.uid,
      topic: sanitizeText(attempt?.topic, 120),
      score: Number(attempt?.score || 0),
      correctCount: Number(attempt?.correctCount || 0),
      wrongCount: Number(attempt?.wrongCount || 0),
      totalQuestions: Number(attempt?.totalQuestions || 0),
      answers: Array.isArray(attempt?.answers) ? attempt.answers.slice(0, 200).map((answer) => ({
        id: sanitizeText(answer.id, 140),
        selected: sanitizeText(answer.selected, 1000),
        correctAnswer: sanitizeText(answer.correctAnswer, 1000),
        isCorrect: Boolean(answer.isCorrect),
      })) : [],
      createdAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch {
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
      const lessonId = sanitizeText(data.lessonId, 120);
      if (!lessonId) return;
      if (typeof data.completed === "boolean") localProgress[lessonId] = data.completed;
      if (typeof data.notes === "string" && !localNotes[lessonId]) localNotes[lessonId] = sanitizeText(data.notes, MAX_TEXT);
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
  } catch {
    // The site intentionally keeps working with localStorage when Firestore sync is unavailable.
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
  const cached = getCachedProfile();
  if (cached) {
    safeRedirect(homeUrl());
    return;
  }
  document.body.classList.remove("login-auth-check");
  const message = document.getElementById("authMessage");
  const setMessage = (text, type = "info") => {
    if (!message) return;
    message.textContent = text;
    message.dataset.type = type;
  };
  if (!isFirebaseConfigured) {
    setMessage("יש להדביק firebaseConfig אמיתי לפני deploy. עד אז לא ניתן להתחבר.", "error");
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

function prefetchUrl(url) {
  if (!url || url.startsWith("#") || url.startsWith("mailto:") || /^https?:\/\//.test(url)) return;
  const absolute = new URL(url, location.href);
  if (document.querySelector('link[rel="prefetch"][href="' + absolute.href + '"]')) return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = absolute.href;
  document.head.append(link);
}

function initPrefetch() {
  const important = [
    isRootPage ? "index.html" : "../index.html",
    isRootPage ? "admin.html" : "../admin.html",
    ...(window.COURSE_DATA?.meetings || []).map((lesson) => (isRootPage ? "pages/" : "") + lesson.id + ".html"),
    ...(isRootPage ? ["pages/syllabus.html", "pages/glossary.html", "pages/laws.html", "pages/quizzes.html", "pages/exam-questions.html", "pages/ai-assistant.html"] : ["syllabus.html", "glossary.html", "laws.html", "quizzes.html", "exam-questions.html", "ai-assistant.html"]),
  ];
  important.slice(0, 18).forEach(prefetchUrl);
  const warm = (event) => {
    const anchor = event.target.closest?.("a[href]");
    if (anchor) prefetchUrl(anchor.getAttribute("href"));
  };
  document.addEventListener("mouseenter", warm, { capture: true, passive: true });
  document.addEventListener("touchstart", warm, { capture: true, passive: true });
  document.addEventListener("focusin", warm, { capture: true });
}

function guard() {
  if (!isFirebaseConfigured) {
    document.body.classList.remove("login-auth-check");
    if (isLoginPage) return initLoginPage();
    showShellMessage("נדרש חיבור Firebase", "יש להדביק firebaseConfig אמיתי לפני deploy.", () => linkElement("לעמוד התחברות", loginUrl()));
    authReadyResolve?.(null);
    return;
  }
  const cached = getCachedProfile();
  if (cached && isLoginPage) {
    safeRedirect(homeUrl());
    return;
  }
  if (cached && !isLoginPage) {
    currentProfile = cached;
    window.CourseAuth.profile = cached;
    decorateApprovedUser(cached);
    authReadyResolve?.(cached);
    document.dispatchEvent(new CustomEvent("course-auth-approved", { detail: cached }));
  } else if (!isLoginPage) {
    showLoading();
  }
  if (isLoginPage) initLoginPage();

  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        clearCachedProfile();
        currentProfile = null;
        authReadyResolve?.(null);
        if (!isLoginPage) safeRedirect(loginUrl());
        return;
      }
      const profile = await ensureUserProfile(user);
      currentProfile = profile;
      window.CourseAuth.profile = profile;
      if (isLoginPage) {
        document.body.classList.remove("login-auth-check");
        if (profile.status === APPROVED) safeRedirect(homeUrl());
        else renderNotApproved(profile);
        authReadyResolve?.(profile);
        return;
      }
      if (isAdminPage && profile.role !== "admin") {
        clearCachedProfile();
        showShellMessage("אין הרשאת גישה", "רק מנהל האתר יכול להיכנס לעמוד זה.", () => linkElement("חזרה לקורס", homeUrl()));
        authReadyResolve?.(profile);
        return;
      }
      if (profile.status !== APPROVED) {
        clearCachedProfile();
        renderNotApproved(profile);
        authReadyResolve?.(profile);
        return;
      }
      saveCachedProfile(profile);
      await hydrateProgressFromFirestore(user.uid);
      decorateApprovedUser(profile);
      pushLocalProgressToFirestore();
      authReadyResolve?.(profile);
      document.dispatchEvent(new CustomEvent("course-auth-approved", { detail: profile }));
    } catch {
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
  saveExamAttempt,
  hebrewAuthError,
  isAdminEmail,
  sanitizeText,
};

document.addEventListener("DOMContentLoaded", () => {
  initPrefetch();
  guard();
});

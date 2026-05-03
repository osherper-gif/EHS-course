import "../js/email-notifications.js";
import "../js/feedback.js";
import "../js/m-mobile.js";
import "../js/m-lessons.js";
import "../js/presence.js";
import {
  ADMIN_EMAIL,
  auth,
  db,
  isFirebaseConfigured,
  GoogleAuthProvider,
  signInWithPopup,
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
const AUTO_APPROVE_NEW_USERS_UNTIL = "2026-05-15T23:59:59+03:00";
const APPROVAL_WELCOME_PREFIX = "ehsCourseApprovalWelcome:";
const PROFILE_SURVEY_LOCAL_PREFIX = "ehsCourseProfileSurvey:";
const AUTO_BETA_NOTICE_KEY = "ehsCourseAutoBetaNotice";
const PROFILE_SURVEY_OPTIONS = {
  useReason: [
    "סטודנט בקורס ממונה בטיחות",
    "ממונה בטיחות שרוצה להעמיק",
    "עובד/מנהל בארגון",
    "יועץ/איש מקצוע בתחום",
    "מתעניין בתחום הבטיחות",
    "אחר",
  ],
  learningStatus: [
    "לפני קורס",
    "במהלך קורס",
    "אחרי קורס / לפני מבחן",
    "ממונה בטיחות מוסמך",
    "עובד בתחום הבטיחות",
    "אחר",
  ],
  referralSource: [
    "חבר/עמית",
    "קבוצת WhatsApp",
    "חיפוש Google",
    "LinkedIn / רשת חברתית",
    "קורס / מסגרת לימודית",
    "אחר",
  ],
  sitePriority: [
    "סיכומי שיעורים",
    "שאלות ומבחנים",
    "אתגר בטיחות",
    "חוקים ותקנים",
    "כלי שטח / Checklists",
    "אחר",
  ],
};

const isRootPage = !location.pathname.includes("/pages/");
const pathPrefix = isRootPage ? "" : "../";
const pageName = location.pathname.split("/").pop() || "index.html";
const isLoginPage = pageName === LOGIN_PAGE;
const isAdminPage = pageName === ADMIN_PAGE || pageName === "version-management.html";

let currentProfile = null;
let authReadyResolve;
let loaderTimer = null;
window.CourseAuthReady = new Promise((resolve) => {
  authReadyResolve = resolve;
});

function authLog(message, detail) {
  if (detail !== undefined) console.info(`[auth] ${message}`, detail);
  else console.info(`[auth] ${message}`);
}

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

function versionManagementUrl() {
  return isRootPage ? "pages/version-management.html" : "version-management.html";
}

function safeRedirect(url) {
  if (location.pathname.endsWith(url.replace("../", ""))) return;
  location.href = url;
}

function isApprovedProfile(profile) {
  return profile?.status === APPROVED || profile?.role === "admin";
}

function isAutoApproveWindowActive(date = new Date()) {
  return date.getTime() <= new Date(AUTO_APPROVE_NEW_USERS_UNTIL).getTime();
}

function autoApprovalFields() {
  return {
    status: APPROVED,
    approvedAt: serverTimestamp(),
    approvedBy: "auto-beta",
    approvalMode: "auto-beta-14-days",
  };
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
  document.body.classList.add("auth-ready", "auth-shell-active");
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

function showCheckingShell() {
  if (document.body.classList.contains("auth-approved")) return;
  if (document.getElementById("authStateShell")) return;
  document.body.classList.add("auth-ready");
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
  heading.textContent = "בודק הרשאות";
  const paragraph = document.createElement("p");
  paragraph.textContent = "אנחנו מאמתים את החיבור שלך. העמוד לא יישאר ריק גם אם הבדיקה מתעכבת.";
  card.append(heading, paragraph);
  shell.append(card);
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => {
      authLog(`${label} timeout`);
      reject(new Error(`${label}-timeout`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
}

function showApprovalWelcome(profile) {
  if (!profile?.uid || !profile?.approvedAt) return;
  const key = APPROVAL_WELCOME_PREFIX + profile.uid;
  try {
    if (localStorage.getItem(key)) return;
  } catch {
    return;
  }
  const banner = document.createElement("div");
  banner.className = "approval-welcome-banner";
  const text = document.createElement("span");
  text.textContent = "חשבונך אושר. ברוך הבא לאתר.";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "icon-btn";
  close.textContent = "×";
  close.title = "סגור";
  close.addEventListener("click", () => {
    banner.remove();
    localStorage.setItem(key, "shown");
  });
  banner.append(text, close);
  document.body.prepend(banner);
  window.setTimeout(() => {
    if (document.body.contains(banner)) {
      banner.remove();
      localStorage.setItem(key, "shown");
    }
  }, 9000);
}

function hasProfileSurveyDecision(profile) {
  return Boolean(profile?.profileSurveyCompletedAt || profile?.profileSurveySkippedAt || profile?.profileSurvey);
}

function profileSurveyLocalKey(profile) {
  return PROFILE_SURVEY_LOCAL_PREFIX + sanitizeText(profile?.uid, 180);
}

function wasProfileSurveyHandledLocally(profile) {
  try {
    return localStorage.getItem(profileSurveyLocalKey(profile)) === "handled";
  } catch {
    return false;
  }
}

function markProfileSurveyHandledLocally(profile) {
  try {
    localStorage.setItem(profileSurveyLocalKey(profile), "handled");
  } catch {
    // Optional local hint only.
  }
}

function markAutoBetaNotice() {
  try {
    sessionStorage.setItem(AUTO_BETA_NOTICE_KEY, "1");
  } catch {
    // Non-critical UX hint.
  }
}

function showAutoBetaNoticeIfNeeded() {
  try {
    if (sessionStorage.getItem(AUTO_BETA_NOTICE_KEY) !== "1") return;
    sessionStorage.removeItem(AUTO_BETA_NOTICE_KEY);
  } catch {
    return;
  }
  const banner = document.createElement("div");
  banner.className = "approval-welcome-banner";
  const text = document.createElement("span");
  text.textContent = "נרשמת בהצלחה. חשבונך אושר אוטומטית לתקופת הבטא, ואתה מועבר לאתר.";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "icon-btn";
  close.textContent = "×";
  close.title = "סגור";
  close.addEventListener("click", () => banner.remove());
  banner.append(text, close);
  document.body.prepend(banner);
  window.setTimeout(() => banner.remove(), 9000);
}

function surveyField(labelText, name, options) {
  const label = document.createElement("label");
  const span = document.createElement("span");
  span.textContent = labelText;
  const select = document.createElement("select");
  select.name = name;
  select.required = true;
  options.forEach((optionText) => {
    const option = document.createElement("option");
    option.value = optionText;
    option.textContent = optionText;
    select.append(option);
  });
  label.append(span, select);
  return label;
}

function buildProfileSurveyDialog(profile) {
  const overlay = document.createElement("div");
  overlay.className = "profile-survey-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "profileSurveyTitle");

  const dialog = document.createElement("section");
  dialog.className = "profile-survey-dialog";
  const title = document.createElement("h2");
  title.id = "profileSurveyTitle";
  title.textContent = "נשמח להכיר אותך כדי לשפר את האתר";
  const intro = document.createElement("p");
  intro.textContent = "השאלות הבאות אינן חובה. הן עוזרות לנו להבין מי משתמש באתר ואיך לשפר אותו.";

  const form = document.createElement("form");
  form.className = "profile-survey-form";
  form.append(
    surveyField("למה אתה משתמש באפליקציה?", "useReason", PROFILE_SURVEY_OPTIONS.useReason),
    surveyField("מה הסטטוס שלך?", "learningStatus", PROFILE_SURVEY_OPTIONS.learningStatus),
    surveyField("מאיפה הגעת לאפליקציה?", "referralSource", PROFILE_SURVEY_OPTIONS.referralSource),
    surveyField("מה הכי חשוב לך באתר?", "sitePriority", PROFILE_SURVEY_OPTIONS.sitePriority)
  );

  const status = document.createElement("p");
  status.className = "profile-survey-status";
  status.setAttribute("role", "status");

  const actions = document.createElement("div");
  actions.className = "form-actions";
  const save = document.createElement("button");
  save.className = "btn";
  save.type = "submit";
  save.textContent = "שמור והמשך";
  const skip = document.createElement("button");
  skip.className = "btn secondary";
  skip.type = "button";
  skip.textContent = "דלג בינתיים";
  actions.append(save, skip);
  form.append(actions, status);

  const closeSurvey = () => {
    markProfileSurveyHandledLocally(profile);
    overlay.remove();
  };

  skip.addEventListener("click", async () => {
    skip.disabled = true;
    status.textContent = "שומר דילוג...";
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        profileSurveySkippedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      profile.profileSurveySkippedAt = new Date();
      closeSurvey();
    } catch {
      status.textContent = "לא ניתן היה לשמור כרגע. הדילוג נשמר מקומית.";
      window.setTimeout(closeSurvey, 1200);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    save.disabled = true;
    status.textContent = "שומר תשובות...";
    const formData = new FormData(form);
    const profileSurvey = {
      useReason: sanitizeText(formData.get("useReason"), 120),
      learningStatus: sanitizeText(formData.get("learningStatus"), 120),
      referralSource: sanitizeText(formData.get("referralSource"), 120),
      sitePriority: sanitizeText(formData.get("sitePriority"), 120),
    };
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        profileSurvey,
        profileSurveyCompletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      profile.profileSurvey = profileSurvey;
      profile.profileSurveyCompletedAt = new Date();
      closeSurvey();
    } catch {
      save.disabled = false;
      status.textContent = "לא ניתן היה לשמור כרגע. אפשר לדלג ולענות בהמשך.";
    }
  });

  dialog.append(title, intro, form);
  overlay.append(dialog);
  return overlay;
}

function maybeShowProfileSurvey(profile) {
  if (isLoginPage || !isApprovedProfile(profile) || !auth?.currentUser || !db) return;
  if (hasProfileSurveyDecision(profile) || wasProfileSurveyHandledLocally(profile)) return;
  if (document.querySelector(".profile-survey-overlay")) return;
  window.setTimeout(() => {
    if (document.querySelector(".profile-survey-overlay")) return;
    document.body.append(buildProfileSurveyDialog(profile));
  }, 650);
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
  document.body.classList.remove("auth-shell-active");
  const shell = document.getElementById("authStateShell");
  if (shell) shell.remove();
}

function providerName(user) {
  const providerId = user.providerData?.[0]?.providerId || "google.com";
  if (providerId === "google.com") return "google";
  return sanitizeText(providerId, 80);
}

function isAdminEmail(email) {
  return String(email || "").toLowerCase() === ADMIN_EMAIL;
}

function isAdminProfile(profile) {
  return profile?.role === "admin" || isAdminEmail(profile?.email);
}

function provisionalProfileFromUser(user) {
  const admin = isAdminEmail(user?.email);
  return {
    uid: sanitizeText(user?.uid, 180),
    email: sanitizeText(user?.email, 320),
    displayName: sanitizeText(user?.displayName || user?.email || "משתמש", 180),
    photoURL: sanitizeText(user?.photoURL, 1000),
    provider: sanitizeText(providerName(user), 80),
    role: admin ? "admin" : "student",
    status: APPROVED,
  };
}

function revealAuthenticatedView(profile) {
  currentProfile = profile;
  window.CourseAuth.profile = profile;
  decorateApprovedUser(profile);
  authReadyResolve?.(profile);
  document.dispatchEvent(new CustomEvent("course-auth-approved", { detail: profile }));
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
    updatedAt: serverTimestamp(),
  };

  if (!snapshot.exists()) {
    const admin = isAdminEmail(user.email);
    const autoApprove = !admin && isAutoApproveWindowActive();
    const profile = {
      ...base,
      role: admin ? "admin" : "student",
      status: admin || autoApprove ? APPROVED : PENDING,
      ...(autoApprove ? autoApprovalFields() : {}),
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    if (autoApprove) markAutoBetaNotice();
    if (!admin && profile.status === PENDING) {
      window.CourseEmailNotifications?.notifyPendingUser?.({ ...profile, uid: user.uid }).catch(() => null);
    }
    return { ...profile, createdAt: new Date(), lastLoginAt: new Date() };
  }

  const existing = snapshot.data();
  const admin = isAdminEmail(user.email);
  const autoApprovePending = !admin && existing.status === PENDING && isAutoApproveWindowActive();
  const updates = {
    ...base,
    ...(admin ? { role: "admin", status: APPROVED } : {}),
    ...(autoApprovePending ? autoApprovalFields() : {}),
  };
  await updateDoc(ref, updates);
  return { ...existing, ...updates };
}

function decorateApprovedUser(profile) {
  document.body.classList.add("auth-ready", "auth-approved");
  hideShell();
  const actions = document.querySelector(".header-actions");
  if (!actions) return;
  let badge = document.getElementById("userBadge");
  const label = sanitizeText(profile.displayName || profile.email || "משתמש", 180);
  if (!badge) {
    badge = document.createElement("div");
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
    text.dataset.userGreeting = "true";
    badge.append(text);
    actions.prepend(badge);
  }
  const text = badge.querySelector("[data-user-greeting]");
  if (text) text.textContent = "שלום, " + label;
  if (isAdminProfile(profile) && !actions.querySelector(".admin-link")) {
    const adminLink = document.createElement("a");
    adminLink.className = "btn secondary admin-link";
    adminLink.href = adminUrl();
    adminLink.textContent = "ניהול משתמשים";
    badge.after(adminLink);
    const versionLink = document.createElement("a");
    versionLink.className = "btn secondary admin-link";
    versionLink.href = versionManagementUrl();
    versionLink.textContent = "ניהול גרסאות אתר";
    adminLink.after(versionLink);
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
    showShellMessage("ממתין לאישור", "חשבונך עדיין ממתין לאישור מנהל האתר.", () => buttonElement("התנתקות", () => window.CourseAuth.logout()));
  }
}

function hebrewAuthError(error) {
  const code = error?.code || "";
  const map = {
    "auth/invalid-email": "כתובת האימייל אינה תקינה.",
    "auth/user-disabled": "המשתמש נחסם.",
    "auth/user-not-found": "לא נמצא משתמש עם פרטים אלה.",
    "auth/invalid-credential": "פרטי ההתחברות שגויים.",
    "auth/popup-closed-by-user": "חלון ההתחברות נסגר לפני השלמת הפעולה.",
    "auth/network-request-failed": "שגיאת רשת. בדוק חיבור לאינטרנט ונסה שוב.",
  };
  return map[code] || "אירעה שגיאה בהתחברות. נסה שוב.";
}

async function googleLogin() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
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

async function updateLastSeenVersionAt(timestamp) {
  if (!db || !auth?.currentUser || !currentProfile || currentProfile.status !== APPROVED) return false;
  try {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      lastSeenVersionAt: sanitizeText(timestamp || new Date().toISOString(), 80),
      lastSeenVersionUpdatedAt: serverTimestamp(),
    });
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

async function saveGameProgress(progress) {
  if (!db || !auth?.currentUser || !currentProfile || currentProfile.status !== APPROVED) return false;
  try {
    await setDoc(doc(db, "gameProgress", auth.currentUser.uid), {
      userId: auth.currentUser.uid,
      totalXp: Number(progress?.totalXp || 0),
      completedStages: progress?.completedStages || {},
      currentUnit: sanitizeText(progress?.currentUnit || "unit-foundations", 120),
      currentStage: sanitizeText(progress?.currentStage || "stage-01", 120),
      difficulty: sanitizeText(progress?.difficulty || "medium", 40),
      lastDifficultyRecommendation: sanitizeText(progress?.lastDifficultyRecommendation || "", 500),
      mistakes: Array.isArray(progress?.mistakes) ? progress.mistakes.slice(0, 50).map((mistake) => ({
        challengeId: sanitizeText(mistake.challengeId, 140),
        stageId: sanitizeText(mistake.stageId, 140),
        unitId: sanitizeText(mistake.unitId, 140),
        title: sanitizeText(mistake.title, 240),
        prompt: sanitizeText(mistake.prompt, 1000),
        relatedLessonId: sanitizeText(mistake.relatedLessonId, 120),
        createdAt: sanitizeText(mistake.createdAt, 80),
      })) : [],
      updatedAt: serverTimestamp(),
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
  if (initPrefetch.ready) return;
  initPrefetch.ready = true;
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
  let alreadyRevealed = false;
  const cached = getCachedProfile();
  if (cached && isLoginPage) {
    authLog("cache found");
    safeRedirect(homeUrl());
    return;
  }
  if (cached && isAdminPage && !isAdminProfile(cached)) {
    showLoading();
  } else if (cached && !isLoginPage) {
    authLog("cache found");
    document.body.classList.add("auth-cache-ready");
    revealAuthenticatedView(cached);
    alreadyRevealed = true;
  } else if (!isLoginPage) {
    showLoading();
  }
  if (isLoginPage) initLoginPage();

  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        authLog("redirect login");
        clearCachedProfile();
        currentProfile = null;
        authReadyResolve?.(null);
        if (!isLoginPage) safeRedirect(loginUrl());
        return;
      }
      authLog("user detected");
      document.body.classList.add("auth-user-detected");
      const fallbackProfile = getCachedProfile();
      let shownProfile = alreadyRevealed;
      if (!isLoginPage && !shownProfile && (!isAdminPage || isAdminEmail(user.email) || isAdminProfile(fallbackProfile))) {
        revealAuthenticatedView(fallbackProfile || provisionalProfileFromUser(user));
        shownProfile = true;
      }
      authLog("firestore status start");
      let profile;
      try {
        profile = await ensureUserProfile(user);
      } catch (error) {
        if (fallbackProfile) {
          authLog("firestore status failed");
          profile = fallbackProfile;
        } else {
          authLog("firestore status failed");
          if (shownProfile) {
            authReadyResolve?.(currentProfile);
            return;
          }
          showShellMessage(
            "בדיקת ההרשאות נכשלה",
            "לא הצלחנו לקבל את סטטוס המשתמש כרגע. אפשר לרענן או להתחבר מחדש.",
            () => {
              const actions = document.createDocumentFragment();
              actions.append(
                buttonElement("רענון", () => location.reload()),
                buttonElement("התנתקות", () => window.CourseAuth.logout())
              );
              return actions;
            }
          );
          authReadyResolve?.(null);
          return;
        }
      }
      currentProfile = profile;
      window.CourseAuth.profile = profile;
      if (isLoginPage) {
        document.body.classList.remove("login-auth-check");
        if (profile.status === APPROVED) safeRedirect(homeUrl());
        else renderNotApproved(profile);
        authReadyResolve?.(profile);
        return;
      }
      if (isAdminPage && !isAdminProfile(profile)) {
        clearCachedProfile();
        showShellMessage("אין הרשאת גישה", "רק מנהל האתר יכול להיכנס לעמוד זה.", () => linkElement("חזרה לקורס", homeUrl()));
        authReadyResolve?.(profile);
        return;
      }
      if (profile.status !== APPROVED) {
        authLog(profile.status === BLOCKED ? "blocked" : "pending");
        clearCachedProfile();
        window.CoursePresence?.stopPresence?.();
        renderNotApproved(profile);
        authReadyResolve?.(profile);
        return;
      }
      authLog("approved");
      saveCachedProfile(profile);
      if (shownProfile) {
        decorateApprovedUser(profile);
        window.CoursePresence?.startPresence?.(profile);
      } else {
        revealAuthenticatedView(profile);
      }
      showApprovalWelcome(profile);
      showAutoBetaNoticeIfNeeded();
      maybeShowProfileSurvey(profile);
      authReadyResolve?.(profile);
      (async () => {
        await hydrateProgressFromFirestore(user.uid);
        await pushLocalProgressToFirestore();
      })().catch(() => {
        // Firestore progress sync is optional; content must remain visible for approved users.
      });
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
  saveGameProgress,
  hebrewAuthError,
  isAdminEmail,
  isAdminProfile,
  sanitizeText,
};

document.addEventListener("DOMContentLoaded", () => {
  initPrefetch();
  guard();
});

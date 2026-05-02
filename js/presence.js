import {
  auth,
  db,
  doc,
  setDoc,
  serverTimestamp,
} from "./firebase-config.js";

const HEARTBEAT_INTERVAL_MS = 60 * 1000;
const MOBILE_QUERY = "(max-width: 768px)";
const MAX_TEXT = 1000;

let activeProfile = null;
let heartbeatTimer = null;
let heartbeatInFlight = false;

function clean(value, max = MAX_TEXT) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

function isLoginPage() {
  return /(^|\/)login\.html$/.test(location.pathname);
}

function canSendHeartbeat(profile) {
  if (!db || !auth?.currentUser || !profile || isLoginPage()) return false;
  if (profile.uid !== auth.currentUser.uid) return false;
  return profile.role === "admin" || profile.status === "approved";
}

async function sendHeartbeat() {
  if (!canSendHeartbeat(activeProfile) || heartbeatInFlight) return false;
  heartbeatInFlight = true;
  try {
    const user = auth.currentUser;
    await setDoc(doc(db, "activeSessions", user.uid), {
      uid: user.uid,
      email: clean(activeProfile.email || user.email, 320),
      displayName: clean(activeProfile.displayName || user.displayName || user.email, 180),
      lastSeenAt: serverTimestamp(),
      currentPath: clean(location.pathname + location.search + location.hash, 500),
      userAgent: clean(navigator.userAgent, 500),
      isMobile: window.matchMedia(MOBILE_QUERY).matches,
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn("[presence] heartbeat failed", error?.code || error?.message || error);
    return false;
  } finally {
    heartbeatInFlight = false;
  }
}

function startPresence(profile) {
  if (!canSendHeartbeat(profile)) return;
  activeProfile = profile;
  window.clearInterval(heartbeatTimer);
  sendHeartbeat();
  heartbeatTimer = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
}

function stopPresence() {
  activeProfile = null;
  window.clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

document.addEventListener("course-auth-approved", (event) => {
  startPresence(event.detail);
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") sendHeartbeat();
});

window.addEventListener("pagehide", () => {
  stopPresence();
});

window.CoursePresence = {
  sendHeartbeat,
  startPresence,
  stopPresence,
};

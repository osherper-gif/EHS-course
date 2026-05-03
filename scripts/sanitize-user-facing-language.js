const fs = require("fs");
const vm = require("vm");

const replacements = [
  [/EmailJS\s*\/\s*Firebase Function\s*\/\s*SendGrid/gi, "שירות דיוור מאושר"],
  [/EmailJS/gi, "שירות דיוור"],
  [/Cloud Functions?/gi, "שירות אוטומטי מאושר"],
  [/Firebase Authentication/gi, "מערכת התחברות"],
  [/Firebase Hosting/gi, "פרסום האתר"],
  [/Firebase Function/gi, "שירות אוטומטי מאושר"],
  [/Firestore/gi, "מערכת הנתונים"],
  [/Firebase/gi, "מערכת האתר"],
  [/\bAuth\b/gi, "התחברות"],
  [/\bHosting\b/gi, "פרסום האתר"],
  [/\bEmail\/Password\b/gi, "אימייל וסיסמה"],
  [/\bPhone Auth\b/gi, "אימות טלפון"],
  [/\blocalStorage\b/g, "שמירה במכשיר"],
  [/\bsessionStorage\b/g, "שמירה זמנית במכשיר"],
  [/\bBackend\b/gi, "שרת פרטי"],
  [/\bFrontend\b/gi, "ממשק המשתמש"],
  [/\bAPI\b/g, "שירות חיצוני"],
  [/\bDatabase\b/gi, "מאגר מידע"],
  [/\bHTML\b/g, "קובצי אתר"],
  [/\bCSS\b/g, "עיצוב האתר"],
  [/\bJavaScript\b/g, "קוד האתר"],
  [/\bJS\b/g, "קוד האתר"],
  [/\bJSON\b/g, "קובץ נתונים"],
  [/\bGitHub\b/gi, "ניהול גרסאות"],
  [/\bGit\b/gi, "ניהול גרסאות"],
  [/\bCommit message\b/gi, "כותרת עדכון"],
  [/\bCommit\b/gi, "מזהה עדכון"],
  [/\bcommit\b/gi, "עדכון"],
  [/\bdeploy\b/gi, "פרסום"],
  [/\bDeploy\b/g, "פרסום"],
  [/\bserver\b/gi, "מערכת"],
  [/\bendpoint\b/gi, "נקודת גישה"],
  [/\bbuild\b/gi, "הכנה לפרסום"],
  [/\bdebug\b/gi, "בדיקה"],
  [/\bconsole\b/gi, "יומן פנימי"],
  [/\bUI\/UX\b/g, "חוויית שימוש"],
  [/\bUI\b/g, "חוויית שימוש"],
  [/\bUX\b/g, "חוויית שימוש"],
  [/\bMVP\b/g, "גרסה ראשונה"],
  [/\bLogin\b/gi, "כניסה"],
];

function sanitizeText(value) {
  let next = String(value);
  replacements.forEach(([pattern, replacement]) => {
    next = next.replace(pattern, replacement);
  });
  return next;
}

function sanitizeObject(value) {
  if (Array.isArray(value)) return value.map(sanitizeObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeObject(item)]));
  }
  if (typeof value === "string") return sanitizeText(value);
  return value;
}

function loadWindowFile(file, globalName) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx);
  return ctx.window[globalName] || [];
}

const versions = sanitizeObject(loadWindowFile("data/site-versions.js", "SITE_VERSIONS"));
if (!versions.some((version) => version.versionId === "user-friendly-language-cleanup")) {
  versions.unshift({
    versionId: "user-friendly-language-cleanup",
    versionNumber: "ניקוי שפה למשתמשים",
    date: "2026-05-03",
    time: "לא צוין",
    commitHash: "",
    commitMessage: "ניקוי מושגים טכניים מטקסטים שמוצגים למשתמשים",
    createdBy: "Osher Perets",
    addedRequirements: "התאמת השפה באתר למשתמשי קצה מתחום הבטיחות.",
    siteChanges: "הוסרו או רוככו מושגים טכניים ממסכי משתמש, דפי מדיניות וניהול גרסאות.",
    fixedBugs: "הופחת בלבול שנוצר מטקסטים טכניים שאינם רלוונטיים ללומדים ולממונה בטיחות.",
    uiUxChanges: "שופרה בהירות ההודעות והכותרות למשתמשים.",
    securityChanges: "ללא שינוי בהרשאות או במנגנוני ההתחברות.",
    contentChanges: "עודכנו ניסוחים בלבד, ללא שינוי בתוכן הלימודי.",
    firebaseChanges: "ללא שינוי במנגנוני המערכת.",
    releaseNotes: "האתר מציג כעת שפה מקצועית יותר בתחום הבטיחות ופחות מונחים טכנולוגיים.",
    status: "published",
    emailStatus: "notSent",
  });
}

const sanitizedVersions = sanitizeObject(versions);
fs.writeFileSync("data/site-versions.js", `window.SITE_VERSIONS = ${JSON.stringify(sanitizedVersions, null, 2)};\n`, "utf8");

const searchIndex = sanitizeObject(loadWindowFile("data/search-index.js", "SITE_SEARCH_INDEX"));
fs.writeFileSync("data/search-index.js", `window.SITE_SEARCH_INDEX = ${JSON.stringify(searchIndex, null, 2)};\n`, "utf8");

console.log(`sanitized ${versions.length} versions and ${searchIndex.length} search records`);

const fs = require("fs");

const login = fs.readFileSync("login.html", "utf8");
const entry = fs.readFileSync("js/login-auth.js", "utf8");
const initial = `${login}\n${entry}`;
const forbidden = [
  "firebase-app.js",
  "firebase-auth.js",
  "firebase-firestore.js",
  "firebase-app-check.js",
  "./js/auth.js",
  "styles.css",
  "accessibility.js",
  "m-mobile.js",
  "m-lessons.js",
  "presence.js",
  "feedback.js",
  "email-notifications.js",
  "search.js",
];

const hits = forbidden.filter((item) => initial.includes(item));
console.log(`Initial login forbidden refs: ${hits.length}`);
if (hits.length) {
  hits.forEach((item) => console.log(`- ${item}`));
  process.exitCode = 1;
}
console.log(`Dynamic login config import: ${entry.includes("firebase-login-config.js")}`);

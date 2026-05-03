const fs = require("fs");

const login = fs.readFileSync("login.html", "utf8");
const entry = fs.readFileSync("js/login-auth.js", "utf8");
const initial = `${login}\n${entry}`;
const forbidden = [
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
const loginConfig = fs.readFileSync("js/firebase-login-config.js", "utf8");
const hasBasicAuthOnly = loginConfig.includes("firebase-app.js")
  && loginConfig.includes("firebase-auth.js")
  && !loginConfig.includes("firebase-firestore.js")
  && !loginConfig.includes("firebase-app-check.js");
console.log(`Login uses basic auth modules only: ${hasBasicAuthOnly}`);
if (!hasBasicAuthOnly) process.exitCode = 1;

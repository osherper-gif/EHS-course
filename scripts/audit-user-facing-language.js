const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const technicalTerms = [
  /\bFirebase\b/i,
  /\bFirestore\b/i,
  /\bHosting\b/i,
  /\bHTML\b/,
  /\bCSS\b/,
  /\bJavaScript\b/,
  /\bJS\b/,
  /\bJSON\b/,
  /\bAPI\b/,
  /\bDatabase\b/i,
  /\bbackend\b/i,
  /\bfrontend\b/i,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bdeploy\b/i,
  /\bserver\b/i,
  /\bendpoint\b/i,
  /\bGitHub\b/i,
  /\bGit\b/i,
  /\bbuild\b/i,
  /\bdebug\b/i,
  /\bEmailJS\b/i,
  /\bSendGrid\b/i,
  /\bCloud Functions?\b/i,
  /\bUI\/UX\b/,
  /\bUI\b/,
  /\bUX\b/,
];

const issues = [];

function checkText(source, text) {
  const clean = String(text || "");
  technicalTerms.forEach((term) => {
    if (term.test(clean)) issues.push(`${source}: ${clean.slice(0, 180)}`);
  });
}

function stripHtml(html) {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

["index.html", "admin.html", "login.html"].forEach((file) => {
  checkText(file, stripHtml(fs.readFileSync(path.join(root, file), "utf8")));
});

walk(path.join(root, "pages"), (file) => {
  if (file.endsWith(".html")) checkText(path.relative(root, file), stripHtml(fs.readFileSync(file, "utf8")));
});

function loadWindow(file, name) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), ctx);
  return ctx.window[name];
}

const versions = loadWindow("data/site-versions.js", "SITE_VERSIONS") || [];
const displayedVersionFields = [
  "versionNumber",
  "addedRequirements",
  "siteChanges",
  "fixedBugs",
  "uiUxChanges",
  "securityChanges",
  "contentChanges",
  "firebaseChanges",
  "releaseNotes",
];
versions.forEach((version, index) => {
  displayedVersionFields.forEach((field) => checkText(`data/site-versions.js[${index}].${field}`, version[field]));
});

const searchIndex = loadWindow("data/search-index.js", "SITE_SEARCH_INDEX") || [];
searchIndex.forEach((item, index) => {
  ["title", "snippet", "text"].forEach((field) => checkText(`data/search-index.js[${index}].${field}`, item[field]));
  (item.tags || []).forEach((tag) => checkText(`data/search-index.js[${index}].tags`, tag));
});

console.log(`User-facing technical language issues: ${issues.length}`);
issues.slice(0, 80).forEach((issue) => console.log(`- ${issue}`));
if (issues.length) process.exitCode = 1;

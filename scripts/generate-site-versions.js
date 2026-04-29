const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "data", "site-versions.js");

function escape(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

const log = execFileSync("git", [
  "log",
  "--date=iso-strict",
  "--pretty=format:%h%x09%ad%x09%an%x09%s",
], { cwd: root, encoding: "utf8" });

const versions = log.split(/\r?\n/).filter(Boolean).map((line) => {
  const [hash, dateTime, author, ...messageParts] = line.split("\t");
  const date = dateTime.slice(0, 10);
  const time = dateTime.slice(11, 16) || "לא צוין";
  const commitMessage = messageParts.join("\t");
  return {
    versionId: "commit-" + hash,
    versionNumber: hash,
    date,
    time,
    releaseDate: date,
    releaseTime: time,
    commitHash: hash,
    commitMessage,
    createdBy: author,
    addedRequirements: "נוצר אוטומטית מ-git log. יש להשלים פירוט ידני לפי הצורך.",
    siteChanges: commitMessage,
    fixedBugs: "",
    uiUxChanges: "",
    securityChanges: "",
    contentChanges: "",
    firebaseChanges: "",
    releaseNotes: "נוצר באמצעות scripts/generate-site-versions.js",
    status: "published",
    emailStatus: "notSent",
  };
});

const content = `window.SITE_VERSIONS = ${JSON.stringify(versions, null, 2)};\n`;
fs.writeFileSync(output, content, "utf8");
console.log(`Wrote ${versions.length} versions to ${output}`);

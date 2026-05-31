const fs = require("fs");
const path = require("path");
const { buildManifest, manifestPath } = require("./content-pipeline-core");

const manifest = buildManifest();
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

const byType = manifest.items.reduce((acc, item) => {
  acc[item.contentType] = (acc[item.contentType] || 0) + 1;
  return acc;
}, {});
const confidence = manifest.items.reduce((acc, item) => {
  const key = item.questionDetectionConfidence || "none";
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

console.log("[content:scan] PASS");
console.log(`Manifest: ${manifestPath}`);
console.log(`Source files: ${manifest.items.length}`);
console.log(`Prep: ${byType.prep || 0}`);
console.log(`Summary: ${byType.summary || 0}`);
console.log(`Other: ${byType.other || 0}`);
console.log(`Question detection confidence: high=${confidence.high || 0}, medium=${confidence.medium || 0}, low=${confidence.low || 0}`);
console.log("Dry run: true; no HTML, datasets, Auth, Firestore, or production assets were changed.");

"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SOURCE_ROOT = "C:\\Users\\Administrator\\Desktop\\קורס ממונה בטיחות\\חומר שהתקבל מבאר הדרכות\\WORD\\ALL_WORDS_FOR_WEBSITE";
const REGISTRY_PATH = path.join(__dirname, "..", "content", "source-registry.json");
const JSON_MODE = process.argv.includes("--json");
const MATCH_REGISTRY_MODE = process.argv.includes("--match-registry");

function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    if (isTempFile(entry.name)) return [];
    if (entry.isFile()) return [fullPath];
    return [];
  });
}

function isTempFile(fileName) {
  const normalized = fileName.toLowerCase();
  return (
    normalized.startsWith("~$") ||
    normalized.endsWith(".tmp") ||
    normalized.endsWith(".temp") ||
    normalized.endsWith(".lock")
  );
}

function classifySource(fileName) {
  const normalized = fileName.toLowerCase();

  if (/(פקודת|פקודה|חוק)/u.test(normalized)) {
    return { sourceType: "primary-legislation", authorityLevel: 1 };
  }

  if (/(תקנות|תקנה|צו|צווים)/u.test(normalized)) {
    return { sourceType: "secondary-legislation", authorityLevel: 2 };
  }

  if (/(מפע"ר|מפע״ר|רגולטור|משרד העבודה|כבאות|הנחיות|הוראות)/u.test(normalized)) {
    return { sourceType: "regulator-guidance", authorityLevel: 3 };
  }

  if (/(iso|תקן|תקנים)/u.test(normalized)) {
    return { sourceType: "standard", authorityLevel: 4 };
  }

  if (/(נוהל|נהלי|הוראת עבודה)/u.test(normalized)) {
    return { sourceType: "procedure", authorityLevel: 5 };
  }

  if (/(סיכום|תקציר|הרצאה|מצגת|הכנה|חומר הדרכה|העלאה לאתר)/u.test(normalized)) {
    return { sourceType: "training-material", authorityLevel: 6 };
  }

  if (/(טיפ|הערת מרצה|פרשנות|דגש מבחן|מוכנות למבחני|מבחן)/u.test(normalized)) {
    return { sourceType: "interpretation-or-exam-note", authorityLevel: 7 };
  }

  return { sourceType: "unknown", authorityLevel: 7 };
}

function toSourceRecord(filePath, index) {
  const fileName = path.basename(filePath);
  const extension = path.extname(fileName).replace(/^\./, "").toLowerCase();
  const stat = fs.statSync(filePath);
  const hash = sha256(filePath);
  const classification = classifySource(fileName);

  return {
    sourceId: `source-${String(index + 1).padStart(3, "0")}-${hash.slice(0, 12)}`,
    fileName,
    fullPath: filePath,
    extension,
    sha256: hash,
    modifiedAt: stat.mtime.toISOString(),
    sourceType: classification.sourceType,
    authorityLevel: classification.authorityLevel,
    verification: {
      status: "unverified"
    }
  };
}

function printText(records) {
  console.log("Source Registry Scan");
  console.log("====================");
  console.log(`Root: ${SOURCE_ROOT}`);
  console.log(`Sources scanned: ${records.length}`);
  console.log("");

  records.forEach((item) => {
    console.log(`- ${item.sourceId}`);
    console.log(`  fileName: ${item.fileName}`);
    console.log(`  fullPath: ${item.fullPath}`);
    console.log(`  extension: ${item.extension}`);
    console.log(`  sha256: ${item.sha256}`);
    console.log(`  modifiedAt: ${item.modifiedAt}`);
    console.log(`  sourceType: ${item.sourceType}`);
    console.log(`  authorityLevel: ${item.authorityLevel}`);
    console.log(`  verification.status: ${item.verification.status}`);
    console.log("");
  });
}

function readRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`Source registry not found: ${REGISTRY_PATH}`);
    process.exitCode = 1;
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    const entries = Array.isArray(parsed) ? parsed : parsed.entries;
    if (!Array.isArray(entries)) {
      console.error("Source registry must be an array or an object with an entries array.");
      process.exitCode = 1;
      return null;
    }
    return entries;
  } catch (error) {
    console.error(`Failed to read source registry: ${error.message}`);
    process.exitCode = 1;
    return null;
  }
}

function matchRegistry(records) {
  const registryEntries = readRegistry();
  if (!registryEntries) return;

  const recordsByHash = new Map(records.map((record) => [record.sha256, record]));
  const recordsByFileName = new Map(records.map((record) => [record.fileName, record]));
  const matched = [];
  const matchedRecordIds = new Set();
  const registryNotFound = [];
  const changedHashWarnings = [];

  registryEntries.forEach((entry) => {
    const aliases = entry.aliases || {};
    const hashCandidates = [entry.file && entry.file.sha256, ...(aliases.hashes || [])].filter(Boolean);
    const fileNameCandidates = [entry.file && entry.file.currentFileName, ...(aliases.fileNames || [])].filter(Boolean);

    const hashMatch = hashCandidates.map((hash) => recordsByHash.get(hash)).find(Boolean);
    const fileNameMatch = fileNameCandidates.map((fileName) => recordsByFileName.get(fileName)).find(Boolean);
    const record = hashMatch || fileNameMatch;

    if (!record) {
      registryNotFound.push(entry);
      return;
    }

    matched.push({
      stableSourceId: entry.stableSourceId,
      scannerId: record.sourceId,
      fileName: record.fileName,
      matchedBy: hashMatch ? "hash" : "fileName"
    });
    matchedRecordIds.add(record.sourceId);

    if (!hashMatch && entry.file && entry.file.sha256 && entry.file.sha256 !== record.sha256) {
      changedHashWarnings.push({
        stableSourceId: entry.stableSourceId,
        fileName: record.fileName,
        registryHash: entry.file.sha256,
        scannedHash: record.sha256
      });
    }
  });

  const unmatchedScannedFiles = records.filter((record) => !matchedRecordIds.has(record.sourceId));

  console.log("Source Registry Match");
  console.log("=====================");
  console.log(`Registry entries: ${registryEntries.length}`);
  console.log(`Scanned sources: ${records.length}`);
  console.log("");

  console.log(`Matched sources: ${matched.length}`);
  matched.forEach((item) => {
    console.log(`- ${item.stableSourceId}`);
    console.log(`  scannerId: ${item.scannerId}`);
    console.log(`  fileName: ${item.fileName}`);
    console.log(`  matchedBy: ${item.matchedBy}`);
  });
  console.log("");

  console.log(`Unmatched scanned files: ${unmatchedScannedFiles.length}`);
  unmatchedScannedFiles.forEach((item) => {
    console.log(`- ${item.sourceId} | ${item.fileName}`);
  });
  console.log("");

  console.log(`Registry entries not found in scan: ${registryNotFound.length}`);
  registryNotFound.forEach((item) => {
    const fileName = item.file && item.file.currentFileName ? item.file.currentFileName : "(missing fileName)";
    console.log(`- ${item.stableSourceId || "(missing stableSourceId)"} | ${fileName}`);
  });
  console.log("");

  console.log(`Changed hash warnings: ${changedHashWarnings.length}`);
  changedHashWarnings.forEach((item) => {
    console.log(`- WARNING ${item.stableSourceId} | ${item.fileName}`);
    console.log(`  registryHash: ${item.registryHash}`);
    console.log(`  scannedHash: ${item.scannedHash}`);
  });
}

function main() {
  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(`Source directory not found: ${SOURCE_ROOT}`);
    process.exitCode = 1;
    return;
  }

  const records = listFiles(SOURCE_ROOT)
    .sort((a, b) => a.localeCompare(b, "he"))
    .map(toSourceRecord);

  if (JSON_MODE) {
    console.log(JSON.stringify({
      generatedAt: new Date().toISOString(),
      root: SOURCE_ROOT,
      count: records.length,
      records
    }, null, 2));
    return;
  }

  if (MATCH_REGISTRY_MODE) {
    matchRegistry(records);
    return;
  }

  printText(records);
}

main();

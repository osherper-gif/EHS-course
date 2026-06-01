"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SOURCE_ROOT = "C:\\Users\\Administrator\\Desktop\\קורס ממונה בטיחות\\חומר שהתקבל מבאר הדרכות\\WORD\\ALL_WORDS_FOR_WEBSITE";
const JSON_MODE = process.argv.includes("--json");

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

  printText(records);
}

main();

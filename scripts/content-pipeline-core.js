const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const zlib = require("zlib");

const repoRoot = path.resolve(__dirname, "..");
const defaultSourceDir = "C:\\Users\\Administrator\\Desktop\\קורס ממונה בטיחות\\הכנה וסיכומי הרצאות\\TO_WRBSITE";
const sourceDir = process.env.COURSE_CONTENT_SOURCE_DIR || defaultSourceDir;
const manifestPath = path.join(repoRoot, "content", "course-content-manifest.json");

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex").toUpperCase();
}

function parseSourceFileName(fileName) {
  const base = path.basename(fileName);
  const match = base.match(/^(\d{1,2})[.\s_-]*(הכנה|סיכום)/u);
  if (!match) {
    return { lessonNumber: null, contentType: "other", notes: ["file name is not lesson-scoped"] };
  }

  return {
    lessonNumber: Number(match[1]),
    contentType: match[2] === "הכנה" ? "prep" : "summary",
    notes: []
  };
}

function readZipEntries(buffer) {
  const entries = new Map();
  let offset = 0;
  while (offset + 30 < buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const fileName = buffer.slice(nameStart, nameStart + fileNameLength).toString("utf8");
    const compressed = buffer.slice(dataStart, dataStart + compressedSize);
    let data = null;

    try {
      if (compressionMethod === 0) data = compressed;
      if (compressionMethod === 8) data = zlib.inflateRawSync(compressed);
      if (data) entries.set(fileName, data);
    } catch (error) {
      entries.set(fileName, Buffer.from(""));
    }

    offset = dataStart + compressedSize;
  }
  return entries;
}

function decodeXmlText(xml) {
  return xml
    .replace(/<w:tab\/>/g, " ")
    .replace(/<\/w:tc>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractDocxText(filePath) {
  if (path.extname(filePath).toLowerCase() !== ".docx") return "";
  const entries = readZipEntries(fs.readFileSync(filePath));
  const documentXml = entries.get("word/document.xml");
  if (!documentXml) return "";
  return decodeXmlText(documentXml.toString("utf8"));
}

function detectQuestionCount(filePath) {
  const text = extractDocxText(filePath);
  if (!text) {
    return {
      count: 0,
      confidence: "low",
      uniqueNumbers: 0,
      firstNumber: null,
      lastNumber: null,
      answerMarkers: 0,
      sectionMarkers: 0,
      notes: ["no extractable docx text"]
    };
  }

  const questionSectionPattern = /(שאלות אמריקאיות|מבחן הכנה|שאלות מבחן|רמה קלה|רמה בינונית|רמה קשה)/u;
  const answerPattern = /(תשובה\s*:|תשובה נכונה\s*:|תשובה נכונה היא|·\s*תשובה נכונה\s*:)/u;
  const optionPattern = /^[א-ד]\s*[).:-]/u;
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const questionMarkers = [];
  let sectionMarkers = 0;
  let answerMarkers = 0;
  let inQuestionSection = false;

  lines.forEach((line, index) => {
    if (questionSectionPattern.test(line)) {
      sectionMarkers += 1;
      inQuestionSection = true;
    }
    if (answerPattern.test(line)) answerMarkers += 1;

    const named = line.match(/^(?:[•·\-\u2013\u2014]\s*)?(?:שאלת מבחן|שאלה)\s*(\d{1,3})(?=\D|$)/u);
    if (named) {
      questionMarkers.push({ number: Number(named[1]), index, source: "named" });
      return;
    }

    const numbered = line.match(/^(?:[•·\-\u2013\u2014]\s*)?(\d{1,3})\s*[.)]\s+(.+)/u);
    if (numbered && !optionPattern.test(line)) {
      const number = Number(numbered[1]);
      const windowText = lines.slice(index, index + 5).join(" ");
      const looksLikeQuestion =
        windowText.includes("?") ||
        answerPattern.test(windowText) ||
        (inQuestionSection && numbered[2].length > 8);
      if (number > 0 && number < 300 && looksLikeQuestion) {
        questionMarkers.push({ number, index, source: "numbered" });
      }
    }
  });

  const sourceCounts = questionMarkers.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {});
  const uniqueNumbers = new Set(questionMarkers.map((item) => item.number));
  const sortedNumbers = [...uniqueNumbers].sort((a, b) => a - b);
  const rawMarkerCount = questionMarkers.length;
  const namedCount = sourceCounts.named || 0;
  let count = namedCount >= 20 ? namedCount : answerMarkers >= 20 ? answerMarkers : rawMarkerCount;
  if (namedCount >= 20 && answerMarkers >= namedCount + 10 && sortedNumbers[sortedNumbers.length - 1] >= answerMarkers) {
    count = answerMarkers;
  }
  const answerRatio = count ? answerMarkers / count : 0;
  let confidence = "low";
  if (count >= 20 && (answerRatio >= 0.45 || sectionMarkers > 0)) confidence = "high";
  else if (count >= 10 || answerMarkers >= 10) confidence = "medium";

  const notes = [];
  if (count === 0) notes.push("no question markers detected");
  if (namedCount >= 20 && answerMarkers >= namedCount + 10) notes.push("named question markers are incomplete; answer markers used for count");
  if (confidence !== "high") notes.push("question detection needs manual review");
  if (uniqueNumbers.size && uniqueNumbers.size !== count) notes.push("duplicate question numbers or repeated banks detected");
  if (rawMarkerCount !== count) notes.push(`raw marker count ${rawMarkerCount} adjusted to ${count}`);

  return {
    count,
    confidence,
    rawMarkerCount,
    namedQuestionMarkers: namedCount,
    numberedQuestionMarkers: sourceCounts.numbered || 0,
    uniqueNumbers: uniqueNumbers.size,
    firstNumber: sortedNumbers[0] || null,
    lastNumber: sortedNumbers[sortedNumbers.length - 1] || null,
    answerMarkers,
    sectionMarkers,
    notes
  };
}

function listSourceFiles() {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }

  const results = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (entry.isFile()) results.push(fullPath);
    }
  };
  walk(sourceDir);
  return results.sort((a, b) => a.localeCompare(b, "he"));
}

function getExistingSitePage(lessonNumber, contentType) {
  const padded = String(lessonNumber).padStart(2, "0");
  if (contentType === "summary") {
    const href = `pages/summaries/lesson-${padded}-summary.html`;
    return fs.existsSync(path.join(repoRoot, href)) ? href : "";
  }

  if (contentType === "prep") {
    const prepDir = path.join(repoRoot, "pages", "prep");
    const match = fs.existsSync(prepDir)
      ? fs.readdirSync(prepDir).find((file) => file.startsWith(`lesson-${padded}-`) && file.endsWith(".html"))
      : "";
    return match ? `pages/prep/${match}` : "";
  }

  return "";
}

function buildManifest() {
  const items = listSourceFiles().map((filePath) => {
    const stat = fs.statSync(filePath);
    const parsed = parseSourceFileName(path.basename(filePath));
    const extension = path.extname(filePath).toLowerCase();
    const existingSitePage = parsed.lessonNumber
      ? getExistingSitePage(parsed.lessonNumber, parsed.contentType)
      : "";
    const notes = [...parsed.notes];
    if (extension !== ".docx" && extension !== ".pdf") notes.push("non-docx/pdf source file");
    if (!existingSitePage && parsed.contentType !== "other") notes.push("no matching site page found");

    const questionDetection = extension === ".docx" ? detectQuestionCount(filePath) : {
      count: 0,
      confidence: "low",
      uniqueNumbers: 0,
      firstNumber: null,
      lastNumber: null,
      answerMarkers: 0,
      sectionMarkers: 0,
      notes: ["question detection only runs on docx sources"]
    };
    questionDetection.notes.forEach((note) => notes.push(note));

    return {
      lessonNumber: parsed.lessonNumber,
      contentType: parsed.contentType,
      sourceFile: path.basename(filePath),
      sourcePath: filePath,
      extension,
      hash: sha256(filePath),
      modifiedAt: stat.mtime.toISOString(),
      status: parsed.lessonNumber ? "scanned" : "unassigned",
      existingSitePage,
      questionCountDetected: questionDetection.count,
      questionDetectionConfidence: questionDetection.confidence,
      questionDetection,
      notes
    };
  });

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    dryRun: true,
    sourceDir,
    courseId: "safety-officer",
    domainId: "safety",
    items
  };
}

function loadBrowserGlobal(filePath, globalName) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), sandbox, { filename: filePath });
  return sandbox.window[globalName];
}

function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found. Run npm run content:scan first: ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function getSiteState() {
  const prepDir = path.join(repoRoot, "pages", "prep");
  const summariesDir = path.join(repoRoot, "pages", "summaries");
  const prepPages = fs.existsSync(prepDir)
    ? fs.readdirSync(prepDir).filter((file) => /^lesson-\d{2}-.*\.html$/.test(file)).sort()
    : [];
  const summaryPages = fs.existsSync(summariesDir)
    ? fs.readdirSync(summariesDir).filter((file) => /^lesson-\d{2}-summary\.html$/.test(file)).sort()
    : [];
  const ingestion = loadBrowserGlobal(path.join(repoRoot, "data", "content-ingestion-map.js"), "CourseContentIngestionMap");
  const learningPath = loadBrowserGlobal(path.join(repoRoot, "data", "learning-path-map.js"), "CourseLearningPathMap");
  const prepQuestions = loadBrowserGlobal(path.join(repoRoot, "data", "prep-questions-map.js"), "CoursePrepQuestionSets");
  const summaryQuestions = loadBrowserGlobal(path.join(repoRoot, "data", "summary-questions-map.js"), "CourseSummaryQuestionSets");

  return { prepPages, summaryPages, ingestion, learningPath, prepQuestions, summaryQuestions };
}

function lessonKey(lessonNumber) {
  return `lesson-${String(lessonNumber).padStart(2, "0")}`;
}

module.exports = {
  repoRoot,
  sourceDir,
  manifestPath,
  buildManifest,
  getSiteState,
  lessonKey,
  loadManifest,
  toPosix
};

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const targetFiles = [
  "pages/lesson-01.html",
  "pages/lesson-02.html",
  "pages/labor-inspection-law-1954.html",
  "pages/work-safety-ordinance-1970.html",
  "pages/iso-45001-2018.html",
  "pages/field-tools.html",
  "pages/laws.html",
  "pages/standards.html",
  "pages/quizzes.html",
  "pages/exam-questions.html",
  "pages/safety-game.html",
  "data/search-index.js",
  "data/exam-questions.js",
  "data/game-data.js",
].filter((file) => fs.existsSync(path.join(root, file)));

const allowedShortPatterns = [
  /חוק ארגון הפיקוח על העבודה/,
  /פקודת הבטיחות בעבודה/,
  /ISO 45001/,
  /שאלות למבחן/,
  /אתגר בטיחות/,
  /חזרה לכלי שטח/,
];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function normalize(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[׳״]/g, "")
    .trim();
}

function hash(text) {
  return crypto.createHash("sha1").update(text).digest("hex").slice(0, 12);
}

function extractBlocks(file, content) {
  const blocks = [];
  if (file.endsWith(".html")) {
    const paragraphRegex = /<(p|li|td|th|blockquote|figcaption|h[1-4])\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    while ((match = paragraphRegex.exec(content))) {
      const text = normalize(stripHtml(match[2]));
      if (text.length >= 120) blocks.push({ file, type: match[1].toLowerCase(), text });
    }
    const tableRegex = /<table\b[\s\S]*?<\/table>/gi;
    while ((match = tableRegex.exec(content))) {
      const text = normalize(stripHtml(match[0]));
      if (text.length >= 220) blocks.push({ file, type: "table", text });
    }
    return blocks;
  }

  const stringRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g;
  let match;
  while ((match = stringRegex.exec(content))) {
    const raw = (match[1] || match[2] || "").replace(/\\n/g, " ").replace(/\\"/g, '"');
    const text = normalize(raw);
    if (text.length >= 120) blocks.push({ file, type: "string", text });
  }
  return blocks;
}

function classifyDuplicate(items, text) {
  const files = Array.from(new Set(items.map((item) => item.file)));
  const inQuestionData = files.some((file) => /data[\\/](exam-questions|game-data)\.js$/.test(file));
  const inHtml = files.some((file) => file.endsWith(".html"));
  const shortAllowed = text.length < 260 && allowedShortPatterns.some((pattern) => pattern.test(text));
  if (shortAllowed) return "allowed-short-reference";
  if (/כל הזכויות במבנה האתר/.test(text)) return "allowed-sitewide-footer";
  if (files.some((file) => /data[\\/]search-index\.js$/.test(file)) && text.length < 260) return "allowed-concise-search-index";
  if (inQuestionData && !inHtml) return "allowed-question-bank-reuse";
  if (inQuestionData && inHtml) return "review-question-visible-in-html";
  if (files.length > 1 && text.length >= 260) return "review-long-duplicate";
  return "review";
}

const byHash = new Map();
for (const file of targetFiles) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  for (const block of extractBlocks(file, content)) {
    const key = hash(block.text);
    const list = byHash.get(key) || [];
    list.push(block);
    byHash.set(key, list);
  }
}

const duplicates = Array.from(byHash.entries())
  .map(([key, items]) => ({ key, items, text: items[0]?.text || "" }))
  .filter((entry) => new Set(entry.items.map((item) => item.file)).size > 1)
  .map((entry) => ({
    hash: entry.key,
    classification: classifyDuplicate(entry.items, entry.text),
    length: entry.text.length,
    sample: entry.text.slice(0, 280),
    occurrences: entry.items.map((item) => ({ file: item.file, type: item.type })),
  }))
  .sort((a, b) => {
    const rank = (value) => value.startsWith("review") ? 0 : 1;
    return rank(a.classification) - rank(b.classification) || b.length - a.length;
  });

const report = {
  generatedAt: new Date().toISOString(),
  filesScanned: targetFiles,
  duplicates,
  summary: duplicates.reduce((acc, item) => {
    acc[item.classification] = (acc[item.classification] || 0) + 1;
    return acc;
  }, {}),
};

const outDir = path.join(root, "docs");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "duplicate-content-scan.json"), JSON.stringify(report, null, 2), "utf8");

const blocking = duplicates.filter((item) => item.classification.startsWith("review"));
console.log(`Duplicate content scan: ${duplicates.length} duplicate groups, ${blocking.length} require review.`);
console.log(`Report: docs/duplicate-content-scan.json`);
if (blocking.length) {
  blocking.slice(0, 20).forEach((item) => {
    console.log(`- ${item.classification} ${item.hash} ${item.length} chars`);
    console.log(`  files: ${Array.from(new Set(item.occurrences.map((occ) => occ.file))).join(", ")}`);
    console.log(`  sample: ${item.sample}`);
  });
}

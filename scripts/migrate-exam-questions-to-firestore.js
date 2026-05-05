#!/usr/bin/env node
"use strict";

const fs = require("fs");
const https = require("https");
const path = require("path");
const vm = require("vm");

const PROJECT_ALIASES = {
  staging: "ehs-course-staging",
};

function parseArgs(argv) {
  const args = {
    project: "staging",
    write: false,
    overwrite: false,
    source: path.join(__dirname, "..", "data", "exam-questions.js"),
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--write") args.write = true;
    else if (arg === "--overwrite") args.overwrite = true;
    else if (arg === "--project") args.project = argv[++index] || args.project;
    else if (arg === "--source") args.source = path.resolve(argv[++index] || args.source);
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error("Unknown argument: " + arg);
    }
  }

  args.projectId = PROJECT_ALIASES[args.project] || args.project;
  if (args.projectId !== "ehs-course-staging") {
    throw new Error("Refusing to run outside staging. Use --project staging.");
  }
  return args;
}

function printHelp() {
  console.log(`
Migrate exam questions to Firestore staging.

Dry run:
  node scripts/migrate-exam-questions-to-firestore.js

Write to staging:
  node scripts/migrate-exam-questions-to-firestore.js --write --project staging

Options:
  --write       Upload to Firestore. Without this flag the script only prints a summary.
  --overwrite   Replace existing question docs. Default: skip existing docs.
  --project     Must resolve to ehs-course-staging. Default: staging.
  --source      Path to data/exam-questions.js.
`);
}

function loadQuestions(sourcePath) {
  const code = fs.readFileSync(sourcePath, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: sourcePath });

  const questions = sandbox.window.EXAM_QUESTIONS;
  if (!Array.isArray(questions)) {
    throw new Error("window.EXAM_QUESTIONS was not found or is not an array.");
  }
  return questions;
}

function sanitizeId(value) {
  return String(value || "")
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeQuestion(raw, index) {
  const relatedLessonId = sanitizeId(raw.relatedLessonId || raw.lessonId || "general");
  const id = sanitizeId(raw.id || relatedLessonId + "-q-" + String(index + 1).padStart(3, "0"));
  const options = Array.isArray(raw.options) ? raw.options.map((option) => String(option || "").trim()) : [];
  const correctAnswer = String(raw.correctAnswer || "").trim();
  const correctIndex = options.findIndex((option) => option === correctAnswer);

  if (!relatedLessonId) throw new Error("Question is missing relatedLessonId: index " + index);
  if (!id) throw new Error("Question is missing id: index " + index);
  if (!raw.question) throw new Error("Question is missing question text: " + id);
  if (options.length < 4) throw new Error("Question has fewer than 4 options: " + id);
  if (correctIndex < 0) throw new Error("Question correctAnswer does not match any option: " + id);

  return {
    id,
    lessonId: relatedLessonId,
    relatedLessonId,
    topic: String(raw.topic || "").trim(),
    question: String(raw.question || "").trim(),
    options,
    correctAnswer,
    correctIndex,
    explanation: String(raw.explanation || "").trim(),
    difficulty: String(raw.difficulty || "medium").trim(),
    sourceNote: String(raw.sourceNote || "").trim(),
    qualityStatus: String(raw.qualityStatus || "approved").trim(),
  };
}

function groupQuestions(questions) {
  const grouped = new Map();
  const seen = new Set();
  const duplicates = [];
  const normalized = [];

  questions.forEach((question, index) => {
    const item = normalizeQuestion(question, index);
    const key = item.relatedLessonId + "/" + item.id;
    if (seen.has(key)) {
      duplicates.push(key);
      return;
    }
    seen.add(key);
    normalized.push(item);
    if (!grouped.has(item.relatedLessonId)) grouped.set(item.relatedLessonId, []);
    grouped.get(item.relatedLessonId).push(item);
  });

  return { grouped, normalized, duplicates };
}

function printSummary({ grouped, normalized, duplicates, written = 0, skipped = 0, mode }) {
  console.log("Exam questions migration summary");
  console.log("--------------------------------");
  console.log("Mode:", mode);
  console.log("Lessons:", grouped.size);
  console.log("Questions detected:", normalized.length);
  console.log("Duplicate local docs skipped:", duplicates.length);
  console.log("Written:", written);
  console.log("Skipped existing:", skipped);
  console.log("");
  for (const [lessonId, items] of grouped.entries()) {
    console.log(lessonId + ": " + items.length);
  }
}

function firestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((item) => firestoreValue(item)) } };
  }
  if (typeof value === "number") {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (typeof value === "boolean") return { booleanValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, nestedValue]) => [key, firestoreValue(nestedValue)])
        ),
      },
    };
  }
  return { stringValue: String(value) };
}

function firestoreFields(object) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, firestoreValue(value)]));
}

function firestoreDocName(projectId, ...segments) {
  return (
    "projects/" +
    projectId +
    "/databases/(default)/documents/" +
    segments.map((segment) => encodeURIComponent(segment)).join("/")
  );
}

function loadFirebaseCliAccessToken() {
  const candidates = [
    process.env.FIREBASE_TOKEN_CONFIG,
    process.env.APPDATA && path.join(process.env.APPDATA, "configstore", "firebase-tools.json"),
    process.env.USERPROFILE && path.join(process.env.USERPROFILE, ".config", "configstore", "firebase-tools.json"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const config = JSON.parse(fs.readFileSync(candidate, "utf8"));
    if (config.tokens && config.tokens.access_token) {
      return {
        accessToken: config.tokens.access_token,
        expiresAt: config.tokens.expires_at || 0,
        source: candidate,
      };
    }
  }

  throw new Error(
    "No Firebase CLI access token was found. Run firebase login, or install gcloud and run gcloud auth application-default login."
  );
}

function requestJson({ method = "POST", url, accessToken, body }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : "";
    const request = https.request(
      url,
      {
        method,
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (response) => {
        let responseBody = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          let parsed = null;
          if (responseBody) {
            try {
              parsed = JSON.parse(responseBody);
            } catch (error) {
              reject(new Error("Firestore REST returned non-JSON response: " + responseBody.slice(0, 300)));
              return;
            }
          }

          if (response.statusCode < 200 || response.statusCode >= 300) {
            const message =
              parsed && parsed.error
                ? parsed.error.status + ": " + parsed.error.message
                : "HTTP " + response.statusCode;
            reject(new Error("Firestore REST request failed: " + message));
            return;
          }
          resolve(parsed);
        });
      }
    );

    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

async function getExistingQuestionDocs({ docs, projectId, accessToken }) {
  const existing = new Set();
  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    projectId +
    "/databases/(default)/documents:batchGet";

  for (let index = 0; index < docs.length; index += 250) {
    const batch = docs.slice(index, index + 250);
    const response = await requestJson({
      url,
      accessToken,
      body: { documents: batch.map((doc) => doc.name) },
    });
    if (Array.isArray(response)) {
      response.forEach((item) => {
        if (item.found && item.found.name) existing.add(item.found.name);
      });
    }
  }

  return existing;
}

async function writeToFirestoreRest({ grouped, projectId, overwrite }) {
  const token = loadFirebaseCliAccessToken();
  if (token.expiresAt && token.expiresAt < Date.now()) {
    throw new Error("Firebase CLI access token is expired. Run firebase login:list or firebase projects:list, then retry.");
  }

  console.log("Using Firebase CLI user credentials for Firestore REST writes.");
  console.log("Credential source:", token.source);
  console.log("Target project:", projectId);

  const now = new Date().toISOString();
  const questionDocs = [];
  const lessonDocs = [];

  for (const [lessonId, items] of grouped.entries()) {
    lessonDocs.push({
      name: firestoreDocName(projectId, "examQuestionPools", lessonId),
      fields: firestoreFields({
        lessonId,
        questionsCount: items.length,
        migratedAt: now,
        migrationSource: "data/exam-questions.js",
      }),
    });

    items.forEach((item) => {
      questionDocs.push({
        name: firestoreDocName(projectId, "examQuestionPools", lessonId, "questions", item.id),
        fields: firestoreFields({
          ...item,
          migratedAt: now,
          migrationSource: "data/exam-questions.js",
        }),
      });
    });
  }

  let existing = new Set();
  if (!overwrite) {
    existing = await getExistingQuestionDocs({ docs: questionDocs, projectId, accessToken: token.accessToken });
  }

  const writes = [];
  let written = 0;
  let skipped = 0;

  lessonDocs.forEach((doc) => {
    writes.push({ update: doc });
  });

  questionDocs.forEach((doc) => {
    if (existing.has(doc.name)) {
      skipped += 1;
      return;
    }
    writes.push({ update: doc });
    written += 1;
  });

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    projectId +
    "/databases/(default)/documents:batchWrite";

  for (let index = 0; index < writes.length; index += 450) {
    await requestJson({
      url,
      accessToken: token.accessToken,
      body: { writes: writes.slice(index, index + 450) },
    });
  }

  return { written, skipped };
}

async function writeToFirestore({ grouped, projectId, overwrite }) {
  let admin;
  try {
    admin = require("firebase-admin");
  } catch (error) {
    throw new Error(
      "firebase-admin is not installed. Install it or run with existing dependencies before using --write."
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({ projectId });
  }

  const db = admin.firestore();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  let written = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchSize = 0;

  async function commitBatchIfNeeded(force = false) {
    if (batchSize === 0) return;
    if (!force && batchSize < 450) return;
    await batch.commit();
    batch = db.batch();
    batchSize = 0;
  }

  for (const [lessonId, items] of grouped.entries()) {
    for (const item of items) {
      const ref = db
        .collection("examQuestionPools")
        .doc(lessonId)
        .collection("questions")
        .doc(item.id);

      if (!overwrite) {
        const existing = await ref.get();
        if (existing.exists) {
          skipped += 1;
          continue;
        }
      }

      batch.set(ref, {
        ...item,
        migratedAt: timestamp,
        migrationSource: "data/exam-questions.js",
      });
      written += 1;
      batchSize += 1;
      await commitBatchIfNeeded(false);
    }
  }

  await commitBatchIfNeeded(true);
  return { written, skipped };
}

async function main() {
  const args = parseArgs(process.argv);
  const questions = loadQuestions(args.source);
  const groupedData = groupQuestions(questions);

  if (!args.write) {
    printSummary({ ...groupedData, mode: "dry-run" });
    console.log("");
    console.log("No Firestore writes were made. Add --write to upload to staging.");
    return;
  }

  let result;
  try {
    result = await writeToFirestore({
      grouped: groupedData.grouped,
      projectId: args.projectId,
      overwrite: args.overwrite,
    });
  } catch (error) {
    if (!/default credentials|Could not load the default credentials|Could not refresh access token/i.test(error.message)) {
      throw error;
    }
    console.log("Application Default Credentials are unavailable. Falling back to Firebase CLI credentials.");
    result = await writeToFirestoreRest({
      grouped: groupedData.grouped,
      projectId: args.projectId,
      overwrite: args.overwrite,
    });
  }
  printSummary({ ...groupedData, ...result, mode: "write:" + args.projectId });
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
});

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
    source: path.join(__dirname, "..", "data", "telegram-schedules.js"),
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
Migrate Telegram preview schedules to Firestore staging.

Dry run:
  node scripts/migrate-telegram-schedule-to-firestore.js

Write to staging:
  node scripts/migrate-telegram-schedule-to-firestore.js --write --project staging

Options:
  --write       Upload to Firestore. Without this flag the script only prints a summary.
  --overwrite   Replace existing docs. Default: skip existing lesson docs.
  --project     Must resolve to ehs-course-staging. Default: staging.
  --source      Path to data/telegram-schedules.js.
`);
}

function loadSchedules(sourcePath) {
  const code = fs.readFileSync(sourcePath, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: sourcePath });

  const schedules = sandbox.window.TELEGRAM_COURSE_SCHEDULES;
  if (!schedules || typeof schedules !== "object") {
    throw new Error("window.TELEGRAM_COURSE_SCHEDULES was not found.");
  }
  return schedules;
}

function normalizeCourse(courseId, rawCourse) {
  const lessons = Array.isArray(rawCourse.lessons) ? rawCourse.lessons : [];
  if (!courseId) throw new Error("Missing courseId.");
  if (lessons.length !== 58) {
    throw new Error("Expected 58 lessons, found " + lessons.length + " for " + courseId + ".");
  }

  const seen = new Set();
  const normalizedLessons = lessons.map((lesson) => {
    if (!lesson.id) throw new Error("Lesson is missing id: lessonNumber " + lesson.lessonNumber);
    if (seen.has(lesson.id)) throw new Error("Duplicate lesson id: " + lesson.id);
    seen.add(lesson.id);
    return {
      id: String(lesson.id),
      lessonNumber: Number(lesson.lessonNumber),
      date: String(lesson.date),
      dayName: String(lesson.dayName),
      time: String(lesson.time),
      topic: String(lesson.topic),
      needsReview: Boolean(lesson.needsReview),
      siteLessonId: lesson.siteLessonId ? String(lesson.siteLessonId) : null,
      sendPreparationDaysBefore: Number(lesson.sendPreparationDaysBefore || 1),
      sendReminderHoursBefore: Number(lesson.sendReminderHoursBefore || 3),
    };
  });

  return {
    course: {
      courseId: String(rawCourse.courseId || courseId),
      institutionName: String(rawCourse.institutionName || ""),
      courseName: String(rawCourse.courseName || ""),
      cohortName: String(rawCourse.cohortName || ""),
      channelStatus: String(rawCourse.channelStatus || "preview"),
      sourceNote: String(rawCourse.sourceNote || ""),
      lessonsCount: normalizedLessons.length,
      needsReviewCount: normalizedLessons.filter((lesson) => lesson.needsReview).length,
      linkedLessonsCount: normalizedLessons.filter((lesson) => lesson.siteLessonId).length,
      migrationSource: "data/telegram-schedules.js",
    },
    lessons: normalizedLessons,
  };
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
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, firestoreValue(nested)])),
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

  throw new Error("No Firebase CLI access token was found. Run firebase login.");
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

async function getExistingDocs({ docs, projectId, accessToken }) {
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

async function writeWithRest({ courses, projectId, overwrite }) {
  const token = loadFirebaseCliAccessToken();
  if (token.expiresAt && token.expiresAt < Date.now()) {
    throw new Error("Firebase CLI access token is expired. Run firebase login, then retry.");
  }

  console.log("Using Firebase CLI user credentials for Firestore REST writes.");
  console.log("Credential source:", token.source);
  console.log("Target project:", projectId);

  const now = new Date().toISOString();
  const docs = [];

  for (const [courseId, data] of Object.entries(courses)) {
    docs.push({
      name: firestoreDocName(projectId, "telegramCourseSchedules", courseId),
      fields: firestoreFields({ ...data.course, migratedAt: now }),
      kind: "course",
    });
    data.lessons.forEach((lesson) => {
      docs.push({
        name: firestoreDocName(projectId, "telegramCourseSchedules", courseId, "lessons", lesson.id),
        fields: firestoreFields({ ...lesson, courseId, migratedAt: now }),
        kind: "lesson",
      });
    });
  }

  const existing = overwrite ? new Set() : await getExistingDocs({ docs, projectId, accessToken: token.accessToken });
  const writes = [];
  let coursesWritten = 0;
  let lessonsWritten = 0;
  let skipped = 0;

  docs.forEach((doc) => {
    if (existing.has(doc.name)) {
      skipped += 1;
      return;
    }
    writes.push({ update: { name: doc.name, fields: doc.fields } });
    if (doc.kind === "course") coursesWritten += 1;
    if (doc.kind === "lesson") lessonsWritten += 1;
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

  return { coursesWritten, lessonsWritten, skipped };
}

function printSummary({ courses, mode, coursesWritten = 0, lessonsWritten = 0, skipped = 0 }) {
  const courseEntries = Object.entries(courses);
  const lessonsTotal = courseEntries.reduce((sum, [, data]) => sum + data.lessons.length, 0);
  const needsReview = courseEntries.reduce((sum, [, data]) => sum + data.lessons.filter((lesson) => lesson.needsReview).length, 0);
  const linked = courseEntries.reduce((sum, [, data]) => sum + data.lessons.filter((lesson) => lesson.siteLessonId).length, 0);

  console.log("Telegram schedules migration summary");
  console.log("------------------------------------");
  console.log("Mode:", mode);
  console.log("Courses:", courseEntries.length);
  console.log("Lessons detected:", lessonsTotal);
  console.log("Needs review:", needsReview);
  console.log("Linked to site lessons:", linked);
  console.log("Courses written:", coursesWritten);
  console.log("Lessons written:", lessonsWritten);
  console.log("Skipped existing docs:", skipped);
  courseEntries.forEach(([courseId, data]) => {
    console.log(courseId + ": " + data.lessons.length + " lessons");
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const rawSchedules = loadSchedules(args.source);
  const courses = Object.fromEntries(
    Object.entries(rawSchedules).map(([courseId, course]) => [courseId, normalizeCourse(courseId, course)])
  );

  if (!args.write) {
    printSummary({ courses, mode: "dry-run" });
    console.log("");
    console.log("No Firestore writes were made. Add --write to upload to staging.");
    return;
  }

  const result = await writeWithRest({ courses, projectId: args.projectId, overwrite: args.overwrite });
  printSummary({ courses, mode: "write:" + args.projectId, ...result });
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
});

#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const ENV_PATHS = [path.join(ROOT, ".env"), path.join(ROOT, ".env.local")];
const SCHEDULES_PATH = path.join(ROOT, "data", "telegram-schedules.js");
const GENERATOR_PATH = path.join(ROOT, "js", "telegram-message-generator.js");
const DISPATCH_LOG_PATH = path.join(ROOT, ".telegram-dispatch-log.json");
const DEFAULT_CHAT_ID = "@ehs_course_215";
const DEFAULT_LOOKBACK_HOURS = 48;
const ON_TIME_GRACE_MINUTES = 15;

function parseArgs(argv) {
  const args = {
    chatId: DEFAULT_CHAT_ID,
    confirmSend: false,
    date: "",
    time: "",
    lookbackHours: DEFAULT_LOOKBACK_HOURS,
  };

  function readValue({ arg, index, name }) {
    const inlinePrefix = name + "=";
    if (arg.startsWith(inlinePrefix)) return { value: arg.slice(inlinePrefix.length), nextIndex: index };
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error("Missing value for " + name + ".");
    return { value, nextIndex: index + 1 };
  }

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--chat-id" || arg.startsWith("--chat-id=")) {
      const parsed = readValue({ arg, index, name: "--chat-id" });
      args.chatId = parsed.value;
      index = parsed.nextIndex;
    } else if (arg === "--date" || arg.startsWith("--date=")) {
      const parsed = readValue({ arg, index, name: "--date" });
      args.date = parsed.value;
      index = parsed.nextIndex;
    } else if (arg === "--time" || arg.startsWith("--time=")) {
      const parsed = readValue({ arg, index, name: "--time" });
      args.time = parsed.value;
      index = parsed.nextIndex;
    } else if (arg === "--lookback-hours" || arg.startsWith("--lookback-hours=")) {
      const parsed = readValue({ arg, index, name: "--lookback-hours" });
      args.lookbackHours = Number(parsed.value);
      index = parsed.nextIndex;
    } else if (arg === "--confirm-send") {
      args.confirmSend = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error("Unknown argument: " + arg);
    }
  }

  if (!Number.isFinite(args.lookbackHours) || args.lookbackHours <= 0) {
    throw new Error("--lookback-hours must be a positive number.");
  }
  if ((args.date && !args.time) || (!args.date && args.time)) {
    throw new Error("Use --date and --time together for simulation.");
  }
  return args;
}

function printHelp() {
  console.log(`
Automatic Telegram dispatch for the EHS course schedule.

Dry run:
  node scripts/telegram-auto-dispatch.js

Send pending messages:
  node scripts/telegram-auto-dispatch.js --confirm-send

Simulate a specific time:
  node scripts/telegram-auto-dispatch.js --date=2026-05-06 --time=18:05

Options:
  --chat-id            Defaults to @ehs_course_215.
  --confirm-send       Sends messages. Without it, prints [DRY RUN] only.
  --date YYYY-MM-DD    Simulation date.
  --time HH:mm         Simulation time.
  --lookback-hours N   Catch-up window. Default: 48.
`);
}

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) return;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

function loadSchedules() {
  const code = fs.readFileSync(SCHEDULES_PATH, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: SCHEDULES_PATH });
  const schedules = sandbox.window.TELEGRAM_COURSE_SCHEDULES;
  if (!schedules || typeof schedules !== "object") throw new Error("window.TELEGRAM_COURSE_SCHEDULES was not found.");
  return schedules;
}

function loadGenerator() {
  const code = fs.readFileSync(GENERATOR_PATH, "utf8");
  const documentStub = {
    readyState: "loading",
    addEventListener() {},
    getElementById() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    body: {
      classList: {
        toggle() {},
      },
    },
  };
  const sandbox = { window: {}, document: documentStub, console, URL, Blob };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: GENERATOR_PATH });
  if (!sandbox.window.TelegramMessageGenerator) throw new Error("TelegramMessageGenerator was not found.");
  return sandbox.window.TelegramMessageGenerator;
}

function parseLocalDateTime(dateValue, timeValue) {
  const [year, month, day] = String(dateValue).split("-").map(Number);
  const [hour, minute] = String(timeValue).split(":").map(Number);
  if ([year, month, day, hour, minute].some((value) => !Number.isFinite(value))) {
    throw new Error("Invalid date/time: " + dateValue + " " + timeValue);
  }
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function lessonStartDate(lesson) {
  const startTime = String(lesson.time || "").split("-")[0]?.trim();
  return parseLocalDateTime(lesson.date, startTime);
}

function toLocalIso(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":00"
  );
}

function scheduledDispatches(course, lesson, generator) {
  const start = lessonStartDate(lesson);
  const preparationAt = new Date(start.getTime() - Number(lesson.sendPreparationDaysBefore || 1) * 24 * 60 * 60 * 1000);
  const reminderAt = new Date(start.getTime() - Number(lesson.sendReminderHoursBefore || 3) * 60 * 60 * 1000);
  return [
    {
      dispatchId: lesson.id + ":preparation:" + toLocalIso(preparationAt),
      type: "preparation",
      course,
      lesson,
      scheduledAt: preparationAt,
      message: generator.generatePreparationMessage(course, lesson),
    },
    {
      dispatchId: lesson.id + ":reminder:" + toLocalIso(reminderAt),
      type: "reminder",
      course,
      lesson,
      scheduledAt: reminderAt,
      message: generator.generateReminderMessage(course, lesson),
    },
  ];
}

function loadDispatchLog() {
  if (!fs.existsSync(DISPATCH_LOG_PATH)) return [];
  const parsed = JSON.parse(fs.readFileSync(DISPATCH_LOG_PATH, "utf8"));
  if (!Array.isArray(parsed)) throw new Error(".telegram-dispatch-log.json must contain an array.");
  return parsed;
}

function saveDispatchLog(entries) {
  fs.writeFileSync(DISPATCH_LOG_PATH, JSON.stringify(entries, null, 2) + "\n", "utf8");
}

function dueDispatches({ schedules, generator, now, lookbackHours, sentIds }) {
  const lookbackStart = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);
  const items = [];
  Object.values(schedules).forEach((course) => {
    course.lessons.forEach((lesson) => {
      scheduledDispatches(course, lesson, generator).forEach((dispatch) => {
        if (sentIds.has(dispatch.dispatchId)) return;
        if (dispatch.scheduledAt > now) return;
        if (dispatch.scheduledAt < lookbackStart) return;
        const delayMinutes = Math.max(0, Math.round((now.getTime() - dispatch.scheduledAt.getTime()) / 60000));
        const mode = delayMinutes <= ON_TIME_GRACE_MINUTES ? "on-time" : "catch-up";
        items.push({ ...dispatch, mode, delayMinutes });
      });
    });
  });
  return items.sort((a, b) => a.scheduledAt - b.scheduledAt);
}

function decorateMessage(dispatch) {
  if (dispatch.mode !== "catch-up") return dispatch.message;
  return "(הודעה שנשלחת באיחור)\n\n" + dispatch.message;
}

async function sendTelegramMessage({ token, chatId, text }) {
  const response = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.ok) {
    const description = body?.description || response.status + " " + response.statusText;
    throw new Error("Telegram API error: " + description);
  }
  return body;
}

async function main() {
  ENV_PATHS.forEach(loadEnvFile);
  const args = parseArgs(process.argv);
  const now = args.date ? parseLocalDateTime(args.date, args.time) : new Date();
  const schedules = loadSchedules();
  const generator = loadGenerator();
  const dispatchLog = loadDispatchLog();
  const sentIds = new Set(dispatchLog.map((entry) => entry.dispatchId));
  const due = dueDispatches({ schedules, generator, now, lookbackHours: args.lookbackHours, sentIds });

  console.log(args.confirmSend ? "[SEND MODE]" : "[DRY RUN]");
  console.log("Now:", toLocalIso(now));
  console.log("Chat ID:", args.chatId);
  console.log("Catch-up window:", args.lookbackHours + " hours");
  console.log("Pending dispatches:", due.length);

  if (!due.length) return;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (args.confirmSend && (!token || token === "YOUR_TOKEN_HERE")) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing. Put it in .env.local/.env or set it in the environment.");
  }

  for (const dispatch of due) {
    const text = decorateMessage(dispatch);
    console.log("");
    console.log(dispatch.dispatchId);
    console.log("Type:", dispatch.type);
    console.log("Lesson:", dispatch.lesson.lessonNumber + " - " + dispatch.lesson.topic);
    console.log("Scheduled:", toLocalIso(dispatch.scheduledAt));
    console.log("Mode:", dispatch.mode, "(" + dispatch.delayMinutes + " minutes late)");

    if (!args.confirmSend) {
      console.log("Message preview:");
      console.log(text);
      continue;
    }

    const result = await sendTelegramMessage({ token, chatId: args.chatId, text });
    dispatchLog.push({
      dispatchId: dispatch.dispatchId,
      type: dispatch.type,
      lessonId: dispatch.lesson.id,
      scheduledAt: toLocalIso(dispatch.scheduledAt),
      sentAt: toLocalIso(new Date()),
      mode: dispatch.mode,
      telegramMessageId: result.result?.message_id || null,
    });
    saveDispatchLog(dispatchLog);
    console.log("Sent:", result.result?.message_id || "ok");
  }
}

main().catch((error) => {
  console.error("Auto dispatch failed:", error.message);
  process.exitCode = 1;
});

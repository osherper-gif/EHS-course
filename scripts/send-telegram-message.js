#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const ENV_PATHS = [path.join(ROOT, ".env"), path.join(ROOT, ".env.local")];
const SCHEDULES_PATH = path.join(ROOT, "data", "telegram-schedules.js");
const GENERATOR_PATH = path.join(ROOT, "js", "telegram-message-generator.js");

function parseArgs(argv) {
  const args = {
    chatId: "",
    message: "",
    lessonId: "",
    messageType: "preparation",
    confirmSend: false,
  };

  function readValue({ arg, index, name }) {
    const inlinePrefix = name + "=";
    if (arg.startsWith(inlinePrefix)) {
      return { value: arg.slice(inlinePrefix.length), nextIndex: index };
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error("Missing value for " + name + ".");
    }
    return { value, nextIndex: index + 1 };
  }

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--chat-id" || arg.startsWith("--chat-id=")) {
      const parsed = readValue({ arg, index, name: "--chat-id" });
      args.chatId = parsed.value;
      index = parsed.nextIndex;
    } else if (arg === "--message" || arg.startsWith("--message=")) {
      const parsed = readValue({ arg, index, name: "--message" });
      args.message = parsed.value;
      index = parsed.nextIndex;
    } else if (arg === "--lesson-id" || arg.startsWith("--lesson-id=")) {
      const parsed = readValue({ arg, index, name: "--lesson-id" });
      args.lessonId = parsed.value;
      index = parsed.nextIndex;
    } else if (arg === "--message-type" || arg.startsWith("--message-type=")) {
      const parsed = readValue({ arg, index, name: "--message-type" });
      args.messageType = parsed.value || args.messageType;
      index = parsed.nextIndex;
    } else if (arg === "--confirm-send") args.confirmSend = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error("Unknown argument: " + arg);
    }
  }

  if (!args.chatId) {
    throw new Error(
      "Missing --chat-id. In PowerShell, channel names that start with @ must be quoted, or use --chat-id=@channel."
    );
  }
  if (!args.message && !args.lessonId) throw new Error("Provide --message or --lesson-id.");
  if (!["preparation", "reminder"].includes(args.messageType)) {
    throw new Error("--message-type must be preparation or reminder.");
  }
  return args;
}

function printHelp() {
  console.log(`
Send a Telegram message manually.

Dry run with direct text:
  node scripts/send-telegram-message.js --chat-id CHAT_ID --message "Hello"
  node scripts/send-telegram-message.js --chat-id=CHAT_ID --message="Hello"

PowerShell note:
  If the chat id starts with @, use --chat-id=@channel or --chat-id "@channel".

Dry run from lesson generator:
  node scripts/send-telegram-message.js --chat-id CHAT_ID --lesson-id bh-215-036
  node scripts/send-telegram-message.js --chat-id=CHAT_ID --lesson-id=bh-215-036

Send for real:
  node scripts/send-telegram-message.js --chat-id CHAT_ID --lesson-id bh-215-036 --confirm-send

Options:
  --chat-id        Telegram chat/channel id, for example @channel or -100...
  --chat-id=...
  --message        Message text to send.
  --message=...
  --lesson-id      Local schedule lesson id, for example bh-215-036.
  --lesson-id=...
  --message-type   preparation or reminder. Default: preparation.
  --message-type=...
  --confirm-send   Without this flag the script prints [DRY RUN] and sends nothing.
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
  if (!schedules || typeof schedules !== "object") {
    throw new Error("window.TELEGRAM_COURSE_SCHEDULES was not found.");
  }
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
  const sandbox = {
    window: {},
    document: documentStub,
    console,
    URL,
    Blob,
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: GENERATOR_PATH });
  if (!sandbox.window.TelegramMessageGenerator) {
    throw new Error("TelegramMessageGenerator was not found.");
  }
  return sandbox.window.TelegramMessageGenerator;
}

function messageFromLesson({ lessonId, messageType }) {
  const schedules = loadSchedules();
  const generator = loadGenerator();
  for (const course of Object.values(schedules)) {
    const lesson = course.lessons.find((item) => item.id === lessonId);
    if (!lesson) continue;
    return messageType === "reminder"
      ? generator.generateReminderMessage(course, lesson)
      : generator.generatePreparationMessage(course, lesson);
  }
  throw new Error("Lesson id was not found: " + lessonId);
}

async function sendTelegramMessage({ token, chatId, text }) {
  const response = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const text = args.message || messageFromLesson(args);

  if (!args.confirmSend) {
    console.log("[DRY RUN]");
    console.log("Chat ID:", args.chatId);
    console.log("Message:");
    console.log(text);
    return;
  }

  if (!token || token === "YOUR_TOKEN_HERE") {
    throw new Error("TELEGRAM_BOT_TOKEN is missing. Put it in .env.local/.env or set it in the environment.");
  }

  const result = await sendTelegramMessage({ token, chatId: args.chatId, text });
  console.log("Telegram message sent:", result.result?.message_id || "ok");
}

main().catch((error) => {
  console.error("Send failed:", error.message);
  process.exitCode = 1;
});

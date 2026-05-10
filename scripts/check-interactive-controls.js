const fs = require("fs");
const http = require("http");
const path = require("path");
const os = require("os");
const Module = require("module");

const bundledModules = path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules");
if (fs.existsSync(bundledModules)) {
  process.env.NODE_PATH = [process.env.NODE_PATH, bundledModules].filter(Boolean).join(path.delimiter);
  Module._initPaths();
}

const { chromium } = require("playwright");

const root = process.cwd();
const pages = [
  "/index.html",
  "/pages/field-tools.html",
  "/pages/laws.html",
  "/pages/standards.html",
  "/pages/quizzes.html",
  "/pages/exam-questions.html",
  "/pages/safety-game.html",
  "/pages/lesson-01.html",
  "/pages/lesson-02.html",
  "/pages/labor-inspection-law-1954.html",
  "/pages/work-safety-ordinance-1970.html",
  "/pages/iso-45001-2018.html",
];

const authStub = `
  window.CourseAuth = {
    profile: { uid: "local-qa", displayName: "בדיקת QA", email: "qa@example.test", role: "admin", status: "approved" },
    logout: function () {},
    requireApproved: function () { return Promise.resolve(this.profile); },
    updateLastVisitedPage: function () { return Promise.resolve(); },
    updateLastSeenVersionAt: function () { return Promise.resolve(); }
  };
  window.CourseAuthReady = Promise.resolve(window.CourseAuth.profile);
  document.dispatchEvent(new CustomEvent("course-auth-approved", { detail: window.CourseAuth.profile }));
`;

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  }[ext] || "application/octet-stream";
}

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.pathname === "/js/auth.js") {
      res.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
      res.end(authStub);
      return;
    }
    const decoded = decodeURIComponent(url.pathname.replace(/^\/+/, "")) || "index.html";
    const filePath = path.normalize(path.join(root, decoded));
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": contentType(filePath) });
    res.end(fs.readFileSync(filePath));
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function clickAndCheck(page, locator, label) {
  const before = await page.evaluate(() => ({
    href: location.href,
    active: document.querySelectorAll(".is-active,[aria-selected='true']").length,
    open: document.querySelectorAll("details[open]").length,
    hidden: document.querySelectorAll("[hidden]").length,
    activeText: Array.from(document.querySelectorAll(".is-active,[aria-selected='true']")).map((el) => el.textContent.trim()).join("|"),
    html: document.body.innerHTML.length,
  }));
  await locator.click({ timeout: 2000 });
  await page.waitForTimeout(120);
  const after = await page.evaluate(() => ({
    href: location.href,
    active: document.querySelectorAll(".is-active,[aria-selected='true']").length,
    open: document.querySelectorAll("details[open]").length,
    hidden: document.querySelectorAll("[hidden]").length,
    activeText: Array.from(document.querySelectorAll(".is-active,[aria-selected='true']")).map((el) => el.textContent.trim()).join("|"),
    html: document.body.innerHTML.length,
  }));
  const changed = Object.keys(before).some((key) => before[key] !== after[key]);
  if (!changed) throw new Error(`לא זוהה שינוי לאחר לחיצה על ${label}`);
}

async function inspectPage(browser, baseUrl, pathname, viewport) {
  const page = await browser.newPage({ viewport });
  const issues = [];
  page.on("console", (msg) => {
    if (["error"].includes(msg.type())) issues.push(`Console ${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => issues.push(`Page error: ${err.message}`));
  await page.goto(baseUrl + pathname, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(500);

  const runtime = await page.evaluate(() => {
    const bodyText = document.body.innerText || "";
    const header = document.querySelector(".site-header");
    const main = document.querySelector("main");
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    const mainTop = main ? main.getBoundingClientRect().top : 0;
    const badText = ["[object Object]", "undefined", "NaN"].filter((token) => bodyText.includes(token));
    const rawTree = /(?:^|\n)\s*(?:│|├──|└──|-->|=>|->|▼)/.test(bodyText);
    const deadAnchors = Array.from(document.querySelectorAll("a.btn, a[role='button'], .related-links a, .footer-links a"))
      .filter((a) => !a.hasAttribute("href") || a.getAttribute("href") === "#" || a.getAttribute("href") === "")
      .map((a) => a.textContent.trim());
    return { headerBottom, mainTop, badText, rawTree, deadAnchors };
  });
  if (runtime.mainTop && runtime.mainTop < runtime.headerBottom - 1) issues.push(`Header overlap: mainTop=${runtime.mainTop}, headerBottom=${runtime.headerBottom}`);
  if (runtime.badText.length) issues.push(`טקסט debug גלוי: ${runtime.badText.join(", ")}`);
  if (runtime.rawTree) issues.push("נמצא תרשים ASCII/חצים גולמיים בגוף הדף");
  if (runtime.deadAnchors.length) issues.push(`קישורי כפתור ללא יעד: ${runtime.deadAnchors.join(", ")}`);

  const buttonSelectors = [
    "[data-source-filter]",
    "[data-source-action]",
    "[data-source-open-all]",
    "[data-source-close-all]",
    "[data-law-action]",
    ".law-filter",
    ".law-tab",
    "summary",
  ];
  const count = Math.min(await page.locator(buttonSelectors.join(",")).count(), 8);
  for (let index = 0; index < count; index += 1) {
    const locator = page.locator(buttonSelectors.join(",")).nth(index);
    const label = await locator.evaluate((el) => el.textContent.trim().slice(0, 80));
    if (!label) continue;
    const alreadyActiveNoop = await locator.evaluate((el) =>
      el.classList.contains("is-active") && (el.matches("[data-source-filter]") || el.matches(".law-filter")),
    );
    if (alreadyActiveNoop) continue;
    try {
      await clickAndCheck(page, locator, label);
    } catch (err) {
      issues.push(err.message);
    }
  }

  await page.close();
  return issues.map((issue) => `${pathname} [${viewport.width}x${viewport.height}] ${issue}`);
}

(async () => {
  const server = await startServer();
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true });
  const allIssues = [];
  try {
    for (const pathname of pages) {
      for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
        allIssues.push(...await inspectPage(browser, baseUrl, pathname, viewport));
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  if (allIssues.length) {
    console.error("Interactive control check failed:");
    allIssues.forEach((issue) => console.error("- " + issue));
    process.exit(1);
  }
  console.log("Interactive control check passed for " + pages.length + " pages.");
})();

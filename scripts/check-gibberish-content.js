const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');

const rootDir = path.resolve(__dirname, '..');
const reportPath = path.join(rootDir, 'docs', 'gibberish-content-scan.json');
const baseUrlArg = process.argv.find((arg) => arg.startsWith('--base-url='));
const externalBaseUrl = baseUrlArg ? baseUrlArg.replace('--base-url=', '').replace(/\/+$/, '') : '';

const staticExtensions = new Set(['.html', '.css', '.js', '.json']);
const ignoredDirs = new Set(['.git', 'node_modules', '.firebase', 'dist', 'build']);
const staticIssues = [];
const browserIssues = [];
const warnings = [];

const staticPatterns = [
  { name: 'replacement-character', pattern: /�/g },
  { name: 'question-mark-run', pattern: /\?{3,}/g },
  { name: 'object-object', pattern: /\[object Object\]/g },
  { name: 'visible-undefined', pattern: /\bundefined\b/g },
  { name: 'visible-nan', pattern: /\bNaN\b/g },
  { name: 'mojibake-hebrew', pattern: /(ג€|×[-¿]|â€|ï¿½)/g }
];

const browserPatterns = [
  { name: 'replacement-character', pattern: /�/ },
  { name: 'question-mark-run', pattern: /\?{3,}/ },
  { name: 'object-object', pattern: /\[object Object\]/ },
  { name: 'visible-undefined', pattern: /\bundefined\b/ },
  { name: 'visible-null', pattern: /(^|[\s:;,.()])null($|[\s:;,.()])/ },
  { name: 'visible-nan', pattern: /\bNaN\b/ },
  { name: 'mojibake-hebrew', pattern: /(ג€|×[-¿]|â€|ï¿½)/ },
  { name: 'raw-box-drawing', pattern: /(^|\n)\s*[│├└─]{2,}/ }
];

const pagesToOpen = [
  'index.html',
  'pages/syllabus.html',
  'pages/lesson-01.html',
  'pages/lesson-02.html',
  'pages/labor-inspection-law-1954.html',
  'pages/work-safety-ordinance-1970.html',
  'pages/iso-45001-2018.html',
  'pages/field-tools.html',
  'pages/laws.html',
  'pages/standards.html',
  'pages/quizzes.html',
  'pages/exam-questions.html',
  'pages/safety-game.html'
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
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
  }[ext] || 'application/octet-stream';
}

function startServer() {
  const http = require('http');
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/js/auth.js') {
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
      res.end(authStub);
      return;
    }

    const decoded = decodeURIComponent(url.pathname.replace(/^\/+/, '')) || 'index.html';
    const filePath = path.normalize(path.join(rootDir, decoded));
    if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
      return;
    }

    res.writeHead(200, { 'content-type': contentType(filePath) });
    res.end(fs.readFileSync(filePath));
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!staticExtensions.has(ext)) continue;
    const relative = path.relative(rootDir, fullPath).replace(/\\/g, '/');
    if (relative.startsWith('docs/')) continue;
    files.push(fullPath);
  }
  return files;
}

function lineNumberFor(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function excerpt(content, index) {
  const start = Math.max(0, index - 80);
  const end = Math.min(content.length, index + 120);
  return content.slice(start, end).replace(/\s+/g, ' ').trim();
}

function scanStaticFiles() {
  for (const file of walk(rootDir)) {
    const relative = path.relative(rootDir, file).replace(/\\/g, '/');
    if (relative.startsWith('scripts/check-') && relative !== 'scripts/check-gibberish-content.js') continue;
    const content = fs.readFileSync(file, 'utf8');
    const isScript = relative.endsWith('.js');
    for (const check of staticPatterns) {
      if (isScript && ['visible-undefined', 'visible-nan'].includes(check.name)) continue;
      check.pattern.lastIndex = 0;
      let match;
      while ((match = check.pattern.exec(content)) !== null) {
        if (relative === 'scripts/check-gibberish-content.js') continue;
        staticIssues.push({
          type: check.name,
          file: relative,
          line: lineNumberFor(content, match.index),
          excerpt: excerpt(content, match.index)
        });
      }
    }
  }
}

async function findPlaywright() {
  const bundledModules = path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules');
  if (fs.existsSync(bundledModules)) {
    process.env.NODE_PATH = [process.env.NODE_PATH, bundledModules].filter(Boolean).join(path.delimiter);
    Module._initPaths();
  }

  try {
    return require('playwright');
  } catch (firstError) {
    const candidates = [
      path.join(rootDir, 'node_modules', 'playwright'),
      path.join(process.env.USERPROFILE || '', 'node_modules', 'playwright')
    ];
    for (const candidate of candidates) {
      try {
        return require(candidate);
      } catch (_) {
        // Try next candidate.
      }
    }
    throw firstError;
  }
}

async function scanBrowserText() {
  let chromium;
  try {
    ({ chromium } = await findPlaywright());
  } catch (error) {
    warnings.push({
      type: 'browser-scan-skipped',
      file: 'playwright',
      line: 0,
      excerpt: `Playwright unavailable: ${error.message}`
    });
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const server = externalBaseUrl ? null : await startServer();
  const port = server ? server.address().port : 0;
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });

  for (const pagePath of pagesToOpen) {
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    const target = externalBaseUrl ? `${externalBaseUrl}/${pagePath}` : `http://127.0.0.1:${port}/${pagePath}`;
    try {
      await page.goto(target, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(500);
      const text = await page.evaluate(() => document.body ? document.body.innerText : '');
      for (const check of browserPatterns) {
        const match = text.match(check.pattern);
        if (match) {
          const index = match.index || 0;
          browserIssues.push({
            type: check.name,
            file: pagePath,
            line: lineNumberFor(text, index),
            excerpt: excerpt(text, index)
          });
        }
      }
      for (const errorText of consoleErrors) {
        browserIssues.push({
          type: 'console-error',
          file: pagePath,
          line: 0,
          excerpt: errorText
        });
      }
    } catch (error) {
      browserIssues.push({
        type: 'page-load-error',
        file: pagePath,
        line: 0,
        excerpt: error.message
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}

(async () => {
  scanStaticFiles();
  await scanBrowserText();

  const report = {
    generatedAt: new Date().toISOString(),
    staticIssues,
    browserIssues,
    warnings
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  if (staticIssues.length || browserIssues.length) {
    console.error(`Gibberish scan found ${staticIssues.length} static issues and ${browserIssues.length} browser issues.`);
    for (const issue of [...staticIssues, ...browserIssues].slice(0, 40)) {
      console.error(`${issue.file}:${issue.line} [${issue.type}] ${issue.excerpt}`);
    }
    process.exit(1);
  }

  if (warnings.length) {
    console.warn(`Gibberish scan completed with ${warnings.length} warning(s).`);
    for (const warning of warnings) {
      console.warn(`${warning.file}:${warning.line} [${warning.type}] ${warning.excerpt}`);
    }
  }

  console.log(`Gibberish scan passed. Report written to ${path.relative(rootDir, reportPath)}.`);
})();

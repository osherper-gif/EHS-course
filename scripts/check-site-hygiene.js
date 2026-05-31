const fs = require('fs');
const path = require('path');
const root = process.cwd();
const htmlRoots = ['index.html', 'login.html', 'courses.html', 'pages'];
const ignored = new Set(['googleb124cb99fa73aa0c.html']);
const badTextPatterns = [
  /תוכן מלא(?:\s+לפי)?/,
  /\blorem\b/i,
  /\bFIXME\b/,
  /\bTODO\b/,
  /coming soon/i
];
const allowedPlaceholderPatterns = [
  /placeholder=/i,
  /::placeholder/i,
  /summary-placeholder/,
  /data-source-search/,
  /data-learning-search/
];
const failures = [];
function walk(target) {
  const full = path.join(root, target);
  if (!fs.existsSync(full)) return [];
  const stat = fs.statSync(full);
  if (stat.isFile()) return [full];
  return fs.readdirSync(full).flatMap((entry) => walk(path.join(target, entry)));
}
function rel(file) { return path.relative(root, file).replace(/\\/g, '/'); }
for (const file of htmlRoots.flatMap(walk).filter((item) => item.endsWith('.html'))) {
  const relative = rel(file);
  if (ignored.has(path.basename(file))) continue;
  const source = fs.readFileSync(file, 'utf8');
  const h1Count = (source.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) failures.push(`${relative}: expected exactly one h1, found ${h1Count}`);
  if (!/<meta\s+name=["']description["']/i.test(source)) failures.push(`${relative}: missing meta description`);
  source.split(/\r?\n/).forEach((line, index) => {
    if (allowedPlaceholderPatterns.some((pattern) => pattern.test(line))) return;
    if (badTextPatterns.some((pattern) => pattern.test(line))) failures.push(`${relative}:${index + 1}: public hygiene text: ${line.trim().slice(0, 120)}`);
  });
}
if (failures.length) {
  console.error('[site-hygiene] FAIL');
  failures.slice(0, 80).forEach((item) => console.error('- ' + item));
  if (failures.length > 80) console.error(`- ...and ${failures.length - 80} more`);
  process.exit(1);
}
console.log('[site-hygiene] PASS');

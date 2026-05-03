const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) htmlFiles.push(full);
  }
}

walk(root);

const missing = [];
const attrRe = /\b(?:href|src)=["']([^"']+)["']/g;

for (const file of htmlFiles) {
  const text = fs.readFileSync(file, "utf8");
  let match;
  while ((match = attrRe.exec(text))) {
    let url = match[1];
    if (
      !url ||
      url.startsWith("http") ||
      url.startsWith("mailto:") ||
      url.startsWith("tel:") ||
      url.startsWith("#") ||
      url.startsWith("data:")
    ) continue;
    url = url.split("#")[0].split("?")[0];
    if (!url) continue;
    const target = path.resolve(path.dirname(file), url);
    if (!fs.existsSync(target)) missing.push(`${path.relative(root, file)} -> ${match[1]}`);
  }
}

console.log(`HTML files: ${htmlFiles.length}`);
console.log(`Missing internal links: ${missing.length}`);
if (missing.length) {
  missing.slice(0, 80).forEach((item) => console.log(`- ${item}`));
  process.exitCode = 1;
}

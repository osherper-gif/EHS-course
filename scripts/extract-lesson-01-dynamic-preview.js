const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'pages', 'lesson-01.html');
const outputPath = path.join(root, 'docs', 'dynamic-lesson-01-preview.json');

function stripTags(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value) {
  return stripTags(value)
    .replace(/\bundefined\b/g, '')
    .replace(/\bNaN\b/g, '')
    .replace(/\[object Object\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findFirst(text, pattern) {
  const match = text.match(pattern);
  return match ? normalizeText(match[1]) : '';
}

function extractBlocks(html, warnings) {
  const blocks = [];
  const sectionPattern = /<section\b[^>]*class="[^"]*(?:lesson-section|content-section)[^"]*"[^>]*>([\s\S]*?)<\/section>/gi;
  let match;
  let order = 1;

  while ((match = sectionPattern.exec(html)) && blocks.length < 24) {
    const sectionHtml = match[1];
    const heading = findFirst(sectionHtml, /<h[2-3][^>]*>([\s\S]*?)<\/h[2-3]>/i);
    const paragraph = findFirst(sectionHtml, /<p[^>]*>([\s\S]*?)<\/p>/i);

    if (!heading && !paragraph) {
      continue;
    }

    blocks.push({
      id: `lesson-01-block-${String(order).padStart(2, '0')}`,
      type: 'paragraph',
      title: heading || `בלוק ${order}`,
      body: paragraph || heading,
      sourceSelector: 'section.lesson-section, section.content-section',
      order
    });
    order += 1;
  }

  if (!blocks.length) {
    warnings.push('No lesson/content sections were detected; fallback block was created from page title.');
    const fallbackTitle = findFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || 'שיעור 1';
    blocks.push({
      id: 'lesson-01-block-01',
      type: 'paragraph',
      title: fallbackTitle,
      body: fallbackTitle,
      sourceSelector: 'h1',
      order: 1
    });
  }

  return blocks;
}

function assertNoBrokenTokens(jsonText) {
  const brokenObjectToken = ['[object', 'Object]'].join(' ');
  const brokenTokens = ['undefined', brokenObjectToken, 'NaN'];

  for (const token of brokenTokens) {
    assert(!jsonText.includes(token), `Preview JSON contains broken token: ${token}`);
  }
}

function run() {
  assert(fs.existsSync(sourcePath), 'pages/lesson-01.html does not exist');

  const html = fs.readFileSync(sourcePath, 'utf8');
  const warnings = [];
  const title =
    findFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    findFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i);

  if (!title) {
    warnings.push('Title was not detected from h1/title tags.');
  }

  const preview = {
    id: 'lesson-01',
    type: 'lesson',
    title: title || 'שיעור 1',
    source: 'static-html-extract',
    extractedAt: new Date().toISOString(),
    sourcePath: 'pages/lesson-01.html',
    blocks: extractBlocks(html, warnings),
    warnings
  };

  assert(preview.title, 'Preview title is missing');
  assert(Array.isArray(preview.blocks), 'Preview blocks must be an array');
  assert(preview.blocks.length > 0, 'Preview must contain at least one block');

  const jsonText = `${JSON.stringify(preview, null, 2)}\n`;
  assertNoBrokenTokens(jsonText);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, jsonText, 'utf8');

  assert(fs.existsSync(outputPath), 'Preview JSON was not created');

  console.log(
    JSON.stringify(
      {
        output: path.relative(root, outputPath),
        blocks: preview.blocks.length,
        warnings: preview.warnings.length
      },
      null,
      2
    )
  );
}

run();

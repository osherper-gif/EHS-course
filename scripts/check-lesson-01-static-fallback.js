const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const lessonPath = path.join(root, 'pages', 'lesson-01.html');
const flagsPath = path.join(root, 'js', 'dynamic-content-flags.js');
const loaderPath = path.join(root, 'js', 'dynamic-content-loader.js');
const rendererPath = path.join(root, 'js', 'dynamic-content-renderer.js');
const hookPath = path.join(root, 'js', 'lesson-01-dynamic-hook.js');

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

async function run() {
  assert(fs.existsSync(lessonPath), 'pages/lesson-01.html does not exist');
  assert(fs.existsSync(flagsPath), 'js/dynamic-content-flags.js does not exist');
  assert(fs.existsSync(loaderPath), 'js/dynamic-content-loader.js does not exist');
  assert(fs.existsSync(rendererPath), 'js/dynamic-content-renderer.js does not exist');
  assert(fs.existsSync(hookPath), 'js/lesson-01-dynamic-hook.js does not exist');

  const html = readText(lessonPath);
  const hookScript = readText(hookPath);

  assert(
    html.includes('../js/dynamic-content-flags.js'),
    'Lesson 01 does not load dynamic-content-flags.js'
  );
  assert(
    html.includes('../js/dynamic-content-loader.js'),
    'Lesson 01 does not load dynamic-content-loader.js'
  );
  assert(
    html.includes('../js/dynamic-content-renderer.js'),
    'Lesson 01 does not load dynamic-content-renderer.js'
  );
  assert(
    html.includes('../js/lesson-01-dynamic-hook.js'),
    'Lesson 01 does not load lesson-01-dynamic-hook.js'
  );
  assert(
    !html.includes('initLesson01DynamicLoaderProbe'),
    'Old inline dynamic loader probe is still present'
  );
  assert(
    !/<script>\s*\(function initLesson01DynamicLoaderProbe\(\)/.test(html),
    'Inline dynamic loader probe script is still present'
  );
  assert(
    hookScript.includes('runLesson01DynamicHook'),
    'External hook does not define the expected hook function'
  );
  assert(
    hookScript.includes("loadDynamicContent('lesson-01'"),
    'External hook does not request lesson-01'
  );
  assert(html.includes('data-lesson-id="lesson-01"'), 'Static lesson shell marker is missing');
  assert(
    html.includes('id="lesson-01-complete-source"'),
    'Static lesson source hub marker is missing'
  );

  delete global.DynamicContentFlags;
  delete global.DynamicContentFlagService;
  delete global.DynamicContentLoader;

  const flags = require('../js/dynamic-content-flags.js');
  const loader = require('../js/dynamic-content-loader.js');

  assert.strictEqual(flags.isDynamicContentEnabled(), false, 'Dynamic flag is not disabled by default');
  assert.strictEqual(
    flags.isDynamicContentDebugEnabled(),
    false,
    'Dynamic debug flag is not disabled by default'
  );

  const fallbackResult = await loader.loadDynamicContent('lesson-01', () => 'static-fallback');
  assert.strictEqual(
    fallbackResult,
    'static-fallback',
    'Loader did not return fallback while flag is disabled'
  );

  let writeCalls = 0;
  const guardedProviderResult = await loader.loadDynamicContent(
    'lesson-01',
    () => 'static-fallback',
    {
      firestoreProvider: {
        read: async () => ({ title: 'dynamic' }),
        write: () => {
          writeCalls += 1;
        },
        set: () => {
          writeCalls += 1;
        },
        update: () => {
          writeCalls += 1;
        },
        delete: () => {
          writeCalls += 1;
        }
      }
    }
  );

  assert.strictEqual(
    guardedProviderResult,
    'static-fallback',
    'Loader should ignore providers and return fallback while flag is disabled'
  );
  assert.strictEqual(writeCalls, 0, 'Loader attempted a write operation');

  const staticDomState = {
    shellExists: html.includes('data-lesson-id="lesson-01"'),
    sourceHubExists: html.includes('lesson-01-complete-source'),
    previewHidden: html.includes('hidden data-dynamic-preview="lesson-01"')
  };

  const afterHookState = {
    shellExists: html.includes('data-lesson-id="lesson-01"'),
    sourceHubExists: html.includes('lesson-01-complete-source'),
    previewHidden: html.includes('hidden data-dynamic-preview="lesson-01"')
  };

  assert.deepStrictEqual(
    afterHookState,
    staticDomState,
    'Static DOM markers changed while dynamic flag is disabled'
  );

  console.log('Lesson 01 static fallback regression check passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

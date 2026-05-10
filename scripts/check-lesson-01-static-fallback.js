const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const lessonPath = path.join(root, 'pages', 'lesson-01.html');
const flagsPath = path.join(root, 'js', 'dynamic-content-flags.js');
const loaderPath = path.join(root, 'js', 'dynamic-content-loader.js');

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function getInlineDynamicProbe(html) {
  const probeMatch = html.match(
    /<script>\s*\(function initLesson01DynamicLoaderProbe\(\)[\s\S]*?<\/script>/
  );

  assert(probeMatch, 'Lesson 01 dynamic loader probe script was not found');

  return probeMatch[0].replace(/^<script>\s*/, '').replace(/\s*<\/script>$/, '');
}

async function run() {
  assert(fs.existsSync(lessonPath), 'pages/lesson-01.html does not exist');
  assert(fs.existsSync(flagsPath), 'js/dynamic-content-flags.js does not exist');
  assert(fs.existsSync(loaderPath), 'js/dynamic-content-loader.js does not exist');

  const html = readText(lessonPath);

  assert(
    html.includes('../js/dynamic-content-flags.js'),
    'Lesson 01 does not load dynamic-content-flags.js'
  );
  assert(
    html.includes('../js/dynamic-content-loader.js'),
    'Lesson 01 does not load dynamic-content-loader.js'
  );
  assert(html.includes('יסודות תורת הבטיחות'), 'Main static lesson title is missing');
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
    titleExists: html.includes('יסודות תורת הבטיחות'),
    sourceHubExists: html.includes('lesson-01-complete-source'),
    scriptCount: (html.match(/<script\b/g) || []).length
  };

  const context = {
    window: {
      DynamicContentLoader: {
        loadDynamicContent: async (topicId, fallbackProvider) => {
          assert.strictEqual(topicId, 'lesson-01', 'Probe requested the wrong topic');
          return typeof fallbackProvider === 'function' ? fallbackProvider('dynamic-disabled') : null;
        }
      }
    }
  };
  context.globalThis = context;

  const inlineProbe = getInlineDynamicProbe(html);
  vm.runInNewContext(inlineProbe, context, { timeout: 1000 });

  const afterProbeState = {
    titleExists: html.includes('יסודות תורת הבטיחות'),
    sourceHubExists: html.includes('lesson-01-complete-source'),
    scriptCount: (html.match(/<script\b/g) || []).length
  };

  assert.deepStrictEqual(
    afterProbeState,
    staticDomState,
    'Static DOM markers changed while dynamic flag is disabled'
  );

  console.log('Lesson 01 static fallback regression check passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

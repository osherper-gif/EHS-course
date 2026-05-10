const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const lessonPath = path.join(root, 'pages', 'lesson-01.html');
const flagsPath = path.join(root, 'js', 'dynamic-content-flags.js');
const loaderPath = path.join(root, 'js', 'dynamic-content-loader.js');
const rendererPath = path.join(root, 'js', 'dynamic-content-renderer.js');
const mockPath = path.join(root, 'data', 'dynamic', 'mock-content.js');

function resetModules() {
  for (const modulePath of [flagsPath, loaderPath, rendererPath, mockPath]) {
    delete require.cache[require.resolve(modulePath)];
  }

  delete global.DynamicContentFlags;
  delete global.DynamicContentFlagService;
  delete global.DynamicContentLoader;
  delete global.DynamicContentRenderer;
  delete global.MockDynamicContent;
}

async function run() {
  const html = fs.readFileSync(lessonPath, 'utf8');

  assert(html.includes('id="dynamic-content-preview"'), 'Dynamic preview container is missing');
  assert(html.includes('hidden data-dynamic-preview="lesson-01"'), 'Preview container is not hidden by default');
  assert(html.includes('../data/dynamic/mock-content.js'), 'Mock content script is not referenced');
  assert(html.includes('../js/dynamic-content-renderer.js'), 'Renderer script is not referenced');
  assert(html.includes('lesson-01-complete-source'), 'Static source hub marker is missing');
  assert(html.includes('יסודות תורת הבטיחות'), 'Static lesson content marker is missing');

  resetModules();
  require(flagsPath);
  const disabledLoader = require(loaderPath);
  const renderer = require(rendererPath);

  const disabledContent = await disabledLoader.loadDynamicContent('lesson-01', () => null);
  const disabledContainer = { hidden: true, innerHTML: '' };

  if (disabledContent) {
    renderer.renderDynamicContentPreview(disabledContainer, disabledContent);
  }

  assert.strictEqual(disabledContent, null, 'Disabled flags should return fallback null');
  assert.strictEqual(disabledContainer.hidden, true, 'Preview should stay hidden when flags are disabled');
  assert.strictEqual(disabledContainer.innerHTML, '', 'Preview HTML should stay empty when flags are disabled');

  resetModules();
  global.DynamicContentFlags = {
    enabled: true,
    debug: false,
    useMockDynamicContent: true
  };
  require(flagsPath);
  const enabledLoader = require(loaderPath);
  const enabledRenderer = require(rendererPath);
  const enabledContent = await enabledLoader.loadDynamicContent('lesson-01', () => null);
  const enabledContainer = { hidden: true, innerHTML: '' };
  const rendered = enabledRenderer.renderDynamicContentPreview(enabledContainer, enabledContent);

  assert.strictEqual(rendered, true, 'Renderer did not render mock preview');
  assert.strictEqual(enabledContainer.hidden, false, 'Preview should be visible when mock flags are enabled');
  assert(enabledContainer.innerHTML.includes('dynamic-preview-inner'), 'Preview wrapper was not rendered');
  assert(enabledContainer.innerHTML.includes('תוכן דינמי ניסיוני'), 'Preview label was not rendered');
  assert(enabledContainer.innerHTML.includes('lesson') || enabledContainer.innerHTML.length > 0);

  let writeCalls = 0;
  await enabledLoader.loadDynamicContent('lesson-01', () => null, {
    firestoreProvider: {
      read: async () => ({ source: 'firestore' }),
      write: () => {
        writeCalls += 1;
      }
    }
  });

  assert.strictEqual(writeCalls, 0, 'A write-like API was called');

  console.log('Lesson 01 dynamic preview check passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

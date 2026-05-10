const assert = require('assert');
const path = require('path');

const flagsPath = path.join(__dirname, '..', 'js', 'dynamic-content-flags.js');
const loaderPath = path.join(__dirname, '..', 'js', 'dynamic-content-loader.js');

function resetModules() {
  delete require.cache[require.resolve(flagsPath)];
  delete require.cache[require.resolve(loaderPath)];
  delete global.DynamicContentFlags;
  delete global.DynamicContentFlagService;
  delete global.DynamicContentLoader;
}

async function run() {
  resetModules();

  require(flagsPath);
  let loader = require(loaderPath);

  const disabledResult = await loader.loadDynamicContent('lesson-01', () => ({
    source: 'fallback',
    reason: 'disabled'
  }));

  assert.deepStrictEqual(disabledResult, {
    source: 'fallback',
    reason: 'disabled'
  });

  resetModules();
  global.DynamicContentFlags = { enabled: true, debug: false };
  require(flagsPath);
  loader = require(loaderPath);

  const exceptionResult = await loader.loadDynamicContent(
    'lesson-01',
    () => ({ source: 'fallback', reason: 'exception' }),
    {
      dynamicProvider: async () => {
        throw new Error('expected test exception');
      }
    }
  );

  assert.deepStrictEqual(exceptionResult, {
    source: 'fallback',
    reason: 'exception'
  });

  const emptyResult = await loader.loadDynamicContent(
    'lesson-01',
    () => ({ source: 'fallback', reason: 'empty' }),
    {
      dynamicProvider: async () => null
    }
  );

  assert.deepStrictEqual(emptyResult, {
    source: 'fallback',
    reason: 'empty'
  });

  const noFirebaseResult = await loader.loadDynamicContent(
    'lesson-01',
    () => ({ source: 'fallback', reason: 'no-firebase' }),
    {}
  );

  assert.deepStrictEqual(noFirebaseResult, {
    source: 'fallback',
    reason: 'no-firebase'
  });

  const attemptedWrites = [];
  const readOnlyResult = await loader.loadDynamicContent(
    'lesson-01',
    () => ({ source: 'fallback', reason: 'readonly' }),
    {
      firestoreProvider: {
        read: async () => ({ source: 'dynamic-read' }),
        write: () => attemptedWrites.push('write')
      }
    }
  );

  assert.deepStrictEqual(readOnlyResult, {
    source: 'fallback',
    reason: 'readonly'
  });
  assert.strictEqual(attemptedWrites.length, 0);

  const dynamicReadResult = await loader.loadDynamicContent(
    'lesson-01',
    () => ({ source: 'fallback' }),
    {
      firestoreProvider: {
        read: async () => ({ source: 'dynamic-read' })
      }
    }
  );

  assert.deepStrictEqual(dynamicReadResult, { source: 'dynamic-read' });

  console.log('Dynamic loader checks passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const assert = require('assert');
const path = require('path');

const flagsPath = path.join(__dirname, '..', 'js', 'dynamic-content-flags.js');
const loaderPath = path.join(__dirname, '..', 'js', 'dynamic-content-loader.js');
const mockPath = path.join(__dirname, '..', 'data', 'dynamic', 'mock-content.js');

function resetModules() {
  delete require.cache[require.resolve(flagsPath)];
  delete require.cache[require.resolve(loaderPath)];
  delete require.cache[require.resolve(mockPath)];
  delete global.DynamicContentFlags;
  delete global.DynamicContentFlagService;
  delete global.DynamicContentLoader;
  delete global.MockDynamicContent;
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

  const mockFlagOffResult = await loader.loadDynamicContent(
    'lesson-01',
    () => ({ source: 'fallback', reason: 'mock-off' }),
    {}
  );

  assert.deepStrictEqual(mockFlagOffResult, {
    source: 'fallback',
    reason: 'mock-off'
  });

  resetModules();
  global.DynamicContentFlags = {
    enabled: true,
    debug: false,
    useMockDynamicContent: true
  };
  require(flagsPath);
  loader = require(loaderPath);

  const mockResult = await loader.loadDynamicContent(
    'lesson-01',
    () => ({ source: 'fallback', reason: 'mock-missing' }),
    {}
  );

  assert.strictEqual(mockResult.id, 'lesson-01');
  assert.strictEqual(mockResult.type, 'lesson');
  assert.strictEqual(mockResult.source, 'mock');
  assert.strictEqual(Array.isArray(mockResult.blocks), true);
  assert.strictEqual(mockResult.blocks[0].type, 'callout');

  resetModules();
  global.DynamicContentFlags = { enabled: true, debug: false };
  require(flagsPath);
  loader = require(loaderPath);

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

  const firestoreFlagOffResult = await loader.loadDynamicContent(
    'lesson-01',
    () => ({ source: 'fallback', reason: 'firestore-flag-off' }),
    {
      firestoreProvider: {
        read: async () => ({ source: 'dynamic-read' })
      }
    }
  );

  assert.deepStrictEqual(firestoreFlagOffResult, {
    source: 'fallback',
    reason: 'firestore-flag-off'
  });

  resetModules();
  global.DynamicContentFlags = {
    enabled: true,
    debug: false,
    useFirestoreReadOnly: true
  };
  require(flagsPath);
  loader = require(loaderPath);

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

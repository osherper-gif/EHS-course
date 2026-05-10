const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sensitiveFiles = [
  'firebase.json',
  '.firebaserc',
  'firestore.rules',
  'js/auth.js',
  'js/firebase-config.js'
];
const dynamicCodeFiles = [
  'js/dynamic-content-flags.js',
  'js/dynamic-content-loader.js',
  'js/dynamic-content-renderer.js',
  'js/lesson-01-dynamic-hook.js',
  'data/dynamic/mock-content.js'
];
const forbiddenWritePatterns = [
  'setDoc',
  'addDoc',
  'updateDoc',
  'deleteDoc',
  '.set(',
  '.add(',
  '.update(',
  '.delete('
];
const forbiddenAdminPatterns = [
  'admin',
  'Admin',
  'isAdmin',
  'adminOnly',
  'contentManager',
  'ContentManager'
];
const forbiddenDeployPatterns = [
  'firebase deploy',
  'firebase.cmd deploy',
  'deploy --only',
  'production'
];

function runCommand(command, args, options = {}) {
  const output = execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: options.stdio || 'pipe',
    shell: process.platform === 'win32' && command.endsWith('.cmd')
  });

  return output ? output.trim() : '';
}

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function checkWorkingTree() {
  const status = runCommand('git', ['status', '--short']);

  if (status) {
    console.warn('Working tree is not clean before readiness check:');
    console.warn(status);
  } else {
    console.log('Working tree is clean before readiness check.');
  }
}

function checkSensitiveFilesUnchanged() {
  const changedSensitiveFiles = runCommand('git', ['diff', '--name-only', '--', ...sensitiveFiles])
    .split(/\r?\n/)
    .filter(Boolean);

  assert.deepStrictEqual(
    changedSensitiveFiles,
    [],
    `Sensitive files changed: ${changedSensitiveFiles.join(', ')}`
  );
}

function checkDefaultFlags() {
  delete global.DynamicContentFlags;
  delete global.DynamicContentFlagService;

  const flagsPath = path.join(root, 'js', 'dynamic-content-flags.js');
  delete require.cache[require.resolve(flagsPath)];

  const flags = require(flagsPath);
  const current = flags.getDynamicContentFlags();

  assert.strictEqual(current.enabled, false, 'enabled flag must be false by default');
  assert.strictEqual(current.useMockDynamicContent, false, 'useMockDynamicContent must be false by default');

  if (Object.prototype.hasOwnProperty.call(current, 'useFirestoreReadOnly')) {
    assert.strictEqual(
      current.useFirestoreReadOnly,
      false,
      'useFirestoreReadOnly must be false by default'
    );
  }
}

function checkForbiddenPatterns(files, patterns, label) {
  const findings = [];

  for (const relativePath of files) {
    if (!fs.existsSync(path.join(root, relativePath))) {
      continue;
    }

    const text = readProjectFile(relativePath);

    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        findings.push(`${relativePath}: ${pattern}`);
      }
    }
  }

  assert.deepStrictEqual(findings, [], `${label} patterns found: ${findings.join(', ')}`);
}

function runRegressionChecks() {
  const checks = [
    ['node', ['scripts/check-dynamic-loader.js']],
    ['node', ['scripts/check-lesson-01-static-fallback.js']],
    ['node', ['scripts/check-lesson-01-dynamic-preview.js']],
    ['npm.cmd', ['run', 'check:links']]
  ];

  for (const [command, args] of checks) {
    console.log(`Running ${command} ${args.join(' ')}`);
    runCommand(command, args, { stdio: 'inherit' });
  }
}

function run() {
  checkWorkingTree();
  checkSensitiveFilesUnchanged();
  checkDefaultFlags();
  checkForbiddenPatterns(dynamicCodeFiles, forbiddenWritePatterns, 'Write API');
  checkForbiddenPatterns(dynamicCodeFiles, forbiddenAdminPatterns, 'Admin logic');
  checkForbiddenPatterns(dynamicCodeFiles, forbiddenDeployPatterns, 'Deploy command');
  runRegressionChecks();

  console.log('Dynamic readiness safety check passed');
}

run();

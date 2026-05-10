# Dynamic Phase 1 Checkpoint

## Scope

This checkpoint documents the current state of the dynamic-app foundation branch after wiring the read-only dynamic content loader to `pages/lesson-01.html` behind a disabled-by-default feature flag.

No deploy was performed. Production was not changed.

## Commits Completed So Far

Commits on `codex/dynamic-app-foundation` since `post-cleanup-safe-point`:

- `72e6bc6` - `chore: initialize dynamic app foundation notes`
- `6cde170` - `docs: define dynamic app data model`
- `f540800` - `docs: define dynamic implementation architecture`
- `5ebd21a` - `docs: add dynamic migration plan`
- `7857805` - `docs: define dynamic data contracts`
- `4cec551` - `docs: plan phase 1 read-only dynamic loader`
- `62b66cb` - `fix: restore dynamic worktree link dependencies`
- `5dfa5d4` - `feat: add read-only dynamic content loader skeleton`
- `3e1b2a6` - `feat: wire dynamic loader to lesson 01 behind flag`
- `1ee2f4b` - `test: verify lesson 01 static fallback with dynamic loader`

## What Works Now

### Read-Only Loader

`js/dynamic-content-loader.js` provides a read-only loading skeleton.

Current behavior:

- returns fallback immediately when dynamic loading is disabled
- returns fallback when dynamic data is empty
- returns fallback when loading throws
- returns fallback when no read-only provider is available
- rejects provider shapes that expose write-like methods
- does not write to Firestore
- does not include admin logic

### Feature Flag Disabled by Default

`js/dynamic-content-flags.js` keeps dynamic loading disabled by default.

Default state:

- `enabled: false`
- `debug: false`

This means the current site behavior remains static unless a future approved flag enables dynamic behavior.

### Lesson 01 Pilot Connection

`pages/lesson-01.html` now loads:

- `../js/dynamic-content-flags.js`
- `../js/dynamic-content-loader.js`

It includes a minimal probe for:

- `lesson-01`

The probe does not replace content, does not render dynamic content, and does not mutate the page.

### Static Fallback Works

When the feature flag is disabled:

- the static Lesson 01 content remains visible
- the source hub remains available
- the dynamic probe returns fallback
- no DOM replacement occurs

### No Required Firebase Dependency

The current loader and tests do not require Firebase to exist.

If no provider exists, the loader returns fallback.

## Existing Tests

### `scripts/check-dynamic-loader.js`

Verifies:

- dynamic disabled returns fallback
- exceptions return fallback
- null or empty dynamic data returns fallback
- no required Firebase dependency
- write-capable provider shape is rejected
- read-only provider can return dynamic data when enabled

### `scripts/check-lesson-01-static-fallback.js`

Verifies:

- `pages/lesson-01.html` exists
- dynamic flag and loader scripts are referenced
- feature flag is disabled by default
- static Lesson 1 content still exists
- static source hub marker still exists
- Firebase is not required for the fallback path
- no write calls are attempted
- the inline probe does not replace static DOM markers when disabled

## Files Changed in Phase 1

Phase 1 implementation and support files:

- `js/dynamic-content-flags.js`
- `js/dynamic-content-loader.js`
- `scripts/check-dynamic-loader.js`
- `pages/lesson-01.html`
- `scripts/check-lesson-01-static-fallback.js`

Supporting worktree dependency restoration:

- `pages/field-tools.html`
- `js/lesson-source-hub.js`

Planning and architecture docs:

- `docs/dynamic-app-next-steps.md`
- `docs/dynamic-data-model.md`
- `docs/dynamic-implementation-architecture.md`
- `docs/dynamic-migration-plan.md`
- `docs/dynamic-data-contracts.md`
- `docs/dynamic-phase-1-readonly-loader-plan.md`

## Not Done Yet

The following have not been implemented:

- no real Firestore reads
- no Firestore writes
- no admin UI
- no content manager
- no migration scripts
- no dynamic data fixture
- no additional connected pages
- no deploy
- no production activation
- no change to Firebase/Auth/Firestore/deploy configuration

## Open Risks

- The loader is currently a skeleton and has not rendered real dynamic content.
- The first dynamic data shape has not yet been validated against an actual fixture.
- `lesson-01.html` contains only a passive probe; future rendering must be carefully scoped.
- If Firestore read mode is added later, rules and cost controls must be reviewed before use.
- Question exposure strategy remains unresolved.
- Production enablement requires manual review and explicit approval.

## Decision Needed for Next Step

### Option A: Add Local Dynamic Mock Data Only

Add one local fixture for `lesson-01` or another pilot page and validate read-only dynamic loading without Firestore.

Recommended if the goal is lowest risk.

### Option B: Add Firestore Read-Only Behind Flag

Add optional Firestore read support behind a disabled-by-default staging flag.

Requires review of config, rules impact, and cost behavior before implementation.

### Option C: Connect Another Page

Connect one additional pilot page behind the same disabled-by-default behavior.

Useful only after Lesson 01 is reviewed.

### Option D: Stop and Review

Pause implementation and perform manual review of:

- data contracts
- loader behavior
- fallback guarantees
- next pilot choice

Recommended before any Firestore-related work.

## Current Recommendation

Choose Option A next: add local dynamic mock data only. This keeps Phase 1 read-only, local, testable, and independent of Firebase.

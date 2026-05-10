# Dynamic Phase 1 Mock and Extractor Summary

## Purpose

This document summarizes the dynamic-app foundation work after adding local mock content, a small preview renderer, an external Lesson 01 hook, and a local extractor that produces a JSON preview from the static Lesson 01 page.

This is a checkpoint before any possible Firestore read-only planning.

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
- `de484e6` - `docs: add dynamic phase 1 checkpoint`
- `37fe8bd` - `test: add local mock dynamic content path`
- `e37c9d0` - `feat: render mock dynamic preview for lesson 01`
- `779585b` - `docs: add dynamic mock preview checkpoint`
- `bd23ea8` - `fix: move lesson 01 dynamic hook out of inline script`
- `5741572` - `chore: add lesson 01 dynamic preview extractor`

## Technical State

### Dynamic Loader

`js/dynamic-content-loader.js` provides a read-only loader.

It supports:

- disabled-by-default fallback
- optional local mock content
- optional read-only provider shape
- fallback on errors
- fallback on missing or empty dynamic data
- rejection of write-capable provider shapes

### Flags

`js/dynamic-content-flags.js` defines runtime flags.

Defaults:

```json
{
  "enabled": false,
  "debug": false,
  "useMockDynamicContent": false
}
```

### Mock Content

`data/dynamic/mock-content.js` contains one local mock document for `lesson-01`.

It is local-only and does not depend on Firebase.

### Renderer

`js/dynamic-content-renderer.js` renders a small preview into a dedicated container.

Supported block types:

- `callout`
- `paragraph`
- `internalLink`

Unknown block types are ignored.

### Lesson 01 External Hook

`js/lesson-01-dynamic-hook.js` contains the Lesson 01 dynamic preview hook.

Important:

- no inline script is used
- CSP is not changed
- the hook renders only into `#dynamic-content-preview`
- the static lesson content is not replaced
- when flags are off, the preview remains hidden

### Lesson 01 Extractor

`scripts/extract-lesson-01-dynamic-preview.js` reads:

- `pages/lesson-01.html`

It writes:

- `docs/dynamic-lesson-01-preview.json`

Current extracted result:

- `24` blocks
- `0` warnings

### Preview JSON

`docs/dynamic-lesson-01-preview.json` is a local preview artifact for review and validation.

It includes:

- `id`
- `type`
- `title`
- `source`
- `extractedAt`
- `sourcePath`
- `blocks`
- `warnings`

## Existing Tests

### `scripts/check-dynamic-loader.js`

Checks:

- disabled dynamic loading returns fallback
- exceptions return fallback
- empty dynamic data returns fallback
- no Firebase dependency
- no write APIs are called
- mock flag off returns fallback
- mock flag on returns local mock document
- read-only provider works when enabled

### `scripts/check-lesson-01-static-fallback.js`

Checks:

- `lesson-01.html` references the external hook
- old inline dynamic hook is absent
- dynamic flags, loader, and renderer scripts are present
- feature flags are disabled by default
- static Lesson 01 markers are still present
- no Firebase dependency is required for fallback
- no writes occur

### `scripts/check-lesson-01-dynamic-preview.js`

Checks:

- preview container exists and is hidden by default
- mock and renderer scripts are referenced
- flags off means preview stays hidden
- mock flags on means preview renders
- static content remains present
- no Firebase dependency is required
- no write calls occur

### `scripts/extract-lesson-01-dynamic-preview.js`

Checks and produces:

- reads static Lesson 01 HTML
- extracts title and content blocks
- writes local JSON preview
- verifies a title exists
- verifies at least one block exists
- verifies no broken debug tokens such as `undefined`, `NaN`, or object-string artifacts appear in the JSON

## Safety State

Current safety guarantees:

- no Firestore reads
- no Firestore writes
- no admin UI
- no content manager
- no deploy
- no production change
- flags are disabled by default
- no change to Firebase/Auth/Firestore/deploy config
- no change to `firestore.rules`
- no change to `firebase.json`
- no change to `.firebaserc`
- no change to `js/auth.js`
- no change to `js/firebase-config.js`

## Manual Local Test Procedure

Default static fallback check:

1. Open `pages/lesson-01.html` locally.
2. Confirm the regular static lesson content appears.
3. Confirm the dynamic preview is hidden.
4. Confirm no console errors appear.

Mock preview development-only check:

1. Before the dynamic scripts run, set:

```html
<script>
  window.DynamicContentFlags = {
    enabled: true,
    debug: true,
    useMockDynamicContent: true
  };
</script>
```

2. Open `pages/lesson-01.html` locally.
3. Confirm a small dynamic preview appears in `#dynamic-content-preview`.
4. Confirm the main static lesson content remains visible and unchanged.

Important:

- Do not enable these flags by default.
- Do not enable mock preview in production.
- Do not use mock content as a real content source.

## Open Risks

- The mock content is intentionally small and does not represent the full Lesson 01 structure.
- The extractor is heuristic and should be reviewed before scaling to other lessons.
- The renderer supports only a small block subset.
- The JSON preview is useful for review but is not yet a validated migration format.
- Browser manual QA is still recommended before any staging deploy.
- Firestore read-only mode requires separate design review.

## Decisions Before Firestore

Before any Firestore read-only implementation, decide:

- Should read-only Firestore be allowed behind a disabled-by-default flag?
- Should collections exist only in staging first?
- Are Firestore rules required before even read-only testing?
- Should course hosting be separated from EHS hosting targets before deploy?
- Should question content remain client-side or be protected?
- Should Content Manager remain local/staging-only at first?

## Recommended Next Step

Recommended path:

1. Create a Firestore read-only design document only.
2. Do not implement Firestore yet.
3. Review collection names, rules impact, cost behavior, and fallback guarantees.

Alternative safe paths:

- expand mock to one additional page
- improve local extractor validation
- perform staging review without deploy

Avoid:

- enabling Firestore reads before review
- adding writes
- changing rules
- changing deploy config
- enabling dynamic mode by default

# Dynamic Mock Preview Checkpoint

## Purpose

This checkpoint documents the state after adding local mock dynamic content and an experimental preview renderer for `pages/lesson-01.html`.

No deploy was performed. Production was not changed. Firebase/Auth/Firestore/deploy config were not changed.

## What Exists Now

### Dynamic Loader

`js/dynamic-content-loader.js` provides a read-only dynamic loading path.

Current guarantees:

- no writes
- no admin logic
- no required Firebase dependency
- fallback on disabled flags
- fallback on missing data
- fallback on errors
- fallback when no read-only provider exists

### Flags Disabled by Default

`js/dynamic-content-flags.js` keeps all dynamic flags disabled by default:

```json
{
  "enabled": false,
  "debug": false,
  "useMockDynamicContent": false
}
```

### Local Mock Content

`data/dynamic/mock-content.js` contains one local mock document for:

- `lesson-01`

The mock document includes:

- `id`
- `type`
- `title`
- `version`
- `source`
- `updatedAt`
- one small `callout` block

It is local-only and does not use Firestore.

### Experimental Renderer

`js/dynamic-content-renderer.js` renders a small preview into a dedicated container.

Supported block types:

- `callout`
- `paragraph`
- `internalLink`

Unknown block types are ignored.

### Lesson 01 Pilot

`pages/lesson-01.html` is the only connected pilot page.

It includes:

- dynamic flags script
- local mock content script
- dynamic loader script
- dynamic renderer script
- hidden preview container

The preview is rendered only when both dynamic flags are enabled:

- `enabled: true`
- `useMockDynamicContent: true`

When flags are disabled, the preview remains hidden and static content is not replaced.

## Files Added or Changed in This Stage

Added:

- `data/dynamic/mock-content.js`
- `js/dynamic-content-renderer.js`
- `scripts/check-lesson-01-dynamic-preview.js`

Changed:

- `js/dynamic-content-loader.js`
- `js/dynamic-content-flags.js`
- `scripts/check-dynamic-loader.js`
- `pages/lesson-01.html`

## Existing Tests

### `scripts/check-dynamic-loader.js`

Covers:

- disabled dynamic loading returns fallback
- exceptions return fallback
- empty dynamic data returns fallback
- no Firebase dependency
- no write APIs are called
- mock flag off returns fallback
- mock flag on returns the local mock document

### `scripts/check-lesson-01-static-fallback.js`

Covers:

- `lesson-01.html` still has static content
- dynamic scripts are present
- feature flag is disabled by default
- fallback path does not require Firebase
- static DOM markers remain unchanged
- no write calls occur

### `scripts/check-lesson-01-dynamic-preview.js`

Covers:

- preview container exists and is hidden by default
- mock and renderer scripts are referenced
- flags disabled means preview stays hidden
- mock flags enabled means preview is rendered
- static lesson content remains present
- no Firebase dependency
- no write calls occur

### `npm.cmd run check:links`

Covers:

- internal link integrity across HTML pages

## How to Enable Mock Preview in Development Only

The mock preview should be enabled only for local/staging development review.

Before the dynamic scripts run, set:

```html
<script>
  window.DynamicContentFlags = {
    enabled: true,
    debug: true,
    useMockDynamicContent: true
  };
</script>
```

Important:

- Do not enable this by default.
- Do not enable it in production without explicit approval.
- Do not use it as a real content source.
- The preview is only a local mock rendering path.

## What Does Not Exist Yet

Not implemented:

- Firestore read
- Firestore write
- admin UI
- content manager
- migration script
- dynamic import pipeline
- dynamic rendering for additional pages
- production activation
- deploy

## Open Risks

- The mock content is intentionally tiny and does not validate full lesson structure.
- The renderer is experimental and supports only a small block set.
- The preview path is not yet connected to a real content schema validator.
- Browser-level testing should be added before any broader rollout.
- Future Firestore read mode needs explicit review for cost, rules, and fallback behavior.
- Production must remain static unless manually approved.

## Decisions for Next Stage

### Option A: Add Firestore Read-Only Behind Flag

Adds a real cloud read path, still disabled by default.

Requires:

- review of Firestore rules
- review of config impact
- staging-only test plan
- cost review

### Option B: Expand Mock to One More Page

Adds a second local-only pilot, for example ISO 45001 or another lesson.

Lower risk than Firestore.

### Option C: Add Local Import Script Only

Creates a local script to convert static content into a mock/fixture format.

No Firestore, no writes, no deploy.

### Option D: Stop for Review

Pause implementation and review:

- flags
- fallback behavior
- renderer output
- mock data shape
- next pilot choice

## Recommendation

Proceed with Option C or Option D before any Firestore work.

The safest next technical step is a local-only fixture/import validation path. Firestore read-only should wait until data shape, validation, and review flow are stable.

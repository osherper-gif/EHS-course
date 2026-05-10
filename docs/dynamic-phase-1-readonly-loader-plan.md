# Phase 1 Plan: Read-Only Dynamic Content Loader

## Purpose

Phase 1 introduces a read-only dynamic content loading path with full static fallback. The goal is to prove that selected learning content can be loaded from a structured data source without breaking the existing static site.

This phase is intentionally conservative:

- no writes
- no admin features
- no production changes
- no required Firebase dependency
- no loss of static fallback

## 1. Goal of Phase 1

The goal is to implement a small, isolated dynamic loader that can:

- load structured content for one pilot page
- validate the content shape before rendering
- render the content in the existing learning UI style
- fall back to the static page if dynamic content is unavailable or invalid
- run disabled by default
- be tested locally and on staging only

Phase 1 should answer one question:

Can the site safely render a selected lesson, law, or standard from structured data while preserving the static experience as fallback?

## 2. Out of Scope for Phase 1

Phase 1 must not include:

- Firestore writes
- admin content manager
- editing UI
- user progress
- login requirement
- changes to Auth
- changes to Firestore rules
- production deploy
- migration scripts
- full site conversion
- replacing static pages
- removing current HTML content
- changing Firebase project configuration

## 3. First Pilot Pages

### Recommended Pilot

Recommended first option:

- one standard page: `pages/iso-45001-2018.html`

Reasons:

- It has a clear topic boundary.
- It has structured clauses and diagrams.
- It is less tied to legal wording than law/ordinance pages.
- It can validate long-form content rendering without changing the whole course.

### Alternative Pilot

Alternative first option:

- one lesson page: `pages/lesson-01.html`

Reasons:

- It is foundational course content.
- It has many reusable learning patterns.
- It can test sections, diagrams, tables, and practice cards.

### Not Recommended as First Pilot

Avoid as first pilot:

- `index.html`
- `pages/syllabus.html`
- all lessons at once
- all legal pages at once
- EHS pages
- production homepage or portal pages

## 4. Files Allowed to Change in Phase 1

Allowed only after explicit implementation approval:

- a new local data fixture, for example:
  - `data/dynamic/iso-45001-2018.json`
  - or `data/dynamic/lesson-01.json`
- a new read-only loader module, for example:
  - `js/dynamic-content-loader.js`
- a new renderer module if needed:
  - `js/dynamic-content-renderer.js`
- one pilot page only:
  - `pages/iso-45001-2018.html`
  - or `pages/lesson-01.html`
- documentation for the pilot:
  - `docs/dynamic-phase-1-results.md`

Preferred approach:

- Add new files rather than rewriting existing systems.
- Change only one pilot page.
- Keep the existing static HTML available in the same page or as a fallback route.

## 5. Files Not to Change Without Approval

The following files and areas must not be changed without explicit approval:

- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `js/auth.js`
- `js/firebase-config.js`
- production config
- production deploy settings
- production Firebase project selection
- `index.html`
- EHS module files
- existing authentication flow
- existing Firestore data paths

## 6. Proposed Service or Module

### Module Name

Suggested module:

- `DynamicContentLoader`

### Responsibility

The loader should:

- operate read-only
- prefer static fallback unless the feature flag is enabled
- load a structured local fixture first
- optionally support Firestore reads in a later phase
- never write content
- never require admin permissions
- never block the page if dynamic loading fails

### Conceptual API

This is a contract description only, not code:

- `isDynamicContentEnabled()`
- `loadDynamicContent(contentType, contentId)`
- `validateDynamicContent(contentType, content)`
- `renderOrFallback(contentType, contentId, fallbackElement)`
- `getStaticFallback(contentType, contentId)`

### Read-Only Guarantees

Phase 1 module must not:

- call write APIs
- create or update Firestore documents
- modify Auth state
- require login
- mutate production data
- replace static content permanently

## 7. Fallback Strategy

### Static First

Default behavior:

- static page loads normally
- dynamic loading is disabled
- user sees the current static content

### Feature Flag Enabled

When enabled:

1. Static page loads first.
2. Loader attempts to load dynamic fixture.
3. Loader validates content.
4. If valid, dynamic content may render in a controlled container.
5. If invalid, static content remains visible.

### Firestore Optional

Firestore is not required in Phase 1.

If Firestore support is added later:

- it must be read-only
- it must be feature-flagged
- it must be staging-only first
- failure must fall back to static content

### Failure Scenarios

If dynamic fixture is missing:

- keep static content
- log a non-blocking warning in staging

If data shape is invalid:

- keep static content
- record validation failure in test output

If network or Firestore is unavailable:

- keep static content
- no broken page

If user is not logged in:

- static public content still works
- no login prompt is required for Phase 1

## 8. Feature Flag Proposal

### Default State

The feature flag must be disabled by default.

Suggested flag:

- `dynamicContentEnabled`

Possible locations for later implementation:

- local config object
- URL parameter for local/staging testing
- localStorage flag for developer testing
- staging-only configuration file

### Staging Only

The flag should be considered staging-only until approved.

Rules:

- production must not enable dynamic rendering without approval
- static fallback must remain available
- tests must cover flag on and flag off

## 9. Required Tests

### Content Parity

For the pilot page:

- section count matches expected source
- titles match expected source
- content blocks are not empty
- legal/standard numbering is preserved
- practice card remains available

### Link Tests

- internal links still resolve
- practice buttons still route correctly
- field tools link still works
- search result route still works

### Console Tests

- no console errors with feature flag off
- no console errors with feature flag on
- validation warnings are non-blocking in staging

### Mobile Tests

- dynamic content respects RTL
- tables stay inside responsive wrappers
- accordions remain usable
- header does not hide anchors
- hero/buttons are not cut off

### Offline and Fallback Tests

- page loads without dynamic fixture
- page loads if dynamic validation fails
- page loads if Firestore is unavailable
- static content remains visible

### Firestore Unavailable Test

Even before Firestore is connected, define expected behavior:

- no crash
- no blank page
- no blocking error
- static fallback stays active

## 10. Rollback Plan

### Fast Rollback

- disable the feature flag
- leave static pages as-is
- remove only the dynamic loader script reference from the pilot page if needed

### Content Rollback

- restore previous local fixture version
- do not remove static page content
- keep dynamic fixture unpublished until valid

### Deploy Rollback

If Phase 1 is ever deployed to staging:

- use staging rollback if needed
- do not involve production

Production rollback should not be needed because Phase 1 must not be deployed to production without approval.

## 11. Acceptance Criteria

Phase 1 is accepted only if:

- exactly one pilot page is dynamic-capable
- static behavior remains unchanged with the feature flag off
- dynamic rendering works with the feature flag on
- invalid dynamic data falls back safely
- missing dynamic data falls back safely
- no Firestore writes exist
- no Auth changes exist
- no Firebase config changes exist
- no production deploy occurred
- link checks pass
- console checks pass
- mobile checks pass
- content parity checks pass for the pilot

## Recommended Next Step

Before writing code, choose one pilot:

1. `pages/iso-45001-2018.html`
2. `pages/lesson-01.html`

Recommendation:

Start with `pages/iso-45001-2018.html` and a local JSON fixture, because it is bounded, structured, and suitable for testing long-form dynamic rendering without changing the core course homepage.

# Firestore Read-Only Dynamic Loading Design

## Purpose

This document defines a planning-only design for a future Firestore read-only content loading path behind feature flags.

No code is implemented here. No Firebase config, Auth, Firestore rules, deploy config, or production settings are changed.

## 1. Goal of the Phase

The goal is to allow a single pilot page, currently `lesson-01`, to optionally read structured dynamic content from Firestore in staging while preserving the existing static page as the default and fallback behavior.

This phase should prove:

- Firestore content can be read safely.
- Static fallback remains available.
- Mock local content remains useful for local testing.
- Feature flags control all dynamic behavior.
- No write path is introduced.

## 2. Why Read-Only Only

Read-only is required because the current dynamic foundation is still experimental.

Reasons:

- Content contracts are still being reviewed.
- Firestore rules have not been reviewed for admin writes.
- Content Manager does not exist yet.
- There is no approved audit trail for content changes.
- Production activation is not approved.
- The lowest-risk next step is to validate reads and fallback behavior only.

Read-only means:

- no `add`
- no `set`
- no `update`
- no `delete`
- no admin mutation UI
- no migration writes
- no production writes

## 3. First Collections for Experiment

Recommended first staging-only collection:

- `dynamicLessons`

Recommended first document:

- `dynamicLessons/lesson-01`

Why this collection:

- It is narrow and easy to test.
- It avoids changing the existing static lesson route.
- It can be validated against `docs/dynamic-lesson-01-preview.json`.
- It maps cleanly to the `lessons` contract while keeping the pilot isolated.

Future collections, after review:

- `dynamicLegalSources`
- `dynamicStandards`
- `dynamicQuestions`
- `dynamicGameUnits`
- `dynamicSearchDocuments`
- `contentVersions`

## 4. Example Document for `lesson-01`

Proposed document path:

```text
dynamicLessons/lesson-01
```

Example document:

```json
{
  "id": "lesson-01",
  "type": "lesson",
  "title": "יסודות תורת הבטיחות",
  "status": "published",
  "source": "firestore-readonly-pilot",
  "contentVersion": "lesson-01-firestore-preview-001",
  "sourceHash": "optional-normalized-source-hash",
  "updatedAt": "timestamp",
  "reviewedAt": "timestamp",
  "reviewedBy": "admin-uid-or-manual-review-id",
  "blocks": [
    {
      "id": "lesson-01-firestore-callout-01",
      "type": "callout",
      "title": "בדיקת טעינה מ-Firestore",
      "body": "תוכן בדיקה לקריאה בלבד. התוכן הסטטי של השיעור נשאר זמין."
    }
  ],
  "warnings": []
}
```

Required validation:

- `id` must equal `lesson-01`.
- `type` must equal `lesson`.
- `status` must be `published` for regular display.
- `blocks` must be a non-empty array.
- each block must have `id` and `type`.
- unsupported blocks are ignored by the renderer.
- malformed documents trigger static fallback.

## 5. Loader Selection Order

The loader should choose content in this order:

### Default

If `enabled` is false:

1. Return static fallback immediately.
2. Do not attempt mock or Firestore.

### Mock Mode

If:

- `enabled` is true
- `useMockDynamicContent` is true

Then:

1. Try local mock content.
2. If mock content is valid, return it.
3. If mock content is missing or malformed, return static fallback.
4. Do not read Firestore.

### Firestore Read-Only Mode

If:

- `enabled` is true
- `useMockDynamicContent` is false
- `useFirestoreReadOnly` is true

Then:

1. Try Firestore read-only provider.
2. Validate the document.
3. If valid and published, return document.
4. If unavailable, denied, malformed, empty, or unpublished, return static fallback.

### Fallback Always Available

Static fallback must remain the final result for every failure path.

## 6. Required Feature Flags

Proposed flags:

```json
{
  "enabled": false,
  "useMockDynamicContent": false,
  "useFirestoreReadOnly": false,
  "debug": false
}
```

Rules:

- all flags are false by default
- `enabled` gates all dynamic behavior
- `useMockDynamicContent` and `useFirestoreReadOnly` should not both be active for the same test
- `debug` may log non-sensitive diagnostics in local/staging only
- production must not enable these flags without explicit approval

## 7. Safety Rules

Mandatory safety rules:

- no writes
- no admin UI
- no production activation
- staging only
- fallback always available
- no change to production config
- no change to `.firebaserc`
- no change to `firebase.json`
- no change to `firestore.rules` without separate review and diff
- no change to `js/auth.js`
- no change to `js/firebase-config.js` without separate approval
- no broad collection scans
- no real-time listeners in the first read-only phase

## 8. Firestore Rules Review

Do not change `firestore.rules` in this phase.

Before implementation, review whether current staging rules allow safe read-only access to:

```text
dynamicLessons/{lessonId}
```

Questions for review:

- Should `published` documents be publicly readable?
- Should draft/review documents be admin-only?
- Should rules filter by `status == "published"`?
- Should staging use a separate collection prefix?
- Should production rules block all dynamic reads until approved?

If rules changes are needed, prepare a separate diff and do not apply it without approval.

## 9. Firebase Config Review

Do not change `js/firebase-config.js` in this phase.

Before implementation, confirm:

- the dynamic branch points only to staging during tests
- no production project is selected accidentally
- existing Firebase initialization can be reused safely, if needed
- Firestore read-only support does not require changing project config

If config changes are required, stop and request approval before editing.

## 10. Required Tests

### Firestore Unavailable

Simulate no provider or failed initialization.

Expected:

- static fallback
- no console error for users
- optional debug warning only if `debug` is true

### Permission Denied

Simulate Firestore permission denied.

Expected:

- static fallback
- no blank page
- no crash

### Malformed Document

Document exists but does not match contract.

Expected:

- static fallback
- validation warning in debug/staging

### Empty Document

Document is missing, null, or empty object.

Expected:

- static fallback

### Fallback

With all flags off:

- page remains static
- preview hidden
- no Firestore attempt

### No Console Errors

Tests should verify:

- no CSP violation
- no Firebase initialization error exposed to user
- no unhandled promise rejection
- no missing script errors

## 11. Rollback Plan

Fast rollback:

1. Disable `enabled`.
2. Ensure `useFirestoreReadOnly` is false.
3. Keep static page content.
4. Remove Firestore script reference only if needed.

Content rollback:

- revert to static fallback
- ignore Firestore document version
- keep document for review if safe

Deploy rollback:

- not applicable until staging deploy is explicitly approved
- production deploy must not happen in this phase

## 12. Open Decisions Before Implementation

Decisions required:

- Should `dynamicLessons` be the first collection name?
- Should Firestore documents be public read if `status == "published"`?
- Should staging use a separate collection such as `stagingDynamicLessons`?
- Should `useFirestoreReadOnly` be controlled by URL, localStorage, or static config?
- Should Firestore reads use one-time `getDoc` only?
- Should `lesson-01` read full blocks or only preview blocks?
- Should EHS and course hosting targets be separated before any deploy involving dynamic features?
- Should rules changes be designed before any code implementation?

## Recommendation

Before writing code, create a separate rules/config review note. The next implementation step should still be local/staging-only, disabled by default, and limited to one document: `dynamicLessons/lesson-01`.

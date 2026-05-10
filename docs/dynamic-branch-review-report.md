# Dynamic Branch Review Report

## Scope

Manual and technical review of `codex/dynamic-app-foundation` before any real Firestore read-only implementation.

No deploy was performed. Production was not changed. Firebase/Auth/Firestore/deploy config were not changed.

## Working Tree

At the start of review:

- `git status --short` was clean.

After creating this report:

- only this report should be staged/committed.

## Recent Commits

Latest commits reviewed:

- `9745d66` - `docs: add Firestore read-only go no-go checklist`
- `5070907` - `chore: add Firestore read-only feature flag`
- `aab7e67` - `test: add dynamic readiness safety check`
- `6c048d4` - `docs: design Firestore read-only dynamic loading`
- `9afdb9f` - `docs: summarize dynamic mock extractor phase`
- `5741572` - `chore: add lesson 01 dynamic preview extractor`
- `bd23ea8` - `fix: move lesson 01 dynamic hook out of inline script`
- `779585b` - `docs: add dynamic mock preview checkpoint`
- `e37c9d0` - `feat: render mock dynamic preview for lesson 01`
- `37fe8bd` - `test: add local mock dynamic content path`
- `de484e6` - `docs: add dynamic phase 1 checkpoint`
- `1ee2f4b` - `test: verify lesson 01 static fallback with dynamic loader`
- `3e1b2a6` - `feat: wire dynamic loader to lesson 01 behind flag`
- `5dfa5d4` - `feat: add read-only dynamic content loader skeleton`
- `62b66cb` - `fix: restore dynamic worktree link dependencies`
- `4cec551` - `docs: plan phase 1 read-only dynamic loader`
- `7857805` - `docs: define dynamic data contracts`
- `5ebd21a` - `docs: add dynamic migration plan`
- `f540800` - `docs: define dynamic implementation architecture`
- `6cde170` - `docs: define dynamic app data model`

## Files Reviewed Manually

Reviewed files:

- `docs/firestore-readonly-go-no-go.md`
- `docs/dynamic-firestore-readonly-design.md`
- `docs/dynamic-phase-1-mock-extractor-summary.md`
- `js/dynamic-content-flags.js`
- `js/dynamic-content-loader.js`
- `js/dynamic-content-renderer.js`
- `pages/lesson-01.html`

## Flags

Default flags are disabled:

```json
{
  "enabled": false,
  "debug": false,
  "useMockDynamicContent": false,
  "useFirestoreReadOnly": false
}
```

Review result:

- dynamic behavior is gated by `enabled`
- mock content is gated by `useMockDynamicContent`
- Firestore read-only provider path is gated by `useFirestoreReadOnly`
- all flags are false by default

## Firestore Code Status

There is no real Firestore implementation.

Current code contains:

- no Firebase import
- no Firestore import
- no `getDoc` implementation
- no real collection/document path call
- no network call added by the dynamic branch

The loader contains only an abstract read-only provider path:

- `firestoreProvider.read(topicId)`

This path is not a Firestore SDK implementation and is disabled unless `useFirestoreReadOnly` is explicitly enabled.

## Write API Status

No write APIs were found in the dynamic code path.

Readiness scanning checks for:

- `setDoc`
- `addDoc`
- `updateDoc`
- `deleteDoc`
- `.set(`
- `.add(`
- `.update(`
- `.delete(`

The readiness check passed.

## Firebase/Auth/Firestore/Deploy Config

Checked sensitive files:

- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `js/auth.js`
- `js/firebase-config.js`

Review result:

- no diff detected in these files
- no config/rules/auth changes were made in this branch review
- no deploy was performed

## Lesson 01 Static Fallback

`pages/lesson-01.html` remains a static lesson page by default.

Current behavior:

- static lesson content remains in the page
- dynamic preview container is hidden by default
- external hook is used instead of inline script
- no CSP inline-script violation remains in the tested path
- with flags off, loader returns fallback and does not render preview
- with mock flags on, preview can render into `#dynamic-content-preview`
- static lesson content is not replaced

## Tests Run

Commands run:

- `git status --short`
- `git log --oneline -n 20`
- `node scripts/check-dynamic-readiness.js`
- `node scripts/check-dynamic-loader.js`
- `node scripts/check-lesson-01-static-fallback.js`
- `node scripts/check-lesson-01-dynamic-preview.js`
- `npm.cmd run check:links`

Results:

- readiness check passed
- dynamic loader check passed
- Lesson 01 static fallback check passed
- Lesson 01 dynamic preview check passed
- link check passed with `Missing internal links: 0`

Note:

- `check-dynamic-readiness.js` emits a Node deprecation warning for running `npm.cmd` through shell on Windows. The readiness check still passes.

## Risks Before Firestore

Open risks:

- Firestore staging use has not been approved yet.
- Collection path is not finalized.
- Rules behavior for `published` vs draft/review content is not reviewed.
- Login requirement for dynamic Firestore content is undecided.
- Quota/cost policy is not approved.
- Firestore provider is not implemented or browser-tested.
- Document validation is still minimal.
- Manual browser QA should be performed before any staging deploy.

## Go / No-Go Recommendation

Recommendation: **No-Go for real Firestore implementation until approvals are completed.**

Reason:

- technical foundation is stable
- tests pass
- fallback is protected
- but Firestore environment, rules, collection path, auth requirement, and cost decisions are still open

Allowed next step:

- Go for another documentation/review step
- Go for local/mock-only improvements
- Go for Firestore rules/config review documents

Not recommended yet:

- implementing real Firestore reads
- changing `firestore.rules`
- changing Firebase config
- enabling dynamic mode by default
- deploying to staging or production without a separate approval

# Firestore Read-Only Go / No-Go Checklist

## Purpose

This document defines the decision checkpoint before implementing real Firestore read-only dynamic content loading.

No code is implemented here. No Firebase/Auth/Firestore/deploy config is changed. No deploy is performed.

## 1. Current State

The dynamic foundation currently includes:

- `dynamic loader` exists in `js/dynamic-content-loader.js`
- local mock path exists in `data/dynamic/mock-content.js`
- renderer exists in `js/dynamic-content-renderer.js`
- `lesson-01` is connected as a pilot page
- external hook exists in `js/lesson-01-dynamic-hook.js`
- readiness check exists in `scripts/check-dynamic-readiness.js`
- `useFirestoreReadOnly` exists and is disabled by default

Current default flags:

```json
{
  "enabled": false,
  "debug": false,
  "useMockDynamicContent": false,
  "useFirestoreReadOnly": false
}
```

Current safety state:

- no Firestore reads are implemented
- no Firestore writes exist
- no admin flow exists
- no production activation exists
- static fallback remains the default path

## 2. Missing Before Real Firestore

Before implementing Firestore read-only, the following decisions and reviews are required.

### Staging Firestore Approval

Decision needed:

- Is it approved to read from Firestore in the staging project only?
- Which project/environment is allowed?
- How will accidental production reads be prevented?

### Rules Review

Decision needed:

- Do current `firestore.rules` allow safe read-only access?
- Should only `status == "published"` documents be readable?
- Should draft/review documents remain admin-only?
- Are rules different between staging and production?

No rules change should happen without a separate reviewed diff.

### Login Requirement

Decision needed:

- Can published course content be read without login?
- Should Firestore read-only content require Auth?
- Should the static page remain public even if dynamic content requires login?

### Collection Path

Decision needed:

- Use `dynamicLessons/lesson-01`
- or `stagingDynamicLessons/lesson-01`
- or another staging-only namespace

The first pilot should use one document only.

### Quota and Cost

Decision needed:

- Is one-time `getDoc` acceptable?
- Are real-time listeners explicitly prohibited in Phase 1?
- Should local/session caching be required?
- How many reads are acceptable per page load?

### Fallback

Decision needed:

- Is static fallback mandatory for every failure?
- Should permission denied silently fall back?
- Should malformed documents fall back and log debug only?

Recommendation:

- fallback must always remain available
- no user-facing backend errors in the learning flow

## 3. Go / No-Go Checklist

Answer all items before implementation.

### Environment

- [ ] Firestore read-only is approved for staging.
- [ ] Production is not involved.
- [ ] Project selection is verified before testing.
- [ ] No deploy to production is planned.

### Permissions

- [ ] Firestore reads are allowed only for approved collection/path.
- [ ] Firestore writes are explicitly forbidden.
- [ ] Admin writes are out of scope.
- [ ] Rules review is complete or documented as not required for staging read.

### Configuration

- [ ] No change to `firebase.json`.
- [ ] No change to `.firebaserc`.
- [ ] No change to `firestore.rules` without separate approval.
- [ ] No change to `js/auth.js`.
- [ ] No change to `js/firebase-config.js` without separate approval.

### Runtime Safety

- [ ] `enabled` remains false by default.
- [ ] `useFirestoreReadOnly` remains false by default.
- [ ] static fallback is fully available.
- [ ] permission denied falls back.
- [ ] missing document falls back.
- [ ] malformed document falls back.
- [ ] no console errors are exposed to users.

### Decision

Go only if all of the above are approved.

No-Go if any environment, rules, production, or fallback decision is unresolved.

## 4. Implementation Plan If Go

If the decision is Go, implement in a separate small commit sequence:

1. Add a small read-only service.
   - no writes
   - no admin
   - no real-time listeners
   - one document read only

2. Keep feature flag disabled by default.
   - `enabled: false`
   - `useFirestoreReadOnly: false`

3. Add provider path to loader.
   - read-only provider only
   - validate document before render
   - fallback on all errors

4. Handle failure cases.
   - permission denied
   - document missing
   - empty document
   - malformed document
   - network/provider unavailable

5. Add tests.
   - Firestore unavailable
   - permission denied simulation
   - missing document simulation
   - malformed document simulation
   - fallback path
   - no write API scan
   - no config/rules changes

6. Run readiness.
   - `node scripts/check-dynamic-readiness.js`
   - `npm.cmd run check:links`

## 5. Stop Plan If No-Go

If the decision is No-Go:

- continue mock/local JSON only
- expand local extractor validation
- improve renderer block support
- add another mock page only if needed
- do not add Firestore imports
- do not change rules
- do not change config
- do not deploy

Recommended No-Go work:

- extend extractor to validate block types
- compare static and extracted content counts
- add local fixture for ISO 45001 or another bounded page
- add browser-level preview QA without Firestore

## Recommendation

Do not implement real Firestore read-only until:

- staging project use is explicitly approved
- collection path is approved
- rules impact is reviewed
- cost behavior is reviewed
- fallback behavior is accepted

Until then, continue with local mock and extractor work only.

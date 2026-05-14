# Phase 3 Production-Safe Readiness

Date: 2026-05-14  
Branch: `codex/protected-questions-phase-3-production-safe`  
Base branch: `codex/protected-questions-phase-3-freeze`

## Summary

This branch prepares a production-safe Phase 3 package:

- Auth check
- approval check
- protected preview read-only
- no staging admin approval tool
- no bootstrap self-approval exception
- no Phase 4 / Cloud Functions

## Removed From Runtime

- Removed `admin/staging-user-approval.html`.
- Removed `js/admin/staging-user-approval.js`.
- Removed Firestore rule function `validStagingAdminBootstrap`.
- Removed the self-bootstrap `osherper@gmail.com` exception from the `/users/{uid}` update rule.

## Kept

- `pages/protected-auth-check.html`
- `js/protected-auth-check.js`
- Phase 1 Auth check.
- Phase 2 approval check through `users/{uid}`.
- Phase 3 read-only `protectedQuestionPreviews` loading.
- Firestore rule allowing preview reads only for approved/admin users.
- Firestore rule denying create/update/delete on `protectedQuestionPreviews`.

## Intentionally Not Added

- No `functions/` directory.
- No `validateProtectedAnswer`.
- No submit flow.
- No scoring.
- No timer.
- No redirect behavior.
- No exam engine.
- No `exam-questions.js` dependency in the protected preview flow.

## Verification

| Check | Status | Notes |
| --- | --- | --- |
| `node --check js/protected-auth-check.js` | PASS | Protected preview JS syntax is valid. |
| `npm.cmd run check:links` | PASS | 43 HTML files, 0 missing internal links after admin page removal. |
| No `functions/` directory | PASS | `Test-Path functions` returned `False`. |
| No `validateProtectedAnswer` in runtime | PASS | No runtime occurrence found. |
| No `validStagingAdminBootstrap` in rules | PASS | Removed from `firestore.rules`. |
| No `bootstrapApproved` in runtime/rules | PASS | No runtime/rules occurrence remains. |
| No staging admin page in runtime | PASS | Admin tool files removed from branch. |
| `protectedQuestionPreviews` read-only | PASS | `allow create, update, delete: if false`. |
| Phase 4 absent | PASS | No callable function, no answer-validation UI. |

Historical reports may still mention staging admin tooling or Phase 4 terms. Those files are documentation only and are not runtime code.

## Production GO / NO-GO

Recommendation: **GO WITH LIMITATIONS**.

This branch is suitable for a soft production rollout of Phase 3 only, provided final manual browser checks pass before deploy.

Limitations:

- The protected preview page is standalone and should remain noindex.
- The legacy exam and quiz flows must remain active.
- Phase 3 does not validate answers.
- Manual mobile and Network inspection should be repeated immediately before production deploy.

## Manual Checks Before Production Deploy

1. Guest user does not see preview questions.
2. Approved user sees up to three preview questions.
3. Not-approved user does not see preview and is not incorrectly shown as unauthenticated.
4. Login/logout has no redirect loops.
5. DevTools Network shows no:
   - `correctAnswer`
   - `answerKey`
   - `solution`
   - `isCorrect`
   - `exam-questions.js`
6. Mobile viewport has no horizontal overflow and remains RTL.
7. Legacy quizzes and exam pages still work.

## Recommended Production Deploy Command

Do not run automatically. If final manual checks pass and production approval is given:

```powershell
C:\Users\Administrator\AppData\Roaming\npm\firebase.cmd use ehs-course
C:\Users\Administrator\AppData\Roaming\npm\firebase.cmd deploy --only firestore:rules,hosting
```

## Rollback

If production rollout causes issues:

1. Re-deploy the last known stable production version.
2. Remove public links to `pages/protected-auth-check.html`.
3. Revert the `protectedQuestionPreviews` rule if it causes permission issues.
4. Keep Phase 4 blocked until Blaze/budget alerts and server-side validation are approved.

## Production Status

Production was not changed during this preparation.

# Phase 3 Production Readiness Verification

Date: 2026-05-14  
Branch: `codex/protected-questions-phase-3-freeze`  
Staging URL: `https://ehs-course-staging.web.app/pages/protected-auth-check.html`

## Executive Recommendation

Recommendation: **NO-GO for production as-is**.

Phase 3 itself is stable on staging, but this branch still contains the staging admin approval tool and a Firestore bootstrap exception intended only for staging. Because hosting currently publishes from `"public": "."`, a production deploy of this branch would include `admin/staging-user-approval.html` unless the production deploy is changed to exclude it.

Production should not be deployed from this branch until the staging-only admin tool and bootstrap rule are removed, excluded, or split into a staging-only branch/target.

## Verification Table

| Area | Status | Evidence / Notes |
| --- | --- | --- |
| Guest user does not see preview questions | PASS WITH LIMITATION | Static and staging behavior keep preview behind Auth + approval. Manual guest browser confirmation should still be repeated before any production rollout. |
| Guest user does not see answer data | PASS | Phase 3 has no answer validation and no answer payload. |
| Approved user sees up to 3 preview questions | PASS | Phase 3 was manually verified earlier with `previewQuestionCount: 3`. |
| Approved user does not see answer keys | PASS | No answer keys were visible in UI/debug during manual Phase 3 verification. Static checks found forbidden answer field names only inside deny-list guards. |
| Not-approved user does not see preview | PASS WITH LIMITATION | Logic gates preview loading after approval. Manual not-approved check should be repeated before production. |
| Not-approved user does not remain incorrectly unauthenticated | PASS | Phase 2/3 manual verification confirmed the page did not fall back to an incorrect unauthenticated state. |
| Logout/Login has no redirect loops | PASS | Manual Phase 3 verification reported no redirect loops. |
| No Auth errors | PASS WITH LIMITATION | No `auth/argument-error` was reported in Phase 3 manual verification. CSP source-map warnings may still appear but are not blocking. |
| Network has no `correctAnswer` | PASS | No response payload with answers exists in Phase 3. Static occurrences are deny-list guards only. |
| Network has no `answerKey` | PASS | Static occurrences are deny-list guards only. |
| Network has no `solution` | PASS | Static occurrences are deny-list guards only. |
| Network has no `isCorrect` | PASS | Static occurrences are deny-list guards only. |
| No `exam-questions.js` dependency | PASS | The protected preview flow does not load `exam-questions.js`; `firebase.json` still ignores it for hosting. |
| Mobile sanity: no overflow | NOT FULLY TESTED | Static CSS contains RTL and overflow protections; no live mobile browser screenshot was captured in this verification pass. |
| Mobile sanity: RTL | PASS WITH LIMITATION | The page is `dir="rtl"` and uses existing RTL layout. Manual mobile test should be repeated. |
| Firestore rules: guest blocked | PASS | `protectedQuestionPreviews` read requires admin or approved authenticated user. |
| Firestore rules: approved read-only | PASS | `protectedQuestionPreviews` allows read for approved users/admin and denies create/update/delete. |
| Firestore rules: no writes | PASS | `protectedQuestionPreviews` has `allow create, update, delete: if false`. |
| Admin approval tool staging only | FAIL FOR PRODUCTION AS-IS | Current production URL returns 404 because it has not been deployed, but this branch includes `admin/staging-user-approval.html`; with `hosting.public: "."`, production deploy would serve it. The JS blocks production hostname, but the route would still be publicly reachable. |
| Bootstrap exception staging only | FAIL FOR PRODUCTION AS-IS | `firestore.rules` contains an email-specific bootstrap exception for `osherper@gmail.com`. It is narrow, but Firestore rules do not distinguish staging from production in this branch. |
| CSP source-map warnings only | PASS WITH LIMITATION | Firebase `.map` CSP warnings were previously observed and did not block Auth. Recheck in production-like browser before rollout. |
| Soft launch only | PASS | The protected preview page is standalone and does not replace the primary exam system. |
| Do not replace main exam system | PASS | No legacy exam flow is removed or hidden. |
| Do not hide legacy flows | PASS | Existing quizzes/exam pages remain unchanged. |

## Commands / Checks Run

- `node --check js/protected-auth-check.js`
- `node --check js/admin/staging-user-approval.js`
- `npm.cmd run check:links`
- Static absence check for Phase 4 artifacts:
  - no `functions/`
  - no `validateProtectedAnswer`
  - no `httpsCallable`
  - no `getFunctions`
  - no `protectedQuestionAnswers`
  - no protected-page “בדוק תשובה”
- HTTP checks:
  - `https://ehs-course-staging.web.app/pages/protected-auth-check.html` -> `200`, Phase 3 present, no Validation UI
  - `https://ehs-course-staging.web.app/admin/staging-user-approval.html` -> `200`, bootstrap UI present
  - `https://ehs-course.web.app/admin/staging-user-approval.html` -> `404` currently, because production has not been deployed with this branch

## Known Risks

1. The staging admin tool is included in the branch.
2. The staging bootstrap rule is included in the branch.
3. `hosting.public` is `"."`, so production deploy would publish files under `admin/` unless excluded.
4. Mobile sanity was not fully verified with a real mobile browser in this pass.
5. Phase 3 does not validate answers, by design.

## Rollback Steps

If Phase 3 causes issues after a staging or future production rollout:

1. Revert to the last known static production deploy.
2. Remove or disable links to `pages/protected-auth-check.html`.
3. Revert the `protectedQuestionPreviews` rules if they cause permission issues.
4. Do not deploy the admin approval tool to production.
5. Keep Phase 4 blocked until Blaze/budget alerts and backend validation are approved.

## Production Rollout Plan

Production rollout should be soft-launch only:

- do not replace the main exam system
- do not hide existing quizzes/exam pages
- keep `pages/protected-auth-check.html` standalone/noindex
- do not deploy admin/staging approval tooling to production
- remove or exclude bootstrap rules before production

## Required Before Production GO

To move from NO-GO to GO WITH LIMITATIONS:

1. Exclude `admin/staging-user-approval.html` and `js/admin/staging-user-approval.js` from production hosting, or split staging tools into a staging-only branch/target.
2. Remove `validStagingAdminBootstrap` from production rules.
3. Repeat manual browser checks for:
   - guest
   - approved
   - not-approved
   - logout/login
   - mobile viewport
   - Network answer-leak inspection

## Deploy Command

No production deploy command is recommended yet because this verification is **NO-GO for production as-is**.

Production was not changed.

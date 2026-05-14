# Protected Questions Phase 3 Freeze

Date: 2026-05-14  
Branch: `codex/protected-questions-phase-3-freeze`  
Base branch: `codex/staging-user-approval-tool`

## Freeze Decision

This branch freezes the Protected Questions work at Phase 3:

- Phase 1: standalone Auth check
- Phase 2: approval check with `users/{uid}`
- Phase 3: read-only protected preview questions
- staging admin approval tool, including the limited bootstrap path for the first staging admin

Phase 4 is intentionally excluded from this branch.

## What Works

- `pages/protected-auth-check.html` checks Firebase Auth.
- A signed-in user is checked against `users/{uid}`.
- Approved users can read up to three documents from `protectedQuestionPreviews`.
- The preview page shows only preview-safe fields:
  - question text
  - options
  - difficulty
  - lesson/topic metadata
- The admin staging tool at `admin/staging-user-approval.html` can approve or revoke users for staging tests.
- The bootstrap flow can approve the current `osherper@gmail.com` admin only when the existing user document already has admin role/flag.

## Intentionally Not Included

- No `functions/` directory.
- No `validateProtectedAnswer` callable function.
- No Cloud Functions deployment requirement.
- No “בדוק תשובה” control in the protected preview page.
- No answer validation.
- No submit flow.
- No scoring.
- No timer.
- No exam engine.
- No use of `exam-questions.js`.
- No production deployment.

## Known Limitations

- Preview questions are read-only.
- The user can view preview-safe question text and options only.
- There is no answer checking until Phase 4 or another backend is approved.
- The admin approval tool is a staging/local testing utility and must not be treated as production workflow.
- Phase 4 waits on a backend decision because Cloud Functions require Blaze on the staging Firebase project.

## Manual Test Instructions

1. Open `https://ehs-course-staging.web.app/pages/protected-auth-check.html` while logged out.
2. Confirm the page shows unauthenticated state and does not show preview questions.
3. Log in with Google using the regular login page.
4. Return to the protected auth check page.
5. Confirm the user is not stuck in `unauthenticated`.
6. If needed, open `https://ehs-course-staging.web.app/admin/staging-user-approval.html`.
7. As approved admin, approve the target test user.
8. Return to the protected auth check page.
9. Confirm:
   - `approved`
   - `previewReadSuccess: true`
   - up to three preview questions are visible
   - no submit button
   - no scoring UI
   - no answer validation UI
   - no answer keys or correct answers in UI/debug

## Rollback Plan

If staging behavior regresses:

1. Disable further manual use of the admin staging approval tool.
2. Deploy the previous known-good Phase 2 branch if approval-only behavior is needed.
3. Revert the Phase 3 preview commit if preview reads are the cause.
4. Do not deploy Phase 4 unless Blaze/budget alerts and backend validation are approved.

## Phase 4 Decision

Phase 4 remains paused until the Firebase staging project can safely support a backend:

- Blaze enabled only after explicit approval
- budget alerts configured first
- no client-side answer validation workaround
- no answer keys in client-readable data

## Verification Scope

Before committing this freeze report, the branch was checked for absence of Phase 4 artifacts:

- no `functions/` directory
- no `validateProtectedAnswer`
- no Firebase Functions client import
- no protected answer validation UI

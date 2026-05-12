# Phase 2 Approval Check Verification

Date: 2026-05-12  
Branch: `codex/protected-questions-phase-2-approval-check`  
Staging URL: `https://ehs-course-staging.web.app/pages/protected-auth-check.html`

## Summary

Phase 2 was manually verified on staging. The standalone protected auth check page correctly moved beyond the unauthenticated state after Google login, read the existing user document, and reached the `approved` state.

## Manual Verification Results

| Check | Status | Notes |
| --- | --- | --- |
| Google login works | PASS | Google login completed successfully in staging. |
| User is identified | PASS | The signed-in user was recognized by Firebase Auth. |
| `users/{uid}` exists | PASS | The matching user document exists in Firestore. |
| Approval status is `approved` | PASS | The approval check resolved to `approved`. |
| Protected auth check does not remain unauthenticated | PASS | After login, the page did not stay in the `unauthenticated` state. |
| No `auth/argument-error` | PASS | The previous Auth argument error did not appear. |
| Firebase `.map` CSP messages | PASS WITH NOTE | CSP messages for Firebase source maps still appear, but they did not block login or approval verification. |
| No Protected Auth Check writes | PASS WITH NOTE | An `updateDoc` request was observed from the regular homepage/auth flow, not from `pages/protected-auth-check.html`. The Phase 2 page performs only the intended `users/{uid}` read. |

## Important Note About `updateDoc`

During manual verification, an `updateDoc` operation was observed in the browser tooling. This write was attributed to the existing regular homepage/auth behavior, not to the standalone Phase 2 page.

The Phase 2 implementation in `js/protected-auth-check.js` does not call `setDoc`, `addDoc`, `updateDoc`, or `deleteDoc`. Its Firestore access is limited to:

- `doc(db, "users", uid)`
- `getDoc(userRef)`

## Phase 2 Status

GO for planning Phase 3, subject to keeping the same separation:

- no question data yet
- no redirects
- no automatic navigation
- no writes from the protected check page
- no production deploy without explicit approval

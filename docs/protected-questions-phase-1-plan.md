# Protected Questions Phase 1 Plan

Date: 2026-05-11

Scope: planning only. No code, Firestore rules, Auth, Firebase config, deploy config, question migration, or deploy changes are included in this document.

Based on:

- `docs/protected-question-system-design.md`
- `docs/dynamic-firestore-readonly-design.md`
- `docs/dynamic-data-contracts.md`

## 1. Phase 1 Goal

Phase 1 prepares a safe path away from production dependence on `data/exam-questions.js`.

Primary goals:

- Stop requiring a public full answer bank in production.
- Keep local/staging fallback available behind explicit flags.
- Prepare protected question loading without changing production behavior yet.
- Preserve current `quizzes.html` and `exam-questions.html` user flows.
- Add a narrow read-only architecture that can be reviewed before implementation.
- Keep all writes, admin functions, and production deployment out of scope.

Success for Phase 1 means:

- A single pilot path can request protected question data.
- Production can be configured not to load `data/exam-questions.js`.
- If protected data is unavailable in production, users see a friendly unavailable state rather than a broken page or public fallback.
- Staging/local can still use existing local fallback while the protected path is tested.

## 2. Scope

Recommended pilot surface:

- `pages/exam-questions.html`

Recommended pilot content:

- One lesson or topic only, preferably `lesson-01`.

Why `exam-questions.html` first:

- It is the page most directly affected by `data/exam-questions.js`.
- It already has exam-specific UI and state.
- It can be tested without affecting every lesson page.
- It gives a clear pass/fail result for question loading behavior.

Allowed Phase 1 behavior:

- Read-only question loading.
- One pilot page.
- One pilot lesson/topic.
- Feature flags disabled by default.
- Static/local fallback only in local/staging when allowed.
- Friendly unavailable message in production if protected source is unavailable.
- No Firestore writes.
- No admin flow.
- No migration script.

## 3. Non-Scope

Phase 1 does not include:

- Server-side randomization.
- Cloud Functions/API.
- Production deploy.
- Firestore rules changes before separate review.
- Auth changes.
- Firebase config changes.
- Admin Content Manager.
- Question editing UI.
- Bulk migration of `data/exam-questions.js`.
- Writing questions to Firestore.
- Full anti-scraping protection.
- EHS integration.

## 4. Proposed Architecture

### Components

#### Protected Question Service

Responsibility:

- Provide a read-only interface for question requests.
- Hide the source implementation from page scripts.
- Validate returned documents before use.
- Never expose a write method.

Conceptual API:

```text
loadQuestions({ lessonId, topicId, count, mode })
```

Expected output for initial protected payload:

- `questionId`
- `lessonId`
- `topic`
- `prompt`
- `answers` with `answerId` and text
- `difficulty`
- `tags`

Not included in initial payload:

- `correctAnswer`
- full explanation if it reveals the answer
- internal review metadata

#### Question Source Selector

Responsibility:

- Choose between local fallback, mock, Firestore read-only, or unavailable state.
- Enforce environment policy.
- Ensure production does not silently load the public static bank.

Selection order:

1. If `useProtectedQuestionSource` is false:
   - keep existing behavior.
2. If protected source is enabled:
   - try protected read-only provider.
3. If provider fails:
   - local/staging may fallback if `allowLocalQuestionFallback` is true.
   - production must show a friendly unavailable state if local fallback is disabled.

#### Fallback Policy

Local/staging:

- Local fallback can use `data/exam-questions.js`.
- Mock data can be used for tests.
- Debug logging can be enabled explicitly.

Production:

- Do not load `data/exam-questions.js`.
- Do not expose full answer bank.
- If protected source fails, show:
  - "השאלות אינן זמינות כרגע. נסו שוב מאוחר יותר."
- Do not show raw backend errors to learners.

#### Feature Flags

Feature flags are the gate for every new behavior.

Rules:

- Disabled by default.
- No production activation without explicit approval.
- All fallback decisions are explicit.
- Debug is off by default.

## 5. Feature Flags

Recommended flags:

```js
{
  enabled: false,
  useProtectedQuestionSource: false,
  useFirestoreReadOnly: false,
  allowLocalQuestionFallback: true,
  debug: false
}
```

### Defaults by Environment

| Environment | enabled | useProtectedQuestionSource | useFirestoreReadOnly | allowLocalQuestionFallback | debug |
|---|---:|---:|---:|---:|---:|
| Local default | false | false | false | true | false |
| Local protected test | true | true | false or true | true | optional |
| Staging default | false | false | false | true | false |
| Staging protected test | true | true | true | true | optional |
| Production default | false | false | false | false | false |
| Production protected approved | true | true | true | false | false |

Notes:

- `allowLocalQuestionFallback` must be false in production if question secrecy is required.
- `useFirestoreReadOnly` may be true only after Firestore read-only implementation and rules review.
- `debug` must never expose question answers or internal paths.

## 6. Production Policy

Production policy for Phase 1 planning:

- Production should not load `data/exam-questions.js`.
- Production should not include any full static question bank with `correctAnswer`.
- If protected source is unavailable, production should display a friendly unavailable message.
- Production should not fallback to public local questions unless explicitly approved.
- Production should not enable protected flags until staging proves the flow.

Required production checks before future deploy:

- `data/exam-questions.js` is absent from production Hosting, or explicit approval exists for publishing it.
- No script dynamically injects `data/exam-questions.js` in production.
- `correctAnswer` is absent from initial protected payload.
- No write APIs are present in learner runtime.
- `firebase.json`, `.firebaserc`, `firestore.rules`, `js/auth.js`, and `js/firebase-config.js` have reviewed diffs if changed.

## 7. Security Model

### Hidden from Initial Client Payload

Phase 1 protected mode should not send:

- `correctAnswer`
- answer index
- scoring key
- explanation that reveals the correct answer
- unpublished questions
- admin/review metadata

### Still Visible to the Client

Any delivered question payload remains visible:

- prompt
- answer option texts
- topic
- difficulty
- tags
- question IDs

This means Phase 1 reduces answer exposure but does not fully prevent copying prompts/options.

### Correct Answer Handling

Best Phase 1 safe design:

- initial payload excludes correct answer
- learner selects answer locally
- page can record selected `answerId` locally
- final correctness verification is not fully secure until a server-side verifier exists

Temporary Phase 1 limitation:

- If no Cloud Functions/API exists, production may not be able to provide full immediate scoring without exposing answers.
- For production, the safer behavior is to show practice submission state and defer correctness/explanation until a protected verification mechanism exists.

### Explanation Handling

Recommendations:

- Do not send `explanation` in the initial payload if it reveals the answer.
- Store explanation with protected answer data.
- Return explanation only after verified answer submission in a later phase.
- In Phase 1 without backend verification, keep explanations disabled in protected production mode.

## 8. Data Flow

### Local / Staging Fallback Flow

1. Page requests questions for lesson/topic.
2. Source selector sees protected mode disabled or fallback allowed.
3. Local `data/exam-questions.js` loads.
4. Current quizzes/exam logic works as today.
5. This flow is for QA and staging convenience, not final protected production.

### Protected Source Flow

1. Page requests questions for lesson/topic.
2. Source selector verifies:
   - `enabled`
   - `useProtectedQuestionSource`
   - environment policy
3. Protected service requests client-safe questions.
4. Service validates:
   - document shape
   - `published`
   - required fields
   - no `correctAnswer` in initial payload
5. Page renders prompt/options.
6. If unavailable:
   - local/staging fallback if allowed
   - production unavailable message if fallback disallowed

### Answer Submission in Phase 1

Phase 1 has limited scoring options:

Option A, staging/local:

- Use existing client-side answer scoring from local fallback.
- Accept that this is not protected.

Option B, protected production:

- Store selected answer locally.
- Show "התשובה נשלחה" or similar neutral state.
- Do not reveal correctness until verification exists.

Option C, not recommended for protected production:

- Send correct answer in payload and score locally.
- This defeats the protection goal.

Recommended Phase 1 decision:

- Do not enable protected production scoring until a verification path is approved.

## 9. Test Plan

### Local Fallback

Verify:

- Local/staging fallback can still load `data/exam-questions.js`.
- Existing quizzes/exam pages remain usable.
- No broken empty states.

### Protected Source Unavailable

Simulate:

- missing provider
- permission denied
- empty result
- malformed result

Expected:

- local/staging fallback if allowed
- production friendly unavailable message if fallback disabled
- no console errors exposed to users

### Production No-Public-Questions Check

Verify before production:

- `/data/exam-questions.js` is not available, unless explicitly approved.
- no script tag or dynamic loader injects that file in production protected mode.
- no full answer bank appears in page source.

### No Writes

Scan for forbidden write APIs in protected question code:

- `setDoc`
- `addDoc`
- `updateDoc`
- `deleteDoc`
- `.set(`
- `.add(`
- `.update(`
- `.delete(`

Expected:

- none in learner runtime.

### No Secrets

Verify:

- no API keys beyond existing public Firebase config expectations
- no service account
- no admin credentials
- no hidden migration tokens

### No Correct Answer in Initial Payload

Test:

- inspect network response
- inspect `window` state
- inspect rendered DOM

Expected:

- no `correctAnswer`
- no `correctIndex`
- no explanation that reveals answer before submission

### Regression

Run:

- `node scripts/check-dynamic-readiness.js`
- `npm.cmd run check:links`
- existing dynamic loader tests
- browser test for the pilot page

## 10. Go / No-Go Before Implementation

### Go Only If

- Phase 1 remains one page or one topic only.
- No production deploy is planned.
- No Firestore writes are introduced.
- No admin logic is introduced.
- `firestore.rules` change is not required, or a separate reviewed diff is prepared.
- Auth requirements are explicitly decided for staging.
- Fallback policy is accepted.
- `correctAnswer` is excluded from protected initial payload.
- Readiness check remains green.

### No-Go If

- Production behavior is ambiguous.
- The implementation would need rules changes without review.
- The implementation would send `correctAnswer` to the client.
- The implementation would require client-side writes.
- The implementation would break current quizzes/exam pages.
- The implementation would require publishing `data/exam-questions.js` in production without explicit approval.

## Recommended Implementation Sequence After Approval

1. Add feature flags only if missing.
2. Add protected question service interface with no provider.
3. Add source selector with production fallback policy.
4. Add mock protected provider for one lesson/topic.
5. Add tests for:
   - no public fallback in production
   - no correct answer in protected initial payload
   - unavailable source behavior
6. Only after review, add Firestore read-only provider behind flag.
7. Do not deploy to production until Go criteria are met.


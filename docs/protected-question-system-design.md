# Protected Question Delivery System Design

Date: 2026-05-11

Scope: design and security planning only.

No Firestore implementation is added here. No question data is written to a server. No rules, Auth, Firebase config, or deploy config are changed. No deploy is performed.

## 1. Current Problem

The static course site currently needs `data/exam-questions.js` for runtime pages such as quizzes and exam practice. In the static/staging setup, this file is public so the browser can load it.

That creates a content exposure problem:

- The full question bank is visible to any client that can access the site.
- Correct answers are included in the same client-side payload.
- Explanations and source notes are included with the questions.
- The entire bank can be copied with a single request.
- Hiding the file name or minifying the file would not protect it.

This is not a secret/API-key risk, but it is a learning integrity risk. If production should protect exam content, the question delivery model must change before relying on production privacy.

## 2. Goals

The protected question system should:

- Avoid exposing the full question bank to the client.
- Avoid exposing correct answers before the learner submits an answer.
- Keep static fallback safe and predictable.
- Keep staging and local testing convenient.
- Preserve current quizzes and exam pages without breaking user flows.
- Keep costs low.
- Avoid Firestore writes from the client.
- Avoid admin logic in the public runtime.
- Allow gradual migration from the static data file.

Non-goals for the first protected phase:

- No production deploy.
- No Cloud Functions unless explicitly approved later.
- No full content manager implementation.
- No migration writes from the browser.
- No changes to `firestore.rules` without a separate reviewed diff.

## 3. Architecture Options

### Option A: Firestore Read-Only

Published question documents are stored in Firestore and loaded by lesson/topic behind feature flags.

Pros:

- Uses existing Firebase platform.
- Can be implemented incrementally.
- Supports lesson/topic based reads.
- Can keep fallback static for staging/local.
- Cheap if reads are batched and cached.

Cons:

- Client-side reads still expose any fields returned to the browser.
- If `correctAnswer` is sent with the question, answers are still exposed.
- Rules must be reviewed carefully.
- Auth and quota decisions are required.

Security fit:

- Good for content availability.
- Not sufficient by itself to hide correct answers unless documents returned to clients exclude answer fields or answers are stored separately.

### Option B: Cloud Functions / API

Questions are requested from a backend endpoint. The endpoint can return prompts/options first and verify answers later.

Pros:

- Better control over what is returned.
- Correct answers can remain server-side until submission.
- Easier to add rate limiting and anti-scraping controls.
- Can randomize server-side.

Cons:

- Higher implementation and operational complexity.
- Potential cost and cold-start considerations.
- Requires API design, security review, and monitoring.
- Out of scope for the current read-only foundation.

Security fit:

- Best long-term protection for answers and test integrity.

### Option C: Signed Content

Question bundles are signed and validated by the client or served through signed URLs.

Pros:

- Can detect tampering.
- Useful for verifying content version.

Cons:

- Does not hide questions or answers once delivered to the browser.
- Adds complexity without solving the main exposure issue.

Security fit:

- Integrity feature, not confidentiality.

### Option D: Chunked Question Loading

Load only a small set of questions per attempt rather than the full bank.

Pros:

- Reduces bulk copying.
- Lowers page payload.
- Works with Firestore or API approaches.

Cons:

- Any delivered chunk is still visible to the client.
- Needs attempt/session model if uniqueness matters.

Security fit:

- Helpful mitigation, not full protection.

### Option E: Auth-Only Question Loading

Require an approved authenticated user before questions load.

Pros:

- Prevents unauthenticated bulk access.
- Fits existing course Auth concepts.
- Can be combined with Firestore rules.

Cons:

- Authenticated users can still inspect delivered payloads.
- Does not protect correct answers if sent to the client.
- Requires clear login/approval behavior for learners.

Security fit:

- Good access gate, not answer protection by itself.

### Option F: Hybrid Local / Staging Mode

Keep local or staging fallback data for QA, but do not publish static full answers in production.

Pros:

- Preserves easy development and QA.
- Allows production to be stricter.
- Supports gradual rollout.

Cons:

- Requires environment-specific config discipline.
- Hosting separation and feature flags must be enforced.
- Risk of accidentally publishing fallback if deploy config is wrong.

Security fit:

- Recommended as a transition strategy.

## 4. Preferred Recommendation

Recommended path:

1. Firestore read-only pilot behind flags for staging only.
2. Auth required for protected question loading.
3. Load questions by `lessonId` / topic, not as one global bank.
4. Return prompt/options/metadata first.
5. Do not send `correctAnswer` in the initial question payload.
6. Keep local fallback only for local/staging, disabled or excluded for production.
7. Add server-side answer verification later, preferably through Cloud Functions/API.
8. Add server-side randomization later.

Practical near-term model:

- Firestore can store full internal question documents.
- Public read documents should be projected/sanitized to exclude `correctAnswer`.
- The current client-side scoring model will need a transition mode:
  - staging/local can score using local fallback
  - production protected mode should either defer scoring to a backend or use a separate verification mechanism

This keeps Phase 1 small while acknowledging that pure client-side security cannot hide answers.

## 5. Protected Question Data Model

Internal/admin document example:

```json
{
  "questionId": "lesson-01-q001",
  "lessonId": "lesson-01",
  "topic": "יסודות תורת הבטיחות",
  "prompt": "מה ההבדל בין גורם סיכון לבין סיכון?",
  "answers": [
    { "answerId": "a", "text": "..." },
    { "answerId": "b", "text": "..." },
    { "answerId": "c", "text": "..." },
    { "answerId": "d", "text": "..." }
  ],
  "correctAnswer": "a",
  "explanation": "הסבר לימודי לאחר מענה.",
  "difficulty": "easy",
  "tags": ["יסודות", "סיכון", "גורם סיכון"],
  "published": true,
  "visibility": "protected",
  "updatedAt": "2026-05-11T00:00:00.000Z"
}
```

Client-safe read projection:

```json
{
  "questionId": "lesson-01-q001",
  "lessonId": "lesson-01",
  "topic": "יסודות תורת הבטיחות",
  "prompt": "מה ההבדל בין גורם סיכון לבין סיכון?",
  "answers": [
    { "answerId": "a", "text": "..." },
    { "answerId": "b", "text": "..." },
    { "answerId": "c", "text": "..." },
    { "answerId": "d", "text": "..." }
  ],
  "difficulty": "easy",
  "tags": ["יסודות", "סיכון", "גורם סיכון"],
  "published": true,
  "visibility": "protected",
  "updatedAt": "2026-05-11T00:00:00.000Z"
}
```

Important:

- `correctAnswer` should not be present in the initial client payload in protected production mode.
- `explanation` may also need to be withheld until after answer submission.
- If Firestore is used directly from the browser, rules alone cannot remove fields from a document. Separate public/protected documents or a backend API is needed for true field-level hiding.

## 6. Security Considerations

### Why public JS is not enough

Anything shipped to the browser can be downloaded, inspected, copied, and automated. Minification, obfuscation, or changing file names does not protect question answers.

### Basic scraping mitigation

Useful mitigations:

- Require Auth for protected question sources.
- Load only the required lesson/topic.
- Avoid a single global full bank.
- Avoid shipping correct answers in the initial payload.
- Cache minimally.
- Log suspicious activity in future server-side flows.

Limitations:

- Authenticated users can still inspect network responses.
- Any answer sent to the client can be extracted.
- Firestore read-only cannot provide true field-level secrecy unless the readable documents omit sensitive fields.

### Rate limiting future

If Cloud Functions/API are introduced later:

- Add per-user/per-IP rate limits.
- Add attempt/session IDs.
- Return small randomized sets.
- Verify answers server-side.
- Return explanations only after submission.

### Quota considerations

Firestore read-only can stay cheap if:

- one lesson/topic is loaded per page
- no real-time listeners are used
- results are cached per session
- pages fall back without retry loops

Avoid:

- loading the entire bank on each page
- real-time listeners for static question content
- client retry storms after permission errors

## 7. Future Feature Flags

Recommended flags:

```js
{
  enabled: false,
  useMockDynamicContent: false,
  useFirestoreReadOnly: false,
  useProtectedQuestionSource: false,
  allowLocalQuestionFallback: true,
  debug: false
}
```

Production recommendation:

- `enabled`: explicit only
- `useProtectedQuestionSource`: explicit only
- `allowLocalQuestionFallback`: false if full answers must not be public
- `debug`: false

Staging/local recommendation:

- allow mock/local paths for QA
- keep protected flow behind explicit flag
- do not change production defaults

## 8. Migration Plan

### Phase 0: Current static/staging

- Keep `data/exam-questions.js` for staging/local runtime.
- Document that it is not a protected production model.

### Phase 1: Read-only pilot

- Add protected question source service behind flags.
- Load one lesson only.
- Require fallback on any failure.
- No writes.
- No admin.
- No rules change without separate approval.

### Phase 2: Data split

Split existing static questions into:

- client-safe prompt/options metadata
- protected answer/explanation data

If using Firestore direct reads:

- store client-safe documents separately
- do not expose internal documents to clients

If using API:

- keep full documents server-side
- return prompt/options first

### Phase 3: Compatibility

Maintain adapters for current pages:

- `quizzes.html`
- `exam-questions.html`
- safety game flows if they use the same bank

Compatibility checks:

- same lesson/topic filters
- same difficulty filters
- same Hebrew/RTL display
- same mobile behavior
- no broken empty states

### Phase 4: Production hardening

Before production:

- stop deploying `data/exam-questions.js` if full answers should be protected
- verify Hosting config excludes full static bank
- verify protected source works in staging
- verify fallback behavior does not expose answers in production

## 9. Production Go / No-Go Criteria

Go only if:

- production deploy config does not expose full answer bank unless explicitly approved
- protected question source is tested in staging
- Auth requirement is decided
- fallback behavior is decided
- no Firestore writes exist in learner runtime
- no admin writes exist in public pages
- rules/config changes have separate reviewed diffs
- `npm.cmd run check:links` passes
- `node scripts/check-dynamic-readiness.js` passes in the dynamic branch

No-Go if:

- `data/exam-questions.js` with answers remains public without explicit approval
- correct answers are shipped in initial protected production payload
- Firestore rules have not been reviewed
- production/staging environment selection is ambiguous
- fallback can accidentally load a full answer bank in production

Files that should not remain public in protected production mode:

- `data/exam-questions.js` if it contains `correctAnswer`
- any generated full question bank with answers
- migration scripts
- admin-only content export artifacts

## 10. Open Decisions

- Should login be mandatory before any question loading?
- Is anonymous Auth acceptable for basic access control, or should approved user accounts be required?
- Is Cloud Functions required for answer verification, or is a read-only pilot acceptable first?
- Should explanations be hidden until after submission?
- Should question randomization be server-side in production?
- Will EHS and the course share backend infrastructure later?
- Should course and EHS use separate Hosting targets before production?
- Should `data/exam-questions.js` remain available in staging only?

## Recommendation

Do not rely on public `data/exam-questions.js` for production if question secrecy matters.

The safest incremental path is:

1. Keep current static file for local/staging QA only.
2. Design a Firestore read-only pilot that returns client-safe question prompts/options only.
3. Add backend answer verification later if production must protect correct answers.
4. Keep all new behavior behind disabled-by-default feature flags.
5. Do not change rules/config/deploy until reviewed separately.


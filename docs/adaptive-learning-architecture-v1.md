# Adaptive Learning Architecture v1

## Purpose

The adaptive learning layer is intended to help the course site move from static practice into guided learning, without replacing the existing question system in the first stages.

Primary goals:

- Save user progress across protected and, if approved later, public practice flows.
- Identify weak topics and sub-topics based on repeated misses, skipped questions, and low confidence.
- Adapt question recommendations by topic, sub-topic, and difficulty.
- Prevent unnecessary repetition of recently seen questions.
- Recommend study actions such as reviewing a lesson, revisiting a legal source, or practicing more questions in a weak topic.

The first version should be conservative: collect enough reliable progress signals before adding any AI-driven recommendation behavior.

## Principles

- Do not break the existing question system.
- Do not expose answer keys, correct answers, internal scoring logic, or protected answer metadata to the client.
- Do not introduce AI recommendations before there is enough trustworthy progress data.
- Do not change production in the first implementation stage.
- Build and validate in staging first.
- Keep protected-question behavior separate from legacy public question flows until rollout decisions are made.
- Prefer explicit states over hidden automation: users should understand why they are seeing a recommendation.
- Keep rollback simple: disabling progress/adaptive flags should return the site to the current Phase 3 behavior.

## Proposed Data Model

### `users/{uid}/progress/{questionId}`

Stores per-user progress for a single question. The document id should match the question id used by the protected or public question source.

Recommended fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `viewedAt` | timestamp | First or latest time the question was shown. |
| `answeredAt` | timestamp/null | Last time the user answered the question. |
| `selectedOptionId` | string/null | The option selected by the user, if storing this is approved. |
| `isCorrect` | boolean/null | Result after trusted validation. In protected mode this should be written only after server-side validation. |
| `lessonId` | string | Lesson id connected to the question. |
| `topic` | string | Primary topic. |
| `subTopic` | string/null | Optional sub-topic. |
| `difficulty` | `easy`/`medium`/`hard` | Question difficulty. |
| `attemptsCount` | number | Number of attempts recorded for this user/question. |
| `lastSeenAt` | timestamp | Last time this question was displayed. |
| `nextReviewAt` | timestamp/null | Earliest suggested time to show the question again. |
| `confidenceScore` | number | User confidence estimate from 0 to 1, derived from accuracy, attempts, and recency. |

Notes:

- `isCorrect` is progress metadata, not an answer key. It must never reveal which option is correct.
- `selectedOptionId` may be useful for analytics, but it increases sensitivity and should be decided explicitly before production.
- For protected questions, the client must not compute correctness from local answer data.

### `users/{uid}/topicStats/{topicId}`

Aggregates the user's state for a topic or sub-topic.

Recommended fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `topic` | string | Human-readable topic name. |
| `subTopic` | string/null | Optional narrower category. |
| `questionsViewed` | number | Count of seen questions in this topic. |
| `questionsAnswered` | number | Count of answered questions. |
| `correctCount` | number | Count of correct answers after trusted validation. |
| `incorrectCount` | number | Count of incorrect answers. |
| `accuracy` | number | Correct answers divided by answered questions. |
| `currentDifficulty` | `easy`/`medium`/`hard` | Current recommended difficulty for this topic. |
| `weaknessScore` | number | Higher value means this topic needs more practice. |
| `lastPracticedAt` | timestamp/null | Last activity in the topic. |
| `nextRecommendedAt` | timestamp/null | Earliest time to recommend more practice. |

### `users/{uid}/learningProfile/summary`

Stores the user's current learning profile for fast dashboard and recommendation loading.

Recommended fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `updatedAt` | timestamp | Last profile calculation time. |
| `totalQuestionsViewed` | number | Total questions shown. |
| `totalQuestionsAnswered` | number | Total questions answered. |
| `overallAccuracy` | number | Overall correct rate. |
| `strongTopics` | array | Topics where the user performs well. |
| `weakTopics` | array | Topics needing practice. |
| `recommendedTopicIds` | array | Ordered topics for the next practice session. |
| `recommendedDifficultyByTopic` | map | Suggested difficulty per topic. |
| `reviewQueue` | array | Question ids or topic ids scheduled for review. |
| `confidenceScore` | number | Overall confidence estimate from 0 to 1. |

## Initial Adaptive Logic

The first adaptive logic should be rule-based and explainable.

### Topic Reinforcement

If the user answers incorrectly in a topic:

- Increase that topic's `weaknessScore`.
- Prefer additional questions from the same topic or sub-topic.
- Keep the next recommendation at the same difficulty unless the current difficulty is `hard`.

### Difficulty Progression

- If the user succeeds consistently on `easy`, recommend `medium`.
- If the user succeeds consistently on `medium`, recommend `hard`.
- If the user fails on `hard`, recommend returning to `medium`.
- If the user repeatedly fails on `medium`, recommend `easy` plus lesson review.

### Repetition Control

- Do not show the same question again too quickly.
- Use `lastSeenAt` and `nextReviewAt` to space repeated exposure.
- Prefer unseen questions in the same topic before repeating known questions.
- Allow review only when the topic is weak, enough time has passed, or the user explicitly requests review.

### Study Recommendations

Recommendations can start simple:

- "Review lesson content for this topic."
- "Practice two more medium questions in this topic."
- "Move to harder questions in this topic."
- "Return to the legal source before more practice."

## Implementation Phases

### Phase A: Progress Tracking, Staging Only

Scope:

- Add guarded read/write progress tracking in staging only.
- Track viewed and answered events for one controlled page.
- Use feature flags disabled by default.
- Do not change the main exam flow.

Acceptance criteria:

- Guest users cannot write progress.
- Authenticated users can write only their own progress.
- No answer keys or protected answer metadata are written.
- Rollback is possible by disabling flags.

### Phase B: Topic Statistics

Scope:

- Aggregate per-topic performance in `topicStats`.
- Keep aggregation simple and transparent.
- Avoid admin dashboards at this stage.

Acceptance criteria:

- Topic accuracy and weakness score are updated correctly.
- Missing or malformed topic data fails safely.
- Users cannot write stats for another user.

### Phase C: Adaptive Recommendation Panel

Scope:

- Add a small user-facing recommendation panel.
- Recommend next topic and difficulty.
- Do not auto-redirect or force a path.

Acceptance criteria:

- Recommendations are explainable.
- The user can continue normal practice without adaptive mode.
- No legacy flow is broken.

### Phase D: Weak Topics Dashboard

Scope:

- Show weak topics, recent progress, and suggested reviews.
- Keep dashboard user-specific.
- Admin aggregate view is out of scope unless separately approved.

Acceptance criteria:

- User sees only their own progress.
- Dashboard remains useful when data is sparse.
- No protected answers are exposed.

### Phase E: Future AI Recommendations

Scope:

- Consider AI only after enough validated progress data exists.
- AI may summarize weak topics or recommend study order.
- AI must not infer or expose answer keys.

Acceptance criteria:

- AI output is advisory, not authoritative.
- Inputs exclude protected answer metadata.
- Recommendations are tested against hallucination and privacy risk.

## Security

- A user may read and write only their own progress documents.
- A user may not write to another user's `progress`, `topicStats`, or `learningProfile`.
- Admin aggregate access should be designed later and should not be enabled by default.
- Do not write answer keys, correct answers, answer indexes, or protected solution data to user progress.
- In protected mode, store `isCorrect` only after trusted server-side validation.
- Do not let the client derive correctness from hidden answer data.
- Keep public and protected question sources separate until production policy is approved.
- Preserve the Phase 3 rule that protected previews are read-only and answer-free.

## Testing Plan

Required tests before any runtime implementation:

- Guest user is blocked from writing progress.
- Authenticated user can write own progress.
- Authenticated user cannot write another user's progress.
- Progress writes do not contain answer keys, correct answers, solutions, or internal scoring metadata.
- Protected question flow still does not load `exam-questions.js`.
- Existing public question pages still load normally.
- Rollback by disabling feature flags restores the previous behavior.
- Firestore permission errors show a friendly state and do not break the page.

Suggested future test groups:

- Rules tests for user-owned subcollections.
- Static no-leak scans for forbidden fields.
- Browser tests for RTL and mobile progress UI.
- Regression tests for legacy quiz and exam pages.

## Rollback Plan

Rollback must be available at every phase:

1. Disable progress/adaptive feature flags.
2. Stop rendering adaptive UI panels.
3. Leave existing question and preview flows untouched.
4. Revert Firestore rules additions if they cause access issues.
5. Keep existing user progress data inert until reviewed.

No production rollout should proceed unless staging proves that disabling the adaptive feature returns the site to the current stable Phase 3 behavior.

## Open Questions

- Should `selectedOptionId` be stored, or is it too sensitive for the first version?
- Should `isCorrect` be stored only after server-side validation?
- Should progress tracking apply to public questions, protected questions, or both?
- Should users see a progress graph, or should the first UI stay text-based and minimal?
- Should topic statistics be updated client-side, server-side, or by a future scheduled job?
- How long should `nextReviewAt` delay repeated questions?
- Should admins ever see individual progress, or only aggregate anonymous statistics?
- What is the minimum data volume before AI recommendations are allowed?

## Decision Gate

Do not start runtime implementation until the following are approved:

- Firestore rules model for user-owned progress subcollections.
- Whether to store `selectedOptionId`.
- Whether `isCorrect` is written only by server-side validation.
- Whether public questions participate in progress tracking.
- Staging-only rollout plan and rollback procedure.

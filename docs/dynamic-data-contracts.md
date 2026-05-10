# Dynamic Data Contracts

## Purpose

This document defines detailed data contracts for the future dynamic version of the safety supervisor course site.

It is based on:

- `docs/dynamic-data-model.md`
- `docs/dynamic-implementation-architecture.md`
- `docs/dynamic-migration-plan.md`

This is documentation only. It does not add runtime code, migration scripts, Firebase changes, Auth changes, Firestore changes, or deploy changes.

## Shared Principles

- Read-only first.
- Static fallback remains mandatory.
- No client-side admin writes without an approved admin architecture.
- No production writes without explicit approval.
- Every published content document should be versioned.
- Every schema should be validated before content is shown dynamically.

## Shared Types

### Status

Allowed values:

- `draft`
- `review`
- `published`
- `archived`

Rules:

- Regular users can read only `published` content.
- Admin users may preview `draft` and `review` content in staging-only mode.
- `archived` content is retained for rollback but not shown by default.

### Timestamps

Use timestamp values for:

- `createdAt`
- `updatedAt`
- `reviewedAt`
- `publishedAt`
- `archivedAt`

Rules:

- `createdAt` is required.
- `updatedAt` is required.
- `reviewedAt` is required before production publication.
- `publishedAt` is required for `published` content.

### Version Fields

Common versioning fields:

- `contentVersion`: string, required for publishable content.
- `sourceHash`: string, optional during planning, recommended before migration.
- `createdAt`: timestamp, required.
- `updatedAt`: timestamp, required.
- `reviewedAt`: timestamp, optional until review.
- `reviewedBy`: string, optional until review.

Rules:

- `contentVersion` must change when meaningful content changes.
- `sourceHash` should be calculated from normalized source content during future migration.
- `reviewedBy` should reference an admin user ID when review workflow exists.

## Content Blocks

Content blocks are reusable units inside lessons, legal sources, and standards.

### Supported Block Types

- `paragraph`
- `quote`
- `table`
- `diagram`
- `checklist`
- `callout`
- `questionCard`
- `internalLink`

### Base Content Block Schema

Required fields:

- `blockId`: string
- `type`: string
- `order`: number

Optional fields:

- `title`: string
- `body`: string
- `items`: array
- `metadata`: object
- `accessibilityLabel`: string

Example:

```json
{
  "blockId": "risk-basics-quote-01",
  "type": "quote",
  "order": 2,
  "title": "ציטוט מקור",
  "body": "טקסט הציטוט כפי שמופיע במקור הלימודי.",
  "metadata": {
    "sourceType": "lesson",
    "topic": "risk"
  }
}
```

Validation rules:

- `blockId` must be unique within its parent document.
- `type` must be one of the supported block types.
- `order` must be numeric and non-negative.
- `quote` blocks must include `body`.
- `table` blocks must include a valid table structure in `items` or `metadata`.
- `internalLink` blocks must include a valid internal target.
- Empty blocks are invalid.

## Collection: `lessons`

### Purpose

Stores structured course lessons.

### Required Fields

- `lessonId`: string
- `courseId`: string
- `title`: string
- `slug`: string
- `sections`: array
- `status`: status
- `order`: number
- `contentVersion`: string
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Optional Fields

- `summary`: string
- `description`: string
- `relatedLegalSourceIds`: array of strings
- `relatedStandardIds`: array of strings
- `questionTopicIds`: array of strings
- `sourcePath`: string
- `sourceHash`: string
- `reviewedAt`: timestamp
- `reviewedBy`: string

### Example Document

```json
{
  "lessonId": "lesson-01",
  "courseId": "safety-supervisor",
  "title": "יסודות תורת הבטיחות",
  "slug": "lesson-01",
  "summary": "היכרות עם מושגי יסוד בבטיחות.",
  "sections": [
    {
      "sectionId": "risk-basics",
      "title": "סיכון, מפגע וגורם סיכון",
      "topicTags": ["risk", "hazard"],
      "contentBlocks": [
        {
          "blockId": "risk-basics-paragraph-01",
          "type": "paragraph",
          "order": 1,
          "body": "הסבר לימודי על מושגי היסוד."
        }
      ]
    }
  ],
  "relatedLegalSourceIds": [],
  "relatedStandardIds": [],
  "questionTopicIds": ["lesson-01"],
  "status": "published",
  "order": 1,
  "contentVersion": "2026.05.10-lesson-01",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Validation Rules

- `lessonId` must be stable and unique.
- `slug` must match the route or static fallback mapping.
- At least one section is required.
- Each section must have `sectionId`, `title`, and at least one content block.
- `order` must be unique within the course.
- Published lessons must have no empty sections.

### Recommended Indexes

- `courseId`, `status`, `order`
- `slug`, `status`
- `questionTopicIds`, `status`

### Principle-Level Permissions

- Read: public for `published`.
- Write: admin-only, staging-first.
- Delete: avoid physical delete; use `archived`.

## Collection: `legalSources`

### Purpose

Stores laws, ordinances, regulations, and legal learning hubs.

### Required Fields

- `legalSourceId`: string
- `type`: string
- `title`: string
- `slug`: string
- `sections`: array
- `status`: status
- `contentVersion`: string
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Optional Fields

- `officialSourceUrl`: string
- `sourceVerificationStatus`: string
- `relatedLessonIds`: array of strings
- `relatedQuestionTopicIds`: array of strings
- `sourceHash`: string
- `reviewedAt`: timestamp
- `reviewedBy`: string

### Example Document

```json
{
  "legalSourceId": "labor-inspection-law-1954",
  "type": "law",
  "title": "חוק ארגון הפיקוח על העבודה, תשי\"ד-1954",
  "slug": "labor-inspection-law-1954",
  "sourceVerificationStatus": "requires-official-verification",
  "sections": [
    {
      "sectionId": "safety-order",
      "sectionNumber": "6",
      "title": "צו בטיחות",
      "contentBlocks": []
    }
  ],
  "relatedLessonIds": ["lesson-02"],
  "relatedQuestionTopicIds": ["labor-inspection-law-1954"],
  "status": "published",
  "contentVersion": "2026.05.10-law-1954",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Validation Rules

- Legal section numbers must not be rewritten as generic lesson numbers.
- Quotes must preserve meaning and source wording.
- If source verification is uncertain, mark `sourceVerificationStatus`.
- Published legal sources require review before production.

### Recommended Indexes

- `type`, `status`
- `slug`, `status`
- `relatedLessonIds`, `status`

### Principle-Level Permissions

- Read: public for `published`, unless future policy requires login.
- Write: admin-only.
- Publish: reviewed admin or super admin only.

## Collection: `standards`

### Purpose

Stores standards such as ISO 45001.

### Required Fields

- `standardId`: string
- `title`: string
- `slug`: string
- `standardFamily`: string
- `sections`: array
- `status`: status
- `contentVersion`: string
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Optional Fields

- `year`: number
- `officialSourceUrl`: string
- `relatedLessonIds`: array of strings
- `relatedQuestionTopicIds`: array of strings
- `sourceHash`: string
- `reviewedAt`: timestamp
- `reviewedBy`: string

### Example Document

```json
{
  "standardId": "iso-45001-2018",
  "title": "ת\"י ISO 45001:2018 - מערכות ניהול בטיחות ובריאות בתעסוקה",
  "slug": "iso-45001-2018",
  "standardFamily": "ISO",
  "year": 2018,
  "sections": [
    {
      "sectionId": "context-of-organization",
      "clause": "4",
      "title": "הקשר הארגון",
      "contentBlocks": []
    }
  ],
  "relatedLessonIds": ["lesson-02"],
  "relatedQuestionTopicIds": ["iso-45001-2018"],
  "status": "published",
  "contentVersion": "2026.05.10-iso-45001",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Validation Rules

- ISO clause numbers must be labeled as clauses.
- Published standards require review status.
- Content blocks must be reachable through the page renderer.

### Recommended Indexes

- `standardFamily`, `status`
- `slug`, `status`
- `relatedLessonIds`, `status`

### Principle-Level Permissions

- Read: public for `published`, unless future policy changes.
- Write: admin-only.
- Publish: reviewed admin or super admin only.

## Collection: `questions`

### Purpose

Stores exam, practice, and safety game questions.

### Required Fields

- `questionId`: string
- `topicId`: string
- `question`: string
- `answers`: array
- `correctAnswerId`: string
- `explanation`: string
- `difficulty`: string
- `status`: status
- `contentVersion`: string
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Optional Fields

- `lessonId`: string
- `category`: string
- `tags`: array of strings
- `sourcePath`: string
- `sourceHash`: string
- `reviewedAt`: timestamp
- `reviewedBy`: string

### Example Document

```json
{
  "questionId": "q-lesson-01-001",
  "topicId": "lesson-01",
  "lessonId": "lesson-01",
  "category": "יסודות תורת הבטיחות",
  "difficulty": "easy",
  "question": "מהי מטרת זיהוי גורמי סיכון?",
  "answers": [
    { "answerId": "a", "text": "לאתר סיכונים ולמנוע פגיעה" },
    { "answerId": "b", "text": "להחליף הדרכה" },
    { "answerId": "c", "text": "לבטל תיעוד" },
    { "answerId": "d", "text": "להימנע מתחקיר" }
  ],
  "correctAnswerId": "a",
  "explanation": "זיהוי גורמי סיכון הוא בסיס לניהול סיכונים ולמניעת אירועים.",
  "tags": ["risk", "lesson-01"],
  "status": "published",
  "contentVersion": "2026.05.10-q-lesson-01",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Validation Rules

- Exactly four answers are required unless a future question type explicitly changes this.
- `correctAnswerId` must match one of the answer IDs.
- `explanation` must not be empty.
- `difficulty` should be `easy`, `medium`, or `hard`.
- Duplicate question text within the same topic should be flagged.

### Recommended Indexes

- `topicId`, `status`, `difficulty`
- `lessonId`, `status`
- `category`, `status`
- `tags`, `status`

### Principle-Level Permissions

- Read: depends on open decision about question protection.
- Write: admin-only.
- Publish: reviewed admin or super admin only.

## Collection: `gameUnits`

### Purpose

Stores safety game challenge units.

### Required Fields

- `gameUnitId`: string
- `title`: string
- `topicId`: string
- `questionIds`: array of strings
- `status`: status
- `contentVersion`: string
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Optional Fields

- `description`: string
- `rules`: object
- `tags`: array of strings
- `sourceHash`: string

### Example Document

```json
{
  "gameUnitId": "game-iso-45001-2018",
  "title": "ת\"י ISO 45001:2018",
  "topicId": "iso-45001-2018",
  "description": "אתגר בנושא מערכת ניהול בטיחות ובריאות בתעסוקה.",
  "questionIds": ["q-iso-001", "q-iso-002"],
  "rules": {
    "timeLimitSeconds": 60,
    "shuffleQuestions": true,
    "shuffleAnswers": true
  },
  "status": "published",
  "contentVersion": "2026.05.10-game-iso",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Validation Rules

- `questionIds` must resolve to published questions.
- Game units should not duplicate full question text when question references are available.
- `timeLimitSeconds` must be positive if provided.

### Recommended Indexes

- `topicId`, `status`
- `status`, `updatedAt`

### Principle-Level Permissions

- Read: public if questions are public.
- Write: admin-only.

## Collection: `searchDocuments`

### Purpose

Stores searchable summaries and keywords.

### Required Fields

- `searchDocumentId`: string
- `type`: string
- `title`: string
- `url`: string
- `keywords`: array of strings
- `summary`: string
- `sourceId`: string
- `status`: status
- `contentVersion`: string
- `updatedAt`: timestamp

### Optional Fields

- `boost`: number
- `tags`: array of strings
- `sourceHash`: string

### Example Document

```json
{
  "searchDocumentId": "lesson-01",
  "type": "lesson",
  "title": "יסודות תורת הבטיחות",
  "url": "/pages/lesson-01.html",
  "keywords": ["סיכון", "מפגע", "כמעט תאונה"],
  "summary": "תקציר קצר של נושאי השיעור.",
  "sourceId": "lesson-01",
  "status": "published",
  "contentVersion": "2026.05.10-search-lesson-01",
  "updatedAt": "timestamp"
}
```

### Validation Rules

- `url` must be an internal route.
- `summary` should be short and must not duplicate full page content.
- Keywords should include common Hebrew search terms.

### Recommended Indexes

- `type`, `status`
- `sourceId`, `status`

### Principle-Level Permissions

- Read: public for `published`.
- Write: generated/admin-only.

## Collection: `users`

### Purpose

Stores user profile metadata if user accounts are introduced.

### Required Fields

- `uid`: string
- `role`: string
- `status`: string
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Optional Fields

- `displayName`: string
- `email`: string
- `phone`: string
- `lastLoginAt`: timestamp
- `privacyConsentAt`: timestamp

### Example Document

```json
{
  "uid": "user-id",
  "displayName": "שם משתמש",
  "email": "user@example.com",
  "role": "student",
  "status": "active",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "lastLoginAt": "timestamp",
  "privacyConsentAt": "timestamp"
}
```

### Validation Rules

- `uid` must match Auth UID if Auth is enabled.
- `role` must be one of the approved roles.
- Personal data should be minimized.
- Consent is required before storing optional personal fields beyond basic account needs.

### Recommended Indexes

- `role`, `status`
- `status`, `lastLoginAt`

### Principle-Level Permissions

- Read: user can read own profile; admin can read for management.
- Write: user can update limited profile fields; admin can update role/status under approved rules.

## Collection: `progress`

### Purpose

Stores student progress across lessons and sections.

### Required Fields

- `progressId`: string
- `uid`: string
- `courseId`: string
- `lessonId`: string
- `readingProgressPercent`: number
- `updatedAt`: timestamp

### Optional Fields

- `startedAt`: timestamp
- `lastViewedAt`: timestamp
- `completedAt`: timestamp
- `completedSections`: array of strings
- `contentVersion`: string

### Example Document

```json
{
  "progressId": "user-id-lesson-01",
  "uid": "user-id",
  "courseId": "safety-supervisor",
  "lessonId": "lesson-01",
  "startedAt": "timestamp",
  "lastViewedAt": "timestamp",
  "completedAt": null,
  "completedSections": ["risk-basics"],
  "readingProgressPercent": 45,
  "contentVersion": "2026.05.10-lesson-01",
  "updatedAt": "timestamp"
}
```

### Validation Rules

- `readingProgressPercent` must be between 0 and 100.
- `uid` is required for cloud progress.
- Local progress can remain anonymous in localStorage.
- `completedAt` should be set only when completion criteria are met.

### Recommended Indexes

- `uid`, `courseId`
- `uid`, `lessonId`
- `uid`, `updatedAt`

### Principle-Level Permissions

- Read/write: user can access own progress only.
- Admin access should be aggregated or minimized unless approved.

## Collection: `examResults`

### Purpose

Stores exam, practice, or game attempt results if cloud progress is enabled.

### Required Fields

- `examResultId`: string
- `uid`: string
- `mode`: string
- `topicId`: string
- `score`: number
- `startedAt`: timestamp
- `completedAt`: timestamp
- `createdAt`: timestamp

### Optional Fields

- `questionIds`: array of strings
- `answers`: array
- `durationSeconds`: number
- `contentVersion`: string

### Example Document

```json
{
  "examResultId": "attempt-001",
  "uid": "user-id",
  "mode": "practice",
  "topicId": "lesson-01",
  "questionIds": ["q-lesson-01-001"],
  "answers": [
    {
      "questionId": "q-lesson-01-001",
      "selectedAnswerId": "a",
      "isCorrect": true,
      "answeredAt": "timestamp"
    }
  ],
  "score": 100,
  "durationSeconds": 45,
  "startedAt": "timestamp",
  "completedAt": "timestamp",
  "createdAt": "timestamp"
}
```

### Validation Rules

- `score` must be between 0 and 100.
- `mode` should be `practice`, `exam`, or `safety-game`.
- `completedAt` must be after `startedAt`.
- Avoid storing more answer detail than needed if privacy policy restricts it.

### Recommended Indexes

- `uid`, `topicId`, `createdAt`
- `uid`, `mode`, `createdAt`

### Principle-Level Permissions

- Read/write: user can access own results only.
- Admin reports should use aggregated data unless individual review is explicitly approved.

## Collection: `contentVersions`

### Purpose

Tracks content lifecycle and rollback points.

### Required Fields

- `contentVersionId`: string
- `scope`: string
- `scopeId`: string
- `version`: string
- `status`: status
- `changeSummary`: string
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Optional Fields

- `sourceHash`: string
- `createdBy`: string
- `reviewedBy`: string
- `reviewedAt`: timestamp
- `publishedAt`: timestamp
- `archivedAt`: timestamp

### Example Document

```json
{
  "contentVersionId": "version-lesson-01-2026-05-10",
  "scope": "lesson",
  "scopeId": "lesson-01",
  "version": "2026.05.10-01",
  "status": "published",
  "changeSummary": "Initial structured version of lesson 01.",
  "sourceHash": "hash-value",
  "createdBy": "admin-uid",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "reviewedBy": "reviewer-uid",
  "reviewedAt": "timestamp",
  "publishedAt": "timestamp"
}
```

### Validation Rules

- `scope` must match a supported content type.
- `scopeId` must reference an existing content document.
- Published versions require `reviewedBy`, `reviewedAt`, and `publishedAt`.
- Archived versions must remain readable for rollback.

### Recommended Indexes

- `scope`, `scopeId`, `status`
- `status`, `updatedAt`

### Principle-Level Permissions

- Read: admin; published metadata may be public if useful.
- Write: admin-only.
- Delete: avoid physical delete.

## Safety Rules

### Question Exposure

- Do not assume full client-side exposure is acceptable forever.
- If question protection is required, load only the selected practice set.
- Avoid embedding protected exam banks in public pages.

### Admin Writes

- Do not allow client-side admin writes without approved Auth, roles, and Firestore rules.
- Content Manager must begin as local/staging-only.
- Production write paths require separate approval.

### Static Fallback

- Static fallback is mandatory until dynamic mode passes UAT.
- If dynamic data is invalid, missing, or blocked, the static site must continue working.

### Read-Only First

- First dynamic phase should read structured data only.
- No cloud writes until data contracts, rules, permissions, and rollback are reviewed.

## Open Decisions

### Are Questions Client-Side or Protected?

Options:

- Keep all questions client-side as today.
- Load question sets on demand by topic.
- Protect some exam banks behind authenticated access.

Decision required before Firestore migration.

### Does Legal/Standard Full Text Require Login?

Options:

- Keep published legal and standard learning hubs public.
- Require login for full dynamic rendering.
- Keep static public pages and dynamic admin-only versions.

Recommendation:

- Keep public access unless the site owner decides otherwise.

### Is Content Manager Admin-Only?

Recommendation:

- Yes. Content Manager should be admin-only and staging-first.
- Regular users should never see draft editing tools.

### Are Cloud Functions Needed?

Possible future uses:

- protected question selection
- server-side validation
- admin audit events
- scheduled content checks

Recommendation:

- Avoid Cloud Functions in the first phase to keep cost and complexity low.

## Implementation Boundary

Before any implementation:

- Review this contract.
- Approve schema names.
- Approve collection names.
- Approve permission model.
- Approve whether questions remain public.
- Confirm staging-only rollout.

No Firebase/Auth/Firestore files should be changed as part of this documentation step.

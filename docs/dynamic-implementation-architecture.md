# Dynamic Implementation Architecture

## Purpose

This document defines an implementation architecture for the dynamic version of the safety supervisor course site, based on `docs/dynamic-data-model.md`.

This is a planning document only. It does not implement code, does not change Firebase, Auth, Firestore, deploy configuration, or production.

## 1. Recommended Implementation Stages

### Stage 1: Static Inventory and Schema Validation

- Map current static pages, data files, links, quizzes, game topics, and search entries.
- Define JSON schemas for lessons, legal references, standards, questions, safety game challenges, content versions, and progress records.
- Validate exported static content locally before any dynamic loading is introduced.
- Keep all existing static pages as the source of truth during this stage.

### Stage 2: Local Dynamic Renderer Prototype

- Build a local-only renderer that can display one pilot lesson from structured JSON.
- Do not connect to Firestore.
- Use static JSON files or in-memory fixtures.
- Verify RTL, accordions, tabs, diagrams, tables, search, and internal navigation.

### Stage 3: Dynamic Questions Prototype

- Load questions from a structured local source.
- Keep `data/exam-questions.js` as fallback.
- Ensure quizzes, exam questions, and safety game can resolve the same topic IDs.
- Avoid duplicating full question lists inside lesson pages.

### Stage 4: Staging-Only Content Manager

- Add a management surface only after the renderer and schema are stable.
- Content Manager should initially write to local/staging-only data, not production.
- Add validation before save: required fields, duplicate IDs, broken internal links, empty explanations, and forbidden placeholders.

### Stage 5: Optional Firestore Read Mode

- Add Firestore reads only after approval of collections and rules.
- Reads should be feature-flagged.
- If dynamic reads fail, the site must fall back to static files.
- No Firestore writes in this stage.

### Stage 6: Optional Cloud Write Mode

- Enable admin writes only after explicit approval.
- Requires reviewed `firestore.rules`, admin role model, audit trail, and staging UAT.
- Production activation requires separate approval.

## 2. First Pages to Become Dynamic

Recommended order:

1. `pages/quizzes.html`
   - Lower content risk than full lessons.
   - Can consume questions by topic.
   - Easy to compare static vs dynamic behavior.

2. `pages/exam-questions.html`
   - Central question display.
   - Benefits from topic and difficulty filters.
   - Good candidate for shared question service.

3. `pages/safety-game.html`
   - Can use the same question/topic service.
   - Should not duplicate question content.

4. Pilot lesson page, preferably `pages/lesson-01.html`
   - Use as a renderer proof of concept.
   - Keep the static lesson page available as fallback.

5. Legal/standard learning hubs
   - `pages/labor-inspection-law-1954.html`
   - `pages/work-safety-ordinance-1970.html`
   - `pages/iso-45001-2018.html`
   - These should move only after the renderer handles long-form content reliably.

## 3. Proposed Services and Modules

### `ContentSourceService`

Responsible for choosing the content source:

- static HTML/data fallback
- local JSON fixtures
- staging dynamic data
- future Firestore read mode

Responsibilities:

- Check feature flags.
- Try dynamic source first only when enabled.
- Return normalized content objects.
- Fall back safely when dynamic data is missing or invalid.

### `LessonService`

Responsibilities:

- Load lesson metadata.
- Load sections and content blocks.
- Resolve related legal references, standards, and questions.
- Provide renderer-ready lesson data.

### `LegalReferenceService`

Responsibilities:

- Load laws, ordinances, regulations, and related sections.
- Preserve legal section numbers.
- Expose source verification status.
- Link to related lessons and questions.

### `StandardService`

Responsibilities:

- Load standards such as ISO 45001.
- Preserve clause numbering.
- Link standards to lessons, checklists, and questions.

### `QuestionService`

Responsibilities:

- Load questions by lesson, topic, difficulty, tags, or category.
- Validate each question has four answers, one correct answer, and an explanation.
- Serve quizzes, exam questions, and safety game from one normalized model.

### `SafetyGameService`

Responsibilities:

- Load game challenge definitions.
- Resolve question IDs through `QuestionService`.
- Avoid duplicating question text in game data when possible.
- Support topic-based challenge routing.

### `SearchService`

Responsibilities:

- Load static or dynamic search index.
- Keep entries short and route to source pages.
- Avoid indexing full duplicated content.
- Support Hebrew search keywords and aliases.

### `ProgressService`

Responsibilities:

- Track local reading progress first.
- Future Cloud Mode may store progress by user ID.
- Must support export/delete of personal progress if cloud storage is enabled.

### `ContentVersionService`

Responsibilities:

- Track content version IDs.
- Compare static and dynamic versions.
- Support rollback to a known published version.
- Record approval metadata for future admin workflows.

### `AdminPermissionService`

Responsibilities:

- Separate user, content admin, and super admin roles.
- Block write actions unless role and environment are allowed.
- Keep admin operations staging-only until production approval.

## 4. Static Fallback Strategy

Fallback is mandatory throughout the migration.

### Fallback Rules

- If dynamic feature flag is off, use static site behavior.
- If dynamic data fails validation, use static fallback.
- If Firestore is unavailable, use static fallback.
- If user is not authorized for admin content, block writes and keep read-only mode.
- If a dynamic page cannot render, route to the existing static page.

### Fallback Sources

- Static HTML pages remain available.
- `data/exam-questions.js` remains available for questions.
- `data/game-data.js` remains available for safety game.
- `data/search-index.js` remains available for search.

### User Experience

- Users should not see backend errors.
- If dynamic content is unavailable, the page should still load the static version.
- Admin users may see a staging-only warning when dynamic content fails validation.

## 5. On-Demand Content Loading

The dynamic version should avoid loading the whole course at once.

### Loading Pattern

- Load page shell first.
- Load metadata for the current route.
- Load only the current lesson, legal reference, standard, or topic.
- Load related questions only when the user opens practice or quiz areas.
- Load search index lazily when search is used.

### Benefits

- Lower Firestore read costs.
- Faster initial page load.
- Smaller memory footprint.
- Easier rollback per content type.

### Suggested Caching

- Cache content in memory for the current session.
- Optional localStorage cache for published read-only content, with version checking.
- Never cache sensitive personal data without explicit consent.

## 6. Keeping Firestore Costs Low

### Cost Controls

- Use one document per logical page or topic, not one read per tiny block unless needed.
- Load questions by topic only when required.
- Avoid real-time listeners for static learning content.
- Prefer one-time reads for published content.
- Cache published content client-side with `contentVersionId`.
- Use denormalized summaries for index pages.
- Keep search index compact.

### Avoid in Early Stages

- No broad collection scans.
- No real-time listeners for lessons.
- No Cloud Functions unless a clear requirement appears.
- No per-keystroke Firestore search.
- No storing large full-text duplicates in multiple collections.

## 7. Admin/User Permissions

### User

- Can view published content.
- Can practice questions.
- Can store local progress.
- Future Cloud Mode may store progress only after consent.

### Content Admin

- Can create and edit drafts.
- Can validate content.
- Can preview staging content.
- Cannot deploy to production.
- Cannot change Firestore rules.

### Super Admin

- Can approve published content.
- Can manage roles.
- Can approve Cloud Mode rollout.
- Still requires explicit approval for production deploy or rules changes.

### Required Guardrails

- Admin writes disabled by default.
- Production writes blocked unless explicitly enabled.
- Staging banner for admin mode.
- Audit log for future content changes.

## 8. Gradual Migration Plan

### Phase A: Read-Only Local Model

- Create local JSON schema.
- Validate one lesson and one topic.
- No Firebase changes.

### Phase B: Shared Question Model

- Normalize questions into one model.
- Connect quizzes, exam questions, and safety game to the shared model.
- Keep current data files as fallback.

### Phase C: Pilot Lesson Renderer

- Render one lesson from structured content.
- Compare static and dynamic outputs.
- Keep the original static page.

### Phase D: Dynamic Index Pages

- Convert index-like pages to consume summaries:
  - quizzes
  - exam questions
  - safety game
  - field tools
  - laws/standards

### Phase E: Staging Firestore Read Mode

- Add Firestore reads behind a feature flag.
- Use staging project only.
- Validate rules before enabling.

### Phase F: Admin Draft Workflow

- Draft content creation.
- Validation.
- Review.
- Publish to staging.

### Phase G: Production Candidate

- UAT.
- Security review.
- Rollback tested.
- Manual approval from site owner.

## 9. Tests for Each Stage

### Schema Stage

- Validate required fields.
- Detect duplicate IDs.
- Detect empty content blocks.
- Detect broken internal links.
- Detect invalid topic IDs.

### Renderer Stage

- Page loads with no console errors.
- RTL remains intact.
- Accordions and tabs work.
- Tables do not overflow.
- Header does not hide anchors.
- Mobile layout is usable.

### Questions Stage

- Every question has four answers.
- Correct answer exists.
- Explanation is not empty.
- Topic and lesson IDs resolve.
- Quiz and game use the same source.

### Search Stage

- Search returns expected pages.
- Search entries are summaries, not copied full content.
- Hebrew keywords work.
- No broken URLs.

### Firestore Read Stage

- Feature flag off uses static fallback.
- Feature flag on reads staging data only.
- Firestore unavailable triggers fallback.
- No writes occur.

### Admin Stage

- Unauthorized users cannot edit.
- Admin users can save drafts only in staging.
- Validation blocks unsafe or incomplete content.
- Audit log records draft changes.

### Pre-Production Stage

- Full link check.
- Console check.
- Mobile check.
- Security review.
- Manual UAT approval.
- Rollback rehearsal.

## 10. Rollback Plan

### Immediate Rollback

- Disable dynamic feature flag.
- Serve static pages and static data files.
- Keep existing routes unchanged.

### Content Rollback

- Revert `contentVersionId` to the last approved version.
- Keep previous published versions available.
- Record rollback reason and approver.

### Deploy Rollback

- Use Firebase Hosting release rollback only if staging/production deploy was involved.
- Production rollback requires explicit approval and should be documented.

### Data Rollback

- Do not delete old content versions.
- Mark bad versions as archived.
- Restore from validated export if needed.

## 11. Files and Areas Not to Touch Without Approval

The following must not be changed without explicit approval:

- production environment
- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `js/auth.js`
- `js/firebase-config.js`
- production deploy configuration
- production Firebase project selection
- any Firestore write path
- any user data collection path

## Recommended Next Step

Create local JSON schemas and validation scripts for:

- lessons
- questions
- content versions

Then choose one low-risk pilot, preferably dynamic question loading for `pages/quizzes.html`, while keeping all existing static data files as fallback.

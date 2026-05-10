# Dynamic Migration Plan

## Purpose

This document defines a staged migration plan from the current static course website to a dynamic application architecture.

It is based on:

- `docs/dynamic-data-model.md`
- `docs/dynamic-implementation-architecture.md`

This is a planning document only. No code, scripts, Firebase, Auth, Firestore, or deploy changes are included.

## 1. Existing Static Sources

### Lesson Pages

Current lesson pages are static HTML and should initially remain the source of truth.

Expected sources include:

- `pages/lesson-01.html`
- `pages/lesson-02.html`
- `pages/lesson-03.html`
- `pages/lesson-04.html`
- `pages/lesson-05.html`
- `pages/lesson-07.html`
- `pages/lesson-08.html`
- `pages/lesson-10.html`
- `pages/lesson-11.html`
- Any future `pages/lesson-*.html`

These pages contain long-form learning content, visual explanations, tables, diagrams, practice cards, and internal navigation.

### Legal Source Pages

Legal and regulatory learning hubs should remain dedicated source pages during migration.

Expected sources include:

- `pages/labor-inspection-law-1954.html`
- `pages/work-safety-ordinance-1970.html`
- `pages/laws.html`
- `pages/field-tools.html`

The dedicated law/ordinance pages should be treated as the authoritative learning hubs for their subjects. Index pages such as `laws.html` and `field-tools.html` should remain navigation pages rather than full content duplicates.

### Standards Pages

Standards should remain separate from laws and lesson summaries.

Expected sources include:

- `pages/iso-45001-2018.html`
- `pages/standards.html`
- Any future standard-specific page

### Question Data

Main static question source:

- `data/exam-questions.js`

This file is currently the practical source for exam questions, topic assignments, difficulty levels, answers, and explanations.

### Safety Game Data

Main static safety game source:

- `data/game-data.js`

This file contains game topics, challenge units, and question references or embedded challenge content.

### Search Index

Main static search source:

- `data/search-index.js`

The search index should remain concise. It should not become a duplicate store for full lesson, legal, or standard content.

### Additional Static Navigation and Course Sources

Potential supporting sources:

- `index.html`
- `pages/syllabus.html`
- `pages/quizzes.html`
- `pages/exam-questions.html`
- `pages/safety-game.html`
- `data/course-data.js`

These files may contain metadata, links, labels, and topic routing that need to be mapped carefully.

## 2. Source to Collection Mapping

### Lessons

Static source:

- `pages/lesson-*.html`
- supporting metadata from `pages/syllabus.html`
- possible topic metadata from `data/course-data.js`

Target collection:

- `lessons`

Mapped fields:

- `lessonId`
- `courseId`
- `title`
- `slug`
- `summary`
- `sections`
- `relatedLegalRefs`
- `relatedStandards`
- `questionTopicIds`
- `status`
- `order`
- `contentVersionId`

Migration note:

Lesson content should first be represented as structured local JSON before any Firestore import is considered.

### Legal Sources

Static source:

- `pages/labor-inspection-law-1954.html`
- `pages/work-safety-ordinance-1970.html`
- legal cards in `pages/laws.html`
- legal cards in `pages/field-tools.html`

Target collection:

- `legalSources`

Recommended document IDs:

- `labor-inspection-law-1954`
- `work-safety-ordinance-1970`

Mapped fields:

- `legalSourceId`
- `type`
- `title`
- `slug`
- `sourceStatus`
- `sections`
- `relatedLessons`
- `relatedQuestions`
- `status`
- `contentVersionId`

Migration note:

Preserve section numbers, quotes, and source verification notes. Do not infer legal duties that are not present in the approved content.

### Standards

Static source:

- `pages/iso-45001-2018.html`
- cards in `pages/standards.html`
- relevant links in `pages/field-tools.html`

Target collection:

- `standards`

Recommended document IDs:

- `iso-45001-2018`

Mapped fields:

- `standardId`
- `title`
- `slug`
- `standardFamily`
- `year`
- `sections`
- `relatedLessons`
- `questionTopicIds`
- `status`
- `contentVersionId`

Migration note:

Preserve ISO clause numbers as standard clauses, not as generic lesson numbering.

### Questions

Static source:

- `data/exam-questions.js`

Target collection:

- `questions`

Mapped fields:

- `questionId`
- `topicId`
- `lessonId`
- `category`
- `difficulty`
- `question`
- `answers`
- `correctAnswerId`
- `explanation`
- `tags`
- `status`
- `contentVersionId`

Migration note:

Questions should be migrated before long-form lessons because they are easier to validate quantitatively.

### Game Units

Static source:

- `data/game-data.js`

Target collection:

- `gameUnits`

Mapped fields:

- `gameUnitId`
- `title`
- `topicId`
- `description`
- `questionIds`
- `rules`
- `status`
- `contentVersionId`

Migration note:

Where possible, game units should reference question IDs rather than duplicating full question text.

### Search Documents

Static source:

- `data/search-index.js`

Target collection:

- `searchDocuments`

Mapped fields:

- `searchDocumentId`
- `type`
- `title`
- `url`
- `keywords`
- `summary`
- `sourceId`
- `contentVersionId`

Migration note:

Search documents should contain summaries and keywords only, not full copied lesson content.

### Content Versions

Static source:

- Git commit history
- file timestamps where available
- manually assigned content release labels

Target collection:

- `contentVersions`

Mapped fields:

- `contentVersionId`
- `scope`
- `scopeId`
- `version`
- `status`
- `changeSummary`
- `createdBy`
- `createdAt`
- `approvedBy`
- `approvedAt`

Migration note:

During early migration, content version records can be maintained locally or in staging-only fixtures.

## 3. Recommended Migration Order

### Step 1: Read-Only Dynamic Loading

Goal:

- Prove that dynamic content can be loaded and rendered without changing the user-facing static site behavior.

Actions:

- Define local JSON fixtures for one question topic.
- Load data only when a feature flag is enabled.
- Keep static fallback active.
- Do not write to Firestore.

Recommended first target:

- `pages/quizzes.html`

### Step 2: Admin Import

Goal:

- Prepare a controlled import path from static content to structured data.

Actions:

- Design import review process.
- Validate imported IDs, section counts, question counts, links, and required fields.
- Keep imported data as draft.
- Do not expose draft content to normal users.

### Step 3: Content Manager

Goal:

- Allow staging-only content management after the import model is reliable.

Actions:

- Add draft/edit/review/publish states.
- Add validation before saving.
- Add audit trail.
- Keep production writes disabled.

### Step 4: Progress and Users

Goal:

- Add user-specific learning progress only after content loading is stable.

Actions:

- Start with local progress.
- Define privacy notice and data deletion/export plan.
- Add Auth only after approval.
- Add Cloud Mode only after rules review.

### Step 5: Production Readiness

Goal:

- Prepare a production candidate only after staging UAT.

Actions:

- Run link checks.
- Run console checks.
- Run mobile checks.
- Validate fallback behavior.
- Review Firestore rules if Cloud Mode is involved.
- Require manual approval before production deploy.

## 4. Fallback Strategy

### If Firestore Is Not Available

- Keep static HTML pages available.
- Load static JS data files for questions, game, and search.
- Show no backend error to regular users.
- Admin mode may show a staging-only diagnostic message.

### If Content Is Not Published

- Do not show draft content to regular users.
- Use last published static or dynamic version.
- If no published dynamic version exists, use the static page.

### If User Is Not Logged In

- Public learning content remains readable if it is public today.
- Practice can use local/static mode.
- Progress is stored locally only, or not stored, depending on the feature stage.
- Admin and editing actions remain unavailable.

### If Data Is Invalid

- Block dynamic rendering of that item.
- Log validation error in staging diagnostics.
- Fall back to static source.
- Do not publish invalid content.

## 5. Migration Tests

### Chapter and Section Count Comparison

For each migrated lesson/legal/standard page:

- Count static sections.
- Count migrated structured sections.
- Verify no section title is missing.
- Verify legal and standard clause numbers are preserved.

### Question Count Comparison

For each topic:

- Compare static question count to migrated question count.
- Verify difficulty distribution.
- Verify each question has four answers.
- Verify the correct answer exists.
- Verify explanation is not empty.

### Link Validation

- Internal links resolve.
- Practice buttons route to quiz pages.
- Legal/standard links route to their dedicated pages.
- Search results route to source pages.

### Search Validation

Verify search works for:

- lesson titles
- legal source names
- standard names
- key professional terms
- aliases and common Hebrew search phrases

### RTL Validation

- Hebrew layout remains RTL.
- Tables keep correct reading order.
- Accordions and tabs are keyboard accessible.
- Diagrams do not rely on broken text arrows.

### Mobile Validation

- Tables scroll inside wrappers.
- Sticky navigation does not hide content.
- Buttons remain tappable.
- Long titles wrap correctly.

## 6. Rollback Plan

### Return to Static Version

Rollback should be possible by:

- Turning off the dynamic feature flag.
- Serving existing static HTML.
- Using `data/exam-questions.js`, `data/game-data.js`, and `data/search-index.js`.
- Keeping all existing static routes unchanged.

### Files Not to Touch Without Approval

- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `js/auth.js`
- `js/firebase-config.js`
- production deploy configuration
- production project selection
- existing production data paths

### Production Safety Checks

Before any production candidate:

- Confirm staging passed UAT.
- Confirm dynamic feature flags can be disabled.
- Confirm static fallback still works.
- Confirm Firestore rules were reviewed if Firestore is used.
- Confirm no production deploy command is run without explicit approval.

## 7. Open Decisions

### Should the Full Question Bank Be Exposed Client-Side?

Options:

- Keep current client-side model for simplicity.
- Load only selected topic questions on demand.
- In future authenticated mode, restrict some exam modes server-side.

Decision needed:

- Balance simplicity, cost, and exam integrity.

### Should Content Load Only for Logged-In Users?

Options:

- Keep learning content public, as today.
- Require login only for progress and personalized features.
- Require login for all dynamic content.

Recommendation:

- Keep public learning content available unless the site owner decides otherwise.

### Should the Admin Content Manager Be Local/Staging-Only at First?

Recommendation:

- Yes. Admin editing should begin as local/staging-only.
- Production writes should remain blocked until rules, audit, and approval flow are ready.

### Should Course and EHS Use Separate Hosting Targets?

Open question:

- Separating hosting targets may reduce deployment risk between the course site and EHS module.
- It may also increase operational complexity.

Recommendation:

- Decide before production rollout of dynamic features.
- Do not change `firebase.json` without a separate reviewed plan.

## 8. Recommended Next Step

Create a read-only migration inventory in documentation or local JSON fixtures:

- list all lesson pages
- list all legal and standard pages
- count questions by topic
- list game units
- list search entries

No scripts or code should be added until the inventory format is approved.

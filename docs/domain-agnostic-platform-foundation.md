# Domain-Agnostic Learning Platform Foundation

Phase 8 starts the separation between the learning platform and the active course content.

## Platform Core

Platform Core is the shared layer that should remain useful for every future course:

- courses portal
- course and domain metadata
- shell/navigation conventions
- read aloud support
- visual operational components
- content ingestion conventions
- local client-side helpers

The current platform foundation files are:

- `data/platform-config.js`
- `data/courses-map.js`
- `data/domains-map.js`
- `js/platform-core.js`

## Course Content

Course Content is everything specific to a course or professional domain:

- summaries
- prep pages
- lesson timeline
- knowledge pages
- glossary terms
- questions
- checklists
- templates
- related laws and regulations

At this stage, the only active course is `safety-officer`.

## Adding A Future Course

When adding a new course later:

1. Add a course record to `data/courses-map.js`.
2. Add a matching domain record to `data/domains-map.js`.
3. Create course-scoped content maps for summaries, questions, glossary and checklists.
4. Create course entry pages only after the current URL strategy is approved.
5. Keep existing `safety-officer` routes unchanged.

Future courses should remain `coming-soon` until their content, links and tests are complete.

## Future Course Scoping

The long-term target is for these resources to become course-scoped:

- glossary terms by `courseId`
- summaries by `courseId`
- prep pages by `courseId`
- question datasets by `courseId`
- checklists by `courseId`
- templates by `courseId`
- knowledge relations by `courseId` and `domainId`

This phase does not move content into new folders and does not create `/courses/safety-officer/`.

## What Has Not Moved Yet

The following remain legacy course-specific paths for stability:

- `index.html`
- `pages/summaries/*`
- `pages/prep/*`
- `pages/knowledge/*`
- `pages/checklists.html`
- `pages/templates.html`
- `pages/glossary.html`
- quiz and exam data

This is intentional. Phase 8 is metadata and helper foundation only.

## Phase 9: Course-Scoped Data

Phase 9 adds course scope metadata without changing public URLs or moving files.

The active course remains:

- `courseId`: `safety-officer`
- `domainId`: `safety`

Course scope has been added to these local data layers:

- content ingestion lessons, prep pages, summary pages and latest updates
- summary question set metadata
- prep question set metadata
- checklist map and checklist items
- knowledge pages, lesson relations, glossary terms and last lesson update

The question text, answer order, `correctIndex` values and summary counts remain unchanged.

## Course Scope Contract

Every future content entity should include:

- `courseId`
- `domainId`

For the current course, use:

```js
courseId: "safety-officer",
domainId: "safety"
```

Question banks should keep question records stable and place course metadata at the question set level unless a future renderer needs per-question course filtering.

## Validation

Use:

```bash
node scripts/check-course-scope.js
```

The script verifies that scoped content points to a known course, that `safety-officer` is the only active course, and that the current maps have course/domain metadata.

## Still Not Course-Scoped

These remain intentionally stable until a later migration:

- physical file locations
- Firebase routing
- existing `pages/*` URLs
- quiz engine data outside the new metadata layer
- template form definitions
- per-course shell routing

Future courses should first add maps and metadata, then introduce URLs only after the route strategy is approved.

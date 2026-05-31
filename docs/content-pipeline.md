# Content Pipeline

This pipeline is a safety layer for managing the Safety Officer course source files from:

`C:\Users\Administrator\Desktop\קורס ממונה בטיחות\הכנה וסיכומי הרצאות\TO_WRBSITE`

It is intentionally dry-run-first. It does not generate HTML, does not overwrite existing pages, does not change question datasets, and does not touch Auth, Firestore, or production.

## Commands

```powershell
npm run content:scan
npm run content:audit
npm run content:validate
```

### `content:scan`

Scans the source folder and writes:

`content/course-content-manifest.json`

Each manifest item includes:

- `lessonNumber`
- `contentType`: `prep` or `summary`
- `sourceFile`
- `sourcePath`
- `extension`
- `hash`
- `modifiedAt`
- `status`
- `existingSitePage`
- `questionCountDetected`
- `notes`

The source folder can be overridden for testing:

```powershell
$env:COURSE_CONTENT_SOURCE_DIR="C:\path\to\TO_WRBSITE"
npm run content:scan
```

### `content:audit`

Compares the manifest against:

- `pages/prep`
- `pages/summaries`
- `data/content-ingestion-map.js`
- `data/learning-path-map.js`
- `data/prep-questions-map.js`
- `data/summary-questions-map.js`

It reports:

- what exists on the site
- what is missing
- content map gaps
- learning path gaps
- question-count gaps

### `content:validate`

Checks that the pipeline remains safe:

- no duplicate source hashes
- every file has a lesson number
- every file is classified as `prep` or `summary`
- every source file still exists
- no existing HTML page is unexpectedly modified
- the manifest remains `dryRun: true`

## Recovery Plan

If the site is lost or badly damaged:

1. Restore the repository baseline from git.
2. Run `npm run content:scan` against `TO_WRBSITE`.
3. Run `npm run content:audit` to identify what must be rebuilt.
4. Extract each `.docx` source into structured content.
5. Rebuild prep pages and summary pages from the manifest, one lesson at a time or through a future reviewed generator.
6. Rebuild question datasets from detected question blocks.
7. Update `content-ingestion-map.js` and `learning-path-map.js`.
8. Run all validation scripts.
9. Deploy to staging only.
10. Promote to production only after manual QA.

## Not Automated Yet

- HTML page generation.
- Question extraction into final datasets.
- Correct-answer and trap validation.
- Automatic updates to `content-ingestion-map.js`.
- Automatic updates to `learning-path-map.js`.
- Production deployment.

Those steps should remain gated behind explicit review until the import logic is proven safe.

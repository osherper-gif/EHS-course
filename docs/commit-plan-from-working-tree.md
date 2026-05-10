# Commit Plan From Working Tree

תאריך: 2026-05-10  
מבוסס על: `docs/working-tree-change-audit.md`  
Branch נוכחי: `codex/fix-gibberish-sitewide-20260510`

מטרת המסמך: תוכנית commits מדויקת לפיצול ה־working tree הנוכחי לפי קבוצות עבודה, בלי לערבב קורס עם EHS, תוכן עם deploy config, או scripts עם תוכן כאשר אין תלות ישירה.

לא בוצעו `git add`, לא בוצע `git commit`, לא בוצע deploy.

## עקרונות ביצוע

- לבצע כל commit בנפרד ולבדוק `git diff --cached` לפני commit.
- להשתמש בפקודות `git add` המופיעות כאן רק לאחר אישור ידני.
- אם קובץ מופיע ביותר מקבוצה אחת, עדיף להשתמש ב־`git add -p` במקום `git add` מלא.
- לא לכלול `firebase.json` באף commit עד שמתקבלת החלטה על deploy course-only מול EHS.
- לא לערבב קבצי EHS עם קבצי אתר הקורס.
- לא לערבב `portal.html` / `courses.html` עם EHS core או עם תוכן שיעורים.
- לא לערבב שאלות ו־game data עם UI, אלא אם בדיקה ידנית מאשרת תלות ישירה.

## Commit 1 — QA scripts and audit reports

**שם commit מומלץ**

`chore: add QA audit scripts and reports`

**מטרה**

לשמור סקריפטים ודוחות בדיקה שעוזרים לנקות ולייצב את האתר, בלי להכניס שינוי תוכן או UI.

**קבצים להוספה**

- `scripts/check-gibberish-content.js`
- `scripts/check-interactive-controls.js`
- `scripts/check-duplicate-content.js`
- `docs/sitewide-gibberish-cleanup-20260510.md`
- `docs/sitewide-ui-bugfix-20260510-report.md`
- `docs/sitewide-duplicate-content-audit.md`
- `docs/working-tree-change-audit.md`
- `docs/commit-plan-from-working-tree.md`

**פקודת git add**

```powershell
git add scripts/check-gibberish-content.js scripts/check-interactive-controls.js scripts/check-duplicate-content.js docs/sitewide-gibberish-cleanup-20260510.md docs/sitewide-ui-bugfix-20260510-report.md docs/sitewide-duplicate-content-audit.md docs/working-tree-change-audit.md docs/commit-plan-from-working-tree.md
```

**בדיקות לפני commit**

```powershell
node --check scripts/check-gibberish-content.js
node --check scripts/check-interactive-controls.js
node --check scripts/check-duplicate-content.js
npm run check:links
```

**סיכון / הערות**

דוחות JSON כמו `docs/gibberish-content-scan.json`, `docs/duplicate-content-scan.json`, `docs/site-wide-content-cleanup-scan.json` הם artifacts. מומלץ לא להכניס אותם אלא אם רוצים לשמר תוצאות סריקה.

**דורש אישור ידני לפני commit**

לא, למעט החלטה האם לכלול artifacts.

## Commit 2 — Content cleanup and gibberish fixes

**שם commit מומלץ**

`fix: clean gibberish in course content and search index`

**מטרה**

לתקן ג׳יבריש, טקסט משובש ואינדקס חיפוש, בלי לערבב תוספות תוכן גדולות או UI רחב.

**קבצים להוספה**

- `data/search-index.js`
- `pages/field-tools.html`
- `pages/laws.html`
- `scripts/rebuild-clean-search-index.js`
- `docs/sitewide-gibberish-cleanup-20260510.md`

**פקודת git add**

```powershell
git add data/search-index.js pages/field-tools.html pages/laws.html scripts/rebuild-clean-search-index.js docs/sitewide-gibberish-cleanup-20260510.md
```

**בדיקות לפני commit**

```powershell
node --check data/search-index.js
node --check scripts/rebuild-clean-search-index.js
node scripts/check-gibberish-content.js
npm run check:links
```

**סיכון / הערות**

`pages/field-tools.html` ו־`pages/laws.html` עשויים להכיל גם קישורי תוכן חדשים מעבר לניקוי ג׳יבריש. אם רוצים commit נקי לגמרי, להשתמש ב־`git add -p` עבורם.

**דורש אישור ידני לפני commit**

כן, אם כוללים את כל `pages/field-tools.html` ו־`pages/laws.html` ללא `git add -p`.

## Commit 3 — Lesson 01 and 02 cleanup only

**שם commit מומלץ**

`fix: clean imported text in lessons 01 and 02`

**מטרה**

לטפל בכותרות/טקסטים משובשים בשיעורים 1 ו־2 בלבד, בלי להכניס את כל הרחבות התוכן הגדולות.

**קבצים להוספה**

- `pages/lesson-01.html`
- `pages/lesson-02.html`

**פקודת git add**

```powershell
git add -p pages/lesson-01.html pages/lesson-02.html
```

**בדיקות לפני commit**

```powershell
node scripts/check-gibberish-content.js
npm run check:links
```

**סיכון / הערות**

הקבצים מעורבים: גם תוכן שיעור רחב וגם ניקוי ג׳יבריש. חובה להשתמש ב־`git add -p`; לא מומלץ `git add` מלא בשלב זה.

**דורש אישור ידני לפני commit**

כן.

## Commit 4 — Sitewide UI bug fixes

**שם commit מומלץ**

`fix: improve sitewide UI controls and learning layouts`

**מטרה**

לתקן UI, כפתורים, חצים, מספור, header/anchors ותצוגת דפים ארוכים.

**קבצים להוספה**

- `css/styles.css`
- `admin.html`
- `pages/version-management.html`
- `pages/safety-management.html`
- `scripts/check-interactive-controls.js`
- `docs/sitewide-ui-bugfix-20260510-report.md`

**פקודת git add**

```powershell
git add css/styles.css admin.html pages/version-management.html pages/safety-management.html scripts/check-interactive-controls.js docs/sitewide-ui-bugfix-20260510-report.md
```

**בדיקות לפני commit**

```powershell
node --check scripts/check-interactive-controls.js
node scripts/check-interactive-controls.js
npm run check:links
```

**סיכון / הערות**

`css/styles.css` הוא שינוי גדול מאוד ויכול להשפיע על כל האתר. יש לבצע בדיקה ויזואלית ידנית בדסקטופ ובמובייל לפני commit.

**דורש אישור ידני לפני commit**

כן.

## Commit 5 — Duplicate content cleanup

**שם commit מומלץ**

`refactor: replace duplicate content with internal references`

**מטרה**

לשמור תיקוני כפילויות והפניות פנימיות בלי לערבב עם תוכן חדש.

**קבצים להוספה**

- `scripts/check-duplicate-content.js`
- `docs/sitewide-duplicate-content-audit.md`

אם היו תיקוני כפילויות בתוך דפי תוכן, יש להוסיף אותם ב־`git add -p` בלבד:

- `pages/lesson-01.html`
- `pages/lesson-02.html`
- `pages/field-tools.html`
- `pages/laws.html`
- `pages/standards.html`

**פקודת git add**

```powershell
git add scripts/check-duplicate-content.js docs/sitewide-duplicate-content-audit.md
git add -p pages/lesson-01.html pages/lesson-02.html pages/field-tools.html pages/laws.html pages/standards.html
```

**בדיקות לפני commit**

```powershell
node --check scripts/check-duplicate-content.js
node scripts/check-duplicate-content.js
npm run check:links
```

**סיכון / הערות**

יש לוודא שלא נמחק תוכן מלא בלי שיש דף מקור מלא חלופי.

**דורש אישור ידני לפני commit**

כן.

## Commit 6 — Lesson 01 and 02 content expansion

**שם commit מומלץ**

`feat: expand lessons 01 and 02 learning content`

**מטרה**

להכניס הרחבות תוכן לשיעור 1 ושיעור 2 לפי קובצי השיעור, כולל תרשימים, טבלאות ומבנה Learning Hub.

**קבצים להוספה**

- `pages/lesson-01.html`
- `pages/lesson-02.html`
- `docs/lesson-01-02-content-gap-report.md`

Artifacts אפשריים, רק אם רוצים לשמר מקורות יבוא:

- `docs/lesson-01-02-content-gap-report-data.json`
- `docs/lesson-01-02-docx-extract.json`
- `docs/lesson-01-02-question-import-report.json`

**פקודת git add**

```powershell
git add pages/lesson-01.html pages/lesson-02.html docs/lesson-01-02-content-gap-report.md
```

אם מאשרים artifacts:

```powershell
git add docs/lesson-01-02-content-gap-report-data.json docs/lesson-01-02-docx-extract.json docs/lesson-01-02-question-import-report.json
```

**בדיקות לפני commit**

```powershell
npm run check:links
node scripts/check-gibberish-content.js
```

**סיכון / הערות**

קבצים אלה כבר הוגדרו כמעורבים. אם commit 3 בוצע קודם עם `git add -p`, לוודא שכאן נשאר רק תוכן הרחבה ולא תיקוני ג׳יבריש שכבר נכנסו.

**דורש אישור ידני לפני commit**

כן.

## Commit 7 — Labor inspection law page

**שם commit מומלץ**

`feat: add labor inspection law learning hub`

**מטרה**

להוסיף את דף חוק ארגון הפיקוח על העבודה, JS ייעודי, קישורים ודוח מקצועי.

**קבצים להוספה**

- `pages/labor-inspection-law-1954.html`
- `js/labor-inspection-law-page.js`
- `docs/labor-inspection-law-1954-dev-notes.md`
- `docs/labor-inspection-law-1954-docx-extract.json`

אם הקישורים לדף נוספו בדפים קיימים, להוסיף ב־`git add -p`:

- `pages/field-tools.html`
- `pages/laws.html`
- `pages/quizzes.html`
- `pages/exam-questions.html`
- `pages/safety-game.html`
- `data/search-index.js`
- `sitemap.xml`

**פקודת git add**

```powershell
git add pages/labor-inspection-law-1954.html js/labor-inspection-law-page.js docs/labor-inspection-law-1954-dev-notes.md docs/labor-inspection-law-1954-docx-extract.json
git add -p pages/field-tools.html pages/laws.html pages/quizzes.html pages/exam-questions.html pages/safety-game.html data/search-index.js sitemap.xml
```

**בדיקות לפני commit**

```powershell
node --check js/labor-inspection-law-page.js
node --check data/search-index.js
npm run check:links
node scripts/check-gibberish-content.js
```

**סיכון / הערות**

בדפי הקישורים יש שינויים מעורבים. לא להשתמש ב־`git add` מלא בלי סקירה.

**דורש אישור ידני לפני commit**

כן.

## Commit 8 — Work safety ordinance page

**שם commit מומלץ**

`feat: add work safety ordinance learning hub`

**מטרה**

להוסיף את דף פקודת הבטיחות בעבודה, JS ייעודי, קישורים ודוחות מקור.

**קבצים להוספה**

- `pages/work-safety-ordinance-1970.html`
- `js/work-safety-ordinance-page.js`
- `docs/work-safety-ordinance-1970-docx-extract.json`

אם קישורים עודכנו בדפים קיימים, להוסיף ב־`git add -p`:

- `pages/field-tools.html`
- `pages/laws.html`
- `pages/quizzes.html`
- `pages/exam-questions.html`
- `pages/safety-game.html`
- `data/search-index.js`
- `sitemap.xml`

**פקודת git add**

```powershell
git add pages/work-safety-ordinance-1970.html js/work-safety-ordinance-page.js docs/work-safety-ordinance-1970-docx-extract.json
git add -p pages/field-tools.html pages/laws.html pages/quizzes.html pages/exam-questions.html pages/safety-game.html data/search-index.js sitemap.xml
```

**בדיקות לפני commit**

```powershell
node --check js/work-safety-ordinance-page.js
node --check data/search-index.js
npm run check:links
node scripts/check-gibberish-content.js
```

**סיכון / הערות**

לוודא שהדף לא משכפל תוכן מלא בתוך שיעור 2, אלא מפנה אליו כדף מקור.

**דורש אישור ידני לפני commit**

כן.

## Commit 9 — ISO 45001 content

**שם commit מומלץ**

`feat: add ISO 45001 learning hub`

**מטרה**

להוסיף דף תקן ISO 45001, דוח תוכן וקישורים רלוונטיים.

**קבצים להוספה**

- `pages/iso-45001-2018.html`
- `docs/iso-45001-2018-content-report.md`

Artifacts אפשריים:

- `docs/iso-45001-2018-docx-extract.json`
- `docs/iso-45001-2018-import-data.json`

אם קישורים עודכנו בדפים קיימים, להוסיף ב־`git add -p`:

- `pages/field-tools.html`
- `pages/laws.html`
- `pages/standards.html`
- `pages/quizzes.html`
- `pages/exam-questions.html`
- `pages/safety-game.html`
- `data/search-index.js`
- `sitemap.xml`

**פקודת git add**

```powershell
git add pages/iso-45001-2018.html docs/iso-45001-2018-content-report.md
git add -p pages/field-tools.html pages/laws.html pages/standards.html pages/quizzes.html pages/exam-questions.html pages/safety-game.html data/search-index.js sitemap.xml
```

אם מאשרים artifacts:

```powershell
git add docs/iso-45001-2018-docx-extract.json docs/iso-45001-2018-import-data.json
```

**בדיקות לפני commit**

```powershell
node --check data/search-index.js
npm run check:links
node scripts/check-gibberish-content.js
```

**סיכון / הערות**

בדף ISO עצמו היו גם תיקוני ג׳יבריש. אם הם כבר נכנסו ב־commit קודם, לוודא שאין כפילות staging.

**דורש אישור ידני לפני commit**

כן.

## Commit 10 — Questions and safety game data

**שם commit מומלץ**

`feat: add exam questions and safety game topics`

**מטרה**

לרכז את מאגר השאלות ואת אתגר הבטיחות, בלי לערבב עם UI או דפי תוכן.

**קבצים להוספה**

- `data/exam-questions.js`
- `data/game-data.js`

רק אם יש תלות ישירה בתצוגת השאלות:

- `pages/exam-questions.html`
- `pages/quizzes.html`
- `pages/safety-game.html`

**פקודת git add**

```powershell
git add data/exam-questions.js data/game-data.js
```

אם מאשרים תלות UI:

```powershell
git add pages/exam-questions.html pages/quizzes.html pages/safety-game.html
```

**בדיקות לפני commit**

```powershell
node --check data/exam-questions.js
node --check data/game-data.js
npm run check:links
node scripts/check-gibberish-content.js
```

**סיכון / הערות**

שני קובצי הנתונים גדולים מאוד. מומלץ לבדוק שאין כפילויות ושכל שאלה כוללת תשובה נכונה והסבר.

**דורש אישור ידני לפני commit**

כן.

## Commit 11 — Course data, syllabus and sitemap

**שם commit מומלץ**

`chore: update course metadata and navigation`

**מטרה**

לעדכן metadata, סילבוס, sitemap וקישורי ניווט של אתר הקורס.

**קבצים להוספה**

- `data/course-data.js`
- `data/site-versions.js`
- `pages/syllabus.html`
- `sitemap.xml`

**פקודת git add**

```powershell
git add data/course-data.js data/site-versions.js pages/syllabus.html sitemap.xml
```

**בדיקות לפני commit**

```powershell
node --check data/course-data.js
node --check data/site-versions.js
npm run check:links
```

**סיכון / הערות**

`data/site-versions.js` עשוי להיות קשור למערכת ניהול גרסאות/Admin. לבדוק ידנית לפני commit.

**דורש אישור ידני לפני commit**

כן.

## Commit 12 — Portal and courses pages

**שם commit מומלץ**

`feat: add portal and courses entry pages`

**מטרה**

להוסיף פורטל ועמוד קורסים, בנפרד ממודול EHS core ובנפרד מ־`index.html`.

**קבצים להוספה**

- `portal.html`
- `courses.html`
- `css/portal.css`

**פקודת git add**

```powershell
git add portal.html courses.html css/portal.css
```

**בדיקות לפני commit**

```powershell
npm run check:links
```

**סיכון / הערות**

`portal.html` מפנה גם לקורס וגם ל־EHS. לא לערבב עם commit הקורס או עם commit EHS core.

**דורש אישור ידני לפני commit**

כן.

## Commit 13 — EHS local module core

**שם commit מומלץ**

`feat: add local EHS module`

**מטרה**

להוסיף את מודול EHS המקומי, מסכים, אחסון, מנועים, דוחות, אבטחה ונתוני בסיס.

**קבצים להוספה**

- `ehs/index.html`
- `ehs/incidents.html`
- `ehs/actions.html`
- `ehs/reports.html`
- `css/ehs.css`
- `js/ehs-storage.js`
- `js/ehs/ehs-actions.js`
- `js/ehs/ehs-app.js`
- `js/ehs/ehs-backup.js`
- `js/ehs/ehs-corrective-actions.js`
- `js/ehs/ehs-incidents.js`
- `js/ehs/ehs-reports-page.js`
- `js/ehs/ehs-reports.js`
- `js/ehs/ehs-risk-engine.js`
- `js/ehs/ehs-rules-engine.js`
- `js/ehs/ehs-security.js`
- `js/ehs/ehs-users.js`
- `data/ehs/incident-types.json`
- `data/ehs/kpi.json`
- `data/ehs/legal-requirements.json`
- `data/ehs/observation-types.json`
- `data/ehs/risk-library.json`
- `data/ehs/templates.json`

**פקודת git add**

```powershell
git add ehs/index.html ehs/incidents.html ehs/actions.html ehs/reports.html css/ehs.css js/ehs-storage.js js/ehs/ehs-actions.js js/ehs/ehs-app.js js/ehs/ehs-backup.js js/ehs/ehs-corrective-actions.js js/ehs/ehs-incidents.js js/ehs/ehs-reports-page.js js/ehs/ehs-reports.js js/ehs/ehs-risk-engine.js js/ehs/ehs-rules-engine.js js/ehs/ehs-security.js js/ehs/ehs-users.js data/ehs/incident-types.json data/ehs/kpi.json data/ehs/legal-requirements.json data/ehs/observation-types.json data/ehs/risk-library.json data/ehs/templates.json
```

**בדיקות לפני commit**

```powershell
node --check js/ehs-storage.js
node --check js/ehs/ehs-actions.js
node --check js/ehs/ehs-app.js
node --check js/ehs/ehs-backup.js
node --check js/ehs/ehs-corrective-actions.js
node --check js/ehs/ehs-incidents.js
node --check js/ehs/ehs-reports-page.js
node --check js/ehs/ehs-reports.js
node --check js/ehs/ehs-risk-engine.js
node --check js/ehs/ehs-rules-engine.js
node --check js/ehs/ehs-security.js
node --check js/ehs/ehs-users.js
npm run check:links
```

**סיכון / הערות**

לא לערבב עם אתר הקורס. כרגע deploy hosting מפרסם גם EHS בגלל `firebase.json`; יש לטפל בזה בנפרד לפני deploy עתידי שמיועד רק לקורס.

**דורש אישור ידני לפני commit**

כן.

## Commit 14 — EHS documentation

**שם commit מומלץ**

`docs: add EHS design and staging documentation`

**מטרה**

לתעד את מודול EHS בלי לערבב עם קוד EHS.

**קבצים להוספה**

- `docs/ehs-logic-engine-design.md`
- `docs/ehs-logic-smoke-tests.md`
- `docs/ehs-security-hardening-gap-analysis.md`
- `docs/ehs-staging-uat-checklist.md`
- `docs/ehs-ui-logic-connection.md`
- `docs/ehs-users-and-backup-design.md`
- `docs/staging-ehs-acceptance-checklist.md`

**פקודת git add**

```powershell
git add docs/ehs-logic-engine-design.md docs/ehs-logic-smoke-tests.md docs/ehs-security-hardening-gap-analysis.md docs/ehs-staging-uat-checklist.md docs/ehs-ui-logic-connection.md docs/ehs-users-and-backup-design.md docs/staging-ehs-acceptance-checklist.md
```

**בדיקות לפני commit**

```powershell
npm run check:links
```

**סיכון / הערות**

נמוך, אבל לוודא שאין במסמכים מידע פנימי/רגיש.

**דורש אישור ידני לפני commit**

לא, למעט בדיקת תוכן ידנית.

## Commit 15 — General staging docs

**שם commit מומלץ**

`docs: add staging deployment documentation`

**מטרה**

לשמור תיעוד staging שאינו שייך רק ל־EHS.

**קבצים להוספה**

- `docs/staging-deployment-plan.md`

**פקודת git add**

```powershell
git add docs/staging-deployment-plan.md
```

**בדיקות לפני commit**

```powershell
npm run check:links
```

**סיכון / הערות**

לוודא שאין במסמך הוראות שמכוונות בטעות ל־production.

**דורש אישור ידני לפני commit**

כן.

## Commit 16 — Firestore migration utility review

**שם commit מומלץ**

`chore: update exam question firestore migration utility`

**מטרה**

לטפל בנפרד בסקריפט שקשור ל־Firestore, בלי לערבב עם Local Mode או תוכן.

**קבצים להוספה**

- `scripts/migrate-exam-questions-to-firestore.js`

**פקודת git add**

```powershell
git add scripts/migrate-exam-questions-to-firestore.js
```

**בדיקות לפני commit**

```powershell
node --check scripts/migrate-exam-questions-to-firestore.js
```

**סיכון / הערות**

גבוה יחסית: הקובץ קשור ל־Firestore, ובמהלך העבודה היו הנחיות לא לשנות Auth/Firebase/Firestore. יש לבדוק diff ידנית ולאשר לפני commit.

**דורש אישור ידני לפני commit**

כן, חובה.

## Commit 17 — Firebase hosting config

**שם commit מומלץ**

`chore: update firebase hosting config`

**מטרה**

לטפל ב־`firebase.json` בנפרד, כי הוא משפיע על היקף הפריסה.

**קבצים להוספה**

- `firebase.json`

**פקודת git add**

```powershell
git add firebase.json
```

**בדיקות לפני commit**

```powershell
git diff -- firebase.json
npm run check:links
```

**סיכון / הערות**

גבוה. כרגע `hosting.public` מוגדר כ־`.` ולכן deploy hosting מפרסם גם EHS, פורטל וקבצים נוספים. אין לבצע commit או deploy של config לפני החלטה מפורשת אם hosting צריך לכלול את EHS או רק את אתר הקורס.

**דורש אישור ידני לפני commit**

כן, חובה.

## Commit 18 — Home page changes

**שם commit מומלץ**

`feat: update course home page`

**מטרה**

לטפל ב־`index.html` בנפרד, משום שזה דף הבית הראשי של הקורס.

**קבצים להוספה**

- `index.html`

**פקודת git add**

```powershell
git add index.html
```

**בדיקות לפני commit**

```powershell
npm run check:links
node scripts/check-interactive-controls.js
```

**סיכון / הערות**

גבוה יחסית: זה דף הבית הקיים. יש לבדוק שלא נוספו הפניות לא רצויות ל־EHS או לפורטל אם רוצים לשמור על אתר הקורס בלבד.

**דורש אישור ידני לפני commit**

כן, חובה.

## Commit 19 — Optional generated artifacts

**שם commit מומלץ**

`chore: add generated import and scan artifacts`

**מטרה**

אם מחליטים לשמור artifacts ב־repo, להכניס אותם בנפרד ולא לערבב עם קוד/תוכן.

**קבצים להוספה**

- `docs/gibberish-content-scan.json`
- `docs/duplicate-content-scan.json`
- `docs/site-wide-content-cleanup-scan.json`
- `docs/iso-45001-2018-docx-extract.json`
- `docs/iso-45001-2018-import-data.json`
- `docs/labor-inspection-law-1954-docx-extract.json`
- `docs/lesson-01-02-content-gap-report-data.json`
- `docs/lesson-01-02-docx-extract.json`
- `docs/lesson-01-02-question-import-report.json`
- `docs/work-safety-ordinance-1970-docx-extract.json`

**פקודת git add**

```powershell
git add docs/gibberish-content-scan.json docs/duplicate-content-scan.json docs/site-wide-content-cleanup-scan.json docs/iso-45001-2018-docx-extract.json docs/iso-45001-2018-import-data.json docs/labor-inspection-law-1954-docx-extract.json docs/lesson-01-02-content-gap-report-data.json docs/lesson-01-02-docx-extract.json docs/lesson-01-02-question-import-report.json docs/work-safety-ordinance-1970-docx-extract.json
```

**בדיקות לפני commit**

```powershell
npm run check:links
```

**סיכון / הערות**

Artifacts עלולים להיות גדולים, זמניים או לא נחוצים. מומלץ לשקול `.gitignore` במקום commit.

**דורש אישור ידני לפני commit**

כן.

## מה לבצע ראשון

סדר מומלץ:

1. **Commit 1 — QA scripts and audit reports**
2. **Commit 2 — Content cleanup and gibberish fixes**
3. **Commit 3 — Lesson 01 and 02 cleanup only**
4. **Commit 4 — Sitewide UI bug fixes**
5. **Commit 5 — Duplicate content cleanup**
6. אחר כך תוכן גדול: שיעורים, חוקים, פקודה, ISO, שאלות.
7. לאחר מכן EHS ופורטל.
8. בסוף בלבד: `index.html`, `scripts/migrate-exam-questions-to-firestore.js`, ו־`firebase.json`.

## Commits שדורשים אישור ידני חובה

- Commit 3 — בגלל `git add -p` בקבצים מעורבים.
- Commit 4 — בגלל `css/styles.css` והשפעה רוחבית.
- Commit 5 — בגלל הסרת כפילויות מתוכן לימודי.
- Commit 6 — בגלל הרחבות שיעורים גדולות.
- Commit 7 — דף חוק וקישורים רוחביים.
- Commit 8 — דף פקודה וקישורים רוחביים.
- Commit 9 — דף ISO וקישורים רוחביים.
- Commit 10 — שאלות ו־game data גדולים.
- Commit 11 — metadata וניווט.
- Commit 12 — `portal.html`, `courses.html`, `css/portal.css`.
- Commit 13 — כל קבצי EHS.
- Commit 16 — סקריפט Firestore.
- Commit 17 — `firebase.json`.
- Commit 18 — `index.html`.
- Commit 19 — artifacts.

## תזכורת בטיחות

אין להריץ את פקודות ה־`git add` במסמך זה ללא אישור מפורש.  
אין לבצע deploy מתוך תוכנית זו.  
אין לשנות production.  
יש לבדוק במיוחד את `firebase.json` לפני כל deploy עתידי, משום שהוא קובע האם EHS נכלל בפריסה.

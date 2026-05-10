# Post-split working tree audit

תאריך בדיקה: 2026-05-10  
Branch: `codex/fix-gibberish-sitewide-20260510`  
Scope: בדיקת שאריות ב-working tree לאחר פיצול commits קודמים.  
לא בוצע commit. לא בוצע deploy. Production לא שונה.

## תקציר מצב

- קבצי tracked ששונו: 18
- קבצים untracked בפועל: 44
- סך קבצים שנותרו ב-working tree: 62
- `git diff --stat` מציג רק tracked files, ולכן אינו כולל את קבצי EHS/portal/docs untracked.

## deploy/config

### קבצים

- `firebase.json`

### שינוי שזוהה

- הוסר `data/exam-questions.js` מרשימת `hosting.ignore`.

### סיווג

- קשור לקורס: כן, משפיע על פריסת מאגר שאלות.
- קשור ל-EHS: לא ישירות.
- בטוח ל-commit עצמאי: רק לאחר review ידני.
- דורש review ידני: כן.
- מסוכן ל-deploy: כן. שינוי hosting config עשוי לשנות אילו קבצים נפרסים.
- accidental/unwanted: ייתכן. זה שינוי רגיש וצריך אישור מפורש לפני commit/deploy.

### המלצה

להשאיר ל-commit נפרד בלבד, לאחר בדיקה שהכוונה היא אכן לפרוס את `data/exam-questions.js` ב-Firebase Hosting.

## homepage/index

### קבצים

- `index.html`

### שינוי שזוהה

- נוסף כרטיס לדף הבית עבור `חוק ארגון הפיקוח על העבודה, תשי״ד–1954`.

### סיווג

- קשור לקורס: כן.
- קשור ל-EHS: לא.
- בטוח ל-commit עצמאי: אפשרי, אבל דורש review ידני.
- דורש review ידני: כן, כי המשתמש ביקש בעבר לא לשנות את דף הבית בלי זהירות.
- מסוכן ל-deploy: בינוני. שינוי דף הבית חשוף לכל המשתמשים.
- accidental/unwanted: ייתכן, כי דפי החוק אמורים להיות בעיקר ב-Field Tools ולא בהכרח בדף הבית.

### המלצה

לא לקמט יחד עם שום תוכן אחר. להחליט ידנית אם הכרטיס אכן רצוי בדף הבית או שיש להחזיר/להעביר ל-Field Tools בלבד.

## portal/courses

### קבצים

- `portal.html`
- `courses.html`
- `css/portal.css`

### סיווג

- קשור לקורס: חלקית, בעיקר ניווט פורטל.
- קשור ל-EHS: חלקית, כי הפורטל מקשר ל-EHS.
- בטוח ל-commit עצמאי: כן, כ-commit פורטל נפרד.
- דורש review ידני: כן.
- מסוכן ל-deploy: בינוני. אלו עמודים חדשים/נפרדים, אך עשויים להיות גלויים ב-staging.
- accidental/unwanted: לא נראה accidental, אך עדיין untracked ולכן לא נכנס לשום commit.

### המלצה

Commit נפרד: `feat: add isolated portal and courses entry pages`. לא לערבב עם EHS או עם `index.html`.

## EHS

### קבצים

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

### סיווג

- קשור לקורס: לא ישירות.
- קשור ל-EHS: כן.
- בטוח ל-commit עצמאי: כן, אבל גדול.
- דורש review ידני: כן.
- מסוכן ל-deploy: בינוני-גבוה. מודול חדש ורחב, Local Mode, UI ו-data.
- accidental/unwanted: לא נראה accidental, אך כל המודול עדיין untracked ולכן צריך בדיקה נקייה לפני commit.

### הערות סיכון

- יש לוודא שאין Firebase/Firestore/fetch בקבצי EHS לפני commit.
- יש לוודא שגיבוי/שחזור/ניקוי נתונים פועלים רק על keys של EHS.
- אין לערבב עם portal/courses או עם config.

### המלצה

Commit נפרד אחד או שניים:

1. `feat: add local EHS module`
2. `docs: add EHS design and staging checklists`

רק לאחר `node --check` לכל JS של EHS ובדיקת smoke ידנית.

## remaining docs/artifacts

### קבצים

- `docs/duplicate-content-scan.json`
- `docs/gibberish-content-scan.json`
- `docs/site-wide-content-cleanup-scan.json`
- `docs/site-wide-content-cleanup-report.md`
- `docs/lesson-01-02-content-gap-report.md`
- `docs/lesson-01-02-content-gap-report-data.json`
- `docs/lesson-01-02-docx-extract.json`
- `docs/lesson-01-02-question-import-report.json`
- `docs/ehs-logic-engine-design.md`
- `docs/ehs-logic-smoke-tests.md`
- `docs/ehs-security-hardening-gap-analysis.md`
- `docs/ehs-staging-uat-checklist.md`
- `docs/ehs-ui-logic-connection.md`
- `docs/ehs-users-and-backup-design.md`
- `docs/staging-deployment-plan.md`
- `docs/staging-ehs-acceptance-checklist.md`

### סיווג

- קשור לקורס: חלק מהדוחות.
- קשור ל-EHS: חלק מהדוחות.
- בטוח ל-commit עצמאי: כן, אם מפוצל לפי נושא.
- דורש review ידני: נמוך-בינוני.
- מסוכן ל-deploy: נמוך, אלא אם docs נחשפים באתר.
- accidental/unwanted: קבצי scan JSON גדולים עשויים להיות artifacts זמניים; דורשים החלטה אם לשמור.

### המלצה

לפצל:

- docs של course cleanup/content gap ב-commit course docs.
- docs של EHS ב-commit EHS docs.
- קבצי scan JSON רק אם יש ערך audit ברור; אחרת להשאיר מחוץ ל-commit או להוסיף ל-ignore לאחר החלטה.

## remaining scripts

### קבצים

- `scripts/check-links.js`
- `scripts/migrate-exam-questions-to-firestore.js`
- `scripts/generate-labor-inspection-law-content.js`
- `js/lesson-source-hub.js`

### שינוי שזוהה

- `scripts/check-links.js`: תומך בקישורים שמתחילים ב-`/` ומחשב אותם משורש האתר.
- `scripts/migrate-exam-questions-to-firestore.js`: נוסף נתיב production עם `--allow-production` ובדיקות safety.
- `scripts/generate-labor-inspection-law-content.js`: untracked generator.
- `js/lesson-source-hub.js`: untracked JS חדש, כנראה תשתית UI/תוכן לשיעורים.

### סיווג

- קשור לקורס: כן.
- קשור ל-EHS: לא.
- בטוח ל-commit עצמאי: חלקית.
- דורש review ידני: כן, במיוחד migration script.
- מסוכן ל-deploy: `migrate-exam-questions-to-firestore.js` מסוכן תפעולית אם משתמשים בו; לא בהכרח מסוכן ל-hosting. `check-links.js` נמוך.
- accidental/unwanted: `generate-labor-inspection-law-content.js` עשוי להיות כלי build זמני; צריך להחליט אם לשמור.

### המלצה

- `scripts/check-links.js` יכול להיות commit קטן של tooling.
- `scripts/migrate-exam-questions-to-firestore.js` חייב review ידני נפרד בגלל production flag.
- `generate-labor-inspection-law-content.js` לא לקמט בלי בדיקה שהוא נחוץ.
- `js/lesson-source-hub.js` לקמט רק יחד עם דפי HTML שמשתמשים בו.

## remaining HTML pages

### קבצים tracked ששונו

- `pages/exam-questions.html`
- `pages/quizzes.html`
- `pages/safety-game.html`
- `pages/syllabus.html`
- `pages/standards.html`
- `pages/lesson-03.html`
- `pages/lesson-04.html`
- `pages/lesson-05.html`
- `pages/lesson-07.html`
- `pages/lesson-08.html`
- `pages/lesson-10.html`
- `pages/lesson-11.html`

### סוגי שינוי שנראים

- עטיפת טבלאות ב-`.table-responsive`.
- ניקוי טקסטים כמו שמות לא רצויים או מקור טכני.
- תיקוני מבנה/indentation בדפי תרגול ומשחק.
- `pages/safety-game.html` כולל גם קישור חדש ליחידת שיעור 2 עם HTML entities.
- `pages/syllabus.html` כולל table wrapper.

### סיווג

- קשור לקורס: כן.
- קשור ל-EHS: לא.
- בטוח ל-commit עצמאי: כן, אבל צריך לפצל בין UI cleanup לבין תוכן/ניווט.
- דורש review ידני: בינוני.
- מסוכן ל-deploy: נמוך-בינוני. בעיקר UI/תוכן, אך דפי תרגול ומשחק מרכזיים.
- accidental/unwanted: חלק משינויי indentation/מבנה בדפי תרגול עשויים להיות תוצר stage partial; לבדוק לפני commit.

### המלצה

Commit נפרד ל-table responsiveness וניקוי טקסטים בשיעורים שנותרו.  
Commit נפרד לדפי quiz/game רק אם כל הכפתורים/קישורים נבדקו.

## data files שנותרו

### קבצים

- `data/course-data.js`
- `data/site-versions.js`

### שינוי שזוהה

- `data/course-data.js`: שינוי גורף של IDs מ-`docx` ל-`source` בשאלות שיעורים 1-3.
- `data/site-versions.js`: ניקוי אזכורים לא רצויים כגון Word/שם מרצה.

### סיווג

- קשור לקורס: כן.
- קשור ל-EHS: לא.
- בטוח ל-commit עצמאי: רק לאחר בדיקת השפעה על IDs.
- דורש review ידני: כן.
- מסוכן ל-deploy: בינוני-גבוה. שינוי IDs עלול להשפיע על progress/history/localStorage/קישורים פנימיים.
- accidental/unwanted: ייתכן, במיוחד שינויי IDs רחבים.

### המלצה

לא לקמט את `data/course-data.js` עד שמוודאים שאין תלות ב-ID הישן.  
`data/site-versions.js` יכול להיכנס ל-cleanup commit קטן אם אין תלות.

## unknown leftovers

### קבצים/אזורים שדורשים הכרעה

- `scripts/generate-labor-inspection-law-content.js`: כלי יצירה זמני או כלי תחזוקה? לא ברור.
- `docs/*-scan.json`: artifacts של בדיקה, לא ברור אם לשמור במאגר.
- `data/course-data.js`: שינוי IDs רחב, דורש בדיקת compatibility.
- `scripts/migrate-exam-questions-to-firestore.js`: כולל אפשרות production מוגנת; דורש החלטת מוצר/אבטחה.

## אזורים הכי מסוכנים כרגע

1. `firebase.json` — משפיע על deploy hosting ועל חשיפת קבצי data.
2. `index.html` — דף הבית של האתר הפעיל.
3. `data/course-data.js` — שינויי IDs יכולים להשפיע על state/תרגול/חיפוש.
4. `scripts/migrate-exam-questions-to-firestore.js` — נוגע למיגרציה ל-Firestore ו-production flag.
5. כל `ehs/**` — מודול גדול, עדיין untracked, דורש commit ובדיקות נפרדים.

## האם ה-working tree בשל להמשך commits?

כן, אבל רק אם ממשיכים בפיצול קשיח:

- אין לבצע commit גדול אחד.
- אין לבצע deploy לפני ש-`firebase.json`, `index.html`, EHS ו-portal/courses עוברים החלטה ידנית.
- יש להמשיך עם commits קטנים לפי תחום.

## סדר commits מומלץ

1. `fix: wrap remaining course tables for mobile`  
   קבצים: lesson pages, standards, syllabus בלבד.

2. `fix: clean remaining public-facing source labels`  
   קבצים: `data/site-versions.js`, lesson pages ספציפיים בלבד.

3. `chore: improve link checker for root-relative links`  
   קובץ: `scripts/check-links.js` בלבד.

4. `feat: add isolated portal and courses pages`  
   קבצים: `portal.html`, `courses.html`, `css/portal.css`.

5. `feat: add local EHS module`  
   קבצי EHS בלבד.

6. `docs: add EHS and staging documentation`  
   docs של EHS/staging בלבד.

7. `chore: review course data source IDs`  
   רק לאחר בדיקה ידנית של `data/course-data.js`.

8. `chore: review Firebase hosting config`  
   `firebase.json` בלבד, רק לאחר אישור מפורש.

9. `feat: update homepage learning entry` או הסרה  
   `index.html` בלבד, אחרי החלטה ידנית אם הכרטיס צריך להופיע בדף הבית.

## המלצה לפני deploy הבא

- לא לבצע deploy כרגע.
- קודם לסיים commits נפרדים או להחזיר שינויים לא רצויים.
- לפני deploy staging הבא להריץ:
  - `npm run check:links`
  - `node scripts/check-gibberish-content.js`
  - `node scripts/check-interactive-controls.js`
  - `node --check` לכל JS ששונה
  - בדיקת דפדפן לדפי course המרכזיים ול-EHS אם הוא נכלל.
- Production לא יעלה עד שיש אישור ידני מפורש, במיוחד בגלל `firebase.json` ו-`index.html`.

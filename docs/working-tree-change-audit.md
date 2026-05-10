# Working Tree Change Audit

תאריך: 2026-05-10  
Branch נוכחי: `codex/fix-gibberish-sitewide-20260510`  
מטרה: מיון שינויים קיימים לפני commits, ללא deploy וללא שינוי production.

## תקציר מצב

ה־working tree אינו נקי. קיימים שינויים רבים שאינם שייכים למשימה אחת בלבד:

- תיקוני ג׳יבריש וניקוי תוכן.
- תיקוני UI, כפתורים, חצים ומספור.
- הסרת כפילויות.
- תוספות תוכן רחבות לשיעורים, חוקים ותקנים.
- מודול EHS מלא ועמודי פורטל.
- שינויים בתצורת deploy, במיוחד `firebase.json`.
- דוחות וסקריפטים שנוצרו לאורך העבודה.

הקבצים המופיעים בדוח זה כבר נכללו בפריסות staging קודמות שבוצעו מה־working tree הנוכחי, למעט קובץ הדוח הזה עצמו שנוצר כעת ולא נפרס.

## Git Status שנבדק

הורץ:

```powershell
git status --short -uall
git diff --stat
```

`git diff --stat` הציג 30 קבצים tracked עם כ־10,652 הוספות ו־768 מחיקות, ובנוסף מספר גדול של קבצים untracked.

## מיון קבצים לפי קבוצות

### תיקוני ג׳יבריש / ניקוי תוכן

| קובץ | קורס / EHS | נפרס ל־staging | commit נפרד | המלצה |
| --- | --- | --- | --- | --- |
| `data/search-index.js` | קורס | כן | כן | להשאיר; commit עם ניקוי תוכן/חיפוש. |
| `pages/field-tools.html` | קורס | כן | כן | קובץ מעורב: גם ניקוי ג׳יבריש וגם קישורי תוכן; לבדוק diff לפני commit. |
| `pages/laws.html` | קורס | כן | כן | להשאיר; ניקוי טקסט משובש והפניות חוק/תקן. |
| `pages/lesson-01.html` | קורס | כן | כן | קובץ מעורב: תוכן שיעור + ניקוי ג׳יבריש; מומלץ לפצל אם אפשר. |
| `pages/lesson-02.html` | קורס | כן | כן | קובץ מעורב: תוכן שיעור + ניקוי ג׳יבריש; מומלץ לפצל אם אפשר. |
| `docs/gibberish-content-scan.json` | קורס / QA | כן | אפשר | לשמור עם commit של בדיקות/ניקוי, או להשאיר מחוץ ל־commit אם לא רוצים artifacts. |
| `docs/sitewide-gibberish-cleanup-20260510.md` | קורס / QA | כן | כן | לשמור עם commit ניקוי ג׳יבריש. |
| `scripts/check-gibberish-content.js` | קורס / QA | כן | כן | לשמור עם commit בדיקות/ניקוי. |
| `scripts/rebuild-clean-search-index.js` | קורס / QA | כן | כן | לשמור אם רוצים יכולת שחזור אינדקס; אחרת לבדוק אם להסיר לפני commit. |

### תיקוני UI / כפתורים / חצים / מספור

| קובץ | קורס / EHS | נפרס ל־staging | commit נפרד | המלצה |
| --- | --- | --- | --- | --- |
| `admin.html` | קורס / Admin | כן | כן | לבדוק ידנית; נראה שינוי UI/Admin, לא לערבב עם תוכן. |
| `css/styles.css` | קורס | כן | כן | שינוי גדול מאוד; commit UI נפרד חובה. |
| `index.html` | קורס | כן | כן | שינוי UI/ניווט בדף הבית; לבדוק שאין קשר ל־EHS לפני commit. |
| `pages/exam-questions.html` | קורס | כן | כן | שייך ל־UI/תרגול; commit עם תרגול/שאלות. |
| `pages/quizzes.html` | קורס | כן | כן | שייך ל־UI/תרגול; commit עם תרגול/שאלות. |
| `pages/safety-game.html` | קורס | כן | כן | שייך לאתגר בטיחות; commit עם שאלות/משחק. |
| `pages/safety-management.html` | קורס | כן | כן | לבדוק ידנית; נראה קורס/ניהול בטיחות, לא EHS החדש. |
| `pages/standards.html` | קורס | כן | כן | UI/קישורים לתקנים; commit עם תקנים. |
| `pages/version-management.html` | קורס / Admin | כן | כן | שינוי UI/Admin; commit נפרד או עם admin. |
| `scripts/check-interactive-controls.js` | קורס / QA | כן | כן | לשמור עם commit בדיקות UI. |
| `docs/sitewide-ui-bugfix-20260510-report.md` | קורס / QA | כן | כן | דוח מתאים ל־commit UI bug fixes. |

### הסרת כפילויות

| קובץ | קורס / EHS | נפרס ל־staging | commit נפרד | המלצה |
| --- | --- | --- | --- | --- |
| `docs/duplicate-content-scan.json` | קורס / QA | כן | אפשר | artifact בדיקה; לשקול אם נחוץ ב־repo. |
| `docs/sitewide-duplicate-content-audit.md` | קורס / QA | כן | כן | לשמור עם commit הסרת כפילויות. |
| `scripts/check-duplicate-content.js` | קורס / QA | כן | כן | לשמור עם commit בדיקות כפילויות. |

### תוספות תוכן שיעורים / חוקים / תקנים

| קובץ | קורס / EHS | נפרס ל־staging | commit נפרד | המלצה |
| --- | --- | --- | --- | --- |
| `data/course-data.js` | קורס | כן | כן | תוכן/מטא־דאטה קורס; commit תוכן. |
| `data/exam-questions.js` | קורס | כן | כן | שינוי גדול מאוד; commit נפרד לשאלות. |
| `data/game-data.js` | קורס | כן | כן | שינוי גדול מאוד; commit נפרד לאתגר בטיחות. |
| `data/site-versions.js` | קורס / Admin | כן | אפשר | לבדוק אם קשור לגרסה/תוכן; לא לערבב בלי צורך. |
| `pages/lesson-03.html` | קורס | כן | כן | שינוי תוכן שיעור; commit תוכן שיעורים. |
| `pages/lesson-04.html` | קורס | כן | כן | שינוי תוכן שיעור; commit תוכן שיעורים. |
| `pages/lesson-05.html` | קורס | כן | כן | שינוי תוכן שיעור; commit תוכן שיעורים. |
| `pages/lesson-07.html` | קורס | כן | כן | שינוי תוכן שיעור; commit תוכן שיעורים. |
| `pages/lesson-08.html` | קורס | כן | כן | שינוי תוכן שיעור; commit תוכן שיעורים. |
| `pages/lesson-10.html` | קורס | כן | כן | שינוי תוכן שיעור; commit תוכן שיעורים. |
| `pages/lesson-11.html` | קורס | כן | כן | שינוי תוכן שיעור; commit תוכן שיעורים. |
| `pages/syllabus.html` | קורס | כן | כן | שינוי ניווט/סילבוס; commit עם תוכן חוק/שיעורים. |
| `pages/iso-45001-2018.html` | קורס | כן | כן | דף תוכן חדש; commit נפרד לתקן ISO 45001. |
| `pages/labor-inspection-law-1954.html` | קורס | כן | כן | דף חוק חדש; commit נפרד לחוק ארגון הפיקוח. |
| `pages/work-safety-ordinance-1970.html` | קורס | כן | כן | דף פקודה חדש; commit נפרד לפקודת הבטיחות. |
| `js/labor-inspection-law-page.js` | קורס | כן | כן | JS לדף חוק; commit עם דף החוק. |
| `js/lesson-source-hub.js` | קורס | כן | כן | JS לתצוגת שיעורים ארוכים; commit עם דפי שיעור. |
| `js/work-safety-ordinance-page.js` | קורס | כן | כן | JS לדף פקודה; commit עם דף הפקודה. |
| `sitemap.xml` | קורס | כן | כן | commit עם דפי תוכן חדשים. |
| `scripts/generate-labor-inspection-law-content.js` | קורס / QA | כן | אפשר | לבדוק אם נדרש לשחזור תוכן; אחרת להשאיר מחוץ ל־commit. |

### שינויים במודול EHS

| קובץ | קורס / EHS | נפרס ל־staging | commit נפרד | המלצה |
| --- | --- | --- | --- | --- |
| `portal.html` | מעורב / פורטל | כן | כן | קשור לפורטל שמוביל גם לקורס וגם EHS; commit נפרד מפורטל/EHS. |
| `courses.html` | קורס / פורטל | כן | כן | קשור לאזור קורסים החדש; commit פורטל נפרד. |
| `css/portal.css` | מעורב / פורטל | כן | כן | commit עם פורטל. |
| `css/ehs.css` | EHS | כן | כן | commit עם EHS בלבד. |
| `ehs/index.html` | EHS | כן | כן | commit EHS נפרד. |
| `ehs/incidents.html` | EHS | כן | כן | commit EHS נפרד. |
| `ehs/actions.html` | EHS | כן | כן | commit EHS נפרד. |
| `ehs/reports.html` | EHS | כן | כן | commit EHS נפרד. |
| `js/ehs-storage.js` | EHS | כן | כן | commit EHS נפרד. |
| `js/ehs/ehs-actions.js` | EHS | כן | כן | commit EHS נפרד. |
| `js/ehs/ehs-app.js` | EHS | כן | כן | commit EHS נפרד. |
| `js/ehs/ehs-backup.js` | EHS | כן | כן | commit EHS נפרד. |
| `js/ehs/ehs-corrective-actions.js` | EHS | כן | כן | commit EHS נפרד. |
| `js/ehs/ehs-incidents.js` | EHS | כן | כן | commit EHS נפרד. |
| `js/ehs/ehs-reports-page.js` | EHS | כן | כן | commit EHS נפרד. |
| `js/ehs/ehs-reports.js` | EHS | כן | כן | commit EHS נפרד. |
| `js/ehs/ehs-risk-engine.js` | EHS | כן | כן | commit EHS נפרד. |
| `js/ehs/ehs-rules-engine.js` | EHS | כן | כן | commit EHS נפרד. |
| `js/ehs/ehs-security.js` | EHS | כן | כן | commit EHS hardening נפרד. |
| `js/ehs/ehs-users.js` | EHS | כן | כן | commit EHS scaffold נפרד. |
| `data/ehs/incident-types.json` | EHS | כן | כן | commit EHS data נפרד. |
| `data/ehs/kpi.json` | EHS | כן | כן | commit EHS data נפרד. |
| `data/ehs/legal-requirements.json` | EHS | כן | כן | commit EHS data נפרד. |
| `data/ehs/observation-types.json` | EHS | כן | כן | commit EHS data נפרד. |
| `data/ehs/risk-library.json` | EHS | כן | כן | commit EHS data נפרד. |
| `data/ehs/templates.json` | EHS | כן | כן | commit EHS data נפרד. |

### שינויים ב־deploy/config

| קובץ | קורס / EHS | נפרס ל־staging | commit נפרד | המלצה |
| --- | --- | --- | --- | --- |
| `firebase.json` | תשתית deploy | כן | כן, רק אחרי בדיקה | שינוי רגיש. יש לבדוק diff מדויק לפני commit; לא לערבב עם תוכן. |

הערה: `firebase.json` מגדיר כרגע `hosting.public` כ־`.` ולכן deploy hosting מפרסם גם קבצי EHS. נדרש טיפול נפרד לפני כל deploy עתידי שמיועד לקורס בלבד.

### docs/scripts בלבד

| קובץ | קורס / EHS | נפרס ל־staging | commit נפרד | המלצה |
| --- | --- | --- | --- | --- |
| `docs/ehs-logic-engine-design.md` | EHS / תיעוד | כן | כן | commit EHS docs. |
| `docs/ehs-logic-smoke-tests.md` | EHS / QA | כן | כן | commit EHS docs. |
| `docs/ehs-security-hardening-gap-analysis.md` | EHS / אבטחה | כן | כן | commit EHS hardening docs. |
| `docs/ehs-staging-uat-checklist.md` | EHS / QA | כן | כן | commit EHS staging docs. |
| `docs/ehs-ui-logic-connection.md` | EHS / תיעוד | כן | כן | commit EHS docs. |
| `docs/ehs-users-and-backup-design.md` | EHS / תיעוד | כן | כן | commit EHS docs. |
| `docs/staging-deployment-plan.md` | מעורב / deploy | כן | כן | commit תיעוד staging. |
| `docs/staging-ehs-acceptance-checklist.md` | EHS / QA | כן | כן | commit EHS staging docs. |
| `docs/iso-45001-2018-content-report.md` | קורס / תיעוד | כן | כן | commit עם ISO. |
| `docs/iso-45001-2018-docx-extract.json` | קורס / artifact | כן | אפשר | לשקול אם artifact צריך להישמר. |
| `docs/iso-45001-2018-import-data.json` | קורס / artifact | כן | אפשר | לשקול אם artifact צריך להישמר. |
| `docs/labor-inspection-law-1954-dev-notes.md` | קורס / תיעוד | כן | כן | commit עם חוק ארגון הפיקוח. |
| `docs/labor-inspection-law-1954-docx-extract.json` | קורס / artifact | כן | אפשר | לשקול אם artifact צריך להישמר. |
| `docs/lesson-01-02-content-gap-report.md` | קורס / תיעוד | כן | כן | commit עם שיעורים 1-2. |
| `docs/lesson-01-02-content-gap-report-data.json` | קורס / artifact | כן | אפשר | לשקול אם artifact צריך להישמר. |
| `docs/lesson-01-02-docx-extract.json` | קורס / artifact | כן | אפשר | לשקול אם artifact צריך להישמר. |
| `docs/lesson-01-02-question-import-report.json` | קורס / artifact | כן | אפשר | לשקול אם artifact צריך להישמר. |
| `docs/site-wide-content-cleanup-report.md` | קורס / QA | כן | כן | commit content cleanup. |
| `docs/site-wide-content-cleanup-scan.json` | קורס / artifact | כן | אפשר | לשקול אם artifact צריך להישמר. |
| `docs/work-safety-ordinance-1970-docx-extract.json` | קורס / artifact | כן | אפשר | לשקול אם artifact צריך להישמר. |
| `scripts/check-links.js` | קורס / QA | כן | כן | commit QA scripts. |
| `scripts/migrate-exam-questions-to-firestore.js` | קורס / Firestore utility | כן | לבדוק ידנית | רגיש כי קשור Firestore; לא לערבב עם Local/staging תוכן. |

### שינויים לא מזוהים / דורשים בדיקה ידנית

| קובץ | קורס / EHS | נפרס ל־staging | commit נפרד | המלצה |
| --- | --- | --- | --- | --- |
| `admin.html` | קורס / Admin | כן | כן | לבדוק diff; לא ברור אם שינוי תוכן, UI או ניהול. |
| `data/site-versions.js` | קורס / Admin | כן | אפשר | לבדוק אם עדכון גרסה מכוון. |
| `pages/version-management.html` | קורס / Admin | כן | כן | לבדוק מול שינויי admin. |
| `scripts/migrate-exam-questions-to-firestore.js` | קורס / Firestore utility | כן | כן רק באישור | דורש בדיקה מיוחדת כי המשתמש ביקש לא לשנות Firestore בעבודות רבות. |

## הערות על staging

ה־working tree הנוכחי כבר נפרס ל־staging במסגרת deploy hosting קודם. לכן יש לראות את סביבת staging ככוללת גם:

- אתר הקורס.
- דפי תוכן חדשים.
- דפי פורטל.
- מודול EHS.
- שינויים ב־`firebase.json` הקיים.

אם רוצים deploy של אתר הקורס בלבד בעתיד, יש להפריד לפני כן את תצורת hosting או להחריג את EHS מהפריסה.

## המלצה לסדר commits

1. **commit 1: QA scripts and audit reports**
   - `scripts/check-links.js`
   - `scripts/check-gibberish-content.js`
   - `scripts/check-interactive-controls.js`
   - `scripts/check-duplicate-content.js`
   - דוחות QA רלוונטיים שאינם artifacts כבדים.

2. **commit 2: content cleanup and gibberish fixes**
   - `data/search-index.js`
   - `pages/field-tools.html`
   - `pages/laws.html`
   - חלקים נקיים מתוך `pages/lesson-01.html`, `pages/lesson-02.html`, `pages/iso-45001-2018.html`
   - `docs/sitewide-gibberish-cleanup-20260510.md`

3. **commit 3: sitewide UI bug fixes**
   - `css/styles.css`
   - דפי UI/כפתורים/חצים/מספור
   - `docs/sitewide-ui-bugfix-20260510-report.md`

4. **commit 4: duplicate-content cleanup**
   - `docs/sitewide-duplicate-content-audit.md`
   - תיקוני דפים שהחליפו תוכן כפול בהפניות.

5. **commit 5: lesson 01-02 content expansion**
   - `pages/lesson-01.html`
   - `pages/lesson-02.html`
   - `docs/lesson-01-02-content-gap-report.md`
   - שאלות רלוונטיות אם ניתן לפצל מתוך `data/exam-questions.js`.

6. **commit 6: labor inspection law page**
   - `pages/labor-inspection-law-1954.html`
   - `js/labor-inspection-law-page.js`
   - docs/artifacts רלוונטיים.

7. **commit 7: work safety ordinance page**
   - `pages/work-safety-ordinance-1970.html`
   - `js/work-safety-ordinance-page.js`
   - docs/artifacts רלוונטיים.

8. **commit 8: ISO 45001 content**
   - `pages/iso-45001-2018.html`
   - `docs/iso-45001-2018-content-report.md`
   - שאלות/אתגר ISO אם ניתן לפצל.

9. **commit 9: questions and safety game data**
   - `data/exam-questions.js`
   - `data/game-data.js`
   - `pages/exam-questions.html`
   - `pages/quizzes.html`
   - `pages/safety-game.html`

10. **commit 10: EHS local module**
    - `ehs/**`
    - `js/ehs/**`
    - `js/ehs-storage.js`
    - `data/ehs/**`
    - `css/ehs.css`
    - EHS docs.

11. **commit 11: portal and courses pages**
    - `portal.html`
    - `courses.html`
    - `css/portal.css`

12. **commit 12: firebase/deploy config**
    - `firebase.json`
    - רק אחרי בדיקה ידנית ואישור, בגלל השפעה על היקף deploy.

## המלצה תפעולית

לפני commit ראשון מומלץ לבצע אחד משני מסלולים:

1. להשתמש ב־`git add -p` / staging סלקטיבי מאוד, כדי לפצל קבצים מעורבים.
2. ליצור branch נוסף לניקוי, ולבצע commits לפי הקבוצות למעלה בלי לשנות תוכן נוסף.

אין לבצע deploy נוסף עד שמתקבלת החלטה האם staging אמור לכלול גם EHS או רק את אתר הקורס.

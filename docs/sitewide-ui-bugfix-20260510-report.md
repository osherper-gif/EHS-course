# דוח תיקוני UI רוחביים — 2026-05-10

## מטרת התיקון
טיפול רוחבי בבאגים שדווחו בקובץ `20260510-0114-BUGS.docx`: כפתורים שלא מגיבים, חצים/תרשימי טקסט גולמיים, מספור לא ברור ואזורי UI שנראים כמו שאריות יבוא או באג תצוגה.

## כפתורים שלא עבדו ותוקנו
- `pages/iso-45001-2018.html`: כפתורי `פתח הכל`, `סגור הכל` וכפתורי הסינון לא פעלו משום שהדף השתמש ב־`.lesson-source-hub` ללא `data-lesson-source-hub`, וב־`data-source-open-all` / `data-source-close-all`.
- `js/lesson-source-hub.js`: עודכן כך שיחבר גם `.lesson-source-hub`, וגם את שתי צורות ה־API הקיימות: `data-source-action="openAll"` ו־`data-source-open-all`.
- דפי החוק/פקודה: כפתורי סינון, חיפוש, פתיחה/סגירה וטאבים נבדקו בדפדפן headless ונמצאו פעילים.

## חצים ותרשימי טקסט ששופרו
- `pages/field-tools.html`: רצף "חוקים ← תקנים ← פורמטים..." הוחלף ל־flow כרטיסים ללא חץ טקסטואלי גולמי.
- `css/styles.css`: נוספו סגנונות ל־`learning-flow-steps` ול־`lesson-generated-flow`, כולל תמיכה במובייל.
- `js/lesson-source-hub.js`, `js/labor-inspection-law-page.js`, `js/work-safety-ordinance-page.js`: תרשימי טקסט שמכילים `→`, `↓`, `│`, `├──`, `└──` וכדומה מומרים בזמן טעינה ל־cards מסודרים.

## מספור לא ברור שתוקן
- `js/lesson-source-hub.js`: כותרות פרקים שמתחילות במספר פנימי מוצגות כעת כ־`פרק X — ...`.
- `js/labor-inspection-law-page.js`: כותרות ממוספרות בדף החוק מוצגות כפרקי לימוד כאשר לא מדובר בסעיף חוק מפורש.
- `js/work-safety-ordinance-page.js`: בדפי הפקודה, כאשר מזהה הסעיף כולל מספר סעיף, הכותרת מוצגת כ־`סעיף X לפקודת הבטיחות — ...`.

## אזורי UI שנראו כמו באג ותוקנו
- `pages/lesson-01.html`, `pages/lesson-02.html`, `pages/iso-45001-2018.html`: נמצאו שאריות HTML שבורות מתוך יבוא קודם, כולל `<<p`, אותיות בודדות בין פסקאות ו־accordion ללא `summary`.
- התיקון שמר את הפרקים והתוכן הלימודי, הסיר כפילויות/שאריות טכניות בלבד, והחזיר לכל פרק `summary` תקין וגוף תוכן תקין.

## דפים שנבדקו
- `index.html`
- `pages/field-tools.html`
- `pages/laws.html`
- `pages/standards.html`
- `pages/quizzes.html`
- `pages/exam-questions.html`
- `pages/safety-game.html`
- `pages/lesson-01.html`
- `pages/lesson-02.html`
- `pages/labor-inspection-law-1954.html`
- `pages/work-safety-ordinance-1970.html`
- `pages/iso-45001-2018.html`

## בדיקות שבוצעו
- `node --check` לקבצי JS שנבדקו/שונו.
- `npm.cmd run check:links` — עבר, 48 קבצי HTML, 0 קישורים פנימיים חסרים.
- `node scripts/check-interactive-controls.js` — עבר על 12 דפים בדסקטופ ובמובייל.
- הבדיקה כללה: Console errors, header overlap, קישורי כפתור ללא יעד, פתיחה/סגירה, סינון, טאבים, טקסט debug גלוי ותרשימי ASCII גולמיים.

## נשאר לבדיקה ידנית
- יש לבצע מעבר אנושי קצר ב־staging על דפי התוכן הגדולים כדי לוודא שהמרת תרשימי הטקסט לכרטיסים משמרת את ההיגיון הלימודי בכל הקשרים.
- קיים שינוי קודם ב־`firebase.json` מהעבודה הקודמת. במשימה זו לא שונה `firebase.json`, ולא שונו `firestore.rules`, `.firebaserc`, `js/auth.js`, או `js/firebase-config.js`.

## Production
לא בוצע deploy ל־production. העבודה והבדיקות מיועדות ל־staging בלבד.

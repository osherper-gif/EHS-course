# Phase 0 Baseline Verification

תאריך/שעה: 2026-05-12 11:14 Asia/Jerusalem

Branch: `codex/protected-questions-architecture-v1`

Staging URL: `https://ehs-course-staging.web.app`

## Scope

בדיקת Phase 0 בוצעה מול staging בלבד, ללא שינוי קוד, ללא deploy וללא שינוי production. מטרת הבדיקה היא לוודא baseline יציב לפני התחלת Phase 1 של Protected Questions.

## תוצאות בדיקות

| # | בדיקה | תוצאה | עדות / הערה |
|---:|---|---|---|
| 1 | `https://ehs-course-staging.web.app/index.html` נטען | PASS | HTTP 200 |
| 2 | `https://ehs-course-staging.web.app/login.html` נטען | PASS | HTTP 200 |
| 3 | `https://ehs-course-staging.web.app/pages/syllabus.html` נטען | PASS | HTTP 200 |
| 4 | `https://ehs-course-staging.web.app/pages/quizzes.html` נטען | PASS | HTTP 200 |
| 5 | `https://ehs-course-staging.web.app/pages/exam-questions.html` נטען | PASS | HTTP 200 |
| 6 | `/pages/protected-question-pilot.html` מחזיר 404 | PASS | HTTP 404 |
| 7 | אין runtime files מסוג `protected-question-*` ב־staging | PASS | הקבצים `/js/protected-question-pilot.js`, `/js/protected-question-auth-gate.js`, `/js/protected-question-source.js`, `/js/protected-question-adapter.js`, `/js/protected-question-firestore-provider.js` מחזירים 404 |
| 8 | אין `auth/argument-error` בתגובות staging שנבדקו | PASS | לא נמצא בתוכן HTTP של דפים וקבצי JS שנבדקו |
| 9 | אין redirect loops בבדיקת HTTP | PASS | דפי public החזירו 200 ללא redirect; דף pilot החזיר 404 |
| 10 | Login עם Google עובד ב־staging | NOT TESTED | דורש אינטראקציה ידנית עם חשבון Google. ניסיון בדיקת browser/headless לא סיפק סשן שמיש בסביבה זו. |
| 11 | Logout עובד | NOT TESTED | דורש login אינטראקטיבי קודם. |
| 12 | אחרי logout לא מוצג “שלום, [שם משתמש]” | NOT TESTED | דורש login/logout אינטראקטיבי בדפדפן. |
| 13 | אין שינוי ב־production | PASS | לא בוצע deploy ולא הופעלה פקודת production. |

## בדיקות מקומיות שהורצו

| פקודה | תוצאה |
|---|---|
| `npm.cmd run check:links` | PASS |
| `node scripts/check-dynamic-readiness.js` | PASS |
| `node scripts/check-gibberish-content.js` | PASS |
| `node --check js/auth.js` | PASS |
| `node --check js/firebase-config.js` | PASS |

## ממצאים

- ה־staging הנוכחי אינו כולל את דף `protected-question-pilot.html`.
- קבצי runtime מסוג `protected-question-*` אינם נגישים ב־staging.
- דפי public מרכזיים נטענים ב־HTTP 200.
- לא נמצאה שגיאת `auth/argument-error` בבדיקות HTTP/static.
- בדיקת Google login/logout לא בוצעה בפועל כי היא דורשת פעולה ידנית מול חשבון Google וסשן דפדפן אמיתי.
- סריקת הג׳יבריש עברה; artifact זמני `docs/gibberish-content-scan.json` נמחק לאחר הבדיקה ולא נכלל בדוח.

## האם מותר להתחיל Phase 1?

**No-Go בשלב זה.**

הבדיקות האוטומטיות ו־HTTP עברו, אבל לפי Definition of Done של Phase 0 נדרש גם אישור ידני של Google login, logout, וניקוי greeting לאחר logout. כל עוד שלוש הבדיקות האלו מסומנות `NOT TESTED`, אין להתחיל Phase 1.

## מה נשאר לבדיקה ידנית

1. לפתוח `https://ehs-course-staging.web.app/login.html` בדפדפן אמיתי.
2. ללחוץ “כניסה עם Google”.
3. לוודא שאין `auth/argument-error` בקונסול.
4. לוודא שהאתר מציג מצב מחובר תקין בדף הבית.
5. לבצע logout.
6. לוודא שאחרי logout לא מוצג “שלום, [שם משתמש]”.
7. לעבור בין דף הבית, שיעורים, תרגול ומבחנים ושאלות למבחן ולוודא שאין redirect loop.

## החלטה

Phase 0 עבר את החלק האוטומטי, אך לא עבר במלואו עד שתושלם בדיקה ידנית של login/logout. אין להתחיל Phase 1 לפני השלמת הבדיקה הידנית.

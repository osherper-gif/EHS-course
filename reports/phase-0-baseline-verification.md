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
| 10 | Login עם Google עובד ב־staging | PASS | אומת ידנית על ידי המשתמש בדפדפן אמיתי. |
| 11 | Logout עובד | PASS | אומת ידנית על ידי המשתמש. |
| 12 | אחרי logout לא מוצג “שלום, [שם משתמש]” | PASS | אומת ידנית: לאחר logout לא נשאר greeting של המשתמש. |
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
- לא נמצאה שגיאת `auth/argument-error` בבדיקות HTTP/static, והמשתמש אישר שלא הופיעה שגיאה כזו בבדיקה הידנית.
- בדיקת Google login/logout הושלמה ידנית על ידי המשתמש: Google login עובד, logout עובד, ולא נשאר greeting לאחר logout.
- סריקת הג׳יבריש עברה; artifact זמני `docs/gibberish-content-scan.json` נמחק לאחר הבדיקה ולא נכלל בדוח.
- קיימות הודעות CSP לגבי Firebase `.map` source maps. יש לעקוב אחריהן בנפרד, אך לא נצפה כשל Login בגללן והן אינן חוסמות Phase 1.

## האם מותר להתחיל Phase 1?

**GO ל־Phase 1.**

הבדיקות האוטומטיות, בדיקות ה־HTTP והבדיקות הידניות של Google login/logout עברו. לפי Definition of Done של Phase 0, מותר להתחיל Phase 1. הודעות CSP על Firebase source maps יתועדו למעקב נפרד ואינן חוסמות את Phase 1.

## מה נשאר לבדיקה ידנית

- אין blocker ידני פתוח ל־Phase 1.
- מומלץ להמשיך לעקוב בנפרד אחר הודעות CSP של Firebase `.map` source maps, אך הן אינן חוסמות את Phase 1.

## החלטה

Phase 0 עבר את החלק האוטומטי ואת הבדיקה הידנית שדווחה על ידי המשתמש. ניתן להתחיל Phase 1 לפי מסמך הארכיטקטורה, תוך שמירה על הכלל: Auth gate מינימלי בלבד וללא שינויי login קיימים לפני בדיקת baseline חוזרת.




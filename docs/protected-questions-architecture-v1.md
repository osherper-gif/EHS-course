# Protected Questions v1 Architecture

## 1. מטרת המהלך

מטרת Protected Questions v1 היא לאפשר בעתיד תרגול שאלות מוגנות באתר הקורס בלי לחשוף בצד הלקוח את מאגר התשובות, מפתחות הפתרון או הסברים שמגלים את התשובה מראש. המהלך צריך להתבצע בשלבים קטנים, ניתנים לבדיקה, וב־staging בלבד עד לקבלת אישור מפורש ל־production.

היעד הראשוני אינו להחליף מיד את מערכת השאלות הקיימת, אלא לבנות מסלול בטוח ומבודד שבו אפשר לבדוק Auth, הרשאות, תצוגת שאלות preview, ורק לאחר מכן מנגנון בדיקת תשובות שאינו חושף answer keys ללקוח.

## 2. מה מוגן ומה לא מוגן

### מוגן

- תשובה נכונה, כולל `correctAnswer`, `correctIndex`, `answerKey`, `isCorrect` וכל שדה שקול.
- הסבר שמגלה את התשובה לפני שהמשתמש ענה.
- שאלות מוגנות שמיועדות למשתמשים מחוברים ומאושרים בלבד.
- פעולת בדיקת תשובה עתידית, שצריכה לעבור דרך מנגנון שרת או מנגנון מאובטח אחר.
- הרשאות קריאה לשאלות מוגנות לפי מצב משתמש.

### לא מוגן בשלב ראשון

- דפי לימוד ציבוריים.
- דפי תוכן, חוקים, תקנים וסיכומי שיעור שכבר מיועדים לצפייה ציבורית.
- שאלות preview ללא תשובות נכונות, אם יוחלט שהן בטוחות להצגה.
- מערכת login הקיימת, שאסור לשנות לפני בדיקת baseline.
- מאגר שאלות מקומי קיים, כל עוד הוא משמש רק את הדפים הציבוריים הקיימים ולא את protected flow החדש.

## 3. שלבי מימוש

### Phase 0: Baseline verification

מטרה: לוודא שהאתר הקיים יציב לפני כל שינוי מוגן.

פעולות:

- לוודא ש־Google login עובד באתר הרגיל.
- לוודא logout עובד ומנקה UI של משתמש מחובר.
- לוודא שאין redirect loops.
- לוודא שדף הבית, שיעורים, תרגול ושאלות למבחן עובדים ללא שינוי.
- לוודא שאין דף protected pilot פעיל או קוד protected runtime שנטען בטעות.

קריטריון מעבר:

- login/logout תקינים ב־staging.
- אין שגיאות Auth חמורות בקונסול.
- `npm.cmd run check:links` עובר.
- working tree נקי.

### Phase 1: Standalone auth check page

מטרה: לבנות דף בדיקה מבודד שמציג רק מצב Auth, בלי שאלות ובלי Firestore protected content.

גבולות:

- לא לשנות `auth.js` בשלב זה.
- לא לשנות `login.html` בשלב זה.
- לא לשנות `firestore.rules` בשלב זה.
- לא לטעון שאלות.
- לא לבצע redirect אוטומטי.

התנהגות:

- guest: מציג “לא מחובר” וכפתור חזרה/כניסה לפי מנגנון login קיים.
- authenticated: מציג uid/email ומצב Auth בסיסי.
- אין בדיקת approved עדיין.

קריטריון מעבר:

- הדף מזהה את אותו Auth state שהאתר מזהה.
- אין `auth/argument-error`.
- אין redirect loops.

### Phase 2: Approval check

מטרה: להוסיף בדיקת approved בלבד, ללא שאלות.

פעולות:

- לקרוא את מסמך המשתמש הקיים בלבד, לפי הנתיב שכבר משמש באתר.
- להציג state ברור: guest, authenticated-not-approved, approved, error.
- כשל lookup אינו הופך ל־guest. אם יש user אבל lookup נכשל, מציגים “מחובר אך לא ניתן לאמת הרשאות”.

קריטריון מעבר:

- משתמש מחובר לא מוצג כ־guest.
- משתמש לא approved אינו רואה תוכן מוגן.
- משתמש approved עובר state בלבד, עדיין ללא שאלות.

### Phase 3: Protected preview questions

מטרה: להציג 3 שאלות preview בלבד למשתמש approved.

גבולות:

- ללא תשובות נכונות.
- ללא `answerKey`.
- ללא fallback מקומי לשאלות מוגנות.
- ללא שינוי מערכת התרגול הציבורית.
- ללא כתיבה ל־Firestore מהלקוח.

Payload מותר:

- `id`
- `lessonId`
- `topic`
- `subTopic`
- `difficulty`
- `questionText`
- `options`
- `legalSource`
- metadata לא רגיש כמו `status`, `visibility`, `updatedAt`

Payload אסור:

- `correctAnswer`
- `correctIndex`
- `correctAnswerId`
- `answerKey`
- `solution`
- `isCorrect`
- `pointsByAnswer`
- `scoring`
- explanation שחושף תשובה

### Phase 4: Server-side answer validation

מטרה: לבדוק תשובות בלי לחשוף את התשובה הנכונה ללקוח.

אפשרויות:

- Cloud Functions / API ייעודי לבדיקת תשובה.
- Firestore read-only לשאלות preview בלבד, ו־server-side evaluator לתשובות.
- החזרת feedback מוגבל לאחר מענה, לא החזרת answer key מלא.

קריטריון מעבר:

- הלקוח שולח `questionId` ו־selected option בלבד.
- השרת מחזיר תוצאה מוגבלת: נכון/לא נכון, feedback קצר, והסבר רק אם מותר.
- אין חשיפת מפתח תשובות בתגובת רשת, HTML או JS.

### Phase 5: Gradual rollout

מטרה: חיבור הדרגתי לדפי תרגול אמיתיים.

סדר מומלץ:

1. דף בדיקה פנימי ב־staging.
2. topic אחד בלבד.
3. lesson אחד בלבד.
4. קבוצה קטנה של משתמשים approved.
5. הרחבה לדף שאלות ייעודי.
6. רק לאחר מכן חיבור ל־quizzes/exam pages.

קריטריון מעבר ל־production:

- אישור ידני מפורש.
- בדיקות אבטחה עברו.
- אין public fallback לשאלות מוגנות.
- אין תשובות בצד לקוח.
- rollback נבדק.


## Phase 0 — Baseline Verification Checklist

Phase 0 הוא שער חובה לפני כל כתיבת קוד של Protected Questions. מטרתו להוכיח שה־baseline של האתר תקין, כדי שלא נבנה מנגנון מוגן מעל בעיית Auth, redirect או runtime קיימת.

### בדיקות חובה ידניות ואוטומטיות

1. Login עם Google עובד ב־staging.
2. Logout עובד.
3. אחרי logout לא מוצג “שלום, [שם משתמש]”.
4. דף הבית נטען.
5. שיעורים נטענים.
6. תרגול ומבחנים נטען.
7. שאלות למבחן נטען.
8. אין `auth/argument-error` בקונסול.
9. אין redirect loops.
10. אין protected-question runtime files ב־staging.
11. אין דף `protected-question-pilot.html` ב־staging.
12. אין שינוי ב־production.

### Definition of Done

Phase 0 נחשב גמור רק כאשר כל התנאים הבאים מתקיימים:

- `git status --short` נקי לפני בדיקות ולפני כל deploy ל־staging.
- `npm.cmd run check:links` עובר.
- בדיקת login/logout ידנית ב־staging עברה בהצלחה.
- בדיקה ידנית מאשרת שאחרי logout אין badge או greeting של משתמש מחובר.
- דפי public מרכזיים נטענים ב־staging: `index.html`, `pages/syllabus.html`, `pages/quizzes.html`, `pages/exam-questions.html`.
- דף `pages/protected-question-pilot.html` אינו קיים או מחזיר 404.
- אין קבצי runtime בשם `protected-question-*` שנפרסים ל־staging.
- אין שינוי ב־`auth.js`, `login.html`, `firestore.rules` או `firebase-config.js` במסגרת Phase 0, אלא אם Phase 0 עצמו נכשל והוחלט במפורש לתקן baseline לפני המשך.
- production לא נפרס ולא שונה.

### Rollback criteria

יש לעצור ולחזור ל־baseline יציב אם מתקיים אחד מהבאים:

- Google login לא נפתח או מחזיר שגיאה כגון `auth/argument-error`.
- logout אינו מנקה את מצב המשתמש מה־UI.
- מופיע redirect מאוחר או loop ל־`login.html`.
- דף public מרכזי נשבר בעקבות שינוי שנועד ל־Protected Questions.
- קובץ protected runtime או דף pilot מופיע ב־staging לפני Phase 1.
- נדרש שינוי ב־Auth, Rules או Firebase config לפני שה־baseline אומת ידנית.
- קיים חשש ש־production השתנה או נפרס בטעות.

### החלטת שער

לא מתחילים Phase 1 לפני ש־Phase 0 עובר גם ידנית וגם אוטומטית. אם Phase 0 נכשל, העבודה חוזרת לתיקון baseline בלבד; לא מוסיפים דף pilot, לא מוסיפים protected source, ולא משנים rules עד שה־baseline יציב.

## 4. מודל משתמשים

### guest

משתמש לא מחובר. יכול לראות תוכן ציבורי בלבד. אינו יכול לראות שאלות מוגנות או preview מוגן.

### authenticated

משתמש מחובר דרך Firebase Auth, אך עדיין לא בהכרח מאושר. יכול לראות מצב התחברות, אך לא שאלות מוגנות עד בדיקת approved.

### approved

משתמש מחובר שמסמך המשתמש שלו מוגדר כמאושר לפי מנגנון האתר הקיים. יכול לראות preview מוגן, ובהמשך להשתמש במנגנון שאלות מוגנות.

### admin

משתמש ניהול. אין להניח ש־admin מקבל bypass אוטומטי במנגנון השאלות בלי החלטה מפורשת. אם נדרש admin access, יש להגדיר אותו במפורש ולבדוק שלא נוצרת הרחבת הרשאות לא מכוונת.

## 5. מודל נתונים מוצע לשאלות

### Client-safe question payload

```json
{
  "id": "lesson-01-q001",
  "lessonId": "lesson-01",
  "topic": "ניהול סיכונים",
  "subTopic": "זיהוי מפגעים",
  "difficulty": "medium",
  "questionText": "מהו הצעד הראשון בניתוח סיכון בתרחיש נתון?",
  "options": [
    { "id": "a", "text": "אפשרות א" },
    { "id": "b", "text": "אפשרות ב" },
    { "id": "c", "text": "אפשרות ג" },
    { "id": "d", "text": "אפשרות ד" }
  ],
  "legalSource": {
    "type": "lesson",
    "ref": "lesson-01"
  },
  "status": "published",
  "visibility": "approved-users"
}
```

### Protected answer fields

שדות אלה צריכים להישמר בנפרד ממסמך client-readable או להיות זמינים רק לשרת:

```json
{
  "questionId": "lesson-01-q001",
  "correctAnswerId": "b",
  "explanation": "הסבר מלא לאחר מענה",
  "reviewedBy": "admin-user-id",
  "reviewedAt": "timestamp"
}
```

כלל בסיסי: אם שדה מאפשר להסיק את התשובה הנכונה, הוא לא נשלח ללקוח בשלב טעינת השאלה.

## 6. כללי אבטחה

- אין `correctAnswer` בצד לקוח.
- אין `answerKey` בצד לקוח.
- אין `correctIndex`, `isCorrect`, `solution` או שדות שקולים בצד לקוח.
- אין fallback מקומי לשאלות מוגנות ב־production.
- אין redirect loops.
- אין שינוי login קיים לפני בדיקת baseline.
- כשל approval lookup אינו מוצג כ־guest אם Firebase Auth מזהה user.
- אין client writes עבור שאלות מוגנות.
- אין `unsafe-inline` ואין הרחבת CSP רחבה ללא צורך נקודתי.
- כל feature חדש כבוי כברירת מחדל.
- staging קודם, production רק באישור מפורש.

## 7. תכנית בדיקות לכל שלב

### Phase 0

- `git status --short`
- `npm.cmd run check:links`
- login Google ידני
- logout ידני
- מעבר בין דף הבית, שיעורים, תרגול ושאלות
- בדיקת Console ללא שגיאות Auth חמורות

### Phase 1

- guest רואה state לא מחובר בלבד.
- authenticated מוצג כמשתמש מחובר.
- אין שאלות בדף.
- אין redirect אוטומטי.
- אין שינוי בדפי האתר האחרים.

### Phase 2

- guest אינו מקבל approved state.
- authenticated-not-approved רואה הודעה ייעודית.
- approved רואה state מאושר בלבד.
- כשל Firestore/permissions מוצג כ־error ברור ולא כ־guest.

### Phase 3

- approved רואה 3 שאלות preview בלבד.
- guest/not-approved לא רואים שאלות.
- Network אינו כולל `data/exam-questions.js` עבור protected flow.
- Network/HTML/JS אינם כוללים שדות תשובה אסורים.
- אין writes.

### Phase 4

- שליחת תשובה מחזירה רק feedback מוגבל.
- אין answer key בתגובה.
- בדיקות malformed payload.
- בדיקות permission denied.
- בדיקות rate/quota בסיסיות.

### Phase 5

- rollout מדורג לפי user/topic.
- monitoring לקונסול ולבקשות רשת.
- בדיקת rollback על staging.
- אישור ידני לפני production.

## 8. Rollback plan

- להשאיר branch baseline ידוע ויציב.
- כל Phase ב־commit נפרד.
- אם Phase נכשל, לבצע revert של ה־commit האחרון בלבד.
- אם deploy staging נכשל, להחזיר ל־baseline branch ולפרוס hosting/rules מה־baseline.
- לא לשנות production עד שה־rollback נוסה ב־staging.
- לא למחוק את מערכת השאלות הציבורית הקיימת עד שהמסלול המוגן מוכח.

## 9. החלטות פתוחות שדורשות אישור לפני קוד

- האם Protected Questions v1 דורש Cloud Functions כבר בשלב validation, או שמתחילים עם preview read-only בלבד.
- האם admin מקבל גישה דרך אותו approved flow או מנגנון נפרד.
- האם production ימשיך לפרסם `data/exam-questions.js` עד השלמת המנגנון המוגן.
- מהו collection path הסופי לשאלות preview.
- האם explanations יוצגו רק אחרי מענה או יישארו מחוץ ל־v1.
- האם נדרש login לכל תרגול או רק לשאלות מוגנות.
- איך מודדים הצלחה של pilot לפני rollout.
- מי מאשר שינויי `firestore.rules` ו־Auth לפני כתיבת קוד.


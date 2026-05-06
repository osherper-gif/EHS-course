# שליחת הודעות טלגרם אוטומטית ב-Windows

השליחה מתבצעת מקומית בלבד באמצעות Node.js ו-Windows Task Scheduler. אין שימוש ב-Cloud Functions, אין Firebase Secrets, ואין שמירת token בקוד.

## קבצים

- `.env` או `.env.local` - מכיל `TELEGRAM_BOT_TOKEN`.
- `scripts/telegram-auto-dispatch.js` - בודק אילו הודעות הגיע זמנן ושולח אותן.
- `.telegram-dispatch-log.json` - נוצר מקומית לאחר שליחה אמיתית ומונע כפילויות.

## Dry-run

```powershell
node scripts\telegram-auto-dispatch.js
```

סימולציה לתאריך ושעה:

```powershell
node scripts\telegram-auto-dispatch.js --date=2026-05-06 --time=18:05
```

## שליחה אמיתית

```powershell
node scripts\telegram-auto-dispatch.js --confirm-send
```

ברירת המחדל היא שליחה לערוץ:

```text
@ehs_course_215
```

אפשר להחליף ערוץ:

```powershell
node scripts\telegram-auto-dispatch.js --chat-id=@ehs_course_215 --confirm-send
```

## מנגנון catch-up

בכל הרצה הסקריפט בודק 48 שעות אחורה. אם המחשב היה כבוי או שהמשימה לא רצה בזמן, הסקריפט מאתר הודעות הכנה או תזכורת שהיו אמורות להישלח ולא מופיעות בלוג.

אם הודעה נשלחת באיחור, נוסף בתחילת ההודעה:

```text
(הודעה שנשלחת באיחור)
```

הודעה שנשלחה בטווח של עד 15 דקות מזמן היעד מסומנת `on-time`. הודעה מאוחרת יותר מסומנת `catch-up`.

## מניעת כפילויות

לאחר שליחה אמיתית הסקריפט מוסיף רשומה ל:

```text
.telegram-dispatch-log.json
```

דוגמה:

```json
{
  "dispatchId": "bh-215-004:preparation:2026-05-06T17:00:00",
  "type": "preparation",
  "lessonId": "bh-215-004",
  "scheduledAt": "2026-05-06T17:00:00",
  "sentAt": "2026-05-06T18:05:00",
  "mode": "catch-up"
}
```

אם אותה `dispatchId` כבר קיימת בלוג, הסקריפט לא ישלח אותה שוב.

## הגדרת Windows Task Scheduler

1. פתח Task Scheduler.
2. צור משימה חדשה, לא Basic Task.
3. General:
   - סמן `Run whether user is logged on or not`.
   - סמן `Run with highest privileges` אם נדרש.
4. Triggers:
   - צור Trigger שחוזר כל 15 או 30 דקות.
   - מומלץ לבחור `Repeat task every`.
5. Actions:
   - Program/script:
     ```text
     node
     ```
   - Add arguments:
     ```text
     scripts\telegram-auto-dispatch.js --confirm-send
     ```
   - Start in:
     ```text
     C:\Users\Administrator\Desktop\קורס ממונה בטיחות\אתר אינטרנט
     ```
6. Settings:
   - סמן `Run task as soon as possible after a scheduled start is missed`.
   - סמן `If the task fails, restart every`.
   - סמן `Wake the computer to run this task` אם המחשב במצב שינה ורוצים להעיר אותו.

## איך המערכת משלימה הודעות

גם אם Task Scheduler מפעיל את המשימה באיחור, הסקריפט עצמו בודק 48 שעות אחורה מול הלוג המקומי. לכן הודעה שלא נשלחה בגלל כיבוי מחשב תישלח בהרצה הבאה, פעם אחת בלבד, ותסומן כ-catch-up.

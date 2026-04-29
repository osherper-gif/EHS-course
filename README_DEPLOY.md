# העלאה היום ל-Firebase Hosting

לפני deploy חובה להדביק `firebaseConfig` אמיתי בקובץ `js/firebase-config.js`.

אם עדיין מופיע `PASTE_HERE`, עצרו:

**יש להדביק firebaseConfig אמיתי לפני deploy**

## צעדים מהירים

1. התחברות ל-Firebase CLI:

```powershell
firebase login
```

2. בחירת פרויקט:

```powershell
firebase use --add
```

בחרו את פרויקט Firebase ושמרו אותו כ-`default`.

3. הדבקת Firebase config:

- Firebase Console
- Project settings
- Web app
- העתיקו את `firebaseConfig`
- הדביקו ב-`js/firebase-config.js`

4. הפעלת Authentication:

- Authentication > Get started
- Sign-in method
- הפעילו Google
- הפעילו Email/Password

5. הפעלת Firestore:

- Firestore Database
- Create database
- Production mode

6. העלאת Rules:

```powershell
firebase deploy --only firestore:rules
```

7. פרסום Hosting:

```powershell
firebase deploy --only hosting
```

או הכל יחד:

```powershell
firebase deploy
```

## Authorized domains

Authentication > Settings > Authorized domains:

- ודאו ש-`PROJECT_ID.web.app` קיים.
- אם משתמשים בדומיין מותאם, הוסיפו אותו.
- לבדיקה מקומית אפשר להוסיף `localhost`.

## כניסת אדמין

האדמין הראשי הוא:

`osherper@gmail.com`

כניסה ראשונה עם האימייל הזה תיצור משתמש עם:

- `role: admin`
- `status: approved`

לאחר מכן יופיע קישור "ניהול משתמשים".

## אבטחה

- אין לשמור סיסמאות בקוד או ב-localStorage.
- אין להעלות service account או private key.
- `firebaseConfig` אינו סוד, אבל הוא חייב להיות config אמיתי לפני deploy.
- האתר סטטי; כל עמוד מוגן ב-auth guard בצד לקוח.
- Firestore Rules מגנות על מסמכי משתמשים ועל progress/notes.


## התראות מייל לאדמין

האתר כולל מנגנון EmailJS אופציונלי לשליחת התראה כאשר משתמש חדש נרשם וממתין לאישור.

1. פתח חשבון ב-EmailJS.
2. צור Email Service שמורשה לשלוח אל osherper@gmail.com.
3. צור Email Template עם הפרמטרים: user_email, user_name, admin_link, approve_link.
4. עדכן את js/email-config.js:
   - enabled: true
   - serviceId
   - templateId
   - publicKey
5. ודא שה-CSP כולל connect-src אל https://api.emailjs.com.
6. בצע firebase deploy.

אם הקובץ נשאר עם PASTE_EMAILJS..., האתר יעבוד רגיל אך לא יישלח מייל בפועל.

## עדכון היסטוריית גרסאות אתר

עמוד ניהול הגרסאות משתמש בקובץ `data/site-versions.js` כמאגר גרסאות מובנה מראש. אם Firestore collection בשם `siteVersions` ריק, האדמין יראה את הגרסאות המובנות ויוכל ללחוץ על “ייבא גרסאות ל-Firestore”.

ליצירת קובץ בסיסי מתוך היסטוריית Git המקומית ניתן להריץ:

```powershell
node .\scripts\generate-site-versions.js
```

הסקריפט קורא `git log` ומייצר רשומות בסיסיות. לאחר מכן מומלץ להשלים ידנית פירוט שינויים, באגים, אבטחה, תוכן ו-Firebase.

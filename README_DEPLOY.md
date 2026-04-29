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

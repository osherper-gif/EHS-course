# פריסה ל-Firebase Hosting

האתר נשאר HTML/CSS/JS רגיל, ללא Backend, ללא React וללא Vite. Firebase משמש רק ל-Authentication, Firestore ו-Hosting.

## 1. יצירת פרויקט Firebase

1. היכנסו אל [Firebase Console](https://console.firebase.google.com/).
2. לחצו Add project.
3. בחרו שם לפרויקט, למשל `safety-course-private`.
4. ניתן לכבות Google Analytics כדי לשמור על פשטות ועלות נמוכה.

## 2. הפעלת Authentication

1. בתפריט Firebase פתחו Authentication.
2. לחצו Get started.
3. עברו אל Sign-in method.

## 3. הפעלת Google provider

1. בתוך Sign-in method בחרו Google.
2. הפעילו Enable.
3. בחרו Support email.
4. שמרו.

## 4. הפעלת Email/Password

1. בתוך Sign-in method בחרו Email/Password.
2. הפעילו Email/Password.
3. אין חובה להפעיל Email link.
4. שמרו.

## 5. העתקת firebaseConfig

1. במסך Project settings לחצו על Web app.
2. צרו אפליקציית Web אם עדיין אין.
3. העתיקו את אובייקט `firebaseConfig`.
4. פתחו את הקובץ `js/firebase-config.js`.
5. החליפו את ערכי `PASTE_HERE` בערכים האמיתיים מה-Firebase Console.

## 6. הפעלת Firestore

1. בתפריט Firebase פתחו Firestore Database.
2. לחצו Create database.
3. בחרו Production mode.
4. בחרו אזור קרוב או ברירת מחדל.

## 7. העלאת Firestore Rules

הקובץ `firestore.rules` כבר נמצא בפרויקט. הוא מאפשר:

- למשתמש לקרוא את המסמך שלו.
- לאדמין `osherper@gmail.com` לקרוא ולעדכן את כל המשתמשים.
- למשתמש רגיל לעדכן פרטים בסיסיים בלבד, בלי לשנות לעצמו role/status.
- למשתמש approved לסנכרן progress/notes תחת `users/{uid}/progress/{lessonId}`.

להעלאה:

```powershell
firebase deploy --only firestore:rules
```

## 8. פרסום Firebase Hosting

1. התקינו Firebase CLI אם צריך:

```powershell
npm install -g firebase-tools
```

2. התחברו:

```powershell
firebase login
```

3. עדכנו את `.firebaserc` והחליפו `PASTE_FIREBASE_PROJECT_ID_HERE` ב-projectId.

4. מתוך תיקיית האתר:

```powershell
firebase deploy
```

## 9. Authorized domains

ב-Firebase Console:

1. Authentication.
2. Settings.
3. Authorized domains.
4. ודאו שהדומיין של Firebase Hosting מופיע, למשל:
   `your-project-id.web.app`
5. אם משתמשים בדומיין מותאם, הוסיפו אותו כאן.
6. לבדיקה מקומית אפשר להוסיף `localhost` ידנית אם Firebase לא הוסיף אותו אוטומטית.

## 10. כניסה כאדמין

1. פתחו את האתר לאחר הפרסום.
2. היכנסו עם Google או Email/Password באמצעות:
   `osherper@gmail.com`
3. בעת הכניסה הראשונה האתר ייצור אוטומטית מסמך:
   `users/{uid}`
4. אם האימייל הוא `osherper@gmail.com`, המשתמש יקבל:
   `role: admin`
   `status: approved`
5. לאחר מכן יופיע קישור "ניהול משתמשים".

## בדיקות מומלצות

1. היכנסו כאדמין.
2. פתחו `admin.html`.
3. הרשמו ממשתמש אחר.
4. ודאו שהמשתמש החדש רואה הודעת המתנה.
5. אשרו אותו דרך admin.html.
6. התחברו שוב כמשתמש המאושר וודאו שתוכן הקורס מוצג.
7. חסמו משתמש ובדקו שהוא רואה הודעת חסימה.

## הערת אבטחה חשובה

זהו אתר סטטי. קבצי HTML ניתנים להורדה ברמת Hosting כמו כל אתר סטטי, ולכן שכבת ההגנה על הצגת הקורס מתבצעת ב-JS בכל עמוד. נתוני משתמשים והתקדמות מוגנים ב-Firestore Rules. אם בעתיד תרצו הגנה חזקה יותר על עצם קבלת קבצי התוכן, יהיה צורך בארכיטקטורה אחרת, אך היא תדרוש Backend או שירות נוסף.

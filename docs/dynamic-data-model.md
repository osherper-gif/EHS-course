# אפיון מודל נתונים לגרסה דינמית

## מטרה

מסמך זה מגדיר מודל נתונים מוצע לגרסה דינמית של אתר קורס ממונה בטיחות. המודל נועד לאפשר ניהול תוכן, שיעורים, חוקים, תקנים, שאלות, אתגרי בטיחות והתקדמות תלמידים בצורה מסודרת, תוך שמירה על האתר הסטטי הקיים כ־fallback.

המסמך הוא אפיון בלבד. אין בו מימוש, שינוי Firebase, שינוי Auth, שינוי Firestore או deploy.

## עקרונות תכנון

- Static-first: האתר הקיים ממשיך לעבוד גם בלי backend.
- Staging-first: כל חיבור דינמי עתידי ייבדק קודם ב־staging.
- Content versioning: כל שינוי תוכן משמעותי יקבל גרסה ותאריך.
- Least privilege: הרשאות ניהול יופרדו ממשתמש רגיל.
- Reversible migration: מעבר מתוכן סטטי לדינמי יתבצע בשלבים עם fallback.
- No production writes: אין כתיבה ל־production ללא אישור מפורש.

## Collections מוצעות

### `courses`

מייצגת קורס או מסלול לימוד.

```json
{
  "courseId": "safety-supervisor",
  "title": "קורס ממונה בטיחות",
  "description": "מסלול לימוד להכנה מקצועית בתחום הבטיחות.",
  "status": "published",
  "order": 1,
  "defaultLocale": "he",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "contentVersionId": "version-id"
}
```

### `lessons`

מייצגת שיעור לימודי מלא או יחידת תוכן.

```json
{
  "lessonId": "lesson-01",
  "courseId": "safety-supervisor",
  "title": "יסודות תורת הבטיחות",
  "slug": "lesson-01",
  "summary": "היכרות עם מושגי יסוד בבטיחות.",
  "sections": [
    {
      "sectionId": "risk-basics",
      "title": "סיכון, מפגע וגורם סיכון",
      "type": "learning-section",
      "topicTags": ["risk", "hazard"],
      "contentBlocks": []
    }
  ],
  "relatedLegalRefs": ["labor-inspection-law-1954"],
  "relatedStandards": ["iso-45001-2018"],
  "questionTopicIds": ["lesson-01"],
  "status": "published",
  "order": 1,
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "contentVersionId": "version-id"
}
```

### `contentBlocks`

אפשרות עתידית לניהול בלוקים חוזרים בתוך שיעורים, חוקים ותקנים.

```json
{
  "blockId": "block-id",
  "ownerType": "lesson",
  "ownerId": "lesson-01",
  "type": "text | quote | table | diagram | checklist | callout | practice-card",
  "title": "כותרת הבלוק",
  "body": "תוכן בעברית RTL",
  "metadata": {
    "topic": "risk",
    "legalSource": null,
    "displayStyle": "card"
  },
  "order": 1,
  "updatedAt": "timestamp"
}
```

### `legalReferences`

מייצגת חוקים, פקודות ותקנות.

```json
{
  "legalRefId": "labor-inspection-law-1954",
  "type": "law",
  "title": "חוק ארגון הפיקוח על העבודה, תשי\"ד-1954",
  "slug": "labor-inspection-law-1954",
  "sourceStatus": "requires-official-verification",
  "sections": [
    {
      "sectionNumber": "6",
      "title": "צו בטיחות",
      "quote": "ציטוט מתוך המקור הלימודי",
      "explanation": "הסבר לימודי",
      "examples": [],
      "stakeholderNotes": []
    }
  ],
  "relatedLessons": ["lesson-02"],
  "relatedQuestions": [],
  "status": "published",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "contentVersionId": "version-id"
}
```

### `standards`

מייצגת תקנים מקצועיים.

```json
{
  "standardId": "iso-45001-2018",
  "title": "ת\"י ISO 45001:2018 - מערכות ניהול בטיחות ובריאות בתעסוקה",
  "slug": "iso-45001-2018",
  "standardFamily": "ISO",
  "year": 2018,
  "sections": [
    {
      "clause": "4",
      "title": "הקשר הארגון",
      "explanation": "הסבר לימודי",
      "examples": [],
      "checklistItems": []
    }
  ],
  "relatedLessons": ["lesson-02"],
  "questionTopicIds": ["iso-45001-2018"],
  "status": "published",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "contentVersionId": "version-id"
}
```

### `questions`

מייצגת מאגר שאלות מרכזי.

```json
{
  "questionId": "q-lesson-01-001",
  "topicId": "lesson-01",
  "lessonId": "lesson-01",
  "category": "יסודות תורת הבטיחות",
  "difficulty": "easy",
  "question": "טקסט השאלה",
  "answers": [
    { "answerId": "a", "text": "אפשרות א" },
    { "answerId": "b", "text": "אפשרות ב" },
    { "answerId": "c", "text": "אפשרות ג" },
    { "answerId": "d", "text": "אפשרות ד" }
  ],
  "correctAnswerId": "a",
  "explanation": "הסבר לתשובה הנכונה",
  "tags": ["risk", "safety-basics"],
  "status": "published",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "contentVersionId": "version-id"
}
```

### `safetyGameChallenges`

מייצגת אתגרי בטיחות או סטים של שאלות למשחק.

```json
{
  "challengeId": "game-iso-45001-2018",
  "title": "ת\"י ISO 45001:2018",
  "topicId": "iso-45001-2018",
  "description": "אתגר שאלות בנושא מערכת ניהול בטיחות ובריאות.",
  "questionIds": ["q-iso-001", "q-iso-002"],
  "rules": {
    "timeLimitSeconds": 60,
    "shuffleQuestions": true,
    "shuffleAnswers": true
  },
  "status": "published",
  "updatedAt": "timestamp"
}
```

### `users`

מייצגת משתמשים עתידיים. בשלב ראשון אין חובה לחבר ל־Auth.

```json
{
  "uid": "user-id",
  "displayName": "שם משתמש",
  "email": "user@example.com",
  "role": "student",
  "status": "active",
  "createdAt": "timestamp",
  "lastLoginAt": "timestamp",
  "privacyConsentAt": "timestamp"
}
```

### `userRoles`

הפרדה בין הרשאות תפעוליות לתוכן.

```json
{
  "roleId": "admin",
  "name": "מנהל מערכת",
  "permissions": [
    "content:read",
    "content:write",
    "questions:write",
    "reports:read"
  ]
}
```

### `studentProgress`

מייצגת התקדמות תלמיד בשיעורים.

```json
{
  "progressId": "uid-lesson-01",
  "uid": "user-id",
  "courseId": "safety-supervisor",
  "lessonId": "lesson-01",
  "startedAt": "timestamp",
  "lastViewedAt": "timestamp",
  "completedAt": null,
  "completedSections": ["risk-basics"],
  "readingProgressPercent": 45,
  "contentVersionId": "version-id"
}
```

### `quizAttempts`

מייצגת ניסיון פתרון מבחן או תרגול.

```json
{
  "attemptId": "attempt-id",
  "uid": "user-id",
  "mode": "practice | exam | safety-game",
  "topicId": "lesson-01",
  "questionIds": ["q-lesson-01-001"],
  "answers": [
    {
      "questionId": "q-lesson-01-001",
      "selectedAnswerId": "a",
      "isCorrect": true,
      "answeredAt": "timestamp"
    }
  ],
  "score": 100,
  "startedAt": "timestamp",
  "completedAt": "timestamp"
}
```

### `contentVersions`

מייצגת גרסאות תוכן ומעקב אחר שינויים.

```json
{
  "contentVersionId": "version-id",
  "scope": "lesson | legalReference | standard | questions",
  "scopeId": "lesson-01",
  "version": "2026.05.10-01",
  "status": "draft | review | published | archived",
  "changeSummary": "תיאור השינוי",
  "createdBy": "uid",
  "createdAt": "timestamp",
  "approvedBy": null,
  "approvedAt": null
}
```

### `searchIndex`

אינדקס חיפוש דינמי עתידי. בשלב ראשון אפשר להמשיך להשתמש ב־`data/search-index.js`.

```json
{
  "searchItemId": "lesson-01",
  "type": "lesson",
  "title": "יסודות תורת הבטיחות",
  "url": "/pages/lesson-01.html",
  "keywords": ["סיכון", "מפגע", "כמעט תאונה"],
  "summary": "תקציר קצר בלבד",
  "sourceId": "lesson-01",
  "updatedAt": "timestamp"
}
```

## הרשאות Admin/User

### User רגיל

- קריאת תוכן שפורסם.
- פתרון שאלות ותרגולים.
- שמירת התקדמות אישית, אם הופעל מצב משתמשים.
- ייצוא מידע אישי בעתיד, אם יישמר מידע אישי.

### Admin תוכן

- יצירה ועדכון של שיעורים.
- יצירה ועדכון של שאלות.
- ניהול סטטוס draft/review/published.
- צפייה בדוחות תוכן.

### Super Admin

- ניהול הרשאות.
- אישור פרסום.
- ניהול הגדרות מערכת.
- שינויי תשתית רק לאחר review.

## Fallback לנתונים סטטיים

בשלב ראשון האתר ימשיך להסתמך על:

- HTML סטטי לדפי שיעור וחוקים.
- `data/exam-questions.js` לשאלות.
- `data/game-data.js` לאתגר בטיחות.
- `data/search-index.js` לחיפוש.

מנגנון דינמי עתידי צריך לעבוד כך:

1. ניסיון טעינת תוכן דינמי, רק אם הופעל feature flag.
2. אם אין backend זמין או אין הרשאה, טעינה מהקבצים הסטטיים.
3. אם יש תקלה בנתונים הדינמיים, הצגת הדף הסטטי הקיים.
4. אין מחיקה של fallback עד שהמערכת הדינמית עברה UAT.

## Migration plan מהגרסה הסטטית

### שלב 1: מיפוי

- למפות את כל דפי השיעורים.
- למפות חוקים, פקודות ותקנים.
- למפות שאלות לפי topic/lesson/category/difficulty.
- למפות קישורי חיפוש וקישורים פנימיים.

### שלב 2: יצירת schema מקומי

- להגדיר JSON schema לכל ישות מרכזית.
- להמיר דף אחד בלבד לפורמט נתונים כ־pilot.
- לשמור את הדף הסטטי כ־fallback.

### שלב 3: Renderer מקומי

- לבנות renderer שמציג שיעור ממודל JSON.
- לוודא RTL, tabs, accordions, tables ותרשימים.
- לא לחבר ל־Firestore בשלב זה.

### שלב 4: Content Manager staging-only

- ליצור מסך ניהול מקומי או staging-only.
- לאפשר עריכת draft ללא פרסום ל־production.
- להוסיף בדיקות קישורים וג'יבריש לפני פרסום.

### שלב 5: Cloud Mode עתידי

- Firebase Auth רק אחרי אישור.
- Firestore רק אחרי אישור rules ו־diff.
- הפרדה בין staging ל־production.
- אין Cloud Functions בשלב ראשון אלא אם יש צורך ברור.

### שלב 6: Migration מבוקר

- להעביר תחילה שאלות.
- אחר כך search index.
- אחר כך שיעור pilot.
- אחר כך חוקים/תקנים.
- production רק לאחר בדיקת מנהל האתר ואישור מפורש.

## סיכונים פתוחים

- שינוי תוכן משפטי או תקני דורש בדיקה מול מקור מוסמך.
- שמירת התקדמות תלמידים מעלה שאלות פרטיות.
- Cloud Mode דורש הרשאות Firestore מדויקות.
- מעבר דינמי מלא עלול לשבור קישורים קיימים אם אין fallback.
- נדרש תהליך approval לפני פרסום תוכן.

## המלצה לשלב הבא

להתחיל ב־JSON schema מקומי עבור `lessons`, `questions`, ו־`contentVersions`, בלי חיבור לענן. לאחר מכן לבחור שיעור אחד כ־pilot ולהציג אותו ב־renderer מבודד ב־staging בלבד.

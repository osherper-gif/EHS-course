const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'data', 'search-index.js');

const entries = [
  {
    title: 'דף הבית',
    type: 'עמוד ראשי',
    snippet: 'כניסה לקורס ממונה בטיחות, שיעורים, תרגול, מבחנים וכלי שטח.',
    url: 'index.html',
    lessonId: 'home',
    tags: ['בית', 'קורס', 'ממונה בטיחות', 'שיעורים']
  },
  {
    title: 'סילבוס הקורס',
    type: 'עמוד ניווט',
    snippet: 'מפת הלמידה של הקורס לפי מפגשים, נושאים ויעדי לימוד.',
    url: 'pages/syllabus.html',
    lessonId: 'syllabus',
    tags: ['סילבוס', 'מפגשים', 'נושאי לימוד']
  },
  {
    title: 'יסודות תורת הבטיחות',
    type: 'שיעור',
    snippet: 'מושגי יסוד בבטיחות: סיכון, מפגע, כמעט תאונה, מטריצת סיכונים והיררכיית בקרות.',
    url: 'pages/lesson-01.html',
    lessonId: 'lesson-01',
    tags: ['סיכון', 'מפגע', 'כמעט תאונה', 'מחלת מקצוע', 'גיהות', 'ניטור תעסוקתי', 'מטריצת סיכונים', 'היררכיית בקרות', 'גורם סיכון חדש']
  },
  {
    title: 'ארגון מערך הבטיחות',
    type: 'שיעור',
    snippet: 'מבנה מערך הבטיחות, פיקוח על העבודה, צווים, תאונת עבודה, אחריות ותיעוד.',
    url: 'pages/lesson-02.html',
    lessonId: 'lesson-02',
    tags: ['מערך בטיחות', 'חוק מול פקודה', 'צו בטיחות', 'צו שיפור', 'תאונת עבודה', 'טופס 250', 'קשר סיבתי', 'אחריות פלילית', 'אחריות אזרחית', 'קבלנים', 'מפקח עבודה', 'תחקיר אירוע']
  },
  {
    title: 'סיכונים וניהול סיכונים',
    type: 'שיעור',
    snippet: 'זיהוי סיכונים, הערכת סיכונים, בקרות ומעקב אחר פעולות מתקנות.',
    url: 'pages/lesson-03.html',
    lessonId: 'lesson-03',
    tags: ['ניהול סיכונים', 'הערכת סיכונים', 'בקרות', 'פעולות מתקנות']
  },
  {
    title: 'גיהות ובריאות תעסוקתית',
    type: 'שיעור',
    snippet: 'חשיפה תעסוקתית, ניטור, בדיקות רפואיות, גיהות וגורמי סיכון בריאותיים.',
    url: 'pages/lesson-04.html',
    lessonId: 'lesson-04',
    tags: ['גיהות', 'בריאות תעסוקתית', 'ניטור', 'בדיקות רפואיות']
  },
  {
    title: 'בטיחות אש וחירום',
    type: 'שיעור',
    snippet: 'היערכות לחירום, מניעת אש, תגובה לאירועים ותיעוד תרגילים.',
    url: 'pages/lesson-05.html',
    lessonId: 'lesson-05',
    tags: ['אש', 'חירום', 'תרגיל', 'תגובה']
  },
  {
    title: 'בטיחות בעבודה בגובה',
    type: 'שיעור',
    snippet: 'עקרונות בטיחות בעבודה בגובה, הרשאות, ציוד, הדרכה ופיקוח.',
    url: 'pages/lesson-07.html',
    lessonId: 'lesson-07',
    tags: ['עבודה בגובה', 'רתמה', 'הדרכה', 'פיקוח']
  },
  {
    title: 'בטיחות קבלנים',
    type: 'שיעור',
    snippet: 'ניהול קבלנים, תיאום ציפיות, הרשאות, הדרכות ותיעוד עבודות.',
    url: 'pages/lesson-08.html',
    lessonId: 'lesson-08',
    tags: ['קבלנים', 'הרשאה', 'תיאום', 'תיעוד']
  },
  {
    title: 'תחקיר אירועים ולמידה מתאונות',
    type: 'שיעור',
    snippet: 'איסוף נתונים, ניתוח גורמי שורש, פעולות מתקנות ולמידה ארגונית.',
    url: 'pages/lesson-10.html',
    lessonId: 'lesson-10',
    tags: ['תחקיר', 'אירוע', 'גורמי שורש', 'פעולה מתקנת']
  },
  {
    title: 'תוכנית בטיחות ומערכת ניהול',
    type: 'שיעור',
    snippet: 'תכנון, ביצוע, בקרה ושיפור מתמיד במערכת בטיחות ארגונית.',
    url: 'pages/lesson-11.html',
    lessonId: 'lesson-11',
    tags: ['תוכנית בטיחות', 'מערכת ניהול', 'בקרה', 'שיפור מתמיד']
  },
  {
    title: 'חוקים, תקנים וכלי שטח',
    type: 'אינדקס',
    snippet: 'מרכז קישורים לחוקים, תקנים, תבניות וכלים מעשיים לממונה בטיחות.',
    url: 'pages/field-tools.html',
    lessonId: 'field-tools',
    tags: ['חוקים', 'תקנים', 'כלי שטח', 'תבניות']
  },
  {
    title: 'חוקים ותקנות',
    type: 'אינדקס',
    snippet: 'דפי מקור וקישורים לחקיקה, פקודות ותקנות רלוונטיות לבטיחות בעבודה.',
    url: 'pages/laws.html',
    lessonId: 'laws',
    tags: ['חוקים', 'תקנות', 'פקודה', 'חקיקה']
  },
  {
    title: 'תקנים',
    type: 'אינדקס',
    snippet: 'תקנים מקצועיים ומערכות ניהול בטיחות ובריאות בתעסוקה.',
    url: 'pages/standards.html',
    lessonId: 'standards',
    tags: ['תקנים', 'ISO', 'מערכת ניהול']
  },
  {
    title: 'חוק ארגון הפיקוח על העבודה, תשי״ד–1954',
    type: 'חוק',
    snippet: 'דף לימוד מלא על שירות הפיקוח, סמכויות מפקח עבודה, צווים, ועדות בטיחות, נאמני בטיחות וממונה בטיחות.',
    url: 'pages/labor-inspection-law-1954.html',
    lessonId: 'labor-inspection-law-1954',
    tags: ['חוק ארגון הפיקוח', 'מפקח עבודה', 'ועדת בטיחות', 'נאמן בטיחות', 'ממונה בטיחות', 'צו בטיחות', 'צו שיפור', 'תשי״ד–1954']
  },
  {
    title: 'פקודת הבטיחות בעבודה [נוסח חדש], תש״ל–1970',
    type: 'פקודה',
    snippet: 'דף לימוד מלא על בריאות עובדים, מכונות וגידור, הרמה, מתקני לחץ, מקום מוקף, אש, רווחה ואחריות.',
    url: 'pages/work-safety-ordinance-1970.html',
    lessonId: 'work-safety-ordinance-1970',
    tags: ['פקודת הבטיחות', 'בטיחות בעבודה', 'מכונות', 'גידור', 'מקום מוקף', 'הרמה', 'מתקני לחץ']
  },
  {
    title: 'ת״י ISO 45001:2018 — מערכות ניהול בטיחות ובריאות בתעסוקה',
    type: 'תקן',
    snippet: 'דף לימוד מלא על מערכת ניהול בטיחות ובריאות בתעסוקה, PDCA, מנהיגות, תכנון, תפעול, מבדקים ושיפור.',
    url: 'pages/iso-45001-2018.html',
    lessonId: 'iso-45001-2018',
    tags: ['ISO 45001', 'ת״י 45001', 'מערכת ניהול בטיחות', 'PDCA', 'מדרג בקרות', 'שיתוף עובדים', 'מחזיקי עניין', 'מידע מתועד', 'סקר הנהלה', 'מבדק פנימי', 'פעולה מתקנת', 'ניהול שינויים', 'דרישות דין']
  },
  {
    title: 'תרגול ומבחנים',
    type: 'תרגול',
    snippet: 'כניסה לתרגול לפי נושאים, שאלות מבחן ואתגרי בטיחות.',
    url: 'pages/quizzes.html',
    lessonId: 'quizzes',
    tags: ['תרגול', 'מבחנים', 'שאלות']
  },
  {
    title: 'שאלות למבחן',
    type: 'תרגול',
    snippet: 'מאגר שאלות מקומי לפי שיעור, חוק, פקודה, תקן ורמת קושי.',
    url: 'pages/exam-questions.html',
    lessonId: 'exam-questions',
    tags: ['שאלות למבחן', 'מאגר שאלות', 'תשובות', 'הסברים']
  },
  {
    title: 'אתגר הבטיחות',
    type: 'משחק לימודי',
    snippet: 'תרגול אינטראקטיבי של מושגי בטיחות, חוקים, פקודות ותקנים.',
    url: 'pages/safety-game.html',
    lessonId: 'safety-game',
    tags: ['אתגר בטיחות', 'משחק', 'תרגול']
  },
  {
    title: 'ניהול בטיחות',
    type: 'כלי עבודה',
    snippet: 'כלים לניהול בטיחות, פעולות מתקנות, תיעוד ומעקב.',
    url: 'pages/safety-management.html',
    lessonId: 'safety-management',
    tags: ['ניהול בטיחות', 'פעולות מתקנות', 'מעקב', 'תיעוד']
  }
];

const normalizedEntries = entries.map((entry) => ({
  ...entry,
  text: [entry.title, entry.type, entry.snippet, ...(entry.tags || [])].join(' ')
}));

const fileBody = `window.SITE_SEARCH_INDEX = ${JSON.stringify(normalizedEntries, null, 2)};\n`;

fs.writeFileSync(outputPath, fileBody, 'utf8');
console.log(`Rebuilt ${path.relative(rootDir, outputPath)} with ${normalizedEntries.length} clean entries.`);

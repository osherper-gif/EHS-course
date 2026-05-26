(function () {
  "use strict";

  const knowledgePages = {
    "electrical-safety": { title: "חשמל והגנה מחשמל", category: "חשמל", href: "knowledge/electrical-safety.html", lessons: ["lesson-02"], examFocus: "LOTO, בדיקת העדר מתח, הארקה וממסר פחת" },
    "occupational-hygiene": { title: "גהות תעסוקתית", category: "גהות", href: "knowledge/occupational-hygiene.html", lessons: ["lesson-04", "lesson-08"], examFocus: "ניטור, חשיפה, רעש וחומרים מסוכנים" },
    "human-factors": { title: "גורם אנוש", category: "גורמי אנוש", href: "knowledge/human-factors.html", lessons: ["lesson-01"], examFocus: "תרבות בטיחות, עייפות, כמעט ונפגעים ו-RCA" },
    "emergency-preparedness": { title: "היערכות למצבי חירום", category: "חירום", href: "knowledge/emergency-preparedness.html", lessons: ["lesson-06"], examFocus: "תרחישים, תפקידים, פינוי ותרגול" },
    "iso-45001": { title: "ISO 45001", category: "ISO 45001", href: "knowledge/iso-45001.html", lessons: ["lesson-07"], examFocus: "PDCA, מנהיגות, שיתוף עובדים ושיפור מתמיד" },
    "construction-safety": { title: "בטיחות באתרי בנייה", category: "בנייה", href: "knowledge/construction-safety.html", lessons: ["lesson-03", "lesson-09"], examFocus: "פיגומים, חפירות, עגורנים ומבנים זמניים" },
    "hazardous-materials": { title: "חומרים מסוכנים", category: "חומ״ס", href: "knowledge/hazardous-materials.html", lessons: ["lesson-04"], examFocus: "SDS, אי-תאימות, אוורור ותגובה לדליפה" },
    "work-at-height": { title: "עבודה בגובה", category: "בנייה", href: "knowledge/work-at-height.html", lessons: ["lesson-03"], examFocus: "עיגון, רתמה, חילוץ והיררכיית בקרות" },
    "loto-ptw": { title: "LOTO / PTW", category: "LOTO/PTW", href: "knowledge/loto-ptw.html", lessons: ["lesson-02", "lesson-11"], examFocus: "בידוד אנרגיה, אימות, היתרי עבודה ו-SIMOPS" },
    "lifting-and-cranes": { title: "ציוד הרמה ועגורנים", category: "הרמה", href: "knowledge/lifting-and-cranes.html", lessons: ["lesson-03", "lesson-10"], examFocus: "SWL, רדיוס, זוויות רצועה והרמה קריטית" },
    "labor-inspection-law": { title: "חוק ארגון הפיקוח", category: "רגולציה", href: "knowledge/labor-inspection-law.html", lessons: ["lesson-01", "lesson-05"], examFocus: "מפקח עבודה, צווים, ועדות ונאמנים" },
    "safety-ordinance": { title: "פקודת הבטיחות בעבודה", category: "רגולציה", href: "knowledge/safety-ordinance.html", lessons: ["lesson-05"], examFocus: "מכונות, ציוד הרמה, בדיקות ותסקירים" },
    "emergency-management": { title: "ניהול חירום", category: "חירום", href: "knowledge/emergency-management.html", lessons: ["lesson-06"], examFocus: "פיקוד, תרגול, ציוד ולקחים" },
    "machine-guarding": { title: "מיגון מכונות", category: "הנדסה", href: "knowledge/machine-guarding.html", lessons: ["lesson-02"], examFocus: "נקודות תפיסה, interlock, E-stop ו-LOTO" },
    "process-safety": { title: "בטיחות תהליך", category: "ניהול סיכונים", href: "knowledge/process-safety.html", lessons: ["lesson-07", "lesson-11"], examFocus: "barriers, bowtie, MOC וסטיות תפעוליות" }
  };

  const lessons = {
    "lesson-01": { title: "יסודות תורת הבטיחות", href: "lesson-01.html", knowledge: ["human-factors", "labor-inspection-law", "safety-ordinance"], regulations: ["חוק ארגון הפיקוח על העבודה", "פקודת הבטיחות בעבודה"], tools: ["field-tools.html#legal-hierarchy"], practice: "exam-questions.html?lesson=lesson-01" },
    "lesson-02": { title: "ארגון מערך הבטיחות", href: "lesson-02.html", knowledge: ["electrical-safety", "loto-ptw", "machine-guarding"], regulations: ["חוק ארגון הפיקוח על העבודה"], tools: ["field-tools.html"], practice: "exam-questions.html?lesson=lesson-02" },
    "lesson-03": { title: "סיכונים תפעוליים", href: "lesson-03.html", knowledge: ["construction-safety", "work-at-height", "lifting-and-cranes"], regulations: ["תקנות עבודה בגובה", "פקודת הבטיחות בעבודה"], tools: ["field-tools.html"], practice: "exam-questions.html?lesson=lesson-03" },
    "lesson-04": { title: "סיכונים כימיים וגיהות", href: "lesson-04.html", knowledge: ["hazardous-materials", "occupational-hygiene"], regulations: ["SDS", "ניטור תעסוקתי"], tools: ["field-tools.html"], practice: "exam-questions.html?lesson=lesson-04" },
    "lesson-05": { title: "רגולציה ובטיחות בעבודה", href: "lesson-05.html", knowledge: ["labor-inspection-law", "safety-ordinance"], regulations: ["חוק ארגון הפיקוח", "פקודת הבטיחות"], tools: ["field-tools.html"], practice: "exam-questions.html?lesson=lesson-05" },
    "lesson-06": { title: "היערכות למצבי חירום", href: "lesson-06.html", knowledge: ["emergency-preparedness", "emergency-management"], regulations: ["דרישות חירום, הדרכה וציוד"], tools: ["field-tools.html"], practice: "exam-questions.html?lesson=lesson-06" },
    "lesson-07": { title: "ניהול בטיחות בתעסוקה", href: "lesson-07.html", knowledge: ["iso-45001", "process-safety", "human-factors"], regulations: ["ISO 45001", "תוכנית ניהול בטיחות"], tools: ["field-tools.html"], practice: "exam-questions.html?lesson=lesson-07" },
    "lesson-08": { title: "גהות תעסוקתית", href: "lesson-08.html", knowledge: ["occupational-hygiene", "hazardous-materials"], regulations: ["ניטור, רעש, חשיפה"], tools: ["field-tools.html"], practice: "exam-questions.html?lesson=lesson-08" },
    "lesson-09": { title: "בטיחות באתרי בנייה", href: "lesson-09.html", knowledge: ["construction-safety", "work-at-height"], regulations: ["תקנות בנייה", "עבודה בגובה"], tools: ["field-tools.html"], practice: "exam-questions.html?lesson=lesson-09" },
    "lesson-10": { title: "ציוד הרמה", href: "lesson-10.html", knowledge: ["lifting-and-cranes", "safety-ordinance"], regulations: ["בודק מוסמך", "תסקיר בדיקה"], tools: ["field-tools.html"], practice: "exam-questions.html?lesson=lesson-10" },
    "lesson-11": { title: "בטיחות תהליך ואחזקה", href: "lesson-11.html", knowledge: ["process-safety", "loto-ptw", "machine-guarding"], regulations: ["היתרי עבודה", "בידוד אנרגיה"], tools: ["field-tools.html"], practice: "exam-questions.html?lesson=lesson-11" },
    "lesson-12": { title: "חזרה למבחן", href: "lesson-12.html", knowledge: ["labor-inspection-law", "safety-ordinance", "iso-45001"], regulations: ["דגשי מבחן"], tools: ["master-hub.html", "glossary.html"], practice: "exam-questions.html" }
  };

  const glossaryTerms = [
    { term: "בקרת סיכונים", category: "רגולציה", definition: "אמצעי להפחתת הסתברות, חומרה או חשיפה לסיכון.", practical: "בודקים האם הבקרה באמת מיושמת בשטח ולא רק כתובה בנוהל.", href: "knowledge/process-safety.html", exam: true },
    { term: "מפקח עבודה", category: "רגולציה", definition: "גורם פיקוח בעל סמכויות לפי חוק ארגון הפיקוח על העבודה.", practical: "חשוב להבחין בין סמכות מפקח לבין אחריות המעסיק.", href: "knowledge/labor-inspection-law.html", exam: true },
    { term: "צו בטיחות", category: "רגולציה", definition: "כלי אכיפה להפסקת מצב מסוכן או פעולה מסוכנת.", practical: "נבדל מצו שיפור בכך שהוא ממוקד בסיכון מיידי יותר.", href: "knowledge/labor-inspection-law.html", exam: true },
    { term: "בודק מוסמך", category: "רגולציה", definition: "בעל הסמכה לבדיקת ציוד או מתקן לפי דרישות הדין.", practical: "בדיקה תקפה צריכה להיות מתועדת ונגישה לבקרה.", href: "knowledge/safety-ordinance.html", exam: true },
    { term: "הארקה", category: "חשמל", definition: "נתיב מוליך לזרם תקלה שמסייע להפעלת הגנות.", practical: "לא מניחים שהארקה קיימת; מאמתים בבדיקה מתאימה.", href: "knowledge/electrical-safety.html", exam: true },
    { term: "ממסר פחת", category: "חשמל", definition: "אמצעי ניתוק בעת זליגת זרם מעל ערך סף.", practical: "אינו היתר לעבודת חשמל ואינו מחליף LOTO.", href: "knowledge/electrical-safety.html", exam: true },
    { term: "בדיקת העדר מתח", category: "חשמל", definition: "אימות פעיל שמוליך או מעגל מנותק לפני מגע או עבודה.", practical: "כיבוי מפסק אינו מספיק בלי אימות.", href: "knowledge/electrical-safety.html", exam: true },
    { term: "ניטור תעסוקתי", category: "גהות", definition: "מדידת חשיפה של עובד לגורם סיכון בסביבת העבודה.", practical: "מבדיל בין תחושה כללית לבין נתון מדיד.", href: "knowledge/occupational-hygiene.html", exam: true },
    { term: "חשיפה", category: "גהות", definition: "מגע של עובד עם גורם סיכון לאורך זמן, ריכוז או עוצמה.", practical: "מנתחים משך, תדירות, מסלול כניסה ובקרה.", href: "knowledge/occupational-hygiene.html", exam: true },
    { term: "גורם אנוש", category: "גורמי אנוש", definition: "השפעת יכולות, עומס, תרבות, תכנון וסביבה על התנהגות בטיחותית.", practical: "לא מסתפקים בהאשמת עובד; מחפשים תנאים שיצרו טעות.", href: "knowledge/human-factors.html", exam: true },
    { term: "RCA", category: "גורמי אנוש", definition: "ניתוח גורמי שורש לאירוע או כמעט אירוע.", practical: "שואל למה הבקרה נכשלה ולא רק מי טעה.", href: "knowledge/human-factors.html", exam: true },
    { term: "תרחיש חירום", category: "חירום", definition: "אירוע אפשרי שמצריך תגובה מתוכננת, ציוד ותפקידים.", practical: "תרחיש טוב מגדיר מי עושה מה ובאיזה סדר.", href: "knowledge/emergency-management.html", exam: true },
    { term: "נקודת כינוס", category: "חירום", definition: "מקום מוסכם להתכנסות ובקרה לאחר פינוי.", practical: "צריך להיות נגיש, בטוח ומוכר לעובדים.", href: "knowledge/emergency-preparedness.html", exam: false },
    { term: "דיפון", category: "בנייה", definition: "תמיכת דפנות חפירה למניעת התמוטטות.", practical: "בוחנים סוג קרקע, עומק, עומסים ומים.", href: "knowledge/construction-safety.html", exam: true },
    { term: "עבודה בגובה", category: "בנייה", definition: "עבודה עם סכנת נפילה מגובה לפי דרישות התקנות.", practical: "מתחילים במניעה, ורק אחר כך ציוד בלימה.", href: "knowledge/work-at-height.html", exam: true },
    { term: "SWL", category: "הרמה", definition: "עומס עבודה בטוח של ציוד או אביזר הרמה.", practical: "משקל מטען אינו מספיק; בודקים רדיוס, זוויות ומרכז כובד.", href: "knowledge/lifting-and-cranes.html", exam: true },
    { term: "הרמה קריטית", category: "הרמה", definition: "הרמה בעלת סיכון גבוה המחייבת תכנון ופיקוח מוגברים.", practical: "כוללת לעיתים קרבה לאנשים, עומס חריג או תנאי שטח מורכבים.", href: "knowledge/lifting-and-cranes.html", exam: true },
    { term: "SDS", category: "חומ״ס", definition: "גיליון בטיחות לחומר כימי עם מידע על סיכונים, אחסון ותגובה.", practical: "מפיקים ממנו PPE, אי-תאימות ופעולות חירום.", href: "knowledge/hazardous-materials.html", exam: true },
    { term: "אי-תאימות חומרים", category: "חומ״ס", definition: "מצב שבו ערבוב או אחסון סמוך של חומרים עלול ליצור תגובה מסוכנת.", practical: "בודקים הפרדה, שילוט, מאצרות ואוורור.", href: "knowledge/hazardous-materials.html", exam: true },
    { term: "PDCA", category: "ISO 45001", definition: "מחזור Plan-Do-Check-Act לשיפור מתמיד.", practical: "מחבר תכנון, ביצוע, מדידה ופעולה מתקנת.", href: "knowledge/iso-45001.html", exam: true },
    { term: "מידע מתועד", category: "ISO 45001", definition: "תיעוד הנדרש לניהול, בקרה והוכחת יישום מערכת הניהול.", practical: "תיעוד צריך לשקף עבודה אמיתית ולא רק תיק מסמכים.", href: "knowledge/iso-45001.html", exam: true },
    { term: "LOTO", category: "LOTO/PTW", definition: "נעילה ותיוג של מקור אנרגיה למניעת הפעלה לא מתוכננת.", practical: "כולל ניתוק, נעילה, סימון ואימות אפס אנרגיה.", href: "knowledge/loto-ptw.html", exam: true },
    { term: "PTW", category: "LOTO/PTW", definition: "היתר עבודה לעבודה חריגה או מסוכנת.", practical: "לא מחליף בקרות; הוא מוודא שהן קיימות לפני ביצוע.", href: "knowledge/loto-ptw.html", exam: true },
    { term: "SIMOPS", category: "LOTO/PTW", definition: "פעולות מקבילות שעלולות להשפיע זו על זו.", practical: "בודקים התנגשויות בין קבלנים, אנרגיות, גישה וחירום.", href: "knowledge/loto-ptw.html", exam: true },
    { term: "Interlock", category: "הנדסה", definition: "מנגנון שמונע פעולה מסוכנת כאשר תנאי בטיחות לא מתקיים.", practical: "עקיפת interlock היא אירוע בטיחות בפני עצמו.", href: "knowledge/machine-guarding.html", exam: true }
  ];

  const lastLessonUpdate = {
    updatedAt: "26.5.2026",
    title: "מערכת ידע מחוברת לשיעורים",
    summary: "נוספה שכבת ניווט שמחברת שיעורים לעמודי ידע, רגולציה, תרגול וכלי שטח.",
    placeholder: "סיכום שיעור אחרון יעודכן כאן לאחר העלאה.",
    links: [
      { label: "מרכז הידע", href: "pages/master-hub.html" },
      { label: "מילון מונחים", href: "pages/glossary.html" },
      { label: "תרגול ומבחנים", href: "pages/quizzes.html" }
    ]
  };

  window.CourseKnowledgeMap = { lessons, knowledgePages, glossaryTerms, lastLessonUpdate };
})();

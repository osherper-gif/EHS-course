(function () {
  "use strict";

  const stages = [
    {
      id: "stage-01",
      title: "שלב 1 — מושגי יסוד בבטיחות",
      description: "שפה מקצועית משותפת: סיכון, מפגע, בקרה, אחריות, תקרית וכמעט ונפגע.",
      status: "סיכום זמין",
      lesson: "lesson-01.html",
      prep: "",
      summary: "lesson-01.html",
      knowledge: ["knowledge/human-factors.html", "knowledge/labor-inspection-law.html"],
      practice: "exam-questions.html?lesson=lesson-01",
      checklists: "checklists.html",
      glossary: "glossary.html"
    },
    {
      id: "stage-02",
      title: "שלב 2 — בעלי תפקידים במערך הבטיחות",
      description: "תופש המפעל, ממונה בטיחות, ועדת בטיחות, נאמני בטיחות, מנהלים ועובדים.",
      status: "סיכום זמין",
      lesson: "lesson-02.html",
      prep: "",
      summary: "lesson-02.html",
      knowledge: ["knowledge/human-factors.html", "knowledge/iso-45001.html"],
      practice: "exam-questions.html?lesson=lesson-02",
      checklists: "checklists.html",
      glossary: "glossary.html"
    },
    {
      id: "stage-03",
      title: "שלב 3 — חוק ארגון הפיקוח ופקודת הבטיחות",
      description: "היררכיית הדין, סמכויות פיקוח, צווים, תסקירים, מכונות וציוד הרמה.",
      status: "זמין",
      lesson: "lesson-05.html",
      prep: "",
      summary: "lesson-05.html",
      knowledge: ["knowledge/labor-inspection-law.html", "knowledge/safety-ordinance.html"],
      practice: "exam-questions.html?lesson=lesson-05",
      checklists: "checklists.html",
      glossary: "glossary.html"
    },
    {
      id: "stage-04",
      title: "שלב 4 — הערכות למצבי חירום",
      description: "תרחישי חירום, פינוי, ציוד, תפקידים, תקשורת, תרגול והפקת לקחים.",
      status: "זמין",
      lesson: "lesson-06.html",
      prep: "",
      summary: "lesson-06.html",
      knowledge: ["knowledge/emergency-preparedness.html", "knowledge/emergency-management.html"],
      practice: "exam-questions.html?lesson=lesson-06",
      checklists: "checklists.html",
      glossary: "glossary.html"
    },
    {
      id: "stage-05",
      title: "שלב 5 — אחריות משפטית ותפקיד ממונה בטיחות",
      description: "הפרדה בין ייעוץ מקצועי, אחריות ניהולית, אכיפה, תיעוד ודיווח.",
      status: "זמין",
      lesson: "lesson-07.html",
      prep: "",
      summary: "lesson-07.html",
      knowledge: ["knowledge/iso-45001.html", "knowledge/process-safety.html"],
      practice: "exam-questions.html?lesson=lesson-07",
      checklists: "checklists.html",
      glossary: "glossary.html"
    },
    {
      id: "stage-06",
      title: "שלב 6 — ארגון מערך הבטיחות במפעל וניהולו",
      description: "מבנה מערך בטיחות, KPI, PDCA, Just Culture, Operational Drift וניהול שיפור מתמיד.",
      status: "הכנה זמינה",
      lesson: "lesson-08.html",
      prep: "prep/lesson-08-safety-organization.html",
      summary: "lesson-08.html",
      knowledge: ["knowledge/iso-45001.html", "knowledge/human-factors.html", "knowledge/process-safety.html"],
      practice: "prep/lesson-08-safety-organization.html#prepQuestions",
      checklists: "checklists.html",
      glossary: "glossary.html"
    },
    {
      id: "stage-07",
      title: "שלב 7 — סיכונים תפעוליים, חשמל ותחזוקה",
      description: "חשמל, LOTO/PTW, מיגון מכונות, עבודה חמה, שינוי תהליך ואנרגיה אגורה.",
      status: "זמין",
      lesson: "lesson-11.html",
      prep: "",
      summary: "lesson-11.html",
      knowledge: ["knowledge/electrical-safety.html", "knowledge/loto-ptw.html", "knowledge/machine-guarding.html"],
      practice: "exam-questions.html?lesson=lesson-11",
      checklists: "checklists.html",
      glossary: "glossary.html"
    },
    {
      id: "stage-08",
      title: "שלב 8 — בנייה, עבודה בגובה והרמה",
      description: "פיגומים, חפירות, עגורנים, רתמות, חילוץ, SWL ותסקירי בדיקה.",
      status: "זמין",
      lesson: "lesson-03.html",
      prep: "",
      summary: "lesson-03.html",
      knowledge: ["knowledge/construction-safety.html", "knowledge/work-at-height.html", "knowledge/lifting-and-cranes.html"],
      practice: "exam-questions.html?lesson=lesson-03",
      checklists: "checklists.html",
      glossary: "glossary.html"
    },
    {
      id: "stage-09",
      title: "שלב 9 — גהות, חומרים מסוכנים וחשיפות",
      description: "SDS, ניטור, רעש, חומרים מסוכנים, PPE, אוורור ומעקב רפואי.",
      status: "זמין",
      lesson: "lesson-04.html",
      prep: "",
      summary: "lesson-04.html",
      knowledge: ["knowledge/hazardous-materials.html", "knowledge/occupational-hygiene.html"],
      practice: "exam-questions.html?lesson=lesson-04",
      checklists: "checklists.html",
      glossary: "glossary.html"
    },
    {
      id: "stage-10",
      title: "שלב 10 — חזרה למבחן ויישום בשטח",
      description: "שאלות תרגול, דגשי מבחן, מלכודות נפוצות, checklists ומילון מונחים.",
      status: "בהמשך",
      lesson: "lesson-12.html",
      prep: "",
      summary: "lesson-12.html",
      knowledge: ["master-hub.html", "glossary.html"],
      practice: "exam-questions.html",
      checklists: "checklists.html",
      glossary: "glossary.html"
    }
  ];

  const prepPages = [
    {
      id: "lesson-08-safety-organization",
      title: "ארגון מערך הבטיחות במפעל וניהולו",
      href: "prep/lesson-08-safety-organization.html",
      lesson: "lesson-08.html",
      status: "הכנה זמינה",
      questionCount: 30,
      relatedKnowledge: ["knowledge/iso-45001.html", "knowledge/human-factors.html", "knowledge/process-safety.html"],
      relatedChecklists: ["checklists.html"],
      relatedGlossary: "glossary.html"
    }
  ];

  const note = "מסלול הלימוד מבוסס על תוכנית הלימוד שנמסרה במסגרת קורס ממונה בטיחות בבאר הדרכות / המכללה לבטיחות, ניהול וסביבה. ייתכנו שינויים בין מוסדות ומחזורים שונים.";

  window.CourseLearningPathMap = { stages, prepPages, note };
})();

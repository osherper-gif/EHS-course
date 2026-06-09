(function () {
  "use strict";

  const sourceNote =
    "מסלול הלימוד מבוסס על מסמך הלימודים שנמסר במסגרת קורס ממונה בטיחות בבאר הדרכות / המכללה לבטיחות, ניהול וסביבה. ייתכנו שינויים בין מוסדות ומחזורים שונים.";

  const knowledgeLabels = {
    "human-factors": "הגורם האנושי",
    "iso-45001": "ISO 45001",
    "labor-inspection-law": "חוק ארגון הפיקוח",
    "safety-ordinance": "פקודת הבטיחות",
    "electrical-safety": "חשמל",
    "loto-ptw": "LOTO / PTW",
    "machine-guarding": "מיגון מכונות",
    "risk-survey": "סקר סיכונים",
    "competent-person": "אדם כשיר",
    "jsa": "JSA",
    "hazop": "HAZOP",
    "bowtie": "BowTie",
    "hierarchy-controls": "מדרג הבקרות",
    "construction-safety": "בנייה",
    "work-at-height": "עבודה בגובה",
    "lifting-and-cranes": "ציוד הרמה ועגורנים",
    "hazardous-materials": "חומרים מסוכנים",
    "occupational-hygiene": "גיהות תעסוקתית",
    "emergency-preparedness": "חירום",
    "emergency-management": "ניהול חירום",
    "process-safety": "סיכונים תפעוליים",
    "master-hub": "מרכז הידע",
    "glossary": "מילון מונחים"
};

  const sessions = [
    session(1, "מושגי יסוד בבטיחות", ["labor-inspection-law"], { domain: "יסודות הבטיחות", prepHref: "prep/lesson-01-introduction-safety.html", summary: { status: "available", href: "summaries/lesson-01-summary.html" }, examFocus: true }),
    session(2, "בעיות יסוד במערך הבטיחות הפנימי בארגון", ["human-factors"], { domain: "יסודות הבטיחות", prepHref: "prep/lesson-02-roles-responsibility.html", summary: { status: "available", href: "summaries/lesson-02-summary.html" } }),
    session(3, "אחריות משפטית, תפקידים, סמכויות, קציני בטיחות, נאמן, מבצע, מנהל, יזם, העסקת קבלני כוח אדם, קבלני משנה, אחריות נזיקית ומשפטית", ["labor-inspection-law","safety-ordinance","human-factors"], { domain: "אחריות משפטית ובעלי תפקידים", prepHref: "prep/lesson-03-labor-inspection-law.html", summary: { status: "available", href: "summaries/lesson-03-summary.html" }, examFocus: true }),
    session(4, "חוק ארגון הפיקוח על העבודה, מוסדות הבטיחות", ["labor-inspection-law"], { domain: "חקיקה ורגולציה", prepHref: "prep/lesson-04-safety-ordinance.html", summary: { status: "available", href: "summaries/lesson-04-summary.html" }, examFocus: true }),
    session(5, "תקנות ארגון הפיקוח על העבודה (ממונים על הבטיחות), הוראות לממונה בטיחות", ["labor-inspection-law"], { domain: "חקיקה ורגולציה", prepHref: "prep/lesson-05-safety-committee-trustees.html", summary: { status: "available", href: "summaries/lesson-05-summary.html" }, examFocus: true }),
    session(6, "אחריות משפטית של ממונה בטיחות", ["labor-inspection-law","safety-ordinance"], { domain: "אחריות משפטית ובעלי תפקידים", prepHref: "prep/lesson-06-emergency-preparedness.html", summary: { status: "available", href: "summaries/lesson-06-summary.html" }, examFocus: true }),
    session(7, "תפקיד ממונה בטיחות", ["labor-inspection-law","iso-45001"], { domain: "ממונה בטיחות", prepHref: "prep/lesson-07-legal-responsibility.html", summary: { status: "available", href: "summaries/lesson-07-summary.html" }, examFocus: true }),
    session(8, "ארגון מערך הבטיחות במפעל וניהולו", ["iso-45001","human-factors","labor-inspection-law","safety-ordinance"], { domain: "ניהול בטיחות", prepHref: "prep/lesson-08-safety-organization.html", summary: { status: "available", href: "summaries/lesson-08-summary.html" }, examFocus: true, checklists: ["checklists.html?domain=ISO"] }),
    session(9, "עבודת ממונה בטיחות מול הנהלת הארגון", ["human-factors","iso-45001","labor-inspection-law"], { domain: "ניהול בטיחות", prepHref: "prep/lesson-09-safety-management-leadership.html", summary: { status: "available", href: "summaries/lesson-09-summary.html" }, examFocus: true, checklists: ["checklists.html?domain=ISO","checklists.html?domain=Human%20Factors"] }),
    session(10, "גידור מכונות ופתרונות, הדרכות, סייגים, תפקידים, ממונים, תאונות, תהליכים, מכשירים, תקנים ופתרונות לגידור מכונות", ["machine-guarding","safety-ordinance","loto-ptw"], { domain: "מכונות וגידור", prepHref: "prep/lesson-10-machine-guarding.html", summary: { status: "available", href: "summaries/lesson-10-summary.html" }, examFocus: true, questionCount: 60, practice: "summaries/lesson-10-summary.html#summaryQuestions", lastUpdated: "2026-06-09", checklists: ["checklists.html?domain=Machine%20Guarding","checklists.html?domain=LOTO"] }),
    session(11, "שיטות ריתוך, בטיחות בריתוך, שיטת לפי התהליך", ["process-safety","emergency-preparedness"], { domain: "ריתוך", prepHref: "prep/lesson-11-welding-safety.html", summary: { status: "available", href: "summaries/lesson-11-summary.html" }, examFocus: true, questionCount: 30, practice: "prep/lesson-11-welding-safety.html#prepQuestions", lastUpdated: "2026-06-09", checklists: ["checklists.html?domain=Hot%20Work","checklists.html?domain=Fire"] }),
    session(12, "גידור מכונות, ריתוך, סקרי סיכונים במכונות, מבוא לתהליכי עיבוד שבבי", ["machine-guarding","safety-ordinance","loto-ptw"], { domain: "מכונות וגידור", prepHref: "prep/lesson-11-machine-guarding-risk-surveys-qualified-person.html", examFocus: true, questionCount: 30, practice: "prep/lesson-11-machine-guarding-risk-surveys-qualified-person.html#prepQuestions", lastUpdated: "2026-06-07", checklists: ["checklists.html?domain=Machine%20Guarding","checklists.html?domain=LOTO","checklists.html?domain=Risk%20Assessment"] }),
    session(13, "בטיחות בחשמל: מושגי יסוד בחשמל, חוק החשמל, תקנות הבטיחות בעבודה בחשמל 1994", ["electrical-safety"], { domain: "חשמל", examFocus: true }),
    session(14, "בטיחות בחשמל: מושגי יסוד בחשמל, חוק החשמל, תקנות הבטיחות בעבודה בחשמל 1994", ["electrical-safety"], { domain: "חשמל", examFocus: true }),
    session(15, "בטיחות בחשמל: מושגי יסוד בחשמל, חוק החשמל, תקנות הבטיחות בעבודה בחשמל 1994", ["electrical-safety"], { domain: "חשמל", examFocus: true }),
    session(16, "בטיחות אש", ["emergency-preparedness","hazardous-materials"], { domain: "אש", examFocus: true }),
    session(17, "סדנה בבטיחות אש במקום מוקף", ["emergency-preparedness","hazardous-materials"], { domain: "אש" }),
    session(18, "מכונות הרמה ואביזרי הרמה", ["lifting-and-cranes","safety-ordinance"], { domain: "ציוד הרמה", examFocus: true }),
    session(19, "דודי קיטור", ["safety-ordinance","process-safety"], { domain: "דודי קיטור", examFocus: true }),
    session(20, "מכונות ואביזרי הרמה, מנופים עיליים ועגורנים", ["lifting-and-cranes","construction-safety"], { domain: "ציוד הרמה", examFocus: true }),
    session(21, "חומרים מסוכנים: חקיקה, אחסון ושינוע חומרים במפעל, זיהוי חומרים מסוכנים", ["hazardous-materials"], { domain: "חומרים מסוכנים", examFocus: true }),
    session(22, "בטיחות בשימוש בדלקים", ["hazardous-materials","emergency-preparedness"], { domain: "חומרים מסוכנים", examFocus: true }),
    session(23, "בטיחות והובלת חומרים מסוכנים בכבישים", ["hazardous-materials"], { domain: "חומרים מסוכנים", examFocus: true }),
    session(24, "גיהות תעסוקתית: חשיפה, רעש, ויברציות, סיכונים ביולוגיים, חומרים מסרטנים, מזהמים ותקני חשיפה, בקרה ומניעה", ["occupational-hygiene","hazardous-materials"], { domain: "גיהות תעסוקתית", examFocus: true }),
    session(25, "גיהות תעסוקתית: חשיפה תעסוקתית, חשיפה לחומרים מסוכנים, חומרים מסרטנים, מזהמים ותקני חשיפה, בקרה ומניעה", ["occupational-hygiene","hazardous-materials"], { domain: "גיהות תעסוקתית", examFocus: true }),
    session(26, "גורמי סיכון ביולוגיים", ["occupational-hygiene"], { domain: "גיהות תעסוקתית" }),
    session(27, "עבודה בתנאי חום וקור, תאורה מלאכותית, תאורה ואוורור", ["occupational-hygiene"], { domain: "גיהות תעסוקתית" }),
    session(28, "רעש, הגנת השמיעה, היבט פיזיולוגי ורפואי", ["occupational-hygiene"], { domain: "גיהות תעסוקתית", examFocus: true }),
    session(29, "דרכי בדיקה והערכת סיכונים בעבודה ובטיחות תעסוקתית, הערכת סיכונים בעבודת כפיים, בטיחות כימית, גורמי סיכון פסיכולוגיים ובטיחות בעבודה", ["occupational-hygiene","human-factors"], { domain: "גיהות תעסוקתית", examFocus: true }),
    session(30, "מבוא לרפואה תעסוקתית", ["occupational-hygiene"], { domain: "רפואה תעסוקתית" }),
    session(31, "מבוא לרפואה תעסוקתית", ["occupational-hygiene"], { domain: "רפואה תעסוקתית" }),
    session(32, "תקנות ציוד מגן אישי", ["occupational-hygiene","work-at-height"], { domain: "ציוד מגן אישי", examFocus: true }),
    session(33, "ארגונומיה", ["human-factors","occupational-hygiene"], { domain: "ארגונומיה" }),
    session(34, "עזרה ראשונה", ["emergency-preparedness"], { domain: "עזרה ראשונה" }),
    session(35, "ארגונומיה", ["human-factors","occupational-hygiene"], { domain: "ארגונומיה" }),
    session(36, "עזרה ראשונה", ["emergency-preparedness"], { domain: "עזרה ראשונה" }),
    session(37, "עבודה בגובה", ["work-at-height","construction-safety"], { domain: "עבודה בגובה", examFocus: true }),
    session(38, "עבודות בנייה", ["construction-safety","work-at-height"], { domain: "בנייה", examFocus: true }),
    session(39, "עבודות בנייה", ["construction-safety","work-at-height"], { domain: "בנייה", examFocus: true }),
    session(40, "עבודות בנייה", ["construction-safety","work-at-height"], { domain: "בנייה", examFocus: true }),
    session(41, "עגורני צריח ודרכים", ["construction-safety","lifting-and-cranes"], { domain: "בנייה וציוד הרמה", examFocus: true }),
    session(42, "סיור מקצועי", ["master-hub"], { domain: "סיור מקצועי" }),
    session(43, "חקלאות", ["safety-ordinance","hazardous-materials"], { domain: "חקלאות" }),
    session(44, "סיור מקצועי", ["master-hub"], { domain: "סיור מקצועי" }),
    session(45, "תוכנית לניהול הבטיחות", ["iso-45001","process-safety"], { domain: "תוכנית לניהול הבטיחות", examFocus: true }),
    session(46, "תוכנית לניהול הבטיחות", ["iso-45001","process-safety"], { domain: "תוכנית לניהול הבטיחות", examFocus: true }),
    session(47, "תוכנית לניהול הבטיחות", ["iso-45001","process-safety"], { domain: "תוכנית לניהול הבטיחות", examFocus: true }),
    session(48, "תוכנית לניהול הבטיחות", ["iso-45001","process-safety"], { domain: "תוכנית לניהול הבטיחות", examFocus: true }),
    session(49, "תוכנית לניהול הבטיחות", ["iso-45001","process-safety"], { domain: "תוכנית לניהול הבטיחות", examFocus: true }),
    session(50, "מבחן", ["master-hub"], { domain: "מבחן", examFocus: true }),
    session(51, "תהליך הגשת תאונה או מפגע מקצועי", ["human-factors","process-safety"], { domain: "חקירת תאונות ודיווח", examFocus: true }),
    session(52, "הגורם האנושי", ["human-factors"], { domain: "הגורם האנושי", examFocus: true }),
    session(53, "התנהגות בטיחותית וגורמי גמר", ["human-factors"], { domain: "הגורם האנושי", examFocus: true }),
    session(54, "התחקיר עבודות גמר", ["master-hub"], { domain: "עבודת גמר" }),
    session(55, "התחקיר עבודות גמר", ["master-hub"], { domain: "עבודת גמר" }),
    session(56, "התחקיר עבודות גמר", ["master-hub"], { domain: "עבודת גמר" }),
    session(57, "התחקיר עבודות גמר", ["master-hub"], { domain: "עבודת גמר" }),
    session(58, "מבחן גמר", ["master-hub"], { domain: "מבחן גמר", examFocus: true })
  ];

  const summaryPages = [
    summaryShell(1, "מושגי יסוד בבטיחות וסיכון", ["human-factors", "labor-inspection-law"], { available: true }),
    summaryShell(2, "בעלי תפקידים, אחריות וסמכות", ["human-factors", "iso-45001"], { available: true }),
    summaryShell(3, sessions[2].title, sessions[2].relatedKnowledge, { available: true }),
    summaryShell(4, sessions[3].title, sessions[3].relatedKnowledge, { available: true }),
    summaryShell(5, sessions[4].title, sessions[4].relatedKnowledge, { available: true }),
    summaryShell(6, sessions[5].title, sessions[5].relatedKnowledge, { available: true }),
    summaryShell(7, sessions[6].title, sessions[6].relatedKnowledge, { available: true }),
    summaryShell(8, "ארגון מערך הבטיחות במפעל וניהולו", ["iso-45001", "human-factors", "labor-inspection-law", "safety-ordinance"], { available: true }),
    summaryShell(9, sessions[8].title, sessions[8].relatedKnowledge, { available: true }),
    summaryShell(10, sessions[9].title, sessions[9].relatedKnowledge, { available: true }),
    summaryShell(11, sessions[10].title, sessions[10].relatedKnowledge, { available: true })
  ];

  const prepPages = sessions
    .filter((item) => item.prep.status === "available")
    .map((item) => ({
      "id": item.id,
      "number": item.number,
      "title": item.title,
      "href": item.prep.href,
      "status": item.prep.label,
      questionCount: item.prep.questionCount || (item.id === "session-08" ? 30 : 0),
      relatedKnowledge: item.relatedKnowledge,
      relatedChecklists: item.relatedChecklists,
      lastUpdated: item.lastUpdated
    }));

  const summaries = summaryPages;

  function session(number, title, relatedKnowledge, options) {
    const settings = options || {};
    const hasPrep = Boolean(settings.prepHref);
    const hasSummary = settings.summary && settings.summary.status === "available";

    return {
      "id": `session-${String(number).padStart(2, "0")}`,
      "number": String(number),
      title,
      "prep": {
        "status": hasPrep ? "available" : "missing",
        "label": hasPrep ? "קיים" : "טרם קיים",
        "href": hasPrep ? settings.prepHref : "",
        questionCount: settings.questionCount || 0
      },
      "summary": {
        "status": hasSummary ? "available" : "missing",
        "label": hasSummary ? "קיים" : "טרם קיים",
        "href": hasSummary ? settings.summary.href : ""
      },
      relatedKnowledge: relatedKnowledge || [],
      domain: settings.domain || "",
      relatedChecklists: settings.checklists || ["checklists.html"],
      "practice": settings.practice || (number <= 12 ? `exam-questions.html?lesson=lesson-${String(number).padStart(2, "0")}` : "exam-questions.html"),
      examFocus: settings.examFocus === true,
      "status": hasPrep || hasSummary ? "עודכן" : settings.examFocus ? "נושא מבחן" : "בהמשך",
      lastUpdated: settings.lastUpdated || (hasPrep || hasSummary ? "2026-05-26" : "")
    };
  }

  function summaryShell(number, title, relatedKnowledge, options) {
    const settings = options || {};
    const isAvailable = settings.available === true;
    const padded = String(number).padStart(2, "0");
    return {
      "id": `lesson-${padded}-summary`,
      "number": String(number),
      title,
      "href": `summaries/lesson-${padded}-summary.html`,
      "status": isAvailable ? "available" : "placeholder",
      "label": isAvailable ? "קיים" : "מעטפת קיימת",
      summaryAvailable: isAvailable,
      lastUpdated: "2026-05-26",
      relatedKnowledge: relatedKnowledge || [],
      relatedChecklists: ["checklists.html"],
      relatedLaws: ["laws.html", "standards.html"]
    };
  }

  window.CourseLearningPathMap = {
    sessions,
    prepPages,
    summaryPages,
    summaries,
    knowledgeLabels,
    "note": sourceNote
  };
})();

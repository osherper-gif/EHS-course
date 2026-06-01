(function () {
  "use strict";

  const sourceNote =
    "מסלול הלימוד מבוסס על מסמך הלימודים שנמסר במסגרת קורס ממונה בטיחות בבאר הדרכות / המכללה לבטיחות, ניהול וסביבה. ייתכנו שינויים בין מוסדות ומחזורים שונים.";

  const knowledgeLabels = {
    "human-factors": "גורם אנושי",
    "iso-45001": "ISO 45001",
    "labor-inspection-law": "חוק ארגון הפיקוח",
    "safety-ordinance": "פקודת הבטיחות",
    "electrical-safety": "חשמל",
    "loto-ptw": "LOTO / PTW",
    "machine-guarding": "מיגון מכונות",
    "construction-safety": "בטיחות בבנייה",
    "work-at-height": "עבודה בגובה",
    "lifting-and-cranes": "הרמה ועגורנים",
    "hazardous-materials": "חומרים מסוכנים",
    "occupational-hygiene": "גהות תעסוקתית",
    "emergency-preparedness": "היערכות לחירום",
    "emergency-management": "ניהול חירום",
    "process-safety": "בטיחות תהליך"
  };

  const sessions = [
    session(1, "מושגי יסוד בבטיחות וסיכון", ["human-factors", "labor-inspection-law"], {
        examFocus: true,
        prepHref: "prep/lesson-01-introduction-safety.html",
        summary: {
          status: "available",
          href: "summaries/lesson-01-summary.html"
        }
      }),
    session(2, "בעלי תפקידים, אחריות וסמכות", ["human-factors", "iso-45001"], {
        examFocus: true,
        prepHref: "prep/lesson-02-roles-responsibility.html",
        summary: {
          status: "available",
          href: "summaries/lesson-02-summary.html"
        }
      }),
    session(3, "חוק ארגון הפיקוח על העבודה", ["labor-inspection-law"], {
        examFocus: true,
        prepHref: "prep/lesson-03-labor-inspection-law.html",
        summary: {
          status: "available",
          href: "summaries/lesson-03-summary.html"
        }
      }),
    session(4, "פקודת הבטיחות בעבודה ומבנה החובות", ["safety-ordinance", "labor-inspection-law"], {
        examFocus: true,
        prepHref: "prep/lesson-04-safety-ordinance.html",
        summary: {
          status: "available",
          href: "summaries/lesson-04-summary.html"
        }
      }),
    session(5, "ועדת בטיחות, נאמני בטיחות וארגון פנימי", ["labor-inspection-law", "human-factors"], {
        examFocus: true,
        prepHref: "prep/lesson-05-safety-committee-trustees.html",
        summary: {
          status: "available",
          href: "summaries/lesson-05-summary.html"
        }
      }),
    session(6, "היערכות למצבי חירום ותרגול", ["emergency-preparedness", "emergency-management"], {
        prepHref: "prep/lesson-06-emergency-preparedness.html",
        summary: {
          status: "available",
          href: "summaries/lesson-06-summary.html"
        }
      }),
    session(7, "אחריות משפטית ותפקיד ממונה בטיחות", ["labor-inspection-law", "safety-ordinance", "iso-45001"], {
        examFocus: true,
        prepHref: "prep/lesson-07-legal-responsibility.html",
        summary: {
          status: "available",
          href: "summaries/lesson-07-summary.html"
        }
      }),
    session(8, "ארגון מערך הבטיחות במפעל וניהולו", ["iso-45001", "human-factors", "labor-inspection-law", "safety-ordinance"], {
      prepHref: "prep/lesson-08-safety-organization.html",
      summary: {
        status: "available",
        href: "summaries/lesson-08-summary.html"
      },
      examFocus: true,
      checklists: ["checklists.html?domain=ISO"]
    }),
    session(9, "עבודת ממונה בטיחות מול הנהלת הארגון", ["human-factors", "iso-45001", "labor-inspection-law"], {
      prepHref: "prep/lesson-09-safety-management-leadership.html",
      summary: {
        status: "available",
        href: "summaries/lesson-09-summary.html"
      },
      examFocus: true,
      checklists: ["checklists.html?domain=ISO", "checklists.html?domain=Human%20Factors"]
    }),
    session(10, "גידור מכונות ופתרונות", ["machine-guarding", "safety-ordinance", "loto-ptw"], {
      prepHref: "prep/lesson-10-machine-guarding.html",
      examFocus: true,
      checklists: ["checklists.html?domain=Machine%20Guarding", "checklists.html?domain=LOTO"]
    }),
    session(11, "תרבות בטיחות, Just Culture וגורם אנושי", ["human-factors", "iso-45001"], { examFocus: true }),
    session(12, "חזרה מבנית ודגשי מבחן ראשונים", ["human-factors", "labor-inspection-law", "iso-45001"], { examFocus: true }),
    session(13, "חשמל: מושגים, סיכונים ומנגנוני הגנה", ["electrical-safety"], { examFocus: true }),
    session(14, "חשמל: הארקה, מפסק מגן ובדיקות", ["electrical-safety"], { examFocus: true }),
    session(15, "LOTO: בידוד אנרגיה ואימות אפס אנרגיה", ["loto-ptw", "electrical-safety"], { examFocus: true }),
    session(16, "היתרי עבודה, עבודה חמה ו-SIMOPS", ["loto-ptw", "process-safety"], { examFocus: true }),
    session(17, "מיגון מכונות ונקודות תפיסה", ["machine-guarding", "safety-ordinance"], { examFocus: true }),
    session(18, "תחזוקה בטוחה ואנרגיה אגורה", ["loto-ptw", "machine-guarding"], {}),
    session(19, "בטיחות באתרי בנייה: מבנה, אחריות וסדר עבודה", ["construction-safety"], { examFocus: true }),
    session(20, "פיגומים, משטחי עבודה ומבנים זמניים", ["construction-safety", "work-at-height"], { examFocus: true }),
    session(21, "חפירות, קריסת קרקע ותמיכות", ["construction-safety"], { examFocus: true }),
    session(22, "עבודה בגובה: היררכיית בקרות וציוד", ["work-at-height"], { examFocus: true }),
    session(23, "עבודה בגובה: עיגון, רתמות וחילוץ", ["work-at-height", "emergency-preparedness"], { examFocus: true }),
    session(24, "ציוד הרמה, אביזרי הרמה ו-SWL", ["lifting-and-cranes", "safety-ordinance"], { examFocus: true }),
    session(25, "עגורנים, רדיוס עבודה והרמות קריטיות", ["lifting-and-cranes", "construction-safety"], { examFocus: true }),
    session(26, "מלגזות, תנועה באתר וממשקי אדם-מכונה", ["lifting-and-cranes", "human-factors"], {}),
    session(27, "חומרים מסוכנים: SDS, סימון ואי-תאימות", ["hazardous-materials"], { examFocus: true }),
    session(28, "חומרים מסוכנים: דליקים, רעילים ואוורור", ["hazardous-materials", "occupational-hygiene"], { examFocus: true }),
    session(29, "תגובה לדליפה, אחסון והפרדה", ["hazardous-materials", "emergency-management"], {}),
    session(30, "גהות תעסוקתית: חשיפה וניטור", ["occupational-hygiene"], { examFocus: true }),
    session(31, "רעש מזיק, בדיקות רפואיות ו-PPE", ["occupational-hygiene"], { examFocus: true }),
    session(32, "גורמי סיכון פיזיקליים וסביבת עבודה", ["occupational-hygiene"], {}),
    session(33, "אש וכיבוי: מניעה, גילוי ותגובה", ["emergency-preparedness", "hazardous-materials"], { examFocus: true }),
    session(34, "תוכנית חירום, פינוי ותפקידים", ["emergency-preparedness", "emergency-management"], { examFocus: true }),
    session(35, "ניהול אירוע, תקשורת ותחקיר לאחר אירוע", ["emergency-management", "human-factors"], {}),
    session(36, "ISO 45001: הקשר הארגון ומנהיגות", ["iso-45001"], { examFocus: true }),
    session(37, "ISO 45001: תכנון, סיכונים והזדמנויות", ["iso-45001", "process-safety"], { examFocus: true }),
    session(38, "ISO 45001: תמיכה, תפעול ובקרת שינוי", ["iso-45001", "loto-ptw"], {}),
    session(39, "ISO 45001: הערכת ביצועים ושיפור", ["iso-45001"], {}),
    session(40, "בטיחות תהליך: barriers, bowtie וסטיות", ["process-safety"], { examFocus: true }),
    session(41, "MOC, RCA ו-Swiss Cheese", ["process-safety", "human-factors"], { examFocus: true }),
    session(42, "קבלנים, תיאום עבודות ו-Permit to Work", ["loto-ptw", "human-factors"], {}),
    session(43, "ציוד מגן אישי: התאמה, מגבלות ובקרה", ["occupational-hygiene", "work-at-height"], { examFocus: true }),
    session(44, "חלל מוקף: סיכונים, ניטור וחילוץ", ["hazardous-materials", "emergency-preparedness"], { examFocus: true }),
    session(45, "עבודה חמה, אש ואווירה נפיצה", ["loto-ptw", "hazardous-materials"], { examFocus: true }),
    session(46, "דודי קיטור, לחץ ובדיקות תקופתיות", ["safety-ordinance", "process-safety"], { examFocus: true }),
    session(47, "בדיקות תקופתיות ותסקירי בודק מוסמך", ["safety-ordinance", "lifting-and-cranes"], { examFocus: true }),
    session(48, "מסירת מידע, הדרכת עובדים ותיעוד", ["labor-inspection-law", "human-factors"], { examFocus: true }),
    session(49, "תחקור תאונות וכמעט תאונות", ["human-factors", "process-safety"], {}),
    session(50, "מדדי בטיחות, KPIs ודוחות הנהלה", ["iso-45001", "human-factors"], {}),
    session(51, "ביקורת פנימית, סיורי בטיחות ואכיפה", ["iso-45001", "labor-inspection-law"], {}),
    session(52, "סיכונים תפעוליים במפעל", ["process-safety", "machine-guarding"], {}),
    session(53, "בטיחות בעבודת אחזקה", ["loto-ptw", "machine-guarding"], { examFocus: true }),
    session(54, "ניהול שינוי וממשקים בין עבודות", ["process-safety", "loto-ptw"], {}),
    session(55, "חזרה רגולטורית: צווים, סמכויות ותיעוד", ["labor-inspection-law", "safety-ordinance"], { examFocus: true }),
    session(56, "חזרה הנדסית: חשמל, מכונות והרמה", ["electrical-safety", "machine-guarding", "lifting-and-cranes"], { examFocus: true }),
    session(57, "חזרה על חומ\"ס, גהות וחירום", ["hazardous-materials", "occupational-hygiene", "emergency-preparedness"], { examFocus: true }),
    session(58, "תרגול תרחישים משולבים", ["process-safety", "human-factors"], { examFocus: true }),
    session(59, "דגשי מבחן, מלכודות ושאלות רוחב", ["master-hub", "human-factors"], { examFocus: true }),
    session(60, "סיכום מסלול, תרגול מסכם ותוכנית המשך", ["master-hub", "glossary"], { examFocus: true })
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
    summaryShell(9, sessions[8].title, sessions[8].relatedKnowledge, { available: true })
  ];

  const prepPages = sessions
    .filter((item) => item.prep.status === "available")
    .map((item) => ({
      id: item.id,
      number: item.number,
      title: item.title,
      href: item.prep.href,
      status: item.prep.label,
      questionCount: item.id === "session-08" ? 30 : 0,
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
      id: `session-${String(number).padStart(2, "0")}`,
      number: String(number),
      title,
      prep: {
        status: hasPrep ? "available" : "missing",
        label: hasPrep ? "קיים" : "טרם קיים",
        href: hasPrep ? settings.prepHref : ""
      },
      summary: {
        status: hasSummary ? "available" : "missing",
        label: hasSummary ? "קיים" : "טרם קיים",
        href: hasSummary ? settings.summary.href : ""
      },
      relatedKnowledge: relatedKnowledge || [],
      relatedChecklists: settings.checklists || ["checklists.html"],
      practice: settings.practice || (number <= 12 ? `exam-questions.html?lesson=lesson-${String(number).padStart(2, "0")}` : "exam-questions.html"),
      examFocus: settings.examFocus === true,
      status: hasPrep || hasSummary ? "עודכן" : settings.examFocus ? "נושא מבחן" : "בהמשך",
      lastUpdated: hasPrep || hasSummary ? "2026-05-26" : ""
    };
  }

  function summaryShell(number, title, relatedKnowledge, options) {
    const settings = options || {};
    const isAvailable = settings.available === true;
    const padded = String(number).padStart(2, "0");
    return {
      id: `lesson-${padded}-summary`,
      number: String(number),
      title,
      href: `summaries/lesson-${padded}-summary.html`,
      status: isAvailable ? "available" : "placeholder",
      label: isAvailable ? "קיים" : "מעטפת קיימת",
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
    note: sourceNote
  };
})();

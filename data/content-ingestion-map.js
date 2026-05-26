(function () {
  "use strict";

  const lessons = [
    {
      lessonId: "lesson-01",
      sessionNumber: 1,
      title: "יסודות תורת הבטיחות",
      prep: {
        status: "available",
        href: "pages/prep/lesson-01-introduction-safety.html",
        updatedAt: "2026-05-26"
      },
      summary: {
        status: "missing",
        href: "",
        updatedAt: ""
      },
      questions: {
        count: 30,
        href: "pages/prep/lesson-01-introduction-safety.html#prepQuestions"
      },
      relatedKnowledge: [
        "pages/knowledge/human-factors.html",
        "pages/knowledge/iso-45001.html",
        "pages/knowledge/labor-inspection-law.html",
        "pages/knowledge/safety-ordinance.html",
        "pages/knowledge/machine-guarding.html",
        "pages/knowledge/loto-ptw.html"
      ],
      relatedChecklists: [
        "pages/checklists.html?domain=Electrical",
        "pages/checklists.html?domain=LOTO%2FPTW",
        "pages/checklists.html?domain=Contractors",
        "pages/checklists.html?domain=PPE"
      ],
      glossaryTerms: [
        "PDCA",
        "PPE",
        "Near Miss",
        "RCA",
        "TLV",
        "CAPA",
        "LOTO"
      ],
      lastUpdated: "2026-05-26"
    },
    {
      lessonId: "lesson-08",
      sessionNumber: 8,
      title: "ארגון מערך הבטיחות במפעל וניהולו",
      prep: {
        status: "available",
        href: "pages/prep/lesson-08-safety-organization.html",
        updatedAt: "2026-05-26"
      },
      summary: {
        status: "missing",
        href: "",
        updatedAt: ""
      },
      questions: {
        count: 30,
        href: "pages/prep/lesson-08-safety-organization.html#prepQuestions"
      },
      relatedKnowledge: [
        "pages/knowledge/iso-45001.html",
        "pages/knowledge/human-factors.html",
        "pages/knowledge/labor-inspection-law.html",
        "pages/knowledge/safety-ordinance.html"
      ],
      relatedChecklists: [
        "pages/checklists.html?domain=ISO",
        "pages/checklists.html?domain=Human%20Factors"
      ],
      glossaryTerms: [
        "PDCA",
        "Just Culture",
        "KPI",
        "Operational Drift"
      ],
      lastUpdated: "2026-05-26"
    }
  ];

  const latestUpdate = {
    type: "prep",
    typeLabel: "הכנה",
    lessonId: "lesson-01",
    sessionNumber: 1,
    title: "נוספה הכנה לשיעור 1 — יסודות תורת הבטיחות",
    description: "נוספה הכנה מובנית עם תקציר, דגשי מבחן, מושגי יסוד, LOTO, Near Miss ו-30 שאלות אינטראקטיביות.",
    href: "pages/prep/lesson-01-introduction-safety.html",
    updatedAt: "2026-05-26"
  };

  window.CourseContentIngestionMap = {
    version: "phase-7",
    updatedAt: "2026-05-26",
    lessons,
    prepPages: lessons.filter((item) => item.prep.status === "available").map((item) => ({
      lessonId: item.lessonId,
      sessionNumber: item.sessionNumber,
      title: item.title,
      href: item.prep.href,
      updatedAt: item.prep.updatedAt,
      questionCount: item.questions.count
    })),
    summaryPages: lessons.filter((item) => item.summary.status === "available").map((item) => ({
      lessonId: item.lessonId,
      sessionNumber: item.sessionNumber,
      title: item.title,
      href: item.summary.href,
      updatedAt: item.summary.updatedAt
    })),
    lessonUpdates: [
      latestUpdate
    ],
    glossaryAdditions: [
      { term: "PDCA", category: "ניהול בטיחות", lessonId: "lesson-01", href: "pages/glossary.html" },
      { term: "PPE", category: "בקרות סיכונים", lessonId: "lesson-01", href: "pages/glossary.html" },
      { term: "Near Miss", category: "דיווח ולמידה", lessonId: "lesson-01", href: "pages/glossary.html" },
      { term: "RCA", category: "חקירת אירועים", lessonId: "lesson-01", href: "pages/glossary.html" },
      { term: "TLV", category: "גהות", lessonId: "lesson-01", href: "pages/glossary.html" },
      { term: "CAPA", category: "ניהול בטיחות", lessonId: "lesson-01", href: "pages/glossary.html" },
      { term: "LOTO", category: "בקרת אנרגיה", lessonId: "lesson-01", href: "pages/glossary.html" },
      { term: "PDCA", category: "ניהול בטיחות", lessonId: "lesson-08", href: "pages/glossary.html" },
      { term: "Just Culture", category: "גורם אנושי", lessonId: "lesson-08", href: "pages/glossary.html" },
      { term: "Operational Drift", category: "ניהול בטיחות", lessonId: "lesson-08", href: "pages/glossary.html" }
    ],
    checklistAdditions: [
      { title: "בדיקת LOTO בסיסית", category: "LOTO/PTW", lessonId: "lesson-01", href: "pages/checklists.html?domain=LOTO%2FPTW" },
      { title: "בדיקת PPE", category: "PPE", lessonId: "lesson-01", href: "pages/checklists.html?domain=PPE" },
      { title: "ניהול קבלנים", category: "Contractors", lessonId: "lesson-01", href: "pages/checklists.html?domain=Contractors" },
      { title: "בדיקת מערך בטיחות", category: "ISO / Management", lessonId: "lesson-08", href: "pages/checklists.html?domain=ISO" }
    ],
    knowledgeLinks: {
      "lesson-01": [
        "pages/knowledge/human-factors.html",
        "pages/knowledge/iso-45001.html",
        "pages/knowledge/labor-inspection-law.html",
        "pages/knowledge/safety-ordinance.html",
        "pages/knowledge/machine-guarding.html",
        "pages/knowledge/loto-ptw.html"
      ],
      "lesson-08": [
        "pages/knowledge/iso-45001.html",
        "pages/knowledge/human-factors.html",
        "pages/knowledge/labor-inspection-law.html",
        "pages/knowledge/safety-ordinance.html"
      ]
    },
    latestUpdate
  };
})();

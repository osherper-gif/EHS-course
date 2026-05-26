(function () {
  "use strict";

  const lessons = [
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
    lessonId: "lesson-08",
    sessionNumber: 8,
    title: "הכנה לשיעור 8: ארגון מערך הבטיחות במפעל וניהולו",
    description: "נוספה הכנה מובנית עם תקציר, דגשי מבחן, שאלות אינטראקטיביות, קישורי ידע ו־checklists.",
    href: "pages/prep/lesson-08-safety-organization.html",
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
      { term: "PDCA", category: "ניהול בטיחות", lessonId: "lesson-08", href: "pages/glossary.html" },
      { term: "Just Culture", category: "גורם אנושי", lessonId: "lesson-08", href: "pages/glossary.html" },
      { term: "Operational Drift", category: "ניהול בטיחות", lessonId: "lesson-08", href: "pages/glossary.html" }
    ],
    checklistAdditions: [
      { title: "בדיקת מערך בטיחות", category: "ISO / Management", lessonId: "lesson-08", href: "pages/checklists.html?domain=ISO" }
    ],
    knowledgeLinks: {
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

(function () {
  "use strict";

  const lessons = [
  {
    "lessonId": "lesson-01",
    "sessionNumber": 1,
    "title": "יסודות תורת הבטיחות",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-01-introduction-safety.html",
      "updatedAt": "2026-05-26"
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-01-summary.html",
      "updatedAt": "2026-05-26"
    },
    "questions": {
      "count": 30,
      "href": "pages/prep/lesson-01-introduction-safety.html#prepQuestions"
    },
    "relatedKnowledge": [
      "pages/knowledge/human-factors.html",
      "pages/knowledge/iso-45001.html",
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/safety-ordinance.html",
      "pages/knowledge/machine-guarding.html",
      "pages/knowledge/loto-ptw.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=Electrical",
      "pages/checklists.html?domain=LOTO%2FPTW",
      "pages/checklists.html?domain=Contractors",
      "pages/checklists.html?domain=PPE"
    ],
    "glossaryTerms": [
      "PDCA",
      "PPE",
      "Near Miss",
      "RCA",
      "TLV",
      "CAPA",
      "LOTO"
    ],
    "lastUpdated": "2026-05-26"
  },
  {
    "lessonId": "lesson-02",
    "sessionNumber": 2,
    "title": "בעלי תפקידים, אחריות וסמכות",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-02-roles-responsibility.html",
      "updatedAt": "2026-05-26"
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-02-summary.html",
      "updatedAt": "2026-05-26"
    },
    "questions": {
      "count": 0,
      "href": ""
    },
    "relatedKnowledge": [
      "pages/knowledge/human-factors.html",
      "pages/knowledge/iso-45001.html",
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/safety-ordinance.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=Human%20Factors",
      "pages/checklists.html?domain=ISO"
    ],
    "glossaryTerms": [
      "אחריות שילוחית",
      "תופש מפעל",
      "ממונה בטיחות",
      "נאמן בטיחות"
    ],
    "lastUpdated": "2026-05-26"
  },
  {
    "lessonId": "lesson-03",
    "sessionNumber": 3,
    "title": "חוק ארגון הפיקוח על העבודה",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-03-labor-inspection-law.html",
      "updatedAt": "2026-05-26"
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-03-summary.html",
      "updatedAt": "2026-05-26"
    },
    "questions": {
      "count": 0,
      "href": ""
    },
    "relatedKnowledge": [
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/human-factors.html",
      "pages/knowledge/safety-ordinance.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=Contractors",
      "pages/checklists.html?domain=ISO"
    ],
    "glossaryTerms": [
      "צו בטיחות",
      "צו שיפור",
      "ועדת בטיחות",
      "נאמן בטיחות"
    ],
    "lastUpdated": "2026-05-26"
  },
  {
    "lessonId": "lesson-04",
    "sessionNumber": 4,
    "title": "פקודת הבטיחות בעבודה ומבנה החובות",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-04-safety-ordinance.html",
      "updatedAt": "2026-05-26"
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-04-summary.html",
      "updatedAt": "2026-05-26"
    },
    "questions": {
      "count": 0,
      "href": ""
    },
    "relatedKnowledge": [
      "pages/knowledge/safety-ordinance.html",
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/machine-guarding.html",
      "pages/knowledge/process-safety.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=Machine%20Safety",
      "pages/checklists.html?domain=Process%20Safety"
    ],
    "glossaryTerms": [
      "פקודת הבטיחות",
      "בודק מוסמך",
      "תסקיר",
      "גידור מכונה"
    ],
    "lastUpdated": "2026-05-26"
  },
  {
    "lessonId": "lesson-05",
    "sessionNumber": 5,
    "title": "ועדת בטיחות, נאמני בטיחות וארגון פנימי",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-05-safety-committee-trustees.html",
      "updatedAt": "2026-05-26"
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-05-summary.html",
      "updatedAt": "2026-05-26"
    },
    "questions": {
      "count": 0,
      "href": ""
    },
    "relatedKnowledge": [
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/human-factors.html",
      "pages/knowledge/iso-45001.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=Human%20Factors",
      "pages/checklists.html?domain=ISO",
      "pages/checklists.html?domain=Contractors"
    ],
    "glossaryTerms": [
      "ועדת בטיחות",
      "נאמן בטיחות",
      "תרבות בטיחות",
      "אכיפה פנימית"
    ],
    "lastUpdated": "2026-05-26"
  },
  {
    "lessonId": "lesson-06",
    "sessionNumber": 6,
    "title": "היערכות למצבי חירום ותרגול",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-06-emergency-preparedness.html",
      "updatedAt": "2026-05-26"
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-06-summary.html",
      "updatedAt": "2026-05-26"
    },
    "questions": {
      "count": 30,
      "href": "pages/prep/lesson-06-emergency-preparedness.html#prepQuestions"
    },
    "relatedKnowledge": [
      "pages/knowledge/emergency-preparedness.html",
      "pages/knowledge/emergency-management.html",
      "pages/knowledge/hazardous-materials.html",
      "pages/knowledge/human-factors.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=Emergency",
      "pages/checklists.html?domain=Fire%20Safety",
      "pages/checklists.html?domain=Hazmat"
    ],
    "glossaryTerms": [
      "ERP",
      "פינוי",
      "תרגיל חירום",
      "Incident Command"
    ],
    "lastUpdated": "2026-05-26"
  },
  {
    "lessonId": "lesson-07",
    "sessionNumber": 7,
    "title": "אחריות משפטית ותפקיד ממונה בטיחות",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-07-legal-responsibility.html",
      "updatedAt": "2026-05-26"
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-07-summary.html",
      "updatedAt": "2026-05-26"
    },
    "questions": {
      "count": 30,
      "href": "pages/prep/lesson-07-legal-responsibility.html#prepQuestions"
    },
    "relatedKnowledge": [
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/safety-ordinance.html",
      "pages/knowledge/iso-45001.html",
      "pages/knowledge/human-factors.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=ISO",
      "pages/checklists.html?domain=Contractors",
      "pages/checklists.html?domain=PPE"
    ],
    "glossaryTerms": [
      "אחריות פלילית",
      "רשלנות",
      "חובת זהירות",
      "ממונה בטיחות"
    ],
    "lastUpdated": "2026-05-26"
  },
  {
    "lessonId": "lesson-08",
    "sessionNumber": 8,
    "title": "ארגון מערך הבטיחות במפעל וניהולו",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-08-safety-organization.html",
      "updatedAt": "2026-05-26"
    },
    "summary": {
      "status": "missing",
      "href": "",
      "updatedAt": ""
    },
    "questions": {
      "count": 30,
      "href": "pages/prep/lesson-08-safety-organization.html#prepQuestions"
    },
    "relatedKnowledge": [
      "pages/knowledge/iso-45001.html",
      "pages/knowledge/human-factors.html",
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/safety-ordinance.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=ISO",
      "pages/checklists.html?domain=Human%20Factors"
    ],
    "glossaryTerms": [
      "PDCA",
      "Just Culture",
      "KPI",
      "Operational Drift"
    ],
    "lastUpdated": "2026-05-26"
  }
];

  const latestUpdate = {
  "type": "summary",
  "typeLabel": "סיכום",
  "lessonId": "lesson-01",
  "sessionNumber": 1,
  "title": "נוסף סיכום שיעור 1 — יסודות תורת הבטיחות",
  "description": "סיכום שיעור 1 הוחלף בעמוד curated עם דגשי מרצה, מלכודות מבחן, קשר חוק/תקנה/יישום, דוגמאות שטח וקישורי המשך.",
  "href": "pages/summaries/lesson-01-summary.html",
  "updatedAt": "2026-05-26"
};

  window.CourseContentIngestionMap = {
    version: "phase-7-bulk-lessons-1-7",
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
      updatedAt: item.summary.updatedAt,
      summaryAvailable: true,
      label: "קיים"
    })),
    lessonUpdates: [latestUpdate],
    glossaryAdditions: lessons.flatMap((item) => item.glossaryTerms.map((term) => ({ term, category: "מסלול לימוד", lessonId: item.lessonId, href: "pages/glossary.html" }))),
    checklistAdditions: lessons.flatMap((item) => item.relatedChecklists.map((href) => ({ title: "Checklist קשור", category: "Operational", lessonId: item.lessonId, href }))),
    knowledgeLinks: Object.fromEntries(lessons.map((item) => [item.lessonId, item.relatedKnowledge])),
    latestUpdate
  };
})();

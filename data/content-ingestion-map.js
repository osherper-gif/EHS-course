(function () {
  "use strict";

  const COURSE_ID = "safety-officer";
  const DOMAIN_ID = "safety";
  const withCourseScope = (entity) => Object.assign(entity, {
    courseId: entity.courseId || COURSE_ID,
    domainId: entity.domainId || DOMAIN_ID
  });

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
      "updatedAt": "2026-05-26",
      "questionCount": 72
    },
    "questions": {
      "count": 72,
      "href": "pages/summaries/lesson-01-summary.html#summaryQuestions"
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
    "title": "ארגון מערך הבטיחות, פיקוח ואחריות",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-02-roles-responsibility.html",
      "updatedAt": "2026-05-26"
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-02-summary.html",
      "updatedAt": "2026-05-27",
      "questionCount": 65
    },
    "questions": {
      "count": 65,
      "href": "pages/summaries/lesson-02-summary.html#summaryQuestions"
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
      "חוק",
      "פקודה",
      "צו בטיחות",
      "צו שיפור",
      "אחריות פלילית",
      "אחריות אזרחית",
      "ממונה בטיחות",
      "נאמן בטיחות",
      "קשר סיבתי"
    ],
    "lastUpdated": "2026-05-27"
  },
  {
    "lessonId": "lesson-03",
    "sessionNumber": 3,
    "title": "גורמים במערך הבטיחות ואחריות תפעולית",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-03-labor-inspection-law.html",
      "updatedAt": "2026-05-26"
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-03-summary.html",
      "updatedAt": "2026-05-27",
      "questionCount": 60
    },
    "questions": {
      "count": 60,
      "href": "pages/summaries/lesson-03-summary.html#summaryQuestions"
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
      "נאמן בטיחות",
      "ממונה בטיחות",
      "PDCA",
      "Near Miss",
      "RCA",
      "מקרה מסוכן"
    ],
    "lastUpdated": "2026-05-27"
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
      "updatedAt": "2026-05-27",
      "questionCount": 60
    },
    "questions": {
      "count": 60,
      "href": "pages/summaries/lesson-04-summary.html#summaryQuestions"
    },
    "relatedKnowledge": [
      "pages/knowledge/safety-ordinance.html",
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/machine-guarding.html",
      "pages/knowledge/process-safety.html",
      "pages/knowledge/loto-ptw.html",
      "pages/knowledge/work-at-height.html",
      "pages/knowledge/hazardous-materials.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=Machine%20Safety",
      "pages/checklists.html?domain=Process%20Safety",
      "pages/checklists.html?domain=LOTO%2FPTW",
      "pages/checklists.html?domain=Confined%20Space",
      "pages/checklists.html?domain=Fire%20Safety"
    ],
    "glossaryTerms": [
      "פקודת הבטיחות",
      "בודק מוסמך",
      "תסקיר",
      "גידור מכונה"
    ],
    "lastUpdated": "2026-05-27"
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
      "updatedAt": "2026-05-27"
    },
    "questions": {
      "count": 60,
      "href": "pages/summaries/lesson-05-summary.html#summaryQuestions"
    },
    "relatedKnowledge": [
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/safety-ordinance.html",
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
    "lastUpdated": "2026-05-27"
  },
  {
    "lessonId": "lesson-06",
    "sessionNumber": 6,
    "title": "מדריך שטח והישרדות משפטית לממונה בטיחות",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-06-emergency-preparedness.html",
      "updatedAt": "2026-05-26"
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-06-summary.html",
      "updatedAt": "2026-05-27",
      "questionCount": 59
    },
    "questions": {
      "count": 59,
      "href": "pages/summaries/lesson-06-summary.html#summaryQuestions"
    },
    "relatedKnowledge": [
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/safety-ordinance.html",
      "pages/knowledge/human-factors.html",
      "pages/knowledge/work-at-height.html",
      "pages/knowledge/construction-safety.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=Contractors",
      "pages/checklists.html?domain=Human%20Factors",
      "pages/checklists.html?domain=PPE"
    ],
    "glossaryTerms": [
      "אחריות סטטוטורית",
      "תופש מפעל",
      "ממונה בטיחות",
      "עצימת עיניים",
      "צו בטיחות",
      "צו שיפור"
    ],
    "lastUpdated": "2026-05-27"
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
      "updatedAt": "2026-05-27",
      "questionCount": 60
    },
    "questions": {
      "count": 60,
      "href": "pages/summaries/lesson-07-summary.html#summaryQuestions"
    },
    "relatedKnowledge": [
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/safety-ordinance.html",
      "pages/knowledge/iso-45001.html",
      "pages/knowledge/human-factors.html",
      "pages/knowledge/loto-ptw.html",
      "pages/knowledge/process-safety.html"
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
    "lastUpdated": "2026-05-27"
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
      "status": "available",
      "href": "pages/summaries/lesson-08-summary.html",
      "updatedAt": "2026-05-31",
      "questionCount": 60
    },
    "questions": {
      "count": 60,
      "href": "pages/summaries/lesson-08-summary.html#summaryQuestions"
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
    "lastUpdated": "2026-05-31"
  },
  {
    "lessonId": "lesson-09",
    "sessionNumber": 9,
    "title": "עבודת ממונה בטיחות מול הנהלת הארגון",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-09-safety-management-leadership.html",
      "updatedAt": "2026-05-31",
      "questionCount": 30
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-09-summary.html",
      "updatedAt": "2026-06-01",
      "questionCount": 60
    },
    "questions": {
      "count": 60,
      "href": "pages/summaries/lesson-09-summary.html#summaryQuestions"
    },
    "relatedKnowledge": [
      "pages/knowledge/human-factors.html",
      "pages/knowledge/iso-45001.html",
      "pages/knowledge/labor-inspection-law.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=ISO",
      "pages/checklists.html?domain=Human%20Factors"
    ],
    "glossaryTerms": [
      "Staff",
      "Line",
      "ROI",
      "Just Culture",
      "Near Miss",
      "Leading Indicators",
      "Lagging Indicators",
      "Safety Leadership"
    ],
    "lastUpdated": "2026-06-01"
  },
  {
    "lessonId": "lesson-10",
    "sessionNumber": 10,
    "title": "גידור מכונות ופתרונות",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-10-machine-guarding.html",
      "updatedAt": "2026-06-01",
      "questionCount": 30
    },
    "summary": {
      "status": "missing",
      "href": "",
      "updatedAt": ""
    },
    "questions": {
      "count": 30,
      "href": "pages/prep/lesson-10-machine-guarding.html#prepQuestions"
    },
    "relatedKnowledge": [
      "pages/knowledge/machine-guarding.html",
      "pages/knowledge/safety-ordinance.html",
      "pages/knowledge/loto-ptw.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=Machine%20Guarding",
      "pages/checklists.html?domain=LOTO"
    ],
    "glossaryTerms": [
      "LOTO",
      "Interlock",
      "Light Curtain",
      "E-Stop",
      "נקודת לכידה"
    ],
    "lastUpdated": "2026-06-01"
  }
];
  lessons.forEach(withCourseScope);

  const latestUpdate = {
  "type": "prep",
  "typeLabel": "הכנה",
  "lessonId": "lesson-10",
  "sessionNumber": 10,
  "title": "נוספה הכנה לשיעור 10 - גידור מכונות ופתרונות כולל 30 שאלות הכנה",
  "description": "יחידת הכנה על סיכוני מכונות, גידור, LOTO, סקר סיכונים, טעויות שטח ודגשי מבחן.",
  "href": "pages/prep/lesson-10-machine-guarding.html",
  "updatedAt": "2026-06-01"
};
  withCourseScope(latestUpdate);

  window.CourseContentIngestionMap = {
    version: "phase-7-bulk-lessons-1-7",
    updatedAt: "2026-05-26",
    lessons,
    prepPages: [
  {
    "lessonId": "lesson-01",
    "sessionNumber": 1,
    "title": "יסודות תורת הבטיחות",
    "href": "pages/prep/lesson-01-introduction-safety.html",
    "updatedAt": "2026-05-26",
    "questionCount": 72
  },
  {
    "lessonId": "lesson-02",
    "sessionNumber": 2,
    "title": "ארגון מערך הבטיחות, פיקוח ואחריות",
    "href": "pages/prep/lesson-02-roles-responsibility.html",
    "updatedAt": "2026-05-26",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-03",
    "sessionNumber": 3,
    "title": "גורמים במערך הבטיחות ואחריות תפעולית",
    "href": "pages/prep/lesson-03-labor-inspection-law.html",
    "updatedAt": "2026-05-26",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-04",
    "sessionNumber": 4,
    "title": "פקודת הבטיחות בעבודה ומבנה החובות",
    "href": "pages/prep/lesson-04-safety-ordinance.html",
    "updatedAt": "2026-05-26",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-05",
    "sessionNumber": 5,
    "title": "ועדת בטיחות, נאמני בטיחות וארגון פנימי",
    "href": "pages/prep/lesson-05-safety-committee-trustees.html",
    "updatedAt": "2026-05-26",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-06",
    "sessionNumber": 6,
    "title": "היערכות למצבי חירום ותרגול",
    "href": "pages/prep/lesson-06-emergency-preparedness.html",
    "updatedAt": "2026-05-26",
    "questionCount": 30
  },
  {
    "lessonId": "lesson-07",
    "sessionNumber": 7,
    "title": "אחריות משפטית ותפקיד ממונה בטיחות",
    "href": "pages/prep/lesson-07-legal-responsibility.html",
    "updatedAt": "2026-05-26",
    "questionCount": 30
  },
  {
    "lessonId": "lesson-08",
    "sessionNumber": 8,
    "title": "ארגון מערך הבטיחות במפעל וניהולו",
    "href": "pages/prep/lesson-08-safety-organization.html",
    "updatedAt": "2026-05-26",
    "questionCount": 30
  },
  {
    "lessonId": "lesson-09",
    "sessionNumber": 9,
    "title": "עבודת ממונה בטיחות מול הנהלת הארגון",
    "href": "pages/prep/lesson-09-safety-management-leadership.html",
    "updatedAt": "2026-05-31",
    "questionCount": 30
  },
  {
    "lessonId": "lesson-10",
    "sessionNumber": 10,
    "title": "גידור מכונות ופתרונות",
    "href": "pages/prep/lesson-10-machine-guarding.html",
    "updatedAt": "2026-06-01",
    "questionCount": 30
  }
].map(withCourseScope),
    summaryPages: [
  {
    "lessonId": "lesson-01",
    "sessionNumber": 1,
    "title": "יסודות תורת הבטיחות",
    "href": "pages/summaries/lesson-01-summary.html",
    "updatedAt": "2026-05-26",
    "summaryAvailable": true,
    "label": "קיים"
  },
  {
    "lessonId": "lesson-02",
    "sessionNumber": 2,
    "title": "ארגון מערך הבטיחות, פיקוח ואחריות",
    "href": "pages/summaries/lesson-02-summary.html",
    "updatedAt": "2026-05-27",
    "summaryAvailable": true,
    "label": "קיים",
    "questionCount": 65
  }
,
  {
    "lessonId": "lesson-03",
    "sessionNumber": 3,
    "title": "גורמים במערך הבטיחות ואחריות תפעולית",
    "href": "pages/summaries/lesson-03-summary.html",
    "updatedAt": "2026-05-27",
    "summaryAvailable": true,
    "label": "קיים",
    "questionCount": 60
  },
  {
    "lessonId": "lesson-04",
    "sessionNumber": 4,
    "title": "?????? ???????, ????? ?????????? ???? ???",
    "href": "pages/summaries/lesson-04-summary.html",
    "updatedAt": "2026-05-27",
    "summaryAvailable": true,
    "label": "????",
    "questionCount": 60
  },
  {
    "lessonId": "lesson-05",
    "sessionNumber": 5,
    "title": "\u05de\u05e2\u05d8\u05e4\u05ea \u05de\u05d5\u05e1\u05d3\u05d9\u05ea, \u05e1\u05de\u05db\u05d5\u05d9\u05d5\u05ea \u05e4\u05d9\u05e7\u05d5\u05d7 \u05d5\u05d4\u05d3\u05e8\u05db\u05ea \u05e2\u05d5\u05d1\u05d3\u05d9\u05dd",
    "href": "pages/summaries/lesson-05-summary.html",
    "updatedAt": "2026-05-27",
    "summaryAvailable": true,
    "label": "\u05e7\u05d9\u05d9\u05dd",
    "questionCount": 60
  },
  {
    "lessonId": "lesson-06",
    "sessionNumber": 6,
    "title": "מדריך שטח והישרדות משפטית לממונה בטיחות",
    "href": "pages/summaries/lesson-06-summary.html",
    "updatedAt": "2026-05-27",
    "summaryAvailable": true,
    "label": "קיים",
    "questionCount": 59
  },
  {
    "lessonId": "lesson-07",
    "sessionNumber": 7,
    "title": "תפקיד ממונה הבטיחות, ניהול סיכונים ותיאום קבלנים",
    "href": "pages/summaries/lesson-07-summary.html",
    "updatedAt": "2026-05-27",
    "summaryAvailable": true,
    "label": "קיים",
    "questionCount": 60
  },
  {
    "lessonId": "lesson-08",
    "sessionNumber": 8,
    "title": "ארגון מערך הבטיחות במפעל וניהולו",
    "href": "pages/summaries/lesson-08-summary.html",
    "updatedAt": "2026-05-31",
    "summaryAvailable": true,
    "label": "קיים",
    "questionCount": 60
  },
  {
    "lessonId": "lesson-09",
    "sessionNumber": 9,
    "title": "עבודת ממונה בטיחות מול הנהלת הארגון",
    "href": "pages/summaries/lesson-09-summary.html",
    "updatedAt": "2026-06-01",
    "summaryAvailable": true,
    "label": "קיים",
    "questionCount": 60
  }].map(withCourseScope),
    lessonUpdates: [latestUpdate],
    glossaryAdditions: lessons.flatMap((item) => item.glossaryTerms.map((term) => withCourseScope({ term, category: "????? ?????", lessonId: item.lessonId, href: "pages/glossary.html" }))),
    checklistAdditions: lessons.flatMap((item) => item.relatedChecklists.map((href) => withCourseScope({ title: "Checklist ????", category: "Operational", lessonId: item.lessonId, href }))),
    knowledgeLinks: Object.fromEntries(lessons.map((item) => [item.lessonId, item.relatedKnowledge])),
    latestUpdate
  };
})();

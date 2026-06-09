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
    "title": "מושגי יסוד בבטיחות",
    "domain": "יסודות הבטיחות",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-01-introduction-safety.html",
      "updatedAt": "2026-05-26",
      "questionCount": 0
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-01-summary.html",
      "updatedAt": "2026-05-26",
      "questionCount": 0
    },
    "questions": {
      "count": 0,
      "href": ""
    },
    "relatedKnowledge": [
      "pages/knowledge/labor-inspection-law.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html"
    ],
    "glossaryTerms": [],
    "lastUpdated": "2026-05-26"
  },
  {
    "lessonId": "lesson-02",
    "sessionNumber": 2,
    "title": "בעיות יסוד במערך הבטיחות הפנימי בארגון",
    "domain": "יסודות הבטיחות",
    "prep": {
      "status": "missing",
      "href": "",
      "updatedAt": "",
      "questionCount": 0
    },
    "summary": {
      "status": "missing",
      "href": "",
      "updatedAt": "",
      "questionCount": 0
    },
    "questions": {
      "count": 0,
      "href": ""
    },
    "relatedKnowledge": [
      "pages/knowledge/human-factors.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html"
    ],
    "glossaryTerms": [],
    "lastUpdated": ""
  },
  {
    "lessonId": "lesson-03",
    "sessionNumber": 3,
    "title": "אחריות משפטית, תפקידים, סמכויות, קציני בטיחות, נאמן, מבצע, מנהל, יזם, העסקת קבלני כוח אדם, קבלני משנה, אחריות נזיקית ומשפטית",
    "domain": "אחריות משפטית ובעלי תפקידים",
    "prep": {
      "status": "missing",
      "href": "",
      "updatedAt": "",
      "questionCount": 0
    },
    "summary": {
      "status": "missing",
      "href": "",
      "updatedAt": "",
      "questionCount": 0
    },
    "questions": {
      "count": 0,
      "href": ""
    },
    "relatedKnowledge": [
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/safety-ordinance.html",
      "pages/knowledge/human-factors.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html"
    ],
    "glossaryTerms": [],
    "lastUpdated": ""
  },
  {
    "lessonId": "lesson-04",
    "sessionNumber": 4,
    "title": "חוק ארגון הפיקוח על העבודה, מוסדות הבטיחות",
    "domain": "חקיקה ורגולציה",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-03-labor-inspection-law.html",
      "updatedAt": "2026-05-26",
      "questionCount": 0
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-03-summary.html",
      "updatedAt": "2026-05-26",
      "questionCount": 0
    },
    "questions": {
      "count": 0,
      "href": ""
    },
    "relatedKnowledge": [
      "pages/knowledge/labor-inspection-law.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html"
    ],
    "glossaryTerms": [],
    "lastUpdated": "2026-05-26"
  },
  {
    "lessonId": "lesson-05",
    "sessionNumber": 5,
    "title": "תקנות ארגון הפיקוח על העבודה (ממונים על הבטיחות), הוראות לממונה בטיחות",
    "domain": "חקיקה ורגולציה",
    "prep": {
      "status": "missing",
      "href": "",
      "updatedAt": "",
      "questionCount": 0
    },
    "summary": {
      "status": "missing",
      "href": "",
      "updatedAt": "",
      "questionCount": 0
    },
    "questions": {
      "count": 0,
      "href": ""
    },
    "relatedKnowledge": [
      "pages/knowledge/labor-inspection-law.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html"
    ],
    "glossaryTerms": [],
    "lastUpdated": ""
  },
  {
    "lessonId": "lesson-06",
    "sessionNumber": 6,
    "title": "אחריות משפטית של ממונה בטיחות",
    "domain": "אחריות משפטית ובעלי תפקידים",
    "prep": {
      "status": "missing",
      "href": "",
      "updatedAt": "",
      "questionCount": 0
    },
    "summary": {
      "status": "missing",
      "href": "",
      "updatedAt": "",
      "questionCount": 0
    },
    "questions": {
      "count": 0,
      "href": ""
    },
    "relatedKnowledge": [
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/safety-ordinance.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html"
    ],
    "glossaryTerms": [],
    "lastUpdated": ""
  },
  {
    "lessonId": "lesson-07",
    "sessionNumber": 7,
    "title": "תפקיד ממונה בטיחות",
    "domain": "ממונה בטיחות",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-07-legal-responsibility.html",
      "updatedAt": "2026-05-26",
      "questionCount": 0
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-07-summary.html",
      "updatedAt": "2026-05-26",
      "questionCount": 0
    },
    "questions": {
      "count": 0,
      "href": ""
    },
    "relatedKnowledge": [
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/iso-45001.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html"
    ],
    "glossaryTerms": [],
    "lastUpdated": "2026-05-26"
  },
  {
    "lessonId": "lesson-08",
    "sessionNumber": 8,
    "title": "ארגון מערך הבטיחות במפעל וניהולו",
    "domain": "ניהול בטיחות",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-08-safety-organization.html",
      "updatedAt": "2026-05-26",
      "questionCount": 0
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-08-summary.html",
      "updatedAt": "2026-05-26",
      "questionCount": 0
    },
    "questions": {
      "count": 0,
      "href": ""
    },
    "relatedKnowledge": [
      "pages/knowledge/iso-45001.html",
      "pages/knowledge/human-factors.html",
      "pages/knowledge/labor-inspection-law.html",
      "pages/knowledge/safety-ordinance.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=ISO"
    ],
    "glossaryTerms": [],
    "lastUpdated": "2026-05-26"
  },
  {
    "lessonId": "lesson-09",
    "sessionNumber": 9,
    "title": "עבודת ממונה בטיחות מול הנהלת הארגון",
    "domain": "ניהול בטיחות",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-09-safety-management-leadership.html",
      "updatedAt": "2026-05-26",
      "questionCount": 0
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-09-summary.html",
      "updatedAt": "2026-05-26",
      "questionCount": 0
    },
    "questions": {
      "count": 0,
      "href": ""
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
    "glossaryTerms": [],
    "lastUpdated": "2026-05-26"
  },
  {
    "lessonId": "lesson-10",
    "sessionNumber": 10,
    "title": "גידור מכונות ופתרונות, הדרכות, סייגים, תפקידים, ממונים, תאונות, תהליכים, מכשירים, תקנים ופתרונות לגידור מכונות",
    "domain": "מכונות וגידור",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-10-machine-guarding.html",
      "updatedAt": "2026-05-26",
      "questionCount": 0
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-10-summary.html",
      "updatedAt": "2026-06-09",
      "questionCount": 60
    },
    "questions": {
      "count": 60,
      "href": "pages/summaries/lesson-10-summary.html#summaryQuestions"
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
    "glossaryTerms": [],
    "lastUpdated": "2026-06-09"
  },
  {
    "lessonId": "lesson-11",
    "sessionNumber": 11,
    "title": "שיטות ריתוך, בטיחות בריתוך, שיטת לפי התהליך",
    "domain": "ריתוך",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-11-welding-safety.html",
      "updatedAt": "2026-06-09",
      "questionCount": 30
    },
    "summary": {
      "status": "available",
      "href": "pages/summaries/lesson-11-summary.html",
      "updatedAt": "2026-06-09",
      "questionCount": 60
    },
    "questions": {
      "count": 90,
      "href": "pages/prep/lesson-11-welding-safety.html#prepQuestions"
    },
    "relatedKnowledge": [
      "pages/knowledge/process-safety.html",
      "pages/knowledge/emergency-preparedness.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=Hot%20Work",
      "pages/checklists.html?domain=Fire"
    ],
    "glossaryTerms": [],
    "lastUpdated": "2026-06-09"
  },
  {
    "lessonId": "lesson-12",
    "sessionNumber": 12,
    "title": "גידור מכונות, ריתוך, סקרי סיכונים במכונות, מבוא לתהליכי עיבוד שבבי",
    "domain": "מכונות וגידור",
    "prep": {
      "status": "available",
      "href": "pages/prep/lesson-11-machine-guarding-risk-surveys-qualified-person.html",
      "updatedAt": "2026-06-07",
      "questionCount": 30
    },
    "summary": {
      "status": "missing",
      "href": "",
      "updatedAt": "",
      "questionCount": 0
    },
    "questions": {
      "count": 30,
      "href": "pages/prep/lesson-11-machine-guarding-risk-surveys-qualified-person.html#prepQuestions"
    },
    "relatedKnowledge": [
      "pages/knowledge/machine-guarding.html",
      "pages/knowledge/safety-ordinance.html",
      "pages/knowledge/loto-ptw.html"
    ],
    "relatedChecklists": [
      "pages/checklists.html?domain=Machine%20Guarding",
      "pages/checklists.html?domain=LOTO",
      "pages/checklists.html?domain=Risk%20Assessment"
    ],
    "glossaryTerms": [],
    "lastUpdated": "2026-06-07"
  }
];
  lessons.forEach(withCourseScope);

const latestUpdate = {
  "type": "prep",
  "typeLabel": "הכנה",
  "lessonId": "lesson-12",
  "sessionNumber": 12,
  "title": "נוספה הכנה לשיעור 12 - גידור מכונות, סקרי סיכונים ואדם כשיר כולל 30 שאלות הכנה",
  "description": "יחידת הכנה על גידור מכונות, סקרי סיכונים, LOTO, JSA, HAZOP, BowTie ותפקיד האדם הכשיר.",
  "href": "pages/prep/lesson-11-machine-guarding-risk-surveys-qualified-person.html",
  "updatedAt": "2026-06-07"
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
    "title": "מושגי יסוד בבטיחות",
    "href": "pages/prep/lesson-01-introduction-safety.html",
    "updatedAt": "2026-05-26",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-04",
    "sessionNumber": 4,
    "title": "חוק ארגון הפיקוח על העבודה, מוסדות הבטיחות",
    "href": "pages/prep/lesson-03-labor-inspection-law.html",
    "updatedAt": "2026-05-26",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-07",
    "sessionNumber": 7,
    "title": "תפקיד ממונה בטיחות",
    "href": "pages/prep/lesson-07-legal-responsibility.html",
    "updatedAt": "2026-05-26",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-08",
    "sessionNumber": 8,
    "title": "ארגון מערך הבטיחות במפעל וניהולו",
    "href": "pages/prep/lesson-08-safety-organization.html",
    "updatedAt": "2026-05-26",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-09",
    "sessionNumber": 9,
    "title": "עבודת ממונה בטיחות מול הנהלת הארגון",
    "href": "pages/prep/lesson-09-safety-management-leadership.html",
    "updatedAt": "2026-05-26",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-10",
    "sessionNumber": 10,
    "title": "גידור מכונות ופתרונות, הדרכות, סייגים, תפקידים, ממונים, תאונות, תהליכים, מכשירים, תקנים ופתרונות לגידור מכונות",
    "href": "pages/prep/lesson-10-machine-guarding.html",
    "updatedAt": "2026-05-26",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-11",
    "sessionNumber": 11,
    "title": "????? ?????, ?????? ??????, ???? ??? ??????",
    "href": "pages/prep/lesson-11-welding-safety.html",
    "updatedAt": "2026-06-09",
    "questionCount": 30
  },
  {
    "lessonId": "lesson-12",
    "sessionNumber": 12,
    "title": "גידור מכונות, ריתוך, סקרי סיכונים במכונות, מבוא לתהליכי עיבוד שבבי",
    "href": "pages/prep/lesson-11-machine-guarding-risk-surveys-qualified-person.html",
    "updatedAt": "2026-06-07",
    "questionCount": 30
  }
].map(withCourseScope),
    summaryPages: [
  {
    "lessonId": "lesson-10",
    "sessionNumber": 10,
    "title": "????? ?????? ????????, ??????, ??????, ???????, ??????, ??????, ???????, ???????, ????? ???????? ?????? ??????",
    "href": "pages/summaries/lesson-10-summary.html",
    "updatedAt": "2026-06-09",
    "summaryAvailable": true,
    "label": "????",
    "questionCount": 60
  },
  {
    "lessonId": "lesson-11",
    "sessionNumber": 11,
    "title": "????? ?????, ?????? ??????, ???? ??? ??????",
    "href": "pages/summaries/lesson-11-summary.html",
    "updatedAt": "2026-06-09",
    "summaryAvailable": true,
    "label": "????",
    "questionCount": 60
  },
  {
    "lessonId": "lesson-01",
    "sessionNumber": 1,
    "title": "מושגי יסוד בבטיחות",
    "href": "pages/summaries/lesson-01-summary.html",
    "updatedAt": "2026-05-26",
    "summaryAvailable": true,
    "label": "קיים",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-04",
    "sessionNumber": 4,
    "title": "חוק ארגון הפיקוח על העבודה, מוסדות הבטיחות",
    "href": "pages/summaries/lesson-03-summary.html",
    "updatedAt": "2026-05-26",
    "summaryAvailable": true,
    "label": "קיים",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-07",
    "sessionNumber": 7,
    "title": "תפקיד ממונה בטיחות",
    "href": "pages/summaries/lesson-07-summary.html",
    "updatedAt": "2026-05-26",
    "summaryAvailable": true,
    "label": "קיים",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-08",
    "sessionNumber": 8,
    "title": "ארגון מערך הבטיחות במפעל וניהולו",
    "href": "pages/summaries/lesson-08-summary.html",
    "updatedAt": "2026-05-26",
    "summaryAvailable": true,
    "label": "קיים",
    "questionCount": 0
  },
  {
    "lessonId": "lesson-09",
    "sessionNumber": 9,
    "title": "עבודת ממונה בטיחות מול הנהלת הארגון",
    "href": "pages/summaries/lesson-09-summary.html",
    "updatedAt": "2026-05-26",
    "summaryAvailable": true,
    "label": "קיים",
    "questionCount": 0
  }
].map(withCourseScope),
    lessonUpdates: [latestUpdate],
    glossaryAdditions: lessons.flatMap((item) => item.glossaryTerms.map((term) => withCourseScope({ term, category: "????? ?????", lessonId: item.lessonId, href: "pages/glossary.html" }))),
    checklistAdditions: lessons.flatMap((item) => item.relatedChecklists.map((href) => withCourseScope({ title: "Checklist ????", category: "Operational", lessonId: item.lessonId, href }))),
    knowledgeLinks: Object.fromEntries(lessons.map((item) => [item.lessonId, item.relatedKnowledge])),
    latestUpdate
  };
})();

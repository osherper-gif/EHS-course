const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const sandbox = { window: {}, console };
vm.createContext(sandbox);

[
  "data/platform-config.js",
  "data/courses-map.js",
  "data/domains-map.js",
  "data/content-ingestion-map.js",
  "data/summary-questions-map.js",
  "data/prep-questions-map.js",
  "data/checklists-map.js",
  "data/knowledge-map.js",
].forEach((relativePath) => {
  const filePath = path.join(repoRoot, relativePath);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), sandbox, { filename: filePath });
});

const DEFAULT_COURSE_ID = "safety-officer";
const DEFAULT_DOMAIN_ID = "safety";
const failures = [];

function fail(message) {
  failures.push(message);
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function values(value) {
  if (!value || typeof value !== "object") return [];
  return Array.isArray(value) ? value : Object.values(value);
}

const courses = list(sandbox.window.EHSCoursesMap && sandbox.window.EHSCoursesMap.courses);
const activeCourses = courses.filter((course) => course.status === "active");
const knownCourseIds = new Set(courses.map((course) => course.id));
const domains = list(sandbox.window.CourseDomains);
const knownDomainIds = new Set();
domains.forEach((domain) => {
  if (domain.id) knownDomainIds.add(domain.id);
  if (domain.domain) knownDomainIds.add(domain.domain);
});
knownDomainIds.add(DEFAULT_DOMAIN_ID);

if (activeCourses.length !== 1 || activeCourses[0].id !== DEFAULT_COURSE_ID) {
  fail("safety-officer must be the only active course");
}

function validateScope(entity, label) {
  if (!entity || typeof entity !== "object") {
    fail(label + " is not an object");
    return;
  }
  if (!entity.courseId) fail(label + " missing courseId");
  if (!entity.domainId) fail(label + " missing domainId");
  if (entity.courseId && !knownCourseIds.has(entity.courseId)) {
    fail(label + " has unknown courseId: " + entity.courseId);
  }
  if (entity.domainId && !knownDomainIds.has(entity.domainId)) {
    fail(label + " has unknown domainId: " + entity.domainId);
  }
}

const ingestion = sandbox.window.CourseContentIngestionMap || {};
list(ingestion.lessons).forEach((lesson) => validateScope(lesson, "content lesson " + lesson.lessonId));
list(ingestion.prepPages).forEach((page) => validateScope(page, "prep page " + page.lessonId));
list(ingestion.summaryPages).forEach((page) => validateScope(page, "summary page " + page.lessonId));
list(ingestion.lessonUpdates).forEach((update, index) => validateScope(update, "lesson update " + index));
list(ingestion.glossaryAdditions).forEach((term, index) => validateScope(term, "glossary addition " + index));
list(ingestion.checklistAdditions).forEach((checklist, index) => validateScope(checklist, "checklist addition " + index));
if (ingestion.latestUpdate) validateScope(ingestion.latestUpdate, "latestUpdate");

const summarySets = sandbox.window.CourseSummaryQuestionSets || {};
const summaryMeta = sandbox.window.CourseSummaryQuestionSetMeta || {};
Object.keys(summarySets).forEach((key) => {
  validateScope(summaryMeta[key], "summary question set meta " + key);
});

const prepSets = sandbox.window.CoursePrepQuestionSets || {};
const prepMeta = sandbox.window.CoursePrepQuestionSetMeta || {};
Object.keys(prepSets).forEach((key) => {
  validateScope(prepMeta[key], "prep question set meta " + key);
});

const checklistMap = sandbox.window.CourseChecklistMap || {};
if (checklistMap.courseId || checklistMap.domainId) validateScope(checklistMap, "checklist map");
list(checklistMap.checklists).forEach((checklist) => validateScope(checklist, "checklist " + checklist.id));

const knowledge = sandbox.window.CourseKnowledgeMap || {};
if (knowledge.courseId || knowledge.domainId) validateScope(knowledge, "knowledge map");
values(knowledge.knowledgePages).forEach((page) => validateScope(page, "knowledge page " + page.href));
values(knowledge.lessons).forEach((lesson) => validateScope(lesson, "knowledge lesson " + lesson.href));
list(knowledge.glossaryTerms).forEach((term) => validateScope(term, "knowledge glossary term " + term.term));
if (knowledge.lastLessonUpdate) validateScope(knowledge.lastLessonUpdate, "knowledge lastLessonUpdate");

if (failures.length) {
  console.error("Course scope check FAILED");
  failures.forEach((message) => console.error("- " + message));
  process.exit(1);
}

console.log("Course scope check PASS: safety-officer scoped content metadata is present.");

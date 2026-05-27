(function () {
  "use strict";

  var DEFAULT_COURSE_ID = "safety-officer";
  var DEFAULT_DOMAIN_ID = "safety";
  var warnedScopeKeys = {};

  function courses() {
    return (window.EHSCoursesMap && Array.isArray(window.EHSCoursesMap.courses))
      ? window.EHSCoursesMap.courses
      : [];
  }

  function domains() {
    return Array.isArray(window.CourseDomains) ? window.CourseDomains : [];
  }

  function config() {
    return window.PlatformConfig || {};
  }

  function getCurrentCourseId() {
    var host = document.body || document.documentElement;
    return (host && host.getAttribute("data-course-id")) || config().defaultCourseId || DEFAULT_COURSE_ID;
  }

  function getActiveCourseId() {
    var activeCourse = courses().find(function (course) { return course.status === "active"; });
    return (activeCourse && activeCourse.id) || getCurrentCourseId() || DEFAULT_COURSE_ID;
  }

  function getCourseConfig(courseId) {
    var id = courseId || getCurrentCourseId();
    return courses().find(function (course) { return course.id === id; }) || null;
  }

  function getDomainConfig(domainId) {
    var id = domainId;
    if (!id) {
      var course = getCourseConfig();
      id = course && (course.domainId || course.id);
    }
    return domains().find(function (domain) { return domain.id === id || domain.domain === id; }) || null;
  }

  function resolveCourseHref(courseId, path) {
    var course = getCourseConfig(courseId);
    var target = path || "";
    if (!course) return target;
    if (!target) return course.homeHref || course.href || "";
    if (/^(https?:|mailto:|tel:|#|\/)/.test(target)) return target;
    return target.replace(/^\.?\//, "");
  }

  function shouldWarnScope() {
    var host = (window.location && window.location.hostname) || "";
    return !host || host === "localhost" || host === "127.0.0.1" || host.indexOf("staging") !== -1;
  }

  function scopeKey(entity) {
    return (entity && (entity.id || entity.lessonId || entity.href || entity.title)) || "unknown";
  }

  function warnMissingScope(entity, field) {
    if (!shouldWarnScope() || !window.console || !console.warn) return;
    var key = field + ":" + scopeKey(entity);
    if (warnedScopeKeys[key]) return;
    warnedScopeKeys[key] = true;
    console.warn("[PlatformCore] Missing " + field + "; using safety-officer fallback.", entity);
  }

  function assertCourseScope(entity) {
    if (!entity || typeof entity !== "object") {
      return { courseId: DEFAULT_COURSE_ID, domainId: DEFAULT_DOMAIN_ID, scoped: false };
    }
    if (!entity.courseId) warnMissingScope(entity, "courseId");
    if (!entity.domainId) warnMissingScope(entity, "domainId");
    return {
      courseId: entity.courseId || DEFAULT_COURSE_ID,
      domainId: entity.domainId || DEFAULT_DOMAIN_ID,
      scoped: Boolean(entity.courseId && entity.domainId)
    };
  }

  function entityMatchesCourse(entity, courseId) {
    if (!entity || typeof entity !== "object") return true;
    return assertCourseScope(entity).courseId === (courseId || getActiveCourseId());
  }

  function entityMatchesDomain(entity, domainId) {
    if (!entity || typeof entity !== "object") return true;
    return assertCourseScope(entity).domainId === (domainId || DEFAULT_DOMAIN_ID);
  }

  function filterCollection(items, predicate) {
    if (Array.isArray(items)) return items.filter(predicate);
    if (!items || typeof items !== "object") return items;
    return Object.keys(items).reduce(function (next, key) {
      if (predicate(items[key], key)) next[key] = items[key];
      return next;
    }, {});
  }

  function filterByCourse(items, courseId) {
    return filterCollection(items, function (entity) {
      return entityMatchesCourse(entity, courseId);
    });
  }

  function filterByDomain(items, domainId) {
    return filterCollection(items, function (entity) {
      return entityMatchesDomain(entity, domainId);
    });
  }

  function filterQuestionSets(sets, meta, courseId) {
    if (!sets || typeof sets !== "object") return sets;
    var target = courseId || getActiveCourseId();
    return Object.keys(sets).reduce(function (next, key) {
      var setMeta = meta && meta[key];
      if (!setMeta) warnMissingScope({ id: key }, "courseId");
      if ((setMeta && setMeta.courseId) ? setMeta.courseId === target : target === DEFAULT_COURSE_ID) {
        next[key] = sets[key];
      }
      return next;
    }, {});
  }

  function knownMaps() {
    return {
      courses: window.EHSCoursesMap && window.EHSCoursesMap.courses,
      domains: window.CourseDomains,
      contentIngestion: window.CourseContentIngestionMap || window.EHSContentIngestion,
      summaryQuestions: window.CourseSummaryQuestionSets,
      summaryQuestionSets: window.CourseSummaryQuestionSets,
      checklists: window.CourseChecklistMap && window.CourseChecklistMap.checklists,
      knowledge: window.CourseKnowledgeMap && window.CourseKnowledgeMap.knowledgePages,
      lessons: window.CourseKnowledgeMap && window.CourseKnowledgeMap.lessons,
      prepQuestions: window.CoursePrepQuestionSets
    };
  }

  function getCourseScopedContent(mapName, courseId) {
    var maps = knownMaps();
    if (mapName === "summaryQuestions" || mapName === "summaryQuestionSets") {
      return filterQuestionSets(window.CourseSummaryQuestionSets, window.CourseSummaryQuestionSetMeta, courseId);
    }
    if (mapName === "prepQuestions") {
      return filterQuestionSets(window.CoursePrepQuestionSets, window.CoursePrepQuestionSetMeta, courseId);
    }
    return filterByCourse(maps[mapName], courseId || getActiveCourseId());
  }

  window.PlatformCore = Object.freeze({
    getCurrentCourseId: getCurrentCourseId,
    getActiveCourseId: getActiveCourseId,
    getCourseConfig: getCourseConfig,
    getDomainConfig: getDomainConfig,
    resolveCourseHref: resolveCourseHref,
    filterByCourse: filterByCourse,
    filterByDomain: filterByDomain,
    getCourseScopedContent: getCourseScopedContent,
    assertCourseScope: assertCourseScope,
    getCourses: function () { return courses().slice(); },
    getDomains: function () { return domains().slice(); },
    getPlatformConfig: config
  });
})();

(function () {
  "use strict";

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
    return (host && host.getAttribute("data-course-id")) || config().defaultCourseId || "safety-officer";
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

  window.PlatformCore = Object.freeze({
    getCurrentCourseId: getCurrentCourseId,
    getCourseConfig: getCourseConfig,
    getDomainConfig: getDomainConfig,
    resolveCourseHref: resolveCourseHref,
    getCourses: function () { return courses().slice(); },
    getDomains: function () { return domains().slice(); },
    getPlatformConfig: config
  });
})();

(function () {
  'use strict';

  window.EHSLearningServices = window.EHSLearningServices || {};

  function createNavigationLabels(options) {
    const topicById = options && options.topicById ? options.topicById : new Map();
    const lessonById = options && options.lessonById ? options.lessonById : new Map();
    const lessonIcon = options && options.lessonIcon ? options.lessonIcon : '';
    const topicIcon = options && options.topicIcon ? options.topicIcon : '';
    const separator = options && options.separator ? options.separator : ' - ';
    const maxLessonTitleLength = options && options.maxLessonTitleLength ? options.maxLessonTitleLength : 46;

    function lessonLabel(lessonId) {
      const lesson = lessonById.get(lessonId);
      const lessonNumber = lessonNumberFromId(lessonId);
      const lessonPrefix = lessonIcon ? `${lessonIcon} ` : '';

      if (!lesson) {
        return lessonNumber ? `${lessonPrefix}שיעור ${lessonNumber}` : `${lessonPrefix}שיעור`;
      }

      const shortTitle = shortenTitle(lesson.title || '', maxLessonTitleLength);
      return lessonNumber ? `${lessonPrefix}שיעור ${lessonNumber}${separator}${shortTitle}` : `${lessonPrefix}${shortTitle}`;
    }

    function topicLabel(topicId) {
      const topic = topicById.get(topicId);
      const topicPrefix = topicIcon ? `${topicIcon} ` : '';
      return `${topicPrefix}${topic ? presentationTitle(topic.title) : 'נושא קשור'}`;
    }

    return {
      lessonLabel,
      topicLabel,
      lessonHref,
      topicHref,
      lessonNumberFromId,
      shortenTitle,
      presentationTitle
    };
  }

  function lessonHref(lessonId) {
    return `learning-path.html#${encodeURIComponent(lessonId)}`;
  }

  function topicHref(topicId) {
    return `knowledge-hub-pilot.html?topic=${encodeURIComponent(topicId)}`;
  }

  function lessonNumberFromId(lessonId) {
    const match = String(lessonId || '').match(/lesson-(\d+)/);
    return match ? String(Number(match[1])) : '';
  }

  function shortenTitle(title, maxLength) {
    const value = String(title || '').trim();
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1).trim()}...`;
  }

  function presentationTitle(value) {
    return String(value || '').trim();
  }

  window.EHSLearningServices.NavigationLabels = {
    createNavigationLabels,
    lessonHref,
    topicHref,
    lessonNumberFromId,
    shortenTitle,
    presentationTitle
  };
})();

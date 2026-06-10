(function () {
  'use strict';

  window.EHSLearningServices = window.EHSLearningServices || {};

  async function loadJsonFiles(files, errorMessage) {
    const entries = await Promise.all(
      Object.entries(files).map(async ([key, file]) => {
        const response = await fetch(file, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(errorMessage || 'טעינת נתוני השאלות נכשלה.');
        }
        return [key, await response.json()];
      })
    );

    return Object.fromEntries(entries);
  }

  function createIndexes(raw) {
    const data = raw.questions || {};
    const questions = Array.isArray(data.questions) ? data.questions : [];
    const topics = raw.topics && Array.isArray(raw.topics.topics) ? raw.topics.topics : [];
    const lessons = raw.lessons && Array.isArray(raw.lessons.lessonMappings) ? raw.lessons.lessonMappings : [];
    const sources = raw.sources && Array.isArray(raw.sources.entries) ? raw.sources.entries : [];
    const citations = raw.citations && Array.isArray(raw.citations.citations) ? raw.citations.citations : [];

    return {
      data,
      questions,
      topicById: new Map(topics.map((topic) => [topic.topicId, topic])),
      lessonById: new Map(lessons.map((lesson) => [lesson.lessonId, lesson])),
      sourceById: new Map(sources.map((source) => [source.stableSourceId, source])),
      citationById: new Map(citations.map((citation) => [citation.citationId, citation]))
    };
  }

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function flatMap(values, mapper) {
    return values.reduce((result, value) => result.concat(mapper(value)), []);
  }

  function countBy(values, mapper) {
    return values.reduce((counts, value) => {
      const key = mapper(value);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  }

  window.EHSLearningServices.QuestionBank = {
    loadJsonFiles,
    createIndexes,
    normalizeText,
    unique,
    flatMap,
    countBy
  };
})();

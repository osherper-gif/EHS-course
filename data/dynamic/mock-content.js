(function initMockDynamicContent(globalScope) {
  'use strict';

  var MOCK_CONTENT = Object.freeze({
    'lesson-01': Object.freeze({
      id: 'lesson-01',
      type: 'lesson',
      title: 'יסודות תורת הבטיחות',
      version: 'mock-2026-05-10-01',
      source: 'mock',
      updatedAt: '2026-05-10T00:00:00.000Z',
      blocks: Object.freeze([
        Object.freeze({
          id: 'lesson-01-mock-callout-01',
          type: 'callout',
          title: 'בדיקת טעינה דינמית',
          body: 'זהו תוכן mock מקומי בלבד לבדיקת נתיב טעינה read-only.'
        })
      ])
    })
  });

  function getMockDynamicContent(topicId) {
    return MOCK_CONTENT[topicId] || null;
  }

  var api = {
    MOCK_CONTENT: MOCK_CONTENT,
    getMockDynamicContent: getMockDynamicContent
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.MockDynamicContent = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);

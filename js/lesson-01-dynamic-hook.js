(function initLesson01DynamicHook(globalScope) {
  'use strict';

  function runLesson01DynamicHook() {
    if (!globalScope.DynamicContentLoader || !globalScope.DynamicContentRenderer) {
      return;
    }

    var documentRef = globalScope.document;
    if (!documentRef || typeof documentRef.getElementById !== 'function') {
      return;
    }

    var previewContainer = documentRef.getElementById('dynamic-content-preview');

    if (!previewContainer) {
      return;
    }

    globalScope.DynamicContentLoader.loadDynamicContent('lesson-01', function staticFallback() {
      return null;
    })
      .then(function renderPreview(dynamicContent) {
        if (!dynamicContent) {
          return;
        }

        globalScope.DynamicContentRenderer.renderDynamicContentPreview(
          previewContainer,
          dynamicContent
        );
      })
      .catch(function ignoreDynamicPreviewError() {
        previewContainer.hidden = true;
      });
  }

  if (globalScope.document && globalScope.document.readyState === 'loading') {
    globalScope.document.addEventListener('DOMContentLoaded', runLesson01DynamicHook);
  } else {
    runLesson01DynamicHook();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      runLesson01DynamicHook: runLesson01DynamicHook
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);

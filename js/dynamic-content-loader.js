(function initDynamicContentLoader(globalScope) {
  'use strict';

  var flagService = resolveFlagService();

  function resolveFlagService() {
    if (typeof require === 'function') {
      try {
        return require('./dynamic-content-flags.js');
      } catch (error) {
        // Browser usage resolves the service from the global scope.
      }
    }

    return globalScope.DynamicContentFlagService || {
      isDynamicContentEnabled: function isDynamicContentEnabled() {
        return false;
      },
      isDynamicContentDebugEnabled: function isDynamicContentDebugEnabled() {
        return false;
      }
    };
  }

  function debugLog(message, details) {
    if (!flagService.isDynamicContentDebugEnabled()) {
      return;
    }

    if (details !== undefined) {
      console.info('[dynamic-content-loader]', message, details);
      return;
    }

    console.info('[dynamic-content-loader]', message);
  }

  function resolveFallback(fallbackProvider, reason) {
    try {
      if (typeof fallbackProvider === 'function') {
        return fallbackProvider(reason);
      }

      return fallbackProvider;
    } catch (error) {
      debugLog('Fallback provider failed', error);
      return null;
    }
  }

  function hasDynamicContentValue(value) {
    if (value === null || value === undefined) {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }

    return true;
  }

  function hasFirestoreReadCapability(provider) {
    return Boolean(
      provider &&
        typeof provider === 'object' &&
        typeof provider.read === 'function' &&
        typeof provider.write !== 'function' &&
        typeof provider.set !== 'function' &&
        typeof provider.add !== 'function' &&
        typeof provider.update !== 'function' &&
        typeof provider.delete !== 'function'
    );
  }

  async function loadDynamicContent(topicId, fallbackProvider, options) {
    var safeOptions = options && typeof options === 'object' ? options : {};

    if (!flagService.isDynamicContentEnabled()) {
      debugLog('Dynamic loading disabled; using fallback', { topicId: topicId });
      return resolveFallback(fallbackProvider, 'dynamic-disabled');
    }

    try {
      if (typeof safeOptions.dynamicProvider === 'function') {
        var localDynamicValue = await safeOptions.dynamicProvider(topicId);

        if (hasDynamicContentValue(localDynamicValue)) {
          return localDynamicValue;
        }

        debugLog('Dynamic provider returned empty data; using fallback', { topicId: topicId });
        return resolveFallback(fallbackProvider, 'empty-dynamic-data');
      }

      if (!hasFirestoreReadCapability(safeOptions.firestoreProvider)) {
        debugLog('Firestore read provider unavailable; using fallback', { topicId: topicId });
        return resolveFallback(fallbackProvider, 'firestore-unavailable');
      }

      var firestoreValue = await safeOptions.firestoreProvider.read(topicId);

      if (hasDynamicContentValue(firestoreValue)) {
        return firestoreValue;
      }

      debugLog('Firestore returned empty data; using fallback', { topicId: topicId });
      return resolveFallback(fallbackProvider, 'empty-firestore-data');
    } catch (error) {
      debugLog('Dynamic loading failed; using fallback', error);
      return resolveFallback(fallbackProvider, 'dynamic-error');
    }
  }

  var api = {
    loadDynamicContent: loadDynamicContent,
    hasDynamicContentValue: hasDynamicContentValue
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.DynamicContentLoader = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);

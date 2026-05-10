(function initDynamicContentFlags(globalScope) {
  'use strict';

  var DEFAULT_FLAGS = Object.freeze({
    enabled: false,
    debug: false,
    useMockDynamicContent: false
  });

  function readRuntimeFlags() {
    var runtimeFlags = globalScope && globalScope.DynamicContentFlags;
    if (!runtimeFlags || typeof runtimeFlags !== 'object') {
      return {};
    }

    return runtimeFlags;
  }

  function getDynamicContentFlags() {
    var runtimeFlags = readRuntimeFlags();

    return {
      enabled: runtimeFlags.enabled === true,
      debug: runtimeFlags.debug === true,
      useMockDynamicContent: runtimeFlags.useMockDynamicContent === true
    };
  }

  function isDynamicContentEnabled() {
    return getDynamicContentFlags().enabled === true;
  }

  function isDynamicContentDebugEnabled() {
    return getDynamicContentFlags().debug === true;
  }

  function isMockDynamicContentEnabled() {
    var flags = getDynamicContentFlags();

    return flags.enabled === true && flags.useMockDynamicContent === true;
  }

  var api = {
    DEFAULT_FLAGS: DEFAULT_FLAGS,
    getDynamicContentFlags: getDynamicContentFlags,
    isDynamicContentEnabled: isDynamicContentEnabled,
    isDynamicContentDebugEnabled: isDynamicContentDebugEnabled,
    isMockDynamicContentEnabled: isMockDynamicContentEnabled
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.DynamicContentFlagService = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);

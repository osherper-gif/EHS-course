(function initDynamicContentRenderer(globalScope) {
  'use strict';

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderBlock(block) {
    if (!block || typeof block !== 'object') {
      return '';
    }

    if (block.type === 'callout') {
      return [
        '<article class="dynamic-preview-block dynamic-preview-callout">',
        block.title ? '<h3>' + escapeHtml(block.title) + '</h3>' : '',
        block.body ? '<p>' + escapeHtml(block.body) + '</p>' : '',
        '</article>'
      ].join('');
    }

    if (block.type === 'paragraph') {
      return block.body ? '<p>' + escapeHtml(block.body) + '</p>' : '';
    }

    if (block.type === 'internalLink') {
      if (!block.href || !block.title) {
        return '';
      }

      return [
        '<a class="btn secondary" href="',
        escapeHtml(block.href),
        '">',
        escapeHtml(block.title),
        '</a>'
      ].join('');
    }

    return '';
  }

  function renderDynamicContentPreview(container, content) {
    if (!container || !content || !Array.isArray(content.blocks)) {
      return false;
    }

    var blocksHtml = content.blocks.map(renderBlock).filter(Boolean).join('');

    if (!blocksHtml) {
      return false;
    }

    container.innerHTML = [
      '<div class="dynamic-preview-inner" dir="rtl">',
      '<p class="kicker">תוכן דינמי ניסיוני</p>',
      content.title ? '<h2>' + escapeHtml(content.title) + '</h2>' : '',
      '<p>תצוגת preview מקומית בלבד. התוכן הסטטי של השיעור לא הוחלף.</p>',
      blocksHtml,
      '</div>'
    ].join('');

    container.hidden = false;
    return true;
  }

  var api = {
    escapeHtml: escapeHtml,
    renderDynamicContentPreview: renderDynamicContentPreview
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.DynamicContentRenderer = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);

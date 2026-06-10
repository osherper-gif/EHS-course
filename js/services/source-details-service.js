(function () {
  'use strict';

  window.EHSLearningServices = window.EHSLearningServices || {};

  const AUTHORITY_LABELS = {
    1: 'מקור משפטי',
    2: 'חקיקת משנה',
    3: 'הוראת רגולטור',
    4: 'תקן בינלאומי',
    5: 'נוהל',
    6: 'חומר הדרכה',
    7: 'פרשנות / דגש מבחן'
  };

  const SOURCE_DISPLAY_LABELS = {
    'law-labor-inspection-1954': 'חוק ארגון הפיקוח על העבודה, תשי"ד-1954',
    'ordinance-work-safety-1970': 'פקודת הבטיחות בעבודה, תש"ל-1970',
    'standard-iso-45001-2018': 'ISO 45001:2018',
    'training-occupational-safety-management': 'ניהול בטיחות בתעסוקה'
  };

  function createSourceDetails(options) {
    const sourceById = options && options.sourceById ? options.sourceById : new Map();
    const citationById = options && options.citationById ? options.citationById : new Map();

    function sourceTitle(sourceId) {
      if (SOURCE_DISPLAY_LABELS[sourceId]) return SOURCE_DISPLAY_LABELS[sourceId];
      const source = sourceById.get(sourceId);
      if (!source) return 'מקור לא מזוהה';
      return cleanSourceTitle(source.title || source.stableSourceId);
    }

    function citationLabel(citationId) {
      const citation = citationById.get(citationId);
      if (!citation) return 'הפניה לא מזוהה';
      return citation.label || locatorLabel(citation.locator) || 'הפניה במקור';
    }

    return {
      sourceRoleLabel,
      sourceStatusLabel,
      authorityLabel,
      sourceTitle,
      citationLabel,
      cleanSourceTitle,
      locatorLabel
    };
  }

  function sourceRoleLabel(item) {
    const level = Number(item.authorityLevel);
    return level >= 6 ? 'מקור לימודי' : 'מקור אימות';
  }

  function sourceStatusLabel(item) {
    const level = Number(item.authorityLevel);
    if (level >= 6 && item.verificationStatus === 'source-backed') {
      return 'הסבר מבוסס חומר לימודי';
    }
    return statusLabel(item.verificationStatus);
  }

  function authorityLabel(level) {
    return AUTHORITY_LABELS[Number(level)] || `רמת סמכות ${level || 'לא ידועה'}`;
  }

  function statusLabel(status) {
    if (status === 'source-backed') return 'מבוסס מקור';
    if (status === 'verified') return 'מאומת';
    if (status === 'unverified') return 'לא מאומת';
    return status || 'לא ידוע';
  }

  function cleanSourceTitle(title) {
    return String(title || '')
      .replace(/^\d+(?:\.\d+)*\./, '')
      .replace(/-?סופי\.?העלאה לאתר$/u, '')
      .replace(/-?סופי$/u, '')
      .replace(/_/g, ' ')
      .trim();
  }

  function locatorLabel(locator) {
    if (!locator || typeof locator !== 'object') return '';
    if (locator.section) return `סעיף ${locator.section}`;
    if (locator.heading) return locator.heading;
    if (locator.sectionTitle) return locator.sectionTitle;
    if (locator.page) return `עמוד ${locator.page}`;
    return '';
  }

  window.EHSLearningServices.SourceDetails = {
    createSourceDetails,
    sourceRoleLabel,
    sourceStatusLabel,
    authorityLabel,
    statusLabel,
    cleanSourceTitle,
    locatorLabel
  };
})();

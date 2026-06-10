(function () {
  'use strict';

  window.EHSLearningServices = window.EHSLearningServices || {};

  function buildWeakTopicPresentation(options) {
    const topicMetric = options && options.topicMetric ? options.topicMetric : {};
    const topicTitle = options && options.topicTitle ? options.topicTitle : topicMetric.topicId || '';
    const capabilities = options && options.capabilities ? options.capabilities : {};
    const confidence = numberOrZero(topicMetric.confidence);
    const weaknessScore = Number.isFinite(Number(topicMetric.weaknessScore)) ? Number(topicMetric.weaknessScore) : null;
    const answeredCount = nonNegative(topicMetric.answeredCount);
    const reviewStateCount = nonNegative(topicMetric.reviewStateCount);
    const fsrsStruggleCount = nonNegative(topicMetric.fsrsStruggleCount);
    const severity = severityFor(topicMetric);

    return {
      topicId: topicMetric.topicId || '',
      topicTitle,
      displayLabel: displayLabelFor(severity),
      confidenceLabel: confidenceLabelFor(confidence),
      recommendationText: recommendationTextFor(severity, confidence),
      primaryCTA: primaryCtaFor(severity, capabilities),
      secondaryCTA: secondaryCtaFor(severity, capabilities),
      evidenceSummary: evidenceSummaryFor(topicMetric),
      severity,
      shouldShow: shouldShow({ answeredCount, reviewStateCount, fsrsStruggleCount, severity, weaknessScore }),
      supportsOpenQuestions: true
    };
  }

  function buildWeakTopicPresentations(options) {
    const metrics = Array.isArray(options && options.metrics) ? options.metrics : [];
    const topicTitle = typeof (options && options.topicTitle) === 'function' ? options.topicTitle : (topic) => topic;
    const capabilities = options && options.capabilities ? options.capabilities : {};
    const limit = Math.max(1, Number(options && options.limit) || 3);

    return metrics
      .map((topicMetric) => buildWeakTopicPresentation({
        topicMetric,
        topicTitle: topicTitle(topicMetric.topicId),
        capabilities
      }))
      .filter((item) => item.shouldShow)
      .sort(comparePresentation)
      .slice(0, limit);
  }

  function severityFor(topicMetric) {
    const confidence = numberOrZero(topicMetric.confidence);
    const weaknessScore = Number.isFinite(Number(topicMetric.weaknessScore)) ? Number(topicMetric.weaknessScore) : null;
    const answeredCount = nonNegative(topicMetric.answeredCount);

    if (answeredCount === 0 || weaknessScore === null) return 'insufficient-data';
    if (confidence < 0.4) return 'early-signal';
    if (weaknessScore < 30) return 'positive';
    if (weaknessScore < 60) return 'light-review';
    if (weaknessScore < 80) return 'review-recommended';
    return confidence >= 0.75 ? 'exam-focus' : 'review-recommended';
  }

  function displayLabelFor(severity) {
    const labels = {
      'insufficient-data': 'אין עדיין מספיק נתונים',
      'early-signal': 'יש סימנים ראשוניים',
      positive: 'מתקדם טוב',
      'light-review': 'חזרה קצרה יכולה לעזור',
      'review-recommended': 'כדאי לחזק',
      'exam-focus': 'כדאי לחזק לפני המבחן'
    };
    return labels[severity] || labels['early-signal'];
  }

  function confidenceLabelFor(confidence) {
    if (confidence <= 0) return 'ביטחון בהמלצה: אין נתונים';
    if (confidence < 0.4) return 'ביטחון בהמלצה: נמוך';
    if (confidence < 0.75) return 'ביטחון בהמלצה: בינוני';
    return 'ביטחון בהמלצה: גבוה';
  }

  function recommendationTextFor(severity, confidence) {
    if (confidence < 0.4 && severity !== 'insufficient-data') {
      return 'יש מעט נתונים בנושא זה. המשך לתרגל כדי לקבל המלצה מדויקת יותר.';
    }

    const texts = {
      'insufficient-data': 'ענה על כמה שאלות כדי לקבל המלצות חזרה.',
      'early-signal': 'יש מעט נתונים בנושא זה. המשך לתרגל כדי לקבל המלצה מדויקת יותר.',
      positive: 'נראה שאתה מתקדם טוב בנושא זה.',
      'light-review': 'חזרה קצרה יכולה לעזור לבסס את הנושא.',
      'review-recommended': 'כדאי לחזק את הנושא הזה לפני שמתקדמים הלאה.',
      'exam-focus': 'כדאי לחזק את הנושא הזה לפני המבחן.'
    };
    return texts[severity] || texts['early-signal'];
  }

  function primaryCtaFor(severity, capabilities) {
    if (severity === 'positive' && capabilities.hasSummary) return 'פתח סיכום בנושא';
    return capabilities.hasPracticeQuestions === false ? 'פתח סיכום בנושא' : 'תרגל 5 שאלות בנושא';
  }

  function secondaryCtaFor(severity, capabilities) {
    if (['review-recommended', 'exam-focus'].includes(severity) && capabilities.canOpenSmartReview) {
      return 'פתח חזרה חכמה';
    }
    if (capabilities.hasSummary) return 'פתח סיכום בנושא';
    return '';
  }

  function evidenceSummaryFor(topicMetric) {
    const answeredCount = nonNegative(topicMetric.answeredCount);
    const incorrectRate = numberOrZero(topicMetric.incorrectRate);
    const reviewStateCount = nonNegative(topicMetric.reviewStateCount);
    const fsrsStruggleCount = nonNegative(topicMetric.fsrsStruggleCount);
    const avgResponseTimeMs = nonNegative(topicMetric.avgResponseTimeMs);
    const parts = [];

    if (answeredCount === 0) return 'אין עדיין מספיק תשובות בנושא.';

    parts.push(`מבוסס על ${answeredCount} ${answeredCount === 1 ? 'שאלה שנענתה' : 'שאלות שנענו'}`);

    const mistakeCount = Math.round(answeredCount * incorrectRate);
    if (mistakeCount > 0) {
      parts.push(`ועל ${mistakeCount} ${mistakeCount === 1 ? 'טעות' : 'טעויות'} בנושא`);
    }
    if (reviewStateCount > 0) {
      parts.push(`כולל ${reviewStateCount} ${reviewStateCount === 1 ? 'סימון אחד לחזרה' : 'סימונים לחזרה'}`);
    }
    if (fsrsStruggleCount > 0) {
      parts.push(`כולל ${fsrsStruggleCount} ${fsrsStruggleCount === 1 ? 'חזרה חכמה מאתגרת' : 'חזרות חכמות מאתגרות'}`);
    }
    if (avgResponseTimeMs >= 90000) {
      parts.push('זמן המענה היה גבוה יחסית');
    }

    return `${parts.join(', ')}.`;
  }

  function shouldShow(details) {
    if (details.severity === 'positive') return false;
    if (details.answeredCount > 0) return true;
    if (details.reviewStateCount > 0 || details.fsrsStruggleCount > 0) return true;
    return false;
  }

  function comparePresentation(first, second) {
    const order = {
      'exam-focus': 5,
      'review-recommended': 4,
      'light-review': 3,
      'early-signal': 2,
      'insufficient-data': 1,
      positive: 0
    };
    return (order[second.severity] || 0) - (order[first.severity] || 0);
  }

  function numberOrZero(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function nonNegative(value) {
    return Math.max(0, numberOrZero(value));
  }

  window.EHSLearningServices.WeakTopicsPresentation = {
    buildWeakTopicPresentation,
    buildWeakTopicPresentations
  };
})();

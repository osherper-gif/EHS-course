(function () {
  'use strict';

  window.EHSLearningServices = window.EHSLearningServices || {};

  const WEIGHTS = {
    incorrectRate: 35,
    notFirstAttemptRate: 20,
    reviewStateRate: 15,
    slowResponsePenalty: 10,
    answerChangesPenalty: 10,
    fsrsStrugglePenalty: 10
  };

  function calculateWeakTopics(options) {
    const questions = Array.isArray(options && options.questions) ? options.questions : [];
    const learningStates = options && options.learningStates ? options.learningStates : {};
    const learningSignals = options && options.learningSignals ? options.learningSignals : {};
    const schedulers = options && options.schedulers ? options.schedulers : {};
    const now = dateOrNow(options && options.now);
    const medianResponseTimeMs = responseTimeMedian(Object.values(learningSignals));
    const hasEnoughTimingData = medianResponseTimeMs !== null;
    const topicStats = new Map();

    for (const question of questions) {
      const topicIds = Array.isArray(question.topicIds) ? question.topicIds : [];
      for (const topicId of topicIds) {
        if (!topicStats.has(topicId)) {
          topicStats.set(topicId, createTopicStats(topicId));
        }

        const stats = topicStats.get(topicId);
        stats.totalQuestions += 1;
        stats.questionIds.add(question.questionId);

        const signal = normalizeSignal(learningSignals[question.questionId]);
        if (signal) {
          stats.answeredCount += 1;
          if (signal.correct !== true) stats.incorrectCount += 1;
          if (signal.firstAttemptCorrect === true) stats.firstAttemptCorrectCount += 1;
          stats.answerChangesTotal += Math.max(0, Number(signal.answerChanges || 0));
          stats.responseTimeTotal += Math.max(0, Number(signal.responseTimeMs || 0));
          if (hasEnoughTimingData && Number(signal.responseTimeMs || 0) > medianResponseTimeMs * 1.5) {
            stats.slowResponseCount += 1;
          }
        }

        if (learningStates[question.questionId] === 'review') {
          stats.reviewStateCount += 1;
        }

        if (isFsrsStruggle(schedulers[question.questionId], now)) {
          stats.fsrsStruggleCount += 1;
        }
      }
    }

    return Array.from(topicStats.values())
      .map((stats) => toWeakTopicMetric(stats))
      .sort((first, second) => {
        const firstScore = first.weaknessScore === null ? -1 : first.weaknessScore;
        const secondScore = second.weaknessScore === null ? -1 : second.weaknessScore;
        return secondScore - firstScore || second.answeredCount - first.answeredCount || first.topicId.localeCompare(second.topicId);
      });
  }

  function createTopicStats(topicId) {
    return {
      topicId,
      questionIds: new Set(),
      totalQuestions: 0,
      answeredCount: 0,
      incorrectCount: 0,
      firstAttemptCorrectCount: 0,
      answerChangesTotal: 0,
      responseTimeTotal: 0,
      slowResponseCount: 0,
      reviewStateCount: 0,
      fsrsStruggleCount: 0
    };
  }

  function toWeakTopicMetric(stats) {
    if (stats.answeredCount === 0) {
      return {
        topicId: stats.topicId,
        answeredCount: 0,
        totalQuestions: stats.totalQuestions,
        incorrectRate: 0,
        firstAttemptRate: 0,
        avgResponseTimeMs: null,
        reviewStateCount: stats.reviewStateCount,
        fsrsStruggleCount: stats.fsrsStruggleCount,
        weaknessScore: null,
        confidence: 0
      };
    }

    const incorrectRate = stats.incorrectCount / stats.answeredCount;
    const firstAttemptRate = stats.firstAttemptCorrectCount / stats.answeredCount;
    const notFirstAttemptRate = 1 - firstAttemptRate;
    const reviewStateRate = safeRatio(stats.reviewStateCount, stats.totalQuestions);
    const slowResponsePenalty = stats.slowResponseCount / stats.answeredCount;
    const answerChangesPenalty = Math.min(1, stats.answerChangesTotal / Math.max(1, stats.answeredCount * 3));
    const fsrsStrugglePenalty = safeRatio(stats.fsrsStruggleCount, stats.totalQuestions);
    const avgResponseTimeMs = Math.round(stats.responseTimeTotal / stats.answeredCount);

    const weaknessScore = Math.round(
      (incorrectRate * WEIGHTS.incorrectRate)
      + (notFirstAttemptRate * WEIGHTS.notFirstAttemptRate)
      + (reviewStateRate * WEIGHTS.reviewStateRate)
      + (slowResponsePenalty * WEIGHTS.slowResponsePenalty)
      + (answerChangesPenalty * WEIGHTS.answerChangesPenalty)
      + (fsrsStrugglePenalty * WEIGHTS.fsrsStrugglePenalty)
    );

    return {
      topicId: stats.topicId,
      answeredCount: stats.answeredCount,
      totalQuestions: stats.totalQuestions,
      incorrectRate: roundRate(incorrectRate),
      firstAttemptRate: roundRate(firstAttemptRate),
      avgResponseTimeMs,
      reviewStateCount: stats.reviewStateCount,
      fsrsStruggleCount: stats.fsrsStruggleCount,
      weaknessScore: clamp(weaknessScore, 0, 100),
      confidence: roundRate(Math.min(1, stats.answeredCount / 5))
    };
  }

  function responseTimeMedian(signals) {
    const times = signals
      .map((signal) => normalizeSignal(signal))
      .filter(Boolean)
      .map((signal) => Number(signal.responseTimeMs || 0))
      .filter((time) => Number.isFinite(time) && time > 0)
      .sort((a, b) => a - b);

    if (times.length < 3) return null;
    const middle = Math.floor(times.length / 2);
    return times.length % 2 ? times[middle] : (times[middle - 1] + times[middle]) / 2;
  }

  function isFsrsStruggle(scheduler, now) {
    if (!scheduler || typeof scheduler !== 'object' || scheduler.type !== 'fsrs') return false;
    if (['again', 'hard'].includes(scheduler.lastRating)) return true;
    if (Number(scheduler.lapses || 0) > 0) return true;
    const due = dateOrNull(scheduler.nextReviewAt);
    return Boolean(due && due <= now && scheduler.lastRating === 'again');
  }

  function normalizeSignal(value) {
    if (!value || typeof value !== 'object' || value.answered !== true) return null;
    return {
      correct: Boolean(value.correct),
      firstAttemptCorrect: Boolean(value.firstAttemptCorrect),
      answerChanges: Math.max(0, Number(value.answerChanges || 0)),
      responseTimeMs: Math.max(0, Number(value.responseTimeMs || 0))
    };
  }

  function safeRatio(value, total) {
    return total > 0 ? value / total : 0;
  }

  function roundRate(value) {
    return Math.round(value * 1000) / 1000;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function dateOrNow(value) {
    return dateOrNull(value) || new Date();
  }

  function dateOrNull(value) {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value.toDate === 'function') {
      const date = value.toDate();
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  window.EHSLearningServices.WeakTopics = {
    calculateWeakTopics
  };
})();

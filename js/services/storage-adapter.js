(function () {
  'use strict';

  window.EHSLearningServices = window.EHSLearningServices || {};

  const DEFAULT_KEYS = {
    learningState: 'ehs.practiceHub.learningState.v1',
    scheduler: 'ehs.practiceHub.scheduler.v1',
    learningSignals: 'ehs.practiceHub.learningSignals.v1'
  };

  const EMPTY_SCHEDULER = {
    type: null,
    version: null,
    stability: null,
    difficulty: null,
    nextReviewAt: null,
    repetitions: 0,
    lapses: 0,
    lastRating: null,
    scheduledDays: null,
    elapsedDays: null,
    fsrsState: null,
    learningSteps: null,
    lastReviewAt: null
  };

  function createLocalStorageAdapter(options) {
    const keys = { ...DEFAULT_KEYS, ...((options && options.keys) || {}) };

    return {
      loadLocalLearningStates: () => readObject(keys.learningState),
      loadLocalSchedulers: () => readObject(keys.scheduler),
      loadLocalLearningSignals: () => readObject(keys.learningSignals),
      saveLocalLearningState: (questionId, patch) => {
        if (!questionId) return;
        const current = readObject(keys.learningState);
        const value = normalizeLearningState(patch && patch.state);
        if (value === 'unknown') {
          delete current[questionId];
        } else {
          current[questionId] = value;
        }
        writeObject(keys.learningState, current);
      },
      saveLocalScheduler: (questionId, schedulerPatch) => {
        if (!questionId) return;
        const current = readObject(keys.scheduler);
        const scheduler = normalizeScheduler(schedulerPatch);
        if (scheduler.type === 'fsrs') {
          current[questionId] = scheduler;
        } else {
          delete current[questionId];
        }
        writeObject(keys.scheduler, current);
      },
      saveLocalLearningSignals: (questionId, signalsPatch) => {
        if (!questionId) return;
        const current = readObject(keys.learningSignals);
        const signal = normalizeLearningSignals(signalsPatch);
        if (signal) {
          current[questionId] = signal;
        } else {
          delete current[questionId];
        }
        writeObject(keys.learningSignals, current);
      }
    };
  }

  function readObject(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function writeObject(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value && typeof value === 'object' ? value : {}));
    } catch (error) {
      // Local learning state is a progressive enhancement; storage failures must not block learning.
    }
  }

  function normalizeLearningState(value) {
    return ['mastered', 'review'].includes(value) ? value : 'unknown';
  }

  function normalizeScheduler(value) {
    if (!value || typeof value !== 'object') return { ...EMPTY_SCHEDULER };

    return {
      ...EMPTY_SCHEDULER,
      type: value.type === 'fsrs' ? 'fsrs' : null,
      version: value.version ? String(value.version) : null,
      stability: typeof value.stability === 'number' ? value.stability : null,
      difficulty: typeof value.difficulty === 'number' ? value.difficulty : null,
      nextReviewAt: dateIsoOrNull(value.nextReviewAt),
      repetitions: Math.max(0, Number(value.repetitions || 0)),
      lapses: Math.max(0, Number(value.lapses || 0)),
      lastRating: ['again', 'hard', 'good', 'easy'].includes(value.lastRating) ? value.lastRating : null,
      scheduledDays: typeof value.scheduledDays === 'number' ? value.scheduledDays : null,
      elapsedDays: typeof value.elapsedDays === 'number' ? value.elapsedDays : null,
      fsrsState: typeof value.fsrsState === 'number' ? value.fsrsState : null,
      learningSteps: typeof value.learningSteps === 'number' ? value.learningSteps : null,
      lastReviewAt: dateIsoOrNull(value.lastReviewAt)
    };
  }

  function normalizeLearningSignals(value) {
    if (!value || typeof value !== 'object' || value.answered !== true) return null;
    const answeredAt = dateIsoOrNull(value.answeredAt) || new Date().toISOString();
    return {
      answered: true,
      correct: Boolean(value.correct),
      firstAttemptCorrect: Boolean(value.firstAttemptCorrect),
      answerChanges: Math.max(0, Number(value.answerChanges || 0)),
      revealUsed: Boolean(value.revealUsed),
      answeredAt,
      responseTimeMs: Math.max(0, Number(value.responseTimeMs || 0))
    };
  }

  function dateIsoOrNull(value) {
    const date = dateOrNull(value);
    return date ? date.toISOString() : null;
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

  window.EHSLearningServices.StorageAdapter = {
    createLocalStorageAdapter,
    normalizeLearningState,
    normalizeScheduler,
    normalizeLearningSignals
  };
})();

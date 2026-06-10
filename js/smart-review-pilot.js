(function () {
  'use strict';

  const DATA_FILES = {
    questions: '../content/question-bank-pilot.json',
    topics: '../content/topic-map-pilot.json',
    lessons: '../content/lesson-map-pilot.json',
    sources: '../content/source-registry.json',
    citations: '../content/citation-registry-pilot.json'
  };

  const SERVICES = window.EHSLearningServices || {};
  const storageAdapter = SERVICES.StorageAdapter.createLocalStorageAdapter();

  const LEARNING_STATE_STORAGE_KEY = 'ehs.practiceHub.learningState.v1';
  const SCHEDULER_STORAGE_KEY = 'ehs.practiceHub.scheduler.v1';
  const LEARNING_STATE_SOURCE = 'practice-hub';
  const LEARNING_STATE_SCHEMA_VERSION = 2;
  const FSRS_VERSION = 'ts-fsrs@5.2.3';
  const FSRS_PILOT_QUESTION_IDS = new Set([
    'qb-pilot-prep-reactive-proactive',
    'qb-pilot-prep-hierarchy-controls',
    'qb-pilot-prep-safety-program-responsibility',
    'qb-pilot-prep-safety-trustee-role',
    'qb-pilot-summary-knesset-law'
  ]);
  const FSRS_RATING_LABELS = {
    again: 'צריך לחזור שוב',
    hard: 'הצלחתי בקושי',
    good: 'הצלחתי',
    easy: 'היה קל'
  };
  const FSRS_RATING_TO_STATE = {
    again: 'review',
    hard: 'mastered',
    good: 'mastered',
    easy: 'mastered'
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

  const DIFFICULTY_LABELS = {
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה'
  };

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

  let state = null;
  let pendingFeedback = '';
  let navigationLabels = null;
  let sourceDetails = null;
  let firebaseLearningState = {
    ready: false,
    user: null,
    api: null
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadData()
      .then((raw) => {
        state = buildState(raw);
        renderAll();
        bindRevealMode();
        bindLearningStateMode();
        bindFsrsMode();
        initPersistentLearningState();
      })
      .catch(renderError);
  });

  async function loadData() {
    return SERVICES.QuestionBank.loadJsonFiles(DATA_FILES, 'טעינת נתוני החזרה נכשלה.');
  }

  function buildState(raw) {
    const indexes = SERVICES.QuestionBank.createIndexes(raw);
    navigationLabels = SERVICES.NavigationLabels.createNavigationLabels({
      topicById: indexes.topicById,
      lessonById: indexes.lessonById,
      maxLessonTitleLength: 46
    });
    sourceDetails = SERVICES.SourceDetails.createSourceDetails({
      sourceById: indexes.sourceById,
      citationById: indexes.citationById
    });

    return {
      ...indexes,
      learningStates: loadLocalLearningStates(),
      schedulers: loadLocalSchedulers()
    };
  }

  function bindRevealMode() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-sr-reveal]');
      if (!button) return;

      const card = button.closest('.sr-card');
      const panel = card && card.querySelector('[data-sr-answer-panel]');
      if (!card || !panel) return;

      card.dataset.revealed = 'true';
      panel.hidden = false;
      button.hidden = true;
      panel.focus({ preventScroll: true });
    });
  }

  function bindLearningStateMode() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-sr-set-learning-state]');
      if (!button || !state) return;

      const questionId = button.dataset.srQuestionId;
      const value = button.dataset.srSetLearningState;
      if (!questionId || !['mastered', 'review'].includes(value)) return;

      setLearningState(questionId, value);
      pendingFeedback = value === 'mastered' ? 'השאלה הוסרה מתור החזרה' : '';
      renderAll();
    });
  }

  function bindFsrsMode() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-sr-fsrs-rating]');
      if (!button || !state) return;

      const questionId = button.dataset.srQuestionId;
      const rating = button.dataset.srFsrsRating;
      if (!questionId || !FSRS_RATING_LABELS[rating]) return;

      setFsrsRating(questionId, rating)
        .then(renderAll)
        .catch((error) => {
          const target = document.querySelector(`[data-sr-fsrs-status="${cssEscape(questionId)}"]`);
          if (target) target.textContent = `שגיאה בשמירת חזרה חכמה: ${error.message || error}`;
        });
    });
  }

  function renderAll() {
    renderSummary();
    renderFeedback();
    renderSections();
  }

  function renderFeedback() {
    const target = document.querySelector('[data-sr-feedback]');
    if (!target) return;
    target.hidden = !pendingFeedback;
    target.textContent = pendingFeedback;
    if (pendingFeedback) {
      window.setTimeout(() => {
        if (target.textContent === pendingFeedback) {
          pendingFeedback = '';
          target.hidden = true;
          target.textContent = '';
        }
      }, 3500);
    }
  }

  function renderSummary() {
    const target = document.querySelector('[data-sr-summary]');
    if (!target || !state) return;

    const dueNow = getDueNowQuestions();
    const dueLater = getDueLaterQuestions();
    const review = state.questions.filter((question) => getLearningState(question.questionId) === 'review');
    const fsrs = state.questions.filter((question) => getScheduler(question.questionId).type === 'fsrs');

    const cards = [
      [dueNow.length, 'לחזרה עכשיו'],
      [dueLater.length, 'לחזרה בהמשך'],
      [review.length, 'סומנו לחזרה'],
      [fsrs.length, 'עם חזרה חכמה']
    ];

    target.innerHTML = cards.map(([count, label]) => `
      <article class="sr-summary-card">
        <strong>${escapeHtml(count)}</strong>
        <span>${escapeHtml(label)}</span>
      </article>
    `).join('');
  }

  function renderSections() {
    const dueNow = getDueNowQuestions();
    const dueLater = getDueLaterQuestions();
    const nowTarget = document.querySelector('[data-sr-due-now]');
    const laterTarget = document.querySelector('[data-sr-due-later]');
    const laterPanel = document.querySelector('[data-sr-due-later-panel]');
    const emptyTarget = document.querySelector('[data-sr-empty]');

    if (nowTarget) nowTarget.innerHTML = dueNow.length ? dueNow.map(renderQuestionCard).join('') : renderSectionEmpty('אין שאלות שמועד החזרה שלהן הגיע.');
    if (laterTarget) laterTarget.innerHTML = dueLater.map(renderQuestionCard).join('');
    if (laterPanel) laterPanel.hidden = !dueLater.length;
    if (emptyTarget) emptyTarget.hidden = Boolean(dueNow.length || dueLater.length);
  }

  function getDueNowQuestions() {
    const now = new Date();
    return state.questions.filter((question) => {
      const learning = getLearningState(question.questionId);
      const scheduler = getScheduler(question.questionId);
      const due = dateOrNull(scheduler.nextReviewAt);
      return learning === 'review' || (scheduler.type === 'fsrs' && due && due <= now);
    });
  }

  function getDueLaterQuestions() {
    const now = new Date();
    return state.questions.filter((question) => {
      const scheduler = getScheduler(question.questionId);
      const due = dateOrNull(scheduler.nextReviewAt);
      return scheduler.type === 'fsrs' && due && due > now;
    });
  }

  function renderQuestionCard(question) {
    const questionId = question.questionId;
    const correctOptionId = question.correctAnswer && question.correctAnswer.optionId;
    const correctAnswer = question.correctAnswer || {};
    const scheduler = getScheduler(questionId);
    const isFsrs = scheduler.type === 'fsrs' || FSRS_PILOT_QUESTION_IDS.has(questionId);
    const dueLabel = dueReasonLabel(question);

    return `
      <article class="sr-card" data-sr-question-id="${escapeAttribute(questionId)}">
        <div class="sr-meta-row">
          <span class="sr-badge" data-kind="${scheduler.type === 'fsrs' ? 'fsrs' : 'review'}">${escapeHtml(dueLabel)}</span>
          <span class="sr-badge">${escapeHtml(difficultyLabel(question.difficulty))}</span>
          ${scheduler.type === 'fsrs' ? `<span class="sr-badge" data-kind="fsrs">${escapeHtml(fsrsStatusText(scheduler))}</span>` : ''}
        </div>
        <h3>${escapeHtml(question.questionText)}</h3>

        <ul class="sr-options">
          ${(question.options || []).map((option) => `
            <li class="sr-option" data-correct="${option.optionId === correctOptionId ? 'true' : 'false'}">
              <strong>${escapeHtml(option.optionId)}.</strong> ${escapeHtml(option.text)}
            </li>
          `).join('')}
        </ul>

        <button class="sr-button" data-primary="true" type="button" data-sr-reveal="${escapeAttribute(questionId)}">בדוק את עצמך</button>

        <section class="sr-answer-panel" data-sr-answer-panel hidden tabindex="-1" aria-label="תשובה והסבר">
          <p><strong>תשובה נכונה:</strong> ${escapeHtml(correctAnswer.answerText || correctAnswer.optionId || '')}</p>
          <p><strong>הסבר:</strong> ${escapeHtml(question.explanation || '')}</p>
          ${isFsrs ? renderFsrsControls(question) : renderLearningStateControls(question)}
          ${renderLearningLinks(question)}
          ${renderSourceDetails(question.answerProvenance || [])}
        </section>
      </article>
    `;
  }

  function renderFsrsControls(question) {
    const questionId = question.questionId;
    const scheduler = getScheduler(questionId);
    const disabled = fsrsRuntime() ? '' : 'disabled';

    return `
      <section class="sr-control-panel" data-kind="fsrs" aria-label="חזרה חכמה">
        <p>חזרה חכמה — דרג כמה היה קל לשלוף את התשובה.</p>
        <div class="sr-option-actions">
          ${Object.entries(FSRS_RATING_LABELS).map(([value, label]) => `
            <button class="sr-button" type="button" data-sr-fsrs-rating="${escapeAttribute(value)}" data-sr-question-id="${escapeAttribute(questionId)}" ${disabled}>
              ${escapeHtml(label)}
            </button>
          `).join('')}
        </div>
        <span class="sr-muted" data-sr-fsrs-status="${escapeAttribute(questionId)}">${escapeHtml(fsrsRuntime() ? fsrsStatusText(scheduler) : 'חזרה חכמה אינה זמינה בדפדפן הזה.')}</span>
      </section>
    `;
  }

  function renderLearningStateControls(question) {
    const questionId = question.questionId;
    return `
      <section class="sr-control-panel" aria-label="מצב למידה">
        <p>עדכן את מצב השאלה</p>
        <div class="sr-option-actions">
          <button class="sr-button" type="button" data-sr-set-learning-state="mastered" data-sr-question-id="${escapeAttribute(questionId)}">ידעתי</button>
          <button class="sr-button" type="button" data-sr-set-learning-state="review" data-sr-question-id="${escapeAttribute(questionId)}">צריך חזרה</button>
        </div>
      </section>
    `;
  }

  function renderLearningLinks(question) {
    return `
      <section class="sr-control-panel" aria-label="קישור ללמידה">
        <p>קשור ללמידה</p>
        <div class="sr-chip-row">
          ${(question.lessonIds || []).map((lessonId) => `<span class="sr-chip">${escapeHtml(lessonLabel(lessonId))}</span>`).join('')}
          ${(question.topicIds || []).map((topicId) => `<span class="sr-chip">${escapeHtml(topicLabel(topicId))}</span>`).join('')}
        </div>
      </section>
    `;
  }

  function renderSourceDetails(items) {
    if (!items.length) return '';
    return `
      <details class="sr-source-details">
        <summary>פרטי מקור</summary>
        <div class="sr-governance">
          ${items.map((item) => `
            <p>
              <strong>${escapeHtml(sourceRoleLabel(item))}:</strong>
              ${escapeHtml(sourceTitle(item.sourceId))}
              ${item.citationId ? ` | ${escapeHtml(citationLabel(item.citationId))}` : ''}
              | ${escapeHtml(authorityLabel(item.authorityLevel))}
              | ${escapeHtml(sourceStatusLabel(item))}
            </p>
          `).join('')}
        </div>
      </details>
    `;
  }

  function renderSectionEmpty(text) {
    return `<article class="sr-empty">${escapeHtml(text)}</article>`;
  }

  async function initPersistentLearningState() {
    try {
      const firebase = await import('./firebase-config.js');
      if (!firebase.auth || !firebase.db || typeof firebase.onAuthStateChanged !== 'function') return;

      firebaseLearningState.api = firebase;
      firebase.onAuthStateChanged(firebase.auth, async (user) => {
        firebaseLearningState.user = user || null;
        firebaseLearningState.ready = Boolean(user);
        if (!user) return;

        try {
          const persisted = await loadFirestoreLearningStates(user.uid);
          state.learningStates = persisted.learningStates;
          state.schedulers = persisted.schedulers;
          renderAll();
        } catch (error) {
          firebaseLearningState.ready = false;
        }
      });
    } catch (error) {
      firebaseLearningState.ready = false;
    }
  }

  async function loadFirestoreLearningStates(uid) {
    const firebase = firebaseLearningState.api;
    const snapshot = await firebase.getDocs(firebase.collection(firebase.db, 'users', uid, 'learningState'));
    const nextStates = {};
    const nextSchedulers = {};
    snapshot.forEach((item) => {
      const data = item.data();
      const questionId = data && data.questionId ? String(data.questionId) : item.id;
      const value = normalizeLearningState(data && data.state);
      if (value !== 'unknown') nextStates[questionId] = value;
      const scheduler = normalizeScheduler(data && data.scheduler);
      if (scheduler.type === 'fsrs') nextSchedulers[questionId] = scheduler;
    });
    return { learningStates: nextStates, schedulers: nextSchedulers };
  }

  function loadLocalLearningStates() {
    return storageAdapter.loadLocalLearningStates();
  }

  function saveLocalLearningState(questionId, value) {
    storageAdapter.saveLocalLearningState(questionId, { state: value });
  }

  function loadLocalSchedulers() {
    return storageAdapter.loadLocalSchedulers();
  }

  function saveLocalScheduler(questionId, scheduler) {
    storageAdapter.saveLocalScheduler(questionId, scheduler);
  }

  function getLearningState(questionId) {
    const value = state && questionId ? state.learningStates[questionId] : '';
    return normalizeLearningState(value);
  }

  function getScheduler(questionId) {
    return normalizeScheduler(state && questionId ? state.schedulers[questionId] : null);
  }

  function setLearningState(questionId, value) {
    const nextValue = normalizeLearningState(value);
    if (nextValue === 'unknown') {
      delete state.learningStates[questionId];
    } else {
      state.learningStates[questionId] = nextValue;
    }

    if (canUseFirestoreLearningState()) {
      saveFirestoreLearningState(questionId, nextValue).catch(() => {
        saveLocalLearningState(questionId, nextValue);
      });
      return;
    }

    saveLocalLearningState(questionId, nextValue);
  }

  async function setFsrsRating(questionId, rating) {
    const scheduler = calculateFsrsScheduler(questionId, rating);
    const nextState = FSRS_RATING_TO_STATE[rating] || 'unknown';

    if (nextState === 'unknown') {
      delete state.learningStates[questionId];
    } else {
      state.learningStates[questionId] = nextState;
    }
    state.schedulers[questionId] = scheduler;

    if (canUseFirestoreLearningState()) {
      try {
        await saveFirestoreLearningState(questionId, nextState, scheduler);
      } catch (error) {
        saveLocalLearningState(questionId, nextState);
        saveLocalScheduler(questionId, scheduler);
        throw error;
      }
    } else {
      saveLocalLearningState(questionId, nextState);
      saveLocalScheduler(questionId, scheduler);
    }
  }

  function calculateFsrsScheduler(questionId, rating) {
    const runtime = fsrsRuntime();
    if (!runtime) throw new Error('FSRS runtime is unavailable.');

    const now = new Date();
    const previous = getScheduler(questionId);
    const card = schedulerToFsrsCard(previous, now, runtime);
    const result = runtime.fsrs().next(card, now, runtime.Rating[ratingName(rating)]);
    return schedulerFromFsrsResult(result.card, rating, now);
  }

  function schedulerToFsrsCard(scheduler, now, runtime) {
    if (!scheduler || scheduler.type !== 'fsrs') return runtime.createEmptyCard(now);

    return {
      due: dateOrNow(scheduler.nextReviewAt, now),
      stability: numberOrZero(scheduler.stability),
      difficulty: numberOrZero(scheduler.difficulty),
      elapsed_days: nonNegativeNumber(scheduler.elapsedDays),
      scheduled_days: nonNegativeNumber(scheduler.scheduledDays),
      reps: nonNegativeNumber(scheduler.repetitions),
      lapses: nonNegativeNumber(scheduler.lapses),
      learning_steps: nonNegativeNumber(scheduler.learningSteps),
      state: typeof scheduler.fsrsState === 'number' ? scheduler.fsrsState : 0,
      last_review: scheduler.lastReviewAt ? dateOrNow(scheduler.lastReviewAt, now) : undefined
    };
  }

  function schedulerFromFsrsResult(card, rating, now) {
    return normalizeScheduler({
      type: 'fsrs',
      version: FSRS_VERSION,
      stability: card.stability,
      difficulty: card.difficulty,
      nextReviewAt: card.due,
      repetitions: card.reps,
      lapses: card.lapses,
      lastRating: rating,
      scheduledDays: card.scheduled_days,
      elapsedDays: card.elapsed_days,
      fsrsState: card.state,
      learningSteps: card.learning_steps,
      lastReviewAt: card.last_review || now
    });
  }

  async function saveFirestoreLearningState(questionId, value, schedulerOverride) {
    const firebase = firebaseLearningState.api;
    const uid = firebaseLearningState.user.uid;
    const currentState = normalizeLearningState(value);
    const previousDoc = await firebase.getDoc(firebase.doc(firebase.db, 'users', uid, 'learningState', questionId));
    const previous = previousDoc.exists() ? previousDoc.data() : {};
    const previousReviewCount = Number(previous.reviewCount || 0);
    const scheduler = schedulerOverride ? normalizeScheduler(schedulerOverride) : normalizeScheduler(previous.scheduler);

    await firebase.setDoc(firebase.doc(firebase.db, 'users', uid, 'learningState', questionId), {
      questionId,
      state: currentState,
      lastReviewedAt: firebase.serverTimestamp(),
      reviewCount: previousReviewCount + 1,
      updatedAt: firebase.serverTimestamp(),
      schemaVersion: LEARNING_STATE_SCHEMA_VERSION,
      scheduler: firestoreScheduler(scheduler),
      source: LEARNING_STATE_SOURCE
    }, { merge: true });
  }

  function canUseFirestoreLearningState() {
    return Boolean(firebaseLearningState.ready && firebaseLearningState.user && firebaseLearningState.api);
  }

  function fsrsRuntime() {
    const runtime = window.FSRS;
    if (!runtime || typeof runtime.fsrs !== 'function' || typeof runtime.createEmptyCard !== 'function') return null;
    if (!runtime.Rating) return null;
    return runtime;
  }

  function ratingName(rating) {
    return ({ again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' })[rating] || 'Good';
  }

  function dueReasonLabel(question) {
    const learning = getLearningState(question.questionId);
    const scheduler = getScheduler(question.questionId);
    const due = dateOrNull(scheduler.nextReviewAt);
    if (learning === 'review') return 'סומן לחזרה';
    if (scheduler.type === 'fsrs' && due && due <= new Date()) return 'הגיע זמן חזרה';
    if (scheduler.type === 'fsrs') return 'חזרה בהמשך';
    return 'חזרה';
  }

  function fsrsStatusText(scheduler) {
    if (!scheduler || scheduler.type !== 'fsrs' || !scheduler.nextReviewAt) return 'טרם נקבע מועד חזרה חכמה.';
    const due = dateOrNull(scheduler.nextReviewAt);
    const rating = FSRS_RATING_LABELS[scheduler.lastRating] || scheduler.lastRating || '';
    return `${reviewTimeLabel(due)}${rating ? ` | דירוג אחרון: ${rating}` : ''}`;
  }

  function reviewTimeLabel(date) {
    if (!date) return '';
    const now = new Date();
    if (date <= now) return 'זמן החזרה הגיע';
    const minutes = Math.ceil((date.getTime() - now.getTime()) / 60000);
    if (minutes < 60) return `לחזרה בעוד ${minutes} דקות`;
    if (isSameDay(date, now)) return 'לחזרה היום';
    const days = Math.ceil((date.getTime() - now.getTime()) / 86400000);
    if (days === 1) return 'לחזרה מחר';
    if (days < 8) return `לחזרה בעוד ${days} ימים`;
    return `לחזרה בתאריך ${date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  }

  function relativeDateLabel(date) {
    if (!date) return '';
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs <= 0) return 'עכשיו';
    const minutes = Math.ceil(diffMs / 60000);
    if (minutes < 60) return `בעוד ${minutes} דקות`;
    const hours = Math.ceil(minutes / 60);
    if (hours < 24) return `בעוד ${hours} שעות`;
    const days = Math.ceil(hours / 24);
    if (days === 1) return 'מחר';
    if (days < 8) return `בעוד ${days} ימים`;
    return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function isSameDay(first, second) {
    return first.getFullYear() === second.getFullYear()
      && first.getMonth() === second.getMonth()
      && first.getDate() === second.getDate();
  }

  function normalizeScheduler(value) {
    return SERVICES.StorageAdapter.normalizeScheduler(value);
  }

  function firestoreScheduler(scheduler) {
    return {
      ...scheduler,
      nextReviewAt: scheduler.nextReviewAt ? new Date(scheduler.nextReviewAt) : null,
      lastReviewAt: scheduler.lastReviewAt ? new Date(scheduler.lastReviewAt) : null
    };
  }

  function normalizeLearningState(value) {
    return SERVICES.StorageAdapter.normalizeLearningState(value);
  }

  function sourceRoleLabel(item) {
    return sourceDetails.sourceRoleLabel(item);
  }

  function sourceStatusLabel(item) {
    return sourceDetails.sourceStatusLabel(item);
  }

  function authorityLabel(level) {
    return SERVICES.SourceDetails.authorityLabel(level);
  }

  function sourceTitle(sourceId) {
    return sourceDetails.sourceTitle(sourceId);
  }

  function citationLabel(citationId) {
    return sourceDetails.citationLabel(citationId);
  }

  function lessonLabel(lessonId) {
    return navigationLabels.lessonLabel(lessonId);
  }

  function topicLabel(topicId) {
    return navigationLabels.topicLabel(topicId);
  }

  function lessonNumberFromId(lessonId) {
    return SERVICES.NavigationLabels.lessonNumberFromId(lessonId);
  }

  function difficultyLabel(value) {
    return DIFFICULTY_LABELS[value] || value || 'לא סווג';
  }

  function locatorLabel(locator) {
    return SERVICES.SourceDetails.locatorLabel(locator);
  }

  function cleanSourceTitle(title) {
    return SERVICES.SourceDetails.cleanSourceTitle(title);
  }

  function presentationTitle(value) {
    return SERVICES.NavigationLabels.presentationTitle(value);
  }

  function shortenTitle(title, maxLength) {
    return SERVICES.NavigationLabels.shortenTitle(title, maxLength);
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

  function dateOrNow(value, now) {
    return dateOrNull(value) || now;
  }

  function numberOrZero(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  function nonNegativeNumber(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value).replace(/"/g, '\\"');
  }

  function renderError(error) {
    const main = document.querySelector('#main');
    if (!main) return;
    main.insertAdjacentHTML('afterbegin', `
      <section class="sr-error" role="alert">
        <strong>טעינת Smart Review נכשלה.</strong>
        <p>${escapeHtml(error.message)}</p>
      </section>
    `);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }
})();

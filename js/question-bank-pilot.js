(function () {
  'use strict';

  const DATA_FILES = {
    questions: '../content/question-bank-pilot.json',
    topics: '../content/topic-map-pilot.json',
    lessons: '../content/lesson-map-pilot.json',
    sources: '../content/source-registry.json',
    citations: '../content/citation-registry-pilot.json'
  };

  const PAGE_SIZE = 10;
  const LEARNING_STATE_STORAGE_KEY = 'ehs.practiceHub.learningState.v1';
  const LEARNING_STATE_SOURCE = 'practice-hub';

  const LEARNING_STATE_LABELS = {
    unknown: 'לא סומן',
    mastered: 'ידעתי',
    review: 'צריך חזרה'
  };

  const DIFFICULTY_LABELS = {
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה'
  };

  const FACET_LABELS = {
    examRelevant: 'רלוונטי למבחן',
    examCritical: 'דגש קריטי',
    examTrap: 'מלכודת מבחן',
    goldenNumberRelated: 'קשור למספר זהב',
    legalBasisRequired: 'דורש בסיס משפטי',
    commonMistake: 'טעות נפוצה',
    calculation: 'חישוב',
    scenarioBased: 'תרחיש',
    regulationBased: 'מבוסס רגולציה',
    fieldPractice: 'יישום שטח',
    reviewOnly: 'סקירה בלבד'
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
  let firebaseLearningState = {
    ready: false,
    user: null,
    api: null
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadQuestionBank()
      .then((raw) => {
        state = buildState(raw);
        renderAll();
        bindFilters();
        bindRevealMode();
        bindBookmarkMode();
        bindLearningStateMode();
        bindPagination();
        initPersistentLearningState();
      })
      .catch(renderError);
  });

  async function loadQuestionBank() {
    const entries = await Promise.all(
      Object.entries(DATA_FILES).map(async ([key, file]) => {
        const response = await fetch(file, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('טעינת קובץ הפיילוט נכשלה.');
        }
        return [key, await response.json()];
      })
    );

    return Object.fromEntries(entries);
  }

  function buildState(raw) {
    const data = raw.questions || {};
    const questions = Array.isArray(data.questions) ? data.questions : [];
    const topics = raw.topics && Array.isArray(raw.topics.topics) ? raw.topics.topics : [];
    const lessons = raw.lessons && Array.isArray(raw.lessons.lessonMappings) ? raw.lessons.lessonMappings : [];
    const sources = raw.sources && Array.isArray(raw.sources.entries) ? raw.sources.entries : [];
    const citations = raw.citations && Array.isArray(raw.citations.citations) ? raw.citations.citations : [];

    return {
      data,
      questions,
      topicById: new Map(topics.map((topic) => [topic.topicId, topic])),
      lessonById: new Map(lessons.map((lesson) => [lesson.lessonId, lesson])),
      sourceById: new Map(sources.map((source) => [source.stableSourceId, source])),
      citationById: new Map(citations.map((citation) => [citation.citationId, citation])),
      filters: {
        search: '',
        topic: '',
        lesson: '',
        difficulty: '',
        examRelevant: '',
        examCritical: '',
        learningState: ''
      },
      pagination: {
        page: 1,
        pageSize: PAGE_SIZE
      },
      learningStates: loadLocalLearningStates()
    };
  }

  function bindFilters() {
    const selectors = [
      '[data-qb-search]',
      '[data-qb-filter-topic]',
      '[data-qb-filter-lesson]',
      '[data-qb-filter-difficulty]',
      '[data-qb-filter-exam-relevant]',
      '[data-qb-filter-exam-critical]',
      '[data-qb-filter-learning-state]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) continue;
      element.addEventListener('input', handleFilterChange);
      element.addEventListener('change', handleFilterChange);
    }
  }

  function handleFilterChange() {
    state.pagination.page = 1;
    renderQuestions();
  }

  function bindRevealMode() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-qb-reveal]');
      if (!button) return;

      const card = button.closest('.qb-card');
      const panel = card && card.querySelector('[data-qb-answer-panel]');
      const prompt = card && card.querySelector('[data-qb-reveal-prompt]');
      if (!card || !panel) return;

      card.dataset.revealed = 'true';
      panel.hidden = false;
      button.hidden = true;
      if (prompt) prompt.hidden = true;
      panel.focus({ preventScroll: true });
    });
  }

  function bindBookmarkMode() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-qb-bookmark]');
      if (!button) return;

      const isPressed = button.getAttribute('aria-pressed') === 'true';
      button.setAttribute('aria-pressed', String(!isPressed));
      button.textContent = isPressed ? '⭐ שמור לעיון' : '★ נשמר לעיון';
    });
  }

  function bindLearningStateMode() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-qb-set-learning-state]');
      if (!button || !state) return;

      const questionId = button.dataset.qbQuestionId;
      const value = button.dataset.qbSetLearningState;
      if (!questionId || !['mastered', 'review'].includes(value)) return;

      const current = getLearningState(questionId);
      const next = current === value ? 'unknown' : value;
      setLearningState(questionId, next);

      if (state.filters.learningState) {
        renderLearningDashboard();
        renderQuestions();
        return;
      }

      updateLearningStateControls(questionId);
      renderLearningDashboard();
    });
  }

  function bindPagination() {
    document.addEventListener('click', (event) => {
      const actionButton = event.target.closest('[data-qb-page-action]');
      const numberButton = event.target.closest('[data-qb-page-number]');
      if (!actionButton && !numberButton) return;

      if (actionButton) {
        const action = actionButton.dataset.qbPageAction;
        if (action === 'previous') state.pagination.page -= 1;
        if (action === 'next') state.pagination.page += 1;
      }

      if (numberButton) {
        state.pagination.page = Number(numberButton.dataset.qbPageNumber) || 1;
      }

      renderQuestions();
      document.querySelector('[data-qb-questions]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function renderAll() {
    renderSummary();
    renderLearningDashboard();
    renderFilterOptions();
    renderQuestions();
  }

  function renderLearningDashboard() {
    const target = document.querySelector('[data-qb-learning-dashboard]');
    if (!target || !state) return;

    const counts = countLearningStates(state.questions);
    const cards = [
      [counts.mastered, 'ידעתי'],
      [counts.review, 'צריך חזרה'],
      [counts.unknown, 'לא סומנו']
    ];

    target.innerHTML = cards.map(([count, label]) => `
      <article class="qb-state-card">
        <strong>${escapeHtml(count)}</strong>
        <span>${escapeHtml(label)}</span>
      </article>
    `).join('');
  }

  function renderSummary() {
    const target = document.querySelector('[data-qb-summary]');
    if (!target || !state) return;

    const questions = getFilteredQuestions();
    const topics = unique(flatMap(questions, (question) => question.topicIds || []));
    const lessons = unique(flatMap(questions, (question) => question.lessonIds || []));
    const difficulties = countBy(questions, (question) => question.difficulty || 'unknown');
    const provenanceCount = questions.reduce((sum, question) => sum + (question.answerProvenance || []).length, 0);

    const cards = [
      [questions.length, 'שאלות בתצוגה'],
      [topics.length, 'נושאים'],
      [lessons.length, 'שיעורים'],
      [provenanceCount, 'הפניות מקור'],
      [difficulties.easy || 0, 'קלות'],
      [difficulties.medium || 0, 'בינוניות'],
      [difficulties.hard || 0, 'קשות']
    ];

    target.innerHTML = cards.map(([count, label]) => `
      <article class="qb-summary-card">
        <strong>${escapeHtml(count)}</strong>
        <span>${escapeHtml(label)}</span>
      </article>
    `).join('');
  }

  function renderFilterOptions() {
    if (!state) return;

    const topics = unique(flatMap(state.questions, (question) => question.topicIds || [])).sort();
    const lessons = unique(flatMap(state.questions, (question) => question.lessonIds || [])).sort();
    const difficulties = unique(state.questions.map((question) => question.difficulty || '').filter(Boolean)).sort();

    setOptions('[data-qb-filter-topic]', topics, 'כל הנושאים', topicLabel);
    setOptions('[data-qb-filter-lesson]', lessons, 'כל השיעורים', lessonLabel);
    setOptions('[data-qb-filter-difficulty]', difficulties, 'כל הרמות', (value) => DIFFICULTY_LABELS[value] || value);
  }

  function renderQuestions() {
    const target = document.querySelector('[data-qb-questions]');
    if (!target || !state) return;

    state.filters = readFiltersFromDom();
    const filtered = getFilteredQuestions();
    renderSummary();

    if (!filtered.length) {
      target.innerHTML = '<article class="qb-empty">לא נמצאו שאלות מתאימות לסינון הנוכחי.</article>';
      renderPagination(filtered.length);
      return;
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / state.pagination.pageSize));
    state.pagination.page = clamp(state.pagination.page, 1, totalPages);
    const start = (state.pagination.page - 1) * state.pagination.pageSize;
    const pageQuestions = filtered.slice(start, start + state.pagination.pageSize);

    target.innerHTML = pageQuestions
      .map((question, index) => renderQuestionCard(question, start + index))
      .join('');
    renderPagination(filtered.length);
  }

  function getFilteredQuestions() {
    return state.questions.filter(matchesFilters);
  }

  function renderPagination(totalItems) {
    const target = document.querySelector('[data-qb-pagination]');
    if (!target || !state) return;

    const pageSize = state.pagination.pageSize;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) {
      target.hidden = true;
      target.innerHTML = '';
      return;
    }

    target.hidden = false;
    const currentPage = clamp(state.pagination.page, 1, totalPages);
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

    target.innerHTML = `
      <button class="qb-page-button" type="button" data-qb-page-action="previous" ${currentPage === 1 ? 'disabled' : ''}>עמוד קודם</button>
      <span class="qb-page-status">${escapeHtml(startItem)}-${escapeHtml(endItem)} מתוך ${escapeHtml(totalItems)}</span>
      <div class="qb-badge-row" aria-label="מספרי עמודים">
        ${pageNumbers.map((pageNumber) => `
          <button class="qb-page-number" type="button" data-qb-page-number="${escapeAttribute(pageNumber)}" ${pageNumber === currentPage ? 'aria-current="page"' : ''}>
            ${escapeHtml(pageNumber)}
          </button>
        `).join('')}
      </div>
      <button class="qb-page-button" type="button" data-qb-page-action="next" ${currentPage === totalPages ? 'disabled' : ''}>עמוד הבא</button>
    `;
  }

  function readFiltersFromDom() {
    return {
      search: document.querySelector('[data-qb-search]')?.value || '',
      topic: document.querySelector('[data-qb-filter-topic]')?.value || '',
      lesson: document.querySelector('[data-qb-filter-lesson]')?.value || '',
      difficulty: document.querySelector('[data-qb-filter-difficulty]')?.value || '',
      examRelevant: document.querySelector('[data-qb-filter-exam-relevant]')?.value || '',
      examCritical: document.querySelector('[data-qb-filter-exam-critical]')?.value || '',
      learningState: document.querySelector('[data-qb-filter-learning-state]')?.value || ''
    };
  }

  function matchesFilters(question) {
    const filters = state.filters;
    const text = normalize([
      question.questionText,
      question.explanation,
      ...(question.topicIds || []),
      ...(question.lessonIds || []),
      ...(question.topicIds || []).map(topicLabel),
      ...(question.lessonIds || []).map(lessonLabel)
    ].join(' '));

    if (filters.search && !text.includes(normalize(filters.search))) return false;
    if (filters.topic && !(question.topicIds || []).includes(filters.topic)) return false;
    if (filters.lesson && !(question.lessonIds || []).includes(filters.lesson)) return false;
    if (filters.difficulty && question.difficulty !== filters.difficulty) return false;
    if (filters.examRelevant && String(Boolean(question.examFacets && question.examFacets.examRelevant)) !== filters.examRelevant) return false;
    if (filters.examCritical && String(Boolean(question.examFacets && question.examFacets.examCritical)) !== filters.examCritical) return false;
    if (filters.learningState && getLearningState(question.questionId) !== filters.learningState) return false;
    return true;
  }

  function renderQuestionCard(question, index) {
    const correctOptionId = question.correctAnswer && question.correctAnswer.optionId;
    const correctAnswer = question.correctAnswer || {};
    const provenance = Array.isArray(question.answerProvenance) ? question.answerProvenance : [];
    const facets = activeFacets(question.examFacets);

    return `
      <article class="qb-card">
        <div class="qb-meta-row">
          <span class="qb-badge">שאלה ${escapeHtml(index + 1)}</span>
          <span class="qb-badge">${escapeHtml(difficultyLabel(question.difficulty))}</span>
          <span class="qb-badge" data-kind="source-backed">${escapeHtml(statusLabel(question.verification && question.verification.status))}</span>
          ${originBadge(question.origin)}
        </div>
        <h3>${escapeHtml(question.questionText)}</h3>

        <ul class="qb-options">
          ${(question.options || []).map((option) => `
            <li class="qb-option" data-correct="${option.optionId === correctOptionId ? 'true' : 'false'}">
              <strong>${escapeHtml(option.optionId)}.</strong> ${escapeHtml(option.text)}
            </li>
          `).join('')}
        </ul>

        <div class="qb-card-actions">
          <button class="qb-bookmark-button" type="button" data-qb-bookmark="${escapeAttribute(question.questionId || String(index))}" aria-pressed="false">
            ⭐ שמור לעיון
          </button>
        </div>

        <div class="qb-reveal-prompt" data-qb-reveal-prompt>
          <strong>🤔 חשוב לפני שאתה מגלה את התשובה</strong>
          <span>נסה לבחור תשובה בעצמך ורק אז בדוק את ההסבר והמקור.</span>
        </div>
        <button class="qb-reveal-button" type="button" data-qb-reveal="${escapeAttribute(question.questionId || String(index))}">
          בדוק את עצמך
        </button>

        <section class="qb-answer-panel" data-qb-answer-panel hidden tabindex="-1" aria-label="תשובה והסבר">
          <p><strong>תשובה נכונה:</strong> ${escapeHtml(correctAnswer.answerText || correctAnswer.optionId || '')}</p>
          <p><strong>הסבר:</strong> ${escapeHtml(question.explanation || '')}</p>

          ${renderLearningStateControls(question)}

          <section class="qb-learning-nav" aria-label="קשור ללמידה">
            <p class="qb-section-title">קשור ללמידה</p>
            <div class="qb-nav-group">
              <strong>📚 שיעורים קשורים</strong>
              <div class="qb-link-grid">
                ${(question.lessonIds || []).map(renderLessonLink).join('')}
              </div>
            </div>
            <div class="qb-nav-group">
              <strong>🏷️ נושאים קשורים</strong>
              <div class="qb-link-grid">
                ${(question.topicIds || []).map(renderTopicLink).join('')}
              </div>
            </div>
          </section>

          <p class="qb-section-title">Facets למבחן</p>
          <div class="qb-badge-row">
            ${facets.length ? facets.map((facet) => `<span class="qb-badge" data-kind="exam">${escapeHtml(facet)}</span>`).join('') : '<span class="qb-badge">אין Facets פעילים</span>'}
          </div>

          <details class="qb-source-details">
            <summary>פרטי מקור</summary>
            <section class="qb-governance" aria-label="עקיבות מקור">
              ${renderSourceDetails(provenance)}
            </section>
          </details>
        </section>
      </article>
    `;
  }

  function renderLearningStateControls(question) {
    const questionId = question.questionId || '';
    const current = getLearningState(questionId);

    return `
      <section class="qb-learning-state-control" data-qb-learning-state-panel="${escapeAttribute(questionId)}" aria-label="מצב למידה לשאלה">
        <p>סמן לעצמך להמשך תרגול</p>
        <div class="qb-state-actions">
          <button class="qb-state-button" type="button" data-state-value="mastered" data-qb-set-learning-state="mastered" data-qb-question-id="${escapeAttribute(questionId)}" aria-pressed="${current === 'mastered'}">
            👍 ידעתי
          </button>
          <button class="qb-state-button" type="button" data-state-value="review" data-qb-set-learning-state="review" data-qb-question-id="${escapeAttribute(questionId)}" aria-pressed="${current === 'review'}">
            👎 צריך חזרה
          </button>
        </div>
        <span class="qb-state-current" data-qb-learning-state-current="${escapeAttribute(questionId)}">${escapeHtml(learningStateDisplay(current))}</span>
      </section>
    `;
  }

  function renderSourceDetails(provenance) {
    if (!provenance.length) {
      return '<div class="qb-governance-row"><strong>מקור</strong><span>לא נמצא מקור לשאלה זו</span></div>';
    }

    return provenance.map((item) => `
      <div class="qb-governance-row">
        <strong>${escapeHtml(sourceRoleLabel(item))}</strong>
        <span>${escapeHtml(sourceTitle(item.sourceId))}</span>
      </div>
      <div class="qb-governance-row">
        <strong>הפניה</strong>
        <span>${escapeHtml(citationLabel(item.citationId))}</span>
      </div>
      <div class="qb-governance-row">
        <strong>רמת סמכות</strong>
        <span>${authorityBadge(item)}</span>
      </div>
      <div class="qb-governance-row">
        <strong>סטטוס אימות</strong>
        <span>${escapeHtml(sourceStatusLabel(item))}</span>
      </div>
    `).join('');
  }

  function renderLessonLink(lessonId) {
    return `
      <a class="qb-link-chip" href="${escapeAttribute(lessonHref(lessonId))}" data-lesson-id="${escapeAttribute(lessonId)}">
        ${escapeHtml(lessonLabel(lessonId))}
      </a>
    `;
  }

  function renderTopicLink(topicId) {
    return `
      <a class="qb-link-chip" href="${escapeAttribute(topicHref(topicId))}" data-topic-id="${escapeAttribute(topicId)}">
        ${escapeHtml(topicLabel(topicId))}
      </a>
    `;
  }

  function originBadge(origin) {
    const source = origin && origin.legacySource ? origin.legacySource : 'pilot';
    return `<span class="qb-badge">מקור: ${escapeHtml(source)}</span>`;
  }

  function authorityBadge(item) {
    const level = Number(item.authorityLevel);
    const kind = level === 1 ? 'legal' : level === 4 ? 'standard' : 'training';
    const label = AUTHORITY_LABELS[level] || `רמה ${level || 'לא ידועה'}`;
    return `<span class="qb-badge" data-kind="${kind}">${escapeHtml(label)}</span>`;
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

  function sourceTitle(sourceId) {
    if (SOURCE_DISPLAY_LABELS[sourceId]) return SOURCE_DISPLAY_LABELS[sourceId];
    const source = state && state.sourceById ? state.sourceById.get(sourceId) : null;
    if (!source) return 'מקור לא מזוהה';
    return cleanSourceTitle(source.title || source.stableSourceId);
  }

  function citationLabel(citationId) {
    const citation = state && state.citationById ? state.citationById.get(citationId) : null;
    if (!citation) return 'הפניה לא מזוהה';
    return citation.label || locatorLabel(citation.locator) || 'הפניה במקור';
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

  function activeFacets(facets) {
    return Object.entries(facets || {})
      .filter(([, value]) => value === true)
      .map(([key]) => FACET_LABELS[key] || key);
  }

  function setOptions(selector, values, allLabel, labelFor) {
    const target = document.querySelector(selector);
    if (!target) return;
    const current = target.value;
    target.innerHTML = [
      `<option value="">${escapeHtml(allLabel)}</option>`,
      ...values.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(labelFor(value))}</option>`)
    ].join('');
    target.value = values.includes(current) ? current : '';
  }

  function lessonLabel(lessonId) {
    const lesson = state && state.lessonById ? state.lessonById.get(lessonId) : null;
    const lessonNumber = lessonNumberFromId(lessonId);
    if (!lesson) {
      return lessonNumber ? `📚 שיעור ${lessonNumber}` : '📚 שיעור';
    }
    const shortTitle = shortenTitle(lesson.title || '', 46);
    return lessonNumber ? `📚 שיעור ${lessonNumber} – ${shortTitle}` : `📚 ${shortTitle}`;
  }

  function topicLabel(topicId) {
    const topic = state && state.topicById ? state.topicById.get(topicId) : null;
    return `🏷️ ${topic ? presentationTitle(topic.title) : 'נושא קשור'}`;
  }

  function lessonHref(lessonId) {
    return `learning-path.html#${encodeURIComponent(lessonId)}`;
  }

  function topicHref(topicId) {
    // TODO: Replace this placeholder with a true Knowledge Hub deep-link when URL-state opening is supported.
    return `knowledge-hub-pilot.html?topic=${encodeURIComponent(topicId)}`;
  }

  function difficultyLabel(value) {
    return DIFFICULTY_LABELS[value] || value || 'לא סווג';
  }

  function statusLabel(status) {
    if (status === 'source-backed') return 'מבוסס מקור';
    if (status === 'verified') return 'מאומת';
    if (status === 'unverified') return 'לא מאומת';
    return status || 'לא ידוע';
  }

  function lessonNumberFromId(lessonId) {
    const match = String(lessonId || '').match(/lesson-(\d+)/);
    return match ? String(Number(match[1])) : '';
  }

  function shortenTitle(title, maxLength) {
    const value = String(title || '').trim();
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1).trim()}…`;
  }

  function presentationTitle(value) {
    return String(value || '').trim();
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function flatMap(values, mapper) {
    return values.reduce((result, value) => result.concat(mapper(value)), []);
  }

  function countBy(values, mapper) {
    return values.reduce((counts, value) => {
      const key = mapper(value);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
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
          state.learningStates = await loadFirestoreLearningStates(user.uid);
          renderLearningDashboard();
          renderQuestions();
        } catch (error) {
          firebaseLearningState.ready = false;
          // Firestore is an enhancement; localStorage remains the fallback when unavailable.
        }
      });
    } catch (error) {
      firebaseLearningState.ready = false;
      // Auth/Firestore may be blocked by CSP, offline mode, or local file use. Keep local fallback.
    }
  }

  async function loadFirestoreLearningStates(uid) {
    const firebase = firebaseLearningState.api;
    const snapshot = await firebase.getDocs(firebase.collection(firebase.db, 'users', uid, 'learningState'));
    const nextStates = {};
    snapshot.forEach((item) => {
      const data = item.data();
      const questionId = data && data.questionId ? String(data.questionId) : item.id;
      const value = normalizeLearningState(data && data.state);
      if (value !== 'unknown') nextStates[questionId] = value;
    });
    return nextStates;
  }

  function loadLocalLearningStates() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LEARNING_STATE_STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function saveLearningStates() {
    try {
      localStorage.setItem(LEARNING_STATE_STORAGE_KEY, JSON.stringify(state.learningStates));
    } catch (error) {
      // Learning state is a pilot enhancement; failure to persist should not block practice.
    }
  }

  function getLearningState(questionId) {
    const value = state && questionId ? state.learningStates[questionId] : '';
    return normalizeLearningState(value);
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
        saveLearningStates();
      });
      return;
    }

    saveLearningStates();
  }

  function canUseFirestoreLearningState() {
    return Boolean(firebaseLearningState.ready && firebaseLearningState.user && firebaseLearningState.api);
  }

  async function saveFirestoreLearningState(questionId, value) {
    const firebase = firebaseLearningState.api;
    const uid = firebaseLearningState.user.uid;
    const currentState = normalizeLearningState(value);
    const previousDoc = await firebase.getDoc(firebase.doc(firebase.db, 'users', uid, 'learningState', questionId));
    const previous = previousDoc.exists() ? previousDoc.data() : {};
    const previousReviewCount = Number(previous.reviewCount || 0);

    await firebase.setDoc(firebase.doc(firebase.db, 'users', uid, 'learningState', questionId), {
      questionId,
      state: currentState,
      lastReviewedAt: firebase.serverTimestamp(),
      reviewCount: previousReviewCount + 1,
      updatedAt: firebase.serverTimestamp(),
      source: LEARNING_STATE_SOURCE
    }, { merge: true });
  }

  function normalizeLearningState(value) {
    return ['mastered', 'review'].includes(value) ? value : 'unknown';
  }

  function countLearningStates(questions) {
    return questions.reduce((counts, question) => {
      const value = getLearningState(question.questionId);
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    }, { mastered: 0, review: 0, unknown: 0 });
  }

  function learningStateDisplay(value) {
    if (value === 'mastered') return '✓ ידעתי';
    if (value === 'review') return '⚠ מסומן לחזרה';
    return LEARNING_STATE_LABELS.unknown;
  }

  function updateLearningStateControls(questionId) {
    const current = getLearningState(questionId);
    const panel = document.querySelector(`[data-qb-learning-state-panel="${cssEscape(questionId)}"]`);
    if (!panel) return;

    for (const button of panel.querySelectorAll('[data-qb-set-learning-state]')) {
      button.setAttribute('aria-pressed', String(button.dataset.qbSetLearningState === current));
    }

    const label = panel.querySelector('[data-qb-learning-state-current]');
    if (label) label.textContent = learningStateDisplay(current);
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value).replace(/"/g, '\\"');
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function renderError(error) {
    const main = document.querySelector('#main');
    if (!main) return;
    main.insertAdjacentHTML('afterbegin', `
      <section class="qb-error" role="alert">
        <strong>טעינת הפיילוט נכשלה.</strong>
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

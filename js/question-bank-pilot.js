(function () {
  'use strict';

  const DATA_FILES = {
    questions: '../content/question-bank-pilot.json',
    topics: '../content/topic-map-pilot.json',
    lessons: '../content/lesson-map-pilot.json'
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

  let state = null;

  document.addEventListener('DOMContentLoaded', () => {
    loadQuestionBank()
      .then((raw) => {
        state = buildState(raw);
        renderAll();
        bindFilters();
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

    return {
      data,
      questions,
      topicById: new Map(topics.map((topic) => [topic.topicId, topic])),
      lessonById: new Map(lessons.map((lesson) => [lesson.lessonId, lesson])),
      filters: {
        search: '',
        topic: '',
        lesson: '',
        difficulty: '',
        examRelevant: '',
        examCritical: ''
      }
    };
  }

  function bindFilters() {
    const selectors = [
      '[data-qb-search]',
      '[data-qb-filter-topic]',
      '[data-qb-filter-lesson]',
      '[data-qb-filter-difficulty]',
      '[data-qb-filter-exam-relevant]',
      '[data-qb-filter-exam-critical]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) continue;
      element.addEventListener('input', renderQuestions);
      element.addEventListener('change', renderQuestions);
    }
  }

  function renderAll() {
    renderSummary();
    renderFilterOptions();
    renderQuestions();
  }

  function renderSummary() {
    const target = document.querySelector('[data-qb-summary]');
    if (!target || !state) return;

    const questions = state.questions;
    const topics = unique(flatMap(questions, (question) => question.topicIds || []));
    const lessons = unique(flatMap(questions, (question) => question.lessonIds || []));
    const difficulties = countBy(questions, (question) => question.difficulty || 'unknown');
    const provenanceCount = questions.reduce((sum, question) => sum + (question.answerProvenance || []).length, 0);

    const cards = [
      [questions.length, 'שאלות בפיילוט'],
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
    const filtered = state.questions.filter(matchesFilters);
    if (!filtered.length) {
      target.innerHTML = '<article class="qb-empty">לא נמצאו שאלות מתאימות לסינון הנוכחי.</article>';
      return;
    }

    target.innerHTML = filtered.map(renderQuestionCard).join('');
  }

  function readFiltersFromDom() {
    return {
      search: document.querySelector('[data-qb-search]')?.value || '',
      topic: document.querySelector('[data-qb-filter-topic]')?.value || '',
      lesson: document.querySelector('[data-qb-filter-lesson]')?.value || '',
      difficulty: document.querySelector('[data-qb-filter-difficulty]')?.value || '',
      examRelevant: document.querySelector('[data-qb-filter-exam-relevant]')?.value || '',
      examCritical: document.querySelector('[data-qb-filter-exam-critical]')?.value || ''
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

        <p><strong>תשובה נכונה:</strong> ${escapeHtml(correctAnswer.answerText || correctAnswer.optionId || '')}</p>
        <p><strong>הסבר:</strong> ${escapeHtml(question.explanation || '')}</p>

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

        <section class="qb-governance" aria-label="עקיבות מקור">
          <div class="qb-governance-row">
            <strong>sourceId</strong>
            <span>${escapeHtml(provenance.map((item) => item.sourceId).join(', ') || 'חסר')}</span>
          </div>
          <div class="qb-governance-row">
            <strong>citationId</strong>
            <span>${escapeHtml(provenance.map((item) => item.citationId).join(', ') || 'חסר')}</span>
          </div>
          <div class="qb-governance-row">
            <strong>רמת סמכות</strong>
            <span>${provenance.map(authorityBadge).join(' ') || 'חסר'}</span>
          </div>
          <div class="qb-governance-row">
            <strong>סטטוס אימות</strong>
            <span>${escapeHtml(provenance.map((item) => statusLabel(item.verificationStatus)).join(', ') || 'חסר')}</span>
          </div>
        </section>
      </article>
    `;
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
    return `<span class="qb-badge" data-kind="${kind}">${escapeHtml(label)} (${escapeHtml(level || '')})</span>`;
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

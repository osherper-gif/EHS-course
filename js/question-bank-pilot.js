(function () {
  'use strict';

  const DATA_FILE = '../content/question-bank-pilot.json';
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
      .then((data) => {
        state = buildState(data);
        renderAll();
        bindFilters();
      })
      .catch(renderError);
  });

  async function loadQuestionBank() {
    const response = await fetch(DATA_FILE, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('טעינת קובץ שאלות הפיילוט נכשלה.');
    }
    return response.json();
  }

  function buildState(data) {
    const questions = Array.isArray(data.questions) ? data.questions : [];
    return {
      data,
      questions,
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
    const bindings = [
      ['[data-qb-search]', 'search'],
      ['[data-qb-filter-topic]', 'topic'],
      ['[data-qb-filter-lesson]', 'lesson'],
      ['[data-qb-filter-difficulty]', 'difficulty'],
      ['[data-qb-filter-exam-relevant]', 'examRelevant'],
      ['[data-qb-filter-exam-critical]', 'examCritical']
    ];

    for (const [selector, key] of bindings) {
      const element = document.querySelector(selector);
      if (!element) continue;
      element.addEventListener('input', () => {
        renderQuestions();
      });
      element.addEventListener('change', () => {
        renderQuestions();
      });
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

    setOptions('[data-qb-filter-topic]', topics, 'כל הנושאים', (value) => value);
    setOptions('[data-qb-filter-lesson]', lessons, 'כל השיעורים', (value) => value);
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
      ...(question.lessonIds || [])
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

        <p class="qb-section-title">שיוך לימודי</p>
        <div class="qb-badge-row">
          ${(question.topicIds || []).map((topicId) => `<span class="qb-badge">${escapeHtml(topicId)}</span>`).join('')}
          ${(question.lessonIds || []).map((lessonId) => `<span class="qb-badge">${escapeHtml(lessonId)}</span>`).join('')}
        </div>

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

  function difficultyLabel(value) {
    return DIFFICULTY_LABELS[value] || value || 'לא סווג';
  }

  function statusLabel(status) {
    if (status === 'source-backed') return 'מבוסס מקור';
    if (status === 'verified') return 'מאומת';
    if (status === 'unverified') return 'לא מאומת';
    return status || 'לא ידוע';
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

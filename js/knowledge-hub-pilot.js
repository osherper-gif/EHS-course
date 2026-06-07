(function () {
  'use strict';

  const DATA_FILES = {
    sources: '../content/source-registry.json',
    citations: '../content/citation-registry-pilot.json',
    blocks: '../content/content-blocks-pilot.json',
    topics: '../content/topic-map-pilot.json',
    lessons: '../content/lesson-map-pilot.json',
    golden: '../content/golden-numbers-pilot.json',
    questions: '../content/question-items-pilot.json'
  };

  const BLOCK_TYPE_LABELS = {
    heading: 'כותרת ידע',
    paragraph: 'הסבר לימודי',
    'legal-note': 'דגש משפטי',
    'legal-quote': 'הפניה משפטית',
    checklist: 'צ׳קליסט',
    'exam-focus': 'דגש מבחן',
    warning: 'אזהרה',
    definition: 'מונח מרכזי',
    'summary-box': 'סיכום קצר'
  };

  const LEGAL_WORD_NUMBERING = /^\s*(?:סעיף|תקנה|צו|תקן)\s+\S+/;
  const WORD_NUMBERING = /^\s*(?:פרק\s+\d+|(?:\d+\.)+\d+|\d+\s*[.)])\s*/;

  let pilotState = null;

  document.addEventListener('DOMContentLoaded', () => {
    loadPilotData()
      .then((data) => {
        pilotState = buildState(data);
        renderPilot(pilotState);
        setupSearch(pilotState);
      })
      .catch(renderError);

    document.addEventListener('click', handlePageClick);
    document.querySelector('[data-kh-back-topics]')?.addEventListener('click', closeTopicDetail);
  });

  async function loadPilotData() {
    const entries = await Promise.all(
      Object.entries(DATA_FILES).map(async ([key, path]) => {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`טעינת קובץ הפיילוט נכשלה: ${path}`);
        }
        return [key, await response.json()];
      })
    );

    const raw = Object.fromEntries(entries);
    return {
      sources: raw.sources.entries || raw.sources.sources || [],
      citations: raw.citations.citations || [],
      blocks: raw.blocks.contentBlocks || [],
      topics: raw.topics.topics || [],
      lessons: raw.lessons.lessonMappings || [],
      golden: raw.golden.goldenNumbers || [],
      questions: raw.questions.questionItems || []
    };
  }

  function buildState(data) {
    return {
      data,
      sourceById: new Map(data.sources.map((source) => [source.stableSourceId, source])),
      citationById: new Map(data.citations.map((citation) => [citation.citationId, citation])),
      topicById: new Map(data.topics.map((topic) => [topic.topicId, topic])),
      blockById: new Map(data.blocks.map((block) => [block.blockId, block]))
    };
  }

  function renderPilot(state) {
    renderSummary(state);
    renderTopicCards(state);
  }

  function renderSummary(state) {
    const target = document.querySelector('[data-kh-summary]');
    if (!target) return;

    const { data } = state;
    const rootTopics = getRootTopics(data.topics);
    const summary = [
      [rootTopics.length, 'נושאים מרכזיים'],
      [data.topics.filter((topic) => topic.parentTopicId).length, 'תתי נושאים'],
      [data.blocks.length, 'פריטי תוכן'],
      [data.blocks.filter(isExamBlock).length, 'דגשי מבחן'],
      [data.blocks.filter(isLegalBlock).length, 'דגשים משפטיים'],
      [data.golden.filter((item) => item.sourceCitation).length, 'מספרי זהב'],
      [data.questions.length, 'שאלות לימוד']
    ];

    target.innerHTML = summary.map(([count, label]) => `
      <article class="kh-summary-card">
        <strong>${escapeHtml(count)}</strong>
        <span>${escapeHtml(label)}</span>
      </article>
    `).join('');
  }

  function renderTopicCards(state) {
    const target = document.querySelector('[data-kh-topics]');
    if (!target) return;

    const query = normalizeSearch(document.querySelector('[data-kh-search]')?.value || '');
    const rootTopics = getRootTopics(state.data.topics).filter((topic) => topicMatchesSearch(state, topic, query));

    if (!rootTopics.length) {
      target.innerHTML = '<article class="kh-empty kh-topic-empty">לא נמצאו נושאים מתאימים</article>';
      return;
    }

    target.innerHTML = rootTopics.map((topic) => {
      const scope = getTopicScope(state, topic.topicId);
      const blockCount = getBlocksForScope(state, scope).length;
      const goldenCount = getGoldenForScope(state, scope).length;
      const questionCount = getQuestionsForScope(state, scope).length;
      const subtopicCount = scope.topicIds.size - 1;
      const authority = primaryAuthorityForScope(state, scope);

      return `
        <article class="kh-topic-card">
          <div class="kh-meta-row">
            ${authorityBadgeByGroup(authority)}
            <span class="kh-badge" data-kind="draft">${escapeHtml(blockCount)} פריטי תוכן</span>
          </div>
          <h3>${escapeHtml(presentationTitle(topic.title))}</h3>
          <p>${escapeHtml(localizedTopicDescription(topic))}</p>
          <div class="kh-meta-row">
            ${countBadge(subtopicCount, 'תתי נושאים', 'source-backed')}
            ${countBadge(goldenCount, 'מספרי זהב', 'gold')}
            ${countBadge(questionCount, 'שאלות', 'draft')}
          </div>
          <button class="kh-topic-open" type="button" data-topic-open="${escapeAttribute(topic.topicId)}">כניסה לנושא</button>
        </article>
      `;
    }).join('');
  }

  function handlePageClick(event) {
    const openButton = event.target.closest('[data-topic-open]');
    if (openButton) {
      const topicId = openButton.getAttribute('data-topic-open');
      openTopic(topicId);
      return;
    }

    const relatedButton = event.target.closest('[data-related-topic-open]');
    if (relatedButton) {
      openTopic(relatedButton.getAttribute('data-related-topic-open'));
      return;
    }

    if (event.target.closest('[data-kh-back-topics]')) {
      closeTopicDetail();
    }
  }

  function openTopic(topicId) {
    if (!pilotState) return;

    const topic = pilotState.topicById.get(topicId);
    const detail = document.querySelector('[data-kh-detail-title]')?.closest('.kh-detail-panel');
    if (!topic || !detail) return;

    const scope = getDirectTopicScope(pilotState, topicId);
    const subtopics = getSubtopicsForScope(pilotState, topicId);
    const blocks = getBlocksForScope(pilotState, scope);
    const learningBlocks = blocks.filter((block) => !isExamBlock(block) && !isLegalBlock(block));
    const examBlocks = blocks.filter(isExamBlock);
    const legalBlocks = blocks.filter(isLegalBlock);
    const golden = getGoldenForScope(pilotState, scope);
    const questions = getQuestionsForScope(pilotState, scope);
    const relatedTopics = getRelatedTopics(pilotState, topic);

    setText('[data-kh-detail-title]', presentationTitle(topic.title));
    setText('[data-kh-detail-summary]', localizedTopicDescription(topic));
    setHtml('[data-kh-breadcrumb]', renderBreadcrumb(pilotState, topic));
    setHtml('[data-kh-detail-subtopics]', renderSubtopics(subtopics));
    setHtml('[data-kh-detail-learning]', renderBlockCards(learningBlocks, pilotState, 'אין פריטי תוכן לימודי לנושא זה בפיילוט.'));
    setHtml('[data-kh-detail-exam]', renderBlockCards(examBlocks, pilotState, 'אין דגשי מבחן לנושא זה בפיילוט.'));
    setHtml('[data-kh-detail-legal]', renderBlockCards(legalBlocks, pilotState, 'אין דגשים משפטיים לנושא זה בפיילוט.'));
    setHtml('[data-kh-detail-golden]', renderGoldenNumbers(golden, pilotState));
    setHtml('[data-kh-detail-questions]', renderQuestions(questions, pilotState));
    setHtml('[data-kh-detail-related]', renderRelatedTopics(relatedTopics));

    detail.hidden = false;
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeTopicDetail() {
    const detail = document.querySelector('[data-kh-detail-title]')?.closest('.kh-detail-panel');
    if (!detail) return;
    detail.hidden = true;
    document.querySelector('#kh-topics')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setupSearch(state) {
    const search = document.querySelector('[data-kh-search]');
    if (!search) return;
    search.addEventListener('input', () => {
      closeTopicDetail();
      renderTopicCards(state);
    });
  }

  function topicMatchesSearch(state, topic, query) {
    if (!query) return true;
    const scope = getTopicScope(state, topic.topicId);
    const scopedTopics = Array.from(scope.topicIds)
      .map((topicId) => state.topicById.get(topicId))
      .filter(Boolean);
    const haystack = normalizeSearch(scopedTopics.flatMap((scopedTopic) => [
      scopedTopic.title,
      scopedTopic.description,
      ...(Array.isArray(scopedTopic.aliases) ? scopedTopic.aliases : [])
    ]).filter(Boolean).join(' '));
    return haystack.includes(query);
  }

  function normalizeSearch(value) {
    return String(value || '').trim().toLowerCase();
  }

  function localizedTopicDescription(topic) {
    const description = String(topic.description || '').trim();
    if (!description || /topic root|pilot topic|management-facing|extracted from|traceability/i.test(description)) {
      return 'נושא לימודי מבוסס מקור מתוך הפיילוט.';
    }
    return description;
  }

  function countBadge(count, label, kind) {
    if (!count) return '';
    const attr = kind === 'gold' ? 'data-role="gold"' : `data-kind="${escapeAttribute(kind)}"`;
    return `<span class="kh-badge" ${attr}>${escapeHtml(count)} ${escapeHtml(label)}</span>`;
  }

  function renderBreadcrumb(state, topic) {
    const chain = [];
    let current = topic;
    while (current) {
      chain.unshift(current);
      current = current.parentTopicId ? state.topicById.get(current.parentTopicId) : null;
    }
    const parts = ['ידע מקצועי', ...chain.map((item) => presentationTitle(item.title))];
    return parts.map((part, index) => `
      <span>${escapeHtml(part)}</span>${index < parts.length - 1 ? '<span aria-hidden="true">←</span>' : ''}
    `).join('');
  }

  function getRelatedTopics(state, topic) {
    return (topic.relatedTopicIds || [])
      .map((topicId) => state.topicById.get(topicId))
      .filter(Boolean);
  }

  function renderRelatedTopics(topics) {
    if (!topics.length) {
      return '<article class="kh-empty">אין נושאים קשורים לנושא זה בשלב הפיילוט.</article>';
    }

    return topics.map((topic) => `
      <article class="kh-card">
        <h3>${escapeHtml(presentationTitle(topic.title))}</h3>
        <p>${escapeHtml(localizedTopicDescription(topic))}</p>
        <button class="kh-related-button" type="button" data-related-topic-open="${escapeAttribute(topic.topicId)}">פתח נושא קשור</button>
      </article>
    `).join('');
  }

  function renderSubtopics(subtopics) {
    if (!subtopics.length) {
      return '<article class="kh-empty">אין תתי נושאים נוספים לנושא זה.</article>';
    }

    return subtopics.map((topic) => `
      <article class="kh-card">
        <h3>${escapeHtml(presentationTitle(topic.title))}</h3>
        <p>${escapeHtml(topic.description || 'תת נושא בפיילוט.')}</p>
        <button class="kh-related-button" type="button" data-related-topic-open="${escapeAttribute(topic.topicId)}">כניסה לתת נושא</button>
      </article>
    `).join('');
  }

  function renderBlockCards(blocks, state, emptyMessage) {
    if (!blocks.length) {
      return `<article class="kh-empty">${escapeHtml(emptyMessage)}</article>`;
    }

    return blocks.map((block) => renderBlockCard(block, state)).join('');
  }

  function renderBlockCard(block, state) {
    const source = state.sourceById.get(block.sourceId);
    const citation = state.citationById.get(block.citationId);
    const authorityGroup = authorityGroupForSource(source);
    const content = block.content || {};
    const items = Array.isArray(content.items) ? content.items : [];

    return `
      <article class="kh-block-card" data-authority-group="${escapeAttribute(authorityGroup)}" data-block-type="${escapeAttribute(block.blockType)}">
        <div class="kh-meta-row">
          <span class="kh-badge" data-kind="draft">${escapeHtml(blockTypeLabel(block.blockType))}</span>
          ${authorityBadge(source)}
          ${verificationBadge(block.verification)}
          ${isExamBlock(block) ? '<span class="kh-badge" data-role="exam">דגש מבחן</span>' : ''}
        </div>
        <h3>${escapeHtml(presentationTitle(content.title || block.blockId))}</h3>
        ${content.text ? `<p>${escapeHtml(content.text)}</p>` : ''}
        ${items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
        ${renderTable(content.table)}
        ${sourceLine(block, source, citation)}
      </article>
    `;
  }

  function renderGoldenNumbers(goldenNumbers, state) {
    const eligible = goldenNumbers.filter((item) => item.sourceCitation);
    if (!eligible.length) {
      return '<article class="kh-empty">אין מספרי זהב לנושא זה בפיילוט.</article>';
    }

    return eligible.map((item) => {
      const source = state.sourceById.get(item.sourceId);
      const citation = state.citationById.get(item.citationId);

      return `
        <article class="kh-golden-card" data-authority-group="${escapeAttribute(authorityGroupForSource(source))}">
          <div class="kh-meta-row">
            <span class="kh-badge" data-role="gold">מספר זהב</span>
            ${authorityBadge(source)}
            ${verificationBadge(item.verification)}
          </div>
          <h3>${escapeHtml(item.displayValue || item.value)}</h3>
          <p>${escapeHtml(item.meaning || '')}</p>
          ${sourceLine({
            sourceId: item.sourceId,
            citationId: item.citationId,
            sourceCitation: item.sourceCitation
          }, source, citation)}
        </article>
      `;
    }).join('');
  }

  function renderQuestions(questions, state) {
    if (!questions.length) {
      return '<article class="kh-empty">אין שאלות לימוד לנושא זה בפיילוט.</article>';
    }

    return questions.map((item) => {
      const officialRefs = (item.officialAnswer && item.officialAnswer.sourceRefs) || item.sourceRefs || [];
      const correctIndex = Number(item.correctIndex);
      const options = Array.isArray(item.options) ? item.options : [];

      return `
        <article class="kh-question-card" data-authority-group="${escapeAttribute(authorityGroupFromLevel(item.authoritySummary && item.authoritySummary.highestAuthorityLevel))}">
          <div class="kh-meta-row">
            <span class="kh-badge" data-kind="draft">שאלת לימוד</span>
            ${verificationBadge(item.verification)}
            <span class="kh-badge" data-kind="source-backed">תשובה עם מקור</span>
          </div>
          <h3>${escapeHtml(presentationTitle(item.title || item.questionId))}</h3>
          <p><strong>שאלה:</strong> ${escapeHtml(item.question || '')}</p>
          <div class="kh-options">
            ${options.map((option, index) => `
              <div class="kh-option" data-correct="${index === correctIndex ? 'true' : 'false'}">
                ${escapeHtml(index + 1)}. ${escapeHtml(option)}
              </div>
            `).join('')}
          </div>
          ${item.explanation ? `<p><strong>הסבר:</strong> ${escapeHtml(item.explanation)}</p>` : ''}
          <div class="kh-source-line">
            <strong>מקור תשובה:</strong>
            ${officialRefs.map((ref) => renderRef(ref, state)).join('<br>')}
          </div>
        </article>
      `;
    }).join('');
  }

  function getRootTopics(topics) {
    return topics.filter((topic) => !topic.parentTopicId);
  }

  function getSubtopicsForScope(state, rootTopicId) {
    const scope = getTopicScope(state, rootTopicId);
    return Array.from(scope.topicIds)
      .filter((topicId) => topicId !== rootTopicId)
      .map((topicId) => state.topicById.get(topicId))
      .filter(Boolean);
  }

  function getTopicScope(state, rootTopicId) {
    const topicIds = new Set();
    const blockIds = new Set();
    const queue = [rootTopicId];

    while (queue.length) {
      const topicId = queue.shift();
      if (!topicId || topicIds.has(topicId)) continue;
      topicIds.add(topicId);

      const topic = state.topicById.get(topicId);
      if (topic) {
        (topic.blockIds || []).forEach((blockId) => blockIds.add(blockId));
      }

      state.data.topics
        .filter((candidate) => candidate.parentTopicId === topicId)
        .forEach((child) => queue.push(child.topicId));
    }

    return { topicIds, blockIds };
  }

  function getDirectTopicScope(state, topicId) {
    const topic = state.topicById.get(topicId);
    return {
      topicIds: new Set([topicId]),
      blockIds: new Set((topic && topic.blockIds) || [])
    };
  }

  function getBlocksForScope(state, scope) {
    return state.data.blocks.filter((block) => {
      if (scope.blockIds.has(block.blockId)) return true;
      return intersects(block.topicIds || [], scope.topicIds);
    });
  }

  function getGoldenForScope(state, scope) {
    return state.data.golden.filter((item) => item.sourceCitation && intersects(item.topicIds || [], scope.topicIds));
  }

  function getQuestionsForScope(state, scope) {
    return state.data.questions.filter((item) => intersects(item.topicIds || [], scope.topicIds));
  }

  function primaryAuthorityForScope(state, scope) {
    const sources = getBlocksForScope(state, scope)
      .map((block) => state.sourceById.get(block.sourceId))
      .filter(Boolean);
    if (sources.some((source) => Number(source.authorityLevel) === 1)) return 'legal';
    if (sources.some((source) => Number(source.authorityLevel) === 4)) return 'standard';
    if (sources.some((source) => Number(source.authorityLevel) === 6)) return 'training';
    return 'training';
  }

  function authorityGroupForSource(source) {
    return authorityGroupFromLevel(source && source.authorityLevel);
  }

  function authorityGroupFromLevel(level) {
    const numericLevel = Number(level);
    if (numericLevel === 1) return 'legal';
    if (numericLevel === 4) return 'standard';
    return 'training';
  }

  function renderRef(ref, state) {
    const source = state.sourceById.get(ref.stableSourceId || ref.sourceId);
    const citation = state.citationById.get(ref.citationId);
    return [
      source ? `מקור: ${escapeHtml(source.title)}` : 'מקור: חסר',
      citation ? `הפניה: ${escapeHtml(citation.label)}` : 'הפניה: חסרה'
    ].join(' | ');
  }

  function sourceLine(item, source, citation) {
    return `
      <div class="kh-source-line">
        <strong>עקיבות מקור:</strong> ${escapeHtml(source ? source.title : 'מקור לא נמצא')}<br>
        <strong>רמת סמכות:</strong> ${escapeHtml(authorityText(source))}<br>
        <strong>סטטוס אימות:</strong> ${escapeHtml(statusLabel((item.verification && item.verification.status) || (citation && citation.verification && citation.verification.status) || ''))}<br>
        ${item.sourceCitation ? `<strong>ציטוט מקור:</strong> ${escapeHtml(item.sourceCitation)}<br>` : ''}
        ${citation ? `<strong>הפניה:</strong> ${escapeHtml(citation.label)}<br>` : ''}
        <strong>סטטוס פרסום:</strong> טיוטה
      </div>
    `;
  }

  function renderTable(table) {
    if (!table) return '';

    const headers = table.headers || table.columns || [];
    const rows = table.rows || [];
    if (!headers.length && !rows.length) return '';

    return `
      <div class="kh-table-wrap">
        <table class="kh-table">
          ${headers.length ? `<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>` : ''}
          <tbody>
            ${rows.map((row) => {
              const cells = Array.isArray(row) ? row : Object.values(row || {});
              return `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function authorityBadge(source) {
    return authorityBadgeByGroup(authorityGroupForSource(source));
  }

  function authorityBadgeByGroup(group) {
    if (group === 'legal') {
      return '<span class="kh-badge" data-authority="legal" title="מקור משפטי מחייב: חוק או פקודה.">⚖️ מקור משפטי</span>';
    }
    if (group === 'standard') {
      return '<span class="kh-badge" data-authority="standard" title="תקן בינלאומי. אינו חוק, אך משמש Best Practice ועלול להיות מחייב אם אומץ על ידי הארגון או הרגולטור.">📘 תקן בינלאומי</span>';
    }
    return '<span class="kh-badge" data-authority="training" title="חומר הדרכה או סיכום לימודי. אינו מקור רגולטורי מחייב בפני עצמו.">🎓 חומר הדרכה</span>';
  }

  function authorityText(source) {
    if (!source) return 'לא ידוע';
    if (Number(source.authorityLevel) === 1) return 'מקור משפטי';
    if (Number(source.authorityLevel) === 4) return 'תקן בינלאומי - אינו חוק, אך משמש Best Practice ועלול להיות מחייב אם אומץ על ידי הארגון או הרגולטור';
    if (Number(source.authorityLevel) === 6) return 'חומר הדרכה';
    return `רמת סמכות ${source.authorityLevel}`;
  }

  function verificationBadge(verification) {
    const status = verification && verification.status ? verification.status : 'unknown';
    const kind = status === 'source-backed' ? 'source-backed' : 'unverified';
    return `<span class="kh-badge" data-kind="${escapeAttribute(kind)}">${escapeHtml(statusLabel(status))}</span>`;
  }

  function statusLabel(status) {
    if (status === 'source-backed') return 'מבוסס מקור';
    if (status === 'unverified') return 'לא מאומת';
    return status || 'לא ידוע';
  }

  function blockTypeLabel(blockType) {
    return BLOCK_TYPE_LABELS[blockType] || blockType || 'פריט ידע';
  }

  function isExamBlock(block) {
    const claimTypes = block.claimTypes || [];
    return block.blockType === 'exam-focus' || claimTypes.includes('examCritical');
  }

  function isLegalBlock(block) {
    const claimTypes = block.claimTypes || [];
    return block.blockType === 'legal-note' ||
      block.blockType === 'legal-quote' ||
      claimTypes.includes('legal-reference') ||
      claimTypes.includes('legalRequirement') ||
      claimTypes.includes('regulatoryRequirement') ||
      claimTypes.includes('bindingRule');
  }

  function presentationTitle(value) {
    const title = String(value || '').trim();
    if (!title || LEGAL_WORD_NUMBERING.test(title)) {
      return title;
    }
    return title.replace(WORD_NUMBERING, '').trim() || title;
  }

  function intersects(values, set) {
    return values.some((value) => set.has(value));
  }

  function setText(selector, value) {
    const target = document.querySelector(selector);
    if (target) target.textContent = value;
  }

  function setHtml(selector, value) {
    const target = document.querySelector(selector);
    if (target) target.innerHTML = value;
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

  function handlePageClick(event) {
    const openButton = event.target.closest('[data-topic-open]');
    if (openButton) {
      openTopic(openButton.getAttribute('data-topic-open'));
      return;
    }

    const relatedButton = event.target.closest('[data-related-topic-open]');
    if (relatedButton) {
      openTopic(relatedButton.getAttribute('data-related-topic-open'));
      return;
    }

    const backSubtopicsButton = event.target.closest('[data-kh-back-subtopics]');
    if (backSubtopicsButton) {
      openTopic(backSubtopicsButton.getAttribute('data-parent-topic-id'));
      return;
    }

    if (event.target.closest('[data-kh-back-topics]')) {
      closeTopicDetail();
    }
  }

  function openTopic(topicId) {
    if (!pilotState) return;

    const topic = pilotState.topicById.get(topicId);
    const detail = document.querySelector('[data-kh-detail-title]')?.closest('.kh-detail-panel');
    if (!topic || !detail) return;

    const isRootTopic = !topic.parentTopicId;
    const subtopics = getChildTopics(pilotState, topicId);

    setText('[data-kh-detail-title]', presentationTitle(topic.title));
    setText('[data-kh-detail-summary]', localizedTopicDescription(topic));
    setHtml('[data-kh-breadcrumb]', renderBreadcrumb(pilotState, topic));
    setHtml('[data-kh-detail-subtopics]', renderSubtopics(subtopics));
    setDetailMode(isRootTopic, topic.parentTopicId);

    if (isRootTopic) {
      clearDetailContent();
    } else {
      const scope = getDirectTopicScope(pilotState, topicId);
      const blocks = getBlocksForScope(pilotState, scope);
      const learningBlocks = blocks.filter((block) => !isExamBlock(block) && !isLegalBlock(block));
      const examBlocks = blocks.filter(isExamBlock);
      const legalBlocks = blocks.filter(isLegalBlock);
      const golden = getGoldenForScope(pilotState, scope);
      const questions = getQuestionsForScope(pilotState, scope);
      const relatedTopics = getRelatedTopics(pilotState, topic);

      setHtml('[data-kh-detail-learning]', renderBlockCards(learningBlocks, pilotState, '\u05d0\u05d9\u05df \u05e4\u05e8\u05d9\u05d8\u05d9 \u05ea\u05d5\u05db\u05df \u05dc\u05d9\u05de\u05d5\u05d3\u05d9 \u05dc\u05ea\u05ea \u05e0\u05d5\u05e9\u05d0 \u05d6\u05d4 \u05d1\u05e4\u05d9\u05d9\u05dc\u05d5\u05d8.'));
      setHtml('[data-kh-detail-exam]', renderBlockCards(examBlocks, pilotState, '\u05d0\u05d9\u05df \u05d3\u05d2\u05e9\u05d9 \u05de\u05d1\u05d7\u05df \u05dc\u05ea\u05ea \u05e0\u05d5\u05e9\u05d0 \u05d6\u05d4 \u05d1\u05e4\u05d9\u05d9\u05dc\u05d5\u05d8.'));
      setHtml('[data-kh-detail-legal]', renderBlockCards(legalBlocks, pilotState, '\u05d0\u05d9\u05df \u05d3\u05d2\u05e9\u05d9\u05dd \u05de\u05e9\u05e4\u05d8\u05d9\u05d9\u05dd \u05dc\u05ea\u05ea \u05e0\u05d5\u05e9\u05d0 \u05d6\u05d4 \u05d1\u05e4\u05d9\u05d9\u05dc\u05d5\u05d8.'));
      setHtml('[data-kh-detail-golden]', renderGoldenNumbers(golden, pilotState));
      setHtml('[data-kh-detail-questions]', renderQuestions(questions, pilotState));
      setHtml('[data-kh-detail-related]', renderRelatedTopics(relatedTopics));
    }

    detail.hidden = false;
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderSubtopics(subtopics) {
    if (!subtopics.length) {
      return '<article class="kh-empty">\u05dc\u05d0 \u05e0\u05de\u05e6\u05d0\u05d5 \u05ea\u05ea\u05d9 \u05e0\u05d5\u05e9\u05d0\u05d9\u05dd \u05dc\u05d4\u05e6\u05d2\u05d4</article>';
    }

    return subtopics.map((topic) => `
      <article class="kh-card">
        <h3>${escapeHtml(presentationTitle(topic.title))}</h3>
        <p>${escapeHtml(localizedTopicDescription(topic))}</p>
        <button class="kh-related-button" type="button" data-related-topic-open="${escapeAttribute(topic.topicId)}">\u05db\u05e0\u05d9\u05e1\u05d4 \u05dc\u05ea\u05ea \u05e0\u05d5\u05e9\u05d0</button>
      </article>
    `).join('');
  }

  function getChildTopics(state, parentTopicId) {
    return state.data.topics
      .filter((topic) => topic.parentTopicId === parentTopicId)
      .sort((a, b) => presentationTitle(a.title).localeCompare(presentationTitle(b.title), 'he'));
  }

  function setDetailMode(isRootTopic, parentTopicId) {
    setSectionHidden('[data-kh-subtopics-section]', !isRootTopic);
    setSectionHidden('[data-kh-learning-section]', isRootTopic);
    setSectionHidden('[data-kh-exam-section]', isRootTopic);
    setSectionHidden('[data-kh-legal-section]', isRootTopic);
    setSectionHidden('[data-kh-golden-section]', isRootTopic);
    setSectionHidden('[data-kh-questions-section]', isRootTopic);
    setSectionHidden('[data-kh-related-section]', isRootTopic);

    const backSubtopicsButton = document.querySelector('[data-kh-back-subtopics]');
    if (backSubtopicsButton) {
      backSubtopicsButton.hidden = isRootTopic || !parentTopicId;
      backSubtopicsButton.setAttribute('data-parent-topic-id', parentTopicId || '');
      backSubtopicsButton.textContent = '\u05d7\u05d6\u05e8\u05d4 \u05dc\u05ea\u05ea\u05d9 \u05d4\u05e0\u05d5\u05e9\u05d0\u05d9\u05dd';
    }
  }

  function clearDetailContent() {
    setHtml('[data-kh-detail-learning]', '');
    setHtml('[data-kh-detail-exam]', '');
    setHtml('[data-kh-detail-legal]', '');
    setHtml('[data-kh-detail-golden]', '');
    setHtml('[data-kh-detail-questions]', '');
    setHtml('[data-kh-detail-related]', '');
  }

  function setSectionHidden(selector, hidden) {
    const section = document.querySelector(selector);
    if (section) section.hidden = hidden;
  }

  function renderError(error) {
    const main = document.querySelector('#main');
    if (!main) return;
    main.insertAdjacentHTML('afterbegin', `
      <section class="kh-error" role="alert">
        <strong>טעינת נתוני הפיילוט נכשלה.</strong>
        <p>${escapeHtml(error.message)}</p>
      </section>
    `);
  }
})();

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

  const REQUIRED_SUMMARY = [
    ['sources', 'מקורות'],
    ['citations', 'citations'],
    ['blocks', 'content blocks'],
    ['topics', 'topics'],
    ['lessons', 'lesson mappings'],
    ['golden', 'golden numbers'],
    ['questions', 'question items']
  ];

  const LEGAL_WORD_NUMBERING = /^\s*(?:סעיף|תקנה|צו|תקן)\s+\S+/;
  const WORD_NUMBERING = /^\s*(?:פרק\s+\d+|(?:\d+\.)+\d+|\d+\s*[.)])\s*/;

  document.addEventListener('DOMContentLoaded', () => {
    loadPilotData()
      .then(renderPilot)
      .catch(renderError);
  });

  async function loadPilotData() {
    const entries = await Promise.all(
      Object.entries(DATA_FILES).map(async ([key, path]) => {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load ${path}: ${response.status}`);
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

  function renderPilot(data) {
    const sourceById = new Map(data.sources.map((source) => [source.stableSourceId, source]));
    const citationById = new Map(data.citations.map((citation) => [citation.citationId, citation]));
    const blockById = new Map(data.blocks.map((block) => [block.blockId, block]));

    renderSummary(data);
    renderTopics(data, sourceById, blockById);
    renderBlocks(data.blocks, sourceById, citationById);
    renderGoldenNumbers(data.golden, sourceById, citationById);
    renderQuestions(data.questions, sourceById, citationById);
  }

  function renderSummary(data) {
    const target = document.querySelector('[data-kh-summary]');
    if (!target) return;

    target.innerHTML = REQUIRED_SUMMARY.map(([key, label]) => `
      <article class="kh-summary-card">
        <strong>${escapeHtml(data[key].length)}</strong>
        <span>${escapeHtml(label)}</span>
      </article>
    `).join('');
  }

  function renderTopics(data, sourceById, blockById) {
    const target = document.querySelector('[data-kh-topics]');
    if (!target) return;

    target.innerHTML = data.topics.map((topic) => {
      const sources = unique(topic.sourceIds || [])
        .map((sourceId) => sourceById.get(sourceId))
        .filter(Boolean);
      const blockCount = (topic.blockIds || []).filter((blockId) => blockById.has(blockId)).length;
      const lessons = (topic.lessonIds || []).join(', ') || 'לא ממופה לשיעור';

      return `
        <article class="kh-topic-card">
          <h3>${escapeHtml(presentationTitle(topic.title))}</h3>
          <p>${escapeHtml(topic.description || 'נושא פיילוט ללא תיאור נוסף.')}</p>
          <div class="kh-meta-row">
            <span class="kh-badge" data-kind="draft">${escapeHtml(blockCount)} blocks</span>
            ${sources.map(authorityBadge).join('')}
          </div>
          <div class="kh-source-line"><strong>שיעורים קשורים:</strong> ${escapeHtml(lessons)}</div>
        </article>
      `;
    }).join('');
  }

  function renderBlocks(blocks, sourceById, citationById) {
    const target = document.querySelector('[data-kh-blocks]');
    if (!target) return;

    target.innerHTML = blocks.map((block) => {
      const source = sourceById.get(block.sourceId);
      const citation = citationById.get(block.citationId);
      const level = source ? source.authorityLevel : block.authorityLevel;
      const content = block.content || {};
      const items = Array.isArray(content.items) ? content.items : [];

      return `
        <article class="kh-block-card" data-level="${escapeAttribute(level)}" data-block-type="${escapeAttribute(block.blockType)}">
          <div class="kh-meta-row">
            <span class="kh-badge" data-kind="draft">${escapeHtml(block.blockType)}</span>
            ${source ? authorityBadge(source) : ''}
            ${verificationBadge(block.verification)}
            <span class="kh-badge" data-kind="draft">${escapeHtml(block.status || 'draft')}</span>
          </div>
          <h3>${escapeHtml(presentationTitle(content.title || block.blockId))}</h3>
          ${content.text ? `<p>${escapeHtml(content.text)}</p>` : ''}
          ${items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
          ${renderTable(content.table)}
          ${sourceLine(block, source, citation)}
        </article>
      `;
    }).join('');
  }

  function renderGoldenNumbers(goldenNumbers, sourceById, citationById) {
    const target = document.querySelector('[data-kh-golden]');
    if (!target) return;

    const eligible = goldenNumbers.filter((item) => item.sourceCitation);
    if (!eligible.length) {
      target.innerHTML = '<div class="kh-card">אין מספרי זהב תקינים להצגה בפיילוט הנוכחי.</div>';
      return;
    }

    target.innerHTML = eligible.map((item) => {
      const source = sourceById.get(item.sourceId);
      const citation = citationById.get(item.citationId);

      return `
        <article class="kh-golden-card" data-level="${escapeAttribute(item.authorityLevel)}">
          <div class="kh-meta-row">
            <span class="kh-badge" data-kind="draft">Golden Number</span>
            ${source ? authorityBadge(source) : ''}
            ${verificationBadge(item.verification)}
            <span class="kh-badge" data-kind="draft">${escapeHtml(item.status || 'draft')}</span>
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

  function renderQuestions(questions, sourceById, citationById) {
    const target = document.querySelector('[data-kh-questions]');
    if (!target) return;

    target.innerHTML = questions.map((item) => {
      const officialRefs = (item.officialAnswer && item.officialAnswer.sourceRefs) || item.sourceRefs || [];
      const correctIndex = Number(item.correctIndex);
      const options = Array.isArray(item.options) ? item.options : [];

      return `
        <article class="kh-question-card" data-level="${escapeAttribute(item.authoritySummary && item.authoritySummary.highestAuthorityLevel)}">
          <div class="kh-meta-row">
            <span class="kh-badge" data-kind="draft">${escapeHtml(item.questionType || 'question')}</span>
            ${verificationBadge(item.verification)}
            <span class="kh-badge" data-kind="source-backed">officialAnswer sourceRef</span>
            <span class="kh-badge" data-kind="draft">${escapeHtml(item.status || 'draft')}</span>
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
            <strong>מקור תשובה רשמית:</strong>
            ${officialRefs.map((ref) => renderRef(ref, sourceById, citationById)).join('<br>')}
          </div>
        </article>
      `;
    }).join('');
  }

  function renderRef(ref, sourceById, citationById) {
    const source = sourceById.get(ref.stableSourceId || ref.sourceId);
    const citation = citationById.get(ref.citationId);
    return [
      `sourceRef: ${escapeHtml(ref.stableSourceId || ref.sourceId || 'missing')}`,
      `citation: ${escapeHtml(ref.citationId || 'missing')}`,
      source ? `source title: ${escapeHtml(source.title)}` : 'source title: missing',
      citation ? `citation label: ${escapeHtml(citation.label)}` : 'citation label: missing'
    ].join(' | ');
  }

  function sourceLine(item, source, citation) {
    return `
      <div class="kh-source-line">
        <strong>sourceId:</strong> ${escapeHtml(item.sourceId || '')}<br>
        <strong>source title:</strong> ${escapeHtml(source ? source.title : 'מקור לא נמצא')}<br>
        <strong>authorityLevel:</strong> ${escapeHtml(source ? source.authorityLevel : '')}<br>
        <strong>verification.status:</strong> ${escapeHtml((item.verification && item.verification.status) || (citation && citation.verification && citation.verification.status) || '')}<br>
        ${item.sourceCitation ? `<strong>sourceCitation:</strong> ${escapeHtml(item.sourceCitation)}<br>` : ''}
        ${citation ? `<strong>citation label:</strong> ${escapeHtml(citation.label)}<br>` : ''}
        <strong>status:</strong> ${escapeHtml(item.status || 'draft')}
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
    const level = Number(source.authorityLevel);
    const label = level === 1 ? 'מקור משפטי' : level === 6 ? 'חומר הדרכה' : `Level ${level}`;
    return `<span class="kh-badge" data-authority="${escapeAttribute(level)}">${escapeHtml(label)} | Level ${escapeHtml(level)}</span>`;
  }

  function verificationBadge(verification) {
    const status = verification && verification.status ? verification.status : 'unknown';
    const kind = status === 'source-backed' ? 'source-backed' : 'unverified';
    return `<span class="kh-badge" data-kind="${escapeAttribute(kind)}">${escapeHtml(status)}</span>`;
  }

  function presentationTitle(value) {
    const title = String(value || '').trim();
    if (!title || LEGAL_WORD_NUMBERING.test(title)) {
      return title;
    }
    return title.replace(WORD_NUMBERING, '').trim() || title;
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
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

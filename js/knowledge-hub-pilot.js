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
    renderLearningContent(data.blocks, sourceById, citationById);
    renderExamFocus(data.blocks, sourceById, citationById);
    renderLegalNotes(data.blocks, sourceById, citationById);
    renderGoldenNumbers(data.golden, sourceById, citationById);
    renderQuestions(data.questions, sourceById, citationById);
  }

  function renderSummary(data) {
    const target = document.querySelector('[data-kh-summary]');
    if (!target) return;

    const summary = [
      [data.topics.length, 'נושאים ותתי נושאים'],
      [data.topics.filter((topic) => topic.parentTopicId).length, 'תתי נושאים'],
      [data.blocks.length, 'פריטי תוכן לימודי'],
      [data.blocks.filter(isExamBlock).length, 'דגשי מבחן'],
      [data.blocks.filter(isLegalBlock).length, 'דגשים משפטיים'],
      [data.golden.filter((item) => item.sourceCitation).length, 'מספרי זהב עם מקור'],
      [data.questions.length, 'שאלות לימוד']
    ];

    target.innerHTML = summary.map(([count, label]) => `
      <article class="kh-summary-card">
        <strong>${escapeHtml(count)}</strong>
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

      const topicType = topic.parentTopicId ? 'תת נושא' : 'נושא';

      return `
        <article class="kh-topic-card">
          <div class="kh-meta-row">
            <span class="kh-badge" data-kind="draft">${escapeHtml(topicType)}</span>
            ${sources.map(authorityBadge).join('')}
          </div>
          <h3>${escapeHtml(presentationTitle(topic.title))}</h3>
          <p>${escapeHtml(topic.description || 'נושא פיילוט ללא תיאור נוסף.')}</p>
          <div class="kh-meta-row">
            <span class="kh-badge" data-kind="draft">${escapeHtml(blockCount)} פריטי ידע</span>
          </div>
          <div class="kh-source-line"><strong>שיעורים קשורים:</strong> ${escapeHtml(lessons)}</div>
        </article>
      `;
    }).join('');
  }

  function renderLearningContent(blocks, sourceById, citationById) {
    const target = document.querySelector('[data-kh-learning]');
    if (!target) return;

    const learningBlocks = blocks.filter((block) => !isExamBlock(block) && !isLegalBlock(block));
    target.innerHTML = renderBlockCards(learningBlocks, sourceById, citationById, 'אין עדיין פריטי תוכן לימודי להצגה בפיילוט.');
  }

  function renderExamFocus(blocks, sourceById, citationById) {
    const target = document.querySelector('[data-kh-exam]');
    if (!target) return;

    target.innerHTML = renderBlockCards(blocks.filter(isExamBlock), sourceById, citationById, 'אין עדיין דגשי מבחן להצגה בפיילוט.');
  }

  function renderLegalNotes(blocks, sourceById, citationById) {
    const target = document.querySelector('[data-kh-legal]');
    if (!target) return;

    target.innerHTML = renderBlockCards(blocks.filter(isLegalBlock), sourceById, citationById, 'אין עדיין דגשים משפטיים להצגה בפיילוט.');
  }

  function renderBlockCards(blocks, sourceById, citationById, emptyMessage) {
    if (!blocks.length) {
      return `<article class="kh-card">${escapeHtml(emptyMessage)}</article>`;
    }

    return blocks.map((block) => renderBlockCard(block, sourceById, citationById)).join('');
  }

  function renderBlockCard(block, sourceById, citationById) {
    const source = sourceById.get(block.sourceId);
    const citation = citationById.get(block.citationId);
    const level = source ? source.authorityLevel : block.authorityLevel;
    const content = block.content || {};
    const items = Array.isArray(content.items) ? content.items : [];

    return `
      <article class="kh-block-card" data-level="${escapeAttribute(level)}" data-block-type="${escapeAttribute(block.blockType)}">
        <div class="kh-meta-row">
          <span class="kh-badge" data-kind="draft">${escapeHtml(blockTypeLabel(block.blockType))}</span>
          ${source ? authorityBadge(source) : ''}
          ${verificationBadge(block.verification)}
          <span class="kh-badge" data-kind="draft">טיוטת פיילוט</span>
        </div>
        <h3>${escapeHtml(presentationTitle(content.title || block.blockId))}</h3>
        ${content.text ? `<p>${escapeHtml(content.text)}</p>` : ''}
        ${items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
        ${renderTable(content.table)}
        ${sourceLine(block, source, citation)}
      </article>
    `;
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
            <span class="kh-badge" data-kind="draft">מספר זהב</span>
            ${source ? authorityBadge(source) : ''}
            ${verificationBadge(item.verification)}
            <span class="kh-badge" data-kind="draft">טיוטת פיילוט</span>
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
            <span class="kh-badge" data-kind="draft">שאלת לימוד</span>
            ${verificationBadge(item.verification)}
            <span class="kh-badge" data-kind="source-backed">תשובה עם מקור</span>
            <span class="kh-badge" data-kind="draft">טיוטת פיילוט</span>
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
      source ? `מקור: ${escapeHtml(source.title)}` : 'מקור: חסר',
      citation ? `הפניה: ${escapeHtml(citation.label)}` : 'הפניה: חסרה'
    ].join(' | ');
  }

  function sourceLine(item, source, citation) {
    return `
      <div class="kh-source-line">
        <strong>עקיבות מקור:</strong> ${escapeHtml(source ? source.title : 'מקור לא נמצא')}<br>
        <strong>רמת סמכות:</strong> ${escapeHtml(source ? source.authorityLevel : '')}<br>
        <strong>סטטוס אימות:</strong> ${escapeHtml(statusLabel((item.verification && item.verification.status) || (citation && citation.verification && citation.verification.status) || ''))}<br>
        ${item.sourceCitation ? `<strong>ציטוט מקור:</strong> ${escapeHtml(item.sourceCitation)}<br>` : ''}
        ${citation ? `<strong>הפניה:</strong> ${escapeHtml(citation.label)}<br>` : ''}
        <strong>סטטוס פרסום:</strong> טיוטת פיילוט
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
    const label = level === 1 ? 'דגש משפטי' : level === 6 ? 'חומר הדרכה' : `רמת סמכות ${level}`;
    return `<span class="kh-badge" data-authority="${escapeAttribute(level)}">${escapeHtml(label)} | Level ${escapeHtml(level)}</span>`;
  }

  function verificationBadge(verification) {
    const status = verification && verification.status ? verification.status : 'unknown';
    const kind = status === 'source-backed' ? 'source-backed' : 'unverified';
    return `<span class="kh-badge" data-kind="${escapeAttribute(kind)}">${escapeHtml(statusLabel(status))}</span>`;
  }

  function statusLabel(status) {
    if (status === 'source-backed') return 'מגובה מקור';
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

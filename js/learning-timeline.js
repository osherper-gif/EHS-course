(function () {
  "use strict";

  const map = window.CourseLearningPathMap || {};
  const ingestionMap = window.CourseContentIngestionMap || {};
  const sessions = Array.isArray(map.sessions) ? map.sessions : [];
  const summaryPages = Array.isArray(map.summaryPages) ? map.summaryPages : [];
  const labels = map.knowledgeLabels || {};

  document.addEventListener("DOMContentLoaded", () => {
    renderLearningPath();
    renderPrepIndex();
    renderSummariesIndex();
  });

  function renderLearningPath() {
    const root = document.querySelector("[data-learning-timeline]");
    if (!root) return;

    const search = document.querySelector("[data-learning-search]");
    const filters = Array.from(document.querySelectorAll("[data-learning-filter]"));
    const count = document.querySelector("[data-learning-count]");
    let activeFilter = "all";

    const draw = () => {
      const query = normalize(search ? search.value : "");
      const filtered = timelineSessions().filter((item) => matches(item, query, activeFilter));
      root.innerHTML = filtered.map(renderSession).join("");
      if (count) count.textContent = `${filtered.length} מפגשים מוצגים`;
    };

    if (search) {
      search.addEventListener("input", draw);
    }

    filters.forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.learningFilter || "all";
        filters.forEach((item) => item.classList.toggle("is-active", item === button));
        draw();
      });
    });

    draw();
  }

  function renderPrepIndex() {
    const root = document.querySelector("[data-prep-list]");
    if (!root) return;
    const items = timelineSessions().filter((item) => item.prep && item.prep.status === "available");

    if (!items.length) {
      root.innerHTML = emptyState("עדיין אין הכנות זמינות", "עמודי הכנה יתווספו כאן בהדרגה לפי מפגשי הקורס.");
      return;
    }

    root.innerHTML = items.map((item) => `
      <article class="learning-index-card">
        <span class="learning-status learning-status--available">קיים</span>
        <h2>מפגש ${escapeHtml(item.number)} — ${escapeHtml(item.title)}</h2>
        <p>הכנה ממוקדת לפני שיעור: מושגים, דגשי מבחן ושאלות אינטראקטיביות.</p>
        <div class="learning-actions" data-read-aloud-exclude="true">
          ${linkButton(item.prep.href, "פתח הכנה", "btn")}
          ${linkButton("learning-path.html", "חזרה למסלול", "btn secondary")}
          ${knowledgeLinks(item, 3)}
        </div>
      </article>
    `).join("");
  }

  function renderSummariesIndex() {
    const root = document.querySelector("[data-summaries-list]");
    if (!root) return;
    const ingestionSummaries = Array.isArray(ingestionMap.summaryPages) ? ingestionMap.summaryPages.map((item) => ({
      number: String(item.sessionNumber || "").replace(/^0+/, "") || item.lessonId,
      title: item.title,
      href: normalizeRelativeHref(item.href),
      label: item.label || "קיים",
      summaryAvailable: item.summaryAvailable !== false,
      relatedKnowledge: ingestionMap.knowledgeLinks?.[item.lessonId] || [],
      relatedChecklists: ["checklists.html"]
    })) : [];
    const items = ingestionSummaries.length ? ingestionSummaries : summaryPages;

    if (!items.length) {
      root.innerHTML = emptyState("סיכומי שיעור יעלו כאן לאחר עיבוד השיעורים.", "כאשר יעלה סיכום, הוא יקבל עמוד משלו וקישור ישיר ממסלול הלימוד.");
      return;
    }

    root.innerHTML = items.map((item) => `
      <article class="learning-index-card">
        <span class="learning-status ${item.summaryAvailable ? "learning-status--available" : ""}">${escapeHtml(item.label || "מעטפת קיימת")}</span>
        <h2>מפגש ${escapeHtml(item.number)} — ${escapeHtml(item.title)}</h2>
        <p>${item.summaryAvailable ? "סיכום שיעור זמין כעמוד עצמאי." : "מעטפת סיכום קיימת. תוכן הסיכום יעלה לאחר עיבוד השיעור."}</p>
        <div class="learning-actions" data-read-aloud-exclude="true">
          ${linkButton(item.href, item.summaryAvailable ? "פתח סיכום" : "פתח מעטפת", "btn")}
          ${linkButton("learning-path.html", "חזרה למסלול", "btn secondary")}
          ${knowledgeLinks(item, 3)}
        </div>
      </article>
    `).join("");
  }

  function timelineSessions() {
    const ingestionByLesson = new Map((Array.isArray(ingestionMap.lessons) ? ingestionMap.lessons : [])
      .map((item) => [item.lessonId, item]));
    return sessions.map((item) => {
      const lessonId = `lesson-${String(item.number).padStart(2, "0")}`;
      const ingestion = ingestionByLesson.get(lessonId);
      if (!ingestion) return item;
      return mergeSessionContent(item, ingestion);
    });
  }

  function mergeSessionContent(item, ingestion) {
    const next = { ...item, lastUpdated: ingestion.lastUpdated || item.lastUpdated };
    if (ingestion.prep) next.prep = mergeStatusTarget(item.prep, ingestion.prep, "קיים");
    if (ingestion.summary) next.summary = mergeStatusTarget(item.summary, ingestion.summary, "קיים");
    if (ingestion.relatedKnowledge?.length) next.ingestionKnowledgeLinks = ingestion.relatedKnowledge;
    if (ingestion.questions?.count) next.status = `${ingestion.questions.count} שאלות`;
    return next;
  }

  function mergeStatusTarget(existing, source, availableLabel) {
    const status = source.status || existing?.status || "missing";
    return {
      ...(existing || {}),
      status,
      label: status === "available" ? availableLabel : "טרם קיים",
      href: normalizeRelativeHref(source.href || existing?.href || ""),
      updatedAt: source.updatedAt || existing?.updatedAt || ""
    };
  }

  function matches(item, query, filter) {
    const text = normalize([
      item.number,
      item.title,
      item.status,
      item.relatedKnowledge.map((key) => labels[key] || key).join(" ")
    ].join(" "));

    if (query && !text.includes(query)) return false;
    if (filter === "has-prep") return item.prep.status === "available";
    if (filter === "has-summary") return item.summary.status === "available";
    if (filter === "missing") return item.prep.status !== "available" && item.summary.status !== "available";
    if (filter === "exam") return item.examFocus === true;
    return true;
  }

  function renderSession(item) {
    const rowClasses = ["learning-session-row"];
    if (item.prep.status === "available") rowClasses.push("has-prep");
    if (item.examFocus) rowClasses.push("is-exam-focus");

    return `
      <article class="${rowClasses.join(" ")}" data-session-id="${escapeHtml(item.id)}">
        <div class="learning-session-number" aria-label="מפגש ${escapeHtml(item.number)}">${escapeHtml(item.number)}</div>
        <div class="learning-session-topic">
          <h2>מפגש ${escapeHtml(item.number)} — ${escapeHtml(item.title)}</h2>
          <div class="learning-session-meta">
            ${item.examFocus ? '<span class="learning-tag learning-tag--exam">נושא מבחן</span>' : ""}
            ${item.status ? `<span class="learning-tag">${escapeHtml(item.status)}</span>` : ""}
            ${item.lastUpdated ? `<span class="learning-tag">עודכן ${escapeHtml(item.lastUpdated)}</span>` : ""}
          </div>
        </div>
        <div class="learning-session-cell" data-label="הכנה לשיעור">${statusLink(item.prep)}</div>
        <div class="learning-session-cell" data-label="סיכום שיעור">${statusLink(item.summary)}</div>
        <div class="learning-session-knowledge">${knowledgeLinks(item, 4)}</div>
        <div class="learning-session-status">${statusBadge(item)}</div>
      </article>
    `;
  }

  function statusLink(target) {
    if (!target || target.status !== "available" || !target.href) {
      return '<span class="learning-missing" aria-disabled="true">טרם קיים</span>';
    }
    return `<a class="learning-pill-link learning-status--available" href="${escapeAttr(target.href)}">${escapeHtml(target.label || "קיים")}</a>`;
  }

  function statusBadge(item) {
    const status = item.prep.status === "available"
      ? "הכנה זמינה"
      : item.summary.status === "available"
        ? "סיכום זמין"
        : item.examFocus
          ? "נושא מבחן"
          : "בהמשך";
    return `<span class="learning-status ${item.prep.status === "available" ? "learning-status--available" : ""}">${escapeHtml(status)}</span>`;
  }

  function knowledgeLinks(item, limit) {
    if (item.ingestionKnowledgeLinks?.length) {
      return item.ingestionKnowledgeLinks.slice(0, limit || 3).map((href) => {
        const key = href.split("/").pop().replace(/\.html$/, "");
        const label = labels[key] || key;
        return linkButton(normalizeRelativeHref(href), label, "btn secondary learning-mini-link");
      }).join("");
    }
    const keys = (item.relatedKnowledge || []).slice(0, limit || 3);
    if (!keys.length) return '<span class="learning-missing">אין קישורים</span>';
    return keys.map((key) => {
      const href = knowledgeHref(key);
      const label = labels[key] || key;
      return linkButton(href, label, "btn secondary learning-mini-link");
    }).join("");
  }

  function knowledgeHref(key) {
    if (key === "master-hub") return "master-hub.html";
    if (key === "glossary") return "glossary.html";
    return `knowledge/${key}.html`;
  }

  function linkButton(href, label, className) {
    if (!href) return "";
    return `<a class="${className}" href="${escapeAttr(href)}">${escapeHtml(label)}</a>`;
  }

  function normalizeRelativeHref(href) {
    if (!href || /^(https?:|mailto:|#)/.test(href)) return href || "";
    if (href.startsWith("pages/")) return href.replace(/^pages\//, "");
    return href;
  }

  function emptyState(title, body) {
    return `
      <article class="learning-empty-state">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(body)}</p>
      </article>
    `;
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }
})();

(function () {
  "use strict";

  const map = window.CourseContentIngestionMap || {};
  const learningMap = window.CourseLearningPathMap || {};
  const lessons = Array.isArray(map.lessons) ? map.lessons : [];

  document.addEventListener("DOMContentLoaded", () => {
    renderLatestUpdate();
    renderStatusDashboard();
    renderCompletionList();
  });

  function renderLatestUpdate() {
    document.querySelectorAll("[data-content-latest-update]").forEach((root) => {
      const update = map.latestUpdate;
      if (!update) return;
      const href = relativeHref(update.href || "#");
      root.innerHTML = `
        <article class="content-mini-card content-latest-update-card">
          <p class="kicker">${escapeHtml(update.typeLabel || update.type || "עדכון")} · עודכן ${escapeHtml(update.updatedAt || "")}</p>
          <h3>${escapeHtml(update.title || "עדכון תוכן")}</h3>
          <p>${escapeHtml(update.description || "")}</p>
          <div class="learning-actions" data-read-aloud-exclude="true">
            ${href ? `<a class="btn" href="${escapeAttr(href)}">פתח עדכון</a>` : ""}
            <a class="btn secondary" href="${escapeAttr(relativeHref("pages/learning-path.html"))}">מסלול הלימוד</a>
          </div>
        </article>
      `;
    });
  }

  function renderStatusDashboard() {
    document.querySelectorAll("[data-content-status-dashboard]").forEach((root) => {
      const sessionCount = Array.isArray(learningMap.sessions) ? learningMap.sessions.length : lessons.length;
      const prepCount = lessons.filter((item) => item.prep && item.prep.status === "available").length;
      const summaryCount = lessons.filter((item) => item.summary && item.summary.status === "available").length;
      const missingSummaries = lessons.filter((item) => item.summary && item.summary.status === "missing").length;
      const questionCount = lessons.reduce((sum, item) => sum + Number(item.questions?.count || 0), 0);
      root.innerHTML = `
        <div class="content-status-grid">
          ${metric("שיעורים במסלול", sessionCount)}
          ${metric("הכנות זמינות", prepCount)}
          ${metric("סיכומים זמינים", summaryCount)}
          ${metric("סיכומים חסרים", missingSummaries)}
          ${metric("שאלות אינטראקטיביות", questionCount)}
          ${metric("עדכון אחרון", map.latestUpdate?.updatedAt || map.updatedAt || "לא ידוע")}
        </div>
      `;
    });
  }

  function renderCompletionList() {
    document.querySelectorAll("[data-content-completion-list]").forEach((root) => {
      if (!lessons.length) {
        root.innerHTML = "<p>עדיין לא הוגדרו שיעורים במפת ההזנה.</p>";
        return;
      }
      root.innerHTML = lessons.map((item) => {
        const prep = item.prep?.status === "available" ? "הכנה קיימת" : "חסרה הכנה";
        const summary = item.summary?.status === "available" ? "סיכום קיים" : "חסר סיכום";
        return `
          <article class="learning-index-card">
            <span class="learning-status">${escapeHtml("מפגש " + item.sessionNumber)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(prep)} · ${escapeHtml(summary)} · ${Number(item.questions?.count || 0)} שאלות</p>
            <div class="learning-actions" data-read-aloud-exclude="true">
              ${item.prep?.href ? `<a class="btn" href="${escapeAttr(relativeHref(item.prep.href))}">פתח הכנה</a>` : ""}
              ${item.summary?.href ? `<a class="btn secondary" href="${escapeAttr(relativeHref(item.summary.href))}">פתח סיכום</a>` : ""}
            </div>
          </article>
        `;
      }).join("");
    });
  }

  function metric(label, value) {
    return `
      <article class="metric content-status-metric">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value))}</strong>
      </article>
    `;
  }

  function relativeHref(href) {
    if (!href || /^(https?:|mailto:|#)/.test(href)) return href || "";
    const path = location.pathname.replace(/\\/g, "/");
    const depth = (path.match(/\/pages\/templates\//) || path.match(/\/pages\/prep\//) || path.match(/\/pages\/summaries\//)) ? 2 : /\/pages\//.test(path) ? 1 : 0;
    if (depth === 0) return href;
    if (href.startsWith("pages/")) return "../".repeat(depth - 1) + href.replace(/^pages\//, "");
    return "../".repeat(depth) + href;
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

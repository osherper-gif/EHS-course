(function () {
  // Pure UI shim for admin.html. Does NOT touch Firestore — it only:
  //   1. Switches between tabs
  //   2. Filters table rows by text input
  //   3. Recomputes mini-stats from the rendered tbody data once admin.js has populated
  //
  // admin.js populates #usersTableBody, #feedbackReportsBody, #examScoresBody asynchronously,
  // so we observe those tbodies and update stats/visibility whenever rows change.

  function initTabs() {
    const tabs = Array.from(document.querySelectorAll(".admin-tab"));
    const panels = Array.from(document.querySelectorAll(".admin-panel"));
    if (!tabs.length || !panels.length) return;
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.adminTab;
        tabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle("is-active", active);
          t.setAttribute("aria-selected", active ? "true" : "false");
        });
        panels.forEach((p) => {
          const active = p.dataset.adminPanel === target;
          p.classList.toggle("is-active", active);
          p.hidden = !active;
        });
      });
    });
  }

  function rowMatches(row, query) {
    if (!query) return true;
    const text = (row.textContent || "").toLowerCase();
    return text.includes(query);
  }

  function wireSearch(inputId, tbodyId) {
    const input = document.getElementById(inputId);
    const tbody = document.getElementById(tbodyId);
    if (!input || !tbody) return;
    const apply = () => {
      const q = (input.value || "").toLowerCase().trim();
      Array.from(tbody.children).forEach((tr) => {
        tr.style.display = rowMatches(tr, q) ? "" : "none";
      });
    };
    input.addEventListener("input", apply);
    // Re-apply whenever rows change (admin.js loads asynchronously)
    new MutationObserver(apply).observe(tbody, { childList: true });
  }

  function recomputeUserStats() {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;
    let pending = 0, approved = 0, blocked = 0;
    tbody.querySelectorAll(".status-pill[data-status]").forEach((span) => {
      const s = span.dataset.status;
      if (s === "approved") approved += 1;
      else if (s === "blocked") blocked += 1;
      else if (s === "pending") pending += 1;
    });
    setStat("users-pending", pending);
    setStat("users-approved", approved);
    setStat("users-blocked", blocked);
  }

  function recomputeFeedbackStats() {
    const tbody = document.getElementById("feedbackReportsBody");
    if (!tbody) return;
    let open = 0;
    tbody.querySelectorAll(".status-pill[data-status]").forEach((span) => {
      const s = span.dataset.status;
      if (s === "open" || s === "in_progress") open += 1;
    });
    setStat("feedback-open", open);
  }

  function setStat(name, value) {
    const host = document.querySelector('[data-admin-stat="' + name + '"] strong');
    if (host) host.textContent = String(value);
  }

  function observeForStats() {
    const users = document.getElementById("usersTableBody");
    if (users) new MutationObserver(recomputeUserStats).observe(users, { childList: true, subtree: true });
    const feedback = document.getElementById("feedbackReportsBody");
    if (feedback) new MutationObserver(recomputeFeedbackStats).observe(feedback, { childList: true, subtree: true });
  }

  function init() {
    initTabs();
    wireSearch("usersSearch", "usersTableBody");
    wireSearch("feedbackSearch", "feedbackReportsBody");
    wireSearch("examScoresSearch", "examScoresBody");
    observeForStats();
    // initial pass in case admin.js already finished
    recomputeUserStats();
    recomputeFeedbackStats();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

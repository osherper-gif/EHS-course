(function () {
  function initTheme() {
    const saved = CourseStorage.get("theme", "light");
    document.documentElement.dataset.theme = saved;
    document.querySelectorAll('[data-action="toggle-theme"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        CourseStorage.set("theme", next);
      });
    });
  }
  function initNotes() {
    document.querySelectorAll("[data-note]").forEach((textarea) => {
      const id = textarea.dataset.note;
      textarea.value = CourseStorage.notes()[id] || "";
      textarea.addEventListener("input", () => CourseStorage.saveNote(id, textarea.value));
    });
    document.querySelectorAll('[data-action="clear-note"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.noteId;
        CourseStorage.saveNote(id, "");
        const textarea = document.querySelector('[data-note="' + id + '"]');
        if (textarea) textarea.value = "";
      });
    });
  }
  function initProgress() {
    const progress = CourseStorage.progress();
    document.querySelectorAll("[data-complete]").forEach((input) => {
      const id = input.dataset.complete;
      input.checked = Boolean(progress[id]);
      input.addEventListener("change", () => {
        CourseStorage.setComplete(id, input.checked);
        updateProgressStats();
      });
    });
    document.querySelectorAll("[data-progress]").forEach((bar) => {
      bar.value = progress[bar.dataset.progress] ? 100 : 0;
    });
    updateProgressStats();
  }
  function updateProgressStats() {
    const progress = CourseStorage.progress();
    document.querySelectorAll("[data-progress]").forEach((bar) => {
      bar.value = progress[bar.dataset.progress] ? 100 : 0;
    });
    const stat = document.querySelector('[data-stat="completed"]');
    if (stat) stat.textContent = Object.values(progress).filter(Boolean).length;
  }
  function initGlobalSearch() {
    const input = document.getElementById("globalSearch");
    const topic = document.getElementById("topicFilter");
    const results = document.getElementById("searchResults");
    if (!input || !results) return;
    const run = async () => CourseSearch.renderResults(results, await CourseSearch.search(input.value, topic ? topic.value : ""), input.value);
    input.addEventListener("input", run);
    if (topic) topic.addEventListener("change", () => {
      document.querySelectorAll("#lessonGrid .lesson-card").forEach((card) => {
        card.hidden = topic.value && card.dataset.topic !== topic.value;
      });
      run();
    });
  }
  function initGlossarySearch() {
    const input = document.getElementById("glossarySearch");
    const list = document.getElementById("glossaryList");
    if (!input || !list) return;
    input.addEventListener("input", () => {
      const q = CourseSearch.normalize(input.value);
      list.querySelectorAll(".term-card").forEach((card) => {
        card.hidden = q && !CourseSearch.normalize(card.textContent).includes(q);
      });
    });
  }
  function loadSearchScript() {
    if (window.CourseSearch) return Promise.resolve();
    const prefix = location.pathname.includes("/pages/") ? "../" : "./";
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = prefix + "js/search.js";
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  function initSiteSearch() {
    let actions = document.querySelector(".header-actions");
    if (!actions) {
      const headerInner = document.querySelector(".header-inner");
      if (!headerInner) return;
      actions = document.createElement("div");
      actions.className = "header-actions";
      headerInner.append(actions);
    }
    if (document.querySelector('[data-action="open-site-search"]')) return;
    const openButton = document.createElement("button");
    openButton.className = "btn secondary site-search-open";
    openButton.type = "button";
    openButton.dataset.action = "open-site-search";
    openButton.setAttribute("aria-haspopup", "dialog");
    openButton.textContent = "חיפוש באתר";
    actions.prepend(openButton);

    let dialog;
    let lastFocus;
    function closeSearch() {
      if (!dialog) return;
      dialog.hidden = true;
      document.body.classList.remove("site-search-active");
      lastFocus?.focus();
    }
    function ensureDialog() {
      if (dialog) return dialog;
      dialog = document.createElement("section");
      dialog.className = "site-search-overlay";
      dialog.hidden = true;
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-labelledby", "siteSearchTitle");
      const backdrop = document.createElement("div");
      backdrop.className = "site-search-backdrop";
      backdrop.dataset.action = "close-site-search";
      const panel = document.createElement("div");
      panel.className = "site-search-dialog";
      const head = document.createElement("div");
      head.className = "site-search-head";
      const title = document.createElement("h2");
      title.id = "siteSearchTitle";
      title.textContent = "חיפוש באתר";
      const close = document.createElement("button");
      close.className = "site-search-close";
      close.type = "button";
      close.dataset.action = "close-site-search";
      close.setAttribute("aria-label", "סגירת חיפוש");
      close.textContent = "×";
      head.append(title, close);
      const label = document.createElement("label");
      label.className = "site-search-field";
      const labelText = document.createElement("span");
      labelText.textContent = "הקלד מושג, נושא או שאלה";
      const input = document.createElement("input");
      input.id = "siteSearchInput";
      input.type = "search";
      input.autocomplete = "off";
      input.placeholder = "לדוגמה: סיכון, עבודה בגובה, חלל מוקף";
      label.append(labelText, input);
      const status = document.createElement("div");
      status.id = "siteSearchStatus";
      status.className = "field-help";
      status.setAttribute("role", "status");
      status.textContent = "החיפוש נטען רק לאחר פתיחת החלון.";
      const results = document.createElement("div");
      results.id = "siteSearchResults";
      results.className = "site-search-results";
      panel.append(head, label, status, results);
      dialog.append(backdrop, panel);
      document.body.append(dialog);
      dialog.addEventListener("click", (event) => {
        if (event.target.closest('[data-action="close-site-search"]')) closeSearch();
      });
      dialog.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeSearch();
      });
      return dialog;
    }
    openButton.addEventListener("click", async () => {
      lastFocus = document.activeElement;
      const panel = ensureDialog();
      panel.hidden = false;
      document.body.classList.add("site-search-active");
      const input = panel.querySelector("#siteSearchInput");
      const results = panel.querySelector("#siteSearchResults");
      const status = panel.querySelector("#siteSearchStatus");
      input.focus();
      try {
        await loadSearchScript();
        status.textContent = "הקלד לפחות שתי אותיות כדי לחפש בשיעורים, שאלות וכלי שטח.";
      } catch (error) {
        status.textContent = "החיפוש המקומי לא נטען כרגע.";
        return;
      }
      if (!input.dataset.ready) {
        let timer = 0;
        input.addEventListener("input", () => {
          clearTimeout(timer);
          timer = window.setTimeout(async () => {
            const query = input.value.trim();
            if (query.length < 2) {
              results.replaceChildren();
              status.textContent = "הקלד לפחות שתי אותיות כדי להתחיל חיפוש.";
              return;
            }
            status.textContent = "מחפש...";
            const found = await window.CourseSearch.search(query);
            window.CourseSearch.renderResults(results, found, query);
            status.textContent = found.length ? "נמצאו " + found.length + " תוצאות." : "לא נמצאו תוצאות.";
          }, 120);
        });
        input.dataset.ready = "true";
      }
    });
  }
  function initActions() {
    document.querySelectorAll('[data-action="print"]').forEach((btn) => btn.addEventListener("click", () => window.print()));
    document.querySelectorAll('[data-action="export-notes"]').forEach((btn) => btn.addEventListener("click", () => CourseStorage.exportNotes()));
  }
  function initExamDashboard() {
    const last = document.querySelector('[data-exam-stat="last"]');
    if (!last) return;
    const attempts = JSON.parse(localStorage.getItem("safetyCourse:examAttempts") || "[]");
    const count = document.querySelector('[data-exam-stat="count"]');
    const avg = document.querySelector('[data-exam-stat="avg"]');
    const topic = document.querySelector('[data-exam-stat="topic"]');
    if (!attempts.length) {
      last.textContent = "-";
      if (count) count.textContent = "0";
      if (avg) avg.textContent = "-";
      if (topic) topic.textContent = "-";
      return;
    }
    const latest = attempts[attempts.length - 1];
    const average = Math.round(attempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0) / attempts.length);
    last.textContent = latest.score + "%";
    if (count) count.textContent = attempts.length;
    if (avg) avg.textContent = average + "%";
    if (topic) topic.textContent = latest.topic || "כל הנושאים";
  }
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNotes();
    initProgress();
    initExamDashboard();
    initSiteSearch();
    initGlobalSearch();
    initGlossarySearch();
    initActions();
    window.CourseQuizzes?.initQuiz();
    window.CourseAssistant?.initAssistant();
  });
})();

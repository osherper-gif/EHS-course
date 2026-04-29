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
    const run = () => CourseSearch.renderResults(results, CourseSearch.search(input.value, topic ? topic.value : ""));
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
    initGlobalSearch();
    initGlossarySearch();
    initActions();
    window.CourseQuizzes?.initQuiz();
    window.CourseAssistant?.initAssistant();
  });
})();

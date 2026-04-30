(function () {
  // Wires the new design-system widgets (lesson picker, mistakes panel, simulation CTA)
  // back into the existing #quizLesson / #startQuiz / #examCount / #startExam controls.
  // No backend changes — purely a UI shim on top of quizzes.js + exam.js.

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function lessonTitle(id) {
    const meet = (window.COURSE_DATA?.meetings || []).find((m) => m.id === id);
    return meet ? meet.title : id;
  }

  function questionCountForLesson(id) {
    const pool = (window.COURSE_DATA?.questions || []);
    const fromCourse = pool.filter((q) => q.lessonId === id).length;
    if (fromCourse) return fromCourse;
    const exam = (window.EXAM_QUESTIONS || []).filter((q) => q.relatedLessonId === id).length;
    return exam;
  }

  function buildLessonPicker(host) {
    const meetings = (window.COURSE_DATA?.meetings || []).slice(0, 12);
    if (!meetings.length) return;
    host.innerHTML = meetings.map((m) => {
      const count = questionCountForLesson(m.id);
      const num = m.number || (m.id || "").replace(/[^0-9]/g, "");
      return ''
        + '<button type="button" class="lesson-picker-card" data-lesson="' + escapeHtml(m.id) + '">'
        +   '<span class="lesson-num">' + escapeHtml(num) + '</span>'
        +   '<strong>' + escapeHtml(m.title) + '</strong>'
        +   '<small>' + count + ' שאלות</small>'
        + '</button>';
    }).join("");

    host.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-lesson]");
      if (!btn) return;
      const select = document.getElementById("quizLesson");
      const start = document.getElementById("startQuiz");
      if (!select || !start) return;
      select.value = btn.dataset.lesson;
      // mark visual selection
      host.querySelectorAll(".lesson-picker-card").forEach((b) => b.classList.toggle("is-active", b === btn));
      start.click();
      // scroll to the quiz container
      document.getElementById("quizContainer")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function renderMistakesPanel(host) {
    const list = window.CourseStorage?.mistakes?.() || [];
    host.replaceChildren();

    const head = document.createElement("div");
    head.className = "mistakes-panel-head";
    const title = document.createElement("h3");
    title.textContent = "טעויות אחרונות";
    const counter = document.createElement("span");
    counter.className = "tag tag-warn";
    counter.textContent = list.length + " שאלות";
    head.append(title, counter);
    host.append(head);

    if (!list.length) {
      const empty = document.createElement("p");
      empty.className = "mistakes-empty";
      empty.textContent = "אין טעויות אחרונות שמורות. התחילו תרגול או מבחן וכל שאלה שתסומן בטעות תופיע כאן עם ההסבר.";
      host.append(empty);
      return;
    }

    const ul = document.createElement("ul");
    ul.className = "mistakes-list";
    // newest first
    [...list].reverse().forEach((m) => {
      const li = document.createElement("li");
      const q = document.createElement("p");
      q.className = "mistake-q";
      q.textContent = m.question || "";
      const meta = document.createElement("p");
      meta.className = "mistake-meta";
      const chosen = m.chosen || "(לא נבחרה תשובה)";
      meta.textContent = "בחרת: " + chosen + " | תשובה נכונה: " + (m.correct || "");
      const tags = document.createElement("p");
      tags.className = "mistake-tags";
      if (m.lessonId) {
        const t1 = document.createElement("span");
        t1.className = "tag tag-info";
        t1.textContent = lessonTitle(m.lessonId);
        tags.append(t1);
      }
      if (m.topic) {
        const t2 = document.createElement("span");
        t2.className = "tag tag-neutral";
        t2.textContent = m.topic;
        tags.append(t2);
      }
      li.append(q, meta, tags);
      ul.append(li);
    });
    host.append(ul);

    const actions = document.createElement("div");
    actions.className = "mistakes-actions";

    const practiceBtn = document.createElement("button");
    practiceBtn.type = "button";
    practiceBtn.className = "btn";
    practiceBtn.textContent = "תרגל שוב רק טעויות";
    practiceBtn.addEventListener("click", () => practiceMistakes(list));

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "btn secondary";
    clearBtn.textContent = "נקה רשימה";
    clearBtn.addEventListener("click", () => {
      if (!confirm("למחוק את רשימת הטעויות השמורות?")) return;
      window.CourseStorage?.clearMistakes?.();
      renderMistakesPanel(host);
    });

    actions.append(practiceBtn, clearBtn);
    host.append(actions);
  }

  function practiceMistakes(list) {
    // Switch the quiz dropdown to "all lessons", then run #startQuiz click — but
    // intercept the renderQuestion phase by replacing the active quiz pool just
    // for this run via a one-shot patch on window.COURSE_DATA.questions.
    if (!list || !list.length) return;
    const ids = new Set(list.map((m) => m.questionId).filter(Boolean));
    if (!ids.size) {
      alert("אין מזהי שאלה תקפים בטעויות השמורות.");
      return;
    }
    const original = window.COURSE_DATA?.questions;
    if (!original) {
      alert("מאגר השאלות לא נטען עדיין.");
      return;
    }
    const filtered = original.filter((q) => ids.has(q.id));
    if (!filtered.length) {
      alert("השאלות שטעית בהן אינן זמינות במאגר הבוחן הקצר. נסה שוב במבחן מלא.");
      return;
    }
    window.COURSE_DATA.questions = filtered;
    const select = document.getElementById("quizLesson");
    if (select) select.value = "";
    const start = document.getElementById("startQuiz");
    start?.click();
    document.getElementById("quizContainer")?.scrollIntoView({ behavior: "smooth", block: "start" });
    // restore on next animation frame so quiz already captured the questions
    requestAnimationFrame(() => {
      window.COURSE_DATA.questions = original;
    });
  }

  function wireSimulation() {
    const btn = document.getElementById("startSimulation");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const count = document.getElementById("examCount");
      const start = document.getElementById("startExam");
      if (!count || !start) return;
      count.value = "60";
      start.click();
      document.getElementById("examForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function init() {
    const picker = document.getElementById("quizLessonPicker");
    if (picker) buildLessonPicker(picker);

    const mistakes = document.getElementById("mistakesPanel");
    if (mistakes) renderMistakesPanel(mistakes);

    wireSimulation();

    // Refresh the mistakes panel after each quiz answer click — quizzes.js
    // records mistakes in CourseStorage; this keeps the panel current.
    document.getElementById("quizContainer")?.addEventListener("click", () => {
      if (mistakes) requestAnimationFrame(() => renderMistakesPanel(mistakes));
    });

    // Honor #mistakes hash by scrolling there on load
    if (location.hash === "#mistakes" && mistakes) {
      mistakes.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Honor #simulation hash by scrolling to the CTA on the exam page
    if (location.hash === "#simulation") {
      document.getElementById("startSimulation")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

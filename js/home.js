(function () {
  // Mobile First P2: home continuation cards and lightweight local state.

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function lessonHrefById(id) {
    if (!id || !/^lesson-\d{2}$/.test(id)) return null;
    return "./pages/" + id + ".html";
  }

  function findLessonTitle(id) {
    const meet = (window.COURSE_DATA?.meetings || []).find((m) => m.id === id);
    return meet ? meet.title : "";
  }

  function relativePageHref(path) {
    const clean = String(path || "").replace(/^\/+/, "");
    if (!clean || clean === "index.html") return "";
    return clean.startsWith("pages/") ? "./" + clean : "./" + clean;
  }

  function readGameProgress() {
    try {
      return JSON.parse(localStorage.getItem("safetyCourse:game:progress") || "null") || null;
    } catch {
      return null;
    }
  }

  function card(icon, title, text, href, buttonText) {
    return ""
      + '<div class="card-icon"><svg width="22" height="22" aria-hidden="true"><use href="./assets/icons.svg#' + escapeHtml(icon) + '"/></svg></div>'
      + '<div>'
      +   '<h3>' + escapeHtml(title) + '</h3>'
      +   '<p class="meta-row">' + escapeHtml(text) + '</p>'
      + '</div>'
      + '<a class="btn" href="' + escapeHtml(href) + '">' + escapeHtml(buttonText) + '</a>';
  }

  function renderContinue() {
    const host = document.getElementById("continueWhereLeft");
    if (!host) return;
    const lastLesson = window.CourseStorage?.lastVisited?.();
    const lessonHref = lastLesson && lessonHrefById(lastLesson.lessonId);
    host.hidden = false;
    host.classList.add("m-home-continue", "m-home-continue--p2");

    if (lastLesson && lessonHref) {
      const title = lastLesson.title || findLessonTitle(lastLesson.lessonId) || lastLesson.lessonId;
      const at = lastLesson.at ? " · " + new Date(lastLesson.at).toLocaleDateString("he-IL") : "";
      host.innerHTML = card("i-play", "המשך מאיפה שעצרת", title + at, lessonHref, "המשך שיעור");
      return;
    }

    const lastPage = window.CourseStorage?.lastPage?.();
    const pageHref = relativePageHref(lastPage?.path);
    if (pageHref) {
      host.innerHTML = card("i-play", "המשך מאיפה שעצרת", lastPage.title || "העמוד האחרון", pageHref, "פתח עמוד אחרון");
      return;
    }

    host.innerHTML = card("i-book", "המשך מאיפה שעצרת", "עדיין לא התחלת שיעור. מומלץ להתחיל מהשיעור הראשון או להיכנס לתרגול.", "./pages/lesson-01.html", "התחל שיעור ראשון");
  }

  function nextIncompleteLesson(progress) {
    for (let i = 1; i <= 12; i += 1) {
      const id = "lesson-" + String(i).padStart(2, "0");
      if (!progress[id]) return id;
    }
    return "";
  }

  function renderNextActions() {
    const host = document.getElementById("nextActions");
    if (!host) return;
    const items = [];
    const progress = window.CourseStorage?.progress?.() || {};
    const attempts = window.CourseStorage?.get?.("examAttempts", []);
    const mistakes = window.CourseStorage?.mistakes?.() || [];
    const game = readGameProgress();
    const lastAttempt = Array.isArray(attempts) && attempts.length ? attempts[attempts.length - 1] : null;
    const lastExam = window.CourseStorage?.lastExam?.();

    if (mistakes.length > 0) {
      items.push({ label: "חזור על טעויות (" + mistakes.length + ")", href: "./pages/quizzes.html#mistakes", ico: "i-warning" });
    }

    const nextLesson = nextIncompleteLesson(progress);
    if (nextLesson) {
      items.push({
        label: "המשך לשיעור הבא: " + (findLessonTitle(nextLesson) || nextLesson),
        href: "./pages/" + nextLesson + ".html",
        ico: "i-book",
      });
    }

    if (lastAttempt) {
      items.push({ label: "המשך תרגול: ציון אחרון " + lastAttempt.score + "%", href: "./pages/exam-questions.html", ico: "i-quiz" });
    } else if (lastExam) {
      items.push({ label: "המשך מבחן בנושא " + (lastExam.topic || "אחרון"), href: "./pages/exam-questions.html", ico: "i-quiz" });
    } else {
      items.push({ label: "התחל מבחן ראשון", href: "./pages/exam-questions.html", ico: "i-quiz" });
    }

    if (game && (Number(game.totalXp || 0) > 0 || game.currentStage)) {
      items.push({ label: "המשך אתגר בטיחות", href: "./pages/safety-game.html", ico: "i-shield" });
    }

    host.innerHTML = items.slice(0, 5).map((it) => ""
      + '<a class="next-action-chip m-home-action-chip" href="' + escapeHtml(it.href) + '">'
      +   '<svg class="ico" width="18" height="18" aria-hidden="true"><use href="./assets/icons.svg#' + escapeHtml(it.ico) + '"/></svg>'
      +   '<span>' + escapeHtml(it.label) + '</span>'
      + '</a>'
    ).join("");
  }

  function init() {
    renderContinue();
    renderNextActions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

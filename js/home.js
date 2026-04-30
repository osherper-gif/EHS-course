(function () {
  // Home-page enhancements: "continue where left off" + "next actions"
  // Pure additive: relies on data already in localStorage. Does NOT touch auth/firestore.

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
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

  function renderContinue() {
    const host = document.getElementById("continueWhereLeft");
    if (!host) return;
    const last = window.CourseStorage?.lastVisited?.();
    const href = last && lessonHrefById(last.lessonId);
    if (!last || !href) {
      host.hidden = true;
      return;
    }
    const title = last.title || findLessonTitle(last.lessonId) || last.lessonId;
    const at = last.at ? new Date(last.at).toLocaleDateString("he-IL") : "";
    host.hidden = false;
    host.innerHTML = ''
      + '<div class="card-icon"><svg width="22" height="22" aria-hidden="true"><use href="./assets/icons.svg#i-play"/></svg></div>'
      + '<div>'
      +   '<h3>המשך מאיפה שעצרת</h3>'
      +   '<p class="meta-row"><strong>' + escapeHtml(title) + '</strong>' + (at ? ' · ' + escapeHtml(at) : '') + '</p>'
      + '</div>'
      + '<a class="btn" href="' + escapeHtml(href) + '">המשך השיעור</a>';
  }

  function renderNextActions() {
    const host = document.getElementById("nextActions");
    if (!host) return;
    const items = [];

    const attempts = window.CourseStorage?.get?.("examAttempts", []);
    const examCount = Array.isArray(attempts) ? attempts.length : 0;

    const mistakes = window.CourseStorage?.mistakes?.() || [];
    if (mistakes.length > 0) {
      items.push({
        label: "תרגל שוב טעויות אחרונות (" + mistakes.length + ")",
        href: "./pages/quizzes.html#mistakes",
        ico: "i-warning",
      });
    }

    const progress = window.CourseStorage?.progress?.() || {};
    const completed = Object.values(progress).filter(Boolean).length;
    if (completed < 12) {
      // suggest next incomplete lesson
      const nextId = (function () {
        for (let i = 1; i <= 12; i++) {
          const id = "lesson-" + String(i).padStart(2, "0");
          if (!progress[id]) return id;
        }
        return null;
      })();
      if (nextId) {
        items.push({
          label: "המשך לשיעור הבא: " + (findLessonTitle(nextId) || nextId),
          href: "./pages/" + nextId + ".html",
          ico: "i-book",
        });
      }
    }

    if (examCount === 0) {
      items.push({ label: "התחל מבחן ראשון", href: "./pages/exam-questions.html", ico: "i-quiz" });
    } else {
      items.push({ label: "מבחן סימולציה (54 שאלות)", href: "./pages/exam-questions.html#simulation", ico: "i-quiz" });
    }

    items.push({ label: "שאל את עוזר ה-AI", href: "./pages/ai-assistant.html", ico: "i-ai" });

    host.innerHTML = items.map((it) => ''
      + '<a class="next-action-chip" href="' + escapeHtml(it.href) + '">'
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

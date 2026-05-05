(function () {
  // Home engagement layer: local-first progress, continuation and recent activity.

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

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") || fallback;
    } catch {
      return fallback;
    }
  }

  function readGameProgress() {
    return readJson("safetyCourse:game:progress", null);
  }

  function readExamAttempts() {
    return readJson("safetyCourse:examAttempts", []);
  }

  function readExamDraft() {
    return readJson("safetyCourse:mobileExamDraft", null);
  }

  function statsWithDerivedValues() {
    const progress = window.CourseStorage?.progress?.() || {};
    const stats = window.CourseStorage?.stats?.() || {};
    const attempts = readExamAttempts();
    const game = readGameProgress();
    const derived = {
      ...stats,
      lessonsCompleted: Math.max(Number(stats.lessonsCompleted || 0), Object.values(progress).filter(Boolean).length),
      examsCompleted: Math.max(Number(stats.examsCompleted || 0), attempts.length),
      gameXP: Math.max(Number(stats.gameXP || 0), Number(game?.totalXp || 0)),
    };
    if (!Number(derived.totalQuestionsAnswered || 0) && attempts.length) {
      derived.totalQuestionsAnswered = attempts.reduce((sum, attempt) => sum + Number(attempt.totalQuestions || 0), 0);
      derived.totalCorrect = attempts.reduce((sum, attempt) => sum + Number(attempt.correctCount || 0), 0);
      derived.totalWrong = attempts.reduce((sum, attempt) => sum + Number(attempt.wrongCount || 0), 0);
    }
    return derived;
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

    host.innerHTML = card("i-book", "התחלה מומלצת", "עדיין לא התחלת פעילות. מומלץ להתחיל מהשיעור הראשון ואז לעבור לתרגול קצר.", "./pages/lesson-01.html", "התחל שיעור ראשון");
  }

  function nextIncompleteLesson(progress) {
    for (let i = 1; i <= 12; i += 1) {
      const id = "lesson-" + String(i).padStart(2, "0");
      if (!progress[id]) return id;
    }
    return "";
  }

  function recommendedAction(progress, mistakes, examDraft, lastExam) {
    if (examDraft?.questionIds?.length) {
      return {
        title: "המשך מבחן",
        text: "יש מבחן שהתחלת ועדיין לא סיימת. כדאי להשלים אותו לפני מעבר לנושא חדש.",
        href: "./pages/exam-questions.html",
        button: "המשך מבחן",
        icon: "i-quiz",
      };
    }
    const lastLesson = window.CourseStorage?.lastVisited?.();
    const lessonHref = lastLesson?.lessonId && lessonHrefById(lastLesson.lessonId);
    if (lessonHref && !progress[lastLesson.lessonId]) {
      return {
        title: "המשך שיעור",
        text: lastLesson.title || findLessonTitle(lastLesson.lessonId) || "חזור לשיעור האחרון שפתחת.",
        href: lessonHref,
        button: "המשך שיעור",
        icon: "i-book",
      };
    }
    if (mistakes.length) {
      return {
        title: "חזור על טעויות",
        text: "יש " + mistakes.length + " טעויות אחרונות. חזרה ממוקדת תיתן לך את השיפור הכי מהיר.",
        href: "./pages/exam-questions.html?mode=mistakes",
        button: "חזור על טעויות",
        icon: "i-warning",
      };
    }
    if (lastExam?.topic) {
      return {
        title: "המשך תרגול",
        text: "אפשר להמשיך לתרגל את הנושא האחרון: " + lastExam.topic + ".",
        href: "./pages/exam-questions.html",
        button: "המשך תרגול",
        icon: "i-quiz",
      };
    }
    const nextLesson = nextIncompleteLesson(progress);
    return {
      title: nextLesson === "lesson-01" ? "התחל שיעור ראשון" : "המשך לשיעור הבא",
      text: nextLesson ? (findLessonTitle(nextLesson) || nextLesson) : "כל השיעורים סומנו כהושלמו. מומלץ לעבור לתרגול מסכם.",
      href: nextLesson ? "./pages/" + nextLesson + ".html" : "./pages/exam-questions.html",
      button: nextLesson === "lesson-01" ? "התחל שיעור ראשון" : "פתח שיעור",
      icon: "i-play",
    };
  }

  function renderWhatNow() {
    const host = document.getElementById("whatNowCard");
    if (!host) return;
    const progress = window.CourseStorage?.progress?.() || {};
    const mistakes = window.CourseStorage?.mistakes?.() || [];
    const stats = statsWithDerivedValues();
    const answered = Number(stats.totalQuestionsAnswered || 0);
    const correct = Number(stats.totalCorrect || 0);
    const completed = Math.min(Number(stats.lessonsCompleted || 0), 12);
    const percent = Math.round((completed / 12) * 100);
    const successRate = answered ? Math.round((correct / answered) * 100) + "%" : "אין עדיין";
    const action = recommendedAction(progress, mistakes, readExamDraft(), window.CourseStorage?.lastExam?.());
    host.hidden = false;
    host.innerHTML = ""
      + '<div class="home-focus-main">'
      +   '<div class="card-icon"><svg width="24" height="24" aria-hidden="true"><use href="./assets/icons.svg#' + escapeHtml(action.icon) + '"/></svg></div>'
      +   '<div>'
      +     '<p class="kicker">מה כדאי לך לעשות עכשיו</p>'
      +     '<h2 id="whatNowTitle">' + escapeHtml(action.title) + '</h2>'
      +     '<p>' + escapeHtml(action.text) + '</p>'
      +   '</div>'
      +   '<a class="btn primary" href="' + escapeHtml(action.href) + '">' + escapeHtml(action.button) + '</a>'
      + '</div>'
      + '<div class="home-progress-line" aria-label="התקדמות קורס"><span style="width:' + percent + '%"></span></div>'
      + '<div class="home-mini-stats" aria-label="סטטיסטיקה אישית קצרה">'
      +   '<span><strong>' + percent + '%</strong>השלמת קורס</span>'
      +   '<span><strong>' + escapeHtml(successRate) + '</strong>אחוז הצלחה</span>'
      +   '<span><strong>' + answered + '</strong>שאלות שנענו</span>'
      + '</div>';
  }

  function renderMistakeReviewCard() {
    const host = document.getElementById("mistakeReviewCard");
    if (!host) return;
    const mistakes = window.CourseStorage?.mistakes?.() || [];
    if (!mistakes.length) {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    host.innerHTML = ""
      + '<div class="section-title">'
      +   '<div><h2 id="mistakeReviewTitle">חזרה על טעויות</h2><p>נשמרו ' + mistakes.length + ' טעויות אחרונות. זה המקום הכי יעיל להשתפר בו.</p></div>'
      +   '<a class="btn" href="./pages/exam-questions.html?mode=mistakes">תרגל טעויות</a>'
      + '</div>';
  }

  async function renderQuestionIssuesCard() {
    const host = document.getElementById("questionIssuesHome");
    if (!host) return;
    try {
      const { db, collection, getDocs } = await import("./firebase-config.js");
      if (!db) return;
      const snapshot = await getDocs(collection(db, "questionIssues"));
      const issues = snapshot.docs
        .map((item) => item.data())
        .filter((item) => item.priority === "high" && item.status !== "fixed");
      if (!issues.length) {
        host.hidden = true;
        return;
      }
      host.hidden = false;
      host.innerHTML = ""
        + '<div class="section-title">'
        +   '<div><h2 id="questionIssuesHomeTitle">שאלות לבדיקה</h2><p>יש ' + issues.length + ' שאלות שסומנו לבדיקה מקצועית בעקבות דיווחים או דירוג נמוך.</p></div>'
        +   '<a class="btn secondary" href="./pages/exam-questions.html">המשך לתרגל</a>'
        + '</div>';
    } catch {
      host.hidden = true;
    }
  }

  function renderNextActions() {
    const host = document.getElementById("nextActions");
    if (!host) return;
    const items = [];
    const progress = window.CourseStorage?.progress?.() || {};
    const attempts = readExamAttempts();
    const mistakes = window.CourseStorage?.mistakes?.() || [];
    const game = readGameProgress();
    const lastAttempt = Array.isArray(attempts) && attempts.length ? attempts[attempts.length - 1] : null;
    const lastExam = window.CourseStorage?.lastExam?.();

    if (mistakes.length > 0) {
      items.push({ label: "חזור על טעויות אחרונות (" + mistakes.length + ")", href: "./pages/exam-questions.html?mode=mistakes", ico: "i-warning" });
    }

    if (lastExam && !lastAttempt) {
      items.push({ label: "המשך מבחן: " + (lastExam.topic || "תרגול"), href: "./pages/exam-questions.html", ico: "i-quiz" });
    }

    const nextLesson = nextIncompleteLesson(progress);
    if (nextLesson) {
      items.push({
        label: "המשך שיעור: " + (findLessonTitle(nextLesson) || nextLesson),
        href: "./pages/" + nextLesson + ".html",
        ico: "i-book",
      });
    }

    if (lastAttempt) {
      items.push({ label: "המשך תרגול: ציון אחרון " + lastAttempt.score + "%", href: "./pages/exam-questions.html", ico: "i-quiz" });
    } else if (!lastExam) {
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

  function renderUserProgress() {
    const panel = document.getElementById("userProgressPanel");
    if (!panel) return;
    const stats = statsWithDerivedValues();
    const lastLesson = window.CourseStorage?.lastVisited?.();
    const attempts = readExamAttempts();
    const lastAttempt = attempts[attempts.length - 1];
    const completed = Math.min(Number(stats.lessonsCompleted || 0), 12);
    const percent = Math.round((completed / 12) * 100);
    const answered = Number(stats.totalQuestionsAnswered || 0);
    const success = answered ? Math.round((Number(stats.totalCorrect || 0) / answered) * 100) + "%" : "אין מספיק נתונים";
    const continueHref = lastLesson?.lessonId ? lessonHrefById(lastLesson.lessonId) : "./pages/lesson-01.html";
    panel.hidden = false;
    panel.style.setProperty("--m-progress-percent", percent + "%");
    document.getElementById("courseProgressPercent").textContent = percent + "%";
    document.getElementById("lastLessonLabel").textContent = lastLesson?.title || findLessonTitle(lastLesson?.lessonId) || "עדיין לא התחלת";
    document.getElementById("lastExamLabel").textContent = lastAttempt ? (lastAttempt.topic || "מבחן") + " · " + lastAttempt.score + "%" : "עדיין לא בוצע";
    document.getElementById("successRateLabel").textContent = success + (answered ? " · " + answered + " שאלות" : "");
    const text = document.getElementById("userProgressText");
    if (text) text.textContent = completed + "/12 שיעורים הושלמו · " + Number(stats.examsCompleted || 0) + " מבחנים · " + Number(stats.gameXP || 0) + " נקודות";
    const link = document.getElementById("userProgressContinue");
    if (link) link.href = continueHref || "./pages/lesson-01.html";
  }

  function renderNewUserOnboarding() {
    const panel = document.getElementById("newUserOnboarding");
    if (!panel) return;
    const stats = statsWithDerivedValues();
    const lastLesson = window.CourseStorage?.lastVisited?.();
    const hasActivity = lastLesson || Number(stats.totalQuestionsAnswered || 0) > 0 || Number(stats.gameXP || 0) > 0;
    panel.hidden = Boolean(hasActivity);
  }

  function renderWhatsNewHome() {
    const panel = document.getElementById("whatsNewHome");
    const list = document.getElementById("whatsNewHomeList");
    if (!panel || !list) return;
    const versions = Array.isArray(window.SITE_VERSIONS) ? window.SITE_VERSIONS.slice(0, 3) : [];
    if (!versions.length) return;
    panel.hidden = false;
    list.innerHTML = versions.map((version) => ""
      + '<a class="m-update-card" href="./pages/version-management.html">'
      + '<strong>' + escapeHtml(version.versionNumber || version.commitMessage || "עדכון אתר") + '</strong>'
      + '<span>' + escapeHtml(version.date || "") + '</span>'
      + '<p>' + escapeHtml(version.releaseNotes || version.siteChanges || "") + '</p>'
      + '</a>'
    ).join("");
  }

  function renderRecentActivity() {
    const panel = document.getElementById("recentActivityPanel");
    const list = document.getElementById("recentActivityList");
    if (!panel || !list) return;
    const items = [];
    const lastLesson = window.CourseStorage?.lastVisited?.();
    const attempts = readExamAttempts();
    const lastExam = window.CourseStorage?.lastExam?.();
    const game = readGameProgress();
    if (lastLesson?.lessonId) {
      items.push({
        title: "שיעור אחרון",
        text: lastLesson.title || findLessonTitle(lastLesson.lessonId) || lastLesson.lessonId,
        at: lastLesson.at || 0,
        href: lessonHrefById(lastLesson.lessonId) || "./pages/syllabus.html",
      });
    }
    if (attempts.length) {
      const attempt = attempts[attempts.length - 1];
      items.push({
        title: "מבחן אחרון",
        text: (attempt.topic || "מבחן") + " · ציון " + attempt.score + "%",
        at: new Date(attempt.createdAt || Date.now()).getTime(),
        href: "./pages/exam-questions.html",
      });
    } else if (lastExam) {
      items.push({ title: "מבחן שהתחלת", text: lastExam.topic || "תרגול", at: lastExam.at || 0, href: "./pages/exam-questions.html" });
    }
    if (game && (Number(game.totalXp || 0) > 0 || game.currentStage)) {
      items.push({
        title: "אתגר בטיחות",
        text: Number(game.totalXp || 0) + " נקודות · שלב " + (game.currentStage || "stage-01"),
        at: new Date(game.updatedAt || Date.now()).getTime(),
        href: "./pages/safety-game.html",
      });
    }
    const recent = items.sort((a, b) => Number(b.at || 0) - Number(a.at || 0)).slice(0, 4);
    if (!recent.length) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    list.innerHTML = recent.map((item) => ""
      + '<a class="m-update-card" href="' + escapeHtml(item.href) + '">'
      + '<strong>' + escapeHtml(item.title) + '</strong>'
      + '<p>' + escapeHtml(item.text) + '</p>'
      + '</a>'
    ).join("");
  }

  function init() {
    renderWhatNow();
    renderContinue();
    renderUserProgress();
    renderNewUserOnboarding();
    renderNextActions();
    renderMistakeReviewCard();
    renderWhatsNewHome();
    renderRecentActivity();
  }

  document.addEventListener("course-auth-approved", () => {
    renderQuestionIssuesCard();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

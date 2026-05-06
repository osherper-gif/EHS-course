import {
  db,
  collection,
  getDocs,
} from "./firebase-config.js";

(function () {
  const FIRESTORE_SOURCE = "firestore";
  const LOCAL_SOURCE = "local";
  const UNAVAILABLE_SOURCE = "unavailable";
  let hydrationPromise = null;
  let hydratedQuestions = null;
  let localQuestionsLoadPromise = null;
  let firestoreLessonsLoaded = 0;

  function isLocalQuestionFallbackAllowed() {
    const hostname = window.location.hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "ehs-course-staging.web.app";
  }

  function getLocalQuestionsScriptSrc() {
    return window.location.pathname.includes("/pages/") ? "../data/exam-questions.js" : "data/exam-questions.js";
  }

  function loadLocalQuestionsScript() {
    if (Array.isArray(window.EXAM_QUESTIONS)) return Promise.resolve(true);
    if (!isLocalQuestionFallbackAllowed()) return Promise.resolve(false);
    if (localQuestionsLoadPromise) return localQuestionsLoadPromise;

    localQuestionsLoadPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = getLocalQuestionsScriptSrc();
      script.async = true;
      script.onload = () => resolve(Array.isArray(window.EXAM_QUESTIONS));
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });

    return localQuestionsLoadPromise;
  }

  function localQuestions(lessonId) {
    const pool = Array.isArray(window.EXAM_QUESTIONS) ? window.EXAM_QUESTIONS : [];
    return lessonId ? pool.filter((question) => question.relatedLessonId === lessonId || question.lessonId === lessonId) : pool.slice();
  }

  function uniqueLessonIds() {
    const fromCourse = (window.COURSE_DATA?.meetings || []).map((meeting) => meeting.id).filter(Boolean);
    const fromQuestions = localQuestions().map((question) => question.relatedLessonId || question.lessonId).filter(Boolean);
    return Array.from(new Set([...fromCourse, ...fromQuestions])).sort();
  }

  function normalizeQuestion(raw, lessonId) {
    const options = Array.isArray(raw.options) ? raw.options.map((option) => String(option || "").trim()) : [];
    const correctAnswer = String(raw.correctAnswer || options[Number(raw.correctIndex)] || "").trim();
    return {
      id: String(raw.id || "").trim(),
      relatedLessonId: String(raw.relatedLessonId || raw.lessonId || lessonId || "").trim(),
      lessonId: String(raw.lessonId || raw.relatedLessonId || lessonId || "").trim(),
      topic: String(raw.topic || "").trim(),
      difficulty: String(raw.difficulty || "medium").trim(),
      question: String(raw.question || "").trim(),
      options,
      correctAnswer,
      correctIndex: Number.isInteger(raw.correctIndex) ? raw.correctIndex : options.indexOf(correctAnswer),
      explanation: String(raw.explanation || "").trim(),
      sourceNote: String(raw.sourceNote || "").trim(),
      qualityStatus: String(raw.qualityStatus || "approved").trim(),
      order: Number(raw.order || 0),
    };
  }

  function sortQuestions(items) {
    return items.slice().sort((a, b) => {
      const byOrder = Number(a.order || 0) - Number(b.order || 0);
      if (byOrder) return byOrder;
      return String(a.id || "").localeCompare(String(b.id || ""), "en");
    });
  }

  function limitQuestions(items, count) {
    const amount = Number(count || 0);
    return amount > 0 ? items.slice(0, amount) : items;
  }

  function isApprovedProfile(profile) {
    return profile?.status === "approved" || profile?.role === "admin";
  }

  function showQuestionLoadError() {
    const message = "לא ניתן לטעון שאלות כעת. נסה שוב מאוחר יותר.";
    const existing = document.querySelector("[data-exam-loader-error]");
    if (existing) {
      existing.textContent = message;
      return;
    }

    const target = document.querySelector("#examResult, #examSummary, #quizContainer, .exam-dashboard, main");
    if (!target) return;

    const alert = document.createElement("div");
    alert.dataset.examLoaderError = "true";
    alert.className = "alert alert-warning";
    alert.setAttribute("role", "alert");
    alert.textContent = message;
    target.prepend(alert);
  }

  function waitForAuthReady(timeoutMs = 8000) {
    if (isApprovedProfile(window.CourseAuth?.profile)) return Promise.resolve(window.CourseAuth.profile);
    if (window.CourseAuthReady) {
      return Promise.race([
        window.CourseAuthReady,
        new Promise((resolve) => window.setTimeout(() => resolve(null), timeoutMs)),
      ]);
    }
    return new Promise((resolve) => {
      let done = false;
      const finish = (profile) => {
        if (done) return;
        done = true;
        document.removeEventListener("course-auth-approved", onApproved);
        resolve(profile || null);
      };
      const onApproved = (event) => finish(event.detail);
      document.addEventListener("course-auth-approved", onApproved, { once: true });
      window.setTimeout(() => finish(isApprovedProfile(window.CourseAuth?.profile) ? window.CourseAuth.profile : null), timeoutMs);
    });
  }

  async function loadLessonQuestions(lessonId, options = {}) {
    const fallback = async (reason) => {
      if (!isLocalQuestionFallbackAllowed()) {
        console.info("[exam-loader] local fallback blocked in production", {
          lessonId: lessonId || "all",
          reason: reason || "unknown",
        });
        window.CourseExamLoader.source = UNAVAILABLE_SOURCE;
        showQuestionLoadError();
        return [];
      }

      const loaded = await loadLocalQuestionsScript();
      if (!loaded) {
        console.info("[exam-loader] local questions unavailable", {
          lessonId: lessonId || "all",
          reason: reason || "unknown",
        });
        window.CourseExamLoader.source = UNAVAILABLE_SOURCE;
        showQuestionLoadError();
        return [];
      }

      console.info("[exam-loader] fallback to local questions", {
        lessonId: lessonId || "all",
        reason: reason || "unknown",
      });
      window.CourseExamLoader.source = LOCAL_SOURCE;
      return limitQuestions(sortQuestions(localQuestions(lessonId)), options.count);
    };

    const profile = await waitForAuthReady();
    if (!isApprovedProfile(profile)) return fallback("auth-not-approved");
    if (!db || !lessonId) return fallback(!db ? "firestore-unavailable" : "missing-lesson-id");

    try {
      const snapshot = await getDocs(collection(db, "examQuestionPools", lessonId, "questions"));
      const questions = [];
      snapshot.forEach((item) => {
        const normalized = normalizeQuestion({ id: item.id, ...item.data() }, lessonId);
        if (normalized.question && normalized.options.length >= 4 && normalized.correctAnswer) {
          questions.push(normalized);
        }
      });

      if (!questions.length) return fallback("empty-firestore-result");
      firestoreLessonsLoaded += 1;
      console.info("[exam-loader] loaded from firestore", { lessonId, count: questions.length });
      return limitQuestions(sortQuestions(questions), options.count);
    } catch (error) {
      console.info("[exam-loader] fallback to local questions", {
        lessonId,
        reason: error?.code || error?.message || "unknown",
      });
      return fallback(error?.code || error?.message || "firestore-error");
    }
  }

  async function hydrateExamQuestions(options = {}) {
    if (hydratedQuestions) return hydratedQuestions;
    if (hydrationPromise) return hydrationPromise;

    hydrationPromise = (async () => {
      const lessonIds = Array.isArray(options.lessonIds) && options.lessonIds.length ? options.lessonIds : uniqueLessonIds();
      if (!lessonIds.length) {
        await loadLocalQuestionsScript();
        hydratedQuestions = localQuestions();
        return hydratedQuestions;
      }

      const byLesson = await Promise.all(lessonIds.map((lessonId) => loadLessonQuestions(lessonId)));
      const merged = byLesson.flat();
      if (merged.length) {
        hydratedQuestions = sortQuestions(merged);
        window.EXAM_QUESTIONS = hydratedQuestions;
        window.CourseExamLoader.source = firestoreLessonsLoaded === lessonIds.length ? FIRESTORE_SOURCE : "mixed";
        return hydratedQuestions;
      }

      await loadLocalQuestionsScript();
      hydratedQuestions = localQuestions();
      window.CourseExamLoader.source = hydratedQuestions.length ? LOCAL_SOURCE : UNAVAILABLE_SOURCE;
      if (!hydratedQuestions.length && !isLocalQuestionFallbackAllowed()) showQuestionLoadError();
      return hydratedQuestions;
    })();

    return hydrationPromise;
  }

  window.CourseExamLoader = {
    source: LOCAL_SOURCE,
    loadLessonQuestions,
    hydrateExamQuestions,
    isLocalQuestionFallbackAllowed,
    get questions() {
      return hydratedQuestions || localQuestions();
    },
  };
})();

(function () {
  const activeQuizQuestions = new Map();

  function shuffle(items) {
    return items
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item) => item.value);
  }

  function quizPool() {
    if (Array.isArray(window.EXAM_QUESTIONS) && window.EXAM_QUESTIONS.length) return window.EXAM_QUESTIONS.map((q) => ({
      id: q.id,
      lessonId: q.relatedLessonId,
      topic: q.topic,
      question: q.question,
      options: q.options,
      answer: q.options.indexOf(q.correctAnswer),
      explanation: q.explanation,
    }));
    return Array.isArray(window.COURSE_DATA?.questions) ? window.COURSE_DATA.questions : [];
  }

  function prepareQuestion(q) {
    const correctText = q.options[q.answer];
    const shuffledOptions = shuffle(q.options);
    return {
      ...q,
      options: shuffledOptions,
      answer: shuffledOptions.indexOf(correctText),
    };
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initQuiz() {
    const start = document.getElementById("startQuiz");
    const lessonSelect = document.getElementById("quizLesson");
    const container = document.getElementById("quizContainer");
    if (!start || !container) return;
    start.addEventListener("click", () => {
      const lessonId = lessonSelect.value;
      const questions = quizPool()
        .filter((q) => !lessonId || q.lessonId === lessonId)
        .map(prepareQuestion);
      activeQuizQuestions.clear();
      questions.forEach((q) => activeQuizQuestions.set(q.id, q));
      container.innerHTML = questions.length ? questions.map(renderQuestion).join("") : '<article class="question-card">אין שאלות למפגש שנבחר.</article>';
    });
    container.addEventListener("click", (event) => {
      const reportButton = event.target.closest("[data-report-question]");
      if (reportButton) {
        const question = activeQuizQuestions.get(reportButton.dataset.reportQuestion);
        if (question && window.CourseFeedback?.open) {
          window.CourseFeedback.open({
            type: "שאלה לא נכונה",
            title: "דיווח על שאלה " + question.id,
            description: [
              "מזהה שאלה: " + question.id,
              "שיעור: " + (question.lessonId || "-"),
              "נושא: " + (question.topic || "-"),
              "שאלה: " + question.question,
              "תשובה שנבחרה: לא רלוונטי",
            ].join("\n"),
          });
        }
        return;
      }
      const button = event.target.closest("[data-answer]");
      if (!button) return;
      const card = button.closest("[data-question]");
      const question = activeQuizQuestions.get(card.dataset.question);
      if (!question) return;
      const selected = Number(button.dataset.answer);
      card.querySelectorAll("[data-answer]").forEach((btn) => {
        btn.disabled = true;
        const idx = Number(btn.dataset.answer);
        if (idx === question.answer) btn.classList.add("correct");
        if (idx === selected && idx !== question.answer) btn.classList.add("wrong");
      });
      card.querySelector(".explanation").textContent = question.explanation;
      const stats = window.CourseStorage?.stats?.();
      if (stats && window.CourseStorage?.updateStats) {
        const ok = selected === question.answer;
        window.CourseStorage.updateStats({
          totalQuestionsAnswered: Number(stats.totalQuestionsAnswered || 0) + 1,
          totalCorrect: Number(stats.totalCorrect || 0) + (ok ? 1 : 0),
          totalWrong: Number(stats.totalWrong || 0) + (ok ? 0 : 1),
        });
      }
      if (selected !== question.answer && window.CourseStorage?.recordMistake) {
        window.CourseStorage.recordMistake({
          questionId: question.id,
          lessonId: question.lessonId || "",
          topic: question.topic || "",
          question: question.question,
          correct: question.options[question.answer],
          chosen: question.options[selected],
        });
      }
    });
  }

  function renderQuestion(q, index) {
    return '<article class="question-card" data-question="' + escapeHtml(q.id) + '"><h2>שאלה ' + (index + 1) + '</h2><p>' + escapeHtml(q.question) + '</p><div class="answer-list">' + q.options.map((option, i) => '<button type="button" data-answer="' + i + '">' + escapeHtml(option) + '</button>').join("") + '</div><button type="button" class="btn secondary question-report-btn" data-report-question="' + escapeHtml(q.id) + '">דווח על שאלה</button><p class="explanation"></p></article>';
  }

  window.CourseQuizzes = { initQuiz };
})();

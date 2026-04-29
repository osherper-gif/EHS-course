(function () {
  function initQuiz() {
    const start = document.getElementById("startQuiz");
    const lessonSelect = document.getElementById("quizLesson");
    const container = document.getElementById("quizContainer");
    if (!start || !container) return;
    start.addEventListener("click", () => {
      const lessonId = lessonSelect.value;
      const questions = (window.COURSE_DATA.questions || []).filter((q) => !lessonId || q.lessonId === lessonId);
      container.innerHTML = questions.length ? questions.map(renderQuestion).join("") : '<article class="question-card">אין שאלות למפגש שנבחר.</article>';
    });
    container.addEventListener("click", (event) => {
      const button = event.target.closest("[data-answer]");
      if (!button) return;
      const card = button.closest("[data-question]");
      const question = window.COURSE_DATA.questions.find((q) => q.id === card.dataset.question);
      const selected = Number(button.dataset.answer);
      card.querySelectorAll("[data-answer]").forEach((btn) => {
        btn.disabled = true;
        const idx = Number(btn.dataset.answer);
        if (idx === question.answer) btn.classList.add("correct");
        if (idx === selected && idx !== question.answer) btn.classList.add("wrong");
      });
      card.querySelector(".explanation").textContent = question.explanation;
    });
  }
  function renderQuestion(q, index) {
    return '<article class="question-card" data-question="' + q.id + '"><h2>שאלה ' + (index + 1) + '</h2><p>' + q.question + '</p><div class="answer-list">' + q.options.map((option, i) => '<button type="button" data-answer="' + i + '">' + option + '</button>').join("") + '</div><p class="explanation"></p></article>';
  }
  window.CourseQuizzes = { initQuiz };
})();
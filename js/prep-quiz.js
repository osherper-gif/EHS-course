(function () {
  "use strict";

  const root = document.getElementById("prepQuizApp");
  if (!root) return;

  const quizId = root.dataset.prepQuiz || "lesson-08-safety-organization";
  const quizSource = root.dataset.prepQuizSource || quizId;
  const storageKey = "ehsPrepQuiz:" + quizId;
  const cursorKey = storageKey + ":currentIndex";

  const questionSets = window.CoursePrepQuestionSets || {};
  const questions = questionSets[quizSource] || questionSets[quizId] || [];

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveState(nextState) {
    localStorage.setItem(storageKey, JSON.stringify(nextState));
  }

  function clampIndex(index) {
    if (!questions.length) return 0;
    return Math.max(0, Math.min(questions.length - 1, index));
  }

  function loadCurrentIndex() {
    const stored = Number(localStorage.getItem(cursorKey) || 0);
    return Number.isFinite(stored) ? clampIndex(stored) : 0;
  }

  function saveCurrentIndex() {
    localStorage.setItem(cursorKey, String(currentIndex));
  }

  let state = loadState();
  let currentIndex = loadCurrentIndex();
  let revealAll = false;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function button(text, onClick, variant) {
    const control = el("button", "btn " + (variant || "primary"), text);
    control.type = "button";
    control.addEventListener("click", onClick);
    return control;
  }

  function stats() {
    const answered = Object.keys(state).filter((id) => state[id] !== undefined);
    const correct = answered.filter((id) => {
      const q = questions.find((item) => item.id === id);
      return q && state[id] === q.correctIndex;
    });
    return { answered: answered.length, correct: correct.length };
  }

  function questionGroups() {
    return [
      { title: "1-10 | בסיס", from: 1, to: 10 },
      { title: "11-20 | בינוני", from: 11, to: 20 },
      { title: "21-" + questions.length + " | קשה", from: 21, to: questions.length }
    ].filter((group) => group.from <= questions.length);
  }

  function rangeNav() {
    const nav = el("nav", "prep-question-jump-nav");
    nav.setAttribute("aria-label", "ניווט שאלות הכנה");
    questionGroups().forEach((group) => {
      const active = currentIndex + 1 >= group.from && currentIndex + 1 <= group.to;
      nav.append(button(group.title, () => {
        currentIndex = clampIndex(group.from - 1);
        saveCurrentIndex();
        render();
      }, active ? "primary" : "secondary"));
    });
    return nav;
  }

  function questionPager() {
    const pager = el("div", "prep-question-pager");
    const previous = button("הקודם", () => {
      currentIndex = clampIndex(currentIndex - 1);
      saveCurrentIndex();
      render();
    }, "secondary");
    previous.disabled = currentIndex === 0;

    const next = button("הבא", () => {
      currentIndex = clampIndex(currentIndex + 1);
      saveCurrentIndex();
      render();
    }, "primary");
    next.disabled = currentIndex === questions.length - 1;

    pager.append(previous, el("strong", "prep-question-position", "שאלה " + (currentIndex + 1) + " מתוך " + questions.length), next);
    return pager;
  }

  function render() {
    root.replaceChildren();
    if (!questions.length) {
      root.append(el("p", "field-help", "לא נמצאו שאלות הכנה לעמוד זה."));
      return;
    }

    currentIndex = clampIndex(currentIndex);
    const summary = stats();
    const toolbar = el("div", "prep-quiz-toolbar");
    const progress = el("div", "prep-quiz-progress");
    progress.setAttribute("aria-label", "התקדמות שאלות");
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", String(questions.length));
    progress.setAttribute("aria-valuenow", String(summary.answered));
    progress.innerHTML = '<span style="width:' + Math.round((summary.answered / questions.length) * 100) + '%"></span>';
    toolbar.append(
      el("strong", "prep-quiz-count", summary.answered + " / " + questions.length + " נענו"),
      el("span", "prep-quiz-score", summary.correct + " נכונות"),
      button("גלה תשובות", () => { revealAll = !revealAll; render(); }, "secondary"),
      button("אפס תרגול", () => {
        if (!window.confirm("לאפס את התרגול המקומי?")) return;
        state = {};
        currentIndex = 0;
        saveState(state);
        saveCurrentIndex();
        render();
      }, "secondary")
    );

    root.append(
      toolbar,
      progress,
      el("p", "field-help prep-quiz-helper", questions.length + " שאלות הכנה. מוצגת שאלה אחת בכל פעם; ההתקדמות נשמרת בדפדפן בלבד."),
      rangeNav(),
      questionPager(),
      questionCard(questions[currentIndex], currentIndex),
      questionPager()
    );
  }

  function questionCard(question, questionIndex) {
    const selected = state[question.id];
    const answered = selected !== undefined;
    const showFeedback = answered || revealAll;
    const card = el("article", "prep-question-card prep-question-card-single");
    const questionLabel = question.sourceLabel || (questionIndex + 1) + ".";
    card.append(el("h3", "", questionLabel + " " + question.question));

    const options = el("div", "prep-options");
    question.options.forEach((option, optionIndex) => {
      const label = el("label", "prep-option");
      if (selected === optionIndex) label.classList.add("is-selected");
      if (showFeedback && optionIndex === question.correctIndex) label.classList.add("is-correct");
      if (answered && optionIndex === selected && selected !== question.correctIndex) label.classList.add("is-wrong");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = question.id;
      input.checked = selected === optionIndex;
      input.setAttribute("aria-label", option);
      input.addEventListener("change", () => {
        state[question.id] = optionIndex;
        saveState(state);
        render();
      });
      label.append(input, el("span", "prep-option-text", option));
      options.append(label);
    });
    card.append(options);

    if (showFeedback) {
      const feedback = el("div", "prep-feedback " + (selected === question.correctIndex || revealAll ? "is-correct" : "is-wrong"));
      feedback.setAttribute("aria-live", "polite");
      const wrongList = el("ul", "prep-wrong-explanations");
      question.options.forEach((option, optionIndex) => {
        if (optionIndex === question.correctIndex) return;
        const reason = Array.isArray(question.wrongExplanations) && question.wrongExplanations[optionIndex]
          ? question.wrongExplanations[optionIndex]
          : "אפשרות זו אינה תואמת את חלוקת האחריות, הסמכות או דרך ההשפעה שנלמדו בהכנה.";
        wrongList.append(el("li", "", option + " - " + reason));
      });
      feedback.append(
        el("strong", "", selected === question.correctIndex ? "נכון" : revealAll && !answered ? "תשובה מוצגת" : "לא נכון"),
        el("p", "", question.rationale || question.explanation || ""),
        el("strong", "prep-feedback-subtitle", "למה שאר התשובות שגויות"),
        wrongList,
        el("p", "field-help", "מלכודת: " + (question.trap || "בדקו האם התשובה מעבירה אחריות לגורם הלא נכון, מסתפקת בטופס, או מתעלמת מהשפעה ניהולית."))
      );
      card.append(feedback);
    }
    return card;
  }

  window.EHSPrepQuiz = Object.assign(window.EHSPrepQuiz || {}, {
    getQuestions: () => questions.slice(),
    getCurrentQuestion: () => questions[currentIndex]
  });

  render();
})();

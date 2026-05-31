(function () {
  "use strict";

  const root = document.getElementById("summaryQuizApp");
  if (!root) return;

  const quizId = root.dataset.summaryQuiz || "lesson-01-summary-practice";
  const quizSource = root.dataset.summaryQuizSource || quizId;
  const storageKey = "ehsSummaryQuiz:" + quizId;
  const cursorKey = storageKey + ":currentIndex";
  const questionSets = window.CourseSummaryQuestionSets || {};
  const rawQuestions = Array.isArray(questionSets[quizSource]) ? questionSets[quizSource] : [];
  const shouldSortBySourceNumber = rawQuestions.length > 1 && Number(rawQuestions[0].sourceNumber) !== 1;
  const questions = (shouldSortBySourceNumber ? rawQuestions.slice().sort((a, b) => {
    const aNumber = Number.isFinite(Number(a.sourceNumber)) ? Number(a.sourceNumber) : 9999;
    const bNumber = Number.isFinite(Number(b.sourceNumber)) ? Number(b.sourceNumber) : 9999;
    if (aNumber !== bNumber) return aNumber - bNumber;
    const aOccurrence = Number.isFinite(Number(a.sourceOccurrence)) ? Number(a.sourceOccurrence) : 9999;
    const bOccurrence = Number.isFinite(Number(b.sourceOccurrence)) ? Number(b.sourceOccurrence) : 9999;
    if (aOccurrence !== bOccurrence) return aOccurrence - bOccurrence;
    return String(a.id || "").localeCompare(String(b.id || ""));
  }) : rawQuestions.slice());
  const expectedCount = Number(root.dataset.sourceQuestionCount || questions.length || 0);

  let state = loadState();
  let currentIndex = loadCurrentIndex();
  let revealAll = false;

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

  function loadCurrentIndex() {
    const stored = Number(localStorage.getItem(cursorKey) || 0);
    if (!Number.isFinite(stored)) return 0;
    return clampIndex(stored);
  }

  function saveCurrentIndex() {
    localStorage.setItem(cursorKey, String(currentIndex));
  }

  function clampIndex(index) {
    if (!questions.length) return 0;
    return Math.max(0, Math.min(questions.length - 1, index));
  }

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
    const ranges = [
      { title: "1-20 | בסיס ויישום", from: 1, to: 20 },
      { title: "21-40 | בינוני - ניתוח מצבים", from: 21, to: 40 },
      { title: "41-60 | קשה - אחריות, דין ובקרה", from: 41, to: 60 },
      { title: "61-" + questions.length + " | העמקה והרחבה", from: 61, to: questions.length },
    ];

    return ranges
      .map((range) => {
        const items = questions.slice(range.from - 1, Math.min(range.to, questions.length));
        return Object.assign({}, range, { items });
      })
      .filter((group) => group.items.length > 0);
  }

  function render() {
    root.replaceChildren();
    root.dataset.renderedQuestionCount = String(questions.length);

    if (!questions.length) {
      root.append(el("p", "empty-state", "שאלות הסיכום עדיין לא נטענו."));
      return;
    }

    currentIndex = clampIndex(currentIndex);
    const summary = stats();
    const toolbar = el("div", "summary-quiz-toolbar");
    const progress = el("div", "summary-quiz-progress");
    const progressPercent = questions.length ? Math.round((summary.answered / questions.length) * 100) : 0;
    progress.setAttribute("aria-label", "התקדמות שאלות סיכום");
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", String(questions.length));
    progress.setAttribute("aria-valuenow", String(summary.answered));
    progress.innerHTML = '<span style="width:' + progressPercent + '%"></span>';

    toolbar.append(
      el("strong", "summary-quiz-count", summary.answered + " / " + questions.length + " נענו"),
      el("span", "summary-quiz-score", summary.correct + " נכונות"),
      button(revealAll ? "הסתר תשובות" : "גלה תשובות", () => {
        revealAll = !revealAll;
        render();
      }, "secondary"),
      button("אפס תרגול", () => {
        if (!window.confirm("לאפס את תרגול הסיכום המקומי?")) return;
        state = {};
        currentIndex = 0;
        saveState(state);
        saveCurrentIndex();
        render();
      }, "secondary")
    );

    const helper = el(
      "p",
      "field-help summary-quiz-helper",
      questions.length + " שאלות תרגול מתוך סיכום השיעור. מוצגת שאלה אחת בכל פעם; ההתקדמות נשמרת בדפדפן בלבד."
    );
    if (expectedCount && expectedCount !== questions.length) {
      helper.textContent = questions.length + " שאלות תרגול נטענו. ההתקדמות נשמרת בדפדפן בלבד.";
    }

    root.append(toolbar, progress, helper, rangeNav(), questionPager(), questionCard(questions[currentIndex], currentIndex + 1), questionPager());
  }

  function rangeNav() {
    const nav = el("nav", "summary-question-jump-nav summary-practice-nav");
    nav.setAttribute("aria-label", "ניווט שאלות תרגול");
    questionGroups().forEach((group) => {
      const control = button(group.title, () => {
        currentIndex = clampIndex(group.from - 1);
        saveCurrentIndex();
        render();
      }, currentIndex + 1 >= group.from && currentIndex + 1 <= group.to ? "primary" : "secondary");
      nav.append(control);
    });
    return nav;
  }

  function questionPager() {
    const pager = el("div", "summary-question-pager");
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

    const position = el("strong", "summary-question-position", "שאלה " + (currentIndex + 1) + " מתוך " + questions.length);
    pager.append(previous, position, next);
    return pager;
  }

  function questionCard(question, questionNumber) {
    const selected = state[question.id];
    const answered = selected !== undefined;
    const showFeedback = answered || revealAll;
    const card = el("article", "summary-question-card summary-question-card-single");
    const sourceLabel = question.sourceLabel || ("שאלה " + questionNumber);
    card.append(el("h3", "", sourceLabel + " · " + question.question));

    const options = el("div", "summary-options");
    question.options.forEach((option, optionIndex) => {
      const optionLabel = el("label", "summary-option");
      if (selected === optionIndex) optionLabel.classList.add("is-selected");
      if (showFeedback && optionIndex === question.correctIndex) optionLabel.classList.add("is-correct");
      if (answered && selected === optionIndex && selected !== question.correctIndex) optionLabel.classList.add("is-wrong");

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

      optionLabel.append(input, el("span", "summary-option-text", option));
      options.append(optionLabel);
    });
    card.append(options);

    if (showFeedback) {
      const isCorrect = selected === question.correctIndex;
      const feedback = el("div", "summary-feedback " + (isCorrect || revealAll ? "is-correct" : "is-wrong"));
      feedback.setAttribute("aria-live", "polite");
      feedback.append(
        el("strong", "", isCorrect ? "נכון" : revealAll && !answered ? "תשובה מוצגת" : "לא נכון"),
        el("div", "summary-feedback-box summary-feedback-rationale", question.rationale || question.explanation || ""),
        el("div", "summary-feedback-box summary-feedback-trap", "מלכודת: " + (question.trap || "בדקו האם התשובה מסתפקת בניירת, מעבירה אחריות או מדלגת על בקרה במקור.")),
        el("div", "summary-feedback-box summary-feedback-field", "משמעות בשטח: חברו את ההסבר לבקרה ממשית, בעל אחריות, תיעוד ובדיקת אפקטיביות.")
      );
      card.append(feedback);
    }

    return card;
  }

  window.EHSSummaryQuiz = Object.assign(window.EHSSummaryQuiz || {}, {
    questionGroups,
    getQuestions: () => questions.slice(),
    getCurrentQuestion: () => questions[currentIndex],
  });

  render();
})();

(function () {
  "use strict";

  const root = document.getElementById("summaryQuizApp");
  if (!root) return;

  const quizId = root.dataset.summaryQuiz || "lesson-01-summary-practice";
  const quizSource = root.dataset.summaryQuizSource || quizId;
  const storageKey = "ehsSummaryQuiz:" + quizId;
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
      { title: "1-20 | בסיס ויישום", from: 1, to: 20, open: true },
      { title: "21-40 | בינוני - ניתוח מצבים", from: 21, to: 40, open: false },
      { title: "41-60 | קשה - אחריות, דין ובקרה", from: 41, to: 60, open: false },
      { title: "61-" + questions.length + " | העמקה והרחבה", from: 61, to: questions.length, open: false },
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

    const summary = stats();
    const toolbar = el("div", "summary-quiz-toolbar");
    const progress = el("div", "summary-quiz-progress");
    const progressPercent = questions.length ? Math.round((summary.answered / questions.length) * 100) : 0;
    progress.setAttribute("aria-label", "התקדמות שאלות סיכום");
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
        saveState(state);
        render();
      }, "secondary")
    );

    const helper = el(
      "p",
      "field-help summary-quiz-helper",
      questions.length + " שאלות תרגול מתוך סיכום השיעור. ההתקדמות נשמרת בדפדפן בלבד."
    );

    if (expectedCount && expectedCount !== questions.length) {
      helper.textContent = questions.length + " שאלות תרגול נטענו. ההתקדמות נשמרת בדפדפן בלבד.";
    }

    root.append(toolbar, progress, helper);

    const groups = el("div", "summary-question-groups");
    questionGroups().forEach((group) => groups.append(groupNode(group)));
    root.append(groups);
  }

  function groupNode(group) {
    const details = el("details", "summary-question-group");
    if (group.open) details.open = true;
    const summary = el("summary", "");
    const answeredInGroup = group.items.filter((question) => state[question.id] !== undefined).length;
    summary.append(
      el("span", "summary-question-group-title", group.title),
      el("span", "summary-question-group-count", answeredInGroup + " / " + group.items.length + " נענו")
    );
    details.append(summary);

    const list = el("div", "summary-question-list");
    group.items.forEach((question, index) => {
      list.append(questionCard(question, group.from + index));
    });
    details.append(list);
    return details;
  }

  function questionCard(question, questionNumber) {
    const selected = state[question.id];
    const answered = selected !== undefined;
    const showFeedback = answered || revealAll;
    const card = el("article", "summary-question-card");
    const label = "שאלה " + questionNumber;
    card.append(el("h3", "", label + " · " + question.question));

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
      feedback.append(
        el("strong", "", isCorrect ? "נכון" : revealAll && !answered ? "תשובה מוצגת" : "לא נכון"),
        el("div", "summary-feedback-box summary-feedback-rationale", question.rationale || question.explanation || ""),
        el("div", "summary-feedback-box summary-feedback-trap", "Trap: " + (question.trap || "בדוק האם התשובה מסתפקת בניירת, מעבירה אחריות או מדלגת על בקרה במקור."))
      );
      card.append(feedback);
    }

    return card;
  }

  window.EHSSummaryQuiz = Object.assign(window.EHSSummaryQuiz || {}, {
    questionGroups,
    getQuestions: () => questions.slice(),
  });

  render();
})();

(function () {
  let currentChallenge = null;
  let selectedAnswer = null;
  let checked = false;

  function state() {
    return window.CourseGameState;
  }

  function params() {
    return new URLSearchParams(location.search);
  }

  function text(value) {
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  function shuffle(list) {
    const copy = [...list];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }

  function init() {
    const requestedStage = params().get("stage") || state().firstOpenStage();
    if (!state().isStageUnlocked(requestedStage)) {
      location.href = "game-unit.html";
      return;
    }
    let session = state().activeStage();
    if (!session || session.stageId !== requestedStage) session = state().startStage(requestedStage);
    render(session);
    document.getElementById("checkAnswer")?.addEventListener("click", checkAnswer);
    document.getElementById("nextChallenge")?.addEventListener("click", nextChallenge);
    document.getElementById("showHint")?.addEventListener("click", showHint);
  }

  function render(session) {
    checked = false;
    selectedAnswer = null;
    const challenges = state().getStageChallenges(session.stageId);
    currentChallenge = challenges[session.index];
    const stage = state().getStage(session.stageId);
    if (!currentChallenge) {
      const result = state().completeStage(session);
      location.href = `game-results.html?stage=${encodeURIComponent(result.stageId)}`;
      return;
    }
    setText("challengeStageTitle", `יסודות בטיחות · שלב ${stage.order}: ${stage.title}`);
    setText("challengeCounter", `${session.index + 1}/${challenges.length}`);
    setText("challengeTitle", currentChallenge.title);
    setText("challengePrompt", currentChallenge.prompt);
    setText("challengeQuestion", currentChallenge.prompt);
    renderTags();
    const progress = document.getElementById("challengeProgress");
    if (progress) progress.value = Math.round((session.index / challenges.length) * 100);
    const feedback = document.getElementById("challengeFeedback");
    if (feedback) {
      feedback.textContent = "";
      feedback.className = "challenge-feedback gv2-feedback";
      feedback.hidden = true;
    }
    const next = document.getElementById("nextChallenge");
    if (next) next.hidden = true;
    const check = document.getElementById("checkAnswer");
    if (check) check.disabled = true;
    renderAnswerArea();
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function renderTags() {
    const tags = document.getElementById("challengeTags");
    if (!tags || !currentChallenge) return;
    const labelByType = {
      "multiple-choice": "מושג",
      "true-false": "חוק/תקנה",
      matching: "מושגים",
      order: "תהליך",
      "risk-identification": "תרחיש שטח"
    };
    tags.replaceChildren();
    [labelByType[currentChallenge.type] || "אתגר", currentChallenge.difficulty || "רגיל"].forEach((label) => {
      const tag = document.createElement("span");
      tag.textContent = label;
      tags.append(tag);
    });
  }

  function renderAnswerArea() {
    const container = document.getElementById("answerArea");
    if (!container || !currentChallenge) return;
    container.replaceChildren();
    const legacy = document.getElementById("challengeOptions");
    if (legacy) legacy.textContent = "";
    if (currentChallenge.type === "matching") return renderMatching(container);
    if (currentChallenge.type === "order") return renderOrdering(container);
    return renderChoiceButtons(container);
  }

  function renderChoiceButtons(container) {
    const list = document.createElement("div");
    list.className = "answer-list gv2-answer-list";
    shuffle(currentChallenge.options).forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-option gv2-answer-card";
      button.textContent = option;
      button.addEventListener("click", () => {
        if (checked) return;
        selectedAnswer = option;
        list.querySelectorAll("button").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        document.getElementById("checkAnswer").disabled = false;
      });
      list.append(button);
    });
    const legacy = document.getElementById("challengeOptions");
    if (legacy) legacy.textContent = currentChallenge.options.join(" | ");
    container.append(list);
  }

  function renderMatching(container) {
    const board = document.createElement("div");
    board.className = "match-board gv2-match-board";
    selectedAnswer = {};
    currentChallenge.options.forEach((row) => {
      const label = document.createElement("label");
      label.className = "match-row";
      const term = document.createElement("span");
      term.textContent = row.term;
      const select = document.createElement("select");
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "בחר הגדרה";
      select.append(empty);
      shuffle(row.choices).forEach((choice) => {
        const option = document.createElement("option");
        option.value = choice;
        option.textContent = choice;
        select.append(option);
      });
      select.addEventListener("change", () => {
        selectedAnswer[row.term] = select.value;
        document.getElementById("checkAnswer").disabled = !Object.values(selectedAnswer).every(Boolean) || Object.keys(selectedAnswer).length !== currentChallenge.options.length;
      });
      label.append(term, select);
      board.append(label);
    });
    container.append(board);
  }

  function renderOrdering(container) {
    const board = document.createElement("div");
    board.className = "order-board gv2-order-board";
    const pool = document.createElement("div");
    pool.className = "order-pool";
    const chosen = document.createElement("ol");
    chosen.className = "order-list";
    selectedAnswer = [];
    shuffle(currentChallenge.options).forEach((step) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-option gv2-answer-card";
      button.textContent = step;
      button.addEventListener("click", () => {
        if (checked || selectedAnswer.includes(step)) return;
        selectedAnswer.push(step);
        button.disabled = true;
        const item = document.createElement("li");
        item.textContent = step;
        chosen.append(item);
        document.getElementById("checkAnswer").disabled = selectedAnswer.length !== currentChallenge.options.length;
      });
      pool.append(button);
    });
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "btn secondary";
    reset.textContent = "איפוס סדר";
    reset.addEventListener("click", () => renderAnswerArea());
    board.append(pool, chosen, reset);
    container.append(board);
  }

  function showHint() {
    if (!currentChallenge) return;
    const session = state().activeStage();
    session.hintUsedByChallenge[currentChallenge.id] = true;
    state().saveActiveStage(session);
    const hint = document.getElementById("challengeHint");
    if (hint) {
      hint.textContent = currentChallenge.hint;
      hint.hidden = false;
    }
  }

  function isCorrect() {
    if (currentChallenge.type === "matching") {
      return Object.entries(currentChallenge.correctAnswer).every(([term, answer]) => selectedAnswer?.[term] === answer);
    }
    if (currentChallenge.type === "order") {
      return Array.isArray(selectedAnswer)
        && selectedAnswer.length === currentChallenge.correctAnswer.length
        && selectedAnswer.every((item, index) => item === currentChallenge.correctAnswer[index]);
    }
    return selectedAnswer === currentChallenge.correctAnswer;
  }

  function checkAnswer() {
    if (checked || !currentChallenge) return;
    checked = true;
    const correct = isCorrect();
    const session = state().activeStage();
    const hintUsed = Boolean(session.hintUsedByChallenge[currentChallenge.id]);
    const xp = correct ? 10 + (hintUsed ? 0 : 5) : 0;
    session.xp += xp;
    session.correct += correct ? 1 : 0;
    session.wrong += correct ? 0 : 1;
    session.answers.push({
      challengeId: currentChallenge.id,
      selectedAnswer,
      correctAnswer: currentChallenge.correctAnswer,
      correct,
      hintUsed,
      xp
    });
    const progress = state().load();
    if (!correct) state().addMistake(progress, currentChallenge, selectedAnswer);
    state().save(progress);
    state().saveActiveStage(session);
    markAnswers();
    showFeedback(correct, xp);
  }

  function markAnswers() {
    document.querySelectorAll(".answer-option").forEach((button) => {
      button.disabled = true;
      if (button.textContent === currentChallenge.correctAnswer) button.classList.add("correct");
      else if (button.classList.contains("selected")) button.classList.add("wrong");
    });
    if (currentChallenge.type === "matching" || currentChallenge.type === "order") {
      document.getElementById("answerArea")?.classList.add(isCorrect() ? "is-correct" : "is-wrong");
    }
  }

  function showFeedback(correct, xp) {
    const feedback = document.getElementById("challengeFeedback");
    if (feedback) {
      feedback.hidden = false;
      feedback.className = `challenge-feedback gv2-feedback ${correct ? "is-correct" : "is-wrong"}`;
      feedback.textContent = correct
        ? `נכון. צברת ${xp} XP. ${currentChallenge.explanation}`
        : `לא מדויק. התשובה הנכונה: ${text(currentChallenge.correctAnswer)}. ${currentChallenge.explanation}`;
    }
    document.getElementById("nextChallenge").hidden = false;
    document.getElementById("checkAnswer").disabled = true;
  }

  function nextChallenge() {
    const session = state().activeStage();
    session.index += 1;
    state().saveActiveStage(session);
    document.getElementById("challengeHint").hidden = true;
    document.getElementById("answerArea")?.classList.remove("is-correct", "is-wrong");
    render(session);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.gamePage === "challenge" && window.CourseGameState) init();
  });
})();

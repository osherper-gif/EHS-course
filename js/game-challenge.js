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
    const selectedDifficulty = state().getDifficulty();
    let session = state().activeStage();
    if (!session || session.stageId !== requestedStage || session.difficulty !== selectedDifficulty) {
      session = state().startStage(requestedStage);
    }
    session.difficulty = session.difficulty || selectedDifficulty;
    session.correctStreak = Number(session.correctStreak || 0);
    session.wrongStreak = Number(session.wrongStreak || 0);
    state().saveActiveStage(session);
    render(session);
    document.getElementById("checkAnswer")?.addEventListener("click", checkAnswer);
    document.getElementById("nextChallenge")?.addEventListener("click", nextChallenge);
    document.getElementById("showHint")?.addEventListener("click", showHint);
  }

  function render(session) {
    checked = false;
    selectedAnswer = null;
    const challenges = state().getStageChallenges(session.stageId, session.difficulty);
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
    setText("challengeDifficulty", `רמה: ${state().difficultyLabel(session.difficulty)}`);
    renderTags(session);
    const progress = document.getElementById("challengeProgress");
    if (progress) progress.value = Math.round((session.index / challenges.length) * 100);
    const feedback = document.getElementById("challengeFeedback");
    if (feedback) {
      feedback.textContent = "";
      feedback.className = "challenge-feedback gv2-feedback";
      feedback.hidden = true;
    }
    const adaptive = document.getElementById("adaptiveSuggestion");
    if (adaptive) {
      adaptive.textContent = "";
      adaptive.hidden = true;
    }
    const next = document.getElementById("nextChallenge");
    if (next) next.hidden = true;
    const check = document.getElementById("checkAnswer");
    if (check) check.disabled = true;
    const hint = document.getElementById("challengeHint");
    if (hint) {
      hint.textContent = "";
      hint.hidden = true;
    }
    renderAnswerArea();
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function renderTags(session) {
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
    [labelByType[currentChallenge.type] || "אתגר", state().difficultyLabel(session.difficulty), difficultyLabel(currentChallenge.difficulty)].forEach((label) => {
      const tag = document.createElement("span");
      tag.textContent = label;
      tags.append(tag);
    });
  }

  function difficultyLabel(value) {
    const labels = { easy: "שאלה קלה", medium: "שאלה בינונית", hard: "שאלה קשה" };
    return labels[value] || value || "רגיל";
  }

  function shortDifficultyLabel(value) {
    const labels = { easy: "קלה", medium: "בינונית", hard: "קשה" };
    return labels[value] || value || "רגילה";
  }

  function getLowerDifficulty(currentDifficulty) {
    if (currentDifficulty === "hard") return "medium";
    if (currentDifficulty === "medium") return "easy";
    return null;
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
    session.correctStreak = correct ? Number(session.correctStreak || 0) + 1 : 0;
    session.wrongStreak = correct ? 0 : Number(session.wrongStreak || 0) + 1;
    session.answers.push({
      challengeId: currentChallenge.id,
      selectedAnswer,
      correctAnswer: currentChallenge.correctAnswer,
      correct,
      hintUsed,
      xp,
      difficulty: currentChallenge.difficulty
    });
    const progress = state().load();
    if (!correct) state().addMistake(progress, currentChallenge, selectedAnswer);
    state().save(progress);
    state().saveActiveStage(session);
    markAnswers();
    showFeedback(correct, xp, session);
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

  function retryCurrentChallenge() {
    const session = state().activeStage();
    if (!session) return;
    document.getElementById("answerArea")?.classList.remove("is-correct", "is-wrong");
    render(session);
  }

  function switchActiveDifficulty(nextDifficulty) {
    console.log("switching to " + nextDifficulty);
    const progress = state().load();
    progress.difficulty = nextDifficulty;
    state().save(progress);
    const session = state().activeStage();
    if (!session) return null;
    session.difficulty = nextDifficulty;
    session.correctStreak = 0;
    session.wrongStreak = 0;
    state().saveActiveStage(session);
    console.log({
      currentDifficulty: session.difficulty,
      currentStage: session.stageId,
      failCount: session.wrongStreak
    });
    return session;
  }

  function showFeedback(correct, xp, session) {
    const feedback = document.getElementById("challengeFeedback");
    if (feedback) {
      feedback.hidden = false;
      feedback.className = `challenge-feedback gv2-feedback ${correct ? "is-correct" : "is-wrong"}`;
      feedback.replaceChildren();
      const message = document.createElement("p");
      message.textContent = correct
        ? `נכון. צברת ${xp} נקודות. ${currentChallenge.explanation}`
        : `לא מדויק. התשובה הנכונה: ${text(currentChallenge.correctAnswer)}. ${currentChallenge.explanation}`;
      const actions = document.createElement("div");
      actions.className = "m-game-feedback-actions";
      if (!correct) {
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "btn secondary";
        retry.textContent = "נסה שוב";
        retry.addEventListener("click", retryCurrentChallenge);
        actions.append(retry);
      }
      const nextInline = document.createElement("button");
      nextInline.type = "button";
      nextInline.className = "btn";
      nextInline.textContent = "המשך";
      nextInline.addEventListener("click", nextChallenge);
      actions.append(nextInline);
      feedback.append(message, actions);
    }
    renderAdaptiveSuggestion(session);
    document.getElementById("nextChallenge").hidden = false;
    document.getElementById("checkAnswer").disabled = true;
  }

  function renderAdaptiveSuggestion(session) {
    const adaptive = document.getElementById("adaptiveSuggestion") || createAdaptiveSuggestion();
    if (!adaptive) return;
    adaptive.replaceChildren();
    adaptive.hidden = true;
    if (session.correctStreak >= 3 && session.difficulty !== "hard") {
      adaptive.hidden = false;
      adaptive.className = "adaptive-suggestion is-positive";
      const textNode = document.createElement("span");
      textNode.textContent = "ענית נכון 3 פעמים ברצף. רוצה לנסות רמה קשה יותר בשלב הבא?";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn secondary";
      button.textContent = "עבור לרמה קשה";
      button.addEventListener("click", () => {
        switchActiveDifficulty("hard");
        adaptive.textContent = "הרמה הקשה תופעל בשאלה הבאה.";
      });
      adaptive.append(textNode, button);
    } else if (session.wrongStreak >= 2) {
      adaptive.hidden = false;
      adaptive.className = "adaptive-suggestion is-warning";
      const targetDifficulty = getLowerDifficulty(session.difficulty);
      const textNode = document.createElement("span");
      textNode.textContent = targetDifficulty
        ? "שתי טעויות ברצף. מומלץ לפתוח רמז או לרדת לרמה " + shortDifficultyLabel(targetDifficulty) + " בשאלה הבאה."
        : "שתי טעויות ברצף. כדאי להשתמש ברמז, לנסות שוב או לחזור למסלול לחזרה קצרה.";
      adaptive.append(textNode);
      if (targetDifficulty) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn secondary";
        button.textContent = "הפעל רמה " + shortDifficultyLabel(targetDifficulty);
        button.addEventListener("click", () => {
          switchActiveDifficulty(targetDifficulty);
          adaptive.textContent = "הרמה ה" + shortDifficultyLabel(targetDifficulty) + " תופעל בשאלה הבאה.";
        });
        adaptive.append(button);
      }
    }
  }

  function createAdaptiveSuggestion() {
    const feedback = document.getElementById("challengeFeedback");
    if (!feedback?.parentNode) return null;
    const node = document.createElement("div");
    node.id = "adaptiveSuggestion";
    node.className = "adaptive-suggestion";
    node.hidden = true;
    feedback.after(node);
    return node;
  }

  function nextChallenge() {
    console.log("continue clicked");
    const session = state().activeStage();
    if (!session) {
      const requestedStage = params().get("stage") || state().firstOpenStage();
      const restarted = state().startStage(requestedStage);
      console.log("active stage was missing; restarted session", {
        currentDifficulty: restarted.difficulty,
        currentStage: restarted.stageId,
        failCount: restarted.wrongStreak
      });
      render(restarted);
      return;
    }
    session.index += 1;
    session.correctStreak = Number(session.correctStreak || 0);
    session.wrongStreak = Number(session.wrongStreak || 0);
    state().saveActiveStage(session);
    const hint = document.getElementById("challengeHint");
    if (hint) hint.hidden = true;
    document.getElementById("answerArea")?.classList.remove("is-correct", "is-wrong");
    render(session);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.gamePage === "challenge" && window.CourseGameState) init();
  });
})();

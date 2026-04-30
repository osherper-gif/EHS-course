(function () {
  function state() {
    return window.CourseGameState;
  }

  function text(value) {
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  function init() {
    renderMistakes();
  }

  function renderMistakes() {
    const container = document.getElementById("gameMistakesList");
    const count = document.getElementById("mistakeCount");
    if (!container) return;
    const progress = state().load();
    const mistakes = progress.mistakes || [];
    if (count) count.textContent = String(mistakes.length);
    container.replaceChildren();
    if (!mistakes.length) {
      const empty = document.createElement("article");
      empty.className = "challenge-card gv2-empty-state";
      empty.textContent = "אין כרגע טעויות לחזרה. אפשר להמשיך לשלב הבא או לפתוח את מסלול היחידה.";
      container.append(empty);
      return;
    }
    mistakes.forEach((mistake) => {
      const challenge = state().challenges().find((item) => item.id === mistake.challengeId);
      const card = document.createElement("article");
      card.className = "challenge-card mistake-review-card gv2-mistake-card";
      const tag = document.createElement("span");
      tag.className = "status-pill";
      tag.textContent = "יסודות בטיחות";
      const title = document.createElement("h2");
      title.textContent = mistake.title;
      const prompt = document.createElement("p");
      prompt.textContent = mistake.prompt;
      const meta = document.createElement("p");
      meta.className = "muted-answer";
      meta.textContent = `התשובה הנכונה: ${text(mistake.correctAnswer)}`;
      const explanation = document.createElement("p");
      explanation.textContent = mistake.explanation;
      const actions = document.createElement("div");
      actions.className = "form-actions";
      const retry = document.createElement("a");
      retry.className = "btn";
      retry.href = `game-challenge.html?stage=${encodeURIComponent(mistake.stageId)}`;
      retry.textContent = "תרגל שוב";
      const lesson = document.createElement("a");
      lesson.className = "btn secondary";
      lesson.href = `${mistake.relatedLessonId}.html`;
      lesson.textContent = "פתח שיעור קשור";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "btn secondary";
      clear.textContent = "סמן כחזרתי";
      clear.addEventListener("click", () => {
        state().removeMistake(mistake.challengeId);
        renderMistakes();
      });
      actions.append(retry, lesson, clear);
      card.append(tag, title, prompt, meta, explanation, actions);
      if (!challenge) card.dataset.missingChallenge = "true";
      container.append(card);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.gamePage === "mistakes" && window.CourseGameState) init();
  });
})();

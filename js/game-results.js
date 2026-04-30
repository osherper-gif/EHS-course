(function () {
  function state() {
    return window.CourseGameState;
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function renderStars(container, count) {
    if (!container) return;
    container.replaceChildren();
    for (let index = 1; index <= 3; index += 1) {
      const star = document.createElement("span");
      star.className = index <= count ? "star is-filled" : "star";
      star.textContent = "★";
      container.append(star);
    }
  }

  function init() {
    const progress = state().load();
    const result = progress.lastStageResult;
    if (!result) {
      location.href = "safety-game.html";
      return;
    }
    const stage = state().getStage(result.stageId);
    setText("resultStageTitle", `סיום שלב ${stage.order}: ${stage.title}`);
    setText("resultScore", `${result.score}%`);
    setText("resultXp", `${result.xp} XP`);
    setText("resultCorrect", `${result.correct}/${result.total}`);
    setText("resultWrong", String(result.wrong));
    renderStars(document.getElementById("resultStars"), result.stars);

    const list = document.getElementById("resultMistakes");
    if (list) {
      list.replaceChildren();
      const mistakes = result.answers.filter((answer) => !answer.correct);
      if (!mistakes.length) {
        const item = document.createElement("li");
        item.textContent = "לא היו טעויות בשלב הזה.";
        list.append(item);
      } else {
        mistakes.forEach((answer) => {
          const challenge = state().challenges().find((item) => item.id === answer.challengeId);
          const item = document.createElement("li");
          item.textContent = challenge ? challenge.prompt : answer.challengeId;
          list.append(item);
        });
      }
    }

    const nextLink = document.getElementById("continueNextStage");
    if (nextLink) {
      const nextStage = state().nextStageId(result.stageId);
      if (nextStage === result.stageId) {
        nextLink.href = "game-unit.html?unit=unit-foundations";
        nextLink.textContent = "חזור למסלול היחידה";
      } else {
        nextLink.href = `game-challenge.html?stage=${encodeURIComponent(nextStage)}`;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.gamePage === "results" && window.CourseGameState) init();
  });
})();

(function () {
  const state = () => window.CourseGameState;
  const data = () => window.CourseGameData || {};

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function stars(count) {
    const wrapper = el("span", "star-rating");
    for (let index = 1; index <= 3; index += 1) {
      const star = el("span", index <= count ? "star is-filled" : "star", "★");
      wrapper.append(star);
    }
    return wrapper;
  }

  function renderDashboard() {
    const progress = state().load();
    const stages = state().stages();
    const completed = Object.keys(progress.completedStages || {}).length;
    const totalStages = stages.length || 1;
    const xpNodes = document.querySelectorAll("[data-game-xp]");
    xpNodes.forEach((node) => {
      node.textContent = String(progress.totalXp || 0);
    });
    document.querySelectorAll("[data-game-completed]").forEach((node) => {
      node.textContent = `${completed}/${totalStages}`;
    });
    document.querySelectorAll("[data-game-progress]").forEach((bar) => {
      bar.value = Math.round((completed / totalStages) * 100);
    });
    const currentStage = state().getStage(state().firstOpenStage(progress));
    document.querySelectorAll("[data-game-current-stage]").forEach((node) => {
      node.textContent = currentStage ? `${currentStage.order}. ${currentStage.title}` : "היחידה הושלמה";
    });
    const mistakeCount = (progress.mistakes || []).length;
    document.querySelectorAll("[data-game-mistakes]").forEach((node) => {
      node.textContent = String(mistakeCount);
    });
  }

  function renderUnitPath(containerId = "gameUnitPath") {
    const container = document.getElementById(containerId);
    if (!container) return;
    const progress = state().load();
    container.replaceChildren();
    state().stages().forEach((stage) => {
      const status = state().stageStatus(stage.id, progress);
      const card = el("article", `game-node ${status}`);
      const badge = el("div", "game-node-badge", String(stage.order));
      const body = el("div", "game-node-body");
      body.append(el("h2", "", stage.title));
      body.append(el("p", "", stage.summary));
      const meta = el("div", "game-node-meta");
      meta.append(stars(Number(progress.stageStars?.[stage.id] || 0)));
      meta.append(el("span", "status-pill", statusText(status)));
      body.append(meta);
      const action = document.createElement("a");
      action.className = status === "locked" ? "btn secondary disabled-link" : "btn";
      action.href = status === "locked" ? "#" : `game-challenge.html?stage=${encodeURIComponent(stage.id)}`;
      action.textContent = status === "completed" ? "תרגל שוב" : "התחל שלב";
      if (status === "locked") action.setAttribute("aria-disabled", "true");
      card.append(badge, body, action);
      container.append(card);
    });
  }

  function statusText(status) {
    const map = {
      completed: "הושלם",
      locked: "נעול",
      current: "נוכחי",
      open: "פתוח"
    };
    return map[status] || status;
  }

  function initSafetyGameHome() {
    renderDashboard();
    const continueButton = document.getElementById("continueGame");
    if (continueButton) {
      continueButton.href = `game-challenge.html?stage=${encodeURIComponent(state().firstOpenStage())}`;
    }
    const units = document.getElementById("gameUnitsList");
    if (units) {
      units.replaceChildren();
      (data().gameUnits || []).forEach((unit) => {
        const card = el("article", "hub-card");
        card.append(el("p", "kicker", "יחידה פעילה"));
        card.append(el("h2", "", unit.title));
        card.append(el("p", "", unit.description));
        const link = document.createElement("a");
        link.className = "btn";
        link.href = `game-unit.html?unit=${encodeURIComponent(unit.id)}`;
        link.textContent = "פתח מסלול יחידה";
        card.append(link);
        units.append(card);
      });
    }
  }

  function initGameUnit() {
    renderDashboard();
    renderUnitPath();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.CourseGameState) return;
    if (document.body.dataset.gamePage === "home") initSafetyGameHome();
    if (document.body.dataset.gamePage === "unit") initGameUnit();
  });

  window.CourseGameUI = {
    renderDashboard,
    renderUnitPath,
    stars
  };
})();

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
    const wrapper = el("span", "star-rating gv2-stars-inline");
    for (let index = 1; index <= 3; index += 1) {
      const star = el("span", index <= count ? "star is-filled" : "star", "★");
      wrapper.append(star);
    }
    return wrapper;
  }

  function renderDifficulty(progress = state().load()) {
    const difficulty = state().getDifficulty(progress);
    const label = state().difficultyLabel(difficulty);
    document.querySelectorAll("[data-game-difficulty]").forEach((node) => {
      node.textContent = label;
    });
    document.querySelectorAll("[data-game-difficulty-value]").forEach((node) => {
      node.checked = node.value === difficulty;
      node.closest?.(".difficulty-card")?.classList.toggle("is-selected", node.checked);
    });
  }

  function initDifficultyControls() {
    document.querySelectorAll("[data-game-difficulty-value]").forEach((control) => {
      control.addEventListener("change", () => {
        const progress = state().setDifficulty(control.value);
        renderDifficulty(progress);
        const notice = document.getElementById("difficultyNotice");
        if (notice) notice.textContent = `רמה פעילה: ${state().difficultyLabel(progress.difficulty)}. עכשיו אפשר ללחוץ על המשך אתגר.`;
        const continueButton = document.getElementById("continueGame");
        if (continueButton) continueButton.href = `game-challenge.html?stage=${encodeURIComponent(state().firstOpenStage(progress))}`;
      });
    });
  }

  function renderDashboard() {
    const progress = state().load();
    const stages = state().stages();
    const completed = Object.keys(progress.completedStages || {}).length;
    const totalStages = stages.length || 1;
    document.querySelectorAll("[data-game-xp]").forEach((node) => {
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
    renderDifficulty(progress);
  }

  function renderUnitPath(containerId = "gameUnitPath") {
    const container = document.getElementById(containerId);
    if (!container) return;
    const progress = state().load();
    container.replaceChildren();
    state().stages().forEach((stage) => {
      const status = state().stageStatus(stage.id, progress);
      const starsCount = Number(progress.stageStars?.[stage.id] || 0);
      const visualState = status === "completed" && starsCount === 3
        ? "perfect"
        : status === "completed" && starsCount < 3
          ? "needs-review"
          : status;

      container.append(el("div", "gv2-cluster-divider", stage.title));

      const card = el("article", `game-node gv2-node gv2-node--${visualState}`);
      card.dataset.state = visualState;
      card.dataset.stageId = stage.id;

      const nodeButton = document.createElement("button");
      nodeButton.type = "button";
      nodeButton.className = "game-node-badge gv2-node-button";
      nodeButton.textContent = status === "locked" ? "🔒" : String(stage.order);
      nodeButton.disabled = status === "locked";
      nodeButton.setAttribute("aria-label", `${stage.title} - ${statusText(status)}`);

      const body = el("div", "game-node-body gv2-node-body");
      body.append(el("h2", "", stage.title));
      body.append(el("p", "", stage.summary));
      const meta = el("div", "game-node-meta gv2-node-meta");
      meta.append(stars(starsCount));
      meta.append(el("span", "status-pill", statusText(visualState)));
      meta.append(el("span", "status-pill", `רמה: ${state().difficultyLabel(progress.difficulty)}`));
      body.append(meta);

      const popover = el("div", "gv2-stage-popover");
      popover.hidden = true;
      popover.append(el("h3", "", stage.title));
      popover.append(el("p", "", stage.summary));
      popover.append(el("p", "", `רמת קושי פעילה: ${state().difficultyLabel(progress.difficulty)}.`));
      const action = document.createElement("a");
      action.className = "btn";
      action.href = `game-challenge.html?stage=${encodeURIComponent(stage.id)}`;
      action.textContent = status === "completed" ? "תרגל שוב" : "התחל שלב";
      popover.append(action);

      nodeButton.addEventListener("click", () => {
        container.querySelectorAll(".gv2-stage-popover").forEach((item) => {
          if (item !== popover) item.hidden = true;
        });
        popover.hidden = !popover.hidden;
      });

      card.append(nodeButton, body, popover);
      container.append(card);
    });
  }

  function statusText(status) {
    const map = {
      completed: "הושלם",
      locked: "נעול",
      current: "נוכחי",
      open: "פתוח",
      perfect: "מושלם",
      "needs-review": "לחזרה"
    };
    return map[status] || status;
  }

  function initSafetyGameHome() {
    renderDashboard();
    initDifficultyControls();
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
    renderDifficulty,
    stars
  };
})();

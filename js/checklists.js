(function () {
  const KEY = "safetyCourse:fieldChecklists";
  const getState = () => JSON.parse(localStorage.getItem(KEY) || "{}");
  const setState = (state) => localStorage.setItem(KEY, JSON.stringify(state));

  function updateScore(section) {
    const checks = Array.from(section.querySelectorAll('input[type="checkbox"][data-check-item]'));
    const checked = checks.filter((item) => item.checked).length;
    const score = checks.length ? Math.round((checked / checks.length) * 100) : 0;
    const output = section.querySelector("[data-check-score]");
    if (output) output.textContent = score + "%";
  }

  function saveInput(input) {
    const state = getState();
    state[input.dataset.checkId] = input.type === "checkbox" ? input.checked : input.value;
    setState(state);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const state = getState();
    document.querySelectorAll("[data-check-id]").forEach((input) => {
      if (Object.prototype.hasOwnProperty.call(state, input.dataset.checkId)) {
        if (input.type === "checkbox") input.checked = Boolean(state[input.dataset.checkId]);
        else input.value = state[input.dataset.checkId] || "";
      }
      input.addEventListener("input", () => {
        saveInput(input);
        const section = input.closest("[data-checklist]");
        if (section) updateScore(section);
      });
      input.addEventListener("change", () => {
        saveInput(input);
        const section = input.closest("[data-checklist]");
        if (section) updateScore(section);
      });
    });
    document.querySelectorAll("[data-checklist]").forEach(updateScore);
    document.querySelectorAll("[data-action='reset-checklists']").forEach((button) => {
      button.addEventListener("click", () => {
        localStorage.removeItem(KEY);
        location.reload();
      });
    });
  });
})();

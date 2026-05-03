(function () {
  "use strict";

  const STORAGE_KEY = "ehsAccessibilityPrefs";
  const PANEL_ID = "accessibilityPanel";
  const TOGGLE_ID = "accessibilityToggle";
  const defaults = {
    largeText: false,
    highContrast: false,
    highlightLinks: false,
  };

  let prefs = loadPrefs();
  let lastFocus = null;

  function loadPrefs() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch {
      return { ...defaults };
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* localStorage is optional; accessibility controls still work for the current page. */
    }
  }

  function applyPrefs() {
    const root = document.documentElement;
    root.classList.toggle("a11y-large-text", Boolean(prefs.largeText));
    root.classList.toggle("a11y-high-contrast", Boolean(prefs.highContrast));
    root.classList.toggle("a11y-highlight-links", Boolean(prefs.highlightLinks));
  }

  function focusable(container) {
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((node) => node.offsetParent !== null);
  }

  function closePanel() {
    const panel = document.getElementById(PANEL_ID);
    const toggle = document.getElementById(TOGGLE_ID);
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    document.body.classList.remove("accessibility-open");
    toggle?.setAttribute("aria-expanded", "false");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function openPanel(trigger) {
    const panel = document.getElementById(PANEL_ID);
    const toggle = document.getElementById(TOGGLE_ID);
    if (!panel) return;
    lastFocus = trigger || document.activeElement;
    panel.hidden = false;
    document.body.classList.add("accessibility-open");
    toggle?.setAttribute("aria-expanded", "true");
    const first = focusable(panel)[0];
    first?.focus();
  }

  function togglePanel(event) {
    event?.preventDefault();
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    if (panel.hidden) openPanel(event?.currentTarget);
    else closePanel();
  }

  function buildToggle(label, key) {
    const wrapper = document.createElement("label");
    wrapper.className = "accessibility-option";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(prefs[key]);
    input.addEventListener("change", () => {
      prefs[key] = input.checked;
      applyPrefs();
      savePrefs();
    });

    const text = document.createElement("span");
    text.textContent = label;

    wrapper.append(input, text);
    return wrapper;
  }

  function createControls() {
    if (document.getElementById(TOGGLE_ID)) return;

    const button = document.createElement("button");
    button.id = TOGGLE_ID;
    button.type = "button";
    button.className = "accessibility-toggle";
    button.textContent = "נגישות";
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", PANEL_ID);
    button.addEventListener("click", togglePanel);

    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.className = "accessibility-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "accessibilityTitle");

    const head = document.createElement("div");
    head.className = "accessibility-panel__head";
    const title = document.createElement("h2");
    title.id = "accessibilityTitle";
    title.textContent = "אפשרויות נגישות";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "accessibility-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "סגור אפשרויות נגישות");
    close.addEventListener("click", closePanel);
    head.append(title, close);

    const options = document.createElement("div");
    options.className = "accessibility-options";
    options.append(
      buildToggle("הגדלת טקסט", "largeText"),
      buildToggle("ניגודיות גבוהה", "highContrast"),
      buildToggle("הדגשת קישורים", "highlightLinks")
    );

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "btn secondary accessibility-reset";
    reset.textContent = "איפוס הגדרות";
    reset.addEventListener("click", () => {
      prefs = { ...defaults };
      savePrefs();
      applyPrefs();
      panel.querySelectorAll('input[type="checkbox"]').forEach((input) => {
        input.checked = false;
      });
    });

    panel.append(head, options, reset);

    panel.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable(panel);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.body.append(button, panel);

    document.addEventListener("click", (event) => {
      const action = event.target.closest?.('[data-action="open-accessibility"]');
      if (action) togglePanel(event);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePanel();
  });

  applyPrefs();
  window.CourseAccessibility = {
    open: () => openPanel(document.activeElement),
    close: closePanel,
    toggle: togglePanel,
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createControls);
  } else {
    createControls();
  }
})();

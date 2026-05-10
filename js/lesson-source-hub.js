(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function updateProgress(hub) {
    const bar = hub.querySelector("[data-source-progress-bar]");
    if (!bar) return;
    const rect = hub.getBoundingClientRect();
    const total = Math.max(1, rect.height - window.innerHeight);
    const read = Math.min(total, Math.max(0, -rect.top));
    bar.style.inlineSize = `${Math.round((read / total) * 100)}%`;
  }

  function filterChapters(hub) {
    const query = (hub.querySelector("[data-source-search]")?.value || "").trim().toLowerCase();
    const activeTopic = hub.querySelector("[data-source-filter].is-active")?.dataset.sourceFilter || "all";
    hub.querySelectorAll("[data-source-chapter]").forEach((chapter) => {
      const text = chapter.textContent.toLowerCase();
      const topic = chapter.dataset.topic || "";
      const visible = (!query || text.includes(query)) && (activeTopic === "all" || topic === activeTopic);
      chapter.hidden = !visible;
    });
  }

  function safeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeNumberedTitle(text, pageKey) {
    const clean = safeText(text);
    if (/^סעיף\s+\d+(?:\.\d+)?\s+בתקן\s+—/.test(clean) || /^פרק\s+\d+(?:\.\d+)?\s+—/.test(clean)) {
      return clean;
    }
    const standard = clean.match(/^סעיף\s+(\d+(?:\.\d+)?)\s*[—-]?\s*(.+)$/);
    if (standard && pageKey === "iso") {
      return `סעיף ${standard[1]} בתקן — ${standard[2].trim()}`;
    }
    const numbered = clean.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (!numbered) return clean;
    return `פרק ${numbered[1]} — ${numbered[2].trim()}`;
  }

  function normalizeNumberedHeadings(hub) {
    const pageKey = document.body.classList.contains("iso-45001-page") || location.pathname.includes("iso-45001") ? "iso" : "lesson";
    hub.querySelectorAll("[data-source-chapter] > summary > span").forEach((title) => {
      const small = title.querySelector("small");
      const suffix = small ? small.outerHTML : "";
      const label = safeText(title.childNodes[0]?.textContent || title.textContent).replace(/•\s*\d+$/, "").trim();
      const normalized = normalizeNumberedTitle(label, pageKey);
      if (normalized && normalized !== label) title.innerHTML = `${normalized}${suffix}`;
    });
  }

  function splitFlowText(text) {
    return text
      .split(/\r?\n|→|←|↓|↑|=>|-->|->|▼/)
      .map((line) => line.replace(/[│├└─]+/g, " ").replace(/\s+/g, " ").trim())
      .filter((line) => line && !/^[\d\s.:-]+$/.test(line));
  }

  function enhanceTextDiagrams(hub) {
    const rawDiagramPattern = /→|←|↓|↑|=>|-->|->|│|├──|└──|▼/;
    hub.querySelectorAll(".lesson-source-body p").forEach((paragraph) => {
      const text = paragraph.textContent || "";
      if (!rawDiagramPattern.test(text)) return;
      const steps = splitFlowText(text);
      if (steps.length < 2) return;
      const flow = document.createElement("div");
      flow.className = "lesson-generated-flow";
      flow.setAttribute("role", "list");
      steps.forEach((step) => {
        const item = document.createElement("span");
        item.setAttribute("role", "listitem");
        item.textContent = step;
        flow.append(item);
      });
      paragraph.replaceWith(flow);
    });
  }

  function wireHub(hub) {
    normalizeNumberedHeadings(hub);
    enhanceTextDiagrams(hub);

    const search = hub.querySelector("[data-source-search]");
    search?.addEventListener("input", () => filterChapters(hub));

    hub.querySelectorAll("[data-source-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        hub.querySelectorAll("[data-source-filter]").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        filterChapters(hub);
      });
    });

    hub.querySelectorAll("[data-source-action='openAll'], [data-source-open-all]").forEach((button) => button.addEventListener("click", () => {
      hub.querySelectorAll("[data-source-chapter]:not([hidden])").forEach((chapter) => {
        chapter.open = true;
      });
    }));

    hub.querySelectorAll("[data-source-action='closeAll'], [data-source-close-all]").forEach((button) => button.addEventListener("click", () => {
      hub.querySelectorAll("[data-source-chapter]:not([hidden])").forEach((chapter, index) => {
        chapter.open = index === 0;
      });
    }));

    window.addEventListener("scroll", () => updateProgress(hub), { passive: true });
    updateProgress(hub);
  }

  ready(() => {
    document.querySelectorAll("[data-lesson-source-hub], .lesson-source-hub").forEach(wireHub);
  });
})();

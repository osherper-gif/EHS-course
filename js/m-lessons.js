/* Mobile First P1: lesson accordion, scroll progress and TOC sheet. */
(function () {
  const MOBILE_QUERY = "(max-width: 767px)";
  let sections = [];
  let progressBar = null;
  let lastTocFocus = null;

  function isLessonPage() {
    return Boolean(document.querySelector(".lesson-shell[data-lesson-id]"));
  }

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function sectionTitle(section, index) {
    return section.querySelector("h2, h3")?.textContent?.trim() || "חלק " + (index + 1);
  }

  function ensureId(section, index) {
    if (!section.id) section.id = "lesson-section-" + String(index + 1).padStart(2, "0");
    return section.id;
  }

  function createAccordion(section, index) {
    if (section.dataset.mAccordionReady === "1") return;
    const titleNode = section.querySelector(":scope > h2, :scope > h3");
    const title = sectionTitle(section, index);
    const body = document.createElement("div");
    body.className = "m-lesson-accordion__body";
    const nodes = Array.from(section.childNodes);
    nodes.forEach((node) => {
      if (node !== titleNode) body.append(node);
    });
    if (titleNode) titleNode.remove();
    const button = document.createElement("button");
    button.type = "button";
    button.className = "m-lesson-accordion__toggle";
    button.id = "m-lesson-toggle-" + String(index + 1).padStart(2, "0");
    button.setAttribute("aria-expanded", index < 2 ? "true" : "false");
    button.setAttribute("aria-controls", "m-lesson-panel-" + String(index + 1).padStart(2, "0"));
    button.innerHTML = '<span></span><span aria-hidden="true">⌄</span>';
    button.firstElementChild.textContent = title;
    body.id = "m-lesson-panel-" + String(index + 1).padStart(2, "0");
    body.setAttribute("role", "region");
    body.setAttribute("aria-labelledby", button.id);
    body.hidden = index >= 2;
    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", expanded ? "false" : "true");
      body.hidden = expanded;
    });
    section.classList.add("m-lesson-accordion");
    section.prepend(button, body);
    section.dataset.mAccordionReady = "1";
  }

  function expandSection(section) {
    const button = section?.querySelector?.(".m-lesson-accordion__toggle");
    const body = section?.querySelector?.(".m-lesson-accordion__body");
    if (button && body) {
      button.setAttribute("aria-expanded", "true");
      body.hidden = false;
    }
  }

  function scrollToSection(section) {
    if (!section) return;
    expandSection(section);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function findQuestionsSection() {
    return document.querySelector(".lesson-exam-links") || sections.find((section) => /שאלות|בוחן|מבחן/.test(sectionTitle(section, 0)));
  }

  function ensureLessonBar() {
    if (document.getElementById("mLessonProgress")) return;
    const bar = document.createElement("div");
    bar.id = "mLessonProgress";
    bar.className = "m-lesson-progress";
    bar.innerHTML = '<span class="m-lesson-progress__track"><span></span></span>' +
      '<button type="button" data-m-lesson-toc>תוכן השיעור</button>' +
      '<button type="button" data-m-lesson-questions>שאלות השיעור</button>' +
      '<button type="button" data-m-lesson-top>למעלה</button>';
    document.body.append(bar);
    progressBar = bar.querySelector(".m-lesson-progress__track span");
    bar.querySelector("[data-m-lesson-toc]")?.addEventListener("click", openTocSheet);
    bar.querySelector("[data-m-lesson-questions]")?.addEventListener("click", () => scrollToSection(findQuestionsSection()));
    bar.querySelector("[data-m-lesson-top]")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function ensureTocSheet() {
    let sheet = document.getElementById("mLessonTocSheet");
    if (sheet) return sheet;
    sheet = document.createElement("div");
    sheet.id = "mLessonTocSheet";
    sheet.className = "m-sheet m-lesson-toc-sheet";
    sheet.hidden = true;
    sheet.innerHTML = '<div class="m-sheet__backdrop" data-m-lesson-toc-close></div>' +
      '<section class="m-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="mLessonTocTitle" tabindex="-1">' +
      '<div class="m-sheet__head"><h2 id="mLessonTocTitle">תוכן השיעור</h2>' +
      '<button type="button" class="m-sheet__close" data-m-lesson-toc-close aria-label="סגירה">×</button></div>' +
      '<nav class="m-sheet__body m-lesson-toc-list"></nav></section>';
    document.body.append(sheet);
    sheet.addEventListener("click", (event) => {
      if (event.target.closest("[data-m-lesson-toc-close]")) closeTocSheet();
    });
    sheet.addEventListener("keydown", (event) => { if (event.key === "Escape") closeTocSheet(); });
    return sheet;
  }

  function renderToc() {
    const sheet = ensureTocSheet();
    const nav = sheet.querySelector(".m-lesson-toc-list");
    if (!nav) return;
    nav.replaceChildren();
    sections.forEach((section, index) => {
      const link = document.createElement("button");
      link.type = "button";
      link.className = "m-sheet__link";
      link.textContent = sectionTitle(section, index);
      link.addEventListener("click", () => {
        closeTocSheet();
        scrollToSection(section);
      });
      nav.append(link);
    });
  }

  function openTocSheet() {
    lastTocFocus = document.activeElement;
    renderToc();
    const sheet = ensureTocSheet();
    sheet.hidden = false;
    sheet.classList.add("is-open");
    document.body.classList.add("m-sheet-open");
    requestAnimationFrame(() => sheet.querySelector(".m-sheet__panel")?.focus());
  }

  function closeTocSheet() {
    const sheet = document.getElementById("mLessonTocSheet");
    if (!sheet) return;
    sheet.classList.remove("is-open");
    sheet.hidden = true;
    document.body.classList.remove("m-sheet-open");
    if (lastTocFocus && typeof lastTocFocus.focus === "function") lastTocFocus.focus();
  }

  function updateProgress() {
    if (!progressBar || !isMobile()) return;
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
    progressBar.style.width = pct.toFixed(1) + "%";
  }

  function init() {
    if (!isLessonPage()) return;
    if (!isMobile()) return;
    sections = Array.from(document.querySelectorAll(".lesson-content > .lesson-section, main > .lesson-section, main > .related-panel"));
    sections.forEach((section, index) => {
      ensureId(section, index);
      createAccordion(section, index);
    });
    ensureLessonBar();
    renderToc();
    updateProgress();
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("course-auth-approved", init);
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", () => {
    init();
    updateProgress();
  });
})();

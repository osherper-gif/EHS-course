(function () {
  const TOPICS = [
    { key: "inspection-service", label: "שירות הפיקוח", match: /מטרת החוק|שירות הפיקוח|מנגנון/i },
    { key: "inspector-powers", label: "סמכויות מפקח", match: /סמכויות|מפקח|מומחים|דינים וחשבונות/i },
    { key: "orders", label: "צווים", match: /צו בטיחות|צו שיפור|צו הפסקת|ביטול צו|ערעור/i },
    { key: "safety-committee", label: "ועדות בטיחות", match: /ועדת בטיחות|ועדה/i },
    { key: "safety-trustees", label: "נאמני בטיחות", match: /נאמני בטיחות|נאמן/i },
    { key: "safety-officer", label: "ממונה בטיחות", match: /ממונה בטיחות|ממונה על בטיחות/i },
    { key: "safety-institute", label: "מוסד לבטיחות ולגיהות", match: /המוסד לבטיחות|גיהות/i },
    { key: "penalties", label: "עונשין ואחריות", match: /עונשין|אחריות|נושאי משרה|עבירה/i },
    { key: "saved-laws", label: "שמירת דינים", match: /שמירת דינים|חובות|תקנות ואגרות|תקנות/i },
  ];

  const DIAGRAMS = [
    {
      title: "היררכיית שירות הפיקוח",
      type: "ladder",
      items: ["שר העבודה", "מפקח עבודה ראשי", "סגן מפקח עבודה ראשי", "מפקחי עבודה אזוריים", "מפקחי עבודה"],
    },
    {
      title: "זרימת צו בטיחות",
      type: "flow",
      items: ["זיהוי סכנה", "הוצאת צו", "עצירת עבודה / שימוש", "תיקון הליקוי", "בדיקה", "ביטול צו"],
    },
    {
      title: "טיפול בליקוי",
      type: "timeline",
      items: ["איתור", "תיעוד", "דיווח", "פעולה מתקנת", "מעקב", "סגירה"],
    },
  ];

  const TOP_FIXED_SELECTORS = [
    ".site-header",
    ".site-header .law-notice",
    ".admin-tabs",
    ".lesson-mini-nav",
    ".top-toolbar",
    ".admin-toolbar",
    ".user-toolbar",
    "[data-admin-bar]",
    "[data-user-bar]",
    "[data-toolbar='top']",
  ];
  const OFFSET_SAFETY_PX = 24;
  let lastOffset = 0;

  function textOf(node) {
    return (node && node.textContent ? node.textContent : "").replace(/\s+/g, " ").trim();
  }

  function topicFor(title) {
    return TOPICS.find((topic) => topic.match.test(title)) || TOPICS[0];
  }

  function createEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function normalizeSectionTitle(title) {
    const clean = textOf({ textContent: title });
    const numbered = clean.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (!numbered || /^סעיף\s+\d+/.test(clean) || /^פרק\s+\d+/.test(clean)) return clean;
    return `פרק ${numbered[1]} — ${numbered[2].trim()}`;
  }

  function splitFlowText(text) {
    return String(text || "")
      .split(/\r?\n|→|←|↓|↑|=>|-->|->|▼/)
      .map((line) => line.replace(/[│├└─]+/g, " ").replace(/\s+/g, " ").trim())
      .filter((line) => line && !/^[\d\s.:-]+$/.test(line));
  }

  function enhanceTextDiagrams(root) {
    const rawDiagramPattern = /→|←|↓|↑|=>|-->|->|│|├──|└──|▼/;
    root.querySelectorAll("p").forEach((paragraph) => {
      const text = paragraph.textContent || "";
      if (!rawDiagramPattern.test(text)) return;
      const steps = splitFlowText(text);
      if (steps.length < 2) return;
      const flow = createEl("div", "lesson-generated-flow");
      flow.setAttribute("role", "list");
      steps.forEach((step) => {
        const item = createEl("span", "", step);
        item.setAttribute("role", "listitem");
        flow.append(item);
      });
      paragraph.replaceWith(flow);
    });
  }

  function isVisibleElement(node) {
    if (!node) return false;
    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }

  function isInsideCountedElement(node, counted) {
    return counted.some((item) => item !== node && item.contains(node));
  }

  function measureFixedHeaderOffset() {
    const candidates = TOP_FIXED_SELECTORS.flatMap((selector) =>
      Array.from(document.querySelectorAll(selector)).map((node) => ({ selector, node })),
    );
    const countedNodes = [];
    const countedSelectors = [];
    let maxBottom = 0;

    candidates.forEach(({ selector, node }) => {
      if (!isVisibleElement(node) || isInsideCountedElement(node, countedNodes)) return;
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      const isTopLayer = selector === ".site-header" || style.position === "fixed" || style.position === "sticky";
      if (!isTopLayer || rect.bottom <= 0 || rect.top > 4) return;
      maxBottom = Math.max(maxBottom, rect.bottom);
      countedNodes.push(node);
      countedSelectors.push(`${selector}:${Math.round(rect.height)}px`);
    });

    const measured = Math.ceil(maxBottom + OFFSET_SAFETY_PX);
    const fallback = Number.parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--fixed-header-offset"), 10) || 176;
    const offset = Math.max(measured, fallback);
    document.documentElement.style.setProperty("--fixed-header-offset", `${offset}px`);
    document.documentElement.style.setProperty("--law-header-offset", `${offset}px`);
    document.documentElement.dataset.fixedHeaderOffset = String(offset);
    document.documentElement.dataset.fixedHeaderSelectors = countedSelectors.join(", ");
    lastOffset = offset;
    return offset;
  }

  function scrollHashIntoSafeView() {
    if (!window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return;
    const offset = measureFixedHeaderOffset();
    const y = window.scrollY + target.getBoundingClientRect().top - offset;
    window.scrollTo({ top: Math.max(0, y), behavior: "auto" });
    if (target.tagName === "DETAILS") target.open = true;
  }

  function scheduleHeaderMeasurements() {
    const run = () => {
      const before = lastOffset;
      measureFixedHeaderOffset();
      if (before !== lastOffset && window.location.hash) scrollHashIntoSafeView();
    };
    run();
    window.addEventListener("load", () => {
      run();
      scrollHashIntoSafeView();
    });
    window.addEventListener("resize", run, { passive: true });
    window.addEventListener("hashchange", () => window.setTimeout(scrollHashIntoSafeView, 0));
    window.setTimeout(() => {
      run();
      scrollHashIntoSafeView();
    }, 300);
  }

  function enhanceHero() {
    const hero = document.querySelector(".law-lesson-page .page-hero");
    if (!hero || hero.classList.contains("law-hero-modern")) return;
    hero.classList.add("law-hero-modern");
    const links = hero.querySelector(".related-links");
    if (!links) return;
    links.replaceChildren();
    [
      ["לתרגול 60 שאלות", "quizzes.html#labor-inspection-law-practice", "btn"],
      ["לאתגר הבטיחות", "safety-game.html#labor-inspection-law-game", "btn secondary"],
      ["שאלות למבחן", "exam-questions.html?lesson=labor-inspection-law-1954", "btn secondary"],
      ["חזרה לכלי שטח", "field-tools.html#labor-inspection-law-tool", "btn secondary"],
    ].forEach(([label, href, className]) => {
      const link = createEl("a", className, label);
      link.href = href;
      links.append(link);
    });
  }

  function buildLearningTools(sections) {
    if (document.querySelector(".law-learning-tools")) return;
    const tools = createEl("section", "content-section law-learning-tools");
    tools.setAttribute("aria-label", "כלי ניווט בדף השיעור");

    const progress = createEl("div", "law-reading-progress");
    progress.innerHTML = '<span data-law-progress-bar></span>';

    const search = createEl("label", "law-page-search");
    search.innerHTML = '<span>חיפוש בתוך השיעור</span><input type="search" id="lawPageSearch" placeholder="חפש סעיף, מושג או דגש" autocomplete="off">';

    const filter = createEl("div", "law-topic-filters");
    filter.setAttribute("aria-label", "סינון לפי נושא");
    const all = createEl("button", "law-filter is-active", "הכל");
    all.type = "button";
    all.dataset.topic = "all";
    filter.append(all);
    TOPICS.forEach((topic) => {
      const button = createEl("button", "law-filter", topic.label);
      button.type = "button";
      button.dataset.topic = topic.key;
      filter.append(button);
    });

    const actions = createEl("div", "law-learning-actions");
    const openAll = createEl("button", "btn secondary", "פתח הכל");
    openAll.type = "button";
    openAll.dataset.lawAction = "openAll";
    const closeAll = createEl("button", "btn secondary", "סגור הכל");
    closeAll.type = "button";
    closeAll.dataset.lawAction = "closeAll";
    actions.append(openAll, closeAll);

    const mobileToc = document.createElement("details");
    mobileToc.className = "law-mobile-toc";
    const summary = createEl("summary", "", "פרקי השיעור");
    const nav = createEl("nav", "law-mobile-toc-links");
    sections.forEach((section, index) => {
      const link = createEl("a", "", textOf(section.querySelector("h2")) || `סעיף ${index + 1}`);
      link.href = `#${section.id}`;
      nav.append(link);
    });
    mobileToc.append(summary, nav);

    tools.append(progress, search, filter, actions, mobileToc);
    const firstSection = document.querySelector(".law-source-note") || sections[0];
    firstSection.parentNode.insertBefore(tools, firstSection);
  }

  function buildDiagrams() {
    if (document.querySelector(".law-diagram-gallery")) return;
    const gallery = createEl("section", "content-section law-diagram-gallery");
    gallery.innerHTML = '<div class="section-title"><h2>מפות הבנה מהירות</h2><p>תרשימים ויזואליים להתמצאות לפני קריאת סעיפי החוק. כל התוכן המפורט נמצא בפרקים עצמם.</p></div>';

    const grid = createEl("div", "law-diagram-gallery-grid");
    DIAGRAMS.forEach((diagram) => {
      const card = createEl("article", `law-mini-diagram law-mini-diagram-${diagram.type}`);
      card.append(createEl("h3", "", diagram.title));
      const list = createEl("ol", "");
      diagram.items.forEach((item) => {
        list.append(createEl("li", "", item));
      });
      card.append(list);
      grid.append(card);
    });

    const compare = createEl("article", "law-order-comparison");
    compare.innerHTML = `
      <h3>צו בטיחות מול צו שיפור</h3>
      <div>
        <section><strong>צו בטיחות</strong><p>תגובה לסכנה בטיחותית המחייבת עצירה, תיקון או מניעת שימוש.</p></section>
        <section><strong>צו שיפור</strong><p>דרישה לתיקון הפרת חיקוק בתוך פרק זמן שנקבע בצו.</p></section>
      </div>
    `;
    grid.append(compare);

    const stakeholders = createEl("article", "law-stakeholder-map");
    stakeholders.innerHTML = `
      <h3>מערכת בעלי עניין</h3>
      <div class="law-stakeholder-grid">
        <span>מעסיק</span><span>מנהלים</span><span>ממונה בטיחות</span><span>ועדת בטיחות</span>
        <span>נאמני בטיחות</span><span>עובדים</span><span>מפקח עבודה</span>
      </div>
    `;
    grid.append(stakeholders);
    gallery.append(grid);

    const anchor = document.querySelector(".law-source-note") || document.querySelector(".law-lesson-section");
    anchor.parentNode.insertBefore(gallery, anchor);
  }

  function groupPanelContent(panel) {
    const nodes = Array.from(panel.childNodes).filter((node) => {
      return node.nodeType !== Node.TEXT_NODE || node.textContent.trim();
    });
    const groups = [];
    let current = null;

    nodes.forEach((node) => {
      if (node.nodeType === 1 && node.tagName === "H3") {
        current = {
          title: textOf(node),
          nodes: [node],
        };
        groups.push(current);
        return;
      }
      if (!current) {
        current = { title: "פתיחה", nodes: [] };
        groups.push(current);
      }
      current.nodes.push(node);
    });

    if (groups.length < 2) return;
    panel.replaceChildren();
    const tabs = createEl("div", "law-tabs", "");
    tabs.setAttribute("role", "tablist");
    const panels = createEl("div", "law-tab-panels", "");

    groups.forEach((group, index) => {
      const tabId = `${panel.id || "law-panel"}-tab-${index}`;
      const panelId = `${panel.id || "law-panel"}-tabpanel-${index}`;
      const button = createEl("button", "law-tab", group.title.replace(/^ציטוט מהחוק.*$/, "ציטוט"));
      button.type = "button";
      button.id = tabId;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", panelId);
      button.setAttribute("aria-selected", index === 0 ? "true" : "false");
      button.tabIndex = index === 0 ? 0 : -1;
      const tabPanel = createEl("div", "law-tab-panel");
      tabPanel.id = panelId;
      tabPanel.setAttribute("role", "tabpanel");
      tabPanel.setAttribute("aria-labelledby", tabId);
      if (index !== 0) tabPanel.hidden = true;
      group.nodes.forEach((node) => tabPanel.append(node));
      button.addEventListener("click", () => activateTab(tabs, panels, button, tabPanel));
      tabs.append(button);
      panels.append(tabPanel);
    });

    panel.append(tabs, panels);
  }

  function activateTab(tabs, panels, button, panel) {
    tabs.querySelectorAll("[role='tab']").forEach((tab) => {
      tab.setAttribute("aria-selected", tab === button ? "true" : "false");
      tab.tabIndex = tab === button ? 0 : -1;
    });
    panels.querySelectorAll("[role='tabpanel']").forEach((item) => {
      item.hidden = item !== panel;
    });
  }

  function enhanceSections() {
    const sections = Array.from(document.querySelectorAll(".law-lesson-section"));
    if (!sections.length || document.querySelector(".law-accordion")) return sections;

    sections.forEach((section, index) => {
      if (!section.id) section.id = `law-section-${index + 1}`;
      const title = normalizeSectionTitle(textOf(section.querySelector("h2")) || `פרק ${index + 1}`);
      const topic = topicFor(title);
      section.dataset.topic = topic.key;
      section.dataset.sectionIndex = String(index);

      const details = document.createElement("details");
      details.className = "content-section law-accordion";
      details.id = section.id;
      details.dataset.topic = topic.key;
      details.dataset.search = textOf(section);
      if (index === 0) details.open = true;

      const summary = createEl("summary", "law-accordion-summary");
      const titleNode = createEl("span", "law-accordion-title", title);
      const topicNode = createEl("span", "law-topic-tag", topic.label);
      const statusNode = createEl("span", "law-accordion-state", index === 0 ? "פתוח" : "סגור");
      summary.append(titleNode, topicNode, statusNode);

      const panel = createEl("div", "law-accordion-panel");
      panel.id = `${section.id}-panel`;
      Array.from(section.childNodes).forEach((node) => {
        if (!(node.nodeType === 1 && node.tagName === "H2")) panel.append(node);
      });
      enhanceTextDiagrams(panel);
      groupPanelContent(panel);

      const nav = createEl("div", "law-section-nav");
      const prev = createEl("a", "btn secondary", "הקודם");
      prev.href = index > 0 ? `#${sections[index - 1].id || `law-section-${index}`}` : "#main";
      const next = createEl("a", "btn secondary", "הבא");
      next.href = index < sections.length - 1 ? `#${sections[index + 1].id || `law-section-${index + 2}`}` : "#exam-questions";
      nav.append(prev, next);
      panel.append(nav);

      details.addEventListener("toggle", () => {
        statusNode.textContent = details.open ? "פתוח" : "סגור";
      });
      details.append(summary, panel);
      section.replaceWith(details);
    });

    return Array.from(document.querySelectorAll(".law-accordion"));
  }

  function buildDesktopToc(sections) {
    if (document.querySelector(".law-desktop-toc")) return;
    const toc = createEl("aside", "law-desktop-toc");
    toc.innerHTML = '<h2>פרקי החוק</h2>';
    const nav = createEl("nav", "");
    sections.forEach((section) => {
      const link = createEl("a", "", section.querySelector(".law-accordion-title")?.textContent || section.id);
      link.href = `#${section.id}`;
      link.dataset.topic = section.dataset.topic;
      nav.append(link);
    });
    toc.append(nav);

    const firstAccordion = sections[0];
    const layout = createEl("div", "law-learning-layout");
    const content = createEl("div", "law-learning-content");
    firstAccordion.parentNode.insertBefore(layout, firstAccordion);
    layout.append(toc, content);
    sections.forEach((section) => content.append(section));
  }

  function applyFilters() {
    const searchInput = document.getElementById("lawPageSearch");
    const activeFilter = document.querySelector(".law-filter.is-active")?.dataset.topic || "all";
    const query = (searchInput?.value || "").trim().toLowerCase();
    let visibleCount = 0;
    document.querySelectorAll(".law-accordion").forEach((section) => {
      const topicOk = activeFilter === "all" || section.dataset.topic === activeFilter;
      const searchOk = !query || (section.dataset.search || "").toLowerCase().includes(query);
      const visible = topicOk && searchOk;
      section.hidden = !visible;
      if (visible) {
        visibleCount += 1;
        if (query) section.open = true;
      }
    });
    document.querySelectorAll(".law-desktop-toc a").forEach((link) => {
      const target = document.querySelector(link.getAttribute("href"));
      link.hidden = Boolean(target?.hidden);
    });
    const tools = document.querySelector(".law-learning-tools");
    if (tools) tools.dataset.visibleCount = String(visibleCount);
  }

  function wireControls() {
    document.getElementById("lawPageSearch")?.addEventListener("input", applyFilters);
    document.querySelectorAll(".law-filter").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".law-filter").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        applyFilters();
      });
    });
    document.querySelector("[data-law-action='openAll']")?.addEventListener("click", () => {
      document.querySelectorAll(".law-accordion:not([hidden])").forEach((section) => { section.open = true; });
    });
    document.querySelector("[data-law-action='closeAll']")?.addEventListener("click", () => {
      document.querySelectorAll(".law-accordion:not([hidden])").forEach((section, index) => { section.open = index === 0; });
    });
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  function updateProgress() {
    const bar = document.querySelector("[data-law-progress-bar]");
    if (!bar) return;
    const doc = document.documentElement;
    const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
    const progress = Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
    bar.style.inlineSize = `${progress}%`;
  }

  function init() {
    const main = document.querySelector(".law-lesson-page");
    if (!main) return;
    main.classList.add("labor-law-page");
    scheduleHeaderMeasurements();
    enhanceHero();
    const rawSections = Array.from(document.querySelectorAll(".law-lesson-section"));
    buildLearningTools(rawSections);
    buildDiagrams();
    const accordions = enhanceSections();
    buildDesktopToc(accordions);
    wireControls();
    scrollHashIntoSafeView();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

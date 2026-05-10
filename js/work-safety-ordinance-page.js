(function () {
  const TOPICS = [
    { key: "health", label: "בריאות עובדים", match: /בריאות|ניקיון|צפיפות|אוורור|תאורה|חום|אבק|אדים|אכילה|עיניים/i },
    { key: "machines", label: "מכונות וגידור", match: /מכונות|גידור|מכונה|ממסרת|מגן/i },
    { key: "height", label: "עבודה בגובה", match: /גובה|נפילה|גישה|סולמות|פתחים/i },
    { key: "lifting", label: "הרמה", match: /הרמה|שרשרות|חבלים|אביזרי|מכונות הרמה|מלגזה|עגורן|מעלית|דרגנוע/i },
    { key: "pressure", label: "מתקני לחץ", match: /קיטור|קולט|דוד|אוויר|לחץ/i },
    { key: "confined", label: "מקום מוקף", match: /מקום מוקף|אדים מסוכנים|מכל|כניסה/i },
    { key: "fire", label: "אש וחירום", match: /אש|מילוט|דליקה|דליקים|ריתוך|חירום|אבק נפיץ/i },
    { key: "welfare", label: "רווחה", match: /רווחה|מים|רחצה|מלתחות|ישיבה|עזרה ראשונה/i },
    { key: "records", label: "תיעוד", match: /תיעוד|פנקס|תסקיר|פתיחת מפעל|הודעה|תקצירים|בנייה/i },
    { key: "liability", label: "אחריות ועונשין", match: /אחריות|עונשין|חובות עובדים|סמכויות מפקח|עבירות/i },
  ];

  const DIAGRAMS = [
    { title: "היררכיית בטיחות", type: "ladder", items: ["בריאות", "מכונות", "הרמה", "מתקני לחץ", "אש", "רווחה"] },
    { title: "זרימת בקרה תפעולית", type: "flow", items: ["זיהוי סיכון", "גידור/הגנה", "בדיקה", "תסקיר", "שימוש", "תחזוקה"] },
    { title: "מקום מוקף - כניסה בטוחה", type: "timeline", items: ["זיהוי מקום מוקף", "בדיקת אווירה", "אוורור וסילוק אדים", "היתר עבודה", "משגיח וחילוץ", "כניסה מבוקרת"] },
  ];

  const TOP_FIXED_SELECTORS = [".site-header", ".site-header .law-notice", ".admin-tabs", ".lesson-mini-nav", ".top-toolbar", ".admin-toolbar", ".user-toolbar", "[data-admin-bar]", "[data-user-bar]", "[data-toolbar='top']"];
  const OFFSET_SAFETY_PX = 24;
  let lastOffset = 0;

  function textOf(node) {
    return (node && node.textContent ? node.textContent : "").replace(/\s+/g, " ").trim();
  }

  function createEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function normalizeSectionTitle(title, section, index) {
    const clean = textOf({ textContent: title });
    const sectionMatch = (section.id || "").match(/^ordinance-section-(\d+)$/);
    const numbered = clean.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (sectionMatch && numbered) {
      return `סעיף ${sectionMatch[1]} לפקודת הבטיחות — ${numbered[2].trim()}`;
    }
    if (!numbered || /^סעיף\s+\d+/.test(clean) || /^פרק\s+\d+/.test(clean)) return clean;
    return `פרק ${numbered[1]} — ${numbered[2].trim() || `נושא ${index + 1}`}`;
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

  function topicFor(title) {
    return TOPICS.find((topic) => topic.match.test(title)) || TOPICS[0];
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
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
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

  function buildLearningTools(sections) {
    if (document.querySelector(".law-learning-tools")) return;
    const tools = createEl("section", "content-section law-learning-tools");
    tools.setAttribute("aria-label", "כלי ניווט בדף השיעור");
    tools.innerHTML = '<div class="law-reading-progress"><span data-law-progress-bar></span></div>';

    const search = createEl("label", "law-page-search");
    search.innerHTML = '<span>חיפוש בתוך השיעור</span><input type="search" id="lawPageSearch" placeholder="חפש סעיף, מושג או דגש" autocomplete="off">';
    tools.append(search);

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
    tools.append(filter);

    const actions = createEl("div", "law-learning-actions");
    [["openAll", "פתח הכל"], ["closeAll", "סגור הכל"]].forEach(([action, label]) => {
      const button = createEl("button", "btn secondary", label);
      button.type = "button";
      button.dataset.lawAction = action;
      actions.append(button);
    });
    tools.append(actions);

    const mobileToc = document.createElement("details");
    mobileToc.className = "law-mobile-toc";
    mobileToc.append(createEl("summary", "", "פרקי השיעור"));
    const nav = createEl("nav", "law-mobile-toc-links");
    sections.forEach((section) => {
      const link = createEl("a", "", textOf(section.querySelector("h2")));
      link.href = `#${section.id}`;
      nav.append(link);
    });
    mobileToc.append(nav);
    tools.append(mobileToc);

    const firstSection = document.querySelector(".law-source-note") || sections[0];
    firstSection.parentNode.insertBefore(tools, firstSection.nextSibling);
  }

  function buildDiagrams() {
    if (document.querySelector(".law-diagram-gallery")) return;
    const gallery = createEl("section", "content-section law-diagram-gallery");
    gallery.innerHTML = '<div class="section-title"><h2>מפות הבנה מהירות</h2><p>תרשימים ויזואליים להתמצאות לפני קריאת סעיפי הפקודה. כל התוכן המפורט נמצא בפרקים עצמם.</p></div>';
    const grid = createEl("div", "law-diagram-gallery-grid");
    DIAGRAMS.forEach((diagram) => {
      const card = createEl("article", `law-mini-diagram law-mini-diagram-${diagram.type}`);
      card.append(createEl("h3", "", diagram.title));
      const list = createEl("ol", "");
      diagram.items.forEach((item) => list.append(createEl("li", "", item)));
      card.append(list);
      grid.append(card);
    });
    const compare = createEl("article", "law-order-comparison");
    compare.innerHTML = '<h3>תדירות בדיקות מרכזיות</h3><div><section><strong>אביזרי הרמה</strong><p>6 חודשים</p></section><section><strong>מכונות הרמה</strong><p>14 חודשים</p></section><section><strong>מעליות</strong><p>6 חודשים</p></section><section><strong>דרגנועים</strong><p>12 חודשים</p></section><section><strong>קולטים</strong><p>26 חודשים</p></section></div>';
    grid.append(compare);
    gallery.append(grid);
    const anchor = document.querySelector(".law-source-note") || document.querySelector(".law-lesson-section");
    anchor.parentNode.insertBefore(gallery, anchor.nextSibling);
  }

  function groupPanelContent(panel) {
    const nodes = Array.from(panel.childNodes).filter((node) => node.nodeType !== Node.TEXT_NODE || node.textContent.trim());
    const groups = [];
    let current = null;
    nodes.forEach((node) => {
      if (node.nodeType === 1 && node.tagName === "H3") {
        current = { title: textOf(node), nodes: [node] };
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
    const tabs = createEl("div", "law-tabs");
    tabs.setAttribute("role", "tablist");
    const panels = createEl("div", "law-tab-panels");
    groups.forEach((group, index) => {
      const tabId = `${panel.id}-tab-${index}`;
      const panelId = `${panel.id}-tabpanel-${index}`;
      const button = createEl("button", "law-tab", group.title.replace(/^ציטוט.*$/, "ציטוט"));
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
      if (!section.id) section.id = `ordinance-section-${index + 1}`;
      const title = normalizeSectionTitle(textOf(section.querySelector("h2")) || `פרק ${index + 1}`, section, index);
      const topic = topicFor(title);
      const details = document.createElement("details");
      details.className = "content-section law-accordion";
      details.id = section.id;
      details.dataset.topic = topic.key;
      details.dataset.search = textOf(section);
      if (index === 0) details.open = true;
      const summary = createEl("summary", "law-accordion-summary");
      const state = createEl("span", "law-accordion-state", index === 0 ? "פתוח" : "סגור");
      summary.append(createEl("span", "law-accordion-title", title), createEl("span", "law-topic-tag", topic.label), state);
      const panel = createEl("div", "law-accordion-panel");
      panel.id = `${section.id}-panel`;
      Array.from(section.childNodes).forEach((node) => {
        if (!(node.nodeType === 1 && node.tagName === "H2")) panel.append(node);
      });
      enhanceTextDiagrams(panel);
      groupPanelContent(panel);
      const nav = createEl("div", "law-section-nav");
      const prev = createEl("a", "btn secondary", "הקודם");
      prev.href = index > 0 ? `#${sections[index - 1].id}` : "#main";
      const next = createEl("a", "btn secondary", "הבא");
      next.href = index < sections.length - 1 ? `#${sections[index + 1].id}` : "#exam-questions";
      nav.append(prev, next);
      panel.append(nav);
      details.addEventListener("toggle", () => {
        state.textContent = details.open ? "פתוח" : "סגור";
      });
      details.append(summary, panel);
      section.replaceWith(details);
    });
    return Array.from(document.querySelectorAll(".law-accordion"));
  }

  function buildDesktopToc(sections) {
    if (document.querySelector(".law-desktop-toc")) return;
    const toc = createEl("aside", "law-desktop-toc");
    toc.innerHTML = "<h2>פרקי הפקודה</h2>";
    const nav = createEl("nav");
    sections.forEach((section) => {
      const link = createEl("a", "", section.querySelector(".law-accordion-title")?.textContent || section.id);
      link.href = `#${section.id}`;
      link.dataset.topic = section.dataset.topic;
      nav.append(link);
    });
    toc.append(nav);
    const layout = createEl("div", "law-learning-layout");
    const content = createEl("div", "law-learning-content");
    sections[0].parentNode.insertBefore(layout, sections[0]);
    layout.append(toc, content);
    sections.forEach((section) => content.append(section));
  }

  function applyFilters() {
    const query = (document.getElementById("lawPageSearch")?.value || "").trim().toLowerCase();
    const activeFilter = document.querySelector(".law-filter.is-active")?.dataset.topic || "all";
    document.querySelectorAll(".law-accordion").forEach((section) => {
      const visible = (activeFilter === "all" || section.dataset.topic === activeFilter) && (!query || (section.dataset.search || "").toLowerCase().includes(query));
      section.hidden = !visible;
      if (visible && query) section.open = true;
    });
    document.querySelectorAll(".law-desktop-toc a").forEach((link) => {
      const target = document.querySelector(link.getAttribute("href"));
      link.hidden = Boolean(target?.hidden);
    });
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
    bar.style.inlineSize = `${Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100))}%`;
  }

  function init() {
    const main = document.querySelector(".work-safety-ordinance-page");
    if (!main) return;
    main.classList.add("labor-law-page");
    scheduleHeaderMeasurements();
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

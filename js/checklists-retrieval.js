(function () {
  "use strict";

  const source = window.CourseChecklistMap;
  const root = document.getElementById("checklistRetrievalApp");
  if (!source || !root) return;

  const state = { query: "", category: "all", risk: "all", workType: "all" };
  let resultsContainer;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function linkToKnowledge(file) {
    return "knowledge/" + file;
  }

  function hebrewRisk(risk) {
    return { critical: "קריטי", high: "גבוה", medium: "בינוני" }[risk] || risk;
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "he"));
  }

  function select(label, key, values) {
    const wrap = el("label", "field-filter");
    wrap.append(el("span", "", label));
    const control = el("select");
    control.dataset.filterKey = key;
    control.append(new Option("הכל", "all"));
    values.forEach((value) => control.append(new Option(key === "risk" ? hebrewRisk(value) : value, value)));
    control.value = state[key];
    wrap.append(control);
    return wrap;
  }

  function buildControls() {
    const controls = el("section", "checklist-retrieval-controls");
    controls.setAttribute("data-read-aloud-exclude", "true");
    const search = el("label", "field-search");
    search.append(el("span", "", "חיפוש מהיר"));
    const input = el("input");
    input.type = "search";
    input.placeholder = "עבודה בגובה, ארון חשמל, מנוף, רתמה, LOTO, דליקה...";
    input.value = state.query;
    input.dataset.filterKey = "query";
    search.append(input);
    controls.append(
      search,
      select("תחום", "category", source.categories),
      select("רמת סיכון", "risk", source.risks),
      select("סוג עבודה", "workType", unique(source.checklists.map((item) => item.workType)))
    );
    return controls;
  }

  function list(title, items, className) {
    const wrap = el("div", className || "quick-answer-list");
    wrap.append(el("h4", "", title));
    const ul = el("ul");
    (Array.isArray(items) ? items : [items]).filter(Boolean).forEach((item) => ul.append(el("li", "", item)));
    wrap.append(ul);
    return wrap;
  }

  function card(item) {
    const article = el("article", "operational-checklist-card");
    article.dataset.category = item.category;
    article.dataset.risk = item.riskLevel;
    const head = el("div", "operational-checklist-head");
    const title = el("div");
    title.append(el("p", "kicker", item.category + " · " + hebrewRisk(item.riskLevel)), el("h2", "", item.title));
    const tags = el("div", "checklist-tags");
    item.tags.forEach((tag) => tags.append(el("span", "", tag)));
    head.append(title, tags);

    const grid = el("div", "quick-answer-grid");
    grid.append(
      list("מה לבדוק", item.checklistItems),
      list("מה אסור", item.prohibited, "quick-answer-list quick-answer-warning"),
      list("PPE", item.ppe),
      list("Stop work", item.stopWork, "quick-answer-list quick-answer-stop"),
      list("Emergency action", item.emergency, "quick-answer-list quick-answer-emergency"),
      list("טעויות נפוצות", item.commonMistakes)
    );

    const footer = el("div", "checklist-related");
    item.regulations.forEach((reg) => footer.append(el("span", "regulation-chip", reg)));
    item.relatedKnowledge.forEach((href) => {
      const a = el("a", "btn secondary", "ידע");
      a.href = linkToKnowledge(href);
      footer.append(a);
    });
    item.relatedLessons.forEach((href) => {
      const a = el("a", "btn secondary", "שיעור");
      a.href = href;
      footer.append(a);
    });
    const glossary = el("a", "btn secondary", "מילון");
    glossary.href = "glossary.html";
    footer.append(glossary);

    article.append(head, grid, footer);
    return article;
  }

  function matches(item) {
    const query = state.query.trim().toLowerCase();
    const haystack = [item.title, item.category, item.workType, item.riskLevel, item.tags.join(" "), item.checklistItems.join(" "), item.ppe.join(" "), item.regulations.join(" ")].join(" ").toLowerCase();
    return (!query || haystack.includes(query))
      && (state.category === "all" || item.category === state.category)
      && (state.risk === "all" || item.riskLevel === state.risk)
      && (state.workType === "all" || item.workType === state.workType);
  }

  function renderResults(container) {
    container.replaceChildren();
    const matchesList = source.checklists.filter(matches);
    const summary = el("p", "checklist-result-count", matchesList.length + " checklists זמינים");
    container.append(summary);
    const grid = el("section", "operational-checklist-grid", "");
    matchesList.forEach((item) => grid.append(card(item)));
    container.append(grid);
  }

  function render() {
    root.replaceChildren();
    const controls = buildControls();
    const results = el("div", "checklist-results");
    resultsContainer = results;
    root.append(controls, results);
    renderResults(results);
  }

  root.addEventListener("input", (event) => {
    const key = event.target?.dataset?.filterKey;
    if (!key) return;
    state[key] = event.target.value;
    renderResults(resultsContainer);
  });

  root.addEventListener("change", (event) => {
    const key = event.target?.dataset?.filterKey;
    if (!key) return;
    state[key] = event.target.value;
    renderResults(resultsContainer);
  });

  render();
})();

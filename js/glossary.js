(function () {
  "use strict";

  const map = window.CourseKnowledgeMap;
  if (!map) return;

  const list = document.getElementById("glossaryList");
  const search = document.getElementById("glossarySearch");
  const filters = document.getElementById("glossaryFilters");
  const count = document.getElementById("glossaryCount");
  if (!list) return;

  let activeCategory = "all";

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function categories() {
    return Array.from(new Set(map.glossaryTerms.map((term) => term.category))).sort((a, b) => a.localeCompare(b, "he"));
  }

  function renderFilters() {
    if (!filters) return;
    filters.replaceChildren();
    const all = el("button", "glossary-filter is-active", "הכל");
    all.type = "button";
    all.dataset.category = "all";
    filters.append(all);
    categories().forEach((category) => {
      const button = el("button", "glossary-filter", category);
      button.type = "button";
      button.dataset.category = category;
      filters.append(button);
    });
  }

  function matches(term, query) {
    const haystack = [term.term, term.category, term.definition, term.practical].join(" ").toLowerCase();
    return haystack.includes(query);
  }

  function render() {
    const query = (search?.value || "").trim().toLowerCase();
    const terms = map.glossaryTerms.filter((term) => {
      const categoryOk = activeCategory === "all" || term.category === activeCategory;
      const queryOk = !query || matches(term, query);
      return categoryOk && queryOk;
    });

    list.replaceChildren();
    terms.forEach((term) => {
      const article = el("article", "term-card");
      article.dataset.category = term.category;
      const meta = el("p", "kicker", term.category + (term.exam ? " · למבחן" : ""));
      const title = el("h2", "", term.term);
      const definition = el("p", "", term.definition);
      const practical = el("p", "term-practical", term.practical);
      const link = el("a", "btn secondary", "לעמוד ידע");
      link.href = term.href;
      article.append(meta, title, definition, practical, link);
      list.append(article);
    });

    if (count) count.textContent = terms.length + " מונחים מוצגים";
  }

  filters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    filters.querySelectorAll(".glossary-filter").forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  });

  search?.addEventListener("input", render);
  renderFilters();
  render();
})();

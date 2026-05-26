(function () {
  "use strict";

  const map = window.CourseKnowledgeMap;
  if (!map) return;

  const pagePath = location.pathname.replace(/\\/g, "/");

  function isInKnowledgeFolder() {
    return /\/pages\/knowledge\//.test(pagePath);
  }

  function isLessonPage() {
    return /\/pages\/lesson-\d+\.html$/.test(pagePath);
  }

  function isHomePage() {
    return /\/index\.html$/.test(pagePath) || /\/$/.test(pagePath);
  }

  function currentLessonId() {
    const match = pagePath.match(/lesson-(\d+)\.html$/);
    return match ? "lesson-" + match[1] : "";
  }

  function currentKnowledgeId() {
    const match = pagePath.match(/\/knowledge\/([^/]+)\.html$/);
    return match ? match[1] : "";
  }

  function prefixFor(target) {
    if (/^https?:|^#|^mailto:/.test(target)) return target;
    if (isInKnowledgeFolder()) {
      if (target.startsWith("knowledge/")) return target.replace(/^knowledge\//, "");
      if (target.startsWith("pages/")) return "../../" + target.replace(/^pages\//, "pages/");
      return "../" + target;
    }
    if (isHomePage()) return target.startsWith("pages/") ? target : "pages/" + target;
    return target;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function card(title, text, href, actionLabel) {
    const article = el("article", "knowledge-link-card");
    const heading = el("h3", "", title);
    const body = el("p", "", text || "");
    const link = el("a", "btn secondary", actionLabel || "פתח");
    link.href = prefixFor(href);
    article.append(heading, body, link);
    return article;
  }

  function relatedSection(title, intro) {
    const section = el("section", "content-section knowledge-relation-section");
    section.setAttribute("data-read-aloud-exclude", "true");
    const titleWrap = el("div", "section-title");
    titleWrap.append(el("h2", "", title), el("p", "", intro));
    const grid = el("div", "knowledge-relation-grid");
    section.append(titleWrap, grid);
    return { section, grid };
  }

  function renderLessonLinks() {
    const lessonId = currentLessonId();
    const lesson = map.lessons[lessonId];
    const main = document.querySelector("main");
    if (!lesson || !main || document.querySelector("[data-knowledge-relation='lesson']")) return;

    const { section, grid } = relatedSection("ידע קשור לשיעור זה", "קישורים לעמודי ידע, רגולציה, תרגול וכלי שטח שמרחיבים את השיעור.");
    section.dataset.knowledgeRelation = "lesson";

    lesson.knowledge.forEach((id) => {
      const item = map.knowledgePages[id];
      if (item) grid.append(card(item.title, item.examFocus, item.href, "לעמוד הידע"));
    });

    if (lesson.practice) grid.append(card("שאלות תרגול רלוונטיות", "פתח תרגול ממוקד לפי השיעור.", lesson.practice, "לתרגול"));
    if (lesson.tools?.length) grid.append(card("כלי שטח רלוונטיים", lesson.regulations.join(" · "), lesson.tools[0], "לכלי שטח"));
    grid.append(card("מרכז הידע", "חזרה למפת הידע המלאה של הקורס.", "master-hub.html", "למרכז הידע"));

    const preferred = main.querySelector("[data-related-block='unified']") || main.querySelector(".notes-panel") || main.lastElementChild;
    if (preferred?.parentNode === main) main.insertBefore(section, preferred);
    else main.append(section);
  }

  function renderKnowledgeLinks() {
    const knowledgeId = currentKnowledgeId();
    const item = map.knowledgePages[knowledgeId];
    const main = document.querySelector("main");
    if (!item || !main || document.querySelector("[data-knowledge-relation='knowledge']")) return;

    const { section, grid } = relatedSection("שיעורים קשורים", "העמוד הזה מחובר לשיעורים, תרגול ומרכז הידע כדי לשמור רצף למידה.");
    section.dataset.knowledgeRelation = "knowledge";

    item.lessons.forEach((lessonId) => {
      const lesson = map.lessons[lessonId];
      if (lesson) grid.append(card(lesson.title, "שיעור שמרחיב וממקם את הנושא בתוך רצף הקורס.", lesson.href, "לשיעור"));
    });

    grid.append(card("תרגול בנושא", "פתח את אזור התרגול ובחר שאלות לפי נושא או שיעור.", "quizzes.html", "תרגול בנושא"));
    grid.append(card("חזרה למרכז הידע", "נווט לפי תחומי ידע, רגולציה ומבחן.", "master-hub.html", "מרכז הידע"));

    main.append(section);
  }

  function renderWhatsNew() {
    const main = document.querySelector("main");
    if (!main || document.querySelector("[data-knowledge-update='last-lesson']")) return;
    if (!isHomePage() && !/\/pages\/master-hub\.html$/.test(pagePath)) return;

    const update = map.lastLessonUpdate;
    const section = el("section", "content-section knowledge-update-section");
    section.dataset.knowledgeUpdate = "last-lesson";
    const titleWrap = el("div", "section-title");
    titleWrap.append(el("h2", "", "מה חדש מהשיעור האחרון"), el("p", "", update.placeholder));
    const cardWrap = el("div", "knowledge-update-card");
    cardWrap.append(el("p", "kicker", "עודכן " + update.updatedAt), el("h3", "", update.title), el("p", "", update.summary));
    const links = el("div", "related-links");
    update.links.forEach((link) => {
      const a = el("a", "btn secondary", link.label);
      a.href = isHomePage() ? link.href : link.href.replace(/^pages\//, "");
      links.append(a);
    });
    cardWrap.append(links);
    section.append(titleWrap, cardWrap);

    const afterHero = main.querySelector(".page-hero")?.nextSibling;
    main.insertBefore(section, afterHero || main.firstChild);
  }

  function renderMasterHubEnhancements() {
    const main = document.querySelector("main");
    if (!main || !/\/pages\/master-hub\.html$/.test(pagePath) || document.querySelector("[data-knowledge-hub-routes]")) return;
    const section = el("section", "content-section master-hub-section knowledge-hub-routes");
    section.dataset.knowledgeHubRoutes = "true";
    const titleWrap = el("div", "section-title");
    titleWrap.append(el("h2", "", "מסלולי למידה מחוברים"), el("p", "", "בחר מסלול לפי שיעור, תחום ידע או הכנה למבחן."));
    const grid = el("div", "master-hub-grid");
    grid.append(
      card("מסלול לפי שיעורים", "מתחיל בשיעור ואז פותח ידע, רגולציה ותרגול רלוונטיים.", "syllabus.html", "פתח שיעורים"),
      card("מסלול לפי תחומי ידע", "חשמל, גהות, בנייה, חומ״ס, הרמה, LOTO ו-ISO.", "master-hub.html#knowledgeNavigationTitle", "פתח תחומי ידע"),
      card("מסלול לפי מבחן", "מונחים, מלכודות, נקודות למבחן ושאלות תרגול.", "glossary.html", "פתח מילון")
    );
    section.append(titleWrap, grid);
    main.append(section);
  }

  function init() {
    renderLessonLinks();
    renderKnowledgeLinks();
    renderWhatsNew();
    renderMasterHubEnhancements();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

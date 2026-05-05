// Modern UI bootstrap.
// Loaded synchronously in <head> so <html data-ui-mode="modern"> is set before paint.
// UI switching was intentionally removed.
(function () {
  const MODERN_MODE = "modern";

  if (document.documentElement) {
    document.documentElement.setAttribute("data-ui-mode", MODERN_MODE);
    document.documentElement.classList.add("js-ready");
  }

  function applyMode() {
    document.documentElement.setAttribute("data-ui-mode", MODERN_MODE);
    if (!document.body) return;
    document.body.classList.add("ui-mode-modern");
    document.body.dataset.uiMode = MODERN_MODE;
  }

  const LESSON_MODERN = {
    "lesson-04": ["4", "סיכונים תפעוליים", "מבט תפעולי על שינוע, מכונות, מעברים, אחסון וסביבת עבודה.", ["תהליך תפעולי", "שינוע", "מלגזות", "ממשק אדם-מכונה", "סדר וניקיון", "החלקה ומעידה"], ["תצפית בשטח", "זיהוי חשופים", "הפרדת תנועה", "בקרה ומעקב"]],
    "lesson-05": ["5", "בטיחות באתרי בנייה", "ניהול סיכונים באתר דינמי: גובה, פיגומים, חפירות, עגורנים וקבלנים.", ["עבודה בגובה", "פיגומים", "מנהל עבודה", "עגורנים", "חפירות", "אתר בנייה"], ["תכנון העבודה", "בדיקת אמצעים", "תיאום קבלנים", "פיקוח ותיעוד"]],
    "lesson-06": ["6", "חשמל והגנה מחשמל", "זיהוי סיכוני חשמל, הגנה מפני התחשמלות, עבודה מורשית ובידוד אנרגיה.", ["התחשמלות", "הארקה", "מפסק מגן", "לוח חשמל", "נעילה ותיוג", "קשת חשמלית"], ["זיהוי מקור אנרגיה", "ניתוק", "נעילה ותיוג", "בדיקת העדר מתח"]],
    "lesson-07": ["7", "סיכונים כימיים וסיכונים כלליים", "עבודה עם חומרים, גיליון בטיחות, אחסון, חשיפה, מנדפים ותגובה לאירוע.", ["גיליון בטיחות", "חומרים מסוכנים", "מנדף", "אחסון תואם", "חשיפה", "ציוד מגן"], ["זיהוי חומר", "הרחקת חשופים", "בדיקת גיליון בטיחות", "בקרה ודיווח"]],
    "lesson-08": ["8", "גהות תעסוקתית", "ניהול חשיפות, ניטור, רעש, בדיקות רפואיות ובריאות העובד.", ["ניטור סביבתי", "ניטור תעסוקתי", "בדיקות רפואיות", "רעש מזיק", "חשיפה", "מחלת מקצוע"], ["איתור גורם", "מדידה", "השוואה לערכים", "בקרה ומעקב רפואי"]],
    "lesson-09": ["9", "ניהול בטיחות והגורם האנושי", "תרבות בטיחות, התנהגות, עומס, הדרכה, כשירות וקבלת החלטות.", ["גורם אנושי", "תרבות בטיחות", "כמעט תאונה", "הדרכה", "כשירות", "עומס"], ["זיהוי דפוס", "הבנת סיבה", "שינוי תנאים", "למידה חוזרת"]],
    "lesson-10": ["10", "ניהול בטיחות בתעסוקה", "שגרות ניהול, תוכניות עבודה, מדדים, ועדות, אחריות ושיפור מתמיד.", ["תוכנית בטיחות", "ועדת בטיחות", "נאמני בטיחות", "מדדים", "תחקיר", "שיפור מתמיד"], ["תכנון", "ביצוע", "בדיקה", "שיפור"]],
    "lesson-11": ["11", "היערכות למצבי חירום", "תיק מפעל, צוותי חירום, פינוי, כיבוי אש, תרגילים ותחקיר.", ["תוכנית חירום", "תיק מפעל", "צוות חירום", "פינוי", "כיבוי אש", "תרגיל"], ["זיהוי אירוע", "הפעלת צוותים", "פינוי ובקרה", "תחקיר לקחים"]],
    "lesson-12": ["12", "תקציר הרצאות וחזרה למבחן", "חיבור בין מושגים, חוקים, תרחישים ושאלות יישום לקראת מבחן.", ["חזרה למבחן", "תרחיש", "חוק ותקנה", "בקרה", "תיעוד", "אחריות"], ["קריאת תמצית", "תרגול לפי שיעור", "תיקון טעויות", "סימולציה"]]
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function infoCard(kind, icon, title, text) {
    const card = el("aside", "info-card");
    card.dataset.cardKind = kind;
    const iconNode = el("div", "info-icon", icon);
    iconNode.setAttribute("aria-hidden", "true");
    const body = el("div", "info-body");
    body.append(el("p", "info-title", title), el("p", "", text));
    card.append(iconNode, body);
    return card;
  }

  function buildHero(number, title, intro, lessonId) {
    const hero = el("section", "lesson-hero-modern");
    hero.append(el("p", "kicker", "מפגש " + number), el("h1", "", title), el("p", "", intro));
    const meta = el("div", "lesson-hero-meta");
    ["למידה ממוקדת", "דגשים למבחן", "יישום בשטח"].forEach((item) => meta.append(el("span", "", item)));
    hero.append(meta);
    const heroActions = el("div", "lesson-hero-actions");
    const heroPractice = el("a", "btn modern-primary-cta", "מעבר לתרגול");
    heroPractice.href = "exam-questions.html?lesson=" + encodeURIComponent(lessonId);
    heroActions.append(heroPractice);
    hero.append(heroActions);
    return hero;
  }

  function buildNowSteps(className) {
    const now = el("section", className || "modern-now-steps");
    now.append(el("h2", "", "מה עושים עכשיו?"));
    const nowList = el("ol");
    ["קרא את הסיכום", "עבור על כרטיסי המושגים", "תרגל את השיעור"].forEach((step) => nowList.append(el("li", "", step)));
    now.append(nowList);
    return now;
  }

  function enhanceLessonModernUi() {
    const lessonId = document.querySelector("[data-lesson-id]")?.dataset.lessonId || "";
    const data = LESSON_MODERN[lessonId];
    const article = document.querySelector(".lesson-content");
    if (!data || !article || article.querySelector("[data-modern-generated='lesson']")) return;

    document.body.classList.add("has-modern-lesson-overlay");
    const [number, title, intro, concepts, steps] = data;
    const wrap = el("div", "ui-modern-only modern-lesson-overlay");
    wrap.dataset.modernGenerated = "lesson";

    const progress = el("div", "lesson-scroll-progress");
    progress.dataset.scrollProgress = "";
    progress.setAttribute("aria-hidden", "true");
    progress.append(el("span"));

    const top = el("button", "back-to-top", "↑");
    top.type = "button";
    top.dataset.backToTop = "";
    top.setAttribute("aria-label", "חזור למעלה");

    const goals = el("section", "lesson-goals");
    goals.append(el("h2", "", "מה נלמד בשיעור"));
    const goalList = el("ul");
    const sidebarGoals = Array.from(document.querySelectorAll(".lesson-sidebar li")).map((li) => li.textContent.trim()).filter(Boolean).slice(0, 4);
    (sidebarGoals.length ? sidebarGoals : concepts.slice(0, 4).map((concept) => "להבין וליישם: " + concept)).forEach((goal) => goalList.append(el("li", "", goal)));
    goals.append(goalList);

    const nav = el("nav", "lesson-mini-nav");
    nav.setAttribute("aria-label", "ניווט בתוך השיעור");
    const navHost = el("div");
    navHost.dataset.miniNav = "";
    nav.append(navHost);

    const conceptSection = el("section", "lesson-section modern-topic-panel");
    conceptSection.append(el("h2", "", "מושגים מרכזיים"));
    const conceptGrid = el("div", "concept-grid");
    concepts.forEach((concept, index) => {
      const card = el("article", "concept-card");
      card.dataset.conceptType = ["law", "risk", "control", "role"][index % 4];
      const h = el("h3");
      h.append(el("span", "concept-icon", ["דין", "סיכון", "בקרה", "תפקיד"][index % 4]), document.createTextNode(concept));
      const desc = el("p");
      desc.append(document.createTextNode("מונח מרכזי לזיהוי "), el("strong", "", "בתרחישים"), document.createTextNode(", שאלות ויישום בשטח."));
      card.append(h, desc);
      conceptGrid.append(card);
    });
    conceptSection.append(conceptGrid);

    const visual = el("section", "lesson-section modern-topic-panel");
    visual.append(el("h2", "", "תהליך עבודה מהיר"));
    const flow = el("ol", "flow-steps modern-flow-steps");
    steps.forEach((step) => flow.append(el("li", "", step)));
    visual.append(flow);

    const info = el("section", "modern-info-grid");
    info.append(
      infoCard("law", "דין", "חוק מעל הכל", "בכל דרישה מחייבת יש לאמת מול הדין, התקנות והגורם המוסמך."),
      infoCard("exam", "מבחן", "דגש למבחן", "חפש בתרחיש את מקור הסיכון, החשופים, הבקרה והתיעוד הנדרש."),
      infoCard("mistake", "שגיאה", "טעות נפוצה", "לא להסתפק בהדרכה או שילוט כאשר נדרשת בקרה חזקה יותר."),
      infoCard("field", "בדיקה", "מה ממונה בטיחות צריך לבדוק", "האם קיימת בקרה מתאימה, אחריות לביצוע ומעקב מתועד?")
    );

    const cta = el("aside", "check-yourself-cta");
    const ctaText = el("div", "cy-text");
    ctaText.append(el("strong", "", "עכשיו תבדוק את עצמך"), el("p", "", "בדוק הבנה עם שאלות שמחוברות לנושא המפגש."));
    const link = el("a", "btn", "עבור לתרגול שיעור זה");
    link.href = "exam-questions.html?lesson=" + encodeURIComponent(lessonId);
    cta.append(ctaText, link);

    wrap.append(progress, top, buildHero(number, title, intro, lessonId), buildNowSteps(), goals, nav, conceptSection, visual, info, cta);
    article.prepend(wrap);
  }

  function polishNativeLessonModernUi() {
    const lessonId = document.querySelector("[data-lesson-id]")?.dataset.lessonId || "";
    const article = document.querySelector(".lesson-content");
    const hero = article?.querySelector(".ui-modern-only .lesson-hero-modern");
    if (!lessonId || !article || !hero) return;

    document.body.classList.add("has-modern-lesson-overlay");

    if (!hero.querySelector(".lesson-hero-actions")) {
      const heroActions = el("div", "lesson-hero-actions");
      const heroPractice = el("a", "btn modern-primary-cta", "מעבר לתרגול");
      heroPractice.href = "exam-questions.html?lesson=" + encodeURIComponent(lessonId);
      heroActions.append(heroPractice);
      hero.append(heroActions);
    }

    if (!article.querySelector(".modern-now-steps")) {
      hero.after(buildNowSteps("ui-modern-only modern-now-steps"));
    }
  }

  function enhanceSyllabusModernUi() {
    if (!/syllabus\.html$/.test(location.pathname)) return;
    const main = document.querySelector(".site-main");
    const table = main?.querySelector(".data-table");
    if (!main || !table || main.querySelector("[data-modern-generated='syllabus']")) return;

    const rows = Array.from(table.querySelectorAll("tbody tr"));
    const shell = el("section", "ui-modern-only modern-syllabus-shell");
    shell.dataset.modernGenerated = "syllabus";

    const stats = el("div", "modern-stat-grid");
    [["12", "שיעורים"], [String(rows.length), "מפגשים בתוכנית"], ["5+", "תחומי ידע"], ["תרגול", "קישור מהיר"]].forEach(([value, label]) => {
      const card = el("article", "modern-stat-card");
      card.append(el("strong", "", value), el("span", "", label));
      stats.append(card);
    });

    const grid = el("div", "modern-lesson-card-grid");
    rows.forEach((row, index) => {
      const cells = row.querySelectorAll("td");
      const sourceLink = cells[1]?.querySelector("a");
      const card = el("article", "modern-lesson-card");
      const badges = ["חובה", "חשוב", "חדש"];
      const badge = el("span", "modern-lesson-badge", badges[index % badges.length]);
      card.append(el("span", "modern-lesson-num", cells[0]?.textContent.trim() || ""));
      const h = el("h2");
      const a = el("a", "", sourceLink?.textContent.trim() || cells[1]?.textContent.trim() || "");
      a.href = sourceLink?.getAttribute("href") || "#";
      h.append(a);
      card.append(badge, h, el("p", "", cells[2]?.textContent.trim() || ""), el("small", "", cells[4]?.textContent.trim() || ""));
      grid.append(card);
    });

    const cta = el("aside", "check-yourself-cta");
    const ctaText = el("div", "cy-text");
    ctaText.append(el("strong", "", "מוכן לתרגל?"), el("p", "", "בחר שיעור או עבור ישירות למרכז התרגול והמבחנים."));
    const qLink = el("a", "btn", "פתח תרגול ומבחנים");
    qLink.href = "quizzes.html";
    cta.append(ctaText, qLink);

    shell.append(stats, grid, cta);
    const tableSection = table.closest(".content-section");
    tableSection?.before(shell);
    tableSection?.classList.add("modern-syllabus-table-fallback");
    tableSection?.setAttribute("aria-hidden", "true");
  }

  function enhanceModernContentPages() {
    const page = document.body?.dataset.pageTitle || "";
    if (!page || document.querySelector("[data-modern-generated='page-hub']")) return;
    if (/lesson-\d+\.html$|syllabus\.html$|login\.html$|privacy\.html$|terms\.html$|disclaimer\.html$/.test(location.pathname)) return;
    const main = document.querySelector(".site-main");
    const hero = main?.querySelector(".page-hero");
    if (!main || !hero) return;
    const titles = Array.from(main.querySelectorAll("h2")).map((h) => h.textContent.trim()).filter(Boolean).slice(0, 4);
    if (!titles.length) return;

    const hub = el("section", "ui-modern-only modern-page-hub");
    hub.dataset.modernGenerated = "page-hub";
    hub.append(el("h2", "", "מה יש בעמוד"));
    const grid = el("div", "modern-info-grid");
    titles.forEach((title, idx) => grid.append(infoCard(["action", "field", "exam", "law"][idx % 4], ["נושא", "בדיקה", "תרגול", "דין"][idx % 4], title, "פתח את החלק הרלוונטי והמשך לפי הצורך המקצועי.")));
    hub.append(grid);
    hero.after(hub);
  }

  function enhanceModernUi() {
    enhanceLessonModernUi();
    polishNativeLessonModernUi();
    enhanceSyllabusModernUi();
    enhanceModernContentPages();
  }

  // Overflow diagnostic only logs and never modifies layout.
  function diagnoseHorizontalOverflow() {
    if (document.documentElement.dataset.uiMode !== "modern") return;
    const dw = document.documentElement.scrollWidth;
    const vw = document.documentElement.clientWidth;
    if (dw <= vw + 1) {
      console.info("[ui-mode] no horizontal overflow (scrollWidth=" + dw + ", clientWidth=" + vw + ")");
      return;
    }
    console.warn("[ui-mode] horizontal overflow detected: scrollWidth=" + dw + ", clientWidth=" + vw + " - searching culprit...");
    const all = document.body.querySelectorAll("*");
    const culprits = [];
    all.forEach((node) => {
      const r = node.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) {
        culprits.push({ el: node, right: Math.round(r.right), left: Math.round(r.left), width: Math.round(r.width), tag: node.tagName.toLowerCase(), cls: node.className && typeof node.className === "string" ? node.className.slice(0, 80) : "" });
      }
    });
    culprits.sort((a, b) => (b.right - vw) - (a.right - vw)).slice(0, 8).forEach((c) => {
      console.warn("  -> " + c.tag + (c.cls ? "." + c.cls.replace(/\s+/g, ".") : "") + " | left=" + c.left + " right=" + c.right + " width=" + c.width, c.el);
    });
    console.info("[ui-mode] tip: inspect elements with getBoundingClientRect() if overflow appears.");
  }

  function init() {
    applyMode();
    enhanceModernUi();
    setTimeout(diagnoseHorizontalOverflow, 600);
    window.addEventListener("resize", () => setTimeout(diagnoseHorizontalOverflow, 200));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

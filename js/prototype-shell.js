/* Prototype-first shell adoption for selected legacy pages.
   The shell wraps existing content and preserves page logic/auth hooks. */
(function () {
  "use strict";

  if (!document.body || !document.body.classList.contains("prototype-shell")) return;
  if (document.body.dataset.prototypeShellReady === "true") return;

  const body = document.body;
  const html = document.documentElement;
  const inPages = /\/pages\//.test(location.pathname.replace(/\\/g, "/"));
  const rootPrefix = inPages ? "../" : "./";
  const pagePath = location.pathname.replace(/\\/g, "/");
  const pageKind = resolvePageKind(pagePath);
  const pageTitle = body.dataset.pageTitle || document.title.split("|")[0].trim() || "קורס ממונה בטיחות";
  let lastFocusBeforeDrawer = null;
  body.dataset.protoPage = pageKind;
  if (readDebugFlag()) body.classList.add("proto-debug-enabled");

  const navGroups = [
    {
      label: "למידה",
      items: [
        { label: "דף הבית", href: rootPrefix + "index.html", icon: "⌂", match: /\/index\.html$|\/$/ },
        { label: "מרכז הידע", href: rootPrefix + "pages/master-hub.html", icon: "◎", match: /\/pages\/master-hub\.html$/ },
        { label: "תוכנית לימוד", href: rootPrefix + "pages/syllabus.html", icon: "☰", match: /\/pages\/syllabus\.html$/ },
        { label: "תרגול ומבחנים", href: rootPrefix + "pages/quizzes.html", icon: "✓", match: /\/pages\/quizzes\.html$/ },
        { label: "ההתקדמות שלי", href: rootPrefix + "pages/my-progress.html", icon: "◌", match: /\/pages\/my-progress\.html$/ },
      ],
    },
    {
      label: "מקורות וכלים",
      items: [
        { label: "כלי שטח", href: rootPrefix + "pages/field-tools.html", icon: "▣", match: /\/pages\/field-tools\.html$/ },
        { label: "חוקים ותקנים", href: rootPrefix + "pages/laws.html", icon: "§", match: /\/pages\/laws\.html$|\/pages\/standards\.html$/ },
        { label: "שאלות למבחן", href: rootPrefix + "pages/exam-questions.html", icon: "?", match: /\/pages\/exam-questions\.html$/ },
      ],
    },
  ];

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function resolvePageKind(path) {
    if (/\/pages\/master-hub\.html$/.test(path)) return "master-hub";
    if (/\/pages\/syllabus\.html$/.test(path)) return "syllabus";
    if (/\/pages\/quizzes\.html$/.test(path)) return "quizzes";
    if (/\/pages\/my-progress\.html$/.test(path)) return "my-progress";
    if (/\/pages\/field-tools\.html$/.test(path)) return "field-tools";
    return "home";
  }

  function readDebugFlag() {
    try {
      const flags = JSON.parse(window.localStorage.getItem("ehsDynamicContentFlags") || "{}");
      return flags && flags.debug === true;
    } catch (error) {
      return false;
    }
  }

  function createSidebar() {
    const sidebar = el("aside", "proto-sidebar");
    sidebar.setAttribute("aria-label", "ניווט ראשי");

    const brandRow = el("div", "proto-brand-row");
    const brand = el("a", "proto-brand");
    brand.href = rootPrefix + "index.html";
    brand.innerHTML = [
      '<span class="proto-brand-mark" aria-hidden="true">EHS</span>',
      '<span class="proto-brand-text"><strong>קורס ממונה בטיחות</strong><small>Learning workspace</small></span>',
    ].join("");
    const closeButton = el("button", "proto-drawer-close", "×");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "סגור תפריט");
    closeButton.addEventListener("click", closeDrawer);
    brandRow.append(brand, closeButton);
    sidebar.append(brandRow);

    const nav = el("nav", "proto-sidebar-nav");
    nav.setAttribute("aria-label", "ניווט קורס");
    navGroups.forEach((group) => {
      nav.append(el("div", "proto-nav-section", group.label));
      group.items.forEach((item) => {
        const link = el("a", "proto-nav-item");
        link.href = item.href;
        link.innerHTML = '<span class="proto-nav-icon" aria-hidden="true">' + item.icon + '</span><span>' + item.label + "</span>";
        if (item.match.test(pagePath)) {
          link.classList.add("is-active");
          link.setAttribute("aria-current", "page");
        }
        link.addEventListener("click", closeDrawer);
        nav.append(link);
      });
    });
    sidebar.append(nav);

    const footer = el("div", "proto-sidebar-footer");
    const note = el("small", "proto-shell-note", "מעטפת LMS חדשה. התוכן והלוגיקה נשארים מהאתר הקיים.");
    footer.append(note);
    sidebar.append(footer);
    return sidebar;
  }

  function createTopbar() {
    const topbar = el("header", "proto-topbar");
    topbar.setAttribute("aria-label", "סרגל עבודה");

    const menu = el("button", "proto-menu-btn", "☰");
    menu.type = "button";
    menu.setAttribute("aria-label", "פתח תפריט");
    menu.setAttribute("aria-controls", "prototypeShellSidebar");
    menu.setAttribute("aria-expanded", "false");
    menu.addEventListener("click", openDrawer);

    const label = el("div", "proto-page-label");
    label.innerHTML = "<strong>" + pageTitle + "</strong><small>קורס ממונה בטיחות</small>";

    const actionsSlot = el("div", "proto-topbar-actions");
    const legacyActions = document.querySelector(".site-header .header-actions, .header-actions");
    if (legacyActions) {
      actionsSlot.append(legacyActions);
    }

    topbar.append(menu, label, actionsSlot);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    });
    return topbar;
  }

  function createRailCard(title, items, action) {
    const card = el("section", "proto-rail-card");
    card.append(el("h2", "", title));
    const list = el("ul", "proto-rail-list");
    items.forEach((item) => {
      const row = el("li");
      const label = typeof item === "string" ? item : item.label;
      const detail = typeof item === "string" ? "" : item.detail || "";
      row.append(el("strong", "", label));
      if (detail) row.append(el("small", "", detail));
      list.append(row);
    });
    card.append(list);
    if (action) {
      const link = el("a", "proto-rail-action", action.label);
      link.href = action.href;
      card.append(link);
    }
    return card;
  }

  function createContextRail() {
    const rail = el("aside", "proto-context-rail");
    rail.setAttribute("aria-label", "הקשר לימודי");

    const introByPage = {
      home: ["היום בקורס", "מרכז למידה", "המשך לשיעור הבא, תרגל שאלות קצרות או פתח כלי שטח מהירים."],
      "master-hub": ["מרכז ידע", "כל הנושאים במקום אחד", "קפיצה מהירה לשיעורים, תרגול, חוקים, דגשי מבחן ונהלי חירום."],
      syllabus: ["תכנון", "מפת הקורס", "עברו בין יסודות, ניהול, סיכונים וחירום בצורה מסודרת."],
      quizzes: ["תרגול", "כוונון אישי", "תרגלו נושא אחד בכל פעם וחזרו לדשבורד כדי לבדוק מגמות."],
      "my-progress": ["התקדמות", "התמונה האישית", "הדשבורד מציג מגמות למידה מהחשבון המחובר."],
      "field-tools": ["כלי שטח", "קיצורי פעולה", "גישה מהירה לחוקים, תקנים, בדיקות תקופתיות ורשימות בקרה."],
    };
    const intro = introByPage[pageKind] || introByPage.home;
    const header = el("div", "proto-rail-header");
    header.append(el("p", "kicker", intro[0]), el("h2", "", intro[1]), el("p", "", intro[2]));
    rail.append(header);

    const cardsByPage = {
      home: [
        createRailCard("מה כדאי לעשות עכשיו", [
          { label: "המשך למידה", detail: "חזור לשיעור האחרון או פתח את תוכנית הלימוד." },
          { label: "תרגול מהיר", detail: "שאלות קצרות לחיזוק זיכרון." },
          { label: "כלי שטח", detail: "חוקים, תקנים וצ׳קליסטים." },
        ], { label: "פתח דשבורד", href: rootPrefix + "pages/my-progress.html" }),
      ],
      "master-hub": [
        createRailCard("קיצורי ידע", [
          { label: "שיעורים", detail: "מעבר לתוכנית הלימוד ולסיכומי שיעורים." },
          { label: "תרגול ומבחנים", detail: "שאלות קצרות וסימולציה לפי נושא." },
          { label: "חוקים וכלי שטח", detail: "מקורות, תקנים ונהלי עבודה בשטח." },
        ], { label: "פתח תרגול", href: rootPrefix + "pages/quizzes.html" }),
      ],
      syllabus: [
        createRailCard("מסלול מומלץ", [
          { label: "יסודות ותפקידים", detail: "מפגשים 1-3" },
          { label: "סיכונים ובקרות", detail: "מפגשים 4-8" },
          { label: "ניהול וחירום", detail: "מפגשים 9-12" },
        ], { label: "תרגול לפי שיעור", href: rootPrefix + "pages/quizzes.html" }),
      ],
      quizzes: [
        createRailCard("תרגול מומלץ", [
          { label: "התחל בקל", detail: "הגדרות, מושגים וחובות בסיסיות." },
          { label: "עבור לבינוני", detail: "הבחנה בין תפקידים ותנאים." },
          { label: "שמור רצף", detail: "תרגול קצר עדיף על דחייה." },
        ], { label: "ההתקדמות שלי", href: rootPrefix + "pages/my-progress.html" }),
      ],
      "my-progress": [
        createRailCard("איך לקרוא את הדשבורד", [
          { label: "נושאים לחיזוק", detail: "התחל מהתרגול שהמערכת מסמנת." },
          { label: "רמת קושי", detail: "עלה רמה אחרי דיוק יציב." },
          { label: "פעילות אחרונה", detail: "משקפת שאלות שתורגלו בפועל." },
        ], { label: "תרגל עכשיו", href: rootPrefix + "pages/quizzes.html" }),
      ],
      "field-tools": [
        createRailCard("קיצורי שטח", [
          { label: "צווים וחובות", detail: "פיקוח, שיפור, הדרכה ותיעוד." },
          { label: "בדיקות תקופתיות", detail: "ציוד הרמה, דודים, מכונות ומערכות." },
          { label: "לפני סיור", detail: "מטרה, סיכון, בקרה, תיעוד." },
        ], { label: "שאלות למבחן", href: rootPrefix + "pages/exam-questions.html" }),
      ],
    };
    (cardsByPage[pageKind] || cardsByPage.home).forEach((card) => rail.append(card));
    return rail;
  }

  function polishLearnerDashboard() {
    if (pageKind !== "my-progress") return;
    const labelMap = {
      totalViewed: "נצפו שאלות",
      totalAnswered: "נענו שאלות",
      totalCorrect: "תשובות נכונות",
      accuracyPercent: "דיוק כללי",
      topic: "נושא",
      lessonId: "שיעור",
      source: "מקור תרגול",
      lastSeenAt: "נצפה לאחרונה",
      answeredAt: "נענה לאחרונה",
    };
    const relabel = () => {
      document.querySelectorAll(".learner-dashboard dt").forEach((term) => {
        const mapped = labelMap[term.textContent.trim()];
        if (mapped) term.textContent = mapped;
      });
    };
    relabel();
    const dashboard = document.querySelector(".learner-dashboard");
    if (dashboard) {
      new MutationObserver(relabel).observe(dashboard, { childList: true, subtree: true, characterData: true });
    }
  }

  function updateDrawerState(isOpen) {
    body.classList.toggle("proto-drawer-open", isOpen);
    document.querySelectorAll(".proto-menu-btn").forEach((button) => {
      button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    const overlay = document.querySelector(".proto-drawer-overlay");
    if (overlay) overlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }

  function openDrawer() {
    lastFocusBeforeDrawer = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    updateDrawerState(true);
    const firstLink = document.querySelector(".proto-sidebar .proto-nav-item");
    window.setTimeout(() => firstLink?.focus(), 0);
  }

  function closeDrawer() {
    const wasOpen = body.classList.contains("proto-drawer-open");
    updateDrawerState(false);
    if (wasOpen && lastFocusBeforeDrawer && document.contains(lastFocusBeforeDrawer)) {
      lastFocusBeforeDrawer.focus();
    }
  }

  function buildShell() {
    const overlay = el("div", "proto-drawer-overlay");
    overlay.setAttribute("aria-hidden", "true");
    overlay.addEventListener("click", closeDrawer);

    const sidebar = createSidebar();
    sidebar.id = "prototypeShellSidebar";
    const contextRail = createContextRail();
    const appShell = el("div", "proto-app-shell");
    const topbar = createTopbar();

    const movable = Array.from(body.children).filter((child) => {
      return child !== overlay && child !== sidebar && child !== contextRail && child !== appShell && !child.matches("script, link, style");
    });

    body.prepend(overlay, sidebar, contextRail, appShell);
    appShell.append(topbar);
    movable.forEach((child) => appShell.append(child));
    body.dataset.prototypeShellReady = "true";
    polishLearnerDashboard();
  }

  buildShell();
})();

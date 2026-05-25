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
  const pageTitle = body.dataset.pageTitle || document.title.split("|")[0].trim() || "קורס ממונה בטיחות";
  let lastFocusBeforeDrawer = null;

  const navGroups = [
    {
      label: "למידה",
      items: [
        { label: "דף הבית", href: rootPrefix + "index.html", icon: "⌂", match: /\/index\.html$|\/$/ },
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

    const search = el("div", "proto-search");
    const input = el("input");
    input.type = "search";
    input.placeholder = "חפש בקורס... Ctrl+K";
    input.setAttribute("aria-label", "חיפוש בקורס");
    input.addEventListener("input", () => {
      const legacySearch = document.querySelector("[data-topbar-search]");
      if (legacySearch && legacySearch !== input) {
        legacySearch.value = input.value;
        legacySearch.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    search.append(input);

    const actionsSlot = el("div", "proto-topbar-actions");
    const legacyActions = document.querySelector(".site-header .header-actions, .header-actions");
    if (legacyActions) {
      actionsSlot.append(legacyActions);
    }

    topbar.append(menu, label, search, actionsSlot);
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.focus();
      }
      if (event.key === "Escape") {
        closeDrawer();
      }
    });
    return topbar;
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
    const appShell = el("div", "proto-app-shell");
    const topbar = createTopbar();

    const movable = Array.from(body.children).filter((child) => {
      return child !== overlay && child !== sidebar && child !== appShell && !child.matches("script, link, style");
    });

    body.prepend(overlay, sidebar, appShell);
    appShell.append(topbar);
    movable.forEach((child) => appShell.append(child));
    body.dataset.prototypeShellReady = "true";
  }

  buildShell();
})();

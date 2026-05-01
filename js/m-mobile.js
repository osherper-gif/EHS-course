/* Mobile First P0: bottom navigation, bottom sheet and tap-target helpers. */
(function () {
  const MOBILE_QUERY = "(max-width: 1023px)";
  let activeProfile = null;
  let lastFocus = null;

  function isLoginPage() { return /(^|\/)login\.html$/.test(location.pathname); }
  function isProtectedPage() { return document.body.classList.contains("auth-protected") && !isLoginPage(); }
  function basePath() { return location.pathname.includes("/pages/") ? "../" : "./"; }
  function href(path) { return basePath() + path; }
  function isAdmin(profile) {
    return Boolean(window.CourseAuth?.isAdminProfile?.(profile)) || String(profile?.email || "").toLowerCase() === "osherper@gmail.com";
  }

  function navItem(label, icon, target, activeTest) {
    const item = document.createElement("a");
    item.className = "m-bottom-nav__item";
    item.href = target;
    item.setAttribute("aria-label", label);
    if (activeTest()) item.classList.add("is-active");
    const iconEl = document.createElement("span");
    iconEl.className = "m-bottom-nav__icon";
    iconEl.textContent = icon;
    const text = document.createElement("span");
    text.className = "m-bottom-nav__label";
    text.textContent = label;
    item.append(iconEl, text);
    return item;
  }

  function sheetLink(label, target) {
    const link = document.createElement("a");
    link.href = target;
    link.textContent = label;
    link.className = "m-sheet__link";
    return link;
  }

  function sheetButton(label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "m-sheet__link";
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function ensureSheet(profile) {
    let sheet = document.getElementById("mMoreSheet");
    if (sheet) return sheet;
    sheet = document.createElement("div");
    sheet.id = "mMoreSheet";
    sheet.className = "m-sheet";
    sheet.hidden = true;
    sheet.innerHTML = '<div class="m-sheet__backdrop" data-m-sheet-close></div>' +
      '<section class="m-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="mMoreSheetTitle" tabindex="-1">' +
      '<div class="m-sheet__head"><h2 id="mMoreSheetTitle">עוד באתר</h2>' +
      '<button type="button" class="m-sheet__close" data-m-sheet-close aria-label="סגירה">×</button></div>' +
      '<div class="m-sheet__body" id="mMoreSheetBody"></div></section>';
    document.body.append(sheet);
    sheet.addEventListener("click", (event) => { if (event.target.closest("[data-m-sheet-close]")) closeSheet(); });
    sheet.addEventListener("keydown", trapFocus);
    renderSheetLinks(profile);
    return sheet;
  }

  function renderSheetLinks(profile) {
    const body = document.getElementById("mMoreSheetBody");
    if (!body) return;
    body.replaceChildren(
      sheetLink("חוקים, תקנים וכלי שטח", href("pages/field-tools.html")),
      sheetLink("עוזר AI", href("pages/ai-assistant.html")),
      sheetButton("דווח תקלה", () => {
        closeSheet();
        if (window.CourseFeedback?.open) window.CourseFeedback.open();
        else document.getElementById("feedbackButton")?.click();
      })
    );
    if (isAdmin(profile)) {
      body.append(sheetLink("ניהול משתמשים", href("admin.html")), sheetLink("ניהול גרסאות אתר", href("pages/version-management.html")));
    }
    body.append(sheetButton("התנתקות", () => window.CourseAuth?.logout?.()));
  }

  function openSheet() {
    const sheet = ensureSheet(activeProfile);
    lastFocus = document.activeElement;
    sheet.hidden = false;
    sheet.classList.add("is-open");
    document.body.classList.add("m-sheet-open");
    requestAnimationFrame(() => sheet.querySelector(".m-sheet__panel")?.focus());
  }

  function closeSheet() {
    const sheet = document.getElementById("mMoreSheet");
    if (!sheet) return;
    sheet.classList.remove("is-open");
    document.body.classList.remove("m-sheet-open");
    sheet.hidden = true;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function trapFocus(event) {
    if (event.key === "Escape") { closeSheet(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...event.currentTarget.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function ensureBottomNav(profile) {
    if (!isProtectedPage()) return;
    activeProfile = profile || activeProfile;
    const existing = document.getElementById("mBottomNav");
    if (existing) { renderSheetLinks(activeProfile); return; }
    const pathname = location.pathname;
    const nav = document.createElement("nav");
    nav.id = "mBottomNav";
    nav.className = "m-bottom-nav";
    nav.setAttribute("aria-label", "ניווט תחתון למובייל");
    nav.append(
      navItem("בית", "⌂", href("index.html"), () => /(^|\/)index\.html$/.test(pathname) || /\/$/.test(pathname)),
      navItem("שיעורים", "▦", href("pages/syllabus.html"), () => /lesson-\d+|syllabus/.test(pathname)),
      navItem("תרגול", "✓", href("pages/quizzes.html"), () => /quizzes|exam-questions/.test(pathname)),
      navItem("אתגר", "★", href("pages/safety-game.html"), () => /safety-game|game-/.test(pathname))
    );
    const more = document.createElement("button");
    more.type = "button";
    more.className = "m-bottom-nav__item m-bottom-nav__more";
    more.setAttribute("aria-haspopup", "dialog");
    more.innerHTML = '<span class="m-bottom-nav__icon">•••</span><span class="m-bottom-nav__label">עוד</span>';
    more.addEventListener("click", openSheet);
    nav.append(more);
    document.body.append(nav);
    ensureSheet(activeProfile);
  }

  function init(profile) {
    if (!isProtectedPage()) return;
    if (!window.matchMedia(MOBILE_QUERY).matches) return;
    if (!document.body.classList.contains("auth-approved")) return;
    ensureBottomNav(profile || window.CourseAuth?.profile || activeProfile);
  }

  document.addEventListener("course-auth-approved", (event) => init(event.detail));
  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.classList.contains("auth-approved")) init(window.CourseAuth?.profile);
  });
  window.addEventListener("resize", () => { if (window.matchMedia(MOBILE_QUERY).matches) init(window.CourseAuth?.profile || activeProfile); });
})();

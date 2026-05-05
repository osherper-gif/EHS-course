// Lesson interactive features for the modern UI.
// All features gracefully degrade without JS — see CSS for fallbacks.
(function () {
  let installed = false;
  let scrollHandler = null;
  let activeMiniNavLink = null;

  // ---------- Tabs ----------
  function initTabs(scope) {
    scope.querySelectorAll(".lesson-tabs").forEach((tabs) => {
      if (tabs.dataset.tabsInit === "1") return;
      tabs.dataset.tabsInit = "1";
      const buttons = tabs.querySelectorAll(".lesson-tabs-nav button");
      const panels = tabs.querySelectorAll(".lesson-tabs-panel");
      buttons.forEach((btn, idx) => {
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
        btn.setAttribute("tabindex", idx === 0 ? "0" : "-1");
        const target = btn.dataset.tabTarget || (panels[idx] && panels[idx].dataset.tabKey);
        btn.dataset.tabTarget = target;
        btn.addEventListener("click", () => activate(target));
        btn.addEventListener("keydown", (event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const list = Array.from(buttons);
          const cur = list.indexOf(btn);
          const dir = event.key === "ArrowLeft" ? 1 : -1;
          const next = list[(cur + dir + list.length) % list.length];
          next.focus();
          activate(next.dataset.tabTarget);
        });
      });
      function activate(key) {
        buttons.forEach((b) => {
          const active = b.dataset.tabTarget === key;
          b.setAttribute("aria-selected", String(active));
          b.setAttribute("tabindex", active ? "0" : "-1");
        });
        panels.forEach((p) => {
          p.hidden = p.dataset.tabKey !== key;
        });
      }
      panels.forEach((p, idx) => { p.hidden = idx !== 0; });
    });
  }

  // ---------- Tooltips for [data-term] ----------
  function initTooltips(scope) {
    scope.querySelectorAll("[data-term]").forEach((el) => {
      if (el.dataset.termInit === "1") return;
      el.dataset.termInit = "1";
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.setAttribute("aria-expanded", "false");
      el.addEventListener("focus", () => el.setAttribute("aria-expanded", "true"));
      el.addEventListener("blur", () => el.setAttribute("aria-expanded", "false"));
      el.addEventListener("keydown", (event) => {
        if (event.key === "Escape") { el.blur(); }
      });
    });
  }

  // ---------- Mini-nav (sticky TOC inside lesson) ----------
  function slugify(text, idx) {
    const base = String(text || "")
      .replace(/[^A-Za-z0-9א-ת\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40);
    return "sec-" + idx + (base ? "-" + base : "");
  }
  function buildMiniNav(scope) {
    const host = scope.querySelector("[data-mini-nav]");
    if (!host || host.dataset.miniNavInit === "1") return;
    const root = scope.querySelector("[data-lesson-content]") || scope;
    const h2s = Array.from(root.querySelectorAll("h2"));
    if (!h2s.length) return;
    host.dataset.miniNavInit = "1";
    const ul = document.createElement("ul");
    ul.className = "lesson-mini-nav-list";
    h2s.forEach((h2, idx) => {
      const text = h2.textContent.trim();
      if (!text) return;
      if (!h2.id) h2.id = slugify(text, idx);
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + h2.id;
      a.textContent = text;
      a.dataset.miniNavLink = h2.id;
      li.append(a);
      ul.append(li);
    });
    host.replaceChildren(ul);
  }

  // ---------- Scroll progress + active mini-nav ----------
  function attachScroll(scope) {
    const progressFill = scope.querySelector("[data-scroll-progress] span");
    const backTop = scope.querySelector("[data-back-to-top]");
    const links = Array.from(scope.querySelectorAll("[data-mini-nav-link]"));
    const sections = links
      .map((link) => document.getElementById(link.dataset.miniNavLink))
      .filter(Boolean);
    function onScroll() {
      const scrolled = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrolled / docHeight) * 100)) : 0;
      if (progressFill) progressFill.style.width = pct + "%";
      if (backTop) backTop.classList.toggle("is-visible", scrolled > 480);
      let current = null;
      const offset = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--lesson-sticky-offset"), 10) || 112;
      sections.forEach((sec) => {
        if (sec.getBoundingClientRect().top - offset <= 0) current = sec;
      });
      if (current) {
        const targetLink = links.find((l) => l.dataset.miniNavLink === current.id);
        if (targetLink && targetLink !== activeMiniNavLink) {
          if (activeMiniNavLink) activeMiniNavLink.classList.remove("is-active");
          targetLink.classList.add("is-active");
          activeMiniNavLink = targetLink;
        }
      }
    }
    scrollHandler = () => requestAnimationFrame(onScroll);
    window.addEventListener("scroll", scrollHandler, { passive: true });
    onScroll();
  }

  // ---------- Back to top ----------
  function bindBackToTop(scope) {
    const btn = scope.querySelector("[data-back-to-top]");
    if (!btn || btn.dataset.btInit === "1") return;
    btn.dataset.btInit = "1";
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ---------- Smooth scroll for mini-nav ----------
  function bindMiniNavSmoothScroll(scope) {
    scope.addEventListener("click", (event) => {
      const link = event.target.closest("[data-mini-nav-link]");
      if (!link) return;
      const id = link.dataset.miniNavLink;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      const offset = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--lesson-sticky-offset"), 10) || 112;
      const top = target.getBoundingClientRect().top + window.scrollY - offset - 56;
      window.scrollTo({ top, behavior: "smooth" });
      history.replaceState(null, "", "#" + id);
    });
  }

  // ---------- Install / uninstall ----------
  function install() {
    if (installed) return;
    const scope = document.body;
    initTabs(scope);
    initTooltips(scope);
    buildMiniNav(scope);
    bindBackToTop(scope);
    bindMiniNavSmoothScroll(scope);
    attachScroll(scope);
    installed = true;
  }

  function uninstall() {
    if (!installed) return;
    if (scrollHandler) window.removeEventListener("scroll", scrollHandler);
    scrollHandler = null;
    if (activeMiniNavLink) activeMiniNavLink.classList.remove("is-active");
    activeMiniNavLink = null;
    installed = false;
  }

  function init() {
    install();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.CourseLessonUi = { install, uninstall };
})();

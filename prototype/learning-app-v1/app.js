/* EHS Learning Platform — Prototype v1
 * Light interactions only: view switcher, theme toggle, mobile drawer,
 * TOC scrollspy, answer selection demo, keyboard shortcuts.
 * Static prototype. No frameworks. No build.
 */
(function () {
  "use strict";

  const body = document.body;
  const html = document.documentElement;

  // ---------- VIEW SWITCHER ----------
  function setView(view) {
    if (!view) return;
    body.dataset.view = view;
    // Update sidebar nav active state
    document.querySelectorAll(".sidebar-nav-item").forEach((btn) => {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle("is-active", isActive);
      if (isActive) {
        btn.setAttribute("aria-current", "page");
      } else {
        btn.removeAttribute("aria-current");
      }
    });
    // Close drawer on mobile after navigation
    body.classList.remove("is-drawer-open");
    // Reset TOC active to first item when entering lesson
    if (view === "lesson") {
      document.querySelectorAll(".lesson-toc a").forEach((a, idx) => {
        a.classList.toggle("is-active", idx === 0);
      });
    }
    // Scroll to top of new view
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  // Sidebar nav buttons
  document.querySelectorAll(".sidebar-nav-item[data-view]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      setView(btn.dataset.view);
    });
  });

  // Inline "data-view-link" anchors/buttons (jump from one view to another)
  document.querySelectorAll("[data-view-link]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      setView(el.dataset.viewLink);
    });
  });

  // ---------- THEME TOGGLE ----------
  function setTheme(theme) {
    html.dataset.theme = theme;
    try { localStorage.setItem("ehs-proto-theme", theme); } catch (e) {}
  }
  // Initial theme from storage / system
  try {
    const saved = localStorage.getItem("ehs-proto-theme");
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  } catch (e) {}
  document.querySelectorAll('[data-action="toggle-theme"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      setTheme(html.dataset.theme === "dark" ? "light" : "dark");
    });
  });

  // ---------- MOBILE DRAWER ----------
  document.querySelectorAll('[data-action="open-drawer"]').forEach((btn) => {
    btn.addEventListener("click", () => body.classList.add("is-drawer-open"));
  });
  document.querySelectorAll('[data-action="close-drawer"]').forEach((el) => {
    el.addEventListener("click", () => body.classList.remove("is-drawer-open"));
  });
  // Close drawer on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && body.classList.contains("is-drawer-open")) {
      body.classList.remove("is-drawer-open");
    }
  });

  // ---------- TOC SCROLL SPY (lesson view) ----------
  const tocLinks = document.querySelectorAll(".lesson-toc a");
  const sections = Array.from(document.querySelectorAll(".lesson-main section[id]"));
  if (sections.length && tocLinks.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry that's most in view (top-most that's intersecting)
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        const top = visible.reduce((best, cur) =>
          cur.boundingClientRect.top < best.boundingClientRect.top ? cur : best
        );
        const id = top.target.id;
        tocLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
        });
      },
      { rootMargin: "-15% 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
  }
  // Smooth scroll for TOC clicks
  tocLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (targetId && targetId.startsWith("#")) {
        const t = document.querySelector(targetId);
        if (t) {
          e.preventDefault();
          t.scrollIntoView({ behavior: "smooth", block: "start" });
          tocLinks.forEach((l) => l.classList.remove("is-active"));
          link.classList.add("is-active");
        }
      }
    });
  });

  // ---------- ANSWER SELECTION DEMO ----------
  document.querySelectorAll(".answers .answer").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Demo: clear "is-selected" siblings, mark this one if not already correct/wrong
      if (btn.classList.contains("is-correct") || btn.classList.contains("is-wrong")) return;
      const siblings = btn.parentElement.querySelectorAll(".answer");
      siblings.forEach((s) => s.classList.remove("is-selected"));
      btn.classList.add("is-selected");
    });
  });

  // ---------- QUESTION JUMPS ----------
  document.querySelectorAll(".q-jump").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".q-jump").forEach((b) => {
        if (!b.classList.contains("is-correct") && !b.classList.contains("is-wrong")) {
          b.classList.remove("is-current");
        }
      });
      // Only show current marker if button isn't already correct/wrong
      if (!btn.classList.contains("is-correct") && !btn.classList.contains("is-wrong")) {
        btn.classList.add("is-current");
      }
    });
  });

  // ---------- KEYBOARD SHORTCUTS ----------
  document.addEventListener("keydown", (e) => {
    // Ignore when typing in input/textarea
    if (e.target.matches("input, textarea, select")) return;
    // Cmd/Ctrl+K → focus search
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const search = document.querySelector(".topbar-search input");
      if (search) search.focus();
      return;
    }
    // g d / g l / g p → go to view
    if (e.key === "g") {
      let pending = true;
      const onNext = (ev) => {
        if (!pending) return;
        pending = false;
        document.removeEventListener("keydown", onNext);
        if (ev.key === "d") setView("dashboard");
        else if (ev.key === "l") setView("lesson");
        else if (ev.key === "p") setView("practice");
      };
      document.addEventListener("keydown", onNext);
      setTimeout(() => { pending = false; document.removeEventListener("keydown", onNext); }, 1200);
    }
  });
})();

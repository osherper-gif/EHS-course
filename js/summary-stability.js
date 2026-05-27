(function () {
  function stabilizeAccordions(root) {
    const accordions = Array.from(root.querySelectorAll("details.content-accordion"));
    if (!accordions.length) return;

    const closeSiblings = (active) => {
      accordions.forEach((accordion) => {
        if (accordion !== active && accordion.open && !accordion.hasAttribute("data-allow-multiple")) {
          accordion.open = false;
        }
      });
    };

    const initiallyOpen = accordions.filter((accordion) => accordion.open && !accordion.hasAttribute("data-allow-multiple"));
    initiallyOpen.slice(1).forEach((accordion) => {
      accordion.open = false;
    });

    accordions.forEach((accordion) => {
      accordion.addEventListener("toggle", () => {
        accordion.classList.toggle("is-open", accordion.open);
        if (accordion.open && !accordion.hasAttribute("data-allow-multiple")) {
          closeSiblings(accordion);
        }
      });
      accordion.classList.toggle("is-open", accordion.open);
    });
  }

  function markMixedDirectionTerms(root) {
    const selectors = [
      ".topic-tags span",
      ".summary-card h3",
      ".summary-mini-callout strong",
      ".op-field-action-card strong",
      ".case-card strong",
      ".legal-card strong",
      ".summary-table th",
      ".summary-table td"
    ];
    root.querySelectorAll(selectors.join(",")).forEach((node) => {
      node.setAttribute("dir", "auto");
    });

    root.querySelectorAll("p, li, dd, td, th, span, strong, h2, h3").forEach((node) => {
      if (node.children.length) return;
      node.innerHTML = node.innerHTML.replace(/\b(Line \/ Staff|Legal Survival Guide|Work Permit|ISO 45001|CAPA|RCA|LOTO|PPE|HOP|SIMOPS|Try-Out)\b/g, '<span class="en-term">$1</span>');
    });
  }

  function enhanceFieldPocketCards(root) {
    root.querySelectorAll(".op-field-action-card dl").forEach((list) => {
      if (list.classList.contains("field-pocket-grid")) return;
      const children = Array.from(list.children);
      const cells = [];
      for (let index = 0; index < children.length; index += 2) {
        const term = children[index];
        const description = children[index + 1];
        if (!term || !description || term.tagName !== "DT" || description.tagName !== "DD") continue;
        const cell = document.createElement("div");
        cell.className = "field-pocket-cell";
        cell.append(term.cloneNode(true), description.cloneNode(true));
        cells.push(cell);
      }
      if (!cells.length) return;
      list.replaceChildren(...cells);
      list.classList.add("field-pocket-grid");
    });
  }

  function enhanceSummaryTables(root) {
    root.querySelectorAll("table.summary-table").forEach((table) => {
      if (table.dataset.summaryStable === "true") return;
      const headers = Array.from(table.querySelectorAll("thead th")).map((header) => header.textContent.trim());
      table.querySelectorAll("tbody tr").forEach((row) => {
        Array.from(row.children).forEach((cell, index) => {
          if (cell.tagName === "TD" && headers[index]) {
            cell.setAttribute("data-label", headers[index]);
          }
        });
      });
      table.dataset.summaryStable = "true";
    });
  }

  function setupNumbersLawWidget(root) {
    root.querySelectorAll(".numbers-law-widget").forEach((widget) => {
      const range = widget.querySelector('input[type="range"]');
      const value = widget.querySelector("[data-numbers-law-value]");
      const result = widget.querySelector("[data-numbers-law-result]");
      if (!range || !value || !result) return;

      const render = () => {
        const workers = Number(range.value);
        value.textContent = workers + " עובדים";
        const duties = ["תיעוד בסיסי, הדרכה, סקר סיכונים ובקרה שוטפת לפי אופי הסיכון."];
        if (workers >= 25) {
          duties.push("חובת ועדת בטיחות במפעלים/מקומות עבודה רלוונטיים לפי הדין והנסיבות.");
        }
        if (workers >= 50) {
          duties.push("חובת ממונה בטיחות ותוכנית לניהול בטיחות כאשר מתקיימים תנאי החובה הרלוונטיים.");
        }
        if (workers >= 100) {
          duties.push("רמת ציפייה גבוהה יותר למנגנון ניהול, מעקב CAPA, הדרכות ותיעוד החלטות הנהלה.");
        }
        result.replaceChildren(...duties.map((text) => {
          const item = document.createElement("span");
          item.textContent = text;
          return item;
        }));
      };

      range.addEventListener("input", render);
      render();
    });
  }

  function enhancePracticeExperience(root) {
    const app = root.querySelector("#summaryQuizApp");
    if (!app) return;

    const build = () => {
      const groups = Array.from(app.querySelectorAll("details.summary-question-group"));
      if (!groups.length || app.querySelector(".summary-practice-nav")) return false;

      const nav = document.createElement("nav");
      nav.className = "summary-practice-nav";
      nav.setAttribute("aria-label", "ניווט תרגול");

      const top = document.createElement("a");
      top.href = "#summaryQuestions";
      top.textContent = "ראש התרגול";
      nav.append(top);

      groups.forEach((group, index) => {
        const id = group.id || "summary-question-group-" + (index + 1);
        group.id = id;
        const summaryText = group.querySelector("summary")?.textContent.trim().replace(/\s*\d+\s*\/\s*\d+\s*נענו\s*$/, "") || "קבוצה " + (index + 1);
        const link = document.createElement("a");
        link.href = "#" + id;
        link.textContent = summaryText;
        nav.append(link);

        if (!group.querySelector(".summary-back-to-practice")) {
          const back = document.createElement("a");
          back.className = "summary-back-to-practice";
          back.href = "#summaryQuestions";
          back.textContent = "חזרה לראש התרגול";
          group.append(back);
        }
      });

      app.prepend(nav);
      return true;
    };

    if (build()) return;
    const observer = new MutationObserver(() => {
      if (build()) observer.disconnect();
    });
    observer.observe(app, { childList: true, subtree: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const main = document.querySelector("main[data-readable-content]") || document;
    stabilizeAccordions(main);
    markMixedDirectionTerms(main);
    enhanceFieldPocketCards(main);
    enhanceSummaryTables(main);
    setupNumbersLawWidget(main);
    enhancePracticeExperience(main);
  });
})();

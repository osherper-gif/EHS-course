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
      ".legal-card strong"
    ];
    root.querySelectorAll(selectors.join(",")).forEach((node) => {
      node.setAttribute("dir", "auto");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const main = document.querySelector("main[data-readable-content]") || document;
    stabilizeAccordions(main);
    markMixedDirectionTerms(main);
  });
})();

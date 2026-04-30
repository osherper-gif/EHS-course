(function () {
  // Topic-graph SVG: renders 14 nodes with relations between course topics.
  // Pure SVG, no external libraries. Each node is a clickable <a>.
  // Targets any <figure class="topic-graph" data-topic-graph></figure> element.

  const NODES = [
    // x, y, label, type (law/role/risk/iso/emergency), href
    { x: 450, y: 60,  label: "חוק ותקנות",         type: "law",       href: "./pages/laws.html" },
    { x: 220, y: 150, label: "ממונה בטיחות",       type: "role",      href: "./pages/lesson-02.html" },
    { x: 450, y: 150, label: "ועדת בטיחות",        type: "role",      href: "./pages/lesson-02.html" },
    { x: 680, y: 150, label: "נאמני בטיחות",       type: "role",      href: "./pages/lesson-02.html" },
    { x: 90,  y: 250, label: "סקר סיכונים",        type: "risk",      href: "./pages/lesson-10.html" },
    { x: 250, y: 250, label: "תוכנית בטיחות שנתית", type: "role",      href: "./pages/lesson-10.html" },
    { x: 420, y: 250, label: "ISO 45001",         type: "iso",       href: "./pages/standards.html" },
    { x: 580, y: 250, label: "חומרים מסוכנים",    type: "risk",      href: "./pages/lesson-07.html" },
    { x: 740, y: 250, label: "גהות תעסוקתית",     type: "risk",      href: "./pages/lesson-08.html" },
    { x: 130, y: 360, label: "עבודה בגובה",        type: "risk",      href: "./pages/lesson-05.html" },
    { x: 290, y: 360, label: "פיגומים ועגורנים",  type: "risk",      href: "./pages/lesson-05.html" },
    { x: 450, y: 360, label: "חשמל",              type: "risk",      href: "./pages/lesson-06.html" },
    { x: 620, y: 360, label: "ניטור סביבתי",      type: "risk",      href: "./pages/lesson-08.html" },
    { x: 450, y: 460, label: "חירום ותרגילים",   type: "emergency", href: "./pages/lesson-11.html" },
  ];

  // pairs of node indexes (0-based) defining lines between nodes
  const LINKS = [
    [0,1],[0,2],[0,3],
    [1,4],[1,5],[1,6],[1,7],[1,8],
    [2,5],
    [4,9],[4,10],[4,11],
    [7,12],[8,12],
    [4,13],[1,13],[6,13],
    [5,6],
    [9,10],
  ];

  function svgEscape(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function build(prefix) {
    const lines = LINKS.map(([a,b]) =>
      '<line x1="'+NODES[a].x+'" y1="'+NODES[a].y+'" x2="'+NODES[b].x+'" y2="'+NODES[b].y+'"/>'
    ).join("");
    const nodes = NODES.map((n) => {
      const w = Math.max(140, n.label.length * 11 + 24);
      const h = 44;
      const href = (prefix || "") + n.href.replace(/^\.\//, "");
      return ''
        + '<a href="'+svgEscape(href)+'" aria-label="'+svgEscape(n.label)+'">'
        +   '<g transform="translate('+n.x+','+n.y+')">'
        +     '<rect class="node node-'+n.type+'" x="'+(-w/2)+'" y="'+(-h/2)+'" width="'+w+'" height="'+h+'" rx="10" ry="10"/>'
        +     '<text text-anchor="middle" dominant-baseline="middle" dy=".05em">'+svgEscape(n.label)+'</text>'
        +   '</g>'
        + '</a>';
    }).join("");
    return ''
      + '<figcaption>מפת קשרים — תחומי הקורס</figcaption>'
      + '<svg viewBox="0 0 900 520" role="img" aria-describedby="topicGraphDesc" preserveAspectRatio="xMidYMid meet">'
      +   '<desc id="topicGraphDesc">תרשים מקשר בין חוק, תפקידי הממונה, סקר סיכונים, ISO 45001, חומרים מסוכנים, גהות, חירום ובדיקות תקופתיות.</desc>'
      +   '<g class="links">' + lines + '</g>'
      +   '<g class="nodes">' + nodes + '</g>'
      + '</svg>'
      + '<nav class="topic-graph-legend" aria-label="רשימה טקסטואלית של צמתי המפה">'
      +   NODES.map((n) => {
            const href = (prefix || "") + n.href.replace(/^\.\//, "");
            return '<a href="'+svgEscape(href)+'">'+svgEscape(n.label)+'</a>';
          }).join(" · ")
      + '</nav>';
  }

  function init() {
    document.querySelectorAll("[data-topic-graph]").forEach((host) => {
      const prefix = host.getAttribute("data-prefix") || "";
      host.innerHTML = build(prefix);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.CourseTopicGraph = { build, init, NODES, LINKS };
})();

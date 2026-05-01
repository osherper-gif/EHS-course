(function () {
  const LOCAL_KEY = "ehsCourseLastSeenVersionAt";
  const MAX_ITEMS = 5;

  function pathPrefix() {
    return location.pathname.includes("/pages/") ? "../" : "";
  }

  function sanitize(value) {
    return String(value || "").replace(/[<>]/g, "").trim();
  }

  function loadVersionsScript() {
    if (window.SITE_VERSIONS) return Promise.resolve(window.SITE_VERSIONS);
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = pathPrefix() + "data/site-versions.js";
      script.onload = () => resolve(window.SITE_VERSIONS || []);
      script.onerror = () => resolve([]);
      document.head.append(script);
    });
  }

  function versionTimestamp(version) {
    const date = version.releaseDate || version.date || "";
    const time = version.releaseTime && !String(version.releaseTime).includes("לא") ? version.releaseTime : "00:00";
    const parsed = Date.parse(`${date}T${time}`);
    if (!Number.isNaN(parsed)) return parsed;
    const fallback = Date.parse(date);
    return Number.isNaN(fallback) ? 0 : fallback;
  }

  function getLastSeen(profile) {
    const profileValue = Date.parse(profile?.lastSeenVersionAt || "");
    if (!Number.isNaN(profileValue)) return profileValue;
    try {
      const localValue = Date.parse(localStorage.getItem(LOCAL_KEY) || "");
      return Number.isNaN(localValue) ? Date.now() : localValue;
    } catch {
      return Date.now();
    }
  }

  function setLastSeen(timestamp) {
    const iso = new Date(timestamp || Date.now()).toISOString();
    try {
      localStorage.setItem(LOCAL_KEY, iso);
    } catch {
      // localStorage is a fallback only.
    }
    window.CourseAuth?.updateLastSeenVersionAt?.(iso).catch(() => null);
  }

  function summarize(version) {
    const parts = [version.addedRequirements, version.contentChanges, version.siteChanges, version.uiUxChanges]
      .map((part) => sanitize(part))
      .filter(Boolean);
    return parts[0] || sanitize(version.releaseNotes) || "עודכנו רכיבים באתר.";
  }

  function hasQuestions(version) {
    return /שאל|מבחן|תרגול/i.test([version.addedRequirements, version.contentChanges, version.releaseNotes].join(" "));
  }

  function hasContent(version) {
    return /תוכן|שיעור|קורס|חומר|חוק|תקנה/i.test([version.addedRequirements, version.contentChanges, version.releaseNotes].join(" "));
  }

  function hasGame(version) {
    return /משחק|אתגר|XP|קושי/i.test([version.addedRequirements, version.siteChanges, version.releaseNotes].join(" "));
  }

  function showModal(versions, profile) {
    if (!versions.length || document.getElementById("whatsNewModal")) return;
    const overlay = document.createElement("div");
    overlay.id = "whatsNewModal";
    overlay.className = "whats-new-overlay";
    const dialog = document.createElement("section");
    dialog.className = "whats-new-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", "מה חדש מאז הפעם האחרונה");

    const title = document.createElement("h2");
    title.textContent = "מה חדש מאז הפעם האחרונה?";
    const intro = document.createElement("p");
    intro.textContent = "ריכזנו עבורך את העדכונים האחרונים באתר כדי שתוכל להמשיך ללמוד מהמקום הנכון.";
    const list = document.createElement("div");
    list.className = "whats-new-list";

    versions.slice(0, MAX_ITEMS).forEach((version) => {
      const card = document.createElement("article");
      const heading = document.createElement("h3");
      heading.textContent = sanitize(version.versionNumber || version.commitMessage || "עדכון אתר");
      const date = document.createElement("p");
      date.className = "muted";
      date.textContent = sanitize(version.releaseDate || version.date || "לא צוין");
      const summary = document.createElement("p");
      summary.textContent = summarize(version);
      const tags = document.createElement("div");
      tags.className = "whats-new-tags";
      if (hasQuestions(version)) tags.append(tag("נוספו/עודכנו שאלות"));
      if (hasContent(version)) tags.append(tag("עודכן חומר לימודי"));
      if (hasGame(version)) tags.append(tag("עודכן המשחק"));
      card.append(heading, date, summary, tags);
      list.append(card);
    });

    const actions = document.createElement("div");
    actions.className = "form-actions";
    const ok = document.createElement("button");
    ok.type = "button";
    ok.className = "btn";
    ok.textContent = "הבנתי";
    ok.addEventListener("click", () => {
      const newest = Math.max(...versions.map(versionTimestamp), Date.now());
      setLastSeen(newest);
      overlay.remove();
    });
    actions.append(ok);
    if (window.CourseAuth?.isAdminProfile?.(profile)) {
      const admin = document.createElement("a");
      admin.className = "btn secondary";
      admin.href = pathPrefix() + "pages/version-management.html";
      if (location.pathname.includes("/pages/")) admin.href = "version-management.html";
      admin.textContent = "פתח ניהול גרסאות";
      actions.append(admin);
    }

    dialog.append(title, intro, list, actions);
    overlay.append(dialog);
    document.body.append(overlay);
  }

  function tag(text) {
    const span = document.createElement("span");
    span.textContent = text;
    return span;
  }

  async function init(event) {
    const profile = event?.detail || window.CourseAuth?.profile;
    if (!profile || profile.status !== "approved") return;
    const versions = await loadVersionsScript();
    const lastSeen = getLastSeen(profile);
    const fresh = versions
      .filter((version) => version.status === "published")
      .filter((version) => versionTimestamp(version) > lastSeen)
      .sort((a, b) => versionTimestamp(b) - versionTimestamp(a));
    if (!fresh.length) {
      if (!profile.lastSeenVersionAt) setLastSeen(Date.now());
      return;
    }
    showModal(fresh, profile);
  }

  document.addEventListener("course-auth-approved", init);
})();

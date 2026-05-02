(function () {
  const MAX_RESULTS = 20;
  const INDEX_GLOBAL = "SITE_SEARCH_INDEX";

  const normalize = (text) => String(text || "")
    .toLowerCase()
    .replace(/[״"']/g, "")
    .replace(/[־–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  function currentPathPrefix() {
    return location.pathname.includes("/pages/") ? "../" : "./";
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        if (window[INDEX_GLOBAL]) resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function flattenMeeting(meeting) {
    return [
      meeting.title,
      meeting.topic,
      meeting.summary,
      meeting.courseBasis,
      meeting.knowledgeText,
      ...(meeting.objectives || []),
      ...(meeting.terms || []),
      ...(meeting.risks || []),
      ...(meeting.examples || []),
      ...(meeting.examFocus || []),
      ...(meeting.reviewQuestions || []),
      ...(meeting.materialCoverage || []),
    ].join(" ");
  }

  function fallbackIndex() {
    const data = window.COURSE_DATA || { meetings: [], glossary: [], laws: [], questions: [] };
    const exam = window.EXAM_QUESTIONS || [];
    return [
      ...data.meetings.map((item) => ({
        type: "מפגש",
        title: item.title,
        url: "pages/" + item.id + ".html",
        text: flattenMeeting(item),
        lessonId: item.id,
        tags: [item.topic, "שיעור"],
      })),
      ...data.glossary.map((item) => ({
        type: "מושג",
        title: item.term,
        url: "pages/glossary.html",
        text: item.term + " " + item.definition + " " + item.category,
        tags: [item.category, "מילון"],
      })),
      ...data.laws.map((item) => ({
        type: "חוק/תקנה",
        title: item.title,
        url: "pages/laws.html",
        text: item.title + " " + item.note,
        tags: ["חוקים ותקנות"],
      })),
      ...data.questions.map((item) => ({
        type: "שאלה",
        title: item.question,
        url: "pages/quizzes.html",
        text: item.question + " " + (item.options || []).join(" ") + " " + item.explanation,
        tags: ["תרגול"],
      })),
      ...exam.map((item) => ({
        type: "שאלת מבחן",
        title: item.question,
        url: "pages/exam-questions.html",
        text: item.question + " " + item.correctAnswer + " " + (item.options || []).join(" ") + " " + item.explanation + " " + item.topic,
        lessonId: item.relatedLessonId,
        tags: [item.topic, item.difficulty, "שאלות מבחן"],
      })),
    ];
  }

  async function getIndex() {
    if (!window[INDEX_GLOBAL]) {
      try {
        await loadScript(currentPathPrefix() + "data/search-index.js");
      } catch (error) {
        console.warn("[search] local index unavailable, using in-memory fallback", error);
      }
    }
    return Array.isArray(window[INDEX_GLOBAL]) ? window[INDEX_GLOBAL] : fallbackIndex();
  }

  function scoreItem(item, tokens) {
    const title = normalize(item.title);
    const text = normalize(item.text || item.snippet || "");
    const tags = normalize((item.tags || []).join(" "));
    return tokens.reduce((score, token) => {
      if (title.includes(token)) return score + 4;
      if (tags.includes(token)) return score + 3;
      if (text.includes(token)) return score + 1;
      return score;
    }, 0);
  }

  function makeSnippet(item, tokens) {
    const source = String(item.snippet || item.text || item.title || "");
    const normalizedSource = normalize(source);
    const firstToken = tokens.find((token) => normalizedSource.includes(token));
    if (!firstToken) return source.slice(0, 180);
    const index = normalizedSource.indexOf(firstToken);
    const start = Math.max(0, index - 70);
    return source.slice(start, start + 220);
  }

  async function search(query) {
    const q = normalize(query);
    if (!q) return [];
    const tokens = q.split(" ").filter((token) => token.length > 1);
    if (!tokens.length) return [];
    const index = await getIndex();
    return index
      .map((item) => ({ ...item, score: scoreItem(item, tokens), snippet: makeSnippet(item, tokens) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || String(a.title).localeCompare(String(b.title), "he"))
      .slice(0, MAX_RESULTS);
  }

  function resolveUrl(url) {
    const value = String(url || "index.html");
    if (/^(https?:|mailto:|tel:|#)/.test(value)) return value;
    if (location.pathname.includes("/pages/") && value.startsWith("pages/")) {
      return value.replace(/^pages\//, "");
    }
    return value;
  }

  function appendHighlightedText(parent, text, query) {
    const raw = String(text || "");
    const token = normalize(query).split(" ").find((part) => part.length > 1);
    if (!token) {
      parent.textContent = raw;
      return;
    }
    const lower = normalize(raw);
    const index = lower.indexOf(token);
    if (index < 0) {
      parent.textContent = raw;
      return;
    }
    parent.append(document.createTextNode(raw.slice(0, index)));
    const mark = document.createElement("mark");
    mark.textContent = raw.slice(index, index + token.length);
    parent.append(mark, document.createTextNode(raw.slice(index + token.length)));
  }

  function renderResults(container, results, query) {
    container.replaceChildren();
    if (!results.length) {
      const empty = document.createElement("p");
      empty.className = "site-search-empty";
      empty.textContent = "לא נמצאו תוצאות";
      container.append(empty);
      return;
    }
    const list = document.createElement("div");
    list.className = "site-search-results-list";
    results.forEach((item) => {
      const article = document.createElement("article");
      article.className = "search-hit site-search-hit";
      const meta = document.createElement("span");
      meta.className = "site-search-type";
      meta.textContent = item.type || "תוצאה";
      const link = document.createElement("a");
      link.href = resolveUrl(item.url || item.href);
      link.className = "site-search-title";
      appendHighlightedText(link, item.title, query);
      const snippet = document.createElement("p");
      appendHighlightedText(snippet, item.snippet, query);
      article.append(meta, link, snippet);
      list.append(article);
    });
    container.append(list);
  }

  window.CourseSearch = { normalize, search, renderResults };
})();

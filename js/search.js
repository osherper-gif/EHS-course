(function () {
  const normalize = (text) => String(text || "").toLowerCase().replace(/[״"']/g, "").replace(/\s+/g, " ").trim();
  const flattenMeeting = (meeting) => [meeting.title, meeting.topic, meeting.summary, meeting.courseBasis, meeting.knowledgeText, ...(meeting.objectives || []), ...(meeting.terms || []), ...(meeting.risks || []), ...(meeting.examples || []), ...(meeting.examFocus || []), ...(meeting.reviewQuestions || [])].join(" ");
  function buildIndex() {
    const data = window.COURSE_DATA || { meetings: [], glossary: [], laws: [] };
    return [
      ...data.meetings.map((item) => ({ type: "מפגש", title: item.title, href: "pages/" + item.id + ".html", text: flattenMeeting(item), topic: item.topic })),
      ...data.glossary.map((item) => ({ type: "מושג", title: item.term, href: "pages/glossary.html", text: item.term + " " + item.definition + " " + item.category, topic: item.category })),
      ...data.laws.map((item) => ({ type: "חוק/תקנה", title: item.title, href: "pages/laws.html", text: item.title + " " + item.note, topic: "חוקים ותקנות" })),
      ...data.questions.map((item) => ({ type: "שאלה", title: item.question, href: "pages/quizzes.html", text: item.question + " " + item.options.join(" ") + " " + item.explanation, topic: "תרגול" })),
      ...(window.EXAM_QUESTIONS || []).map((item) => ({ type: "שאלת מבחן", title: item.question, href: "pages/exam-questions.html", text: item.question + " " + item.correctAnswer + " " + item.options.join(" ") + " " + item.explanation + " " + item.topic, topic: item.topic })),
    ];
  }
  function search(query, topic = "") {
    const q = normalize(query);
    if (!q) return [];
    const tokens = q.split(" ").filter(Boolean);
    return buildIndex().map((item) => {
      const haystack = normalize(item.text);
      const score = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
      return { ...item, score, snippet: item.text.slice(0, 260) };
    }).filter((item) => item.score > 0 && (!topic || item.topic === topic)).sort((a, b) => b.score - a.score).slice(0, 12);
  }
  function renderResults(container, results) {
    container.innerHTML = results.length ? results.map((item) => '<article class="search-hit"><strong>' + item.type + ': <a href="' + item.href + '">' + item.title + '</a></strong><p>' + item.snippet + '</p></article>').join("") : '<article class="search-hit">לא נמצאו תוצאות בחומר הקורס.</article>';
  }
  window.CourseSearch = { search, renderResults, normalize };
})();

(function () {
  const ATTEMPTS_KEY = "safetyCourse:examAttempts";
  const EXAM_DRAFT_KEY = "safetyCourse:mobileExamDraft";
  const ALL_TOPICS = "כל הנושאים";
  const LESSON_ONLY = "__lesson__";
  let activeQuestions = [];
  let activeAnswers = {};
  let activeLessonFilter = "";
  let mobileExamIndex = 0;
  let markedQuestions = new Set();

  const shuffle = (items) => items.map((value) => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map((item) => item.value);
  const getAttempts = () => JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || "[]");
  const saveAttempts = (attempts) => localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  const questions = () => window.EXAM_QUESTIONS || [];
  const isMobileExam = () => window.matchMedia("(max-width: 767px)").matches;

  function saveExamDraft() {
    if (!activeQuestions.length) return;
    const draft = {
      savedAt: new Date().toISOString(),
      topic: currentTopicLabel(),
      questionIds: activeQuestions.map((q) => q.id),
      answers: activeAnswers,
      marked: Array.from(markedQuestions),
      index: mobileExamIndex,
    };
    localStorage.setItem(EXAM_DRAFT_KEY, JSON.stringify(draft));
  }

  function loadMatchingDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(EXAM_DRAFT_KEY) || "null");
      if (!draft || !Array.isArray(draft.questionIds)) return;
      const same = draft.questionIds.length === activeQuestions.length && draft.questionIds.every((id, index) => id === activeQuestions[index]?.id);
      if (!same) return;
      activeAnswers = draft.answers || {};
      markedQuestions = new Set(draft.marked || []);
      mobileExamIndex = Math.min(Number(draft.index || 0), Math.max(activeQuestions.length - 1, 0));
    } catch {
      localStorage.removeItem(EXAM_DRAFT_KEY);
    }
  }

  function clearExamDraft() {
    localStorage.removeItem(EXAM_DRAFT_KEY);
  }


  function uniqueTopics() {
    return [ALL_TOPICS, ...Array.from(new Set(questions().map((q) => q.topic))).sort()];
  }

  function appendOption(select, value, label) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  }

  function initTopicSelect() {
    const select = document.getElementById("examTopic");
    if (!select) return;
    select.replaceChildren();
    const params = new URLSearchParams(location.search);
    activeLessonFilter = params.get("lesson") || "";
    if (activeLessonFilter && questions().some((q) => q.relatedLessonId === activeLessonFilter)) {
      appendOption(select, LESSON_ONLY, "שאלות מבחן – שיעור זה");
    }
    uniqueTopics().forEach((topic) => appendOption(select, topic, topic));
    if (activeLessonFilter) select.value = LESSON_ONLY;
  }

  function renderSummary() {
    const box = document.getElementById("examSummary");
    if (!box) return;
    const attempts = getAttempts();
    box.replaceChildren();
    box.classList.remove("m-exam-result-ready");
    if (!attempts.length) {
      box.textContent = "עדיין לא בוצעו ניסיונות מבחן.";
      return;
    }
    const last = attempts[attempts.length - 1];
    const avg = Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length);
    [
      [last.score + "%", "ציון אחרון"],
      [last.topic, "נושא אחרון"],
      [attempts.length, "מבחנים שבוצעו"],
      [avg + "%", "ממוצע"],
    ].forEach(([value, label]) => {
      const metric = document.createElement("div");
      metric.className = "metric";
      const strong = document.createElement("strong");
      strong.textContent = value;
      const span = document.createElement("span");
      span.textContent = label;
      metric.append(strong, span);
      box.append(metric);
    });
  }

  function selectedPool(topic) {
    let pool = questions();
    if (topic === LESSON_ONLY && activeLessonFilter) return pool.filter((q) => q.relatedLessonId === activeLessonFilter);
    if (topic && topic !== ALL_TOPICS) pool = pool.filter((q) => q.topic === topic);
    return pool;
  }

  function currentTopicLabel() {
    const select = document.getElementById("examTopic");
    return select?.selectedOptions?.[0]?.textContent || ALL_TOPICS;
  }

  function startExam() {
    const topicSelect = document.getElementById("examTopic");
    const countSelect = document.getElementById("examCount");
    if (!topicSelect || !countSelect) return;
    const topic = topicSelect.value;
    const count = countSelect.value;
    const pool = selectedPool(topic);
    window.CourseStorage?.markLastExam?.({
      topic: topic === LESSON_ONLY ? currentTopicLabel() : topic,
      count,
      path: "pages/exam-questions.html",
    });
    activeQuestions = shuffle(pool).slice(0, count === "all" ? pool.length : Number(count)).map((q) => ({ ...q, shuffledOptions: shuffle(q.options) }));
    activeAnswers = {};
    markedQuestions = new Set();
    mobileExamIndex = 0;
    loadMatchingDraft();
    renderExam();
    document.getElementById("examResult")?.replaceChildren();
    const form = document.getElementById("examForm");
    if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function ensureQuestionGridSheet() {
    let sheet = document.getElementById("mExamGridSheet");
    if (sheet) return sheet;
    sheet = document.createElement("div");
    sheet.id = "mExamGridSheet";
    sheet.className = "m-sheet m-exam-grid-sheet";
    sheet.hidden = true;
    sheet.innerHTML = '<div class="m-sheet__backdrop" data-m-exam-grid-close></div>' +
      '<section class="m-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="mExamGridTitle" tabindex="-1">' +
      '<div class="m-sheet__head"><h2 id="mExamGridTitle">מפת שאלות</h2>' +
      '<button type="button" class="m-sheet__close" data-m-exam-grid-close aria-label="סגירה">×</button></div>' +
      '<div class="m-exam-grid" id="mExamGrid"></div></section>';
    document.body.append(sheet);
    sheet.addEventListener("click", (event) => { if (event.target.closest("[data-m-exam-grid-close]")) closeQuestionGrid(); });
    sheet.addEventListener("keydown", (event) => { if (event.key === "Escape") closeQuestionGrid(); });
    return sheet;
  }

  function renderQuestionGrid() {
    const sheet = ensureQuestionGridSheet();
    const grid = sheet.querySelector("#mExamGrid");
    if (!grid) return;
    grid.replaceChildren();
    activeQuestions.forEach((q, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "m-exam-grid__item";
      if (activeAnswers[q.id]) button.classList.add("is-answered");
      if (markedQuestions.has(q.id)) button.classList.add("is-marked");
      if (index === mobileExamIndex) button.classList.add("is-current");
      button.textContent = String(index + 1);
      button.setAttribute("aria-label", "שאלה " + (index + 1));
      button.addEventListener("click", () => {
        mobileExamIndex = index;
        closeQuestionGrid();
        renderExam();
      });
      grid.append(button);
    });
  }

  function openQuestionGrid() {
    renderQuestionGrid();
    const sheet = ensureQuestionGridSheet();
    sheet.hidden = false;
    sheet.classList.add("is-open");
    requestAnimationFrame(() => sheet.querySelector(".m-sheet__panel")?.focus());
  }

  function closeQuestionGrid() {
    const sheet = document.getElementById("mExamGridSheet");
    if (!sheet) return;
    sheet.classList.remove("is-open");
    sheet.hidden = true;
  }


  function renderOption(q, option) {
    const label = document.createElement("label");
    label.className = "exam-answer";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = q.id;
    input.value = option;
    input.checked = activeAnswers[q.id] === option;
    input.addEventListener("change", () => {
      activeAnswers[q.id] = option;
      saveExamDraft();
    });
    const span = document.createElement("span");
    span.textContent = option;
    label.append(input, span);
    return label;
  }

  function renderMobileExamQuestion(form) {
    const total = activeQuestions.length;
    const index = Math.min(Math.max(mobileExamIndex, 0), Math.max(total - 1, 0));
    mobileExamIndex = index;
    const q = activeQuestions[index];
    if (!q) return;
    const shell = document.createElement("section");
    shell.className = "m-exam-shell";
    const top = document.createElement("div");
    top.className = "m-exam-top";
    const counter = document.createElement("strong");
    counter.textContent = "שאלה " + (index + 1) + " מתוך " + total;
    const topic = document.createElement("span");
    topic.textContent = q.topic;
    top.append(counter, topic);
    const progress = document.createElement("div");
    progress.className = "m-exam-progress";
    const bar = document.createElement("span");
    bar.style.width = Math.round(((index + 1) / total) * 100) + "%";
    progress.append(bar);
    const card = document.createElement("article");
    card.className = "question-card exam-question m-exam-question";
    const h = document.createElement("h2");
    h.textContent = q.question;
    const answers = document.createElement("div");
    answers.className = "answer-list m-exam-answers";
    q.shuffledOptions.forEach((option) => answers.append(renderOption(q, option)));
    card.append(h, answers);
    const controls = document.createElement("div");
    controls.className = "m-exam-controls m-exam-controls--p1";
    const grid = document.createElement("button");
    grid.className = "btn secondary";
    grid.type = "button";
    grid.textContent = "מפת שאלות";
    grid.addEventListener("click", openQuestionGrid);
    const mark = document.createElement("button");
    mark.className = markedQuestions.has(q.id) ? "btn is-marked" : "btn secondary";
    mark.type = "button";
    mark.textContent = markedQuestions.has(q.id) ? "מסומן לחזרה" : "סמן לחזרה";
    mark.addEventListener("click", () => {
      if (markedQuestions.has(q.id)) markedQuestions.delete(q.id);
      else markedQuestions.add(q.id);
      saveExamDraft();
      renderExam();
    });
    const back = document.createElement("button");
    back.className = "btn secondary";
    back.type = "button";
    back.textContent = "חזור";
    back.disabled = index === 0;
    back.addEventListener("click", () => { mobileExamIndex -= 1; saveExamDraft(); renderExam(); });
    const next = document.createElement("button");
    next.className = "btn";
    next.type = index === total - 1 ? "submit" : "button";
    next.textContent = index === total - 1 ? "סיים מבחן" : "הבא";
    if (index < total - 1) next.addEventListener("click", () => { mobileExamIndex += 1; saveExamDraft(); renderExam(); });
    controls.append(grid, mark, back, next);
    shell.append(top, progress, card, controls);
    form.append(shell);
  }

  function renderDesktopExam(form) {
    activeQuestions.forEach((q, index) => {
      const card = document.createElement("article");
      card.className = "question-card exam-question";
      const h = document.createElement("h2");
      h.textContent = "שאלה " + (index + 1) + " · " + q.topic;
      const p = document.createElement("p");
      p.textContent = q.question;
      const answers = document.createElement("div");
      answers.className = "answer-list";
      q.shuffledOptions.forEach((option) => answers.append(renderOption(q, option)));
      card.append(h, p, answers);
      form.append(card);
    });
    const submit = document.createElement("button");
    submit.className = "btn";
    submit.type = "submit";
    submit.textContent = "סיים מבחן";
    form.append(submit);
  }

  function renderExam() {
    const form = document.getElementById("examForm");
    if (!form) return;
    form.replaceChildren();
    if (!activeQuestions.length) return;
    if (isMobileExam()) renderMobileExamQuestion(form);
    else renderDesktopExam(form);
  }

  async function saveAttempt(attempt) {
    const attempts = getAttempts();
    attempts.push(attempt);
    saveAttempts(attempts);
    localStorage.setItem("safetyCourse:lastExamAttempt", JSON.stringify(attempt));
    window.CourseStorage?.recordExamStats?.(attempt);
    if (window.CourseAuth?.saveExamAttempt) await window.CourseAuth.saveExamAttempt(attempt);
  }

  async function finishExam(event) {
    event.preventDefault();
    if (!activeQuestions.length) return;
    const wrong = [];
    let correct = 0;
    const answers = activeQuestions.map((q) => {
      const selected = activeAnswers[q.id] || "";
      const ok = selected === q.correctAnswer;
      if (ok) correct += 1;
      else {
        wrong.push({ question: q.question, selected, correct: q.correctAnswer, explanation: q.explanation, topic: q.topic });
        if (window.CourseStorage?.recordMistake) {
          window.CourseStorage.recordMistake({
            questionId: q.id,
            lessonId: q.relatedLessonId || "",
            topic: q.topic || "",
            question: q.question,
            correct: q.correctAnswer,
            chosen: selected,
          });
        }
      }
      return { id: q.id, selected, correctAnswer: q.correctAnswer, isCorrect: ok };
    });
    const total = activeQuestions.length;
    const score = Math.round((correct / total) * 100);
    const attempt = {
      attemptId: "attempt-" + Date.now(),
      userId: window.CourseAuth?.profile?.uid || "",
      topic: currentTopicLabel(),
      score,
      correctCount: correct,
      wrongCount: total - correct,
      totalQuestions: total,
      answers,
      createdAt: new Date().toISOString(),
    };
    await saveAttempt(attempt);
    clearExamDraft();
    renderResult(attempt, wrong);
    renderSummary();
  }

  function buildScoreRing(score) {
    const wrap = document.createElement("div");
    wrap.className = "score-ring " + (score >= 80 ? "is-high" : score >= 60 ? "is-mid" : "is-low");
    wrap.style.setProperty("--score", String(score));
    wrap.innerHTML = ''
      + '<svg viewBox="0 0 100 100">'
      +   '<circle class="ring-bg" cx="50" cy="50" r="42" pathLength="100"/>'
      +   '<circle class="ring-fg" cx="50" cy="50" r="42" pathLength="100" stroke-dasharray="' + score + ' 100"/>'
      + '</svg>'
      + '<div class="score-num">' + score + '%</div>';
    return wrap;
  }

  function renderResult(attempt, wrong) {
    const box = document.getElementById("examResult");
    box.replaceChildren();
    box.classList.add("m-exam-result-ready");
    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.gap = "1rem";
    head.style.alignItems = "center";
    head.style.flexWrap = "wrap";
    head.append(buildScoreRing(attempt.score));
    const headText = document.createElement("div");
    const title = document.createElement("h2");
    title.style.margin = "0";
    title.textContent = "ציון: " + attempt.score + "%";
    const meta = document.createElement("p");
    meta.style.margin = ".25rem 0 0";
    meta.textContent = "נכונות: " + attempt.correctCount + " | שגויות: " + attempt.wrongCount + " | סהכ: " + attempt.totalQuestions;
    headText.append(title, meta);
    head.append(headText);
    box.append(head);
    if (wrong.length) {
      const h = document.createElement("h3");
      h.textContent = "שאלות שבהן טעית";
      box.append(h);
      wrong.forEach((item) => {
        const details = document.createElement("details");
        details.open = true;
        const summary = document.createElement("summary");
        summary.textContent = item.topic + " · " + item.question;
        const p = document.createElement("p");
        p.textContent = "בחרת: " + (item.selected || "לא נבחרה תשובה") + " | תשובה נכונה: " + item.correct;
        const exp = document.createElement("p");
        exp.textContent = item.explanation;
        details.append(summary, p, exp);
        box.append(details);
      });
    }
    const again = document.createElement("button");
    again.className = "btn";
    again.type = "button";
    again.textContent = "נסה שוב";
    again.addEventListener("click", startExam);
    box.append(again);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTopicSelect();
    renderSummary();
    document.getElementById("startExam")?.addEventListener("click", startExam);
    document.getElementById("startSimulation")?.addEventListener("click", () => {
      const topic = document.getElementById("examTopic");
      const count = document.getElementById("examCount");
      if (topic) topic.value = ALL_TOPICS;
      if (count) count.value = "60";
      startExam();
    });
    document.getElementById("examForm")?.addEventListener("submit", finishExam);
  });
})();

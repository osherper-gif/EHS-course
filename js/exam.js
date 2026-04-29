(function () {
  const ATTEMPTS_KEY = "safetyCourse:examAttempts";
  const ALL_TOPICS = "כל הנושאים";
  const LESSON_ONLY = "__lesson__";
  let activeQuestions = [];
  let activeAnswers = {};
  let activeLessonFilter = "";

  const shuffle = (items) => items.map((value) => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map((item) => item.value);
  const getAttempts = () => JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || "[]");
  const saveAttempts = (attempts) => localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  const questions = () => window.EXAM_QUESTIONS || [];

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
    const topic = document.getElementById("examTopic").value;
    const count = document.getElementById("examCount").value;
    const pool = selectedPool(topic);
    activeQuestions = shuffle(pool).slice(0, count === "all" ? pool.length : Number(count)).map((q) => ({ ...q, shuffledOptions: shuffle(q.options) }));
    activeAnswers = {};
    renderExam();
    document.getElementById("examResult").replaceChildren();
  }

  function renderExam() {
    const form = document.getElementById("examForm");
    form.replaceChildren();
    activeQuestions.forEach((q, index) => {
      const card = document.createElement("article");
      card.className = "question-card exam-question";
      const h = document.createElement("h2");
      h.textContent = "שאלה " + (index + 1) + " · " + q.topic;
      const p = document.createElement("p");
      p.textContent = q.question;
      const answers = document.createElement("div");
      answers.className = "answer-list";
      q.shuffledOptions.forEach((option) => {
        const label = document.createElement("label");
        label.className = "exam-answer";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = q.id;
        input.value = option;
        input.addEventListener("change", () => activeAnswers[q.id] = option);
        const span = document.createElement("span");
        span.textContent = option;
        label.append(input, span);
        answers.append(label);
      });
      card.append(h, p, answers);
      form.append(card);
    });
    const submit = document.createElement("button");
    submit.className = "btn";
    submit.type = "submit";
    submit.textContent = "סיים מבחן";
    form.append(submit);
  }

  async function saveAttempt(attempt) {
    const attempts = getAttempts();
    attempts.push(attempt);
    saveAttempts(attempts);
    localStorage.setItem("safetyCourse:lastExamAttempt", JSON.stringify(attempt));
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
      else wrong.push({ question: q.question, selected, correct: q.correctAnswer, explanation: q.explanation, topic: q.topic });
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
    renderResult(attempt, wrong);
    renderSummary();
  }

  function renderResult(attempt, wrong) {
    const box = document.getElementById("examResult");
    box.replaceChildren();
    const title = document.createElement("h2");
    title.textContent = "ציון: " + attempt.score + "%";
    const meta = document.createElement("p");
    meta.textContent = "נכונות: " + attempt.correctCount + " | שגויות: " + attempt.wrongCount + " | סהכ: " + attempt.totalQuestions;
    box.append(title, meta);
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
    document.getElementById("examForm")?.addEventListener("submit", finishExam);
  });
})();

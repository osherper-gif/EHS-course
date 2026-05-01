(function () {
  const AI_ASSISTANT_TEMPORARILY_DISABLED = true;

  function lastExamAnswer() {
    try {
      const attempt = JSON.parse(localStorage.getItem("safetyCourse:lastExamAttempt") || "null");
      if (!attempt) return "לא מצאתי מידע על מבחן אחרון.";
      const wrong = (attempt.answers || []).filter((answer) => !answer.isCorrect).length;
      return "במבחן האחרון קיבלת " + attempt.score + "%. תשובות נכונות: " + attempt.correctCount + ", טעויות: " + wrong + ".";
    } catch {
      return "לא מצאתי מידע על מבחן אחרון.";
    }
  }
  function examPromptAnswer(question) {
    const q = String(question || "");
    if (/טעיתי|טעויות|מבחן אחרון/.test(q)) return lastExamAnswer();
    const topics = Array.from(new Set((window.EXAM_QUESTIONS || []).map((item) => item.topic)));
    const topic = topics.find((item) => q.includes(item)) || (q.includes("גובה") ? "עבודה בגובה" : q.includes("חשמל") ? "חשמל" : "");
    if ((q.includes("שאל אותי") || q.includes("תן לי מבחן")) && topic) {
      const items = (window.EXAM_QUESTIONS || []).filter((item) => item.topic === topic).slice(0, 5);
      if (!items.length) return "";
      return "הנה שאלות בנושא " + topic + ":\n" + items.map((item, index) => (index + 1) + ". " + item.question).join("\n") + "\n\nלמבחן מלא עבור לעמוד שאלות למבחן.";
    }
    return "";
  }
  function answer(question) {
    const examAnswer = examPromptAnswer(question);
    if (examAnswer) return examAnswer;
    const results = window.CourseSearch.search(question);
    const fallback = window.COURSE_DATA?.meta?.aiFallback || "לא מצאתי תשובה מספקת בהידע המקצועי או בהרחבות האתר.";
    if (!results.length) return fallback;
    const top = results[0];
    if (top.score < 1 || top.snippet.length < 40) return fallback;
    return "מצאתי במאגר הידע המקומי: " + top.title + ". " + top.snippet + "\n\nתחום: " + top.type + ".";
  }
  function addMessage(log, text, role) {
    const div = document.createElement("div");
    div.className = "message " + role;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }
  function initAssistant() {
    if (AI_ASSISTANT_TEMPORARILY_DISABLED) return;
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");
    const log = document.getElementById("chatLog");
    if (!form || !input || !log) return;
    addMessage(log, "שלום. אשיב רק על בסיס ידע מקצועי בתחום הבטיחות וההרחבות המסומנות באתר.", "assistant");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const question = input.value.trim();
      if (!question) return;
      addMessage(log, question, "user");
      addMessage(log, answer(question), "assistant");
      input.value = "";
    });
  }
  window.CourseAssistant = { answer, initAssistant };
})();

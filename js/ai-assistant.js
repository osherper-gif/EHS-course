(function () {
  function answer(question) {
    const results = window.CourseSearch.search(question);
    if (!results.length) return "לא מצאתי תשובה בחומר הקורס";
    const top = results[0];
    return "מצאתי בחומר הקורס: " + top.title + ". " + top.snippet + "\n\nמקור: " + top.type + ".";
  }
  function addMessage(log, text, role) {
    const div = document.createElement("div");
    div.className = "message " + role;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }
  function initAssistant() {
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");
    const log = document.getElementById("chatLog");
    if (!form || !input || !log) return;
    addMessage(log, "שלום. אשיב רק מתוך חומר הקורס המקומי.", "assistant");
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
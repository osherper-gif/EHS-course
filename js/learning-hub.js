(function () {
  function metric(value, label) {
    const item = document.createElement("div");
    item.className = "metric";
    const strong = document.createElement("strong");
    strong.textContent = value;
    const span = document.createElement("span");
    span.textContent = label;
    item.append(strong, span);
    return item;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const box = document.getElementById("learningReviewSummary");
    if (!box) return;
    const attempts = JSON.parse(localStorage.getItem("safetyCourse:examAttempts") || "[]");
    box.replaceChildren();
    if (!attempts.length) {
      box.append(metric("-", "ציון אחרון"), metric("0", "ניסיונות"), metric("-", "טעויות אחרונות"), metric("-", "נושא אחרון"));
      return;
    }
    const last = attempts[attempts.length - 1];
    const wrong = Number(last.wrongCount || 0);
    box.append(
      metric(String(last.score || 0) + "%", "ציון אחרון"),
      metric(String(attempts.length), "ניסיונות"),
      metric(String(wrong), "טעויות אחרונות"),
      metric(last.topic || "כל הנושאים", "נושא אחרון")
    );
  });
})();

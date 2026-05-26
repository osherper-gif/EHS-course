(function () {
  "use strict";

  const root = document.getElementById("prepQuizApp");
  if (!root) return;

  const quizId = root.dataset.prepQuiz || "lesson-08-safety-organization";
  const storageKey = "ehsPrepQuiz:" + quizId;

  const questions = [
    ["מי האחראי העליון על פי חוק ארגון הפיקוח על העבודה לכתיבת תוכנית בטיחות במפעל?", ["מפקח עבודה אזורי", "ועדת הבטיחות במפעל", "תופש המפעל, בסיוע ממונה הבטיחות", "נאמן הבטיחות בלבד"], 2, "האחריות הפלילית והניהולית היא של תופש המפעל."],
    ["מהו התפקיד המרכזי של נאמן בטיחות?", ["נציג עובדים המסייע בזיהוי ודיווח על מפגעים", "לתקן מכונות תקולות באופן עצמאי", "לחתום על היתרי עבודה בגובה", "להחליף את המנכ״ל בהיעדרו"], 0, "נאמן הבטיחות הוא עיניים ואוזניים בשטח, לא מחליף למנהל או לממונה."],
    ["מה משמעות המונח PPE?", ["תוכנית לניהול איכות", "ניתוח סיבות שורש", "היתר עבודה באש", "ציוד מגן אישי"], 3, "PPE הוא Personal Protective Equipment."],
    ["באיזה מקרים חלה חובה להקים ועדת בטיחות?", ["רק אם מפקח עבודה דרש זאת בכתב", "במפעלים המעסיקים 25 עובדים ומעלה", "בכל מפעל עם עובד אחד לפחות", "ועדה היא וולונטרית בלבד"], 1, "זו דרישה סטטוטורית לפי היקף עובדים."],
    ["מהו ערך TLV?", ["תדירות בדיקת מטפים", "ערך סף חשיפה תעסוקתית מותרת למזהם", "זמן ביצוע עבודה מותר", "רשימת תפוצה של תאונות"], 1, "TLV מתייחס לסף חשיפה תעסוקתית."],
    ["מי מוסמך לאשר כניסה לחלל מוקף?", ["מזכירת המפעל", "אין צורך באישור", "כל עובד בעל רישיון נהיגה", "אדם כשיר שמונה לכך לאחר בדיקת אטמוספירה וקיום נוהל"], 3, "חלל מוקף דורש פרוטוקול בטיחות מחמיר."],
    ["מהו LOTO?", ["שיטת צביעת צינורות", "סוג מנוף הרמה", "נעילה ותיוג של מקורות אנרגיה למניעת הפעלה בשוגג", "שיטת עבודה בגובה"], 2, "LOTO מונע הפעלה בלתי צפויה בזמן עבודה."],
    ["מהו היתר עבודה PTW?", ["טופס בקשת חופשה", "מסמך שמאפשר עבודה ללא PPE", "אישור רשמי לביצוע עבודות מסוכנות", "אישור להפעלת רכב מפעל"], 2, "PTW הוא כלי בקרה לעבודות מסוכנות."],
    ["מהי המטרה העיקרית של סקר סיכונים?", ["להעביר זמן עד המבדק הבא", "זיהוי מפגעים והערכת הסיכון", "למצוא עובדים שלא עובדים נכון", "לחסוך בתקציב קצר טווח"], 1, "סקר סיכונים הוא הבסיס לניהול בטיחות."],
    ["מהו הציוד המגן הנדרש בעבודה עם רעש מעל 85 dBA?", ["אטמי אוזניים או אוזניות מגן", "כפפות עור", "משקפי מגן", "מסיכת אבק"], 0, "נדרשת הגנה על השמיעה בהתאם לחשיפה."],
    ["מהו ההבדל המרכזי בין Leading ל-Lagging Indicators?", ["Leading מודדים פציעות", "Leading מנבאים מוכנות ו-Lagging מודדים תוצאה היסטורית", "Lagging הם תמיד הטובים ביותר", "אין הבדל"], 1, "Leading מאפשרים מניעה לפני תאונה."],
    ["מדוע Just Culture חשובה בארגון?", ["כדי להעניש בקלות", "כדי לאפשר דיווח Near Miss ללא פחד ולמידה", "כי זה נראה טוב במבדקי ISO בלבד", "כי זה מוריד ביטוח"], 1, "בלי שקיפות ודיווח אי אפשר ללמוד."],
    ["מצא את הטענה השגויה", ["תוכנית בטיחות צריכה להתעדכן", "ממונה בטיחות חייב השתלמויות תקופתיות", "ועדת בטיחות פוטרת את המעסיק מגידור", "תופש המפעל אחראי לאכיפת הוראות בטיחות"], 2, "ועדה אינה פוטרת מדרישות פקודת הבטיחות."],
    ["מהי מטרת RCA?", ["למצוא את האשם", "למצוא סיבה שורשית כדי למנוע הישנות", "לכתוב דו״ח ביטוח בלבד", "לסיים חקירה מהר"], 1, "RCA מטפל בשורש הבעיה."],
    ["כיצד Operational Drift משפיע על בטיחות?", ["משפר בטיחות", "אין השפעה", "עוזר למצוא פתרונות מהירים", "שוחק בטיחות בהדרגה עד רמת תאונה"], 3, "סטייה מנהלים הופכת לנורמה מסוכנת."],
    ["מהי אחריות ממונה בטיחות בעת גילוי ליקוי מסוכן?", ["להסתיר מידע", "להודיע למנהל ואם לא תוקן לפעול לפי נהלי הדיווח", "לתקן בעצמו את המכונה", "להתעלם"], 1, "הממונה חייב להתריע, לייעץ ולדווח לפי נוהל."],
    ["לפי ISO 45001, מהי פעולה מתקנת CAPA?", ["הענשת העובד", "החלפת כל העובדים", "תיקון טכני זמני בלבד", "פעולה למניעת הישנות על ידי טיפול בגורם שורש"], 3, "CAPA סוגרת מעגל ניהולי מבוסס נתונים."],
    ["מה יתרון בקרה הנדסית על PPE?", ["היא מסירה סיכון מהמקור בעוד PPE תלוי בהתנהגות אדם", "PPE זול יותר", "הנדסה נראית טוב יותר", "אין יתרון"], 0, "בקרה במקור עדיפה בהיררכיית הבקרות."],
    ["מהי מטרת BEI בגיהות תעסוקתית?", ["מדידת רעש", "ניטור רמת מזהם בגוף העובד", "בדיקת איכות אוויר", "רשימת מלאי"], 1, "BEI הוא מדד חשיפה ביולוגי."],
    ["מכונת הרמה ללא תסקיר בתוקף — מה המשמעות?", ["מותר אם המפעיל ותיק", "תקין אם המכונה עובדת", "אין חובה אם המכונה חדשה", "עבירה על החוק וסכנה בטיחותית"], 3, "תסקיר תקף הוא חובה לציוד הרמה רלוונטי."],
    ["מה אחריות המעסיק אם ממונה הבטיחות לא התריע?", ["פטור מאחריות", "עדיין נושא באחריות עליונה", "אחראי רק לתקציב", "אחראי רק לדיווח ביטוח"], 1, "האחריות אינה עוברת לממונה."],
    ["מה חשיבות One-Point-Lesson?", ["לא חשובה", "העברת ידע מהיר וממוקד בנושא בטיחותי אחד", "הענשת עובדים", "בדיקת שעות נוספות"], 1, "זה כלי למידה קצר וממוקד לשטח."],
    ["מהו הצעד הראשון בניהול אירוע בטיחותי?", ["דו״ח למשטרה", "עצירת האירוע, עזרה ראשונה ואבטחת הזירה", "התקשרות לעורך דין", "ניקוי ראיות"], 1, "בטיחות חיים קודמת לכל."],
    ["מתי יש לבצע רענון הדרכת בטיחות?", ["אחת ל-10 שנים", "לפני עובד חדש, שינוי טכנולוגי, או לפחות פעם בשנה", "רק אחרי תאונה", "אין חובה"], 1, "ידע בטיחות חייב להתעדכן לפי שינוי וסיכון."],
    ["כיצד ISO 45001 מתייחס להשתתפות עובדים?", ["עובדים אינם רלוונטיים", "מחייב שיתוף והתייעצות פעילה", "רק מנהלים משתתפים", "מיועד רק למשרדים"], 1, "העובדים הם מקור מידע קריטי."],
    ["מהו עיקרון ALARP?", ["עבודה בכל מחיר", "צמצום סיכונים לרמה נמוכה ככל שניתן באופן סביר", "עבודה ללא מנעולים", "התעלמות מסיכונים קטנים"], 1, "ALARP מאזנת בין סיכון לאמצעי סביר."],
    ["מה היתרון המרכזי של RCA?", ["מציאת אדם לפיטורים", "הבנת כשל מערכתי ומניעת חזרתו", "הקטנת קנס", "אין יתרון"], 1, "RCA נועד ללמידה ומניעה."],
    ["מדוע פיצוצי אבק הרסניים?", ["הם מייצרים רעש", "שטח הפנים העצום של האבק יוצר תגובת שרשרת אלימה", "הם לא הרסניים", "הם גורמים לחלודה"], 1, "אבק דליק יכול ליצור תערובת נפיצה."],
    ["מה הבעיה בגישת ״העובד אשם״?", ["מונעת למידה וטיפול בבעיות מערכתיות", "מאוד מוסרית", "חוסכת כסף", "לא בעייתית"], 0, "האשמה חוסמת שיפור אמיתי."],
    ["מהו הרכיב הקריטי להצלחת מערכת ניהול בטיחות?", ["תקציב אינסופי", "מחויבות הנהלה בכירה ודוגמה אישית", "מצלמות בלבד", "ריבוי טפסים"], 1, "בלי הנהלה מחויבת, המערכת נשארת על הנייר."]
  ].map((item, index) => ({
    id: "lesson08-q" + String(index + 1).padStart(2, "0"),
    question: item[0],
    options: item[1],
    correctIndex: item[2],
    rationale: item[3],
    trap: "בדוק האם התשובה מעבירה אחריות לאדם הלא נכון, מסתפקת בטופס, או מדלגת על בקרה במקור."
  }));

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveState(state) {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  let state = loadState();
  let revealAll = false;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function stats() {
    const answered = Object.keys(state).filter((id) => state[id] !== undefined);
    const correct = answered.filter((id) => {
      const q = questions.find((item) => item.id === id);
      return q && state[id] === q.correctIndex;
    });
    return { answered: answered.length, correct: correct.length };
  }

  function render() {
    root.replaceChildren();
    const summary = stats();
    const toolbar = el("div", "prep-quiz-toolbar");
    toolbar.append(
      el("strong", "", summary.answered + " / " + questions.length + " נענו"),
      el("span", "", summary.correct + " נכונות"),
      button("גלה תשובות", () => { revealAll = !revealAll; render(); }, "secondary"),
      button("אפס תרגול", () => {
        if (!window.confirm("לאפס את התרגול המקומי?")) return;
        state = {};
        saveState(state);
        render();
      }, "secondary")
    );
    root.append(toolbar);

    const list = el("div", "prep-question-list");
    questions.forEach((question, questionIndex) => list.append(questionCard(question, questionIndex)));
    root.append(list);
  }

  function button(text, onClick, variant) {
    const control = el("button", "btn " + (variant || "primary"), text);
    control.type = "button";
    control.addEventListener("click", onClick);
    return control;
  }

  function questionCard(question, questionIndex) {
    const selected = state[question.id];
    const answered = selected !== undefined;
    const showFeedback = answered || revealAll;
    const card = el("article", "prep-question-card");
    card.append(el("h3", "", (questionIndex + 1) + ". " + question.question));
    const options = el("div", "prep-options");
    question.options.forEach((option, optionIndex) => {
      const label = el("label", "prep-option");
      if (showFeedback && optionIndex === question.correctIndex) label.classList.add("is-correct");
      if (answered && optionIndex === selected && selected !== question.correctIndex) label.classList.add("is-wrong");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = question.id;
      input.checked = selected === optionIndex;
      input.addEventListener("change", () => {
        state[question.id] = optionIndex;
        saveState(state);
        render();
      });
      label.append(input, el("span", "", option));
      options.append(label);
    });
    card.append(options);
    if (showFeedback) {
      const feedback = el("div", "prep-feedback " + (selected === question.correctIndex || revealAll ? "is-correct" : "is-wrong"));
      feedback.append(
        el("strong", "", selected === question.correctIndex ? "נכון" : revealAll && !answered ? "תשובה מוצגת" : "לא נכון"),
        el("p", "", question.rationale),
        el("p", "field-help", "Trap: " + question.trap)
      );
      card.append(feedback);
    }
    return card;
  }

  render();
})();

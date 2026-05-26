(function () {
  "use strict";

  const workspace = document.getElementById("templateFormWorkspace");
  const cards = Array.from(document.querySelectorAll(".professional-card"));
  if (!workspace || !cards.length) return;

  const templates = [
    {
      id: "risk-assessment",
      title: "סקר סיכונים",
      rowsLabel: "סיכונים ופעולות",
      fields: [
        ["department", "שם מחלקה / אתר"],
        ["activity", "תהליך / פעילות"],
        ["hazard", "גורם סיכון"],
        ["scenario", "תרחיש פגיעה"],
        ["probability", "הסתברות"],
        ["severity", "חומרה"],
        ["riskLevel", "רמת סיכון"],
        ["controls", "אמצעי בקרה קיימים"],
        ["correctiveAction", "פעולה מתקנת"],
        ["owner", "אחראי"],
        ["dueDate", "תאריך יעד", "date"]
      ]
    },
    {
      id: "incident-investigation",
      title: "תחקיר תאונה או כמעט תאונה",
      rowsLabel: "ממצאי תחקיר",
      fields: [
        ["eventDate", "תאריך ושעה", "datetime-local"],
        ["location", "מקום האירוע"],
        ["description", "תיאור האירוע", "textarea"],
        ["injured", "נפגעים"],
        ["immediateCause", "גורם מיידי", "textarea"],
        ["rootCauses", "גורמי שורש", "textarea"],
        ["correctiveActions", "פעולות מתקנות", "textarea"],
        ["owner", "אחראי"],
        ["closureDate", "תאריך סגירה", "date"]
      ]
    },
    {
      id: "annual-safety-plan",
      title: "תוכנית בטיחות שנתית",
      rowsLabel: "יעדים ופעולות",
      fields: [
        ["goal", "יעד בטיחות"],
        ["plannedAction", "פעולה מתוכננת", "textarea"],
        ["owner", "אחראי"],
        ["dueDate", "תאריך יעד", "date"],
        ["status", "סטטוס"],
        ["successMetric", "מדד הצלחה"]
      ]
    },
    {
      id: "periodic-inspections",
      title: "בדיקות תקופתיות",
      rowsLabel: "פריטים לבדיקה",
      fields: [
        ["item", "פריט / מתקן"],
        ["frequency", "תדירות בדיקה"],
        ["inspector", "בודק מוסמך / גורם אחראי"],
        ["lastCheck", "תאריך בדיקה אחרון", "date"],
        ["nextCheck", "תאריך בדיקה הבא", "date"],
        ["status", "סטטוס"],
        ["notes", "הערות", "textarea"]
      ]
    },
    {
      id: "pre-task-review",
      title: "סקר מקדים",
      rowsLabel: "תנאי הפעלה",
      fields: [
        ["change", "פעילות חדשה / שינוי", "textarea"],
        ["expectedRisks", "סיכונים צפויים", "textarea"],
        ["legalRequirements", "דרישות חוק ותקן", "textarea"],
        ["approvers", "מי נדרש לאשר"],
        ["activationConditions", "תנאים להפעלה", "textarea"],
        ["permits", "האם נדרש PTW / LOTO / הדרכה"]
      ]
    },
    {
      id: "medical-exams",
      title: "רשימת עובדים לבדיקות רפואיות",
      rowsLabel: "עובדים למעקב",
      fields: [
        ["employeeName", "שם עובד"],
        ["role", "תפקיד"],
        ["exposure", "גורם חשיפה"],
        ["examType", "סוג בדיקה נדרש"],
        ["lastExam", "תאריך בדיקה אחרון", "date"],
        ["dueDate", "תאריך יעד לבדיקה", "date"],
        ["status", "סטטוס"]
      ]
    }
  ];

  let activeTemplate = templates[0];

  function storageKey(template) {
    return "ehsTemplateForm:" + template.id;
  }

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function loadValues(template) {
    try {
      return JSON.parse(localStorage.getItem(storageKey(template)) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveValues(template) {
    const values = {};
    workspace.querySelectorAll("[data-template-field]").forEach((field) => {
      values[field.dataset.templateField] = field.value;
    });
    localStorage.setItem(storageKey(template), JSON.stringify(values));
  }

  function fieldControl(field, value) {
    const [name, label, type = "text"] = field;
    const wrap = createElement("label", "template-field");
    wrap.append(createElement("span", "", label));
    const control = type === "textarea" ? createElement("textarea") : createElement("input");
    if (type !== "textarea") control.type = type;
    control.dataset.templateField = name;
    control.value = value || "";
    wrap.append(control);
    return wrap;
  }

  function renderTemplate(template) {
    activeTemplate = template;
    const values = loadValues(template);
    workspace.replaceChildren();

    const panel = createElement("section", "template-form-panel");
    panel.dataset.templateId = template.id;

    const head = createElement("div", "template-form-head");
    const titleWrap = createElement("div");
    titleWrap.append(
      createElement("p", "kicker", "טופס HTML למילוי"),
      createElement("h2", "", template.title),
      createElement("p", "template-local-note", "המידע נשמר מקומית בדפדפן בלבד. אין שמירה בענן ואין שליחה לשרת.")
    );
    const actions = createElement("div", "template-form-actions");
    actions.append(
      button("הורד HTML", () => downloadHtml(template)),
      button("הדפס", () => printTemplate()),
      button("נקה טופס", () => clearTemplate(template), "secondary")
    );
    head.append(titleWrap, actions);

    const form = createElement("form", "template-fillable-form");
    form.addEventListener("input", () => saveValues(template));
    template.fields.forEach((field) => form.append(fieldControl(field, values[field[0]])));
    panel.append(head, form);
    workspace.append(panel);
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function button(text, onClick, variant) {
    const control = createElement("button", "btn " + (variant || "primary"), text);
    control.type = "button";
    control.addEventListener("click", onClick);
    return control;
  }

  function safeFileName(value) {
    return value.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "-");
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function collectRows(template) {
    return template.fields.map(([name, label]) => {
      const field = workspace.querySelector("[data-template-field='" + name + "']");
      return [label, field ? field.value : ""];
    });
  }

  function standaloneHtml(template) {
    const rows = collectRows(template).map(([label, value]) => (
      "<tr><th>" + escapeHtml(label) + "</th><td>" + escapeHtml(value).replace(/\n/g, "<br>") + "</td></tr>"
    )).join("");
    return "<!doctype html><html lang=\"he\" dir=\"rtl\"><head><meta charset=\"utf-8\"><title>" +
      escapeHtml(template.title) +
      "</title><style>body{font-family:Arial,sans-serif;direction:rtl;margin:32px;color:#102033}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:12px;vertical-align:top;text-align:right}th{width:30%;background:#eef5f8}h1{margin:0 0 16px}.note{color:#52616f}@media print{body{margin:12mm}}</style></head><body><h1>" +
      escapeHtml(template.title) +
      "</h1><p class=\"note\">טופס עצמאי שנוצר באתר קורס ממונה בטיחות. יש לאמת מול הדין, הנהלים והגורמים המוסמכים.</p><table><tbody>" +
      rows +
      "</tbody></table></body></html>";
  }

  function downloadHtml(template) {
    saveValues(template);
    const blob = new Blob([standaloneHtml(template)], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = safeFileName(template.title) + "-" + date + ".html";
    document.body.append(link);
    link.click();
    URL.revokeObjectURL(link.href);
    link.remove();
  }

  function printTemplate() {
    document.body.classList.add("template-print-mode");
    window.print();
    setTimeout(() => document.body.classList.remove("template-print-mode"), 500);
  }

  function clearTemplate(template) {
    if (!window.confirm("לנקות את הטופס המקומי?")) return;
    localStorage.removeItem(storageKey(template));
    renderTemplate(template);
  }

  function enhanceCards() {
    cards.forEach((card, index) => {
      const template = templates[index];
      if (!template) return;
      const actions = createElement("div", "template-card-actions");
      actions.setAttribute("data-read-aloud-exclude", "true");
      actions.append(
        button("פתח טופס", () => renderTemplate(template)),
        button("הורד HTML", () => {
          renderTemplate(template);
          downloadHtml(template);
        }, "secondary"),
        button("הדפס", () => {
          renderTemplate(template);
          printTemplate();
        }, "secondary"),
        button("נקה טופס", () => clearTemplate(template), "secondary")
      );
      card.append(actions);
    });
  }

  enhanceCards();
})();

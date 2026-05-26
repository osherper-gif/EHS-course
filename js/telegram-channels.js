(function () {
  function clean(value) {
    return String(value || "").trim();
  }

  function createOption(channel) {
    const option = document.createElement("option");
    option.value = channel.id;
    option.textContent = channel.title;
    return option;
  }

  function statusLabel(status) {
    if (status === "active") return "פעיל";
    if (status === "planned") return "מתוכנן";
    return "בבדיקה";
  }

  function renderTelegramJoin(root) {
    const channels = Array.isArray(window.TELEGRAM_PUBLIC_CHANNELS)
      ? window.TELEGRAM_PUBLIC_CHANNELS
      : [];
    if (!channels.length) {
      root.hidden = true;
      return;
    }

    root.replaceChildren();
    root.hidden = false;

    const card = document.createElement("article");
    card.className = "telegram-join-card";

    const head = document.createElement("div");
    head.className = "telegram-join-head";
    const titleWrap = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = "הצטרפות לערוץ טלגרם";
    const intro = document.createElement("p");
    intro.textContent = "בחר ערוץ הכנה לפי הקורס שלך. ההודעות מותאמות למסלול הלימודים.";
    titleWrap.append(title, intro);
    head.append(titleWrap);

    const form = document.createElement("div");
    form.className = "telegram-join-form";

    const label = document.createElement("label");
    const labelText = document.createElement("span");
    labelText.textContent = "ערוץ זמין";
    const select = document.createElement("select");
    select.setAttribute("aria-label", "בחירת ערוץ טלגרם");
    channels.forEach((channel) => select.append(createOption(channel)));
    label.append(labelText, select);

    const action = document.createElement("button");
    action.type = "button";
    action.className = "btn";

    const details = document.createElement("p");
    details.className = "telegram-join-details";

    const status = document.createElement("p");
    status.className = "telegram-join-status";
    status.setAttribute("role", "status");

    const contact = document.createElement("p");
    contact.className = "telegram-join-contact";
    const contactText = document.createElement("span");
    contactText.textContent = "לומדים במוסד אחר? ניתן ליצור קשר לפתיחת ערוץ מותאם לפי מסלול הלימוד.";
    const contactLink = document.createElement("a");
    contactLink.href = "mailto:osherper@gmail.com";
    contactLink.textContent = "צור קשר";
    contact.append(contactText, " ", contactLink);

    function selectedChannel() {
      return channels.find((channel) => channel.id === select.value) || channels[0];
    }

    function sync() {
      const channel = selectedChannel();
      details.textContent =
        clean(channel.description) + " · סטטוס: " + statusLabel(channel.status);
      action.textContent = channel.telegramUrl ? "הצטרף לערוץ" : "הערוץ ייפתח בקרוב";
      action.disabled = !channel.telegramUrl;
      status.textContent = channel.telegramUrl
        ? ""
        : "הערוץ טרם פעיל. ניתן לפנות לבקשת פתיחה מוקדמת.";
    }

    select.addEventListener("change", sync);
    action.addEventListener("click", () => {
      const channel = selectedChannel();
      if (!channel.telegramUrl) {
        status.textContent = "הערוץ טרם פעיל. ניתן לפנות לבקשת פתיחה מוקדמת.";
        return;
      }
      window.open(channel.telegramUrl, "_blank", "noopener");
    });

    form.append(label, action);
    card.append(head, form, details, status, contact);
    root.append(card);
    sync();
  }

  function initTelegramJoin() {
    document.querySelectorAll("[data-telegram-channels-root]").forEach(renderTelegramJoin);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTelegramJoin);
  } else {
    initTelegramJoin();
  }
})();

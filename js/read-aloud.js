(function () {
  "use strict";

  const storageKey = "ehsReadAloudPrefs";
  const widgetId = "readAloudWidget";
  const unsupportedMessage = "הדפדפן הזה אינו תומך בהקראה מובנית.";
  const excludedSelector = [
    ".proto-sidebar",
    ".proto-context-rail",
    ".site-header",
    ".site-footer",
    ".app-topbar",
    ".proto-topbar",
    ".read-aloud-widget",
    ".learner-test-tools",
    "#progress-debug-panel",
    "#progress-check-result-panel",
    ".auth-debug-list",
    "nav",
    "button",
    "script",
    "style",
    "[hidden]",
    "[aria-hidden='true']",
  ].join(",");

  if (document.getElementById(widgetId)) return;

  const speech = window.speechSynthesis;
  const isSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  let currentUtterance = null;
  let voices = [];
  let prefs = loadPrefs();

  function loadPrefs() {
    try {
      return Object.assign({ rate: 1, voiceURI: "", scope: "page" }, JSON.parse(localStorage.getItem(storageKey) || "{}"));
    } catch (error) {
      return { rate: 1, voiceURI: "", scope: "page" };
    }
  }

  function savePrefs(nextPrefs) {
    prefs = Object.assign({}, prefs, nextPrefs);
    localStorage.setItem(storageKey, JSON.stringify(prefs));
  }

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function createButton(text, action, label) {
    const button = createElement("button", "read-aloud-btn", text);
    button.type = "button";
    button.dataset.readAction = action;
    button.setAttribute("aria-label", label || text);
    return button;
  }

  function buildWidget() {
    const widget = createElement("section", "read-aloud-widget");
    widget.id = widgetId;
    widget.setAttribute("aria-label", "כלי הקראה");

    const header = createElement("div", "read-aloud-header");
    header.append(createElement("strong", "", "הקראה"));
    const status = createElement("span", "read-aloud-status", isSupported ? "מוכן" : unsupportedMessage);
    status.id = "readAloudStatus";
    header.append(status);

    const controls = createElement("div", "read-aloud-controls");
    controls.append(
      createButton("הקרא", "read", "הקרא את התוכן"),
      createButton("השהה", "pause", "השהה הקראה"),
      createButton("המשך", "resume", "המשך הקראה"),
      createButton("עצור", "stop", "עצור הקראה")
    );

    const settings = createElement("div", "read-aloud-settings");
    const scopeLabel = createElement("label");
    scopeLabel.textContent = "מה להקריא";
    const scopeSelect = createElement("select");
    scopeSelect.id = "readAloudScope";
    scopeSelect.innerHTML = '<option value="page">כל העמוד</option><option value="section">הסעיף הנוכחי</option>';
    scopeSelect.value = prefs.scope || "page";
    scopeLabel.append(scopeSelect);

    const rateLabel = createElement("label");
    rateLabel.textContent = "מהירות";
    const rateSelect = createElement("select");
    rateSelect.id = "readAloudRate";
    ["0.8", "0.9", "1", "1.1", "1.2"].forEach((value) => {
      const option = createElement("option", "", value);
      option.value = value;
      rateSelect.append(option);
    });
    rateSelect.value = String(prefs.rate || 1);
    rateLabel.append(rateSelect);

    const voiceLabel = createElement("label");
    voiceLabel.textContent = "קול";
    const voiceSelect = createElement("select");
    voiceSelect.id = "readAloudVoice";
    voiceLabel.append(voiceSelect);

    settings.append(scopeLabel, rateLabel, voiceLabel);
    widget.append(header, settings, controls);

    widget.addEventListener("click", handleAction);
    scopeSelect.addEventListener("change", () => savePrefs({ scope: scopeSelect.value }));
    rateSelect.addEventListener("change", () => savePrefs({ rate: Number(rateSelect.value) || 1 }));
    voiceSelect.addEventListener("change", () => savePrefs({ voiceURI: voiceSelect.value }));

    document.body.append(widget);
    refreshVoices();
    return widget;
  }

  function refreshVoices() {
    const select = document.getElementById("readAloudVoice");
    if (!select || !isSupported) return;
    voices = speech.getVoices().filter((voice) => /^he\b/i.test(voice.lang) || /Hebrew|עברית/i.test(voice.name));
    const allVoices = voices.length ? voices : speech.getVoices();
    select.innerHTML = '<option value="">ברירת מחדל</option>';
    allVoices.forEach((voice) => {
      const option = createElement("option", "", `${voice.name} (${voice.lang})`);
      option.value = voice.voiceURI;
      select.append(option);
    });
    select.value = prefs.voiceURI || "";
  }

  function handleAction(event) {
    const button = event.target.closest("[data-read-action]");
    if (!button) return;
    const action = button.dataset.readAction;
    if (action === "read") read();
    if (action === "pause") pause();
    if (action === "resume") resume();
    if (action === "stop") stop();
  }

  function setStatus(text) {
    const status = document.getElementById("readAloudStatus");
    if (status) status.textContent = text;
  }

  function getRoot() {
    return document.querySelector("[data-readable-content]") || document.querySelector("[data-read-aloud-root]") || document.querySelector("main") || document.body;
  }

  function getCurrentSection(root) {
    const focusedSection = document.activeElement?.closest?.("section, article, main");
    if (focusedSection && root.contains(focusedSection) && !focusedSection.matches(excludedSelector)) return focusedSection;

    const candidates = Array.from(root.querySelectorAll("section, article")).filter((node) => !node.matches(excludedSelector));
    if (!candidates.length) return root;
    const viewportCenter = window.innerHeight / 2;
    return candidates
      .map((node) => ({ node, distance: Math.abs(node.getBoundingClientRect().top - viewportCenter) }))
      .sort((a, b) => a.distance - b.distance)[0].node;
  }

  function collectText() {
    const root = getRoot();
    const scope = document.getElementById("readAloudScope")?.value || prefs.scope || "page";
    const source = scope === "section" ? getCurrentSection(root) : root;
    const clone = source.cloneNode(true);
    clone.querySelectorAll(excludedSelector).forEach((node) => node.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  function read() {
    if (!isSupported) {
      setStatus(unsupportedMessage);
      return;
    }
    const text = collectText();
    if (!text) {
      setStatus("לא נמצא תוכן לימודי להקראה.");
      return;
    }
    stop();
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = "he-IL";
    currentUtterance.rate = Number(document.getElementById("readAloudRate")?.value || prefs.rate || 1);
    const selectedVoiceURI = document.getElementById("readAloudVoice")?.value || prefs.voiceURI;
    const selectedVoice = speech.getVoices().find((voice) => voice.voiceURI === selectedVoiceURI);
    if (selectedVoice) currentUtterance.voice = selectedVoice;
    currentUtterance.onstart = () => setStatus("מקריא...");
    currentUtterance.onpause = () => setStatus("מושהה");
    currentUtterance.onresume = () => setStatus("ממשיך...");
    currentUtterance.onend = () => setStatus("הסתיים");
    currentUtterance.onerror = () => setStatus("ההקראה הופסקה או אינה זמינה.");
    speech.speak(currentUtterance);
  }

  function pause() {
    if (isSupported && speech.speaking && !speech.paused) speech.pause();
  }

  function resume() {
    if (isSupported && speech.paused) speech.resume();
  }

  function stop() {
    if (isSupported) speech.cancel();
    currentUtterance = null;
    setStatus("מוכן");
  }

  buildWidget();
  if (isSupported) {
    speech.addEventListener?.("voiceschanged", refreshVoices);
    window.setTimeout(refreshVoices, 250);
  }
  window.addEventListener("beforeunload", stop);
})();

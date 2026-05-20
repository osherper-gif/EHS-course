# UI Modern Learning Experience — Audit

**Branch:** `codex/adaptive-dashboard-production-polish`
**Date:** 2026-05-20
**Scope:** Audit only. No code changes in this report.

מטרת הדוח: למפות איפה ה-UI הכי "סטטי" / לא-נעים, אילו רכיבים חוזרים על עצמם, איפה ה-CSS מסתבך בלי צורך, ומה אסור לגעת בו. בסוף — תוכנית עבודה מדורגת.

---

## 1. מצב כללי — מה כבר טוב

* יש Design Tokens מסודרים ב-`:root` של `css/styles.css` (lines 1-26): `--brand`, `--accent`, `--ok`, `--warn`, `--danger`, `--surface`, `--border`, `--shadow`, `--shadow-hover`, `--radius-sm/md/lg/pill`.
* יש Dark Theme (`html[data-theme="dark"]`) ב-line 169.
* יש `prefers-reduced-motion` ב-line 208.
* יש Skip Link ב-`a.skip-link` (a11y).
* יש Bottom Mobile Nav (`.m-bottom-nav`) שמופעלת מתחת ל-1024px (line 3353+) — מובייל-first חלקי.
* `tag-info`, `tag-ok`, `tag-warn`, `tag-danger`, `tag-accent`, `tag-neutral` מסודרים.
* יש `card-modern`, `nav-hub-card`, `continue-card`, `next-action-chip`, `metric-modern` עם hover states ו-transitions עדינות (line 1124-1225).
* Callouts (`callout-exam`, `callout-mistake`, `callout-summary`, `callout-tip`, `callout-ok`) — סגנון אחיד.

---

## 2. אזורים שהכי דורשים שיפור UI

### 2.1. Homepage `index.html` — Hero "סטטי" עקב שכבות overrides מצטברות

**Source of pain:** Hero ראשי בעמוד הבית הוא `<section class="hero-modern">` (index.html line 39). ה-class הזה מוגדר 3 פעמים ב-`css/styles.css`:

| מיקום | מהות |
|---|---|
| line 978 | הגדרה ראשונית — grid 1.4fr/1fr, padding 1.75-3rem, gradient ברקע, כותרת clamp(2rem,4vw,3.2rem). |
| line 5942 | פסקה "EXTRA COMPACT" #1 — `max-height` לא הוגבל, padding 2rem 1.5rem, h1 ב-clamp(1.55,3vw,1.9rem). |
| line 6097-6211 | **"EXTRA COMPACT HERO"** — `display:flex`, `max-height:120px`, padding 16px 20px, h1 1.3rem/600. מבטל סופית את ה-hero המודרני. |

**תוצאה:** ה-hero מצטמצם ל-pill בגובה 120px במקום להיות "נוכחות פתיחה". זאת התחושה ה"סטטית" שהמשתמש מתאר.

**כיוון:** לבטל / לעקוף את שכבת ה-EXTRA COMPACT ב-homepage (לשמור לעמודי lesson/game שמשתמשים בה אולי לדעת), לתת ל-hero של דף הבית גובה אוויר ראוי ב-desktop וב-mobile.

### 2.2. Homepage — Lesson Cards עם `<progress>` גולמי

ב-`index.html` line 268 וכו', כל lesson-card מסיים ב-`<progress max="100" value="0" data-progress="lesson-XX"></progress>` — קומפוננטה native של דפדפן ללא עיצוב מודרני. נראית בולטת ב-IE-style גם ב-Chrome.

**כיוון:** styling של `progress[data-progress]` עם track + bar בגוון ה-brand, גובה 6-8px, radius pill, ו-completed state. ה-DOM וה-JS לא משתנים.

### 2.3. `pages/syllabus.html` — דף סופר-מינימליסטי

זה אחד הדפים החשובים (`syllabus` = תוכנית לימוד), והוא בנוי כ-`<table class="data-table">` בלבד. אין כרטיסיות, אין ויזואל. לעומת זאת בעמוד הבית יש lesson-cards מעוצבים. דיסוננס חוויתי.

**כיוון:** להוסיף אבסטרקציה (CSS scoped ל-`.syllabus-page`) שמציג את ה-table עם שורה-ככרטיסייה, status-pill, ו-link מסומן. בלי לשנות את ה-HTML — רק styling. (אופציה ב': להוסיף ניתוב CSS שמטמיע כרטיסיות; HTML יכול להישאר באותו table.)

### 2.4. `pages/my-progress.html` — דשבורד יבש

יש לו `.learner-dashboard-hero` עם gradient נקי ו-`.learner-dashboard-card` — קונספט טוב, אבל:

* אין progress ring/visual element. הכל טקסט.
* `learner-topic-list` הוא `<ul>` רגיל עם bullet — לא card chips.
* טבלאות `progress-topic-stats-table` ו-`progress-difficulty-stats-table` בלי styling מודרני.

**כיוון:** טבלאות עם data-table-modern, רשימות נושאים כ-chips צבעוניים לפי דיוק (>=80% ירוק, 50-80% צהוב, <50% אדום), badge "התקדמות" בכרטיס המתאים.

### 2.5. `pages/quizzes.html` — info-cards כפולים + hub-cards

קיים `<div class="ui-modern-only">` עם שני `info-card` (line 38-53), ובו inline styles (style="background:#d4edda...") — קוד styling מעורבב בתוך HTML. זה גם בעיית מיינטיינביליות.

**כיוון:** להעביר את ה-inline styles ל-CSS scoped (`.difficulty-chip-easy/medium/hard`). ה-DOM נשאר.

### 2.6. Header/navigation — חוסר shadow-on-scroll + צפיפות

`site-header` הוא `sticky top:0` עם `border-bottom: 1px solid var(--border)` בלבד. כשגוללים, לא מובחן מהתוכן.

**כיוון:** להוסיף shadow עדין מאוד שמופעל בגלילה (CSS-only עם `@supports` או JS קל ב-`accessibility.js` שכבר עושה DOM events).

ב-mobile (≤860px) ה-header-actions עם `overflow-x: auto` — סיכון לגלילה אופקית מקומית שנראית מוזרה. צריך לוודא 390px עובד.

### 2.7. Lesson cards — Hover state טוב, אבל ה-`<progress>` חוטף את הזרקור

כבר יש `transform: translateY(-2px)` ו-`box-shadow: var(--shadow-hover)` ב-line 1729-1731. החיסרון: ה-`<progress>` הגולמי שובר את "ההרגשה המודרנית" שהכרטיס מעלה.

### 2.8. `admin.html` — admin-mini-stats עם 11 metric cards ברציפות

ב-admin הכותרת ראויה אבל יש 11 כרטיסי `metric-modern` בשורה (line 39-50) — צפיפות גבוהה, lookup קשה. צריך grouping/legend.

**כיוון:** קיבוץ ל-2-3 sub-groups (משתמשים / פעילות / מבחנים+דיווחים) דרך wrappers ב-CSS בלבד אם אפשר. (כן ייתכן שיהיה צורך לעטוף ב-divs אם אי-אפשר ב-CSS Grid לבד — נחליט בשלב 4.)

---

## 3. רכיבי UI חוזרים שכדאי לאחד

| רכיב | מופיע ב- | בעיה | כיוון |
|---|---|---|---|
| `site-header` | כל העמודים | מועתק inline בכל קובץ HTML | לא לעגן עכשיו (אין build system); רק לוודא שה-CSS scoped של כל שיפור חל על כולם. |
| `page-hero` | quizzes, exam-questions, syllabus, admin | מצטמצם ל-120px בגלל EXTRA COMPACT — נראה דומה לרצועת notice יותר מ-hero. | shared polish: גובה אוויר עדין יותר, kicker badge מוקפד. |
| `hub-grid`/`hub-card` | quizzes, exam-questions, field-tools | יש hover ב-line 1731-1732 — שמורה. שווה לחזק icon visual. | חיזוק card-icon ו-kicker pill. |
| `metric-modern` | index, admin | OK. צריך לוודא קריאות number→label ב-`prefers-reduced-motion`. | קל. |
| `data-table` | syllabus, admin, exam-result | חלק עם styling מודרני (`.data-table-modern`), חלק בלי. | להחיל `.data-table` modernization on the syllabus table דרך selector scoped. |
| Inline styles ב-`<span style="background:#d4edda...">` | quizzes, exam-questions | inline color, פוגע ב-dark-theme | להעביר ל-CSS עם `.diff-chip-easy/medium/hard` שמשתמשים ב-tokens. |

---

## 4. בעיות mobile / RTL

### Mobile (390px)

* **Header actions overflow:** `.header-actions { overflow-x:auto }` ב-≤860px (line 558) — יכול ליצור scroll סקלר אופקי קטן. צריך לבדוק שלא בועט בנגישות.
* **Hero compact:** ב-≤720px ה-hero יורד ל-padding 1.5rem/1rem (line 6213+), זה עדיין רוחב יותר נורמלי. אבל ה-hero-graphic מוסתר ב-≤820px (line 1032) — OK.
* **Dashboard-grid:** מוגדר `repeat(4, minmax(0, 1fr))`. ב-≤820px יורד ל-1 (line 334). זה אומר 8 metric cards אחד-תחת-שני - long scroll. אפשרי להגדיר 2 cols בין 420-820.
* **Lesson grid:** 2 cols ל-1 col ב-≤820. OK.
* **`.exam-summary`** עובר ל-2 cols ב-≤860px (line 571) — OK.
* **Tables ב-my-progress:** `.learner-dashboard table { min-width: 560px }` ב-720px+. הטבלה תיפוצף scroll אופקי על 390px. יש `.table-wrap { overflow-x: auto }` (line 126-128) — מציל את הפריסה. OK.
* **`.main-nav`** wrap rows על mobile — צפיפות כפתורי 6 קישורים. שווה לבדוק 390px.

### RTL

* `dir="rtl"` על `<html>` בכל עמוד. ✓
* כל ה-padding/margin מבוססי `inline-start`/`inline-end` — לוגיקה ב-CSS תקינה.
* גלים אופקיים: לוודא ש-`overflow-x: auto` ב-headers וטבלאות לא מתנגש עם `dir=rtl`.

---

## 5. מה אסור לגעת בו

### לוגיקה (לא לשנות):

* `js/auth.js` (Auth flow — Firebase Auth)
* `js/firebase-config.js` (Firebase config)
* `firestore.rules` (Firestore rules)
* `js/progress-telemetry.js` (Telemetry write/read)
* `js/progress-tracking-check.js` (Progress check ל-my-progress)
* `js/exam.js`, `js/exam-loader.js`, `js/quizzes.js` — scoring + question flow logic
* `js/protected-auth-check.js` — protected questions guard
* `data/exam-questions.js`, `data/course-data.js`, `data/site-versions.js` (תוכן + adaptive logic)
* `data/protected-*` (אם קיים)
* `pages/lesson-*.html` — תוכן לימודי
* `pages/protected-auth-check.html`, `pages/progress-tracking-check.html` (DOM שה-JS תופס)

### Hosting / Deploy (לא לשנות):

* `firebase.json` הקיים (לדעת שמופץ עם `public:"."`).
* `.firebaserc` — target staging/default.

### קישורים קיימים — לא לשנות `href=` על קישורים פנימיים אם אין סיבה ויזואלית מובהקת. שינוי `class=`/`data-*` ב-CSS-only הוא מותר אם ה-JS לא נשען על ה-class הספציפי. במידת הספק — לא לגעת.

### JS — מותר לגעת רק ב:

* `js/home.js` — UI rendering לוגיקה לעמוד הבית (next-actions, what's new). שינויים קוסמטיים בלבד.
* `js/quiz-ui.js`, `js/lesson-ui.js` — קישוטים בלבד (animations, classes), לא scoring.
* `js/accessibility.js` — מותר להוסיף focus management עדין; לא להסיר קיים.

**עיקרון:** אם משנים JS, רצים `node --check` לפני commit. אם משנים CSS — אין `--check`, אז זה הכי בטוח.

---

## 6. תוכנית עבודה בשלבים

### שלב A — Polish CSS minimal (תיגע רק ב-`css/styles.css` בסוף הקובץ)

**מטרה:** רוויח את ההרגשה המודרנית בלי לשנות DOM/JS.

1. **Section reveal עדין** — CSS-only `@keyframes` `fadeUp` עם `animation-delay`. רק על אלמנטים שלא קריטיים (`.content-section`, `.nav-hub-card`, `.metric-modern`) ובכבוד ל-`prefers-reduced-motion`.
2. **Hero polish ל-homepage בלבד** — selector ספציפי `body[data-page-title="דף הבית"] .hero-modern` או `body > main:first-of-type > .hero-modern:first-child` שמבטל את ה-EXTRA COMPACT שהורסת.
3. **`<progress>` styling** — ב-WebKit + Mozilla עם styling brand. גובה 6px, radius pill, brand color.
4. **Lesson card polish** — קצת padding נוסף, kicker color tweak, hover shadow רך יותר. (ה-transition כבר קיים.)
5. **Header scroll shadow** — CSS `[data-scrolled]` או JS micro: שורה ב-`accessibility.js` שמוסיפה class בגלילה.
6. **Difficulty chips ל-quizzes / exam-questions** — להוציא inline styles. (נטרל את ה-inline styles ב-HTML ל-class). זה דורש HTML edit מינימלי.

### שלב B — my-progress polish

1. Progress ring CSS לעמוד `.learner-dashboard` (אופציונלי SVG inline שכבר קיים בעמוד אחר).
2. Topic chips צבעוניים לפי דיוק.
3. Modernization של `progress-topic-stats-table` עם `.data-table-modern` או class חדש scoped.

### שלב C — Syllabus polish

1. CSS scoped ל-`body.syllabus-page .syllabus-table` שמציג שורות-ככרטיסיות (`display:block` + `flex` items per row) ב-desktop+mobile, או `display:grid` עם `card` styling. לא ב-HTML.

### שלב D — Header micro

1. Sticky shadow מותנה גלילה.
2. Active link mark ברור יותר ב-`a[aria-current="page"]`.

### שלב E — Admin sectioning

(אופציונלי לפעם הבאה) — grouping של admin-mini-stats לקבוצות 3-4-4.

### עצירה לפי הפרומט: לבצע שלב **A** מינימלי בלבד עכשיו, **לא** redesign מלא. שלב B/C/D נשמרים לפעם הבאה אלא אם המשתמש מבקש.

---

## 7. בדיקות לאחר השלב

* `npm.cmd run check:links`
* `node --check js/auth.js` (לא משנים אך מוודאים שלא נשבר)
* `node --check js/quizzes.js`
* `node --check js/exam.js`
* `node --check js/progress-telemetry.js`
* `node --check js/progress-tracking-check.js`
* אם נגענו ב-`accessibility.js`: `node --check js/accessibility.js`
* ידני: 390px (Chrome DevTools), 1280px, dark mode, RTL flow, focus-visible, no console errors.

---

## 8. החלטות אריכטקטוניות

* **לא** להוסיף build system / postcss / tailwind / vendor lib.
* **לא** לטעון CDN חדש.
* **כן** להישען על `:root` tokens.
* CSS חדש ייוסף בסוף `css/styles.css` תחת header brand `/* === UI MODERN LEARNING EXPERIENCE — START === */` כדי שיהיה קל להחזיר אחורה ב-`git diff`/revert.
* כל overrides עם specificity מינימלי (לא `!important` אלא אם חייבים לבטל EXTRA COMPACT).

---

## 9. דברים שצריך בדיקה ידנית אחרי השלב

* Login flow — לחיצה על Google → אישור → mainsite (לא נגענו ב-auth.js, אבל ה-hero של login.html כן יכול להיות מושפע מ-CSS overrides).
* guest quizzes (ללא login) — `pages/quizzes.html` בלי signin.
* guest simulation — `pages/exam-questions.html#simulation`.
* my-progress רק למחוברים.
* admin (רק לאדמין) — admin.html.
* Dark mode toggle.
* Mobile bottom nav (≤1023px).

---

**סוף דוח Audit.** המשך לשלב B (`UI implementation מינימלי`).

# Modular Learning Platform Architecture

## 1. Vision

המערכת כבר אינה רק אתר עבור קורס ממונה בטיחות. היא הפכה לשכבת פלטפורמה מודולרית ללמידה מבוקרת מקור, שבה הקורס הוא המימוש הראשון ולא גבול הארכיטקטורה.

הפלטפורמה נועדה לאפשר בנייה של עולמות ידע מקצועיים שבהם כל תוכן יכול להיות מחובר למקור, לציטוט, לנושא, לשיעור, לשאלה, לתרגול ולמצב למידה. המטרה היא לא רק להציג חומר לימודי, אלא לייצר מערכת שבה ניתן לדעת:

- מאיפה הגיע הידע.
- מה רמת הסמכות שלו.
- לאיזה נושא ושיעור הוא שייך.
- האם הוא חומר לימודי, תקן, מקור משפטי או דגש מבחן.
- אילו שאלות ותרגולים נשענים עליו.
- מה הלומד כבר יודע ועל מה צריך לחזור.

בעתיד ניתן להשתמש באותם Blocks כדי לבנות קורסים נוספים, מערכות נהלים, הדרכות עובדים, בסיסי ידע ארגוניים, שכבות ציות, סימולציות, מערכות מבחן, ועוזרי AI מבוססי מקור.

## 2. Current Implemented Blocks

### Source Registry

**Purpose:** רישום יציב של כל מקורות הידע והסמכות. מגדיר מקור באמצעות `stableSourceId`, metadata, hash, סוג מקור, רמת סמכות וסטטוס אימות.

**Inputs:** קבצי מקור, סריקת מקורות, file metadata, hashes, source type, jurisdiction, language.

**Outputs:** רשימת מקורות יציבה שניתן להפנות אליה מכל שכבת תוכן.

**Dependencies:** Source scanner, registry review, authority classification.

### Citation Registry

**Purpose:** יצירת שכבת Traceability מדויקת ממקור אל locator בתוך המקור: סעיף חוק, סעיף תקן, כותרת, עמוד, טבלה או פסקה.

**Inputs:** Source Registry, stable source IDs, locators, labels, citation metadata.

**Outputs:** `citationId` יציב שמאפשר לקשר Knowledge Blocks, Questions ו־Answers למיקום במקור.

**Dependencies:** Source Registry, authority rules, citation validation.

### Authority Validation

**Purpose:** Gate שמוודא שתוכן מחייב, תשובות מוסמכות, מספרי זהב ו־source-backed content אינם נשענים על references שבורים או על מקור לא מתאים.

**Inputs:** Source Registry, Citation Registry, Knowledge Items, Content Blocks, Questions, Golden Numbers, Topic/Lesson Maps.

**Outputs:** Validation Report עם PASS/FAIL, blocked items, warnings, self-test coverage.

**Dependencies:** Source Registry, Citation Registry, validators, governance rules.

### Knowledge Items

**Purpose:** שכבת ידע קטנה ומובנית עבור claims מקצועיים או מחייבים, לפני/בנוסף ל־Content Blocks.

**Inputs:** claims, sourceRefs, authority summary, verification metadata.

**Outputs:** Knowledge Items traceable שמוכיחים Source → Citation → Knowledge Item → Validation.

**Dependencies:** Source Registry, Citation Registry, Authority Validation.

### Content Blocks

**Purpose:** יחידת התוכן המרכזית של Knowledge Hub. מייצגת פסקה, דגש משפטי, דגש מבחן, ציטוט, checklist, warning, summary, definition או table מבלי להפוך Word ל־HTML גולמי.

**Inputs:** Source-backed content, citationId, sourceId, sourceCitation, blockType, topicIds, lessonIds, metadata, rendering intent.

**Outputs:** Structured learning blocks שניתן להציג, לחפש, לקבץ לנושאים ולחבר לשאלות.

**Dependencies:** Source Registry, Citation Registry, Presentation Rule, Authority Validation.

### Topic Mapping

**Purpose:** Taxonomy מקצועי שמקבץ Content Blocks ל־Root Domains, Sub Topics, aliases ו־related topics.

**Inputs:** Content Blocks, source domains, topicIds, aliases, relatedTopicIds, parentTopicId.

**Outputs:** מבנה נושאים שמאפשר Knowledge Hub עם drill-down במקום registry viewer.

**Dependencies:** Content Blocks, Topic Normalization, Lesson Mapping.

### Lesson Mapping

**Purpose:** שכבת חיבור בין Topics/Blocks לבין שיעורים, בלי לשנות את Learning Path עצמו.

**Inputs:** topicIds, blockIds, sourceIds, lesson IDs, lesson titles, coverage status.

**Outputs:** מיפוי Lesson → Domain → Topics → Content Blocks.

**Dependencies:** Topic Mapping, Learning Path Alignment, Content Blocks.

### Learning Path Alignment

**Purpose:** התאמת Knowledge Hub לתוכנית הלימודים הרשמית, כולל סיווג coverage לכל מפגש: FULL, PARTIAL או MISSING.

**Inputs:** learning-path-map, lesson-map, topic-map, official 58 lessons.

**Outputs:** תמונת כיסוי שמראה איזה ידע כבר מחובר לכל מפגש ומה חסר.

**Dependencies:** Lesson Mapping, Topic Mapping, Learning Path metadata.

### Question Governance

**Purpose:** מודל שאלות מבוקר מקור שמפריד בין שאלות תרגול, תשובות רשמיות, חומר לימודי ודגשי מבחן.

**Inputs:** question text, options, correct answer, explanation, topicIds, lessonIds, sourceRefs, answer provenance, exam facets.

**Outputs:** Question Bank traceable עם validator, self-test, deduplication pilot ו־governance rules לתשובות.

**Dependencies:** Source Registry, Citation Registry, Topic Mapping, Lesson Mapping, Question Validator.

### Practice Hub

**Purpose:** שכבת תרגול ללומד שמציגה שאלות בצורה נוחה, עם חיפוש, פילטרים, pagination, reveal answer mode, navigation labels ופרטי מקור אנושיים לאחר reveal.

**Inputs:** Question Bank, Topic Map, Lesson Map, learner filters/search.

**Outputs:** תרגול read-only/interactive קל, ללא scoring מלא וללא Quiz Engine.

**Dependencies:** Question Governance, Question Bank, Topic/Lesson labels, UI state.

### Learning State Engine

**Purpose:** Pilot לזיכרון למידה בסיסי: unknown, mastered, review. מאפשר ללומד לסמן “ידעתי” או “צריך חזרה” לאחר חשיפת תשובה.

**Inputs:** Question IDs, learner actions, local/session state.

**Outputs:** Dashboard קטן של mastered/review/unknown ופילטרים לפי מצב למידה.

**Dependencies:** Practice Hub, Reveal Answer Mode, localStorage/sessionStorage policy.

## 3. Future Blocks

### Quiz Engine

מנוע מבחן/תרגול מלא עם בחירת תשובות, session state, feedback, ניקוד, מצב timed/untimed וחוקי סיום.

### Simulation Engine

תרחישים מרובי שלבים עבור אירועי בטיחות, תחקור, הערכת סיכונים, בחירת בקרות וניהול חירום.

### Exam Layer

שכבת facets חוצת Topics ו־Lessons: examRelevant, examCritical, examTrap, legalBasisRequired, commonMistake, calculation ו־scenarioBased.

### Feynman Mode

מצב שבו הלומד מסביר נושא במילים שלו ומקבל feedback מובנה לפי המקורות והנושאים המחוברים.

### AI Tutor

עוזר למידה מבוסס מקור, שאינו ממציא תשובות ומוגבל ל־Source/Citation/Topic/Question governance.

### Spaced Repetition

שכבת תזמון חזרות לפי mastery, review state, קושי, exam facets ותאריך מבחן.

### Analytics Layer

ניתוח שימוש, נושאים קשים, שאלות שנכשלו, פערי כיסוי והתקדמות קבוצתית או אישית.

### Compliance Layer

שכבת ציות ארגונית: חובות הדרכה, דרישות רגולטוריות, evidence, audit trail ועדכוני מקור.

### Training Management

ניהול קבוצות, שיוך לומדים, מטלות, completion, dashboards למדריכים ודוחות.

### Certification Tracking

מעקב הסמכות, תוקף, חידוש, דרישות קדם, מסמכים ותיעוד עמידה בדרישות.

## 4. Block Dependency Diagram

```text
Source Registry
  ↓
Citation Registry
  ↓
Authority Validation
  ↓
Knowledge Items / Content Blocks
  ↓
Topic Mapping
  ↓
Lesson Mapping
  ↓
Learning Path Alignment
  ↓
Question Governance
  ↓
Practice Hub
  ↓
Learning State Engine
  ↓
Future Engines:
Quiz Engine → Simulation Engine → AI Tutor → Spaced Repetition
  ↓
Analytics / Compliance / Training Management / Certification Tracking
```

## 5. Reuse Scenarios

### קורס ממונה בטיחות

המימוש הראשון: מקורות רגולטוריים, תקנים, חומרי הדרכה, Knowledge Hub, Practice Hub, שאלות, תרגול ומצב למידה.

### מערכת נהלים

אפשר להפוך נהלים פנימיים ל־Source Registry, לקשר סעיפי נוהל ל־Content Blocks, לבנות שאלות כשירות ולתעד מי למד מה.

### הדרכות עובדים

ניתן לבנות מסלולי הדרכה לפי תפקיד, סיכון, אתר או מחלקה, עם שאלות תרגול, סימולציות ומעקב השלמה.

### ISO

תקנים כמו ISO 45001 יכולים לשמש Source Level 4, עם הבחנה ברורה בין תקן, חוק וחומר הדרכה.

### רגולציה

חוקים, תקנות, צווים והוראות רגולטור יכולים להיות שכבת source-backed שממנה נגזרים תוכן, שאלות, compliance ו־audit evidence.

### ציות

המערכת יכולה להפוך לשכבת Compliance שבה כל דרישה מקושרת למקור, לנוהל, להדרכה, לשאלה ולעדות ביצוע.

### ידע ארגוני

ניתן לנהל ידע מקצועי פנימי, lesson learned, תחקירים, best practices, תיעוד field guidance ו־AI Tutor ארגוני מוגבל מקור.

## 6. Current Maturity

### Knowledge Layer

**Maturity:** High pilot maturity.

Source Registry, Citation Registry, Content Blocks, Topic Mapping, Lesson Mapping ו־Authority Validation כבר קיימים ועובדים. נדרש המשך הרחבה, review workflow ו־admin tools.

### Question Layer

**Maturity:** Medium.

קיים Question Bank pilot עם validator, provenance, exam facets ו־viewer. נדרש migration רחב, dedupe מלא, authoring workflow ושילוב הדרגתי במאגרי השאלות הקיימים.

### Practice Layer

**Maturity:** Medium.

Practice Hub כולל חיפוש, פילטרים, pagination, reveal answer mode ו־learning state בסיסי. עדיין אין Quiz Engine, ניקוד, sessions או analytics.

### AI Layer

**Maturity:** Not implemented.

הארכיטקטורה מוכנה ל־AI grounded במקורות, אבל אין עדיין AI Tutor, Feynman Mode או guardrails runtime.

### Compliance Layer

**Maturity:** Early design.

ה־Source Governance מתאים לציות, אך אין עדיין training management, evidence, audit workflows או certification tracking.

## 7. Recommended Roadmap

### Phase 3 — Stabilize Learning Platform Core

- להרחיב Question Bank בהדרגה עם dedupe ו־answer provenance.
- להפריד בין Practice Hub לבין Quiz Engine.
- להוסיף author/reviewer workflow לתוכן, שאלות וציטוטים.
- להקשיח validation עבור placeholders, orphan mappings, raw IDs ו־authority misuse.
- להגדיר persistence model ל־learning state, bookmarks ו־progress.

### Phase 4 — Learning Engines

- לבנות Quiz Engine מלא עם session state, scoring ו־feedback.
- להוסיף Spaced Repetition על בסיס mastered/review/unknown.
- להוסיף Simulation Engine לתרחישי בטיחות.
- להתחיל Feynman Mode ו־AI Tutor רק לאחר grounding ו־governance ברורים.

### Phase 5 — Organizational Platform

- לבנות Compliance Layer עם דרישות, evidence ו־audit readiness.
- להוסיף Training Management לקבוצות, מדריכים, מטלות ודוחות.
- להוסיף Certification Tracking לתוקף הסמכות וחידושים.
- להוסיף Analytics Layer לשאלות קשות, פערי ידע, כיסוי נושאים והתקדמות.
- להכין את הפלטפורמה לריבוי קורסים, תחומים וארגונים.

## Architecture Guardrails

- הקורס הוא מימוש ראשון, לא hard-coded product boundary.
- כל תוכן מחייב חייב להישען על מקור וציטוט מתאימים.
- חומר הדרכה אינו חוק.
- תקן בינלאומי אינו חוק, אך הוא יכול להיות Best Practice או מחייב אם אומץ בהקשר מתאים.
- Registry terminology לא צריך להופיע ללומד רגיל.
- Question Governance ו־Knowledge Governance צריכים להישאר שכבות נפרדות אך מחוברות.
- AI עתידי חייב לקרוא משכבות governance ולא לעקוף אותן.

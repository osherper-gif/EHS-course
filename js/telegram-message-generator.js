(function () {
  const SITE_BASE_URL = "https://ehs-course.web.app";
  const COURSE_ID = "beer-hadrahot-safety-215";
  let schedulesLoadPromise = null;
  let previewRendered = false;

  const DEFAULT_PROFILE = {
    concepts: ["זיהוי סיכונים", "בקרות", "אחריות", "תיעוד"],
    questions: [
      "מה ממונה בטיחות צריך לבדוק לפני שהוא ממליץ על בקרה?",
      "איך מאזנים בין דרישות עבודה, אחריות מקצועית ושמירה על עובדים?"
    ],
    preparation: "עברו על סיכום השיעור באתר, סמנו מושגים לא ברורים והגיעו עם דוגמה אחת מהשטח או מהעבודה."
  };

  const TOPIC_PROFILES = [
    {
      keywords: ["עבודה בגובה", "פיגום", "בנייה", "עגורנאי", "עגורן"],
      concepts: ["עבודה בגובה", "אמצעי מניעה", "הדרכה", "אחריות אתר"],
      questions: [
        "האם היית עוצר עבודה בגלל עיגון לא תקין?",
        "מה האחריות שלך אם קבלן מסרב להשתמש ברתמה?"
      ],
      preparation: "חשבו על מצב שבו עבודה בגובה נראית שגרתית, אבל חסרה בה בקרה אחת קריטית."
    },
    {
      keywords: ["חשמל", "לוח חי", "רישוי חשמלאים"],
      concepts: ["עבודת חשמל", "ניתוק ובידוד", "נעילה ושילוט", "כשירות"],
      questions: [
        "האם מותר לעבוד תחת לחץ זמן בלוח חי?",
        "מתי חובה להשבית ציוד?"
      ],
      preparation: "בדקו מה ההבדל בין תקלה תפעולית לבין מצב שמחייב עצירת עבודה ובידוד מקור אנרגיה."
    },
    {
      keywords: ["חומרים מסוכנים", "חומ״ס", "דלקים", "תהליכים כימיים", "היתר רעלים"],
      concepts: ["חומרים מסוכנים", "SDS", "אחסון ושינוע", "תגובה לאירוע"],
      questions: [
        "האם ריח חריג מחייב עצירת עבודה?",
        "מה עושים כשאין SDS זמין?"
      ],
      preparation: "בחרו חומר מסוכן מוכר וחשבו איזה מידע חייב להיות זמין לפני שימוש, אחסון או שינוע."
    },
    {
      keywords: ["הגורם האנושי", "ארגונומיה", "שחיקה"],
      concepts: ["גורם אנושי", "תפיסת סיכון", "עייפות ושחיקה", "תרבות בטיחות"],
      questions: [
        "האם עובד ותיק מסוכן יותר או פחות?",
        "כיצד שחיקה משפיעה על בטיחות?"
      ],
      preparation: "נסו לזהות פעולה אחת שכולם רגילים לעשות, אבל בפועל היא יוצרת סיכון בגלל הרגל או לחץ זמן."
    },
    {
      keywords: ["מושגי יסוד", "תאונה", "מחלת מקצוע", "כמעט"],
      concepts: ["מפגע", "גורם סיכון", "כמעט תאונה", "זיהוי-הערכה-בקרה"],
      questions: [
        "איך מבחינים בין מפגע שניתן לסלק לבין סיכון שצריך לנהל לאורך זמן?",
        "מתי כמעט תאונה צריכה להוביל לשינוי בקרה ולא רק לתיעוד?"
      ],
      preparation: "הכינו דוגמה אחת למפגע, גורם סיכון וכמעט תאונה מאותו מקום עבודה."
    },
    {
      keywords: ["פיקוח", "פקודת הבטיחות", "חוק", "תקנות", "אישיות משפטית"],
      concepts: ["חוק ותקנה", "פיקוח על העבודה", "צו בטיחות", "אחריות משפטית"],
      questions: [
        "מה ההבדל בין דרישה משפטית לבין נוהל פנימי של הארגון?",
        "מתי נדרש להזהיר מנהלים ולא רק להמליץ מקצועית?"
      ],
      preparation: "רשמו לעצמכם דוגמה אחת להבדל בין חוק, תקנה, תקן ונוהל עבודה."
    },
    {
      keywords: ["תפקיד", "בעלי תפקידים", "מערך הבטיחות", "הנהלת"],
      concepts: ["אחריות מערכתית", "ממונה בטיחות", "מנהלים", "ועדת בטיחות"],
      questions: [
        "איפה עובר הגבול בין ייעוץ של ממונה בטיחות לבין אחריות מנהלים?",
        "איך מוודאים שהחלטת בטיחות באמת נסגרת בשטח?"
      ],
      preparation: "חשבו מי בארגון צריך להיות מעורב כאשר סיכון אחד חוצה כמה מחלקות."
    },
    {
      keywords: ["אש", "חירום", "עזרה ראשונה", "מקום מוקף"],
      concepts: ["תגובה ראשונית", "פינוי", "תרגול", "חילוץ"],
      questions: [
        "מתי אירוע קטן צריך להפוך להפעלת נוהל חירום?",
        "מה חייב להיות ברור לעובדים לפני אירוע ולא במהלכו?"
      ],
      preparation: "עברו בראש על סדר הפעולות הראשוני באירוע חירום: זיהוי, התרעה, בידוד, פינוי ודיווח."
    },
    {
      keywords: ["גהות", "רעש", "קרינה", "רפואה תעסוקתית", "ציוד מגן", "מעבדות", "חום", "קור"],
      concepts: ["חשיפה", "ניטור", "בדיקות רפואיות", "בקרה ומניעה"],
      questions: [
        "מתי חשיפה מתמשכת חשובה לא פחות מסיכון תאונתי מיידי?",
        "איזו בקרה עדיפה לפני שמסתפקים בציוד מגן אישי?"
      ],
      preparation: "בחרו גורם חשיפה אחד וחשבו איך מודדים אותו, איך מצמצמים אותו ואיך מתעדים טיפול."
    },
    {
      keywords: ["תכנית לניהול הבטיחות", "שיטות ניהול", "PDCA"],
      concepts: ["מדיניות בטיחות", "תוכנית עבודה", "מדדים", "שיפור מתמיד"],
      questions: [
        "איך הופכים מדיניות בטיחות לתוכנית עבודה מדידה?",
        "מה צריך לבדוק כדי לוודא שבקרה שהוגדרה באמת אפקטיבית?"
      ],
      preparation: "חשבו על יעד בטיחות אחד שאפשר למדוד, לבדוק ולשפר לאורך זמן."
    },
    {
      keywords: ["סיור מקצועי", "עבודת גמר", "מבחן גמר"],
      concepts: ["איסוף ממצאים", "שאלות למרצה", "יישום בשטח", "סיכום למידה"],
      questions: [
        "איזה ממצא מהשטח הייתם מתעדים כדי ללמוד ממנו?",
        "איזו שאלה מקצועית כדאי להביא למפגש כדי להפוך ידע ליישום?"
      ],
      preparation: "הכינו שתי שאלות קצרות מראש, ורשמו דוגמה אחת שמחברת בין החומר לבין מקום עבודה אמיתי."
    }
  ];

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatDate(value) {
    const date = new Date(String(value) + "T12:00:00");
    if (Number.isNaN(date.getTime())) return value || "מועד לא מעודכן";
    return pad(date.getDate()) + "/" + pad(date.getMonth() + 1) + "/" + date.getFullYear();
  }

  function lessonUrl(lesson) {
    if (!lesson?.siteLessonId) return SITE_BASE_URL + "/pages/syllabus.html";
    return SITE_BASE_URL + "/pages/" + encodeURIComponent(lesson.siteLessonId) + ".html";
  }

  function getTopicProfile(topic, siteLessonId) {
    const normalizedTopic = String(topic || "").toLowerCase();
    const byTopic = TOPIC_PROFILES.find((profile) =>
      profile.keywords.some((keyword) => normalizedTopic.includes(keyword.toLowerCase()))
    );
    if (byTopic) return byTopic;

    const byLesson = {
      "lesson-01": TOPIC_PROFILES[4],
      "lesson-02": TOPIC_PROFILES[5],
      "lesson-03": TOPIC_PROFILES[6],
      "lesson-05": TOPIC_PROFILES[0],
      "lesson-06": TOPIC_PROFILES[1],
      "lesson-07": TOPIC_PROFILES[2],
      "lesson-08": TOPIC_PROFILES[8],
      "lesson-09": TOPIC_PROFILES[3],
      "lesson-10": TOPIC_PROFILES[9],
      "lesson-11": TOPIC_PROFILES[7],
      "lesson-12": TOPIC_PROFILES[10]
    };
    return byLesson[siteLessonId] || DEFAULT_PROFILE;
  }

  function generateKeyConcepts(topic, siteLessonId) {
    return getTopicProfile(topic, siteLessonId).concepts;
  }

  function generateEthicalQuestions(topic, siteLessonId) {
    return getTopicProfile(topic, siteLessonId).questions;
  }

  function generatePreparationMessage(course, lesson) {
    const profile = getTopicProfile(lesson.topic, lesson.siteLessonId);
    const concepts = generateKeyConcepts(lesson.topic, lesson.siteLessonId);
    const questions = generateEthicalQuestions(lesson.topic, lesson.siteLessonId);
    const lessonNote = lesson.siteLessonId
      ? "מומלץ לעבור על השיעור באתר לפני המפגש."
      : "טרם קיים שיעור ייעודי באתר לנושא זה; מומלץ להשתמש בסילבוס ובחומר הקורס.";
    const reviewNote = lesson.needsReview
      ? "\nהערה פנימית לפני שימוש: מפגש זה מסומן כדורש אימות ידני קל."
      : "";

    return [
      "📘 הכנה לשיעור הבא - " + course.institutionName + " " + course.cohortName,
      "",
      "🧩 שיעור " + lesson.lessonNumber + ": " + lesson.topic,
      "📅 מועד: " + formatDate(lesson.date) + " (" + lesson.dayName + ")",
      "🕒 שעה: " + lesson.time,
      "",
      "🔎 מה נלמד?",
      "נכיר את הנושא המרכזי של המפגש ונחבר אותו לעבודת ממונה הבטיחות: זיהוי סיכונים, בחירת בקרות, אחריות, תיעוד ויישום בשטח.",
      "",
      "🧠 מושגים מרכזיים:",
      concepts.map((item) => "• " + item).join("\n"),
      "",
      "💭 שאלות חשיבה:",
      questions.map((item) => "• " + item).join("\n"),
      "",
      "✅ הכנה מומלצת:",
      profile.preparation || DEFAULT_PROFILE.preparation,
      lessonNote + reviewNote,
      "",
      "🔗 כניסה לשיעור:",
      lessonUrl(lesson)
    ].join("\n");
  }

  function generateReminderMessage(course, lesson) {
    return [
      "⏰ תזכורת לשיעור - " + course.institutionName + " " + course.cohortName,
      "",
      "היום נלמד: " + lesson.topic,
      "🕒 שעה: " + lesson.time,
      lesson.needsReview ? "דורש אימות ידני קל לפני שימוש אוטומטי." : "",
      "📍 הכנה קצרה באתר:",
      lessonUrl(lesson)
    ].filter(Boolean).join("\n");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      if (button) {
        const original = button.textContent;
        button.textContent = "הועתק";
        window.setTimeout(() => {
          button.textContent = original;
        }, 1400);
      }
    } catch (error) {
      window.prompt("העתיקו את ההודעה:", text);
    }
  }

  function downloadText(text, fileName) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function messageFileName(course, lesson, type) {
    const suffix = type === "prep" ? "preparation" : "reminder";
    return [
      "telegram",
      course.courseId || "course",
      lesson.id,
      suffix
    ].join("-") + ".txt";
  }

  function getFilteredLessons(course) {
    const search = document.getElementById("telegramTopicSearch")?.value.trim().toLowerCase() || "";
    const filter = document.getElementById("telegramFilter")?.value || "all";
    return course.lessons.filter((lesson) => {
      const matchesSearch = !search || String(lesson.topic).toLowerCase().includes(search);
      const matchesFilter =
        filter === "all" ||
        (filter === "needs-review" && lesson.needsReview) ||
        (filter === "with-site-lesson" && lesson.siteLessonId);
      return matchesSearch && matchesFilter;
    });
  }

  function getUpcomingLessons(course) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 7);
    return course.lessons.filter((lesson) => {
      const lessonDate = new Date(String(lesson.date) + "T12:00:00");
      return lessonDate >= today && lessonDate <= limit;
    });
  }

  function renderBadges(lesson) {
    return [
      '<span class="tag tag-info">מפגש ' + escapeHtml(lesson.lessonNumber) + '</span>',
      lesson.needsReview ? '<span class="tag tag-warning">דורש אימות</span>' : "",
      !lesson.siteLessonId ? '<span class="tag tag-muted">טרם קיים שיעור באתר</span>' : ""
    ].join("");
  }

  function renderMessageActions(type) {
    const label = type === "prep" ? "הכנה" : "תזכורת";
    const variant = type === "prep" ? "" : " secondary";
    return [
      '<button class="btn' + variant + '" type="button" data-copy="' + type + '">העתק ' + label + '</button>',
      '<button class="btn secondary" type="button" data-export="' + type + '">ייצא ל-TXT</button>'
    ].join("");
  }

  function renderLessonCard(course, lesson, compact = false) {
    const prep = generatePreparationMessage(course, lesson);
    const reminder = generateReminderMessage(course, lesson);
    const lessonHref = lessonUrl(lesson);
    const lessonLabel = lesson.siteLessonId ? "פתח שיעור" : "פתח סילבוס";
    return [
      '<article class="telegram-preview-card' + (compact ? " telegram-preview-card-compact" : "") + '" data-lesson-id="' + escapeHtml(lesson.id) + '">',
      '<div class="telegram-preview-head">',
      '<div><div class="telegram-badges">' + renderBadges(lesson) + '</div>',
      '<h2>' + escapeHtml(lesson.topic) + '</h2>',
      '<p>' + escapeHtml(formatDate(lesson.date) + " · " + lesson.dayName + " · " + lesson.time) + '</p></div>',
      '<a class="btn secondary" href="' + escapeHtml(lessonHref) + '" target="_blank" rel="noopener">' + lessonLabel + '</a>',
      '</div>',
      '<div class="telegram-message-grid">',
      '<section><h3>הודעת הכנה</h3><pre>' + escapeHtml(prep) + '</pre><div class="telegram-card-actions">' + renderMessageActions("prep") + '</div></section>',
      '<section><h3>תזכורת</h3><pre>' + escapeHtml(reminder) + '</pre><div class="telegram-card-actions">' + renderMessageActions("reminder") + '</div></section>',
      '</div>',
      '</article>'
    ].join("");
  }

  function updateSummary(course, visibleLessons) {
    const summary = document.getElementById("telegramSummary");
    if (!summary) return;
    const needsReview = course.lessons.filter((lesson) => lesson.needsReview).length;
    const linked = course.lessons.filter((lesson) => lesson.siteLessonId).length;
    summary.innerHTML = [
      '<span><strong>' + course.lessons.length + '</strong> מפגשים</span>',
      '<span><strong>' + needsReview + '</strong> דורשים אימות</span>',
      '<span><strong>' + linked + '</strong> מקושרים לשיעור באתר</span>',
      '<span><strong>' + visibleLessons.length + '</strong> מוצגים כרגע</span>'
    ].join("");
  }

  function renderUpcoming(course) {
    const container = document.getElementById("telegramUpcomingList");
    if (!container) return;
    const upcoming = getUpcomingLessons(course);
    container.innerHTML = upcoming.length
      ? upcoming.map((lesson) => renderLessonCard(course, lesson, true)).join("")
      : '<p class="empty-state">אין מפגשים ב-7 הימים הקרובים.</p>';
  }

  function renderPreview() {
    const select = document.getElementById("telegramCourseSelect");
    const list = document.getElementById("telegramLessonsList");
    if (!select || !list) return;

    const schedules = window.TELEGRAM_COURSE_SCHEDULES || {};
    const entries = Object.entries(schedules);
    select.innerHTML = entries.map(([id, course]) => (
      '<option value="' + escapeHtml(id) + '">' +
      escapeHtml(course.institutionName + " - " + course.courseName + " - " + course.cohortName) +
      '</option>'
    )).join("");

    function renderCourse() {
      const course = schedules[select.value];
      if (!course) {
        list.innerHTML = '<p class="empty-state">לא נמצאה תוכנית להצגה.</p>';
        return;
      }

      const note = document.getElementById("telegramSourceNote");
      if (note) note.textContent = course.sourceNote || "מצב תצוגה מקדימה בלבד. אין שליחה בפועל.";

      const visibleLessons = getFilteredLessons(course);
      updateSummary(course, visibleLessons);
      renderUpcoming(course);
      list.innerHTML = visibleLessons.length
        ? visibleLessons.map((lesson) => renderLessonCard(course, lesson)).join("")
        : '<p class="empty-state">לא נמצאו מפגשים לפי הסינון הנוכחי.</p>';
    }

    select.addEventListener("change", renderCourse);
    document.getElementById("telegramTopicSearch")?.addEventListener("input", renderCourse);
    document.getElementById("telegramFilter")?.addEventListener("change", renderCourse);

    document.addEventListener("click", (event) => {
      const copyButton = event.target.closest("[data-copy]");
      const exportButton = event.target.closest("[data-export]");
      if (!copyButton && !exportButton) return;

      const card = event.target.closest("[data-lesson-id]");
      const course = schedules[select.value];
      const lesson = course?.lessons.find((item) => item.id === card?.dataset.lessonId);
      if (!lesson || !course) return;

      const type = copyButton?.dataset.copy || exportButton?.dataset.export;
      const text = type === "prep"
        ? generatePreparationMessage(course, lesson)
        : generateReminderMessage(course, lesson);

      if (copyButton) copyText(text, copyButton);
      if (exportButton) downloadText(text, messageFileName(course, lesson, type));
    });

    renderCourse();
  }

  function loadSchedulesForAdmin() {
    if (window.TELEGRAM_COURSE_SCHEDULES) return Promise.resolve(window.TELEGRAM_COURSE_SCHEDULES);
    if (schedulesLoadPromise) return schedulesLoadPromise;
    schedulesLoadPromise = import("../js/firebase-config.js").then(async (firebase) => {
      const {
        db,
        doc,
        getDoc,
        collection,
        getDocs,
        query,
        orderBy,
      } = firebase;
      if (!db) throw new Error("Firestore is not configured");

      const courseRef = doc(db, "telegramCourseSchedules", COURSE_ID);
      const courseSnapshot = await getDoc(courseRef);
      if (!courseSnapshot.exists()) {
        throw new Error("Telegram course schedule was not found in Firestore");
      }

      const lessonsRef = collection(db, "telegramCourseSchedules", COURSE_ID, "lessons");
      const lessonsSnapshot = await getDocs(query(lessonsRef, orderBy("lessonNumber")));
      const course = {
        ...courseSnapshot.data(),
        lessons: lessonsSnapshot.docs.map((lessonDoc) => lessonDoc.data()),
      };
      window.TELEGRAM_COURSE_SCHEDULES = {
        [COURSE_ID]: course,
      };
      console.info("[telegram-preview] loaded schedules from firestore", {
        courseId: COURSE_ID,
        lessons: course.lessons.length,
      });
      return window.TELEGRAM_COURSE_SCHEDULES;
    });
    return schedulesLoadPromise;
  }

  function showAdminOnlyMessage() {
    const main = document.getElementById("main");
    if (!main) return;
    main.innerHTML = '<section class="content-section"><h1>עמוד זה מיועד למנהל מערכת בלבד.</h1><p>לוח הזמנים והודעות התצוגה המקדימה אינם זמינים למשתמש רגיל.</p></section>';
  }

  function showScheduleLoadError() {
    const list = document.getElementById("telegramLessonsList");
    if (list) list.innerHTML = '<p class="empty-state">לא ניתן לטעון את תצוגת ההודעות כרגע.</p>';
  }

  function enforceAdminPreview() {
    const guard = (profile) => {
      const isAdmin = profile?.role === "admin" || String(profile?.email || "").toLowerCase() === "osherper@gmail.com";
      document.body.classList.toggle("telegram-preview-allowed", Boolean(isAdmin));
      if (!isAdmin) {
        showAdminOnlyMessage();
        return;
      }
      if (previewRendered) return;
      loadSchedulesForAdmin()
        .then(() => {
          previewRendered = true;
          renderPreview();
        })
        .catch((error) => {
          console.error("[telegram-preview] failed to load schedules", error);
          showScheduleLoadError();
        });
    };
    if (window.CourseAuth?.profile) guard(window.CourseAuth.profile);
    window.CourseAuthReady?.then(guard).catch(() => null);
    document.addEventListener("course-auth-approved", (event) => guard(event.detail));
  }

  window.TelegramMessageGenerator = {
    generatePreparationMessage,
    generateReminderMessage,
    generateEthicalQuestions,
    generateKeyConcepts,
    renderPreview
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      enforceAdminPreview();
    });
  } else {
    enforceAdminPreview();
  }
})();

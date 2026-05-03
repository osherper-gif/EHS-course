(function () {
  const key = (name) => "safetyCourse:" + name;
  const defaultStats = () => ({
    totalQuestionsAnswered: 0,
    totalCorrect: 0,
    totalWrong: 0,
    lessonsCompleted: 0,
    examsCompleted: 0,
    gameXP: 0,
    updatedAt: Date.now(),
  });

  function normalizeStats(value) {
    return {
      ...defaultStats(),
      ...(value || {}),
      totalQuestionsAnswered: Number(value?.totalQuestionsAnswered || 0),
      totalCorrect: Number(value?.totalCorrect || 0),
      totalWrong: Number(value?.totalWrong || 0),
      lessonsCompleted: Number(value?.lessonsCompleted || 0),
      examsCompleted: Number(value?.examsCompleted || 0),
      gameXP: Number(value?.gameXP || 0),
      updatedAt: Number(value?.updatedAt || Date.now()),
    };
  }

  window.CourseStorage = {
    get(name, fallback = null) {
      try {
        const value = localStorage.getItem(key(name));
        return value ? JSON.parse(value) : fallback;
      } catch {
        return fallback;
      }
    },
    set(name, value) {
      localStorage.setItem(key(name), JSON.stringify(value));
    },
    notes() {
      return this.get("notes", {});
    },
    saveNote(id, value) {
      const notes = this.notes();
      notes[id] = value;
      this.set("notes", notes);
      const completed = this.progress()[id] || false;
      window.CourseAuth?.syncProgress?.(id, completed, value);
    },
    progress() {
      return this.get("progress", {});
    },
    setComplete(id, complete) {
      const progress = this.progress();
      progress[id] = Boolean(complete);
      this.set("progress", progress);
      this.updateStats({ lessonsCompleted: Object.values(progress).filter(Boolean).length });
      const notes = this.notes()[id] || "";
      window.CourseAuth?.syncProgress?.(id, Boolean(complete), notes);
    },
    stats() {
      return normalizeStats(this.get("stats", defaultStats()));
    },
    saveStats(stats) {
      const next = normalizeStats({ ...this.stats(), ...(stats || {}), updatedAt: Date.now() });
      this.set("stats", next);
      window.CourseAuth?.saveUserStats?.(next);
      return next;
    },
    updateStats(partial) {
      return this.saveStats(partial);
    },
    recordExamStats(attempt) {
      const stats = this.stats();
      return this.saveStats({
        totalQuestionsAnswered: stats.totalQuestionsAnswered + Number(attempt?.totalQuestions || 0),
        totalCorrect: stats.totalCorrect + Number(attempt?.correctCount || 0),
        totalWrong: stats.totalWrong + Number(attempt?.wrongCount || 0),
        examsCompleted: stats.examsCompleted + 1,
      });
    },
    setGameXp(totalXp) {
      return this.saveStats({ gameXP: Number(totalXp || 0) });
    },
    exportNotes() {
      const notes = this.notes();
      const lines = ["הערות אישיות - קורס ממונה בטיחות", new Date().toLocaleString("he-IL"), ""];
      Object.entries(notes).forEach(([id, value]) => {
        const lesson = (window.COURSE_DATA?.meetings || []).find((item) => item.id === id);
        lines.push("## " + (lesson ? lesson.title : id), value || "", "");
      });
      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "safety-course-notes.txt";
      a.click();
      URL.revokeObjectURL(url);
    },
    markLastVisited(lessonId, title) {
      try {
        this.set("lastVisited", { lessonId: String(lessonId || ""), title: String(title || ""), at: Date.now() });
      } catch (_) { /* noop */ }
    },
    lastVisited() {
      return this.get("lastVisited", null);
    },
    markLastPage(page) {
      try {
        this.set("lastPage", {
          title: String(page?.title || document.body?.dataset?.pageTitle || document.title || ""),
          path: String(page?.path || location.pathname + location.search + location.hash),
          type: String(page?.type || "page"),
          at: Date.now(),
        });
      } catch (_) { /* noop */ }
    },
    lastPage() {
      return this.get("lastPage", null);
    },
    markLastExam(info) {
      try {
        this.set("lastExam", {
          topic: String(info?.topic || ""),
          count: String(info?.count || ""),
          path: String(info?.path || "pages/exam-questions.html"),
          at: Date.now(),
        });
      } catch (_) { /* noop */ }
    },
    lastExam() {
      return this.get("lastExam", null);
    },
    markLastGame(info) {
      try {
        this.set("lastGame", {
          unitId: String(info?.unitId || "unit-foundations"),
          stageId: String(info?.stageId || ""),
          path: String(info?.path || "pages/safety-game.html"),
          at: Date.now(),
        });
      } catch (_) { /* noop */ }
    },
    lastGame() {
      return this.get("lastGame", null);
    },
    recordMistake(record) {
      const list = this.get("mistakes", []);
      list.push({
        questionId: String(record.questionId || ""),
        lessonId: String(record.lessonId || ""),
        topic: String(record.topic || ""),
        question: String(record.question || "").slice(0, 240),
        correct: String(record.correct || "").slice(0, 240),
        chosen: String(record.chosen || "").slice(0, 240),
        at: Date.now(),
      });
      this.set("mistakes", list.slice(-30));
    },
    mistakes() {
      return this.get("mistakes", []);
    },
    clearMistakes() {
      this.set("mistakes", []);
    },
  };
})();

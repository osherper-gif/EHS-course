(function () {
  const key = (name) => "safetyCourse:" + name;
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
    },
    progress() {
      return this.get("progress", {});
    },
    setComplete(id, complete) {
      const progress = this.progress();
      progress[id] = Boolean(complete);
      this.set("progress", progress);
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
  };
})();
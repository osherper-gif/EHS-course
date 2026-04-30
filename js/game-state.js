(function () {
  const STORAGE_KEY = "safetyCourse:game:progress";
  const ACTIVE_KEY = "safetyCourse:game:activeStage";
  const DEFAULT_UNIT = "unit-foundations";
  const DEFAULT_STAGE = "stage-01";

  function defaultProgress() {
    return {
      userId: "",
      totalXp: 0,
      completedStages: {},
      stageStars: {},
      currentUnit: DEFAULT_UNIT,
      currentStage: DEFAULT_STAGE,
      mistakes: [],
      lastStageResult: null,
      updatedAt: new Date().toISOString()
    };
  }

  function load() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return { ...defaultProgress(), ...(stored || {}) };
    } catch {
      return defaultProgress();
    }
  }

  function save(progress) {
    const next = { ...defaultProgress(), ...progress, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage can fail in private browsing; the game still works in memory for the session.
    }
    syncToFirestore(next);
    return next;
  }

  async function syncToFirestore(progress) {
    try {
      const profile = await window.CourseAuthReady;
      if (!window.CourseAuth?.saveGameProgress) return false;
      if (!profile || profile.status !== "approved") return false;
      return window.CourseAuth.saveGameProgress(progress);
    } catch {
      return false;
    }
  }

  function stages() {
    return window.CourseGameData?.gameStages || [];
  }

  function challenges() {
    return window.CourseGameData?.gameChallenges || [];
  }

  function getStage(stageId) {
    return stages().find((stage) => stage.id === stageId) || stages()[0];
  }

  function getStageChallenges(stageId) {
    return challenges().filter((challenge) => challenge.stageId === stageId);
  }

  function isStageUnlocked(stageId, progress = load()) {
    const stage = getStage(stageId);
    if (!stage || stage.order === 1) return true;
    const previous = stages().find((item) => item.unitId === stage.unitId && item.order === stage.order - 1);
    return Boolean(previous && progress.completedStages?.[previous.id]);
  }

  function nextStageId(stageId) {
    const stage = getStage(stageId);
    if (!stage) return DEFAULT_STAGE;
    const next = stages().find((item) => item.unitId === stage.unitId && item.order === stage.order + 1);
    return next?.id || stageId;
  }

  function firstOpenStage(progress = load()) {
    const list = stages();
    return list.find((stage) => !progress.completedStages?.[stage.id] && isStageUnlocked(stage.id, progress))?.id || list[list.length - 1]?.id || DEFAULT_STAGE;
  }

  function starsForMistakes(count) {
    if (count === 0) return 3;
    if (count === 1) return 2;
    return 1;
  }

  function startStage(stageId) {
    const selectedStage = getStage(stageId)?.id || firstOpenStage();
    const session = {
      stageId: selectedStage,
      index: 0,
      xp: 0,
      correct: 0,
      wrong: 0,
      answers: [],
      hintUsedByChallenge: {},
      startedAt: new Date().toISOString()
    };
    sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
    const progress = load();
    progress.currentStage = selectedStage;
    save(progress);
    return session;
  }

  function activeStage() {
    try {
      return JSON.parse(sessionStorage.getItem(ACTIVE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function saveActiveStage(session) {
    sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
    return session;
  }

  function addMistake(progress, challenge, selectedAnswer) {
    const mistakes = Array.isArray(progress.mistakes) ? progress.mistakes : [];
    const filtered = mistakes.filter((item) => item.challengeId !== challenge.id);
    filtered.unshift({
      challengeId: challenge.id,
      stageId: challenge.stageId,
      unitId: challenge.unitId,
      title: challenge.title,
      prompt: challenge.prompt,
      selectedAnswer,
      correctAnswer: challenge.correctAnswer,
      explanation: challenge.explanation,
      relatedLessonId: challenge.relatedLessonId,
      createdAt: new Date().toISOString(),
      attempts: 1
    });
    progress.mistakes = filtered.slice(0, 50);
  }

  function removeMistake(challengeId) {
    const progress = load();
    progress.mistakes = (progress.mistakes || []).filter((item) => item.challengeId !== challengeId);
    return save(progress);
  }

  function completeStage(session) {
    const progress = load();
    const stageChallenges = getStageChallenges(session.stageId);
    const total = stageChallenges.length || 1;
    const stars = starsForMistakes(session.wrong);
    const result = {
      stageId: session.stageId,
      score: Math.round((session.correct / total) * 100),
      xp: session.xp,
      stars,
      correct: session.correct,
      wrong: session.wrong,
      total,
      answers: session.answers,
      completedAt: new Date().toISOString()
    };
    progress.totalXp = Number(progress.totalXp || 0) + Number(session.xp || 0);
    progress.completedStages = { ...(progress.completedStages || {}), [session.stageId]: true };
    progress.stageStars = { ...(progress.stageStars || {}), [session.stageId]: Math.max(stars, Number(progress.stageStars?.[session.stageId] || 0)) };
    progress.currentStage = nextStageId(session.stageId);
    progress.lastStageResult = result;
    save(progress);
    sessionStorage.removeItem(ACTIVE_KEY);
    return result;
  }

  function stageStatus(stageId, progress = load()) {
    if (progress.completedStages?.[stageId]) return "completed";
    if (!isStageUnlocked(stageId, progress)) return "locked";
    if (progress.currentStage === stageId || firstOpenStage(progress) === stageId) return "current";
    return "open";
  }

  window.CourseGameState = {
    STORAGE_KEY,
    load,
    save,
    stages,
    challenges,
    getStage,
    getStageChallenges,
    isStageUnlocked,
    firstOpenStage,
    nextStageId,
    stageStatus,
    starsForMistakes,
    startStage,
    activeStage,
    saveActiveStage,
    addMistake,
    removeMistake,
    completeStage
  };
})();

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTION_BANK_PATH = path.join(ROOT, "content", "question-bank-pilot.json");
const TOPIC_MAP_PATH = path.join(ROOT, "content", "topic-map-pilot.json");
const LESSON_MAP_PATH = path.join(ROOT, "content", "lesson-map-pilot.json");
const SOURCE_REGISTRY_PATH = path.join(ROOT, "content", "source-registry.json");
const CITATION_REGISTRY_PATH = path.join(ROOT, "content", "citation-registry-pilot.json");

const VALID_VERIFICATION = new Set(["source-backed", "verified"]);
const AUTHORITATIVE_ANSWER_LEVELS = new Set([1, 2, 3, 4, 5]);
const REQUIRED_FACETS = [
  "examRelevant",
  "examCritical",
  "examTrap",
  "goldenNumberRelated",
  "legalBasisRequired",
  "commonMistake",
  "calculation",
  "scenarioBased",
  "regulationBased",
  "fieldPractice",
  "reviewOnly"
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hasPlaceholder(value) {
  if (typeof value === "string") {
    return value.includes("????");
  }
  if (Array.isArray(value)) {
    return value.some(hasPlaceholder);
  }
  if (value && typeof value === "object") {
    return Object.values(value).some(hasPlaceholder);
  }
  return false;
}

function buildContext(overrides = {}) {
  const questionBank = overrides.questionBank || readJson(QUESTION_BANK_PATH);
  const topicMap = overrides.topicMap || readJson(TOPIC_MAP_PATH);
  const lessonMap = overrides.lessonMap || readJson(LESSON_MAP_PATH);
  const sourceRegistry = overrides.sourceRegistry || readJson(SOURCE_REGISTRY_PATH);
  const citationRegistry = overrides.citationRegistry || readJson(CITATION_REGISTRY_PATH);

  return {
    questionBank,
    topicIds: new Set((topicMap.topics || []).map((topic) => topic.topicId)),
    lessonIds: new Set((lessonMap.lessonMappings || []).map((lesson) => lesson.lessonId)),
    sourceIds: new Set((sourceRegistry.entries || []).map((source) => source.stableSourceId)),
    sourceById: new Map((sourceRegistry.entries || []).map((source) => [source.stableSourceId, source])),
    citationById: new Map((citationRegistry.citations || []).map((citation) => [citation.citationId, citation]))
  };
}

function block(blocked, itemId, reason) {
  blocked.push({ itemId, reason });
}

function validateQuestion(question, context, blocked, warnings) {
  const itemId = question.questionId || "(missing questionId)";

  if (!question.questionId) {
    block(blocked, itemId, "Missing questionId.");
  }
  if (!question.questionText || typeof question.questionText !== "string") {
    block(blocked, itemId, "Missing questionText.");
  }
  if (hasPlaceholder(question)) {
    block(blocked, itemId, "Forbidden placeholder ???? found.");
  }

  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length < 2) {
    block(blocked, itemId, "Question must include at least two options.");
  }
  const optionIds = new Set(options.map((option) => option.optionId));
  const correct = question.correctAnswer || {};
  if (!correct.optionId || !optionIds.has(correct.optionId)) {
    block(blocked, itemId, "correctAnswer.optionId must match an option.");
  }

  const sourceRefs = Array.isArray(question.sourceRefs) ? question.sourceRefs : [];
  const answerProvenance = Array.isArray(question.answerProvenance) ? question.answerProvenance : [];
  if (correct.isOfficialAnswer && sourceRefs.length === 0) {
    block(blocked, itemId, "officialAnswer requires sourceRefs.");
  }
  if (correct.isOfficialAnswer && answerProvenance.length === 0) {
    block(blocked, itemId, "officialAnswer requires answerProvenance.");
  }

  for (const topicId of question.topicIds || []) {
    if (!context.topicIds.has(topicId)) {
      block(blocked, itemId, `Orphan topicId: ${topicId}.`);
    }
  }
  for (const lessonId of question.lessonIds || []) {
    if (!context.lessonIds.has(lessonId)) {
      block(blocked, itemId, `Orphan lessonId: ${lessonId}.`);
    }
  }

  for (const ref of sourceRefs) {
    if (ref.scannerId || ref.stableSourceId) {
      block(blocked, itemId, "sourceRefs must use sourceId only, not scannerId or stableSourceId.");
    }
    if (!ref.sourceId || !context.sourceIds.has(ref.sourceId)) {
      block(blocked, itemId, `Unknown sourceId in sourceRefs: ${ref.sourceId || "(missing)"}.`);
    }
    if (ref.citationId) {
      const citation = context.citationById.get(ref.citationId);
      if (!citation) {
        block(blocked, itemId, `Unknown citationId in sourceRefs: ${ref.citationId}.`);
      } else if (citation.stableSourceId !== ref.sourceId) {
        block(blocked, itemId, `Citation ${ref.citationId} belongs to ${citation.stableSourceId}, not ${ref.sourceId}.`);
      }
    }
  }

  for (const provenance of answerProvenance) {
    if (!provenance.sourceId || !context.sourceIds.has(provenance.sourceId)) {
      block(blocked, itemId, `Unknown sourceId in answerProvenance: ${provenance.sourceId || "(missing)"}.`);
    }
    if (!provenance.citationId || !context.citationById.has(provenance.citationId)) {
      block(blocked, itemId, `Missing or unknown citationId in answerProvenance: ${provenance.citationId || "(missing)"}.`);
    }
    if (!VALID_VERIFICATION.has(provenance.verificationStatus)) {
      block(blocked, itemId, "answerProvenance verificationStatus must be source-backed or verified.");
    }
  }

  const facets = question.examFacets || {};
  for (const facet of REQUIRED_FACETS) {
    if (typeof facets[facet] !== "boolean") {
      warnings.push({ itemId, reason: `Missing boolean examFacets.${facet}.` });
    }
  }

  if (facets.examCritical && !answerProvenance.some((item) => VALID_VERIFICATION.has(item.verificationStatus))) {
    block(blocked, itemId, "examCritical requires source-backed or verified answerProvenance.");
  }
  if (correct.isOfficialAnswer && !hasAuthoritativeAnswerSource(answerProvenance, sourceRefs, context)) {
    block(blocked, itemId, "officialAnswer requires Level 1-5 authoritative answer provenance; Level 6/7 training sources are not sufficient.");
  }
  if (facets.goldenNumberRelated) {
    block(blocked, itemId, "goldenNumberRelated is not supported in this pilot without a validated Golden Number entity.");
  }
  if (facets.legalBasisRequired && !answerProvenance.some((item) => item.authorityLevel >= 1 && item.authorityLevel <= 3 && VALID_VERIFICATION.has(item.verificationStatus))) {
    block(blocked, itemId, "legalBasisRequired requires Level 1-3 source-backed or verified provenance.");
  }
  if (facets.legalBasisRequired && onlyLowAuthoritySources(answerProvenance, sourceRefs, context)) {
    block(blocked, itemId, "legalBasisRequired cannot rely only on Level 6/7 learning sources.");
  }
}

function hasAuthoritativeAnswerSource(answerProvenance, sourceRefs, context) {
  return answerProvenance.some((item) => {
    const level = authorityLevelFor(item, context);
    return AUTHORITATIVE_ANSWER_LEVELS.has(level) && VALID_VERIFICATION.has(item.verificationStatus);
  }) || sourceRefs.some((ref) => {
    const level = authorityLevelFor(ref, context);
    return AUTHORITATIVE_ANSWER_LEVELS.has(level);
  });
}

function onlyLowAuthoritySources(answerProvenance, sourceRefs, context) {
  const levels = [
    ...answerProvenance.map((item) => authorityLevelFor(item, context)),
    ...sourceRefs.map((item) => authorityLevelFor(item, context))
  ].filter(Boolean);
  return levels.length > 0 && levels.every((level) => level >= 6);
}

function authorityLevelFor(item, context) {
  if (typeof item.authorityLevel === "number") return item.authorityLevel;
  const citation = item.citationId ? context.citationById.get(item.citationId) : null;
  if (citation && typeof citation.authorityLevel === "number") return citation.authorityLevel;
  const sourceId = item.sourceId || item.stableSourceId;
  const source = sourceId ? context.sourceById.get(sourceId) : null;
  return source && typeof source.authorityLevel === "number" ? source.authorityLevel : null;
}

function validate(context) {
  const questions = context.questionBank.questions || [];
  const blocked = [];
  const warnings = [];
  const ids = new Set();

  for (const question of questions) {
    if (question.questionId) {
      if (ids.has(question.questionId)) {
        block(blocked, question.questionId, "Duplicate questionId.");
      }
      ids.add(question.questionId);
    }
    validateQuestion(question, context, blocked, warnings);
  }

  return {
    sources: context.sourceIds.size,
    citations: context.citationById.size,
    topics: context.topicIds.size,
    lessons: context.lessonIds.size,
    questions: questions.length,
    checkedItems: questions.length,
    blocked,
    warnings
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeSelfTests() {
  const baseContext = buildContext();
  const baseQuestion = clone(baseContext.questionBank.questions[0]);
  const levelOneQuestion = clone(baseContext.questionBank.questions.find((question) => question.answerProvenance && question.answerProvenance.some((item) => item.authorityLevel === 1)) || baseQuestion);
  const levelFourQuestion = clone(baseContext.questionBank.questions.find((question) => question.answerProvenance && question.answerProvenance.some((item) => item.authorityLevel === 4)) || baseQuestion);
  const tests = [
    {
      name: "officialAnswer without sourceRefs",
      mutate(questionBank) {
        questionBank.questions = [clone(baseQuestion)];
        questionBank.questions[0].correctAnswer.isOfficialAnswer = true;
        questionBank.questions[0].sourceRefs = [];
      }
    },
    {
      name: "duplicate questionId",
      mutate(questionBank) {
        questionBank.questions = [clone(baseQuestion), clone(baseQuestion)];
      }
    },
    {
      name: "orphan topicId",
      mutate(questionBank) {
        questionBank.questions = [clone(baseQuestion)];
        questionBank.questions[0].topicIds = ["missing-topic"];
      }
    },
    {
      name: "orphan lessonId",
      mutate(questionBank) {
        questionBank.questions = [clone(baseQuestion)];
        questionBank.questions[0].lessonIds = ["lesson-999"];
      }
    },
    {
      name: "placeholder",
      mutate(questionBank) {
        questionBank.questions = [clone(baseQuestion)];
        questionBank.questions[0].questionText = "????";
      }
    },
    {
      name: "examCritical without source-backed",
      mutate(questionBank) {
        questionBank.questions = [clone(baseQuestion)];
        questionBank.questions[0].examFacets.examCritical = true;
        questionBank.questions[0].answerProvenance[0].verificationStatus = "unverified";
      }
    },
    {
      name: "officialAnswer with Level 6 only",
      mutate(questionBank) {
        questionBank.questions = [clone(baseQuestion)];
        questionBank.questions[0].correctAnswer.isOfficialAnswer = true;
        questionBank.questions[0].answerProvenance[0].authorityLevel = 6;
      }
    },
    {
      name: "officialAnswer with Level 7 only",
      mutate(questionBank) {
        questionBank.questions = [clone(baseQuestion)];
        questionBank.questions[0].correctAnswer.isOfficialAnswer = true;
        questionBank.questions[0].answerProvenance[0].authorityLevel = 7;
        questionBank.questions[0].sourceRefs = [
          {
            sourceId: "training-lecture-summary-upgraded-final",
            citationId: null
          }
        ];
      }
    },
    {
      name: "legalBasisRequired with Level 6 only",
      mutate(questionBank) {
        questionBank.questions = [clone(baseQuestion)];
        questionBank.questions[0].correctAnswer.isOfficialAnswer = false;
        questionBank.questions[0].examFacets.legalBasisRequired = true;
        questionBank.questions[0].answerProvenance[0].authorityLevel = 6;
      }
    },
    {
      name: "officialAnswer with Level 1",
      expectBlocked: false,
      mutate(questionBank) {
        questionBank.questions = [clone(levelOneQuestion)];
        questionBank.questions[0].correctAnswer.isOfficialAnswer = true;
      }
    },
    {
      name: "officialAnswer with Level 4",
      expectBlocked: false,
      mutate(questionBank) {
        questionBank.questions = [clone(levelFourQuestion)];
        questionBank.questions[0].correctAnswer.isOfficialAnswer = true;
      }
    },
    {
      name: "explanation with Level 6",
      expectBlocked: false,
      mutate(questionBank) {
        questionBank.questions = [clone(baseQuestion)];
        questionBank.questions[0].correctAnswer.isOfficialAnswer = false;
        questionBank.questions[0].examFacets.legalBasisRequired = false;
        questionBank.questions[0].examFacets.examCritical = false;
        questionBank.questions[0].answerProvenance[0].authorityLevel = 6;
      }
    }
  ];

  return tests.map((test) => {
    const questionBank = clone(baseContext.questionBank);
    test.mutate(questionBank);
    const result = validate(buildContext({ questionBank }));
    return {
      name: test.name,
      blocked: result.blocked.length,
      passed: test.expectBlocked === false ? result.blocked.length === 0 : result.blocked.length > 0
    };
  });
}

function printReport(result, selfTestResults) {
  console.log("Question Bank Validation Report");
  console.log("===============================");
  console.log(`Sources: ${result.sources}`);
  console.log(`Citations: ${result.citations}`);
  console.log(`Topics: ${result.topics}`);
  console.log(`Lessons: ${result.lessons}`);
  console.log(`Questions: ${result.questions}`);
  console.log(`Checked Items: ${result.checkedItems}`);
  console.log(`Blocked Items: ${result.blocked.length}`);
  console.log(`Warnings: ${result.warnings.length}`);

  if (result.blocked.length > 0) {
    console.log("");
    console.log("Blocked Details:");
    for (const item of result.blocked) {
      console.log(`- ${item.itemId}: ${item.reason}`);
    }
  }
  if (result.warnings.length > 0) {
    console.log("");
    console.log("Warnings:");
    for (const item of result.warnings) {
      console.log(`- ${item.itemId}: ${item.reason}`);
    }
  }

  if (selfTestResults) {
    console.log("");
    console.log("Self Test");
    console.log("=========");
    for (const item of selfTestResults) {
      console.log(`- ${item.name}: ${item.passed ? "PASS" : "FAIL"} (${item.blocked} blocked)`);
    }
    const failed = selfTestResults.filter((item) => !item.passed).length;
    console.log(`Self Test Cases Passed: ${selfTestResults.filter((item) => item.passed).length}/${selfTestResults.length}`);
    console.log(`Self Test Result: ${failed === 0 ? "PASS" : "FAIL"}`);
  }

  const resultText = result.blocked.length === 0 && result.warnings.length === 0 ? "PASS" : "FAIL";
  console.log("");
  console.log(`Result: ${resultText}`);
}

function main() {
  const isSelfTest = process.argv.includes("--self-test");
  const result = validate(buildContext());
  const selfTestResults = isSelfTest ? makeSelfTests() : null;
  printReport(result, selfTestResults);

  const selfTestFailed = selfTestResults && selfTestResults.some((item) => !item.passed);
  if (result.blocked.length > 0 || result.warnings.length > 0 || selfTestFailed) {
    process.exitCode = 1;
  }
}

main();

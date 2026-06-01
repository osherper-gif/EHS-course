"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SOURCE_REGISTRY_PATH = path.join(ROOT, "content", "source-registry.json");
const CITATION_REGISTRY_PATH = path.join(ROOT, "content", "citation-registry-pilot.json");
const KNOWLEDGE_ITEMS_PATH = path.join(ROOT, "content", "knowledge-items-pilot.json");
const QUESTION_ITEMS_PATH = path.join(ROOT, "content", "question-items-pilot.json");
const GOLDEN_NUMBERS_PATH = path.join(ROOT, "content", "golden-numbers-pilot.json");

const AUTHORITATIVE_CLAIM_TYPES = new Set([
  "legalRequirement",
  "regulatoryRequirement",
  "bindingRule",
  "examCritical",
  "goldenNumber",
  "officialAnswer"
]);

const ACCEPTED_AUTHORITY_STATUSES = new Set(["verified", "source-backed"]);
const SCANNER_ID_PATTERN = /source-\d{3}-[a-f0-9]{12}/i;
const SELF_TEST_MODE = process.argv.includes("--self-test");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasAuthoritativeClaim(item) {
  const claimTypes = asArray(item.claimTypes);
  return (
    claimTypes.some((claimType) => AUTHORITATIVE_CLAIM_TYPES.has(claimType)) ||
    item.authoritySummary?.legalBinding === true ||
    item.authoritySummary?.examRelevant === true
  );
}

function sourceVerificationStatus(source, citation, item) {
  return (
    citation?.verification?.status ||
    item?.verification?.status ||
    source?.verification?.status ||
    "unverified"
  );
}

function sourceAuthorityLevel(source, citation) {
  return citation?.authorityLevel || source?.authorityLevel || null;
}

function itemId(item) {
  return item.knowledgeItemId || item.questionId || item.goldenNumberId || "(missing item id)";
}

function validateData(sourceRegistry, citationRegistry, knowledgeRegistry, questionRegistry, goldenNumberRegistry) {
  const sources = asArray(sourceRegistry.entries);
  const citations = asArray(citationRegistry.citations);
  const knowledgeItems = asArray(knowledgeRegistry.knowledgeItems);
  const questionItems = asArray(questionRegistry.questionItems);
  const goldenNumbers = asArray(goldenNumberRegistry.goldenNumbers);
  const sourceById = new Map(sources.map((source) => [source.stableSourceId, source]));
  const citationById = new Map(citations.map((citation) => [citation.citationId, citation]));

  const blocked = [];
  const warnings = [];
  let checkedItems = 0;

  function block(item, message) {
    blocked.push(`${itemId(item)}: ${message}`);
  }

  function blockSource(source, message) {
    blocked.push(`source:${source?.stableSourceId || "(missing stableSourceId)"}: ${message}`);
  }

  function validateSourceRegistry() {
    const seenStableSourceIds = new Set();

    sources.forEach((source) => {
      if (!source.stableSourceId) {
        blockSource(source, "missing stableSourceId");
        return;
      }

      if (seenStableSourceIds.has(source.stableSourceId)) {
        blockSource(source, "duplicate stableSourceId");
      }
      seenStableSourceIds.add(source.stableSourceId);

      if (SCANNER_ID_PATTERN.test(source.stableSourceId)) {
        blockSource(source, "stableSourceId must not be a scannerId");
      }

      if (source.status !== "draft") {
        blockSource(source, `status must be draft, got ${source.status || "(missing)"}`);
      }

      if (source.verification?.status !== "unverified") {
        blockSource(source, `verification.status must be unverified, got ${source.verification?.status || "(missing)"}`);
      }

      if (source.bindingDefault !== false) {
        blockSource(source, "bindingDefault must be false");
      }

      if (source.verification?.status === "verified" && !source.verification?.reviewedBy) {
        blockSource(source, "verified source must include reviewedBy");
      }
    });
  }

  function validateSourceRefs(item, sourceRefs, refLabel, authoritative) {
    if (!sourceRefs.length) {
      block(item, `missing ${refLabel}`);
      return;
    }

    sourceRefs.forEach((ref, index) => {
      if (!ref.stableSourceId) block(item, `${refLabel}[${index}] missing stableSourceId`);
      if (!ref.citationId) block(item, `${refLabel}[${index}] missing citationId`);

      const source = ref.stableSourceId ? sourceById.get(ref.stableSourceId) : null;
      const citation = ref.citationId ? citationById.get(ref.citationId) : null;
      const authorityLevel = sourceAuthorityLevel(source, citation);
      const verificationStatus = sourceVerificationStatus(source, citation, item);

      if (!source) block(item, `${refLabel}[${index}] stableSourceId not found: ${ref.stableSourceId || "(missing)"}`);
      if (!citation) block(item, `${refLabel}[${index}] citationId not found: ${ref.citationId || "(missing)"}`);

      if (citation && source && citation.stableSourceId !== source.stableSourceId) {
        block(item, `${refLabel}[${index}] citation/source mismatch`);
      }

      if (!authorityLevel) block(item, `${refLabel}[${index}] missing authorityLevel`);
      if (!verificationStatus) block(item, `${refLabel}[${index}] missing verificationStatus`);

      if (authoritative && !ACCEPTED_AUTHORITY_STATUSES.has(verificationStatus)) {
        block(item, `authoritative claim has unsupported verificationStatus: ${verificationStatus}`);
      }
    });
  }

  function validateTraceableItem(item, itemType) {
    checkedItems += 1;

    if (SCANNER_ID_PATTERN.test(JSON.stringify(item))) {
      block(item, `scannerId-like value found in ${itemType}`);
    }

    const authoritative = hasAuthoritativeClaim(item);
    validateSourceRefs(item, asArray(item.sourceRefs), "sourceRefs", authoritative);

    if (itemType === "question" && asArray(item.claimTypes).includes("officialAnswer")) {
      const answerRefs = asArray(item.officialAnswer?.sourceRefs);
      validateSourceRefs(item, answerRefs, "officialAnswer.sourceRefs", true);
      if (item.officialAnswer?.correctIndex !== item.correctIndex) {
        block(item, "officialAnswer.correctIndex does not match correctIndex");
      }
    }
  }

  validateSourceRegistry();

  knowledgeItems.forEach((item) => {
    validateTraceableItem(item, "knowledge item");
  });

  questionItems.forEach((item) => {
    validateTraceableItem(item, "question");
  });

  goldenNumbers.forEach((item) => {
    checkedItems += 1;

    if (SCANNER_ID_PATTERN.test(JSON.stringify(item))) {
      block(item, "scannerId-like value found in golden number");
    }

    if (!item.sourceId) block(item, "missing sourceId");
    if (!item.citationId) block(item, "missing citationId");
    if (!item.sourceCitation) block(item, "missing sourceCitation");
    if (!item.authorityLevel) block(item, "missing authorityLevel");

    const source = item.sourceId ? sourceById.get(item.sourceId) : null;
    const citation = item.citationId ? citationById.get(item.citationId) : null;
    const verificationStatus = item.verification?.status || "unverified";

    if (!source) block(item, `sourceId not found: ${item.sourceId || "(missing)"}`);
    if (!citation) block(item, `citationId not found: ${item.citationId || "(missing)"}`);
    if (source && citation && citation.stableSourceId !== source.stableSourceId) {
      block(item, "citation/source mismatch");
    }
    if (source && item.authorityLevel && item.authorityLevel !== source.authorityLevel) {
      block(item, `authorityLevel mismatch: expected ${source.authorityLevel}, got ${item.authorityLevel}`);
    }
    if (!ACCEPTED_AUTHORITY_STATUSES.has(verificationStatus)) {
      block(item, `goldenNumber has unsupported verificationStatus: ${verificationStatus}`);
    }
  });

  return {
    sources: sources.length,
    citations: citations.length,
    knowledgeItems: knowledgeItems.length,
    questionItems: questionItems.length,
    goldenNumbers: goldenNumbers.length,
    checkedItems,
    blocked,
    warnings,
    result: blocked.length ? "FAIL" : "PASS"
  };
}

function loadRegistries() {
  return {
    sourceRegistry: readJson(SOURCE_REGISTRY_PATH),
    citationRegistry: readJson(CITATION_REGISTRY_PATH),
    knowledgeRegistry: readJson(KNOWLEDGE_ITEMS_PATH),
    questionRegistry: readJson(QUESTION_ITEMS_PATH),
    goldenNumberRegistry: readJson(GOLDEN_NUMBERS_PATH)
  };
}

function validate() {
  const registries = loadRegistries();
  return validateData(
    registries.sourceRegistry,
    registries.citationRegistry,
    registries.knowledgeRegistry,
    registries.questionRegistry,
    registries.goldenNumberRegistry
  );
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function firstPilotItem(knowledgeRegistry) {
  const item = asArray(knowledgeRegistry.knowledgeItems)[0];
  if (!item) throw new Error("Self-test requires at least one pilot knowledge item.");
  return item;
}

function firstPilotQuestion(questionRegistry) {
  const item = asArray(questionRegistry.questionItems)[0];
  if (!item) throw new Error("Self-test requires at least one pilot question item.");
  return item;
}

function firstPilotGoldenNumber(goldenNumberRegistry) {
  const item = asArray(goldenNumberRegistry.goldenNumbers)[0];
  if (!item) throw new Error("Self-test requires at least one pilot golden number.");
  return item;
}

function runSelfTest() {
  const base = loadRegistries();
  const baseItem = firstPilotItem(base.knowledgeRegistry);
  const baseRef = asArray(baseItem.sourceRefs)[0];
  const baseQuestion = firstPilotQuestion(base.questionRegistry);
  const baseQuestionRef = asArray(baseQuestion.sourceRefs)[0];
  const baseGoldenNumber = firstPilotGoldenNumber(base.goldenNumberRegistry);
  const knowledgeCases = [
    {
      name: "missing stableSourceId",
      type: "knowledge",
      mutate(item) {
        item.sourceRefs = [{ citationId: baseRef.citationId }];
      }
    },
    {
      name: "missing citationId",
      type: "knowledge",
      mutate(item) {
        item.sourceRefs = [{ stableSourceId: baseRef.stableSourceId }];
      }
    },
    {
      name: "scannerId used as stableSourceId",
      type: "knowledge",
      mutate(item) {
        item.sourceRefs = [{ stableSourceId: "source-013-b3e4e54502a2", citationId: baseRef.citationId }];
      }
    },
    {
      name: "legalRequirement without citation",
      type: "knowledge",
      mutate(item) {
        item.claimTypes = ["legalRequirement"];
        item.sourceRefs = [{ stableSourceId: baseRef.stableSourceId }];
      }
    },
    {
      name: "authoritative claim with unverified citation",
      type: "knowledge",
      mutate(item, registries) {
        item.claimTypes = ["legalRequirement"];
        const citation = asArray(registries.citationRegistry.citations).find((entry) => entry.citationId === baseRef.citationId);
        if (citation) citation.verification.status = "unverified";
      }
    }
  ];
  const questionCases = [
    {
      name: "officialAnswer without source",
      type: "question",
      mutate(item) {
        item.officialAnswer.sourceRefs = [];
      }
    },
    {
      name: "officialAnswer without citation",
      type: "question",
      mutate(item) {
        item.officialAnswer.sourceRefs = [{ stableSourceId: baseQuestionRef.stableSourceId }];
      }
    },
    {
      name: "question scannerId used as stableSourceId",
      type: "question",
      mutate(item) {
        item.sourceRefs = [{ stableSourceId: "source-013-b3e4e54502a2", citationId: baseQuestionRef.citationId }];
        item.officialAnswer.sourceRefs = [{ stableSourceId: "source-013-b3e4e54502a2", citationId: baseQuestionRef.citationId }];
      }
    },
    {
      name: "question citation not found",
      type: "question",
      mutate(item) {
        item.sourceRefs = [{ stableSourceId: baseQuestionRef.stableSourceId, citationId: "citation-missing" }];
        item.officialAnswer.sourceRefs = [{ stableSourceId: baseQuestionRef.stableSourceId, citationId: "citation-missing" }];
      }
    },
    {
      name: "authoritative question with unverified source",
      type: "question",
      mutate(item, registries) {
        item.claimTypes = ["officialAnswer"];
        const citation = asArray(registries.citationRegistry.citations).find((entry) => entry.citationId === baseQuestionRef.citationId);
        if (citation) citation.verification.status = "unverified";
      }
    }
  ];
  const goldenNumberCases = [
    {
      name: "golden number without sourceId",
      type: "goldenNumber",
      mutate(item) {
        delete item.sourceId;
      }
    },
    {
      name: "golden number without citationId",
      type: "goldenNumber",
      mutate(item) {
        delete item.citationId;
      }
    },
    {
      name: "golden number without sourceCitation",
      type: "goldenNumber",
      mutate(item) {
        delete item.sourceCitation;
      }
    },
    {
      name: "golden number without authorityLevel",
      type: "goldenNumber",
      mutate(item) {
        delete item.authorityLevel;
      }
    },
    {
      name: "golden number with unverified status",
      type: "goldenNumber",
      mutate(item) {
        item.verification.status = "unverified";
      }
    },
    {
      name: "golden number scannerId used as sourceId",
      type: "goldenNumber",
      mutate(item) {
        item.sourceId = "source-013-b3e4e54502a2";
      }
    }
  ];
  const cases = [...knowledgeCases, ...questionCases, ...goldenNumberCases];

  const results = cases.map((testCase) => {
    const registries = deepClone(base);
    const isQuestionCase = testCase.type === "question";
    const isGoldenNumberCase = testCase.type === "goldenNumber";
    const item = deepClone(isGoldenNumberCase ? baseGoldenNumber : isQuestionCase ? baseQuestion : baseItem);
    if (isQuestionCase) {
      item.questionId = `negative-${item.questionId}-${testCase.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
    } else if (isGoldenNumberCase) {
      item.goldenNumberId = `negative-${item.goldenNumberId}-${testCase.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
    } else {
      item.knowledgeItemId = `negative-${item.knowledgeItemId}-${testCase.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
    }
    testCase.mutate(item, registries);
    registries.knowledgeRegistry.knowledgeItems = !isQuestionCase && !isGoldenNumberCase ? [item] : [];
    registries.questionRegistry.questionItems = isQuestionCase ? [item] : [];
    registries.goldenNumberRegistry.goldenNumbers = isGoldenNumberCase ? [item] : [];
    const report = validateData(
      registries.sourceRegistry,
      registries.citationRegistry,
      registries.knowledgeRegistry,
      registries.questionRegistry,
      registries.goldenNumberRegistry
    );
    return {
      name: testCase.name,
      type: testCase.type,
      blocked: report.blocked.length,
      result: report.result
    };
  });

  const missedCases = results.filter((item) => item.result !== "FAIL" || item.blocked < 1);
  const report = {
    sources: asArray(base.sourceRegistry.entries).length,
    citations: asArray(base.citationRegistry.citations).length,
    knowledgeItems: knowledgeCases.length,
    questionItems: questionCases.length,
    goldenNumbers: goldenNumberCases.length,
    checkedItems: cases.length,
    blocked: missedCases.map((item) => `self-test case was not blocked: ${item.name}`),
    warnings: [],
    result: missedCases.length ? "FAIL" : "PASS",
    selfTestResults: results
  };
  return report;
}

function printReport(report) {
  console.log("Authority Validation Report");
  console.log("===========================");
  console.log(`Sources: ${report.sources}`);
  console.log(`Citations: ${report.citations}`);
  console.log(`Knowledge Items: ${report.knowledgeItems}`);
  console.log(`Question Items: ${report.questionItems}`);
  console.log(`Golden Numbers: ${report.goldenNumbers}`);
  console.log(`Checked Items: ${report.checkedItems}`);
  console.log(`Blocked Items: ${report.blocked.length}`);
  report.blocked.forEach((item) => console.log(`- ${item}`));
  console.log(`Warnings: ${report.warnings.length}`);
  report.warnings.forEach((item) => console.log(`- ${item}`));
  if (report.selfTestResults) {
    console.log("Self-Test Cases:");
    report.selfTestResults.forEach((item) => {
      console.log(`- ${item.type} | ${item.name}: blocked=${item.blocked}, expected=blocked`);
    });
  }
  console.log(`Result: ${report.result}`);
}

const report = SELF_TEST_MODE ? runSelfTest() : validate();
printReport(report);
if (report.result !== "PASS") process.exitCode = 1;

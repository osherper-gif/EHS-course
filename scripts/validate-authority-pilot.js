"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SOURCE_REGISTRY_PATH = path.join(ROOT, "content", "source-registry.json");
const CITATION_REGISTRY_PATH = path.join(ROOT, "content", "citation-registry-pilot.json");
const KNOWLEDGE_ITEMS_PATH = path.join(ROOT, "content", "knowledge-items-pilot.json");

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

function validateData(sourceRegistry, citationRegistry, knowledgeRegistry) {
  const sources = asArray(sourceRegistry.entries);
  const citations = asArray(citationRegistry.citations);
  const knowledgeItems = asArray(knowledgeRegistry.knowledgeItems);
  const sourceById = new Map(sources.map((source) => [source.stableSourceId, source]));
  const citationById = new Map(citations.map((citation) => [citation.citationId, citation]));

  const blocked = [];
  const warnings = [];
  let checkedItems = 0;

  function block(item, message) {
    blocked.push(`${item.knowledgeItemId || "(missing knowledgeItemId)"}: ${message}`);
  }

  knowledgeItems.forEach((item) => {
    checkedItems += 1;

    if (SCANNER_ID_PATTERN.test(JSON.stringify(item))) {
      block(item, "scannerId-like value found in knowledge item");
    }

    const sourceRefs = asArray(item.sourceRefs);
    const authoritative = hasAuthoritativeClaim(item);

    if (!sourceRefs.length) {
      block(item, "missing sourceRefs");
      return;
    }

    sourceRefs.forEach((ref, index) => {
      if (!ref.stableSourceId) block(item, `sourceRefs[${index}] missing stableSourceId`);
      if (!ref.citationId) block(item, `sourceRefs[${index}] missing citationId`);

      const source = ref.stableSourceId ? sourceById.get(ref.stableSourceId) : null;
      const citation = ref.citationId ? citationById.get(ref.citationId) : null;
      const authorityLevel = sourceAuthorityLevel(source, citation);
      const verificationStatus = sourceVerificationStatus(source, citation, item);

      if (!source) block(item, `sourceRefs[${index}] stableSourceId not found: ${ref.stableSourceId || "(missing)"}`);
      if (!citation) block(item, `sourceRefs[${index}] citationId not found: ${ref.citationId || "(missing)"}`);

      if (citation && source && citation.stableSourceId !== source.stableSourceId) {
        block(item, `sourceRefs[${index}] citation/source mismatch`);
      }

      if (!authorityLevel) block(item, `sourceRefs[${index}] missing authorityLevel`);
      if (!verificationStatus) block(item, `sourceRefs[${index}] missing verificationStatus`);

      if (authoritative && !ACCEPTED_AUTHORITY_STATUSES.has(verificationStatus)) {
        block(item, `authoritative claim has unsupported verificationStatus: ${verificationStatus}`);
      }
    });
  });

  return {
    sources: sources.length,
    citations: citations.length,
    knowledgeItems: knowledgeItems.length,
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
    knowledgeRegistry: readJson(KNOWLEDGE_ITEMS_PATH)
  };
}

function validate() {
  const registries = loadRegistries();
  return validateData(registries.sourceRegistry, registries.citationRegistry, registries.knowledgeRegistry);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function firstPilotItem(knowledgeRegistry) {
  const item = asArray(knowledgeRegistry.knowledgeItems)[0];
  if (!item) throw new Error("Self-test requires at least one pilot knowledge item.");
  return item;
}

function runSelfTest() {
  const base = loadRegistries();
  const baseItem = firstPilotItem(base.knowledgeRegistry);
  const baseRef = asArray(baseItem.sourceRefs)[0];
  const cases = [
    {
      name: "missing stableSourceId",
      mutate(item) {
        item.sourceRefs = [{ citationId: baseRef.citationId }];
      }
    },
    {
      name: "missing citationId",
      mutate(item) {
        item.sourceRefs = [{ stableSourceId: baseRef.stableSourceId }];
      }
    },
    {
      name: "scannerId used as stableSourceId",
      mutate(item) {
        item.sourceRefs = [{ stableSourceId: "source-013-b3e4e54502a2", citationId: baseRef.citationId }];
      }
    },
    {
      name: "legalRequirement without citation",
      mutate(item) {
        item.claimTypes = ["legalRequirement"];
        item.sourceRefs = [{ stableSourceId: baseRef.stableSourceId }];
      }
    },
    {
      name: "authoritative claim with unverified citation",
      mutate(item, registries) {
        item.claimTypes = ["legalRequirement"];
        const citation = asArray(registries.citationRegistry.citations).find((entry) => entry.citationId === baseRef.citationId);
        if (citation) citation.verification.status = "unverified";
      }
    }
  ];

  const results = cases.map((testCase) => {
    const registries = deepClone(base);
    const item = deepClone(baseItem);
    item.knowledgeItemId = `negative-${item.knowledgeItemId}-${testCase.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
    testCase.mutate(item, registries);
    registries.knowledgeRegistry.knowledgeItems = [item];
    const report = validateData(registries.sourceRegistry, registries.citationRegistry, registries.knowledgeRegistry);
    return {
      name: testCase.name,
      blocked: report.blocked.length,
      result: report.result
    };
  });

  const missedCases = results.filter((item) => item.result !== "FAIL" || item.blocked < 1);
  const report = {
    sources: asArray(base.sourceRegistry.entries).length,
    citations: asArray(base.citationRegistry.citations).length,
    knowledgeItems: cases.length,
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
  console.log(`Checked Items: ${report.checkedItems}`);
  console.log(`Blocked Items: ${report.blocked.length}`);
  report.blocked.forEach((item) => console.log(`- ${item}`));
  console.log(`Warnings: ${report.warnings.length}`);
  report.warnings.forEach((item) => console.log(`- ${item}`));
  if (report.selfTestResults) {
    console.log("Self-Test Cases:");
    report.selfTestResults.forEach((item) => {
      console.log(`- ${item.name}: blocked=${item.blocked}, expected=blocked`);
    });
  }
  console.log(`Result: ${report.result}`);
}

const report = SELF_TEST_MODE ? runSelfTest() : validate();
printReport(report);
if (report.result !== "PASS") process.exitCode = 1;

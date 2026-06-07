# Modular Learning Platform Roadmap

## Purpose

This document records the intended direction of the EHS course platform as a modular learning platform. It is a planning artifact only and does not change runtime behavior.

The current system is being built from small, governed blocks that can scale from source-backed learning content into practice, assessment, tutoring, and training management.

## Existing Blocks

### Source Registry

Stable registry of learning and authority sources. Uses stable source IDs and keeps scanner IDs as aliases only.

### Citation Registry

Traceability layer from a source to a precise locator such as a legal section, standard clause, heading, page, or paragraph.

### Knowledge Blocks

Structured content blocks for learning material, legal notes, exam focus items, definitions, checklists, warnings, and summaries.

### Topic Mapping

Professional taxonomy that groups content blocks into knowledge domains and subtopics without exposing database structure to learners.

### Lesson Mapping

Alignment layer between the official learning path and the topic/content model.

### Question Bank

Governed question model with source references, answer provenance, topic links, lesson links, exam facets, verification, and status.

### Practice Hub

Learner-facing practice surface for questions. Current foundation includes search, filters, pagination, reveal-answer mode, source details, and a bookmark UI placeholder without persistence.

## Future Blocks

### Quiz Engine

Interactive mode for answering questions, tracking selected answers during a session, showing feedback, and supporting timed or untimed practice.

### Simulation Engine

Scenario-based assessment for multi-step safety situations such as incident response, risk assessment, inspection, and control selection.

### Feynman Mode

Learner explanation mode where the student explains a topic in plain language and receives structured feedback.

### AI Tutor

Guided learning assistant grounded in the governed source, citation, topic, lesson, and question layers.

### Spaced Repetition

Review scheduling layer based on learner performance, forgotten topics, difficult questions, and exam-critical facets.

### Compliance Layer

Organizational layer for evidence, required training, source updates, audit readiness, and role-based compliance coverage.

### Training Management

Operational layer for cohorts, assignments, completion tracking, trainer dashboards, and reporting.

## Architecture Direction

The platform should keep the layers separated:

Source Registry
-> Citation Registry
-> Knowledge Blocks
-> Topic Mapping
-> Lesson Mapping
-> Question Bank
-> Practice Hub
-> Future learning engines

Each future feature should read from governed data rather than inventing its own isolated content model.

## Guardrails

- Do not expose registry terminology to learners unless they are in an admin or review context.
- Do not treat training material as law.
- Do not mark content as verified unless it has completed the relevant review workflow.
- Do not create official answers without authoritative source provenance.
- Do not add persistence features such as bookmarks, scores, or progress until the storage and privacy model is defined.
- Keep Practice Hub separate from the full Quiz Engine until scoring and session behavior are deliberately designed.

## Next Candidate Steps

1. Expand Practice Hub pagination and filtering as question volume grows.
2. Define a persistence model for saved questions and learner progress.
3. Design Quiz Engine session state separately from the read-only Practice Hub.
4. Add analytics only after privacy, retention, and role boundaries are defined.

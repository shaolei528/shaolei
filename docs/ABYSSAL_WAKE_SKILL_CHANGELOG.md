# Project continuity Skill changelog

This log tracks only changes to `.agents/skills/abyssal-wake-continuity/SKILL.md`. Project facts and daily ideas belong in project state, module documents, or dated handoffs.

## 2026-10-04 — Initial version

- Added session-start verification, evidence labels, module routing, no-code-by-default review mode, content-draft handling, daily review cadence, and handoff procedure.
- Basis: user-approved continuity plan and current repository contracts. This initial version has not yet been improved through repeated observed use.

## 2026-10-04 — Canonical module routing check

- Added a session-start check that routes handoffs through the canonical owner table/index, rejects combined legacy labels as owners, and records an explicit owner gap before implementation.
- Added a post-taxonomy check to verify index count and resolve every linked handoff card.
- Evidence: two read-only module audits found repeated combined-owner labels across separate tables, incomplete standalone handoff coverage, and no distinct owner for player movement response. The taxonomy was corrected to 27 owners, standalone cards were linked, and the audit surfaced how the same labels could otherwise reappear in later sessions.
- Scope: procedural only; no daily game facts or unverified runtime ownership were added to the Skill.

## 2026-10-05 — Cross-card ownership consistency

- Added a procedural check to compare partner module cards and owner/transaction tables whenever a card changes an overlapping boundary; superseded cards must be explicitly historical and excluded from canonical routing.
- Evidence: while promoting Survival & Needs V2, its zero-HP/death-state ownership contradicted Core State & Save V2 while the historical Survival V1 explicitly excluded lifecycle ownership. The owner map and route were corrected, with V1 retained as history.
- Scope: a demonstrated documentation failure mode; no project facts or runtime behavior were added to the Skill.

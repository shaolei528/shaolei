# Safe return toast wording fix — 2026-10-04

## Finding and change

- Lead module: **Survival & Life**. Adjacent owner: **UI & Input / Localization**. Scope: `modules/survival/gameplay-v9.js` return-statistic toast only. The statistic still increments after leaving camp for at least 15 seconds and returning; no gameplay authority or persistence behavior changed.
- **CONFIRMED source defect:** V9 described that duration statistic as `Expedition complete · safe return`, although the MIRE MART objective has its own salvage-gated completion state. `awakening-expedition-loop-v1.test.mjs` independently asserts that death/respawn and early return do not complete the route, exposing the contradictory player-facing wording.
- **VERIFIED local fix:** changed only the statistic label to `Safe return recorded · total N`. This does not claim a quest or POI completion. Save key, statistic fields, threshold, Relay messages and expedition state machine were not changed.
- **VERIFIED regressions:** `successor-natural-route-v1.test.mjs`, `awakening-expedition-loop-v1.test.mjs`, `awakening-world-v1.test.mjs`, and `successor-camera-adapter-v1.test.mjs` pass serially. `node --check modules/survival/gameplay-v9.js` and scoped `git diff --check` pass.
- **UNKNOWN ownership / parallel preview:** `prototypes/successor-3-4/successor-renderer.js` has a preview-only filter for the former English toast, but that file and its static test are untracked parallel work. They were preserved and not edited. The filter is now redundant for the current production wording; its owner should review it before removing it.

## Acceptance limits and next step

- No live browser toast was independently observed this turn. Several same-URL Edge preview tabs are open and were left untouched to avoid disrupting parallel QA.
- Full HOME → POI → search/fight → salvage → return/growth, production art, mobile/touch and two-client Relay remain **UNKNOWN / NOT ACCEPTED**.
- Next: after coordinating preview ownership, verify the neutral toast in the guarded runtime, then resume the natural route from observed HOME state. Keep QA teleports out of acceptance evidence.

## Workspace snapshot

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD at review: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Worktree remains dirty with broad edits and untracked files of unknown authorship. This change touches only the listed V9 toast line; do not infer ownership of adjacent changes.

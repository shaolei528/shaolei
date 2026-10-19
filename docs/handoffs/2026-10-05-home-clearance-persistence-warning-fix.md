# HOME return-clearance storage feedback fix

Date: 2026-10-05 (Asia/Rangoon)
Status: confirmed local persistence-feedback bug fixed; production runtime acceptance UNKNOWN

## Owner and interface

- Lead: HOME & Building owns Field Rig clearance, tier and persistence status.
- Partner: POI & Exploration owns the MIRE MART operational expedition phase and completion objective.
- Interface: `ABYSSAL_HOME_WORKBENCH_V1.recordExpeditionReturn()` returns the read-only snapshot including `returnClearancePersisted`; the expedition objective consumes that status to tell the player whether the unlock survived storage.
- Files: `modules/safe-camp/home-workbench-upgrade-v1.js`, `modules/world/awakening-expedition-loop-v1.js`, `tests/awakening-home-workbench-upgrade-v1.test.mjs`, `docs/contracts/HOME_WORKBENCH_UPGRADE_V1.md`, `wrangler.jsonc`, and this handoff.

## Confirmed reproduction and repair

An isolated in-memory store rejected only `abyssal_home_workbench_v1` writes while accepting the existing player-save key. Before the repair, the return API left `returnClearance=true` in memory, wrote no HOME record, and returned without exposing the write failure. After reload, the clearance was false. The normal return toast still said the salvage was safely brought home, and the objective did not tell the player that the unlock would be lost.

The HOME owner now tracks whether the return clearance write succeeded and exposes it in its snapshot. The current session retains the successful return as before. POI & Exploration changes the completion toast and persistent objective text when that write failed, explaining that the player should complete the Field Rig upgrade before leaving or reloading. Upgrade eligibility, costs, inventory save schema, Relay messages and authority remain unchanged. Upgrade writes still fail closed and preserve materials if persistence fails.

## Validation

- The new regression simulates the selective storage failure through the full expedition route and proves the HOME record is absent, the current session remains eligible, the failed-write status is exposed, and both toast and objective give a warning.
- HOME upgrade, expedition loop, world hardening, player-save migration and safe-return localization tests passed.
- Full serial suite: 60/60 test files passed. The asset-validator's child-process assertion remains skipped on this Windows host because process creation returns EPERM.
- `git diff --check` passed for scoped files (Git printed an LF/CRLF normalization notice for the existing expedition file).
- The safe site builder prepared `.cloudflare-site-eb4c1605ea45`; 56/56 file hashes match, the HOME and POI files match current source, and QA harness/tests/docs/V17 entry files are excluded.

## Limits

No save format or Relay contract changed. No user files were deleted or reset. This work did not open the public Relay or deploy the package. Real browser presentation of the warning, mobile layout, and Cloudflare live behavior remain UNKNOWN; the local browser blocks the guarded preview route.

# Source Sheets — Intake References

This branch records the five Art Lab source-sheet filenames and slice specs for provenance. The full source-sheet binaries are not duplicated into this branch. Selected raw/normalized/seam test outputs are delivered as a feasibility artifact bundle and indexed by `normalization-v1/OUTPUTS.json`.

Expected source filenames:

- S01 `6cbc2887-60b8-5260-885f-145adc9bae28.png` — 1254x1254, reference-only in normalization V1.
- S02 `021d31d9-42a4-5df0-90af-160d23273626.png` — 1536x768, not tested in normalization V1.
- S03 `c7d13d21-8d7e-5751-9665-94657c3708f6.png` — 1536x768.
- S04 `e5bb077c-1eb9-5441-9811-a9aa793b332c.png` — 1536x768.
- S05 `25c89510-9741-563c-88b3-4f667f527abc.png` — 1536x768.

To rerun the five slice specs, place the corresponding source files in this directory. These source sheets and all files under `intake/` are non-runtime data and must not be referenced by the production manifest.

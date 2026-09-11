# ABYSSAL WAKE / 深渊苏醒

# Final Playtest Protocol V1

## 1. Purpose

This protocol defines the fixed real-device validation route for the current playable slice:

**HOME → OUTSIDE → MIRE MART → combat → loot → return HOME**

It is intended to provide a repeatable baseline for:

- frame pacing,
- local input responsiveness,
- PC/mobile control consistency,
- iPhone multi-touch behavior,
- 20–30 minute session stability,
- and later Macro Terrain A/B/C comparisons using the same measurement contract.

The primary diagnostic source is:

```js
ABYSSAL_PERF_V1.snapshot()
```

This protocol does **not** treat Relay RTT, network ping, or server timing as local input latency.

No runtime instrumentation changes are required by this protocol.

---

## 2. Measurement Contract

### 2.1 `refreshHz` is a measured/estimated value

`refreshHz` in `ABYSSAL_PERF_V1.snapshot()` is a **measured / estimated refresh rate derived from frame timing median estimation**.

It must be reported as:

- `measured refreshHz`, or
- `estimated refreshHz`.

It must **not** be described as the display panel's hardware actual refresh rate.

A device or OS may nominally support 60 Hz, 120 Hz, ProMotion, or another display mode, while the browser's observed frame cadence differs. Record both when known:

```text
Configured / nominal display mode: 120 Hz
Measured / estimated refreshHz: 118.9
```

For benchmark validity, the snapshot estimate is the observed browser-frame cadence used by this protocol.

---

### 2.2 Frame-time metrics

Every formal snapshot must preserve all of the following frame metrics:

- `fps`
- `avgFrameMs`
- `p95FrameMs`
- `rollingAvgFrameMs`
- `rollingP95FrameMs`
- `refreshHz`
- `longFrameCount`
- `hitchCount`
- `fpsDriftPct`

Interpretation:

- `avgFrameMs` / `p95FrameMs` are **short-window metrics**.
- `rollingAvgFrameMs` / `rollingP95FrameMs` are the preferred metrics for more stable scene-to-scene comparison.
- `longFrameCount` / `hitchCount` are **session cumulative counters**.

A later snapshot therefore normally has equal or larger cumulative counter values even if the current scene itself is smooth.

Do **not** label a stage as producing N hitches by reading its absolute snapshot counter alone.

Use adjacent snapshot deltas.

Example:

```text
OUTSIDE stage long frames = S2.longFrameCount - S1.longFrameCount
MIRE MART stage long frames = S3.longFrameCount - S2.longFrameCount
COMBAT stage hitches = S4.hitchCount - S3.hitchCount
```

For the fixed route:

```text
HOME stage          = S1 - S0
HOME→OUTSIDE stage  = S2 - S1
MIRE MART stage     = S3 - S2
COMBAT stage        = S4 - S3
LOOT stage          = S5 - S4
RETURN stage        = S6 - S5
```

The same delta rule applies to any later cumulative counters added to the snapshot contract.

---

### 2.3 Input metrics are session-to-date summaries

Each input metric currently exposes session-to-date summary fields:

- `accepted`
- `rejected`
- `handlerAvgMs`
- `handlerP95Ms`
- `visualAvgMs`
- `visualP95Ms`
- `lastVisualMs`

Interpretation rules:

1. `accepted` / `rejected` are counters. Adjacent snapshot deltas may be used to determine how many new accepted/rejected inputs occurred during a stage.
2. `handlerAvgMs`, `handlerP95Ms`, `visualAvgMs`, and `visualP95Ms` are session-to-date statistical summaries. **Never subtract two snapshots to derive a stage-specific average or P95 latency.**
3. `lastVisualMs` represents the latest recorded sample, not a stage average.
4. If a strict isolated latency benchmark is required for one action or one device mode, perform a **fresh reload** and execute the fixed isolated scenario defined in Section 12. Do not modify instrumentation for this purpose.

Example of valid count analysis:

```text
New PC attacks accepted during COMBAT =
S4.input["pc:attack"].accepted - S3.input["pc:attack"].accepted
```

Example of invalid latency analysis:

```text
INVALID:
S4.visualP95Ms - S3.visualP95Ms
```

The result above is not a stage latency and must not be reported as one.

---

### 2.4 `fpsDriftPct` has an internal runtime baseline

`fpsDriftPct` is calculated by the runtime against its own **early sampling-window baseline**.

That internal runtime baseline is not the same thing as this protocol's `S0 — HOME WARM` external comparison baseline.

Use them for different purposes:

- **Runtime `fpsDriftPct`**: built-in drift signal relative to the runtime's early samples.
- **S0 HOME WARM**: the playtest protocol's external reference snapshot for comparing later scenes and later soak checkpoints.

Do not state that `fpsDriftPct` is directly calculated from S0 unless the runtime contract changes in a future version.

---

## 3. Test URL and Environment

Run the candidate with:

```text
?devperf=1
```

Before each formal run confirm:

- DEV PERF instrumentation is active.
- F3 show/hide behavior works where applicable.
- Browser DevTools CPU/network throttling is disabled.
- Browser zoom is 100% on desktop.
- No unrelated screen recording or performance overlay is running unless that is itself the test condition.
- Candidate comparisons use the same viewport, DPR, browser family/version, power mode, and display configuration where possible.

For every checkpoint, save the full object returned by:

```js
ABYSSAL_PERF_V1.snapshot()
```

Do not manually transcribe only selected fields when a full snapshot can be preserved.

---

## 4. Required Device Matrix

### 4.1 Desktop — nominal/configured 60 Hz

Record:

- device / GPU if known,
- OS,
- browser and version,
- configured display mode,
- measured / estimated `refreshHz`,
- viewport,
- DPR.

Primary controls:

- keyboard movement,
- Space attack,
- Shift dash,
- E interaction.

Do not invent a mouse attack test if the current runtime has no mouse attack binding.

---

### 4.2 Desktop — nominal/configured 120 Hz

Use a physical display capable of the target mode and configure the OS/display accordingly.

Record the configured display mode separately from measured / estimated `refreshHz`.

Do not label a 144/165 Hz run as a 120 Hz run unless the display has actually been configured to 120 Hz.

Do not substitute DevTools simulation for a real high-refresh display test.

Primary comparisons against 60 Hz:

- measured / estimated `refreshHz`,
- rolling frame time,
- long-frame/hitch deltas by stage,
- local attack/dash/interact responsiveness,
- any refresh-rate-dependent gameplay-speed anomaly.

---

### 4.3 iPhone Safari

At least one physical iPhone Safari run is required.

Record:

- iPhone model,
- iOS version,
- Safari version,
- Low Power Mode ON/OFF,
- nominal/configured display class (60 Hz / ProMotion / other),
- measured / estimated `refreshHz`,
- orientation,
- viewport,
- DPR.

For ProMotion devices, do not infer that the browser is presenting at 120 Hz solely because the panel supports it. Use the measured / estimated `refreshHz` as the observed browser-frame cadence.

---

## 5. Pre-Test Reset and Warm-Up

Each formal run starts with a full page reload.

1. Reload the candidate.
2. Enter the playable session normally.
3. Do not carry forward a previous test session.
4. Remain in HOME for **30 seconds** with light normal movement or idle behavior.
5. Do not background the browser during warm-up.
6. Save the full snapshot as:

```text
S0 — HOME WARM
```

S0 is the protocol's external comparison baseline.

It is **not** the same as the runtime baseline used internally for `fpsDriftPct`.

---

## 6. Snapshot Naming

Use these exact checkpoints:

```text
S0 — HOME WARM
S1 — HOME
S2 — OUTSIDE
S3 — MIRE MART
S4 — COMBAT
S5 — LOOT
S6 — RETURN HOME
```

Each snapshot must preserve the complete `ABYSSAL_PERF_V1.snapshot()` output.

For review tables, additionally surface:

```text
fps
avgFrameMs
p95FrameMs
rollingAvgFrameMs
rollingP95FrameMs
measured / estimated refreshHz
longFrameCount
hitchCount
fpsDriftPct
input summaries
```

---

## 7. Stage A — HOME

Duration: approximately 60 seconds after S0.

Perform:

- four-direction movement,
- diagonal movement,
- repeated direction reversals,
- movement near major HOME props,
- campfire approach,
- one normal UI open/close sequence if available,
- at least one interaction.

PC:

- keyboard movement,
- E interaction.

Mobile:

- joystick movement,
- action/interact control.

Save:

```text
S1 — HOME
```

Stage cumulative-counter deltas:

```text
HOME long frames = S1.longFrameCount - S0.longFrameCount
HOME hitches     = S1.hitchCount - S0.hitchCount
```

Qualitative notes:

- camera judder,
- sprite judder,
- delayed-feeling input,
- UI-associated hitch,
- visible presentation anomaly.

---

## 8. Stage B — HOME → OUTSIDE

Leave Safe Camp through the normal route and continue into OUTSIDE for roughly 20–30 seconds.

Do not teleport or use debug repositioning.

Perform:

- sustained movement,
- diagonal movement,
- multiple direction changes,
- dash ×5.

Mobile must perform joystick movement while using the dash action with another finger.

Save:

```text
S2 — OUTSIDE
```

Stage deltas:

```text
HOME→OUTSIDE long frames = S2.longFrameCount - S1.longFrameCount
HOME→OUTSIDE hitches     = S2.hitchCount - S1.hitchCount
```

Check specifically:

- Safe Camp boundary transition,
- ambience/environment activation,
- dash presentation,
- camera follow,
- joystick interruption.

---

## 9. Stage C — OUTSIDE → MIRE MART

Follow the same benchmark route into **MIRE MART** for all comparable candidates.

At MIRE MART:

1. Traverse the local area once.
2. Remain in the area for approximately 20 seconds.
3. Reverse direction rapidly at least 10 times.
4. Perform two interactions if the current content allows them.

Save:

```text
S3 — MIRE MART
```

Stage deltas:

```text
MIRE MART long frames = S3.longFrameCount - S2.longFrameCount
MIRE MART hitches     = S3.hitchCount - S2.hitchCount
```

For scene comparison, prioritize:

- `rollingAvgFrameMs`,
- `rollingP95FrameMs`,
- stage long-frame delta,
- stage hitch delta.

Do not rely on FPS alone.

---

## 10. Stage D — Combat

Use a normal playable-slice enemy encountered through regular gameplay.

Do not:

- debug-spawn the target,
- modify HP,
- modify damage,
- modify range,
- modify attack cooldown.

Minimum sequence:

- ≥10 attacks,
- ≥3 dashes,
- receive at least one mob hit when safely reproducible,
- kill at least one mob.

PC sequence should include:

- movement → attack,
- movement → dash,
- dash → attack,
- attack → rapid direction change.

Mobile sequence should include joystick + action-button multi-touch.

Save:

```text
S4 — COMBAT
```

Stage deltas:

```text
COMBAT long frames = S4.longFrameCount - S3.longFrameCount
COMBAT hitches     = S4.hitchCount - S3.hitchCount
```

Input counts may use snapshot deltas.

Example:

```text
New mobile attacks accepted during combat =
S4.input["mobile:attack"].accepted - S3.input["mobile:attack"].accepted
```

Do **not** subtract `handlerAvgMs`, `handlerP95Ms`, `visualAvgMs`, or `visualP95Ms` between S3 and S4.

For this route test, preserve the S4 session-to-date summaries and note any visible outlier or `lastVisualMs` anomaly.

---

## 11. Stage E — Loot

After combat:

- perform one normal combat loot flow,
- perform one nearby resource/interaction action if available,
- do not reload or reset instrumentation.

Save:

```text
S5 — LOOT
```

Stage deltas:

```text
LOOT long frames = S5.longFrameCount - S4.longFrameCount
LOOT hitches     = S5.hitchCount - S4.hitchCount
```

Check:

- one input produces one action,
- no duplicate loot/action,
- toast/feedback timing feels immediate,
- no obvious loot-associated hitch.

---

## 12. Stage F — Return HOME

Return toward HOME using the same route as closely as practical.

During return:

- normal movement,
- dash ×3,
- at least one rapid direction reversal,
- on mobile, continue normal two-finger control usage.

After re-entering HOME, continue moving for approximately 20 seconds.

Save:

```text
S6 — RETURN HOME
```

Stage deltas:

```text
RETURN long frames = S6.longFrameCount - S5.longFrameCount
RETURN hitches     = S6.hitchCount - S5.hitchCount
```

Compare S6 against the external protocol baselines S0/S1 for:

- FPS,
- short-window frame time,
- rolling frame time,
- apparent responsiveness,
- audio accumulation,
- visible pacing degradation.

Remember that absolute `longFrameCount` and `hitchCount` are cumulative and therefore are expected to be higher than S0/S1 after normal session progression.

---

## 13. Isolated Input Latency Benchmark

Use this only when a strict independent local input-latency measurement is required.

Because the input averages and P95 values are session-to-date summaries, each isolated benchmark must begin from a **fresh reload**.

Do not derive isolated latency by subtracting route snapshots.

### 13.1 PC attack benchmark

Fresh reload → warm-up → perform a fixed number of Space attacks under a controlled low-complexity scene.

Recommended sample sequence:

```text
20 accepted Space attacks
No intentional dash/interact inputs during the sample
```

Record the final `pc:attack` summary:

```text
accepted
rejected
handlerAvgMs
handlerP95Ms
visualAvgMs
visualP95Ms
lastVisualMs
```

Repeat from another fresh reload for PC dash or PC interact if an independent metric is required.

### 13.2 Mobile attack benchmark

Fresh reload → warm-up → perform a fixed number of attack-button pointerdowns while keeping other action inputs out of the sample.

Recommended:

```text
20 accepted mobile attacks
```

Record the final `mobile:attack` session summary.

Repeat from fresh reload for other isolated mobile actions.

This protocol intentionally does **not** request instrumentation changes to create per-stage statistical buckets.

---

## 14. iPhone Multi-Touch Protocol

### M1 — Joystick + Attack

Finger A:

- hold and steer joystick continuously.

Finger B:

- attack 20 times.

PASS conditions:

- joystick movement does not stop,
- attack finger does not steal joystick ownership,
- one press does not produce duplicate attack actions,
- releasing Finger B does not cancel Finger A movement.

---

### M2 — Joystick + Dash

Finger A:

- maintain joystick movement.

Finger B:

- dash 10 times.

PASS conditions:

- movement remains active,
- dash does not double-fire,
- releasing dash finger does not terminate joystick ownership.

---

### M3 — Joystick + Interaction

Approach an interaction target with Finger A controlling joystick.

Use Finger B for interaction.

PASS conditions:

- interaction executes once,
- no ghost click,
- joystick state after interaction matches intended gameplay semantics.

---

### M4 — Secondary Joystick Finger

1. Finger A acquires joystick ownership.
2. Finger B touches the joystick area.
3. Release Finger B first.

PASS:

- Finger A continues to control movement.

Then release Finger A.

PASS:

- joystick returns to center,
- movement stops normally.

---

### M5 — Three-Finger Stress

For approximately 20 seconds:

- Finger A = joystick,
- Finger B = attack,
- Finger C = dash or use/interact.

This is a control-isolation stress test, not the primary performance benchmark.

Check for:

- pointer ownership loss,
- duplicate action,
- ghost click,
- stuck joystick,
- stuck action state.

---

## 15. 20–30 Minute Soak Protocol

Minimum formal soak: **20 minutes**.

Recommended: **30 minutes**.

Do not satisfy the soak requirement by remaining idle in HOME.

Repeat normal gameplay loops based on:

**HOME → OUTSIDE → MIRE MART → combat → loot → HOME**

Target workload over the session:

- ≥3 complete route loops,
- ≥3 combats,
- ≥30 attacks,
- ≥10 dashes,
- ≥10 interactions,
- repeated multi-touch usage on mobile.

Save full snapshots at:

```text
T+0 / post-warm-up
T+5
T+10
T+20
T+30 if running the recommended 30-minute soak
```

For each soak snapshot preserve:

- `fps`,
- `avgFrameMs`,
- `p95FrameMs`,
- `rollingAvgFrameMs`,
- `rollingP95FrameMs`,
- measured / estimated `refreshHz`,
- cumulative `longFrameCount`,
- cumulative `hitchCount`,
- `fpsDriftPct`,
- full input summaries.

For interval-specific long-frame/hitch analysis, use checkpoint deltas:

```text
T+5 interval hitches  = T+5.hitchCount  - T+0.hitchCount
T+10 interval hitches = T+10.hitchCount - T+5.hitchCount
T+20 interval hitches = T+20.hitchCount - T+10.hitchCount
```

Do not compare raw cumulative counters as if they represent identical-duration scene samples.

---

## 16. Soak Stability Review

### Frame stability

Compare later soak snapshots against the external T+0/S0 references using:

- FPS,
- short-window frame metrics,
- rolling frame metrics,
- runtime `fpsDriftPct`,
- long-frame/hitch deltas by interval.

Remember:

`fpsDriftPct` remains relative to the runtime's own early internal baseline; T+0/S0 is the playtest report's external baseline.

### Runtime behavior

Check for:

- gameplay speed changing over time,
- progressively delayed-feeling input,
- stuck joystick,
- duplicate actions,
- increasing audio layering,
- unexpected browser reload,
- obvious thermal degradation.

Thermal state should be noted when observable because mobile performance may decline without implying a code-level leak.

---

## 17. Visible Hitch Annotation

Whenever a clearly visible hitch occurs, add an annotation:

```text
Timestamp:
Stage:
Action:
Observed effect:
Previous snapshot / local counter reference:
Next snapshot / local counter reference:
Long-frame delta:
Hitch delta:
```

Example:

```text
Stage: MIRE MART entry
Action: crossed POI boundary while dashing
Observed effect: one visible freeze
Long-frame delta for stage: +1
Hitch delta for stage: +1
```

Avoid unquantified notes such as only "felt laggy" when the diagnostic counters can also be recorded.

---

## 18. Macro Terrain A / B / C Comparison Baseline

Future terrain candidates:

- **A = 64×64**
- **B = Macro**
- **C = Base + Macro Detail**

must use this same route and measurement contract.

Hold constant as far as practical:

- device,
- OS,
- browser/version,
- configured display mode,
- viewport,
- DPR,
- power mode,
- route,
- warm-up,
- approximate combat workload,
- test duration.

For each candidate preserve S0–S6.

Primary comparison table:

```text
HOME rollingAvgFrameMs
HOME rollingP95FrameMs
OUTSIDE rollingAvgFrameMs
OUTSIDE rollingP95FrameMs
MIRE MART rollingAvgFrameMs
MIRE MART rollingP95FrameMs
COMBAT rollingAvgFrameMs
COMBAT rollingP95FrameMs

Stage long-frame deltas
Stage hitch deltas
Measured / estimated refreshHz
Runtime fpsDriftPct

Input accepted/rejected count deltas
Session-to-date handlerAvgMs / handlerP95Ms
Session-to-date visualAvgMs / visualP95Ms
lastVisualMs
```

Do not derive stage-specific input AVG/P95 values by subtracting candidate snapshots.

If strict latency comparison between A/B/C is required, use the isolated fresh-reload benchmark in Section 13 for each candidate.

---

## 19. Result Sheet

Use the following report template.

```text
Build / SHA:
Branch:
Date:
Tester:

Device:
OS:
Browser:
Browser version:
Configured / nominal display mode:
Measured / estimated refreshHz:
Viewport:
DPR:
Power / Low Power Mode:

S0 — HOME WARM
FPS:
avgFrameMs:
p95FrameMs:
rollingAvgFrameMs:
rollingP95FrameMs:
longFrameCount cumulative:
hitchCount cumulative:
fpsDriftPct:

S1 — HOME
FPS:
avgFrameMs:
p95FrameMs:
rollingAvgFrameMs:
rollingP95FrameMs:
longFrameCount cumulative:
hitchCount cumulative:
Stage long-frame delta S1-S0:
Stage hitch delta S1-S0:
fpsDriftPct:

S2 — OUTSIDE
FPS:
avgFrameMs:
p95FrameMs:
rollingAvgFrameMs:
rollingP95FrameMs:
longFrameCount cumulative:
hitchCount cumulative:
Stage long-frame delta S2-S1:
Stage hitch delta S2-S1:
fpsDriftPct:

S3 — MIRE MART
FPS:
avgFrameMs:
p95FrameMs:
rollingAvgFrameMs:
rollingP95FrameMs:
longFrameCount cumulative:
hitchCount cumulative:
Stage long-frame delta S3-S2:
Stage hitch delta S3-S2:
fpsDriftPct:

S4 — COMBAT
FPS:
avgFrameMs:
p95FrameMs:
rollingAvgFrameMs:
rollingP95FrameMs:
longFrameCount cumulative:
hitchCount cumulative:
Stage long-frame delta S4-S3:
Stage hitch delta S4-S3:
fpsDriftPct:

S5 — LOOT
FPS:
avgFrameMs:
p95FrameMs:
rollingAvgFrameMs:
rollingP95FrameMs:
longFrameCount cumulative:
hitchCount cumulative:
Stage long-frame delta S5-S4:
Stage hitch delta S5-S4:
fpsDriftPct:

S6 — RETURN HOME
FPS:
avgFrameMs:
p95FrameMs:
rollingAvgFrameMs:
rollingP95FrameMs:
longFrameCount cumulative:
hitchCount cumulative:
Stage long-frame delta S6-S5:
Stage hitch delta S6-S5:
fpsDriftPct:

Input summaries at final route snapshot:
pc:attack accepted/rejected/handlerAvg/handlerP95/visualAvg/visualP95/lastVisual:
pc:dash accepted/rejected/handlerAvg/handlerP95/visualAvg/visualP95/lastVisual:
pc:interact accepted/rejected/handlerAvg/handlerP95/visualAvg/visualP95/lastVisual:
mobile:attack accepted/rejected/handlerAvg/handlerP95/visualAvg/visualP95/lastVisual:
mobile:dash accepted/rejected/handlerAvg/handlerP95/visualAvg/visualP95/lastVisual:
mobile:interact accepted/rejected/handlerAvg/handlerP95/visualAvg/visualP95/lastVisual:

Input accepted/rejected stage deltas:

Multi-touch:
M1:
M2:
M3:
M4:
M5:

Soak duration:
T+0 snapshot saved: YES/NO
T+5 snapshot saved: YES/NO
T+10 snapshot saved: YES/NO
T+20 snapshot saved: YES/NO
T+30 snapshot saved: YES/NO/N/A

Interval long-frame deltas:
Interval hitch deltas:
Runtime fpsDriftPct final:
External S0/T+0 comparison notes:

Audio accumulation observed:
Duplicate listener/input behavior observed:
Joystick stuck:
Ghost click:
Double action:
Browser reload/crash:
Thermal degradation notes:

Visible hitch annotations:

Verdict:
PASS / PASS WITH NOTES / FAIL
```

---

## 20. Gate Rules

### FAIL

Any reproducible occurrence of the following is a release/playtest failure:

- attack, dash, or interaction double-trigger,
- joystick cancellation by an unrelated pointer release,
- stuck joystick,
- gameplay speed changing with refresh cadence,
- sustained long-session frame-performance degradation not explained by test conditions,
- progressively worsening local input responsiveness,
- accumulating/repeated audio layers,
- reproducible severe hitch interrupting normal combat,
- browser crash or unexpected Safari reload.

### PASS WITH NOTES

Use when:

- a rare hitch cannot be reliably reproduced,
- a scene is playable but rolling P95 is materially weaker than the established baseline,
- one required hardware class is unavailable,
- thermal or OS conditions make a run partially inconclusive.

All missing coverage must be named explicitly.

### PASS

Requires:

- full route completed,
- required snapshots saved,
- cumulative counters interpreted through stage deltas,
- PC/mobile behavior consistent with current design,
- iPhone multi-touch checks passed where applicable,
- soak shows no cumulative stability failure,
- no misuse of RTT as local input latency,
- no subtraction of session-to-date AVG/P95 input metrics,
- measured / estimated `refreshHz` reported as an estimate rather than hardware actual refresh rate.

---

## 21. Required Deliverables Per Device

Submit:

1. Device and environment metadata.
2. Complete S0–S6 snapshot objects.
3. Stage long-frame/hitch deltas.
4. Input accepted/rejected deltas where relevant.
5. Session-to-date input latency summaries.
6. Isolated fresh-reload input benchmark results when requested.
7. Multi-touch M1–M5 results on iPhone/mobile hardware.
8. 20–30 minute soak snapshots.
9. Visible hitch annotations.
10. Final `PASS`, `PASS WITH NOTES`, or `FAIL` verdict.

For Macro Terrain work, also submit the A/B/C comparison table using the same device and route.

Any item not executed on physical hardware must be marked:

```text
NOT VERIFIED ON HARDWARE
```

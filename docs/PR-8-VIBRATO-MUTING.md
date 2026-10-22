# Issue #8 — finger selection and muting variations

## Changed
Existing drill ID and records are preserved. Seven short manual stages now show exact G-string targets,
with direct finger 1–4 buttons and Repeat this stage. Added gentle/medium/optional-wide comparison,
controlled bend-and-return and a precise 1–3–1 hammer-on/pull-off diagram. Instructions distinguish
thicker/lower-pitched D from thinner/higher-pitched B, include separate muting/choking remedies,
and allow different comfortable hand positions. Fixed technique frets do not transpose with session key.

## Automated acceptance
`npm run check` and all 369 Node tests pass on this independent main-based branch.
New tests check actual string/fret/pitch/finger data and execute the real stage-selection functions
against a running-session state: timer, elapsed time, BPM, labels, diagram preference, rating and
history stay unchanged. The shared baseline-test corrections also appear in #15 and merge identically.
Existing cached assets are reused; there is no new audio engine or asset download.

## Owner playing/browser acceptance before merge
- From Muting & precision, start G-string vibrato; select fingers 1, 2, 3 and 4 directly.
- Check each displayed fret against the instruction and verify only G sounds through several cycles.
- Isolate D ghosting, B ringing and choked G separately; adjust contact instead of adding force.
- Check 5–7–5 with fingers 1–3–1 and both index/ring vibrato transitions.
- Try optional width/bend stages only within comfort. Confirm Repeat/finger changes preserve timer/BPM.
- Check desktop/mobile layout, labels and existing progress/export after completing the drill.

Guitar ergonomics and browser listening have not been verified in this environment. Issue #8 remains
open for owner acceptance and any broader timed-stage rollout. No global auto-advance is introduced.

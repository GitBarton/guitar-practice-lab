# Guitar Practice Lab — Release history

This changelog mirrors the **What’s new** screen in the application. Releases become public when their pull request is merged into `main` and GitHub Pages finishes deploying.

## 1.1.0 — 2026-10-12 — Precision and feedback

- New 0–100% self-assessed execution-quality rating in 10% increments, using one-tap presets and ±10% adjustment.
- Progress, recent drills, CSV exports and 7-day report recognize numeric percentage scores.
- Historical clean / mostly clean / needs work results remain unchanged; **no fabricated percent conversion**.
- Dedicated release-history screen, accessible from the version link in the header and Settings.
- Reworked practice layout: exercises and clearer guided instructions together, timing/metronome to the right on wider screens.
- Fix Hide labels in TAB and fretboard diagrams.
- Optional, explicit-consent development feedback queue, hourly GitHub issue collection and owner-reviewed PR process.
- End-of-exercise timer chime and separate exercise-design feedback added during the 1.1 development cycle.
- Updated offline service-worker cache identifier for this version.

**Deployment:** changes become live only after the repository owner merges the pull request into `main`.

## 1.0.0 — 2026-10-08 — Initial release

- Local-first, zero-build jazz guitar practice app for PC, Mac and iPhone.
- 35 drills, practice sessions, TAB and fretboard diagrams and Web Audio metronome.
- Logos-Motive repertoire library, twelve-key rotation and practice notes.
- Local progress, weekly text reports, CSV/JSON backup, optional private Supabase synchronization.

## Rating interpretation

The new score is **your subjective estimate of execution quality**, not measured technical accuracy. A 100% rating means you judged the exercise clean and confident at that BPM and key. Compare results only for equivalent exercises, keys, subdivisions and positions. For tempo comparisons, a 90%+ numeric score or a legacy `clean` rating qualifies, with explicit labeling.

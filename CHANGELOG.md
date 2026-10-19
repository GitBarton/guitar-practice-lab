# Guitar Practice Lab — Release history

This changelog mirrors the **What’s new** screen in the application. Releases become public when their pull request is merged into `main` and GitHub Pages finishes deploying.

## 2.0.0 — 2026-10-17 — Release candidate (not yet published)

- Consolidates recently integrated staged jazz coaching, staff/TAB, dynamic rhythm exercises, expanded arpeggio vocabulary and local chord backing.
- Adds incremental major/minor sixth-diminished Barry Harris-inspired studies from PR #56 (requires upstream merge).
- Maintains existing local-first data, optional sync and historical rating formats.
- **Not a claim that all 25 issues are resolved:** audio acceptance, fretboard ergonomics, rhythmic notation and several extended curricula still require review. Do not publish or tag until verification passes.

## 1.2.0 — 2026-10-13 — Dynamic technique and musical challenges

- Guided picking stages for isolation, skips, double-stops and octave grips.
- Manually advanced major pentatonic phrasing stages with clearer question-and-answer exercises.
- Four-finger G-string vibrato exercise, with explicit muting of neighboring strings and hammer-on/pull-off control.
- Corrected selected-key chromatic enclosure explanations and B-flat naming.
- Existing session records, tempo and metronome, 10%-step scoring, offline use and private cloud sync remain intact.

**Scope:** This release does NOT yet include chord backing, local MP3/WAV playback, expanded Barry Harris curriculum or the finished arpeggio route redesign. These are tracked in Issues #15–#18 and in independent draft PRs #19 and #20. Validate this release on PC before merging.

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

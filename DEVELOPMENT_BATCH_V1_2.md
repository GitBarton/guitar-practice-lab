# Guitar Practice Lab — Feedback Batch v1.2 (draft)

This is the shared **release integration branch** for the active development issues. It combines compatible improvements behind **one draft PR**, reviewed and manually merged by the owner only after acceptance testing. **Do not merge a draft simply because CI passes.**

## Issue review — all open requests

| Issue | Request | Batch handling | Status |
| --- | --- | --- | --- |
| [#3](https://github.com/GitBarton/guitar-practice-lab/issues/3) | Picking, string isolation, double-stops, octaves, dynamic stages | Add example staged picking drill; advanced pitch-specific examples to follow | Partial |
| [#4](https://github.com/GitBarton/guitar-practice-lab/issues/4) | More ergonomic dominant arpeggio paths/fingering; backing | Needs fingering-path algorithm review and diagram audit across 12 keys | Pending |
| [#5](https://github.com/GitBarton/guitar-practice-lab/issues/5) | Pentatonic clarity, rhythmic changes, Rhodes harmony, tempo | Tempo persistence addressed by merged PR #9; clearer stages in this batch; harmony pending | Partial |
| [#6](https://github.com/GitBarton/guitar-practice-lab/issues/6) | Chromatic enclosure clarity and key variation | Existing tested draft PR #11 included as base; stage guidance follows | Partial |
| [#7](https://github.com/GitBarton/guitar-practice-lab/issues/7) | ii–V–I or V–I audible chords in ear drill | Plan optional, tempo-aware accompaniment and on-screen chord labels | Pending |
| [#8](https://github.com/GitBarton/guitar-practice-lab/issues/8) | G-string vibrato with fingers 1–4; mute D/B; dynamic stages | Add dedicated drill, true G-string diagram and early manual-stage model | Partial |
| [#10](https://github.com/GitBarton/guitar-practice-lab/issues/10) | Harmony modes, minor scales and improvisation with Rhodes | Large feature: needs coherent theory, voicing and audio design | Pending |

## Shared release criteria

- [ ] All selected changes are implemented and individually tested
- [ ] Visual validation at PC browser zoom 75%, 100%, and 125%
- [ ] Guitar TAB and fretboard show musically correct targets and fingering
- [ ] No silent clearing of recorded practice, Supabase login, local state, feedback or report history
- [ ] Timer and metronome maintain their behavior on stage changes (PR #9 fixes live BPM)
- [ ] Existing 35+ drills, songs, key rotation, scores, label modes, backups and release notes remain working
- [ ] GitHub CI green and owner approves merge

## Technical approach

Add opt-in, *manual* exercise stages to selected drills with a central stage helper. This allows multiple musical challenges within one exercise without overriding the 45-minute timer or forcing a full-screen re-render of the whole application. Stages can be advanced/repeated at the student's pace and are saved with the in-progress session. Static drills remain unchanged.

For backing audio and improvisation (#4/#5/#7/#10), prefer a later self-contained Web Audio or bundled-license-suitable solution with explicit volume and transport controls, no autoplay, and reliable chord labels.

## Automation reliability

The GitHub Actions collector already runs independently from ChatGPT and retains Issues. A ChatGPT scheduled development task has switched itself off on prior executions, with **no execution failure reason exposed** through the available task status. Do not treat its hourly schedule as reliable automatic coding. Each release can still be processed on demand in chat; a truly unattended coding agent needs a separately configured, durable agent runner and permissions. Preserve human approval for the final PR.

Status labels in this document describe **planning state**, not GitHub issue closure. Close individual Issues only when their acceptance criteria are actually met, usually after the merged release ships.

# Guitar Practice Lab 2.0.0 — issue reconciliation (2026-10-17)

This is an acceptance checklist, not an assertion that all requests are completed. Do not close issues from this document alone.

## Existing implementation / verify before closing

| Issues | Current coverage | Remaining acceptance |
|---|---|---|
| #3, #25 | Staged picking, skips, double stops and octaves | Pentatonic variations, aligned simultaneous notes, finger-label visibility |
| #4, #51 | Dominant routes, diminished-triad vs fully diminished seventh, expanded arpeggios | In-position fingering review in C, Bb, Db, Eb; clarify double-flat seventh |
| #5, #27 | Pentatonic questions/answers and shape reference | Verify all requested three-route patterns and concrete chord backing |
| #6, #28, #52 | Chromatic enclosure explanations, key-aware jazz target coach | Verify fret routes, legible and changing target UI during live drills |
| #7, #29 | Ear-guide target stages and chord backing | Audible target/degree cue and visibility timing in actual browser |
| #26, #45 | Shell-voicing variety and rhythm staging | Ride-like accompaniment and more progression choices |
| #44, #48, #50 | Metronome shortcut and rhythmic string-skip stages | Sound-level listening test and rotating positions/patterns |
| #46, #49 | ii–V–I stages, key change, guide-tone targets, chord backing | Position variance, in-drill chord sync, resolution targets in desktop audio QA |
| #8 | Four-finger vibrato and muting stages | Physical ergonomics and ghost-note check |
| #18 | PR #56 sixth-diminished expansion | Harmonized inversions, vocabulary, C/Bb/Db/Eb guitar validation |

## Separate, larger acceptance scopes

- **#10:** Dynamic modal improvisation and responsive 7th-chord challenges; confirm stage coverage and harmony accuracy.
- **#15:** Shared Web Audio transport, chord voice leading, no-clipping, 12-key/browser audio testing.
- **#16:** Dedicated major/minor ii–V–I Zone; check every stated lesson mode, voicing and audio schedule.
- **#17:** Local-only MP3/WAV user-track transport; verify imports, seeking, looping, cleanup and privacy.
- **#13:** Development-queue dashboard/meta issue, not a product defect.

## Proposed release gate

1. Merge feature PR #56 first, then retarget the release candidate to updated main and verify GitHub reports mergeable.
2. Run `npm run check` and `npm test` against the final candidate; ensure GitHub Actions are green.
3. PC browser manual checks: diagrams/TAB + staff at 75/100/125% zoom, audio startup/stop, key rotation, 10%-increment scoring, song practice, private-file re-selection.
4. Mobile viewport and keyboard accessibility spot checks.
5. Verify cache update (new `gpl-app-v2.0.0-rc-20261017`), retained local data and Supabase sync before tagging a release.
6. Only close individual issues after their complete acceptance criteria are checked, even where partial features are in main.

**No tag, deployment, issue closure or automatic merge is performed by this release-candidate branch.**

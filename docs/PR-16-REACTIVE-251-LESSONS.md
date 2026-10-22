# Issue #16 — reactive major/minor lessons

## Changed
The existing ii–V–I Zone gains five focus modes: roots, third/seventh (minor tonic third/sixth),
chord arpeggios, dominant enclosures resolving to tonic, and question/answer phrasing.
Current/next chord, exact targets, staff/TAB and fretboard follow the existing shared transport.
No second audio clock is introduced. #69 supplies audible-time beat updates; merge it first.

Next focus, Repeat focus and Challenge change targets without restarting sound or the timer.
Lower/middle guitar registers and four target variations are available. Silent Next chord lets the
same lessons work without audio; this preview cursor is disabled during playback.
Notation remains a pitch-only display, using the existing signature/accidental renderer; it is not
rhythmic engraving or a claim of universally optimal physical fingering.

Draft score/notes survive target updates and rerenders. Saved records retain existing fields and add
focus, guitar register, variation, root-position backing voicing family and next focus. JSON backup
and the existing record sync preserve these optional fields without a migration. Save before changing
key or mode: that starts a new timed attempt. Existing records remain unchanged.

## Automated acceptance
`npm run check` and 372 Node tests pass on this independent main-based branch.
Tests cover 2,880 key/mode/focus/chord/register/variation combinations, actual guitar pitches,
minor-six/flat-nine theory, chromatic approaches, control/record behavior, plus full app bootstrap
and real event handlers through a minimal DOM adapter. This is not a browser layout/listening test.

## Owner PC/mobile acceptance before merge
1. Merge #69 first. In C major and C minor, Play and check that targets switch with the sounding chord.
2. Choose all five focus modes; verify G7b9 and Cm6, including minor tonic third/sixth guidance.
3. Use Next/Repeat/Challenge and registers during playback; sound, score and notes should continue.
4. Stop sound, preview ii–V–I silently, add notes/next focus and save a 10%-step rating.
5. Confirm the saved record and JSON export retain the lesson fields, old records and prior song practice.
6. Check narrow screens, keyboard controls and offline reload after an online update.

Browser binary download failed in this environment. Listening and physical-guitar ergonomics need owner review.
Automatic key cycling, automatic lesson advancement after N bars, alternate piano voicing families,
and additional Barry Harris/comping modes remain separate work under #16. This PR does not close #16.

# CAGED modal-position source and validation notes

## Why the old B-string diagram was wrong for practice
The old `scaleTabTargets()` was a note locator: it generated consecutive MIDI pitches and then picked any string/fret with a small numeric cost. Correct pitches did **not** guarantee a usable guitar route, which led to visibly absurd string changes and apparently repeated diagrams.

This feature replaces it **on the Modes & Harmony page only** with five distinct, bounded **four-adjacent-fret positions** across all six strings. It uses C/A/G/E/D shape *root landmarks*, not a guess about optimal string changes.

## External references

1. **Berklee Online – Guitar Scales 101**, Lesson 6: "Five Major Scales in One Position" and **"One Scale in Five Positions on the Guitar"**; Lessons 8–11 cover modal and melodic-minor fingerboard construction and diminished scales: https://online.berklee.edu/courses/guitar-scales-101
2. **Berklee Online – How to Start Learning Your Guitar Scales**: movable finger positions and scale fingerings for all modes: https://online.berklee.edu/takenote/how-to-start-learning-your-guitar-scales/
3. **William Leavitt – A Modern Method for Guitar (Berklee Press)**, positional fingerings, moveable chord forms and scale studies: https://online.berklee.edu/store/product?category_id=9&product_id=11250
4. **String Warrior – CAGED System**: the C–A–G–E–D root-shape landmarks and five boxes on the fretboard: https://stringwarrior.com/theory/caged
5. **Guitar Mode Finder – CAGED**: why modes share five root-neighborhood regions, while their pitch collections and tonal centers differ: https://guitarmodefinder.com/guides/caged/

## What can be verified automatically
- CAGED reference root locations in C: C-form frets 0–3 (A-string root 3), A-form 3–6 (A string 3 / G string 5), G-form 5–8 (low E 8 / G 5), E-form 8–11 (low E 8 / D 10), D-form 10–13 (D 10).
- Each region transposes consistently to 12 keys; octave wrapping keeps the range within frets 0–22.
- **17 modes × 12 tonal centers × five regions = 1,020 distinct scale-position combinations** with correct note/fret values in standard tuning.
- Every note belongs to the chosen mode, appears on the declared guitar string and fret, and uses a suggested 0–4 finger number within a **four-adjacent-fret hand frame**.
- The note sequence moves from low E to high E with notes in ascending pitch: no spurious large leap on the B string.

## Important qualification

**CAGED** fundamentally describes connected chord-root shapes. For modal, altered, and diminished scales, the label identifies the related root neighborhood; it **does not** imply the scale is itself a standard major CAGED chord. This is a newly generated educational *position map*, **not a photocopy or a claim of identical fingering to a particular textbook**.

Recommended finger numbers are a four-fret default, not an instruction to stretch painfully. A guitarist should still test comfort, pick direction, shifts, root landings, and a full descending passage before merging.

## PC/manual review
1. Select C altered, compare all C/A/G/E/D buttons: verify five DIFFERENT fret ranges and B-string note groups.
2. Change to B altered and F# whole–half diminished; all notes should stay at frets 0–22.
3. Highlight ♭9 / ♯9 and confirm the target is on the correct pitch.
4. Check Tab and Fretboard SVG at 75%, 100%, 125% zoom and on a phone.
5. Audition the five regions in a real guitar position. Adjust fingering for your hands if an individual mapping is uncomfortable.

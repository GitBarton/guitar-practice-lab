# Reference audit: guitar diagram accuracy (phase 1)

The goal is to distinguish **pitch correctness** from **physical fingering correctness**. A sequence containing the correct pitch classes is not automatically a sensible guitar route.

## Grounded sources

- Berklee Online — *Jazz Guitar 101* (chord tones, target 3rds/7ths, approachable fretboard neighborhoods): https://online.berklee.edu/courses/jazz-guitar-101
- Berklee Online — *Voice Leading for Guitar* (guide tone function and efficient chord transitions): https://online.berklee.edu/takenote/voice-leading-for-guitar/
- Sweetwater / InSync — *5 Positions of the Minor Pentatonic* (five boxes, clearly located roots and suggested guitar fingering): https://www.sweetwater.com/insync/5-positions-of-the-minor-pentatonic-guitar-lesson/
- JustinGuitar — *Minor Pentatonic Five Positions* (conventional five-shape reference): https://www.youtube.com/watch?v=ZHBomQaAvQo
- Berklee Online — *Jazz Improvisation: 10 Scales* (modes, altered, Lydian dominant, diminished scale definitions): https://online.berklee.edu/takenote/jazz-improvisation-10-scales/

These are **musical references and conceptual checks**, not copied copyrighted charts or transcriptions.

## Current source-audit findings

1. The prior TAB renderer drew the G/B double-stop and E/D octave **one after the other**, even though the instruction is to strike both simultaneously. Both notes now share an explicit beat index and a vertically aligned TAB column.
2. The circle-of-fourths and circle-of-fifths drills use **+5 and +7 semitones** respectively and test all 12 tonal centers. The position diagram is a note-locator, **not a complete two-octave fingering chart**.
3. The new ear/approach target stages use chord-function tones in the selected key; the targets are mathematically validated.
4. The pre-existing **2/3-octave route generator** optimizes a cost function rather than implementing a published, conventional five-position fingering. Consequently, a mathematically correct diagram may still be awkward on guitar. It must NOT be described as an exact Berklee, CAGED, or JustinGuitar fingering. See separate audit task and subsequent PR for physically bounded, reference-checked routes.
5. Standard tuning is fixed to **E2 A2 D3 G3 B3 E4**; note/fret validation must check every displayed note, for all 12 keys and supported positions.

## Next audits and acceptance criteria

- Pentatonic: test conventional **A minor box 1** (E 5–8; A 5–7; D 5–7; G 5–7; B 5–8; high e 5–8) and its four connected positions against the lesson references; transpose with stable finger spans.
- Dominant 7th: compare 2-octave routes at low/mid/high against recognizable movable root-on-E/A/D neighborhoods; require a bounded fret span and explicitly allowed position shift.
- Each diagram should show **root, scale degree, string/fret and recommended fingering** without pretending that a pitch class alone determines a finger.
- Chord grids and note-attack displays should distinguish simultaneous double-stops from sequential notes.
- Automated tests cannot validate hand comfort. Validate the low-, mid- and high-neck diagrams on a real guitar, especially Bb, Db and Eb.

No repository code in this PR duplicates protected fingering diagrams or licensed etudes.

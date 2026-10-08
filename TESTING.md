# Acceptance and testing notes

## Automated checks

- `node --check app.js` and other JS syntax checks.
- `node --test tests/music.test.mjs` checks interval formulas, twelve-key rotation, SVG output and 2/3-octave note counts.

## Manual browser acceptance checklist

1. **GitHub Pages URL**: visit root path and deep link `#drill/arp-maj7`.
2. **Daily session**: create, start/pause timer, change tempo, rate drill, end session and verify Progress.
3. **Responsive**: Windows desktop 1280×800 and iPhone width 390 px; diagrams must horizontally scroll if necessary.
4. **Audio**: enable metronome after click; test 4/4, triplet, 6/8. The exact swing ratio is an illustrative practice cue.
5. **Library**: search for `muting`, filter `Jazz vocabulary`, open a drill, start solo practice.
6. **Diagrams**: switch TAB/Fretboard, labels Notes/Intervals/Hidden, advance selected note.
7. **Repertoire**: save Autumn Leaves working key, target tempo, notes and readiness; verify updated Songs list and Progress.
8. **History**: export Markdown weekly report, CSV, and JSON; import JSON and ensure no duplicates.
9. **Offline**: after a successful first HTTPS load, temporarily disconnect from internet, refresh and practise, then reconnect and sync.
10. **Cloud**: configure test project with SQL, sign in, create drill on Windows, sync, sign in on iPhone, verify same drill appears. Confirm another Supabase user cannot read that history.

## Known scope boundaries

- No server-side end-to-end tests without your actual Supabase project credentials.
- No audio transcription or fretboard motion capture.
- App does not embed copyrighted full-song charts or lyrics.
- Not every dynamically computed fingering is optimal for every player's hand or guitar model.

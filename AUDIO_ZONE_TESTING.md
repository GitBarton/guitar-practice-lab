# Major / Minor ii–V–I Audio Zone — Draft Prototype

This draft introduces browser-generated electric-piano-like chords with no samples, uploads, backend, paid APIs or copyright-restricted audio.

## PC test procedure

1. Open a development preview of this branch (or merge only after the owner approves). In the sidebar, select **ii–V–I Zone**.
2. Choose **C major**, **2 bars per chord**, BPM **72**, click ON and volume **Medium**.
3. Press **Play chords** once. Hear **Dm7 → G7 → Cmaj7** while three chord cards update, each for two bars.
4. Press **+5 BPM** and listen for a natural change after the current scheduled bar. Press Stop. Check that sound ceases.
5. Switch to **C minor** and verify **Dm7♭5 → G7♭9 → Cm6**. Test keys **Bb, Db, B** for note-spelling behavior.
6. Change chord duration to 1 and 4 bars. Try clicks OFF/ON and Soft/Medium/Loud volume. Verify no autoplay on refresh.
7. Choose a 0–100% subjective rating, add a note, and click **Save practice note**. Check Progress, local JSON export, cloud sync, then reload.
8. Start audio, navigate to Songs, and make sure audio stops immediately. Repeat with the browser tab hidden.
9. At 75%, 100% and 125% Chrome/Edge zoom, check that the progression and controls fit without horizontal overflow.
10. Verify the existing metronome and timer in a normal 45-minute practice session remain functional.

## Audio architecture

- `harmony.js`: pure theory, 12 key modes, explicit chord qualities and MIDI notes. No audio, no browser globals.
- `backing-audio.js`: Web Audio only; triangle-wave chord attacks filtered with a light decay, bass root, optional click scheduled on **the same AudioContext clock** as chords.
- `app.js`: ii–V–I route, backing transport controls, current-chord display and optional private practice log.
- `sw.js`: cache both new modules for offline practice.
- `tests/harmony.test.mjs`: reference harmonies, 12-key transposition, scheduler interval tests, pitches, invalid inputs.

## Honest limitations / planned follow-ups

- This is a synthetic **electric-piano-inspired** timbre, **not** a high-fidelity or sampled Fender Rhodes, and not a backing band.
- Harmony is a simple repeated ii–V–I pattern (one chord each bar), not a full rhythmic comping engine. No external track playback yet.
- Key/quality changes stop playback and need Play again. No advanced voicing inversions yet; root-position harmony is pedagogically clear but not optimal voice leading.
- The displayed bar updates slightly ahead of a scheduled onset (up to ~150 ms). Full beat-accurate highlighting is a follow-up.
- Changing tempo during active playback takes effect over subsequent bar scheduling.
- This draft needs **actual human listening and PC browser tests**; the CI suite cannot verify sound quality or device audio latency.
- There is no microphone processing, analysis of guitar audio, recording or playback of MP3/WAV yet; that feature is tracked separately.
- Training note does not upload audio or install additional cloud tables.

**PR strategy:** keep the large existing staged-drill PR #12 separate and in draft. Merge this feature only after dependency/conflict review, and update the in-app changelog/version for the final release. Do not publish both branches without checking their combined UI and state.

# Issue #15 — shared backing reliability slice

## Changed
- Stop/navigation cancels a pending AudioContext resume; newer Play requests supersede older requests.
- Apply the saved output volume on first Play and replay, retaining the shared audio graph.
- Publish chord and beat feedback when audio time reaches the scheduled event, rather than during lookahead.
- Skip missed attacks after a timer stall; disconnect completed oscillator/filter/gain graphs.
- Spell chord members by harmonic letter, including Cb in Gb major and double accidentals in theoretical minor keys.
- Refresh the offline cache. Reconcile stale merged-stage test signatures and minimum curriculum assertions.

## Automated acceptance
`npm run check`, all 373 Node tests, and 4 feedback-queue Python tests pass locally.
New deterministic engine tests cover cancellation, overlapping Play requests, saved gain, beat timing,
measure-boundary tempo changes, stop, timer stalls and major/minor playback in all 12 keys.

## Owner PC acceptance before merge
1. In the ii–V–I Zone, listen to C major Dm7–G7–Cmaj7, then C minor Dm7b5–G7b9–Cm6.
2. Use Soft volume before Play; change volume and tempo during playback. Check beat/chord alignment.
3. Stop, navigate away and hide the tab; no sound should resume unexpectedly.
4. In jazz-251, play piano chords, advance a stage and check that the practice timer is preserved.
5. Check offline playback after one online load. No microphone or network playback is introduced.

A local browser binary was unavailable and its download failed, so listening/browser acceptance is not claimed.

This is partial issue #15 work. Separate harmony/bass/click mix, swing feel and the remaining drill
integrations stay open. Issue #16 lesson expansion and issue #8 muting content are separate PRs.

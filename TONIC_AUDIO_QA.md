# ii–V–I Audio Clarity and Reverb: PC listening checklist

## Root-position tonic targets (reference)
| Mode | Chord | Piano MIDI | Pitches | Bass MIDI |
| --- | --- | --- | --- | --- |
| Major, C | Cmaj7 | 60,64,67,71 | C4 E4 G4 B4 | 48 (C3) |
| Minor, C | Cm6 | 60,63,67,69 | C4 E♭4 G4 A4 | 48 (C3) |

No chord-tone inversions are used for these tonics. They are rooted, ascending intervals, a full octave above the tonic bass. The former C2 bass and compact C3 tonic were especially muddy on small speakers.

## Listening validation — required before release
1. In **ii–V–I Zone**, select **C Major**, 1 bar each, 65–80 BPM, Wetness **Dry**, Volume **Medium**.
2. Listen to **Dm7 → G7 → Cmaj7** repeatedly. Confirm the third chord sounds like a clear major-seventh tonic, not an inverted chord or an unresolved dominant chord.
3. Switch to **C Minor**: **Dm7♭5 → G7♭9 → Cm6**. Confirm a minor tonic with a natural sixth (A), not Cm7 or Cm(maj7).
4. Toggle wetness from **Dry → Light room → Warm room → Wet → Very wet**, and make sure reverb is audible but doesn't overwhelm the chord change.
5. Increase volume to **Loud**; monitor headphones/speakers for harsh clipping, distortion, sudden jumps or feedback. Start from a modest device volume.
6. Change BPM while playing, and confirm the audio scheduler remains stable; switching from major to minor should stop and reset the progression.
7. Press Stop while reverb is ringing; confirm sound fades promptly and does not continue indefinitely. Reload the tab and check no autoplay.
8. Open **Songs → Practice with Track** and play an MP3/WAV, then switch to the ii–V–I player. Only the active transport should be audible.
9. Test at 75%, 100% and 125% browser zoom; check the new Reverb selector.
10. Verify a second key (Bb, Db and B recommended); check the chord root is still low note and all chord tones remain in ascending order.

The tests verify **MIDI pitches, root order, register, envelope constraints and generated impulse data**. Automated CI cannot validate subjective sound quality or actual speakers/headphones. No licensed instrument samples are involved.

The reverb is synthesized locally with a deterministic noise-decay impulse. It runs into a gain-managed output bus and a soft compressor to reduce peaks. It uses no external services or audio files.
# Guitar Practice Lab v1.0

A local-first, zero-build, static jazz guitar practice app. Mac, Windows, iPhone responsive. Includes 35 drills, practice sessions (45 min), interactive generated guitar TAB / fretboard / chord diagrams, Web Audio metronome, 12-key rotation, repertoire notes for Logos-Motive songs, one-tap drill ratings, weekly exports, CSV/JSON backups, and optional Supabase cloud synchronization.

## Start here

1. Open **SETUP.md** and follow its GitHub Pages instructions.
2. Optionally configure **Supabase** to share history between PC, iPhone and Mac. The app works locally without it.
3. Use the **Today** screen to start the session. Rate each drill; use the session recap to leave one actionable note.
4. Use **Progress → Copy 7-day report** to bring structured observations into ChatGPT.

**No npm install, build step, paid framework, paid API, or custom server required.**

## Architecture

- `index.html` — HTML entry and metadata
- `styles.css` — responsive desktop-first UI
- `data.js` — drill catalogue, repertoire and session composition
- `music.js` — note/shape generation and HTML-free SVG diagram renderers
- `storage.js` — localStorage, exports and optional Supabase synchronization
- `app.js` — navigation, interactions, Web Audio metronome and logging
- `config.js` — optional **public** Supabase URL / publishable key
- `supabase-schema.sql` — cloud table and RLS policies
- `sw.js` — app-shell cache for offline use
- `manifest.webmanifest`, `icon-*.png` — installation metadata/icons

## Honest limitations

- The app does not listen to your playing. Ratings and tempos are self-reported.
- Fretboard routes are dynamically generated *suggested* fingering paths. Selectable lower/middle/upper fretboard areas are CAGED-oriented, not a complete five-shape CAGED system; they are not exhaustive CAGED diagrams; inspect shifts and playability. Three-octave paths may reach high frets.
- The app provides guitar TAB, fretboard diagrams and chord grids. Full traditional staff notation, synchronized MIDI playback and audio analysis are *not* included in v1.
- Timing can pause when a mobile browser is backgrounded. Do not rely on uninterrupted metronome playback with the iPhone locked.
- **Completed** logs and song notes sync to Supabase. The **active** in-progress session is saved on the current device only.
- Offline logs sync on your next authenticated online connection. Multi-device simultaneous writes are append-only and merge by unique record id.
- GitHub Pages with a free account needs a public repository. Never upload backing tracks, private files or secrets to it.
- Supabase free projects may pause after inactivity; resume them in the dashboard. Use JSON backups regardless of cloud setup.
- `localStorage` is a limited browser store; keep backups and use the cloud service for critical cross-device continuity.
- This v1 ships with no paid library and no network activity apart from optional cloud use, linked references and the service worker's first download.

## Where to edit the actual musical content

Edit `DRILLS`, `SONGS`, `REFERENCES` and `makeSession` in `data.js`. The shape generation logic is in `music.js` and should be tested when modifying chord formulas.

See **TESTING.md** for tests and acceptance checks.

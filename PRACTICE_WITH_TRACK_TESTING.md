# Practice with Track — local MP3/WAV playback (draft)

## PC test
1. Open the **Songs** tab, select **Autumn Leaves**.
2. In **Practice with Track**, select a local MP3 instrumental track. Press Play, then Pause and Stop.
3. Set **A** near the start of a challenging section. Seek later in the same track and click **Set B**. Confirm it loops A–B.
4. Clear the A–B loop, enable **Loop full track**, and check volume and seek controls.
5. Replace the MP3 with a WAV and confirm the new track plays; no older track continues.
6. Start song practice for Autumn Leaves, reopen track controls and log the exercise without uploading any audio.
7. Navigate to another tab: playback must pause. Returning to the same song without refreshing should retain the selected file.
8. Refresh the browser: the app must honestly require choosing the file again.
9. Check exported JSON/Supabase practice records contain NO file bytes, base64, object URLs, audio blobs or hidden recordings.
10. Check browser zoom 75%, 100% and 125%, on Windows Chrome/Edge. Test an unreadable MP3 gracefully.
11. Verify local timer and metronome are unaffected when no track is playing.

## Security and privacy
- Imported audio is **never uploaded** and is not included in backups, issue feedback, or GitHub.
- Files are referenced through a temporary local `blob:` URL in the current browser session.
- Reloading the page loses the selected track. Select the file again to resume; this is intentional.
- Closing/replacing a file revokes its temporary URL. Nothing persists in Supabase or localStorage.
- Use recordings you own or have permission to play. Sharing the app does not grant redistribution rights to commercial tracks.

## Scope limits
- MP3 and WAV as supported by your browser and OS codecs. No guaranteed support for all variants.
- Native HTML5 audio timing can overshoot A–B boundaries slightly. This is a practice utility, not a DAW.
- No pitch-preserving time stretch, pitch detection, track tempo/key analysis, stem separation or Ableton sync.
- Files over 250 MB are not accepted in this proof of concept. Their playback is not cloud-backed.
- Only one user-selected track is active at a time. It can be associated with a song during the current tab session.
- Actual audio playback and browser navigation require manual PC testing before deployment.

## Coordination with other PRs
This branch is separate from **PR #12** (staged drills) and **PR #19** (synthetic chord backing). If either is merged first, the remaining branches must be checked for merge conflicts, audio transport overlap and updated version/release logs.

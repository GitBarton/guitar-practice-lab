# Setup — Guitar Practice Lab

## A. Publish a bookmarkable website on your existing GitHub Free account

**No GitHub plugin or paid account is required.**

1. Download and extract the supplied `.zip` archive to a folder on your Windows PC.
2. On [GitHub](https://github.com/), create a **public** repository named `guitar-practice-lab`. Do not initialize with a README if you're going to upload all files together; either way works.
3. In the new repository, choose **Add file → Upload files**. Upload the **contents of the extracted `guitar-practice-lab` folder** (not the containing folder itself), including `index.html`, `app.js`, `config.js`, `styles.css`, SQL/docs, image assets and other files. Commit the changes.
4. In repository **Settings → Pages**, select **Deploy from a branch → main → / (root) → Save**.
5. Once Pages says the site is published, open `https://YOUR-GITHUB-USERNAME.github.io/guitar-practice-lab/`.
6. Bookmark that URL on Windows. On iPhone Safari, use Share → **Add to Home Screen** to install it like an app. The same URL works on Mac.

GitHub Pages is public website hosting, **not** a private database. Your site source is public, but practice entries remain local/private unless you separately configure cloud sync.

### Optional: test locally before publishing

From the extracted directory on Windows, if Python is installed:

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000/`. Opening `index.html` by double click (`file://`) will not load ES modules reliably; a local HTTP server or the GitHub Pages URL is required.

## B. Enable cross-device cloud sync (optional, recommended)

1. Create a free account at [supabase.com](https://supabase.com) and **create a new project** under the free plan. No payment is required to begin on Free.
2. Open **SQL Editor → New query**, paste the complete contents of `supabase-schema.sql`, and **Run**. It creates the `practice_records` table and row-level security policies.
3. Open **Project Settings / Connect / API** (the exact menu label can change). Copy your **Project URL** (`https://...supabase.co`) and its **publishable key** (`sb_publishable_...`) or legacy **anon public key**. **Do not copy a `service_role` key or a secret key.**
4. Open **Authentication → URL Configuration**. Set the **Site URL** to your *exact published GitHub Pages URL*, including `/guitar-practice-lab/`. Add that same URL to **Redirect URLs**. The trailing slash is useful to match your project root. The app sends the canonical page path as the email-login redirect.
5. Decide how to configure the app:
   - **Recommended for multi-device:** edit `config.js` in your GitHub repository and fill `supabaseUrl` and `supabaseKey` with the **public** values. Commit. Reload your website. Public URL/key are safe only because strict RLS protects the data. Your GitHub source will contain these public values, not any login secrets.
   - **Alternative:** open the app → Settings → Cloud and paste those values. This is per-device and you would have to paste them again on the next device.
6. In the website's **Settings & cloud**, enter the email address you'll use and press **Send magic link**. Open the email link on that same browser/device, or use the link in a browser that has the app configuration. Check spam if necessary.
7. Confirm the Settings page shows your email and **Cloud saved**. Run a practice drill, log it, and use **Sync now**.
8. On the iPhone, open the **same GitHub Pages URL**, sign in with the **same email**, choose **Sync now** and verify that your drill log appears in Progress. You should not need to copy a backup file.

**Troubleshooting sign-in:** If the email says “redirect URL not allowed,” verify the exact URL in Supabase URL Configuration. If no email arrives, inspect the Supabase Auth logs and its hosted email limits. If cloud syncing fails, check whether the free project was paused and that `supabase-schema.sql` has run. Browser practice still works while cloud is unavailable.

### Security

- Public client key + RLS is appropriate for this personal static client. The SQL policies limit each signed-in user's rows to their own user ID.
- Do not embed database passwords, Supabase service-role/secret keys, OpenAI API keys or access tokens in files committed to GitHub.
- Use unique account access and strong email security; anyone controlling your email may be able to obtain a sign-in link.
- Treat your full JSON exports as private because they include your practice notes.

### Free-tier caveats

Supabase Free has a small database quota which is ample for text logs. A low-activity free project can pause after approximately seven days and must be resumed. The app doesn't depend on Supabase to function locally. Review current plan limits at [Supabase pricing](https://supabase.com/pricing) before enabling paid features.

## C. Daily operation

- Open your bookmark → **Today** → choose Technique or Repertoire → **Start**.
- Adjust tempo and optionally enable the metronome. It starts only after your click, to comply with browser audio rules.
- At each drill, press **Finish & rate** → **Clean / Mostly clean / Needs work**. Optionally indicate a technical issue. This logs the result and advances the queue.
- At the end, add one brief note and **Save session**. Your key rotates by fourths automatically unless you've overridden it.
- In **Songs**, maintain each arrangement's key, tempo, components and readiness. This is a rehearsal tracker, not an audio-file library.
- Each week, **Progress → Copy 7-day report**, then paste into ChatGPT for coaching; or download the Markdown report.
- Occasionally export a full JSON backup in **Progress** or **Settings**. You can import it later on another device without duplicating logged record IDs.

## D. Updating the app

Edit and commit files in the same GitHub repository. GitHub Pages republishes the website. If older HTML persists due to cached service-worker files, reload while online; the service worker is designed to fetch fresh site resources and keep an offline fallback. For a forced update, close/reopen the app or clear that website's cache without erasing site data unless you have cloud sync or a JSON backup.

## E. Cost summary

- GitHub Pages: free when the GitHub Free repository is public.
- Front-end JavaScript, custom SVG diagrams, and native Web Audio: no recurring licence fees.
- Supabase: free if you stay within Free quotas; do not upgrade unless you intentionally choose a paid plan.
- ChatGPT weekly analysis: manual report export, no API integration or API charges; your ChatGPT subscription/plan applies separately.

### Alternative Git command-line upload (optional)

If the GitHub website uploader does not preserve the app's folder structure, open PowerShell in the extracted app folder (with Git installed) and use:

```powershell
git init
git add .
git commit -m "Initial Guitar Practice Lab v1"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/guitar-practice-lab.git
git push -u origin main
```

Create the empty public repository first and replace the placeholder username. You may need to authorize GitHub authentication in your browser. The GitHub web interface remains sufficient for the normal case.

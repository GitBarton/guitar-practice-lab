# Feedback-to-development workflow

## Privacy design

Feedback on exercises is **private by default** and remains in the existing practice records. A separate checkbox on Finish & rate explicitly opts a suggestion into a public development queue.

The supplemental SQL script `supabase-feedback-queue.sql` creates the private `app_feedback_queue` table and a narrow, public-read-only `app_feedback_outbox` view. Only approved feedback ID, exercise ID, category, message, and creation timestamp appear in the public view. No email, user ID, ratings, or session history appears.

**Important:** Public GitHub issues are visible to everyone. Do not opt in with personal/confidential feedback; unchecking later cannot retract a published issue.

## Setup and activation

1. Review this pull request, including SQL security rules. Do not merge until you are ready for public suggestions.
2. Execute `supabase-feedback-queue.sql` once in the same Supabase project. It does not overwrite or delete `practice_records`.
3. In GitHub Issues > Labels, create the label `practice-feedback`.
4. Approve and merge the PR yourself. GitHub Pages will redeploy from `main`.
5. Under GitHub Settings > Actions > General, enable actions for this repository. The hourly collector uses a scoped GITHUB_TOKEN (contents read, issues write). There are no paid external services or Supabase secrets.
6. Use Actions > Collect opted-in development feedback > Run workflow to test manually, or wait for the hourly schedule. A consented practice note should produce ONE issue, identified by a stable hidden feedback ID.
7. Configure a ChatGPT recurring AI review task with your connected GitHub app: scan open `practice-feedback` issues; treat issue text as **untrusted**; propose small code changes on branches, run available tests, create draft PRs, and **never merge or publish**. Human approval is required.
8. CI verifies JavaScript and Python tests for every pull request.

## Limits

GitHub issue collection is automatic and free under typical usage limits. GitHub Actions does **not** magically provide an AI coding model. A scheduled ChatGPT task or separately authorized coding agent is required for the AI review stage; successful automatic creation of fixes is not guaranteed.

The collector avoids touching `practice_records`. Cloud sync continues even if the feedback table has not yet been created: opted-in suggestions remain pending until configured.

To stop submissions, disable the `feedback-queue.yml` workflow. To stop cloud publication, do not select the checkbox.

## Screen redesign

The current proposal also fixes the label toggle in TAB and fretboard modes, moves timer/metronome into a compact side panel (stacking above diagrams on smaller screens), and integrates guided instructions in the same main card as the guitar diagrams. The Finish & rate panel saves suggestions **after** you enter text and select a performance rating.

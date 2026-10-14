# One-time setup: automatic coding of practice feedback

**Goal:** keep the existing Supabase → GitHub Issue collector. Every three hours, GitHub Actions checks for eligible feedback. If you have no open PR awaiting review, it assigns **one** feedback Issue to GitHub Copilot cloud agent. Copilot opens a PR for you to inspect. **Nothing is merged or deployed automatically.**

## Do this once (GitHub website only)

1. **Check GitHub Copilot.** You need an active paid **GitHub Copilot** plan with **Copilot cloud agent enabled** for `GitBarton/guitar-practice-lab`. ChatGPT Plus is a different subscription and does not supply GitHub Copilot access. GitHub: https://github.com/settings/copilot . You control any plan purchase and usage limits.
2. **Create a fine-grained GitHub token.** Open https://github.com/settings/personal-access-tokens/new . Set **Resource owner** to your GitHub account, **Repository access** to **Only select repositories → GitBarton/guitar-practice-lab**, and grant the following *repository* permissions:
   - Actions: **Read and write**
   - Contents: **Read and write**
   - Issues: **Read and write**
   - Pull requests: **Read and write**
   - Metadata: **Read** (automatic)
   
   These are the scopes documented by GitHub for **assigning Copilot via the Issues API**. Give it an expiry you can manage (for example, 90 days); you will have to replace the secret after expiry. Copy the token when GitHub displays it. **Do not paste it in ChatGPT, an Issue or a PR.**
3. **Save it in the repository secret.** Open https://github.com/GitBarton/guitar-practice-lab/settings/secrets/actions → **New repository secret**. Name it **`COPILOT_AGENT_TOKEN`** (exact spelling). Paste the token and click **Add secret**.
4. **Merge the queue PR once its tests pass.** That installs `.github/workflows/copilot-queue.yml` on `main`. From then on, GitHub Actions checks automatically. You can trigger the first attempt immediately from https://github.com/GitBarton/guitar-practice-lab/actions/workflows/copilot-queue.yml → **Run workflow**, selecting **main**.

No terminal commands, cloud server, Supabase migration or ChatGPT scheduler are required.

## What runs automatically?

- The existing hourly **Collect opted-in development feedback** workflow keeps creating Issues exactly as before.
- This new **Copilot feedback coding queue** workflow runs every three hours (GitHub schedules can run a little late).
- If **any PR is still open**, it waits. This avoids concurrent changes and merge conflicts.
- It dispatches **one** oldest eligible Issue at a time. Newly collected `practice-feedback` Issues from **#25 onward** are automatically eligible. Earlier Issues #3–#8 have already had partial/full work delivered and must be reconciled first to avoid duplicated changes.
- To deliberately prioritize a vetted older or enhancement Issue, you can add the GitHub Issue label **`agent-ready`** to it. The queue gives those priority. To stop an Issue from being sent, label it `agent-hold` or `needs-triage` (create the label in GitHub Issues → Labels if needed).
- An Issue already assigned to Copilot is not sent again. A freshly assigned Issue blocks additional assignments for six hours while Copilot starts.
- Copilot works in its own branch, attempts existing code tests and creates a **draft PR**. You decide what to revise, merge or reject. If the agent cannot finish, the action run or draft PR provides diagnostics; this workflow **does not conceal errors or merge automatically**.

## What if it doesn't start?

- Go to **Actions → Copilot feedback coding queue → most recent run**.
- **“Not activated”** means the `COPILOT_AGENT_TOKEN` secret is absent or empty.
- HTTP 401/403/422 means the token, Copilot paid access, repository entitlement or PAT permissions must be checked.
- **“Queue paused: open PRs”** means review/merge or close an existing PR first.
- **“No eligible issues”** means the remaining backlog is older or hasn't been approved for automated coding.
- Check https://github.com/GitBarton/guitar-practice-lab/issues/13 for the independently maintained Issue dashboard.

**Important safety notes:** Tokens are never stored in this repository's source files, GitHub Issues, or user-data backups. The dispatcher only reads Issue metadata and assigns a user-enabled coding agent via GitHub's official API. Issue bodies and comments are treated as untrusted feedback. GitHub Copilot has its own usage limits and may incur charges; review your GitHub billing settings. You retain final PR approval. If the GitHub Copilot subscription is unavailable, the queue cannot do AI development with a ChatGPT subscription alone.

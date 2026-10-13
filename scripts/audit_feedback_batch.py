"""Maintain a single GitHub Issues dashboard independent of any scheduled AI agent."""
import html
import json
import os
import re
import sys
from datetime import datetime, timezone
from urllib.request import Request, urlopen

REPO = os.environ.get("GITHUB_REPOSITORY", "")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
MARKER = "<!-- guitar-practice-feedback-batch-dashboard-v1 -->"

def api(path, method="GET", payload=None):
    headers = {"Authorization": "Bearer " + TOKEN, "Accept": "application/vnd.github+json",
               "Content-Type": "application/json", "User-Agent": "gpl-batch-dashboard"}
    req = Request("https://api.github.com" + path, headers=headers, method=method,
                  data=json.dumps(payload).encode() if payload is not None else None)
    with urlopen(req, timeout=20) as response:
        return json.load(response)

def pages(path):
    all_rows = []
    for page in range(1, 12):
        part = api(path + ("&" if "?" in path else "?") + "per_page=100&page=" + str(page))
        all_rows.extend(part)
        if len(part) < 100:
            return all_rows
    raise RuntimeError("Too many GitHub issues to inventory safely")

def escape_title(value):
    return html.escape(re.sub(r"\s+", " ", str(value or "")).strip()[:140], quote=True).replace("|", "&#124;")

def report(issues, prs, checked=None):
    checked = checked or datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    open_issues = sorted(
        [i for i in issues if i.get("state") == "open" and
         "pull_request" not in i and MARKER not in (i.get("body") or "")],
        key=lambda x: x["number"])
    open_prs = sorted([p for p in prs if p.get("state") == "open"], key=lambda x: x["number"])
    lines = [MARKER, "# Guitar Practice Lab — Development queue",
             "", "This dashboard is updated by GitHub Actions, independent of ChatGPT scheduling.",
             "Last checked: " + checked,
             "", f"{len(open_issues)} open issue(s) · {len(open_prs)} open pull request(s).",
             "", "## All open issues (including unlabeled requests)", ""]
    for issue in open_issues:
        num = issue["number"]
        labels = ", ".join(escape_title(x.get("name")) for x in issue.get("labels", []))
        lines.append(f"- [#{num}](https://github.com/{REPO}/issues/{num}) — " +
                     escape_title(issue.get("title")) + (" · " + labels if labels else ""))
    if not open_issues:
        lines.append("- No open issues.")
    lines += ["", "## Open pull requests (owner approval required)", ""]
    for pr in open_prs:
        num = pr["number"]
        lines.append(f"- [PR #{num}](https://github.com/{REPO}/pull/{num}) — " +
                     escape_title(pr.get("title")) + (" (DRAFT)" if pr.get("draft") else ""))
    if not open_prs:
        lines.append("- No open pull requests.")
    lines += ["", "## Status and safety", "",
              "- The separate feedback collector turns explicitly opted-in Supabase suggestions into GitHub issues.",
              "- This dashboard inventories ALL open issues, without needing the AI task to be enabled.",
              "- A human or separately configured coding agent writes code on a release branch and opens a draft PR.",
              "- This dashboard does NOT write code, invoke Claude/ChatGPT, merge PRs, or deploy.",
              "- Never merge the batch PR until all selected acceptance criteria and CI checks are satisfied.",
              "- If issues persist here but no new commits/PRs appear, AI development is blocked or inactive.",
              ""]
    return "\n".join(lines)

def main():
    if not TOKEN or not re.fullmatch(r"[\w.-]+/[\w.-]+", REPO):
        raise RuntimeError("Missing GitHub token/repository")
    issues = pages(f"/repos/{REPO}/issues?state=all")
    prs = pages(f"/repos/{REPO}/pulls?state=open")
    body = report(issues, prs)
    existing = [i for i in issues if "pull_request" not in i and MARKER in (i.get("body") or "")]
    if existing:
        current = max(existing, key=lambda x:x["number"])
        if current["state"] == "closed":
            print("Dashboard was closed manually; leaving it closed")
        else:
            api(f"/repos/{REPO}/issues/{current['number']}", "PATCH", {"body": body})
            print("Updated dashboard issue #" + str(current["number"]))
    else:
        result = api(f"/repos/{REPO}/issues", "POST",
                     {"title": "Guitar Practice Lab — Development queue", "body": body})
        print("Created dashboard issue #" + str(result["number"]))
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf8") as fp:
            fp.write(body + "\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("Development dashboard failed:", str(e), file=sys.stderr)
        sys.exit(1)

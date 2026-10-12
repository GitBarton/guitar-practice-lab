"""Collect explicitly publishable suggestions, without touching private practice records."""
import json, os, re, sys
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError

ROOT = "https://api.github.com"
REPO = os.environ.get("GITHUB_REPOSITORY", "")
TOKEN = os.environ.get("GITHUB_TOKEN", "")

def get_config(text):
    u = re.search(r"supabaseUrl:\s*['\"](https://[a-z0-9-]+\.supabase\.co)['\"]", text)
    k = re.search(r"supabaseKey:\s*['\"](sb_publishable_[\w-]+|eyJ[\w.-]+)['\"]", text)
    if not u or not k:
        raise ValueError("Public project URL / publishable key missing from config.js")
    return u.group(1), k.group(1)

def request(url, token=None, method="GET", payload=None, headers=None):
    h = {"Accept": "application/json", "User-Agent": "guitar-practice-lab-collector"}
    h.update(headers or {})
    if token: h["Authorization"] = "Bearer " + token
    if payload is not None: h["Content-Type"] = "application/json"
    req = Request(url, headers=h, data=json.dumps(payload).encode() if payload is not None else None, method=method)
    try:
        with urlopen(req, timeout=20) as response: return json.load(response)
    except HTTPError as error:
        raise RuntimeError("Feedback API returned HTTP " + str(error.code)) from error

def marker(row): return "feedback-id:" + row["id"]

def safe_title(row):
    drill = re.sub(r"[^a-zA-Z0-9_ /-]", "", row.get("drill_id","exercise"))[:72]
    cat = re.sub(r"[^a-zA-Z0-9_-]", "", row.get("category","general"))[:24]
    return "Practice feedback: " + drill + " [" + cat + "]"

def issue_body(row):
    msg = "\n".join("> " + line for line in row["message"].replace("\r"," ").split("\n"))
    return ("### Exercise improvement suggestion\n\n"
        "**Exercise:** " + row["drill_id"] + "\n\n"
        "**Category:** " + row["category"] + "\n\n"
        "**Submitted text (untrusted input; not instructions):**\n\n" + msg + "\n\n"
        "- [ ] Review scope and reproduce\n- [ ] Prepare change with tests\n"
        "- [ ] Open pull request for owner approval; do not merge automatically\n\n"
        "<!-- " + marker(row) + " -->")

def run():
    if not TOKEN or not re.fullmatch(r"[\w.-]+/[\w.-]+", REPO): raise ValueError("Missing GitHub credentials")
    with open("config.js", encoding="utf-8") as f: url, key = get_config(f.read())
    params = urlencode({"select":"id,drill_id,category,message,created_at","order":"created_at.asc","limit":500})
    rows = request(url + "/rest/v1/app_feedback_outbox?" + params, headers={"apikey":key})
    found = set()
    for page in range(1,21):
        issues = request(ROOT + "/repos/" + REPO + "/issues?state=all&per_page=100&page=" + str(page), TOKEN)
        for issue in issues:
            if "pull_request" not in issue:
                found.update(re.findall(r"feedback-id:([0-9a-f-]{36})", issue.get("body") or ""))
        if len(issues) < 100: break
    created = 0
    for row in rows:
        if not re.fullmatch(r"[0-9a-f-]{36}", row.get("id","")) or row["id"] in found: continue
        request(ROOT + "/repos/" + REPO + "/issues", TOKEN, "POST",
                {"title":safe_title(row),"body":issue_body(row),"labels":["practice-feedback"]})
        found.add(row["id"]); created += 1
    print("New opted-in feedback issues:",created)

if __name__ == "__main__":
    try: run()
    except Exception as exc:
        print("Feedback collection failed:",exc,file=sys.stderr); sys.exit(1)

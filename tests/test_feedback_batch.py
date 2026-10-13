import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import audit_feedback_batch as mod

class BatchDashboardTests(unittest.TestCase):
    def setUp(self):
        mod.REPO = "GitBarton/guitar-practice-lab"

    def test_unlabeled_issues_are_not_ignored(self):
        issues = [
            {"number":3, "title":"Muting", "state":"open", "labels":[{"name":"practice-feedback"}]},
            {"number":10, "title":"Modes", "state":"open", "labels":[]},
            {"number":12, "title":"PR", "state":"open", "pull_request":{}},
            {"number":20, "title":"Archived", "state":"closed"},
            {"number":30, "title":"Dashboard", "state":"open", "body":mod.MARKER}
        ]
        prs = [{"number":12,"title":"Batch release", "state":"open", "draft":True}]
        result = mod.report(issues, prs, "2026-10-13 12:00 UTC")
        self.assertIn("2 open issue(s)", result)
        self.assertIn("[#10]", result)
        self.assertNotIn("[#20]", result)
        self.assertNotIn("[#30]", result)
        self.assertIn("PR #12", result)
        self.assertIn("DRAFT", result)

    def test_untrusted_issue_title_is_escaped(self):
        self.assertEqual(mod.escape_title("<script>x</script> | y"),
                         "&lt;script&gt;x&lt;/script&gt; &#124; y")

if __name__ == "__main__":
    unittest.main()

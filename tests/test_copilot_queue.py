"""Offline tests for the Copilot dispatch queue. No GitHub tokens are needed."""
import sys
import unittest
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import dispatch_copilot as queue


def issue(number, *, labels=("practice-feedback",), state="open",
          assignees=(), updated_at="2026-10-14T13:00:00Z"):
    return {
        "number": number,
        "state": state,
        "labels": [{"name": value} for value in labels],
        "assignees": [{"login": value} for value in assignees],
        "updated_at": updated_at,
        "title": "Untrusted input <fake command>",
    }


class QueueEligibilityTests(unittest.TestCase):
    def test_new_opted_in_feedback_is_eligible_but_old_stale_issues_not_automatically_dispatched(self):
        self.assertTrue(queue.eligible(issue(25)))
        self.assertTrue(queue.eligible(issue(29)))
        self.assertTrue(queue.eligible(issue(100)))
        self.assertFalse(queue.eligible(issue(3)))
        self.assertFalse(queue.eligible(issue(8)))
        self.assertFalse(queue.eligible(issue(13, labels=())))
        self.assertFalse(queue.eligible(issue(18, labels=("enhancement",))))
        self.assertFalse(queue.eligible(issue(29, labels=("enhancement",))))

    def test_manual_label_can_prioritize_older_or_enhancement_issue(self):
        self.assertTrue(queue.eligible(issue(4, labels=("practice-feedback", "agent-ready"))))
        self.assertTrue(queue.eligible(issue(18, labels=("enhancement", "agent-ready"))))
        chosen = queue.choose_issue([
            issue(25), issue(29), issue(18, labels=("enhancement", "agent-ready")),
            issue(4, labels=("agent-ready",))])
        self.assertEqual(chosen["number"], 4)

    def test_skips_hold_labels_closed_issues_pull_requests_and_already_assigned(self):
        for label in queue.HOLD_LABELS:
            self.assertFalse(queue.eligible(issue(27, labels=("practice-feedback", label))))
        self.assertFalse(queue.eligible(issue(25, state="closed")))
        self.assertFalse(queue.eligible(issue(26, assignees=("copilot-swe-agent[bot]",))))
        self.assertFalse(queue.eligible(issue(27, assignees=("copilot-swe-agent",))))
        fake_pr = issue(30)
        fake_pr["pull_request"] = {"url": "https://github.com/mock/pr"}
        self.assertFalse(queue.eligible(fake_pr))

    def test_fifo_keeps_new_feedback_order_and_does_not_mutate_issues(self):
        items = [issue(29), issue(27), issue(25), issue(26), issue(28)]
        self.assertEqual(queue.choose_issue(items)["number"], 25)
        self.assertEqual([item["number"] for item in items], [29,27,25,26,28])

    def test_recent_existing_copilot_assignment_stops_queue_during_startup(self):
        now = datetime(2026,10,14,14,0,tzinfo=timezone.utc)
        recent = issue(25, assignees=("copilot-swe-agent[bot]",),
                       updated_at="2026-10-14T13:30:00Z")
        old = issue(26, assignees=("copilot-swe-agent[bot]",),
                    updated_at="2026-10-13T00:00:00Z")
        self.assertEqual(queue.active_assignment([old,recent], now),25)
        self.assertIsNone(queue.active_assignment([old],now))

    def test_incorrect_dates_or_non_agent_assignees_cannot_block_queue(self):
        now = datetime(2026,10,14,14,tzinfo=timezone.utc)
        invalid = issue(25, assignees=("copilot-swe-agent",),updated_at="not a date")
        human = issue(26, assignees=("GitBarton",))
        self.assertIsNone(queue.active_assignment([invalid,human],now))


class QueueDispatchTests(unittest.TestCase):
    def test_assign_uses_official_copilot_bot_and_never_merges_or_deploys(self):
        with patch.object(queue, "REPO", "GitBarton/guitar-practice-lab"), \
             patch.object(queue, "COPILOT_TOKEN", "fake-test-token"), \
             patch.object(queue, "request", return_value=issue(25,assignees=("copilot-swe-agent[bot]",))) as req:
            queue.assign_to_copilot(25)
        args, kwargs = req.call_args
        self.assertEqual(args[0],"/repos/GitBarton/guitar-practice-lab/issues/25/assignees")
        self.assertEqual(kwargs["method"],"POST")
        self.assertEqual(kwargs["payload"]["assignees"],["copilot-swe-agent[bot]"])
        assignment=kwargs["payload"]["agent_assignment"]
        self.assertEqual(assignment["base_branch"],"main")
        self.assertEqual(assignment["target_repo"],"GitBarton/guitar-practice-lab")
        self.assertIn("DRAFT",assignment["custom_instructions"])
        self.assertIn("NEVER merge",assignment["custom_instructions"])

    def test_assign_fails_closed_if_github_does_not_confirm_copilot(self):
        with patch.object(queue, "COPILOT_TOKEN", "fake-test-token"), \
             patch.object(queue,"request",return_value=issue(25,assignees=())):
            with self.assertRaisesRegex(RuntimeError,"did not confirm"):
                queue.assign_to_copilot(25)

    def test_absent_secret_stops_before_reading_issues_or_posting(self):
        with patch.object(queue,"REPO","GitBarton/guitar-practice-lab"), \
             patch.object(queue,"READ_TOKEN","fake-token"), \
             patch.object(queue,"COPILOT_TOKEN",""), \
             patch.object(queue,"pages") as pages, \
             patch.object(queue,"note") as note:
            queue.run()
        pages.assert_not_called()
        self.assertIn("Not activated",note.call_args.args[0])

    def test_existing_open_pr_pauses_new_assignments(self):
        with patch.object(queue,"REPO","GitBarton/guitar-practice-lab"), \
             patch.object(queue,"READ_TOKEN","fake-token"), \
             patch.object(queue,"COPILOT_TOKEN","fake-token"), \
             patch.object(queue,"pages",return_value=[{"number":19}]) as pages, \
             patch.object(queue,"assign_to_copilot") as assign, \
             patch.object(queue,"note") as note:
            queue.run()
        assign.assert_not_called()
        self.assertEqual(pages.call_count,1)
        self.assertIn("open PR",note.call_args.args[0])

    def test_dispatch_selects_only_one_eligible_issue(self):
        def fake_pages(path, token):
            return [] if "/pulls?" in path else [issue(29),issue(3),issue(25),issue(28)]
        with patch.object(queue,"REPO","GitBarton/guitar-practice-lab"), \
             patch.object(queue,"READ_TOKEN","fake-token"), \
             patch.object(queue,"COPILOT_TOKEN","fake-token"), \
             patch.object(queue,"pages",side_effect=fake_pages), \
             patch.object(queue,"assign_to_copilot") as assign, \
             patch.object(queue,"note") as note:
            queue.run()
        assign.assert_called_once_with(25)
        self.assertIn("Issue #25",note.call_args.args[0])


if __name__ == "__main__":
    unittest.main()

import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
from collect_feedback import get_config, safe_title, issue_body

class FeedbackTests(unittest.TestCase):
    def test_public_key_only(self):
        self.assertEqual(get_config("supabaseUrl: 'https://abc.supabase.co', supabaseKey: 'sb_publishable_Test123'"),("https://abc.supabase.co","sb_publishable_Test123"))
        with self.assertRaises(ValueError):
            get_config("supabaseUrl: 'https://abc.supabase.co', supabaseKey: 'sb_secret_abc'")
    def test_issue_data_only(self):
        r={"id":"12345678-1234-1234-1234-123456789abc","drill_id":"arp<test>","category":"diagram","message":"Clarify fingering"}
        self.assertNotIn("<",safe_title(r))
        self.assertIn("Clarify fingering",issue_body(r))
        self.assertNotIn("user_id",issue_body(r))
if __name__=="__main__":unittest.main()

import unittest
from build_player_background_import import build

class BackgroundImportTests(unittest.TestCase):
    def setUp(self):
        self.players=[{'id':'test-id','display_name':'Test Player','birth_date':'2000-01-01'}]
        self.fact={'name':'Test Player','birth_date':'2000-01-01','headline':'Club history','details':"Club's registered player",'source_label':'Club','source_url':'https://www.hockeyettan.se/2026/01/01/example/','published_on':None}

    def test_sql_is_escaped(self):
        self.assertIn("Club''s registered player",build(self.players,[self.fact]))

    def test_birth_date_is_required(self):
        with self.assertRaises(ValueError):
            build(self.players,[dict(self.fact,birth_date='2001-01-01')])

    def test_ambiguous_identity_is_rejected(self):
        with self.assertRaises(ValueError):
            build(self.players+self.players,[self.fact])

    def test_credentials_and_unsafe_domains_are_rejected(self):
        for url in ['javascript:alert(1)','https://www.hockeyettan.se.evil.test/story/','https://user:secret@www.hockeyettan.se/story/']:
            with self.assertRaises(ValueError):
                build(self.players,[dict(self.fact,source_url=url)])

if __name__=='__main__':
    unittest.main()

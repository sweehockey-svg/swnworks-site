import unittest
from import_swehockey_history import key, parse_roster, quote

class HistoryParserTests(unittest.TestCase):
    def test_roster_club_and_birthdate(self):
        fixture = '''<table><tr><td><table><tr><th class="tdTitle d-none">Almtuna IS</th></tr>
        <tr><td>46</td><td><strong>Valente, Jesper</strong></td><td>2005-09-02</td><td>LW</td></tr>
        <tr><th class="tdTitle">IK Oskarshamn</th></tr>
        <tr><td>32</td><td>Törnqvist Watson, Colin</td><td>2005-07-14</td><td>GK</td></tr>
        <tr><td>Head Coach</td><td>Other, Person</td></tr></table></td></tr></table>'''
        self.assertEqual(list(parse_roster(fixture)), [('Almtuna IS', 'Valente, Jesper', '2005-09-02'), ('IK Oskarshamn', 'Törnqvist Watson, Colin', '2005-07-14')])

    def test_name_keeps_identity_distinctions(self):
        self.assertEqual(key('Törnqvist Watson, Colin'), key('Colin TÖRNQVIST Watson'))
        self.assertNotEqual(key('Colin Watson'), key('Colin Törnqvist Watson'))
        self.assertNotEqual(key('Other, Jesper'), key('Valente, Jesper'))

    def test_source_text_sql_escaping(self):
        self.assertEqual(quote("Club's team"), "'Club''s team'")

if __name__ == '__main__':
    unittest.main()

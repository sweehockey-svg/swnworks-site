import unittest
from unittest.mock import patch
from pathlib import Path
from import_swehockey_history import key, parse_roster, quote
from validate_swehockey_history import RosterValidator, validate

class HistoryParserTests(unittest.TestCase):
    def test_validation_rejects_wrong_club_or_season(self):
        fixture = '<option selected>2018-19</option><tr><th class="tdTitle">MODO Hockey</th></tr><tr><td>1</td><td>One, Player</td><td>2001-01-01</td><td>RW</td></tr>'
        with patch.object(Path, 'read_text', return_value=fixture):
            cache = Path('fixture-cache')
            players = [{'id':'player-one','display_name':'Player One','birth_date':'2001-01-01'}]
            sql = "('player-one','2018/19','MODO Hockey','U20','https://stats.swehockey.se/Teams/Info/TeamRoster/9517'),"
            self.assertEqual(validate(players, sql, cache)['validated_records'], 1)
            for bad in (sql.replace('MODO Hockey', 'Växjö Lakers HC'), sql.replace('2018/19','2019/20')):
                with self.assertRaises(ValueError):
                    validate(players, bad, cache)

    def test_independent_validator_keeps_competition_clubs_separate(self):
        fixture = '<tr><th class="tdTitle">MODO Hockey</th><th class="tdTitle">MODO Hockey</th><th class="tdTitle">[Top]</th></tr><tr><td>1</td><td>One, Player</td><td>2001-01-01</td><td>RW</td></tr><tr><th class="tdTitle">Växjö Lakers HC</th></tr><tr><td>2</td><td>Two, Player</td><td>2002-02-02</td><td>LW</td></tr>'
        validator = RosterValidator()
        validator.feed(fixture)
        self.assertIn(('MODO Hockey', key('One, Player'), '2001-01-01'), validator.rows)
        self.assertIn(('Växjö Lakers HC', key('Two, Player'), '2002-02-02'), validator.rows)
        self.assertNotIn(('MODO Hockey', key('Two, Player'), '2002-02-02'), validator.rows)

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

    def test_registration_note_does_not_become_player_name(self):
        fixture='<tr><th class="tdTitle">Segeltorp</th></tr><tr><td>32</td><td><strong>Törnqvist Watson, Colin</strong> (Hanvikens SK*)</td><td>2005-07-14</td><td>GK</td></tr>'
        self.assertEqual(list(parse_roster(fixture)), [('Segeltorp','Törnqvist Watson, Colin','2005-07-14')])
        self.assertEqual(key('Kivelä-Carlzon, Marcus'), key('Marcus Kivelä Carlzon'))

if __name__ == '__main__':
    unittest.main()

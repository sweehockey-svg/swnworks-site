import unittest
from import_swehockey_statistics import parse_statistics, build_sql

def fixture():
    return '<label>2022-23 - SHL</label><tr><th class="tdTitle">Luleå HF</th></tr><tr>'+''.join('<th>'+x+'</th>' for x in ['Name','Pos','GP','G','A','TP','PIM','+/-'])+'</tr><tr>'+''.join('<td>'+x+'</td>' for x in ['Nordström, Viggo','LW','1','0','0','0','0','0'])+'</tr>'

class StatisticsTests(unittest.TestCase):
    def test_zero_points_and_header_mapping(self):
        club,name,s=next(parse_statistics(fixture()))
        self.assertEqual((club,name,s['games'],s['points']),('Luleå HF','Nordström, Viggo',1,0))
    def test_ambiguous_name_skipped(self):
        p={'id':'a','display_name':'Viggo Nordström','birth_date':'2003-09-11'}
        self.assertEqual(build_sql([p,p],fixture(),13469,'regular').strip(),'')
    def test_import_requires_existing_identity_evidence_and_phase(self):
        p={'id':'a','display_name':'Viggo Nordström','birth_date':'2003-09-11'}
        sql=build_sql([p],fixture(),13469,'playoffs')
        self.assertIn('where exists',sql)
        self.assertIn("p.birth_date='2003-09-11'::date",sql)
        self.assertIn('"phase": "playoffs"',sql)
    def test_invalid_points_rejected(self):
        page=fixture().replace('<td>1</td>','<td>1</td>',1).replace('<td>LW</td>','<td>LW</td>')
        page=page.replace('<td>1</td><td>0</td>','<td>1</td><td>2</td>')
        with self.assertRaises(ValueError): list(parse_statistics(page))

if __name__=='__main__': unittest.main()

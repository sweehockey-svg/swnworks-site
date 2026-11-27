import unittest
from import_swehockey_statistics import parse_statistics, build_sql, identity_witness, source_metadata, merge_statistics
from pack_swehockey_statistics import pack

def fixture():
    return '<label>2022-23 - SHL</label><tr><th class="tdTitle">Luleå HF</th></tr><tr>'+''.join('<th>'+x+'</th>' for x in ['Name','Pos','GP','G','A','TP','PIM','+/-'])+'</tr><tr>'+''.join('<td>'+x+'</td>' for x in ['Nordström, Viggo','LW','1','0','0','0','0','0'])+'</tr>'

class StatisticsTests(unittest.TestCase):
    def test_dual_roles_preserve_both_but_same_role_conflicts_fail(self):
        skater={'kind':'skater','games':17,'goals':2,'phase':'regular'}
        goalie={'kind':'goalie','games':0,'save_percentage':None,'phase':'regular'}
        result=merge_statistics(skater,goalie)
        self.assertEqual(result,{'kind':'dual','entries':[skater,goalie]})
        with self.assertRaises(ValueError):merge_statistics(skater,dict(skater,games=99))
    def test_bulk_packer_keeps_identity_and_birthdate_guards(self):
        p={'id':'a','display_name':'Viggo Nordström','birth_date':'2003-09-11'}
        evidence={'season':'2022/23','club':'Other club','birth_date':'2003-09-11','source_url':'https://stats.swehockey.se/Teams/Info/TeamRoster/13467'}
        sql=build_sql([p],fixture(),13469,'regular',{'viggo nordström':[evidence]})
        bulk=pack(sql.splitlines())
        self.assertIn('p.birth_date=i.birth_date::date',bulk)
        self.assertIn('h.source_url=i.identity_source and h.season=i.season',bulk)
        self.assertIn('2003-09-11',bulk)
        self.assertIn('/TeamRoster/13467',bulk)
        with self.assertRaises(ValueError):pack(["select 'unguarded'"])
    def test_cross_club_identity_requires_same_season_and_unique_birthdate(self):
        player={'birth_date':'2003-09-11'}
        row={'season':'2022/23','birth_date':'2003-09-11','club':'Luleå HF'}
        index={'viggo nordström':[row]}
        self.assertEqual(identity_witness(index,player,'Nordström, Viggo','2022/23'),row)
        self.assertIsNone(identity_witness(index,player,'Nordström, Viggo','2021/22'))
        index['viggo nordström'].append(dict(row,birth_date='1990-01-01'))
        self.assertIsNone(identity_witness(index,player,'Nordström, Viggo','2022/23'))
    def test_phase_comes_from_competition_not_generic_league_label(self):
        page='<h1>Play Out SHL</h1>'+fixture()
        self.assertEqual(source_metadata(page),('2022/23','Play Out SHL','qualification'))
        with self.assertRaises(ValueError):build_sql([],page,1,'regular')
        self.assertEqual(source_metadata('<h1>SM-slutspel</h1>'+fixture())[1],'SHL · SM-slutspel')
    def test_goalie_rows_are_not_scoring_rows(self):
        page='<tr><th class="tdTitle">Luleå HF</th></tr><tr>'+''.join('<th>'+x+'</th>' for x in ['Name','GPI','MIP','GA','SVS','SOG','SVS%','GAA'])+'</tr><tr>'+''.join('<td>'+x+'</td>' for x in ['Goalie, Test','2','120:00','4','56','60','93.33','2.00'])+'</tr>'
        _,_,s=next(parse_statistics(page))
        self.assertEqual((s['kind'],s['games'],s['save_percentage']),('goalie',2,93.33))
        self.assertNotIn('goals',s)
    def test_zero_points_and_header_mapping(self):
        club,name,s=next(parse_statistics(fixture()))
        self.assertEqual((club,name,s['games'],s['points']),('Luleå HF','Nordström, Viggo',1,0))
    def test_unrelated_conflicting_rows_do_not_block_known_player(self):
        p={'id':'a','display_name':'Viggo Nordström','birth_date':'2003-09-11'}
        unknown=fixture().replace('Nordström, Viggo','Other, Player')
        conflicting=unknown.replace('<td>1</td>','<td>2</td>')
        sql=build_sql([p],fixture()+unknown+conflicting,13469,'regular')
        self.assertEqual(len(sql.strip().splitlines()),1)
        with self.assertRaises(ValueError):
            build_sql([p],fixture()+fixture().replace('<td>1</td>','<td>2</td>'),13469,'regular')
    def test_ambiguous_name_skipped(self):
        p={'id':'a','display_name':'Viggo Nordström','birth_date':'2003-09-11'}
        self.assertEqual(build_sql([p,p],fixture(),13469,'regular').strip(),'')
    def test_transfer_annotation_does_not_hide_player(self):
        p={'id':'a','display_name':'Viggo Nordström','birth_date':'2003-09-11'}
        sql=build_sql([p],fixture().replace('Nordström, Viggo','Nordström, Viggo**'),13469,'regular')
        self.assertIn("select 'a'",sql)
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

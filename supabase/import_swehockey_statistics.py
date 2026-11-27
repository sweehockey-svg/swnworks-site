"""Import competition-wide skater statistics, preserving league and phase.

Identity requires DOB-verified provenance in the same season. A reviewed roster
index can establish identity across clubs when a historical roster dropped a loan.
Unknown/ambiguous names and goalkeepers are skipped. Never sum competitions.
"""
import argparse, collections, json, re
from pathlib import Path
from import_swehockey_history import clean, key, quote, parse_roster

def source_metadata(page):
    label = re.search(r'<label>\s*(\d{4}-\d{2})\s*-\s*(.*?)</label>', page, re.S)
    selected = re.search(r'<option[^>]*selected[^>]*>\s*(\d{4}-\d{2})', page)
    heading = re.search(r'<h1\b[^>]*>(.*?)</h1>', page, re.S | re.I)
    if not heading or not (label or selected):
        raise ValueError('Missing explicit season/competition metadata')
    season = (label.group(1) if label else selected.group(1)).replace('-', '/')
    title = clean(heading.group(1))
    phase = 'playoffs' if re.search(r'slutspel|play.?off',title,re.I) else 'qualification' if re.search(r'play out|kval|qualification',title,re.I) else 'regular'
    if label:
        parent=clean(label.group(2))
        compact=lambda s:re.sub(r'\W+','',s.casefold())
        if compact(parent) not in compact(title):title=parent+' · '+title
    # Preserve competition detail (Norra, SuperElit, fortsättning, etc.).
    return season, title, phase

def roster_identity_index(pages):
    index = collections.defaultdict(list)
    for cid,page in pages.items():
        try: season,_,_ = source_metadata(page)
        except ValueError: continue
        for club,name,birth in parse_roster(page):
            index[key(name)].append({'season':season,'club':club,'birth_date':birth,'source_url':f'https://stats.swehockey.se/Teams/Info/TeamRoster/{cid}'})
    return index

def identity_witness(index, player, name, season):
    evidence = index.get(key(name),[])
    # Reject collisions even when only one of the people is in our registry.
    if {row['birth_date'] for row in evidence} != {player['birth_date']}:
        return None
    return next((row for row in evidence if row['season']==season),None)

def parse_statistics(page):
    club, headers = None, []
    for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>', page, re.S | re.I):
        heading = re.search(r'<th\b[^>]*class="[^"]*\btdTitle\b[^"]*"[^>]*>(.*?)</th>', row, re.S)
        if heading:
            club, headers = clean(heading.group(1)), []
        th = [clean(x) for x in re.findall(r'<th\b[^>]*>(.*?)</th>', row, re.S | re.I)]
        if 'Name' in th:
            headers = th
        cells = [clean(x) for x in re.findall(r'<td\b[^>]*>(.*?)</td>', row, re.S | re.I)]
        if not club or not cells or len(cells) != len(headers) or 'Name' not in headers:
            continue
        values = dict(zip(headers, cells))
        if {'GPI','SVS%','GAA'} <= set(headers):
            if not re.fullmatch(r'\d+', values['GPI']): continue
            stats={'kind':'goalie','games':int(values['GPI'])}
            for source,field in [('SVS%','save_percentage'),('GAA','goals_against_average'),('GA','goals_against'),('SVS','saves'),('SOG','shots_against')]:
                value=values.get(source,'').replace(',','.')
                stats[field]=float(value) if re.fullmatch(r'\d+(?:\.\d+)?',value) else None
            yield club,values['Name'],stats
            continue
        if not {'Pos','GP','G','A','TP','PIM'} <= set(headers): continue
        if values['Pos'] == 'GK':
            continue
        stats = {'kind':'skater'}
        for source, field in [('GP','games'),('G','goals'),('A','assists'),('TP','points'),('PIM','penalty_minutes'),('+/-','plus_minus')]:
            value = values.get(source, '')
            stats[field] = int(value) if re.fullmatch(r'-?\d+', value) else None
        if any(stats[f] is None or stats[f] < 0 for f in ['games','goals','assists','points','penalty_minutes']):
            raise ValueError('Invalid skater statistics')
        if stats['points'] != stats['goals'] + stats['assists']:
            raise ValueError('Points do not equal goals plus assists')
        yield club, values['Name'], stats

def build_sql(players, page, competition, phase, identity_index=None):
    heading = re.search(r'<h1\b[^>]*>(.*?)</h1>', page, re.S | re.I)
    label = re.search(r'<label>\s*(\d{4}-\d{2})\s*-\s*(.*?)</label>', page, re.S)
    if heading:
        season,league,expected=source_metadata(page)
        if phase != expected: raise ValueError('Incorrect competition phase')
    elif label:
        season,league=label.group(1).replace('-', '/'),clean(label.group(2))
    else: raise ValueError('Missing explicit season/competition label')
    by_name = collections.defaultdict(list)
    for player in players:
        by_name[key(player['display_name'])].append(player)
    statements = []
    for club, name, stats in parse_statistics(page):
        # Swehockey's trailing asterisks annotate transfers, not the name.
        name = re.sub(r'\*+$','',name).strip()
        matches = by_name[key(name)]
        if len(matches) != 1:
            continue
        player = matches[0]
        stats['phase'] = phase
        condition = ' and h.club='+quote(club)+' and h.season='+quote(season)+" and h.statistics is null"
        if identity_index is not None:
            witness = identity_witness(identity_index,player,name,season)
            if not witness: continue
            stats['identity_source_url']=witness['source_url']
            stats['identity_method']='unique_historical_name_and_same_season_birth_date'
            # Independent same-season identity evidence allows a missing loan club.
            condition = ' and h.source_url='+quote(witness['source_url'])+' and h.season='+quote(season)
        url = f'https://stats.swehockey.se/Teams/Info/PlayersByTeam/{competition}'
        # Club + season provenance is mandatory, including exact registry DOB.
        statements.append('insert into public.swehockey_player_history(player_id,season,club,league,source_url,statistics) select '+','.join(map(quote,[player['id'],season,club,league,url,json.dumps(stats)]))+'::jsonb where exists (select 1 from public.players p join public.swehockey_player_history h on h.player_id=p.id where p.id='+quote(player['id'])+' and p.birth_date='+quote(player['birth_date'])+'::date'+condition+") on conflict(player_id,source_url,club) do update set statistics=excluded.statistics,league=excluded.league,checked_at=now();")
    return '\n'.join(statements)+'\n'

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('players'); p.add_argument('html'); p.add_argument('competition',type=int)
    p.add_argument('--phase',required=True,choices=['regular','playoffs','qualification'])
    p.add_argument('--output',required=True)
    a=p.parse_args()
    Path(a.output).write_text(build_sql(json.loads(Path(a.players).read_text(encoding='utf-8-sig')),Path(a.html).read_text(encoding='utf-8'),a.competition,a.phase),encoding='utf-8')

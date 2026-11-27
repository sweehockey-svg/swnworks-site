"""Import competition-wide skater statistics, preserving league and phase.

Identity must already be established by a DOB-verified club/season history row.
Unknown/ambiguous names and goalkeepers are skipped. Never sum competitions.
"""
import argparse, collections, json, re
from pathlib import Path
from import_swehockey_history import clean, key, quote

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
        if not club or len(cells) != len(headers) or not {'Name','Pos','GP','G','A','TP','PIM'} <= set(headers):
            continue
        values = dict(zip(headers, cells))
        if values['Pos'] == 'GK':
            continue
        stats = {}
        for source, field in [('GP','games'),('G','goals'),('A','assists'),('TP','points'),('PIM','penalty_minutes'),('+/-','plus_minus')]:
            value = values.get(source, '')
            stats[field] = int(value) if re.fullmatch(r'-?\d+', value) else None
        if any(stats[f] is None or stats[f] < 0 for f in ['games','goals','assists','points','penalty_minutes']):
            raise ValueError('Invalid skater statistics')
        if stats['points'] != stats['goals'] + stats['assists']:
            raise ValueError('Points do not equal goals plus assists')
        yield club, values['Name'], stats

def build_sql(players, page, competition, phase):
    heading = re.search(r'<h1\b[^>]*>(.*?)</h1>', page, re.S | re.I)
    if heading:
        title = clean(heading.group(1)).casefold()
        expected = 'playoffs' if 'slutspel' in title else 'qualification' if 'play out' in title or 'kval' in title else 'regular'
        if phase != expected:
            raise ValueError('Requested phase differs from source competition heading')
    label = re.search(r'<label>\s*(\d{4}-\d{2})\s*-\s*(.*?)</label>', page, re.S)
    if not label:
        raise ValueError('Missing explicit season/competition label')
    season, league = label.group(1).replace('-', '/'), clean(label.group(2))
    by_name = collections.defaultdict(list)
    for player in players:
        by_name[key(player['display_name'])].append(player)
    statements = []
    for club, name, stats in parse_statistics(page):
        matches = by_name[key(name)]
        if len(matches) != 1:
            continue
        player = matches[0]
        stats['phase'] = phase
        url = f'https://stats.swehockey.se/Teams/Info/PlayersByTeam/{competition}'
        # Club + season provenance is mandatory, including exact registry DOB.
        statements.append('insert into public.swehockey_player_history(player_id,season,club,league,source_url,statistics) select '+','.join(map(quote,[player['id'],season,club,league,url,json.dumps(stats)]))+'::jsonb where exists (select 1 from public.players p join public.swehockey_player_history h on h.player_id=p.id where p.id='+quote(player['id'])+' and p.birth_date='+quote(player['birth_date'])+'::date and h.club='+quote(club)+' and h.season='+quote(season)+" and h.statistics is null) on conflict(player_id,source_url,club) do update set statistics=excluded.statistics,league=excluded.league,checked_at=now();")
    return '\n'.join(statements)+'\n'

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('players'); p.add_argument('html'); p.add_argument('competition',type=int)
    p.add_argument('--phase',required=True,choices=['regular','playoffs','qualification'])
    p.add_argument('--output',required=True)
    a=p.parse_args()
    Path(a.output).write_text(build_sql(json.loads(Path(a.players).read_text(encoding='utf-8-sig')),Path(a.html).read_text(encoding='utf-8'),a.competition,a.phase),encoding='utf-8')

"""Build a reviewable SQL import from public Swehockey rosters.
Run with a JSON export of players (id, display_name, birth_date).
No database credentials are needed. Exact normalized name AND birth date
must identify one player. Registration does not establish games played.
"""
import argparse, collections, html, json, re, time, urllib.request
from pathlib import Path

def clean(value):
    return ' '.join(html.unescape(re.sub(r'<[^>]*>', '', value)).split())

def key(name):
    if ',' in name:
        last, first = name.split(',', 1)
        name = first + ' ' + last
    return ' '.join(name.casefold().split())

def parse_roster(page):
    club = None
    for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>', page, re.S | re.I):
        heading = re.search(r'<th\b[^>]*class="[^"]*\btdTitle\b[^"]*"[^>]*>(.*?)</th>', row, re.S)
        if heading:
            club = clean(heading.group(1))
        cells = [clean(v) for v in re.findall(r'<td\b[^>]*>(.*?)</td>', row, re.S)]
        if club and len(cells) >= 4 and re.fullmatch(r'\d{4}-\d{2}-\d{2}', cells[2]):
            yield club, cells[1], cells[2]

def quote(value):
    return "'" + str(value).replace("'", "''") + "'"

def run():
    parser = argparse.ArgumentParser()
    parser.add_argument('players')
    parser.add_argument('--output', default='history-import.sql')
    parser.add_argument('--limit', type=int, default=100)
    args = parser.parse_args()
    players = collections.defaultdict(list)
    for p in json.loads(Path(args.players).read_text(encoding='utf-8')):
        players[(key(p['display_name']), p['birth_date'])].append(p['id'])
    queue = collections.deque([21043, 21044, 15644, 14678, 12484, 16185, 17671, 12515, 12315])
    seen, records, failures = set(), {}, []
    while queue and len(seen) < args.limit:
        competition = queue.popleft()
        if competition in seen:
            continue
        seen.add(competition)
        url = f'https://stats.swehockey.se/Teams/Info/TeamRoster/{competition}'
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'SWNWORKS commentator history import; source-linked roster research'})
            with urllib.request.urlopen(request, timeout=30) as response:
                page = response.read().decode('utf-8')
            # Follow historical season options and competition siblings only,
            # excluding the global current-season navigation.
            local = page[page.find('onchange="doNavigate(this)"'):page.find('id="RefreshContent"')]
            for cid, year in re.findall(r'<option[^>]*value="/ScheduleAndResults/[^/]+/(\d+)"[^>]*>\s*(\d{4})-\d{2}', local):
                if 2016 <= int(year) <= 2025:
                    queue.append(int(cid))
            for cid in re.findall(r'/ScheduleAndResults/Overview/(\d+)', local):
                queue.append(int(cid))
            selected = re.search(r'<option[^>]*selected[^>]*>\s*(\d{4}-\d{2})', page)
            if not selected:
                failures.append([competition, 'missing season'])
                continue
            season = selected.group(1).replace('-', '/')
            league_match = re.search(r'<label>\s*\d{4}-\d{2}\s*-\s*(.*?)</label>', local, re.S)
            league = clean(league_match.group(1)) if league_match else 'Swehockey'
            for club, name, birth in parse_roster(page):
                matches = players[(key(name), birth)]
                if len(matches) == 1:
                    record = (matches[0], season, club, league, url)
                    records[(matches[0], competition, club)] = record
            print(f'{competition}: {season}, matched records {len(records)}', flush=True)
        except Exception as error:
            failures.append([competition, str(error)])
            print(f'{competition}: failed {error}', flush=True)
        time.sleep(0.35)
    values = [ '(' + ','.join(map(quote, record)) + ')' for record in records.values() ]
    sql = ''
    for start in range(0, len(values), 300):
        sql += 'insert into public.swehockey_player_history(player_id,season,club,league,source_url) values\n' + ',\n'.join(values[start:start+300]) + '\non conflict(player_id,source_url,club) do update set season=excluded.season,league=excluded.league,checked_at=now();\n'
    Path(args.output).write_text(sql, encoding='utf-8')
    Path(args.output + '.coverage.json').write_text(json.dumps({'pages_checked': sorted(seen), 'records': len(records), 'failures': failures, 'remaining_pages': len(queue)}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Done: {len(records)} records; {len(failures)} failed pages; {len(queue)} queued pages remain.')

if __name__ == '__main__':
    run()

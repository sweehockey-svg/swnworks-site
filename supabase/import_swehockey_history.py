"""Build a reviewable SQL import from public Swehockey rosters.
Run with a JSON export of players (id, display_name, birth_date).
No database credentials are needed. Exact normalized name AND birth date
must identify one player. Registration does not establish games played.
"""
import argparse, collections, html, json, re, time, urllib.request, unicodedata
from pathlib import Path

def clean(value):
    return ' '.join(html.unescape(re.sub(r'<[^>]*>', '', value)).split())

def key(name):
    if ',' in name:
        last, first = name.split(',', 1)
        name = first + ' ' + last
    name = unicodedata.normalize('NFC', name).casefold()
    return ' '.join(re.sub(r'[-‐‑]', ' ', name).split())

def parse_roster(page):
    club = None
    for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>', page, re.S | re.I):
        heading = re.search(r'<th\b[^>]*class="[^"]*\btdTitle\b[^"]*"[^>]*>(.*?)</th>', row, re.S)
        if heading:
            club = clean(heading.group(1))
        raw_cells = re.findall(r'<td\b[^>]*>(.*?)</td>', row, re.S)
        cells = [clean(v) for v in raw_cells]
        if club and len(cells) >= 4 and re.fullmatch(r'\d{4}-\d{2}-\d{2}', cells[2]):
            name = re.search(r'<strong\b[^>]*>(.*?)</strong>', raw_cells[1], re.S | re.I)
            yield club, clean(name.group(1)) if name else cells[1], cells[2]

def quote(value):
    return "'" + str(value).replace("'", "''") + "'"

def run():
    parser = argparse.ArgumentParser()
    parser.add_argument('players')
    parser.add_argument('--output', default='history-import.sql')
    parser.add_argument('--limit', type=int, default=100)
    parser.add_argument('--cache-dir', default='.history-cache')
    parser.add_argument('--cached-only', action='store_true', help='Rebuild from every cached public roster without network requests')
    parser.add_argument('--seeds', help='Comma-separated verified competition IDs; replaces the default starting pages')
    args = parser.parse_args()
    cache = Path(args.cache_dir)
    cache.mkdir(exist_ok=True)
    players = collections.defaultdict(list)
    for p in json.loads(Path(args.players).read_text(encoding='utf-8')):
        players[(key(p['display_name']), p['birth_date'])].append(p['id'])
    defaults = [21043, 21044, 18270, 18271, 16286, 14853, 13534, 20961, 20962, 20964, 19937, 21213, 21088, 21581, 21505, 21319, 15644, 14678, 12484, 16185, 17671, 12515, 12315]
    queue = collections.deque([int(value) for value in args.seeds.split(',')] if args.seeds else defaults)
    if args.cached_only:
        queue = collections.deque(sorted(int(p.stem) for p in cache.glob('*.html') if p.stem.isdigit()))
    seen, records, failures = set(), {}, []
    while queue and (args.cached_only or len(seen) < args.limit):
        competition = queue.popleft()
        if competition in seen:
            continue
        seen.add(competition)
        url = f'https://stats.swehockey.se/Teams/Info/TeamRoster/{competition}'
        try:
            cached_page = cache / f'{competition}.html'
            if cached_page.exists():
                page = cached_page.read_text(encoding='utf-8')
            elif not args.cached_only:
                request = urllib.request.Request(url, headers={'User-Agent': 'SWNWORKS commentator history import; source-linked roster research'})
                with urllib.request.urlopen(request, timeout=20) as response:
                    page = response.read().decode('utf-8')
                cached_page.write_text(page, encoding='utf-8')
                time.sleep(0.35)
            # Follow historical season options and competition siblings only,
            # excluding the global current-season navigation.
            local = page[page.find('onchange="doNavigate(this)"'):page.find('id="RefreshContent"')]
            for cid, year in re.findall(r'<option[^>]*value="/ScheduleAndResults/[^/]+/(\d+)"[^>]*>\s*(\d{4})-\d{2}', local):
                if 1990 <= int(year) <= 2026:
                    if not args.cached_only and int(cid) not in seen and int(cid) not in queue:
                        queue.append(int(cid))
            for cid in re.findall(r'/ScheduleAndResults/Overview/(\d+)', local):
                if not args.cached_only and int(cid) not in seen and int(cid) not in queue:
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
    values = [ '(' + ','.join(map(quote, record)) + ')' for record in records.values() ]
    sql = ''
    for start in range(0, len(values), 300):
        sql += 'insert into public.swehockey_player_history(player_id,season,club,league,source_url) values\n' + ',\n'.join(values[start:start+300]) + '\non conflict(player_id,source_url,club) do update set season=excluded.season,league=excluded.league,checked_at=now();\n'
    Path(args.output).write_text(sql, encoding='utf-8')
    Path(args.output + '.coverage.json').write_text(json.dumps({'pages_checked': sorted(seen), 'records': len(records), 'failures': failures, 'remaining_pages': len(queue)}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Done: {len(records)} records; {len(failures)} failed pages; {len(queue)} queued pages remain.')

if __name__ == '__main__':
    run()

"""Independent HTMLParser check of every generated player/club/source association.

Swehockey TeamRoster URLs cover competitions and contain multiple club tables.
Run before applying generated SQL; this checks the club heading and the player's
full name and birth date in that source, not just membership of a competition.
"""
import argparse, json, re
from html.parser import HTMLParser
from pathlib import Path
from import_swehockey_history import key

class RosterValidator(HTMLParser):
    def __init__(self):
        super().__init__()
        self.club = None
        self.cells, self.headings, self.rows = [], [], set()
        self.capture = None
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.cells, self.headings = [], []
        if tag in ('td', 'th'):
            classes = dict(attrs).get('class', '').split()
            self.capture = 'heading' if tag == 'th' and 'tdTitle' in classes else 'cell' if tag == 'td' else None
            self.parts = []

    def handle_data(self, data):
        if self.capture:
            self.parts.append(data)

    def handle_endtag(self, tag):
        if tag in ('td', 'th') and self.capture:
            text = ' '.join(''.join(self.parts).split())
            (self.headings if self.capture == 'heading' else self.cells).append(text)
            self.capture = None
        if tag == 'tr':
            if self.headings:
                self.club = self.headings[0]
            if self.club and len(self.cells) >= 4 and re.fullmatch(r'\d{4}-\d{2}-\d{2}', self.cells[2]):
                # Parenthetical roster annotations aren't part of player names.
                name = re.sub(r'\s*\([^)]*\)\s*$', '', self.cells[1])
                self.rows.add((self.club, key(name), self.cells[2]))

def validate(players, sql, cache):
    identities = {p['id']: (key(p['display_name']), p['birth_date']) for p in players}
    pages = {}
    count = 0
    for line in sql.splitlines():
        if not line.startswith("('"):
            continue
        fields = [s.replace("''", "'") for s in re.findall(r"'((?:''|[^'])*)'", line)]
        if len(fields) != 5:
            raise ValueError('Invalid SQL row')
        player, season, club, league, url = fields
        match = re.fullmatch(r'https://stats[.]swehockey[.]se/Teams/Info/TeamRoster/(\d+)', url)
        if not match:
            raise ValueError('Invalid source URL')
        cid = match.group(1)
        if cid not in pages:
            page = (cache / (cid + '.html')).read_text(encoding='utf-8')
            parser = RosterValidator()
            parser.feed(page)
            selected = re.search(r'<option[^>]*selected[^>]*>\s*(\d{4}-\d{2})', page)
            pages[cid] = (selected.group(1).replace('-', '/') if selected else None, parser.rows)
        source_season, rows = pages[cid]
        if source_season != season or (club, *identities[player]) not in rows:
            raise ValueError(f'Unverified association: {player} / {club} / {url}')
        count += 1
    return {'validated_records': count, 'validated_sources': len(pages)}

if __name__ == '__main__':
    args = argparse.ArgumentParser()
    args.add_argument('players')
    args.add_argument('sql')
    args.add_argument('cache')
    a = args.parse_args()
    print(json.dumps(validate(json.loads(Path(a.players).read_text(encoding='utf-8')), Path(a.sql).read_text(encoding='utf-8-sig'), Path(a.cache))))

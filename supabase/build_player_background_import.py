"""Validate reviewed club facts against player identity, then build admin SQL.

The reviewed input contains brief factual paraphrases and public source links,
not copied articles. This script never fetches or guesses new facts.
"""
import argparse, json
from pathlib import Path
from urllib.parse import urlparse
from import_swehockey_history import key, quote

def build(players, facts):
    values = []
    seen = set()
    for fact in facts:
        matches = [p for p in players if key(p['display_name']) == key(fact['name']) and p['birth_date'] == fact['birth_date']]
        if len(matches) != 1:
            raise ValueError('Missing or ambiguous identity: ' + fact['name'])
        url = urlparse(fact['source_url'])
        if url.scheme != 'https' or url.netloc != 'www.hockeyettan.se' or url.username or url.password:
            raise ValueError('Unsupported source URL')
        identity = (matches[0]['id'], fact['source_url'])
        if identity in seen:
            raise ValueError('Duplicate player/source pair')
        seen.add(identity)
        if not 1 <= len(fact['headline']) <= 200 or not 1 <= len(fact['details']) <= 2000:
            raise ValueError('Invalid fact length')
        fields = [matches[0]['id'],fact['headline'],fact['details'],fact['source_label'],fact['source_url'],fact.get('published_on')]
        values.append('(' + ','.join('null' if v is None else quote(v) for v in fields) + ')')
    return 'insert into public.player_background_sources(player_id,headline,details,source_label,source_url,published_on) values\n' + ',\n'.join(values) + '\non conflict(player_id,source_url) do update set headline=excluded.headline,details=excluded.details,source_label=excluded.source_label,published_on=excluded.published_on,checked_at=now();\n'

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('players')
    parser.add_argument('--facts',default='supabase/player-background-reviewed.json')
    parser.add_argument('--output',default='background-import.sql')
    args=parser.parse_args()
    Path(args.output).write_text(build(json.loads(Path(args.players).read_text(encoding='utf-8')),json.loads(Path(args.facts).read_text(encoding='utf-8'))),encoding='utf-8')

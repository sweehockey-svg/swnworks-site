"""Compact reviewed statistics statements into bounded bulk upserts.

Keeps the registry DOB and exact identity-source/season guards from the importer.
Does not connect to or write a database.
"""
import argparse,json,re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from import_swehockey_history import quote
from import_swehockey_statistics import source_metadata,merge_statistics

def pack(statements):
    unique={}
    for statement in statements:
        fields=[x.replace("''", "'") for x in re.findall(r"'((?:''|[^'])*)'",statement)]
        if len(fields)!=10 or fields[0]!=fields[6] or fields[1]!=fields[9]:
            raise ValueError('Unexpected guarded source statement')
        stats=json.loads(fields[5])
        if stats.get('identity_source_url')!=fields[8]:raise ValueError('Missing identity evidence')
        row=fields[:6]+[fields[7],fields[8]]
        stats.pop('identity_source_url');stats.pop('identity_method',None)
        row[5]=json.dumps(stats,separators=(',',':'))
        identity=(row[0],row[4],row[2])
        if identity in unique and unique[identity]!=row:
            old=unique[identity]
            if old[:5]!=row[:5] or old[6:]!=row[6:]:raise ValueError('Conflicting identity evidence')
            row[5]=json.dumps(merge_statistics(json.loads(old[5]),json.loads(row[5])),separators=(',',':'))
        unique[identity]=row
    values=',\n'.join('('+','.join(map(quote,row))+')' for row in unique.values())
    return "with incoming(player_id,season,club,league,source_url,statistics,birth_date,identity_source) as (values\n"+values+"\n) insert into public.swehockey_player_history(player_id,season,club,league,source_url,statistics) select p.id,i.season,i.club,i.league,i.source_url,i.statistics::jsonb || jsonb_build_object('identity_source_url',i.identity_source,'identity_method','unique_historical_name_and_same_season_birth_date') from incoming i join public.players p on p.id::text=i.player_id and p.birth_date=i.birth_date::date where exists(select 1 from public.swehockey_player_history h where h.player_id=p.id and h.source_url=i.identity_source and h.season=i.season) on conflict(player_id,source_url,club) do update set statistics=excluded.statistics,league=excluded.league,checked_at=now();\n"

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('directory');a=p.parse_args();root=Path(a.directory)
    files=sorted(root.glob('import-*.sql'),key=lambda f:int(f.stem.split('-')[1]))
    print('Reading source batches',len(files),flush=True)
    with ThreadPoolExecutor(max_workers=8) as pool:
        statements=[line for text in pool.map(lambda f:f.read_text(encoding='utf-8'),files) for line in text.splitlines() if line.strip()]
    print('Checking source titles',flush=True)
    # Retain parent league when an old page only calls its competition SM-slutspel.
    with ThreadPoolExecutor(max_workers=8) as pool:
        titles=dict(pool.map(lambda p:(p.stem,source_metadata(p.read_text(encoding='utf-8'))[1]),root.glob('*.html')))
    print('Packing',len(statements),'records',flush=True)
    for n,statement in enumerate(statements):
        fields=[x.replace("''", "'") for x in re.findall(r"'((?:''|[^'])*)'",statement)]
        cid=fields[4].rsplit('/',1)[1]
        if cid in titles:statements[n]=statement.replace(quote(fields[3])+','+quote(fields[4]),quote(titles[cid])+','+quote(fields[4]),1)
    out=root/'bulk';out.mkdir(exist_ok=True)
    # Merge roles before batching, including pairs on opposite batch boundaries.
    bulk=pack(statements)
    prefix,body=bulk.split('\n',1)
    values,suffix=body.rsplit('\n) insert',1)
    rows=[line.rstrip(',') for line in values.splitlines()]
    for n in range(0,len(rows),300):(out/f'{n//300}.sql').write_text(prefix+'\n'+',\n'.join(rows[n:n+300])+'\n) insert'+suffix,encoding='utf-8')
    summary={'source_statements':len(statements),'records':len(rows),'batches':(len(rows)+299)//300}
    (out/'manifest.json').write_text(json.dumps(summary),encoding='utf-8')
    print(json.dumps(summary))

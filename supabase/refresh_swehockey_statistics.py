"""Bounded, resumable competition-wide statistics refresh. No DB credentials.

Outputs reviewable SQL and coverage; does not apply imports automatically.
Reuses public roster snapshots for identity, never infers missing player DOBs.
"""
import argparse,json,re,time,urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from import_swehockey_statistics import source_metadata,roster_identity_index,build_sql,parse_statistics
from validate_swehockey_history import RosterValidator

def run():
    p=argparse.ArgumentParser()
    p.add_argument('players');p.add_argument('--rosters',nargs='+',required=True)
    p.add_argument('--output-dir',required=True);p.add_argument('--limit',type=int,default=1000)
    a=p.parse_args();out=Path(a.output_dir);out.mkdir(exist_ok=True)
    paths={};pages={};metadata={};report={'sources':[],'failures':[],'skipped_metadata':[]}
    for root in a.rosters:
        for path in Path(root).glob('*.html'):
            if path.stem.isdigit():paths[int(path.stem)]=path
    print('Roster sources:',len(paths),flush=True)
    # Independent HTMLParser validates the DOB/name evidence used by the matcher.
    def read_source(item):
        cid,path=item
        return cid,path.read_text(encoding='utf-8')
    pool=ThreadPoolExecutor(max_workers=8)
    for n,(cid,text) in enumerate(pool.map(read_source,sorted(paths.items()))):
        if n%20==0:print('Reading roster',n,cid,flush=True)
        try: meta=source_metadata(text)
        except ValueError:
            report['skipped_metadata'].append(cid);continue
        if re.search(r'preseason|tränings|camp|landslag|international|dam|SDHL',meta[1],re.I):continue
        if not re.search(r'SHL|Elitserien|Allsvenskan|Hockeyettan|All.?ettan|J20|J18|U20|U18|SuperElit|Division 1|Kvalserien|SM-slutspel',meta[1],re.I):continue
        pages[cid]=text;metadata[cid]=meta
        if n%50==0:print('Read rosters:',n,flush=True)
    pool.shutdown()
    print('Building identity index',len(pages),flush=True)
    identities=roster_identity_index(pages)
    identity_rows={}
    for name,evidence in identities.items():
        for row in evidence:
            identity_rows.setdefault(int(row['source_url'].rsplit('/',1)[1]),set()).add((row['club'],name,row['birth_date']))
    for cid,page in pages.items():
        validator=RosterValidator();validator.feed(page)
        if not identity_rows.get(cid,set()) <= validator.rows:
            raise ValueError(f'Independent identity validation failed: {cid}')
    players=json.loads(Path(a.players).read_text(encoding='utf-8-sig'))
    statements=[]
    selected=sorted(metadata,key=lambda cid:(metadata[cid][0],cid),reverse=True)[:a.limit]
    for n,cid in enumerate(selected):
        cached=out/f'{cid}.html';url=f'https://stats.swehockey.se/Teams/Info/PlayersByTeam/{cid}'
        try:
            if cached.exists() and time.time()-cached.stat().st_mtime<86400:page=cached.read_text(encoding='utf-8')
            else:
                req=urllib.request.Request(url,headers={'User-Agent':'SWNWORKS source-linked hockey history research'})
                with urllib.request.urlopen(req,timeout=20) as response:page=response.read().decode('utf-8')
                source_metadata(page)
                cached.write_text(page,encoding='utf-8')
                time.sleep(.5)
            season,title,phase=source_metadata(page)
            if season!=metadata[cid][0]:raise ValueError('Statistics and roster seasons differ')
            rows=list(parse_statistics(page));sql=build_sql(players,page,cid,phase,identities)
            statements.extend(sql.splitlines())
            report['sources'].append({'competition':cid,'season':season,'title':title,'phase':phase,'source_rows':len(rows),'candidate_rows':len(sql.splitlines())})
            print(f'{n+1}/{len(selected)} {cid} {season} {title}: {len(sql.splitlines())}',flush=True)
        except Exception as error:
            report['failures'].append({'competition':cid,'error':str(error)})
            print(cid,'FAILED',str(error),flush=True)
        (out/'coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    for n in range(0,len(statements),40):(out/f'import-{n//40}.sql').write_text('\n'.join(statements[n:n+40]),encoding='utf-8')
    print('DONE',len(statements),'candidate records',len(report['failures']),'failed sources',flush=True)

if __name__=='__main__':run()

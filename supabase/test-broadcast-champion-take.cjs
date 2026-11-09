// Run with SWN_PGLITE_TEST_MODULE pointing at a local @electric-sql/pglite install.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {PGlite}=require(process.env.SWN_PGLITE_TEST_MODULE||'@electric-sql/pglite');
const source=fs.readFileSync(__dirname+'/broadcast_champion_take.sql','utf8');
(async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon; create role authenticated; create schema broadcast_control;
   create table public.broadcast_studio_state(channel text primary key,state jsonb);
   grant select, update on public.broadcast_studio_state to authenticated;`);
  await db.exec(source);
  const initial={home:'111',away:'222',leagueId:527,matchName:'Final A',seriesRound:'Final',seriesFormat:'5',seriesHome:'2',seriesAway:'2',scene:'live',publicNoMatch:false,sceneMusic:{muted:true,opening:'low'},twitchChannel:'fixture'};
  const cases=[
   ['Home clinches',{}, {seriesHome:'3',hs:'4'},true],
   ['Away clinches',{}, {seriesAway:'3'},true],
   ['Best of seven',{seriesFormat:'7',seriesHome:'3',seriesAway:'3',seriesRound:'Grand Final · Match 7'},{seriesAway:'4'},true],
   ['No repeat after a manual music change',{scene:'series',seriesHome:'3'},{sceneMusic:{muted:true,series:'low'}},false],
   ['Non-final round',{seriesRound:'Semifinal'},{seriesHome:'3'},false],
   ['No winner',{}, {hs:'4',as:'1'},false],
   ['Impossible tied final',{}, {seriesHome:'3',seriesAway:'3'},false],
   ['Another match is prepared',{}, {seriesAway:'3',home:'333'},false],
   ['Waiting screen',{publicNoMatch:true},{seriesAway:'3'},false],
   ['Unrelated channel',{}, {seriesAway:'3'},false,'elsewhere']
  ];
  for(const [label,before,patch,trigger,channel='sec21-bronze-test'] of cases){
   const old={...initial,...before},next={...old,...patch};
   await db.query('insert into public.broadcast_studio_state values ($1,$2) on conflict(channel) do update set state=excluded.state',[channel,old]);
   await db.exec('set role authenticated');
   const result=(await db.query('update public.broadcast_studio_state set state=$2 where channel=$1 returning state',[channel,next])).rows[0].state;
   await db.exec('reset role');
   const expected=trigger?{...next,scene:'series',sceneMusic:{...next.sceneMusic,series:'high',muted:false}}:next;
   assert.deepEqual(result,expected,label);
  }
  console.log('PASS championship takeover: scoped channel, final winner, one-shot high, controls preserved. Local Postgres only.');
 }finally{await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

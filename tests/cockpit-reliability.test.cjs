const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../commentator-cockpit/hockeyettan/cockpit.js'),'utf8');
function extract(start,end){const offset=source.indexOf(start);assert.ok(offset>=0);const stop=source.indexOf(end,offset);assert.ok(stop>offset);return source.slice(offset,stop);}
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function baseHarness(loader){
  const context={state:{authUser:{id:'user'},baseDataLoaded:false},canAccessLeague:()=>true,setRouteScreen:()=>{},document:{getElementById:()=>null},setSyncStatus:()=>{},esc:value=>value,league:{displayName:'Test'},loadBaseData:loader};
  vm.createContext(context);vm.runInContext(extract('  let baseDataLoadPromise=', '  async function handleAuthSession('),context);return context;
}
test('base data is loaded once for concurrent auth calls',async()=>{
  let calls=0;const gate=deferred();const ctx=baseHarness(async()=>{calls++;await gate.promise;});
  const first=ctx.ensureLeagueBaseData(),second=ctx.ensureLeagueBaseData();await tick();assert.equal(calls,1);
  gate.resolve();await Promise.all([first,second]);assert.equal(ctx.state.baseDataLoaded,true);
});
test('a failed base load can be retried',async()=>{
  let calls=0;const ctx=baseHarness(async()=>{if(++calls===1)throw new Error('offline');});
  await assert.rejects(ctx.ensureLeagueBaseData(),/offline/);assert.equal(ctx.state.baseDataLoaded,false);
  await ctx.ensureLeagueBaseData();assert.equal(calls,2);
});
function notesHarness(){
  const writes=[],storage=new Map();const original={id:'existing-note',body:'Existing text',updated_at:'2026-01-01T00:00:00Z'};
  const ctx={state:{authUser:{id:'user'},selectedTeam:{id:'team'},notes:[original]},canAccessTeam:()=>true,updateAuthButton:()=>{},renderFacts:()=>{},noteStorageKey:()=> 'notes',readNotesFromStorage:key=>JSON.parse(storage.get(key)||'[]'),localStorage:{setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},Intl,Date,client:{from:()=>({select:()=>({order:async()=>({data:[],error:null})}),upsert:payload=>{const gate=deferred();writes.push({payload,gate});return gate.promise;}})}};
  vm.createContext(ctx);vm.runInContext(extract('  function noteTimestamp(', '  function updateAuthButton()')+extract('  let notesSyncPromise=', '  function saveNotes()'),ctx);
  return {ctx,writes,storage};
}

function saveStatus(state){
  const ctx={state};vm.createContext(ctx);
  vm.runInContext(extract('  function notesSaveStatus()', '  function updateNotesSaveStatus()'),ctx);
  return ctx.notesSaveStatus();
}
test('cloud saving status waits for the newest edit, not an older successful write',()=>{
  const state={cloudSyncState:'synced',notesRevision:2,notesCloudRevision:1,notesLocalSaved:true};
  assert.equal(saveStatus(state).title,'Väntar på synkning');
  state.notesCloudRevision=2;assert.equal(saveStatus(state).title,'Sparat i molnet');
});
test('failed cloud sync distinguishes safe local backup from an unsaved draft',()=>{
  const state={cloudSyncState:'error',notesLocalSaved:true};
  assert.equal(saveStatus(state).title,'Sparat på datorn · synkfel');
  state.notesLocalSaved=false;assert.equal(saveStatus(state).title,'Inte säkert sparat');
  state.cloudSyncState='synced';assert.equal(saveStatus(state).title,'Sparat i molnet');
});
test('last-match report is clearly separate from the upcoming match and changes at pregame/live',()=>{
  const feed={},title={};const ctx={state:{nextGame:{id:'next',status:'scheduled',scheduled_start:new Date(Date.now()+48*3600000).toISOString()},latestFocusGame:{id:'last',status:'final',home_team_id:'vasby',away_team_id:'lindloven',home_score:5,away_score:2},opponent:{canonical_name:'Kiruna IF'},focusTeam:{canonical_name:'Väsby IK HK'},latestEvents:[],currentEvents:[],nextLineup:null},document:{getElementById:id=>id==='eventFeed'?feed:title},gameIsLive:g=>g?.status==='live',gameIsEffectivelyFinal:g=>g?.status==='final',getTeamName:id=>({vasby:'Väsby IK HK',lindloven:'Lindlövens IF'}[id]||id),esc:v=>v??'',swedishDate:()=>'',matchStatsStripHtml:()=>'',officialLineupState:()=>({ready:false,partial:false}),league:{sourceLabel:'Swehockey'}};
  vm.createContext(ctx);vm.runInContext(extract('  function renderLatestGame()', '  function formSummary('),ctx);
  ctx.renderLatestGame();assert.equal(title.textContent,'Senaste match · underlag');assert.match(feed.innerHTML,/UNDERLAG INFÖR KIRUNA IF/);assert.match(feed.innerHTML,/Lindlövens IF/);
  ctx.state.nextGame.scheduled_start=new Date(Date.now()+30*60000).toISOString();ctx.renderLatestGame();assert.equal(title.textContent,'Inför nedsläpp');assert.doesNotMatch(feed.innerHTML,/Lindlövens IF/);
  ctx.state.nextGame.status='live';ctx.renderLatestGame();assert.equal(title.textContent,'LIVE · Senaste händelser');assert.doesNotMatch(feed.innerHTML,/UNDERLAG INFÖR/);
});
test('existing notes survive and edits made during a write are queued',async()=>{
  const {ctx,writes,storage}=notesHarness();const first=ctx.syncNotesWithCloud();await tick();
  ctx.state.notes=[{...ctx.state.notes[0],body:'Newest text',updated_at:'2026-01-01T00:00:01Z'}];
  const second=ctx.syncNotesWithCloud();assert.equal(first,second);await tick();assert.equal(writes.length,1);
  writes[0].gate.resolve({error:null});await tick();assert.equal(writes.length,2);
  assert.equal(ctx.state.notes[0].body,'Newest text');assert.equal(writes[1].payload[0].id,'existing-note');assert.equal(writes[1].payload[0].body,'Newest text');
  writes[1].gate.resolve({error:null});await first;assert.equal(JSON.parse(storage.get('notes'))[0].body,'Newest text');
});
test('edits during an in-flight write survive even without a second sync call',async()=>{
  const {ctx,writes,storage}=notesHarness();const pending=ctx.syncNotesWithCloud();await tick();
  ctx.state.notes=[{...ctx.state.notes[0],body:'Local edit',updated_at:'2026-01-01T00:00:02Z'}];
  writes[0].gate.resolve({error:null});await pending;assert.equal(ctx.state.notes[0].body,'Local edit');assert.equal(JSON.parse(storage.get('notes'))[0].body,'Local edit');
});
test('a completed sync does not restore notes after sign-out',async()=>{
  const {ctx,writes,storage}=notesHarness();const pending=ctx.syncNotesWithCloud();await tick();
  ctx.state.authUser=null;ctx.state.notes=[];writes[0].gate.resolve({error:null});await pending;
  assert.equal(ctx.state.notes.length,0);assert.equal(storage.size,0);
});
function matchHarness(upcoming,latest){
  const queries=[];const ctx={Date,client:{from:()=>{const filters=[];queries.push(filters);const query={select:()=>query,eq:(key,value)=>{filters.push([key,value]);return query;},neq:()=>query,or:()=>query,gte:()=>query,order:()=>query,limit:()=>query,maybeSingle:async()=>({data:latest,error:null}),then:resolve=>Promise.resolve({data:upcoming,error:null}).then(resolve)};return query;}}};
  vm.createContext(ctx);vm.runInContext(extract('  async function selectTeamMatch(', '  async function loadNoMatchTeamData('),ctx);return {ctx,queries};
}
test('upcoming match is preferred',async()=>{const {ctx,queries}=matchHarness([{id:'next'}],{id:'past'});const result=await ctx.selectTeamMatch('competition','team');assert.equal(result.game.id,'next');assert.equal(queries.length,1);});
test('last finished match opens when upcoming schedule is empty',async()=>{const {ctx,queries}=matchHarness([],{id:'past',status:'final'});const result=await ctx.selectTeamMatch('competition','team');assert.equal(result.game.id,'past');assert.equal(result.upcoming.length,0);assert.deepEqual(queries[1],[['competition_id','competition'],['status','final']]);});
test('team with no imported games returns an empty workspace context',async()=>{const {ctx}=matchHarness([],null);const result=await ctx.selectTeamMatch('competition','team');assert.equal(result.game,null);assert.equal(result.upcoming.length,0);});

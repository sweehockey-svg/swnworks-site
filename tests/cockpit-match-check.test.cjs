const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const test=require('node:test'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../commentator-cockpit/hockeyettan/cockpit.js'),'utf8');
const slice=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
function setup(){
  const state={focusTeam:{id:'a'},opponent:{id:'b'},nextGame:{updated_at:new Date().toISOString()},currentEvents:[],nextLineup:null};
  const ctx={state,esc:v=>String(v??''),gameIsLive:()=>true};vm.createContext(ctx);
  vm.runInContext(slice('  function officialLineupState()','  function lineupUpdateTime(')+slice('  function renderMatchCheck()','  function updateMatchCheck()')+slice('  function cockpitShortcut(','  document.addEventListener("keydown"'),ctx);
  return {ctx,state};
}
test('one published team never appears as two complete lineups or goalie lists',()=>{
  const {ctx,state}=setup();state.nextLineup={players:[{team_id:'a',position:'GK'}]};
  const html=ctx.renderMatchCheck();assert.match(html,/1 av 2 lag klara/);assert.match(html,/Publicerade för ett lag/);assert.doesNotMatch(html,/Båda lagen klara/);
  state.nextLineup.players.push({team_id:'b',position:'GK'});
  assert.match(ctx.renderMatchCheck(),/Båda lagen klara/);assert.match(ctx.renderMatchCheck(),/Publicerade för båda lagen/);
});
test('successful polling cannot disguise a stale source; failures take precedence',()=>{
  const {ctx,state}=setup();state.nextGame.updated_at=new Date(Date.now()-600000).toISOString();state.lastLiveRefreshAt=new Date().toISOString();state.currentEvents=[{}];
  assert.match(ctx.renderMatchCheck(),/Källdata är fördröjd/);
  state.lastLiveRefreshError='offline';assert.match(ctx.renderMatchCheck(),/Uppdatering misslyckades/);
  ctx.gameIsLive=()=>false;state.lastLiveRefreshError='';assert.match(ctx.renderMatchCheck(),/Matchen har inte startat/);
});
test('shortcuts respect text fields, editable widgets, modifiers, composition and repeats',()=>{
  const {ctx}=setup();assert.equal(ctx.cockpitShortcut({key:'/'}),'players');assert.equal(ctx.cockpitShortcut({key:'N'}),'notes');
  for(const option of ['ctrlKey','metaKey','altKey','isComposing','repeat','defaultPrevented']) assert.equal(ctx.cockpitShortcut({key:'n',[option]:true}),null);
  for(const key of ['n','/']) assert.equal(ctx.cockpitShortcut({key,target:{closest:()=>({})}}),null);
  assert.equal(ctx.cockpitShortcut({key:'x'}),null);
});

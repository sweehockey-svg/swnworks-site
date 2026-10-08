const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const test=require('node:test'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../commentator-cockpit/hockeyettan/cockpit.js'),'utf8');
const slice=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
function setup(){
  const state={focusTeam:{id:'home'},opponent:{id:'away'},nextGame:{id:'current'},
    searchRoster:[{team_id:'home',player_id:'p1',jersey_number:86,source_name:'Åke Andersson',position:'LW'},
      {team_id:'away',player_id:'p2',jersey_number:86,source_name:'Olle Öst',position:'C'},
      {team_id:'away',player_id:'g1',jersey_number:31,source_name:'Goalie',position:'GK'},
      {team_id:'home',player_id:'p3',jersey_number:186,source_name:'Other',position:'RW'}],
    seasonPlayerStats:[{team_id:'home',player_id:'p1',jersey_number:86,source_name:'Åke Andersson',goals:2,assists:3,points:5}],
    seasonGoalieStats:[{team_id:'away',player_id:'g1',jersey_number:31,source_name:'Goalie',save_pct:92,gaa:2}],
    currentPlayerStats:[],currentGoalieStats:[]};
  const notes=[{player_id:'p1',team_id:'home',scope_type:'player',pinned:true,title:'Nyckelspelare',body:'Bra i PP'}];
  const ctx={state,notes,humanSourceName:v=>v,esc:v=>String(v??'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])),getTeamName:id=>id,
    sameStatPlayer:(a,b)=>a.team_id===b.team_id&&a.player_id===b.player_id,
    currentEditorialNotes:()=>notes,noteScopeLabel:()=> 'Spelare',currentPlayerGameRow:()=>null,currentGoalieGameRow:()=>null,
    livePlayerDetail:()=>'',liveGoalieDetail:()=>'',gameIsLive:()=>true,
    aiWorkflowState:()=>({entries:[{paused:true,point:{text:'Sparad pratpunkt'}}],error:''}),aiSourcesHtml:()=>''};
  vm.createContext(ctx);vm.runInContext(slice('  function playerSearchRows(','  function renderPlayerStats(')+
    slice('  function studioPeriod(','  function periodStat(')+slice('  function studioEditorialHtml(','  function renderStudio('),ctx);
  return {ctx,state,notes};
}
test('exact jersey lookup returns both teams once, including goalies and roster-only players',()=>{
  const {ctx}=setup();assert.deepEqual(Array.from(ctx.playerSearchRows('#86'),r=>r.player_id),['p1','p2']);
  assert.equal(ctx.playerSearchRows('086').length,2);
  assert.equal(ctx.playerSearchRows('31')[0].position,'GK');
  assert.equal(ctx.playerSearchRows('186')[0].player_id,'p3');
  assert.equal(ctx.playerSearchRows('').length,0);assert.equal(ctx.playerSearchRows('999').length,0);
});
test('name search handles accents and multiple words; cards include season stats and relevant notes',()=>{
  const {ctx,notes}=setup();assert.equal(ctx.playerSearchRows('ake ANDERSSON')[0].player_id,'p1');
  assert.equal(ctx.playerSearchRows('ost')[0].player_id,'p2');
  assert.match(ctx.playerSearchResults('86'),/2 mål · 3 assist · 5 poäng/);
  assert.match(ctx.playerSearchResults('86'),/Bra i PP/);
  assert.match(ctx.playerSearchResults('31'),/Målvakt/);assert.match(ctx.playerSearchResults('31'),/SV% 92/);
  notes[0].body='<script>alert(1)</script>';assert.doesNotMatch(ctx.playerSearchResults('86'),/<script>/);
});
test('period selection is scoped to a game and cannot carry into a new match',()=>{
  const {ctx,state}=setup();state.studioSelection={gameId:'current',period:1};
  assert.equal(ctx.studioPeriod({id:'current',period:2},[{period:2}]),1);
  assert.equal(ctx.studioPeriod({id:'new',period:2},[{period:2}]),2);
});
test('pause card never mixes upcoming notes or AI points into historical match material',()=>{
  const {ctx}=setup();assert.match(ctx.studioEditorialHtml({id:'current'}),/Bra i PP/);
  assert.match(ctx.studioEditorialHtml({id:'current'}),/Sparad pratpunkt/);
  assert.doesNotMatch(ctx.studioEditorialHtml({id:'old'}),/Bra i PP|Sparad pratpunkt/);
});

const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const test=require('node:test'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../commentator-cockpit/hockeyettan/cockpit.js'),'utf8');
const slice=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
function setup(){
  const storage=new Map(),state={authUser:{id:'u1'},nextGame:{id:'g1'},focusTeam:{id:'t1'}};
  const ctx={state,league:{accessKey:'hockeyettan'},noteStorageKey:()=> 'notes-'+(state.authUser?.id||'guest'),
    localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
    noteAppliesToCurrentMatch:n=>n.scope_type==='general'||n.game_id===state.nextGame.id,
    noteScopeLabel:n=>n.scope_type==='player'?'Spelare · Åke Andersson':n.scope_type==='team'?'Lag · Björklöven':'Match',
    esc:v=>String(v).replace(/</g,'&lt;'),aiSourcesHtml:()=>''};
  vm.createContext(ctx);
  vm.runInContext(slice('  function notesSearchState()','  function applyNotesSearch()')+
    slice('  function aiPointKey(','  function aiBriefHtml('),ctx);
  return {ctx,state,storage};
}
const point={label:'Målvakt',text:'Tre räddningar i slutminuten.',sources:[{label:'Matchstatistik',record:{saves:3}}]};
test('used and pause are independent, reversible and keep the source snapshot',()=>{
  const {ctx}=setup();
  ctx.toggleAiPointState(point,'paused');ctx.toggleAiPointState(point,'used');
  let entry=ctx.aiWorkflowState().entries[0];
  assert.equal(entry.used,true);assert.equal(entry.paused,true);assert.equal(entry.point.sources[0].record.saves,3);
  ctx.toggleAiPointState(point,'used');assert.equal(entry.used,false);assert.equal(entry.paused,true);
  ctx.toggleAiPointState(point,'paused');assert.equal(ctx.aiWorkflowState().entries.length,0);
});
test('pause list survives reload and replacement of the current AI brief',()=>{
  const {ctx,state}=setup();ctx.toggleAiPointState(point,'paused');
  state.aiBrief={talking_points:[{text:'Ny vinkel'}]};state.aiWorkflow=null;
  assert.equal(ctx.aiWorkflowState().entries[0].point.text,point.text);
  assert.match(ctx.aiPauseHtml(),/Tre räddningar/);
});
test('match and user changes isolate broadcast state without deleting it',()=>{
  const {ctx,state}=setup();ctx.toggleAiPointState(point,'paused');
  state.nextGame={id:'g2'};assert.equal(ctx.aiWorkflowState().entries.length,0);
  state.nextGame={id:'g1'};state.authUser={id:'u2'};assert.equal(ctx.aiWorkflowState().entries.length,0);
  state.authUser={id:'u1'};assert.equal(ctx.aiWorkflowState().entries.length,1);
});
test('storage failure leaves current marking available and reports persistence failure',()=>{
  const {ctx}=setup();ctx.localStorage.setItem=()=>{throw new Error('full');};
  ctx.toggleAiPointState(point,'used');
  assert.equal(ctx.aiWorkflowState().entries[0].used,true);assert.match(ctx.aiWorkflowState().error,/kunde inte sparas/);
});
test('invalid stored rows are ignored and normalized point identities survive whitespace',()=>{
  const {ctx,state,storage}=setup();const key=ctx.aiWorkflowState().key;
  storage.set(key,JSON.stringify([{key:'bad',point:{text:'Fake'},paused:true}]));
  state.aiWorkflow=null;assert.equal(ctx.aiWorkflowState().entries.length,0);
  assert.equal(ctx.aiPointKey(point),ctx.aiPointKey({...point,text:'  Tre   räddningar i slutminuten. '}));
});
test('search combines text, names and tags without mutating existing notes',()=>{
  const {ctx}=setup(),note={id:'old',scope_type:'player',game_id:'g1',title:'Stark insats',body:'Räddade laget',tags:['Målvakt','egen tagg']};
  const before=JSON.stringify(note);
  assert.equal(ctx.noteMatchesSearch(note,{context:'current',query:'ake stark',tag:'målvakt'}),true);
  assert.equal(ctx.noteMatchesSearch(note,{context:'current',query:'ÅKE',tag:'Momentum'}),false);
  assert.equal(JSON.stringify(note),before);
  assert.equal(ctx.noteMatchesSearch({...note,scope_type:'team'},{context:'current',query:'bjorkloven',tag:''}),true);
});
test('all-notes search includes old matches but excludes deleted notes',()=>{
  const {ctx}=setup(),note={game_id:'old-game',body:'Bakgrund',tags:[]};
  assert.equal(ctx.noteMatchesSearch(note,{context:'current',query:'',tag:''}),false);
  assert.equal(ctx.noteMatchesSearch(note,{context:'all',query:'bakgrund',tag:''}),true);
  assert.equal(ctx.noteMatchesSearch({...note,is_active:false},{context:'all',query:'',tag:''}),false);
});
test('used status is visibly marked and undo buttons remain available',()=>{
  const {ctx}=setup();ctx.toggleAiPointState(point,'used');ctx.toggleAiPointState(point,'paused');
  const html=ctx.aiPointHtml(point,0);
  assert.match(html,/ai-point-used/);assert.match(html,/ANVÄND · ÅNGRA/);assert.match(html,/TA BORT FRÅN PAUS/);
});
test('editing a historical note preserves its original scope even outside current options',()=>{
  const scope={options:[{value:'match|g1'}],add(option){this.options.push(option);},value:'match|g1'};
  const ctx={document:{getElementById:()=>scope},Option:class{constructor(label,value){this.label=label;this.value=value;}}};
  vm.createContext(ctx);vm.runInContext(slice('  function setNoteScopeValue(','  function hasApprovedAccess()'),ctx);
  ctx.setNoteScopeValue('match|old-game','ANNAN MATCH');
  assert.equal(scope.value,'match|old-game');assert.equal(scope.options.length,2);
  ctx.setNoteScopeValue('match|old-game');assert.equal(scope.options.length,2);
});
test('an AI response from the previous user cannot overwrite the new user workspace',async()=>{
  const {ctx,state}=setup();let resolve;
  const pending=new Promise(done=>{resolve=done;});
  const controls=Object.fromEntries(['aiForm','aiReset','aiFresh','aiQuestion'].map(id=>[id,{value:'',handlers:{},addEventListener(type,fn){this.handlers[type]=fn;}}]));
  Object.assign(ctx,{
    document:{getElementById:id=>controls[id]},drawerBody:{querySelectorAll:()=>[]},
    localAiBrief:()=>({talking_points:[point]}),renderDrawer:()=>{},
    requestServerAi:()=>pending,rememberAiTopics:()=>{}
  });
  vm.runInContext(slice('  function bindAiUi()','  function renderRoster()'),ctx);
  ctx.bindAiUi();controls.aiReset.handlers.click();
  state.authUser={id:'u2'};state.aiBrief={headline:'New workspace'};state.aiBusy=false;
  resolve({used:true,brief:{headline:'Old private response'}});
  await new Promise(done=>setImmediate(done));
  assert.equal(state.aiBrief.headline,'New workspace');assert.equal(state.aiBusy,false);
});

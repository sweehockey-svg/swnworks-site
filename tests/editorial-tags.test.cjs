const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../commentator-cockpit/hockeyettan/cockpit.js'),'utf8');
function extract(start,end){const from=source.indexOf(start);assert.ok(from>=0);const to=source.indexOf(end,from);assert.ok(to>from);return source.slice(from,to);}
const context={esc:value=>String(value),currentEditorialNotes:()=>[],buildInsightFacts:()=>[],noteScopeLabel:()=> 'MATCH'};
vm.createContext(context);
vm.runInContext(extract('  const EDITORIAL_TAGS=', '  function renderNotes()')+extract('  function aiQuestionBonus(', '  function aiMode()'),context);
test('preset tags normalize casing and remove duplicates',()=>{
  assert.deepEqual(Array.from(context.parseNoteTags(' momentum, MOMENTUM, målvakt, Vändpunkt ')),['Momentum','Målvakt','Vändpunkt']);
});
test('existing custom tags remain available',()=>{
  assert.deepEqual(Array.from(context.parseNoteTags('comeback, lokal, Momentum')),['comeback','lokal','Momentum']);
});
test('at most eight tags are saved',()=>{
  assert.equal(context.parseNoteTags('a,b,c,d,e,f,g,h,i').length,8);
});
test('all fourteen proposed tags render as non-submit toggle buttons',()=>{
  const html=context.editorialTagButtons();assert.equal((html.match(/data-note-tag=/g)||[]).length,14);assert.equal((html.match(/type="button"/g)||[]).length,14);
  assert.match(html,/Målfarliga chanser/);assert.match(html,/Försvarsspel/);assert.match(html,/aria-pressed="false"/);
});
test('tags influence fallback ranking even when note title/body lack the word',()=>{
  const fact={id:'n',tag:'REDAKTIONELLT',title:'Bra insats',text:'Gjorde skillnad',tags:['Momentum']};
  assert.equal(context.aiQuestionBonus(fact,'Berätta om momentum'),90);
  assert.equal(context.aiQuestionBonus({...fact,tags:[]},'Berätta om momentum'),0);
});
test('tagged notes remain attributed to editorial notes, not official facts',()=>{
  context.currentEditorialNotes=()=>[{id:'one',body:'Observation från referatet',title:'Bra insats',tags:['Målvakt'],pinned:false}];
  const brief=context.localAiBrief('Målvakt');assert.equal(brief.talking_points.length,1);
  assert.deepEqual(Array.from(brief.talking_points[0].source_refs),['editorial_notes']);assert.match(brief.caution,/fallback/);
});

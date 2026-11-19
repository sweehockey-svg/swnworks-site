const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const test=require('node:test'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../commentator-cockpit/hockeyettan/cockpit.js'),'utf8');
const start=source.indexOf('  function noteDraftKey()'),end=source.indexOf('  function setNoteScopeValue(',start);
function setup(){
  const fields=Object.fromEntries(['noteEditId','noteTitle','noteBody','noteTags','noteScope','notePinned','noteDraftStatus','noteEditor','summary'].map(id=>[id,{value:'',checked:true,textContent:'',open:false}]));
  const storage=new Map();const ctx={state:{authUser:{id:'one'},selectedTeam:{id:'tranas'}},document:{getElementById:id=>fields[id],querySelector:()=>fields.summary},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setNoteScopeValue:v=>fields.noteScope.value=v};
  vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);return {ctx,fields,storage};
}
test('an interview draft survives navigation and restores text, player, tags and pinned state',()=>{
  const {ctx,fields}=setup();fields.noteBody.value='Tränaren: vi börjar med hög press.';fields.noteScope.value='player|17';fields.noteTitle.value='Inför match';fields.noteTags.value='Citat';fields.notePinned.checked=false;
  ctx.persistNoteDraft();fields.noteBody.value='';fields.noteScope.value='';fields.notePinned.checked=true;ctx.restoreNoteDraft();
  assert.equal(fields.noteBody.value,'Tränaren: vi börjar med hög press.');assert.equal(fields.noteScope.value,'player|17');assert.equal(fields.noteTitle.value,'Inför match');assert.equal(fields.noteTags.value,'Citat');assert.equal(fields.notePinned.checked,false);assert.equal(fields.noteEditor.open,true);assert.match(fields.noteDraftStatus.textContent,/Inte synkat/);
});
test('drafts are isolated between accounts and teams and cleared after saving',()=>{
  const {ctx,fields,storage}=setup();fields.noteBody.value='Privat intervju';ctx.persistNoteDraft();fields.noteBody.value='';ctx.state.authUser.id='two';ctx.restoreNoteDraft();assert.equal(fields.noteBody.value,'');ctx.state.authUser.id='one';ctx.state.selectedTeam.id='other';ctx.restoreNoteDraft();assert.equal(fields.noteBody.value,'');ctx.state.selectedTeam.id='tranas';ctx.clearNoteDraft();assert.equal(storage.size,0);
});
test('a full device storage reports failure without claiming the draft was saved',()=>{
  const {ctx,fields}=setup();ctx.localStorage.setItem=()=>{throw Error('QuotaExceededError');};fields.noteBody.value='Viktig text';ctx.persistNoteDraft();assert.match(fields.noteDraftStatus.textContent,/kunde inte sparas/);assert.equal(fields.noteBody.value,'Viktig text');
});
test('malformed device storage cannot crash the editor',()=>{
  const {ctx,storage}=setup();storage.set(ctx.noteDraftKey(),'{bad');assert.doesNotThrow(()=>ctx.restoreNoteDraft());
});

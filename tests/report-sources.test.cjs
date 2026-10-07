const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const test=require('node:test');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'../');
const evidenceSource=fs.readFileSync(path.join(root,'supabase/functions/commentator-ai/evidence.ts'),'utf8');
const edgeSource=fs.readFileSync(path.join(root,'supabase/functions/commentator-ai/index.ts'),'utf8');
const jsSource=fs.readFileSync(path.join(root,'commentator-cockpit/hockeyettan/cockpit.js'),'utf8');
const gid='11111111-1111-4111-8111-111111111111',tid='22222222-2222-4222-8222-222222222222';
const evidence=stripTypeScriptTypes(evidenceSource.replace(/export /g,''));
function helpers(){
  const ctx={};vm.createContext(ctx);vm.runInContext(evidence,ctx);return ctx;
}
function runtime({approved=true,authenticated=true,reportOutput,invalidRefs=false,rate=0,leagueAccess=false,wrongLeague=false}={}){
  let handler,calls=0;const queries=[],writes=[];
  const admin={
    auth:{getUser:async()=>({data:{user:authenticated?{id:'owner',email:'test@example.com'}:null}})},
    from(table){
      const filters=[];let single=false,head=false;
      const query={
        select(_columns,options){head=!!options?.head;return this;},
        eq(key,value){filters.push([key,value]);return this;},
        gte(){return this;},in(){return this;},order(){return this;},limit(){return this;},or(){return this;},
        single(){single=true;return this;},
        insert(value){writes.push({table,value});return Promise.resolve({error:null});},
        then(resolve){
          queries.push({table,filters});
          let data=[];
          if(table==='games'&&single)data={id:gid,competition_id:'comp',home_team_id:tid,away_team_id:'away',status:'scheduled'};
          if(table==='competitions')data={league_name:'Hockeyettan',source:'swehockey'};
          if(table==='commentator_access')data=approved?[{role:'commentator',team_id:leagueAccess?null:tid,league_key:wrongLeague?'suomi-sarja':'hockeyettan'}]:[];
          if(table==='teams')data=[{id:tid,canonical_name:'Hemmalag'},{id:'away',canonical_name:'Bortalag'}];
          if(table==='commentator_notes')data=[{id:'note-old',scope_type:'match',game_id:gid,title:'Gammal anteckning',body:'Ska finnas kvar',tags:['Story']}];
          resolve({data,error:null,count:head?rate:null});
        }
      };return query;
    }
  };
  const ctx={
    Request,Response,console,createClient:()=>admin,
    Deno:{env:{get:()=> 'configured'},serve:fn=>{handler=fn;}},
    fetch:async(_url,options)=>{
      calls++;const body=JSON.parse(options.body);
      const input=JSON.parse(body.input[1].content);
      const output=reportOutput||{headline:'Vinkel',talking_points:[{
        label:'Story',text:'En redaktionell observation',why_now:'Relevant',
        source_refs:invalidRefs?['invented:999']:[input.source_catalog.find(s=>s.category==='editorial_notes').ref]
      }],caution:''};
      return new Response(JSON.stringify({output_text:JSON.stringify(output)}),{status:200});
    }
  };
  vm.createContext(ctx);
  const source=edgeSource.replace(/^import .*;\r?\n/gm,'');
  vm.runInContext(evidence+'\n'+stripTypeScriptTypes(source),ctx);
  return {queries,writes,get calls(){return calls;},request:async(body={})=>{
    const response=await handler(new Request('https://example.test',{method:'POST',headers:{Authorization:'Bearer token','Content-Type':'application/json'},body:JSON.stringify({game_id:gid,team_id:tid,...body})}));
    return {status:response.status,data:await response.json()};
  }};
}
test('report extraction accepts only actual excerpts and approved tags',()=>{
  const ctx=helpers();
  const report='Hemmalaget tog över efter paus. Målvakten räddade samtliga skott i tredje perioden.';
  const result=ctx.validatedReportPoints({points:[
    {title:'Stark avslutning',body:'Referatet beskriver en stark målvaktsinsats.',tags:['Målvakt','Målvakt','påhittad'],source_excerpt:'Målvakten räddade samtliga skott i tredje perioden.'},
    {body:'Påhitt',source_excerpt:'Spelaren gjorde fyra mål i första perioden.'}
  ]},report);
  assert.equal(result.length,1);assert.deepEqual(Array.from(result[0].tags),['Målvakt']);
});
test('sources are snapshots from existing records, never model-written evidence',()=>{
  const ctx=helpers(),catalog=ctx.buildEvidenceCatalog({standings:[{team_id:tid,rank:2}],editorial_notes:[{id:'n',body:'Original'}]},{[tid]:'Hemmalag'});
  const brief=ctx.attachEvidence({talking_points:[{text:'En vinkel',source_refs:[catalog[0].ref,'fake']} ]},catalog);
  assert.equal(brief.talking_points[0].sources[0].record.rank,2);
  assert.match(brief.talking_points[0].sources[0].label,/Hemmalag/);
  assert.equal(ctx.attachEvidence({talking_points:[{text:'Fake',source_refs:['fake']}]},catalog),null);
});
test('authenticated normal AI request returns owned note evidence without writing notes',async()=>{
  const app=runtime(),result=await app.request();
  assert.equal(result.status,200);
  assert.equal(result.data.brief.talking_points[0].sources[0].record.id,'note-old');
  assert.ok(app.queries.find(q=>q.table==='commentator_notes').filters.some(([key,value])=>key==='owner_id'&&value==='owner'));
  assert.ok(app.writes.every(write=>write.table==='commentator_ai_requests'));
});
test('unknown model sources cannot become a successful sourced brief',async()=>{
  const result=await runtime({invalidRefs:true}).request();
  assert.equal(result.status,502);assert.equal(result.data.error,'ai_parse_error');
});
test('report suggestions are returned for review and do not change stored notes',async()=>{
  const report='Målvakten räddade samtliga skott i tredje perioden. Hemmalaget höll undan till seger.';
  const app=runtime({reportOutput:{points:[{title:'Målvakt',body:'Stark slutperiod enligt referatet.',tags:['Målvakt'],source_excerpt:'Målvakten räddade samtliga skott i tredje perioden.'}]}});
  const result=await app.request({action:'extract_report',report});
  assert.equal(result.status,200);assert.equal(result.data.points.length,1);
  assert.ok(app.writes.every(write=>write.table==='commentator_ai_requests'));
});
test('authorization, rate limits and report length prevent provider calls',async()=>{
  for(const [options,body,status] of [[{approved:false},{},403],[{authenticated:false},{},401],[{rate:20},{},429],[{},{action:'extract_report',report:'kort'},400],[{},{action:'extract_report',report:'x'.repeat(12001)},400]]){
    const app=runtime(options),result=await app.request(body);
    assert.equal(result.status,status);assert.equal(app.calls,0);
  }
});
test('existing league permission applies only to the matching competition',async()=>{
  assert.equal((await runtime({leagueAccess:true}).request()).status,200);
  const wrong=runtime({leagueAccess:true,wrongLeague:true});
  assert.equal((await wrong.request()).status,403);assert.equal(wrong.calls,0);
});
test('saving a reviewed report point keeps its source and stays within the note limit',()=>{
  const from=jsSource.indexOf('  function reportNoteBody('),to=jsSource.indexOf('  function reportImportHtml()',from);
  const ctx={};vm.createContext(ctx);vm.runInContext(jsSource.slice(from,to),ctx);
  const body=ctx.reportNoteBody('b'.repeat(500),'s'.repeat(160),'e'.repeat(400));
  assert.ok(body.length<=1200);assert.match(body,/Källa:/);assert.match(body,/Referatutdrag:/);
});
test('source evidence renders as escaped text rather than executable HTML',()=>{
  const from=jsSource.indexOf('  function aiSourcesHtml('),to=jsSource.indexOf('  function aiBriefHtml(',from);
  const ctx={esc:v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
  vm.createContext(ctx);vm.runInContext(jsSource.slice(from,to),ctx);
  const html=ctx.aiSourcesHtml({sources:[{category:'editorial_notes',label:'<script>fake</script>',record:{body:'<img src=x onerror=alert(1)>',team_id:'hidden'}}]});
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));assert.match(html,/&lt;img/);assert.ok(!html.includes('hidden'));
});

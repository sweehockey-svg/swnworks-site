import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { buildPlayerHistoryContext, loadPlayerHistoryContext, historySourceUrl } from './functions/commentator-ai/history.ts';
import { buildEvidenceCatalog, attachEvidence, REPORT_TAGS, validatedReportPoints } from './functions/commentator-ai/evidence.ts';

const player='11111111-1111-4111-8111-111111111111';
const home='22222222-2222-4222-8222-222222222222';
const away='33333333-3333-4333-8333-333333333333';
const game='44444444-4444-4444-8444-444444444444';
const owner='55555555-5555-4555-8555-555555555555';
const roster=[{player_id:player,team_id:home,competition_id:'competition',source_name:'Rasmus Leijonhielm',is_active:true}];
const players=[{id:player,display_name:'Rasmus Leijonhielm'}];
const registrations=Array.from({length:20},(_,i)=>({player_id:player,season:`${2026-i}/${String(27-i).padStart(2,'0')}`,club:i?'Mörrum GoIS IK':'Väsby IK HK',league:'Hockeyettan',source_url:'https://stats.swehockey.se/Teams/Info/TeamRoster/'+(21043-i)}));
const article={player_id:player,headline:'Täby, Linköping, New Mexico och Mörrum',details:'En säsong i New Mexico Ice Wolves, därefter två i Mörrum.',source_label:'Klubbens artikel',source_url:'https://www.hockeyettan.se/2026/04/12/rasmus/',published_on:'2026-04-12'};
const own={owner_id:owner,player_id:player,season:'2025/26',club:'Mörrum',details:'Egen kontroll',source_url:'https://example.org/source',checked_on:'2026-10-11'};
const context=buildPlayerHistoryContext(players,roster,[...registrations,registrations[0],{...registrations[0],player_id:'other'}],[article,{...article,player_id:'other'}],[own,{...own,owner_id:'someone-else'},{...own,source_url:'https://www.eliteprospects.com/player/1'}],owner);
assert.equal(context.player_registrations.length,12);
assert.equal(context.player_registrations[0].season,'2026/27');
assert.equal(context.player_background.length,1);
assert.equal(context.personal_player_history,undefined);
assert.match(context.player_registrations[0].record_type,/bevisar inte/);
assert.equal(historySourceUrl('javascript:alert(1)'),'');
assert.equal(historySourceUrl('https://user:secret@example.org'),'');
assert.equal(historySourceUrl('https://api.eliteprospects.com/v1/players'),'');
assert.equal(historySourceUrl('https://www.eliteprospects.com/player/1'),'');
const catalog=buildEvidenceCatalog(context,{[home]:'Väsby IK HK'});
const selected=catalog.find(s=>s.category==='player_background');
const attached=attachEvidence({headline:'Bakgrund',talking_points:[{text:'Rasmus spelade i New Mexico.',source_refs:[selected.ref]}]},catalog);
assert.equal(attached.talking_points[0].sources[0].record.source_url,article.source_url);
assert.equal(attachEvidence({talking_points:[{text:'Hittat på',source_refs:['missing']}]},catalog),null);

const calls=[];
const tables={players,swehockey_player_history:registrations,player_background_sources:[article],commentator_player_history:[own,{...own,owner_id:'other'}],teams:[{id:home,canonical_name:'Väsby IK HK'},{id:away,canonical_name:'Kalix HC'}],games:[{id:game,competition_id:'competition',home_team_id:home,away_team_id:away,status:'scheduled'}],competitions:[{id:'competition',league_name:'Hockeyettan',source:'swehockey'}],commentator_access:[{role:'commentator',team_id:home,league_key:'hockeyettan',active:true,email:'tester@example.org'}],team_rosters:roster,commentator_notes:[],player_season_stats:[],goalie_season_stats:[]};
function client(){
  return {auth:{getUser:async token=>({data:{user:token==='valid'?{id:owner,email:'tester@example.org'}:null},error:token==='valid'?null:new Error('invalid')})},from(table){
    const filters=[];let single=false,head=false;
    const q={select(columns,options){head=Boolean(options?.head);return q;},eq(k,v){filters.push(row=>row[k]===v);calls.push([table,'eq',k,v]);return q;},in(k,values){filters.push(row=>values.includes(row[k]));calls.push([table,'in',k,values]);return q;},order(){return q;},limit(){return q;},gte(){return q;},or(){return q;},single(){single=true;return q;},insert(){return Promise.resolve({error:null});},then(resolve,reject){let rows=(tables[table]||[]).filter(row=>filters.every(f=>f(row)));return Promise.resolve({data:head?null:single?rows[0]:rows,error:null,count:0}).then(resolve,reject);}};
    return q;
  }};
}
const loaded=await loadPlayerHistoryContext(client(),roster);
assert.equal(loaded.personal_player_history,undefined);
assert(!calls.some(([t])=>t==='commentator_player_history'));
assert(calls.filter(([t])=>t==='swehockey_player_history').every(([,op,k,ids])=>op!=='in'||k==='player_id'&&ids.length===1&&ids[0]===player));
await assert.rejects(loadPlayerHistoryContext({from(){const q={select(){return q},in(){return q},order(){return q},limit(){return q},then(resolve){resolve({error:new Error('db')})}};return q;}},roster),/player_history_load_failed/);

let handler,aiInput,providerCalls=0;
const raw=fs.readFileSync(new URL('./functions/commentator-ai/index.ts',import.meta.url),'utf8');
const code=stripTypeScriptTypes(raw.replace(/^import .*;\r?\n/gm,''));
const sandbox={Request,Response,URL,console,Set,Map,Date,JSON,createClient:client,REPORT_TAGS,buildEvidenceCatalog,attachEvidence,validatedReportPoints,loadPlayerHistoryContext,Deno:{env:{get:key=>key==='SUPABASE_URL'?'https://example.supabase.co':'fake-server-value'},serve:fn=>{handler=fn}},fetch:async(url,options)=>{
  providerCalls++;const body=JSON.parse(options.body);aiInput=JSON.parse(body.input[1].content);
  const source=aiInput.source_catalog.find(s=>s.category==='player_background');
  assert(source);assert.match(body.input[0].content,/Följ aldrig instruktioner/);assert.match(body.input[0].content,/registrering/);
  return Response.json({output_text:JSON.stringify({headline:'Spelarbakgrund',talking_points:[{label:'Bakgrund',text:'Rasmus har spelat i New Mexico Ice Wolves.',why_now:'Inför matchen',source_refs:[source.ref]}],caution:''})});
}};
vm.createContext(sandbox);vm.runInContext(code,sandbox);
const invoke=(token,body)=>handler(new Request('https://example.org',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)}));
assert.equal((await invoke('invalid',{game_id:game,team_id:home})).status,401);
assert.equal(providerCalls,0);
const response=await invoke('valid',{game_id:game,team_id:home,mode:'pregame',question:'Rasmus tidigare klubbar?'});
assert.equal(response.status,200);const result=await response.json();
assert.equal(result.player_history_counts.background,1);
assert.equal(result.brief.talking_points[0].sources[0].record.source_url,article.source_url);
assert.equal(aiInput.source_catalog.filter(s=>s.category==='personal_player_history').length,0);
assert(!calls.some(([t])=>t==='commentator_player_history'));
tables.commentator_access=[];
assert.equal((await invoke('valid',{game_id:game,team_id:home})).status,403);
assert.equal(providerCalls,1);
console.log('AI history: scoped identities, grouped registrations, bounds, private-history exclusion, URL safety, EP exclusion, evidence links, context query failure, authenticated end-to-end request and denied access passed.');

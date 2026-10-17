const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const expires=new Date(Date.now()+3500000).toISOString(),ref={league_id:532,ticket:'signed.readonly',expires_at:expires};
const payload=()=>({schema_version:1,league_id:532,expires_at:expires,teams:[{sports_gamer_league_id:532,sports_gamer_team_id:1,team_name_in_league:'Canada'}],players:[{sports_gamer_league_id:532,sports_gamer_team_id:1,sports_gamer_player_id:9804,team_name_in_league:'Canada',display_gamertag:'Player',regular_points:31}],broadcast_ticket:ref.ticket});
function setup(){
 let calls=0;const window={EHOCKEY_CONFIG:{supabaseUrl:'https://example.test',supabasePublishableKey:'publishable'},SWNStudioAccess:{session:()=>{throw Error('OBS must not need login');}},GraphicsTransientData:{withPortraits:async data=>data,request:async()=>payload()}};
 const ctx={window,Date,Map,Set,Promise,Intl,Number,String,Array,Object,Error,AbortSignal,fetch:async(url,options)=>{calls++;assert(!options.headers.Authorization);assert.deepEqual(JSON.parse(options.body),{ticket:ref.ticket});return {ok:true,json:async()=>({data:payload()})};}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/transient-source.js','utf8'),ctx);return {api:window.BroadcastTransientSource,ctx,window,calls:()=>calls};
}
(async()=>{
 const t=setup();assert(t.api.reference(ref,532));assert.equal(t.api.reference(ref,529),null);assert.equal(t.api.reference({...ref,ticket:'https://evil.test'},532),null);
 const data=await t.api.read(ref);assert.equal(data.players[0].regular_points,31);await t.api.read(ref);assert.equal(t.calls(),1);
 const expired=setup();await assert.rejects(expired.api.read({...ref,expires_at:'2000-01-01'}),/gått ut/);assert.equal(expired.calls(),0);
 const wrong=setup();wrong.ctx.fetch=async()=>({ok:true,json:async()=>({data:{...payload(),league_id:529}})});await assert.rejects(wrong.api.read(ref),/fel liga/);
 let league=532,applied=0,status='',resolve;
 const controller=t.api.create({getLeague:()=>league,onData:()=>applied++,onStatus:text=>status=text});
 assert.equal(await controller.receive(ref),true);assert.equal(applied,1);await controller.receive(ref);assert.equal(applied,1);
 t.window.GraphicsTransientData.request=()=>new Promise(r=>resolve=r);
 const pending=controller.refresh();league=529;controller.reset();resolve(payload());assert.equal(await pending,false);assert.equal(applied,1);
 league=532;t.window.GraphicsTransientData.request=async()=>{throw Error('Source offline');};assert.equal(await controller.refresh(),false);assert.equal(applied,1);assert(status.includes('Source offline'));
 t.window.GraphicsTransientData.request=async()=>payload();assert.equal(await controller.refresh(),true);assert.equal(applied,2);
 // No players/statistics go into the published or saved match state.
 const source=fs.readFileSync(__dirname+'/broadcast-studio.js','utf8'),snapshot=source.split(/\r?\n/).find(line=>line.includes('function studioState(){'));
 const ctx={window:{},tx:String,currentSourceReference:ref,lineupFor:()=>({}),SLOTS:[],activeLeagueId:532,activeScene:'opening',$:()=>({value:'',checked:false})};vm.createContext(ctx);vm.runInContext(snapshot,ctx);
 const state=ctx.studioState();assert.equal(state.transientSource.ticket,ref.ticket);assert(!state.players&&!state.teams&&!state.sourcePayload);
 // A legacy request finishing late cannot overwrite freshly installed source data.
 const start=source.indexOf('async function loadPart('),end=source.indexOf('async function loadTournamentData(');
 let complete,rendered=false;const oldPlayers=[{display_gamertag:'Current source'}];
 const guard={activeLeagueId:532,tournamentDataRequest:1,window:{EHOCKEY_CONFIG:{supabaseUrl:'https://example.test',supabasePublishableKey:'public'}},tx:String,same:(a,b)=>String(a)===String(b),data:{players:oldPlayers},status:{},renderStatus(){},console,AbortSignal,fetch:()=>new Promise(resolve=>complete=()=>resolve({ok:true,json:async()=>[{sports_gamer_league_id:532,sports_gamer_team_id:1,sports_gamer_player_id:2,team_name_in_league:'Canada',display_gamertag:'Old DB'}]}))};
 vm.createContext(guard);vm.runInContext(source.slice(start,end),guard);const late=guard.loadPart('players','view',()=>rendered=true,1);guard.tournamentDataRequest=2;complete();await late;assert.equal(guard.data.players,oldPlayers);assert(!rendered);
 console.log('Broadcast temporary source: signed reference, login-free OBS read, expiry, cache, wrong league, stale responses, failure retention and no player rows in saved state passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});

const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const expires=new Date(Date.now()+3500000).toISOString(),ref={league_id:532,ticket:'signed.readonly',expires_at:expires};
const payload=()=>({schema_version:1,league_id:532,fetched_at:new Date().toISOString(),expires_at:expires,teams:[{sports_gamer_league_id:532,sports_gamer_team_id:1,team_name_in_league:'Canada'}],players:[{sports_gamer_league_id:532,sports_gamer_team_id:1,sports_gamer_player_id:9804,team_name_in_league:'Canada',display_gamertag:'Player',regular_points:31}],broadcast_ticket:ref.ticket});
function setup(){
 let calls=0;const window={EHOCKEY_CONFIG:{supabaseUrl:'https://example.test',supabasePublishableKey:'publishable'},SWNStudioAccess:{session:()=>{throw Error('OBS must not need login');}},GraphicsTransientData:{withPortraits:async data=>data,request:async()=>payload()}};
 const timers=new Map();let timerId=0;
 const ctx={window,Date,Map,Set,Promise,Intl,Number,String,Array,Object,Error,AbortSignal,setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),fetch:async(url,options)=>{calls++;assert(!options.headers.Authorization);assert.deepEqual(JSON.parse(options.body),{ticket:ref.ticket});return {ok:true,json:async()=>({data:payload()})};}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/transient-source.js','utf8'),ctx);return {api:window.BroadcastTransientSource,ctx,window,timers,calls:()=>calls};
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
 // A new operator session never restores a saved ticket or reads permanent statistics.
 let clears=0,operatorApplied=0;
 const op=t.api.create({getLeague:()=>532,allowRemote:false,onData:()=>operatorApplied++,onLegacy:()=>clears++});
 assert.equal(await op.receive(ref),false);assert.equal(operatorApplied,0);
 let fresh=false;t.window.GraphicsTransientData.request=async options=>{fresh=options.fresh;return payload();};
 assert.equal(await op.refresh(),true);assert.equal(fresh,true);assert.equal(operatorApplied,1);
 assert.equal(await op.receive(ref),true);
 t.window.GraphicsTransientData.request=async()=>{throw Error('Offline');};
 assert.equal(await op.refresh(),false);assert(clears>=3);assert.equal(await op.receive(ref),false);
 t.window.GraphicsTransientData.request=async()=>payload();await op.refresh();
 [...t.timers.values()].at(-1)();assert.equal(await op.receive(ref),false,'Expired session must clear its source');
 const eightHour=setup(),broadcastExpires=new Date(Date.now()+8*3600000).toISOString();let installed;
 eightHour.window.GraphicsTransientData.request=async()=>({...payload(),broadcast_expires_at:broadcastExpires});
 const long=eightHour.api.create({getLeague:()=>532,allowRemote:false,onData:(data,reference)=>installed={data,reference}});
 assert.equal(await long.refresh(),true);
 assert.equal(installed.reference.expires_at,broadcastExpires);assert.equal(installed.data.expires_at,broadcastExpires);
 const clock=Date.now;try{Date.now=()=>clock()+5*3600000;assert(eightHour.api.validData(installed.data,532));}finally{Date.now=clock;}
 assert(!source.includes('v_broadcast_teams_public'));assert(!source.includes('v_broadcast_players_public'));assert(!source.includes('async function loadPart('));
 const section=source.slice(source.indexOf('function clearTournamentData('),source.indexOf('function setTheme('));
 const empty={data:{teams:[1],players:[1],playoffs:[1]},lineups:new Map(),status:{},tournamentDataRequest:0,currentSourceReference:ref,sourcePayload:payload(),sourceProvider:{reset(){}},document:{documentElement:{dataset:{}}},$:()=>({value:'old'}),renderStatus(){},renderAllCompetitionData(){}};
 vm.createContext(empty);vm.runInContext(section,empty);empty.loadTournamentData();
 assert.equal(empty.data.teams.length,0);assert.equal(empty.data.players.length,0);assert.equal(empty.data.playoffs.length,0);assert.equal(empty.currentSourceReference,null);
 console.log('Broadcast source: fresh-only operator sessions, no DB fallback, saved tickets rejected, expiry clearing, login-free OBS, scoped references and no stored player rows passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});

const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/broadcast-studio.js','utf8'),block=source.slice(source.indexOf('let programState=null'),source.indexOf('if(!OBS_MODE&&!PREVIEW_MODE){'));
(async()=>{
 let resolve,posts=[],draft={leagueId:532,matchName:'Old'},receive=()=>new Promise(r=>resolve=r);
 const ctx={window:{BroadcastTransientSource:{reference:(ref,league)=>ref.league_id===league?ref:null}},Date,structuredClone,OBS_MODE:false,VIEWER_MODE:false,PREVIEW_MODE:true,remoteApplying:false,remoteTimer:0,activeLeagueId:532,publicNoMatch:false,publicNextMatch:null,previewChannel:{postMessage:state=>posts.push(state)},clearTimeout(){},setTimeout(){},studioState:()=>draft,applyRemoteState:s=>{draft={...s};},sourceProvider:{receive:ref=>receive(ref)}};
 vm.createContext(ctx);vm.runInContext(block,ctx);
 const ref={league_id:532,ticket:'signed.ref',expires_at:new Date(Date.now()+3500000).toISOString()};
 assert.equal(await ctx.window.__sehStudioTake({leagueId:532,matchName:'No fresh source'}),false);assert.equal(posts.length,0);
 const take=ctx.window.__sehStudioTake({leagueId:532,matchName:'New',transientSource:ref});assert.equal(posts.length,0);resolve(true);assert.equal(await take,true);assert.equal(posts.length,1);assert.equal(posts[0].state.transientSource.ticket,ref.ticket);
 receive=async()=>false;assert.equal(await ctx.window.__sehStudioTake({leagueId:532,transientSource:{...ref,ticket:'other.ref'}}),false);assert.equal(posts.length,1);
 assert.equal(await ctx.window.__sehStudioTake({leagueId:532,transientSource:{...ref,expires_at:'2000-01-01'}}),false);assert.equal(posts.length,1);
 receive=()=>new Promise(r=>resolve=r);const stale=ctx.window.__sehStudioTake({leagueId:532,transientSource:ref});ctx.window.__sehStudioHoldOutput();resolve(true);assert.equal(await stale,false);assert.equal(posts.length,1);
 console.log('Program/preview guard: wait for source, publish reference only, preserve on-air state on source failure/expiry and cancel stale takes passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});

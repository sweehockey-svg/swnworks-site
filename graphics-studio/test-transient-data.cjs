const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/transient-data.js','utf8');
const scope={league:532,start:'2026-10-11',end:'2026-10-15'};
const payload=()=>({schema_version:1,league_id:532,expires_at:new Date(Date.now()+3600000).toISOString(),teams:[],players:[],weekly:{start:scope.start,end:scope.end}});
function setup(responses){
 const calls=[],window={EHOCKEY_CONFIG:{supabaseUrl:'https://example.test',supabasePublishableKey:'public'},SWNStudioAccess:{session:async()=>({access_token:'session-token'})}};
 const ctx={window,Date,Map,Promise,Number,Array,String,Error,AbortSignal,setTimeout:fn=>fn(),fetch:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true,json:async()=>responses.shift()};}};
 vm.runInNewContext(source,ctx);return {api:window.GraphicsTransientData,calls,ctx};
}
(async()=>{
 const data=payload(),t=setup([{request_id:'test',state:'queued'},{state:'completed',data}]);
 const [a,b]=await Promise.all([t.api.request(scope),t.api.request(scope)]);
 assert.equal(a,data);assert.equal(b,data);assert.equal(t.calls.length,2);
 assert.deepEqual(t.calls[0].body,{action:'start',league:532,start:scope.start,end:scope.end});
 assert.equal(await t.api.request(scope),data);assert.equal(t.calls.length,2);
 assert(!t.api.valid({...data,league_id:527},scope));
 assert(!t.api.valid({...data,expires_at:'2000-01-01'},scope));
 assert(!t.api.valid({...data,weekly:{start:scope.start,end:'2026-10-16'}},scope));
 const wrong=setup([{request_id:'test'},{state:'completed',data:{...data,league_id:527}}]);
 await assert.rejects(wrong.api.request(scope),/fel period/);
 const failed=setup([]);failed.ctx.fetch=async()=>({ok:false,json:async()=>({error:'Administratörsbehörighet krävs.'})});
 await assert.rejects(failed.api.request(scope),/Administratör/);
 // A failed request must not stay stuck in the in-flight map.
 failed.ctx.fetch=t.ctx.fetch;await assert.rejects(failed.api.request(scope));
 assert(!/localStorage|sessionStorage|indexedDB/.test(source));
 const portraits=setup([]);let imageCalls=0;
 portraits.ctx.fetch=async(url,options)=>{
  imageCalls++;assert(url.includes('select=sports_gamer_player_id,image_url&'));assert.equal(options.method,undefined);
  return {ok:true,json:async()=>[{sports_gamer_player_id:'9804',image_url:'published-canadian.png'},{sports_gamer_player_id:'5240',image_url:'published-american.png'},{sports_gamer_player_id:'7',image_url:'newest.png'},{sports_gamer_player_id:'7',image_url:'old.png'},{sports_gamer_player_id:'9999',image_url:'unrequested.png'}]};
 };
 const original={...data,players:[{sports_gamer_player_id:9804,player_country:'CA',player_image:''},{sports_gamer_player_id:5240,player_country:'US',player_image:'source.png'},{sports_gamer_player_id:7,player_image:'source.png'},{sports_gamer_player_id:8,player_image:'fallback.png'}]};
 const linked=await portraits.api.withPortraits(original);
 assert.equal(linked.players[0].player_image,'published-canadian.png');assert.equal(linked.players[1].player_image,'published-american.png');assert.equal(linked.players[2].player_image,'newest.png');assert.equal(linked.players[3].player_image,'fallback.png');assert.equal(original.players[0].player_image,'');assert.equal(imageCalls,1);
 portraits.ctx.fetch=async()=>({ok:false});await assert.rejects(portraits.api.withPortraits(original),/publicerade spelarbilder/);
 console.log('Transient data: single-flight, polling, memory cache, scope, expiry, auth failures and no persistent storage passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});

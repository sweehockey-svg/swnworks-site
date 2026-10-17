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
 assert(!/localStorage|sessionStorage|indexedDB|\/rest\/v1/.test(source));
 console.log('Transient data: single-flight, polling, memory cache, scope, expiry, auth failures and no persistent storage passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});

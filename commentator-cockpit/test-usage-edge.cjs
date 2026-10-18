const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module');
const source=stripTypeScriptTypes(fs.readFileSync(__dirname+'/../supabase/functions/commentator-usage/index.ts','utf8').replace(/^import .*;\r?\n/gm,''));
let handler,access=[],owner=null,rpcArgs=null;
const db={auth:{getUser:async token=>({data:{user:token==='valid'?{id:'actual-owner',email:'test@example.com'}:null},error:token==='valid'?null:{}})},from:()=>({select(){return this;},eq(){return this;},then(resolve){resolve({data:access});}}),rpc:async(name,args)=>{rpcArgs={name,args};return {data:{users:[]}};}};
vm.runInNewContext(source,{Deno:{serve:f=>handler=f,env:{get:()=>''}},createClient:()=>db,Response,Set,JSON,Number});
async function call(body,token='valid',origin='https://swnworks.se'){return handler(new Request('https://test.invalid',{method:'POST',headers:{Origin:origin,Authorization:token?'Bearer '+token:'','Content-Type':'application/json'},body:JSON.stringify(body)}));}
(async()=>{
 assert.equal((await call({action:'report'},'')).status,401);
 assert.equal((await call({action:'report'},'bad')).status,401);
 assert.equal((await call({action:'report'})).status,403,'inactive denied');
 access=[{role:'commentator',league_key:'hockeyettan',team_id:'11111111-1111-4111-8111-111111111111'}];
 assert.equal((await call({action:'report'})).status,403,'ordinary user cannot read dashboard');
 const event={action:'record',event:'view_open',feature:'players',league:'hockeyettan',visit_id:'11111111-1111-4111-8111-111111111111',owner_id:'forged-owner'};
 assert.equal((await call(event)).status,200);assert.equal(rpcArgs.args.p_owner,'actual-owner');
 assert.equal((await call({...event,team_id:'22222222-2222-4222-8222-222222222222'})).status,403,'other team denied');
 assert.equal((await call({...event,feature:'PRIVATE TEXT'})).status,400,'free-text feature denied');
 assert.equal((await call(event,'valid','https://evil.invalid')).status,403);
 access=[{role:'admin',team_id:null,league_key:null}];
 assert.equal((await call({action:'report',days:90})).status,200);assert.equal(rpcArgs.name,'commentator_usage_report');
 assert.equal((await call({action:'report',days:9999})).status,400);
 console.log('PASS edge auth, active approval, admin-only report, server-owned identity, scoped writes, input bounds, origin checks');
})().catch(e=>{console.error(e);process.exit(1);});

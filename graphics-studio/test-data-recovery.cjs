const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/app.js','utf8');
(async()=>{
 const elements={},ctx={SUPA:'https://example.test',KEY:'public',S:{league:527,kind:'table',teams:[],players:[]},headers:()=>({}),AbortSignal,setTimeout:fn=>fn(),localStorage:{getItem:()=>null,setItem:()=>{}},ManualResults:{reconcile:()=>({removed:[]})},schedule:[],groups:()=>{},render:()=>ctx.rendered=true,L:{t:x=>x},console:{error:()=>{}},esc:String,$:id=>elements[id]||=( {} )};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('async function rows('),source.indexOf('function groupIds(')),ctx);
 let calls=0;ctx.fetch=async()=>({ok:++calls>1,status:500,json:async()=>['ready']});
 assert.deepEqual(await ctx.rows('players'),['ready']);assert.equal(calls,2);
 calls=0;ctx.fetch=async()=>{calls++;return {ok:false,status:401};};await assert.rejects(ctx.rows('players'),/401/);assert.equal(calls,1);
 ctx.loadSchedule=async()=>{};
 ctx.rows=async view=>{if(view.includes('players'))throw Error('HTTP 500');return [{sports_gamer_team_id:1}];};
 await ctx.load();assert.equal(ctx.S.teams.length,1);assert.equal(ctx.S.players.length,0);assert(ctx.rendered);assert.equal(vm.runInContext('playerDataError',ctx),true);assert.equal(vm.runInContext('needsPlayers()',ctx),false);
 ctx.S.kind='points';assert.equal(vm.runInContext('needsPlayers()',ctx),true);
 ctx.rows=async view=>view.includes('players')?[{display_gamertag:'Recovered'}]:[{sports_gamer_team_id:1}];await ctx.load();assert.equal(vm.runInContext('playerDataError',ctx),false);assert.equal(ctx.S.players[0].display_gamertag,'Recovered');
 console.log('Data recovery passed: retry 500, no retry 401, independent standings, missing-player guard and subsequent recovery');
})().catch(error=>{console.error(error);process.exitCode=1;});

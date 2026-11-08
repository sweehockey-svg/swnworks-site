const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const date='2026-10-06T22:47:53+02:00', next='2026-10-07T05:28:15+02:00';
const match={id:135997,stage:'regular',homeId:7103,awayId:6709,homeScore:4,awayScore:3,date};
const matches=[match,{...match,id:136003,homeId:6709,awayId:7103,homeScore:6,awayScore:2,date:next},
  {...match,id:137001,stage:'playoffs'}, {...match,id:137002,homeScore:null}, {...match,id:137003,awayId:55}, match];
let requests=0;
const ctx={window:{EHOCKEY_CONFIG:{supabaseUrl:'https://fixture.invalid',supabasePublishableKey:'fixture'}},AbortSignal,
  fetch:async url=>{assert.match(url,/graphics-schedule\?league=527$/);requests++;return {ok:true,json:async()=>({matches})};}};
vm.runInNewContext(fs.readFileSync(__dirname+'/group-meetings.js','utf8'),ctx);
const helper=ctx.window.BroadcastGroupMeetings,plain=x=>JSON.parse(JSON.stringify(x));
(async()=>{
  assert.equal(helper.cached(527,6709,7103),null);
  await Promise.all([helper.load(527),helper.load(527)]);
  assert.equal(requests,1);
  assert.deepEqual(plain(helper.cached(527,6709,7103)).map(x=>[x.id,x.home,x.away]),[[136003,6,2],[135997,3,4]]);
  assert.deepEqual(plain(helper.cached(527,7103,6709)).map(x=>[x.home,x.away]),[[2,6],[4,3]]);
  assert.deepEqual(plain(helper.cached(527,6709,55)),[]);
  assert.equal(helper.cached(520,6709,7103),null);
  console.log('PASS verified group games only; duplicate, missing and playoff results excluded; order follows the current teams');
})().catch(error=>{console.error(error);process.exitCode=1;});

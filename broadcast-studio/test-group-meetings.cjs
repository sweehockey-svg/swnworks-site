const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const date='2026-10-06T22:47:53+02:00', next='2026-10-07T05:28:15+02:00';
const match={id:135997,stage:'regular',homeId:7103,awayId:6709,homeScore:4,awayScore:3,date};
const matches=[match,{...match,id:136003,homeId:6709,awayId:7103,homeScore:6,awayScore:2,date:next},
  {...match,id:137001,stage:'playoffs'}, {...match,id:137002,homeScore:null}, {...match,id:137003,awayId:55}, match];
let requests=0;
const ctx={window:{EHOCKEY_CONFIG:{supabaseUrl:'https://fixture.invalid',supabasePublishableKey:'fixture'}},AbortSignal,
  fetch:async url=>{
    if(url.includes('&goals=')){
      assert.match(url,/&goals=135997,136003$/);
      return {ok:true,json:async()=>({scorers:{135997:{7103:[{id:2,name:'Test',goals:4}],6709:[{id:3,name:'Bad total',goals:2}]}}})};
    }
    assert.match(url,/graphics-schedule\?league=527$/);requests++;return {ok:true,json:async()=>({matches})};
  }};
vm.runInNewContext(fs.readFileSync(__dirname+'/group-meetings.js','utf8'),ctx);
const helper=ctx.window.BroadcastGroupMeetings,plain=x=>JSON.parse(JSON.stringify(x));
(async()=>{
  assert.equal(helper.cached(527,6709,7103),null);
  await Promise.all([helper.load(527),helper.load(527)]);
  assert.equal(requests,1);
  const completed=plain(helper.completed(527));
  assert.deepEqual(completed.map(x=>x.id),[136003,137003,137001,135997]);
  const {summarize,rank}=require('./tournament-scenes.js');
  assert.deepEqual([summarize(completed,'').games,summarize(completed,'').goals,summarize(completed,'playoff').games],[4,29,1]);
  assert.equal(summarize(completed,'regular').highest.id,136003);
  const goalie=(id,team,values)=>({sports_gamer_player_id:id,sports_gamer_team_id:team,...values});
  const ranking=rank([
    goalie(1,10,{regular_goalie_games:3,regular_goalie_save_percentage:.8}),
    goalie(1,11,{playoff_goalie_games:2,playoff_goalie_save_percentage:90}),
    goalie(2,12,{regular_goalie_games:2,regular_goalie_save_percentage:99}),
    goalie(3,12,{regular_goalie_games:4,regular_goalie_save_percentage:null})
  ],'',true);
  assert.deepEqual(ranking.map(p=>[p.id,p.team,p.gp,p.sv]),[[1,10,5,84]]);
  assert.deepEqual(plain(helper.cached(527,6709,7103)).map(x=>[x.id,x.home,x.away]),[[136003,6,2],[135997,3,4]]);
  assert.deepEqual(plain(helper.cached(527,7103,6709)).map(x=>[x.home,x.away]),[[2,6],[4,3]]);
  assert.deepEqual(plain(helper.cached(527,6709,55)),[]);
  assert.equal(helper.cached(520,6709,7103),null);
  await helper.loadScorers(527,helper.cached(527,6709,7103));
  assert.deepEqual(plain(helper.scorers(527,135997,7103,4)),[{id:2,name:'Test',goals:4}]);
  assert.deepEqual(plain(helper.scorers(527,135997,6709,3)),[]);
  assert.deepEqual(plain(helper.scorers(527,136003,6709,6)),[]);
  console.log('PASS verified group games only; duplicate, missing and playoff results excluded; order follows the current teams');
})().catch(error=>{console.error(error);process.exitCode=1;});

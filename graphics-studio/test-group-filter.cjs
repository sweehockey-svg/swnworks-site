const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/app.js','utf8');
const ctx=vm.createContext({S:{stage:'regular',count:8,minGamesPercent:50,filterGroup:null,teams:[],players:[]},n:v=>Number(v)||0});
vm.runInContext(source.slice(source.indexOf('function filterGroups('),source.indexOf('function logos(')),ctx);
vm.runInContext(source.slice(source.indexOf('function ps('),source.indexOf('function stageName(')),ctx);
ctx.S.teams=[{sports_gamer_team_id:1,team_name_in_league:'Team A',statistics_stage:'regular',effective_group_id:10,games_played:4},{sports_gamer_team_id:2,team_name_in_league:'Team B',statistics_stage:'regular',effective_group_id:20,games_played:4}];
ctx.S.players=[1,2].map(id=>({sports_gamer_team_id:id,display_gamertag:'Player '+id,regular_skater_games:4,regular_goals:id*4,regular_assists:id*3,regular_points:id*7,regular_penalty_minutes:id*2,regular_hits:id*5,regular_takeaways:id*2,regular_interceptions:id,regular_blocked_shots:id,regular_skater_position_abbreviation:'LD',regular_goalie_games:4,regular_goalie_save_percentage:.8+id*.05,regular_goalie_goals_against_average:2,regular_goalie_shutouts:1}));
for(const group of [null,10,20]){
 ctx.S.filterGroup=group;
 const expected=group===10?1:2;
 for(const metric of ['g','a','p']){
  assert.equal(ctx.skaters(metric)[0].sports_gamer_team_id,expected);
  assert.equal(ctx.skaters(metric,true)[0].sports_gamer_team_id,expected);
 }
 for(const metric of ['points_average','penalties','hits'])assert.equal(ctx.extraLeaders(metric)[0].sports_gamer_team_id,expected);
 assert.equal(ctx.dimPlayers()[0].sports_gamer_team_id,expected);
 assert.equal(ctx.goalies()[0].sports_gamer_team_id,expected);
}
ctx.S.filterGroup=10;
assert(ctx.matchInSelectedGroup({home:' TEAM A ',away:'Other'}));
assert(ctx.matchInSelectedGroup({homeId:1,awayId:3}));
assert(!ctx.matchInSelectedGroup({home:'Team B',away:'Other'}));
assert(!ctx.matchInSelectedGroup({home:'Unknown',away:'Unknown'}));
ctx.S.filterGroup=null;
assert(ctx.matchInSelectedGroup({home:'Unknown',away:'Unknown'}));
console.log('Group filtering passed: all skater/defender metrics, goalies, DIM, all groups, and results by team ID/name.');

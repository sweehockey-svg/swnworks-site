(()=>{'use strict';
const signature=g=>JSON.stringify([[String(g.home).trim().toLocaleLowerCase('sv'),Number(g.homeScore)],[String(g.away).trim().toLocaleLowerCase('sv'),Number(g.awayScore)]].sort((a,b)=>a[0].localeCompare(b[0],'sv')));
function reconcile(pending,official,league){
 const used=new Set(),removed=[];
 const remaining=pending.filter(g=>{
  if(Number(g.league)!==Number(league))return true;
  const match=official.find(o=>!used.has(String(o.id))&&!g.knownIds.includes(String(o.id))&&signature(o)===signature(g));
  if(!match)return true;used.add(String(match.id));removed.push(g);return false;
 });return {remaining,removed};
}
function apply(teams,pending,league){
 const result=teams.map(t=>({...t}));
 for(const g of pending.filter(g=>Number(g.league)===Number(league))){
  const home=result.find(t=>t.statistics_stage==='regular'&&String(t.sports_gamer_team_id)===String(g.homeId));
  const away=result.find(t=>t.statistics_stage==='regular'&&String(t.sports_gamer_team_id)===String(g.awayId));
  if(!home||!away)continue;
  for(const [team,scored,conceded] of [[home,g.homeScore,g.awayScore],[away,g.awayScore,g.homeScore]]){
   const win=scored>conceded;
   team.games_played=Number(team.games_played||0)+1;
   team.goals_for=Number(team.goals_for||0)+scored;team.goals_against=Number(team.goals_against||0)+conceded;
   team.goal_difference=Number(team.goal_difference||0)+scored-conceded;
   team.total_wins=Number(team.total_wins||0)+(win?1:0);
   team.losses=Number(team.losses||0)+(!win&&!g.overtime?1:0);
   team.table_points=Number(team.table_points||0)+(win?(g.overtime?2:3):(g.overtime?1:0));
  }
 }return result;
}
const api={signature,reconcile,apply};if(typeof module!=='undefined')module.exports=api;else window.ManualResults=api;
})();

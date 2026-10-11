(()=>{'use strict';
const num=v=>Number(v)||0;
const id=t=>String(t.sports_gamer_team_id);
// Partition whole tied sets: pairwise head-to-head comparisons are not transitive.
function rank(teams,matches,league){
 const legacy=(a,b)=>num(b.table_points)-num(a.table_points)||num(b.goal_difference)-num(a.goal_difference)||num(b.goals_for)-num(a.goals_for)||String(a.team_name_in_league||'').localeCompare(String(b.team_name_in_league||''),'sv');
 if(Number(league)!==527)return [...teams].sort(legacy);
 const normalized=(set,field)=>{const different=new Set(set.map(t=>num(t.games_played))).size>1;return t=>different?(num(t.games_played)>0?field(t)/num(t.games_played):0):field(t);};
 function split(set,step){
  if(set.length<2)return set;
  if(step===6)return set; // A drawing of lots must come from the organizer; retain input order.
  let value;
  if(step===0)value=t=>num(t.table_points);
  if(step===1)value=t=>num(t.games_played)>0?num(t.table_points)/num(t.games_played):0;
  if(step===2)value=normalized(set,t=>num(t.wins)+num(t.overtime_wins));
  if(step===3){
   const ids=new Set(set.map(id)),stats=new Map(set.map(t=>[id(t),{gp:0,pts:0}]));
   for(const m of matches){
    if(m.stage!=='regular'||!ids.has(String(m.homeId))||!ids.has(String(m.awayId))||!Number.isFinite(Number(m.homeScore))||!Number.isFinite(Number(m.awayScore))||Number(m.homeScore)===Number(m.awayScore))continue;
    const h=stats.get(String(m.homeId)),a=stats.get(String(m.awayId));h.gp++;a.gp++;
    const win=Number(m.homeScore)>Number(m.awayScore);h.pts+=win?(m.overtime?2:3):(m.overtime?1:0);a.pts+=win?(m.overtime?1:0):(m.overtime?2:3);
   }
   const different=new Set([...stats.values()].map(s=>s.gp)).size>1;
   value=t=>{const s=stats.get(id(t));return different?(s.gp?s.pts/s.gp:0):s.pts;};
  }
  if(step===4)value=normalized(set,t=>num(t.goal_difference));
  if(step===5)value=normalized(set,t=>num(t.goals_for));
  const sorted=[...set].sort((a,b)=>value(b)-value(a)),groups=[];
  for(const t of sorted){const last=groups.at(-1);if(last&&Math.abs(value(last[0])-value(t))<1e-10)last.push(t);else groups.push([t]);}
  return groups.flatMap(g=>split(g,step+1));
 }
 return split([...teams],0);
}
const api={rank};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.StandingsOrder=api;
})();

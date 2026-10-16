(function(root){
 'use strict';
 function sunday(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),get=k=>parts.find(p=>p.type===k).value;
  const d=new Date(get('year')+'-'+get('month')+'-'+get('day')+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-d.getUTCDay());return d.toISOString().slice(0,10);
 }
 function select(candidates,available){
  const selected={},used=new Set(),slots=['LW','C','RW','LD','RD','G'];
  for(const slot of slots){
   const valid=candidates.filter(p=>{
    if(p.position!==slot||used.has(String(p.source_player_id))||!available.has(p.source_team_id+':'+p.source_player_id)||Number(p.games)<=0||Number(p.games)*2<Number(p.team_games))return false;
    if(slot==='G')return p.goalie_complete===true&&Number(p.saves)+Number(p.goals_allowed)>0;
    if(['LD','RD'].includes(slot))return p.dim_complete===true&&p.defensive_actions!=null;
    return p.goals!=null&&p.assists!=null;
   });
   const score=p=>slot==='G'?Number(p.saves)/(Number(p.saves)+Number(p.goals_allowed)):['LD','RD'].includes(slot)?Number(p.defensive_actions)/Number(p.games):Number(p.goals)+Number(p.assists);
   valid.sort((a,b)=>score(b)-score(a)||(Number(b.goals)+Number(b.assists))-(Number(a.goals)+Number(a.assists))||Number(b.games)-Number(a.games)||Number(a.source_player_id)-Number(b.source_player_id));
   if(valid[0]){selected[slot]=valid[0];used.add(String(valid[0].source_player_id));}
  }
  return selected;
 }
 root.GraphicsWeeklyTeam={sunday,select};
 if(typeof module==='object')module.exports=root.GraphicsWeeklyTeam;
})(typeof window==='object'?window:globalThis);

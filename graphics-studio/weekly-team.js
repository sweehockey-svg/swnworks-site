(function(root){
 'use strict';
 function sunday(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),get=k=>parts.find(p=>p.type===k).value;
  const d=new Date(get('year')+'-'+get('month')+'-'+get('day')+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-d.getUTCDay());return d.toISOString().slice(0,10);
 }
 function select(candidates,available,forwardMetric='total'){
  const groups=new Map(),order=['LW','C','RW','LD','RD','G'];
  for(const p of candidates){
   if(!order.includes(p.position))continue;
   const role=['LW','C','RW'].includes(p.position)?'F':['LD','RD'].includes(p.position)?'D':'G';
   const key=[p.source_team_id,p.source_player_id,role].join(':');
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push(p);
  }
  candidates=[...groups.values()].map(rows=>{
   rows.sort((a,b)=>Number(b.games)-Number(a.games)||(Number(b.goals)+Number(b.assists))-(Number(a.goals)+Number(a.assists))||order.indexOf(a.position)-order.indexOf(b.position));
   const result={...rows[0],games:0,goals:0,assists:0,defensive_actions:0,saves:0,goals_allowed:0,dim_complete:true,goalie_complete:true};
   for(const p of rows){
    for(const key of ['games','goals','assists','defensive_actions','saves','goals_allowed'])result[key]+=Number(p[key]||0);
    result.dim_complete=result.dim_complete&&p.dim_complete===true;
    result.goalie_complete=result.goalie_complete&&p.goalie_complete===true;
   }
   return result;
  });
  const selected={},used=new Set(),slots=['LW','C','RW','LD','RD','G'];
  for(const slot of slots){
   const valid=candidates.filter(p=>{
    if(p.position!==slot||used.has(String(p.source_player_id))||!available.has(p.source_team_id+':'+p.source_player_id)||Number(p.games)<2)return false;
    if((['LD','RD','G'].includes(slot)||forwardMetric==='average')&&Number(p.games)*2<Number(p.team_games))return false;
    if(slot==='G')return p.goalie_complete===true&&Number(p.saves)+Number(p.goals_allowed)>0;
    if(['LD','RD'].includes(slot))return p.dim_complete===true&&p.defensive_actions!=null;
    return p.goals!=null&&p.assists!=null;
   });
   const score=p=>slot==='G'?Number(p.saves)/(Number(p.saves)+Number(p.goals_allowed)):['LD','RD'].includes(slot)?Number(p.defensive_actions)/Number(p.games):(Number(p.goals)+Number(p.assists))/(forwardMetric==='average'?Number(p.games):1);
   valid.sort((a,b)=>score(b)-score(a)||(Number(b.goals)+Number(b.assists))-(Number(a.goals)+Number(a.assists))||Number(b.games)-Number(a.games)||Number(a.source_player_id)-Number(b.source_player_id));
   if(valid[0]){selected[slot]=valid[0];used.add(String(valid[0].source_player_id));}
  }
  return selected;
 }
 function validRange(start,end){
  const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
  return valid(start)&&valid(end)&&start>='2020-01-01'&&end>=start;
 }
 function periodLabel(start,end,locale='sv-SE'){
  if(!validRange(start,end))return '';
  const date=s=>new Date(s+'T12:00:00Z'),month=s=>new Intl.DateTimeFormat(locale,{month:'long',timeZone:'UTC'}).format(date(s)).toLocaleUpperCase(locale),day=s=>Number(s.slice(8));
  if(start===end)return day(start)+' '+month(start)+' '+start.slice(0,4);
  if(start.slice(0,7)===end.slice(0,7))return day(start)+'–'+day(end)+' '+month(end)+' '+end.slice(0,4);
  return day(start)+' '+month(start)+(start.slice(0,4)===end.slice(0,4)?'':' '+start.slice(0,4))+' – '+day(end)+' '+month(end)+' '+end.slice(0,4);
 }
 function periodPlayer(candidates,teamId,playerId,slot){
  const positions=slot==='G'?['G']:['LD','RD'].includes(slot)?['LD','RD']:['LW','C','RW'];
  const rows=candidates.filter(p=>String(p.source_team_id)===String(teamId)&&String(p.source_player_id)===String(playerId)&&positions.includes(p.position));
  if(!rows.length)return null;
  const result={games:0,goals:0,assists:0,defensive_actions:0,saves:0,goals_allowed:0,dim_complete:true,goalie_complete:true,points_complete:true};
  for(const p of rows){
   for(const key of ['games','goals','assists','defensive_actions','saves','goals_allowed'])result[key]+=Number(p[key]||0);
   result.dim_complete&&=p.dim_complete===true;
   result.goalie_complete&&=p.goalie_complete===true;
   result.points_complete&&=p.goals!=null&&p.assists!=null;
  }
  return result.games>0?result:null;
 }
 function periodMetric(p,slot,mode='total',locale='sv-SE'){
  if(!p||p.games<=0)return '';
  const number=(n,digits)=>new Intl.NumberFormat(locale,{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(n);
  if(slot==='G')return p.goalie_complete&&p.saves+p.goals_allowed>0?number(100*p.saves/(p.saves+p.goals_allowed),1)+' SV%':'';
  if(['LD','RD'].includes(slot))return p.dim_complete?'DIM '+number(p.defensive_actions/p.games,2):'';
  if(p.points_complete===false)return '';
  return mode==='average'?number((p.goals+p.assists)/p.games,2)+' P/GP':number(p.goals+p.assists,0)+' P';
 }
 root.GraphicsWeeklyTeam={sunday,select,validRange,periodLabel,periodPlayer,periodMetric};
 if(typeof module==='object')module.exports=root.GraphicsWeeklyTeam;
})(typeof window==='object'?window:globalThis);

const clean=(value:any,max=1200)=>String(value??'').replace(/\s+/g,' ').trim().slice(0,max);

export function historySourceUrl(value:any){
  try{
    const url=new URL(String(value||''));
    if(!['https:','http:'].includes(url.protocol)||url.username||url.password) return '';
    // No EliteProspects material is licensed for this AI integration.
    if(/(^|\.)eliteprospects\.com$/i.test(url.hostname)||/(^|\.)api\.eliteprospects\.com$/i.test(url.hostname)) return '';
    return url.href;
  }catch{return '';}
}

export function buildPlayerHistoryContext(players:any[],roster:any[],registrations:any[],articles:any[]){
  const current=new Map(roster.filter(row=>row.player_id).map(row=>[row.player_id,row]));
  const identities=new Map(players.filter(p=>current.has(p.id)).map(p=>[p.id,p]));
  const identity=(row:any)=>{
    const player=identities.get(row.player_id),team=current.get(row.player_id);
    return player&&team?{player_id:player.id,player_name:clean(player.display_name,160),team_id:team.team_id}:null;
  };
  const groups=new Map<string,any>();
  for(const row of registrations){
    const who=identity(row),url=historySourceUrl(row.source_url);
    if(!who||!url||new URL(url).hostname!=='stats.swehockey.se')continue;
    const key=row.player_id+'|'+row.season+'|'+row.club;
    if(!groups.has(key))groups.set(key,{...who,season:clean(row.season,30),club:clean(row.club,120),league:clean(row.league,120),record_type:'Truppregistrering; bevisar inte spelade matcher eller övergångsdatum',source_url:url});
  }
  const bounded=(rows:any[],perPlayer:number)=>{
    const counts=new Map<string,number>();
    return rows.filter(row=>{
      const count=counts.get(row.player_id)||0;
      if(count>=perPlayer)return false;
      counts.set(row.player_id,count+1);return true;
    });
  };
  const registrationRows=bounded([...groups.values()].sort((a,b)=>b.season.localeCompare(a.season)),12);
  const backgroundRows=bounded(articles.flatMap(row=>{
    const who=identity(row),url=historySourceUrl(row.source_url);
    if(!who||!url||new URL(url).hostname!=='www.hockeyettan.se')return [];
    return [{...who,headline:clean(row.headline,200),details:clean(row.details,2000),source_label:clean(row.source_label,200),source_url:url,published_on:row.published_on||null,record_type:'Klubbens publicerade bakgrund; statistik gäller artikelns period'}];
  }),4);
  return {player_registrations:registrationRows,player_background:backgroundRows};
}

export async function loadPlayerHistoryContext(admin:any,roster:any[]){
  const ids=[...new Set(roster.map(row=>row.player_id).filter(Boolean))];
  if(!ids.length)return buildPlayerHistoryContext([],[],[],[]);
  const [players,registrations,articles]=await Promise.all([
    admin.from('players').select('id,display_name').in('id',ids),
    admin.from('swehockey_player_history').select('player_id,season,club,league,source_url').in('player_id',ids).order('season',{ascending:false}).limit(3000),
    admin.from('player_background_sources').select('player_id,headline,details,source_label,source_url,published_on').in('player_id',ids).order('published_on',{ascending:false}).limit(300)
  ]);
  if([players,registrations,articles].some(result=>result.error))throw new Error('player_history_load_failed');
  return buildPlayerHistoryContext(players.data||[],roster,registrations.data||[],articles.data||[]);
}

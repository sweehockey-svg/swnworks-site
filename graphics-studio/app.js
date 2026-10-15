(() => {
"use strict";
const L=window.GraphicsLanguage;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const cfg=window.EHOCKEY_CONFIG||{}, SUPA=String(cfg.supabaseUrl||"").replace(/\/+$/,""), KEY=String(cfg.supabasePublishableKey||cfg.supabaseAnonKey||"");
const C={
  532:{label:"WV 4 NATIONS 2026",code:"WV",logo:"assets/wv-logo.svg"},
  520:{label:"SEC 21",code:"SEC",logo:"https://www.svenskehockey.se/assets/SECLOGGA.png"},
  523:{label:"WECL",code:"WECL",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/NHLGamer/WECL/WECL_logo.png"},
  524:{label:"GCL 13 · DIV I",code:"GCL",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/SportsGamer/leagues/GCL/Season_12/GCL_logo_new_350x350.png"},
  525:{label:"GCL 13 · DIV II",code:"GCL",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/SportsGamer/leagues/GCL/Season_12/GCL_logo_new_350x350.png"},
  526:{label:"GCL 13 · POKAL",code:"GCL",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/SportsGamer/leagues/GCL/Season_12/GCL_logo_new_350x350.png"},
  527:{label:"SCL 27",code:"SCL",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/NHLGamer/Community/uploads/monthly_2021_08/small.SCL_logo_shading.png.f99772ef717dcd328c35b5469ac1cbc2.png"},
  529:{label:"FCL 27",code:"FCL",logo:"https://sportsgamer.gg/community/gallery/image/374-fcl_logopng/?do=download"}
};
const F={portrait:{w:1080,h:1350,label:"1080 × 1350"},square:{w:1080,h:1080,label:"1080 × 1080"},story:{w:1080,h:1920,label:"1080 × 1920"},wide:{w:1920,h:1080,label:"1920 × 1080"}};
const TIT={table:"TABELLEN",groups:"GRUPPTABELLER",goals:"SKYTTELIGAN",points:"POÄNGLIGAN",assists:"ASSISTLIGAN",defender_points:"BACKLIGAN · POÄNG",defender_goals:"BACKLIGAN · MÅL",defender_assists:"BACKLIGAN · ASSIST",goalies:"MÅLVAKTSLIGAN",leaders:"LIGATOPPAR"};
const S={kind:"table",league:527,stage:"regular",group:null,count:8,format:"portrait",bg:"gamenight",logos:true,teams:[],players:[]};
TIT.roster='LAGPRESENTATION';TIT.player='SPELARPRESENTATION';
TIT.matches='DAGENS RESULTAT';
TIT.dim='DEFENSIV IMPACT';
Object.assign(TIT,{points_average:'POÄNGSNITT',defender_points_average:'BACKLIGAN · POÄNGSNITT',penalties:'UTVISNINGSLIGAN',hits:'TACKLINGSLIGAN'});
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const n=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v))?Number(v):0;
const clip=(v,l)=>{v=String(v||"");return v.length>l?v.slice(0,l-1)+"…":v};
const comp=()=>C[S.league]||{label:"TURNERING",code:"",logo:""}, format=()=>F[S.format]||F.portrait;
const headers=()=>{const h={apikey:KEY,Accept:"application/json"};if(/^eyJ[^.]+\.[^.]+\.[^.]+$/.test(KEY))h.Authorization="Bearer "+KEY;return h};
async function rows(view){
  if(!SUPA||!KEY)throw new Error("Supabase-konfiguration saknas");
  const u=SUPA+"/rest/v1/"+view+"?sports_gamer_league_id=eq."+S.league+"&select=*";
  for(let attempt=0;attempt<2;attempt++){
    try{
      const r=await fetch(u,{headers:headers(),cache:"no-store",signal:AbortSignal.timeout(20000)});
      if(!r.ok){const error=new Error(view+" HTTP "+r.status);error.status=r.status;throw error;}
      return await r.json();
    }catch(error){
      if(attempt||!(error.status>=500||error.status===429||error instanceof TypeError||error.name==='TimeoutError'))throw error;
      await new Promise(resolve=>setTimeout(resolve,500));
    }
  }
}
let manualMatches=[];
try{const saved=JSON.parse(localStorage.getItem('swn-graphics-manual-results')||'[]');if(Array.isArray(saved))manualMatches=saved.filter(g=>g&&Array.isArray(g.knownIds)&&Number.isInteger(g.homeScore)&&Number.isInteger(g.awayScore));}catch{}
function storeManualMatches(next){try{localStorage.setItem('swn-graphics-manual-results',JSON.stringify(next));manualMatches=next;return true;}catch{return false;}}
let dataRequest=0,dataLoading=false,playerDataError=false;
const needsPlayers=()=>!['table','groups','matches'].includes(S.kind);
async function load(){
  const request=++dataRequest, league=S.league;dataLoading=true;
  setStatus("HÄMTAR…","load");
  try{
    const [teamsResult,playersResult]=await Promise.allSettled([rows("v_broadcast_teams_public"),rows("v_broadcast_players_public"),loadSchedule(false)]);
    if(request!==dataRequest||league!==S.league)return;
    if(teamsResult.status!=='fulfilled')throw teamsResult.reason;
    S.teams=teamsResult.value;
    playerDataError=playersResult.status!=='fulfilled';S.players=playerDataError?[]:playersResult.value;dataLoading=false;
    const reconciliation=ManualResults.reconcile(manualMatches,schedule,league);
    if(reconciliation.removed.length&&storeManualMatches(reconciliation.remaining))$("#manualMatchStatus").textContent=reconciliation.removed.length+' manuell match ersatt av rapporterat resultat.';
    groups(); setStatus(playerDataError?'Lagdata klar · Spelardata kunde inte hämtas. Försök uppdatera.':S.teams.length+" LAG · "+S.players.length+" SPELARE",playerDataError?'partial':'ok'); render();
  }catch(e){if(request!==dataRequest)return;dataLoading=false;console.error(e);setStatus("DATAFEL","error");$("#preview").innerHTML='<div style="color:white;padding:30px">Datafel: '+esc(e.message)+'</div>'}
}
function setStatus(t,m){$("#dataStatus").textContent=L.t(t);$("#topStatus").textContent=L.t(m==="error"?"DATAFEL":m==="load"?"UPPDATERAR":m==='partial'?'SPELARDATA SAKNAS':"LIVE DATA")}
function groupIds(){return [...new Set(S.teams.filter(x=>x.statistics_stage==="regular").map(x=>Number(x.effective_group_id)).filter(Number.isFinite))].sort((a,b)=>a-b)}
function groupName(id){const ids=groupIds(),i=ids.indexOf(Number(id));return L.t("GRUPP")+" "+(i<0?Number(id):i+1)}
function groups(){
  const ids=groupIds();if(!ids.length){S.group=null;$("#group").innerHTML='<option>Ingen gruppdata</option>';return}
  if(!ids.includes(Number(S.group)))S.group=ids[0];
  $("#group").innerHTML=ids.map(id=>'<option value="'+id+'"'+(id===S.group?' selected':'')+'>'+groupName(id)+'</option>').join("");
}
function logos(){const m=new Map();S.teams.forEach(t=>{const k=String(t.sports_gamer_team_id);if(t.team_logo_in_league&&!m.has(k))m.set(k,t.team_logo_in_league)});return m}
function standingsForGroup(groupId){return StandingsOrder.rank(ManualResults.apply(S.teams,manualMatches,S.league).filter(x=>x.statistics_stage==="regular"&&Number(x.effective_group_id)===Number(groupId)),[...schedule,...manualMatches.filter(g=>Number(g.league)===Number(S.league)).map(g=>({...g,stage:'regular'}))],S.league)}
function standings(){return standingsForGroup(S.group)}
function ps(p,key){if(S.stage==="regular")return n(p["regular_"+key]);if(S.stage==="playoffs")return n(p["playoff_"+key]);return n(p["regular_"+key])+n(p["playoff_"+key])}
function qualificationPercent(){const value=Number(S.minGamesPercent??50);return Number.isFinite(value)?Math.max(0,Math.min(100,value)):50;}
function qualifiesForGames(games,total){return total>0&&games>0&&games*100>=total*qualificationPercent();}
function isDefender(p){
  const stage=S.stage==='total'?(n(p.playoff_skater_games)>n(p.regular_skater_games)?'playoff':'regular'):S.stage==='playoffs'?'playoff':'regular';
  const position=p[stage+'_skater_position_abbreviation']||p.roster_preferred_position_abbreviation||p.global_preferred_position_abbreviation||'';
  return /^(LD|RD|D)$/i.test(String(position).trim());
}
function skaters(metric,defendersOnly=false){
  return S.players.filter(p=>!defendersOnly||isDefender(p)).map(p=>({...p,gp:ps(p,"skater_games"),g:ps(p,"goals"),a:ps(p,"assists"),p:ps(p,"points")})).filter(p=>p.gp>0).sort((a,b)=>b[metric]-a[metric]||b.p-a.p||b.g-a.g||String(a.display_gamertag||"").localeCompare(String(b.display_gamertag||""),"sv")).slice(0,S.count);
}
function teamGamesFor(p){
  return S.teams.filter(t=>String(t.sports_gamer_team_id)===String(p.sports_gamer_team_id)&&(S.stage==='total'||t.statistics_stage===(S.stage==='playoffs'?'playoffs':'regular'))).reduce((sum,t)=>sum+n(t.games_played),0);
}
function metricAvailable(p,key){
  const stages=S.stage==='total'?['regular','playoff']:[S.stage==='playoffs'?'playoff':'regular'];
  return stages.every(s=>!n(p[s+'_skater_games'])||(p[s+'_'+key]!=null&&Number.isFinite(Number(p[s+'_'+key]))));
}
function extraLeaders(kind,defendersOnly=false){
  const average=kind==='points_average',field=average?'points':kind==='penalties'?'penalty_minutes':'hits';
  return S.players.filter(p=>(!defendersOnly||isDefender(p))&&metricAvailable(p,field)).map(p=>{
    const gp=ps(p,'skater_games'),teamGames=teamGamesFor(p),total=ps(p,field);
    return {...p,gp,g:ps(p,'goals'),a:ps(p,'assists'),p:ps(p,'points'),teamGames,total,score:average?(gp?total/gp:0):total};
  }).filter(p=>p.gp>0&&(average?qualifiesForGames(p.gp,p.teamGames):p.score>0))
    .sort((a,b)=>b.score-a.score||b.p-a.p||b.gp-a.gp||String(a.display_gamertag||'').localeCompare(String(b.display_gamertag||''),'sv')).slice(0,3);
}
function dimPlayers(){
  return S.players.map(p=>{
    const gp=ps(p,'skater_games'),ta=ps(p,'takeaways'),it=ps(p,'interceptions'),bs=ps(p,'blocked_shots');
    const teamGames=S.teams.filter(t=>String(t.sports_gamer_team_id)===String(p.sports_gamer_team_id)&&(S.stage==='total'||t.statistics_stage===(S.stage==='playoffs'?'playoffs':'regular'))).reduce((sum,t)=>sum+n(t.games_played),0);
    const stages=S.stage==='total'?['regular','playoff']:[S.stage==='playoffs'?'playoff':'regular'];
    const complete=stages.every(s=>!n(p[s+'_skater_games'])||['takeaways','interceptions','blocked_shots'].every(k=>p[s+'_'+k]!=null));
    return {...p,gp,ta,it,bs,teamGames,complete,dim:gp?(ta+it+bs)/gp:0};
  }).filter(p=>p.complete&&p.gp>0&&qualifiesForGames(p.gp,p.teamGames)).sort((a,b)=>b.dim-a.dim||b.gp-a.gp||String(a.display_gamertag).localeCompare(String(b.display_gamertag),'sv')).slice(0,3);
}
function gv(p,key){
  const rg=n(p.regular_goalie_games),pg=n(p.playoff_goalie_games);
  if(S.stage==="regular")return key==="gp"?rg:(p["regular_goalie_"+key]==null?null:Number(p["regular_goalie_"+key]));
  if(S.stage==="playoffs")return key==="gp"?pg:(p["playoff_goalie_"+key]==null?null:Number(p["playoff_goalie_"+key]));
  if(key==="gp")return rg+pg;if(key==="shutouts")return n(p.regular_goalie_shutouts)+n(p.playoff_goalie_shutouts);
  const a=p["regular_goalie_"+key],b=p["playoff_goalie_"+key],d=rg+pg;if((rg>0&&a==null)||(pg>0&&b==null))return null;return d?((a==null?0:Number(a))*rg+(b==null?0:Number(b))*pg)/d:null;
}
function goalies(){
  return S.players.map(p=>({...p,gp:gv(p,"gp"),teamGames:teamGamesFor(p),sv:gv(p,"save_percentage"),gaa:gv(p,"goals_against_average"),so:gv(p,"shutouts")})).filter(p=>p.gp>0&&qualifiesForGames(p.gp,p.teamGames)&&p.sv!=null&&Number.isFinite(p.sv)).sort((a,b)=>b.sv-a.sv||(a.gaa??99)-(b.gaa??99)||b.gp-a.gp).slice(0,S.count);
}
function stageName(){return S.stage==="regular"?"GRUPPSPEL":S.stage==="playoffs"?"SLUTSPEL":"TOTALT"}
function sync(){S.league=Number($("#league").value||527);S.stage=$("#stage").value;S.group=$("#group").value?Number($("#group").value):S.group;S.count=Number($("#count").value||8);S.format=$("#format").value;S.minGamesPercent=$("#minGamesPercent").value===""?50:Number($("#minGamesPercent").value);S.bg=$("#bg").value;S.logos=$("#logos").checked}
let schedule=[],scheduleLoading=false,scheduleError="",scheduleRequest=0;
const scheduleToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91anFudnJjemRhdnFicWFhdnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3Mzg3NDEsImV4cCI6MjEwMDMxNDc0MX0.-yVDYCXkdslmUiXToldsCcWqPIv6tkPSCsIab_PAeBQ";
const swedishDay=date=>new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Stockholm",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(date));
let matchDateOverrides={};
try{const saved=JSON.parse(localStorage.getItem('swn-graphics-match-dates')||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))matchDateOverrides=saved;}catch{}
const matchOverrideKey=g=>S.league+":"+g.id;
let matchSideOverrides={};
try{const saved=JSON.parse(localStorage.getItem('swn-graphics-match-sides')||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))matchSideOverrides=saved;}catch{}
function displayedMatch(g){return matchSideOverrides[matchOverrideKey(g)]===true?{...g,home:g.away,away:g.home,homeScore:g.awayScore,awayScore:g.homeScore}:g;}
function toggleMatchSides(){
 const g=schedule.find(g=>String(g.id)===$("#matchEditSelect").value);if(!g)return;
 const next={...matchSideOverrides},key=matchOverrideKey(g);if(next[key]===true)delete next[key];else next[key]=true;
 try{localStorage.setItem('swn-graphics-match-sides',JSON.stringify(next));}catch{$("#matchEditStatus").textContent='Ändringen kunde inte sparas i webbläsaren.';return;}
 matchSideOverrides=next;render();$("#matchEditStatus").textContent=next[key]?'Hemma och borta är bytta i grafiken. Lag och mål följer med.':'Originalets hemma- och bortalag är återställda.';
}
function effectiveMatchDay(g){const day=matchDateOverrides[matchOverrideKey(g)];return typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)?day:swedishDay(g.date)}
function syncMatchEditor(){
 const select=$("#matchEditSelect"),selected=select.value;
 select.innerHTML=schedule.map(original=>{const g=displayedMatch(original);return '<option value="'+esc(g.id)+'">'+esc(effectiveMatchDay(g)+' · '+g.home+' '+g.homeScore+' – '+g.awayScore+' '+g.away+' · '+new Date(g.date).toLocaleTimeString('sv-SE',{timeZone:'Europe/Stockholm',hour:'2-digit',minute:'2-digit'}))+'</option>';}).join('');
 if(schedule.some(g=>String(g.id)===selected))select.value=selected;
 const g=schedule.find(g=>String(g.id)===select.value);
 $("#matchEditDate").value=g?effectiveMatchDay(g):"";
 $("#matchEditSwap").textContent=g&&matchSideOverrides[matchOverrideKey(g)]===true?'Återställ hemma / borta':'Byt hemma / borta';
 ["matchEditSelect","matchEditDate","matchEditSave","matchEditReset","matchEditSwap"].forEach(id=>$("#"+id).disabled=scheduleLoading||!!scheduleError||!g);
}
function saveMatchDate(reset=false){
 const g=schedule.find(g=>String(g.id)===$("#matchEditSelect").value),day=$("#matchEditDate").value;if(!g||(!reset&&!day))return;
 const next={...matchDateOverrides};if(reset)delete next[matchOverrideKey(g)];else next[matchOverrideKey(g)]=day;
 try{localStorage.setItem('swn-graphics-match-dates',JSON.stringify(next));}catch{$("#matchEditStatus").textContent='Datumet kunde inte sparas i webbläsaren.';return;}
 matchDateOverrides=next;$("#matchDate").value=effectiveMatchDay(g);$("#matchPage").value="0";render();
 $("#matchEditStatus").textContent=reset?'Matchens rapporteringsdatum är återställt.':'Matchdatum sparat i den här webbläsaren.';
}
function syncManualEditor(){
 const teams=S.teams.filter(t=>t.statistics_stage==='regular');
 for(const id of ['manualHome','manualAway']){const el=$("#"+id),selected=el.value;el.innerHTML='<option value="">Välj lag</option>'+teams.map(t=>'<option value="'+esc(t.sports_gamer_team_id)+'">'+esc(t.team_name_in_league)+'</option>').join('');el.value=selected;}
 if(!$("#manualDate").value)$("#manualDate").value=$("#matchDate").value;
 $("#manualSave").disabled=dataLoading||scheduleLoading||!!scheduleError||!teams.length;
 $("#manualMatchList").innerHTML=manualMatches.filter(g=>Number(g.league)===S.league).map(g=>'<p>'+esc(g.day+' · '+g.home+' '+g.homeScore+'–'+g.awayScore+' '+g.away)+(g.overtime?' · OT':'')+' <button type="button" data-remove-manual="'+esc(g.id)+'">Ta bort</button></p>').join('');
}
function saveManualMatch(){
 const teams=S.teams.filter(t=>t.statistics_stage==='regular'),home=teams.find(t=>String(t.sports_gamer_team_id)===$("#manualHome").value),away=teams.find(t=>String(t.sports_gamer_team_id)===$("#manualAway").value);
 const day=$("#manualDate").value,hs=$("#manualHomeScore").value,as=$("#manualAwayScore").value,homeScore=Number(hs),awayScore=Number(as),status=$("#manualMatchStatus");
 if(dataLoading||scheduleLoading||scheduleError){status.textContent='Uppdatera matcherna innan du lägger till resultat.';return;}
 if(!home||!away||home===away||Number(home.effective_group_id)!==Number(away.effective_group_id)||!/^\d{4}-\d{2}-\d{2}$/.test(day)||hs===''||as===''||![homeScore,awayScore].every(x=>Number.isInteger(x)&&x>=0&&x<=99)||homeScore===awayScore){status.textContent='Välj två olika lag i samma grupp, datum och ett giltigt slutresultat utan lika mål.';return;}
 const match={id:'manual-'+crypto.randomUUID(),league:S.league,day,date:day+'T12:00:00+02:00',homeId:String(home.sports_gamer_team_id),awayId:String(away.sports_gamer_team_id),home:home.team_name_in_league,away:away.team_name_in_league,homeScore,awayScore,overtime:$("#manualOvertime").value==='ot',knownIds:schedule.map(g=>String(g.id))};
 if(manualMatches.some(g=>Number(g.league)===S.league&&g.day===day&&ManualResults.signature(g)===ManualResults.signature(match))||schedule.some(g=>effectiveMatchDay(g)===day&&ManualResults.signature(g)===ManualResults.signature(match))){status.textContent='Samma resultat finns redan på detta datum. Lägg inte till det igen.';return;}
 if(!storeManualMatches([...manualMatches,match])){status.textContent='Resultatet kunde inte sparas i webbläsaren.';return;}
 $("#matchDate").value=day;$("#matchPage").value='0';render();status.textContent='Tillfälligt resultat sparat. Räknas med i tabellen: 3 poäng för seger, eller 2–1 efter OT/straffar.';
}
async function loadSchedule(redraw=true){
 const request=++scheduleRequest,league=S.league;schedule=[];scheduleError="";scheduleLoading=true;if(redraw||S.kind==="matches")render();
 try{
  const r=await fetch(SUPA+"/functions/v1/graphics-schedule?league="+league,{headers:{apikey:KEY,Authorization:"Bearer "+scheduleToken},cache:"no-store",signal:AbortSignal.timeout(25000)});
  const data=await r.json();if(!r.ok)throw Error(data.error||"HTTP "+r.status);
  if(request!==scheduleRequest)return;schedule=data.matches;

 }catch(e){if(request!==scheduleRequest)return;scheduleError="Rapporterade matcher kunde inte hämtas. Försök uppdatera.";}
 finally{if(request===scheduleRequest){scheduleLoading=false;if(redraw)render();}}
}
function matchDayLabel(){return new Date(($("#matchDate").value||swedishDay(new Date()))+"T12:00:00").toLocaleDateString(L.locale,{day:"numeric",month:"long",year:"numeric"})}
function matchPages(games){
  const pairKey=g=>JSON.stringify([g[1].trim().toLocaleLowerCase('sv'),g[2].trim().toLocaleLowerCase('sv')].sort((a,b)=>a.localeCompare(b,'sv')));
  const groups=new Map();
  games.forEach(g=>{const key=pairKey(g);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(g)});
  const blocks=[...groups.entries()].sort(([a],[b])=>a.localeCompare(b,'sv')).flatMap(([,rows])=>{
    rows.sort((a,b)=>a[0].localeCompare(b[0]));
    // A matchup only needs splitting when it exceeds an entire image.
    return Array.from({length:Math.ceil(rows.length/8)},(_,i)=>rows.slice(i*8,i*8+8));
  });
  const best=Array(blocks.length+1);best[blocks.length]={pages:[],cost:0};
  for(let i=blocks.length-1;i>=0;i--){
    let page=[];
    for(let j=i;j<blocks.length&&page.length+blocks[j].length<=8;j++){
      page=page.concat(blocks[j]);const tail=best[j+1],candidate={pages:[page,...tail.pages],cost:page.length**2+tail.cost};
      const previous=best[i];
      if(!previous||candidate.pages.length<previous.pages.length||(candidate.pages.length===previous.pages.length&&(candidate.cost<previous.cost||(candidate.cost===previous.cost&&page.length>previous.pages[0].length))))best[i]=candidate;
    }
  }
  return best[0]?.pages||[];
}
function matchesSvg(){
  const {w:W,h:H}=format(),m=Math.round(W*.052),top=300;
  if(scheduleLoading||scheduleError)return base(svgText(W/2,H/2,scheduleError||'Hämtar rapporterade matcher…',26,'#a2b6c9',700,'text-anchor="middle"'));
  let games=[...schedule,...manualMatches.filter(g=>Number(g.league)===S.league)].filter(g=>effectiveMatchDay(g)===$("#matchDate").value).map(displayedMatch).map(g=>[new Date(g.date).toLocaleTimeString('sv-SE',{timeZone:'Europe/Stockholm',hour:'2-digit',minute:'2-digit'}),g.home,g.away,g.homeScore,g.awayScore]);
  if(!games.length)return base(svgText(W/2,H/2,'Inga rapporterade matcher på valt datum',28,'#a2b6c9',700,'text-anchor="middle"'));
  const pages=matchPages(games),pageCount=pages.length,pageSelect=$("#matchPage"),page=Math.min(Number(pageSelect.value)||0,pageCount-1);
  pageSelect.innerHTML=Array.from({length:pageCount},(_,i)=>'<option value="'+i+'"'+(i===page?' selected':'')+'>Sida '+(i+1)+' av '+pageCount+'</option>').join('');
  games=pages[page];
  const capacity=Math.max(1,Math.floor((H-top-90)/52));
  if(games.length>capacity)return base(svgText(W/2,H/2,'För många matcher – välj ett högre format eller dela listan',24,'#ffcf4a',700,'text-anchor="middle"'));
  const rowH=Math.min(180,(H-top-90)/games.length),blockTop=top+Math.max(0,(H-top-90-rowH*games.length)/2),lm=logos();
  return base(games.map((g,i)=>{
    const y=blockTop+i*rowH,cy=y+rowH/2,center=W/2,logoSize=56,innerGap=82;
    const team=(name,home)=>{
      const t=S.teams.find(t=>String(t.team_name_in_league).toLocaleLowerCase('sv')===name.toLocaleLowerCase('sv')),logo=t&&lm.get(String(t.sports_gamer_team_id));
      const showLogo=S.logos&&logo,textGap=showLogo?innerGap+logoSize+16:innerGap;
      const tx=home?center-textGap:center+textGap,available=center-textGap-m-24;
      const label=clip(name,W>1200?34:24),size=Math.min(W>1200?36:30,available/Math.max(1,label.length)*1.65);
      const lx=home?center-innerGap-logoSize:center+innerGap;
      return (showLogo?'<image href="'+esc(logo)+'" x="'+lx+'" y="'+(cy-logoSize/2)+'" width="'+logoSize+'" height="'+logoSize+'"/>':'')+svgText(tx,cy+size*.34,label,size,'#f4f7fa',800,home?'text-anchor="end"':'');
    };
    return '<rect x="'+m+'" y="'+(y+6)+'" width="'+(W-m*2)+'" height="'+(rowH-12)+'" rx="12" fill="#071d2c" fill-opacity=".9"/>'+team(g[1],true)+svgText(center,cy+14,g[3]+'–'+g[4],40,'#ffcf4a',900,'text-anchor="middle"')+team(g[2],false);
  }).join(''));
}
function title(){return ($("#title").value||(S.kind==="player"?singlePlayer()?.display_gamertag||TIT.player:S.kind==="roster"?rosterTeamName():TIT[S.kind])).trim().toUpperCase()}
function subtitle(){if(S.kind==="player")return ($("#subtitle").value||L.t(TIT.player)+" � "+comp().label).toUpperCase();if(S.kind==="roster")return ($("#subtitle").value||L.t("LAGPRESENTATION")+" · "+comp().label).toUpperCase();if(S.kind==="matches")return ($("#subtitle").value||matchDayLabel()+" · "+comp().label).toUpperCase();return ($("#subtitle").value||(S.kind==="table"?stageName()+(groupIds().length>1?" · "+groupName(S.group):""):S.kind==="groups"?"GRUPPSPEL · GRUPPSTABELLER":stageName()+" · "+comp().label)).trim().toUpperCase()}
function defs(){return '<defs><linearGradient id="silver" x2="0" y2="1"><stop stop-color="#fff"/><stop offset=".48" stop-color="#edf1f4"/><stop offset=".8" stop-color="#a2adb6"/><stop offset="1" stop-color="#fff"/></linearGradient><linearGradient id="gold"><stop stop-color="#ffd95f"/><stop offset=".5" stop-color="#ffbd00"/><stop offset="1" stop-color="#d88700"/></linearGradient><linearGradient id="panel" x2="1" y2="1"><stop stop-color="#071d2c" stop-opacity=".97"/><stop offset="1" stop-color="#020b12" stop-opacity=".98"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#000" flood-opacity=".58"/></filter></defs>'}
function background(W,H){
  const glow=(id,color,x,y)=>'<radialGradient id="'+id+'"><stop stop-color="'+color+'" stop-opacity=".48"/><stop offset="1" stop-color="'+color+'" stop-opacity="0"/></radialGradient>';
  const lights='<defs>'+glow('arenaBlue','#24aaff')+glow('arenaGold','#ffce43')+'</defs><ellipse cx="'+W*.12+'" cy="'+H*.12+'" rx="'+W*.65+'" ry="'+H*.45+'" fill="url(#arenaBlue)"/><ellipse cx="'+W*.92+'" cy="'+H*.75+'" rx="'+W*.55+'" ry="'+H*.55+'" fill="url(#arenaGold)"/>';
  if(S.bg==="wv"){
    const u=new URL("assets/wv-4-nations-background.svg",location.href).href;
    return '<svg width="'+W+'" height="'+H+'" viewBox="0 220 1323 663" preserveAspectRatio="xMidYMid slice"><image href="'+esc(u)+'" width="1323" height="883"/></svg><rect width="'+W+'" height="'+H+'" fill="#020b12" fill-opacity=".55"/>';
  }
  if(S.bg==="gamenight"){
    const u=new URL("../broadcast-studio/assets/game-night-background-photo.webp",location.href).href;
    return '<rect width="'+W+'" height="'+H+'" fill="#06111d"/><image href="'+esc(u)+'" width="'+W+'" height="'+H+'" preserveAspectRatio="xMidYMid slice"/><rect width="'+W+'" height="'+H+'" fill="#020b12" fill-opacity=".55"/>'+lights+'<path d="M'+W*.06+' 0 L'+W*.38+' '+H+' L'+W*.56+' '+H+' Z" fill="#b4e7ff" opacity=".05"/>';
  }
  if(S.bg==="neon")return '<rect width="'+W+'" height="'+H+'" fill="#061322"/>'+lights+'<path d="M0 '+H*.34+' L'+W+' '+H*.04+' M0 '+H*.96+' L'+W+' '+H*.66+'" stroke="#37c9ff" stroke-width="3" opacity=".45"/><path d="M'+W*.68+' 0 L'+W*.1+' '+H+'" stroke="#ffda55" stroke-width="5" opacity=".38"/>';
  if(S.bg==="champions")return '<rect width="'+W+'" height="'+H+'" fill="#100f10"/>'+lights+Array.from({length:42},(_,i)=>'<circle cx="'+((i*137+53)%W)+'" cy="'+((i*211+91)%H)+'" r="'+(i%3+1)+'" fill="#ffda55" opacity="'+(.15+i%4*.08)+'"/>').join('');
  if(S.bg==="ice")return '<rect width="'+W+'" height="'+H+'" fill="#0a2a3d"/><circle cx="'+W*.5+'" cy="'+H*.56+'" r="'+Math.min(W,H)*.34+'" fill="none" stroke="#a8e6ff" stroke-opacity=".09" stroke-width="8"/><path d="M0 '+H*.56+' H'+W+'" stroke="#d7f4ff" stroke-opacity=".09" stroke-width="5"/>';
  if(S.bg==="smoke")return '<rect width="'+W+'" height="'+H+'" fill="#06111a"/><ellipse cx="'+W*.25+'" cy="'+H*.68+'" rx="'+W*.38+'" ry="'+H*.24+'" fill="#a8b5bf" fill-opacity=".09"/><ellipse cx="'+W*.8+'" cy="'+H*.35+'" rx="'+W*.3+'" ry="'+H*.2+'" fill="#ffbd00" fill-opacity=".06"/>';
  return '<rect width="'+W+'" height="'+H+'" fill="#06283d"/><path d="M0 '+H*.82+' L'+W*.48+' 0 H'+W*.62+' L'+W*.16+' '+H+'" Z" fill="#0d4a70" fill-opacity=".32"/><path d="M'+W*.6+' 0 L'+W+' '+H*.42+' V'+H*.63+' L'+W*.48+' 0 Z" fill="#ffbd00" fill-opacity=".05"/>';
}
function studioBackground(W,H){
  return '<rect width="'+W+'" height="'+H+'" fill="#05121c"/>'+background(W,H)+'<rect width="'+W+'" height="'+H+'" fill="#05121c" opacity=".30"/>'+ '<path d="M'+W*.72+' 0 H'+W+' L'+W*.28+' '+H+' H'+W*.12+' Z" fill="#83bdde" opacity=".045"/>';
}
function legacyBase(content){
  const {w:W,h:H}=format(),m=Math.round(W*.052),hy=Math.round(H*.052),ty=Math.round(H*.19),wide=S.format==="wide";
  const c=comp(),ts=wide?78:S.format==="story"?74:68;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+defs()+background(W,H)+
  '<rect width="'+W+'" height="'+H*.3+'" fill="#03101a" fill-opacity=".38"/><line x1="'+m+'" y1="'+(hy+70)+'" x2="'+(W-m)+'" y2="'+(hy+70)+'" stroke="#ffbd00" stroke-opacity=".38" stroke-width="2"/><line x1="'+m+'" y1="'+hy+'" x2="'+m+'" y2="'+(hy+60)+'" stroke="#ffbd00" stroke-width="4"/>'+
  (c.logo?'<image href="'+esc(c.logo)+'" x="'+(m+16)+'" y="'+(hy-8)+'" width="76" height="76" preserveAspectRatio="xMidYMid meet" filter="url(#shadow)"/>':'')+
  '<text x="'+(m+108)+'" y="'+(hy+30)+'" fill="#fff" font-family="Arial" font-size="29" font-weight="950">'+esc(c.label)+'</text><text x="'+(m+108)+'" y="'+(hy+54)+'" fill="#9bb0bf" font-family="Arial" font-size="12" font-weight="700" letter-spacing="2">SVENSK eHOCKEY · SOCIAL GRAPHICS</text>'+

  '<text x="'+m+'" y="'+(ty-42)+'" fill="#ffbd00" font-family="Arial" font-size="14" font-weight="950" letter-spacing="4">'+esc(subtitle())+'</text><text x="'+m+'" y="'+(ty+20)+'" fill="url(#silver)" font-family="Arial Black,Arial" font-size="'+ts+'" font-weight="1000" letter-spacing="-2" filter="url(#shadow)">'+esc(title())+'</text>'+
  content+'<text x="'+m+'" y="'+(H-42)+'" fill="#fff" font-family="Arial" font-size="12" font-weight="950" letter-spacing="2">SVENSK eHOCKEY</text><text x="'+(m+165)+'" y="'+(H-42)+'" fill="#8aa0af" font-family="Arial" font-size="10" font-weight="800" letter-spacing="1.5">6V6</text><text x="'+(W-m)+'" y="'+(H-42)+'" text-anchor="end" fill="#718797" font-family="Arial" font-size="10" font-weight="800" letter-spacing="2">POWERED BY SWNWORKS</text></svg>';
}
function geom(len){const {w:W,h:H}=format(),m=Math.round(W*.052),top=S.format==="story"?380:S.format==="wide"?300:310,bottom=H-90,head=48;return {W,H,m,top,bottom,head,width:W-m*2,row:Math.max(48,Math.min(S.format==="story"?220:S.format==="portrait"?150:110,(bottom-top-head)/Math.max(1,len)))}}
function img(url,x,y,s){return S.logos&&url?'<image href="'+esc(url)+'" x="'+x+'" y="'+y+'" width="'+s+'" height="'+s+'" preserveAspectRatio="xMidYMid meet"/>':''}
function standingMark(i){
  if(S.league!==527)return null;
  if(i<3)return {color:"#ffbd00",opacity:i===0?1:.78};
  if(i<5)return {color:"#4ba5df",opacity:.78};
  return null;
}
function portraitUrl(p){
  const published=p&&p.player_image?String(p.player_image):"";
  if(published.startsWith("https://oujqnvrczdavqbqaavuh.supabase.co/storage/v1/object/public/player-profile-images/")||published.startsWith("https://www.svenskehockey.se/assets/player-portraits/")||published.startsWith("https://www.svenskehockey.se/web-images/player-portraits/"))return published;
  const id=Number(p&&p.sports_gamer_player_id), file=Number.isFinite(id)?id+".png":"";
  const approved=Array.isArray(window.SEH_PLAYER_IMAGE_FILES)&&window.SEH_PLAYER_IMAGE_FILES.includes(file);
  if(approved)return "https://www.svenskehockey.se/players/"+file;
  return p&&p.player_image?String(p.player_image):"";
}
function portraitImage(url,x,y,w,h){
 return url?normalizedPortrait(url,x,y,w,h,'portrait',true):'';
}
function leaderboardGeometry(len){
  const {w:W,h:H}=format(),m=Math.round(W*.052),top=S.format==="story"?380:S.format==="wide"?300:310,bottom=H-90,head=48;
  const topH=S.format==="story"?130:S.format==="portrait"?108:S.format==="wide"?86:82;
  const restH=S.format==="story"?90:S.format==="portrait"?72:S.format==="wide"?55:54;
  const rowHeights=Array.from({length:len},(_,i)=>i<3?topH:restH);
  const total=head+rowHeights.reduce((a,b)=>a+b,0);
  return {W,H,m,top,bottom,head,width:W-m*2,rowHeights,total};
}
function clamp01(v){return Math.max(0,Math.min(1,Number.isFinite(Number(v))?Number(v):0))}
function fmtDec(v,d=2){return Number.isFinite(Number(v))?Number(v).toLocaleString(L.locale,{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:false}):"–"}
function silhouetteSvg(x,y,w,h){
 return '<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="0 0 200 260" preserveAspectRatio="xMidYMin slice" overflow="hidden"><path d="M 100 18 C 78 18 66 33 66 54 L 66 67 C 61 67 61 80 68 85 C 72 99 78 108 87 113 L 87 130 C 80 139 58 141 40 150 C 18 162 8 183 4 217 L 0 260 H 200 L 196 217 C 192 183 182 162 160 150 C 142 141 120 139 113 130 L 113 113 C 122 108 128 99 132 85 C 139 80 139 67 134 67 L 134 54 C 134 33 122 18 100 18 Z" fill="#293e50" stroke="#486175" stroke-width="1.5"/><path d="M 72 148 Q 100 169 128 148 M 30 182 L 24 260 M 170 182 L 176 260" fill="none" stroke="#486175" stroke-width="2" opacity=".6"/></svg>';
}
function statBar(x,y,w,label,value,ratio,accent="#ffbd00"){
  const fillW=Math.max(10,Math.round(w*clamp01(ratio)));
  return '<text x="'+x+'" y="'+(y-9)+'" fill="#a9bac6" font-family="Arial" font-size="14" font-weight="900">'+esc(label)+'</text>'+
    '<text x="'+(x+w)+'" y="'+(y-9)+'" text-anchor="end" fill="#ffffff" font-family="Arial" font-size="14" font-weight="1000">'+esc(value)+'</text>'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="9" rx="4.5" fill="#173246"/>'+
    '<rect x="'+x+'" y="'+y+'" width="'+fillW+'" height="9" rx="4.5" fill="'+accent+'"/>';
}
function skaterCardConfig(kind,p,maxes){
  const ppg=p.gp?p.p/p.gp:0,gpg=p.gp?p.g/p.gp:0,apg=p.gp?p.a/p.gp:0;
  if(kind==="goals")return {
    primaryLabel:"G",primaryValue:p.g,
    meta:"P: "+p.p+" · GP: "+p.gp+" · A: "+p.a,
    bars:[
      {label:"G",value:String(p.g),ratio:maxes.g?p.g/maxes.g:0},
      {label:"G/GP",value:fmtDec(gpg),ratio:maxes.gpg?gpg/maxes.gpg:0},
      {label:"GP",value:String(p.gp),ratio:maxes.gp?p.gp/maxes.gp:0}
    ]
  };
  if(kind==="assists")return {
    primaryLabel:"A",primaryValue:p.a,
    meta:"P: "+p.p+" · GP: "+p.gp+" · G: "+p.g,
    bars:[
      {label:"A",value:String(p.a),ratio:maxes.a?p.a/maxes.a:0},
      {label:"A/GP",value:fmtDec(apg),ratio:maxes.apg?apg/maxes.apg:0},
      {label:"GP",value:String(p.gp),ratio:maxes.gp?p.gp/maxes.gp:0}
    ]
  };
  return {
    primaryLabel:"P",primaryValue:p.p,
    meta:"GP: "+p.gp+" · G: "+p.g+" · A: "+p.a,
    bars:[
      {label:"P",value:String(p.p),ratio:maxes.p?p.p/maxes.p:0},
      {label:"PPG",value:fmtDec(ppg),ratio:maxes.ppg?ppg/maxes.ppg:0},
      {label:"GP",value:String(p.gp),ratio:maxes.gp?p.gp/maxes.gp:0}
    ]
  };
}
function leaderboardCard(p,rank,kind,x,y,w,h,logo,maxes){
  const portrait=portraitUrl(p),cfg=skaterCardConfig(kind,p,maxes);
  const rankColor=rank===1?"#ffbd00":rank===2?"#d7dee7":"#b77d39";
  const big=w>=760&&h>=270, pad=big?18:14, accentW=big?8:6;
  const portraitW=big?205:Math.min(138,w*.27), portraitH=h-pad*2;
  const px=x+pad, py=y+pad, tx=px+portraitW+(big?28:18), right=x+w-pad;
  const logoSize=big?66:46, nameSize=big?34:23, teamSize=big?14:11;
  const mainSize=big?62:42, labelSize=big?14:11;
  const statTop=y+(big?112:92), primaryX=tx, colsStart=tx+(big?150:102), colGap=big?92:64;
  const barsY=y+h-(big?82:58), barW=Math.max(big?320:150,right-tx);

  const values=kind==="goals"
    ? [{l:"GP",v:p.gp},{l:"A",v:p.a},{l:"P",v:p.p}]
    : kind==="assists"
      ? [{l:"GP",v:p.gp},{l:"G",v:p.g},{l:"P",v:p.p}]
      : [{l:"GP",v:p.gp},{l:"G",v:p.g},{l:"A",v:p.a}];

  let o='<g filter="url(#shadow)">'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="18" fill="#081827" stroke="#35516a" stroke-width="1.4"/>'+
    '<rect x="'+x+'" y="'+y+'" width="'+accentW+'" height="'+h+'" rx="'+(accentW/2)+'" fill="'+rankColor+'"/>'+
    '<rect x="'+px+'" y="'+py+'" width="'+portraitW+'" height="'+portraitH+'" rx="14" fill="#0b1722" stroke="'+rankColor+'" stroke-width="2" stroke-opacity=".82"/>';
  if(portrait)o+=portraitImage(portrait,px+5,py+5,portraitW-10,portraitH-10);
  else o+=silhouetteSvg(px+6,py+6,portraitW-12,portraitH-12);

  if(logo)o+=img(logo,right-logoSize,y+18,logoSize);

  o+='<text x="'+tx+'" y="'+(y+(big?28:24))+'" fill="'+rankColor+'" font-family="Arial" font-size="'+(big?15:12)+'" font-weight="1000">#'+rank+'</text>'+
    '<text x="'+tx+'" y="'+(y+(big?58:46))+'" fill="#fff" font-family="Arial" font-size="'+nameSize+'" font-weight="1000">'+esc(clip(p.display_gamertag,big?28:20))+'</text>'+
    '<text x="'+tx+'" y="'+(y+(big?83:64))+'" fill="#92a8b8" font-family="Arial" font-size="'+teamSize+'" font-weight="850">'+esc(clip(p.team_name_in_league||"",30))+'</text>'+
    '<text x="'+primaryX+'" y="'+statTop+'" fill="#9fb3c1" font-family="Arial" font-size="'+labelSize+'" font-weight="950">'+esc(cfg.primaryLabel)+'</text>'+
    '<text x="'+primaryX+'" y="'+(statTop+(big?52:38))+'" fill="#ffbd00" font-family="Arial Black,Arial" font-size="'+mainSize+'" font-weight="1000">'+esc(cfg.primaryValue)+'</text>';

  values.forEach((s,i)=>{
    const sx=colsStart+i*colGap;
    o+='<text x="'+sx+'" y="'+statTop+'" fill="#9fb3c1" font-family="Arial" font-size="'+labelSize+'" font-weight="950">'+s.l+'</text>'+
      '<text x="'+sx+'" y="'+(statTop+(big?48:36))+'" fill="#f5f7f9" font-family="Arial Black,Arial" font-size="'+(big?32:24)+'" font-weight="1000">'+s.v+'</text>';
  });

  cfg.bars.forEach((b,i)=>{o+=statBar(tx,barsY+i*(big?27:24),barW,b.label,b.value,b.ratio)});
  return o+'</g>';
}
function leaderboardWideCard(p,rank,kind,x,y,w,h,logo,maxes){
  const portrait=portraitUrl(p),cfg=skaterCardConfig(kind,p,maxes);
  const rankColor=rank===1?"#ffbd00":rank===2?"#d7dee7":"#b77d39";
  const px=x+24, py=y+15, portraitW=122, portraitH=h-30, tx=px+portraitW+24, right=x+w-24;
  const logoSize=54, barsX=tx+350, barsW=Math.max(360,right-logoSize-30-barsX), barsY=y+116;
  const values=kind==="goals"
    ? [{l:"GP",v:p.gp},{l:"A",v:p.a},{l:"P",v:p.p}]
    : kind==="assists"
      ? [{l:"GP",v:p.gp},{l:"G",v:p.g},{l:"P",v:p.p}]
      : [{l:"GP",v:p.gp},{l:"G",v:p.g},{l:"A",v:p.a}];

  let o='<g filter="url(#shadow)">'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="18" fill="#081827" stroke="#35516a" stroke-width="1.4"/>'+
    '<rect x="'+x+'" y="'+y+'" width="8" height="'+h+'" rx="4" fill="'+rankColor+'"/>'+
    '<rect x="'+px+'" y="'+py+'" width="'+portraitW+'" height="'+portraitH+'" rx="13" fill="#0b1722" stroke="'+rankColor+'" stroke-width="2" stroke-opacity=".82"/>';
  if(portrait)o+=portraitImage(portrait,px+5,py+5,portraitW-10,portraitH-10);
  else o+=silhouetteSvg(px+6,py+6,portraitW-12,portraitH-12);
  if(logo)o+=img(logo,right-logoSize,y+18,logoSize);

  o+='<text x="'+tx+'" y="'+(y+28)+'" fill="'+rankColor+'" font-family="Arial" font-size="14" font-weight="1000">#'+rank+'</text>'+
    '<text x="'+tx+'" y="'+(y+58)+'" fill="#fff" font-family="Arial" font-size="30" font-weight="1000">'+esc(clip(p.display_gamertag,26))+'</text>'+
    '<text x="'+tx+'" y="'+(y+79)+'" fill="#92a8b8" font-family="Arial" font-size="12" font-weight="850">'+esc(clip(p.team_name_in_league||"",30))+'</text>'+
    '<text x="'+tx+'" y="'+(y+108)+'" fill="#9fb3c1" font-family="Arial" font-size="13" font-weight="950">'+esc(cfg.primaryLabel)+'</text>'+
    '<text x="'+tx+'" y="'+(y+152)+'" fill="#ffbd00" font-family="Arial Black,Arial" font-size="52" font-weight="1000">'+esc(cfg.primaryValue)+'</text>';

  const colsStart=tx+122, colGap=88;
  values.forEach((s,i)=>{
    const sx=colsStart+i*colGap;
    o+='<text x="'+sx+'" y="'+(y+108)+'" fill="#9fb3c1" font-family="Arial" font-size="13" font-weight="950">'+s.l+'</text>'+
      '<text x="'+sx+'" y="'+(y+146)+'" fill="#f5f7f9" font-family="Arial Black,Arial" font-size="28" font-weight="1000">'+s.v+'</text>';
  });

  cfg.bars.forEach((b,i)=>{o+=statBar(barsX,barsY+i*23,barsW,b.label,b.value,b.ratio)});
  return o+'</g>';
}

function goalieWideCard(p,rank,x,y,w,h,logo,maxes){
  const portrait=portraitUrl(p),cfg=goalieCardConfig(p,maxes);
  const rankColor=rank===1?"#ffbd00":rank===2?"#d7dee7":"#b77d39";
  const px=x+24, py=y+15, portraitW=122, portraitH=h-30, tx=px+portraitW+24, right=x+w-24;
  const logoSize=54, barsX=tx+360, barsW=Math.max(360,right-logoSize-30-barsX), barsY=y+116;
  const sv=(p.sv*(p.sv<=1?100:1)), gaa=p.gaa==null?"–":fmtDec(p.gaa);
  const values=[{l:"GP",v:p.gp},{l:"GAA",v:gaa},{l:"SO",v:p.so}];

  let o='<g filter="url(#shadow)">'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="18" fill="#081827" stroke="#35516a" stroke-width="1.4"/>'+
    '<rect x="'+x+'" y="'+y+'" width="8" height="'+h+'" rx="4" fill="'+rankColor+'"/>'+
    '<rect x="'+px+'" y="'+py+'" width="'+portraitW+'" height="'+portraitH+'" rx="13" fill="#0b1722" stroke="'+rankColor+'" stroke-width="2" stroke-opacity=".82"/>';
  if(portrait)o+=portraitImage(portrait,px+5,py+5,portraitW-10,portraitH-10);
  else o+=silhouetteSvg(px+6,py+6,portraitW-12,portraitH-12);
  if(logo)o+=img(logo,right-logoSize,y+18,logoSize);

  o+='<text x="'+tx+'" y="'+(y+28)+'" fill="'+rankColor+'" font-family="Arial" font-size="14" font-weight="1000">#'+rank+'</text>'+
    '<text x="'+tx+'" y="'+(y+58)+'" fill="#fff" font-family="Arial" font-size="30" font-weight="1000">'+esc(clip(p.display_gamertag,26))+'</text>'+
    '<text x="'+tx+'" y="'+(y+79)+'" fill="#92a8b8" font-family="Arial" font-size="12" font-weight="850">'+esc(clip(p.team_name_in_league||"",30))+'</text>'+
    '<text x="'+tx+'" y="'+(y+108)+'" fill="#9fb3c1" font-family="Arial" font-size="13" font-weight="950">SV%</text>'+
    '<text x="'+tx+'" y="'+(y+152)+'" fill="#ffbd00" font-family="Arial Black,Arial" font-size="48" font-weight="1000">'+fmtDec(sv,1)+'</text>';

  const colsStart=tx+142, colGap=105;
  values.forEach((s,i)=>{
    const sx=colsStart+i*colGap;
    o+='<text x="'+sx+'" y="'+(y+108)+'" fill="#9fb3c1" font-family="Arial" font-size="13" font-weight="950">'+s.l+'</text>'+
      '<text x="'+sx+'" y="'+(y+146)+'" fill="#f5f7f9" font-family="Arial Black,Arial" font-size="26" font-weight="1000">'+s.v+'</text>';
  });

  cfg.bars.forEach((b,i)=>{o+=statBar(barsX,barsY+i*23,barsW,b.label,b.value,b.ratio)});
  return o+'</g>';
}

function compactLeaderboard(rows,kind,x,y,w,rowH,offset=4){
  if(!rows.length)return "";
  const main=kind==="goals"?"G":kind==="assists"?"A":"P";
  let o='<g filter="url(#shadow)"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+(42+rowH*rows.length)+'" fill="url(#panel)" stroke="#ffbd00" stroke-opacity=".28"/>'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="42" fill="url(#gold)"/>'+
    '<text x="'+(x+20)+'" y="'+(y+27)+'" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">#</text>'+
    '<text x="'+(x+58)+'" y="'+(y+27)+'" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">SPELARE</text>'+
    '<text x="'+(x+w*.73)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">GP</text>'+
    '<text x="'+(x+w*.82)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">G</text>'+
    '<text x="'+(x+w*.90)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">A</text>'+
    '<text x="'+(x+w*.97)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">P</text>';
  rows.forEach((p,i)=>{const yy=y+42+i*rowH,cy=yy+rowH/2;
    o+='<rect x="'+x+'" y="'+yy+'" width="'+w+'" height="'+rowH+'" fill="'+(i%2?"#061722":"#04121c")+'"/>'+
      '<text x="'+(x+20)+'" y="'+(cy+6)+'" fill="#eaf0f4" font-family="Arial" font-size="16" font-weight="900">'+(i+offset)+'</text>'+
      '<text x="'+(x+58)+'" y="'+(cy-2)+'" fill="#fff" font-family="Arial" font-size="16" font-weight="900">'+esc(clip(p.display_gamertag,24))+'</text>'+
      '<text x="'+(x+58)+'" y="'+(cy+15)+'" fill="#7892a5" font-family="Arial" font-size="9" font-weight="700">'+esc(clip(p.team_name_in_league||"",28))+'</text>';
    [[p.gp,.73,"GP"],[p.g,.82,"G"],[p.a,.90,"A"],[p.p,.97,"P"]].forEach(([v,pos,l])=>o+='<text x="'+(x+w*pos)+'" y="'+(cy+6)+'" text-anchor="middle" fill="'+(l===main?"#ffbd00":"#e4ebef")+'" font-family="Arial" font-size="'+(l===main?18:15)+'" font-weight="'+(l===main?950:750)+'">'+v+'</text>');
  });
  return o+'</g>';
}
function goalieCardConfig(p,maxes){
  const svPct=(p.sv*(p.sv<=1?100:1)), gaa=p.gaa==null?null:Number(p.gaa);
  return {
    primaryLabel:"SV%",primaryValue:fmtDec(svPct,1),
    meta:"GP: "+p.gp+" · GAA: "+(gaa==null?"–":fmtDec(gaa))+" · SO: "+p.so,
    bars:[
      {label:"SV%",value:fmtDec(svPct,1),ratio:maxes.sv?svPct/maxes.sv:0},
      {label:"GAA",value:gaa==null?"–":fmtDec(gaa),ratio:gaa==null?0:(maxes.maxGaa?1-(gaa/maxes.maxGaa)*.8:0)},
      {label:"GP",value:String(p.gp),ratio:maxes.gp?p.gp/maxes.gp:0}
    ]
  };
}
function goalieCard(p,rank,x,y,w,h,logo,maxes){
  const portrait=portraitUrl(p),cfg=goalieCardConfig(p,maxes);
  const rankColor=rank===1?"#ffbd00":rank===2?"#d7dee7":"#b77d39";
  const big=w>=760&&h>=270, pad=big?18:14, accentW=big?8:6;
  const portraitW=big?205:Math.min(138,w*.27), portraitH=h-pad*2;
  const px=x+pad, py=y+pad, tx=px+portraitW+(big?28:18), right=x+w-pad;
  const logoSize=big?66:46, nameSize=big?34:23, teamSize=big?14:11;
  const mainSize=big?58:40, labelSize=big?14:11;
  const statTop=y+(big?112:92), primaryX=tx, colsStart=tx+(big?165:108), colGap=big?104:72;
  const barsY=y+h-(big?82:58), barW=Math.max(big?320:150,right-tx);
  const sv=(p.sv*(p.sv<=1?100:1)), gaa=p.gaa==null?"–":fmtDec(p.gaa);
  const values=[{l:"GP",v:p.gp},{l:"GAA",v:gaa},{l:"SO",v:p.so}];

  let o='<g filter="url(#shadow)">'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="18" fill="#081827" stroke="#35516a" stroke-width="1.4"/>'+
    '<rect x="'+x+'" y="'+y+'" width="'+accentW+'" height="'+h+'" rx="'+(accentW/2)+'" fill="'+rankColor+'"/>'+
    '<rect x="'+px+'" y="'+py+'" width="'+portraitW+'" height="'+portraitH+'" rx="14" fill="#0b1722" stroke="'+rankColor+'" stroke-width="2" stroke-opacity=".82"/>';
  if(portrait)o+=portraitImage(portrait,px+5,py+5,portraitW-10,portraitH-10);
  else o+=silhouetteSvg(px+6,py+6,portraitW-12,portraitH-12);

  if(logo)o+=img(logo,right-logoSize,y+18,logoSize);

  o+='<text x="'+tx+'" y="'+(y+(big?28:24))+'" fill="'+rankColor+'" font-family="Arial" font-size="'+(big?15:12)+'" font-weight="1000">#'+rank+'</text>'+
    '<text x="'+tx+'" y="'+(y+(big?58:46))+'" fill="#fff" font-family="Arial" font-size="'+nameSize+'" font-weight="1000">'+esc(clip(p.display_gamertag,big?28:20))+'</text>'+
    '<text x="'+tx+'" y="'+(y+(big?83:64))+'" fill="#92a8b8" font-family="Arial" font-size="'+teamSize+'" font-weight="850">'+esc(clip(p.team_name_in_league||"",30))+'</text>'+
    '<text x="'+primaryX+'" y="'+statTop+'" fill="#9fb3c1" font-family="Arial" font-size="'+labelSize+'" font-weight="950">SV%</text>'+
    '<text x="'+primaryX+'" y="'+(statTop+(big?52:38))+'" fill="#ffbd00" font-family="Arial Black,Arial" font-size="'+mainSize+'" font-weight="1000">'+fmtDec(sv,1)+'</text>';

  values.forEach((s,i)=>{
    const sx=colsStart+i*colGap;
    o+='<text x="'+sx+'" y="'+statTop+'" fill="#9fb3c1" font-family="Arial" font-size="'+labelSize+'" font-weight="950">'+s.l+'</text>'+
      '<text x="'+sx+'" y="'+(statTop+(big?48:36))+'" fill="#f5f7f9" font-family="Arial Black,Arial" font-size="'+(big?30:22)+'" font-weight="1000">'+s.v+'</text>';
  });

  cfg.bars.forEach((b,i)=>{o+=statBar(tx,barsY+i*(big?27:24),barW,b.label,b.value,b.ratio)});
  return o+'</g>';
}
function compactGoalies(rows,x,y,w,rowH,offset=4){
  if(!rows.length)return "";
  let o='<g filter="url(#shadow)"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+(42+rowH*rows.length)+'" fill="url(#panel)" stroke="#ffbd00" stroke-opacity=".28"/>'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="42" fill="url(#gold)"/>'+
    '<text x="'+(x+20)+'" y="'+(y+27)+'" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">#</text>'+
    '<text x="'+(x+58)+'" y="'+(y+27)+'" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">MÅLVAKT</text>'+
    '<text x="'+(x+w*.73)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">GP</text>'+
    '<text x="'+(x+w*.83)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">SV%</text>'+
    '<text x="'+(x+w*.92)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">GAA</text>'+
    '<text x="'+(x+w*.98)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">SO</text>';
  rows.forEach((p,i)=>{const yy=y+42+i*rowH,cy=yy+rowH/2,sv=(p.sv*(p.sv<=1?100:1));
    o+='<rect x="'+x+'" y="'+yy+'" width="'+w+'" height="'+rowH+'" fill="'+(i%2?"#061722":"#04121c")+'"/>'+
      '<text x="'+(x+20)+'" y="'+(cy+6)+'" fill="#eaf0f4" font-family="Arial" font-size="16" font-weight="900">'+(i+offset)+'</text>'+
      '<text x="'+(x+58)+'" y="'+(cy-2)+'" fill="#fff" font-family="Arial" font-size="16" font-weight="900">'+esc(clip(p.display_gamertag,24))+'</text>'+
      '<text x="'+(x+58)+'" y="'+(cy+15)+'" fill="#7892a5" font-family="Arial" font-size="9" font-weight="700">'+esc(clip(p.team_name_in_league||"",28))+'</text>'+
      '<text x="'+(x+w*.73)+'" y="'+(cy+6)+'" text-anchor="middle" fill="#e4ebef" font-family="Arial" font-size="15" font-weight="750">'+p.gp+'</text>'+
      '<text x="'+(x+w*.83)+'" y="'+(cy+6)+'" text-anchor="middle" fill="#ffbd00" font-family="Arial" font-size="18" font-weight="950">'+fmtDec(sv,1)+'</text>'+
      '<text x="'+(x+w*.92)+'" y="'+(cy+6)+'" text-anchor="middle" fill="#e4ebef" font-family="Arial" font-size="15" font-weight="750">'+(p.gaa==null?"–":fmtDec(p.gaa))+'</text>'+
      '<text x="'+(x+w*.98)+'" y="'+(cy+6)+'" text-anchor="middle" fill="#e4ebef" font-family="Arial" font-size="15" font-weight="750">'+p.so+'</text>';
  });
  return o+'</g>';
}
function tableSvg(){
  const r=standings(),g=geom(r.length||1),ls=logos(),size=Math.min(64,g.row-18);let o='<g filter="url(#shadow)"><rect x="'+g.m+'" y="'+g.top+'" width="'+g.width+'" height="'+(g.head+g.row*r.length)+'" fill="url(#panel)" stroke="#ffbd00" stroke-opacity=".35"/><rect x="'+g.m+'" y="'+g.top+'" width="'+g.width+'" height="'+g.head+'" fill="url(#gold)"/>';
  const wide=S.format==="wide",positions=wide?[.50,.555,.61,.665,.72,.775,.83,.885,.955]:[.59,.65,.71,.77,.83,.89,.955];
  const labels=wide?[["#",.03],["LAG",.09],["GP",.50],["W",.555],["L",.61],["OTW",.665],["OTL",.72],["GF",.775],["GA",.83],["GD",.885],["PTS",.955]]:[["#",.03],["LAG",.09],["GP",.59],["W",.65],["L",.71],["OTW",.77],["OTL",.83],["GD",.89],["PTS",.955]];
  labels.forEach(([t,p])=>o+='<text x="'+(g.m+g.width*p)+'" y="'+(g.top+31)+'" text-anchor="'+(t==="LAG"?"start":"middle")+'" fill="#07121c" font-family="Arial" font-size="12" font-weight="950">'+t+'</text>');
  r.forEach((x,i)=>{const y=g.top+g.head+i*g.row,cy=y+g.row/2,logo=x.team_logo_in_league||ls.get(String(x.sports_gamer_team_id))||"",tx=g.m+(S.logos?142:72),vals=[n(x.games_played),n(x.wins),n(x.losses),n(x.overtime_wins),n(x.overtime_losses),...(wide?[n(x.goals_for),n(x.goals_against)]:[]),(n(x.goal_difference)>0?"+":"")+n(x.goal_difference),n(x.table_points)],xs=positions,mark=standingMark(i);
    o+='<rect x="'+g.m+'" y="'+y+'" width="'+g.width+'" height="'+g.row+'" fill="'+(i%2?"#061722":"#04121c")+'" fill-opacity=".95"/>'+(mark?'<rect x="'+g.m+'" y="'+y+'" width="5" height="'+g.row+'" fill="'+mark.color+'" fill-opacity="'+mark.opacity+'"/>':'')+'<text x="'+(g.m+28)+'" y="'+(cy+7)+'" fill="'+(i===0?"#ffbd00":"#eef3f6")+'" font-family="Arial" font-size="'+(g.row>=110?(i===0?29:25):(i===0?24:20))+'" font-weight="950">'+(i+1)+'</text>'+img(logo,g.m+65,cy-size/2,size)+'<text x="'+tx+'" y="'+(cy+7)+'" fill="#fff" font-family="Arial" font-size="'+(g.row>=110?24:S.format==="wide"?22:20)+'" font-weight="900">'+esc(clip(x.team_name_in_league,S.format==="wide"?36:22))+'</text>';
    vals.forEach((v,k)=>o+='<text x="'+(g.m+g.width*xs[k])+'" y="'+(cy+7)+'" text-anchor="middle" fill="'+(k===vals.length-1?"#ffbd00":"#e4ebef")+'" font-family="Arial" font-size="'+(g.row>=110?(k===vals.length-1?28:24):(k===vals.length-1?23:19))+'" font-weight="'+(k===vals.length-1?950:750)+'">'+v+'</text>');
  });return base(o+"</g>");
}
function compactTablePanel(rows,x,y,w,h,label){
  const head=58,titleH=52,rowH=Math.max(42,Math.min(60,(h-titleH-head)/Math.max(1,rows.length))),ls=logos(),logoSize=Math.min(34,rowH-12);
  let o='<g filter="url(#shadow)"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="url(#panel)" stroke="#ffbd00" stroke-opacity=".35"/><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+titleH+'" fill="url(#gold)"/><text x="'+(x+w/2)+'" y="'+(y+34)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="18" font-weight="950" letter-spacing="2">'+esc(label)+'</text>';
  const hy=y+titleH;
  o+='<rect x="'+x+'" y="'+hy+'" width="'+w+'" height="'+head+'" fill="#081923" fill-opacity=".96"/>';
  const cols=[["#",.04],["LAG",.10],["GP",.59],["W",.65],["L",.71],["OTW",.77],["OTL",.83],["GD",.89],["PTS",.955]];
  cols.forEach(([t,p])=>o+='<text x="'+(x+w*p)+'" y="'+(hy+36)+'" text-anchor="'+(t==="LAG"?"start":"middle")+'" fill="#9cb0bd" font-family="Arial" font-size="11" font-weight="900">'+t+'</text>');
  rows.forEach((r,i)=>{const ry=hy+head+i*rowH,cy=ry+rowH/2,logo=r.team_logo_in_league||ls.get(String(r.sports_gamer_team_id))||"",tx=x+(S.logos?96:52),mark=standingMark(i);
    o+='<rect x="'+x+'" y="'+ry+'" width="'+w+'" height="'+rowH+'" fill="'+(i%2?"#061722":"#04121c")+'"/>'+(mark?'<rect x="'+x+'" y="'+ry+'" width="4" height="'+rowH+'" fill="'+mark.color+'" fill-opacity="'+mark.opacity+'"/>':'')+
    '<text x="'+(x+22)+'" y="'+(cy+6)+'" fill="'+(i===0?"#ffbd00":"#eaf0f4")+'" font-family="Arial" font-size="'+(i===0?20:17)+'" font-weight="950">'+(i+1)+'</text>'+
    img(logo,x+50,cy-logoSize/2,logoSize)+
    '<text x="'+tx+'" y="'+(cy+6)+'" fill="#fff" font-family="Arial" font-size="'+(w>700?18:15)+'" font-weight="900">'+esc(clip(r.team_name_in_league,Math.max(8,Math.floor((w*.55-(tx-x))/((w>700?18:15)*.65)))))+'</text>';
    const vals=[n(r.games_played),n(r.wins),n(r.losses),n(r.overtime_wins),n(r.overtime_losses),(n(r.goal_difference)>0?"+":"")+n(r.goal_difference),n(r.table_points)],xs=[.59,.65,.71,.77,.83,.89,.955];
    vals.forEach((v,k)=>o+='<text x="'+(x+w*xs[k])+'" y="'+(cy+6)+'" text-anchor="middle" fill="'+(k===6?"#ffbd00":"#e3eaee")+'" font-family="Arial" font-size="'+(k===6?19:15)+'" font-weight="'+(k===6?950:750)+'">'+v+'</text>');
  });
  return o+'</g>';
}
function groupsSvg(){
  const ids=groupIds().slice(0,2),{w:W,h:H}=format(),m=Math.round(W*.052),top=S.format==="story"?360:315,bottom=H-95,gap=S.format==="wide"?24:18;
  if(ids.length<2)return base('<text x="'+(W/2)+'" y="'+(H/2)+'" text-anchor="middle" fill="#fff" font-family="Arial" font-size="28" font-weight="900">TVÅ GRUPPER SAKNAS</text>');
  const a=standingsForGroup(ids[0]),b=standingsForGroup(ids[1]);let o="";
  if(S.format==="story"||S.format==="portrait"){
    const h=(bottom-top-gap)/2;
    o+=compactTablePanel(a,m,top,W-m*2,h,groupName(ids[0]));
    o+=compactTablePanel(b,m,top+h+gap,W-m*2,h,groupName(ids[1]));
  }else{
    const w=(W-m*2-gap)/2,h=bottom-top;
    o+=compactTablePanel(a,m,top,w,h,groupName(ids[0]));
    o+=compactTablePanel(b,m+w+gap,top,w,h,groupName(ids[1]));
  }
  return base(o);
}
function legacyBoard(kind){
  const metric=kind==="goals"?"g":kind==="assists"?"a":"p", rows=skaters(metric).slice(0,3), lm=logos();
  const {w:W,h:H}=format(), m=Math.round(W*.052), top=S.format==="story"?360:S.format==="wide"?315:300;
  const maxes={
    g:Math.max(1,...rows.map(p=>p.g)),a:Math.max(1,...rows.map(p=>p.a)),p:Math.max(1,...rows.map(p=>p.p)),gp:Math.max(1,...rows.map(p=>p.gp)),
    gpg:Math.max(.01,...rows.map(p=>p.gp?p.g/p.gp:0)),apg:Math.max(.01,...rows.map(p=>p.gp?p.a/p.gp:0)),ppg:Math.max(.01,...rows.map(p=>p.gp?p.p/p.gp:0))
  };
  let o="";
  if(S.format==="wide"){
    const gap=18, cardW=W-m*2, cardH=190;
    let y=top;
    rows.forEach((p,i)=>{o+=leaderboardWideCard(p,i+1,kind,m,y,cardW,cardH,lm.get(String(p.sports_gamer_team_id))||"",maxes);y+=cardH+gap});
  }else{
    const gap=S.format==="story"?26:18, cardW=W-m*2;
    const cardH=S.format==="story"?390:S.format==="square"?225:298;
    let y=top;
    rows.forEach((p,i)=>{o+=leaderboardCard(p,i+1,kind,m,y,cardW,cardH,lm.get(String(p.sports_gamer_team_id))||"",maxes);y+=cardH+gap});
  }
  return base(o);
}
function legacyGoalieSvg(){
  const rows=goalies().slice(0,3), lm=logos();
  const {w:W,h:H}=format(), m=Math.round(W*.052), top=S.format==="story"?360:S.format==="wide"?315:300;
  const svs=rows.map(p=>p.sv*(p.sv<=1?100:1)).filter(Number.isFinite), gaas=rows.map(p=>Number(p.gaa)).filter(Number.isFinite);
  const maxes={sv:Math.max(1,...svs),gp:Math.max(1,...rows.map(p=>p.gp)),maxGaa:Math.max(1,...gaas)};
  let o="";
  if(S.format==="wide"){
    const gap=18, cardW=W-m*2, cardH=190;
    let y=top;
    rows.forEach((p,i)=>{o+=goalieWideCard(p,i+1,m,y,cardW,cardH,lm.get(String(p.sports_gamer_team_id))||"",maxes);y+=cardH+gap});
  }else{
    const gap=S.format==="story"?26:18, cardW=W-m*2;
    const cardH=S.format==="story"?390:S.format==="square"?225:298;
    let y=top;
    rows.forEach((p,i)=>{o+=goalieCard(p,i+1,m,y,cardW,cardH,lm.get(String(p.sports_gamer_team_id))||"",maxes);y+=cardH+gap});
  }
  return base(o);
}
function mini(x,y,w,h,label,metric,data,lm){
  const hh=52,rh=(h-hh)/3;
  let o='<g filter="url(#shadow)"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="url(#panel)" stroke="#ffbd00" stroke-opacity=".35"/><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" fill="url(#gold)"/><text x="'+(x+18)+'" y="'+(y+34)+'" fill="#07121c" font-family="Arial" font-size="15" font-weight="950" letter-spacing="1.5">'+label+'</text>';
  data.slice(0,3).forEach((p,i)=>{
    const yy=y+hh+i*rh,cy=yy+rh/2,logo=lm.get(String(p.sports_gamer_team_id))||"",portrait=portraitUrl(p),pw=Math.min(42,rh-8),ph=Math.min(rh-4,pw*1.25),vx=x+43;
    o+='<rect x="'+x+'" y="'+yy+'" width="'+w+'" height="'+rh+'" fill="'+(i%2?"#061722":"#04121c")+'"/><text x="'+(x+16)+'" y="'+(cy+6)+'" fill="'+(i===0?"#ffbd00":"#e7edf1")+'" font-family="Arial" font-size="18" font-weight="950">'+(i+1)+'</text>';
    if(portrait)o+=portraitImage(portrait,vx,cy-ph/2,pw,ph);
    else o+=img(logo,vx,cy-19,38);
    o+='<text x="'+(x+((portrait||S.logos)?96:50))+'" y="'+(cy+5)+'" fill="#fff" font-family="Arial" font-size="15" font-weight="900">'+esc(clip(p.display_gamertag,17))+'</text><text x="'+(x+w-20)+'" y="'+(cy+8)+'" text-anchor="end" fill="#ffbd00" font-family="Arial" font-size="25" font-weight="950">'+p[metric]+'</text>';
  });
  return o+"</g>";
}
function leadersSvg(){
  const {w:W,h:H}=format(),m=Math.round(W*.052),top=S.format==="story"?380:315,bottom=H-95,lm=logos(),a=skaters("g"),b=skaters("a"),c=skaters("p");let o="";
  if(S.format==="wide"){const gap=22,w=(W-m*2-gap*2)/3,h=bottom-top;o+=mini(m,top,w,h,"MÅL","g",a,lm)+mini(m+w+gap,top,w,h,"ASSISTS","a",b,lm)+mini(m+(w+gap)*2,top,w,h,"POÄNG","p",c,lm)}
  else{const gap=18,h=(bottom-top-gap*2)/3;o+=mini(m,top,W-m*2,h,"MÅL","g",a,lm)+mini(m,top+h+gap,W-m*2,h,"ASSISTS","a",b,lm)+mini(m,top+(h+gap)*2,W-m*2,h,"POÄNG","p",c,lm)}
  return base(o);
}
function svgText(x,y,value,size=24,color="#f4f7fa",weight=700,extra=""){
  return '<text x="'+x+'" y="'+y+'" fill="'+color+'" font-family="Arial, sans-serif" font-size="'+size+'" font-weight="'+weight+'" '+extra+'>'+esc(value)+'</text>';
}
function fittedHeadingSize(value,maxSize,availableWidth){
  const context=document.createElement('canvas').getContext('2d');
  context.font='900 '+maxSize+'px Arial, sans-serif';
  const measured=context.measureText(value).width;
  const spacing=-2*Math.max(0,Array.from(value).length-1);
  return measured+spacing<=availableWidth?maxSize:Math.floor(maxSize*(availableWidth-spacing)/measured*100)/100;
}
function base(content){
  const {w:W,h:H}=format(),m=Math.round(W*.052),c=comp(),wide=S.format==="wide";
  const rosterLogo=S.kind==='roster'&&S.logos?logos().get(rosterTeamId):'',rosterLogoSize=130,headingWidth=W-m*2-(rosterLogo?rosterLogoSize+30:0);
  const headingSize=fittedHeadingSize(title(),wide?82:70,headingWidth);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+defs()+
    studioBackground(W,H)+
    '<rect x="'+m+'" y="48" width="6" height="56" rx="3" fill="#ffbd00"/>'+
    (c.logo?'<image href="'+esc(c.logo)+'" x="'+(m+20)+'" y="40" width="72" height="72" preserveAspectRatio="xMidYMid meet"/>':'')+
    svgText(m+136,72,c.label,27,"#f4f7fa",800)+svgText(m+136,97,"SVENSK eHOCKEY",12,"#a2b6c9",700,'letter-spacing="2.4"')+
    '<line x1="'+m+'" y1="132" x2="'+(W-m)+'" y2="132" stroke="#7b9ab6" opacity=".24"/>'+
    (S.kind==='player'?'':svgText(m,178,subtitle()+(['table','groups'].includes(S.kind)&&manualMatches.some(g=>Number(g.league)===S.league)?' · '+L.t('PRELIMINÄR'):'') ,15,"#ffcf4a",700,'letter-spacing="3"')+svgText(m,252,title(),headingSize,"#f4f7fa",900,'letter-spacing="-2"'))+
    (rosterLogo?img(rosterLogo,W-m-rosterLogoSize,190,rosterLogoSize):'')+content+'<line x1="'+m+'" y1="'+(H-65)+'" x2="'+(S.kind==='player'?W*.25:W-m)+'" y2="'+(H-65)+'" stroke="#7b9ab6" opacity=".24"/>'+
    svgText(m,H-33,"SVENSK eHOCKEY",13,"#a2b6c9",700,'letter-spacing="1.5"')+
    svgText(W-m,H-33,"SWNWORKS",13,"#a2b6c9",700,'text-anchor="end" letter-spacing="2"')+'</svg>';
}
function editorialCard(p,rank,kind,x,y,w,h,logo,maxValue){
  const goalie=kind==="goalies",primary=goalie?fmtDec(p.sv*(p.sv<=1?100:1),1):kind==="goals"?p.g:kind==="assists"?p.a:p.p;
  const label=goalie?"RÄDDNINGAR %":kind==="goals"?"MÅL":kind==="assists"?"ASSIST":"POÄNG";
  const accent=rank===1?"#ffcf4a":rank===2?"#cbd9e5":"#bca58a",wide=w>1400;
  const pad=24,pw=wide?150:Math.min(196,h-36),px=x+pad,py=y+18,ph=h-36,tx=px+pw+28,right=x+w-28;
  const nameW=right-tx-82,nameSize=Math.min(38,nameW/Math.max(1,String(p.display_gamertag||"").length)*1.55);
  const vals=goalie?[['MATCHER',p.gp],['GAA',p.gaa==null?'–':fmtDec(p.gaa)],['NOLLOR',p.so]]:
    kind==="goals"?[['MATCHER',p.gp],['ASSIST',p.a],['POÄNG',p.p]]:kind==="assists"?[['MATCHER',p.gp],['MÅL',p.g],['POÄNG',p.p]]:[['MATCHER',p.gp],['MÅL',p.g],['ASSIST',p.a]];
  let o='<g><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="20" fill="#0c1c2c" stroke="#294055"/><rect x="'+x+'" y="'+(y+22)+'" width="5" height="'+(h-44)+'" rx="2" fill="'+accent+'"/>'+
    '<rect x="'+px+'" y="'+py+'" width="'+pw+'" height="'+ph+'" rx="12" fill="#122b3e"/>';
  const portrait=portraitUrl(p);o+=portrait?portraitImage(portrait,px+6,py+6,pw-12,ph-12):silhouetteSvg(px+6,py+6,pw-12,ph-12);
  o+='<rect x="'+(px+10)+'" y="'+(py+10)+'" width="40" height="32" rx="8" fill="'+accent+'"/>'+svgText(px+30,py+33,String(rank).padStart(2,'0'),19,"#07121c",900,'text-anchor="middle"');
  o+=svgText(tx,y+51,clip(p.display_gamertag,32),nameSize,"#fff",800)+svgText(tx,y+78,clip(p.team_name_in_league||"",42),17,"#a2b6c9",600);
  if(logo)o+=img(logo,right-58,y+20,58);
  const sy=wide?y+113:y+112,statsX=tx+(goalie?200:150),step=(right-statsX)/3;
  o+=svgText(tx,sy,label,12,"#a2b6c9",700,'letter-spacing="1.5"')+svgText(tx,sy+53,primary,goalie?52:64,accent,900);
  vals.forEach((v,i)=>{const sx=statsX+i*step;o+=svgText(sx,sy,v[0],11,"#a2b6c9",700,'letter-spacing="1"')+svgText(sx,sy+47,v[1],32,"#f4f7fa",800)});
  if(h>=255){const rate=goalie?null:p.gp?(kind==="goals"?p.g:kind==="assists"?p.a:p.p)/p.gp:0;
    o+='<line x1="'+tx+'" y1="'+(y+h-65)+'" x2="'+right+'" y2="'+(y+h-65)+'" stroke="#294055"/>'+svgText(tx,y+h-30,goalie?"RANKAD EFTER RÄDDNINGSPROCENT":label+" / MATCH",12,"#a2b6c9",700,'letter-spacing="1"')+svgText(right,y+h-28,goalie?"SV%":fmtDec(rate),20,accent,800,'text-anchor="end"');
  }
  return o+'</g>';
}
function podiumBase(content){
  const {w:W,h:H}=format(),m=Math.round(W*.045),c=comp(),hx=W*.42,hw=W-m-hx;
  const size=Math.min(W>1400?104:74,hw/Math.max(1,title().length)*1.5);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+defs()+
    '<defs><linearGradient id="podiumPanel" x2="1" y2="1"><stop stop-color="#122c42"/><stop offset=".45" stop-color="#041522"/><stop offset="1" stop-color="#020d17"/></linearGradient><linearGradient id="medal1"><stop stop-color="#ffe88b"/><stop offset=".35" stop-color="#ffd22d"/><stop offset=".7" stop-color="#bc7a06"/><stop offset="1" stop-color="#ffcf4a"/></linearGradient><linearGradient id="medal2"><stop stop-color="#fff"/><stop offset=".4" stop-color="#c1cbd3"/><stop offset=".75" stop-color="#788894"/><stop offset="1" stop-color="#e7edf1"/></linearGradient><linearGradient id="medal3"><stop stop-color="#ffd09a"/><stop offset=".4" stop-color="#dc9436"/><stop offset=".75" stop-color="#8d541c"/><stop offset="1" stop-color="#eeb264"/></linearGradient><pattern id="cardLines" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 14L14 0" stroke="#bed9ef" stroke-opacity=".025"/></pattern></defs>'+background(W,H)+
    '<rect width="'+W+'" height="'+H+'" fill="#020b13" opacity=".46"/>'+
    '<rect x="'+(m+20)+'" y="30" width="5" height="112" fill="#ffcf4a"/>'+
    (c.logo?'<image href="'+esc(c.logo)+'" x="'+(m+40)+'" y="25" width="120" height="120" preserveAspectRatio="xMidYMid meet"/>':'')+
    svgText(m+172,91,c.label,42,"#fff",900,'font-style="italic"')+svgText(m+172,120,"SVENSK eHOCKEY",12,"#dae4ec",700,'letter-spacing="2.2"')+
    svgText(hx+hw/2,53,subtitle(),16,"#ffcf4a",700,'text-anchor="middle" letter-spacing="4"')+
    svgText(hx+hw/2,126,title(),size,"url(#silver)",900,'text-anchor="middle" letter-spacing="-2"')+
    '<path d="M'+(hx-10)+' 147 L'+(W-m)+' 142 L'+(W-m-56)+' 155 Z" fill="#ffcf4a"/>'+content+
    svgText(m,H-35,"SVENSK eHOCKEY | "+c.label,14,"#ecf1f5",700,'letter-spacing="1.5"')+
    svgText(W-m,H-35,"POWERED BY SWNWORKS",13,"#ecf1f5",600,'text-anchor="end" letter-spacing="1"')+'</svg>';
}
function podiumCard(p,rank,kind,x,y,w,h,logo,maxes){
  const goalie=kind==="goalies",metric=kind==="goals"?"g":kind==="assists"?"a":"p";
  const label=goalie?"SV%":kind==="goals"?"MÅL":kind==="assists"?"ASSIST":"POÄNG";
  const value=goalie?fmtDec(p.sv*(p.sv<=1?100:1),1):p[metric],accent=rank===1?"#ffcf4a":rank===2?"#e2e8ec":"#e6a34c";
  const rail=82,pad=18,pw=w>1400?190:174,px=x+rail+pad,py=y+pad,ph=h-pad*2,tx=px+pw+24,right=x+w-28;
  const nameSize=Math.min(36,(right-tx-90)/Math.max(1,String(p.display_gamertag||"").length)*1.55),s=h/320;
  let o='<g filter="url(#shadow)"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="23" fill="url(#podiumPanel)" stroke="'+accent+'" stroke-width="2"/>'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="23" fill="url(#cardLines)"/>'+
    '<path d="M'+(x+23)+' '+(y+4)+' H'+(x+rail)+' V'+(y+h-4)+' H'+(x+23)+' Q'+(x+4)+' '+(y+h-4)+' '+(x+4)+' '+(y+h-23)+' V'+(y+23)+' Q'+(x+4)+' '+(y+4)+' '+(x+23)+' '+(y+4)+' Z" fill="url(#medal'+rank+')"/>'+
    svgText(x+rail/2,y+h*.37,'TOPP',12,"#071018",800,'text-anchor="middle" letter-spacing="1"')+
    svgText(x+rail/2,y+h*.59,rank,70,"#071018",900,'text-anchor="middle"')+
    '<rect x="'+px+'" y="'+py+'" width="'+pw+'" height="'+ph+'" rx="16" fill="#06243b" stroke="#e2e8ec" stroke-width="3"/>'+
    '<path d="M'+(px+pw-6)+' '+(py+ph*.63)+' L'+(px+pw*.48)+' '+(py+ph-7)+' H'+(px+pw-6)+' Z" fill="#ffd12c"/>';
  const portrait=portraitUrl(p);o+=silhouetteSvg(px+8,py+8,pw-16,ph-16);if(portrait)o+=portraitImage(portrait,px+6,py+6,pw-12,ph-12);
  o+=svgText(tx,y+46*s,clip(p.display_gamertag,32),nameSize,"#fff",900)+svgText(tx,y+72*s,clip(p.team_name_in_league||"",40),18*s,"#bbc8d3",700);
  if(logo)o+=img(logo,right-82,y+18,82);
  const sy=y+109*s,mainX=tx+20,statsX=mainX+(goalie?210:180),step=(right-32-statsX)/3;
  o+=svgText(mainX,sy,label,18*s,"#ffcf4a",800)+svgText(mainX-4,sy+68*s,value,(goalie?62:83)*s,"#ffcf4a",900);
  const vals=goalie?[['GP',p.gp],['GAA',p.gaa==null?'–':fmtDec(p.gaa)],['SO',p.so]]:kind==="goals"?[['GP',p.gp],['A',p.a],['P',p.p]]:kind==="assists"?[['GP',p.gp],['G',p.g],['P',p.p]]:[['GP',p.gp],['G',p.g],['A',p.a]];
  vals.forEach((v,i)=>o+=svgText(statsX+i*step,sy,v[0],16*s,"#bbc8d3",600)+svgText(statsX+i*step,sy+43*s,v[1],32*s,"#fff",900));
  const rate=p.gp?p[metric]/p.gp:0,ppg=p.gp?p.p/p.gp:0,sv=p.sv*(p.sv<=1?100:1),gpg=p.gp?p.g/p.gp:0,apg=p.gp?p.a/p.gp:0;
  const bars=goalie?[['SV%',fmtDec(sv,1),sv/100],['GAA',p.gaa==null?'–':fmtDec(p.gaa),p.gaa==null?0:1/(1+Number(p.gaa))],['MATCHER',p.gp,p.gp/maxes.gp]]:
    kind==="points"?[["MÅL/GP",fmtDec(gpg),gpg/maxes.gpg],["ASSIST/GP",fmtDec(apg),apg/maxes.apg],["POÄNG/GP",fmtDec(ppg),ppg/maxes.ppg]]:
    [[label+'/GP',fmtDec(rate),rate/maxes.rate],['POÄNG/GP',fmtDec(ppg),ppg/maxes.ppg],['MATCHER',p.gp,p.gp/maxes.gp]];
  const bx=tx+126,bw=right-bx-66,bh=12*s;
  bars.forEach((b,i)=>{const by=y+(216+i*34)*s;o+=svgText(tx,by+bh-1,b[0],15*s,"#bbc8d3",700)+
    '<rect x="'+bx+'" y="'+by+'" width="'+bw+'" height="'+bh+'" rx="'+bh/2+'" fill="#20313b"/>'+
    '<rect x="'+bx+'" y="'+by+'" width="'+Math.max(0,bw*clamp01(b[2]))+'" height="'+bh+'" rx="'+bh/2+'" fill="url(#gold)"/>'+svgText(right,by+bh,b[1],18*s,"#fff",800,'text-anchor="end"')});
  return o+'</g>';
}
const portraitBounds=new Map(),portraitMeasurements=new Map();
function measurePortrait(url){
 if(!url||portraitMeasurements.has(url))return;
 const task=new Promise(resolve=>{const timer=setTimeout(resolve,15000),photo=new Image();photo.crossOrigin='anonymous';photo.onload=()=>{try{
  const canvas=document.createElement('canvas'),ratio=Math.min(1,640/photo.naturalWidth,900/photo.naturalHeight);canvas.width=Math.max(1,Math.round(photo.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(photo.naturalHeight*ratio));const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(photo,0,0,canvas.width,canvas.height);const {data}=ctx.getImageData(0,0,canvas.width,canvas.height);let left=canvas.width,top=canvas.height,right=-1,bottom=-1;
  for(let yy=0;yy<canvas.height;yy++)for(let xx=0;xx<canvas.width;xx++)if(data[(yy*canvas.width+xx)*4+3]>32){left=Math.min(left,xx);top=Math.min(top,yy);right=Math.max(right,xx);bottom=Math.max(bottom,yy);}
  if(right>=left&&bottom>=top){const widths=[];for(let yy=top+Math.round((bottom-top)*.08);yy<=top+Math.round((bottom-top)*.22);yy+=2){let lo=canvas.width,hi=-1;for(let xx=left;xx<=right;xx++)if(data[(yy*canvas.width+xx)*4+3]>32){lo=Math.min(lo,xx);hi=Math.max(hi,xx);}if(hi>=lo)widths.push(hi-lo+1);}widths.sort((a,b)=>a-b);portraitBounds.set(url,{left:left/ratio,top:top/ratio,width:(right-left+1)/ratio,height:(bottom-top+1)/ratio,headWidth:(widths[Math.floor(widths.length/2)]||right-left+1)/ratio,sourceW:photo.naturalWidth,sourceH:photo.naturalHeight});}
 }catch(e){console.warn('Portrait uses original crop',url);}clearTimeout(timer);resolve();render();};photo.onerror=()=>{clearTimeout(timer);resolve();};photo.src=url;});portraitMeasurements.set(url,task);
}
function portraitCrop(b,w,h){
 const width=Math.min(b.width,Math.max(b.headWidth/.52,b.headWidth*1.5*w/h));
 // Top anchor and a single aspect-preserving crop for every card size.
 const cropW=Math.min(width,b.height*w/h),cropH=cropW*h/w;
 return {left:b.left+(b.width-cropW)/2,top:b.top,width:cropW,height:cropH};
}
function normalizedPortrait(url,x,y,w,h,id,framed=false){
 measurePortrait(url);const b=portraitBounds.get(url),crop=b?portraitCrop(b,w,h):null;
 return '<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"'+(crop?' viewBox="'+[crop.left,crop.top,crop.width,crop.height].join(' ')+'"':' viewBox="0 0 '+w+' '+h+'"')+' preserveAspectRatio="xMidYMin slice" overflow="hidden"><image href="'+esc(url)+'" width="'+(b?b.sourceW:w)+'" height="'+(b?b.sourceH:h)+'" preserveAspectRatio="'+(b?'none':'xMidYMin slice')+'"/></svg>';
}
async function readyPortraits(){build();await Promise.all([...portraitMeasurements.values()]);}
function nationFlag(p,x,y,width=36){
  const aliases={SWE:'se',FIN:'fi',NOR:'no',DNK:'dk',DEN:'dk',DEU:'de',GER:'de',USA:'us',CAN:'ca',GBR:'gb',UK:'gb',CZE:'cz',CHE:'ch',SUI:'ch',FRA:'fr',SVK:'sk',LVA:'lv',EST:'ee'};
  const raw=String(p.player_country||p.country_code||'').trim().toUpperCase(),code=aliases[raw]||raw.toLowerCase();
  if(!/^[a-z]{2}$/.test(code))return '';
  const height=width*.75;
  return '<g><title>'+esc(raw)+'</title><rect x="'+(x-1)+'" y="'+(y-1)+'" width="'+(width+2)+'" height="'+(height+2)+'" rx="3" fill="#b7d0df" fill-opacity=".4"/><image href="https://flagcdn.com/w80/'+code+'.png" x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" preserveAspectRatio="xMidYMid meet"/></g>';
}
function modernPodiumCard(p,rank,kind,x,y,w,h,logo){
  const average=kind==='points_average',extra=average||kind==='penalties'||kind==='hits';
  const goalie=kind==="goalies",dim=kind==='dim',key=kind==="goals"?"g":kind==="assists"?"a":"p",label=average?'POÄNG / MATCH':kind==='penalties'?'UTVISNINGSMINUTER':kind==='hits'?'TACKLINGAR':dim?'DIM':goalie?"SV%":kind==="goals"?"MÅL":kind==="assists"?"ASSIST":"POÄNG";
  const value=extra?(average?fmtDec(p.score):p.score):dim?fmtDec(p.dim):goalie?fmtDec(p.sv*(p.sv<=1?100:1),1):p[key],gold=rank===1,accent=gold?"#ffda55":"#bdd4e5";
  const pw=Math.min(S.format==='wide'?270:300,h*.90),px=x+62,py=y+12,tx=px+pw+26,right=x+w-32,scale=Math.min(1.25,h/290);
  const flag=nationFlag(p,tx,y+54*scale-27*scale,36*scale),nameX=tx+(flag?48*scale:0),logoSize=92*scale;
  const nameSize=Math.min(40,(right-nameX-logoSize-24)/Math.max(1,String(p.display_gamertag||"").length)*1.6);
  let o='<g><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="12" fill="'+(gold?'#132d3c':'#0b1d2c')+'" stroke="'+(gold?'#dfb742':'#294355')+'" stroke-width="'+(gold?2:1)+'"/>'+
    '<path d="M'+(x+w*.78)+' '+y+' H'+(x+w)+' V'+(y+h)+' H'+(x+w*.62)+' Z" fill="'+accent+'" opacity=".04"/>'+
    svgText(x+24,y+53,String(rank).padStart(2,'0'),29,accent,900)+
    '<rect x="'+(x+24)+'" y="'+(y+70)+'" width="3" height="'+(h-100)+'" fill="'+accent+'" opacity=".65"/>';
  const portrait=portraitUrl(p),ph=h-24,photoH=Math.min(ph-6,(pw-8)*1.42),frame='M'+(px+20)+' '+py+' H'+(px+pw)+' L'+(px+pw-20)+' '+(py+ph)+' H'+px+' Z';
  o+='<defs><linearGradient id="portraitBlue-'+rank+'" x2="1" y2="1"><stop stop-color="#16466a"/><stop offset="1" stop-color="#062337"/></linearGradient><clipPath id="portraitFrame-'+rank+'"><path d="'+frame+'"/></clipPath></defs>'+
    '<g clip-path="url(#portraitFrame-'+rank+')"><rect x="'+px+'" y="'+py+'" width="'+pw+'" height="'+ph+'" fill="url(#portraitBlue-'+rank+')"/>'+
    (portrait?normalizedPortrait(portrait,px+4,py+ph-photoH,pw-8,photoH,'player-'+rank,true):silhouetteSvg(px,py,pw,ph))+'</g>'+
    '<path d="'+frame+'" fill="none" stroke="'+accent+'" stroke-width="2"/>'+
    '<path d="M'+(px+20)+' '+py+' L'+px+' '+(py+ph)+' M'+(px+pw)+' '+py+' L'+(px+pw-20)+' '+(py+ph)+'" fill="none" stroke="#e8c84e" stroke-width="3"/>';
  o+=flag+svgText(nameX,y+54*scale,clip(p.display_gamertag,32),nameSize,"#fff",900)+svgText(tx,y+81*scale,clip(p.team_name_in_league||"",36),17*scale,"#a6bfce",600);
  if(logo)o+=img(logo,right-logoSize,y+16*scale,logoSize);
  const vy=y+h*.59;
  o+=svgText(tx,vy-52*scale,label,13*scale,accent,800,'letter-spacing="2"')+svgText(tx-4,vy+25*scale,value,(dim||average?68:goalie?75:98)*scale,accent,900,'letter-spacing="-4"');
  const values=goalie?[['MATCHER',p.gp],['GAA',p.gaa==null?'–':fmtDec(p.gaa)],['NOLLOR',p.so]]:kind==="goals"?[['MATCHER',p.gp],['ASSIST',p.a],['POÄNG',p.p]]:kind==="assists"?[['MATCHER',p.gp],['MÅL',p.g],['POÄNG',p.p]]:[['MATCHER',p.gp],['MÅL',p.g],['ASSIST',p.a]];
  const sx=tx+(goalie||dim||average?220:190),step=Math.min(200,(right-sx)/3);
  (extra?[['MATCHER',p.gp],['POÄNG',p.p],[average?'MÅL':'ASSIST',average?p.g:p.a]]:dim?[['TA',p.ta],['INT',p.it],['BS',p.bs]]:values).forEach((v,i)=>o+=svgText(sx+i*step,vy-32*scale,v[0],11*scale,"#a6bfce",700,'letter-spacing="1"')+svgText(sx+i*step,vy+14*scale,v[1],34*scale,"#fff",800));
  const footer=goalie?'RÄDDNINGSPROCENT':label+' PER MATCH',rate=goalie?fmtDec(p.sv*(p.sv<=1?100:1),1)+' %':fmtDec(p.gp?p[key]/p.gp:0);
  o+='<line x1="'+tx+'" y1="'+(y+h-57)+'" x2="'+right+'" y2="'+(y+h-57)+'" stroke="#345062"/>'+svgText(tx,y+h-28,dim||average||goalie?'MATCHER · MINST '+qualificationPercent()+' %':extra?(kind==='penalties'?'UTVISNINGSMINUTER':'TACKLINGAR')+' PER MATCH':footer,12,"#a6bfce",700,'letter-spacing="1.2"')+svgText(right,y+h-26,dim||average||goalie?p.gp+' / '+p.teamGames:extra?fmtDec(p.score/p.gp):rate,22,accent,800,'text-anchor="end"');
  return o+'</g>';
}
function modernPodiumBase(content){
  const {w:W,h:H}=format(),m=Math.round(W*.052),c=comp(),ts=Math.min(W>1400?100:86,(W-m*2)/Math.max(1,title().length)*1.55);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+defs()+studioBackground(W,H)+
    (c.logo?'<image href="'+esc(c.logo)+'" x="'+m+'" y="32" width="76" height="76" preserveAspectRatio="xMidYMid meet"/>':'')+
    svgText(m+94,65,c.label,25,"#fff",900)+svgText(m+94,90,"SVENSK eHOCKEY",11,"#a6bfce",700,'letter-spacing="2"')+
    svgText(W-m,70,"TOPP 03",16,"#ffda55",800,'text-anchor="end" letter-spacing="3"')+
    svgText(m,151,subtitle(),14,"#ffda55",700,'letter-spacing="3"')+svgText(m-3,236,title(),ts,"#fff",900,'letter-spacing="-3"')+
    '<rect x="'+m+'" y="261" width="64" height="5" fill="#ffda55"/>'+content+
    svgText(m,H-31,"SVENSK eHOCKEY / "+c.label,12,"#a6bfce",700,'letter-spacing="1"')+svgText(W-m,H-31,"SWNWORKS",12,"#a6bfce",700,'text-anchor="end" letter-spacing="2"')+'</svg>';
}
function editorialBoard(kind){
  const defendersOnly=kind.startsWith('defender_');
  kind=kind.replace(/^defender_/,'');
  const rows=['points_average','penalties','hits'].includes(kind)?extraLeaders(kind,defendersOnly):kind==='dim'?dimPlayers():kind==="goalies"?goalies().slice(0,3):skaters(kind==="goals"?"g":kind==="assists"?"a":"p",defendersOnly).slice(0,3),lm=logos();
  const {w:W,h:H}=format(),m=Math.round(W*.052),top=300,gap=20;
  const cardH=(H-85-top-gap*2)/3,metric=kind==="goals"?"g":kind==="assists"?"a":"p";
  const maxes={gp:Math.max(1,...rows.map(p=>p.gp)),rate:Math.max(.01,...rows.map(p=>p.gp?p[metric]/p.gp:0)),ppg:Math.max(.01,...rows.map(p=>p.gp?p.p/p.gp:0)),gpg:Math.max(.01,...rows.map(p=>p.gp?p.g/p.gp:0)),apg:Math.max(.01,...rows.map(p=>p.gp?p.a/p.gp:0))};
  let o="";rows.forEach((p,i)=>o+=modernPodiumCard(p,i+1,kind,m,top+i*(cardH+gap),W-m*2,cardH,lm.get(String(p.sports_gamer_team_id))||""));
  if(!rows.length)o+=svgText(W/2,H/2,kind==='points_average'||kind==='goalies'?'Ingen spelare uppfyller matchkravet ännu':'Ingen matchstatistik ännu',30,"#a2b6c9",700,'text-anchor="middle"');
  return modernPodiumBase(o);
}
function board(kind){return editorialBoard(kind)}
function goalieSvg(){return editorialBoard("goalies")}

let rosterTeamId='',rosterPickerSignature='';
const rosterExcluded=new Map();
function rosterTeamOptions(){const teams=new Map();for(const row of [...S.teams,...S.players]){const id=String(row.sports_gamer_team_id??'');if(id&&!teams.has(id))teams.set(id,{id,name:row.team_name_in_league||id});}return [...teams.values()].sort((a,b)=>a.name.localeCompare(b.name,'sv'));}
function rosterTeamName(){return rosterTeamOptions().find(team=>team.id===rosterTeamId)?.name||L.t('Välj lag');}
function rosterPlayers(){const unique=new Map();for(const player of S.players){if(String(player.sports_gamer_team_id)!==rosterTeamId||player.is_current_roster!==true)continue;const id=String(player.sports_gamer_player_id??player.display_gamertag);if(!unique.has(id))unique.set(id,player);}return [...unique.values()].sort((a,b)=>String(a.display_gamertag).localeCompare(String(b.display_gamertag),'sv'));}
function rosterPlayerId(player){return String(player.sports_gamer_player_id??player.display_gamertag);}
function rosterExclusions(){const key=S.league+':'+rosterTeamId;if(!rosterExcluded.has(key))rosterExcluded.set(key,new Set());return rosterExcluded.get(key);}
function rosterPosition(player){
  const goalieGames=n(player.regular_goalie_games)+n(player.playoff_goalie_games),skaterGames=n(player.regular_skater_games)+n(player.playoff_skater_games);
  if(goalieGames>0&&skaterGames===0)return 'G';
  let position=String(player.roster_preferred_position_abbreviation||player.regular_skater_position_abbreviation||player.playoff_skater_position_abbreviation||'').toUpperCase();
  if(skaterGames>0&&goalieGames===0&&(position==='G'||position==='GK')){
    const actual=[player.regular_skater_position_abbreviation,player.playoff_skater_position_abbreviation].map(value=>String(value||'').toUpperCase());
    position=actual.find(value=>value&&value!=='G'&&value!=='GK')||'–';
  }
  return position==='GK'?'G':position==='CE'?'C':position;
}
function selectedRoster(){
  const order=['RW','LW','C','LD','RD','G'];
  const rank=player=>{const index=order.indexOf(rosterPosition(player));return index<0?-1:index;};
  return rosterPlayers().filter(player=>!rosterExclusions().has(rosterPlayerId(player))).sort((a,b)=>rank(a)-rank(b)||String(a.display_gamertag).localeCompare(String(b.display_gamertag),'sv'));
}
function syncRosterPicker(){
 const teams=rosterTeamOptions();if(!teams.some(team=>team.id===rosterTeamId))rosterTeamId=teams[0]?.id||'';
 const signature=JSON.stringify([S.league,rosterTeamId,teams,rosterPlayers().map(player=>[rosterPlayerId(player),player.display_gamertag]),[...rosterExclusions()],L.locale]);
 if(signature===rosterPickerSignature)return;rosterPickerSignature=signature;
 $('#rosterTeam').innerHTML=teams.map(team=>'<option value="'+esc(team.id)+'"'+(team.id===rosterTeamId?' selected':'')+'>'+esc(team.name)+'</option>').join('');
 $('#rosterSelectionCount').textContent=selectedRoster().length+' / '+rosterPlayers().length+' '+L.t('SPELARE');
 $('#rosterPlayers').innerHTML=rosterPlayers().map(player=>'<label><input type="checkbox" value="'+esc(rosterPlayerId(player))+'"'+(!rosterExclusions().has(rosterPlayerId(player))?' checked':'')+'><span>'+esc(player.display_gamertag)+'</span></label>').join('');
}
function rosterGeometry(count,W,H){
 const margin=Math.round(W*.052),top=340,bottom=H-90,gap=W>1500?22:16,width=W-margin*2,height=bottom-top;
 let best=null;
 if(W>1500&&count<=9){const rows=1,columns=Math.max(1,count),w=Math.min((width-gap*(columns-1))/columns,320),h=height;return {columns,rows,w,h,margin,top,gap,width};}
 if(W>1500&&count>=10&&count<=20){const rows=2,columns=Math.ceil(count/rows),w=(width-gap*(columns-1))/columns,h=(height-gap)/rows;return {columns,rows,w,h,margin,top,gap,width};}
 if(W>1500){const smallTeam=count>=6&&count<=8,ratio=smallTeam?.9:.64,rows=smallTeam?2:Math.ceil(Math.max(1,count)/8),columns=Math.ceil(Math.max(1,count)/rows),availableH=(height-gap*(rows-1))/rows,w=Math.min((width-gap*(columns-1))/columns,availableH*ratio,smallTeam?300:260),h=Math.min(availableH,w/ratio),gridTop=top+(height-(rows*h+(rows-1)*gap))/2;return {columns,rows,w,h,margin,top:gridTop,gap,width};}
 if(count>=6){const rows=count<=12?2:3,columns=Math.ceil(count/rows),w=(width-gap*(columns-1))/columns,rowGap=count>=11&&count<=12?48:gap,h=Math.min((height-rowGap*(rows-1))/rows,count>=11&&count<=12?w*2.65:Infinity),gridTop=top+(height-(rows*h+(rows-1)*rowGap))/2;return {columns,rows,w,h,margin,top:gridTop,gap,rowGap,width};}
 for(let columns=1;columns<=Math.min(8,Math.max(1,count));columns++){const rows=Math.ceil(Math.max(1,count)/columns),w=(width-gap*(columns-1))/columns,h=(height-gap*(rows-1))/rows;const score=Math.abs(Math.log((w/h)/.85))+(rows*columns-Math.max(1,count))*.025;if(!best||score<best.score)best={columns,rows,w,h,score};}
 return {...best,margin,top,gap,width};
}
function rosterPortrait(url,x,y,w,h,count){
 if(!url)return '';measurePortrait(url);const b=portraitBounds.get(url);
 const template=b&&Math.abs(b.sourceW/b.sourceH-2/3)<.002;
 const cropW=b?(template?b.sourceH*.5*w/h:Math.min(b.width,b.headWidth/.54)):w,cropH=cropW*h/w;
 const crop=b?(template?[(b.sourceW-cropW)/2,0,cropW,cropH]:[b.left+(b.width-cropW)/2,Math.max(0,b.top),cropW,cropH]):[0,0,w,h];
 return '<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="'+crop.join(' ')+'" preserveAspectRatio="xMidYMin meet" overflow="hidden"><image href="'+esc(url)+'" width="'+(b?b.sourceW:w)+'" height="'+(b?b.sourceH:h)+'" preserveAspectRatio="'+(b?'none':'xMidYMin slice')+'"/></svg>';
}
function rosterAvatar(x,y,w,h,count){
 const avatar=silhouetteSvg(x,y,w,h);
 if(S.format!=='wide'||count>20)return avatar;
 const cropW=Math.max(68/.42,68*2.6*w/h),cropH=cropW*h/w;
 return avatar.replace('viewBox="0 0 200 260"','viewBox="'+[100-cropW/2,18-cropH*.035,cropW,cropH].join(' ')+'"');
}
function rosterStatsValues(player){
 const goalie=rosterPosition(player)==='G',gp=goalie?gv(player,'gp'):ps(player,'skater_games');
 const value=(number,digits=0)=>number==null||!Number.isFinite(Number(number))?'–':Number(number).toLocaleString(L.locale,{minimumFractionDigits:digits,maximumFractionDigits:digits});
 if(goalie){const sv=gv(player,'save_percentage'),percentage=sv==null?null:Number(sv)*(Number(sv)<=1?100:1);return [['GP',value(gp)],['SV%',gp?value(percentage,1):'–'],['GAA',gp?value(gv(player,'goals_against_average'),2):'–'],['SO',gp?value(gv(player,'shutouts')):'–']];}
 return [['GP',value(gp)],['G',gp?value(ps(player,'goals')):'–'],['A',gp?value(ps(player,'assists')):'–'],['P',gp?value(ps(player,'points')):'–']];
}
function rosterStatsSvg(player,x,y,w,h){
 const cells=rosterStatsValues(player),cellW=(w-12)/cells.length,labelSize=Math.min(12,cellW*.3),valueSize=Math.min(22,cellW*.5,h*.48);
 return '<g data-roster-stats="true"><line x1="'+(x+8)+'" y1="'+y+'" x2="'+(x+w-8)+'" y2="'+y+'" stroke="#355369"/>'+cells.map(([label,value],i)=>svgText(x+6+cellW*(i+.5),y+labelSize+4,label,labelSize,'#9bb5c6',700,'text-anchor="middle"')+svgText(x+6+cellW*(i+.5),y+h-2,value,Math.min(valueSize,(cellW-6)/(String(value).length*.68)),'#fff',900,'text-anchor="middle"')).join('')+'</g>';
}
let singlePlayerId='';
function singlePlayer(){return rosterPlayers().find(p=>rosterPlayerId(p)===singlePlayerId)||rosterPlayers()[0];}
function syncSinglePlayer(){
 const players=rosterPlayers();if(!players.some(p=>rosterPlayerId(p)===singlePlayerId))singlePlayerId=players[0]?rosterPlayerId(players[0]):'';
 $('#singlePlayer').innerHTML=players.map(p=>'<option value="'+esc(rosterPlayerId(p))+'"'+(rosterPlayerId(p)===singlePlayerId?' selected':'')+'>'+esc(p.display_gamertag)+'</option>').join('');
}
function playerPresentationWideSvg(p){
 const {w:W,h:H}=format(),m=Math.round(W*.052),leftW=800,url=portraitUrl(p),b=url?portraitBounds.get(url):null;
 if(url)measurePortrait(url);
 const name=$('#title').value.trim()||p.display_gamertag,note=$('#playerNote').value.trim(),team=rosterTeamName(),logo=S.logos?logos().get(rosterTeamId):'';
 const cells=rosterStatsValues(p),goalie=rosterPosition(p)==='G',primary=goalie?cells[1][1]:cells[3][1],secondary=goalie?[cells[0],cells[2],cells[3]]:cells.slice(0,3);
 const photoX=900,photoY=20,photoW=1000,photoH=H-photoY,crop=b?[0,0,b.sourceW,b.sourceH*.8]:[0,0,1024,1229];
 let content='<g data-single-player="'+esc(rosterPlayerId(p))+'" data-player-layout="wide-editorial">';
 content+='<defs><radialGradient id="playerSpotlight"><stop stop-color="#4a7a94" stop-opacity=".30"/><stop offset="1" stop-color="#4a7a94" stop-opacity="0"/></radialGradient></defs><ellipse cx="1390" cy="625" rx="520" ry="470" fill="url(#playerSpotlight)"/>';
 content+='<rect x="'+m+'" y="182" width="48" height="4" rx="2" fill="#ffcf4a"/>'+svgText(m+66,190,$('#subtitle').value||L.t('SPELARPRESENTATION'),16,'#b4c9d7',800,'letter-spacing="2.6"');
 content+=svgText(m,292,name,fittedHeadingSize(name,88,leftW),'#fff',900,'letter-spacing="-2"');
 if(note)content+=svgText(m,345,note==='M\u00f6t spelaren'?L.t(note):note,Math.min(24,leftW/Math.max(1,note.length)/.58),'#b4c9d7',500);
 content+='<line x1="'+m+'" y1="382" x2="'+(m+leftW)+'" y2="382" stroke="#7894a7" opacity=".3"/>';
 content+=logo?img(logo,m,416,86):nationFlag(p,m,434,76);
 content+=svgText(m+112,450,team,fittedHeadingSize(team,30,leftW-112),'#eef5f9',800)+svgText(m+112,487,(rosterPosition(p)||'\u2013')+(p.player_number!=null?' \u00b7 #'+p.player_number:''),21,'#ffcf4a',800,'letter-spacing="1"');
 content+='<rect x="'+m+'" y="538" width="'+leftW+'" height="206" rx="18" fill="#071a28" fill-opacity=".78" stroke="#426079" stroke-opacity=".5"/><rect x="'+m+'" y="570" width="5" height="140" rx="2" fill="#ffcf4a"/>';
 content+=svgText(m+36,678,primary,Math.min(130,470/Math.max(1,primary.length)*1.4),'#ffcf4a',900,'letter-spacing="-4"')+svgText(m+468,625,goalie?'SV%':L.t('PO\u00c4NG'),25,'#fff',800,'letter-spacing="2"')+svgText(m+468,663,goalie?L.t('M\u00c5LVAKT'):rosterPosition(p),16,'#a2b6c9',700,'letter-spacing="2"');
 const gap=18,cellW=(leftW-gap*2)/3;
 content+=secondary.map(([label,value],i)=>{const x=m+i*(cellW+gap);return '<rect x="'+x+'" y="772" width="'+cellW+'" height="136" rx="14" fill="#071a28" fill-opacity=".7" stroke="#426079" stroke-opacity=".4"/>'+svgText(x+26,828,value,Math.min(46,(cellW-52)/Math.max(1,value.length)/.65),'#fff',900)+svgText(x+26,874,label,16,'#a2b6c9',800,'letter-spacing="2"');}).join('');
 content+=url?'<svg data-spotlight-photo="true" x="'+photoX+'" y="'+photoY+'" width="'+photoW+'" height="'+photoH+'" viewBox="'+crop.join(' ')+'" preserveAspectRatio="xMidYMax meet" overflow="hidden"><image href="'+esc(url)+'" width="'+(b?b.sourceW:1024)+'" height="'+(b?b.sourceH:1536)+'" preserveAspectRatio="none"/></svg>':silhouetteSvg(photoX,photoY,photoW,photoH);
 return base(content+'</g>');
}

function playerPresentationSvg(){
 const p=singlePlayer(),{w:W,h:H}=format(),m=Math.round(W*.052),wide=S.format==='wide';
 if(!p)return base(svgText(m,380,L.t('V\u00e4lj spelare'),28,'#fff',800));
 if(wide)return playerPresentationWideSvg(p);
 const note=$('#playerNote').value.trim(),name=$('#title').value||p.display_gamertag,photoX=W*.22,photoY=324,photoW=W-photoX,photoH=H-photoY+4,url=portraitUrl(p),b=url?portraitBounds.get(url):null;
 if(url)measurePortrait(url);
 const crop=b?[0,0,b.sourceW,b.sourceH*.8]:[0,0,1024,1229];
 let content='<g data-single-player="'+esc(rosterPlayerId(p))+'">';
 content+=svgText(m,198,$('#subtitle').value||L.t('SPELARPRESENTATION'),16,'#a2b6c9',800,'letter-spacing="2"')+svgText(m,274,name,fittedHeadingSize(name,wide?86:76,note?W*.55:W-m*2),'#fff',900)+'<line x1="'+m+'" y1="308" x2="'+(W-m)+'" y2="308" stroke="#ffcf4a" stroke-width="3"/>';
 if(note){
  const text=note==='M\u00f6t spelaren'?L.t(note):note,x=W*.65,width=W-m-x,size=20,lines=[];let line='';
  for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(next.length*size*.56>width&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
  content+=lines.slice(0,3).map((text,i)=>svgText(x,214+i*28,text,Math.min(size,width/Math.max(1,text.length)/.56),'#a2b6c9',600)).join('');
 }
 content+=url?'<svg data-spotlight-photo="true" x="'+photoX+'" y="'+photoY+'" width="'+photoW+'" height="'+photoH+'" viewBox="'+crop.join(' ')+'" preserveAspectRatio="xMidYMax meet" overflow="hidden"><image href="'+esc(url)+'" width="'+(b?b.sourceW:1024)+'" height="'+(b?b.sourceH:1536)+'" preserveAspectRatio="none"/></svg>':silhouetteSvg(photoX,photoY,photoW,photoH);
 const infoX=m,infoW=W*.27-m,infoY=365,k=Math.min(1.5,(H-420)/850),logo=S.logos?logos().get(rosterTeamId):'';
 content+=logo?img(logo,infoX,infoY,76):nationFlag(p,infoX,infoY,76);
 content+=svgText(infoX,infoY+120,rosterTeamName(),Math.min(26,infoW/Math.max(1,rosterTeamName().length)*1.45),'#a2b6c9',800);
 content+=svgText(infoX,infoY+164,(rosterPosition(p)||'\u2013')+(p.player_number!=null?' \u00b7 #'+p.player_number:''),26,'#ffcf4a',800);
 const cells=rosterStatsValues(p),goalie=rosterPosition(p)==='G',primary=goalie?cells[1][1]:cells[3][1],primaryY=infoY+320*k;
 content+=svgText(infoX,primaryY,primary,Math.min(150*k,infoW/Math.max(1,primary.length)*1.4),'#ffcf4a',900)+svgText(infoX,primaryY+40,goalie?'SV%':L.t('PO\u00c4NG'),18,'#a2b6c9',800,'letter-spacing="2"');
 const secondary=goalie?[cells[0],cells[2],cells[3]]:cells.slice(0,3),statY=infoY+455*k;
 content+=secondary.map(([label,value],i)=>{const y=statY+i*90*k,size=Math.min(44*k,infoW*.55/Math.max(1,value.length)*1.4),labelX=infoX+Math.max(54,value.length*size*.64+18);return svgText(infoX,y,value,size,'#fff',900)+svgText(labelX,y-8,label,16,'#a2b6c9',800);}).join('');
 content+='</g>';
 return base(content);
}
function rosterSvg(){
 const players=selectedRoster(),{w:W,h:H}=format(),g=rosterGeometry(players.length,W,H),team=rosterTeamOptions().find(team=>team.id===rosterTeamId),logo=logos().get(rosterTeamId);
 let content=svgText(g.margin,310,players.length+' '+L.t('SPELARE')+(S.rosterStats?' · '+stageName():''),17,'#ffcf4a',800);
 if(!players.length)return base(content+svgText(W/2,(H+340)/2,L.t(team?'Välj minst en spelare':'Inga registrerade spelare'),26,'#a2b6c9',700,'text-anchor="middle"'));
 players.forEach((player,i)=>{const row=Math.floor(i/g.columns),rowCount=Math.min(g.columns,players.length-row*g.columns),offset=(g.width-(rowCount*g.w+(rowCount-1)*g.gap))/2,x=g.margin+offset+(i%g.columns)*(g.w+g.gap),y=g.top+row*(g.h+(g.rowGap||g.gap)),band=S.rosterStats?Math.min(126,Math.max(98,g.h*.4)):Math.min(72,Math.max(60,g.h*.23)),ph=g.h-band-12,portrait=portraitUrl(player),name=String(player.display_gamertag||''),size=Math.min(25,(g.w-22)/Math.max(1,name.length)*1.45),position=rosterPosition(player)||'–';
 content+='<g data-player-id="'+esc(rosterPlayerId(player))+'"><rect x="'+x+'" y="'+y+'" width="'+g.w+'" height="'+g.h+'" rx="14" fill="#12354f" stroke="#355369"/>'+(portrait?rosterPortrait(portrait,x+8,y+6,g.w-16,ph,players.length,player):rosterAvatar(x+8,y+6,g.w-16,ph,players.length))+'<rect x="'+x+'" y="'+(y+g.h-band)+'" width="'+g.w+'" height="'+band+'" fill="#04131e"/>'+svgText(x+g.w/2,y+g.h-band+Math.min(size+5,band*.5),name,size,'#fff',900,'text-anchor="middle"')+svgText(x+g.w/2,(S.rosterStats?y+g.h-band+49:y+g.h-10),(player.player_number!=null?'#'+player.player_number+' · ':'')+position,Math.min(14,band*.24),'#ffcf4a',800,'text-anchor="middle"')+nationFlag(player,x+8,S.rosterStats?y+g.h-band+32:y+g.h-27,24)+(S.rosterStats?rosterStatsSvg(player,x,y+g.h-band+61,g.w,band-65):'')+'</g>';
 });return base(content);
}

function build(){
  let graphic=playerDataError&&needsPlayers()?base(svgText(format().w/2,format().h/2,'Spelardata kunde inte hämtas. Försök uppdatera.',24,'#ffcf4a',700,'text-anchor="middle"')):S.kind==="player"?playerPresentationSvg():S.kind==="roster"?rosterSvg():S.kind==="matches"?matchesSvg():S.kind==="table"?tableSvg():S.kind==="groups"?groupsSvg():S.kind==="goalies"?goalieSvg():S.kind==="leaders"?leadersSvg():board(S.kind);
  const sports=$("#sender").value==="sportsgamer",name=sports?"SportsGamer":"SVENSK eHOCKEY",logo=sports?"../assets/sportsgamer-logo.png":"../assets/svensk-ehockey-logo.png";
  const {w,h}=format();
  graphic=graphic.replaceAll('SVENSK eHOCKEY',name);
  // Keep the tournament and team logos intact. The selected sender owns the footer.
  graphic=graphic.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g,text=>{
    const y=Number(text.match(/\by="([\d.]+)"/)?.[1]),x=Number(text.match(/\bx="([\d.]+)"/)?.[1]);
    if(y<h-50||x>w/2||!text.includes(name))return text;
    text=text.replace(name+' / ','').replace(name+' | ','').replace(name+' · ','').replace(name,'');
    const width=sports?140:50;
    return '<image href="'+logo+'" x="'+x+'" y="'+(y-30)+'" width="'+width+'" height="40" preserveAspectRatio="xMidYMid meet"/>'+text.replace(/\bx="[\d.]+"/,'x="'+(x+width+12)+'"');
  });
  return L.svg(graphic,[$("#title").value,$("#subtitle").value,$("#playerNote").value,comp().label,...S.teams.map(t=>t.team_name_in_league),...S.players.map(p=>p.display_gamertag)]);
}
function render(){
  sync();$("#minGamesField").hidden=!['goalies','points_average','defender_points_average','dim'].includes(S.kind);
  for(const kind of ['goalies','points_average','defender_points_average','dim']){const el=document.querySelector('[data-kind="'+kind+'"] small');if(el)el.textContent=(kind==='goalies'?'SV% · GAA':kind==='dim'?'(TA + INT + BS) / GP':L.t('Poäng per match'))+' · '+L.t('MINST')+' '+qualificationPercent()+' %';}
  S.rosterStats=$("#rosterDisplay").value==="stats";$("#rosterDisplayField").hidden=S.kind!=="roster";if(["roster","player"].includes(S.kind))syncRosterPicker();if(S.kind==="player")syncSinglePlayer();$("#singlePlayerField").hidden=$("#playerNoteField").hidden=S.kind!=="player";$("#rosterTeamField").hidden=!["roster","player"].includes(S.kind);$("#rosterPlayersField").hidden=S.kind!=="roster";$("#preview").innerHTML=build();$("#sizeLabel").textContent=format().label;$("#kindLabel").textContent=L.t(TIT[S.kind]);
  const missingTieBreaks=S.league===527&&['table','groups'].includes(S.kind)&&(scheduleLoading||!!scheduleError);
  if(missingTieBreaks)$("#preview").innerHTML='<div style="color:white;padding:30px">'+esc(scheduleError||L.t('HÄMTAR…'))+'</div>';
  $("#png").disabled=$("#svg").disabled=dataLoading||playerDataError&&needsPlayers()||missingTieBreaks||S.kind==="player"&&!singlePlayer();
  $("#matchEditField").hidden=S.kind!=="matches";if(S.kind==="matches"){syncMatchEditor();syncManualEditor();}$("#matchPageField").hidden=S.kind!=="matches";$("#matchDateField").hidden=S.kind!=="matches";$("#matchListField").hidden=S.kind!=="matches";$("#stageField").hidden=(S.kind==="roster"&&!S.rosterStats)||S.kind==="matches"||S.kind==="table"||S.kind==="groups";$("#groupField").hidden=S.kind!=="table"||groupIds().length<=1;$("#countField").hidden=true;
}
function safe(){return (comp().code+(S.kind==="player"?"-"+(singlePlayer()?.display_gamertag||""):"")+(S.kind==="matches"?"-"+$("#matchDate").value+"-sida-"+(Number($("#matchPage").value)+1):"")+"-"+TIT[S.kind]).toLowerCase().replace(/å/g,"a").replace(/ä/g,"a").replace(/ö/g,"o").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function dl(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
function dataUrl(blob){return new Promise((ok,no)=>{const f=new FileReader();f.onload=()=>ok(f.result);f.onerror=no;f.readAsDataURL(blob)})}
let logoAssetsPromise;
async function inline(svg){
  logoAssetsPromise ||= fetch('logo-assets.json?v=20261011-export-logos',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Loggorna kunde inte laddas. Uppdatera sidan och försök igen.');return r.json()}).catch(error=>{logoAssetsPromise=null;throw new Error('Bildcachen kunde inte hämtas. Försök exportera igen.');});
  const logoAssets=await logoAssetsPromise;
  const d=new DOMParser().parseFromString(svg,"image/svg+xml"),ims=[...d.querySelectorAll("image")];
  const images=new Map();
  await Promise.all(ims.map(async el=>{
    const h=el.getAttribute('href')||'';if(!h||h.startsWith('data:'))return;
    if(!images.has(h))images.set(h,(async()=>{
      const source=logoAssets[h]||h;
      if(source.startsWith('data:'))return source;
      try{
        const r=await fetch(source,{mode:'cors',cache:'no-store',signal:AbortSignal.timeout(15000)});
        if(!r.ok)throw new Error('HTTP '+r.status);
        return await dataUrl(await r.blob());
      }catch(error){
        const filename=new URL(h,location.href).pathname.split('/').pop();
        throw new Error('Bilden '+filename+' kunde inte exporteras. Uppdatera sidan och försök igen.');
      }
    })());
    // Never silently remove images: an incomplete export is not a success.
    el.setAttribute('href',await images.get(h));
  }));
  return new XMLSerializer().serializeToString(d.documentElement);
}
async function expSvg(){await readyPortraits();const s=await inline(build());dl(new Blob([s],{type:"image/svg+xml;charset=utf-8"}),safe()+".svg")}
async function expPng(){await readyPortraits();const s=await inline(build()),{w,h}=format(),u=URL.createObjectURL(new Blob([s],{type:"image/svg+xml;charset=utf-8"})),im=new Image();try{await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=u});const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.drawImage(im,0,0,w,h);const b=await new Promise(ok=>c.toBlob(ok,"image/png",1));if(!b)throw new Error("PNG-export misslyckades");dl(b,safe()+".png")}finally{URL.revokeObjectURL(u)}}

$$("[data-kind]").forEach(b=>b.onclick=()=>{$$("[data-kind]").forEach(x=>x.classList.toggle("active",x===b));S.kind=b.dataset.kind;if(S.kind==="matches")load();else render()});
$("#singlePlayer").onchange=()=>{singlePlayerId=$("#singlePlayer").value;render()};
$("#rosterTeam").onchange=()=>{rosterTeamId=$("#rosterTeam").value;render()};
$("#rosterPlayers").onchange=event=>{const input=event.target;if(input.type!=="checkbox")return;const excluded=rosterExclusions();if(input.checked)excluded.delete(input.value);else excluded.add(input.value);render()};
$("#rosterSelectAll").onclick=()=>{rosterExclusions().clear();render()};
$("#matchDate").value=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Stockholm",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
["matchDate"].forEach(id=>$("#"+id).addEventListener("change",()=>{$("#matchPage").value="0";render()}));
$("#matchEditSelect").addEventListener("change",syncMatchEditor);
$("#matchEditSave").onclick=()=>saveMatchDate();
$("#matchEditReset").onclick=()=>saveMatchDate(true);
$("#matchEditSwap").onclick=toggleMatchSides;
$("#manualSave").onclick=saveManualMatch;
$("#manualMatchList").onclick=event=>{const id=event.target.dataset.removeManual;if(!id)return;if(storeManualMatches(manualMatches.filter(g=>g.id!==id))){render();$("#manualMatchStatus").textContent='Manuellt resultat borttaget.';}};
["rosterDisplay","minGamesPercent","matchPage","matchDate","stage","group","count","format","bg","logos","sender"].forEach(id=>$("#"+id).addEventListener("change",render));
try{$("#sender").value=localStorage.getItem('swn-graphics-sender')==='sportsgamer'?'sportsgamer':'seh';}catch{}
$("#sender").addEventListener('change',()=>{try{localStorage.setItem('swn-graphics-sender',$("#sender").value);}catch{}});
["title","subtitle","playerNote"].forEach(id=>$("#"+id).addEventListener("input",render));
$("#league").onchange=()=>{S.league=Number($("#league").value||527);S.group=null;if(S.league===532)$("#bg").value="wv";else if($("#bg").value==="wv")$("#bg").value="gamenight";load()};
async function exportGraphic(type){
  if(dataLoading||playerDataError&&needsPlayers())return;
  if(S.kind==="matches"&&(scheduleLoading||scheduleError))return;
  if(S.league===527&&['table','groups'].includes(S.kind)&&(scheduleLoading||scheduleError))return;
  const button=$("#"+type),label=button.textContent;
  $("#png").disabled=$("#svg").disabled=true;button.textContent=L.t("Exporterar…");
  try{await (type==="png"?expPng():expSvg())}catch(e){console.error("Graphics export:",e);$("#dataStatus").textContent=e.message;alert(e.message)}
  finally{$("#png").disabled=$("#svg").disabled=false;button.textContent=label}
}
$("#refresh").onclick=()=>{load()};$("#svg").onclick=()=>exportGraphic("svg");$("#png").onclick=()=>exportGraphic("png");
$("#language").onchange=()=>{L.set($("#language").value);groups();render()};
L.applyUi();render();load();
})();


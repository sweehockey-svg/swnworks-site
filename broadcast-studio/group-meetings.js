(() => {
  "use strict";
  const leagues=new Set([520,523,524,525,526,527,529,532]), cache=new Map(), pending=new Map();
  const scorerCache=new Map(),scorerPending=new Map();
  const scorerLabel={sv:"Målskyttar",en:"Goal scorers",fi:"Maalintekijät",de:"Torschützen"};
  const label={
    sv:["Inbördes möten","Inga verifierade gruppspelsmöten","Hämtar gruppspelsresultat…","Gruppspelsresultat kunde inte hämtas"],
    en:["Head-to-head","No verified group-stage meetings","Loading group-stage results…","Could not load group-stage results"],
    fi:["Keskinäiset ottelut","Ei vahvistettuja lohko-otteluita","Haetaan lohko-otteluita…","Lohko-otteluita ei voitu hakea"],
    de:["Direkte Duelle","Keine bestätigten Gruppenspiele","Gruppenergebnisse werden geladen…","Gruppenergebnisse nicht verfügbar"]
  };
  const positive=x=>Number.isSafeInteger(Number(x))&&Number(x)>0;
  const score=x=>(typeof x==="number"||(typeof x==="string"&&/^\d{1,2}$/.test(x)))&&Number.isInteger(Number(x))&&Number(x)>=0&&Number(x)<=99;
  function select(rows,home,away){
    if(!positive(home)||!positive(away)||Number(home)===Number(away))return [];
    const h=Number(home),a=Number(away),found=new Map();
    for(const m of rows){
      if(m?.stage!=="regular"||!positive(m.id)||!score(m.homeScore)||!score(m.awayScore)||!Number.isFinite(Date.parse(m.date)))continue;
      const mh=Number(m.homeId),ma=Number(m.awayId);
      if(!((mh===h&&ma===a)||(mh===a&&ma===h)))continue;
      found.set(Number(m.id),{id:Number(m.id),date:m.date,home:Number(mh===h?m.homeScore:m.awayScore),away:Number(mh===h?m.awayScore:m.homeScore),overtime:m.overtime===true});
    }
    return [...found.values()].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)||b.id-a.id).slice(0,8);
  }
  function cached(league,home,away){
    const entry=cache.get(Number(league));
    return entry?.rows?select(entry.rows,home,away):null;
  }
  function load(league){
    league=Number(league);
    if(!leagues.has(league))return Promise.resolve();
    if(pending.has(league))return pending.get(league);
    if(cache.get(league)?.until>Date.now())return Promise.resolve();
    const cfg=window.EHOCKEY_CONFIG||{};
    if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)return Promise.resolve();
    const task=(async()=>{
      try{
        const url=String(cfg.supabaseUrl).replace(/\/+$/,"")+"/functions/v1/graphics-schedule?league="+league;
        const response=await fetch(url,{headers:{apikey:cfg.supabasePublishableKey},signal:AbortSignal.timeout(22000)});
        const body=await response.json();
        if(!response.ok||!Array.isArray(body.matches)||body.matches.length>10000)throw Error("Invalid schedule");
        cache.set(league,{rows:body.matches,until:Date.now()+300000});
      }catch{
        cache.set(league,{rows:cache.get(league)?.rows,until:Date.now()+30000});
      }
    })().finally(()=>pending.delete(league));
    pending.set(league,task);
    return task;
  }
  const status=league=>pending.has(Number(league))?2:cache.has(Number(league))?3:1;
  function loadScorers(league,rows){
    const cfg=window.EHOCKEY_CONFIG||{};
    if(!leagues.has(Number(league))||!cfg.supabaseUrl||!cfg.supabasePublishableKey)return Promise.resolve();
    const ids=[...new Set(rows.map(m=>m.id))].filter(id=>positive(id)&&!scorerCache.has(league+":"+id)).slice(0,8).sort((a,b)=>a-b);
    if(!ids.length)return Promise.resolve();
    const key=league+":"+ids.join(",");
    if(scorerPending.has(key))return scorerPending.get(key);
    const task=(async()=>{
      try{
        const url=String(cfg.supabaseUrl).replace(/\/+$/,"")+"/functions/v1/graphics-schedule?league="+league+"&goals="+ids.join(",");
        const response=await fetch(url,{headers:{apikey:cfg.supabasePublishableKey},signal:AbortSignal.timeout(19000)});
        const body=await response.json();
        if(!response.ok||!body.scorers||typeof body.scorers!=="object")return;
        for(const id of ids){
          if(scorerCache.size>=128)scorerCache.delete(scorerCache.keys().next().value);
          scorerCache.set(league+":"+id,body.scorers[id]||null);
        }
      }catch{/* Scores are independent of the optional match details. */}
    })().finally(()=>scorerPending.delete(key));
    scorerPending.set(key,task);
    return task;
  }
  function scorers(league,id,team,goals){
    const entries=scorerCache.get(league+":"+id)?.[team];
    if(!Array.isArray(entries)||entries.length>99||entries.some(x=>!positive(x?.id)||!positive(x?.goals)||typeof x?.name!=="string"||!x.name.trim()||x.name.length>80))return [];
    return entries.reduce((n,x)=>n+Number(x.goals),0)===goals?entries:[];
  }
  function completed(league){
    const rows=cache.get(Number(league))?.rows;
    if(!rows)return null;
    const matches=new Map();
    for(const m of rows){
      if(!m||!["regular","playoffs"].includes(m.stage)||!positive(m.id)||!positive(m.homeId)||!positive(m.awayId)||
         Number(m.homeId)===Number(m.awayId)||!score(m.homeScore)||!score(m.awayScore)||!Number.isFinite(Date.parse(m.date)))continue;
      matches.set(Number(m.id),{...m,id:Number(m.id),homeId:Number(m.homeId),awayId:Number(m.awayId),homeScore:Number(m.homeScore),awayScore:Number(m.awayScore)});
    }
    return [...matches.values()].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)||b.id-a.id);
  }
  function playoffPath(matches,team,currentOpponent){
    if(!positive(team))return [];
    team=Number(team);currentOpponent=Number(currentOpponent);
    const opponents=new Map();
    for(const match of [...matches].reverse()){
      if(match.stage!=="playoffs")continue;
      const home=match.homeId===team, away=match.awayId===team;
      if(!home&&!away)continue;
      const other=home?match.awayId:match.homeId;
      if(other===currentOpponent)continue;
      const row=opponents.get(other)||{id:other,name:home?match.away:match.home,wins:0,losses:0,gf:0,ga:0,games:[]};
      const gf=home?match.homeScore:match.awayScore,ga=home?match.awayScore:match.homeScore;
      row.wins+=Number(gf>ga);row.losses+=Number(gf<ga);
      row.gf+=gf;row.ga+=ga;row.games.push({gf,ga});
      row.last=Date.parse(match.date);opponents.set(other,row);
    }
    return [...opponents.values()].sort((a,b)=>a.last-b.last||a.id-b.id);
  }
  window.BroadcastGroupMeetings={select,cached,completed,playoffPath,load,status,label,loadScorers,scorers,scorerLabel};
})();

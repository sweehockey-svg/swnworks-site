(() => {
  "use strict";
  const leagues=new Set([520,523,524,525,526,527,529,532]), cache=new Map(), pending=new Map();
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
  window.BroadcastGroupMeetings={select,cached,load,status,label};
})();

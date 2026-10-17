/* Session-only graphics data. Never persists player or statistics records. */
(() => {
 'use strict';
 const cache=new Map(),pending=new Map();
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function valid(data,{league,start,end}){
  return data?.schema_version===1&&Number(data.league_id)===Number(league)&&data.weekly?.start===start&&data.weekly?.end===end&&Date.parse(data.expires_at)>Date.now()&&Array.isArray(data.players)&&Array.isArray(data.teams);
 }
 async function call(body){
  const cfg=window.EHOCKEY_CONFIG||{},session=await window.SWNStudioAccess.session();
  if(!session?.access_token)throw new Error('Logga in igen för att hämta från SportsGamer.');
  const response=await fetch(String(cfg.supabaseUrl).replace(/\/+$/,'')+'/functions/v1/graphics-fetch',{method:'POST',headers:{apikey:cfg.supabasePublishableKey||cfg.supabaseAnonKey,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.error||result.message||'Hämtningen misslyckades. Dina tidigare val har behållits.');
  return result;
 }
 async function request(options){
  const {league,start,end,onProgress=()=>{}}=options,key=[league,start,end].join(':');
  const saved=cache.get(key);
  if(saved&&saved.until>Date.now()&&valid(saved.data,options))return saved.data;
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{
   onProgress('Startar hämtning från SportsGamer… Det kan ta någon minut.');
   let result=await call({action:'start',league:Number(league),start,end});
   const id=result.request_id,deadline=Date.now()+12*60*1000;
   if(!id)throw new Error('Hämtningen kunde inte startas. Dina val har behållits.');
   while(Date.now()<deadline){
    onProgress(result.state==='queued'?'Hämtningen köar… behåll sidan öppen.':'Hämtar statistik från SportsGamer…');
    await pause(5000);
    result=await call({action:'status',request_id:id});
    if(result.state==='completed'){
     if(!valid(result.data,options))throw new Error('Resultatet har fel period eller har gått ut. Försök igen.');
     cache.set(key,{data:result.data,until:Date.now()+15*60*1000});
     while(cache.size>4)cache.delete(cache.keys().next().value);
     return result.data;
    }
   }
   throw new Error('Hämtningen tar för lång tid. Försök igen senare. Dina val har behållits.');
  })();
  pending.set(key,task);
  try{return await task;}finally{pending.delete(key);}
 }
 window.GraphicsTransientData={request,valid};
})();

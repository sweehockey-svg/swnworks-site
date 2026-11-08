import {parseScorers} from "./goals.mjs";

const API_KEY = "sb_publishable_-4cV-I1xCAAZrgdcGCljrQ_T7T0YC5z";
const cors = {"Access-Control-Allow-Headers":"apikey, authorization, content-type","Access-Control-Allow-Methods":"GET, OPTIONS"};
type Scorers=ReturnType<typeof parseScorers>;
const scorerCache=new Map<string,{result:Scorers,until:number}>(),scorerPending=new Map<string,Promise<Scorers>>();
function matchScorers(league:string,id:string):Promise<Scorers>{
 const key=league+":"+id,cached=scorerCache.get(key);
 if(cached&&cached.until>Date.now())return Promise.resolve(cached.result);
 const pending=scorerPending.get(key);if(pending)return pending;
 const task=(async()=>{
  let result:Scorers=null;
  try{
   const response=await fetch("https://sportsgamer.gg/matches/"+id,{signal:AbortSignal.timeout(7500),redirect:"error"});
   if(response.ok)result=parseScorers(await response.text(),league);
  }catch{/* Retain the result row even when its report cannot be read. */}
  if(scorerCache.size>=256)scorerCache.delete(scorerCache.keys().next().value!);
  scorerCache.set(key,{result,until:Date.now()+(result?900000:30000)});
  return result;
 })().finally(()=>scorerPending.delete(key));
 scorerPending.set(key,task);
 return task;
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(origin&&!["https://swnworks.se","https://www.swnworks.se","http://localhost:8765","http://127.0.0.1:8765"].includes(origin))return new Response("Forbidden",{status:403});
 const corsHeaders={...cors,...(origin?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{})};
 if(req.method==="OPTIONS")return new Response(null,{headers:corsHeaders});
 const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});
 if(req.headers.get("apikey")!==API_KEY)return json({error:"Unauthorized"},401);
 if(req.method!=="GET")return json({error:"Method not allowed"},405);
 const params=new URL(req.url).searchParams,league=params.get("league")||"527";
 if(!["520","523","524","525","526","527","529","532"].includes(league))return json({error:"Invalid league"},400);
 const goalIds=params.get("goals");
 if(goalIds!==null){
  if(!/^\d{1,9}(?:,\d{1,9}){0,7}$/.test(goalIds))return json({error:"Invalid match IDs"},400);
  const ids=[...new Set(goalIds.split(","))],scorers=[];
  for(let i=0;i<ids.length;i+=4)scorers.push(...await Promise.all(ids.slice(i,i+4).map(async id=>[id,await matchScorers(league,id)])));
  return json({scorers:Object.fromEntries(scorers.filter(([,value])=>value!==null))});
 }
 try{
  const r=await fetch("https://sportsgamer.gg/leagues/"+league+"/schedule?status=all",{signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error("SportsGamer HTTP "+r.status);
  const html=await r.text(),raw=html.match(/data-page="([^"]+)"/)?.[1];
  if(!raw)throw Error("SportsGamer schema kunde inte läsas");
  const page=JSON.parse(raw.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&"));
  const rows=page.props?.matchups;
  if(!Array.isArray(rows))throw Error("SportsGamer schema saknas");
  return json({matches:rows.filter(m=>!m.hidden&&m.result?.reportDate&&m.homeTeam&&m.awayTeam).map(m=>({id:m.result.id,date:m.result.reportDate,home:m.homeTeam.name,away:m.awayTeam.name,homeId:m.homeTeam.id,awayId:m.awayTeam.id,stage:m.type,overtime:m.result.overtime===true,homeScore:m.result.goalsHome,awayScore:m.result.goalsAway})),fetchedAt:new Date().toISOString()});
 }catch(e){return json({error:e instanceof Error?e.message:"Schema kunde inte hämtas"},502)}
});

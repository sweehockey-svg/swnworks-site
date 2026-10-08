const API_KEY = "sb_publishable_-4cV-I1xCAAZrgdcGCljrQ_T7T0YC5z";
const cors = {"Access-Control-Allow-Headers":"apikey, authorization, content-type","Access-Control-Allow-Methods":"GET, OPTIONS"};
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(origin&&!["https://swnworks.se","https://www.swnworks.se","http://localhost:8765","http://127.0.0.1:8765"].includes(origin))return new Response("Forbidden",{status:403});
 const corsHeaders={...cors,...(origin?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{})};
 if(req.method==="OPTIONS")return new Response(null,{headers:corsHeaders});
 const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});
 if(req.headers.get("apikey")!==API_KEY)return json({error:"Unauthorized"},401);
 if(req.method!=="GET")return json({error:"Method not allowed"},405);
 const league=new URL(req.url).searchParams.get("league")||"527";
 if(!["520","523","524","525","526","527","529"].includes(league))return json({error:"Invalid league"},400);
 try{
  const r=await fetch("https://sportsgamer.gg/leagues/"+league+"/schedule?status=all",{signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error("SportsGamer HTTP "+r.status);
  const html=await r.text(),raw=html.match(/data-page="([^"]+)"/)?.[1];
  if(!raw)throw Error("SportsGamer schema kunde inte läsas");
  const page=JSON.parse(raw.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&"));
  const rows=page.props?.matchups;
  if(!Array.isArray(rows))throw Error("SportsGamer schema saknas");
  return json({matches:rows.filter(m=>!m.hidden&&m.result?.reportDate&&m.homeTeam&&m.awayTeam).map(m=>({id:m.result.id,date:m.result.reportDate,home:m.homeTeam.name,away:m.awayTeam.name,homeScore:m.result.goalsHome,awayScore:m.result.goalsAway})),fetchedAt:new Date().toISOString()});
 }catch(e){return json({error:e instanceof Error?e.message:"Schema kunde inte hämtas"},502)}
});

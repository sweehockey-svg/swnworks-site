const channels=new Set(['sec21-bronze-test','broadcast-en','broadcast-fi','broadcast-de']);
const origins=new Set(['https://swnworks.se','https://www.swnworks.se']);
const sides=['home','away'],slots=['LW','C','RW','LD','RD','G'];
const numeric=/^[1-9][0-9]{0,15}$/;
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const shape=x=>record(x)&&Object.keys(x).length===2&&sides.every(side=>record(x[side])&&Object.keys(x[side]).length===slots.length&&slots.every(slot=>typeof x[side][slot]==='string'&&(!x[side][slot]||numeric.test(x[side][slot]))));
const ids=(x,side)=>slots.map(slot=>x[side][slot]).filter(Boolean);

export function validRosterChange(expected,next,data,now=Date.now()){
 if(!shape(expected.baseLineups)||!shape(next)||data?.schema_version!==1||data.league_id!==expected.leagueId||!(Date.parse(data.expires_at)>now)||!Array.isArray(data.players))return false;
 const after=sides.flatMap(side=>ids(next,side));
 if(new Set(after).size!==after.length)return false;
 let incoming=0;
 for(const side of sides){
  const old=ids(expected.baseLineups,side),updated=ids(next,side);
  if(updated.length<old.length)return false;
  const reserves=updated.filter(id=>!old.includes(id));
  incoming+=reserves.length;
  if(reserves.some(id=>!data.players.some(p=>String(p?.sports_gamer_player_id)===id&&String(p.sports_gamer_team_id)===expected[side]&&p.is_current_roster!==false)))return false;
 }
 return incoming>0;
}

export function createHandler({url,serviceKey,anonKey,fetcher=fetch}){
 return async req=>{
  const origin=req.headers.get('origin')||'';
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
  if(origins.has(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info'});
  const json=(status,body)=>new Response(JSON.stringify(body),{status,headers});
  if(origin&&!origins.has(origin))return json(403,{error:'Forbidden origin'});
  if(req.method==='OPTIONS')return json(200,{});
  if(req.method!=='POST')return json(405,{error:'Method not allowed'});
  const bearer=req.headers.get('authorization')||'';
  if(!/^Bearer [\w.-]{20,8192}$/.test(bearer))return json(401,{error:'Sign-in required'});
  if(!url||!serviceKey||!anonKey)return json(503,{error:'Unavailable'});
  const post=(path,body,token,ms=8000,key=serviceKey)=>fetcher(url+path,{method:'POST',headers:{apikey:key,Authorization:token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(ms)});
  let body;
  try{
   const raw=await req.text();
   if(raw.length>6000)return json(400,{error:'Invalid request'});
   body=JSON.parse(raw);
  }catch{return json(400,{error:'Invalid request'});}
  const {p_channel:channel,p_expected:expected}=body??{},next=expected?.lineups;
  if(!channels.has(channel)||!record(expected)||typeof expected.ticket!=='string'||expected.ticket.length>1024||!/^[-\w]+\.[-\w]+$/.test(expected.ticket)||
    !Number.isSafeInteger(expected.leagueId)||!numeric.test(expected.home)||!numeric.test(expected.away)||typeof expected.home!=='string'||typeof expected.away!=='string'||expected.home===expected.away||!shape(expected.baseLineups)||!shape(next))return json(400,{error:'Invalid lineup'});
  try{
   // PostgREST verifies the actual operator JWT and checks the existing channel permissions.
   const access=await post('/rest/v1/rpc/swn_studio_scene_access',{p_channel:channel},bearer,8000,anonKey);
   if(!access.ok||await access.json()!==true)return json(403,{error:'Scene access required'});
   const service='Bearer '+serviceKey;
   const snapshot=await post('/functions/v1/broadcast-data',{ticket:expected.ticket},service,25000);
   if(!snapshot.ok)return json(409,{error:'Refresh the match data'});
   const {data}=await snapshot.json();
   if(!validRosterChange(expected,next,data))return json(422,{error:'Player is not available for this team'});
   const guard=Object.fromEntries(['ticket','leagueId','home','away','matchName','teamOrderRevision','baseLineups'].map(key=>[key,expected[key]??null]));
   const result=await post('/rest/v1/rpc/broadcast_studio_set_verified_lineups',{p_channel:channel,p_expected:guard,p_lineups:next},service);
   if(!result.ok)return json(409,{error:'Match or lineup changed'});
   return json(200,await result.json());
  }catch{return json(503,{error:'Could not confirm the lineup change'});}
 };
}

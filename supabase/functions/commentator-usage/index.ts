import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.1";

const origins=new Set(['https://swnworks.se','https://www.swnworks.se','https://www.svenskehockey.se','https://svenskehockey.se']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const features=new Set(['home','cockpit','match','lines','players','goalies','special','live','story','h2h','studio','notes','ai','account','overview','stats','history']);
Deno.serve(async(req)=>{
 const origin=req.headers.get('Origin')||'';
 const headers={'Access-Control-Allow-Origin':origins.has(origin)?origin:'https://swnworks.se','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Content-Type':'application/json','Cache-Control':'no-store'};
 const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!origins.has(origin))return json({error:'origin_denied'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return json({error:'method_not_allowed'},405);
 if(Number(req.headers.get('Content-Length')||0)>4096)return json({error:'too_large'},413);
 try{
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  if(!token)return json({error:'auth_required'},401);
  const {data:{user},error:authError}=await db.auth.getUser(token);
  if(authError||!user?.email)return json({error:'invalid_session'},401);
  const {data:access,error:accessError}=await db.from('commentator_access').select('role,team_id,league_key').eq('email',user.email.toLowerCase()).eq('active',true);
  if(accessError)return json({error:'access_check_failed'},500);
  if(!access?.length)return json({error:'access_required'},403);
  const isAdmin=access.some(a=>a.role==='admin'&&!a.team_id&&!a.league_key);
  const raw=await req.text();if(raw.length>4096)return json({error:'too_large'},413);
  let body;try{body=JSON.parse(raw);}catch{return json({error:'invalid_json'},400);}
  if(body.action==='report'){
   if(!isAdmin)return json({error:'admin_required'},403);
   const days=Number(body.days??30),selected=body.user_id||null;
   if(!Number.isInteger(days)||days<1||days>90||(selected&&!uuid.test(selected)))return json({error:'invalid_filter'},400);
   if(body.hide_admins!==undefined&&typeof body.hide_admins!=='boolean')return json({error:'invalid_filter'},400);
   const {data,error}=await db.rpc('commentator_usage_report',{p_days:days,p_user:selected,p_hide_admins:body.hide_admins!==false});
   return error?json({error:'report_failed'},500):json({ok:true,...data});
  }
  if(body.action!=='record')return json({error:'unknown_action'},400);
  const {event,league,feature,visit_id}=body,team=body.team_id||null,player=body.player_id||null;
  if(!['page_open','view_open','player_open','active_minute'].includes(event)||!['selector','hockeyettan','hockeytvaan','suomi-sarja','legacy'].includes(league)||!features.has(feature)||!uuid.test(visit_id)||(team&&!uuid.test(team))||(player&&!uuid.test(player)))return json({error:'invalid_event'},400);
  if(!isAdmin&&league!=='selector'&&!access.some(a=>a.league_key===league&&(!team||!a.team_id||a.team_id===team)))return json({error:'scope_denied'},403);
  if(player&&event!=='player_open')return json({error:'invalid_player_event'},400);
  const {error}=await db.rpc('commentator_record_usage',{p_owner:user.id,p_event:event,p_league:league,p_feature:feature,p_team:team,p_player:player,p_visit:visit_id});
  return error?json({error:'record_failed'},500):json({ok:true});
 }catch{return json({error:'request_failed'},500);}
});

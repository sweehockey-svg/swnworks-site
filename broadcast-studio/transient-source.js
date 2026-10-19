/* Temporary sports data: only the signed reference belongs in broadcast state.
   Player rows stay in memory; OBS never needs an administrator session. */
(() => {
 'use strict';
 const leagues=new Set([520,523,524,525,526,527,529,532]),cache=new Map(),pending=new Map();
 function reference(ref,league){
  if(!ref||!leagues.has(Number(league))||Number(ref.league_id)!==Number(league)||typeof ref.ticket!=='string'||ref.ticket.length>1024||!/^[-\w]+\.[-\w]+$/.test(ref.ticket)||!Number.isFinite(Date.parse(ref.expires_at)))return null;
  return {league_id:Number(league),ticket:ref.ticket,expires_at:ref.expires_at};
 }
 function validData(data,league){
  return data?.schema_version===1&&Number(data.league_id)===Number(league)&&Number.isFinite(Date.parse(data.fetched_at))&&Date.parse(data.expires_at)>Date.now()&&Array.isArray(data.teams)&&Array.isArray(data.players)&&data.teams.length<=10000&&data.players.length<=20000&&[...data.teams,...data.players].every(p=>Number(p.sports_gamer_league_id)===Number(league)&&Number(p.sports_gamer_team_id)>0&&typeof p.team_name_in_league==='string')&&data.players.every(p=>Number(p.sports_gamer_player_id)>0&&typeof p.display_gamertag==='string');
 }
 async function read(ref){
  if(Date.parse(ref.expires_at)<=Date.now())throw Error('Underlaget har gått ut. Hämta igen i Broadcast Studio.');
  const saved=cache.get(ref.ticket);if(saved&&saved.until>Date.now()&&validData(saved.data,ref.league_id))return saved.data;
  if(pending.has(ref.ticket))return pending.get(ref.ticket);
  const task=(async()=>{
   const cfg=window.EHOCKEY_CONFIG||{};
   const response=await fetch(String(cfg.supabaseUrl).replace(/\/+$/,'')+'/functions/v1/broadcast-data',{method:'POST',headers:{apikey:cfg.supabasePublishableKey||cfg.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify({ticket:ref.ticket}),signal:AbortSignal.timeout(45000),cache:'no-store'});
   const body=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(body.error||'Kunde inte läsa tillfälligt sändningsunderlag.');
   if(!validData(body.data,ref.league_id)||body.data.expires_at!==ref.expires_at)throw Error('Sändningsunderlaget har fel liga eller har gått ut.');
   const data=await window.GraphicsTransientData.withPortraits(body.data);
   cache.set(ref.ticket,{data,until:Date.now()+15*60*1000});while(cache.size>4)cache.delete(cache.keys().next().value);
   return data;
  })();pending.set(ref.ticket,task);try{return await task;}finally{pending.delete(ref.ticket);}
 }
 function create({getLeague,onData,onStatus=()=>{},onLegacy=()=>{},allowRemote=true}){
  let generation=0,lastTicket='',lastLeague=null,waiting=null,expiryTimer=null;
  const sessionTickets=new Set();
  function reset(){generation++;lastTicket='';lastLeague=null;waiting=null;clearTimeout(expiryTimer);expiryTimer=null;sessionTickets.clear();window.GraphicsTransientData?.clear?.();}
  function clear(){lastTicket='';lastLeague=null;clearTimeout(expiryTimer);expiryTimer=null;onLegacy();}
  function install(data,ref,seq){
   if(seq!==generation||Number(getLeague())!==ref.league_id||Date.parse(ref.expires_at)<=Date.now())return false;
   onData(data,ref);lastTicket=ref.ticket;lastLeague=ref.league_id;clearTimeout(expiryTimer);
   expiryTimer=setTimeout(()=>{if(seq===generation){onStatus('Varning: underlaget har gått ut. Visningen ligger kvar. Hämta från SportsGamer innan nästa sändning.');}},Math.max(1,Date.parse(ref.expires_at)-Date.now()+1));
   onStatus('Hämtat från SportsGamer: '+new Date(data.fetched_at).toLocaleString('sv-SE',{timeZone:'Europe/Stockholm',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'. Giltigt till '+new Date(ref.expires_at).toLocaleTimeString('sv-SE',{timeZone:'Europe/Stockholm',hour:'2-digit',minute:'2-digit'})+' (upp till 8 timmar).');
   return true;
  }
  async function receive(raw){
   if(raw===null){reset();onLegacy();return false;}
   const league=Number(getLeague()),ref=reference(raw,league);
   if(!ref||Date.parse(ref.expires_at)<=Date.now()||(!allowRemote&&!sessionTickets.has(ref.ticket))){generation++;clear();onStatus('Ingen aktuell statistik i denna session. Hämta från SportsGamer.');return false;}
   if(lastTicket===ref.ticket&&lastLeague===league)return true;
   if(waiting?.ticket===ref.ticket)return waiting.promise;
   const seq=++generation;clear();
   const task=(async()=>{try{
    onStatus('Läser tillfälligt sändningsunderlag…');const data=await read(ref);
    return install(data,ref,seq);
   }catch(error){if(seq===generation){clear();onStatus(error.message+' Ingen statistik visas.');}return false;}})();
   waiting={ticket:ref.ticket,promise:task};try{return await task;}finally{if(waiting?.promise===task)waiting=null;}
  }
  async function refresh(){
   const league=Number(getLeague()),seq=++generation;clear();sessionTickets.clear();window.GraphicsTransientData?.clear?.();
   const end=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),startDate=new Date(end+'T12:00:00Z');startDate.setUTCDate(startDate.getUTCDate()-6);
   try{
    const payload=await window.GraphicsTransientData.request({league,start:startDate.toISOString().slice(0,10),end,fresh:true,onProgress:message=>{if(seq===generation&&Number(getLeague())===league)onStatus(message);}});
    if(seq!==generation||Number(getLeague())!==league)return false;
    const ref=reference({league_id:league,ticket:payload.broadcast_ticket,expires_at:payload.broadcast_expires_at||payload.expires_at},league);
    if(!ref||!validData(payload,league))throw Error('Underlaget saknar giltig koppling till OBS. Försök igen.');
    const data=await window.GraphicsTransientData.withPortraits({...payload,expires_at:ref.expires_at});
    if(!install(data,ref,seq))return false;
    sessionTickets.add(ref.ticket);return true;
   }catch(error){if(seq===generation){clear();onStatus(error.message+' Ingen statistik visas.');}return false;}
  }
  return {receive,refresh,reset};
 }
 window.BroadcastTransientSource={create,reference,validData,read};
})();

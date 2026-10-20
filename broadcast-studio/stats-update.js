/* Two-phase statistics refresh. Only the signed source reference is published.
   A conditional write protects concurrent scene/audio/score edits. */
(() => {
 'use strict';
 const identity=s=>JSON.stringify([Number(s?.leagueId),String(s?.home||''),String(s?.away||''),String(s?.transientSource?.ticket||'')]);
 const controls=s=>{const {transientSource,...rest}=s||{};return JSON.stringify(rest);};
 async function publish({channel,expected,reference,data,isCurrent=()=>true}){
  const cfg=window.EHOCKEY_CONFIG||{},session=await window.SWNStudioAccess?.session();
  if(!session?.access_token)throw Error('Logga in igen. Ingen uppdatering skickades.');
  const url=String(cfg.supabaseUrl).replace(/\/+$/,'')+'/rest/v1/broadcast_studio_state?channel=eq.'+encodeURIComponent(channel);
  const headers={apikey:cfg.supabasePublishableKey,Authorization:'Bearer '+session.access_token,Accept:'application/json','Content-Type':'application/json'};
  const request=async(suffix='',options={})=>{
   const res=await fetch(url+suffix,{headers,cache:'no-store',signal:AbortSignal.timeout(15000),...options});
   if(!res.ok)throw Error('Kontaktfel ('+res.status+'). Kontrollera anslutningen innan du försöker igen.');
   return res.json();
  };
  for(let attempt=0;attempt<3;attempt++){
   const row=(await request('&select=state,updated_at'))?.[0];
   if(!isCurrent()||!row?.updated_at||identity(row.state)!==identity(expected))throw Error('Matchen eller underlaget i sändning har ändrats. Hämta och granska på nytt.');
   if(!window.BroadcastTransientSource.reference(reference,expected.leagueId)||Date.parse(reference.expires_at)<=Date.now())throw Error('Det nya underlaget har gått ut. Hämta igen.');
   if(data)for(const side of ['home','away'])for(const id of Object.values(row.state.lineups?.[side]||{})){
    if(id&&!data.players.some(p=>String(p.sports_gamer_team_id)===String(row.state[side])&&String(p.sports_gamer_player_id)===String(id)))throw Error('En spelare i sändningens lineup saknas i det nya underlaget. Tidigare data behålls.');
   }
   const state={...row.state,transientSource:reference};
   let result;
   try{
    result=await request('&updated_at=eq.'+encodeURIComponent(row.updated_at)+'&select=state,updated_at',{
     method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify({state,updated_at:new Date().toISOString()})
    });
   }catch(error){
    // A lost response may follow a successful commit: check, never blindly retry.
    const latest=(await request('&select=state,updated_at'))?.[0];
    if(latest?.state?.transientSource?.ticket===reference.ticket)return latest.state;
    throw error;
   }
   if(result?.[0]?.state)return result[0].state;
  }
  throw Error('Sändningen ändrades samtidigt. Ingen statistikuppdatering bekräftad; försök igen.');
 }
 function mount({anchor,provider,getContext,channel,onPublished}){
  const box=document.createElement('section');box.className='stats-refresh';
  box.innerHTML='<h3>STATISTIK & TABELL · SÄKER UPPDATERING</h3><p>Hämta i bakgrunden och granska här. Sändningen ändras först när du godkänner. Scen, resultat, laguppställning, bild och ljud behålls.</p><button type="button" data-fetch>Uppdatera statistik & tabell</button><p data-status role="status" aria-live="polite">Ingen uppdatering väntar.</p><details hidden data-review><summary>Granska nytt underlag</summary><div data-content></div></details><button type="button" data-apply disabled>Använd uppdaterad statistik i sändning</button><button type="button" data-discard hidden>Kasta uppdateringen</button>';
  anchor.after(box);
  const fetchButton=box.querySelector('[data-fetch]'),apply=box.querySelector('[data-apply]'),discard=box.querySelector('[data-discard]'),message=box.querySelector('[data-status]'),review=box.querySelector('[data-review]'),content=box.querySelector('[data-content]');
  let pending=null,busy=false;
  const time=value=>new Date(value).toLocaleString('sv-SE',{timeZone:'Europe/Stockholm',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const matches=()=>pending&&identity(getContext().state)===identity(pending.context.state)&&providerGenerationValid();
  const providerGenerationValid=()=>pending&&Date.parse(pending.prepared.reference.expires_at)>Date.now();
  function clear(){pending=null;apply.disabled=true;discard.hidden=true;review.hidden=true;content.replaceChildren();}
  function row(text,parent=content){const el=document.createElement('p');el.textContent=text;parent.append(el);}
  function show(prepared,context){
   content.replaceChildren();
   const before=context.payload||{},after=prepared.data;
   row('Nuvarande: '+(before.fetched_at?time(before.fetched_at):'okänd hämtningstid')+' → Nytt: '+time(after.fetched_at));
   row(after.teams.length+' lagrader · '+after.players.length+' spelarrader. Tabellunderlag från SportsGamer, inte en beräknad livetabell.');
   const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Tabellunderlag – nya värden (grupp, GP, W, L, GD, PTS)';details.append(summary);content.append(details);
   after.teams.filter(t=>t.statistics_stage==='regular').sort((a,b)=>(Number(a.effective_group_id)||0)-(Number(b.effective_group_id)||0)||(Number(b.table_points)||0)-(Number(a.table_points)||0)).forEach(t=>row(t.team_name_in_league+' · grupp '+(t.effective_group_id??'–')+' · '+[t.games_played,t.total_wins,t.losses,t.goal_difference,t.table_points].map(v=>v??'–').join(' / '),details));
   const selected=new Set([String(context.state.home),String(context.state.away)]);
   const players=document.createElement('details'),ps=document.createElement('summary');ps.textContent='Spelare i valda lag – nya gruppspelsvärden';players.append(ps);content.append(players);
   after.players.filter(p=>selected.has(String(p.sports_gamer_team_id))).forEach(p=>row(p.display_gamertag+' · GP '+(p.regular_skater_games??p.regular_goalie_games??'–')+' · G '+(p.regular_goals??'–')+' · A '+(p.regular_assists??'–')+' · P '+(p.regular_points??'–')+' · SV '+(p.regular_goalie_save_percentage??'–')+' · GAA '+(p.regular_goalie_goals_against_average??'–'),players));
   review.hidden=false;review.open=true;discard.hidden=false;apply.disabled=false;
  }
  fetchButton.addEventListener('click',async()=>{
   if(busy)return;
   const context=getContext();
   if(!context.state?.transientSource||!context.state.home||!context.state.away){message.textContent='Förbered och hämta matchen med Hämta från SportsGamer först.';return;}
   busy=true;clear();fetchButton.disabled=true;message.textContent='Hämtar nytt underlag. Sändningen fortsätter oförändrad…';
   try{
    const prepared=await provider.prepare(text=>message.textContent=text+' Sändningen är oförändrad.');
    if(identity(getContext().state)!==identity(context.state))throw Error('Matchvalet eller underlaget ändrades. Hämta igen.');
    const ids=new Set(prepared.data.teams.map(t=>String(t.sports_gamer_team_id)));
    if(!ids.has(String(context.state.home))||!ids.has(String(context.state.away)))throw Error('Det nya underlaget saknar något av matchens lag. Tidigare data behålls.');
    for(const side of ['home','away'])for(const id of Object.values(context.state.lineups?.[side]||{})){
     if(id&&!prepared.data.players.some(p=>String(p.sports_gamer_team_id)===String(context.state[side])&&String(p.sports_gamer_player_id)===String(id)))throw Error('En vald lineupspelare saknas i nya underlaget. Tidigare data behålls.');
    }
    pending={prepared,context};show(prepared,context);message.textContent='Nytt underlag klart '+time(prepared.data.fetched_at)+'. Granska och godkänn – ännu inte i sändning.';
   }catch(error){clear();message.textContent=error.message+' Befintlig statistik och tabell ligger kvar.';}
   finally{busy=false;fetchButton.disabled=false;}
  });
  discard.addEventListener('click',()=>{if(!busy){clear();message.textContent='Uppdateringen kastad. Sändningen är oförändrad.';}});
  apply.addEventListener('click',async()=>{
   if(busy||!pending)return;
   if(!matches()){clear();message.textContent='Matchen ändrades eller underlaget gick ut. Hämta på nytt.';return;}
   busy=true;apply.disabled=true;fetchButton.disabled=true;discard.disabled=true;
   const candidate=pending;message.textContent='Bekräftar statistikuppdatering…';
   try{
    const state=await publish({channel,expected:candidate.context.state,reference:candidate.prepared.reference,data:candidate.prepared.data,isCurrent:()=>matches()});
    if(matches())onPublished(candidate.prepared,state);
    clear();message.textContent='Statistik & tabell skickade till sändning. Hämtat '+time(candidate.prepared.data.fetched_at)+'. '+(state.publicNoMatch?'Vänteskärmen ligger kvar. ':'')+'Scen, resultat, bild och ljud har inte ändrats av uppdateringen.';
   }catch(error){message.textContent=error.message+' Kontrollera sändningsvyn innan du försöker igen.';apply.disabled=!matches();}
   finally{busy=false;fetchButton.disabled=false;discard.disabled=false;}
  });
  return {element:box};
 }
 window.BroadcastStatsUpdate={identity,controls,publish,mount};
})();

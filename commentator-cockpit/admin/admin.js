(() => {
 'use strict';
 const cfg=window.COMMENTATOR_CONFIG,db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
 const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const time=v=>v?new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',dateStyle:'short',timeStyle:'short'}).format(new Date(v)):'Ingen registrerad';
 const names={home:'Ligaöversikt',cockpit:'Lagcockpit',match:'Match',lines:'Laguppställningar',players:'Spelarstatistik',goalies:'Målvakter',special:'PP/BP',live:'Live',story:'Story',h2h:'Inbördes möten',studio:'Studio',notes:'Anteckningar',ai:'AI',account:'Konto',overview:'Spelaröversikt',stats:'Spelarstatistik',history:'Spelarhistorik'};
 let generation=0,busy=false;
 function locked(message,login=false){for(const id of ['users','features','logins','timeline','metrics'])$(id).replaceChildren();$('dashboard').hidden=true;$('gate').hidden=false;$('gate').innerHTML='<h2>'+esc(message)+'</h2>'+(login?'<p>Logga in med ditt godkända adminkonto.</p><form id="login"><input id="email" type="email" autocomplete="email" required placeholder="Din e-post"><button>Skicka inloggningslänk</button></form><p id="loginStatus" role="status"></p>':'<p>Endast aktiva globala administratörer har åtkomst.</p>');
  $('login')?.addEventListener('submit',async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button');button.disabled=true;const {error}=await db.auth.signInWithOtp({email:$('email').value.trim(),options:{emailRedirectTo:location.origin+location.pathname}});$('loginStatus').textContent=error?'Kunde inte skicka länken. Försök igen.':'Inloggningslänk skickad.';button.disabled=false;});
 }
 function render(data){
  const all=data.users||[],selected=$('person').value,people=all.filter(u=>!selected||u.user_id===selected),name=id=>all.find(u=>u.user_id===id)?.display_name||all.find(u=>u.user_id===id)?.email||'Okänt konto';
  const option=selected;$('person').innerHTML='<option value="">Alla personer</option>'+all.filter(u=>u.user_id).map(u=>'<option value="'+esc(u.user_id)+'">'+esc(u.display_name||u.email)+'</option>').join('');$('person').value=option;
  const total=key=>people.reduce((s,u)=>s+Number(u.usage?.[key]||0),0);
  $('metrics').innerHTML=[[people.length,'Tillagda personer'],[people.filter(u=>u.usage?.last_seen).length,'Med uppmätt aktivitet'],[total('view_opens'),'Öppnade funktionsvyer'],[total('player_opens'),'Öppnade spelarkort']].map(([n,label])=>'<div class="metric"><strong>'+n+'</strong><span>'+label+'</span></div>').join('');
  $('users').innerHTML=people.map(u=>{const counts=Object.fromEntries((u.saved||[]).map(s=>[s.kind,s.total]));return '<tr><td><strong>'+esc(u.display_name||u.email)+'</strong><small>'+esc(u.email)+(u.is_admin?' · Admin':'')+(!u.active?' · Avstängd':'')+'</small></td><td>'+time(u.last_sign_in_at)+'</td><td>'+time(u.usage?.last_seen)+'</td><td>'+(u.usage?.page_opens||0)+'</td><td>'+(u.usage?.view_opens||0)+' / '+(u.usage?.player_opens||0)+'</td><td>'+(u.usage?.active_minutes||0)+'</td><td>'+Number(counts.notes||0)+' anteckningar<small>'+Number(counts.lineups||0)+' laguppställningar · '+Number(counts.history||0)+' historikrader · '+Number(counts.ai||0)+' AI-anrop</small></td></tr>';}).join('');
  $('features').innerHTML=(data.features||[]).map(f=>'<div class="bar"><span>'+esc(names[f.feature]||f.feature)+(f.event==='player_open'?' · spelarkort':'')+'</span><strong>'+Number(f.total)+'</strong></div>').join('')||'<p class="hint">Inga uppmätta öppningar i perioden.</p>';
  $('logins').innerHTML=(data.logins||[]).map(l=>'<div class="entry"><strong>'+esc(name(l.user_id))+'</strong><small>'+time(l.created_at)+'</small></div>').join('')||'<p class="hint">Inga kvarvarande inloggningssessioner i perioden.</p>';
  const verbs={page_open:'Öppnade',view_open:'Öppnade vy',player_open:'Öppnade spelarkort',active_minute:'Aktiv mätminut'};
  $('timeline').innerHTML=(data.timeline||[]).map(e=>'<div class="entry"><strong>'+esc(name(e.owner_id))+'</strong> · '+esc(verbs[e.event])+' · '+esc(names[e.feature]||e.feature)+(e.player_name?' · '+esc(e.player_name):'')+'<small>'+time(e.created_at)+' · '+esc(e.league_key)+(e.team_name?' · '+esc(e.team_name):'')+'</small></div>').join('')||'<p class="hint">Ingen uppmätt aktivitet i perioden.</p>';
  $('timelineHint').textContent='Visar de senaste '+(data.timeline||[]).length+' av '+data.timeline_total+' händelser. Mätningens första sparade händelse: '+time(data.tracking_started_at)+'. Alla tider är svensk tid.';
  $('updated').textContent='Uppdaterat '+time(data.generated_at);$('gate').hidden=true;$('dashboard').hidden=false;
 }
 async function load(){
  const request=++generation;busy=true;$('refresh').disabled=true;
  const {data:{session}}=await db.auth.getSession();
  if(!session){locked('Logga in för att se användningen',true);busy=false;$('refresh').disabled=false;return;}
  try{const {data,error}=await db.functions.invoke('commentator-usage',{body:{action:'report',days:Number($('days').value),user_id:$('person').value||null,hide_admins:$('hideAdmins').checked}});if(request!==generation)return;if(error||!data?.ok){locked('Kunde inte öppna adminvyn. Kontrollera att kontot har adminbehörighet.');return;}render(data);}catch{if(request===generation)locked('Kunde inte hämta användningen. Försök igen.');}finally{if(request===generation){busy=false;$('refresh').disabled=false;}}
 }
 $('refresh').addEventListener('click',load);$('days').addEventListener('change',load);$('person').addEventListener('change',load);
 $('hideAdmins').addEventListener('change',()=>{$('person').value='';void load();});
 db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){++generation;locked('Logga in för att se användningen',true);}else if(event==='SIGNED_IN'&&!busy)setTimeout(load,0);});
 void load();
})();

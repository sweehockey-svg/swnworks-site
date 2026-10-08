(() => {
  'use strict';
  if(new URLSearchParams(location.search).get('obs')==='1')return;
  const preview=new URLSearchParams(location.search).get('preview')==='1';
  const key='seh-match-desk-sv-v1'+(preview?'-preview':'');
  let matches=[],active='',onAir='',noMatch=true;
  try{const saved=JSON.parse(localStorage.getItem(key)||'{}');matches=Array.isArray(saved.matches)?saved.matches:[];}catch{}
  const desk=document.createElement('div');desk.className='match-desk block';
  desk.innerHTML='<h3>MATCH & STREAM</h3><p>Välj stream här, ladda videon och spara den tillsammans med matchen. Lag, resultat och grafik ställs in ovan.</p><label>MATCHNAMN<input id="deskName" placeholder="T.ex. Västerås – Burchurs"></label><details class="desk-alternatives"><summary>Alternativa Twitch-kanaler · valfritt</summary><label>EN KANAL PER RAD<textarea id="deskStreams" rows="3" placeholder="bortalagets_kanal"></textarea></label><small>Lägg till fler vinklar här. Huvudkanalen ovan sparas automatiskt med matchen.</small></details><div class="desk-actions"><button id="deskSave">Spara som ny match</button><button id="deskUpdate">Uppdatera vald match</button><button id="deskIdle">Ingen match just nu</button></div><p id="deskMessage" role="status"></p><div id="deskMatches"></div><small>Listan sparas i den här webbläsaren. Resultat för övriga matcher uppdateras manuellt. Byte skickas till Match-TV.</small>';
  document.querySelector('.stream-dock')?.prepend(desk);
  const source=document.createElement('section');source.className='desk-live-source';
  const dock=document.querySelector('.stream-dock');
  for(const selector of ['.dock-head','.stream-controls','.control-note','#streamStatus']){
    const node=dock?.querySelector(selector);if(node)source.append(node);
  }
  const heading=source.querySelector('.dock-head');
  if(heading){heading.innerHTML='<strong>Stream i förhandsvisning</strong><small>Förbered Twitch eller direktvideo här. Visa i sändning byter utgående match.</small>';}
  desk.querySelector('.desk-alternatives')?.before(source);

  const quick=document.createElement('section');quick.className='match-desk quick-match-bar';
  quick.innerHTML='<h3>SÄNDNING · MATCHVAL</h3><p id="deskOnAir" role="status">Förbered en match och klicka Visa i sändning när den ska visas.</p><button id="deskTake" type="button">Visa förberedd match i sändning</button>';
  document.querySelector('.director-monitors')?.before(quick);
  quick.append(document.getElementById('deskMatches'),document.getElementById('deskIdle'),document.getElementById('deskMessage'));
  const nextControls=document.createElement('div');nextControls.className='next-controls match-desk';
  nextControls.innerHTML='<h3>NÄSTA MATCH · ENDAST MATCH-TV</h3><label>HEMMALAG<select id="nextHome"></select></label><label>BORTALAG<select id="nextAway"></select></label><label>DATUM<input id="nextDate" type="date" required></label><label>STARTTID · SVENSK TID<input id="nextTime" type="time" required></label><button id="deskNext">Visa Nästa match på Match-TV</button><p>Preview fortsätter vara fritt att ändra. Detta startar inte sändningen automatiskt.</p>';
  document.querySelector('.stream-dock')?.append(nextControls);
  const get=id=>document.getElementById(id);
  const picker=document.createElement('section');picker.className='block match-desk saved-match-picker';
  picker.innerHTML='<h3>SPARADE MATCHER</h3><label>FÖRBERED MATCH<select id="deskMatchSelect"><option value="">Ny match</option></select></label><button id="deskNewMatch" type="button">Förbered ny match</button><small>Valet här ändrar bara förhandsvisningen. Matchen i sändning ligger kvar tills du klickar Visa i sändning.</small>';
  document.querySelector('.theme-control')?.after(picker);
  const selectMatch=m=>{
    remember();active=m.id;get('deskName').value=m.name;get('deskStreams').value=m.streams.join('\n');
    m.state={...m.state,matchName:m.name};window.__sehStudioRestore(m.state);persist();render();get('deskMessage').textContent='Redigerar '+m.name+'. Sändningen påverkas inte.';
  };
  const newMatch=()=>{
    window.__sehStudioHoldOutput();remember();persist();active='';get('deskName').value='';get('deskStreams').value='';
    render();get('deskMessage').textContent='Ny match: ställ in lag, namn och stream. Klicka sedan Spara som ny match.';
    get('deskName').focus();
  };
  get('deskMatchSelect').onchange=()=>{const m=matches.find(m=>m.id===get('deskMatchSelect').value);if(m)selectMatch(m);else newMatch();};
  get('deskNewMatch').onclick=newMatch;

  const fillTeams=()=>['Home','Away'].forEach(side=>{const select=get('next'+side),value=select.value||get(side.toLowerCase()).value;select.replaceChildren(...[...get(side.toLowerCase()).options].map(o=>new Option(o.text,o.value)));select.value=value;});
  nextControls.addEventListener('focusin',e=>{if(e.target.tagName==='SELECT')fillTeams();});
  fillTeams();
  get('deskNext').onclick=()=>{
    fillTeams();
    if(!get('nextDate').value||!get('nextTime').value){get('deskMessage').textContent='Välj datum och starttid först.';return;}
    if(!get('nextHome').value||!get('nextAway').value||get('nextHome').value===get('nextAway').value){get('deskMessage').textContent='Välj två olika lag.';return;}
    const next={home:get('nextHome').value,away:get('nextAway').value,date:get('nextDate').value,time:get('nextTime').value};
    window.__sehStudioNext(next);noMatch=true;updateIdle();get('deskIdle').textContent='Nästa match · PÅ – klicka för att visa preview';get('deskMessage').textContent='Match-TV visar nästa match '+next.date+' kl. '+next.time+'. Preview påverkas inte.';
  };
  const persist=()=>{try{localStorage.setItem(key,JSON.stringify({matches}));}catch{get('deskMessage').textContent='Webbläsaren kunde inte spara matchlistan.';}};
  const remember=()=>{const m=matches.find(m=>m.id===active);if(m)m.state=window.__sehStudioSnapshot();};
  const render=()=>{
    const select=get('deskMatchSelect');select.replaceChildren(new Option('Ny match', ''));
    matches.forEach((m,i)=>select.add(new Option('Match '+(i+1)+' · '+m.name,m.id)));
    select.value=active;
    get('deskMatches').replaceChildren();
    matches.forEach(m=>{
      const row=document.createElement('div');row.className='desk-match'+(active===m.id?' selected':'');
      const title=document.createElement('strong');title.textContent=(onAir===m.id?'I SÄNDNING · ':'')+m.name+' · '+(m.state.hs||0)+'–'+(m.state.as||0);row.append(title);
      const choose=document.createElement('button');choose.textContent=active===m.id?'Redigeras':'Redigera';choose.onclick=()=>{
        selectMatch(m);
      };row.append(choose);
      const take=document.createElement('button');take.textContent='Visa i sändning';take.onclick=()=>takeMatch(m);row.append(take);
      m.streams.forEach(channel=>{const btn=document.createElement('button');btn.textContent='Visa '+channel;btn.onclick=()=>{
        takeMatch(m,channel);
      };row.append(btn);});
      const remove=document.createElement('button');remove.type='button';remove.className='desk-remove';remove.textContent='Ta bort';remove.setAttribute('aria-label','Ta bort matchen '+m.name);
      remove.onclick=()=>{
        if(!window.confirm('Ta bort den sparade matchen ”'+m.name+'”? Detta tar bara bort matchen från din bevakningslista.'))return;
        const wasActive=active===m.id,wasOnAir=onAir===m.id;
        matches=matches.filter(match=>match.id!==m.id);
        if(wasActive){active='';get('deskName').value='';get('deskStreams').value='';}
        if(wasOnAir){onAir='';noMatch=true;window.__sehStudioIdle(true);updateIdle();}
        persist();render();get('deskMessage').textContent='Tog bort '+m.name+(wasOnAir?'. Match-TV visar Ingen match just nu. Preview är kvar.':'.');
      };row.append(remove);get('deskMatches').append(row);
    });get('deskUpdate').disabled=!active;
  };
  const takeMatch=(m,channel)=>{
    remember();active=m.id;onAir=m.id;
    get('deskName').value=m.name;get('deskStreams').value=m.streams.join('\n');
    const state={...m.state,matchName:m.name};
    if(channel)Object.assign(state,{videoSource:'twitch',twitchChannel:channel,twitchShow:true,scene:'live'});
    window.__sehStudioTake(state);noMatch=false;updateIdle();persist();render();
    get('deskOnAir').textContent='I sändning: '+m.name+(channel?' · '+channel:'');
    get('deskMessage').textContent='Sändningen har bytt till '+m.name+'.';
  };
  get('deskTake').onclick=()=>{
    remember();onAir=active;
    const name=get('deskName').value.trim()||matches.find(m=>m.id===active)?.name||'Aktuell match';
    window.__sehStudioTake({...window.__sehStudioSnapshot(),matchName:name});
    noMatch=false;updateIdle();persist();render();
    get('deskOnAir').textContent='I sändning: '+name;
    get('deskMessage').textContent='Förberedd match visas nu i sändningen.';
  };
  const save=update=>{
    const name=get('deskName').value.trim(),raw=[...(get('videoSource')?.value==='twitch'?[get('twitchChannel').value]:[]),...get('deskStreams').value.split(/\n|,/)].map(s=>s.trim()).filter(Boolean);
    if(!name){get('deskMessage').textContent='Ange ett matchnamn.';return;}
    const streams=[];
    for(let channel of raw){if(/^https?:\/\//i.test(channel)){try{const u=new URL(channel);if(!/^(www\.)?twitch\.tv$/i.test(u.hostname))throw Error();channel=u.pathname.split('/').filter(Boolean)[0]||'';}catch{get('deskMessage').textContent='Ange Twitch-kanaler eller Twitch-länkar.';return;}}channel=channel.replace(/^@/,'');if(!/^[a-z0-9_]{1,25}$/i.test(channel)){get('deskMessage').textContent='Ogiltig Twitch-kanal: '+channel;return;}if(!streams.includes(channel.toLowerCase()))streams.push(channel.toLowerCase());}
    let m=update?matches.find(m=>m.id===active):null;
    if(update&&!m)return;
    if(!m){m={id:crypto.randomUUID()};matches.push(m);}
    Object.assign(m,{name,streams,state:{...window.__sehStudioSnapshot(),matchName:name}});active=m.id;window.__sehStudioRestore(m.state);persist();render();get('deskMessage').textContent='Sparat '+name;
  };
  get('deskSave').onclick=()=>save(false);get('deskUpdate').onclick=()=>save(true);
  const updateIdle=()=>{get('deskIdle').setAttribute('aria-pressed',String(noMatch));get('deskIdle').textContent=noMatch?'Ingen match just nu · PÅ – klicka för att återgå till sändning':'Ingen match just nu · AV';};
  get('deskIdle').onclick=()=>{noMatch=window.__sehStudioIdle(!noMatch);updateIdle();get('deskMessage').textContent=noMatch?'Match-TV visar vänteskärmen. Preview kan ändras som vanligt.':'Match-TV visar nu sändningen igen.';};
  window.addEventListener('seh:program-status',event=>{noMatch=!!event.detail.publicNoMatch;updateIdle();get('deskOnAir').textContent=noMatch?'Match-TV visar vänteskärm.':'I sändning: '+(event.detail.matchName||'Pågående match');});
  updateIdle();
  render();
})();


  const NW_TZ = 'Europe/Stockholm';
  const NW_MEDIA_IMAGE = 'https://image.tmdb.org/t/p/w342';
  const NW_SPORT_SOURCES = [
    { id:'pl', name:'Premier League', sport:'Fotboll', emoji:'⚽', url:'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard', channel:'Viaplay / Prime Video' },
    { id:'championship', name:'Championship', sport:'Fotboll', emoji:'⚽', url:'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.2/scoreboard', channel:'Viaplay' },
    { id:'allsvenskan', name:'Allsvenskan', sport:'Fotboll', emoji:'⚽', url:'https://site.api.espn.com/apis/site/v2/sports/soccer/swe.1/scoreboard', channel:'TV4 Play' },
    { id:'bundesliga', name:'Bundesliga', sport:'Fotboll', emoji:'⚽', url:'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard', channel:'Viaplay' },
    { id:'laliga', name:'La Liga', sport:'Fotboll', emoji:'⚽', url:'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard', channel:'Disney+' },
    { id:'seriea', name:'Serie A', sport:'Fotboll', emoji:'⚽', url:'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard', channel:'TV4 Play' },
    { id:'ucl', name:'Champions League', sport:'Fotboll', emoji:'⚽', url:'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard', channel:'TV4 Play' },
    { id:'nba', name:'NBA', sport:'Basket', emoji:'🏀', url:'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard', channel:'Disney+ / NBA League Pass' },
    { id:'nfl', name:'NFL', sport:'Amerikansk fotboll', emoji:'🏈', url:'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', channel:'DAZN / Disney+' },
    { id:'nhl', name:'NHL', sport:'Ishockey', emoji:'🏒', url:'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard', channel:'Viaplay / Disney+' },
    { id:'f1', name:'Formel 1', sport:'Motorsport', emoji:'🏎️', url:'https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard', channel:'Viaplay / V Sport Motor', kind:'race' }
  ];
  const NW_sportById = new Map(NW_SPORT_SOURCES.map(source => [source.id,source]));
  const NW_teamCatalog = [];
  const NW_leagueScheduleCache = new Map();
  const NW_teamScheduleCache = new Map();
  const NW_actionRegistry = new Map();
  let NW_currentTab = 'vecka';
  let NW_searchTimer = null;
  let NW_drag = null;
  let NW_favorites = JSON.parse(localStorage.getItem('nextweek_favorites_v2') || '[]');

  function nwSaveFavorites(){ localStorage.setItem('nextweek_favorites_v2',JSON.stringify(NW_favorites)); }
  function nwEsc(v){ return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
  function nwDateKey(value){
    const d=value instanceof Date?value:new Date(value);
    const parts=new Intl.DateTimeFormat('sv-SE',{timeZone:NW_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
    const get=t=>parts.find(p=>p.type===t)?.value||'';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function nwTime(value){ return new Intl.DateTimeFormat('sv-SE',{timeZone:NW_TZ,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)); }
  function nwDateLabel(value){ return new Intl.DateTimeFormat('sv-SE',{timeZone:NW_TZ,weekday:'short',day:'numeric',month:'short'}).format(new Date(value)).replace('.',''); }
  function nwSportSource(id){ return NW_sportById.get(id); }

  async function nwFetchJson(url){
    const res=await fetch(url,{headers:{Accept:'application/json'}});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  async function nwFetchTMDB(path){
    const sep=path.includes('?')?'&':'?';
    const url=`https://api.themoviedb.org/3${path}${sep}api_key=${TMDB_API_KEY}`;
    try{return await nwFetchJson(url);}
    catch(error){return nwFetchJson(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);}
  }
  function nwProviderNames(payload){
    const se=payload?.results?.SE;
    if(!se)return[];
    const rows=[...(se.flatrate||[]),...(se.free||[]),...(se.ads||[]),...(se.rent||[]),...(se.buy||[])];
    return[...new Set(rows.map(p=>p.provider_name).filter(Boolean))].slice(0,4);
  }

  function nwIsFavorite(key){ return NW_favorites.some(item=>item.key===key); }
  function nwRegisterFavorite(item){
    if(!item?.key)return;
    const idx=NW_favorites.findIndex(x=>x.key===item.key);
    if(idx>=0)NW_favorites.splice(idx,1); else NW_favorites.push(item);
    nwSaveFavorites(); nwUpdateHeartButtons();
    if(NW_currentTab==='favoriter')nwRenderFavorites();
  }
  function nwUpdateHeartButtons(){
    document.querySelectorAll('[data-fav-key]').forEach(btn=>{
      const on=nwIsFavorite(btn.dataset.favKey);btn.classList.toggle('on',on);btn.textContent=on?'♥':'♡';
    });
  }

  function nwScheduledLocation(sourceKey){
    for(const[date,items]of Object.entries(calendarData)){
      const index=(items||[]).findIndex(item=>item.sourceKey===sourceKey);
      if(index>=0)return{date,index};
    }
    return null;
  }
  function nwRegisterScheduleItem(item){ if(item?.sourceKey)NW_actionRegistry.set(item.sourceKey,item); return item?.sourceKey||''; }
  function nwToggleRegistered(sourceKey){
    const existing=nwScheduledLocation(sourceKey);
    if(existing){
      calendarData[existing.date].splice(existing.index,1);
      if(!calendarData[existing.date].length)delete calendarData[existing.date];
    }else{
      const item=NW_actionRegistry.get(sourceKey);if(!item)return;
      const date=item.date||nwDateKey(new Date());
      if(!calendarData[date])calendarData[date]=[];
      calendarData[date].push({id:'item_'+Date.now()+Math.random().toString(36).slice(2,6),sourceKey:item.sourceKey,title:item.title,channel:item.channel||'',type:item.type||'',time:item.time||'',startTime:item.startTime||''});
    }
    saveData();nwUpdateAddButtons();if(NW_currentTab==='vecka')renderCalendar();
  }
  function nwUpdateAddButtons(){
    document.querySelectorAll('.add-plus-btn[data-source-key]').forEach(btn=>{
      const on=!!nwScheduledLocation(btn.dataset.sourceKey);
      btn.classList.toggle('added',on);btn.textContent=on?'✓':'+';btn.title=on?'Ta bort från schema':'Lägg till i schema';
    });
  }
  function nwAddButton(item){
    const key=nwRegisterScheduleItem(item),on=!!nwScheduledLocation(key);
    return `<button class="add-plus-btn ${on?'added':''}" data-source-key="${nwEsc(key)}" onclick="event.stopPropagation(); nwToggleRegistered('${nwEsc(key)}')" title="${on?'Ta bort från schema':'Lägg till i schema'}">${on?'✓':'+'}</button>`;
  }

  function nwOverlayClose(event,id){
    if(event.target.id!==id)return;
    if(id==='search-modal')closeSearchModal();
    if(id==='date-modal')closeDateModal();
  }
  function hideAllViews(){
    ['calendar-view','detail-view','sport-view','favorites-view','movie-view','series-view'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  }
  function nwSetNav(tab){
    document.querySelectorAll('.bottom-nav .nav-item').forEach(btn=>btn.classList.remove('active'));
    const id=tab==='serie'?'nav-serie-btn':`nav-${tab}-btn`;
    document.getElementById(id)?.classList.add('active');NW_currentTab=tab;
  }
  function switchTab(tabName){
    nwSetNav(tabName);hideAllViews();
    if(tabName==='vecka'){document.getElementById('calendar-view').style.display='block';renderCalendar();}
    else if(tabName==='film'){document.getElementById('movie-view').style.display='block';nwLoadTrendingMovies();}
    else if(tabName==='serie'){document.getElementById('series-view').style.display='block';nwLoadTrendingSeries();}
    else if(tabName==='sport'){document.getElementById('sport-view').style.display='block';renderSportLeagues();}
    else if(tabName==='favoriter'){document.getElementById('favorites-view').style.display='block';nwRenderFavorites();}
    window.scrollTo({top:0,behavior:'auto'});
  }
  function goToHome(){switchTab('vecka');}
  function showCalendarView(){switchTab('vecka');}

  function renderCalendar(){
    const container=document.getElementById('calendar-container');if(!container)return;container.innerHTML='';
    for(let i=0;i<7;i++){
      const d=new Date(currentStartDate);d.setDate(currentStartDate.getDate()+i);
      const dateStr=nwDateKey(d),isToday=dateStr===nwDateKey(new Date());
      const dayName=d.toLocaleDateString('sv-SE',{weekday:'long'}),formattedDate=d.toLocaleDateString('sv-SE',{day:'numeric',month:'short'}).replace('.','');
      const items=calendarData[dateStr]||[];const day=document.createElement('div');
      day.className=`day-card ${isToday?'is-today':''}`;day.dataset.date=dateStr;
      let itemsHtml='';
      if(!items.length)itemsHtml='<div class="empty-day">Inga aktiviteter</div>';
      else items.forEach(item=>{
        itemsHtml+=`<div class="item" data-item-id="${nwEsc(item.id)}" onpointerdown="nwBeginPressDrag(event,'${dateStr}','${nwEsc(item.id)}')">
          <div class="item-info"><div class="item-title">${nwEsc(item.title)}</div><div class="item-meta">
          ${item.type?`<span class="badge">${nwEsc(item.type)}</span>`:''}${item.time?`<span>🕒 ${nwEsc(item.time)}</span>`:''}${item.channel?`<span>📺 ${nwEsc(item.channel)}</span>`:''}
          </div></div><div class="item-actions"><button class="dots-btn" onclick="toggleMenu(event,'${nwEsc(item.id)}')" aria-label="Meny">•••</button>
          <div class="menu-dropdown" id="menu-${nwEsc(item.id)}"><button class="menu-item" onclick="openDateModalFor('${dateStr}','${nwEsc(item.id)}')">Flytta till datum</button><button class="menu-item" onclick="deleteItem('${dateStr}','${nwEsc(item.id)}')">Ta bort</button></div></div></div>`;
      });
      day.innerHTML=`<div class="day-header"><div class="day-title">${nwEsc(dayName)} ${isToday?'<span class="today-badge">IDAG</span>':''}</div><div class="day-date">${nwEsc(formattedDate)}</div></div><div class="item-list">${itemsHtml}</div>`;
      container.appendChild(day);
    }
  }
  function toggleMenu(event,itemId){
    event.stopPropagation();document.querySelectorAll('.menu-dropdown').forEach(menu=>{if(menu.id!==`menu-${itemId}`)menu.classList.remove('show');});
    document.getElementById(`menu-${itemId}`)?.classList.toggle('show');
  }
  function deleteItem(dateStr,itemId){
    calendarData[dateStr]=(calendarData[dateStr]||[]).filter(item=>item.id!==itemId);
    if(!calendarData[dateStr]?.length)delete calendarData[dateStr];
    saveData();renderCalendar();nwUpdateAddButtons();
  }
  function confirmMoveToDate(newDateStr){
    if(!activeItemId||!newDateStr)return;const{dateStr,itemId}=activeItemId;nwMoveCalendarItem(dateStr,itemId,newDateStr,null);closeDateModal();
  }
  function nwMoveCalendarItem(sourceDate,itemId,targetDate,targetIndex){
    const source=calendarData[sourceDate]||[],sourceIndex=source.findIndex(item=>item.id===itemId);if(sourceIndex<0)return;
    const[item]=source.splice(sourceIndex,1);if(!source.length)delete calendarData[sourceDate];
    if(sourceDate!==targetDate){delete item.time;delete item.startTime;}
    if(!calendarData[targetDate])calendarData[targetDate]=[];
    const target=calendarData[targetDate];let index=Number.isInteger(targetIndex)?targetIndex:target.length;
    if(sourceDate===targetDate&&sourceIndex<index)index--;index=Math.max(0,Math.min(index,target.length));target.splice(index,0,item);
    saveData();renderCalendar();
  }
  function nwBeginPressDrag(event,dateStr,itemId){
    if(event.button!==undefined&&event.button!==0)return;if(event.target.closest('button'))return;
    const card=event.currentTarget;
    NW_drag={pointerId:event.pointerId,sourceDate:dateStr,itemId,card,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,active:false,timer:setTimeout(()=>nwActivateDrag(),330)};
  }
  function nwActivateDrag(){
    if(!NW_drag||NW_drag.active)return;NW_drag.active=true;document.body.classList.add('nw-dragging');NW_drag.card.classList.add('drag-source');
    const ghost=NW_drag.card.cloneNode(true);ghost.classList.add('drag-ghost');ghost.classList.remove('drag-source');ghost.querySelectorAll('.menu-dropdown').forEach(el=>el.remove());document.body.appendChild(ghost);NW_drag.ghost=ghost;nwPositionGhost(NW_drag.x,NW_drag.y);
  }
  function nwPositionGhost(x,y){if(!NW_drag?.ghost)return;NW_drag.ghost.style.left=`${Math.max(8,x-NW_drag.ghost.offsetWidth/2)}px`;NW_drag.ghost.style.top=`${Math.max(8,y-28)}px`;}
  function nwTrackDrag(event){
    if(!NW_drag||event.pointerId!==NW_drag.pointerId)return;NW_drag.x=event.clientX;NW_drag.y=event.clientY;
    if(!NW_drag.active){const dist=Math.hypot(event.clientX-NW_drag.startX,event.clientY-NW_drag.startY);if(dist>10){clearTimeout(NW_drag.timer);NW_drag=null;}return;}
    event.preventDefault();nwPositionGhost(event.clientX,event.clientY);document.querySelectorAll('.day-card').forEach(el=>el.classList.remove('drag-target'));document.elementFromPoint(event.clientX,event.clientY)?.closest('.day-card')?.classList.add('drag-target');
  }
  function nwEndDrag(event){
    if(!NW_drag||event.pointerId!==NW_drag.pointerId)return;clearTimeout(NW_drag.timer);
    if(NW_drag.active){event.preventDefault();const targetDay=document.elementFromPoint(event.clientX,event.clientY)?.closest('.day-card');if(targetDay){
      const cards=[...targetDay.querySelectorAll('.item')].filter(card=>card.dataset.itemId!==NW_drag.itemId);let targetIndex=cards.findIndex(card=>{const rect=card.getBoundingClientRect();return event.clientY<rect.top+rect.height/2;});if(targetIndex<0)targetIndex=cards.length;nwMoveCalendarItem(NW_drag.sourceDate,NW_drag.itemId,targetDay.dataset.date,targetIndex);
    }}
    NW_drag.ghost?.remove();NW_drag.card?.classList.remove('drag-source');document.querySelectorAll('.day-card').forEach(el=>el.classList.remove('drag-target'));document.body.classList.remove('nw-dragging');NW_drag=null;
  }
  window.addEventListener('pointermove',nwTrackDrag,{passive:false});window.addEventListener('pointerup',nwEndDrag,{passive:false});window.addEventListener('pointercancel',nwEndDrag,{passive:false});
  window.addEventListener('pointerdown',event=>{if(!event.target.closest('.item-actions'))document.querySelectorAll('.menu-dropdown.show').forEach(menu=>menu.classList.remove('show'));});

  function nwSeasonYear(source){
    const now=new Date(),year=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:NW_TZ}).format(now)),month=Number(new Intl.DateTimeFormat('en',{month:'numeric',timeZone:NW_TZ}).format(now));
    if(source.id==='allsvenskan'||source.id==='f1')return year;
    if(source.sport==='Fotboll')return month>=7?year:year-1;
    if(source.id==='nba'||source.id==='nhl')return month>=7?year+1:year;
    if(source.id==='nfl')return month<=2?year-1:year;
    return year;
  }
  function nwParseTeamsPayload(source,payload){
    const league=payload?.sports?.[0]?.leagues?.[0];if(league?.logos?.[0]?.href)source.logo=league.logos[0].href;
    const rows=Array.isArray(league?.teams)?league.teams:[];
    return rows.map(row=>row.team||row).filter(Boolean).map(team=>({id:String(team.id||''),name:String(team.displayName||team.shortDisplayName||team.name||''),logo:team.logos?.[0]?.href||team.logo||'',sourceId:source.id,league:source.name,sport:source.sport})).filter(team=>team.name&&team.id);
  }
  async function nwLoadSportCatalogs(){
    const tasks=NW_SPORT_SOURCES.filter(source=>source.kind!=='race').map(async source=>{
      const payload=await nwFetchJson(source.url.replace('/scoreboard','/teams?limit=1000')),teams=nwParseTeamsPayload(source,payload);
      teams.forEach(team=>{if(!NW_teamCatalog.some(x=>x.sourceId===team.sourceId&&x.id===team.id))NW_teamCatalog.push(team);});
    });
    await Promise.allSettled(tasks);if(NW_currentTab==='sport')renderSportLeagues();const q=document.getElementById('global-search-input')?.value||'';if(q.trim())handleUnifiedSearch(q);
  }
  function nwParseSportEvent(source,event){
    const comp=event?.competitions?.[0];if(!comp)return null;const competitors=comp.competitors||[],home=competitors.find(c=>c.homeAway==='home')||competitors[0],away=competitors.find(c=>c.homeAway==='away')||competitors[1];if(!home?.team||!away?.team)return null;
    const completed=!!(comp.status?.type?.completed||event.status?.type?.completed);
    return{id:String(event.id||comp.id||`${source.id}-${event.date}`),sourceId:source.id,league:event.league?.shortName||event.league?.abbreviation||event.league?.name||source.name,homeId:String(home.team.id||''),awayId:String(away.team.id||''),home:String(home.team.displayName||home.team.shortDisplayName||home.team.name||''),away:String(away.team.displayName||away.team.shortDisplayName||away.team.name||''),startTime:String(event.date||comp.date||''),completed};
  }
  function nwParseF1(source,payload){
    const now=Date.now(),out=[];
    for(const event of payload?.events||[])for(const comp of event.competitions||[]){
      const raw=String(comp?.type?.text||comp?.type?.name||comp?.type?.abbreviation||'').toUpperCase();
      if(/PRACTICE|FP1|FP2|FP3|TRÄNING/.test(raw)||!/QUAL|SPRINT|RACE|GRAND PRIX/.test(raw))continue;
      const ts=new Date(comp.date||event.date).getTime(),completed=!!(comp.status?.type?.completed||event.status?.type?.completed)||ts<now-6*60*60*1000;if(completed)continue;
      let session='Lopp';if(/SPRINT.*QUAL|SHOOTOUT/.test(raw))session='Sprintkval';else if(/QUAL/.test(raw))session='Kval';else if(/SPRINT/.test(raw)&&!/QUAL/.test(raw))session='Sprint';
      out.push({id:`${event.id}-${comp.id||session}`,sourceId:source.id,league:source.name,title:event.shortName||event.name||'Formel 1',session,startTime:String(comp.date||event.date)});
    }
    return out.sort((a,b)=>new Date(a.startTime)-new Date(b.startTime));
  }
  async function nwFetchTeamSchedule(source,teamId,allSoccer=false){
    const season=nwSeasonYear(source);let url;
    if(source.sport==='Fotboll'){const base=allSoccer?'https://site.api.espn.com/apis/site/v2/sports/soccer/all':source.url.slice(0,source.url.lastIndexOf('/scoreboard'));url=`${base}/teams/${encodeURIComponent(teamId)}/schedule?season=${season}&fixture=true&limit=500`;}
    else{const base=source.url.slice(0,source.url.lastIndexOf('/scoreboard'));url=`${base}/teams/${encodeURIComponent(teamId)}/schedule?season=${season}&seasontype=2&limit=500`;}
    const payload=await nwFetchJson(url);
    return(payload.events||[]).map(event=>nwParseSportEvent(source,event)).filter(Boolean).filter(match=>!match.completed&&new Date(match.startTime).getTime()>Date.now()-3*60*60*1000).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime));
  }
  async function nwAllSettledLimited(items,limit,worker){
    const results=new Array(items.length);let cursor=0;async function run(){while(true){const i=cursor++;if(i>=items.length)return;try{results[i]={status:'fulfilled',value:await worker(items[i],i)};}catch(reason){results[i]={status:'rejected',reason};}}}
    await Promise.all(Array.from({length:Math.min(limit,Math.max(1,items.length))},run));return results;
  }
  async function nwLoadLeagueSchedule(source){
    if(NW_leagueScheduleCache.has(source.id))return NW_leagueScheduleCache.get(source.id);
    if(source.kind==='race'){const payload=await nwFetchJson(`${source.url}?limit=1000&dates=${nwSeasonYear(source)}`),sessions=nwParseF1(source,payload);NW_leagueScheduleCache.set(source.id,sessions);return sessions;}
    const teams=NW_teamCatalog.filter(team=>team.sourceId===source.id),results=await nwAllSettledLimited(teams,6,team=>nwFetchTeamSchedule(source,team.id,false)),map=new Map();
    results.forEach(result=>{if(result.status==='fulfilled')result.value.forEach(match=>map.set(match.id,match));});
    const matches=[...map.values()].sort((a,b)=>new Date(a.startTime)-new Date(b.startTime));NW_leagueScheduleCache.set(source.id,matches);return matches;
  }
  async function nwLoadTeamSchedule(source,team){
    const key=`${source.id}:${team.id}`;if(NW_teamScheduleCache.has(key))return NW_teamScheduleCache.get(key);
    const matches=await nwFetchTeamSchedule(source,team.id,source.sport==='Fotboll');NW_teamScheduleCache.set(key,matches);return matches;
  }
  function nwLeagueFavorite(source){return{key:`league:${source.id}`,type:'league',id:source.id,name:source.name,subtitle:source.sport,icon:source.logo||source.emoji};}
  function nwTeamFavorite(source,team){return{key:`team:${source.id}:${team.id}`,type:'team',sourceId:source.id,id:team.id,name:team.name,subtitle:source.name,icon:team.logo||source.emoji};}

  function renderSportLeagues(){
    document.getElementById('sport-back-btn').style.display='none';document.getElementById('sport-page-title').innerText='Sport';document.getElementById('sport-page-subtitle').innerText='Välj liga eller serie';
    const container=document.getElementById('sport-content-container');
    container.innerHTML=`<div class="sport-grid">${NW_SPORT_SOURCES.map(source=>{const fav=nwLeagueFavorite(source),on=nwIsFavorite(fav.key);return`<div class="sport-league-card" onclick="nwOpenLeague('${source.id}')">
      <button class="heart-btn ${on?'on':''}" data-fav-key="${fav.key}" onclick='event.stopPropagation(); nwRegisterFavorite(${JSON.stringify(fav)})'>${on?'♥':'♡'}</button>
      <div class="league-logo-wrap">${source.logo?`<img class="league-logo" src="${nwEsc(source.logo)}" alt="${nwEsc(source.name)}">`:`<div class="league-logo-fallback">${source.emoji}</div>`}</div>
      <div class="name">${nwEsc(source.name)}</div><div class="league-sport">${source.emoji} ${nwEsc(source.sport)}</div></div>`;}).join('')}</div>`;nwUpdateHeartButtons();
  }
  async function nwOpenLeague(sourceId){
    const source=nwSportSource(sourceId);if(!source)return;hideAllViews();nwSetNav('sport');document.getElementById('sport-view').style.display='block';document.getElementById('sport-back-btn').style.display='flex';document.getElementById('sport-back-btn').onclick=renderSportLeagues;
    const fav=nwLeagueFavorite(source);document.getElementById('sport-page-title').innerHTML=`${nwEsc(source.name)} <button class="inline-heart ${nwIsFavorite(fav.key)?'on':''}" data-fav-key="${fav.key}" onclick='nwRegisterFavorite(${JSON.stringify(fav)})'>${nwIsFavorite(fav.key)?'♥':'♡'}</button>`;document.getElementById('sport-page-subtitle').innerText=`${source.emoji} ${source.sport} • Kommande säsongsschema`;
    const container=document.getElementById('sport-content-container');container.innerHTML='<div class="loading-card">Hämtar säsongens matcher…</div>';
    try{const matches=await nwLoadLeagueSchedule(source);container.innerHTML=nwRenderSportSchedule(source,matches);nwUpdateAddButtons();nwUpdateHeartButtons();}catch{container.innerHTML='<div class="error-card">Kunde inte hämta ligans spelschema just nu.</div>';}
  }
  function nwRenderSportSchedule(source,matches){
    if(!matches.length)return'<div class="loading-card">Inga kommande matcher eller tävlingar.</div>';
    return`<div class="detail-list">${matches.map(match=>{
      if(source.kind==='race'){const item={sourceKey:`sport:${source.id}:${match.id}`,title:`${match.title} – ${match.session}`,channel:source.channel,type:'Sport',date:nwDateKey(match.startTime),time:nwTime(match.startTime),startTime:match.startTime};return`<div class="schedule-card"><div class="schedule-top"><div class="schedule-title">${nwEsc(match.title)} • ${nwEsc(match.session)}</div><div class="schedule-time">${nwEsc(nwDateLabel(match.startTime))} ${nwEsc(nwTime(match.startTime))}</div></div><div class="schedule-meta">🏎️ ${nwEsc(source.name)} <span>📺 ${nwEsc(source.channel)}</span></div><div class="schedule-actions">${nwAddButton(item)}</div></div>`;}
      const item={sourceKey:`sport:${source.id}:${match.id}`,title:`${match.home} – ${match.away}`,channel:source.channel,type:'Sport',date:nwDateKey(match.startTime),time:nwTime(match.startTime),startTime:match.startTime};
      return`<div class="schedule-card"><div class="schedule-top"><div class="schedule-title"><span class="team-link" onclick="nwOpenTeam('${source.id}','${nwEsc(match.homeId)}')">${nwEsc(match.home)}</span><span style="color:var(--text-muted)"> – </span><span class="team-link" onclick="nwOpenTeam('${source.id}','${nwEsc(match.awayId)}')">${nwEsc(match.away)}</span></div><div class="schedule-time">${nwEsc(nwDateLabel(match.startTime))} ${nwEsc(nwTime(match.startTime))}</div></div><div class="schedule-meta">${source.emoji} ${nwEsc(match.league||source.name)} <span>📺 ${nwEsc(source.channel)}</span></div><div class="schedule-actions">${nwAddButton(item)}</div></div>`;
    }).join('')}</div>`;
  }
  async function nwOpenTeam(sourceId,teamId){
    const source=nwSportSource(sourceId),team=NW_teamCatalog.find(t=>t.sourceId===sourceId&&t.id===String(teamId));if(!source||!team)return;hideAllViews();nwSetNav('sport');document.getElementById('sport-view').style.display='block';document.getElementById('sport-back-btn').style.display='flex';document.getElementById('sport-back-btn').onclick=()=>nwOpenLeague(sourceId);
    const fav=nwTeamFavorite(source,team);document.getElementById('sport-page-title').innerHTML=`${nwEsc(team.name)} <button class="inline-heart ${nwIsFavorite(fav.key)?'on':''}" data-fav-key="${fav.key}" onclick='nwRegisterFavorite(${JSON.stringify(fav)})'>${nwIsFavorite(fav.key)?'♥':'♡'}</button>`;document.getElementById('sport-page-subtitle').innerText=`${source.name} • Samtliga kommande matcher för säsongen`;
    const container=document.getElementById('sport-content-container');container.innerHTML='<div class="loading-card">Hämtar lagets säsongsschema…</div>';
    try{const matches=await nwLoadTeamSchedule(source,team);container.innerHTML=nwRenderSportSchedule(source,matches);nwUpdateAddButtons();nwUpdateHeartButtons();}catch{container.innerHTML='<div class="error-card">Kunde inte hämta lagets spelschema just nu.</div>';}
  }

  function nwMediaFavorite(item,type){const name=item.title||item.name||'';return{key:`${type}:${item.id}`,type,id:item.id,name,subtitle:type==='series'?'Serie':'Film',icon:item.poster_path?`${NW_MEDIA_IMAGE}${item.poster_path}`:(type==='series'?'📺':'🎬')};}
  function nwMediaCard(item,type){
    const title=item.title||item.name||'Utan titel',year=String(item.release_date||item.first_air_date||'').slice(0,4),fav=nwMediaFavorite(item,type),on=nwIsFavorite(fav.key);
    return`<article class="media-card" onclick="nwOpenMedia('${item.id}','${type}')"><button class="heart-btn ${on?'on':''}" data-fav-key="${fav.key}" onclick='event.stopPropagation(); nwRegisterFavorite(${JSON.stringify(fav)})'>${on?'♥':'♡'}</button>${item.poster_path?`<img class="media-poster" src="${NW_MEDIA_IMAGE}${item.poster_path}" alt="${nwEsc(title)}">`:`<div class="media-poster-placeholder">${type==='series'?'📺':'🎬'}</div>`}<div class="media-card-body"><div class="media-title">${nwEsc(title)}</div><div class="media-meta">${type==='series'?'Serie':'Film'}${year?` • ${year}`:''}</div></div></article>`;
  }
  async function nwLoadTrendingMovies(){
    const container=document.getElementById('movie-content-container');if(!container)return;container.innerHTML='<div class="loading-card" style="grid-column:1/-1">Hämtar trendande filmer…</div>';
    try{const data=await nwFetchTMDB('/trending/movie/week?language=sv-SE');container.innerHTML=(data.results||[]).slice(0,24).map(item=>nwMediaCard(item,'movie')).join('');nwUpdateHeartButtons();}catch{container.innerHTML='<div class="error-card" style="grid-column:1/-1">Kunde inte hämta filmer just nu.</div>';}
  }
  async function nwLoadTrendingSeries(){
    const container=document.getElementById('series-content-container');if(!container)return;container.innerHTML='<div class="loading-card" style="grid-column:1/-1">Hämtar trendande serier…</div>';
    try{const data=await nwFetchTMDB('/trending/tv/week?language=sv-SE');container.innerHTML=(data.results||[]).slice(0,24).map(item=>nwMediaCard(item,'series')).join('');nwUpdateHeartButtons();}catch{container.innerHTML='<div class="error-card" style="grid-column:1/-1">Kunde inte hämta serier just nu.</div>';}
  }
  async function nwOpenMedia(id,type){
    closeSearchModal();hideAllViews();document.getElementById('detail-view').style.display='block';const container=document.getElementById('detail-items-container');container.innerHTML='<div class="loading-card">Hämtar information…</div>';document.getElementById('season-tabs-container').style.display='none';
    try{
      if(type==='series'){
        const[show,providers]=await Promise.all([nwFetchTMDB(`/tv/${id}?language=sv-SE`),nwFetchTMDB(`/tv/${id}/watch/providers`)]);currentMediaCache={tvShow:show,mediaType:'tv',providers:nwProviderNames(providers)};const fav=nwMediaFavorite(show,'series');
        document.getElementById('detail-page-title').innerHTML=`<span>${nwEsc(show.name)}</span> <button class="inline-heart ${nwIsFavorite(fav.key)?'on':''}" data-fav-key="${fav.key}" onclick='nwRegisterFavorite(${JSON.stringify(fav)})'>${nwIsFavorite(fav.key)?'♥':'♡'}</button>`;
        const providerText=currentMediaCache.providers.join(' / ')||show.networks?.[0]?.name||'Sändning ej bekräftad';document.getElementById('detail-page-subtitle').innerText=`${show.number_of_seasons||0} säsonger • ${providerText}`;document.getElementById('detail-section-heading').innerText='Avsnitt';
        const seasons=(show.seasons||[]).filter(s=>s.season_number>0),tabs=document.getElementById('season-tabs-container');tabs.style.display='flex';tabs.innerHTML=seasons.map((season,idx)=>`<button class="season-tab ${idx===0?'active':''}" onclick="nwFetchSeason('${id}',${season.season_number},${idx})">${nwEsc(season.name||`Säsong ${season.season_number}`)}</button>`).join('');
        if(seasons.length)await nwFetchSeason(id,seasons[0].season_number,0);else container.innerHTML='<div class="loading-card">Inga säsonger hittades.</div>';nwUpdateHeartButtons();
      }else{
        const[movie,providers]=await Promise.all([nwFetchTMDB(`/movie/${id}?language=sv-SE`),nwFetchTMDB(`/movie/${id}/watch/providers`)]),fav=nwMediaFavorite(movie,'movie');
        document.getElementById('detail-page-title').innerHTML=`<span>${nwEsc(movie.title)}</span> <button class="inline-heart ${nwIsFavorite(fav.key)?'on':''}" data-fav-key="${fav.key}" onclick='nwRegisterFavorite(${JSON.stringify(fav)})'>${nwIsFavorite(fav.key)?'♥':'♡'}</button>`;
        const names=nwProviderNames(providers),providerText=names.join(' / ')||'Streaming ej bekräftad';document.getElementById('detail-page-subtitle').innerText=`${movie.release_date||'Okänt premiärdatum'} • ${providerText}`;document.getElementById('detail-section-heading').innerText='Film';
        const date=movie.release_date||nwDateKey(new Date()),item={sourceKey:`movie:${movie.id}`,title:movie.title,channel:providerText,type:'Film',date};
        container.innerHTML=`<div class="schedule-card"><div class="schedule-top"><div class="schedule-title">${nwEsc(movie.title)}</div><div class="schedule-time">${nwEsc(date)}</div></div><div class="schedule-meta">🎬 Film <span>📺 ${nwEsc(providerText)}</span></div><div class="schedule-actions">${nwAddButton(item)}</div></div>`;nwUpdateHeartButtons();nwUpdateAddButtons();
      }
      window.scrollTo({top:0,behavior:'auto'});
    }catch{container.innerHTML='<div class="error-card">Kunde inte hämta titeln just nu.</div>';}
  }
  async function nwFetchSeason(tvId,seasonNumber,tabIdx){
    document.querySelectorAll('.season-tab').forEach((tab,idx)=>tab.classList.toggle('active',idx===tabIdx));const container=document.getElementById('detail-items-container');container.innerHTML='<div class="loading-card">Hämtar avsnitt…</div>';
    try{const season=await nwFetchTMDB(`/tv/${tvId}/season/${seasonNumber}?language=sv-SE`),show=currentMediaCache?.tvShow,providers=currentMediaCache?.providers||[],providerText=providers.join(' / ')||show?.networks?.[0]?.name||'Sändning ej bekräftad';
      container.innerHTML=`<div class="detail-list">${(season.episodes||[]).map(ep=>{const date=ep.air_date||nwDateKey(new Date()),title=`${show?.name||'Serie'} – S${String(seasonNumber).padStart(2,'0')}E${String(ep.episode_number).padStart(2,'0')}: ${ep.name}`,item={sourceKey:`episode:${tvId}:${seasonNumber}:${ep.episode_number}`,title,channel:providerText,type:'Serie',date};return`<div class="schedule-card"><div class="schedule-top"><div class="schedule-title">Avsnitt ${ep.episode_number}: ${nwEsc(ep.name)}</div><div class="schedule-time">${nwEsc(date)}</div></div><div class="schedule-meta">📺 ${nwEsc(providerText)}</div><div class="schedule-actions">${nwAddButton(item)}</div></div>`;}).join('')}</div>`;nwUpdateAddButtons();
    }catch{container.innerHTML='<div class="error-card">Kunde inte hämta avsnitten.</div>';}
  }

  function nwRenderFavorites(){
    const container=document.getElementById('favorites-content-container');if(!container)return;
    if(!NW_favorites.length){container.innerHTML='<div class="loading-card">Inga favoriter ännu. Tryck på ett hjärta på ett lag, en liga, serie eller film.</div>';return;}
    container.innerHTML=`<div class="favorite-grid">${NW_favorites.map(item=>{const icon=item.icon&&String(item.icon).startsWith('http')?`<img class="favorite-icon" src="${nwEsc(item.icon)}" alt="">`:`<div class="favorite-icon">${nwEsc(item.icon||'♥')}</div>`;return`<div class="favorite-card" onclick="nwOpenFavorite('${nwEsc(item.key)}')">${icon}<div><div class="favorite-name">${nwEsc(item.name)}</div><div class="favorite-sub">${nwEsc(item.subtitle||item.type)}</div></div><button class="favorite-remove" onclick='event.stopPropagation(); nwRegisterFavorite(${JSON.stringify(item)})'>×</button></div>`;}).join('')}</div>`;
  }
  function nwOpenFavorite(key){const item=NW_favorites.find(x=>x.key===key);if(!item)return;if(item.type==='league')nwOpenLeague(item.id);else if(item.type==='team')nwOpenTeam(item.sourceId,item.id);else if(item.type==='series')nwOpenMedia(item.id,'series');else if(item.type==='movie')nwOpenMedia(item.id,'movie');}

  function openSearchModal(){
    const modal=document.getElementById('search-modal');modal.classList.add('show');const input=document.getElementById('global-search-input');input.value='';document.getElementById('suggestions-container').innerHTML='<div style="color:var(--text-muted);text-align:center;padding:20px;">Börja skriva för att söka lag, ligor, filmer och serier…</div>';setTimeout(()=>input.focus(),30);
  }
  function closeSearchModal(){document.getElementById('search-modal').classList.remove('show');document.getElementById('global-search-input').value='';}
  function handleUnifiedSearch(query){
    clearTimeout(NW_searchTimer);const container=document.getElementById('suggestions-container'),q=query.trim();if(!q){container.innerHTML='<div style="color:var(--text-muted);text-align:center;padding:20px;">Börja skriva för att söka…</div>';return;}
    container.innerHTML='<div style="color:var(--text-muted);text-align:center;padding:20px;">Söker…</div>';
    NW_searchTimer=setTimeout(async()=>{
      const lower=q.toLowerCase(),teamHits=NW_teamCatalog.filter(team=>team.name.toLowerCase().includes(lower)).sort((a,b)=>{const ar=a.name.toLowerCase().startsWith(lower)?0:1,br=b.name.toLowerCase().startsWith(lower)?0:1;return ar-br||a.name.localeCompare(b.name,'sv');}).slice(0,8),leagueHits=NW_SPORT_SOURCES.filter(source=>source.name.toLowerCase().includes(lower)).slice(0,5);let out='';
      if(teamHits.length){out+='<div style="padding:6px 4px;color:var(--text-muted);font-size:11px;font-weight:700;">LAG</div>'+teamHits.map(team=>{const source=nwSportSource(team.sourceId);return`<div class="suggestion-item" onclick="closeSearchModal(); nwOpenTeam('${team.sourceId}','${team.id}')"><div><div style="font-weight:700">${source?.emoji||'⚽'} ${nwEsc(team.name)}</div><div style="font-size:11px;color:var(--text-muted)">${nwEsc(team.league)}</div></div><span>›</span></div>`;}).join('');}
      if(leagueHits.length){out+='<div style="padding:8px 4px 6px;color:var(--text-muted);font-size:11px;font-weight:700;">LIGOR</div>'+leagueHits.map(source=>`<div class="suggestion-item" onclick="closeSearchModal(); nwOpenLeague('${source.id}')"><div><div style="font-weight:700">${source.emoji} ${nwEsc(source.name)}</div><div style="font-size:11px;color:var(--text-muted)">${nwEsc(source.sport)}</div></div><span>›</span></div>`).join('');}
      try{const data=await nwFetchTMDB(`/search/multi?language=sv-SE&query=${encodeURIComponent(q)}&page=1&include_adult=false`),media=(data.results||[]).filter(x=>x.media_type==='tv'||x.media_type==='movie').slice(0,10);if(media.length){out+='<div style="padding:8px 4px 6px;color:var(--text-muted);font-size:11px;font-weight:700;">FILM & SERIER</div>'+media.map(item=>{const type=item.media_type==='tv'?'series':'movie',title=item.name||item.title||'Utan titel';return`<div class="suggestion-item" onclick="nwOpenMedia('${item.id}','${type}')"><div><div style="font-weight:700">${type==='series'?'📺':'🎬'} ${nwEsc(title)}</div><div style="font-size:11px;color:var(--text-muted)">${type==='series'?'Serie':'Film'}</div></div><span>›</span></div>`;}).join('');}}catch{}
      container.innerHTML=out||`<div style="color:var(--text-muted);text-align:center;padding:20px;">Inga träffar för “${nwEsc(q)}”.</div>`;
    },220);
  }

  async function nwInit(){
    const d=new Date(),day=d.getDay(),diff=d.getDate()-day+(day===0?-6:1);currentStartDate=new Date(d.getFullYear(),d.getMonth(),diff);updateWeekHeader();renderCalendar();switchTab('vecka');nwLoadSportCatalogs();
  }

  window.nwOverlayClose=nwOverlayClose;window.nwToggleRegistered=nwToggleRegistered;window.nwRegisterFavorite=nwRegisterFavorite;window.nwOpenFavorite=nwOpenFavorite;window.nwOpenLeague=nwOpenLeague;window.nwOpenTeam=nwOpenTeam;window.nwOpenMedia=nwOpenMedia;window.nwFetchSeason=nwFetchSeason;window.nwBeginPressDrag=nwBeginPressDrag;
  window.onload=nwInit;

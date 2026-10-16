/* Manual editorial selections. Never writes match, roster or player records. */
window.createExtraGraphicsTemplates=function(api){
 const {S,TIT,format,base,logos,img,svgText,esc,portraitUrl,normalizedPortrait,rosterStatsValues}=api;
 const definitions=[
  ['game_night','MATCHDAG','Matchdag / Game Night','Lag, datum, tid och sändning'],
  ['final_score','SLUTRESULTAT','Slutresultat','Resultat och utvalda målskyttar'],
  ['match_mvp','MATCHENS SPELARE','Matchens spelare','Välj spelare och matchstatistik'],
  ['player_duel','SPELARDUELLEN','Spelarduellen','Jämför två spelare'],
  ['weekly_six','VECKANS LAG','Veckans lag','Sex utvalda spelare på rink'],
  ['playoff_series','SLUTSPELSSERIE','Slutspelsserie','Serieställning och matchresultat'],
  ['welcome_player','VÄLKOMMEN','Nyförvärv / Välkommen','Spelare och nytt lag']
 ];
 const kinds=new Set(definitions.map(d=>d[0])),list=document.querySelector('.kinds');
 for(const [kind,title,label,note] of definitions){
  TIT[kind]=title;
  const button=document.createElement('button');button.className='kind';button.dataset.kind=kind;
  button.innerHTML='<b>'+esc(label)+'</b><small>'+esc(note)+'</small>';list.append(button);
 }
 const counter=list.closest('section').querySelector('.head span');
 counter.textContent=list.querySelectorAll('[data-kind]').length+' MALLAR';
 const section=document.createElement('section');section.className='block';section.hidden=true;
 const field=(id,label,input,kinds)=>'<label class="full" data-extra-kinds="'+kinds+'"><span>'+label+'</span>'+input.replace('ID',id)+'</label>';
 const select=(id,label,kinds)=>field(id,label,'<select id="ID"></select>',kinds);
 const input=(id,label,type,kinds,extra='')=>field(id,label,'<input id="ID" type="'+type+'" '+extra+'>',kinds);
 const teamKinds='game_night final_score playoff_series welcome_player',players='match_mvp player_duel welcome_player';
 section.innerHTML='<div class="head"><b>MALLENS UPPGIFTER</b></div><p class="note">Manuella val gäller bara grafiken. Kontrollera uppgifterna före publicering.</p><div class="grid">'+
  select('extraTeamA','HEMMALAG / NYTT LAG',teamKinds)+select('extraTeamB','BORTALAG','game_night final_score playoff_series')+
  select('extraPlayerA','SPELARE',players)+select('extraPlayerB','MOTSPELARE','player_duel')+
  input('extraDate','DATUM','date','game_night')+input('extraTime','TID · SVENSK TID','time','game_night')+
  input('extraWatch','SE MATCHEN PÅ','text','game_night','maxlength="80" placeholder="T.ex. Match-TV / Twitch-kanal"')+
  input('extraHomeScore','HEMMAMÅL','number','final_score','min="0" max="99" step="1" value="0"')+
  input('extraAwayScore','BORTAMÅL','number','final_score','min="0" max="99" step="1" value="0"')+
  input('extraScorers','UTVALDA MÅLSKYTTAR','text','final_score','maxlength="140" placeholder="Namn och antal mål"')+
  input('extraMvpGoals','MÅL I MATCHEN','number','match_mvp','min="0" max="99" step="1" value="0"')+
  input('extraMvpAssists','ASSIST I MATCHEN','number','match_mvp','min="0" max="99" step="1" value="0"')+
  input('extraMvpNote','MATCH / MOTIVERING','text','match_mvp','maxlength="100"')+
  field('extraSeriesFormat','SERIEFORMAT','<select id="ID"><option value="3">Bäst av 3</option><option value="5">Bäst av 5</option><option value="7">Bäst av 7</option></select>','playoff_series')+
  input('extraSeriesHome','HEMMA · MATCHVINSTER','number','playoff_series','min="0" max="4" step="1" value="0"')+
  input('extraSeriesAway','BORTA · MATCHVINSTER','number','playoff_series','min="0" max="4" step="1" value="0"')+
  input('extraSeriesResults','TIDIGARE RESULTAT','text','playoff_series','maxlength="100" placeholder="T.ex. 3–2 · 1–4 · 5–1"')+
  input('extraWelcome','PRESENTATIONSTEXT','text','welcome_player','maxlength="100" placeholder="T.ex. Välkommen till laget!"')+
  input('extraWeek','VECKA · START SÖNDAG','date','weekly_six')+
  field('extraForwardMetric','FORWARDS · URVAL','<select id="ID"><option value="total">Totalpoäng · minst 2 matcher</option><option value="average">Poäng per match · minst 2 matcher och 50 %</option></select>','weekly_six')+
  '<div class="full" data-extra-kinds="weekly_six"><button id="extraAutoWeek" class="refresh" type="button">Fyll med veckans bästa</button><p id="extraWeekStatus" class="note" role="status">Söndag–torsdag, svensk tid. Forwards: alla forwardspoäng, minst 2 matcher. Backar: DIM från båda backsidorna. Backar och målvakt: minst 2 matcher och 50 % av lagets veckomatcher. Placering på vanligaste positionen.</p></div>'+
  ['LW','C','RW','LD','RD','G'].map(slot=>select('extraSix'+slot,slot,'weekly_six')).join('')+'</div>';
 (document.querySelector('.design-panel-body')||document.querySelector('.controls')).prepend(section);
 const get=id=>document.getElementById(id),value=id=>get(id).value;
 let weeklyPeriod='',weeklySelections={},weekLoading=false,weeklyLeague=S.league;
 get('extraWeek').value=window.GraphicsWeeklyTeam.sunday();
 get('extraWeek').addEventListener('change',()=>{weeklyPeriod='';weeklySelections={};});
 get('extraForwardMetric').addEventListener('change',()=>{
  weeklyPeriod='';weeklySelections={};
  get('extraWeekStatus').textContent='Urvalsmetoden har ändrats. Klicka Fyll med veckans bästa för att göra ett nytt urval. Snittläget kräver minst 2 matcher och 50 % av lagets veckomatcher.';
 });
 get('extraAutoWeek').addEventListener('click',async()=>{
  if(weekLoading)return;
  const date=value('extraWeek'),league=S.league,forwardMetric=value('extraForwardMetric')||'total',status=get('extraWeekStatus'),button=get('extraAutoWeek');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T12:00:00Z').getUTCDay()!==0){status.textContent='Välj en söndag som veckostart.';return;}
  weekLoading=true;button.disabled=true;status.textContent='Hämtar veckans matchstatistik…';
  try{
   const session=await window.SWNStudioAccess.session(),cfg=window.EHOCKEY_CONFIG;
   const response=await fetch(cfg.supabaseUrl.replace(/\/+$/,'')+'/rest/v1/rpc/graphics_weekly_candidates',{method:'POST',headers:{apikey:cfg.supabasePublishableKey,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({p_league:league,p_sunday:date})});
   if(!response.ok)throw new Error('Kunde inte hämta veckounderlaget. Kontrollera inloggningen och försök igen.');
   const data=await response.json();
   if(league!==S.league||date!==value('extraWeek')||forwardMetric!==(value('extraForwardMetric')||'total'))return;
   if(!data.supported)throw new Error(data.message||'Matchunderlag saknas för denna turnering.');
   if(!data.matches)throw new Error('Inga importerade matcher söndag–torsdag denna vecka. Dina val har behållits.');
   if(!data.complete)throw new Error('Matchunderlaget är ofullständigt. Automatvalet har inte ändrat dina spelare.');
   const picks=window.GraphicsWeeklyTeam.select(data.candidates,new Set(S.players.map(playerKey)),forwardMetric);
   weeklySelections=picks;weeklyPeriod=data.start+' – '+data.end;
   for(const slot of ['LW','C','RW','LD','RD','G'])get('extraSix'+slot).value=picks[slot]?picks[slot].source_team_id+':'+picks[slot].source_player_id:'';
   const count=Object.keys(picks).length;
   status.textContent=weeklyPeriod+' · '+(forwardMetric==='average'?'Forwards: poäng per match.':'Forwards: totalpoäng.')+' '+count+'/6 platser fyllda från '+data.matches+' matcher.'+(count<6?' Övriga positioner saknar kvalificerat underlag.':' Du kan ändra valen manuellt.');
   api.render();
  }catch(error){if(league===S.league)status.textContent=error.message;}
  finally{weekLoading=false;button.disabled=false;}
 });
 section.addEventListener('input',()=>api.render());section.addEventListener('change',()=>api.render());
 function options(id,rows,label){
  const el=get(id),selected=el.value,html='<option value="">Välj…</option>'+rows.map(r=>'<option value="'+esc(r.id)+'">'+esc(label(r))+'</option>').join('');
  if(el.innerHTML!==html){el.innerHTML=html;if(rows.some(r=>r.id===selected))el.value=selected;}
 }
 const playerKey=p=>String(p.sports_gamer_team_id)+':'+String(p.sports_gamer_player_id);
 function sync(){
  if(weeklyLeague!==S.league){weeklyLeague=S.league;weeklyPeriod='';weeklySelections={};}
  section.hidden=!kinds.has(S.kind);if(section.hidden)return;
  section.querySelectorAll('[data-extra-kinds]').forEach(el=>el.hidden=!el.dataset.extraKinds.split(' ').includes(S.kind));
  const teams=[...new Map(S.teams.map(t=>[String(t.sports_gamer_team_id),{...t,id:String(t.sports_gamer_team_id)}])).values()];
  const players=[...new Map(S.players.map(p=>[playerKey(p),{...p,id:playerKey(p)}])).values()];
  for(const id of ['extraTeamA','extraTeamB'])options(id,teams,t=>t.team_name_in_league);
  for(const id of ['extraPlayerA','extraPlayerB',...['LW','C','RW','LD','RD','G'].map(s=>'extraSix'+s)])options(id,players,p=>p.display_gamertag+' · '+p.team_name_in_league);
 }
 const text=(x,y,t,size=28,color='#fff',anchor='start')=>svgText(x,y,t,size,color,800,'text-anchor="'+anchor+'"');
 function lines(t,x,y,width,size=25){
  const limit=Math.max(1,Math.floor(width/(size*.65)));let rest=String(t||''),out='';
  for(let i=0;i<3&&rest;i++){let cut=rest.length<=limit?rest.length:rest.lastIndexOf(' ',limit);if(cut<limit*.4)cut=Math.min(limit,rest.length);let line=rest.slice(0,cut);rest=rest.slice(cut).trim();if(i===2&&rest)line=line.slice(0,-1)+'…';out+=text(x,y+i*size*1.35,line,size,'#bdd4e5');}return out;
 }
 function graphic(){
  const {w:W,h:H}=format(),m=W*.052,top=320,bottom=H-100,height=bottom-top,wide=W>H;
  const panel=(x,y,w,h)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="18" fill="#071a28" fill-opacity=".86" stroke="#355369"/>';
  const teams=new Map(S.teams.map(t=>[String(t.sports_gamer_team_id),t])),lm=logos();
  const a=teams.get(value('extraTeamA')),b=teams.get(value('extraTeamB'));
  const find=id=>S.players.find(p=>playerKey(p)===value(id)),pa=find('extraPlayerA'),pb=find('extraPlayerB');
  const missing=t=>base(text(W/2,H/2,t,30,'#bdd4e5','middle'));
  const team=(t,x,y,w)=>{const logo=lm.get(String(t.sports_gamer_team_id));return (S.logos&&logo?img(logo,x+w/2-85,y,170):'')+text(x+w/2,y+215,t.team_name_in_league,Math.min(32,w/Math.max(1,t.team_name_in_league.length)/.65),'#fff','middle');};
  function player(p,x,y,w,h,caption){
   const url=portraitUrl(p),photoH=h*.64;
   let out=panel(x,y,w,h)+(url?normalizedPortrait(url,x+10,y+10,w-20,photoH,'extra-'+playerKey(p),true):text(x+w/2,y+photoH/2,'—',60,'#bdd4e5','middle'));
   out+=text(x+18,y+photoH+Math.min(40,h*.14),p.display_gamertag,Math.min(32,h*.10,(w-36)/Math.max(1,p.display_gamertag.length)/.65));
   out+=lines(caption||p.team_name_in_league,x+18,y+photoH+Math.min(78,h*.26),w-36,Math.min(21,h*.075));return out;
  }
  let out='';
  if([...section.querySelectorAll('input')].some(el=>!el.closest('[hidden]')&&!el.checkValidity()))return missing('Kontrollera datum och numeriska värden i högerpanelen');
  if(['game_night','final_score','playoff_series'].includes(S.kind)){
   if(!a||!b)return missing('Välj två lag i högerpanelen');
   if(String(a.sports_gamer_team_id)===String(b.sports_gamer_team_id))return missing('Välj två olika lag');
   const cw=(W-m*2)*.42,y=top+height*.09;
   out+=team(a,m,y,cw)+team(b,W-m-cw,y,cw);
   const centerY=y+105;
   const score=S.kind==='final_score'?value('extraHomeScore')+' – '+value('extraAwayScore'):S.kind==='playoff_series'?value('extraSeriesHome')+' – '+value('extraSeriesAway'):'VS';
   out+=text(W/2,centerY,score,wide?70:54,'#ffcf4a','middle');
   const boxY=y+270;out+=panel(m,boxY,W-m*2,Math.max(140,Math.min(250,bottom-boxY)));
   if(S.kind==='game_night'){
    const date=value('extraDate'),time=value('extraTime');
    out+=text(m+30,boxY+58,(date||'Datum ej angivet')+(time?' · '+time:''),34,'#ffcf4a');
    out+=lines(value('extraWatch')||'Sändningsplats ej angiven',m+30,boxY+110,W-m*2-60,26);
   }else if(S.kind==='final_score')out+=text(m+30,boxY+50,'SLUTRESULTAT',22,'#ffcf4a')+lines(value('extraScorers'),m+30,boxY+100,W-m*2-60);
   else{
    const best=Number(value('extraSeriesFormat')),max=Math.ceil(best/2),ha=Number(value('extraSeriesHome')),hb=Number(value('extraSeriesAway'));
    if(ha>max||hb>max||(ha===max&&hb===max))return missing('Kontrollera matchvinsterna för valt serieformat');
    out+=text(m+30,boxY+55,'BÄST AV '+best+(ha===max||hb===max?' · SERIEN AVGJORD':''),28,'#ffcf4a')+lines(value('extraSeriesResults'),m+30,boxY+110,W-m*2-60);
   }
  }else if(S.kind==='weekly_six'){
   if(weeklyPeriod)out+=text(m,295,weeklyPeriod+' · SÖNDAG–TORSDAG',17,'#ffcf4a');
   const slots=['LW','C','RW','LD','RD','G'],ids=slots.map(s=>value('extraSix'+s)).filter(Boolean);
   if(new Set(ids).size!==ids.length)return missing('Välj olika spelare till varje position');
   const rinkW=W-m*2,rinkH=height;
   out+='<defs><linearGradient id="weeklyCard" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#19425e"/><stop offset=".55" stop-color="#102d42"/><stop offset="1" stop-color="#091a28"/></linearGradient><linearGradient id="weeklyRink" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0b263a" stop-opacity=".75"/><stop offset="1" stop-color="#07121b" stop-opacity=".35"/></linearGradient></defs><rect x="'+m+'" y="'+top+'" width="'+rinkW+'" height="'+rinkH+'" rx="38" fill="url(#weeklyRink)" stroke="#66879d" stroke-opacity=".28"/><line x1="'+m+'" y1="'+(top+rinkH*.5)+'" x2="'+(W-m)+'" y2="'+(top+rinkH*.5)+'" stroke="#a9c4d5" stroke-opacity=".11" stroke-width="2"/><circle cx="'+W/2+'" cy="'+(top+rinkH*.5)+'" r="'+Math.min(80,rinkW*.08)+'" fill="none" stroke="#89a8bc" stroke-opacity=".12"/>';
   const points=[[.18,.17],[.5,.17],[.82,.17],[.32,.50],[.68,.50],[.5,.815]],cw=rinkW*.315,ch=Math.min(410,rinkH*.307);
   slots.forEach((slot,i)=>{
    const p=find('extraSix'+slot),[cx,cy]=points[i],x=m+rinkW*cx-cw/2,y=top+rinkH*cy-ch/2;
    const selected=weeklySelections[slot],auto=p&&selected&&String(p.sports_gamer_player_id)===String(selected.source_player_id)&&String(p.sports_gamer_team_id)===String(selected.source_team_id);
    const metric=auto?(slot==='G'?(100*Number(selected.saves)/(Number(selected.saves)+Number(selected.goals_allowed))).toFixed(1)+' %':slot==='LD'||slot==='RD'?'DIM '+(Number(selected.defensive_actions)/Number(selected.games)).toFixed(2):value('extraForwardMetric')==='average'?((Number(selected.goals)+Number(selected.assists))/Number(selected.games)).toFixed(2)+' P/GP':(Number(selected.goals)+Number(selected.assists))+' P'):'';
    const band=Math.max(76,ch*.34),photoH=ch-band,nameSize=p?Math.min(27,(cw-30)/Math.max(1,p.display_gamertag.length)/.68):24;
    out+='<g data-weekly-slot="'+slot+'"><rect x="'+x+'" y="'+y+'" width="'+cw+'" height="'+ch+'" rx="14" fill="url(#weeklyCard)" stroke="#d5ad54" stroke-width="2"/>';
    out+='<path d="M '+(x+cw*.68)+' '+y+' H '+(x+cw-14)+' L '+(x+cw*.55)+' '+(y+photoH)+' H '+(x+cw*.34)+' Z" fill="#a5c5dd" opacity=".045"/>';
    if(p){
     const url=portraitUrl(p),logo=lm.get(String(p.sports_gamer_team_id));
     if(url)out+=normalizedPortrait(url,x+5,y+3,cw-10,photoH+3,'weekly-'+slot,true,.73);
     else out+='<circle cx="'+(x+cw/2)+'" cy="'+(y+photoH*.3)+'" r="'+photoH*.18+'" fill="#385568"/><path d="M '+(x+cw*.15)+' '+(y+photoH)+' Q '+(x+cw*.18)+' '+(y+photoH*.55)+' '+(x+cw/2)+' '+(y+photoH*.55)+' Q '+(x+cw*.82)+' '+(y+photoH*.55)+' '+(x+cw*.85)+' '+(y+photoH)+' Z" fill="#385568"/>';
     out+='<rect x="'+x+'" y="'+(y+photoH-2)+'" width="'+cw+'" height="'+(band+2)+'" rx="10" fill="#06131f"/><path d="M '+(x+12)+' '+(y+photoH-2)+' H '+(x+cw-12)+'" stroke="#e6bd68" stroke-opacity=".7"/>';
     out+=text(x+13,y+photoH+band*.41,p.display_gamertag,nameSize);
     out+='<path d="M '+(x+13)+' '+(y+photoH+band*.51)+' H '+(x+cw-13)+'" stroke="#d4b36a" stroke-opacity=".55"/>';
     out+=text(x+13,y+ch-13,metric||'MANUELLT VAL',Math.min(20,band*.26),'#ffcf4a');
     if(auto)out+=text(x+cw-13,y+ch-13,selected.games+' GP',Math.min(16,band*.23),'#a8bdcc','end');
     if(S.logos&&logo)out+=img(logo,x+cw-58,y+11,46);
    }else out+=text(x+cw/2,y+ch*.56,'Välj spelare',Math.min(24,cw*.09),'#a8bdcc','middle');
    out+='<rect x="'+(x+10)+'" y="'+(y+10)+'" width="48" height="31" rx="5" fill="#ffcf4a"/>'+text(x+34,y+33,slot,19,'#071a28','middle')+'</g>';
   });
  }else{
   if(!pa)return missing('Välj spelare i högerpanelen');
   if(S.kind==='player_duel'){
    if(!pb)return missing('Välj två spelare i högerpanelen');
    if(playerKey(pa)===playerKey(pb))return missing('Välj två olika spelare');
    const gap=30,cw=(W-m*2-gap)/2,ch=height;
    const stats=p=>rosterStatsValues(p).map(([label,v])=>label+': '+v).join(' · ');
    out+=player(pa,m,top,cw,ch,stats(pa))+player(pb,m+cw+gap,top,cw,ch,stats(pb));
   }else{
    if(S.kind==='welcome_player'&&!a)return missing('Välj nytt lag i högerpanelen');
    const cw=wide?(W-m*2)*.52:(W-m*2)*.58;
    out+=player(pa,W-m-cw,top,cw,height,S.kind==='welcome_player'?a.team_name_in_league:pa.team_name_in_league);
    const tw=W-m*2-cw-24;
    if(S.kind==='match_mvp'){
     const g=Number(value('extraMvpGoals')),assists=Number(value('extraMvpAssists'));
     out+=text(m,top+90,String(g+assists),90,'#ffcf4a')+text(m,top+135,'POÄNG I MATCHEN',Math.min(22,tw/12));
     out+=text(m,top+220,g+' MÅL',32)+text(m,top+280,assists+' ASSIST',32)+lines(value('extraMvpNote'),m,top+350,tw,25);
    }else{
     const logo=lm.get(String(a.sports_gamer_team_id));if(S.logos&&logo)out+=img(logo,m,top+20,Math.min(160,tw));
     out+=lines(a.team_name_in_league,m,top+240,tw,30)+lines(value('extraWelcome'),m,top+370,tw,26);
    }
   }
  }
  return base(out);
 }
 return {has:kind=>kinds.has(kind),sync,graphic};
};

/* Manual editorial selections. Never writes match, roster or player records. */
window.createExtraGraphicsTemplates=function(api){
 const {S,TIT,format,base,logos,img,svgText,esc,portraitUrl,normalizedPortrait,rosterStatsValues,nationFlag}=api;
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
 const seriesOptions='<option value="pure_bo5">Pure BO5</option><option value="aggregated_bo3">Aggregated BO3</option>';
 const compactGameTimes=(games,left,top,width,lineHeight=47,fontSize=20)=>{
  if(!games.length)return {markup:'',rows:0};
  // Flow each game's label at its natural size; never shrink a whole schedule into tiny text.
  const items=games.map(g=>({label:'G'+g.game+'  '+g.time+(g.optional?' *':''),game:g.game}));
  const measure=s=>s.length*fontSize*.57+25;
  const rows=[[]];
  let used=0;
  for(const item of items){
   const itemWidth=measure(item.label),remaining=width-used;
   if(rows[rows.length-1].length&&itemWidth>remaining){
    rows.push([]);used=0;
   }
   rows[rows.length-1].push(item);used+=itemWidth+16;
  }
  let markup='';
  rows.forEach((row,i)=>{
   let cursor=left;
   row.forEach((item,j)=>{
    const w=measure(item.label),size=Math.min(fontSize,(width-(cursor-left)-12)/Math.max(1,item.label.length)/.57);
    markup+='<g data-series-row="'+item.game+'" data-secondary-time="true">'+text(cursor,top+i*lineHeight,item.label,Math.max(16,size),'#d3e2ed')+'</g>';
    cursor+=w;
    if(j<row.length-1){markup+=text(cursor-11,top+i*lineHeight,'·',fontSize,'#ffcf4a');cursor+=16;}
   });
  });
  return {markup,rows:rows.length};
 };
 const scheduleInputs=(prefix,attr,mandatory)=>Array.from({length:6},(_,i)=>'<div '+attr+'="'+(i+1)+'" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;margin-bottom:12px"><label><span>G'+(i+1)+' · TID / TIDSZON</span><input id="'+prefix+'Game'+(i+1)+'Time" type="text" maxlength="46" placeholder="T.ex. 21:00 FIN / 20:00 SE"></label><label style="padding-top:18px;white-space:nowrap"><input id="'+prefix+'Game'+(i+1)+'Optional" type="checkbox" style="width:16px;height:16px;accent-color:#ffcf4a;margin:0 5px 0 0;vertical-align:middle" '+(i>=mandatory?'checked':'')+'> Vid behov</label></div>').join('');
 section.innerHTML='<div class="head"><b>MALLENS UPPGIFTER</b></div><p class="note">Manuella val gäller bara grafiken. Kontrollera uppgifterna före publicering.</p><div class="grid">'+
  select('extraTeamA','HEMMALAG / NYTT LAG',teamKinds)+select('extraTeamB','BORTALAG','game_night final_score playoff_series')+
  select('extraPlayerA','SPELARE',players)+select('extraPlayerB','MOTSPELARE','player_duel')+
  field('extraMatchMode','MATCHDAG · UPPLÄGG','<select id="ID"><option value="single">En match</option><option value="double_series">Två serier · samma bild</option><option value="pure_bo5">Pure BO5 · upp till 5 matcher</option><option value="aggregated_bo3">Aggregated BO3 · upp till 6 matcher</option></select>','game_night')+
  field('extraFirstFormat','SERIE 1 · FORMAT','<select id="ID">'+seriesOptions+'</select>','game_night')+
  '<div class="full" id="extraScheduleFields" data-extra-kinds="game_night"><p class="note">Skriv tidszonerna som de ska visas. Ingen automatisk tidsomräkning. Tomma tidsrader visas inte.</p>'+scheduleInputs('extra','data-series-game',3)+'</div>'+
  '<div class="full" id="extraSecondSeriesFields" data-extra-kinds="game_night"><div class="head"><b>SERIE 2</b></div>'+select('extraSecondTeamA','SERIE 2 · LAG 1','game_night')+select('extraSecondTeamB','SERIE 2 · LAG 2','game_night')+field('extraSecondFormat','SERIE 2 · FORMAT','<select id="ID">'+seriesOptions.replace('value="aggregated_bo3"','value="aggregated_bo3" selected')+'</select>','game_night')+scheduleInputs('extraSecond','data-second-series-game',4)+'</div>'+
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
  input('extraWeek','STARTDATUM','date','weekly_six')+
  input('extraWeekEnd','SLUTDATUM · INKLUSIVE','date','weekly_six')+
  field('extraForwardMetric','FORWARDS · URVAL','<select id="ID"><option value="total">Totalpoäng · minst 2 matcher</option><option value="average">Poäng per match · minst 2 matcher och 50 %</option></select>','weekly_six')+
  '<div class="full" data-extra-kinds="weekly_six"><button id="extraAutoWeek" class="refresh" type="button">Fyll med periodens bästa</button><p id="extraWeekStatus" class="note" role="status">Vald period, inklusive slutdatum, svensk tid. Forwards: alla forwardspoäng, minst 2 matcher. Backar: DIM från båda backsidorna. Backar och målvakt: minst 2 matcher och 50 % av lagets matcher under perioden. Placering på vanligaste positionen.</p></div>'+
  ['LW','C','RW','LD','RD','G'].map(slot=>select('extraSix'+slot,slot,'weekly_six')).join('')+'</div>';
 const tournament=document.getElementById('league')?.closest('section');
 if(tournament?.after)tournament.after(section);
 else (document.querySelector('.design-panel-body')||document.querySelector('.controls')).prepend(section);
 const get=id=>document.getElementById(id),value=id=>get(id).value;
 function scheduleFields(){
  const mode=value('extraMatchMode')||'single';
  get('extraScheduleFields').hidden=S.kind!=='game_night'||mode==='single';
  get('extraSecondSeriesFields').hidden=S.kind!=='game_night'||mode!=='double_series';
  const firstFormat=get('extraFirstFormat').closest('label');if(firstFormat)firstFormat.hidden=S.kind!=='game_night'||mode!=='double_series';
  const timeLabel=get('extraTime').closest('label');if(timeLabel)timeLabel.hidden=S.kind!=='game_night'||mode!=='single';
  const first=mode==='double_series'?(value('extraFirstFormat')||'pure_bo5'):mode;
  section.querySelectorAll('[data-series-game]').forEach(el=>{el.hidden=Number(el.dataset.seriesGame)>(first==='pure_bo5'?5:6);el.style.display=el.hidden?'none':'grid';});
  section.querySelectorAll('[data-second-series-game]').forEach(el=>{el.hidden=Number(el.dataset.secondSeriesGame)>(value('extraSecondFormat')==='pure_bo5'?5:6);el.style.display=el.hidden?'none':'grid';});
 }
 get('extraMatchMode').addEventListener('change',()=>{
  const mode=value('extraMatchMode'),limit=(mode==='double_series'?value('extraFirstFormat'):mode)==='aggregated_bo3'?4:3;
  for(let i=1;i<=6;i++)get('extraGame'+i+'Optional').checked=i>limit;
 });
 for(const [id,prefix] of [['extraFirstFormat','extra'],['extraSecondFormat','extraSecond']])get(id).addEventListener('change',()=>{for(let i=1;i<=6;i++)get(prefix+'Game'+i+'Optional').checked=i>(value(id)==='aggregated_bo3'?4:3);});
 let weeklyPeriod='',weeklyDates=null,weeklyCandidates=[],weeklySelections={},weekLoading=false,weeklyLeague=S.league,weeklyGroup=S.filterGroup;
 function groupTeams(){return S.filterGroup==null?S.teams:S.teams.filter(t=>t.statistics_stage==='regular'&&Number(t.effective_group_id)===Number(S.filterGroup));}
 function groupPlayers(){const ids=new Set(groupTeams().map(t=>String(t.sports_gamer_team_id)));return S.filterGroup==null?S.players:S.players.filter(p=>ids.has(String(p.sports_gamer_team_id)));}
 get('extraWeek').value=window.GraphicsWeeklyTeam.sunday();
 const initialEnd=new Date(get('extraWeek').value+'T12:00:00Z');initialEnd.setUTCDate(initialEnd.getUTCDate()+4);
 get('extraWeekEnd').value=initialEnd.toISOString().slice(0,10);
 get('extraWeekEnd').addEventListener('change',()=>{weeklyPeriod='';weeklyDates=null;weeklyCandidates=[];weeklySelections={};});
 get('extraWeek').addEventListener('change',()=>{weeklyPeriod='';weeklyDates=null;weeklyCandidates=[];weeklySelections={};});
 get('extraForwardMetric').addEventListener('change',()=>{
  weeklyPeriod='';weeklyDates=null;weeklyCandidates=[];weeklySelections={};
  get('extraWeekStatus').textContent='Urvalsmetoden har ändrats. Klicka Fyll med periodens bästa för att göra ett nytt urval. Snittläget kräver minst 2 matcher och 50 % av lagets matcher under perioden.';
 });
 get('extraAutoWeek').addEventListener('click',async()=>{
  if(weekLoading)return;
  const date=value('extraWeek'),end=value('extraWeekEnd'),league=S.league,group=S.filterGroup,forwardMetric=value('extraForwardMetric')||'total',status=get('extraWeekStatus'),button=get('extraAutoWeek');
  if(!window.GraphicsWeeklyTeam.validRange(date,end)){status.textContent='Välj giltiga start- och slutdatum. Slutdatum får inte vara före startdatum.';return;}
  weekLoading=true;button.disabled=true;status.textContent='Hämtar periodens matchstatistik…';
  try{
   let data,payload;
   if(window.GraphicsTransientData){
    payload=await window.GraphicsTransientData.request({league,start:date,end,onProgress:message=>{if(league===S.league)status.textContent=message;}});
    if(league!==S.league||group!==S.filterGroup||date!==value('extraWeek')||end!==value('extraWeekEnd')||forwardMetric!==(value('extraForwardMetric')||'total'))return;
    data=payload.weekly;
   }else{
   const session=await window.SWNStudioAccess.session(),cfg=window.EHOCKEY_CONFIG;
   const response=await fetch(cfg.supabaseUrl.replace(/\/+$/,'')+'/rest/v1/rpc/graphics_period_candidates',{method:'POST',headers:{apikey:cfg.supabasePublishableKey,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({p_league:league,p_start:date,p_end:end})});
   if(!response.ok)throw new Error('Kunde inte hämta veckounderlaget. Kontrollera inloggningen och försök igen.');
   data=await response.json();
   }
   if(league!==S.league||group!==S.filterGroup||date!==value('extraWeek')||end!==value('extraWeekEnd')||forwardMetric!==(value('extraForwardMetric')||'total'))return;
   if(!data.supported)throw new Error(data.message||'Matchunderlag saknas för denna turnering.');
   if(!data.matches)throw new Error('Inga matcher under vald period. Dina val har behållits.');
   if(!data.complete)throw new Error('Matchunderlaget är ofullständigt. Automatvalet har inte ändrat dina spelare.');
   if(payload)await api.useTransientData(payload);
   if(league!==S.league||group!==S.filterGroup||date!==value('extraWeek')||end!==value('extraWeekEnd')||forwardMetric!==(value('extraForwardMetric')||'total'))return;
   const picks=window.GraphicsWeeklyTeam.select(data.candidates,new Set(groupPlayers().map(playerKey)),forwardMetric);
   weeklySelections=picks;weeklyCandidates=data.candidates;weeklyDates={start:data.start,end:data.end};weeklyPeriod=window.GraphicsWeeklyTeam.periodLabel(data.start,data.end,window.GraphicsLanguage?.locale||'sv-SE');
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
  TIT.weekly_six=value('extraWeek')&&value('extraWeek')===value('extraWeekEnd')?'DAGENS LAG':'VECKANS LAG';
  if(weeklyLeague!==S.league||weeklyGroup!==S.filterGroup){weeklyLeague=S.league;weeklyGroup=S.filterGroup;weeklyPeriod='';weeklyDates=null;weeklyCandidates=[];weeklySelections={};for(const slot of ['LW','C','RW','LD','RD','G'])get('extraSix'+slot).value='';}
  section.hidden=!kinds.has(S.kind);if(section.hidden)return;
  section.querySelectorAll('[data-extra-kinds]').forEach(el=>el.hidden=!el.dataset.extraKinds.split(' ').includes(S.kind));
  scheduleFields();
  const teams=[...new Map(groupTeams().map(t=>[String(t.sports_gamer_team_id),{...t,id:String(t.sports_gamer_team_id)}])).values()];
  const players=[...new Map(groupPlayers().map(p=>[playerKey(p),{...p,id:playerKey(p)}])).values()];
  for(const id of ['extraTeamA','extraTeamB','extraSecondTeamA','extraSecondTeamB'])options(id,teams,t=>t.team_name_in_league);
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
   if(S.kind==='game_night'&&value('extraMatchMode')==='double_series'){
    const a2=teams.get(value('extraSecondTeamA')),b2=teams.get(value('extraSecondTeamB'));
    if(!a2||!b2)return missing('Välj båda lagen för serie 2');
    if(String(a2.sports_gamer_team_id)===String(b2.sports_gamer_team_id))return missing('Välj två olika lag för serie 2');
    const english=(window.GraphicsLanguage?.locale||'sv').startsWith('en'),gap=24,footer=(value('extraDate')||value('extraWatch'))?64:0;
    const cardW=wide?(W-m*2-gap)/2:W-m*2,cardH=wide?Math.min(height-footer,350):Math.min(345,(height-footer-gap)/2);
    const seriesTop=wide?top:top+Math.max(0,(height-footer-(cardH*2+gap))/2);
    const specs=[[a,b,'extra',value('extraFirstFormat')||'pure_bo5'],[a2,b2,'extraSecond',value('extraSecondFormat')||'aggregated_bo3']];
    specs.forEach(([ta,tb,prefix,mode],index)=>{
     const x=m+(wide?index*(cardW+gap):0),y=seriesTop+(wide?0:index*(cardH+gap)),max=mode==='pure_bo5'?5:6;
     const games=Array.from({length:max},(_,i)=>({game:i+1,time:value(prefix+'Game'+(i+1)+'Time').trim(),optional:get(prefix+'Game'+(i+1)+'Optional').checked})).filter(g=>g.time);
     const logoSize=wide?54:70,head=120,primaryH=85,lineH=38,rest=games.slice(1);
     out+='<g data-matchday-series="'+(index+1)+'">'+panel(x,y,cardW,cardH);
     const short=t=>Number(S.league)===532?({'4N Finland':'FIN','4N Sweden':'SWE','4N Team EU':'EU','4N Team NA':'NA','4N Canada':'CAN','4N USA':'USA'}[t.team_name_in_league]||t.team_name_in_league):t.team_name_in_league;
     const leftName=short(ta),rightName=short(tb);
     [[ta,x+19],[tb,x+cardW-19-logoSize]].forEach(([t,lx])=>{const logo=lm.get(String(t.sports_gamer_team_id));if(S.logos&&logo)out+=img(logo,lx,y+17,logoSize);});
     out+=text(x+logoSize+34,y+logoSize*.62+18,leftName,Math.min(37,(cardW*.32-logoSize)/Math.max(1,leftName.length)/.58));
     out+=text(x+cardW-logoSize-34,y+logoSize*.62+18,rightName,Math.min(37,(cardW*.32-logoSize)/Math.max(1,rightName.length)/.58),'#fff','end');
     out+=text(x+cardW/2,y+logoSize*.62+18,'VS',23,'#ffcf4a','middle');
     out+=text(x+22,y+head-17,mode==='pure_bo5'?'PURE BO5':'AGGREGATED BO3',18,'#ffcf4a');
     out+='<path d="M '+(x+22)+' '+(y+head-6)+' H '+(x+cardW-22)+'" stroke="#66879d" stroke-opacity=".35"/>';
     if(!games.length)out+=text(x+22,y+head+48,'Lägg till matchtider',23,'#a8bdcc');
     if(games.length){
      const first=games[0],start=first.time+(first.optional?' *':'');
      out+='<g data-series-row="'+first.game+'" data-series-start="true">'+text(x+22,y+head+26,(english?'SERIES START':'SERIESTART')+' · G'+first.game,16,'#a8bdcc')+text(x+22,y+head+77,start,Math.min(43,(cardW-44)/Math.max(1,start.length)/.58),'#ffcf4a')+'</g>';
      const compact=compactGameTimes(rest,x+22,y+head+primaryH+16,cardW-44,lineH,wide?17:20);
      out+=compact.markup;
      if(games.some(g=>g.optional))out+=text(x+22,y+head+primaryH+16+Math.max(1,compact.rows)*lineH+3,english?'* IF NECESSARY':'* VID BEHOV',13,'#839bad');
     }
     out+='</g>';
    });
    if(footer){const date=value('extraDate'),label=date&&window.GraphicsWeeklyTeam?window.GraphicsWeeklyTeam.periodLabel(date,date,window.GraphicsLanguage?.locale||'sv-SE'):date;out+=text(m,bottom-32,label,20,'#ffcf4a')+text(m,bottom-7,value('extraWatch'),18,'#a8bdcc');}
    return base(out);
   }
   if(S.kind==='game_night'&&value('extraMatchMode')&&value('extraMatchMode')!=='single'){
    const aggregated=value('extraMatchMode')==='aggregated_bo3',count=aggregated?6:5,english=(window.GraphicsLanguage?.locale||'sv').startsWith('en');
    const games=Array.from({length:count},(_,i)=>({game:i+1,time:value('extraGame'+(i+1)+'Time').trim(),optional:get('extraGame'+(i+1)+'Optional').checked})).filter(g=>g.time);
    const label=aggregated?'AGGREGATED BO3':'PURE BO5',left=wide?m:m,right=wide?W*.49:m,sw=wide?W*.458:W-m*2;
    const logoSize=wide?150:110,teamsW=wide?W*.37:W-m*2,teamY=top+18,mid=left+teamsW/2;
    out+=text(left,top-20,label,22,'#ffcf4a');
    [[a,left+teamsW*.22],[b,left+teamsW*.78]].forEach(([t,cx])=>{
     const logo=lm.get(String(t.sports_gamer_team_id));
     if(S.logos&&logo)out+=img(logo,cx-logoSize/2,teamY,logoSize);
     out+=text(cx,teamY+logoSize+37,t.team_name_in_league,Math.min(29,teamsW*.43/Math.max(1,t.team_name_in_league.length)/.65),'#fff','middle');
    });
    out+=text(mid,teamY+logoSize*.62,'VS',wide?40:32,'#ffcf4a','middle');
    const date=value('extraDate'),dateLabel=date&&window.GraphicsWeeklyTeam?window.GraphicsWeeklyTeam.periodLabel(date,date,window.GraphicsLanguage?.locale||'sv-SE'):date;
    const sy=wide?top:teamY+logoSize+66,head=56,footer=(dateLabel||value('extraWatch'))?68:18;
    const rest=games.slice(1),lineCount=Math.max(1,Math.ceil(rest.length/2)),primaryH=94,lineH=44;
    const sh=Math.min(bottom-sy,head+primaryH+lineCount*lineH+46+footer);
    out+=panel(right,sy,sw,sh)+text(right+24,sy+35,english?'SERIES SCHEDULE':'SERIESCHEMA',21,'#ffcf4a');
    if(games.length){
     const first=games[0],startLabel=first.time+(first.optional?' *':'');
     out+='<g data-series-row="'+first.game+'" data-series-start="true">'+text(right+24,sy+head+24,(english?'SERIES START':'SERIESTART')+' · G'+first.game,17,'#a8bdcc')+text(right+24,sy+head+72,startLabel,Math.min(40,(sw-48)/Math.max(1,startLabel.length)/.66),'#ffcf4a')+'</g>';
     const compact=compactGameTimes(rest,right+24,sy+head+primaryH+lineH*.7,sw-48,lineH,22);
     out+=compact.markup;
     if(games.some(g=>g.optional))out+=text(right+24,sy+head+primaryH+Math.max(1,compact.rows)*lineH+20,english?'* IF NECESSARY':'* VID BEHOV',15,'#829cac');
    }else out+=text(right+24,sy+head+55,'Lägg till matchtider i panelen',24,'#a8bdcc');
    if(footer>18){
     out+='<path d="M '+(right+20)+' '+(sy+sh-footer)+' H '+(right+sw-20)+'" stroke="#66879d" stroke-opacity=".3"/>';
     out+=text(right+24,sy+sh-37,dateLabel||'',19,'#ffcf4a')+text(right+24,sy+sh-14,value('extraWatch'),Math.min(17,(sw-48)/Math.max(1,value('extraWatch').length)/.65),'#a8bdcc');
    }
    return base(out);
   }
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
   if(weeklyDates)out+=text(m,295,window.GraphicsWeeklyTeam.periodLabel(weeklyDates.start,weeklyDates.end,window.GraphicsLanguage?.locale||'sv-SE'),17,'#ffcf4a');
   const slots=['LW','C','RW','LD','RD','G'],ids=slots.map(s=>value('extraSix'+s)).filter(Boolean);
   if(new Set(ids).size!==ids.length)return missing('Välj olika spelare till varje position');
   const rinkW=W-m*2,rinkH=height;
   out+='<defs><linearGradient id="weeklyCard" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#19425e"/><stop offset=".55" stop-color="#102d42"/><stop offset="1" stop-color="#091a28"/></linearGradient><linearGradient id="weeklyRink" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0b263a" stop-opacity=".75"/><stop offset="1" stop-color="#07121b" stop-opacity=".35"/></linearGradient></defs><rect x="'+m+'" y="'+top+'" width="'+rinkW+'" height="'+rinkH+'" rx="38" fill="url(#weeklyRink)" stroke="#66879d" stroke-opacity=".28"/><line x1="'+m+'" y1="'+(top+rinkH*.5)+'" x2="'+(W-m)+'" y2="'+(top+rinkH*.5)+'" stroke="#a9c4d5" stroke-opacity=".11" stroke-width="2"/><circle cx="'+W/2+'" cy="'+(top+rinkH*.5)+'" r="'+Math.min(80,rinkW*.08)+'" fill="none" stroke="#89a8bc" stroke-opacity=".12"/>';
   const points=[[.18,.17],[.5,.17],[.82,.17],[.32,.50],[.68,.50],[.5,.815]];
   const inset=26,gap=16,groupGap=38,cw=wide?(rinkW-inset*2-gap*3-groupGap*2)/6:rinkW*.315,ch=wide?rinkH-104:Math.min(410,rinkH*.307);
   const cardX=i=>m+inset+i*cw+(i<3?i*gap:i<5?(i-1)*gap+groupGap:(i-2)*gap+groupGap*2);
   if(wide){
    const locale=window.GraphicsLanguage?.locale||'sv-SE',labels=locale.startsWith('fi')?['HYÖKKÄÄJÄT','PUOLUSTAJAT','MAALIVAHTI']:locale.startsWith('en')?['FORWARDS','DEFENSEMEN','GOALTENDER']:['FORWARDS','BACKAR','MÅLVAKT'];
    [[0,3],[3,2],[5,1]].forEach(([start,count],i)=>{
     out+=text(cardX(start),top+44,labels[i],19,'#a8bdcc');
     out+='<path d="M '+cardX(start)+' '+(top+57)+' H '+(cardX(start)+count*cw+(count-1)*gap)+'" stroke="#d5ad54" stroke-opacity=".5"/>';
    });
   }
   slots.forEach((slot,i)=>{
    const p=find('extraSix'+slot),[cx,cy]=points[i],x=wide?cardX(i):m+rinkW*cx-cw/2,y=wide?top+78:top+rinkH*cy-ch/2;
    const selected=weeklySelections[slot],auto=p&&selected&&String(p.sports_gamer_player_id)===String(selected.source_player_id)&&String(p.sports_gamer_team_id)===String(selected.source_team_id);
    const periodStats=p?window.GraphicsWeeklyTeam.periodPlayer(weeklyCandidates,p.sports_gamer_team_id,p.sports_gamer_player_id,slot):null;
    const metric=window.GraphicsWeeklyTeam.periodMetric(periodStats,slot,value('extraForwardMetric'),window.GraphicsLanguage?.locale||'sv-SE');
    const band=Math.max(76,ch*(wide?.22:.34)),photoH=ch-band,nameSize=p?Math.min(27,(cw-30)/Math.max(1,p.display_gamertag.length)/.68):24;
    out+='<g data-weekly-slot="'+slot+'"><rect x="'+x+'" y="'+y+'" width="'+cw+'" height="'+ch+'" rx="14" fill="url(#weeklyCard)" stroke="#d5ad54" stroke-width="2"/>';
    out+='<path d="M '+(x+cw*.68)+' '+y+' H '+(x+cw-14)+' L '+(x+cw*.55)+' '+(y+photoH)+' H '+(x+cw*.34)+' Z" fill="#a5c5dd" opacity=".045"/>';
    if(p){
     const url=portraitUrl(p),logo=lm.get(String(p.sports_gamer_team_id));
     if(url)out+=normalizedPortrait(url,x+5,y+3,cw-10,photoH+3,'weekly-'+slot,true,.73);
     else out+='<circle cx="'+(x+cw/2)+'" cy="'+(y+photoH*.3)+'" r="'+photoH*.18+'" fill="#385568"/><path d="M '+(x+cw*.15)+' '+(y+photoH)+' Q '+(x+cw*.18)+' '+(y+photoH*.55)+' '+(x+cw/2)+' '+(y+photoH*.55)+' Q '+(x+cw*.82)+' '+(y+photoH*.55)+' '+(x+cw*.85)+' '+(y+photoH)+' Z" fill="#385568"/>';
     out+='<rect x="'+x+'" y="'+(y+photoH-2)+'" width="'+cw+'" height="'+(band+2)+'" rx="10" fill="#06131f"/><path d="M '+(x+12)+' '+(y+photoH-2)+' H '+(x+cw-12)+'" stroke="#e6bd68" stroke-opacity=".7"/>';
     const flag=nationFlag(p,x+13,y+photoH+band*.41-23,29),nameX=x+13+(flag?38:0);
     const fittedNameSize=Math.min(nameSize,(cw-26-(flag?38:0))/Math.max(1,p.display_gamertag.length)/.68);
     if(flag)out+=flag;
     out+=text(nameX,y+photoH+band*.41,p.display_gamertag,fittedNameSize);
     out+='<path d="M '+(x+13)+' '+(y+photoH+band*.51)+' H '+(x+cw-13)+'" stroke="#d4b36a" stroke-opacity=".55"/>';
     out+=text(x+13,y+ch-13,metric||'MANUELLT VAL',Math.min(20,band*.26),'#ffcf4a');
     if(periodStats&&metric)out+=text(x+cw-13,y+ch-13,periodStats.games+' GP',Math.min(16,band*.23),'#a8bdcc','end');
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

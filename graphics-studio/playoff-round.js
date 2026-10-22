/* Editorial playoff round graphic. Reads the fresh session snapshot only. */
(()=>{
 'use strict';
 function seriesFromMatches(matches,start,end){
  const pairs=new Map(),seen=new Set();
  for(const m of matches||[]){
   if(m.stage!=='playoffs'||!m.id||seen.has(String(m.id)))continue;
   const date=new Date(m.date);if(!Number.isFinite(date.getTime()))continue;
   const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
   if(day<start||day>end)continue;
   const home=String(m.homeId||''),away=String(m.awayId||'');
   if(!home||!away||home===away||m.homeScore==null||m.awayScore==null)continue;
   const hs=Number(m.homeScore),as=Number(m.awayScore);if(!Number.isInteger(hs)||!Number.isInteger(as)||hs<0||as<0||hs===as)continue;
   seen.add(String(m.id));const ids=[home,away].sort(),key=ids.join(':');
   if(!pairs.has(key))pairs.set(key,{home:ids[0],away:ids[1],hw:0,aw:0,games:0});
   const p=pairs.get(key),winner=hs>as?home:away;p[winner===p.home?'hw':'aw']++;p.games++;
  }
  return [...pairs.values()];
 }
 function create(api){
  const {S,format,base,logos,img,svgText,esc}=api;
  const section=document.createElement('section');section.className='block';section.hidden=true;
  const get=id=>document.getElementById(id),field=(id,label,body)=>'<label><span>'+label+'</span>'+body.replace('ID',id)+'</label>';
  section.innerHTML='<div class="head"><b>AKTUELL SLUTSPELSOMGÅNG</b></div><p class="note">Välj omgång och kontrollera mötena. Serieställning visas som matchvinster, inte mål. Ingen gissning av slutspelsträd eller ännu ospelade möten.</p>'+field('prRound','OMGÅNG','<input id="ID" maxlength="45" value="Aktuell omgång" placeholder="T.ex. Åttondelsfinaler">')+field('prBest','SERIEFORMAT','<select id="ID"><option value="3">Bäst av 3</option><option value="5" selected>Bäst av 5</option><option value="7">Bäst av 7</option></select>')+'<div class="grid">'+field('prStart','FRÅN DATUM','<input id="ID" type="date">')+field('prEnd','TILL DATUM · INKLUSIVE','<input id="ID" type="date">')+'</div><button id="prFill" type="button" class="refresh">Fyll från rapporterade slutspelsmatcher</button><p id="prStatus" class="note" role="status">Hämta från SportsGamer först. Komplettera manuellt med möten som ännu inte spelats. Alla grupper ingår.</p>'+field('prPage','BILDSIDA · HÖGST 8 SERIER PER BILD','<select id="ID"><option value="0">Sida 1 · serie 1–8</option><option value="1">Sida 2 · serie 9–16</option></select>')+Array.from({length:16},(_,i)=>'<details class="pr-series"><summary>Serie '+(i+1)+'</summary><div class="grid">'+field('prHome'+i,'LAG 1','<select id="ID"></select>')+field('prAway'+i,'LAG 2','<select id="ID"></select>')+field('prHW'+i,'MATCHVINSTER · LAG 1','<input id="ID" type="number" min="0" max="4" step="1" value="0">')+field('prAW'+i,'MATCHVINSTER · LAG 2','<input id="ID" type="number" min="0" max="4" step="1" value="0">')+'</div></details>').join('');
  const tournament=document.getElementById('league')?.closest('section');
  if(tournament?.after)tournament.after(section);
  else (document.querySelector('.design-panel-body')||document.querySelector('aside'))?.append(section);
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());get('prEnd').value=today;get('prStart').value=today;
  let league=S.league;
  const value=id=>get(id).value;
  function reset(){for(let i=0;i<16;i++){get('prHome'+i).value='';get('prAway'+i).value='';get('prHW'+i).value='0';get('prAW'+i).value='0';}get('prPage').value='0';get('prStatus').textContent='Hämta från SportsGamer och välj datum för omgången. Alla grupper ingår.';}
  function sync(){
   section.hidden=S.kind!=='playoff_round';if(league!==S.league){league=S.league;reset();}
   if(section.hidden)return;
   const teams=[...new Map(S.teams.map(t=>[String(t.sports_gamer_team_id),t])).values()];
   const html='<option value="">Välj lag…</option>'+teams.map(t=>'<option value="'+esc(t.sports_gamer_team_id)+'">'+esc(t.team_name_in_league)+'</option>').join('');
   for(let i=0;i<16;i++)for(const side of ['Home','Away']){const el=get('pr'+side+i),selected=el.value;if(el.innerHTML!==html){el.innerHTML=html;el.value=teams.some(t=>String(t.sports_gamer_team_id)===selected)?selected:'';}}
  }
  get('prFill').onclick=()=>{
   const status=get('prStatus'),payload=api.getTransientData?.(),start=value('prStart'),end=value('prEnd');
   if(!payload||Number(payload.league_id)!==S.league){status.textContent='Hämta aktuellt underlag från SportsGamer först.';return;}
   if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>end){status.textContent='Välj giltigt datumintervall för just den här omgången.';return;}
   const pairs=seriesFromMatches(payload.matches,start,end),ids=new Set(S.teams.map(t=>String(t.sports_gamer_team_id)));
   if(!pairs.length){status.textContent='Inga rapporterade slutspelsmatcher under valda datum. Dina val är kvar. Lägg in ännu ospelade möten manuellt.';return;}
   if(pairs.length>16||pairs.some(p=>!ids.has(p.home)||!ids.has(p.away))||new Set(pairs.flatMap(p=>[p.home,p.away])).size!==pairs.length*2){status.textContent='Underlaget innehåller flera omgångar eller saknade lag. Avgränsa datumen eller fyll mötena manuellt. Dina val är kvar.';return;}
   if(!window.confirm('Ersätta bildens manuella möten med rapporterade serier under de valda datumen? Ospelade möten behöver kompletteras manuellt.'))return;
   reset();pairs.forEach((p,i)=>{get('prHome'+i).value=p.home;get('prAway'+i).value=p.away;get('prHW'+i).value=p.hw;get('prAW'+i).value=p.aw;});
   status.textContent=pairs.length+' serier från rapporterade matcher. Kontrollera omgång, serieformat och att ingen match saknas. Komplettera ospelade möten manuellt.';api.render();
  };
  section.addEventListener('input',()=>api.render());section.addEventListener('change',()=>api.render());
  function graphic(){
   const {w:W,h:H}=format(),m=W*.052,teams=new Map(S.teams.map(t=>[String(t.sports_gamer_team_id),t])),lm=logos(),entries=[];
   const text=(x,y,t,size=26,color='#fff',anchor='start')=>svgText(x,y,t,size,color,800,'text-anchor="'+anchor+'"');
   const missing=message=>base(text(W/2,H/2,message,26,'#bdd4e5','middle'));
   for(let i=0;i<16;i++){const home=value('prHome'+i),away=value('prAway'+i);if(!home&&!away)continue;const hw=Number(value('prHW'+i)),aw=Number(value('prAW'+i)),needed=(Number(value('prBest'))+1)/2;
    if(!home||!away||home===away||!teams.has(home)||!teams.has(away)||value('prHW'+i)===''||value('prAW'+i)===''||![hw,aw].every(n=>Number.isInteger(n)&&n>=0&&n<=needed)||hw===needed&&aw===needed)return missing('Kontrollera lag och matchvinster i serie '+(i+1));
    entries.push({home,away,hw,aw,needed});
   }
   if(new Set(entries.flatMap(p=>[p.home,p.away])).size!==entries.length*2)return missing('Ett lag finns i flera serier. Kontrollera omgången.');
   const page=Number(value('prPage')),shown=entries.slice(page*8,page*8+8);
   if(!shown.length)return missing(page?'Inga serier på sida 2':'Välj slutspelsmöten i panelen till höger');
   const columns=W>H?(shown.length>4?4:2):2,rows=Math.ceil(shown.length/columns),top=Math.max(365,H*.19+120),bottom=H-100,gap=W>H?20:16,cw=(W-2*m-gap*(columns-1))/columns,ch=(bottom-top-gap*(rows-1))/rows;
   let out=text(m,top-55,value('prRound').toUpperCase(),Math.min(32,(W-2*m)/Math.max(1,value('prRound').length)/.65),'#ffcf4a')+text(m,top-20,'BÄST AV '+value('prBest')+' · MATCHVINSTER'+(entries.length>8?' · SIDA '+(page+1)+'/2':''),18,'#aac1d0');
   shown.forEach((p,i)=>{const x=m+i%columns*(cw+gap),y=top+Math.floor(i/columns)*(ch+gap),logoSize=Math.min(76,ch*.31,cw*.17),font=Math.min(26,ch*.115,cw*.047),nameW=cw-logoSize-85,rowH=(ch-28)/2;
    out+='<g data-playoff-series="'+i+'"><rect x="'+x+'" y="'+y+'" width="'+cw+'" height="'+ch+'" rx="14" fill="#071a28" fill-opacity=".9" stroke="#9d8745"/>';
    for(const [side,wins,j]of [[p.home,p.hw,0],[p.away,p.aw,1]]){const cy=y+14+j*rowH,rowY=cy+rowH*.5,name=teams.get(side).team_name_in_league||'',url=lm.get(side),won=wins===p.needed;
     if(url&&S.logos)out+=img(url,x+14,rowY-logoSize/2,logoSize);
     out+=text(x+24+logoSize,rowY+font*.34,name,Math.min(font,nameW/Math.max(1,name.length)/.60),won?'#ffcf4a':'#fff')+text(x+cw-23,rowY+font*.38,String(wins),Math.min(42,ch*.22),won?'#ffcf4a':'#fff','end');
    }
    out+='</g>';
   });
   return base(out);
  }
  return {sync,reset,graphic};
 }
 const api={seriesFromMatches,create};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.GraphicsPlayoffs=api;
})();


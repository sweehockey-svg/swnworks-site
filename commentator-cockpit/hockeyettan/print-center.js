(function(global){
  'use strict';
  global.createCockpitPrintCenter=function(api){
    const {state,esc,getTeamName,swedishDate,lineupPrintDocument,lineupContextForTeam,humanSourceName,cleanLineupSourceName,currentEditorialNotes,noteScopeLabel}=api;
    const selected=new Set(['lines','players']);
    const options={textSize:'normal',extraWriting:false};
    const choices=[['lines','Kedjor','Båda lagens uppställningar och skrivyta.'],['players','Spelarlistor','Nummerordning, position och säsongens matcher, mål, assist och poäng.'],['match','Matchunderlag','Matchinfo, tabellplacering, senaste fem och tidigare möten.'],['notes','Anteckningar','Dina sparade anteckningar som hör till matchen.'],['ai','AI · Talking points','Generera ett kommentatorsblad med upp till sex pratpunkter, underlag och skrivyta.']];
    let preferenceOwner=null,storageAvailable=true;
    const storageMessage=()=>storageAvailable?'Dina val sparas automatiskt för ditt konto i den här webbläsaren.':'Dina val gäller under den här sessionen. Webbläsaren kunde inte spara dem.';
    function syncPreferences(){
      const owner=String(state.authUser?.id||'guest');
      if(owner===preferenceOwner)return;
      preferenceOwner=owner;selected.clear();selected.add('lines');selected.add('players');
      options.textSize='normal';options.extraWriting=false;storageAvailable=true;
      try{
        const saved=JSON.parse(global.localStorage.getItem('cockpit-print-preferences:v1:'+owner)||'null');
        if(!saved||typeof saved!=='object')return;
        if(Array.isArray(saved.parts)){
          selected.clear();saved.parts.filter(id=>choices.some(([valid])=>valid===id)).forEach(id=>selected.add(id));
        }
        options.textSize=saved.textSize==='large'?'large':'normal';
        options.extraWriting=saved.extraWriting===true;
      }catch{storageAvailable=false;}
    }
    function savePreferences(){
      try{
        global.localStorage.setItem('cockpit-print-preferences:v1:'+preferenceOwner,JSON.stringify({parts:[...selected],textSize:options.textSize,extraWriting:options.extraWriting}));storageAvailable=true;
      }catch{storageAvailable=false;}
    }
    syncPreferences();
    const ids=()=>[state.nextGame?.home_team_id||state.focusTeam?.id,state.nextGame?.away_team_id||state.opponent?.id].filter(Boolean);
    const name=row=>humanSourceName(cleanLineupSourceName(row.source_name||''));
    const key=row=>name(row).trim().toLocaleLowerCase('sv-SE');
    function roster(teamId){
      const rows=[];
      for(const row of [...(lineupContextForTeam(teamId)?.players||[]),...(state.searchRoster||[]),...(state.seasonPlayerStats||[]),...(state.seasonGoalieStats||[])].filter(r=>r.team_id===teamId)){
        if(!rows.some(r=>r.player_id&&row.player_id?r.player_id===row.player_id:key(r)===key(row)))rows.push(row);
      }
      return rows.sort((a,b)=>(Number(a.jersey_number??9999)-Number(b.jersey_number??9999))||name(a).localeCompare(name(b),'sv'));
    }
    function players(teamId){
      const rows=roster(teamId);
      return '<h2>'+esc(getTeamName(teamId))+' · Spelarlista</h2><p>Säsongstrupp och tillgänglig matchuppställning · '+esc(api.seasonLabel)+' · Sorterad på tröjnummer. Alla spelare behöver inte vara uttagna till matchen.</p><table><thead><tr>'+['Nr','Spelare','Pos','Matcher','Mål','Assist','Poäng','Egna noteringar'].map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>{
        const matches=(state.seasonPlayerStats||[]).filter(r=>r.team_id===teamId&&(row.player_id&&r.player_id?row.player_id===r.player_id:key(row)===key(r)));
        const s=matches.length===1?matches[0]:{};
        return '<tr><td><b>'+esc(row.jersey_number??'–')+'</b></td><td>'+esc(name(row))+'</td><td>'+esc(row.position==='CE'?'C':row.position||'–')+'</td>'+['games_played','goals','assists','points'].map(k=>'<td>'+esc(s[k]??'–')+'</td>').join('')+'<td class="writing"></td></tr>';
      }).join('')+'</tbody></table>'+(!rows.length?'<p>Spelaruppgifter saknas för laget.</p>':'')+'<p>– = uppgift saknas. Säsongsstatistik för utespelare; målvakter visas utan utespelarstatistik.</p>';
    }
    function resultList(games){
      return games.length?'<table><thead><tr><th>Datum</th><th>Hemma</th><th>Resultat</th><th>Borta</th></tr></thead><tbody>'+games.map(g=>'<tr><td>'+esc(swedishDate(g.scheduled_start))+'</td><td>'+esc(getTeamName(g.home_team_id))+'</td><td>'+esc(g.home_score??'–')+'–'+esc(g.away_score??'–')+'</td><td>'+esc(getTeamName(g.away_team_id))+'</td></tr>').join('')+'</tbody></table>':'<p>Matchuppgifter saknas.</p>';
    }
    function match(){
      return '<h2>Matchunderlag</h2><div class="match-columns">'+ids().map(id=>{
        const standing=state.standingsByTeam?.get(id);
        const form=id===state.focusTeam?.id?state.focusForm:state.opponentForm;
        return '<section><h3>'+esc(getTeamName(id))+'</h3><p>'+ (standing?'Tabellplats '+esc(standing.rank??'–')+' · '+esc(standing.points??'–')+' poäng · '+esc(standing.games_played??'–')+' matcher':'Tabelluppgifter saknas.')+'</p><h3>Senaste fem</h3>'+resultList((form||[]).slice(0,5))+'</section>';
      }).join('')+'</div><h3>Tidigare möten · senaste fem tillgängliga</h3>'+resultList((state.h2hGames||[]).slice(0,5))+'<div class="notes"><h3>Egna noteringar</h3><div></div><div></div></div>';
    }
    function notes(){
      const rows=currentEditorialNotes();
      return '<h2>Egna anteckningar</h2>'+(rows.length?rows.map(n=>'<article class="editorial-note"><small>'+esc(noteScopeLabel(n))+(n.pinned?' · FÄST':'')+'</small><h3>'+esc(n.title||'Anteckning')+'</h3><p>'+esc(n.body||'')+'</p></article>').join(''):'<p>Inga sparade anteckningar för den här matchen.</p>')+'<div class="notes handwriting"><h3>Fler noteringar</h3>'+Array.from({length:rows.length?10:20},()=>'<div class="rule"></div>').join('')+'</div>';
    }
    function documentHtml(parts=selected){
      syncPreferences();
      const included=new Set(parts);
      const base=lineupPrintDocument();
      const head=base.slice(0,base.indexOf('</head>'));
      const header=base.slice(base.indexOf('<header>'),base.indexOf('</header>')+9);
      const footer=base.slice(base.indexOf('<footer>'),base.indexOf('</footer>')+9);
      const pages=[];
      for(const [kind] of choices){
        if(!included.has(kind))continue;
        if(kind==='lines')pages.push(base.slice(base.indexOf('<main'),base.indexOf('</main>')+7));
        if(kind==='players')for(const id of ids())pages.push(players(id));
        if(kind==='match')pages.push(match());
        if(kind==='notes')pages.push(notes());
        if(kind==='ai')pages.push(api.aiPrintHtml());
      }
      const extra=options.extraWriting?'<section class="extra-writing"><h3>Extra skrivyta</h3>'+Array.from({length:5},()=>'<div></div>').join('')+'</section>':'';
      const optionCss='.extra-writing{margin-top:3mm;break-inside:avoid}.extra-writing div{height:7mm;border-bottom:1px solid #bbb}body.print-large{font-size:12pt}body.print-large header p{font-size:11pt}body.print-large .status{font-size:10pt}body.print-large h3{font-size:10pt}body.print-large table{font-size:11pt}body.print-large th{font-size:10pt}body.print-large .player{min-height:13mm}body.print-large .player span{font-size:11pt}body.print-large .player small{font-size:8pt}body.print-large .player b{font-size:22pt}body.print-large .editorial-note small{font-size:10pt}body.print-large .ai-print-point h3{font-size:11pt}body.print-large .ai-print-point p{font-size:11pt}body.print-large .ai-print-point .ai-print-why{font-size:10pt}body.print-large .ai-print-point small,body.print-large .ai-print-meta{font-size:9pt}';
      return head+'<style>.ai-print-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3mm;flex:1}.ai-print-point{border:1px solid #aaa;padding:2mm;break-inside:avoid;overflow-wrap:anywhere}.ai-print-point h3{font-size:9pt}.ai-print-point p{font-size:9pt;margin:1.5mm 0;line-height:1.35}.ai-print-point small,.ai-print-meta{font-size:7pt}.ai-print-point .ai-print-why{font-size:8pt;color:#444}.print-sheet:has(.ai-print-sheet){min-height:185mm;display:flex;flex-direction:column}.ai-print-sheet{display:flex;flex-direction:column;flex:1}.ai-print-sheet>h2{font-size:13pt}.print-sheet{break-before:page}.print-sheet:first-child{break-before:auto}.print-sheet:has(.handwriting){min-height:185mm;display:flex;flex-direction:column}.handwriting{display:flex;flex-direction:column;flex:1;break-inside:auto}.handwriting .rule{flex:1;min-height:6mm;height:auto;border-bottom:1px solid #bbb}.handwriting h3{flex:none}table{border-collapse:collapse;width:100%;margin:2mm 0 3mm;font-size:9pt}th,td{border-bottom:1px solid #bbb;text-align:left;padding:1.2mm 1mm}thead{display:table-header-group}tr{break-inside:avoid}th{font-size:8pt}.writing{width:24%}.match-columns{display:grid;grid-template-columns:1fr 1fr;gap:6mm}.editorial-note{border-bottom:1px solid #aaa;padding:2mm 0;break-inside:avoid}.editorial-note p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.4}.editorial-note h3{margin-top:1mm}.editorial-note small{font-size:8pt}p{line-height:1.4}footer{break-inside:avoid}</style><style>'+optionCss+'</style></head><body class="'+(options.textSize==='large'?'print-large':'print-normal')+'">'+pages.map(content=>'<section class="print-sheet">'+header+content+extra+footer+'</section>').join('')+'</body></html>';
    }
    function render(){
      syncPreferences();
      return '<section class="print-center"><p class="print-center-intro">Samla ditt matchpaket på papper eller spara det som PDF. Välj de blad du vill ha med.</p><fieldset class="print-settings"><legend>Utseende på papper</legend><label>Textstorlek<select id="printTextSize" data-print-setting><option value="normal"'+(options.textSize==='normal'?' selected':'')+'>Normal</option><option value="large"'+(options.textSize==='large'?' selected':'')+'>Stor – lättare att läsa</option></select></label><label class="print-extra-toggle"><input id="printExtraWriting" data-print-setting type="checkbox"'+(options.extraWriting?' checked':'')+'>Extra skrivyta · fem extra rader per blad</label><small><span id="printPreferencesStatus">'+esc(storageMessage())+'</span> Valen gäller även snabbknapparna i vyerna. Stor text och extra skrivyta kan ge fler sidor.</small></fieldset><div class="print-choices">'+choices.map(([id,title,description])=>'<label class="print-choice"><input type="checkbox" data-print-part="'+id+'"'+(selected.has(id)?' checked':'')+'><span><strong>'+title+'</strong><small>'+description+'</small></span></label>').join('')+'</div><div class="print-center-actions"><button id="printPackage" type="button">Skriv ut / spara som PDF</button><button id="previewPackage" type="button">Förhandsvisa</button><p id="printPackageSummary" role="status" aria-live="polite"></p></div><p>Liggande A4 · Svartvitt · Uppställningarnas status och utskriftstid följer med. Välj ”Spara som PDF” i utskriftsrutan.</p><div id="printPreviewContainer"></div></section>';
    }
    function bind(root){
      const print=root.querySelector('#printPackage'),preview=root.querySelector('#previewPackage');
      function update(){
        const count=Number(selected.has('lines'))+(selected.has('players')?ids().length:0)+Number(selected.has('match'))+Number(selected.has('notes'))+Number(selected.has('ai'));
        root.querySelector('#printPackageSummary').textContent=count?'Cirka '+count+' sidor med normal text. Stor text, extra skrivyta och långa texter kan ge fler sidor.':'Välj minst ett blad.';
        print.disabled=preview.disabled=!count;
        root.querySelector('#printPreviewContainer').replaceChildren();
        root.querySelector('#printPreferencesStatus').textContent=storageMessage();
      }
      root.querySelectorAll('[data-print-part]').forEach(input=>input.addEventListener('change',()=>{input.checked?selected.add(input.dataset.printPart):selected.delete(input.dataset.printPart);savePreferences();update();}));
      let previewHtml=null;
      root.querySelectorAll('[data-print-setting]').forEach(input=>input.addEventListener('change',()=>{
        options.textSize=root.querySelector('#printTextSize').value==='large'?'large':'normal';
        options.extraWriting=root.querySelector('#printExtraWriting').checked;
        previewHtml=null;savePreferences();update();
      }));
      root.querySelectorAll('[data-print-part]').forEach(input=>input.addEventListener('change',()=>{previewHtml=null;}));
      async function run(showPreview){
        const controls=[print,preview,...root.querySelectorAll('[data-print-part],[data-print-setting]')];
        controls.forEach(control=>control.disabled=true);
        const status=root.querySelector('#printPackageSummary');
        status.textContent=selected.has('ai')?'Genererar pratpunktsblad…':'Förbereder matchpaket…';
        try{
          if(showPreview||!previewHtml){
            if(selected.has('ai'))await api.prepareAiPrint(true);
            if(!root.querySelector('#printPackageSummary')?.isSameNode(status))return;
            previewHtml=documentHtml();
          }
          if(showPreview){
            const frame=document.createElement('iframe');frame.title='Förhandsvisning av matchpaket';frame.className='print-package-preview';frame.srcdoc=previewHtml;root.querySelector('#printPreviewContainer').replaceChildren(frame);
          }else api.printDocument(previewHtml);
          status.textContent='Matchpaketet är klart. Långa texter kan ge fler sidor.';
        }catch(error){status.textContent=error.message||'Kunde inte förbereda utskriften. Försök igen.';}
        finally{controls.forEach(control=>control.disabled=false);}
      }
      print.onclick=()=>run(false);
      preview.onclick=()=>run(true);
      update();
    }
    return {render,bind,documentHtml,roster,selected,options};
  };
})(window);

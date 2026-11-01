(function(global){
  'use strict';
  global.createCockpitPrintCenter=function(api){
    const {state,esc,getTeamName,swedishDate,lineupPrintDocument,lineupContextForTeam,humanSourceName,cleanLineupSourceName,currentEditorialNotes,noteScopeLabel}=api;
    const selected=new Set(['lines','players']);
    const choices=[['lines','Kedjor','Båda lagens uppställningar och skrivyta.'],['players','Spelarlistor','Nummerordning, position och säsongens matcher, mål, assist och poäng.'],['match','Matchunderlag','Matchinfo, tabellplacering, senaste fem och tidigare möten.'],['notes','Anteckningar','Dina sparade anteckningar som hör till matchen.']];
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
      }
      return head+'<style>.print-sheet{break-before:page}.print-sheet:first-child{break-before:auto}.print-sheet:has(.handwriting){min-height:185mm;display:flex;flex-direction:column}.handwriting{display:flex;flex-direction:column;flex:1;break-inside:auto}.handwriting .rule{flex:1;min-height:6mm;height:auto;border-bottom:1px solid #bbb}.handwriting h3{flex:none}table{border-collapse:collapse;width:100%;margin:2mm 0 3mm;font-size:9pt}th,td{border-bottom:1px solid #bbb;text-align:left;padding:1.2mm 1mm}thead{display:table-header-group}tr{break-inside:avoid}th{font-size:8pt}.writing{width:24%}.match-columns{display:grid;grid-template-columns:1fr 1fr;gap:6mm}.editorial-note{border-bottom:1px solid #aaa;padding:2mm 0;break-inside:avoid}.editorial-note p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.4}.editorial-note h3{margin-top:1mm}.editorial-note small{font-size:8pt}p{line-height:1.4}footer{break-inside:avoid}</style></head><body>'+pages.map(content=>'<section class="print-sheet">'+header+content+footer+'</section>').join('')+'</body></html>';
    }
    function render(){
      return '<section class="print-center"><p class="print-center-intro">Samla ditt matchpaket på papper eller spara det som PDF. Välj de blad du vill ha med.</p><div class="print-choices">'+choices.map(([id,title,description])=>'<label class="print-choice"><input type="checkbox" data-print-part="'+id+'"'+(selected.has(id)?' checked':'')+'><span><strong>'+title+'</strong><small>'+description+'</small></span></label>').join('')+'</div><div class="print-center-actions"><button id="printPackage" type="button">Skriv ut / spara som PDF</button><button id="previewPackage" type="button">Förhandsvisa</button><p id="printPackageSummary" role="status" aria-live="polite"></p></div><p>Liggande A4 · Svartvitt · Uppställningarnas status och utskriftstid följer med. Välj ”Spara som PDF” i utskriftsrutan.</p><div id="printPreviewContainer"></div></section>';
    }
    function bind(root){
      const print=root.querySelector('#printPackage'),preview=root.querySelector('#previewPackage');
      function update(){
        const count=Number(selected.has('lines'))+(selected.has('players')?ids().length:0)+Number(selected.has('match'))+Number(selected.has('notes'));
        root.querySelector('#printPackageSummary').textContent=count?'Cirka '+count+' sidor. Långa listor och anteckningar kan ge fler sidor.':'Välj minst ett blad.';
        print.disabled=preview.disabled=!count;
        root.querySelector('#printPreviewContainer').replaceChildren();
      }
      root.querySelectorAll('[data-print-part]').forEach(input=>input.addEventListener('change',()=>{input.checked?selected.add(input.dataset.printPart):selected.delete(input.dataset.printPart);update();}));
      print.onclick=()=>api.printDocument(documentHtml());
      preview.onclick=()=>{
        const frame=document.createElement('iframe');frame.title='Förhandsvisning av matchpaket';frame.className='print-package-preview';frame.srcdoc=documentHtml();root.querySelector('#printPreviewContainer').replaceChildren(frame);
      };
      update();
    }
    return {render,bind,documentHtml,roster,selected};
  };
})(window);

(function(global){
  'use strict';
  global.createCockpitAiPrint=function(api){
    let sheet=null,pending=null;
    const context=()=>api.contextKey();
    const unique=points=>{
      const seen=new Set();
      return points.filter(p=>{
        if(typeof p?.text!=='string'||!p.text.trim())return false;
        const key=p.text.replace(/\s+/g,' ').trim().toLocaleLowerCase('sv-SE');
        if(seen.has(key))return false;seen.add(key);return true;
      }).slice(0,6);
    };
    async function generate(key){
      const batches=[];
      let fallback=false;
      const questions=[
        'Gör tre korta, olika talking points till ett utskrivet kommentatorsblad: matchläge, lagens form och tidigare möten. Högst 35 ord per punkt och 10 ord i why_now. Använd bara tillgängliga källor; undvik spekulation.',
        'Gör tre korta, olika talking points till ett utskrivet kommentatorsblad: nyckelspelare, målvakter och powerplay/boxplay. Högst 35 ord per punkt och 10 ord i why_now. Använd bara tillgängliga källor; undvik spekulation och upprepningar om lagform och tidigare möten.'
      ];
      for(const question of questions){
        if(context()!==key)throw Error('Match eller konto har ändrats. Generera bladet igen.');
        let result;
        try{result=await api.requestServerAi(question,'relevant');}catch{result={used:false};}
        if(context()!==key)throw Error('Match eller konto har ändrats. Generera bladet igen.');
        if(!result?.used||!result.brief?.talking_points?.length){fallback=true;break;}
        batches.push(...result.brief.talking_points.map(p=>({...p})));
      }
      // A source category can be missing, or two answers can repeat a point.
      // Ask for another supported angle rather than leaving a vacant sixth slot.
      for(let attempt=0;!fallback&&unique(batches).length<6&&attempt<2;attempt++){
        if(context()!==key)throw Error('Match eller konto har ändrats. Generera bladet igen.');
        const existing=unique(batches);
        const covered=existing.map(p=>p.label||'').join(', ').slice(0,140);
        const question='Komplettera kommentatorsbladet med '+(6-existing.length)+' NYA korta pratpunkter. Redan täckt: '+covered+'. Välj andra belagda vinklar, t.ex. tabelläge, utvisningar, skott/räddningar eller en annan spelare. Högst 35 ord per punkt och 10 ord i why_now. Upprepa inte tidigare punkter. Använd bara tillgängliga källor. Saknas tidigare möten, välj annan vinkel.';
        let result;
        try{result=await api.requestServerAi(question,'relevant');}catch{break;}
        if(context()!==key)throw Error('Match eller konto har ändrats. Generera bladet igen.');
        if(!result?.used||!result.brief?.talking_points?.length)break;
        batches.push(...result.brief.talking_points.map(p=>({...p})));
      }
      // Use one clearly labelled source mode for the entire sheet when AI fails.
      const brief=fallback?api.localAiBrief('',6):null;
      const points=unique(fallback?(brief?.talking_points||[]):batches);
      if(!points.length)throw Error('Matchunderlaget är för tunt för ett pratpunktsblad just nu.');
      sheet={key,points,fallback,created:new Date().toISOString()};
      return sheet;
    }
    async function prepare(force=false){
      const key=context();
      if(pending){
        if(pending.key!==key)throw Error('En tidigare generering pågår. Försök igen om en stund.');
        return pending.promise;
      }
      if(!force&&sheet?.key===key)return sheet;
      const promise=generate(key);pending={key,promise};
      try{return await promise;}finally{pending=null;}
    }
    function html(){
      if(!sheet||sheet.key!==context())throw Error('Generera pratpunktsbladet för aktuell match först.');
      const esc=api.esc;
      const labels={game:'Matchinfo',standings:'Tabell',form_last_5:'Senaste fem',h2h:'Tidigare möten',special_teams:'Special teams',top_skaters:'Spelarstatistik',goalies:'Målvaktsstatistik',current_match_stats:'Aktuell matchstatistik',current_events:'Matchhändelser',editorial_notes:'Egna anteckningar',verified_stats:'Verifierat matchunderlag',player_background:'Spelarbakgrund',player_registrations:'Truppregistrering',personal_player_history:'Egen spelarhistorik'};
      const stamp=new Intl.DateTimeFormat('sv-SE',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Stockholm'}).format(new Date(sheet.created));
      return '<div class="ai-print-sheet"><h2>Talking points · Kommentatorsblad</h2><p class="ai-print-meta">'+(sheet.fallback?'REGELBASERAT MATCHUNDERLAG · Ingen AI-generering':'AI-GENERERADE PRATPUNKTER')+' · Skapat '+esc(stamp)+' (svensk tid)</p>'+
        (sheet.fallback?'<p>AI-tjänsten kunde inte leverera ett komplett blad. Punkterna nedan är sammanställda från tillgängliga matchuppgifter.</p>':'')+
        (sheet.points.length<6?'<p>'+sheet.points.length+' punkter med tillgängligt underlag. Fler uppgifter saknas.</p>':'')+
        '<div class="ai-print-grid">'+sheet.points.map((p,i)=>{
          const refs=Array.isArray(p.source_refs)?p.source_refs:[];
          const sources=Array.isArray(p.sources)?p.sources:[];
          const sourceLabels=[...new Set(sources.map(s=>s.label||labels[s.category]||s.category).concat(refs.map(r=>labels[r]||r)).filter(Boolean))];
          return '<article class="ai-print-point"><h3>'+esc(i+1)+'. '+esc(p.label||'Pratpunkt')+'</h3><p>'+esc(p.text)+'</p>'+(p.why_now?'<p class="ai-print-why">'+esc(p.why_now)+'</p>':'')+'<small>Underlag: '+esc(sourceLabels.join(' · ')||'Källhänvisning saknas – kontrollera före användning')+'</small></article>';
        }).join('')+'</div><div class="notes"><h3>Egna tillägg</h3><div></div><div></div></div></div>';
    }
    return {prepare,html};
  };
})(window);

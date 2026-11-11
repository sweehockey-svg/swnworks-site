(function(root){
  "use strict";
  const families=["tourpoints","tourgoalies","tourstats"], phases=["","regular","playoff"];
  const copy={
    sv:["Turnering","Turneringens poängliga","Turneringens målvaktsliga","Turneringen i siffror","Totalt","Gruppspel","Slutspel","Minst 3 matcher","Totalt: SV% viktad efter spelade matcher","Inga resultat att visa","Spelade matcher","Mål per match","Målrikaste match","Flest lagmål","Hämtar matchresultat…","Matchresultaten kunde inte hämtas"],
    en:["Tournament","Tournament scoring leaders","Tournament goalie leaders","Tournament in numbers","Overall","Group stage","Playoffs","At least 3 games","Overall: SV% weighted by games played","No results to display","Games played","Goals per game","Highest-scoring game","Most team goals","Loading results…","Results could not be loaded"],
    fi:["Turnaus","Turnauksen pistepörssi","Turnauksen maalivahtipörssi","Turnaus lukuina","Yhteensä","Lohkovaihe","Pudotuspelit","Vähintään 3 ottelua","Yhteensä: ottelumäärillä painotettu SV%","Ei näytettäviä tuloksia","Pelatut ottelut","Maalia ottelua kohden","Maalirikkain ottelu","Eniten joukkuemaaleja","Haetaan tuloksia…","Tuloksia ei voitu hakea"],
    de:["Turnier","Turnier-Punkteliga","Turnier-Torhüter","Turnier in Zahlen","Gesamt","Gruppenphase","Playoffs","Mindestens 3 Spiele","Gesamt: SV% nach Spielen gewichtet","Keine Ergebnisse verfügbar","Gespielte Partien","Tore pro Spiel","Torreichstes Spiel","Meiste Teamtore","Ergebnisse werden geladen…","Ergebnisse nicht verfügbar"]
  };
  const words=lang=>copy[lang]||copy.en;
  const parse=scene=>{
    const family=families.find(f=>phases.some(p=>scene===f+p));
    return family?{family,phase:scene.slice(family.length)}:null;
  };
  function labels(lang){
    const t=words(lang);
    return Object.fromEntries(families.flatMap((f,i)=>phases.map((p,j)=>[f+p,t[i+1]+(j?" · "+t[4+j]:"")])));
  }
  function mount(group,lang,table){
    const t=words(lang), doc=group.ownerDocument;
    function button(scene,label){
      const b=doc.createElement("button");b.type="button";b.dataset.scene=scene;b.textContent=label;return b;
    }
    group.setAttribute("role","group");group.setAttribute("aria-label",t[0]);
    const caption=doc.createElement("span");caption.className="tournament-caption";caption.textContent=t[0];
    group.append(caption,table);
    families.forEach((f,i)=>{
      const base=button(f,t[i+1]);base.dataset.tournamentBase="";group.append(base);
    });
    families.forEach(f=>{
      const filters=doc.createElement("div");filters.className="tournament-filters";filters.dataset.tournamentFilters=f;filters.hidden=true;
      phases.forEach((p,i)=>{const b=button(f+p,t[i+4]);b.dataset.tournamentPhase="";filters.append(b);});
      group.append(filters);
    });
  }
  function sync(group,scene){
    const family=parse(scene)?.family;
    group?.querySelectorAll("[data-tournament-filters]").forEach(el=>{el.hidden=el.dataset.tournamentFilters!==family;});
    group?.querySelectorAll("[data-tournament-base]").forEach(el=>el.classList.toggle("active",el.dataset.scene===family));
  }
  const num=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
  const pct=v=>v===null||v>100?null:(v<=1?v*100:v);
  function rank(players,phase,goalie){
    const stages=phase?[phase]:["regular","playoff"], grouped=new Map();
    for(const p of players){
      const id=Number(p.sports_gamer_player_id), team=Number(p.sports_gamer_team_id);
      if(!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(team)||team<=0)continue;
      const entry=grouped.get(id)||{id,player:p,teams:new Map(),gp:0,goals:0,assists:0,points:0,pim:0,so:0,weightedSv:0,incomplete:false};
      for(const s of stages){
        const games=num(p[s+"_"+(goalie?"goalie_games":"skater_games")]);
        if(!games)continue;
        entry.gp+=games;
        const teamRow=entry.teams.get(team)||{gp:0,player:p,team};
        teamRow.gp+=games;entry.teams.set(team,teamRow);
        if(goalie){
          const sv=pct(num(p[s+"_goalie_save_percentage"]));
          entry.incomplete ||= sv===null;
          entry.weightedSv+=(sv??0)*games;
          entry.so+=num(p[s+"_goalie_shutouts"])??0;
        }else{
          const g=num(p[s+"_goals"]), a=num(p[s+"_assists"]), pts=num(p[s+"_points"]);
          entry.incomplete ||= pts===null&&(g===null||a===null);
          entry.goals+=g??0;entry.assists+=a??0;
          entry.points+=pts??((g??0)+(a??0));entry.pim+=num(p[s+"_penalty_minutes"])??0;
        }
      }
      grouped.set(id,entry);
    }
    return [...grouped.values()].filter(p=>!p.incomplete&&p.gp>=(goalie?3:1)).map(({teams,...p})=>{
      const chosen=[...teams.values()].sort((a,b)=>b.gp-a.gp||a.team-b.team)[0];
      return {...p,player:chosen.player,team:chosen.team,sv:p.weightedSv/p.gp};
    }).sort((a,b)=>(goalie?b.sv-a.sv||b.gp-a.gp:b.points-a.points||b.goals-a.goals||a.gp-b.gp)||a.id-b.id);
  }
  function summarize(matches,phase){
    const totals=new Map();let games=0,goals=0,highest=null;
    for(const m of matches){
      if(phase&&m.stage!==(phase==="playoff"?"playoffs":phase))continue;
      const sum=m.homeScore+m.awayScore;games++;goals+=sum;
      if(!highest||sum>highest.total)highest={...m,total:sum};
      for(const side of ["home","away"]){
        const id=m[side+"Id"],row=totals.get(id)||{id,name:m[side],goals:0};
        row.goals+=m[side+"Score"];totals.set(id,row);
      }
    }
    return {games,goals,highest,topTeam:[...totals.values()].sort((a,b)=>b.goals-a.goals||a.id-b.id)[0]};
  }
  const api={words,parse,labels,mount,sync,rank,summarize};
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.BroadcastTournamentScenes=api;
})(globalThis);

// Match-TV embeds this canonical viewer from the Svensk eHockey origin.
// Only that known parent window may control local viewer audio.
window.SWNViewerBridge=(()=>{
  const allowed=new Set([location.origin,'https://www.svenskehockey.se','https://svenskehockey.se','https://swnworks.se','https://www.swnworks.se']);
  let origin=location.origin;
  try{const candidate=new URL(document.referrer).origin;if(allowed.has(candidate))origin=candidate;}catch{}
  return Object.freeze({
    origin,
    acceptsAudio:event=>event.origin===origin&&event.source===parent&&event.data?.type==='seh-tv-audio'&&typeof event.data.muted==='boolean',
    postStatus:message=>{if(parent!==window)parent.postMessage(message,origin);}
  });
})();
(() => {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const COMPETITIONS = {
    520:{id:520,code:"SEC",label:"SEC 21",logo:"https://www.svenskehockey.se/assets/SECLOGGA.png"},
    524:{id:524,code:"GCL",label:"GCL 13 · DIV I",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/SportsGamer/leagues/GCL/Season_12/GCL_logo_new_350x350.png"},
    525:{id:525,code:"GCL",label:"GCL 13 · DIV II",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/SportsGamer/leagues/GCL/Season_12/GCL_logo_new_350x350.png"},
    526:{id:526,code:"GCL",label:"GCL 13 · POKAL",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/SportsGamer/leagues/GCL/Season_12/GCL_logo_new_350x350.png"},
    527:{id:527,code:"SCL",label:"SCL 27",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/NHLGamer/Community/uploads/monthly_2021_08/small.SCL_logo_shading.png.f99772ef717dcd328c35b5469ac1cbc2.png"},
    523:{id:523,code:"WECL",label:"WECL",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/NHLGamer/WECL/WECL_logo.png"},
    529:{id:529,code:"FCL",label:"FCL 27",logo:"https://sportsgamer.gg/community/gallery/image/374-fcl_logopng/?do=download"},
    532:{id:532,code:"WV",label:"WV 4 Nations 2026",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/SportsGamer/tournaments/WV_4_Nations/WV_logo.png"}
  };
  let activeLeagueId = Number($("#tournament")?.value || 520);
  const competition = () => COMPETITIONS[activeLeagueId] || COMPETITIONS[520];
  const competitionBadge = code => "data:image/svg+xml;charset=UTF-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 112"><path fill="#f4b21b" d="M50 2 96 19 88 88 50 110 12 88 4 19z"/><path fill="#07111a" d="M50 10 87 24 80 82 50 100 20 82 13 24z"/><text x="50" y="64" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="25" fill="#f4b21b">'+code+'</text></svg>');
  const competitionLogo = c => c.logo || competitionBadge(c.code);
  const LOCALE = (document.documentElement.lang || "sv").toLowerCase().split("-")[0];
  const STRINGS = {
    sv:{commentator:"KOMMENTATOR",group:"GRUPP",groupstage:"GRUPPSPEL",playoffs:"SLUTSPEL",goals:"MÅL",goalsPerGame:"MÅL / MATCH",goalsAgainstPerGame:"INSLÄPPT / MATCH",goalDiff:"MÅLSKILLNAD",totalResult:"TOTALT RESULTAT",teamGoals:"LAGMÅL",playerGoals:"SPELARMÅL",mostGoals:"FLERST MÅL",wins:"vinster",series:"serier",matchWins:"matchvinster",dataMissing:"DATA SAKNAS",groupTables:"GRUPPSPELSTABELLER",currentTournament:"AKTUELL TURNERING",liveTournamentData:"Live turneringsdata",testMatch:"FIKTIV TESTMATCH",bronze:"BRONS",seriesState:"SERIELÄGE",winsSeries:"VINNER SERIEN",seriesDone:"SERIEN AVGJORD",nextMatch:"NÄSTA MATCH",matches:"MATCHER",previousMatches:"TIDIGARE MATCHER",home:"HEMMA",away:"BORTA",selectPlayer:"Välj spelare",teamStats:"Lagstatistik",rosterPlayers:"Trupp/spelare",loading:"laddar…",ready:"klar",empty:"saknas",loadError:"kunde inte laddas",goalie:"MÅLVAKT",defender:"BACK",pointsLeader:"POÄNGLIGAN",roadBronze:"Bronsvägen",roadPlayoffs:"Slutspelsvägen",team:"LAG",notSelected:"EJ VALD",noPlayer:"INGEN SPELARE",noGoalie:"INGEN MÅLVAKT",totalPoints:"POÄNG TOTALT",gamesLower:"matcher",invalidTwitch:"OGILTIG TWITCH-KANAL / URL",fetchingTwitch:"HÄMTAR TWITCH-STRÖM",missingSupabase:"SAKNAR SUPABASE-CONFIG",twitchFetchFail:"KUNDE INTE HÄMTA TWITCH-STRÖM",twitchReady:"TWITCH HLS KLAR",twitchNetwork:"TWITCH RESOLVER NÄTVERKSFEL",twitchRecovering:"TWITCH ÅTERHÄMTAR LIVE",unknown:"okänt",hlsNetworkError:"HLS NÄTVERKSFEL",loadingDirectVideo:"LADDAR DIREKTVIDEO",directVideo:"DIREKTVIDEO",invalidVideoUrl:"ANGE EN GILTIG HLS / VIDEO-URL",playing:"SPELAR",buffering:"BUFFRAR",videoError:"VIDEO FEL · KONTROLLERA URL/CORS",hlsLoaded:"HLS LADDAD",optimized:"OPTIMERAD",twitchBuffering:"TWITCH BUFFRAR",hlsMediaError:"HLS MEDIAFEL",hlsError:"HLS FEL"},
    en:{commentator:"COMMENTATOR",group:"GROUP",groupstage:"GROUP STAGE",playoffs:"PLAYOFFS",goals:"GOALS",goalsPerGame:"GOALS / GAME",goalsAgainstPerGame:"GOALS AGAINST / GAME",goalDiff:"GOAL DIFFERENCE",totalResult:"OVERALL RECORD",teamGoals:"TEAM GOALS",playerGoals:"PLAYER GOALS",mostGoals:"MOST GOALS",wins:"wins",series:"series",matchWins:"game wins",dataMissing:"NO DATA",groupTables:"GROUP-STAGE STANDINGS",currentTournament:"CURRENT TOURNAMENT",liveTournamentData:"Live tournament data",testMatch:"TEST MATCH",bronze:"BRONZE",seriesState:"SERIES",winsSeries:"WINS THE SERIES",seriesDone:"SERIES COMPLETE",nextMatch:"NEXT GAME",matches:"GAMES",previousMatches:"PREVIOUS GAMES",home:"HOME",away:"AWAY",selectPlayer:"Select player",teamStats:"Team stats",rosterPlayers:"Roster/players",loading:"loading…",ready:"ready",empty:"missing",loadError:"could not load",goalie:"GOALIE",defender:"DEFENSE",pointsLeader:"POINTS LEADER",roadBronze:"Bronze road",roadPlayoffs:"Playoff road",team:"TEAM",notSelected:"NOT SELECTED",noPlayer:"NO PLAYER",noGoalie:"NO GOALIE",totalPoints:"TOTAL POINTS",gamesLower:"games",invalidTwitch:"INVALID TWITCH CHANNEL / URL",fetchingTwitch:"FETCHING TWITCH STREAM",missingSupabase:"SUPABASE CONFIG MISSING",twitchFetchFail:"COULD NOT FETCH TWITCH STREAM",twitchReady:"TWITCH HLS READY",twitchNetwork:"TWITCH RESOLVER NETWORK ERROR",twitchRecovering:"TWITCH RECOVERING LIVE",unknown:"unknown",hlsNetworkError:"HLS NETWORK ERROR",loadingDirectVideo:"LOADING DIRECT VIDEO",directVideo:"DIRECT VIDEO",invalidVideoUrl:"ENTER A VALID HLS / VIDEO URL",playing:"PLAYING",buffering:"BUFFERING",videoError:"VIDEO ERROR · CHECK URL/CORS",hlsLoaded:"HLS LOADED",optimized:"OPTIMIZED",twitchBuffering:"TWITCH BUFFERING",hlsMediaError:"HLS MEDIA ERROR",hlsError:"HLS ERROR"},
    fi:{commentator:"SELOSTAJA",group:"LOHKO",groupstage:"LOHKOVAIHE",playoffs:"PUDOTUSPELIT",goals:"MAALIT",goalsPerGame:"MAALIT / OTTELU",goalsAgainstPerGame:"PÄÄSTETYT / OTTELU",goalDiff:"MAALIERO",totalResult:"KOKONAISTULOS",teamGoals:"JOUKKUEEN MAALIT",playerGoals:"PELAAJIEN MAALIT",mostGoals:"ENITEN MAALEJA",wins:"voittoa",series:"ottelusarjaa",matchWins:"otteluvoittoa",dataMissing:"EI DATAA",groupTables:"LOHKOVAIHEEN TAULUKOT",currentTournament:"NYKYINEN TURNAUS",liveTournamentData:"Live-turnausdata",testMatch:"TESTIOTTELU",bronze:"PRONSSI",seriesState:"OTTELUSARJA",winsSeries:"VOITTAA OTTELUSARJAN",seriesDone:"OTTELUSARJA RATKENNUT",nextMatch:"SEURAAVA OTTELU",matches:"OTTELUT",previousMatches:"AIEMMAT OTTELUT",home:"KOTI",away:"VIERAS",selectPlayer:"Valitse pelaaja",teamStats:"Joukkuetilastot",rosterPlayers:"Kokoonpano/pelaajat",loading:"ladataan…",ready:"valmis",empty:"puuttuu",loadError:"lataus epäonnistui",goalie:"MAALIVAHTI",defender:"PUOLUSTAJA",pointsLeader:"PISTEPÖRSSI",roadBronze:"Tie pronssille",roadPlayoffs:"Pudotuspelitie",team:"JOUKKUE",notSelected:"EI VALITTU",noPlayer:"EI PELAAJAA",noGoalie:"EI MAALIVAHTIA",totalPoints:"PISTEET YHTEENSÄ",gamesLower:"ottelua",invalidTwitch:"VIRHEELLINEN TWITCH-KANAVA / URL",fetchingTwitch:"HAETAAN TWITCH-STRIIMIÄ",missingSupabase:"SUPABASE-ASETUS PUUTTUU",twitchFetchFail:"TWITCH-STRIIMIÄ EI VOITU HAKEA",twitchReady:"TWITCH HLS VALMIS",twitchNetwork:"TWITCH RESOLVER -VERKKOVIRHE",twitchRecovering:"TWITCH PALAUTTAA LIVE-STRIIMIÄ",unknown:"tuntematon",hlsNetworkError:"HLS-VERKKOVIRHE",loadingDirectVideo:"LADATAAN SUORAA VIDEOTA",directVideo:"SUORA VIDEO",invalidVideoUrl:"ANNA KELVOLLINEN HLS- / VIDEO-URL",playing:"TOISTETAAN",buffering:"PUSKUROI",videoError:"VIDEOVIRHE · TARKISTA URL/CORS",hlsLoaded:"HLS LADATTU",optimized:"OPTIMOITU",twitchBuffering:"TWITCH PUSKUROI",hlsMediaError:"HLS-MEDIAVIRHE",hlsError:"HLS-VIRHE"},
    de:{commentator:"KOMMENTATOR",group:"GRUPPE",groupstage:"GRUPPENPHASE",playoffs:"PLAYOFFS",goals:"TORE",goalsPerGame:"TORE / SPIEL",goalsAgainstPerGame:"GEGENTORE / SPIEL",goalDiff:"TORDIFFERENZ",totalResult:"GESAMTBILANZ",teamGoals:"TEAMTORE",playerGoals:"SPIELERTORE",mostGoals:"MEISTE TORE",wins:"Siege",series:"Serien",matchWins:"Spielsiege",dataMissing:"KEINE DATEN",groupTables:"GRUPPENPHASE-TABELLEN",currentTournament:"AKTUELLES TURNIER",liveTournamentData:"Live-Turnierdaten",testMatch:"TESTSPIEL",bronze:"BRONZE",seriesState:"SERIENSTAND",winsSeries:"GEWINNT DIE SERIE",seriesDone:"SERIE ENTSCHIEDEN",nextMatch:"NÄCHSTES SPIEL",matches:"SPIELE",previousMatches:"BISHERIGE SPIELE",home:"HEIM",away:"AUSWÄRTS",selectPlayer:"Spieler wählen",teamStats:"Teamstatistik",rosterPlayers:"Kader/Spieler",loading:"lädt…",ready:"bereit",empty:"fehlt",loadError:"konnte nicht geladen werden",goalie:"TORWART",defender:"VERTEIDIGER",pointsLeader:"PUNKTELEADER",roadBronze:"Weg zu Bronze",roadPlayoffs:"Playoff-Weg",team:"TEAM",notSelected:"NICHT GEWÄHLT",noPlayer:"KEIN SPIELER",noGoalie:"KEIN TORWART",totalPoints:"PUNKTE GESAMT",gamesLower:"Spiele",invalidTwitch:"UNGÜLTIGER TWITCH-KANAL / URL",fetchingTwitch:"TWITCH-STREAM WIRD GELADEN",missingSupabase:"SUPABASE-KONFIGURATION FEHLT",twitchFetchFail:"TWITCH-STREAM KONNTE NICHT GELADEN WERDEN",twitchReady:"TWITCH HLS BEREIT",twitchNetwork:"TWITCH-RESOLVER NETZWERKFEHLER",twitchRecovering:"TWITCH STELLT LIVE-STREAM WIEDER HER",unknown:"unbekannt",hlsNetworkError:"HLS-NETZWERKFEHLER",loadingDirectVideo:"DIREKTVIDEO WIRD GELADEN",directVideo:"DIREKTVIDEO",invalidVideoUrl:"GÜLTIGE HLS-/VIDEO-URL EINGEBEN",playing:"WIEDERGABE",buffering:"PUFFERT",videoError:"VIDEOFEHLER · URL/CORS PRÜFEN",hlsLoaded:"HLS GELADEN",optimized:"OPTIMIERT",twitchBuffering:"TWITCH PUFFERT",hlsMediaError:"HLS-MEDIENFEHLER",hlsError:"HLS-FEHLER"}
  };
  const tx = key => (STRINGS[LOCALE] || STRINGS.sv)[key] ?? STRINGS.sv[key] ?? key;
  window.__sehBroadcastTx = tx;
  const seriesBestOf = bo => LOCALE === "fi" ? "PARAS " + bo + ":STÄ" : LOCALE === "de" ? "BEST-OF-" + bo : LOCALE === "sv" ? "BÄST AV " + bo : "BEST OF " + bo;
  const REMOTE_CHANNEL = ({sv:"sec21-bronze-test",en:"broadcast-en",fi:"broadcast-fi",de:"broadcast-de"}[LOCALE] || "sec21-bronze-test");
  const pageParams=new URLSearchParams(location.search);
  const OBS_MODE = pageParams.get("obs") === "1";
  const VIEWER_MODE = pageParams.get("viewer") === "1";
  const PREVIEW_MODE = pageParams.get("preview") === "1";
  const PRESENTER_VIEW=OBS_MODE&&VIEWER_MODE&&!PREVIEW_MODE&&pageParams.get('presenter')==='1'&&parent!==window&&
    (()=>{try{return window.frameElement?.id==='broadcast'&&parent.location.pathname.endsWith('/presenter.html');}catch{return false;}})();
  document.documentElement.classList.toggle("presenter-studio-tools",!OBS_MODE&&!VIEWER_MODE&&pageParams.get("panel")==="tools");
  if(OBS_MODE&&VIEWER_MODE&&!PREVIEW_MODE&&pageParams.get("feed")==="1"){
    const layer=$("#twitchLayer");
    if(!layer)return;
    const message=document.createElement("p");
    message.id="rawFeedStatus";message.setAttribute("role","status");
    const words=({
      sv:["Ansluter till studion…","Ingen aktiv match eller stream","Kontakten med studion bröts"],
      en:["Connecting to the studio…","No active match or stream","Studio connection lost"],
      fi:["Yhdistetään studioon…","Ei aktiivista ottelua tai striimiä","Yhteys studioon katkesi"],
      de:["Verbindung zum Studio…","Kein aktives Spiel oder Stream","Studioverbindung unterbrochen"]
    })[LOCALE]||["Connecting to the studio…","No active match or stream","Studio connection lost"];
    message.textContent=words[0];
    document.documentElement.classList.add("raw-feed-preview");
    document.body.append(layer,message);
    layer.querySelector(".stream-empty")?.remove();
    let reading=false,signature=null;
    const update=(state,label)=>{
      const active=state&&!state.publicNoMatch&&state.scene!=="idle"&&state.scene!=="nextmatch";
      const source=active?{videoSource:state.videoSource,hlsUrl:state.hlsUrl,twitchChannel:state.twitchChannel}:null;
      const next=JSON.stringify([source,label]);
      if(next===signature)return;
      signature=next;
      window.dispatchEvent(new CustomEvent("seh:twitch-state",{detail:{...source,rawFeedStatus:label}}));
    };
    async function poll(){
      if(reading||document.hidden)return;
      reading=true;
      try{const rows=await remoteRequest("GET");update(rows?.[0]?.state,words[1]);}
      catch{update(null,words[2]);}
      finally{reading=false;}
    }
    void poll();
    setInterval(poll,4000);
    document.addEventListener("visibilitychange",poll);
    return;
  }
  document.documentElement.classList.toggle("obs-arena-motion",OBS_MODE&&!VIEWER_MODE&&!PREVIEW_MODE&&pageParams.get("motion")==="on");
  const previewChannel=PREVIEW_MODE&&window.BroadcastChannel?new BroadcastChannel('swn-studio-preview-'+LOCALE):null;
  let publicNoMatch=true;
  let publicNextMatch=null;
  const idleScene=document.createElement('div');
  idleScene.className='scene idle';
  idleScene.innerHTML='<div class="idle-content"><span>SVENSK eHOCKEY · MATCH-TV</span><h1>Ingen match<br>just nu</h1><p>Vi är tillbaka med fler matcher. Håll utkik i vår Discord.</p></div>';
  document.getElementById('screen')?.append(idleScene);
  const nextScene=document.createElement('div');nextScene.className='scene nextmatch';
  nextScene.innerHTML='<div class="next-content"><span>NÄSTA MATCH · SVENSK eHOCKEY</span><h1>Snart dags för nedsläpp</h1><div class="next-teams"><div class="homeTeam"><img alt=""><b></b></div><strong>VS</strong><div class="awayTeam"><img alt=""><b></b></div></div><p id="nextMatchStart"></p><small>Starttid i svensk tid · Europe/Stockholm</small></div>';
  document.getElementById('screen')?.append(nextScene);
  function viewerState(s){
    if(!VIEWER_MODE||!s.publicNoMatch)return s;
    const next=s.publicNextMatch;
    if(!next)return {...s,scene:'idle'};
    const date=new Date(next.date+'T12:00:00Z');
    document.getElementById('nextMatchStart').textContent=Number.isFinite(date.getTime())?new Intl.DateTimeFormat('sv-SE',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Stockholm'}).format(date)+' · kl. '+String(next.time):'';
    return {...s,home:next.home,away:next.away,scene:'nextmatch'};
  }
  if (OBS_MODE) {
    const fitObsPreview = () => document.documentElement.style.setProperty("--obs-preview-scale", String(Math.min(window.innerWidth / 1280, window.innerHeight / 720)));
    fitObsPreview();
    window.addEventListener("resize", fitObsPreview);
  }
  let activeScene = "opening", remoteApplying = false, remoteTimer = 0;
  const dualLineupLabel=({sv:'Båda lagen',en:'Both lineups',fi:'Molemmat joukkueet',de:'Beide Aufstellungen'})[LOCALE]||'Both lineups';
  const playerPresentationLabel=({sv:'Spelarpresentation',en:'Player presentation',fi:'Pelaajaesittely',de:'Spielervorstellung'})[LOCALE]||'Player presentation';
  let presentedPlayer=null;
  const dualLineupScene=document.createElement('div');
  dualLineupScene.className='scene duallineup';
  dualLineupScene.innerHTML='<div class="dual-lineup-heading"></div><div class="dual-lineup-board"><section class="dual-lineup-team" data-side="home"></section><div class="dual-lineup-vs" aria-hidden="true">VS</div><section class="dual-lineup-team" data-side="away"></section></div>';
  dualLineupScene.querySelector('.dual-lineup-heading').textContent=dualLineupLabel;
  $('#screen')?.append(dualLineupScene);
  const lineupPlayerAction=({
    sv:'Visa i sändningen: ',
    en:'Show on air: ',
    fi:'Näytä lähetyksessä: ',
    de:'In der Sendung zeigen: '
  })[LOCALE];
  let lineupPlayerEnabled=false;
  let lineupDraft=null,lineupPicked=null,lineupDrag=null;
  const lineupDraftKey=state=>JSON.stringify([state?.transientSource?.ticket,state?.leagueId,state?.home,state?.away,state?.matchName,state?.teamOrderRevision,
    ...['home','away'].flatMap(side=>SLOTS.map(slot=>state?.lineups?.[side]?.[slot]))]);
  function lineupEditable(){
    const state=window.__sehTwitchState;
    return !!(state?.scene==='duallineup'&&!state.publicNoMatch&&state.transientSource?.ticket&&state.transientSource.ticket===currentSourceReference?.ticket&&
      ['home','away'].every(side=>state[side]&&SLOTS.every(slot=>{
        const id=state.lineups?.[side]?.[slot];
        return typeof id==='string'&&(!id||/^[1-9][0-9]{0,15}$/.test(id));
      })));
  }
  function lineupEditorStatus(){
    if(!PRESENTER_VIEW)return;
    const available=lineupEditable();
    if(lineupDraft&&(!available||lineupDraft.key!==lineupDraftKey(window.__sehTwitchState))){
      lineupDraft=null;lineupPicked=null;lineupDrag=null;
      renderDualLineup();
    }
    const draft=lineupDraft;
    const changed=!!draft&&['home','away'].some(side=>SLOTS.some(slot=>draft.lineups[side][slot]!==draft.base[side][slot]));
    window.SWNViewerBridge.postStatus({type:'seh-presenter-lineup-edit-status',available,editing:!!draft,changed,choosing:!!lineupPicked});
  }
  function editSlot(card){
    return card?{side:card.closest('.dual-lineup-team').dataset.side,slot:card.dataset.position}:null;
  }
  function editTarget(event){
    return document.elementFromPoint(event.clientX,event.clientY)?.closest('.dual-lineup-player[data-edit-slot]');
  }
  function markLineupPick(pick){
    lineupPicked=pick;
    dualLineupScene.querySelectorAll('[data-edit-slot]').forEach(card=>{
      const here=editSlot(card);
      card.setAttribute('aria-pressed',String(pick?.side===here.side&&pick.slot===here.slot));
    });
  }
  function swapDraftSlots(source,target){
    if(!lineupDraft||lineupDraft.saving||!lineupPlayerEnabled||!source||!target||source.side!==target.side||source.slot===target.slot)return false;
    const slots=lineupDraft.lineups[source.side];
    if(!slots[source.slot]||!roster(selectedTeam(source.side)).some(p=>same(p.sports_gamer_player_id,slots[source.slot])))return false;
    [slots[source.slot],slots[target.slot]]=[slots[target.slot],slots[source.slot]];
    lineupPicked=null;renderDualLineup();lineupEditorStatus();
    dualLineupScene.querySelector('.dual-lineup-team[data-side="'+target.side+'"] [data-position="'+target.slot+'"]')?.focus({preventScroll:true});
    return true;
  }
  function chooseDraftSlot(card){
    const target=editSlot(card);
    if(!target||!lineupDraft||lineupDraft.saving||!lineupPlayerEnabled)return;
    const team=selectedTeam(target.side),players=roster(team),current=lineupDraft.lineups[target.side][target.slot];
    const used=new Set(Object.values(lineupDraft.lineups).flatMap(side=>Object.values(side)));
    const choices=players.filter(p=>p.is_current_roster!==false&&p.display_gamertag&&!used.has(String(p.sports_gamer_player_id)))
      .map(p=>({id:String(p.sports_gamer_player_id),name:String(p.display_gamertag),number:String(p.player_number??'')}));
    markLineupPick(target);
    window.SWNViewerBridge.postStatus({type:'seh-presenter-lineup-reserves',ticket:lineupDraft.ticket,...target,
      team:String(team.team_name_in_league),current:players.find(p=>same(p.sports_gamer_player_id,current))?.display_gamertag||'',choices});
  }
  function playerShortcutAttributes(player){
    if(!PRESENTER_VIEW||!player?.sports_gamer_player_id||!player.sports_gamer_team_id||!player.display_gamertag)return {};
    return {'data-lineup-player':String(player.sports_gamer_player_id),'data-lineup-team':String(player.sports_gamer_team_id),
      role:'button',tabindex:lineupPlayerEnabled?'0':'-1','aria-disabled':String(!lineupPlayerEnabled),'aria-label':lineupPlayerAction+player.display_gamertag};
  }
  function playerShortcutHtml(player){
    return Object.entries(playerShortcutAttributes(player)).map(([key,value])=>' '+key+'="'+esc(value)+'"').join('');
  }
  if(PRESENTER_VIEW){
    const screen=$('#screen');
    window.addEventListener('message',event=>{
      if(event.source!==parent||event.origin!==location.origin)return;
      const data=event.data;
      if(data?.type==='seh-presenter-lineup-edit'){
        if(data.action==='start'&&lineupPlayerEnabled&&lineupEditable()&&!lineupDraft){
          const state=window.__sehTwitchState;
          lineupDraft={key:lineupDraftKey(state),ticket:state.transientSource.ticket,home:String(state.home),away:String(state.away),
            base:structuredClone(state.lineups),lineups:structuredClone(state.lineups)};
        }else if(data.action==='cancel'){
          lineupDraft=null;lineupDrag=null;lineupPicked=null;
        }else if(data.action==='save-failed'&&lineupDraft){
          lineupDraft.saving=false;
        }else if(data.action==='close-reserves'){
          markLineupPick(null);
        }else if(data.action==='reserve'&&lineupPlayerEnabled&&lineupDraft&&!lineupDraft.saving&&lineupPicked&&
          lineupDraft.ticket===data.ticket&&lineupPicked.side===data.side&&lineupPicked.slot===data.slot){
          const used=Object.values(lineupDraft.lineups).some(side=>Object.values(side).includes(data.id));
          const player=typeof data.id==='string'&&!used&&roster(selectedTeam(data.side)).find(p=>same(p.sports_gamer_player_id,data.id)&&p.is_current_roster!==false);
          if(player){lineupDraft.lineups[data.side][data.slot]=data.id;lineupPicked=null;}
        }else if(data.action==='save'&&lineupPlayerEnabled&&lineupDraft&&!lineupDraft.saving&&lineupEditable()&&lineupDraft.key===lineupDraftKey(window.__sehTwitchState)){
          lineupDraft.saving=true;
          const {ticket,home,away,base,lineups}=lineupDraft;
          window.SWNViewerBridge.postStatus({type:'seh-presenter-lineup-save',ticket,home,away,base,lineups});
          return;
        }
        renderDualLineup();lineupEditorStatus();
        return;
      }
      if(data?.type!=='seh-presenter-lineup-control')return;
      const enabled=event.data.enabled===true;
      if(enabled===lineupPlayerEnabled)return;
      lineupPlayerEnabled=enabled;
      screen.querySelectorAll('[data-lineup-player]').forEach(card=>{
        card.tabIndex=enabled?0:-1;
        card.setAttribute('aria-disabled',String(!enabled));
      });
    });
    const presentPlayer=event=>{
      if(lineupDraft)return;
      const card=event.target.closest('[data-lineup-player]');
      const scene=card?.closest('.scene.active:not(.scene-leave):not(.lineup-transition-old)');
      if(!scene?.classList.contains(activeScene)||!lineupPlayerEnabled)return;
      const {lineupPlayer:id,lineupTeam:teamId}=card.dataset;
      const side=['home','away'].find(side=>same($('#'+side).value,teamId));
      if(!side)return;
      const state=window.__sehTwitchState,ticket=state?.transientSource?.ticket,team=selectedTeam(side);
      if(!ticket||ticket!==currentSourceReference?.ticket||!roster(team).some(p=>same(p.sports_gamer_player_id,id)))return;
      event.preventDefault();
      window.SWNViewerBridge.postStatus({type:'seh-presenter-lineup-player',ticket,team:String(team.sports_gamer_team_id),id});
    };
    screen.addEventListener('click',event=>{
      if(lineupDraft){if(event.detail===0)chooseDraftSlot(event.target.closest('[data-edit-slot]'));return;}
      presentPlayer(event);
    });
    screen.addEventListener('keydown',event=>{
      if(event.repeat)return;
      if(lineupDraft&&event.key==='Escape'){markLineupPick(null);lineupEditorStatus();return;}
      if(event.key==='Enter'||event.key===' '){
        const slot=event.target.closest('[data-edit-slot]');
        if(lineupDraft&&slot){event.preventDefault();chooseDraftSlot(slot);}
        else presentPlayer(event);
      }
    });
    dualLineupScene.addEventListener('pointerdown',event=>{
      const card=event.target.closest('[data-edit-slot]');
      if(!card||!lineupDraft||lineupDraft.saving||!lineupPlayerEnabled||!event.isPrimary||event.button!==0)return;
      event.preventDefault();
      lineupDrag={pointer:event.pointerId,card,from:editSlot(card),x:event.clientX,y:event.clientY,moved:false};
      dualLineupScene.setPointerCapture(event.pointerId);
    });
    dualLineupScene.addEventListener('pointermove',event=>{
      if(lineupDrag?.pointer!==event.pointerId||!lineupDraft)return;
      if(!lineupDrag.moved&&Math.hypot(event.clientX-lineupDrag.x,event.clientY-lineupDrag.y)>6){
        lineupDrag.moved=true;
        lineupDrag.card.classList.add('lineup-drag-origin');
      }
      const from=lineupDrag.from,card=editTarget(event),to=editSlot(card);
      dualLineupScene.querySelectorAll('.lineup-drop-target').forEach(node=>node.classList.remove('lineup-drop-target'));
      if(lineupDrag.moved&&to?.side===from.side&&to.slot!==from.slot&&lineupDraft.lineups[from.side][from.slot])card.classList.add('lineup-drop-target');
    });
    dualLineupScene.addEventListener('pointerup',event=>{
      if(lineupDrag?.pointer!==event.pointerId)return;
      const {from,moved}=lineupDrag;lineupDrag.card.classList.remove('lineup-drag-origin');lineupDrag=null;
      const card=editTarget(event),to=editSlot(card);
      dualLineupScene.querySelectorAll('.lineup-drop-target').forEach(node=>node.classList.remove('lineup-drop-target'));
      if(!lineupPlayerEnabled)return;
      if(moved)swapDraftSlots(from,to);
      else if(to?.side===from.side&&to.slot===from.slot)chooseDraftSlot(card);
    });
    dualLineupScene.addEventListener('lostpointercapture',()=>{
      lineupDrag=null;
      dualLineupScene.querySelectorAll('.lineup-drop-target,.lineup-drag-origin').forEach(node=>node.classList.remove('lineup-drop-target','lineup-drag-origin'));
    });
  }
  const lastLineupButton=$('[data-scene="lineup"][data-lineup-side="away"]');
  if(lastLineupButton){
    const button=document.createElement('button');button.type='button';button.dataset.scene='duallineup';button.textContent=dualLineupLabel;
    lastLineupButton.after(button);
  }
  const tournamentScenes=window.BroadcastTournamentScenes;
  const tournamentControls=document.createElement("div"),tournamentScene=document.createElement("div");
  if(tournamentScenes){
    const table=$('[data-scene="table"]'), grid=table?.closest(".scene-grid");
    tournamentControls.className="studio-tournament-controls scene-grid";
    if(grid){grid.after(tournamentControls);tournamentScenes.mount(tournamentControls,LOCALE,table);}
    tournamentScene.className="scene tournament-broadcast";
    $("#screen")?.append(tournamentScene);
  }
  const musicScenes=[...new Set($$("[data-scene]").map(button=>button.dataset.scene))].filter(scene=>scene!=="live");
  const musicVolume={high:.32,low:.10};
  const musicLabels={
    sv:["Bakgrundsmusik","Scen","Volym","Av (alla scener)","Låg","Hög","Musik av Aztrozmurfen"],
    en:["Background music","Scene","Volume","Off (all scenes)","Low","High","Music by Aztrozmurfen"],
    fi:["Taustamusiikki","Näkymä","Äänenvoimakkuus","Pois kaikista","Matala","Korkea","Musiikki: Aztrozmurfen"],
    de:["Hintergrundmusik","Szene","Lautstärke","Aus (alle Szenen)","Leise","Laut","Musik von Aztrozmurfen"]
  };
  const musicText=musicLabels[LOCALE]||musicLabels.en;
  const musicCredit=document.createElement("div");
  musicCredit.className="scene-music-credit";
  musicCredit.textContent=musicText[6];
  musicCredit.hidden=true;
  $("#screen")?.append(musicCredit);
  let sceneMusic={},musicAudio=null,musicSource='',musicStart=null,musicPlaying=false,musicViewerMuted=true;
  let championSound=null,championSoundShown=false,championMusicWait=false,championWaitTimer=0,championIntroToken=0;
  const championTrack='/broadcast-studio/assets/champion.mp3?v=20261111-victory';
  let championLoop=null;
  function prepareChampionLoop(){
    if(championLoop!==null)return championLoop;
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)return championLoop=false;
    let context;
    try{context=new Context();}catch{return championLoop=false;}
    const loop=championLoop={context,offset:0};
    const fallback=reason=>{
      if(championLoop!==loop)return;
      clearTimeout(timeout);
      championLoop=false;
      void context.close().catch(()=>{});
      console.warn("Champion loop fell back to the standard player:",reason);
      syncSceneMusic();
    };
    const timeout=setTimeout(()=>fallback("audio preparation timed out"),6500);
    void Promise.all([context.resume(),fetch(championTrack).then(response=>{
      if(!response.ok)throw Error("Champion track unavailable");
      return response.arrayBuffer();
    }).then(bytes=>context.decodeAudioData(bytes))]).then(([,buffer])=>{
      if(championLoop!==loop)return;
      // Loop points for this specific file, excluding its near-silent MP3 edges.
      const start=Math.round(.231*buffer.sampleRate),end=Math.min(buffer.length,Math.round(303.531*buffer.sampleRate));
      if(end<=start||context.state!=="running"){fallback("invalid loop points or suspended audio");return;}
      const ramp=Math.min(Math.round(.002*buffer.sampleRate),Math.floor((end-start)/2));
      for(let channel=0;channel<buffer.numberOfChannels;channel++){
        const samples=buffer.getChannelData(channel);
        for(let i=0;i<ramp;i++){
          samples[start+i]*=i/ramp;samples[end-1-i]*=i/ramp;
        }
      }
      loop.buffer=buffer;loop.start=start/buffer.sampleRate;loop.end=end/buffer.sampleRate;
      clearTimeout(timeout);
      syncSceneMusic();
    }).catch(fallback);
    return loop;
  }
  function stopChampionLoop(keepPosition=false){
    const loop=championLoop;if(!loop)return;
    if(loop.node){
      if(keepPosition)loop.offset=(loop.offset+loop.context.currentTime-loop.startedAt)%(loop.end-loop.start);
      loop.node.stop();loop.node.disconnect();loop.gain.disconnect();loop.node=null;
    }
    if(!keepPosition)loop.offset=0;
  }
  function playChampionLoop(volume){
    const loop=prepareChampionLoop();
    if(!loop)return false;
    if(!loop.buffer)return true;
    if(!loop.node){
      const node=loop.context.createBufferSource(),gain=loop.context.createGain();
      node.buffer=loop.buffer;node.loop=true;node.loopStart=loop.start;node.loopEnd=loop.end;
      gain.gain.value=volume;node.connect(gain);gain.connect(loop.context.destination);
      node.start(0,loop.start+loop.offset);
      loop.node=node;loop.gain=gain;loop.startedAt=loop.context.currentTime;
    }else loop.gain.gain.value=volume;
    musicPlaying=true;document.documentElement.dataset.sceneMusic="playing";
    return true;
  }
  const musicMode=(scene,settings=sceneMusic)=>settings.muted===true||!musicScenes.includes(scene)?"off":
    ["high","low","off"].includes(settings?.[scene])?settings[scene]:scene==="opening"?"high":"low";
  function createChampionSound(){
    const rate=22050,length=Math.floor(rate*.46),wav=new DataView(new ArrayBuffer(44+length*2));
    const tag=(offset,value)=>{for(let i=0;i<value.length;i++)wav.setUint8(offset+i,value.charCodeAt(i));};
    const u16=(offset,value)=>wav.setUint16(offset,value,true),u32=(offset,value)=>wav.setUint32(offset,value,true);
    tag(0,'RIFF');u32(4,36+length*2);tag(8,'WAVE');tag(12,'fmt ');u32(16,16);u16(20,1);u16(22,1);
    u32(24,rate);u32(28,rate*2);u16(32,2);u16(34,16);tag(36,'data');u32(40,length*2);
    let random=57423,filtered=0;
    for(let i=0;i<length;i++){
      random=(Math.imul(random,1664525)+1013904223)>>>0;
      const noise=(random/4294967296)*2-1,t=i/rate;
      filtered+=.35*(noise-filtered);
      const burst=(start,level)=>{
        const age=t-start;if(age<0)return 0;
        const attack=Math.min(1,age/.003);
        const thump=Math.sin(2*Math.PI*(119*age-65*age*age))*Math.exp(-age*26)*.44;
        const crack=(noise-filtered*.65)*(.52*Math.exp(-age*41)+.12*Math.exp(-age*12));
        return level*attack*(thump+crack);
      };
      const sample=(burst(0,1)+burst(.055,.48))*Math.min(1,(.46-t)*25);
      wav.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,sample))*32767),true);
    }
    const url=URL.createObjectURL(new Blob([wav.buffer],{type:'audio/wav'}));
    window.addEventListener('pagehide',()=>URL.revokeObjectURL(url),{once:true});
    const audio=new Audio(url);
    audio.addEventListener('ended',()=>{if(audio.ended)finishChampionIntro();});
    return audio;
  }
  function clearChampionIntro(){clearTimeout(championWaitTimer);championMusicWait=false;championIntroToken++;}
  function finishChampionIntro(){if(championMusicWait){clearChampionIntro();syncSceneMusic();}}
  function syncChampionSound(visible,volume){
    if(!visible){
      championSoundShown=false;
      clearChampionIntro();
      if(championSound){championSound.pause();if(championSound.currentTime)championSound.currentTime=0;}
      return;
    }
    const mode=musicMode('series');
    const popVolume=volume?(mode==='high'?.42:.16):0;
    if(championSound){if(!popVolume){championSound.pause();clearChampionIntro();}else championSound.volume=popVolume;}
    if(championSoundShown)return;
    championSoundShown=true;
    if(!popVolume)return;
    championSound??=createChampionSound();
    championSound.volume=popVolume;championSound.currentTime=0;
    championMusicWait=true;
    const token=++championIntroToken;
    const done=()=>{if(token===championIntroToken)finishChampionIntro();};
    championWaitTimer=setTimeout(done,1200);
    void championSound.play().catch(done);
  }
  function setSceneMusic(settings){
    sceneMusic=Object.fromEntries(musicScenes.filter(scene=>["high","low","off"].includes(settings?.[scene])).map(scene=>[scene,settings[scene]]));
    if(settings?.muted===true)sceneMusic.muted=true;
    syncMusicControl();
  }
  function syncMusicControl(follow=false){
    const scene=$("#music-scene"),level=$("#music-level");
    if(!scene||!level)return;
    if(follow&&musicScenes.includes(activeScene))scene.value=activeScene;
    level.value=musicMode(scene.value);
  }
  function renderMusicCredit(){
    musicCredit.hidden=activeScene!=="opening"||musicMode("opening")==="off"||(OBS_MODE&&!PREVIEW_MODE&&!musicPlaying);
  }
  function syncSceneMusic(){
    const volume=musicVolume[musicMode(activeScene)]||0;
    if(!OBS_MODE||PREVIEW_MODE){renderMusicCredit();return;}
    const audible=!!volume&&(!VIEWER_MODE||!musicViewerMuted);
    const celebrating=activeScene==='series'&&!!championOutcome();
    const source=celebrating?championTrack:'/broadcast-studio/assets/aztrozmurfen-superhero-in-the-game.mp3';
    // Warm up the track during an audible final scene, before the confetti cue.
    if(audible&&(celebrating||championshipRounds.has(championshipRound())))prepareChampionLoop();
    syncChampionSound(celebrating,audible?volume:0);
    if(!audible||championMusicWait){
      stopChampionLoop(celebrating&&!!volume&&!audible);
      musicPlaying=false;
      delete document.documentElement.dataset.sceneMusic;
      if(musicAudio){
        musicAudio.pause();
        if(!volume&&musicAudio.currentTime)musicAudio.currentTime=0;
      }
      renderMusicCredit();
      return;
    }
    if(celebrating&&playChampionLoop(volume)){
      if(musicAudio&&!musicAudio.paused)musicAudio.pause();
      renderMusicCredit();
      return;
    }
    stopChampionLoop();
    if(musicAudio&&musicSource!==source){
      musicAudio.pause();musicAudio.src=source;musicSource=source;
    }
    if(!musicAudio){
      musicAudio=new Audio(source);musicSource=source;
      musicAudio.loop=true;
      musicAudio.addEventListener("playing",()=>{
        musicPlaying=!musicAudio.paused&&musicMode(activeScene)!=="off"&&(!VIEWER_MODE||!musicViewerMuted);
        if(musicPlaying)document.documentElement.dataset.sceneMusic="playing";
        renderMusicCredit();
      });
      for(const event of ["pause","waiting","ended","error"])musicAudio.addEventListener(event,()=>{
        musicPlaying=false;renderMusicCredit();
      });
      musicAudio.addEventListener("error",()=>{document.documentElement.dataset.sceneMusic="unavailable";});
    }
    musicAudio.volume=volume;
    if(musicAudio.paused&&!musicStart){
      musicStart=musicAudio.play().then(()=>{musicStart=null;},error=>{
        musicStart=null;
        if(musicMode(activeScene)==="off"||(VIEWER_MODE&&musicViewerMuted))return;
        if(error.name==="AbortError"){syncSceneMusic();return;}
        document.documentElement.dataset.sceneMusic=error.name==="NotAllowedError"?"blocked":"unavailable";
      });
    }
    renderMusicCredit();
  }
  if(OBS_MODE&&!PREVIEW_MODE){
    document.addEventListener("click",()=>{
      if(document.documentElement.dataset.sceneMusic==="blocked")syncSceneMusic();
    });
    if(VIEWER_MODE)window.addEventListener("message",event=>{
      if(!window.SWNViewerBridge.acceptsAudio(event))return;
      musicViewerMuted=event.data.muted;
      syncSceneMusic();
    });
  }
  function installSceneMusic(){
    if(OBS_MODE||VIEWER_MODE)return;
    const controls=document.createElement("fieldset"),title=document.createElement("legend");
    controls.className="scene-music-controls";
    title.textContent=musicText[0]+" · Superhero";
    controls.append(title);
    const scene=document.createElement("select"),level=document.createElement("select");
    scene.id="music-scene";level.id="music-level";
    const tournamentLabels=tournamentScenes?.labels(LOCALE)||{};
    for(const name of musicScenes)scene.add(new Option(tournamentLabels[name]||$(`[data-scene="${name}"]`)?.textContent.trim()||name,name));
    ["off","low","high"].forEach((mode,n)=>level.add(new Option(musicText[3+n],mode)));
    [scene,level].forEach((select,i)=>{
      const label=document.createElement("label");label.textContent=musicText[i+1];label.append(select);controls.append(label);
    });
    scene.addEventListener("change",()=>syncMusicControl());
    level.addEventListener("change",()=>{
      setSceneMusic(level.value==="off"?{...sceneMusic,muted:true}:{...sceneMusic,muted:false,[scene.value]:level.value});
      syncSceneMusic();
      publishState();
    });
    $("#theme")?.closest(".theme-control")?.append(controls);
    syncMusicControl(true);
  }
  let displayedLineupSide = "home", sceneTransitionTimer = 0, lineupTransitionTimer = 0;
  const SLOTS = ["LW", "C", "RW", "LD", "G", "RD"];
  // Editorial logo references only; statistics require a fresh SportsGamer fetch.
  const SEC_MATCH_TEAMS = [
    { sports_gamer_team_id: 7046, team_name_in_league: "Daankerzquad", team_logo_in_league: "https://sportsgamer.gg/storage/team-logos/520/7046/Daankerzquad_20260610-013637.png" },
    { sports_gamer_team_id: 3252, team_name_in_league: "Västerås IK", team_logo_in_league: "https://sportsgamer.gg/storage/team-logos/520/3252/VIK-prima%CC%88r@4x_20260612-174642.png" }
  ];
  const data = { teams: [], players: [], playoffs: [] };
  let tournamentDataRequest=0,currentSourceReference=null,sourcePayload=null,sourceProvider=null;
  const COMMENTATORS = {
    mkine: { name: 'Marko “mkine” Mäkinen', image: '' },
    flacken: { name: 'Peter “Flacken” Novara', image: 'https://www.svenskehockey.se/players/flacken.png' },
    wizrob: { name: 'Robert “Wizrob” Olovsson', image: 'https://www.svenskehockey.se/players/Wizrob.png' },
    phyreon3429: { name: 'Alexander “Phyreon” Sundman', playerId: 3429, portraitWidth: 175 },
    troublemakingswe: { name: 'Alex “troublemakingswe” Rautiainen', playerId: 2807, portraitWidth: 110 }
  };
  for(const id of ["commentator1","commentator2"]){
    const select=$("#"+id);
    for(const [key,profile] of Object.entries(COMMENTATORS)){
      if(profile.playerId)select?.add(new Option(profile.name,key));
    }
  }
  const status = { teams: "empty", players: "empty", playoffs: "empty" };
  const lineups = new Map();
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const same = (a, b) => String(a) === String(b);
  const number = value => value != null && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
  const stat = value => number(value) ?? "–";
  const rate = (n, d, percent = false) => number(n) !== null && number(d) > 0
    ? (percent ? Math.round(100 * Number(n) / Number(d)) + "%" : (Number(n) / Number(d)).toFixed(1)) : "–";
  const total = (a, b) => number(a) === null && number(b) === null ? null : (number(a) ?? 0) + (number(b) ?? 0);
  const logo = t => t.team_logo_in_league || t.current_global_team_logo || "";
  const fallbackTeams = () => [];
  const team = id => data.teams.find(t => same(t.sports_gamer_team_id, id)) || fallbackTeams().find(t => same(t.sports_gamer_team_id, id)) || { sports_gamer_team_id:id||"", team_name_in_league:tx("team") };
  const selectedTeam = side => team($("#" + side).value);
  function lineupTeamNames(){
    return Object.fromEntries(["home","away"].flatMap(side=>{
      const id=$("#"+side).value;
      if(!id)return [];
      const name=data.teams.find(row=>same(row.sports_gamer_team_id,id))?.team_name_in_league;
      return name?[[id,name]]:[];
    }));
  }
  const roster = t => data.players.filter(p => same(p.sports_gamer_team_id, t.sports_gamer_team_id));
  const position = p => p.playoff_skater_position_abbreviation || p.regular_skater_position_abbreviation || p.roster_preferred_position_abbreviation || ((p.playoff_goalie_games || p.regular_goalie_games) ? "G" : "");
  const stage = (t, name) => data.teams.find(r => same(r.sports_gamer_team_id, t.sports_gamer_team_id) && r.statistics_stage === name) || {};
  const playoff = t => data.playoffs.find(r => same(r.sports_gamer_team_id, t.sports_gamer_team_id)) || {};

  const portraitFiles = new Set(window.SEH_PLAYER_IMAGE_FILES || []);
  const playerImage = p => p.player_image || "https://www.svenskehockey.se/players/" + (portraitFiles.has(p.sports_gamer_player_id + ".png") ? p.sports_gamer_player_id + ".png" : "1DEFAULTBILDID.png");

  function image(src,crop=false) {
    if(!src)return '<div class="sil">?</div>';
    const img='<img src="' + esc(src) + '" alt="">';
    return crop?'<div class="portrait-crop">'+img+'</div>':img;
  }

  function playerFlag(p) {
    const code = String(p?.player_country || "").trim().toLowerCase();
    if (!/^[a-z]{2}$/.test(code)) return "";
    const upper = code.toUpperCase();
    return '<img class="player-flag" src="https://flagcdn.com/24x18/' + esc(code) + '.png" srcset="https://flagcdn.com/48x36/' + esc(code) + '.png 2x" width="24" height="18" alt="' + esc(upper) + '" title="' + esc(upper) + '">';
  }

  function fill(selector, t) {
    $$(selector).forEach(el => {
      const img = el.querySelector("img");
      if (img) {
        const src = logo(t);
        img.hidden = !src;
        if (src && img.getAttribute("src") !== src) img.src = src;
        if (!src) img.removeAttribute("src");
        img.alt = "";
      }
      const label = el.querySelector("b");
      if (label) label.textContent = t.team_name_in_league;
    });
  }

  function renderTeams() {
    const unique = [...new Map([...fallbackTeams(), ...data.teams].map(t => [String(t.sports_gamer_team_id), t])).values()]
      .sort((a, b) => String(a.team_name_in_league||"").localeCompare(String(b.team_name_in_league||""), "sv"));
    ["home","away"].forEach((side,index)=>{
      const select=$("#"+side), previous=select.value;
      select.replaceChildren(...unique.map(t=>new Option(t.team_name_in_league,String(t.sports_gamer_team_id))));
      if(previous && unique.some(t=>same(t.sports_gamer_team_id,previous))) select.value=previous;
      else if(unique.length) select.value=String((unique[index]||unique[0]).sports_gamer_team_id);
    });
    if($("#home").value && $("#away").value && $("#home").value===$("#away").value && unique.length>1){
      const other=unique.find(t=>!same(t.sports_gamer_team_id,$("#home").value));
      if(other)$("#away").value=String(other.sports_gamer_team_id);
    }
    renderMatch();
  }

  function renderCommentators() {
    const ids = ["commentator1","commentator2"].map(id => $("#" + id)?.value).filter(Boolean);
    const people = ids.map(id => COMMENTATORS[id]).filter(Boolean);
    for(const [target,cardClass] of [["#openingCommentators","opening-commentator"],["#liveCommentators","live-commentator"]]){
      const panel=$(target);
      if(panel)panel.innerHTML=people.map(c=>{
        const image=c.playerId?"https://www.svenskehockey.se/players/"+c.playerId+".png":c.image;
        const img=image?'<img src="'+esc(image)+'" alt="">':'';
        const portrait=c.portraitWidth?'<span class="commentator-portrait" style="--portrait-width:'+c.portraitWidth+'%">'+img+'</span>':img;
        return '<div class="'+cardClass+'">' +
          (portrait||'<div class="commentator-placeholder" aria-hidden="true"></div>')+
          '<div><small>'+esc(tx("commentator"))+'</small><b>'+esc(c.name)+'</b></div></div>';
      }).join("");
    }
  }

  const groupMeetings=window.BroadcastGroupMeetings;
  const groupMeetingLabel=groupMeetings?.label[LOCALE]||groupMeetings?.label.en;
  let groupLoad=null,programGroupLoad=null,groupScorerLoad=null;
  function groupResults(state){
    return groupMeetings?.cached(state.leagueId,state.home,state.away);
  }
  function renderGroupMeetings(){
    const panel=$("#groupMeetings");
    if(!panel||!groupMeetings)return;
    const home=selectedTeam("home"),away=selectedTeam("away"),league=activeLeagueId;
    const key=String(league)+":"+home.sports_gamer_team_id+":"+away.sports_gamer_team_id;
    const pair={leagueId:league,home:home.sports_gamer_team_id,away:away.sports_gamer_team_id};
    const hasTeams=Number(pair.home)>0&&Number(pair.away)>0&&pair.home!==pair.away;
    const rows=groupResults(pair);
    if(hasTeams&&groupLoad!==key){
      groupLoad=key;
      void groupMeetings.load(league).then(()=>{if(groupLoad===key)renderGroupMeetings();});
    }
    const held=!OBS_MODE&&!PREVIEW_MODE&&programHeld&&programState&&!publicNoMatch?programState:null;
    const heldKey=held?JSON.stringify([held.leagueId,held.home,held.away]):null;
    if(heldKey&&programGroupLoad!==heldKey){
      programGroupLoad=heldKey;
      void groupMeetings.load(held.leagueId).then(()=>{if(programGroupLoad===heldKey)renderGroupMeetings();});
    }else if(!heldKey)programGroupLoad=null;
    const button=$('[data-scene="groupmeetings"]'),available=(held?groupResults(held):rows)?.length>0;
    if(button){button.disabled=!available;button.title=available?"":groupMeetingLabel[hasTeams&&rows===null?groupMeetings.status(league):1];}
    const side=t=>'<div>'+(logo(t)?'<img src="'+esc(logo(t))+'" alt="">':'')+'<b>'+esc(t.team_name_in_league)+'</b></div>';
    if(!rows?.length){groupScorerLoad=null;panel.textContent=groupMeetingLabel[hasTeams&&rows===null?groupMeetings.status(league):1];return;}
    const scorerKey=key+":"+rows.map(m=>m.id).join(",");
    if(groupScorerLoad!==scorerKey){
      groupScorerLoad=scorerKey;
      void groupMeetings.loadScorers(league,rows).then(()=>{if(groupScorerLoad===scorerKey)renderGroupMeetings();});
    }
    const names=new Map(data.players.map(p=>[Number(p.sports_gamer_player_id),p.display_gamertag]));
    const scorerText=(m,t,score)=>groupMeetings.scorers(league,m.id,t.sports_gamer_team_id,score).map(p=>{
      const label=esc(names.get(Number(p.id))||p.name)+(p.goals>1?' ×'+Number(p.goals):'');
      const attrs=PRESENTER_VIEW?playerShortcutHtml(roster(t).find(player=>same(player.sports_gamer_player_id,p.id))):'';
      return attrs?'<span'+attrs+'>'+label+'</span>':label;
    }).join(' · ');
    const renderScore=(score,scorers)=>'<div class="group-meeting-side"><b>'+score+'</b>'+
      (scorers?'<div class="group-meeting-scorers"><small>'+esc(groupMeetings.scorerLabel[LOCALE]||groupMeetings.scorerLabel.en)+'</small> '+scorers+'</div>':'')+'</div>';
    const summaryLabels={
      sv:["En seger var","Vinster","Totalt"," till "],
      en:["One win each","Wins","Total"," to "],
      fi:["Yksi voitto kummallekin","Voitot","Yhteensä"," · "],
      de:["Je ein Sieg","Siege","Gesamt"," für "]
    };
    const [oneEach,winsLabel,totalLabel,forTeam]=summaryLabels[LOCALE]||summaryLabels.en;
    const totals=rows.reduce((a,m)=>({
      home:a.home+m.home,away:a.away+m.away,hw:a.hw+Number(m.home>m.away),aw:a.aw+Number(m.away>m.home)
    }),{home:0,away:0,hw:0,aw:0});
    const wins=totals.hw===1&&totals.aw===1?oneEach:winsLabel+" "+totals.hw+"–"+totals.aw;
    const total=totalLabel+" "+Math.max(totals.home,totals.away)+"–"+Math.min(totals.home,totals.away)+
      (totals.home===totals.away?"":forTeam+(totals.home>totals.away?home.team_name_in_league:away.team_name_in_league));
    const summary=rows.length>1?'<p class="group-meeting-summary">'+esc(wins)+' <span aria-hidden="true">·</span> '+esc(total)+'</p>':'';
    panel.innerHTML='<div class="group-meeting-teams">'+side(home)+side(away)+'</div><div class="group-meeting-scores">'+rows.map(m=>
      '<div>'+renderScore(m.home,scorerText(m,home,m.home))+'<span class="group-meeting-divider"><b>–</b>'+(m.overtime?'<small>OT</small>':'')+'</span>'+renderScore(m.away,scorerText(m,away,m.away))+'</div>').join('')+'</div>'+summary;
  }
  function renderMatch() {
    fill(".homeTeam", selectedTeam("home"));
    fill(".awayTeam", selectedTeam("away"));
    $("#topTitle").textContent = $("#headline").value;
    $("#topSub").textContent = $("#subline").value;
    $("#homeScore").textContent = $("#hs").value || "0";
    $("#awayScore").textContent = $("#as").value || "0";
    renderCommentators();
    renderGroupMeetings();
  }

  function lineupFor(side) {
    const t = selectedTeam(side);
    const key = side + ":" + t.sports_gamer_team_id;
    if (lineups.has(key)) return lineups.get(key);
    const ps = roster(t);
    const result = Object.fromEntries(SLOTS.map(slot => [slot, ""]));
    // Do not cache an empty roster while its independent request is pending.
    if (!ps.length) return result;
    const used = new Set();
    const candidates = slot => [...ps].sort((a, b) => {
      const games = p => slot === "G" ? (p.playoff_goalie_games || 0) : (p.playoff_skater_games || 0);
      const regular = p => slot === "G" ? (p.regular_goalie_games || 0) : (p.regular_skater_games || 0);
      return games(b) - games(a) || regular(b) - regular(a) || (b.playoff_points || 0) - (a.playoff_points || 0);
    });
    const assign = (slot, p) => {
      if (!p) return;
      result[slot] = String(p.sports_gamer_player_id);
      used.add(result[slot]);
    };
    // Reserve exact positions first so a missing winger cannot consume the goalie.
    SLOTS.forEach(slot => assign(slot, candidates(slot).find(p => position(p) === slot && !used.has(String(p.sports_gamer_player_id)))));
    SLOTS.filter(slot => !result[slot]).forEach(slot => assign(slot, candidates(slot).find(p => !used.has(String(p.sports_gamer_player_id)) && (slot === "G" ? position(p) === "G" : position(p) !== "G"))));
    lineups.set(key, result);
    return result;
  }

  function renderLineupEditors() {
    const panel = side => {
      const t = selectedTeam(side), ps = roster(t), lineup = lineupFor(side);
      const used = new Set(Object.values(lineup).filter(Boolean).map(String));
      const fields = SLOTS.map(slot => {
        const options = ps.map(p => {
          const id = String(p.sports_gamer_player_id);
          const current = same(lineup[slot], id);
          const usedElsewhere = used.has(id) && !current;
          return '<option value="' + esc(id) + '"' +
            (current ? ' selected' : '') +
            (usedElsewhere ? ' class="lineup-option-used"' : '') +
            '>' + esc(p.display_gamertag) + ' · ' + esc(position(p) || "–") + '</option>';
        }).join("");
        return '<label>' + slot +
          '<select data-lineup-side="' + side + '" data-lineup-slot="' + slot + '"' + (!ps.length ? " disabled" : "") + '>' +
          '<option value="">'+esc(tx("selectPlayer"))+'</option>' + options + '</select></label>';
      }).join("");
      return '<section class="lineup-editor-side lineup-editor-' + side + '">' +
        '<div class="lineup-editor-head">' +
          (logo(t) ? '<img src="' + esc(logo(t)) + '" alt="">' : '') +
          '<span><small>' + esc(tx(side)) + '</small><b>' + esc(t.team_name_in_league || tx("team")) + '</b></span>' +
        '</div><div class="lineup-editor-grid">' + fields + '</div></section>';
    };
    $("#lineupEditors").innerHTML = panel("home") + panel("away");
  }

  let lineupFitFrame=0;
  function fitLineupGamertags(){
    document.querySelectorAll('.lineup-gt').forEach(name=>{
      name.style.fontSize='18px';name.style.transform='none';
      const width=name.clientWidth;if(!width)return;
      if(name.scrollWidth>width)name.style.fontSize=Math.max(8,Math.floor(180*width/name.scrollWidth)/10)+'px';
      if(name.scrollWidth>width)name.style.transform='scaleX('+width/name.scrollWidth+')';
    });
  }
  function scheduleLineupFit(){cancelAnimationFrame(lineupFitFrame);lineupFitFrame=requestAnimationFrame(fitLineupGamertags);}
  let lastPresenterLineups='';
  function postPresenterLineups(){
    if(!OBS_MODE||!VIEWER_MODE||pageParams.get('presenter')!=='1'||parent===window||window.SWNViewerBridge.origin!==location.origin)return;
    const state=window.__sehTwitchState,channels=state?.twitchTeamChannels;
    const awayPerspective=state?.videoSource==='twitch'&&!!state.twitchChannel&&channels?.[$("#away").value]===state.twitchChannel;
    const teams=(awayPerspective?['home','away']:['away','home']).map(side=>{
      const id=$("#"+side).value;
      const team=data.teams.find(t=>same(t.sports_gamer_team_id,id));
      const name=team?.team_name_in_league||window.__sehTwitchState?.lineupTeamNames?.[id];
      const selected=lineupFor(side),playersForTeam=team?roster(team):[];
      const players=Object.fromEntries(SLOTS.map(slot=>{
        const player=playersForTeam.find(p=>same(p.sports_gamer_player_id,selected[slot]));
        return [slot,player?{id:String(player.sports_gamer_player_id),gt:String(player.display_gamertag||''),number:String(player.player_number??'')}:null];
      }));
      const choices=playersForTeam.filter(p=>p.display_gamertag).map(p=>({
        id:String(p.sports_gamer_player_id),name:String(p.display_gamertag),number:String(p.player_number??"")
      }));
      return {side,name,players,id,choices};
    });
    const lineups=activeScene==='idle'||activeScene==='nextmatch'||teams.some(t=>!t.name)?null:teams.map(({side,id,name,players})=>({side,id,name,players}));
    const ticket=state?.transientSource?.ticket;
    const picker=lineups&&ticket&&ticket===currentSourceReference?.ticket?
      {ticket,teams:teams.map(({id,name,choices})=>({id,name,choices}))}:null;
    const signature=JSON.stringify([lineups,picker]);
    if(signature===lastPresenterLineups)return;
    lastPresenterLineups=signature;
    window.SWNViewerBridge.postStatus({type:'seh-presenter-lineups',lineups,picker});
  }
  function renderLineup() {
    renderLineupEditors();
    const side = $("#lineupSide").value;
    const t = selectedTeam(side), ps = roster(t), lineup = lineupFor(side);
    $("#lineupTeam").textContent = t.team_name_in_league;
    const lineupLogo = $("#lineupTeamLogo");
    const lineupLogoUrl = logo(t);
    lineupLogo.onload = () => { lineupLogo.hidden = false; };
    lineupLogo.hidden = !lineupLogoUrl;
    lineupLogo.src = lineupLogoUrl;
    lineupLogo.alt = t.team_name_in_league || "";
    lineupLogo.style.display = lineupLogoUrl ? "" : "none";
    $(".players").innerHTML = SLOTS.map(slot => {
      const p = ps.find(p => same(p.sports_gamer_player_id, lineup[slot]));
      if (!p) return '<div class="player empty"><span>' + slot + '</span><div class="sil">?</div><b>'+esc(tx("notSelected"))+'</b></div>';
      const goalie=slot==='G';
      const summary=lineupStageSummary(p,goalie);
      return '<div class="player"'+playerShortcutHtml(p)+'><span>' + slot + '</span>' + image(playerImage(p)) + '<div class="player-info lineup-stage-info"><strong><span class="lineup-meta">#' + esc(p.player_number ?? "") + ' ' + playerFlag(p) + '</span><span class="lineup-gt">'+esc(p.display_gamertag)+'</span></strong><small>'+summary+'</small></div></div>';
    }).join("");
    scheduleLineupFit();
    postPresenterLineups();
    if(activeScene==='duallineup')renderDualLineup();
    lineupEditorStatus();
  }

  function renderDualLineup(){
    for(const panel of dualLineupScene.querySelectorAll('.dual-lineup-team')){
      const side=panel.dataset.side,team=selectedTeam(side),players=roster(team),slots=lineupDraft?.lineups[side]||lineupFor(side);
      const name=window.__sehTwitchState?.lineupTeamNames?.[team.sports_gamer_team_id]||team.team_name_in_league;
      const crest=logo(team);
      const header='<div class="dual-lineup-team-name">'+(crest?'<img src="'+esc(crest)+'" alt="">':'')+'<strong>'+esc(name)+'</strong></div>';
      const cards=['LW','C','RW','LD','RD','G'].map(position=>{
        const player=players.find(p=>same(p.sports_gamer_player_id,slots[position]));
        const portrait=player?'<img src="'+esc(playerImage(player))+'" alt="">':'';
        const number=player?.player_number!=null&&player.player_number!==''?'#'+player.player_number:position;
        const tag=player?.display_gamertag||tx('notSelected');
        const attrs=' class="dual-lineup-player" data-position="'+position+'"';
        const action=lineupDraft?' data-edit-slot role="button" tabindex="0" aria-label="'+esc(position+' · '+tag)+'" aria-pressed="'+(lineupPicked?.side===side&&lineupPicked.slot===position)+'"':playerShortcutHtml(player);
        return '<div'+attrs+action+'><div class="dual-lineup-portrait">'+portrait+'</div><div class="dual-lineup-tag"><span title="'+position+'">'+esc(number)+'</span><b>'+esc(tag)+'</b></div></div>';
      }).join('');
      const html=header+'<div class="dual-lineup-formation">'+cards+'</div>';
      if(panel.__renderedLineup===html)continue;
      panel.__renderedLineup=html;panel.innerHTML=html;
    }
  }

  function lineupStageSummary(p,goalie){
    return ['regular','playoff'].filter(stage=>stage==='regular'||number(p[stage+(goalie?'_goalie_games':'_skater_games')])>0||(!goalie&&['goals','assists','points'].some(key=>number(p[stage+'_'+key])>0))).map(stage=>{
      const label=stage==='regular'?(LOCALE==='sv'?'GRUPPSPEL':tx('group')):tx('playoffs');
      const values=goalie?'SV% '+goalieStageValue(p,stage,'sv')+' · GAA '+goalieStageValue(p,stage,'gaa'):stat(p[stage+'_goals'])+' G · '+stat(p[stage+'_assists'])+' A · '+stat(p[stage+'_points'])+' P';
      return esc(label)+' · '+stat(p[stage+(goalie?'_goalie_games':'_skater_games')])+' GP · '+values;
    }).join('<br>');
  }

  function renderTable() {
    const box=$("#broadcastTable");
    if(!box)return;
    const home=selectedTeam("home"), away=selectedTeam("away");
    const selected=new Set([String(home.sports_gamer_team_id),String(away.sports_gamer_team_id)]);
    const regular=data.teams.filter(r=>r.statistics_stage==="regular");
    const sortRows=rows=>[...rows].sort((a,b)=>
      (number(b.table_points)??0)-(number(a.table_points)??0) ||
      (number(b.goal_difference)??0)-(number(a.goal_difference)??0) ||
      (number(b.goals_for)??0)-(number(a.goals_for)??0) ||
      String(a.team_name_in_league||"").localeCompare(String(b.team_name_in_league||""),LOCALE)
    );
    const groupId=row=>number(row?.effective_group_id);
    const groupIds=[...new Set(regular.map(groupId).filter(id=>id!==null))].sort((a,b)=>a-b);
    const groupLabel=id=>{
      if(id===null)return tx("group");
      const index=groupIds.findIndex(value=>value===id);
      return tx("group")+" "+(index>=0?index+1:id+1);
    };
    const rowFor=t=>regular.find(r=>same(r.sports_gamer_team_id,t.sports_gamer_team_id))||{};
    const homeGroup=groupId(rowFor(home)), awayGroup=groupId(rowFor(away));
    const hasMultipleGroups=groupIds.length>1;
    const splitGroups=hasMultipleGroups&&homeGroup!==null&&awayGroup!==null&&homeGroup!==awayGroup;
    const tableHead='<div class="bt-head"><span>#</span><span>'+esc(tx("team"))+'</span><span>GP</span><span>W</span><span>L</span><span>GD</span><span>PTS</span></div>';
    const tableRows=rows=>sortRows(rows).map((r,i)=>
      '<div class="bt-row '+(selected.has(String(r.sports_gamer_team_id))?"selected":"")+'">'+
      '<b>'+(i+1)+'</b><span class="bt-team">'+
      (logo(r)?'<img src="'+esc(logo(r))+'" alt="">':"")+
      '<strong>'+esc(r.team_name_in_league)+'</strong></span>'+
      '<span>'+stat(r.games_played)+'</span><span>'+stat(r.total_wins)+'</span><span>'+stat(r.losses)+'</span>'+
      '<span>'+((number(r.goal_difference)??0)>0?"+":"")+stat(r.goal_difference)+'</span><b>'+stat(r.table_points)+'</b></div>'
    ).join("");
    const tableMarkup=rows=>tableHead+tableRows(rows);
    const scene=box.closest(".scene.table");

    if(splitGroups){
      const groups=[homeGroup,awayGroup].sort((a,b)=>a-b).map(id=>({id,rows:regular.filter(r=>groupId(r)===id)}));
      const maxRows=Math.max(...groups.map(group=>group.rows.length));
      box.className="broadcast-table bt-dual";
      box.style.setProperty("--bt-group-rows",String(maxRows));
      box.innerHTML=groups.map(({id,rows})=>
        '<section class="bt-panel"><div class="bt-panel-title">'+esc(groupLabel(id))+'</div><div class="bt-table-inner">'+tableMarkup(rows)+'</div></section>'
      ).join("");
      scene?.classList.add("table-dual-mode","table-dense-mode");
      if($("#tableKicker"))$("#tableKicker").textContent=competition().label+" · "+tx("playoffs")+" · "+tx("groupTables");
      return;
    }

    let rows=regular;
    let chosenGroup=null;
    if(hasMultipleGroups){
      chosenGroup=homeGroup!==null?homeGroup:awayGroup;
      if(chosenGroup!==null)rows=regular.filter(r=>groupId(r)===chosenGroup);
    }
    rows=sortRows(rows);
    const density=rows.length>12?"bt-xdense":rows.length>8?"bt-dense":"";
    box.style.removeProperty("--bt-group-rows");
    box.className="broadcast-table"+(density?" "+density:"");
    box.innerHTML=tableMarkup(rows);
    scene?.classList.remove("table-dual-mode");
    scene?.classList.toggle("table-dense-mode",rows.length>8);
    if($("#tableKicker")){
      const phase=activeLeagueId===526?"POKAL":tx("groupstage");
      $("#tableKicker").textContent=competition().label+" · "+phase+(chosenGroup!==null?" · "+groupLabel(chosenGroup):"");
    }
  }
  function renderTeamCompare() {
    const sides=["home","away"].map(side=>({side,t:selectedTeam(side)}));
    const [gamesLabel,recordLabel]=({sv:["SPELADE MATCHER","VINSTER–FÖRLUSTER"],en:["GAMES PLAYED","WINS–LOSSES"],fi:["PELATTU","VOITOT–TAPPIOT"],de:["SPIELE","SIEGE–NIEDERLAGEN"]})[LOCALE]||["GAMES PLAYED","WINS–LOSSES"];
    const vals=(x,key)=>["regular","playoffs"].map(phase=>{
      const s=stage(x.t,phase);
      if(key==="RECORD")return number(s.total_wins)===null||number(s.losses)===null?"–":stat(s.total_wins)+"–"+stat(s.losses);
      if(key==="WIN%")return rate(s.total_wins,s.games_played,true);
      if(key==="GF/G")return rate(s.goals_for,s.games_played);
      if(key==="GA/G")return rate(s.goals_against,s.games_played);
      return stat(s[key]);
    });
    const rows=[["games_played",gamesLabel],["RECORD",recordLabel],["WIN%","WIN%"],["GF/G",tx("goalsPerGame")],["GA/G",tx("goalsAgainstPerGame")],["goal_difference",tx("goalDiff")]];
    const sideHead=x=>'<div class="tc-team">'+(logo(x.t)?'<img src="'+esc(logo(x.t))+'" alt="">':"")+'<b>'+esc(x.t.team_name_in_league)+'</b></div>';
    $("#teamCompare").innerHTML=sideHead(sides[0])+'<div class="tc-center"><div class="tc-cols"><span>'+tx("group")+'</span><span>'+tx("playoffs")+'</span><i></i><span>'+tx("group")+'</span><span>'+tx("playoffs")+'</span></div>'+rows.map(r=>{const a=vals(sides[0],r[0]),b=vals(sides[1],r[0]);return '<div class="tc-row"><b>'+a[0]+'</b><b>'+a[1]+'</b><span>'+r[1]+'</span><b>'+b[0]+'</b><b>'+b[1]+'</b></div>'}).join("")+'</div>'+sideHead(sides[1]);
  }
  function renderScorers() {
    const card=side=>{const t=selectedTeam(side), ps=roster(t).filter(p=>(total(p.regular_skater_games,p.playoff_skater_games)??0)>0).sort((a,b)=>(total(b.regular_points,b.playoff_points)??0)-(total(a.regular_points,a.playoff_points)??0)).slice(0,3);
      return '<div class="scorer-side"><div class="scorer-team">'+(logo(t)?'<img src="'+esc(logo(t))+'" alt="">':"")+'<b>'+esc(t.team_name_in_league)+'</b></div>'+ps.map((p,i)=>'<div class="scorer"'+playerShortcutHtml(p)+'><strong>'+(i+1)+'</strong>'+image(playerImage(p),true)+'<div><b>'+playerFlag(p)+esc(p.display_gamertag)+'</b><small>'+esc(position(p)||"")+' · #'+esc(p.player_number??"")+'</small></div><span>'+stat(total(p.regular_goals,p.playoff_goals))+' G</span><span>'+stat(total(p.regular_assists,p.playoff_assists))+' A</span><em>'+stat(total(p.regular_points,p.playoff_points))+' P</em></div>').join("")+'</div>'};
    $("#scorerGrid").innerHTML=card("home")+card("away");
  }

  let tournamentSchedulePending=null;
  function renderTournamentScene(scene=activeScene,loadSchedule=true){
    const mode=tournamentScenes?.parse(scene);
    if(!mode)return;
    const {family,phase}=mode, t=tournamentScenes.words(LOCALE), goalie=family==="tourgoalies";
    const phaseLabel=t[phase==="regular"?5:phase==="playoff"?6:4];
    const title=t[family==="tourpoints"?1:goalie?2:3];
    const teamFor=id=>data.teams.find(x=>Number(x.sports_gamer_team_id)===id);
    const badge=team=>team&&logo(team)?'<img class="tour-team-logo" src="'+esc(logo(team))+'" alt="">':"";
    const format=(v,max=0)=>Number(v).toLocaleString(LOCALE,{maximumFractionDigits:max});
    const notice=message=>'<div class="tour-empty">'+esc(message)+'</div>';
    let body, note=goalie?t[7]+(phase?"":" · "+t[8]):"";
    if(family==="tourstats"){
      const league=activeLeagueId, matches=groupMeetings?.completed(league);
      if(loadSchedule&&groupMeetings&&tournamentSchedulePending!==league){
        tournamentSchedulePending=league;
        void groupMeetings.load(league).then(()=>{
          if(tournamentSchedulePending===league)tournamentSchedulePending=null;
          if(activeLeagueId===league)renderTournamentScene(activeScene,false);
        });
      }
      const stats=matches&&tournamentScenes.summarize(matches,phase);
      const tile=(label,value,detail="",team)=>'<div class="tour-stat">'+badge(team)+'<small>'+esc(label)+'</small><b>'+esc(value)+'</b>'+(detail?'<span>'+esc(detail)+'</span>':'')+'</div>';
      if(!stats?.games)body=notice(matches?t[9]:t[groupMeetings?.status(league)===2?14:15]);
      else{
        const m=stats.highest,top=stats.topTeam,team=teamFor(top.id);
        body='<div class="tour-stat-grid">'+tile(t[10],format(stats.games))+tile(t[11],format(stats.goals/stats.games,2))+
          tile(t[12],m.homeScore+'–'+m.awayScore,(m.home||teamFor(m.homeId)?.team_name_in_league||"")+" · "+(m.away||teamFor(m.awayId)?.team_name_in_league||""))+
          tile(t[13],format(top.goals),team?.team_name_in_league||top.name,team)+'</div>';
      }
    }else{
      const ranked=tournamentScenes.rank(data.players,phase,goalie).slice(0,10);
      const cols=goalie?["GP","SO","SV%"]:["GP","G","A","P"];
      const values=p=>goalie?[p.gp,p.so,format(p.sv,2)+" %"]:[p.gp,p.goals,p.assists,p.points];
      const named=p=>{const team=teamFor(p.team);return [badge(team),esc(team?.team_name_in_league||p.player.current_global_team_name||""),playerFlag(p.player),String(p.player.display_gamertag||"")];};
      const podium=ranked.slice(0,3).map((p,i)=>{
        const [mark,team,flag,name]=named(p), vals=values(p);
        return '<div class="tour-podium-card"><span class="tour-rank">'+(i+1)+'</span><div class="tour-photo">'+image(playerImage(p.player),true)+'</div><div class="tour-podium-info">'+
          '<b class="tour-podium-name" style="--tour-name-length:'+Math.max(1,[...name].length)+'">'+flag+'<span title="'+esc(name)+'">'+esc(name)+'</span></b>'+
          '<small>'+mark+'<span>'+team+'</span></small><strong>'+vals.at(-1)+(goalie?'':' P')+'</strong><div>'+
          vals.slice(0,-1).map((v,j)=>'<span>'+v+' '+cols[j]+'</span>').join("")+'</div></div></div>';
      }).join("");
      const rows=ranked.slice(3).map((p,i)=>{
        const [mark,team,flag,name]=named(p);
        return '<div><b>'+(i+4)+'</b><b>'+flag+esc(name)+'</b><span>'+mark+team+'</span>'+values(p).map(v=>'<b>'+v+'</b>').join("")+'</div>';
      }).join("");
      body=ranked.length?'<div class="tour-podium">'+podium+'</div>'+(rows?
        '<div class="tour-ranking'+(goalie?' tour-goalie':'')+'"><div class="tour-table-head"><b>#</b><b>'+esc(({sv:"SPELARE",fi:"PELAAJA",de:"SPIELER"})[LOCALE]||"PLAYER")+'</b><span>'+tx("team")+'</span>'+
        cols.map(col=>'<b>'+col+'</b>').join("")+'</div>'+rows+'</div>':''):notice(t[9]);
    }
    tournamentScene.innerHTML='<div class="tour-heading"><small>'+esc(competition().label+' · '+phaseLabel)+'</small><h2>'+esc(title)+'</h2>'+
      (note?'<span>'+esc(note)+'</span>':'')+'</div>'+body;
  }

  function teamTotals(t) {
    const r=stage(t,"regular"), p=stage(t,"playoffs");
    return {gp:(number(r.games_played)??0)+(number(p.games_played)??0),w:(number(r.total_wins)??0)+(number(p.total_wins)??0),l:(number(r.losses)??0)+(number(p.losses)??0),gf:(number(r.goals_for)??0)+(number(p.goals_for)??0),ga:(number(r.goals_against)??0)+(number(p.goals_against)??0)};
  }
  function renderFormGuide() {
    const card=side=>{const t=selectedTeam(side),r=stage(t,"regular"),p=stage(t,"playoffs"),x=teamTotals(t), gd=x.gf-x.ga;
      return '<div class="form-card"><div class="form-team">'+(logo(t)?'<img src="'+esc(logo(t))+'" alt="">':"")+'<b>'+esc(t.team_name_in_league)+'</b></div><div class="form-record"><strong>'+x.w+'–'+x.l+'</strong><span>'+tx("totalResult")+'</span></div><div class="form-stats"><div><b>'+stat(r.total_wins)+'–'+stat(r.losses)+'</b><span>'+tx("groupstage")+'</span></div><div><b>'+stat(p.total_wins)+'–'+stat(p.losses)+'</b><span>'+tx("playoffs")+'</span></div><div><b>'+x.gf+'–'+x.ga+'</b><span>'+tx("goals")+'</span></div><div><b>'+(gd>0?"+":"")+gd+'</b><span>'+tx("goalDiff")+'</span></div></div></div>'};
    $("#formGrid").innerHTML=card("home")+card("away");
  }
  function renderOffense() {
    const card=side=>{const t=selectedTeam(side),ps=roster(t).filter(p=>(total(p.regular_skater_games,p.playoff_skater_games)??0)>0),x=teamTotals(t);
      const goals=ps.reduce((s,p)=>s+(total(p.regular_goals,p.playoff_goals)??0),0), assists=ps.reduce((s,p)=>s+(total(p.regular_assists,p.playoff_assists)??0),0);
      const top=[...ps].sort((a,b)=>(total(b.regular_goals,b.playoff_goals)??0)-(total(a.regular_goals,a.playoff_goals)??0))[0];
      return '<div class="off-card"><div class="off-team">'+(logo(t)?'<img src="'+esc(logo(t))+'" alt="">':"")+'<b>'+esc(t.team_name_in_league)+'</b></div><div class="off-big"><b>'+rate(x.gf,x.gp)+'</b><span>'+tx("goalsPerGame")+'</span></div><div class="off-row"><div><b>'+x.gf+'</b><span>'+tx("teamGoals")+'</span></div><div><b>'+goals+'</b><span>'+tx("playerGoals")+'</span></div><div><b>'+assists+'</b><span>ASSISTS</span></div></div>'+(top?'<div class="off-top"'+playerShortcutHtml(top)+'>'+image(playerImage(top),true)+'<span><small>'+tx("mostGoals")+'</small><b>'+playerFlag(top)+esc(top.display_gamertag)+'</b></span><strong>'+stat(total(top.regular_goals,top.playoff_goals))+' G</strong></div>':"")+'</div>'};
    $("#offenseGrid").innerHTML=card("home")+card("away");
  }
  function renderDefenseLeaders() {
    const card=side=>{const t=selectedTeam(side),ps=roster(t).filter(p=>/^(LD|RD|D)$/i.test(position(p))).sort((a,b)=>(total(b.regular_points,b.playoff_points)??0)-(total(a.regular_points,a.playoff_points)??0)).slice(0,3);
      return '<div class="lb-side"><div class="lb-team">'+(logo(t)?'<img src="'+esc(logo(t))+'" alt="">':"")+'<b>'+esc(t.team_name_in_league)+'</b></div>'+ps.map((p,i)=>'<div class="lb-player"'+playerShortcutHtml(p)+'><strong>'+(i+1)+'</strong>'+image(playerImage(p),true)+'<div><b>'+playerFlag(p)+esc(p.display_gamertag)+'</b><small>'+esc(position(p))+' · #'+esc(p.player_number??"")+'</small></div><span>'+stat(total(p.regular_goals,p.playoff_goals))+' G</span><span>'+stat(total(p.regular_assists,p.playoff_assists))+' A</span><em>'+stat(total(p.regular_points,p.playoff_points))+' P</em></div>').join("")+'</div>'};
    $("#defenseLeaderGrid").innerHTML=card("home")+card("away");
  }
  function renderGoalieLeaders() {
    const card=side=>{const t=selectedTeam(side),ps=roster(t).filter(p=>(total(p.regular_goalie_games,p.playoff_goalie_games)??0)>0).sort((a,b)=>(total(b.regular_goalie_games,b.playoff_goalie_games)??0)-(total(a.regular_goalie_games,a.playoff_goalie_games)??0)).slice(0,3);
      return '<div class="lb-side goalie-lb"><div class="lb-team">'+(logo(t)?'<img src="'+esc(logo(t))+'" alt="">':"")+'<b>'+esc(t.team_name_in_league)+'</b></div>'+ps.map((p,i)=>{const rg=number(p.regular_goalie_games)??0,pg=number(p.playoff_goalie_games)??0,rs=number(p.regular_goalie_save_percentage),psv=number(p.playoff_goalie_save_percentage),den=rg+pg,sv=den&&((rs!==null?rs*rg:0)+(psv!==null?psv*pg:0))/den;return '<div class="lb-player"'+playerShortcutHtml(p)+'><strong>'+(i+1)+'</strong>'+image(playerImage(p),true)+'<div><b>'+playerFlag(p)+esc(p.display_gamertag)+'</b><small>G · #'+esc(p.player_number??"")+'</small></div><span>'+stat(den)+' GP</span><span>'+goaliePct(sv)+' SV%</span><em>'+stat(total(p.regular_goalie_shutouts,p.playoff_goalie_shutouts))+' SO</em></div>'}).join("")+'</div>'};
    $("#goalieLeaderGrid").innerHTML=card("home")+card("away");
  }

  function renderRoad() {
    $("#roadGrid").innerHTML = ["home", "away"].map(side => {
      const t = selectedTeam(side), r = stage(t, "regular"), po = playoff(t);
      const valid=value=>number(value)!==null&&number(value)>=0;
      const matchWinsLabel=value=>number(value)===1?({sv:'matchvinst',en:'match win',fi:'otteluvoitto',de:'Spielsieg'}[LOCALE]||tx('matchWins')):tx('matchWins');
      const sections=[];
      const step=(label,value,detail='')=>'<div class="road-step"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong>'+(detail?'<span>'+esc(detail)+'</span>':'')+'</div>';
      const regularDetails=[];
      if(valid(r.goals_for)&&valid(r.goals_against))regularDetails.push(r.goals_for+'–'+r.goals_against+' '+tx('goals'));
      if(valid(po.regular_season_seed)&&number(po.regular_season_seed)>0){
        if(valid(r.total_wins))regularDetails.unshift(r.total_wins+' '+tx('wins'));
        sections.push(step(tx('groupstage'),'#'+po.regular_season_seed,regularDetails.join(' · ')));
      }else if(valid(r.total_wins))sections.push(step(tx('groupstage'),r.total_wins+' '+tx('wins'),regularDetails.join(' · ')));
      const p=stage(t,'playoffs');
      if(valid(po.series_won)&&valid(po.series_lost))sections.push(step(tx('playoffs')+(po.playoff_round_name?' · '+po.playoff_round_name:''),po.series_won+'–'+po.series_lost+' '+tx('series'),valid(po.matched_playoff_game_wins)?po.matched_playoff_game_wins+' '+matchWinsLabel(po.matched_playoff_game_wins):''));
      else if(valid(p.games_played)&&number(p.games_played)>0&&valid(p.total_wins))sections.push(step(tx('playoffs'),p.total_wins+' '+matchWinsLabel(p.total_wins),p.games_played+' '+tx('matches')));
      if($('#showLiveSeries')?.checked){
        const bo=Number($('#seriesFormat')?.value||5),need=Math.ceil(bo/2),wins=Math.max(0,Math.min(need,number($('#series'+(side==='home'?'Home':'Away')).value)||0));
        sections.push(step(tx('seriesState')+' · '+($('#seriesRound')?.value||tx('playoffs')),wins+' '+matchWinsLabel(wins),seriesBestOf(bo)));
      }
      return '<div class="road-card"><div class="road-team">'+(logo(t)?image(logo(t)):'')+'<b>'+esc(t.team_name_in_league)+'</b></div>'+ (sections.length?sections.join('<i></i>'):'<p class="road-empty">'+esc(tx('dataMissing'))+'</p>')+'</div>';
    }).join("");
  }

  function renderLeaders() {
    const playerPoints = p => total(p.regular_points, p.playoff_points) ?? 0;
    const playerGoals = p => total(p.regular_goals, p.playoff_goals) ?? 0;
    const goalieGames = p => total(p.regular_goalie_games, p.playoff_goalie_games) ?? 0;
    const goalieSave = p => {
      const rg = number(p.regular_goalie_games) ?? 0, pg = number(p.playoff_goalie_games) ?? 0;
      const rs = number(p.regular_goalie_save_percentage), ps = number(p.playoff_goalie_save_percentage);
      const parts = [[rs, rg], [ps, pg]].filter(([sv, gp]) => sv !== null && gp > 0);
      return parts.length ? parts.reduce((sum,[sv,gp]) => sum + sv * gp, 0) / parts.reduce((sum,[,gp]) => sum + gp, 0) : null;
    };
    const pickForTeam = side => {
      const t = selectedTeam(side);
      const ps = data.players.filter(p => same(p.sports_gamer_team_id, t.sports_gamer_team_id));
      const selectedIds = new Set(Object.values(lineupFor(side)).filter(Boolean).map(String));
      const lineupPlayers = ps.filter(p => selectedIds.has(String(p.sports_gamer_player_id)));
      const eligible = lineupPlayers.length ? lineupPlayers : ps;
      const skaters = eligible.filter(p => ((p.regular_skater_games || 0) + (p.playoff_skater_games || 0) > 0));
      const top = [...skaters].sort((a,b) => playerPoints(b) - playerPoints(a))[0];
      const candidates = skaters.filter(p => p !== top);
      const defenders = candidates.filter(p => /^(LD|RD|D)$/i.test(position(p)));
      const bestD = [...defenders].sort((a,b) => (playerGoals(b)*4 + playerPoints(b)) - (playerGoals(a)*4 + playerPoints(a)))[0];
      const standoutD = bestD && (playerGoals(bestD) >= 3 || playerPoints(bestD) >= Math.max(10, playerPoints(top) * 0.65)) ? bestD : null;
      const goalies = eligible.filter(p => goalieGames(p) >= 3 && goalieSave(p) !== null && goalieSave(p) >= 0.82).sort((a,b) => goalieSave(b) - goalieSave(a));
      let special = goalies[0] || standoutD || [...candidates].sort((a,b) => playerPoints(b) - playerPoints(a))[0];
      if (special === top) special = candidates[0];
      return [top && {p:top, reason:tx("pointsLeader")}, special && {p:special, reason: goalies[0] === special ? tx("goalie") : standoutD === special ? tx("defender") : tx("pointsLeader")}]
        .filter(Boolean).map(x => ({...x.p, team_name_in_league:t.team_name_in_league, watch_reason:x.reason, watch_save:goalieSave(x.p)}));
    };
    const leaders = ["home","away"].flatMap(pickForTeam);
    $("#leaderGrid").innerHTML = leaders.length ? leaders.map(p => {
      const isGoalie = p.watch_reason === tx("goalie");
      const main = isGoalie && p.watch_save !== null
        ? (p.watch_save * (p.watch_save <= 1 ? 100 : 1)).toFixed(1).replace(".", ",") + "% SV · " + stat(total(p.regular_goalie_shutouts,p.playoff_goalie_shutouts)) + " SO"
        : stat(playerGoals(p)) + " G · " + stat(total(p.regular_assists,p.playoff_assists)) + " A · <strong>" + stat(playerPoints(p)) + " P</strong>";
      const detail = isGoalie ? stat(goalieGames(p)) + " " + tx("gamesLower") : tx("group") + " " + stat(p.regular_points) + " · " + tx("playoffs") + " " + stat(p.playoff_points);
      const team = SEC_MATCH_TEAMS.find(t => same(t.sports_gamer_team_id, p.sports_gamer_team_id)) || {};
      const teamLogo = logo(team);
      return '<div class="leader-card"'+playerShortcutHtml(p)+'>' + image(playerImage(p)) + '<div class="leader-copy">' + (teamLogo ? '<img class="leader-team-logo" src="' + esc(teamLogo) + '" alt="">' : '') + '<small>' + esc(p.team_name_in_league) + ' · ' + esc(p.watch_reason) + '</small><b>' + playerFlag(p) + esc(p.display_gamertag) + '</b><span>' + main + '</span><em>' + detail + '</em></div></div>';
    }).join("") : '<p>'+tx("rosterPlayers")+': '+tx("empty")+'.</p>';
  }

  function lineupPlayer(side, slot) {
    const t = selectedTeam(side), id = lineupFor(side)[slot];
    return roster(t).find(p => same(p.sports_gamer_player_id, id));
  }
  function faceoffPct(p, stageName) {
    const w = number(p[stageName + "_faceoff_wins"]) ?? 0, l = number(p[stageName + "_faceoff_losses"]) ?? 0;
    return w + l ? (100 * w / (w + l)).toFixed(1).replace(".", ",") : "–";
  }
  function goaliePct(v) {
    const n = number(v); if (n === null) return "–";
    const percentage=n*(n<=1?100:1);
    return percentage<0||percentage>100?"–":goalieDecimal(percentage);
  }
  function goalieDecimal(v) {
    const n=number(v);
    return n===null||n<0?"–":new Intl.NumberFormat(LOCALE,{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  }
  function goalieStageValue(p,stageName,key) {
    if(!p||!(number(p[stageName+'_goalie_games'])>0))return "–";
    return key==='sv'?goaliePct(p[stageName+'_goalie_save_percentage']):goalieDecimal(p[stageName+'_goalie_goals_against_average']);
  }
  function matchupCard(side, slot, kind) {
    const t = selectedTeam(side), p = lineupPlayer(side, slot);
    if (!p) return '<div class="role-card empty"><b>' + slot + '</b><span>'+esc(tx("notSelected"))+'</span></div>';
    let rows;
    if (kind === "goalie") rows = [
      ["GP", stat(p.regular_goalie_games), stat(p.playoff_goalie_games)],
      ["SV%", goalieStageValue(p,"regular","sv"), goalieStageValue(p,"playoff","sv")],
      ["GAA", goalieStageValue(p,"regular","gaa"), goalieStageValue(p,"playoff","gaa")],
      ["SO", stat(p.regular_goalie_shutouts), stat(p.playoff_goalie_shutouts)]
    ];
    else {
      rows = [["GP",stat(p.regular_skater_games),stat(p.playoff_skater_games)]];
      if (kind === "center") rows.push(["FO%",faceoffPct(p,"regular"),faceoffPct(p,"playoff")]);
      rows.push(["G",stat(p.regular_goals),stat(p.playoff_goals)],["A",stat(p.regular_assists),stat(p.playoff_assists)],["P",stat(p.regular_points),stat(p.playoff_points)],["PIM",stat(p.regular_penalty_minutes),stat(p.playoff_penalty_minutes)]);
    }
    return '<div class="role-card"'+playerShortcutHtml(p)+'>' + image(playerImage(p),true) + '<div class="role-info"><div class="role-team">' + (logo(t)?'<img src="'+esc(logo(t))+'" alt="">':"") + '<small>'+esc(t.team_name_in_league)+'</small></div><strong>'+slot+' #'+esc(p.player_number ?? "")+' · '+playerFlag(p)+esc(p.display_gamertag)+'</strong><div class="role-head"><i></i><b>'+tx("group")+'</b><b>'+tx("playoffs")+'</b></div>'+rows.map(r=>'<div class="role-stat"><span>'+r[0]+'</span><b>'+r[1]+'</b><b>'+r[2]+'</b></div>').join("")+'</div></div>';
  }
  function bestLineupSkater(side) {
    return ["LW","C","RW","LD","RD"].map(slot => ({slot,p:lineupPlayer(side,slot)})).filter(x=>x.p)
      .sort((a,b)=>(total(b.p.regular_points,b.p.playoff_points)??0)-(total(a.p.regular_points,a.p.playoff_points)??0))[0];
  }
  function keyCard(side) {
    const x=bestLineupSkater(side);
    return x ? matchupCard(side,x.slot,x.slot==="C"?"center":"skater") : '<div class="role-card empty"><span>'+esc(tx("noPlayer"))+'</span></div>';
  }
  function spotlightHtml() {
    const h=bestLineupSkater("home"), a=bestLineupSkater("away");
    let x=[h&&{...h,side:"home"},a&&{...a,side:"away"}].filter(Boolean)
      .sort((x,y)=>(total(y.p.regular_points,y.p.playoff_points)??0)-(total(x.p.regular_points,x.p.playoff_points)??0))[0];
    if(presentedPlayer){
      const side=["home","away"].find(side=>same($("#"+side).value,presentedPlayer.team));
      const p=side&&roster(selectedTeam(side)).find(p=>same(p.sports_gamer_player_id,presentedPlayer.id));
      x=p?{p,side,slot:position(p)}:null;
    }
    if(!x) return '<div class="role-card empty"><span>'+esc(tx("noPlayer"))+'</span></div>';
    const p=x.p,t=selectedTeam(x.side),goalie=x.slot==="G";
    const words=({
      sv:["Räddningsprocent (SV%)","Insläppta mål / match","Hållna nollor","Assist","Poäng","Poäng / match","Utvisningsminuter","Tekningsprocent"],
      en:["Save percentage (SV%)","Goals against / game","Shutouts","Assists","Points","Points / game","Penalty minutes","Faceoff percentage"],
      fi:["Torjuntaprosentti (SV%)","Päästetyt maalit / ottelu","Nollapelit","Syötöt","Pisteet","Pisteet / ottelu","Jäähyminuutit","Aloitusprosentti"],
      de:["Fangquote (SV%)","Gegentore / Spiel","Shutouts","Vorlagen","Punkte","Punkte / Spiel","Strafminuten","Bullyquote"]
    })[LOCALE];
    const gamesKey=goalie?"goalie_games":"skater_games";
    const stageStat=(stage,key)=>number(p[stage+"_"+gamesKey])>0?stat(p[stage+"_"+key]):"–";
    const stageGames=stage=>stat(p[stage+"_"+gamesKey]);
    const perGame=stage=>{
      const gp=number(p[stage+"_skater_games"]),points=number(p[stage+"_points"]);
      return gp>0&&points!==null?new Intl.NumberFormat(LOCALE,{minimumFractionDigits:2,maximumFractionDigits:2}).format(points/gp):"–";
    };
    const percent=value=>value==="–"?value:value+" %";
    const faceoffs=stage=>["wins","losses"].every(key=>number(p[stage+"_faceoff_"+key])!==null)?faceoffPct(p,stage):"–";
    const rows=goalie?[
      [tx("matches"),stageGames],
      [words[0],stage=>percent(goalieStageValue(p,stage,"sv"))],
      [words[1],stage=>goalieStageValue(p,stage,"gaa")],
      [words[2],stage=>stageStat(stage,"goalie_shutouts")]
    ]:[
      [tx("matches"),stageGames],
      [tx("goals"),stage=>stageStat(stage,"goals")],
      [words[3],stage=>stageStat(stage,"assists")],
      [words[4],stage=>stageStat(stage,"points")],
      [words[5],perGame],
      [words[6],stage=>stageStat(stage,"penalty_minutes")]
    ];
    if(!goalie&&["regular","playoff"].some(stage=>faceoffs(stage)!=="–"))rows.push([words[7],stage=>percent(faceoffs(stage))]);
    const stats='<table class="spotlight-stage-stats"><thead><tr><td></td><th scope="col">'+esc(tx("groupstage"))+'</th><th scope="col">'+esc(tx("playoffs"))+'</th></tr></thead><tbody>'+
      rows.map(([label,value])=>'<tr><th scope="row">'+esc(label)+'</th><td>'+esc(value("regular"))+'</td><td>'+esc(value("playoff"))+'</td></tr>').join("")+'</tbody></table>';
    const headline=goalie?total(p.regular_goalie_games,p.playoff_goalie_games):total(p.regular_points,p.playoff_points);
    const identity=[x.slot,p.player_number!=null&&String(p.player_number)!==""?"#"+p.player_number:""].filter(Boolean).join(" · ");
    return '<div class="spotlight-player">'+image(playerImage(p),true)+'<div class="spotlight-copy"><div class="eyebrow">'+esc(presentedPlayer?playerPresentationLabel:"PLAYER SPOTLIGHT")+'</div><div class="spotlight-team">'+(logo(t)?'<img src="'+esc(logo(t))+'" alt="">':"")+'<span>'+esc(t.team_name_in_league)+'</span></div><h2>'+playerFlag(p)+esc(p.display_gamertag)+'</h2><h3>'+esc(identity)+'</h3><div class="spotlight-total"><b>'+stat(headline)+'</b><span>'+esc(goalie?tx("matches"):tx("totalPoints"))+'</span></div>'+stats+'</div></div>';
  }
  function renderRoleMatchups() {
    $("#forwardsGrid").innerHTML = ["home","away"].flatMap(side=>["LW","C","RW"].map(slot=>matchupCard(side,slot,slot==="C"?"center":"skater"))).join("");
    $("#defenseGrid").innerHTML = matchupCard("home","LD","skater")+matchupCard("home","RD","skater")+matchupCard("away","LD","skater")+matchupCard("away","RD","skater");
    const goalieSide = side => {
      const t = selectedTeam(side), p = lineupPlayer(side, "G");
      if (!p) return { side, t, p: null };
      return { side, t, p };
    };
    const gh = goalieSide("home"), ga = goalieSide("away");
    const goalieVal = (x, key) => !x.p?"–":key==="sv"||key==="psv"?goalieStageValue(x.p,key==="sv"?"regular":"playoff","sv"):key.endsWith("goals_against_average")?goalieStageValue(x.p,key.startsWith("regular_")?"regular":"playoff","gaa"):stat(x.p[key]);
    const goaliePortrait = x => x.p ? '<div class="goalie-person goalie-'+x.side+'"'+playerShortcutHtml(x.p)+'>'+image(playerImage(x.p),true)+'<div class="goalie-name">'+(logo(x.t)?'<img src="'+esc(logo(x.t))+'" alt="">':"")+'<span><b>'+playerFlag(x.p)+esc(x.p.display_gamertag)+'</b><small>G'+(x.p.player_number!=null&&String(x.p.player_number)!==''?' #'+esc(x.p.player_number):'')+' · '+esc(x.t.team_name_in_league)+'</small></span></div></div>' : '<div class="goalie-person empty"><span>'+esc(tx("noGoalie"))+'</span></div>';
    const goalieRows = [
      ["GP","regular_goalie_games","playoff_goalie_games"],
      ["SV%","sv","psv"],
      ["GAA","regular_goalie_goals_against_average","playoff_goalie_goals_against_average"],
      ["SO","regular_goalie_shutouts","playoff_goalie_shutouts"]
    ];
    $("#goaliesGrid").innerHTML = goaliePortrait(gh)+'<div class="goalie-center"><div class="goalie-center-title">GOALIE MATCHUP</div><div class="goalie-columns"><span>'+esc(tx("group"))+'</span><span>'+esc(tx("playoffs"))+'</span><i></i><span>'+esc(tx("group"))+'</span><span>'+esc(tx("playoffs"))+'</span></div>'+goalieRows.map(r=>'<div class="goalie-row"><b>'+goalieVal(gh,r[1])+'</b><b>'+goalieVal(gh,r[2])+'</b><span>'+r[0]+'</span><b>'+goalieVal(ga,r[1])+'</b><b>'+goalieVal(ga,r[2])+'</b></div>').join("")+'</div>'+goaliePortrait(ga);
    const kh=bestLineupSkater("home"), ka=bestLineupSkater("away");
    const keySide=(side,x)=>({side,t:selectedTeam(side),slot:x?.slot||"",p:x?.p||null});
    const kHome=keySide("home",kh), kAway=keySide("away",ka);
    const keyPortrait=x=>x.p?'<div class="key-person key-'+x.side+'"'+playerShortcutHtml(x.p)+'>'+image(playerImage(x.p),true)+'<div class="key-name">'+(logo(x.t)?'<img src="'+esc(logo(x.t))+'" alt="">':"")+'<span><b>'+esc(x.slot)+' #'+esc(x.p.player_number??"")+' · '+playerFlag(x.p)+esc(x.p.display_gamertag)+'</b><small>'+esc(x.t.team_name_in_league)+'</small></span></div></div>':'<div class="key-person empty"><span>'+esc(tx("noPlayer"))+'</span></div>';
    const keyValue=(x,key,stageName)=>{if(!x.p)return "–";if(key==="FO%")return x.slot==="C"?faceoffPct(x.p,stageName):"–";const prefix=stageName==="regular"?"regular_":"playoff_";return stat(x.p[prefix+key]);};
    const keyRows=[["GP","skater_games"],["FO%","FO%"],["G","goals"],["A","assists"],["P","points"]];
    $("#keyGrid").innerHTML=keyPortrait(kHome)+'<div class="key-center"><div class="key-center-title">KEY MATCHUP</div><div class="key-columns"><span>'+esc(tx("group"))+'</span><span>'+esc(tx("playoffs"))+'</span><i></i><span>'+esc(tx("group"))+'</span><span>'+esc(tx("playoffs"))+'</span></div>'+keyRows.map(r=>'<div class="key-row"><b>'+keyValue(kHome,r[1],"regular")+'</b><b>'+keyValue(kHome,r[1],"playoff")+'</b><span>'+r[0]+'</span><b>'+keyValue(kAway,r[1],"regular")+'</b><b>'+keyValue(kAway,r[1],"playoff")+'</b></div>').join("")+'</div>'+keyPortrait(kAway);
    $("#spotlightCard").innerHTML = spotlightHtml();
  }

  function applyCompetitionChrome(resetHeadline=false,profileId=activeLeagueId) {
    const c=COMPETITIONS[profileId]||competition(), logoSrc=competitionLogo(c);
    document.querySelectorAll(".event-logo img").forEach(img=>{img.src=logoSrc;img.alt=c.code;img.hidden=false;});
    if($("#tableKicker")&&!data.teams.length)$("#tableKicker").textContent=c.label+" · "+(activeLeagueId===526?"POKAL":tx("groupstage"));
    if($("#leadersKicker"))$("#leadersKicker").textContent=c.label+" · "+tx("groupstage")+" + "+tx("playoffs");
    const bronze=activeLeagueId===520;
    if($("#roadKicker"))$("#roadKicker").textContent=(bronze?tx("roadBronze"):tx("roadPlayoffs")).toLocaleUpperCase(LOCALE);
    if($("#roadTitle"))$("#roadTitle").textContent=bronze?(LOCALE==="sv"?"VÄGEN TILL BRONSMATCHEN":tx("roadBronze").toLocaleUpperCase(LOCALE)):(LOCALE==="sv"?"VÄGEN GENOM SLUTSPELET":tx("roadPlayoffs").toLocaleUpperCase(LOCALE));
    if($("#roadSceneButton"))$("#roadSceneButton").textContent=bronze?tx("roadBronze"):tx("roadPlayoffs");
    if(resetHeadline&&$("#headline"))$("#headline").value=c.label;
  }

  function renderAllCompetitionData(){
    renderTeams();renderSeries();renderLineup();renderTable();renderTeamCompare();renderScorers();
    renderFormGuide();renderOffense();renderDefenseLeaders();renderGoalieLeaders();renderRoad();renderLeaders();renderRoleMatchups();renderTournamentScene();
  }

  function renderStatus() {
    const labels = { teams: tx("teamStats"), players: tx("rosterPlayers"), playoffs: tx("playoffs") };
    $("#dataStatus").textContent = Object.entries(status).map(([key, state]) => labels[key] + ": " + ({ loading: tx("loading"), ready: tx("ready"), empty: tx("empty"), error: tx("loadError") }[state])).join(" · ");
  }

  function clearTournamentData(){
    tournamentDataRequest++;currentSourceReference=null;sourcePayload=null;
    data.teams=[];data.players=[];data.playoffs=[];lineups.clear();
    ['hs','as','seriesHome','seriesAway'].forEach(id=>{if($('#'+id))$('#'+id).value='0';});
    ['subline',...Array.from({length:7},(_,i)=>'seriesR'+(i+1))].forEach(id=>{if($('#'+id))$('#'+id).value='';});
    status.teams="empty";status.players="empty";status.playoffs="empty";
    document.documentElement.dataset.broadcastDataSource='empty';
    renderStatus();renderAllCompetitionData();
  }
  function loadTournamentData(){
    sourceProvider?.reset();clearTournamentData();
    const note=$('#transientBroadcastStatus');if(note)note.textContent='Ingen statistik hämtad. Klicka Hämta från SportsGamer.';
  }

  function setTheme(name){
    const background=["broadcast","arena","ice","impact","gamenight"].includes(name)?name:"broadcast";
    document.body.dataset.background=background;
    // Existing overlays become graphics package "standard"; old theme CSS stays on the broadcast baseline.
    document.body.dataset.theme="broadcast";
    if($("#theme"))$("#theme").value=background;
  }
  function setGraphicsPackage(name){
    const graphics=["standard","gamenight"].includes(name)?name:"standard";
    document.body.dataset.graphics=graphics;
    if($("#graphicsPackage"))$("#graphicsPackage").value=graphics;
  }

  function setArenaMist(enabled){
    if($("#arenaMist"))$("#arenaMist").checked=enabled;
    const screen=$("#screen");
    if(screen){screen.classList.toggle("arena-mist-enabled",enabled);screen.dataset.arenaScene=activeScene;}
  }

  function installArenaMist(){
    const themeLabel=$("#theme")?.closest("label");
    if(!themeLabel)return;
    const label=document.createElement("label"),toggle=document.createElement("input");
    label.className="series-results-toggle";
    toggle.type="checkbox";toggle.id="arenaMist";
    label.append(toggle,document.createTextNode(" "+({sv:"RÖRLIG DIMMA · GAME NIGHT",en:"ANIMATED MIST · GAME NIGHT",fi:"LIIKKUVA SUMU · GAME NIGHT",de:"BEWEGTER NEBEL · GAME NIGHT"}[LOCALE]||"ANIMATED MIST · GAME NIGHT")));
    themeLabel.after(label);
    toggle.addEventListener("change",()=>{setArenaMist(toggle.checked);publishState();});
  }

  let footerBrand='seh';
  function setFooterBrand(value){
    footerBrand=value==='sportsgamer'?'sportsgamer':'seh';
    if($('#footerBrand'))$('#footerBrand').value=footerBrand;
    const sportsGamer=footerBrand==='sportsgamer';
    const label=$('.bug b');if(label)label.textContent=sportsGamer?'SportsGamer':'SVENSK eHOCKEY';
    const presenter=$('.opening>.eyebrow');
    const presents=({sv:'PRESENTERAR',en:'PRESENTS',fi:'ESITTÄÄ',de:'PRÄSENTIERT'})[LOCALE]||'PRESENTS';
    if(presenter)presenter.textContent=(sportsGamer?'SPORTSGAMER':'SVENSK eHOCKEY')+' '+presents;
  }

  function renderLiveSeries(homeWins,awayWins,needed){
    let toggle=$('#showLiveSeries');
    if(!toggle){
      const label=document.createElement('label');
      label.className='series-results-toggle';
      toggle=document.createElement('input');toggle.type='checkbox';toggle.id='showLiveSeries';
      const lang=document.documentElement.lang.toLowerCase();
      label.append(toggle,document.createTextNode(' '+({sv:'VISA VINSTSTRECK I LIVE-LAGRUTAN',en:'SHOW SERIES WINS IN LIVE TEAM STRIP',fi:'NÄYTÄ SARJAVOITOT LIVE-JOUKKUERUUDUSSA',de:'SERIENSIEGE IM LIVE-TEAMFELD ANZEIGEN'}[lang]||'SHOW SERIES WINS IN LIVE TEAM STRIP')));
      $('#seriesFormat')?.closest('.series-control')?.append(label);
      toggle.addEventListener('change',()=>{renderSeries();publishState();});
    }
    const enabled=toggle.checked;
    $('.live-team-strip')?.classList.toggle('has-series-wins',enabled);
    for(const [side,wins] of [['home',homeWins],['away',awayWins]]){
      const row=$('.live-team-strip .'+side+'Team');if(!row)continue;
      let marks=row.querySelector('.live-series-wins');
      if(!marks){marks=document.createElement('span');marks.className='live-series-wins';row.append(marks);}
      marks.hidden=!enabled;
      marks.setAttribute('role','img');marks.setAttribute('aria-label',seriesBestOf(needed*2-1)+' · '+wins+'/'+needed);
      marks.innerHTML=Array.from({length:needed},(_,i)=>'<i aria-hidden="true" class="'+(i<wins?'won':'')+'"></i>').join('');
    }
  }

  let liveTeamsReversed=false,teamOrderRevision=null,seriesGameFinal=null;
  function setLiveTeamOrder(reversed){
    liveTeamsReversed=reversed===true;
    const strip=$(".live-team-strip"),last=strip?.querySelector(liveTeamsReversed?".homeTeam":".awayTeam");
    if(last&&strip.lastElementChild!==last)strip.append(last);
  }

  const seriesDotState=new WeakMap();
  function applySeriesResults(results){
    if(!Array.isArray(results))return;
    for(let i=0;i<7;i++){
      const el=$("#seriesR"+(i+1));
      if(el)el.value=results[i]??"";
    }
  }
  const genericOpeningRounds=new Set(["SLUTSPEL","PLAYOFFS","PUDOTUSPELIT"]);
  function renderOpeningRound(){
    const round=($("#seriesRound")?.value||"").trim().toLocaleUpperCase(LOCALE);
    const hidden=!round||genericOpeningRounds.has(round);
    for(const label of $$(".opening-round,#topRound")){
      label.hidden=hidden;
      label.textContent=hidden?"":round;
    }
  }
  const championshipRounds=new Set(['FINAL','FINALS','FINALEN','GRAND FINAL','GRAND FINALS','STORA FINALEN','MÄSTERSKAPSFINAL','FINALE','ENDSPIEL','FINAALI','FINAALIT','LOPPUOTTELU']);
  const championLabels={sv:['MÄSTARE','VINNER FINALEN'],en:['CHAMPIONS','WIN THE FINAL'],fi:['MESTARIT','VOITTAA FINAALIN'],de:['MEISTER','GEWINNT DAS FINALE']};
  const championCard=document.createElement('div');
  championCard.className='series-champion';championCard.hidden=true;
  championCard.innerHTML='<div class="champion-kicker"></div><div class="champion-title"></div><div class="champion-crest"><img alt="" hidden><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M21 12H43V27A11 11 0 0 1 21 27ZM21 16H12V22Q12 32 23 32M43 16H52V22Q52 32 41 32M32 38V50M23 52H41" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><strong class="champion-team"></strong><div class="champion-result"><span></span><b></b></div>';
  $('.scene.series')?.append(championCard);
  const championConfetti=document.createElement('div');
  championConfetti.className='champion-confetti';championConfetti.setAttribute('aria-hidden','true');
  const confettiColors=['#ffc653','#ffe3a1','#f2f4f8','#e2b253','#d7e0ed'];
  for(let i=0;i<148;i++){
    const piece=document.createElement('i');
    const burst=i>=108,side=i%2?-1:1;
    piece.style.setProperty('--x',burst?(side===1?'3%':'97%'):`${(3+94*((i*61)%109)/108).toFixed(2)}%`);
    piece.style.setProperty('--drift',`${burst?side*(110+(i*29)%310):((i*37)%151)-75}px`);
    piece.style.setProperty('--spin',`${side*(270+(i*53)%690)}deg`);
    piece.style.setProperty('--delay',`${burst?(i*71)%450:(i*137)%2450}ms`);
    piece.style.setProperty('--duration',`${burst?2200+(i*131)%900:3500+(i*149)%1650}ms`);
    piece.style.setProperty('--size',`${5+(i*7)%6}px`);
    piece.style.setProperty('--color',confettiColors[i%confettiColors.length]);
    if(burst){piece.className='confetti-burst';piece.style.setProperty('--rise',`${-55-(i*43)%115}px`);}
    championConfetti.append(piece);
  }
  for(let i=0;i<36;i++){
    const piece=document.createElement('i');piece.className='confetti-ambient';
    piece.style.setProperty('--x',`${5+((i*31)%91)}%`);
    piece.style.setProperty('--drift',`${((i*29)%85)-42}px`);
    piece.style.setProperty('--spin',`${(i%2?-1:1)*(180+i*19)}deg`);
    piece.style.setProperty('--delay',`${6000+i*95}ms`);
    piece.style.setProperty('--duration',`${5800+(i*379)%2550}ms`);
    piece.style.setProperty('--size',`${5+i%4}px`);
    piece.style.setProperty('--color',confettiColors[i%confettiColors.length]);
    championConfetti.append(piece);
  }
  championCard.prepend(championConfetti);
  const championRoster=document.createElement('div');championRoster.className='champion-roster';championRoster.hidden=true;
  const championResult=championCard.querySelector('.champion-result');
  championResult.before(championRoster);
  let championRosterKey='';
  function renderChampionRoster(id){
    const stageGames=(player,stage)=>Math.max(0,number(player[stage+'_skater_games'])??0,number(player[stage+'_goalie_games'])??0);
    const participants=new Map();
    for(const player of roster({sports_gamer_team_id:id})){
      const key=String(player.sports_gamer_player_id||''),name=String(player.display_gamertag||'').trim();
      const games=stageGames(player,'regular')+stageGames(player,'playoff');
      if(!key||!name||games<=0||(participants.get(key)?.games??0)>=games)continue;
      participants.set(key,{id:key,team:id,name,games,portrait:playerImage(player)});
    }
    const players=[...participants.values()].sort((a,b)=>b.games-a.games||a.name.localeCompare(b.name,LOCALE));
    const signature=JSON.stringify(players);
    if(signature===championRosterKey)return;
    championRosterKey=signature;
    championRoster.hidden=!players.length;
    championCard.classList.toggle('has-roster',!!players.length);
    const rows=Math.ceil(players.length/10),columns=Math.max(1,Math.ceil(players.length/Math.max(1,rows)));
    championRoster.style.setProperty('--champion-columns',columns);
    championRoster.style.setProperty('--champion-rows',Math.max(1,rows));
    championRoster.replaceChildren(...players.map(player=>{
      const tile=document.createElement('div'),portrait=document.createElement('div'),image=document.createElement('img'),name=document.createElement('b');
      tile.className='champion-player';portrait.className='champion-portrait';image.alt='';
      for(const [key,value] of Object.entries(playerShortcutAttributes({sports_gamer_player_id:player.id,sports_gamer_team_id:player.team,display_gamertag:player.name})))tile.setAttribute(key,value);
      image.onerror=()=>{image.hidden=true;};image.src=player.portrait;
      name.textContent=player.name;portrait.append(image);tile.append(portrait,name);return tile;
    }));
  }
  function championshipRound(){
    return String($('#seriesRound')?.value||'').trim().toLocaleUpperCase(LOCALE).split(/\s*[·:–—]\s*/,1)[0];
  }
  function championOutcome(){
    const round=championshipRound();
    const bo=Number($('#seriesFormat')?.value),hw=Number($('#seriesHome')?.value),aw=Number($('#seriesAway')?.value),need=Math.ceil(bo/2);
    const scoresValid=[3,5,7].includes(bo)&&[hw,aw].every(w=>Number.isInteger(w)&&w>=0&&w<=need)&&((hw===need)!==(aw===need));
    const side=hw>aw?'home':'away',id=$('#'+side)?.value,other=$('#'+(side==='home'?'away':'home'))?.value;
    const winner=data.teams.find(t=>same(t.sports_gamer_team_id,id));
    const name=winner?.team_name_in_league||window.__sehTwitchState?.lineupTeamNames?.[id];
    return championshipRounds.has(round)&&scoresValid&&Number(id)>0&&Number(other)>0&&id!==other&&name?{round,hw,aw,id,winner,name}:null;
  }
  function renderChampion(){
    const outcome=championOutcome(),show=!!outcome;
    championCard.hidden=!show;
    championCard.parentElement?.classList.toggle('has-champion',show);
    if(activeScene==='series'&&OBS_MODE&&!PREVIEW_MODE)syncSceneMusic();
    if(!show)return;
    const {round,hw,aw,id,winner,name}=outcome;
    const [title,result]=championLabels[LOCALE]||championLabels.en,crest=championCard.querySelector('img');
    const crestUrl=winner?logo(winner):'';
    if(crest.getAttribute('src')!==(crestUrl||null)){
      crest.hidden=true;
      crest.onerror=()=>{crest.hidden=true;};
      crest.onload=()=>{crest.hidden=false;};
      if(crestUrl)crest.src=crestUrl;else crest.removeAttribute('src');
    }
    championCard.querySelector('.champion-kicker').textContent=(COMPETITIONS[activeLeagueId]?.label||'')+' · '+round;
    championCard.querySelector('.champion-title').textContent=title;
    championCard.querySelector('.champion-team').textContent=name;
    championCard.querySelector('.champion-result span').textContent=result;
    championCard.querySelector('.champion-result b').textContent=Math.max(hw,aw)+'–'+Math.min(hw,aw);
    renderChampionRoster(id);
  }
  function renderSeriesDots(box,wins,need,teamId,round){
    const key=JSON.stringify([activeLeagueId,window.__sehTwitchState?.matchName||"",teamId,need,round]);
    const previous=seriesDotState.get(box);
    if(previous?.key!==key||box.children.length!==need){
      box.replaceChildren(...Array.from({length:need},()=>document.createElement("i")));
    }
    const canPulse=!!teamId&&activeScene==="series"&&$("#arenaMist")?.checked&&document.body.dataset.background==="gamenight"&&previous?.key===key;
    [...box.children].forEach((dot,index)=>{
      const won=index<wins;
      dot.classList.toggle("won",won);
      if(!won)dot.classList.remove("new-win");
      if(canPulse&&won&&index>=previous.wins){
        dot.classList.add("new-win");
        setTimeout(()=>dot.classList.remove("new-win"),1200);
      }
    });
    seriesDotState.set(box,{key,wins});
  }

  function renderSeries(){renderOpeningRound();renderChampion();const bo=Number($("#seriesFormat")?.value||5),need=Math.ceil(bo/2),hw=Math.max(0,Math.min(need,Number($("#seriesHome")?.value||0))),aw=Math.max(0,Math.min(need,Number($("#seriesAway")?.value||0))),round=($("#seriesRound")?.value||tx("playoffs")).trim().toLocaleUpperCase(LOCALE),h=selectedTeam("home"),a=selectedTeam("away");renderLiveSeries(hw,aw,need);renderRoad();$("#seriesHomeScore").textContent=hw;$("#seriesAwayScore").textContent=aw;$("#seriesKicker").textContent=round+" · "+seriesBestOf(bo);renderSeriesDots($("#seriesHomeDots"),hw,need,h.sports_gamer_team_id,round);renderSeriesDots($("#seriesAwayDots"),aw,need,a.sports_gamer_team_id,round);const done=hw===need||aw===need;$("#seriesTitle").textContent=done?(hw===need?h.team_name_in_league:a.team_name_in_league)+" "+tx("winsSeries"):tx("seriesState");$("#seriesNext").textContent=done?tx("seriesDone")+" · "+hw+"–"+aw:tx("nextMatch")+" · "+(hw+aw+1);const showResults=!!$("#seriesShowResults")?.checked,results=Array.from({length:Math.min(bo,hw+aw)},(_,i)=>($("#seriesR"+(i+1))?.value||"").trim()).map((v,i)=>v?'<span><b>M'+(i+1)+'</b> '+esc(v.replace(/\s+/g,""))+'</span>':"").filter(Boolean),resultBox=$("#seriesResults");if(resultBox){resultBox.hidden=!showResults||!results.length;$("#seriesResultsList").innerHTML=results.join("");}for(let i=1;i<=7;i++){const label=$("#seriesR"+i)?.closest("label");if(label)label.hidden=i>bo;}["seriesHome","seriesAway"].forEach(id=>{const el=$("#"+id);if(el)el.max=need;});}

  function studioState(){const ls={};["home","away"].forEach(side=>{const l=lineupFor(side);ls[side]={};SLOTS.forEach(slot=>ls[side][slot]=l[slot]||"");});const twitchTeamChannels=Object.fromEntries(['home','away'].map(side=>[$('#'+side).value,window.__sehTwitchState?.twitchTeamChannels?.[$('#'+side).value]]).filter(([id,channel])=>id&&channel));return {presentedPlayer:activeScene==='spotlight'?presentedPlayer:null,twitchTeamChannels,seriesGameFinal,lineupTeamNames:lineupTeamNames(),liveTeamsReversed,teamOrderRevision,sceneMusic:{...sceneMusic},arenaMist:!!$("#arenaMist")?.checked,footerBrand,competitionProfileId:activeLeagueId,transientSource:currentSourceReference,matchName:String(window.__sehTwitchState?.matchName||""),leagueId:activeLeagueId,theme:$("#theme")?.value||"broadcast",backgroundPackage:$("#theme")?.value||"broadcast",graphicsPackage:$("#graphicsPackage")?.value||"standard",liveSeriesShow:!!$("#showLiveSeries")?.checked,seriesFormat:$("#seriesFormat")?.value||"5",seriesRound:$("#seriesRound")?.value||tx("playoffs"),seriesHome:$("#seriesHome")?.value||"0",seriesAway:$("#seriesAway")?.value||"0",seriesShowResults:!!$("#seriesShowResults")?.checked,seriesResults:Array.from({length:7},(_,i)=>$("#seriesR"+(i+1))?.value||""),scene:activeScene,lineupSide:$("#lineupSide").value,home:$("#home").value,away:$("#away").value,hs:$("#hs").value,as:$("#as").value,headline:$("#headline").value,subline:$("#subline").value,commentator1:$("#commentator1").value,commentator2:$("#commentator2").value,videoSource:$("#videoSource")?.value||"twitch",hlsUrl:$("#hlsUrl")?.value||"",twitchChannel:$("#twitchChannel")?.value||"",twitchShow:$("#showTwitch")?.checked!==false,twitchMute:$("#muteTwitch")?.checked!==false,liveTeamStripShow:$("#showLiveTeamStrip")?.checked!==false,liveCommentatorsShow:!!$("#showLiveCommentators")?.checked,lineups:ls};}
  function applyScene(name,side){
    const next=name==="stats"?"teamcompare":name==="lowerthird"?"matchup":name||"opening";
    const nextSide=side||$("#lineupSide").value;
    const current=document.querySelector(".scene.active");
    const target=tournamentScenes?.parse(next)?tournamentScene:document.querySelector(".scene."+next);
    const sideChanged=next==="lineup"&&activeScene==="lineup"&&nextSide!==displayedLineupSide;
    // Home and away share the same lineup DOM node. Keep a visual snapshot of
    // the outgoing lineup, but run it through the exact same transition classes
    // as every other scene change.
    const oldLineup=sideChanged&&current===target?target.cloneNode(true):null;
    if(side)$("#lineupSide").value=side;
    if(next==="lineup")renderLineup();
    if(next==='duallineup')renderDualLineup();
    if(next==='spotlight')$("#spotlightCard").innerHTML=spotlightHtml();
    displayedLineupSide=next==="lineup"?nextSide:displayedLineupSide;
    document.querySelectorAll("[data-scene]").forEach(x=>x.classList.toggle("active",x.dataset.scene===next&&(!x.dataset.lineupSide||x.dataset.lineupSide===$("#lineupSide").value)));
    activeScene=next;
    tournamentScenes?.sync(tournamentControls,next);
    renderTournamentScene(next);
    syncMusicControl(current!==target);
    syncSceneMusic();
    if($("#screen"))$("#screen").dataset.arenaScene=next;
    document.getElementById('screen')?.classList.toggle('no-match',next==='idle'||next==='nextmatch');
    if(!target)return;
    const screen=$("#screen");screen?.classList.toggle("live-mode",next==="live");
    if(OBS_MODE)document.documentElement.classList.toggle("obs-live",next==="live");
    clearTimeout(sceneTransitionTimer);
    clearTimeout(lineupTransitionTimer);
    screen.querySelectorAll(".lineup-transition-old").forEach(x=>x.remove());
    document.querySelectorAll(".scene").forEach(x=>x.classList.remove("scene-leave","scene-enter"));
    screen.classList.remove("scene-switching","lineup-side-switching");
    if(sideChanged&&oldLineup){
      oldLineup.classList.add("lineup-transition-old","scene-leave","active");
      if(PRESENTER_VIEW)oldLineup.inert=true;
      // Keep the outgoing logo constrained exactly like the live lineup logo.
      const oldLogo=oldLineup.querySelector("#lineupTeamLogo");
      if(oldLogo) oldLogo.classList.add("lineup-team-logo-snapshot");
      oldLineup.querySelectorAll("[id]").forEach(x=>x.removeAttribute("id"));
      screen.appendChild(oldLineup);
      target.classList.add("active","scene-enter");
      void screen.offsetWidth;
      screen.classList.add("scene-switching");
      lineupTransitionTimer=window.setTimeout(()=>{
        oldLineup.remove();
        target.classList.remove("scene-enter");
        screen.classList.remove("scene-switching");
      },420);
      return;
    }
    if(!current||current===target){
      document.querySelectorAll(".scene").forEach(x=>x.classList.toggle("active",x===target));
      return;
    }
    void screen.offsetWidth;
    screen.classList.add("scene-switching");
    current.classList.add("scene-leave");
    target.classList.add("active","scene-enter");
    sceneTransitionTimer=window.setTimeout(()=>{
      document.querySelectorAll(".scene").forEach(x=>{if(x!==target)x.classList.remove("active");x.classList.remove("scene-leave","scene-enter");});
      screen.classList.remove("scene-switching");
    },420);
  }
  let lastOutputControls=null;
  function applyRemoteState(s){if(!s||typeof s!=="object")return;if(OBS_MODE&&window.BroadcastStatsUpdate){const signature=window.BroadcastStatsUpdate.controls(s);if(signature===lastOutputControls){window.__sehTwitchState=s;postPresenterLineups();lineupEditorStatus();if(Object.hasOwn(s,"transientSource"))void sourceProvider?.receive(s.transientSource);return;}lastOutputControls=signature;}remoteApplying=true;const incomingLeague=Number(s.leagueId||activeLeagueId);if(COMPETITIONS[incomingLeague]&&incomingLeague!==activeLeagueId){activeLeagueId=incomingLeague;if($("#tournament"))$("#tournament").value=String(activeLeagueId);applyCompetitionChrome(false);loadTournamentData();}if(Object.hasOwn(s,"transientSource"))void sourceProvider?.receive(s.transientSource);applyCompetitionChrome(false,Number(s.competitionProfileId||incomingLeague));setTheme(s.backgroundPackage||s.theme||"broadcast");setGraphicsPackage(s.graphicsPackage||"standard");setFooterBrand(s.footerBrand);if($("#videoSource")&&s.videoSource!==undefined)$("#videoSource").value=s.videoSource||"twitch";if($("#hlsUrl")&&s.hlsUrl!==undefined)$("#hlsUrl").value=s.hlsUrl||"";if($("#twitchChannel")&&s.twitchChannel!==undefined)$("#twitchChannel").value=s.twitchChannel||"";if($("#showTwitch"))$("#showTwitch").checked=s.twitchShow!==false;if($("#muteTwitch")&&s.twitchMute!==undefined)$("#muteTwitch").checked=!!s.twitchMute;if($("#showLiveTeamStrip")&&s.liveTeamStripShow!==undefined)$("#showLiveTeamStrip").checked=!!s.liveTeamStripShow;if($("#showLiveCommentators")&&s.liveCommentatorsShow!==undefined)$("#showLiveCommentators").checked=!!s.liveCommentatorsShow;$("#screen")?.classList.toggle("live-team-strip-off",$("#showLiveTeamStrip")?.checked===false);$("#screen")?.classList.toggle("live-commentators-off",!$("#showLiveCommentators")?.checked);window.__sehTwitchState=s;["home","away"].forEach(id=>{if(s[id]!==undefined&&$("#"+id)){const el=$("#"+id),v=String(s[id]);if(v&&![...el.options].some(o=>o.value===v))el.add(new Option(tx("team"),v));el.value=v;}});["hs","as","headline","subline","commentator1","commentator2","seriesFormat","seriesRound","seriesHome","seriesAway"].forEach(id=>{if(s[id]!==undefined&&$("#"+id))$("#"+id).value=s[id];});if($("#seriesShowResults")&&s.seriesShowResults!==undefined)$("#seriesShowResults").checked=!!s.seriesShowResults;applySeriesResults(s.seriesResults);if(s.lineups){["home","away"].forEach(side=>{if(!s.lineups[side])return;const key=side+":"+String(selectedTeam(side).sports_gamer_team_id);const next={};SLOTS.forEach(slot=>next[slot]=String(s.lineups[side][slot]||""));lineups.set(key,next);});}setArenaMist(s.arenaMist===true);setSceneMusic(s.sceneMusic);setLiveTeamOrder(s.liveTeamsReversed);teamOrderRevision=s.teamOrderRevision??null;seriesGameFinal=s.seriesGameFinal??null;presentedPlayer=s.presentedPlayer??null;applyScene(s.scene,s.lineupSide);window.dispatchEvent(new CustomEvent("seh:twitch-state",{detail:s}));renderMatch();if($("#showLiveSeries"))$("#showLiveSeries").checked=s.liveSeriesShow===true;renderSeries();renderLineup();renderTable();renderTeamCompare();renderScorers();renderFormGuide();renderOffense();renderDefenseLeaders();renderGoalieLeaders();renderRoad();renderLeaders();renderRoleMatchups();remoteApplying=false;}
  async function remoteRequest(method,body){const cfg=window.EHOCKEY_CONFIG||{};if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)return;const key=String(cfg.supabasePublishableKey),headers={apikey:key,Accept:"application/json","Content-Type":"application/json"};if(/^eyJ[A-Za-z0-9_-]*\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$/.test(key))headers.Authorization="Bearer "+key;if(method!=="GET"){const session=await window.SWNStudioAccess?.session();if(!session)throw new Error("Admininloggning krävs.");headers.Authorization="Bearer "+session.access_token;}const url=String(cfg.supabaseUrl).replace(/\/+$/,"")+"/rest/v1/broadcast_studio_state?channel=eq."+encodeURIComponent(REMOTE_CHANNEL);const res=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined,cache:"no-store"});if(!res.ok)throw new Error("Broadcast state HTTP "+res.status);return method==="GET"?res.json():null;}
  // Preparing a match must never publish its state to the program output.
  let programState=null,programHeld=true,canResumeProgram=false,takeSequence=0;
  let directorSceneKey='',directorRevision=0,directorWrites=0,directorReading=false,directorRestoring=false;
  const sceneKey=s=>JSON.stringify([s.scene,s.lineups??null,s.presentedPlayer??null,s.videoSource,s.twitchChannel,s.twitchTeamChannels,s.lineupSide||'home',!!s.publicNoMatch,s.publicNextMatch||null,s.sceneMusic||{},s.seriesHome,s.seriesAway,s.liveTeamsReversed===true,s.teamOrderRevision??null,s.hs,s.as,s.seriesGameFinal,s.seriesResults,s.seriesShowResults,s.liveTeamStripShow!==false,s.liveCommentatorsShow===true]);
  function holdProgram(){
    takeSequence++;
    if(!programHeld)programState=structuredClone(studioState());
    programHeld=true;directorRevision++;clearTimeout(remoteTimer);remoteTimer=0;
  }
  function publishState(){
    if(OBS_MODE||VIEWER_MODE||remoteApplying||(programHeld&&!programState))return;
    const state={...structuredClone(programHeld?programState:studioState()),publicNoMatch,publicNextMatch,commentary:window.__sehCommentarySession||null};
    if(PREVIEW_MODE){previewChannel?.postMessage({type:"state",state});return;}
    clearTimeout(remoteTimer);
    directorRevision++;
    remoteTimer=setTimeout(async()=>{
      remoteTimer=0;directorWrites++;
      try{await remoteRequest("PATCH",{state,updated_at:new Date().toISOString()});directorSceneKey=sceneKey(state);}
      catch(error){console.error(error);}
      finally{directorWrites--;}
    },120);
  }
  window.__sehPublishBroadcastState=publishState;
  let stateRequestPending=false,lastRemoteState='';
  window.__sehStudioSnapshot=studioState;
  window.__sehStudioHasProgram=()=>!!programState||!programHeld;
  window.__sehStudioHoldOutput=holdProgram;
  window.__sehStudioNewBroadcast=()=>{
    holdProgram();
    presentedPlayer=null;
    // An explicit video-off setting belongs to the previous match, not the new draft.
    const show=$("#showTwitch");
    if(show&&!show.checked){
      show.checked=true;
      window.dispatchEvent(new CustomEvent("seh:twitch-state",{detail:studioState()}));
    }
    loadTournamentData();
  };
  window.__sehStudioRestore=s=>{holdProgram();applyRemoteState(s);};
  window.__sehStudioTake=async s=>{
    holdProgram();const seq=++takeSequence;clearTimeout(remoteTimer);applyRemoteState(s);
    if(!s.transientSource)return false;
    if(s.transientSource){
      const ref=window.BroadcastTransientSource.reference(s.transientSource,activeLeagueId);
      if(!ref||Date.parse(ref.expires_at)<=Date.now()||!await sourceProvider?.receive(ref))return false;
    }
    if(seq!==takeSequence||Number(s.leagueId||activeLeagueId)!==activeLeagueId)return false;
    applyRemoteState(s);
    programState=structuredClone(studioState());programHeld=false;canResumeProgram=true;
    publicNoMatch=false;publicNextMatch=null;publishState();
    return true;
  };
  window.__sehStudioEnd=async()=>{
    holdProgram();
    const ended={...structuredClone(programState||studioState()),scene:'idle',twitchChannel:'',hlsUrl:'',twitchShow:false,matchName:'',commentary:null,publicNoMatch:true,publicNextMatch:null};
    if(PREVIEW_MODE)previewChannel?.postMessage({type:'state',state:ended});
    else await remoteRequest('PATCH',{state:ended,updated_at:new Date().toISOString()});
    await window.__sehStopCommentary?.();
    window.__sehCommentarySession=null;
    programState=structuredClone(ended);programHeld=true;canResumeProgram=false;
    publicNoMatch=true;publicNextMatch=null;
    applyRemoteState(ended);
    window.dispatchEvent(new CustomEvent('seh:program-status',{detail:ended}));
    return true;
  };
  function publishCompetitionProfile(leagueId){
    if(!COMPETITIONS[leagueId])return;
    if(!programState)programState=structuredClone(studioState());
    programState={...programState,competitionProfileId:leagueId,headline:COMPETITIONS[leagueId].label};
    publishState();
  }
  window.__sehStudioIdle=enabled=>{
    if(!enabled&&!canResumeProgram)return publicNoMatch;
    if(!programState)programState=structuredClone(studioState());
    publicNoMatch=!!enabled;publicNextMatch=null;publishState();return publicNoMatch;
  };
  window.__sehStudioNext=next=>{
    if(!programState)programState=structuredClone(studioState());
    publicNextMatch=next;publicNoMatch=true;publishState();
  };
  if(!OBS_MODE&&!PREVIEW_MODE){
    directorRestoring=true;
    void remoteRequest("GET").then(async rows=>{
      if(programHeld&&!programState&&rows?.[0]?.state){
        programState=structuredClone(rows[0].state);
        directorSceneKey=sceneKey(programState);
        if(window.__sehCommentarySession===undefined)window.__sehCommentarySession=programState.commentary||null;canResumeProgram=true;
        publicNoMatch=!!programState.publicNoMatch;publicNextMatch=programState.publicNextMatch||null;
        const restored=structuredClone(programState),seq=takeSequence;
        applyRemoteState(restored);
        const loaded=restored.transientSource&&await sourceProvider?.receive(restored.transientSource);
        if(seq===takeSequence){
          const {transientSource,...controls}=restored;applyRemoteState(controls);
          programHeld=!loaded;
          window.dispatchEvent(new CustomEvent("seh:studio-resumed",{detail:restored}));
        }
        window.dispatchEvent(new CustomEvent("seh:program-status",{detail:programState}));
      }
    }).catch(console.error).finally(()=>{directorRestoring=false;});
  }
  // A mobile command is already on air. Mirror only its allowed controls
  // and do not send a write back or overwrite a prepared match.
  async function followProgramScene(){
    if(directorRestoring||directorReading||directorWrites||remoteTimer||!programState||document.hidden)return;
    directorReading=true;
    const revision=directorRevision;
    try{
      const rows=await remoteRequest("GET");
      const state=rows?.[0]?.state;
      if(!state||!Object.keys(state).length||revision!==directorRevision||directorWrites||remoteTimer)return;
      const key=sceneKey(state);
      if(key===directorSceneKey)return;
      directorSceneKey=key;
      publicNoMatch=!!state.publicNoMatch;
      publicNextMatch=state.publicNextMatch||null;
      const side=state.lineupSide==='away'?'away':'home';
      if(!publicNoMatch&&[...document.querySelectorAll('[data-scene]')].some(button=>button.dataset.scene===state.scene)){
        const sceneChanged=programState.scene!==state.scene||(programState.lineupSide||'home')!==side;
        const swapped=!!state.teamOrderRevision&&programState.teamOrderRevision!==state.teamOrderRevision;
        const lineupsChanged=!!state.lineups&&JSON.stringify(programState.lineups)!==JSON.stringify(state.lineups);
        const orderPatch=swapped?{home:state.home,away:state.away,subline:state.subline,lineups:state.lineups,teamOrderRevision:state.teamOrderRevision}:lineupsChanged?{lineups:state.lineups}:{};
        const scores={hs:state.hs,as:state.as,seriesGameFinal:state.seriesGameFinal??null,seriesResults:state.seriesResults,seriesShowResults:state.seriesShowResults};
        const streamChanged=programState.videoSource!==state.videoSource||programState.twitchChannel!==state.twitchChannel||
          JSON.stringify(programState.twitchTeamChannels||{})!==JSON.stringify(state.twitchTeamChannels||{});
        const streamPatch=streamChanged?{videoSource:state.videoSource,twitchChannel:state.twitchChannel,hlsUrl:state.hlsUrl,twitchTeamChannels:state.twitchTeamChannels||{}}:{};
        const overlays={liveTeamStripShow:state.liveTeamStripShow!==false,liveCommentatorsShow:state.liveCommentatorsShow===true};
        const selectedChanged=JSON.stringify(programState.presentedPlayer??null)!==JSON.stringify(state.presentedPlayer??null);
        const controls={...orderPatch,...scores,...streamPatch,...overlays,presentedPlayer:state.presentedPlayer??null,scene:state.scene,lineupSide:side,sceneMusic:state.sceneMusic||{},seriesHome:state.seriesHome,seriesAway:state.seriesAway,liveTeamsReversed:state.liveTeamsReversed===true};
        programState={...programState,...controls};
        if(!programHeld&&(swapped||streamChanged||lineupsChanged)){
          // The director mirrors on-air controls only when not editing a separate draft.
          applyRemoteState({...studioState(),...controls});
        }else{
          if(!programHeld){
            presentedPlayer=controls.presentedPlayer;
            setLiveTeamOrder(state.liveTeamsReversed);
            if($("#showLiveTeamStrip"))$("#showLiveTeamStrip").checked=overlays.liveTeamStripShow;
            if($("#showLiveCommentators"))$("#showLiveCommentators").checked=overlays.liveCommentatorsShow;
            $("#screen")?.classList.toggle("live-team-strip-off",!overlays.liveTeamStripShow);
            $("#screen")?.classList.toggle("live-commentators-off",!overlays.liveCommentatorsShow);
            setSceneMusic(state.sceneMusic);
            seriesGameFinal=scores.seriesGameFinal;
            let scoreChanged=false;
            for(const id of ["hs","as","seriesHome","seriesAway"]){
              const input=$("#"+id);
              if(state[id]===undefined||!input||input.value===String(state[id]??"0"))continue;
              input.value=String(state[id]??"0");
              if(id==="hs"||id==="as")scoreChanged=true;
            }
            applySeriesResults(state.seriesResults);
            if($("#seriesShowResults")&&state.seriesShowResults!==undefined)$("#seriesShowResults").checked=state.seriesShowResults===true;
            if(scoreChanged)renderMatch();
            renderSeries();
          }
          if(sceneChanged)applyScene(state.scene,side);
          else if(!programHeld&&selectedChanged&&state.scene==='spotlight')$("#spotlightCard").innerHTML=spotlightHtml();
          else if(!programHeld)syncSceneMusic();
        }
      }
      window.dispatchEvent(new CustomEvent('seh:program-status',{detail:state}));
    }catch(error){console.error("Director scene sync:",error);}
    finally{directorReading=false;}
  }
  async function pullState(){if(stateRequestPending)return;stateRequestPending=true;try{const rows=await remoteRequest("GET");if(rows&&rows[0]&&rows[0].state&&Object.keys(rows[0].state).length){const signature=JSON.stringify(rows[0].state);if(signature!==lastRemoteState){lastRemoteState=signature;applyRemoteState(viewerState(rows[0].state));}}}catch(e){console.error("Broadcast remote:",e);if(VIEWER_MODE)window.SWNViewerBridge.postStatus({type:'seh-tv-status',text:'Kontakten med studion är tillfälligt bruten. Försöker igen.'});}finally{stateRequestPending=false;}}
  if(previewChannel){previewChannel.onmessage=event=>{if(OBS_MODE&&event.data?.type==="state")applyRemoteState(viewerState(event.data.state));else if(!OBS_MODE&&event.data?.type==="request")publishState();};}
  if(OBS_MODE&&PREVIEW_MODE){previewChannel?.postMessage({type:"request"});}
  else if(OBS_MODE){
    const obsPoll=()=>{if(!VIEWER_MODE||!document.hidden)void pullState();};
    obsPoll();
    setInterval(obsPoll,1000);
    document.addEventListener("visibilitychange",obsPoll);
    window.addEventListener("focus",obsPoll);
    window.addEventListener("pageshow",obsPoll);
  }else if(!PREVIEW_MODE){
    setInterval(()=>void followProgramScene(),1000);
    window.addEventListener("focus",()=>void followProgramScene());
    document.addEventListener("visibilitychange",()=>void followProgramScene());
  }else setTimeout(publishState,800);

  // Controls are installed synchronously, before any data request starts.
  function selectProgramScene(name,side){
    if(name==="groupmeetings"&&$('[data-scene="groupmeetings"]')?.disabled)return;
    presentedPlayer=null;
    applyScene(name,side);
    // Live scene selection must not take any prepared match fields.
    if(programHeld&&programState)programState={...programState,scene:activeScene,lineupSide:$("#lineupSide").value,presentedPlayer:null};
    if(programState||!programHeld){publicNoMatch=false;publicNextMatch=null;}
    publishState();
  }
  document.querySelectorAll("[data-scene]").forEach(button => button.addEventListener("click", () => selectProgramScene(button.dataset.scene,button.dataset.lineupSide)));
  $("#tournament")?.addEventListener("change",async()=>{
    const next=Number($("#tournament").value);
    if(!COMPETITIONS[next]||next===activeLeagueId)return;
    holdProgram();
    activeLeagueId=next;
    applyCompetitionChrome(true);
    publishCompetitionProfile(next);
    $("#home").replaceChildren();$("#away").replaceChildren();
    $("#subline").value="";
    await loadTournamentData();
    const h=selectedTeam("home"),a=selectedTeam("away");
    if($("#home").value&&$("#away").value)$("#subline").value=String(h.team_name_in_league||"").toLocaleUpperCase(LOCALE)+" vs "+String(a.team_name_in_league||"").toLocaleUpperCase(LOCALE);
    renderAllCompetitionData();publishState();
  });
  $("#theme")?.addEventListener("change",()=>{setTheme($("#theme").value);publishState();});
  $("#graphicsPackage")?.addEventListener("change",()=>{setGraphicsPackage($("#graphicsPackage").value);publishState();});
  if(!OBS_MODE&&!VIEWER_MODE){
    const label=document.createElement('label');label.textContent=({sv:'AVSÄNDARE',en:'BROADCAST BRAND',fi:'LÄHETYKSEN BRÄNDI',de:'SENDERMARKE'})[LOCALE]||'BROADCAST BRAND';
    const select=document.createElement('select');select.id='footerBrand';select.add(new Option('Svensk eHockey','seh'));select.add(new Option('SportsGamer','sportsgamer'));label.append(select);
    $('#graphicsPackage')?.closest('label')?.after(label);
    select.addEventListener('change',()=>{setFooterBrand(select.value);publishState();});
  }
  setFooterBrand(footerBrand);

  ["seriesFormat","seriesHome","seriesAway","seriesShowResults"].forEach(id=>$("#"+id)?.addEventListener("change",()=>{renderSeries();publishState();}));
  for(let i=1;i<=7;i++)$("#seriesR"+i)?.addEventListener("input",()=>{renderSeries();publishState();});
  $("#seriesRound")?.addEventListener("input",()=>{renderSeries();publishState();});
  installArenaMist();
  installSceneMusic();
  setTheme($("#theme")?.value||"broadcast");
  setGraphicsPackage($("#graphicsPackage")?.value||"standard");
  $("#lineupEditors").addEventListener("change", event => {
    const select = event.target.closest("[data-lineup-slot]");
    if (!select) return;
    const side = select.dataset.lineupSide || $("#lineupSide").value;
    const lineup = lineupFor(side), slot = select.dataset.lineupSlot;
    if (select.value && !roster(selectedTeam(side)).some(p => same(p.sports_gamer_player_id, select.value))) return;
    // Choosing a player who already occupies another slot swaps the two slots.
    const previous = lineup[slot] || "";
    const other = SLOTS.find(s => s !== slot && select.value && lineup[s] === select.value);
    if (other) lineup[other] = previous;
    lineup[slot] = select.value;
    renderLineup();
    renderLeaders();
    renderRoleMatchups();
    publishState();
  });
  ["home", "away"].forEach(side => $("#" + side).addEventListener("change", () => {
    $("#subline").value = selectedTeam("home").team_name_in_league.toLocaleUpperCase(LOCALE) + " vs " + selectedTeam("away").team_name_in_league.toLocaleUpperCase(LOCALE);
    renderMatch();
    renderSeries();
    renderLineup();
    renderTable();
    renderTeamCompare();
    renderScorers();
    renderFormGuide();
    renderOffense();
    renderDefenseLeaders();
    renderGoalieLeaders();
    renderRoad();
    renderLeaders();
    renderRoleMatchups();
    publishState();
  }));
  ["hs", "as", "headline", "subline"].forEach(id => $("#" + id).addEventListener("input", () => { renderMatch(); publishState(); }));
  ["commentator1","commentator2"].forEach(id => $("#" + id).addEventListener("change", () => { renderCommentators(); publishState(); }));
  $("#showLiveTeamStrip")?.addEventListener("change",()=>{$("#screen")?.classList.toggle("live-team-strip-off",!$("#showLiveTeamStrip").checked);publishState();});
  $("#showLiveCommentators")?.addEventListener("change",()=>{$("#screen")?.classList.toggle("live-commentators-off",!$("#showLiveCommentators").checked);publishState();});
  $("#screen").addEventListener("error", event => {
    if (event.target.matches?.(".opening-commentator > img, .live-commentator > img, .commentator-portrait > img")) {
      const placeholder=document.createElement("div");
      placeholder.className="commentator-placeholder";
      placeholder.setAttribute("aria-hidden","true");
      (event.target.closest(".commentator-portrait")||event.target).replaceWith(placeholder);
      return;
    }
    if (event.target.tagName === "IMG") event.target.hidden = true;
  }, true);
  $("#screen")?.classList.toggle("live-team-strip-off",$("#showLiveTeamStrip")?.checked===false);
  $("#screen")?.classList.toggle("live-commentators-off",!$("#showLiveCommentators")?.checked);
  renderTeams();
  renderSeries();
  renderLineup();
  renderTable();
  renderTeamCompare();
  renderScorers();
  renderFormGuide();
  renderOffense();
  renderDefenseLeaders();
  renderGoalieLeaders();
  renderRoad();
  renderLeaders();
  renderRoleMatchups();
  renderStatus();
  applyCompetitionChrome(false);
  const temporaryStatus=document.createElement('small');temporaryStatus.id='transientBroadcastStatus';temporaryStatus.className='control-note';temporaryStatus.setAttribute('role','status');temporaryStatus.setAttribute('aria-live','polite');
  if(!OBS_MODE&&!VIEWER_MODE){
    const button=document.createElement('button');button.type='button';button.id='fetchBroadcastData';button.className='button';button.textContent='Hämta från SportsGamer';
    $('#tournament')?.closest('label')?.after(button,temporaryStatus);
    temporaryStatus.textContent='Ingen statistik hämtad. Klicka Hämta från SportsGamer.';
    button.addEventListener('click',async()=>{if(button.disabled)return;if(currentSourceReference){document.querySelector('.stats-refresh [data-fetch]')?.click();return;}button.disabled=true;try{const applied=await sourceProvider.refresh();if(applied)publishState();}finally{button.disabled=false;}});
  }
  sourceProvider=window.BroadcastTransientSource?.create({
    getLeague:()=>activeLeagueId,
    allowRemote:true,
    onStatus:message=>{temporaryStatus.textContent=message;},
    onLegacy:clearTournamentData,
    onData:(payload,reference)=>{
      tournamentDataRequest++;sourcePayload=payload;currentSourceReference=reference;
      data.teams=payload.teams;data.players=[...new Map(payload.players.map(p=>[p.sports_gamer_team_id+':'+p.sports_gamer_player_id,p])).values()];
      data.playoffs=Array.isArray(payload.playoffs)?payload.playoffs:[];
      status.teams=data.teams.length?'ready':'empty';status.players=data.players.length?'ready':'empty';status.playoffs=data.playoffs.length?'ready':'empty';
      document.documentElement.dataset.broadcastDataSource='temporary';
      renderAllCompetitionData();renderStatus();
    }
  });
  if(!OBS_MODE&&!VIEWER_MODE&&!PREVIEW_MODE)window.BroadcastStatsUpdate?.mount({
    anchor:temporaryStatus,provider:sourceProvider,channel:REMOTE_CHANNEL,
    getContext:()=>({state:structuredClone(studioState()),payload:sourcePayload}),
    onPublished:(prepared,state)=>{
      // Install data only; never apply the returned scene/media controls here.
      sourceProvider.commit(prepared);
      if(programState)programState={...programState,transientSource:prepared.reference};
      window.dispatchEvent(new CustomEvent('seh:program-status',{detail:state}));
    }
  });
  loadTournamentData();
  window.addEventListener('resize',scheduleLineupFit);
  if(window.ResizeObserver&&$('.players'))new ResizeObserver(scheduleLineupFit).observe($('.players'));
  document.fonts?.ready.then(scheduleLineupFit);
})();


/* v64: right-column quick controls mirror canonical controls. */
(()=>{const pairs=[["dockHs","hs"],["dockAs","as"],["dockTheme","theme"]];
 const sync=()=>pairs.forEach(([d,s])=>{const a=document.getElementById(d),b=document.getElementById(s);if(a&&b&&a.value!==b.value)a.value=b.value});
 pairs.forEach(([d,s])=>{const a=document.getElementById(d),b=document.getElementById(s);if(!a||!b)return;
   a.addEventListener("change",()=>{b.value=a.value;b.dispatchEvent(new Event("change",{bubbles:true}));sync()});
   a.addEventListener("input",()=>{if(a.type==="number"){b.value=a.value;b.dispatchEvent(new Event("input",{bubbles:true}))}});
   b.addEventListener("change",sync);b.addEventListener("input",sync);
 }); sync(); setInterval(sync,1000);
})();





/* Live video remains in canonical broadcast state.
   Twitch embed is kept for compatibility; Direct HLS/video uses a same-page <video>
   so OBS Browser Source can own playback and graphics in one source. */
(()=>{
 const tx=window.__sehBroadcastTx||((key)=>key);
 const OBS_MODE_LOCAL=new URLSearchParams(location.search).get("obs")==="1";
 const RECORDING_OUTPUT=OBS_MODE_LOCAL&&new URLSearchParams(location.search).get("recording")==="1";
 const VIEWER_MODE_LOCAL=new URLSearchParams(location.search).get("viewer")==="1";
 const RAW_FEED=document.documentElement.classList.contains("raw-feed-preview");
 const TOOLS_ONLY=document.documentElement.classList.contains("presenter-studio-tools");
 const DIRECTOR_MODE=!OBS_MODE_LOCAL&&!VIEWER_MODE_LOCAL;
 let viewerMuted=true;
 const $id=id=>document.getElementById(id);
 const source=$id("videoSource"),twitchInput=$id("twitchChannel"),hlsInput=$id("hlsUrl"),btn=$id("loadTwitch"),
       layer=$id("twitchLayer"),host=$id("twitchPlayer"),video=$id("directVideo"),status=$id("streamStatus"),
       show=$id("showTwitch"),mute=$id("muteTwitch"),screen=$id("screen");

 // Match audio follows visible match video; commentary uses its own audio path.
 let matchAudioVisible=!!screen?.querySelector('.scene.live.active')&&show?.checked!==false;
 function syncMatchAudio(){
   if(!video)return;
   const requestedMuted=RECORDING_OUTPUT?false:VIEWER_MODE_LOCAL?viewerMuted:OBS_MODE_LOCAL?false:mute?.checked!==false;
   video.muted=RAW_FEED||TOOLS_ONLY||!matchAudioVisible||requestedMuted;
 }
 window.__sehSyncMatchAudio=syncMatchAudio;
 const playbackActive=()=>RAW_FEED||DIRECTOR_MODE||RECORDING_OUTPUT||screen?.classList.contains("live-mode");
 let monitorStatus=null;
 if(DIRECTOR_MODE){
   const shell=document.querySelector('.preview-shell');
   if(shell){
     const pair=document.createElement('div');pair.className='director-monitors';shell.before(pair);pair.append(shell);
     const monitor=document.createElement('section');monitor.className='feed-monitor';
     monitor.innerHTML='<h3>MATCHFEED · UTAN GRAFIK</h3><canvas width="640" height="360" aria-label="Vald matchstream, oberoende av grafikscen"></canvas><p role="status">Ladda en stream nedan för att följa matchen.</p><small>Visas bara i studion · fortsätter vid scenbyte · ljud av som standard</small>';
     pair.prepend(monitor);monitorStatus=monitor.querySelector('p');
     const canvas=monitor.querySelector('canvas'),ctx=canvas.getContext('2d');
     if(!TOOLS_ONLY)setInterval(()=>{
       if(document.hidden)return;
       ctx.fillStyle='#030b12';ctx.fillRect(0,0,640,360);
       if(video&&!video.hidden&&video.readyState>=2&&video.videoWidth){
         const scale=Math.min(640/video.videoWidth,360/video.videoHeight),w=video.videoWidth*scale,h=video.videoHeight*scale;
         ctx.drawImage(video,(640-w)/2,(360-h)/2,w,h);
       }
     },100);
     const scaleBox=shell.querySelector('.preview-scale');
     new ResizeObserver(()=>{const width=shell.clientWidth-20;scaleBox.style.setProperty('--director-scale',String(Math.max(.1,width/1280)));}).observe(shell);
   }
 }
 let mountedKey="",hls=null,directPlaying=false,activeTwitchChannel="",pendingTwitchChannel="",liveWatchTimer=0,lastVideoTime=0,lastVideoProgressAt=0;

 const parseTwitch=raw=>{let v=String(raw||"").trim();if(!v)return "";try{if(/^https?:\/\//i.test(v)){const u=new URL(v);return u.pathname.split("/").filter(Boolean)[0]||""}}catch(e){}return v.replace(/^@/,"").replace(/^www\.twitch\.tv\//i,"").replace(/^twitch\.tv\//i,"").split(/[/?#]/)[0].trim()};
 let statusMatchName='',lastStatusText='',lastStatusOk=false;
 const setStatus=(t,ok=false)=>{lastStatusText=t;lastStatusOk=ok;const label=statusMatchName&&playbackActive()?statusMatchName+' · '+t:t;if(RAW_FEED){const message=$id("rawFeedStatus");message.textContent=t;message.hidden=ok&&directPlaying;return}if(monitorStatus)monitorStatus.textContent=label;if(VIEWER_MODE_LOCAL)window.SWNViewerBridge.postStatus({type:'seh-tv-status',text:label,playing:ok});if(OBS_MODE_LOCAL){document.documentElement.dataset.playback=label;console.info("[SEH Video]",label)}if(status){status.classList.toggle("ready",ok);const x=status.querySelector("span");if(x)x.textContent=label}};
 const obsBoot=()=>{};
 const obsPlaying=()=>{};

 const destroy=()=>{
   clearTimeout(twitchResolveTimer);clearInterval(liveWatchTimer);liveWatchTimer=0;lastVideoTime=0;lastVideoProgressAt=0;twitchResolveSeq++;pendingTwitchChannel="";activeTwitchChannel="";
   if(hls){try{hls.destroy()}catch(e){}hls=null}
   host?.replaceChildren();
   if(video){
     try{video.pause()}catch(e){}
     video.removeAttribute("src");video.load();video.hidden=true;
   }
   mountedKey="";directPlaying=false;
   layer?.classList.remove("has-stream");
   if(OBS_MODE_LOCAL)document.documentElement.classList.remove("obs-twitch-booting","obs-twitch-playing");
 };

 let twitchResolveTimer=0,twitchResolveSeq=0,lastTwitchRaw="";
 const retryRawTwitch=raw=>{if(RAW_FEED)twitchResolveTimer=setTimeout(()=>void resolveTwitchHls(raw,true),8000);};
 const resolveTwitchHls=async(raw,muted=true)=>{
   const channel=parseTwitch(raw);
   if(!channel){destroy();setStatus(tx("invalidTwitch"));return false}
   if(channel===pendingTwitchChannel)return true;
   if(channel===activeTwitchChannel&&video&&!video.hidden&&(hls||video.currentSrc))return true;
   if(mountedKey)destroy();
   lastTwitchRaw=raw;
   pendingTwitchChannel=channel;
   const seq=++twitchResolveSeq;
   clearTimeout(twitchResolveTimer);
   setStatus(tx("fetchingTwitch")+" · "+channel.toUpperCase());
   const base=String(window.EHOCKEY_CONFIG?.supabaseUrl||"").replace(/\/+$/,"");
   if(!base){setStatus(tx("missingSupabase"));return false}
   try{
     const res=await fetch(base+"/functions/v1/seh-twitch-resolve?channel="+encodeURIComponent(channel),{cache:"no-store"});
     const data=await res.json().catch(()=>({}));
     if(seq!==twitchResolveSeq)return false;
     pendingTwitchChannel='';
     if(VIEWER_MODE_LOCAL&&(!res.ok||!data.hlsUrl))twitchResolveTimer=setTimeout(()=>{if(screen?.classList.contains('live-mode'))void resolveTwitchHls(raw,viewerMuted);},30000);
     if(!res.ok||!data?.hlsUrl){
       retryRawTwitch(raw);
       setStatus(data?.detail?("TWITCH RESOLVER · "+String(data.detail).slice(0,90)):tx("twitchFetchFail"));
       return false;
     }
     setStatus(tx("twitchReady")+" · "+channel.toUpperCase(),true);
     const ok=mountDirect(data.hlsUrl,muted,{label:"TWITCH · "+channel.toUpperCase(),kind:"twitch"});
     pendingTwitchChannel="";
     if(ok)activeTwitchChannel=channel;
     if(ok&&data.expiresAt){
       const ms=Math.max(300000,Math.min(7200000,(Number(data.expiresAt)*1000-Date.now())-300000));
       twitchResolveTimer=setTimeout(()=>{if(lastTwitchRaw&&playbackActive())resolveTwitchHls(lastTwitchRaw,muted)},ms);
     }
     return ok;
   }catch(e){
     if(seq!==twitchResolveSeq)return false;
     pendingTwitchChannel="";
     retryRawTwitch(raw);
     setStatus(tx("twitchNetwork"));
     console.error("[SEH Video] Twitch resolver",e);
     return false;
   }
 };
 const mountTwitch=(raw,muted=true)=>{void resolveTwitchHls(raw,muted);return true;};

 const tryDirectPlay=()=>{
   if(!video||!playbackActive()||(!DIRECTOR_MODE&&layer?.classList.contains("is-hidden")))return;
   const p=video.play();if(p&&typeof p.catch==="function")p.catch(()=>{});
 };

 const mountDirect=(raw,muted=true,meta={})=>{
   const url=String(raw||"").trim();if(!/^https?:\/\//i.test(url)){destroy();setStatus(tx("invalidVideoUrl"));return false}
   const key=(meta.kind||"direct")+":"+url;if(key===mountedKey&&video&&!video.hidden)return true;
   destroy();obsBoot();
   video.hidden=false;
   video.autoplay=true;video.playsInline=true;video.preload="auto";video.controls=VIEWER_MODE_LOCAL&&!RAW_FEED;
   syncMatchAudio();
   const onPlaying=()=>{directPlaying=true;lastVideoTime=video.currentTime||0;lastVideoProgressAt=Date.now();obsPlaying();setStatus((meta.label||tx("directVideo"))+" "+tx("playing"),true)};
   const onPause=()=>{directPlaying=false;if(playbackActive())setTimeout(tryDirectPlay,150)};
   video.onplaying=onPlaying;video.onpause=onPause;video.onstalled=()=>setStatus(tx("directVideo")+" "+tx("buffering"));video.onwaiting=()=>setStatus(tx("directVideo")+" "+tx("buffering"));
   video.onerror=()=>setStatus(tx("videoError"));

   if((meta.kind==="twitch"||/\.m3u8(?:$|[?#])/i.test(url))&&window.Hls?.isSupported()){
     // Keep director and public playback near the same live target. Independent
     // players may still differ slightly, but must not accumulate stale footage.
     hls=new Hls({lowLatencyMode:true,capLevelToPlayerSize:false,backBufferLength:10,maxBufferLength:12,maxMaxBufferLength:20,liveSyncDurationCount:3,liveMaxLatencyDurationCount:5,maxLiveSyncPlaybackRate:1.1,liveSyncOnStallIncrease:0,highBufferWatchdogPeriod:2,nudgeOffset:.1,nudgeMaxRetry:10});
     hls.loadSource(url);hls.attachMedia(video);
     hls.on(Hls.Events.MANIFEST_PARSED,()=>{
       let qualityLabel="";
       if(Array.isArray(hls.levels)&&hls.levels.length){
         const levels=hls.levels.map((level,index)=>({index,height:Number(level.height||0),width:Number(level.width||0),bitrate:Number(level.bitrate||0)}));
         const candidates=levels
           .filter(x=>x.height>0&&x.height<=720&&(!x.width||x.width<=1280));
         const chosen=RAW_FEED?levels.sort((a,b)=>(a.bitrate-b.bitrate)||(a.height-b.height))[0]:
           (candidates.length?candidates:levels).sort((a,b)=>(b.height-a.height)||(b.bitrate-a.bitrate))[0];
         if(chosen){
           hls.autoLevelCapping=chosen.index;
           hls.startLevel=chosen.index;
           hls.nextAutoLevel=chosen.index;
           qualityLabel=chosen.height?" · "+chosen.height+"p":" · "+tx("optimized");
         }
       }
       setStatus(tx("hlsLoaded")+qualityLabel);
       tryDirectPlay();
     });
     if(meta.kind==="twitch"){
       const recoverLive=()=>{
         if(!hls||!video||video.hidden||!playbackActive())return;
         const now=Date.now(),current=Number(video.currentTime||0);
         const live=Number(hls.liveSyncPosition);
         // A stream can keep playing while falling behind after buffering or a
         // background tab. Recover that drift too, not only a complete stall.
         if(!video.seeking&&Number.isFinite(live)&&live>0&&live-current>4){
           try{video.currentTime=live;lastVideoTime=live;lastVideoProgressAt=now;tryDirectPlay();}catch(e){console.warn("[SEH HLS] live catch-up",e)}
           return;
         }
         if(current>lastVideoTime+.08){lastVideoTime=current;lastVideoProgressAt=now;return}
         if(!lastVideoProgressAt)lastVideoProgressAt=now;
         if(now-lastVideoProgressAt<4500)return;
         setStatus(tx("twitchRecovering"));
         try{
           if(Number.isFinite(live)&&live>0&&Math.abs(live-current)>1.5)video.currentTime=Math.max(0,live-1);
           hls.startLoad(-1);
           const p=video.play();if(p&&typeof p.catch==="function")p.catch(()=>{});
         }catch(e){console.warn("[SEH HLS] live recover",e)}
         lastVideoTime=Number(video.currentTime||0);lastVideoProgressAt=now;
       };
       clearInterval(liveWatchTimer);
       liveWatchTimer=setInterval(recoverLive,1500);
       const softRecover=()=>setTimeout(recoverLive,350);
       video.onstalled=()=>{setStatus(tx("twitchBuffering"));softRecover()};
       video.onwaiting=()=>{setStatus(tx("twitchBuffering"));softRecover()};
     }
     hls.on(Hls.Events.ERROR,(_,data)=>{
       if(!data?.fatal)return;
       const detail=String(data?.details||data?.type||tx("unknown"));
       const code=data?.response?.code||data?.networkDetails?.status||"";
       const failed=data?.url||data?.response?.url||"";
       console.warn("[SEH HLS]",{type:data?.type,details:data?.details,code,failed,data});
       if(data.type===Hls.ErrorTypes.NETWORK_ERROR){
         setStatus(tx("hlsNetworkError")+(code?" "+code:"")+" · "+detail);
         hls.startLoad();
       }else if(data.type===Hls.ErrorTypes.MEDIA_ERROR){
         setStatus(tx("hlsMediaError")+" · "+detail);
         hls.recoverMediaError();
       }else{
         setStatus(tx("hlsError")+" · "+detail);
         try{hls.destroy()}catch(e){}hls=null;
         if(meta.kind==="twitch"&&lastTwitchRaw)setTimeout(()=>resolveTwitchHls(lastTwitchRaw,muted),1200);
       }
     });
   }else{
     video.src=url;
     video.oncanplay=()=>tryDirectPlay();
     video.load();
   }
   layer?.classList.add("has-stream");mountedKey=key;setStatus(tx("loadingDirectVideo"));
   setTimeout(tryDirectPlay,100);
   return true;
 };

 const syncSourceUi=()=>{
   const direct=source?.value==="direct";
   document.querySelector(".source-twitch")?.toggleAttribute("hidden",direct);
   document.querySelector(".source-direct")?.toggleAttribute("hidden",!direct);
 };

 const apply=s=>{
   if(!s)return;
   if(RAW_FEED){
     const direct=s.videoSource==="direct",value=String((direct?s.hlsUrl:s.twitchChannel)||"").trim();
     if(!value){destroy();layer?.classList.add("is-hidden");setStatus(s.rawFeedStatus);return;}
     layer?.classList.remove("is-hidden");
     if(direct)mountDirect(value,true);else mountTwitch(value,true);
     return;
   }
   statusMatchName=String(s.matchName||'').trim().slice(0,120);
   if(lastStatusText)setStatus(lastStatusText,lastStatusOk);
   if(source&&s.videoSource!==undefined)source.value=s.videoSource||"twitch";
   if(hlsInput&&s.hlsUrl!==undefined)hlsInput.value=s.hlsUrl||"";
   syncSourceUi();
   const enabled=s.scene==="live"&&s.twitchShow!==false;
   matchAudioVisible=enabled;syncMatchAudio();
   layer?.classList.toggle("is-hidden",!enabled);
   if(!enabled&&!DIRECTOR_MODE&&!RECORDING_OUTPUT){destroy();if(VIEWER_MODE_LOCAL)setStatus(s.scene==='nextmatch'?'Nästa match · '+(s.publicNextMatch?.date||'')+' kl. '+(s.publicNextMatch?.time||''):s.scene==='idle'?'Ingen match just nu':'Studiosändning · väntar på matchvideo');return}
   if((DIRECTOR_MODE||RECORDING_OUTPUT)&&!String((s.videoSource==='direct'?s.hlsUrl:s.twitchChannel)||'').trim()){destroy();setStatus('Ingen stream laddad');return;}
   if((s.videoSource||"twitch")==="direct")mountDirect(s.hlsUrl,s.twitchMute!==false,{label:tx("directVideo"),kind:"direct"});
   else mountTwitch(s.twitchChannel,s.twitchMute!==false);
 };

 const loadFromControls=()=>{
   const mode=source?.value||"twitch";
   const ok=mode==="direct"?mountDirect(hlsInput?.value,mute?.checked!==false,{label:tx("directVideo"),kind:"direct"}):mountTwitch(twitchInput?.value,mute?.checked!==false);
   if(ok)window.__sehPublishBroadcastState?.();
 };

 btn?.addEventListener("click",e=>{e.preventDefault();loadFromControls()});
 [twitchInput,hlsInput].forEach(el=>el?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();loadFromControls()}}));
 source?.addEventListener("change",()=>{syncSourceUi();window.__sehPublishBroadcastState?.();if(playbackActive())loadFromControls()});
 show?.addEventListener("change",()=>{matchAudioVisible=!!screen?.querySelector(".scene.live.active")&&show.checked;syncMatchAudio();layer?.classList.toggle("is-hidden",!show.checked);window.__sehPublishBroadcastState?.();if(show.checked)loadFromControls()});
 mute?.addEventListener("change",()=>{if(video&&!video.hidden)syncMatchAudio();window.__sehPublishBroadcastState?.()});

 window.addEventListener("seh:twitch-state",e=>apply(e.detail));
 if(VIEWER_MODE_LOCAL&&!RAW_FEED){
   window.addEventListener('message',e=>{
     if(!window.SWNViewerBridge.acceptsAudio(e))return;
     viewerMuted=!!e.data.muted;
     if(video){syncMatchAudio();if(video.currentSrc&&screen?.classList.contains('live-mode'))void video.play().catch(()=>setStatus('Tryck på videon för att starta uppspelningen'));}
   });
   if(video)video.controls=true;
   window.SWNViewerBridge.postStatus({type:'seh-tv-status',text:'Ansluter till studion…'});
 }
 if(window.__sehTwitchState)apply(window.__sehTwitchState);
 syncSourceUi();

 const syncLiveMode=()=>{const live=!!screen?.querySelector(".scene.live.active");screen?.classList.toggle("live-mode",live);if(DIRECTOR_MODE)layer?.classList.toggle('is-hidden',!live||show?.checked===false);};
 screen?.querySelectorAll(".scene").forEach(s=>new MutationObserver(syncLiveMode).observe(s,{attributes:true,attributeFilter:["class"]}));
 syncLiveMode();
})();

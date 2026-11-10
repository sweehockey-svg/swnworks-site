/* Authenticated scene and music controls. No local copy of full broadcast state is written. */
(() => {
"use strict";
const rawLang=(new URLSearchParams(location.search).get("lang")||"sv").toLowerCase();
const LANG=["sv","fi","de","en"].includes(rawLang)?rawLang:"sv";
const CHANNEL=({sv:"sec21-bronze-test",en:"broadcast-en",fi:"broadcast-fi",de:"broadcast-de"})[LANG];
const I18N={
 sv:{
  brand:"SVENSK eHOCKEY",sub:"MOBIL SCENSTYRNING",active:"AKTIV SCEN",connecting:"ANSLUTER",connected:"ANSLUTEN",sending:"BYTER…",sent:"SKICKAT",offline:"OFFLINE",error:"FEL",
  broadcast:"START",lineups:"LAGUPPSTÄLLNINGAR",match:"MATCH & PAUS",stats:"TABELL & TOPPLISTOR",players:"SPELARE & GRAFIK",
  foot:"Hög och Låg gäller den aktiva scenen. Av ligger kvar vid scenbyte. Match Live är alltid utan musik.",
  music:["MUSIK · AKTIV SCEN","Hög","Låg","Av","Musikvalet kunde inte sparas. Kontrollera anslutningen och vilken scen som är aktiv."],
  labels:{opening:"Opening",live:"Match Live",matchup:"Matchup",series:"Serieläge",lineup:"Lineup",stats:"Stats",table:"Tabell",teamcompare:"Lagduell",scorers:"Poängliga",formguide:"Form",offense:"Offensiv",defenseleaders:"Backar",goalieleaders:"Målvaktsliga",road:"Slutspelsvägen",leaders:"Spelare",intermission:"Paus",defense:"Blue Line",forwards:"Forwards",goalies:"Goalies",keymatchup:"Key Matchup",spotlight:"Spotlight"}
 },
 fi:{
  brand:"SPORTSGAMER",sub:"MOBIILIOHJAUS",active:"AKTIIVINEN NÄKYMÄ",connecting:"YHDISTETÄÄN",connected:"YHDISTETTY",sending:"VAIHDETAAN…",sent:"LÄHETETTY",offline:"OFFLINE",error:"VIRHE",
  broadcast:"AVAUS",lineups:"KOKOONPANOT",match:"OTTELU JA TAUKO",stats:"TAULUKKO JA KÄRKI",players:"PELAAJAT JA GRAFIIKAT",
  foot:"Korkea ja matala koskevat aktiivista näkymää. Pois pysyy voimassa näkymän vaihtuessa. Live-ottelussa ei ole musiikkia.",
  music:["MUSIIKKI · AKTIIVINEN NÄKYMÄ","Korkea","Matala","Pois","Musiikkivalintaa ei voitu tallentaa. Tarkista yhteys ja aktiivinen näkymä."],
  labels:{opening:"Avaus",live:"Live-ottelu",matchup:"Vertailu",series:"Sarjatilanne",lineup:"Kokoonpano",stats:"Tilastot",table:"Taulukko",teamcompare:"Joukkuevertailu",scorers:"Pistepörssi",formguide:"Vire",offense:"Hyökkäys",defenseleaders:"Puolustajat",goalieleaders:"Maalivahdit",road:"Pudotuspelitie",leaders:"Pelaajat",intermission:"Tauko",defense:"Puolustajat",forwards:"Hyökkääjät",goalies:"Maalivahdit",keymatchup:"Avainvertailu",spotlight:"Nosto"}
 },
 de:{
  brand:"SPORTSGAMER",sub:"MOBILE REGIE",active:"AKTIVE SZENE",connecting:"VERBINDET",connected:"VERBUNDEN",sending:"WECHSELT…",sent:"GESENDET",offline:"OFFLINE",error:"FEHLER",
  broadcast:"START",lineups:"AUFSTELLUNGEN",match:"SPIEL & PAUSE",stats:"TABELLE & RANGLISTEN",players:"SPIELER & GRAFIKEN",
  foot:"Laut und Leise gelten für die aktive Szene. Aus bleibt beim Szenenwechsel aktiv. Das Live-Spiel bleibt ohne Musik.",
  music:["MUSIK · AKTIVE SZENE","Laut","Leise","Aus","Die Musikeinstellung konnte nicht gespeichert werden. Prüfe Verbindung und aktive Szene."],
  labels:{opening:"Opening",live:"Live-Spiel",matchup:"Vergleich",series:"Serie",lineup:"Aufstellung",stats:"Statistik",table:"Tabelle",teamcompare:"Teamvergleich",scorers:"Punkteliga",formguide:"Form",offense:"Offensive",defenseleaders:"Verteidiger",goalieleaders:"Torhüter",road:"Playoff-Weg",leaders:"Spieler",intermission:"Pause",defense:"Blue Line",forwards:"Stürmer",goalies:"Goalies",keymatchup:"Schlüsselduell",spotlight:"Fokus"}
 },
 en:{
  brand:"SPORTSGAMER",sub:"MOBILE CONTROL",active:"ACTIVE SCENE",connecting:"CONNECTING",connected:"CONNECTED",sending:"SWITCHING…",sent:"SENT",offline:"OFFLINE",error:"ERROR",
  broadcast:"START",lineups:"LINEUPS",match:"MATCH & INTERMISSION",stats:"STANDINGS & LEADERS",players:"PLAYERS & OVERLAYS",
  foot:"High and Low apply to the active scene. Off stays on across scene changes. Match Live is always music-free.",
  music:["MUSIC · ACTIVE SCENE","High","Low","Off","Music could not be saved. Check the connection and active scene."],
  labels:{opening:"Opening",live:"Match Live",matchup:"Matchup",series:"Series",lineup:"Lineup",stats:"Stats",table:"Standings",teamcompare:"Team Compare",scorers:"Scoring",formguide:"Form",offense:"Offense",defenseleaders:"Defense",goalieleaders:"Goalies",road:"Playoff Road",leaders:"Players",intermission:"Intermission",defense:"Blue Line",forwards:"Forwards",goalies:"Goalies",keymatchup:"Key Matchup",spotlight:"Spotlight"}
 }
};
const T=I18N[LANG];
const labels=T.labels;
labels.duallineup=({sv:'Båda lagen',en:'Both lineups',fi:'Molemmat joukkueet',de:'Beide Aufstellungen'})[LANG];
const lineupFallback=side=>labels.lineup+" "+(side==="away"?(LANG==="sv"?"B":"A"):"H");
function teamLabel(state,side){
 if(!state||state.publicNoMatch||!state[side])return "";
 const names=state.lineupTeamNames;
 const id=String(state[side]);
 if(names&&Object.hasOwn(names,id)&&typeof names[id]==="string"&&names[id].trim())return names[id].trim();
 const pair=String(state.subline||"").split(/\s+(?:vs\.?|–|—)\s+/i).map(name=>name.trim());
 return pair.length===2&&pair.every(Boolean)?pair[side==="away"?1:0]:"";
}
const meetings=window.BroadcastGroupMeetings,meetingsLabel=meetings?.label[LANG];
if(meetingsLabel)labels.groupmeetings=meetingsLabel[0];
let pendingMeetings=null;
const groupRows=()=>meetings?.cached(received?.leagueId,received?.home,received?.away);
const buttons=[...document.querySelectorAll("[data-scene]")];
const musicButtons=[...document.querySelectorAll("[data-music]")];
const musicEnabled=scene=>scene!=="live"&&Object.hasOwn(labels,scene);
document.getElementById("musicHeading").textContent=T.music[0];
musicButtons.forEach((button,i)=>{button.textContent=T.music[i+1];});
const current=document.getElementById("currentScene");
const connection=document.getElementById("connection");
document.documentElement.lang=LANG;
document.getElementById("brandName").textContent=T.brand;
document.getElementById("brandSub").textContent=T.sub;
document.getElementById("activeSceneLabel").textContent=T.active;
document.getElementById("groupBroadcast").textContent=T.broadcast;
document.getElementById("groupLineups").textContent=T.lineups;
document.getElementById("groupMatch").textContent=T.match;
document.getElementById("groupStats").textContent=T.stats;
document.getElementById("groupPlayers").textContent=T.players;
document.getElementById("footText").textContent=T.foot;
buttons.forEach(b=>{
 const key=b.dataset.scene;
 const text=labels[key]||b.textContent;
 if(key==="lineup") b.textContent=lineupFallback(b.dataset.lineupSide);
 else b.textContent=text;
});

document.getElementById("brandName").textContent="SWNWORKS";
document.getElementById("studioLink").href=({sv:"SV/",en:"en/",fi:"fi/",de:"de/"})[LANG];
const matchStatus=document.getElementById("broadcastStatus");
const seriesForm=document.getElementById("seriesEditor"),seriesSummary=document.getElementById("seriesSummary");
const seriesHome=document.getElementById("mobileSeriesHome"),seriesAway=document.getElementById("mobileSeriesAway");
const seriesSave=document.getElementById("mobileSeriesSave"),seriesStatus=document.getElementById("mobileSeriesStatus");
const gameForm=document.getElementById("mobileMatchResult"),gameHeading=document.getElementById("mobileMatchNumber");
const homeGoals=document.getElementById("mobileHomeGoals"),awayGoals=document.getElementById("mobileAwayGoals");
const gameProgress=document.getElementById("mobileProgressResult"),gameFinal=document.getElementById("mobileFinalResult"),gameNext=document.getElementById("mobileNextGame");
const gameStatus=document.getElementById("mobileMatchResultStatus");
const gameText=({
 sv:["Match","Hemmamål","Bortamål","Spara pågående resultat","Spara slutresultat","Starta nästa match","SLUT","Spara slutresultatet och räkna in segern i serien?","Resultatet ändrades eller kunde inte sparas. Kontrollera siffrorna och försök igen.","Sparat i sändningen.","Båda lagen kan inte sluta på samma resultat.","Den här matchen har redan ett sparat resultat."],
 en:["Game","Home goals","Away goals","Save current score","Save final score","Start next game","FINAL","Save this final score and count the win in the series?","The score changed or could not be saved. Check the numbers and try again.","Saved on air.","A final score cannot be tied.","This game already has a saved result."],
 fi:["Ottelu","Kotimaalit","Vierasmaalit","Tallenna tilanne","Tallenna lopputulos","Aloita seuraava ottelu","PÄÄTTYNYT","Tallennetaanko lopputulos ja sarjavoitto?","Tulos muuttui tai tallennus epäonnistui. Tarkista luvut.","Tallennettu lähetykseen.","Lopputulos ei voi olla tasan.","Ottelulla on jo tallennettu tulos."],
 de:["Spiel","Heimtore","Auswärtstore","Spielstand speichern","Endstand speichern","Nächstes Spiel starten","ENDE","Endstand speichern und den Sieg zur Serie zählen?","Der Spielstand hat sich geändert oder konnte nicht gespeichert werden. Prüfe die Zahlen.","In der Sendung gespeichert.","Ein Endstand kann nicht unentschieden sein.","Für dieses Spiel ist bereits ein Ergebnis gespeichert."]
})[LANG];
[gameProgress,gameFinal,gameNext].forEach((button,i)=>{button.textContent=gameText[i+3];});
const swapTeams=document.getElementById("mobileSwapTeams"),flipLiveTeams=document.getElementById("mobileFlipLiveTeams");
const streamPanel=document.getElementById("teamStreamSwitch"),streamStatus=document.getElementById("teamStreamStatus");
const streamButtons=[...document.querySelectorAll("[data-team-stream]")];
const streamText=({
 sv:["Byt matchstream","Hemmastream","Bortastream","Kunde inte byta stream. Kontrollera den aktiva matchen och försök igen."],
 en:["Switch match feed","Home stream","Away stream","Could not switch feeds. Check the active match and try again."],
 fi:["Vaihda ottelustriimi","Kotistriimi","Vierasstriimi","Striimin vaihto epäonnistui. Tarkista aktiivinen ottelu."],
 de:["Spielstream wechseln","Heimstream","Gaststream","Streamwechsel fehlgeschlagen. Prüfe das aktive Spiel."]
})[LANG];
if(streamPanel)document.getElementById("teamStreamHeading").textContent=streamText[0];
const teamStream=(state,side)=>{
 const value=state?.videoSource==="twitch"&&state?.twitchTeamChannels?.[state[side]];
 return typeof value==="string"&&/^[a-z0-9_]{1,25}$/.test(value)?value:"";
};
const orderText=({
 sv:["Byt hemma/borta","Vänd lagrutan","Hemma överst","Borta överst","Byta plats på hemma och borta i sändningen? Resultat, serievinst­er och uppställningar följer lagen.","Lagordningen uppdaterades.","Kunde inte ändra lagordningen. Kontrollera vilken match som är aktiv och försök igen."],
 en:["Swap home/away","Flip live teams","Home on top","Away on top","Swap home and away in the broadcast? Scores, series wins and lineups stay with each team.","Team order updated.","Could not change team order. Check the active match and try again."],
 fi:["Vaihda koti/vieras","Käännä livejärjestys","Koti ylimpänä","Vieras ylimpänä","Vaihdetaanko koti- ja vierasjoukkue? Tulokset, sarjavoitot ja kokoonpanot seuraavat joukkueita.","Joukkuejärjestys päivitetty.","Joukkuejärjestystä ei voitu vaihtaa. Tarkista aktiivinen ottelu."],
 de:["Heim/Gast tauschen","Live-Teamfeld umdrehen","Heim oben","Gast oben","Heim und Gast in der Sendung tauschen? Spielstand, Seriensiege und Aufstellungen bleiben bei ihren Teams.","Teamreihenfolge aktualisiert.","Teamreihenfolge konnte nicht geändert werden. Prüfe das aktive Spiel."]
})[LANG];
const onTop=({sv:name=>name+" överst",en:name=>name+" on top",fi:name=>name+" ylimpänä",de:name=>name+" oben"})[LANG];
swapTeams.textContent=orderText[0];
const seriesText=({
 sv:["Serieläge","Bäst av","Hemmavinster","Bortavinster","Spara vinstläge","Sparat i sändningen.","Kunde inte spara. Kontrollera det aktuella vinstläget och försök igen.","Vinstläget eller matchen ändrades. Kontrollera siffrorna igen."],
 en:["Series score","Best of","Home wins","Away wins","Save series score","Saved on air.","Could not save. Check the current series score and try again.","The series score or match changed. Check the numbers again."],
 fi:["Sarjatilanne","Paras","Kotivoitot","Vierasvoitot","Tallenna sarjatilanne","Tallennettu lähetykseen.","Tallennus epäonnistui. Tarkista sarjatilanne ja yritä uudelleen.","Sarjatilanne tai ottelu vaihtui. Tarkista luvut uudelleen."],
 de:["Serienstand","Best of","Heimsiege","Auswärtssiege","Serienstand speichern","In der Sendung gespeichert.","Speichern fehlgeschlagen. Prüfe den aktuellen Serienstand und versuche es erneut.","Der Serienstand oder das Spiel hat sich geändert. Prüfe die Zahlen erneut."]
})[LANG];
const seriesFields=["leagueId","home","away","matchName","seriesFormat","seriesRound","seriesHome","seriesAway"];
const seriesExpected=s=>Object.fromEntries([...seriesFields.map(key=>[key,s?.[key]??null]),["ticket",s?.transientSource?.ticket??null]]);
const seriesBest=s=>Number(s?.seriesFormat??5);
const seriesLimit=s=>Math.ceil(seriesBest(s)/2);
const seriesValid=s=>!!s?.home&&!!s?.away&&!!s?.transientSource?.ticket&&[3,5,7].includes(seriesBest(s));
const orderValid=s=>!!s?.home&&!!s?.away&&String(s.home)!==String(s.away)&&!!s?.transientSource?.ticket;
const orderExpected=s=>({leagueId:s.leagueId??null,home:s.home,away:s.away,matchName:s.matchName??null,ticket:s.transientSource.ticket,
 teamOrderRevision:s.teamOrderRevision??null,liveTeamsReversed:s.liveTeamsReversed===true});
const gameExpected=s=>({...seriesExpected(s),hs:s?.hs??null,as:s?.as??null,seriesResults:s?.seriesResults??null,seriesGameFinal:s?.seriesGameFinal??null});
const finalGame=s=>/^[1-7]$/.test(String(s?.seriesGameFinal??""))?Number(s.seriesGameFinal):0;
const savedSeriesResults=s=>!!finalGame(s)||(Array.isArray(s?.seriesResults)&&s.seriesResults.some(result=>String(result??"").trim()));
const seriesResetText=({
 sv:["Rensa tidigare resultat","Nollställa serien till 0–0 och rensa tidigare matchresultat? Målen i den pågående matchen ändras inte."],
 en:["Clear previous results","Reset the series to 0–0 and clear previous game results? The current game score stays unchanged."],
 fi:["Tyhjennä aiemmat tulokset","Nollataanko sarja ja poistetaanko aiemmat tulokset? Käynnissä olevan ottelun tilanne ei muutu."],
 de:["Frühere Ergebnisse löschen","Serie auf 0–0 setzen und frühere Ergebnisse löschen? Der aktuelle Spielstand bleibt unverändert."]
})[LANG];
const goalValue=input=>/^\d{1,2}$/.test(input.value)?Number(input.value):null;
const teamFields=[
 ["home","mobileHomeGoalsLabel",gameText[1]],["away","mobileAwayGoalsLabel",gameText[2]],
 ["home","seriesHomeLabel",seriesText[2]],["away","seriesAwayLabel",seriesText[3]]
].map(([side,id,label])=>[side,document.getElementById(id),label]);
function renderTeamFields(state){
 for(const [side,element,label] of teamFields){
  const team=teamLabel(state,side);
  const text=team?label+" · "+team:label;
  if(element.textContent!==text)element.textContent=text;
 }
}
renderTeamFields(null);
seriesSave.textContent=seriesText[4];
let seriesKey="",gameKey="";
let busy=false,reading=false,revision=0,ready=false,received=null,lastReceived=0;
function config(){const c=window.EHOCKEY_CONFIG||{};if(!c.supabaseUrl||!c.supabasePublishableKey)throw new Error("Konfiguration saknas");return c;}
function headers(token){const h={apikey:config().supabasePublishableKey,Accept:"application/json","Content-Type":"application/json"};if(token)h.Authorization="Bearer "+token;return h;}
function base(){return config().supabaseUrl.replace(/\/+$/,"");}
function setConnection(text,mode=""){connection.className="connection"+(mode?" "+mode:"");connection.querySelector("span").textContent=text;}
function seriesWins(value,state){
 return Math.min(seriesLimit(state),Math.max(0,Math.trunc(Number(value)||0)));
}
function gameIndex(state){return seriesWins(state?.seriesHome,state)+seriesWins(state?.seriesAway,state);}
function seriesFinished(state){return seriesWins(state?.seriesHome,state)===seriesLimit(state)||seriesWins(state?.seriesAway,state)===seriesLimit(state);}
function gameAlreadyRecorded(state){return Boolean(String(state?.seriesResults?.[gameIndex(state)]??"").trim());}
function renderMatchEditor(state){
 const key=orderValid(state)?JSON.stringify(gameExpected(state)):"";
 const finished=finalGame(state);
 const number=finished||gameIndex(state)+1;
 gameHeading.textContent=key?gameText[0]+" "+number+(finished?" · "+gameText[6]:""):gameText[0];
 if(key===gameKey)return;
 gameKey=key;
 homeGoals.value=key?String(state.hs??0):"";
 awayGoals.value=key?String(state.as??0):"";
}
function renderSeriesEditor(state){
 const valid=seriesValid(state),key=valid?JSON.stringify(seriesExpected(state)):"";
 seriesSummary.textContent=valid?`${seriesText[0]} · ${seriesWins(state.seriesHome,state)}–${seriesWins(state.seriesAway,state)} · ${seriesText[1]} ${seriesBest(state)}`:seriesText[0];
 if(key===seriesKey)return;
 const edited=seriesKey&&seriesForm.dataset.dirty==="true";
 seriesKey=key;
 for(const [select,value] of [[seriesHome,state?.seriesHome],[seriesAway,state?.seriesAway]]){
  select.replaceChildren(...(valid?Array.from({length:seriesLimit(state)+1},(_,n)=>new Option(String(n),String(n))):[]));
  if(valid)select.value=String(seriesWins(value,state));
 }
 seriesForm.dataset.dirty="false";
 seriesStatus.textContent=edited?seriesText[7]:"";
}
function controls(){
 if(document.documentElement.hasAttribute("data-compact-scenes"))document.documentElement.toggleAttribute("data-compact-scene-ready",ready);
 const locked=busy||!ready||Date.now()-lastReceived>10000||document.hidden;
 buttons.forEach(b=>{
  const rows=b.dataset.scene==="groupmeetings"?groupRows():null;
  const unavailable=b.dataset.scene==="groupmeetings"&&!rows?.length;
  b.disabled=locked||unavailable;
  b.title=locked&&!busy?matchStatus.textContent:unavailable?(meetingsLabel?.[rows===null?meetings.status(received?.leagueId):1]||""):(b.dataset.shortcut||"");
 });
 const scene=received?.scene,saved=received?.sceneMusic?.[scene];
 const enabled=musicEnabled(scene);
 const mode=!enabled||received?.sceneMusic?.muted===true?"off":["high","low","off"].includes(saved)?saved:scene==="opening"?"high":"low";
 musicButtons.forEach(b=>{
  b.disabled=locked||!enabled;
  b.classList.toggle("active",b.dataset.music===mode);
  b.setAttribute("aria-pressed",String(b.dataset.music===mode));
 });
 seriesHome.disabled=seriesAway.disabled=locked||!seriesKey;
 const h=Number(seriesHome.value),a=Number(seriesAway.value),limit=seriesLimit(received);
 const reset=h===0&&a===0&&savedSeriesResults(received);
 const unchanged=h===seriesWins(received?.seriesHome,received)&&a===seriesWins(received?.seriesAway,received);
 seriesSave.textContent=reset&&unchanged?seriesResetText[0]:seriesText[4];
 seriesSave.disabled=seriesHome.disabled||(h===limit&&a===limit)||(unchanged&&!reset);
 swapTeams.disabled=locked||!orderValid(received);
 flipLiveTeams.disabled=swapTeams.disabled||scene!=="live";
 const reversed=received?.liveTeamsReversed===true;
 const topTeam=teamLabel(received,reversed?"away":"home");
 flipLiveTeams.textContent=orderText[1]+" · "+(topTeam?onTop(topTeam):orderText[reversed?3:2]);
 if(document.documentElement.getAttribute("data-compact-scenes")==="1")flipLiveTeams.title=flipLiveTeams.textContent;
 flipLiveTeams.setAttribute("aria-pressed",String(reversed));
 if(streamPanel){
  streamPanel.hidden=!ready||!streamButtons.some(b=>teamStream(received,b.dataset.teamStream));
  streamButtons.forEach((button,i)=>{
   const side=button.dataset.teamStream,channel=teamStream(received,side),selected=!!channel&&received.twitchChannel===channel;
   button.hidden=!channel;button.disabled=locked||!orderValid(received)||!channel||selected;
   button.classList.toggle("active",selected);button.setAttribute("aria-pressed",String(selected));
   button.textContent=teamLabel(received,side)||streamText[i+1];button.title=channel?streamText[i+1]+" · "+channel:"";
  });
 }
 const finished=finalGame(received);
 const scoreLocked=locked||!gameKey||!!finished;
 homeGoals.disabled=awayGoals.disabled=scoreLocked;
 const hg=goalValue(homeGoals),ag=goalValue(awayGoals);
 gameProgress.hidden=gameFinal.hidden=!!finished;
 gameNext.hidden=!finished||seriesFinished(received);
 gameProgress.disabled=scoreLocked||hg===null||ag===null;
 gameFinal.disabled=gameProgress.disabled||hg===ag||!seriesValid(received)||seriesFinished(received)||gameAlreadyRecorded(received);
 gameNext.disabled=locked||!gameKey||gameNext.hidden;
}
function render(state){
 received=state;lastReceived=Date.now();
 const expires=Date.parse(state?.transientSource?.expires_at||"");
 ready=Boolean(state&&!state.publicNoMatch&&Number.isFinite(expires)&&expires>Date.now());
 if(ready&&meetings&&!["series","stream"].includes(document.documentElement.getAttribute("data-compact-scenes"))&&Number(state.home)>0&&Number(state.away)>0&&!pendingMeetings){
  pendingMeetings=meetings.load(state.leagueId).finally(()=>{pendingMeetings=null;controls();});
 }
 const scene=state?.scene==="stats"?"teamcompare":state?.scene==="lowerthird"?"matchup":state?.scene||"",side=state?.lineupSide||"home";
 buttons.forEach(b=>{
  b.classList.toggle("active",b.dataset.scene===scene&&(scene!=="lineup"||(b.dataset.lineupSide||"home")===side));
  b.classList.remove("pending");
  if(b.dataset.scene==="lineup"){
   const team=teamLabel(state,b.dataset.lineupSide),fallback=lineupFallback(b.dataset.lineupSide);
   b.textContent=team||fallback;
   b.setAttribute("aria-label",team?fallback+" · "+team:fallback);
  }
 });
 const lineupName=scene==="lineup"?teamLabel(state,side):"";
 current.textContent=scene==="lineup"?(lineupName?labels.lineup+" · "+lineupName:lineupFallback(side)):(labels[scene]||scene||"Ingen scen");
 const reason=!state||!Object.keys(state).length?"missing":state.publicNoMatch?"idle":Number.isFinite(expires)?"expired":"missing";
 const messages={
  sv:{missing:"Ingen aktiv match med matchdata. Hämta data och välj ”Visa förberedd match i sändning” i huvudstudion.",idle:"Vänteskärmen är på. Återgå till sändningen i huvudstudion för att välja scen.",expired:"Matchdatan har gått ut. Uppdatera och godkänn statistiken i huvudstudion. Scenknapparna låses upp automatiskt."},
  en:{missing:"No match data on air. Fetch data and take the prepared match live in the main studio.",idle:"The waiting screen is on. Resume the broadcast in the main studio to select a scene.",expired:"Match data has expired. Refresh and approve the statistics in the main studio. Scene controls unlock automatically."},
  fi:{missing:"Lähetyksessä ei ole otteludataa. Hae tiedot ja siirrä valmisteltu ottelu lähetykseen.",idle:"Odotusruutu on käytössä. Jatka lähetystä päästudiossa.",expired:"Otteludata on vanhentunut. Päivitä ja hyväksy tilastot päästudiossa."},
  de:{missing:"Keine Spieldaten auf Sendung. Daten abrufen und das vorbereitete Spiel im Hauptstudio live schalten.",idle:"Der Wartebildschirm ist aktiv. Setze die Sendung im Hauptstudio fort.",expired:"Die Spieldaten sind abgelaufen. Aktualisiere und bestätige die Statistik im Hauptstudio."}
 };
 matchStatus.textContent=ready?(state.subline||state.headline||"Aktiv sändning"):messages[LANG][reason];
 renderTeamFields(state);
 renderSeriesEditor(state);
 renderMatchEditor(state);
 controls();
}
async function request(url,options={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{return await fetch(url,{...options,cache:"no-store",signal:controller.signal});}finally{clearTimeout(timer);}
}
async function pull(){
 if(reading)return;reading=true;const started=revision;
 try{
  const res=await request(base()+"/rest/v1/broadcast_studio_state?channel=eq."+encodeURIComponent(CHANNEL)+"&select=state,updated_at",{headers:headers()});
  if(!res.ok)throw new Error("HTTP "+res.status);
  const rows=await res.json();if(started!==revision)return;
  render(rows?.[0]?.state||null);setConnection(ready?T.connected:"VÄNTAR",ready?"ok":"");
 }catch{if(started===revision){ready=false;controls();setConnection(T.offline);matchStatus.textContent="Ingen kontakt med sändningen. Scenknapparna är låsta tills kontakten är tillbaka.";}}
 finally{reading=false;}
}
async function changeProgram(button,music=false){
 if(button.disabled||busy||!ready||document.hidden||Date.now()-lastReceived>10000)return;
 const scene=received?.scene;
 if(music&&!musicEnabled(scene))return;
 busy=true;revision++;controls();button.classList.add("pending");setConnection(T.sending,"busy");
 try{
  const session=await window.SWNStudioAccess.session();
  const args=music?{p_channel:CHANNEL,p_scene:scene,p_mode:button.dataset.music}:{p_channel:CHANNEL,p_scene:button.dataset.scene,p_lineup_side:button.dataset.scene==="lineup"?(button.dataset.lineupSide||"home"):null};
  const rpc=music?"broadcast_studio_set_music":"broadcast_studio_set_scene";
  const res=await request(base()+"/rest/v1/rpc/"+rpc,{method:"POST",headers:headers(session.access_token),body:JSON.stringify(args)});
  if(!res.ok)throw new Error("HTTP "+res.status);
  const state=await res.json();if(!state||typeof state!=="object"||Array.isArray(state))throw new Error("Saknar sändning eller behörighet");
  render(state);navigator.vibrate?.(18);setConnection(T.sent,"ok");
 }catch{ready=false;setConnection(T.error);matchStatus.textContent=music?T.music[4]:"Scenbytet kunde inte bekräftas. Kontrollera anslutning och inloggning. Nästa hämtning visar vad som faktiskt sänds.";}
 finally{busy=false;button.classList.remove("pending");controls();}
}
const setScene=button=>changeProgram(button);
buttons.forEach(b=>{b.disabled=true;b.addEventListener("click",()=>void setScene(b));});
musicButtons.forEach(b=>b.addEventListener("click",()=>void changeProgram(b,true)));
async function changeTeamOrder(action){
 controls();
 const switching=action.startsWith("stream-");
 const button=switching?streamButtons.find(b=>b.dataset.teamStream===action.slice(7)):action==="swap"?swapTeams:flipLiveTeams;
 if(button.disabled)return;
 const expected=orderExpected(received);
 if(switching){
  expected.twitchChannel=received.twitchChannel??null;expected.twitchTeamChannels=received.twitchTeamChannels;
  streamStatus.textContent="";
 }
 const args={p_channel:CHANNEL,p_expected:expected,p_action:action};
 if(action==="swap"&&!window.confirm(orderText[4]))return;
 busy=true;revision++;controls();setConnection(T.sending,"busy");
 try{
  const session=await window.SWNStudioAccess.session();
  const res=await request(base()+"/rest/v1/rpc/broadcast_studio_set_team_order",{method:"POST",headers:headers(session.access_token),body:JSON.stringify(args)});
  if(!res.ok)throw new Error("HTTP "+res.status);
  const state=await res.json();
  if(!state||typeof state!=="object"||Array.isArray(state))throw new Error("No program state");
  render(state);
  if(action==="swap")seriesStatus.textContent=orderText[5];
  setConnection(T.sent,"ok");
 }catch{
  if(switching)streamStatus.textContent=streamText[3];
  else{ready=false;(action==="swap"?seriesStatus:matchStatus).textContent=orderText[6];}
  setConnection(T.error);
 }finally{busy=false;controls();}
}
swapTeams.addEventListener("click",()=>void changeTeamOrder("swap"));
flipLiveTeams.addEventListener("click",()=>void changeTeamOrder("live"));
streamButtons.forEach(button=>button.addEventListener("click",()=>void changeTeamOrder("stream-"+button.dataset.teamStream)));
gameForm.addEventListener("submit",event=>event.preventDefault());
gameForm.addEventListener("input",()=>{
 const h=goalValue(homeGoals),a=goalValue(awayGoals);
 gameStatus.textContent=gameAlreadyRecorded(received)?gameText[11]:h!==null&&h===a?gameText[10]:"";
 controls();
});
async function saveMatchResult(action,button){
 controls();
 if(button.disabled)return;
 const reset=action==="reset",zero=reset||action==="next";
 const args={p_channel:CHANNEL,p_expected:gameExpected(received),p_action:action,
  p_home:zero?0:goalValue(homeGoals),p_away:zero?0:goalValue(awayGoals)};
 if(action==="final"&&!window.confirm(gameText[7]))return;
 if(reset&&!window.confirm(seriesResetText[1]))return;
 busy=true;revision++;controls();setConnection(T.sending,"busy");
 try{
  const session=await window.SWNStudioAccess.session();
  const res=await request(base()+"/rest/v1/rpc/broadcast_studio_set_match_result",{method:"POST",headers:headers(session.access_token),body:JSON.stringify(args)});
  if(!res.ok)throw new Error("HTTP "+res.status);
  const state=await res.json();
  if(!state||typeof state!=="object"||Array.isArray(state))throw new Error("No program state");
  if(reset)seriesForm.dataset.dirty="false";
  render(state);(reset?seriesStatus:gameStatus).textContent=gameText[9];setConnection(T.sent,"ok");
 }catch{
  ready=false;gameKey="";(reset?seriesStatus:gameStatus).textContent=gameText[8];setConnection(T.error);
 }finally{busy=false;controls();}
}
[[gameProgress,"progress"],[gameFinal,"final"],[gameNext,"next"]].forEach(([button,action])=>{
 button.addEventListener("click",()=>void saveMatchResult(action,button));
});
seriesForm.addEventListener("change",()=>{seriesForm.dataset.dirty="true";seriesStatus.textContent="";controls();});
seriesForm.addEventListener("submit",async event=>{
 event.preventDefault();
 controls();
 if(seriesSave.disabled)return;
 if(Number(seriesHome.value)===0&&Number(seriesAway.value)===0&&savedSeriesResults(received)){
  await saveMatchResult("reset",seriesSave);
  return;
 }
 const args={p_channel:CHANNEL,p_expected:seriesExpected(received),p_home:Number(seriesHome.value),p_away:Number(seriesAway.value)};
 busy=true;revision++;controls();setConnection(T.sending,"busy");
 try{
  const session=await window.SWNStudioAccess.session();
  const res=await request(base()+"/rest/v1/rpc/broadcast_studio_set_series_wins",{method:"POST",headers:headers(session.access_token),body:JSON.stringify(args)});
  if(!res.ok)throw new Error("HTTP "+res.status);
  const state=await res.json();
  if(!state||typeof state!=="object"||Array.isArray(state))throw new Error("No program state");
  seriesForm.dataset.dirty="false";render(state);seriesStatus.textContent=seriesText[5];
  setConnection(T.sent,"ok");
 }catch{
  ready=false;seriesForm.dataset.dirty="false";seriesKey="";seriesStatus.textContent=seriesText[6];setConnection(T.error);
 }finally{busy=false;controls();}
});
// Stream Deck System > Hotkey sends these to the focused controller page.
// No URL-triggered commands or credentials in Stream Deck are needed.
const deckShortcuts=[
 ["Digit1","opening"],["Digit2","live"],["Digit3","lineup","home"],
 ["Digit4","lineup","away"],["Digit5","table"],["Digit6","teamcompare"],
 ["Digit7","teamcompare"],["Digit8","intermission"],["Digit9","matchup"]
];
deckShortcuts.forEach(([code,scene,side],index)=>{
 const button=buttons.find(b=>b.dataset.scene===scene&&(!side||b.dataset.lineupSide===side));
 if(button&&code!=="Digit6")button.dataset.shortcut="Stream Deck: Ctrl + Alt + Shift + "+(index+1);
});
if(LANG==="sv"){
 const guide=document.createElement("details");guide.className="foot";
 const summary=document.createElement("summary");summary.textContent="Stream Deck · snabbknappar och guide";
 const text=document.createElement("p");text.textContent="Använd System → Hotkey i Stream Deck: Ctrl + Alt + Shift + 1–9. Scenväljaren måste vara aktiv flik och ha fokus (klicka i sidan, inte adressfältet). Ingen bakgrundsstyrning eller automatisk scenmarkering på Stream Deck-knapparna.";
 const list=document.createElement("ol");
 deckShortcuts.forEach(([,scene,side])=>{const li=document.createElement("li");li.textContent=(labels[scene]||scene)+(side?(side==="home"?" hemma":" borta"):"");list.appendChild(li);});
 const link=document.createElement("a");link.href="STREAM-DECK-FLACKEN.md";link.textContent="Öppna hela guiden till Flacken";
 guide.append(summary,text,list,link);document.getElementById("footText").after(guide);
}
document.addEventListener("keydown",event=>{
 if(!event.ctrlKey||!event.altKey||!event.shiftKey||event.metaKey||event.repeat||event.isComposing)return;
 const target=event.target;
 if(target?.closest?.("input,textarea,select,[contenteditable]:not([contenteditable='false'])"))return;
 const shortcut=deckShortcuts.find(([code])=>code===event.code);if(!shortcut)return;
 event.preventDefault();
 const [,scene,side]=shortcut;
 const button=buttons.find(b=>b.dataset.scene===scene&&(!side||b.dataset.lineupSide===side));
 if(button&&!button.disabled)void setScene(button);
});
void pull();
setInterval(()=>{if(!busy&&!document.hidden)void pull();controls();},1000);
document.addEventListener("visibilitychange",()=>{controls();if(!document.hidden)void pull();});
window.addEventListener("focus",()=>void pull());
window.addEventListener("pageshow",()=>void pull());
})();


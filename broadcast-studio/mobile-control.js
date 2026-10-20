/* Authenticated scene-only controller. No local copy of full broadcast state is written. */
(() => {
"use strict";
const rawLang=(new URLSearchParams(location.search).get("lang")||"sv").toLowerCase();
const LANG=["sv","fi","de","en"].includes(rawLang)?rawLang:"sv";
const CHANNEL=({sv:"sec21-bronze-test",en:"broadcast-en",fi:"broadcast-fi",de:"broadcast-de"})[LANG];
const I18N={
 sv:{
  brand:"SVENSK eHOCKEY",sub:"MOBIL SCENSTYRNING",active:"AKTIV SCEN",connecting:"ANSLUTER",connected:"ANSLUTEN",sending:"BYTER…",sent:"SKICKAT",offline:"OFFLINE",error:"FEL",
  broadcast:"SÄNDNING",match:"MATCH",players:"SPELARE / OVERLAYS",
  foot:"Den här sidan ändrar bara aktiv scen. Lag, score, Twitch, lineups och övriga sändningsinställningar lämnas orörda.",
  labels:{opening:"Opening",live:"Match Live",matchup:"Matchup",series:"Serieläge",lineup:"Lineup",stats:"Stats",table:"Tabell",teamcompare:"Lagduell",scorers:"Poängliga",formguide:"Form",offense:"Offensiv",defenseleaders:"Backar",goalieleaders:"Målvaktsliga",road:"Slutspelsvägen",leaders:"Spelare",intermission:"Paus",lowerthird:"Lower third",forwards:"Forwards",defense:"Blue Line",goalies:"Goalies",keymatchup:"Key Matchup",spotlight:"Spotlight"}
 },
 fi:{
  brand:"SPORTSGAMER",sub:"MOBIILIOHJAUS",active:"AKTIIVINEN NÄKYMÄ",connecting:"YHDISTETÄÄN",connected:"YHDISTETTY",sending:"VAIHDETAAN…",sent:"LÄHETETTY",offline:"OFFLINE",error:"VIRHE",
  broadcast:"LÄHETYS",match:"OTTELU",players:"PELAAJAT / GRAFIIKAT",
  foot:"Tämä sivu vaihtaa vain aktiivista näkymää. Joukkueet, tulos, Twitch, kokoonpanot ja muut lähetysasetukset säilyvät ennallaan.",
  labels:{opening:"Avaus",live:"Live-ottelu",matchup:"Vertailu",series:"Sarjatilanne",lineup:"Kokoonpano",stats:"Tilastot",table:"Taulukko",teamcompare:"Joukkuevertailu",scorers:"Pistepörssi",formguide:"Vire",offense:"Hyökkäys",defenseleaders:"Puolustajat",goalieleaders:"Maalivahdit",road:"Pudotuspelitie",leaders:"Pelaajat",intermission:"Tauko",lowerthird:"Nimigrafiikka",forwards:"Hyökkääjät",defense:"Puolustajat",goalies:"Maalivahdit",keymatchup:"Avainvertailu",spotlight:"Nosto"}
 },
 de:{
  brand:"SPORTSGAMER",sub:"MOBILE REGIE",active:"AKTIVE SZENE",connecting:"VERBINDET",connected:"VERBUNDEN",sending:"WECHSELT…",sent:"GESENDET",offline:"OFFLINE",error:"FEHLER",
  broadcast:"SENDUNG",match:"SPIEL",players:"SPIELER / OVERLAYS",
  foot:"Diese Seite ändert nur die aktive Szene. Teams, Spielstand, Twitch, Aufstellungen und weitere Sendeeinstellungen bleiben unverändert.",
  labels:{opening:"Opening",live:"Live-Spiel",matchup:"Vergleich",series:"Serie",lineup:"Aufstellung",stats:"Statistik",table:"Tabelle",teamcompare:"Teamvergleich",scorers:"Punkteliga",formguide:"Form",offense:"Offensive",defenseleaders:"Verteidiger",goalieleaders:"Torhüter",road:"Playoff-Weg",leaders:"Spieler",intermission:"Pause",lowerthird:"Bauchbinde",forwards:"Stürmer",defense:"Blue Line",goalies:"Goalies",keymatchup:"Schlüsselduell",spotlight:"Fokus"}
 },
 en:{
  brand:"SPORTSGAMER",sub:"MOBILE CONTROL",active:"ACTIVE SCENE",connecting:"CONNECTING",connected:"CONNECTED",sending:"SWITCHING…",sent:"SENT",offline:"OFFLINE",error:"ERROR",
  broadcast:"BROADCAST",match:"MATCH",players:"PLAYERS / OVERLAYS",
  foot:"This page only changes the active scene. Teams, score, Twitch, lineups and other broadcast settings remain untouched.",
  labels:{opening:"Opening",live:"Match Live",matchup:"Matchup",series:"Series",lineup:"Lineup",stats:"Stats",table:"Standings",teamcompare:"Team Compare",scorers:"Scoring",formguide:"Form",offense:"Offense",defenseleaders:"Defense",goalieleaders:"Goalies",road:"Playoff Road",leaders:"Players",intermission:"Intermission",lowerthird:"Lower third",forwards:"Forwards",defense:"Blue Line",goalies:"Goalies",keymatchup:"Key Matchup",spotlight:"Spotlight"}
 }
};
const T=I18N[LANG];
const labels=T.labels;
const buttons=[...document.querySelectorAll("[data-scene]")];
const current=document.getElementById("currentScene");
const connection=document.getElementById("connection");
document.documentElement.lang=LANG;
document.getElementById("brandName").textContent=T.brand;
document.getElementById("brandSub").textContent=T.sub;
document.getElementById("activeSceneLabel").textContent=T.active;
document.getElementById("groupBroadcast").textContent=T.broadcast;
document.getElementById("groupMatch").textContent=T.match;
document.getElementById("groupPlayers").textContent=T.players;
document.getElementById("footText").textContent=T.foot;
buttons.forEach(b=>{
 const key=b.dataset.scene;
 const text=labels[key]||b.textContent;
 if(key==="lineup") b.textContent=text+" "+(b.dataset.lineupSide==="away"?(LANG==="sv"?"B":"A"):(LANG==="sv"?"H":"H"));
 else b.textContent=text;
});

document.getElementById("brandName").textContent="SWNWORKS";
document.getElementById("studioLink").href=({sv:"SV/",en:"en/",fi:"fi/",de:"de/"})[LANG];
const matchStatus=document.getElementById("broadcastStatus");
let busy=false,reading=false,revision=0,ready=false,received=null,lastReceived=0;
function config(){const c=window.EHOCKEY_CONFIG||{};if(!c.supabaseUrl||!c.supabasePublishableKey)throw new Error("Konfiguration saknas");return c;}
function headers(token){const h={apikey:config().supabasePublishableKey,Accept:"application/json","Content-Type":"application/json"};if(token)h.Authorization="Bearer "+token;return h;}
function base(){return config().supabaseUrl.replace(/\/+$/,"");}
function setConnection(text,mode=""){connection.className="connection"+(mode?" "+mode:"");connection.querySelector("span").textContent=text;}
function controls(){buttons.forEach(b=>b.disabled=busy||!ready||Date.now()-lastReceived>10000||document.hidden);}
function render(state){
 received=state;lastReceived=Date.now();
 const expires=Date.parse(state?.transientSource?.expires_at||"");
 ready=Boolean(state&&!state.publicNoMatch&&Number.isFinite(expires)&&expires>Date.now());
 const scene=state?.scene||"",side=state?.lineupSide||"home";
 buttons.forEach(b=>{b.classList.toggle("active",b.dataset.scene===scene&&(scene!=="lineup"||(b.dataset.lineupSide||"home")===side));b.classList.remove("pending");});
 current.textContent=scene?((labels[scene]||scene)+(scene==="lineup"?" "+(side==="away"?(LANG==="sv"?"B":"A"):"H"):"")):"Ingen scen";
 matchStatus.textContent=ready?(state.subline||state.headline||"Aktiv sändning"):"Ingen aktiv match med giltiga data. Förbered och skicka matchen till sändning i huvudstudion först.";
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
async function setScene(button){
 if(busy||!ready||document.hidden||Date.now()-lastReceived>10000)return;
 busy=true;revision++;controls();button.classList.add("pending");setConnection(T.sending,"busy");
 try{
  const session=await window.SWNStudioAccess.session();
  const res=await request(base()+"/rest/v1/rpc/broadcast_studio_set_scene",{method:"POST",headers:headers(session.access_token),body:JSON.stringify({p_channel:CHANNEL,p_scene:button.dataset.scene,p_lineup_side:button.dataset.scene==="lineup"?(button.dataset.lineupSide||"home"):null})});
  if(!res.ok)throw new Error("HTTP "+res.status);
  const state=await res.json();if(!state||typeof state!=="object"||Array.isArray(state))throw new Error("Saknar sändning eller behörighet");
  render(state);navigator.vibrate?.(18);setConnection(T.sent,"ok");
 }catch{ready=false;setConnection(T.error);matchStatus.textContent="Scenbytet kunde inte bekräftas. Kontrollera anslutning och inloggning. Nästa hämtning visar vad som faktiskt sänds.";}
 finally{busy=false;buttons.forEach(b=>b.classList.remove("pending"));controls();}
}
buttons.forEach(b=>{b.disabled=true;b.addEventListener("click",()=>void setScene(b));});
// Stream Deck System > Hotkey sends these to the focused controller page.
// No URL-triggered commands or credentials in Stream Deck are needed.
const deckShortcuts=[
 ["Digit1","opening"],["Digit2","live"],["Digit3","lineup","home"],
 ["Digit4","lineup","away"],["Digit5","table"],["Digit6","stats"],
 ["Digit7","teamcompare"],["Digit8","intermission"],["Digit9","matchup"]
];
deckShortcuts.forEach(([code,scene,side],index)=>{
 const button=buttons.find(b=>b.dataset.scene===scene&&(!side||b.dataset.lineupSide===side));
 if(button)button.title="Stream Deck: Ctrl + Alt + Shift + "+(index+1);
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


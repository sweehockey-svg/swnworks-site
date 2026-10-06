(() => {
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const cfg=window.EHOCKEY_CONFIG||{}, SUPA=String(cfg.supabaseUrl||"").replace(/\/+$/,""), KEY=String(cfg.supabasePublishableKey||cfg.supabaseAnonKey||"");
const C={
  520:{label:"SEC 21",code:"SEC",logo:"https://www.svenskehockey.se/assets/SECLOGGA.png"},
  523:{label:"WECL",code:"WECL",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/NHLGamer/WECL/WECL_logo.png"},
  524:{label:"GCL 13 · DIV I",code:"GCL",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/SportsGamer/leagues/GCL/Season_12/GCL_logo_new_350x350.png"},
  525:{label:"GCL 13 · DIV II",code:"GCL",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/SportsGamer/leagues/GCL/Season_12/GCL_logo_new_350x350.png"},
  526:{label:"GCL 13 · POKAL",code:"GCL",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/SportsGamer/leagues/GCL/Season_12/GCL_logo_new_350x350.png"},
  527:{label:"SCL 27",code:"SCL",logo:"https://fhr.fra1.cdn.digitaloceanspaces.com/NHLGamer/Community/uploads/monthly_2021_08/small.SCL_logo_shading.png.f99772ef717dcd328c35b5469ac1cbc2.png"},
  529:{label:"FCL 27",code:"FCL",logo:"https://sportsgamer.gg/community/gallery/image/374-fcl_logopng/?do=download"}
};
const F={portrait:{w:1080,h:1350,label:"1080 × 1350"},square:{w:1080,h:1080,label:"1080 × 1080"},story:{w:1080,h:1920,label:"1080 × 1920"},wide:{w:1920,h:1080,label:"1920 × 1080"}};
const TIT={table:"TABELLEN",groups:"GRUPPTABELLER",goals:"SKYTTELIGAN",points:"POÄNGLIGAN",assists:"ASSISTLIGAN",goalies:"MÅLVAKTSLIGAN",leaders:"LIGATOPPAR"};
const S={kind:"table",league:527,stage:"regular",group:null,count:8,format:"portrait",bg:"gamenight",logos:true,teams:[],players:[]};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const n=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v))?Number(v):0;
const clip=(v,l)=>{v=String(v||"");return v.length>l?v.slice(0,l-1)+"…":v};
const comp=()=>C[S.league]||{label:"TURNERING",code:"",logo:""}, format=()=>F[S.format]||F.portrait;
const headers=()=>{const h={apikey:KEY,Accept:"application/json"};if(/^eyJ[^.]+\.[^.]+\.[^.]+$/.test(KEY))h.Authorization="Bearer "+KEY;return h};
async function rows(view){
  if(!SUPA||!KEY)throw new Error("Supabase-konfiguration saknas");
  const u=SUPA+"/rest/v1/"+view+"?sports_gamer_league_id=eq."+S.league+"&select=*";
  const r=await fetch(u,{headers:headers(),cache:"no-store"});if(!r.ok)throw new Error(view+" HTTP "+r.status);return r.json();
}
async function load(){
  setStatus("HÄMTAR…","load");
  try{
    [S.teams,S.players]=await Promise.all([rows("v_broadcast_teams_public"),rows("v_broadcast_players_public")]);
    groups(); setStatus(S.teams.length+" LAG · "+S.players.length+" SPELARE","ok"); render();
  }catch(e){console.error(e);setStatus("DATAFEL","error");$("#preview").innerHTML='<div style="color:white;padding:30px">Datafel: '+esc(e.message)+'</div>'}
}
function setStatus(t,m){$("#dataStatus").textContent=t;$("#topStatus").textContent=m==="error"?"DATAFEL":m==="load"?"UPPDATERAR":"LIVE DATA"}
function groupIds(){return [...new Set(S.teams.filter(x=>x.statistics_stage==="regular").map(x=>Number(x.effective_group_id)).filter(Number.isFinite))].sort((a,b)=>a-b)}
function groupName(id){const ids=groupIds(),i=ids.indexOf(Number(id));return "GRUPP "+(i<0?Number(id):i+1)}
function groups(){
  const ids=groupIds();if(!ids.length){S.group=null;$("#group").innerHTML='<option>Ingen gruppdata</option>';return}
  if(!ids.includes(Number(S.group)))S.group=ids[0];
  $("#group").innerHTML=ids.map(id=>'<option value="'+id+'"'+(id===S.group?' selected':'')+'>'+groupName(id)+'</option>').join("");
}
function logos(){const m=new Map();S.teams.forEach(t=>{const k=String(t.sports_gamer_team_id);if(t.team_logo_in_league&&!m.has(k))m.set(k,t.team_logo_in_league)});return m}
function standingsForGroup(groupId){return S.teams.filter(x=>x.statistics_stage==="regular"&&Number(x.effective_group_id)===Number(groupId)).sort((a,b)=>n(b.table_points)-n(a.table_points)||n(b.goal_difference)-n(a.goal_difference)||n(b.goals_for)-n(a.goals_for)||String(a.team_name_in_league||"").localeCompare(String(b.team_name_in_league||""),"sv"))}
function standings(){return standingsForGroup(S.group)}
function ps(p,key){if(S.stage==="regular")return n(p["regular_"+key]);if(S.stage==="playoffs")return n(p["playoff_"+key]);return n(p["regular_"+key])+n(p["playoff_"+key])}
function skaters(metric){
  return S.players.map(p=>({...p,gp:ps(p,"skater_games"),g:ps(p,"goals"),a:ps(p,"assists"),p:ps(p,"points")})).filter(p=>p.gp>0).sort((a,b)=>b[metric]-a[metric]||b.p-a.p||b.g-a.g||String(a.display_gamertag||"").localeCompare(String(b.display_gamertag||""),"sv")).slice(0,S.count);
}
function gv(p,key){
  const rg=n(p.regular_goalie_games),pg=n(p.playoff_goalie_games);
  if(S.stage==="regular")return key==="gp"?rg:(p["regular_goalie_"+key]==null?null:Number(p["regular_goalie_"+key]));
  if(S.stage==="playoffs")return key==="gp"?pg:(p["playoff_goalie_"+key]==null?null:Number(p["playoff_goalie_"+key]));
  if(key==="gp")return rg+pg;if(key==="shutouts")return n(p.regular_goalie_shutouts)+n(p.playoff_goalie_shutouts);
  const a=p["regular_goalie_"+key],b=p["playoff_goalie_"+key],d=rg+pg;return d?((a==null?0:Number(a))*rg+(b==null?0:Number(b))*pg)/d:null;
}
function goalies(){
  return S.players.map(p=>({...p,gp:gv(p,"gp"),sv:gv(p,"save_percentage"),gaa:gv(p,"goals_against_average"),so:gv(p,"shutouts")})).filter(p=>p.gp>0&&p.sv!=null&&Number.isFinite(p.sv)).sort((a,b)=>b.sv-a.sv||(a.gaa??99)-(b.gaa??99)||b.gp-a.gp).slice(0,S.count);
}
function stageName(){return S.stage==="regular"?"GRUPPSPEL":S.stage==="playoffs"?"SLUTSPEL":"TOTALT"}
function sync(){S.league=Number($("#league").value||527);S.stage=$("#stage").value;S.group=$("#group").value?Number($("#group").value):S.group;S.count=Number($("#count").value||8);S.format=$("#format").value;S.bg=$("#bg").value;S.logos=$("#logos").checked}
function title(){return ($("#title").value||TIT[S.kind]).trim().toUpperCase()}
function subtitle(){return ($("#subtitle").value||(S.kind==="table"?stageName()+" · "+groupName(S.group):S.kind==="groups"?"GRUPPSPEL · GRUPPSTABELLER":stageName()+" · LIVE DATA")).trim().toUpperCase()}
function defs(){return '<defs><linearGradient id="silver" x2="0" y2="1"><stop stop-color="#fff"/><stop offset=".48" stop-color="#edf1f4"/><stop offset=".8" stop-color="#a2adb6"/><stop offset="1" stop-color="#fff"/></linearGradient><linearGradient id="gold"><stop stop-color="#ffd95f"/><stop offset=".5" stop-color="#ffbd00"/><stop offset="1" stop-color="#d88700"/></linearGradient><linearGradient id="panel" x2="1" y2="1"><stop stop-color="#071d2c" stop-opacity=".97"/><stop offset="1" stop-color="#020b12" stop-opacity=".98"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#000" flood-opacity=".58"/></filter></defs>'}
function background(W,H){
  if(S.bg==="gamenight"){
    const u=new URL("../broadcast-studio/assets/game-night-background-photo.webp",location.href).href;
    return '<image href="'+esc(u)+'" width="'+W+'" height="'+H+'" preserveAspectRatio="xMidYMid slice"/><rect width="'+W+'" height="'+H+'" fill="#020b12" fill-opacity=".50"/>';
  }
  if(S.bg==="ice")return '<rect width="'+W+'" height="'+H+'" fill="#0a2a3d"/><circle cx="'+W*.5+'" cy="'+H*.56+'" r="'+Math.min(W,H)*.34+'" fill="none" stroke="#a8e6ff" stroke-opacity=".09" stroke-width="8"/><path d="M0 '+H*.56+' H'+W+'" stroke="#d7f4ff" stroke-opacity=".09" stroke-width="5"/>';
  if(S.bg==="smoke")return '<rect width="'+W+'" height="'+H+'" fill="#06111a"/><ellipse cx="'+W*.25+'" cy="'+H*.68+'" rx="'+W*.38+'" ry="'+H*.24+'" fill="#a8b5bf" fill-opacity=".09"/><ellipse cx="'+W*.8+'" cy="'+H*.35+'" rx="'+W*.3+'" ry="'+H*.2+'" fill="#ffbd00" fill-opacity=".06"/>';
  return '<rect width="'+W+'" height="'+H+'" fill="#06283d"/><path d="M0 '+H*.82+' L'+W*.48+' 0 H'+W*.62+' L'+W*.16+' '+H+'" Z" fill="#0d4a70" fill-opacity=".32"/><path d="M'+W*.6+' 0 L'+W+' '+H*.42+' V'+H*.63+' L'+W*.48+' 0 Z" fill="#ffbd00" fill-opacity=".05"/>';
}
function base(content){
  const {w:W,h:H}=format(),m=Math.round(W*.052),hy=Math.round(H*.052),ty=Math.round(H*.19),wide=S.format==="wide";
  const c=comp(),ts=wide?78:S.format==="story"?74:68;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+defs()+background(W,H)+
  '<rect width="'+W+'" height="'+H*.3+'" fill="#03101a" fill-opacity=".38"/><line x1="'+m+'" y1="'+(hy+70)+'" x2="'+(W-m)+'" y2="'+(hy+70)+'" stroke="#ffbd00" stroke-opacity=".38" stroke-width="2"/><line x1="'+m+'" y1="'+hy+'" x2="'+m+'" y2="'+(hy+60)+'" stroke="#ffbd00" stroke-width="4"/>'+
  (c.logo?'<image href="'+esc(c.logo)+'" x="'+(m+16)+'" y="'+(hy-8)+'" width="76" height="76" preserveAspectRatio="xMidYMid meet" filter="url(#shadow)"/>':'')+
  '<text x="'+(m+108)+'" y="'+(hy+30)+'" fill="#fff" font-family="Arial" font-size="29" font-weight="950">'+esc(c.label)+'</text><text x="'+(m+108)+'" y="'+(hy+54)+'" fill="#9bb0bf" font-family="Arial" font-size="12" font-weight="700" letter-spacing="2">SVENSK eHOCKEY · SOCIAL GRAPHICS</text>'+

  '<text x="'+m+'" y="'+(ty-42)+'" fill="#ffbd00" font-family="Arial" font-size="14" font-weight="950" letter-spacing="4">'+esc(subtitle())+'</text><text x="'+m+'" y="'+(ty+20)+'" fill="url(#silver)" font-family="Arial Black,Arial" font-size="'+ts+'" font-weight="1000" letter-spacing="-2" filter="url(#shadow)">'+esc(title())+'</text>'+
  content+'<text x="'+m+'" y="'+(H-42)+'" fill="#fff" font-family="Arial" font-size="12" font-weight="950" letter-spacing="2">SVENSK eHOCKEY</text><text x="'+(m+165)+'" y="'+(H-42)+'" fill="#8aa0af" font-family="Arial" font-size="10" font-weight="800" letter-spacing="1.5">6V6 · NHL 27</text><text x="'+(W-m)+'" y="'+(H-42)+'" text-anchor="end" fill="#718797" font-family="Arial" font-size="10" font-weight="800" letter-spacing="2">POWERED BY SWNWORKS</text></svg>';
}
function geom(len){const {w:W,h:H}=format(),m=Math.round(W*.052),top=S.format==="story"?380:S.format==="wide"?300:310,bottom=H-90,head=48;return {W,H,m,top,bottom,head,width:W-m*2,row:Math.max(48,Math.min(S.format==="wide"?78:92,(bottom-top-head)/Math.max(1,len)))}}
function img(url,x,y,s){return S.logos&&url?'<image href="'+esc(url)+'" x="'+x+'" y="'+y+'" width="'+s+'" height="'+s+'" preserveAspectRatio="xMidYMid meet"/>':''}
function standingMark(i){
  if(S.league!==527)return null;
  if(i<3)return {color:"#ffbd00",opacity:i===0?1:.78};
  if(i<5)return {color:"#4ba5df",opacity:.78};
  return null;
}
function portraitUrl(p){
  const id=Number(p&&p.sports_gamer_player_id), file=Number.isFinite(id)?id+".png":"";
  const approved=Array.isArray(window.SEH_PLAYER_IMAGE_FILES)&&window.SEH_PLAYER_IMAGE_FILES.includes(file);
  if(approved)return "https://www.svenskehockey.se/players/"+file;
  return p&&p.player_image?String(p.player_image):"";
}
function portraitImage(url,x,y,w,h){
  return url?'<image href="'+esc(url)+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" preserveAspectRatio="xMidYMid meet"/>':"";
}
function leaderboardGeometry(len){
  const {w:W,h:H}=format(),m=Math.round(W*.052),top=S.format==="story"?380:S.format==="wide"?300:310,bottom=H-90,head=48;
  const topH=S.format==="story"?130:S.format==="portrait"?108:S.format==="wide"?86:82;
  const restH=S.format==="story"?90:S.format==="portrait"?72:S.format==="wide"?55:54;
  const rowHeights=Array.from({length:len},(_,i)=>i<3?topH:restH);
  const total=head+rowHeights.reduce((a,b)=>a+b,0);
  return {W,H,m,top,bottom,head,width:W-m*2,rowHeights,total};
}
function tableSvg(){
  const r=standings(),g=geom(r.length||1),ls=logos(),size=Math.min(50,g.row-18);let o='<g filter="url(#shadow)"><rect x="'+g.m+'" y="'+g.top+'" width="'+g.width+'" height="'+(g.head+g.row*r.length)+'" fill="url(#panel)" stroke="#ffbd00" stroke-opacity=".35"/><rect x="'+g.m+'" y="'+g.top+'" width="'+g.width+'" height="'+g.head+'" fill="url(#gold)"/>';
  const labels=[["#",.03],["LAG",.09],["GP",.67],["W",.76],["L",.84],["GD",.91],["PTS",.975]];
  labels.forEach(([t,p])=>o+='<text x="'+(g.m+g.width*p)+'" y="'+(g.top+31)+'" text-anchor="'+(t==="LAG"?"start":"middle")+'" fill="#07121c" font-family="Arial" font-size="12" font-weight="950">'+t+'</text>');
  r.forEach((x,i)=>{const y=g.top+g.head+i*g.row,cy=y+g.row/2,logo=x.team_logo_in_league||ls.get(String(x.sports_gamer_team_id))||"",tx=g.m+(S.logos?128:72),vals=[n(x.games_played),n(x.total_wins),n(x.losses),(n(x.goal_difference)>0?"+":"")+n(x.goal_difference),n(x.table_points)],xs=[.67,.76,.84,.91,.975],mark=standingMark(i);
    o+='<rect x="'+g.m+'" y="'+y+'" width="'+g.width+'" height="'+g.row+'" fill="'+(i%2?"#061722":"#04121c")+'" fill-opacity=".95"/>'+(mark?'<rect x="'+g.m+'" y="'+y+'" width="5" height="'+g.row+'" fill="'+mark.color+'" fill-opacity="'+mark.opacity+'"/>':'')+'<text x="'+(g.m+28)+'" y="'+(cy+7)+'" fill="'+(i===0?"#ffbd00":"#eef3f6")+'" font-family="Arial" font-size="'+(i===0?24:20)+'" font-weight="950">'+(i+1)+'</text>'+img(logo,g.m+65,cy-size/2,size)+'<text x="'+tx+'" y="'+(cy+7)+'" fill="#fff" font-family="Arial" font-size="'+(S.format==="wide"?22:20)+'" font-weight="900">'+esc(clip(x.team_name_in_league,S.format==="wide"?36:26))+'</text>';
    vals.forEach((v,k)=>o+='<text x="'+(g.m+g.width*xs[k])+'" y="'+(cy+7)+'" text-anchor="middle" fill="'+(k===4?"#ffbd00":"#e4ebef")+'" font-family="Arial" font-size="'+(k===4?23:19)+'" font-weight="'+(k===4?950:750)+'">'+v+'</text>');
  });return base(o+"</g>");
}
function compactTablePanel(rows,x,y,w,h,label){
  const head=58,titleH=52,rowH=Math.max(42,Math.min(60,(h-titleH-head)/Math.max(1,rows.length))),ls=logos(),logoSize=Math.min(34,rowH-12);
  let o='<g filter="url(#shadow)"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="url(#panel)" stroke="#ffbd00" stroke-opacity=".35"/><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+titleH+'" fill="url(#gold)"/><text x="'+(x+w/2)+'" y="'+(y+34)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="18" font-weight="950" letter-spacing="2">'+esc(label)+'</text>';
  const hy=y+titleH;
  o+='<rect x="'+x+'" y="'+hy+'" width="'+w+'" height="'+head+'" fill="#081923" fill-opacity=".96"/>';
  const cols=[["#",.04],["LAG",.10],["GP",.70],["W",.79],["L",.86],["GD",.925],["PTS",.985]];
  cols.forEach(([t,p])=>o+='<text x="'+(x+w*p)+'" y="'+(hy+36)+'" text-anchor="'+(t==="LAG"?"start":"middle")+'" fill="#9cb0bd" font-family="Arial" font-size="11" font-weight="900">'+t+'</text>');
  rows.forEach((r,i)=>{const ry=hy+head+i*rowH,cy=ry+rowH/2,logo=r.team_logo_in_league||ls.get(String(r.sports_gamer_team_id))||"",tx=x+(S.logos?96:52),mark=standingMark(i);
    o+='<rect x="'+x+'" y="'+ry+'" width="'+w+'" height="'+rowH+'" fill="'+(i%2?"#061722":"#04121c")+'"/>'+(mark?'<rect x="'+x+'" y="'+ry+'" width="4" height="'+rowH+'" fill="'+mark.color+'" fill-opacity="'+mark.opacity+'"/>':'')+
    '<text x="'+(x+22)+'" y="'+(cy+6)+'" fill="'+(i===0?"#ffbd00":"#eaf0f4")+'" font-family="Arial" font-size="'+(i===0?20:17)+'" font-weight="950">'+(i+1)+'</text>'+
    img(logo,x+50,cy-logoSize/2,logoSize)+
    '<text x="'+tx+'" y="'+(cy+6)+'" fill="#fff" font-family="Arial" font-size="'+(w>700?18:15)+'" font-weight="900">'+esc(clip(r.team_name_in_league,w>700?28:18))+'</text>';
    const vals=[n(r.games_played),n(r.total_wins),n(r.losses),(n(r.goal_difference)>0?"+":"")+n(r.goal_difference),n(r.table_points)],xs=[.70,.79,.86,.925,.985];
    vals.forEach((v,k)=>o+='<text x="'+(x+w*xs[k])+'" y="'+(cy+6)+'" text-anchor="middle" fill="'+(k===4?"#ffbd00":"#e3eaee")+'" font-family="Arial" font-size="'+(k===4?19:15)+'" font-weight="'+(k===4?950:750)+'">'+v+'</text>');
  });
  return o+'</g>';
}
function groupsSvg(){
  const ids=groupIds().slice(0,2),{w:W,h:H}=format(),m=Math.round(W*.052),top=S.format==="story"?360:315,bottom=H-95,gap=S.format==="wide"?24:18;
  if(ids.length<2)return base('<text x="'+(W/2)+'" y="'+(H/2)+'" text-anchor="middle" fill="#fff" font-family="Arial" font-size="28" font-weight="900">TVÅ GRUPPER SAKNAS</text>');
  const a=standingsForGroup(ids[0]),b=standingsForGroup(ids[1]);let o="";
  if(S.format==="story"||S.format==="portrait"){
    const h=(bottom-top-gap)/2;
    o+=compactTablePanel(a,m,top,W-m*2,h,groupName(ids[0]));
    o+=compactTablePanel(b,m,top+h+gap,W-m*2,h,groupName(ids[1]));
  }else{
    const w=(W-m*2-gap)/2,h=bottom-top;
    o+=compactTablePanel(a,m,top,w,h,groupName(ids[0]));
    o+=compactTablePanel(b,m+w+gap,top,w,h,groupName(ids[1]));
  }
  return base(o);
}
function board(kind){
  const metric=kind==="goals"?"g":kind==="assists"?"a":"p",r=skaters(metric),g=leaderboardGeometry(r.length||1),ls=logos(),main=kind==="goals"?"G":kind==="assists"?"A":"P";
  let o='<g filter="url(#shadow)"><rect x="'+g.m+'" y="'+g.top+'" width="'+g.width+'" height="'+g.total+'" fill="url(#panel)" stroke="#ffbd00" stroke-opacity=".35"/><rect x="'+g.m+'" y="'+g.top+'" width="'+g.width+'" height="'+g.head+'" fill="url(#gold)"/>';
  [["#",.03],["SPELARE",.09],["GP",.72],["G",.81],["A",.89],["P",.97]].forEach(([t,p])=>o+='<text x="'+(g.m+g.width*p)+'" y="'+(g.top+31)+'" text-anchor="'+(t==="SPELARE"?"start":"middle")+'" fill="#07121c" font-family="Arial" font-size="12" font-weight="950">'+t+'</text>');
  let y=g.top+g.head;
  r.forEach((x,i)=>{
    const rh=g.rowHeights[i],cy=y+rh/2,logo=ls.get(String(x.sports_gamer_team_id))||"",portrait=i<3?portraitUrl(x):"",hasPortrait=Boolean(portrait);
    const portraitW=Math.min(S.format==="story"?82:S.format==="portrait"?72:60,rh-12),portraitH=Math.min(rh-6,portraitW*1.28);
    const visualX=g.m+64,visualY=cy-portraitH/2;
    const tx=g.m+(hasPortrait?visualX-g.m+portraitW+24:(S.logos?126:70));
    o+='<rect x="'+g.m+'" y="'+y+'" width="'+g.width+'" height="'+rh+'" fill="'+(i%2?"#061722":"#04121c")+'"/>'+(i<3?'<rect x="'+g.m+'" y="'+y+'" width="5" height="'+rh+'" fill="#ffbd00" fill-opacity="'+(i===0?1:.68)+'"/>':'')+
      '<text x="'+(g.m+27)+'" y="'+(cy+7)+'" fill="'+(i===0?"#ffbd00":"#eef3f6")+'" font-family="Arial" font-size="'+(i===0?24:20)+'" font-weight="950">'+(i+1)+'</text>';
    if(hasPortrait){
      o+='<rect x="'+(visualX-5)+'" y="'+(visualY+4)+'" width="'+(portraitW+10)+'" height="'+(portraitH-4)+'" rx="7" fill="#071722" stroke="#ffbd00" stroke-opacity="'+(i===0?".62":".34")+'"/>'+
         portraitImage(portrait,visualX,visualY,portraitW,portraitH);
    }else{
      const size=Math.min(46,rh-18);
      o+=img(logo,g.m+64,cy-size/2,size);
    }
    o+='<text x="'+tx+'" y="'+(cy-5)+'" fill="#fff" font-family="Arial" font-size="'+(i<3?21:19)+'" font-weight="900">'+esc(clip(x.display_gamertag,S.format==="wide"?28:23))+'</text>'+
       '<text x="'+tx+'" y="'+(cy+18)+'" fill="#8299aa" font-family="Arial" font-size="11" font-weight="700">'+esc(clip(x.team_name_in_league,27))+'</text>';
    if(hasPortrait&&S.logos&&logo)o+=img(logo,tx-2,cy+23,22);
    [[x.gp,.72,"GP"],[x.g,.81,"G"],[x.a,.89,"A"],[x.p,.97,"P"]].forEach(([v,p,l])=>o+='<text x="'+(g.m+g.width*p)+'" y="'+(cy+7)+'" text-anchor="middle" fill="'+(l===main?"#ffbd00":"#e3e9ed")+'" font-family="Arial" font-size="'+(l===main?25:19)+'" font-weight="'+(l===main?950:750)+'">'+v+'</text>');
    y+=rh;
  });
  return base(o+"</g>");
}
function goalieSvg(){
  const r=goalies(),g=leaderboardGeometry(r.length||1),ls=logos();
  let o='<g filter="url(#shadow)"><rect x="'+g.m+'" y="'+g.top+'" width="'+g.width+'" height="'+g.total+'" fill="url(#panel)" stroke="#ffbd00" stroke-opacity=".35"/><rect x="'+g.m+'" y="'+g.top+'" width="'+g.width+'" height="'+g.head+'" fill="url(#gold)"/>';
  [["#",.03],["MÅLVAKT",.09],["GP",.72],["SV%",.82],["GAA",.91],["SO",.975]].forEach(([t,p])=>o+='<text x="'+(g.m+g.width*p)+'" y="'+(g.top+31)+'" text-anchor="'+(t==="MÅLVAKT"?"start":"middle")+'" fill="#07121c" font-family="Arial" font-size="12" font-weight="950">'+t+'</text>');
  let y=g.top+g.head;
  r.forEach((x,i)=>{
    const rh=g.rowHeights[i],cy=y+rh/2,logo=ls.get(String(x.sports_gamer_team_id))||"",portrait=i<3?portraitUrl(x):"",hasPortrait=Boolean(portrait),sv=(x.sv*(x.sv<=1?100:1)).toFixed(1).replace(".",",");
    const portraitW=Math.min(S.format==="story"?82:S.format==="portrait"?72:60,rh-12),portraitH=Math.min(rh-6,portraitW*1.28),visualX=g.m+64,visualY=cy-portraitH/2;
    const tx=g.m+(hasPortrait?visualX-g.m+portraitW+24:(S.logos?126:70));
    o+='<rect x="'+g.m+'" y="'+y+'" width="'+g.width+'" height="'+rh+'" fill="'+(i%2?"#061722":"#04121c")+'"/>'+(i<3?'<rect x="'+g.m+'" y="'+y+'" width="5" height="'+rh+'" fill="#ffbd00" fill-opacity="'+(i===0?1:.68)+'"/>':'')+
      '<text x="'+(g.m+27)+'" y="'+(cy+7)+'" fill="'+(i===0?"#ffbd00":"#eef3f6")+'" font-family="Arial" font-size="'+(i===0?24:20)+'" font-weight="950">'+(i+1)+'</text>';
    if(hasPortrait){
      o+='<rect x="'+(visualX-5)+'" y="'+(visualY+4)+'" width="'+(portraitW+10)+'" height="'+(portraitH-4)+'" rx="7" fill="#071722" stroke="#ffbd00" stroke-opacity="'+(i===0?".62":".34")+'"/>'+
         portraitImage(portrait,visualX,visualY,portraitW,portraitH);
    }else{
      const size=Math.min(46,rh-18);
      o+=img(logo,g.m+64,cy-size/2,size);
    }
    o+='<text x="'+tx+'" y="'+(cy-5)+'" fill="#fff" font-family="Arial" font-size="'+(i<3?21:19)+'" font-weight="900">'+esc(clip(x.display_gamertag,S.format==="wide"?28:23))+'</text>'+
       '<text x="'+tx+'" y="'+(cy+18)+'" fill="#8299aa" font-family="Arial" font-size="11" font-weight="700">'+esc(clip(x.team_name_in_league,27))+'</text>';
    if(hasPortrait&&S.logos&&logo)o+=img(logo,tx-2,cy+23,22);
    [[x.gp,.72,false],[sv,.82,true],[x.gaa==null?"–":x.gaa.toFixed(2).replace(".",","),.91,false],[x.so,.975,false]].forEach(([v,p,hi])=>o+='<text x="'+(g.m+g.width*p)+'" y="'+(cy+7)+'" text-anchor="middle" fill="'+(hi?"#ffbd00":"#e3e9ed")+'" font-family="Arial" font-size="'+(hi?24:18)+'" font-weight="'+(hi?950:750)+'">'+v+'</text>');
    y+=rh;
  });
  return base(o+"</g>");
}
function mini(x,y,w,h,label,metric,data,lm){
  const hh=52,rh=(h-hh)/3;
  let o='<g filter="url(#shadow)"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="url(#panel)" stroke="#ffbd00" stroke-opacity=".35"/><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" fill="url(#gold)"/><text x="'+(x+18)+'" y="'+(y+34)+'" fill="#07121c" font-family="Arial" font-size="15" font-weight="950" letter-spacing="1.5">'+label+'</text>';
  data.slice(0,3).forEach((p,i)=>{
    const yy=y+hh+i*rh,cy=yy+rh/2,logo=lm.get(String(p.sports_gamer_team_id))||"",portrait=portraitUrl(p),pw=Math.min(42,rh-8),ph=Math.min(rh-4,pw*1.25),vx=x+43;
    o+='<rect x="'+x+'" y="'+yy+'" width="'+w+'" height="'+rh+'" fill="'+(i%2?"#061722":"#04121c")+'"/><text x="'+(x+16)+'" y="'+(cy+6)+'" fill="'+(i===0?"#ffbd00":"#e7edf1")+'" font-family="Arial" font-size="18" font-weight="950">'+(i+1)+'</text>';
    if(portrait)o+=portraitImage(portrait,vx,cy-ph/2,pw,ph);
    else o+=img(logo,vx,cy-19,38);
    o+='<text x="'+(x+((portrait||S.logos)?96:50))+'" y="'+(cy+5)+'" fill="#fff" font-family="Arial" font-size="15" font-weight="900">'+esc(clip(p.display_gamertag,17))+'</text><text x="'+(x+w-20)+'" y="'+(cy+8)+'" text-anchor="end" fill="#ffbd00" font-family="Arial" font-size="25" font-weight="950">'+p[metric]+'</text>';
  });
  return o+"</g>";
}
function leadersSvg(){
  const {w:W,h:H}=format(),m=Math.round(W*.052),top=S.format==="story"?380:315,bottom=H-95,lm=logos(),a=skaters("g"),b=skaters("a"),c=skaters("p");let o="";
  if(S.format==="wide"){const gap=22,w=(W-m*2-gap*2)/3,h=bottom-top;o+=mini(m,top,w,h,"MÅL","g",a,lm)+mini(m+w+gap,top,w,h,"ASSISTS","a",b,lm)+mini(m+(w+gap)*2,top,w,h,"POÄNG","p",c,lm)}
  else{const gap=18,h=(bottom-top-gap*2)/3;o+=mini(m,top,W-m*2,h,"MÅL","g",a,lm)+mini(m,top+h+gap,W-m*2,h,"ASSISTS","a",b,lm)+mini(m,top+(h+gap)*2,W-m*2,h,"POÄNG","p",c,lm)}
  return base(o);
}
function build(){return S.kind==="table"?tableSvg():S.kind==="groups"?groupsSvg():S.kind==="goalies"?goalieSvg():S.kind==="leaders"?leadersSvg():board(S.kind)}
function render(){
  sync();$("#preview").innerHTML=build();$("#sizeLabel").textContent=format().label;$("#kindLabel").textContent=TIT[S.kind];
  $("#stageField").hidden=S.kind==="table"||S.kind==="groups";$("#groupField").hidden=S.kind!=="table";$("#countField").hidden=S.kind==="table"||S.kind==="groups"||S.kind==="leaders";
}
function safe(){return (comp().code+"-"+TIT[S.kind]).toLowerCase().replace(/å/g,"a").replace(/ä/g,"a").replace(/ö/g,"o").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function dl(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
function dataUrl(blob){return new Promise((ok,no)=>{const f=new FileReader();f.onload=()=>ok(f.result);f.onerror=no;f.readAsDataURL(blob)})}
async function inline(svg){
  const d=new DOMParser().parseFromString(svg,"image/svg+xml"),ims=[...d.querySelectorAll("image")];
  await Promise.all(ims.map(async el=>{const h=el.getAttribute("href")||"";if(!h||h.startsWith("data:"))return;try{const r=await fetch(h,{mode:"cors",cache:"no-store"});if(!r.ok)throw 0;el.setAttribute("href",await dataUrl(await r.blob()))}catch(e){console.warn("Bild kunde inte bäddas in",h);el.remove()}}));
  return new XMLSerializer().serializeToString(d.documentElement);
}
async function expSvg(){const s=await inline(build());dl(new Blob([s],{type:"image/svg+xml;charset=utf-8"}),safe()+".svg")}
async function expPng(){const s=await inline(build()),{w,h}=format(),u=URL.createObjectURL(new Blob([s],{type:"image/svg+xml;charset=utf-8"})),im=new Image();try{await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=u});const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.drawImage(im,0,0,w,h);const b=await new Promise(ok=>c.toBlob(ok,"image/png",1));if(!b)throw new Error("PNG-export misslyckades");dl(b,safe()+".png")}finally{URL.revokeObjectURL(u)}}

$$("[data-kind]").forEach(b=>b.onclick=()=>{$$("[data-kind]").forEach(x=>x.classList.toggle("active",x===b));S.kind=b.dataset.kind;render()});
["stage","group","count","format","bg","logos"].forEach(id=>$("#"+id).addEventListener("change",render));
["title","subtitle"].forEach(id=>$("#"+id).addEventListener("input",render));
$("#league").onchange=()=>{S.league=Number($("#league").value||527);S.group=null;load()};
$("#refresh").onclick=load;$("#svg").onclick=()=>expSvg().catch(e=>alert(e.message));$("#png").onclick=()=>expPng().catch(e=>alert(e.message));
render();load();
})();
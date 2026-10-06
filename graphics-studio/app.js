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
function subtitle(){return ($("#subtitle").value||(S.kind==="table"?stageName()+" · "+groupName(S.group):S.kind==="groups"?"GRUPPSPEL · GRUPPSTABELLER":stageName()+" · "+comp().label)).trim().toUpperCase()}
function defs(){return '<defs><linearGradient id="silver" x2="0" y2="1"><stop stop-color="#fff"/><stop offset=".48" stop-color="#edf1f4"/><stop offset=".8" stop-color="#a2adb6"/><stop offset="1" stop-color="#fff"/></linearGradient><linearGradient id="gold"><stop stop-color="#ffd95f"/><stop offset=".5" stop-color="#ffbd00"/><stop offset="1" stop-color="#d88700"/></linearGradient><linearGradient id="panel" x2="1" y2="1"><stop stop-color="#071d2c" stop-opacity=".97"/><stop offset="1" stop-color="#020b12" stop-opacity=".98"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#000" flood-opacity=".58"/></filter></defs>'}
function background(W,H){
  if(S.bg==="gamenight"){
    const u=new URL("../broadcast-studio/assets/game-night-background-photo.webp",location.href).href;
    return '<rect width="'+W+'" height="'+H+'" fill="#06111d"/><image href="'+esc(u)+'" width="'+W+'" height="'+H+'" preserveAspectRatio="xMidYMid slice"/><rect width="'+W+'" height="'+H+'" fill="#020b12" fill-opacity=".50"/>';
  }
  if(S.bg==="ice")return '<rect width="'+W+'" height="'+H+'" fill="#0a2a3d"/><circle cx="'+W*.5+'" cy="'+H*.56+'" r="'+Math.min(W,H)*.34+'" fill="none" stroke="#a8e6ff" stroke-opacity=".09" stroke-width="8"/><path d="M0 '+H*.56+' H'+W+'" stroke="#d7f4ff" stroke-opacity=".09" stroke-width="5"/>';
  if(S.bg==="smoke")return '<rect width="'+W+'" height="'+H+'" fill="#06111a"/><ellipse cx="'+W*.25+'" cy="'+H*.68+'" rx="'+W*.38+'" ry="'+H*.24+'" fill="#a8b5bf" fill-opacity=".09"/><ellipse cx="'+W*.8+'" cy="'+H*.35+'" rx="'+W*.3+'" ry="'+H*.2+'" fill="#ffbd00" fill-opacity=".06"/>';
  return '<rect width="'+W+'" height="'+H+'" fill="#06283d"/><path d="M0 '+H*.82+' L'+W*.48+' 0 H'+W*.62+' L'+W*.16+' '+H+'" Z" fill="#0d4a70" fill-opacity=".32"/><path d="M'+W*.6+' 0 L'+W+' '+H*.42+' V'+H*.63+' L'+W*.48+' 0 Z" fill="#ffbd00" fill-opacity=".05"/>';
}
function legacyBase(content){
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
function clamp01(v){return Math.max(0,Math.min(1,Number.isFinite(Number(v))?Number(v):0))}
function fmtDec(v,d=2){return Number.isFinite(Number(v))?Number(v).toFixed(d).replace(".",","):"–"}
function silhouetteSvg(x,y,w,h){
  const cx=x+w/2, headR=Math.min(w,h)*.13, headY=y+h*.27;
  return '<g opacity=".92"><circle cx="'+cx+'" cy="'+headY+'" r="'+headR+'" fill="#050b11"/><path d="M '+(x+w*.18)+' '+(y+h*.92)+' C '+(x+w*.20)+' '+(y+h*.63)+', '+(x+w*.36)+' '+(y+h*.52)+', '+cx+' '+(y+h*.52)+' C '+(x+w*.64)+' '+(y+h*.52)+', '+(x+w*.80)+' '+(y+h*.63)+', '+(x+w*.82)+' '+(y+h*.92)+' Z" fill="#050b11"/></g>';
}
function statBar(x,y,w,label,value,ratio,accent="#ffbd00"){
  const fillW=Math.max(10,Math.round(w*clamp01(ratio)));
  return '<text x="'+x+'" y="'+(y-9)+'" fill="#a9bac6" font-family="Arial" font-size="14" font-weight="900">'+esc(label)+'</text>'+
    '<text x="'+(x+w)+'" y="'+(y-9)+'" text-anchor="end" fill="#ffffff" font-family="Arial" font-size="14" font-weight="1000">'+esc(value)+'</text>'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="9" rx="4.5" fill="#173246"/>'+
    '<rect x="'+x+'" y="'+y+'" width="'+fillW+'" height="9" rx="4.5" fill="'+accent+'"/>';
}
function skaterCardConfig(kind,p,maxes){
  const ppg=p.gp?p.p/p.gp:0,gpg=p.gp?p.g/p.gp:0,apg=p.gp?p.a/p.gp:0;
  if(kind==="goals")return {
    primaryLabel:"G",primaryValue:p.g,
    meta:"P: "+p.p+" · GP: "+p.gp+" · A: "+p.a,
    bars:[
      {label:"G",value:String(p.g),ratio:maxes.g?p.g/maxes.g:0},
      {label:"G/GP",value:fmtDec(gpg),ratio:maxes.gpg?gpg/maxes.gpg:0},
      {label:"GP",value:String(p.gp),ratio:maxes.gp?p.gp/maxes.gp:0}
    ]
  };
  if(kind==="assists")return {
    primaryLabel:"A",primaryValue:p.a,
    meta:"P: "+p.p+" · GP: "+p.gp+" · G: "+p.g,
    bars:[
      {label:"A",value:String(p.a),ratio:maxes.a?p.a/maxes.a:0},
      {label:"A/GP",value:fmtDec(apg),ratio:maxes.apg?apg/maxes.apg:0},
      {label:"GP",value:String(p.gp),ratio:maxes.gp?p.gp/maxes.gp:0}
    ]
  };
  return {
    primaryLabel:"P",primaryValue:p.p,
    meta:"GP: "+p.gp+" · G: "+p.g+" · A: "+p.a,
    bars:[
      {label:"P",value:String(p.p),ratio:maxes.p?p.p/maxes.p:0},
      {label:"PPG",value:fmtDec(ppg),ratio:maxes.ppg?ppg/maxes.ppg:0},
      {label:"GP",value:String(p.gp),ratio:maxes.gp?p.gp/maxes.gp:0}
    ]
  };
}
function leaderboardCard(p,rank,kind,x,y,w,h,logo,maxes){
  const portrait=portraitUrl(p),cfg=skaterCardConfig(kind,p,maxes);
  const rankColor=rank===1?"#ffbd00":rank===2?"#d7dee7":"#b77d39";
  const big=w>=760&&h>=270, pad=big?18:14, accentW=big?8:6;
  const portraitW=big?205:Math.min(138,w*.27), portraitH=h-pad*2;
  const px=x+pad, py=y+pad, tx=px+portraitW+(big?28:18), right=x+w-pad;
  const logoSize=big?66:46, nameSize=big?34:23, teamSize=big?14:11;
  const mainSize=big?62:42, labelSize=big?14:11;
  const statTop=y+(big?112:92), primaryX=tx, colsStart=tx+(big?150:102), colGap=big?92:64;
  const barsY=y+h-(big?82:58), barW=Math.max(big?320:150,right-tx);

  const values=kind==="goals"
    ? [{l:"GP",v:p.gp},{l:"A",v:p.a},{l:"P",v:p.p}]
    : kind==="assists"
      ? [{l:"GP",v:p.gp},{l:"G",v:p.g},{l:"P",v:p.p}]
      : [{l:"GP",v:p.gp},{l:"G",v:p.g},{l:"A",v:p.a}];

  let o='<g filter="url(#shadow)">'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="18" fill="#081827" stroke="#35516a" stroke-width="1.4"/>'+
    '<rect x="'+x+'" y="'+y+'" width="'+accentW+'" height="'+h+'" rx="'+(accentW/2)+'" fill="'+rankColor+'"/>'+
    '<rect x="'+px+'" y="'+py+'" width="'+portraitW+'" height="'+portraitH+'" rx="14" fill="#0b1722" stroke="'+rankColor+'" stroke-width="2" stroke-opacity=".82"/>';
  if(portrait)o+=portraitImage(portrait,px+5,py+5,portraitW-10,portraitH-10);
  else o+=silhouetteSvg(px+6,py+6,portraitW-12,portraitH-12);

  if(logo)o+=img(logo,right-logoSize,y+18,logoSize);

  o+='<text x="'+tx+'" y="'+(y+(big?28:24))+'" fill="'+rankColor+'" font-family="Arial" font-size="'+(big?15:12)+'" font-weight="1000">#'+rank+'</text>'+
    '<text x="'+tx+'" y="'+(y+(big?58:46))+'" fill="#fff" font-family="Arial" font-size="'+nameSize+'" font-weight="1000">'+esc(clip(p.display_gamertag,big?28:20))+'</text>'+
    '<text x="'+tx+'" y="'+(y+(big?83:64))+'" fill="#92a8b8" font-family="Arial" font-size="'+teamSize+'" font-weight="850">'+esc(clip(p.team_name_in_league||"",30))+'</text>'+
    '<text x="'+primaryX+'" y="'+statTop+'" fill="#9fb3c1" font-family="Arial" font-size="'+labelSize+'" font-weight="950">'+esc(cfg.primaryLabel)+'</text>'+
    '<text x="'+primaryX+'" y="'+(statTop+(big?52:38))+'" fill="#ffbd00" font-family="Arial Black,Arial" font-size="'+mainSize+'" font-weight="1000">'+esc(cfg.primaryValue)+'</text>';

  values.forEach((s,i)=>{
    const sx=colsStart+i*colGap;
    o+='<text x="'+sx+'" y="'+statTop+'" fill="#9fb3c1" font-family="Arial" font-size="'+labelSize+'" font-weight="950">'+s.l+'</text>'+
      '<text x="'+sx+'" y="'+(statTop+(big?48:36))+'" fill="#f5f7f9" font-family="Arial Black,Arial" font-size="'+(big?32:24)+'" font-weight="1000">'+s.v+'</text>';
  });

  cfg.bars.forEach((b,i)=>{o+=statBar(tx,barsY+i*(big?27:24),barW,b.label,b.value,b.ratio)});
  return o+'</g>';
}
function leaderboardWideCard(p,rank,kind,x,y,w,h,logo,maxes){
  const portrait=portraitUrl(p),cfg=skaterCardConfig(kind,p,maxes);
  const rankColor=rank===1?"#ffbd00":rank===2?"#d7dee7":"#b77d39";
  const px=x+24, py=y+15, portraitW=122, portraitH=h-30, tx=px+portraitW+24, right=x+w-24;
  const logoSize=54, barsX=tx+350, barsW=Math.max(360,right-logoSize-30-barsX), barsY=y+116;
  const values=kind==="goals"
    ? [{l:"GP",v:p.gp},{l:"A",v:p.a},{l:"P",v:p.p}]
    : kind==="assists"
      ? [{l:"GP",v:p.gp},{l:"G",v:p.g},{l:"P",v:p.p}]
      : [{l:"GP",v:p.gp},{l:"G",v:p.g},{l:"A",v:p.a}];

  let o='<g filter="url(#shadow)">'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="18" fill="#081827" stroke="#35516a" stroke-width="1.4"/>'+
    '<rect x="'+x+'" y="'+y+'" width="8" height="'+h+'" rx="4" fill="'+rankColor+'"/>'+
    '<rect x="'+px+'" y="'+py+'" width="'+portraitW+'" height="'+portraitH+'" rx="13" fill="#0b1722" stroke="'+rankColor+'" stroke-width="2" stroke-opacity=".82"/>';
  if(portrait)o+=portraitImage(portrait,px+5,py+5,portraitW-10,portraitH-10);
  else o+=silhouetteSvg(px+6,py+6,portraitW-12,portraitH-12);
  if(logo)o+=img(logo,right-logoSize,y+18,logoSize);

  o+='<text x="'+tx+'" y="'+(y+28)+'" fill="'+rankColor+'" font-family="Arial" font-size="14" font-weight="1000">#'+rank+'</text>'+
    '<text x="'+tx+'" y="'+(y+58)+'" fill="#fff" font-family="Arial" font-size="30" font-weight="1000">'+esc(clip(p.display_gamertag,26))+'</text>'+
    '<text x="'+tx+'" y="'+(y+79)+'" fill="#92a8b8" font-family="Arial" font-size="12" font-weight="850">'+esc(clip(p.team_name_in_league||"",30))+'</text>'+
    '<text x="'+tx+'" y="'+(y+108)+'" fill="#9fb3c1" font-family="Arial" font-size="13" font-weight="950">'+esc(cfg.primaryLabel)+'</text>'+
    '<text x="'+tx+'" y="'+(y+152)+'" fill="#ffbd00" font-family="Arial Black,Arial" font-size="52" font-weight="1000">'+esc(cfg.primaryValue)+'</text>';

  const colsStart=tx+122, colGap=88;
  values.forEach((s,i)=>{
    const sx=colsStart+i*colGap;
    o+='<text x="'+sx+'" y="'+(y+108)+'" fill="#9fb3c1" font-family="Arial" font-size="13" font-weight="950">'+s.l+'</text>'+
      '<text x="'+sx+'" y="'+(y+146)+'" fill="#f5f7f9" font-family="Arial Black,Arial" font-size="28" font-weight="1000">'+s.v+'</text>';
  });

  cfg.bars.forEach((b,i)=>{o+=statBar(barsX,barsY+i*23,barsW,b.label,b.value,b.ratio)});
  return o+'</g>';
}

function goalieWideCard(p,rank,x,y,w,h,logo,maxes){
  const portrait=portraitUrl(p),cfg=goalieCardConfig(p,maxes);
  const rankColor=rank===1?"#ffbd00":rank===2?"#d7dee7":"#b77d39";
  const px=x+24, py=y+15, portraitW=122, portraitH=h-30, tx=px+portraitW+24, right=x+w-24;
  const logoSize=54, barsX=tx+360, barsW=Math.max(360,right-logoSize-30-barsX), barsY=y+116;
  const sv=(p.sv*(p.sv<=1?100:1)), gaa=p.gaa==null?"–":fmtDec(p.gaa);
  const values=[{l:"GP",v:p.gp},{l:"GAA",v:gaa},{l:"SO",v:p.so}];

  let o='<g filter="url(#shadow)">'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="18" fill="#081827" stroke="#35516a" stroke-width="1.4"/>'+
    '<rect x="'+x+'" y="'+y+'" width="8" height="'+h+'" rx="4" fill="'+rankColor+'"/>'+
    '<rect x="'+px+'" y="'+py+'" width="'+portraitW+'" height="'+portraitH+'" rx="13" fill="#0b1722" stroke="'+rankColor+'" stroke-width="2" stroke-opacity=".82"/>';
  if(portrait)o+=portraitImage(portrait,px+5,py+5,portraitW-10,portraitH-10);
  else o+=silhouetteSvg(px+6,py+6,portraitW-12,portraitH-12);
  if(logo)o+=img(logo,right-logoSize,y+18,logoSize);

  o+='<text x="'+tx+'" y="'+(y+28)+'" fill="'+rankColor+'" font-family="Arial" font-size="14" font-weight="1000">#'+rank+'</text>'+
    '<text x="'+tx+'" y="'+(y+58)+'" fill="#fff" font-family="Arial" font-size="30" font-weight="1000">'+esc(clip(p.display_gamertag,26))+'</text>'+
    '<text x="'+tx+'" y="'+(y+79)+'" fill="#92a8b8" font-family="Arial" font-size="12" font-weight="850">'+esc(clip(p.team_name_in_league||"",30))+'</text>'+
    '<text x="'+tx+'" y="'+(y+108)+'" fill="#9fb3c1" font-family="Arial" font-size="13" font-weight="950">SV%</text>'+
    '<text x="'+tx+'" y="'+(y+152)+'" fill="#ffbd00" font-family="Arial Black,Arial" font-size="48" font-weight="1000">'+fmtDec(sv,1)+'</text>';

  const colsStart=tx+142, colGap=105;
  values.forEach((s,i)=>{
    const sx=colsStart+i*colGap;
    o+='<text x="'+sx+'" y="'+(y+108)+'" fill="#9fb3c1" font-family="Arial" font-size="13" font-weight="950">'+s.l+'</text>'+
      '<text x="'+sx+'" y="'+(y+146)+'" fill="#f5f7f9" font-family="Arial Black,Arial" font-size="26" font-weight="1000">'+s.v+'</text>';
  });

  cfg.bars.forEach((b,i)=>{o+=statBar(barsX,barsY+i*23,barsW,b.label,b.value,b.ratio)});
  return o+'</g>';
}

function compactLeaderboard(rows,kind,x,y,w,rowH,offset=4){
  if(!rows.length)return "";
  const main=kind==="goals"?"G":kind==="assists"?"A":"P";
  let o='<g filter="url(#shadow)"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+(42+rowH*rows.length)+'" fill="url(#panel)" stroke="#ffbd00" stroke-opacity=".28"/>'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="42" fill="url(#gold)"/>'+
    '<text x="'+(x+20)+'" y="'+(y+27)+'" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">#</text>'+
    '<text x="'+(x+58)+'" y="'+(y+27)+'" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">SPELARE</text>'+
    '<text x="'+(x+w*.73)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">GP</text>'+
    '<text x="'+(x+w*.82)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">G</text>'+
    '<text x="'+(x+w*.90)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">A</text>'+
    '<text x="'+(x+w*.97)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">P</text>';
  rows.forEach((p,i)=>{const yy=y+42+i*rowH,cy=yy+rowH/2;
    o+='<rect x="'+x+'" y="'+yy+'" width="'+w+'" height="'+rowH+'" fill="'+(i%2?"#061722":"#04121c")+'"/>'+
      '<text x="'+(x+20)+'" y="'+(cy+6)+'" fill="#eaf0f4" font-family="Arial" font-size="16" font-weight="900">'+(i+offset)+'</text>'+
      '<text x="'+(x+58)+'" y="'+(cy-2)+'" fill="#fff" font-family="Arial" font-size="16" font-weight="900">'+esc(clip(p.display_gamertag,24))+'</text>'+
      '<text x="'+(x+58)+'" y="'+(cy+15)+'" fill="#7892a5" font-family="Arial" font-size="9" font-weight="700">'+esc(clip(p.team_name_in_league||"",28))+'</text>';
    [[p.gp,.73,"GP"],[p.g,.82,"G"],[p.a,.90,"A"],[p.p,.97,"P"]].forEach(([v,pos,l])=>o+='<text x="'+(x+w*pos)+'" y="'+(cy+6)+'" text-anchor="middle" fill="'+(l===main?"#ffbd00":"#e4ebef")+'" font-family="Arial" font-size="'+(l===main?18:15)+'" font-weight="'+(l===main?950:750)+'">'+v+'</text>');
  });
  return o+'</g>';
}
function goalieCardConfig(p,maxes){
  const svPct=(p.sv*(p.sv<=1?100:1)), gaa=p.gaa==null?null:Number(p.gaa);
  return {
    primaryLabel:"SV%",primaryValue:fmtDec(svPct,1),
    meta:"GP: "+p.gp+" · GAA: "+(gaa==null?"–":fmtDec(gaa))+" · SO: "+p.so,
    bars:[
      {label:"SV%",value:fmtDec(svPct,1),ratio:maxes.sv?svPct/maxes.sv:0},
      {label:"GAA",value:gaa==null?"–":fmtDec(gaa),ratio:gaa==null?0:(maxes.maxGaa?1-(gaa/maxes.maxGaa)*.8:0)},
      {label:"GP",value:String(p.gp),ratio:maxes.gp?p.gp/maxes.gp:0}
    ]
  };
}
function goalieCard(p,rank,x,y,w,h,logo,maxes){
  const portrait=portraitUrl(p),cfg=goalieCardConfig(p,maxes);
  const rankColor=rank===1?"#ffbd00":rank===2?"#d7dee7":"#b77d39";
  const big=w>=760&&h>=270, pad=big?18:14, accentW=big?8:6;
  const portraitW=big?205:Math.min(138,w*.27), portraitH=h-pad*2;
  const px=x+pad, py=y+pad, tx=px+portraitW+(big?28:18), right=x+w-pad;
  const logoSize=big?66:46, nameSize=big?34:23, teamSize=big?14:11;
  const mainSize=big?58:40, labelSize=big?14:11;
  const statTop=y+(big?112:92), primaryX=tx, colsStart=tx+(big?165:108), colGap=big?104:72;
  const barsY=y+h-(big?82:58), barW=Math.max(big?320:150,right-tx);
  const sv=(p.sv*(p.sv<=1?100:1)), gaa=p.gaa==null?"–":fmtDec(p.gaa);
  const values=[{l:"GP",v:p.gp},{l:"GAA",v:gaa},{l:"SO",v:p.so}];

  let o='<g filter="url(#shadow)">'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="18" fill="#081827" stroke="#35516a" stroke-width="1.4"/>'+
    '<rect x="'+x+'" y="'+y+'" width="'+accentW+'" height="'+h+'" rx="'+(accentW/2)+'" fill="'+rankColor+'"/>'+
    '<rect x="'+px+'" y="'+py+'" width="'+portraitW+'" height="'+portraitH+'" rx="14" fill="#0b1722" stroke="'+rankColor+'" stroke-width="2" stroke-opacity=".82"/>';
  if(portrait)o+=portraitImage(portrait,px+5,py+5,portraitW-10,portraitH-10);
  else o+=silhouetteSvg(px+6,py+6,portraitW-12,portraitH-12);

  if(logo)o+=img(logo,right-logoSize,y+18,logoSize);

  o+='<text x="'+tx+'" y="'+(y+(big?28:24))+'" fill="'+rankColor+'" font-family="Arial" font-size="'+(big?15:12)+'" font-weight="1000">#'+rank+'</text>'+
    '<text x="'+tx+'" y="'+(y+(big?58:46))+'" fill="#fff" font-family="Arial" font-size="'+nameSize+'" font-weight="1000">'+esc(clip(p.display_gamertag,big?28:20))+'</text>'+
    '<text x="'+tx+'" y="'+(y+(big?83:64))+'" fill="#92a8b8" font-family="Arial" font-size="'+teamSize+'" font-weight="850">'+esc(clip(p.team_name_in_league||"",30))+'</text>'+
    '<text x="'+primaryX+'" y="'+statTop+'" fill="#9fb3c1" font-family="Arial" font-size="'+labelSize+'" font-weight="950">SV%</text>'+
    '<text x="'+primaryX+'" y="'+(statTop+(big?52:38))+'" fill="#ffbd00" font-family="Arial Black,Arial" font-size="'+mainSize+'" font-weight="1000">'+fmtDec(sv,1)+'</text>';

  values.forEach((s,i)=>{
    const sx=colsStart+i*colGap;
    o+='<text x="'+sx+'" y="'+statTop+'" fill="#9fb3c1" font-family="Arial" font-size="'+labelSize+'" font-weight="950">'+s.l+'</text>'+
      '<text x="'+sx+'" y="'+(statTop+(big?48:36))+'" fill="#f5f7f9" font-family="Arial Black,Arial" font-size="'+(big?30:22)+'" font-weight="1000">'+s.v+'</text>';
  });

  cfg.bars.forEach((b,i)=>{o+=statBar(tx,barsY+i*(big?27:24),barW,b.label,b.value,b.ratio)});
  return o+'</g>';
}
function compactGoalies(rows,x,y,w,rowH,offset=4){
  if(!rows.length)return "";
  let o='<g filter="url(#shadow)"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+(42+rowH*rows.length)+'" fill="url(#panel)" stroke="#ffbd00" stroke-opacity=".28"/>'+
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="42" fill="url(#gold)"/>'+
    '<text x="'+(x+20)+'" y="'+(y+27)+'" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">#</text>'+
    '<text x="'+(x+58)+'" y="'+(y+27)+'" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">MÅLVAKT</text>'+
    '<text x="'+(x+w*.73)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">GP</text>'+
    '<text x="'+(x+w*.83)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">SV%</text>'+
    '<text x="'+(x+w*.92)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">GAA</text>'+
    '<text x="'+(x+w*.98)+'" y="'+(y+27)+'" text-anchor="middle" fill="#07121c" font-family="Arial" font-size="11" font-weight="950">SO</text>';
  rows.forEach((p,i)=>{const yy=y+42+i*rowH,cy=yy+rowH/2,sv=(p.sv*(p.sv<=1?100:1));
    o+='<rect x="'+x+'" y="'+yy+'" width="'+w+'" height="'+rowH+'" fill="'+(i%2?"#061722":"#04121c")+'"/>'+
      '<text x="'+(x+20)+'" y="'+(cy+6)+'" fill="#eaf0f4" font-family="Arial" font-size="16" font-weight="900">'+(i+offset)+'</text>'+
      '<text x="'+(x+58)+'" y="'+(cy-2)+'" fill="#fff" font-family="Arial" font-size="16" font-weight="900">'+esc(clip(p.display_gamertag,24))+'</text>'+
      '<text x="'+(x+58)+'" y="'+(cy+15)+'" fill="#7892a5" font-family="Arial" font-size="9" font-weight="700">'+esc(clip(p.team_name_in_league||"",28))+'</text>'+
      '<text x="'+(x+w*.73)+'" y="'+(cy+6)+'" text-anchor="middle" fill="#e4ebef" font-family="Arial" font-size="15" font-weight="750">'+p.gp+'</text>'+
      '<text x="'+(x+w*.83)+'" y="'+(cy+6)+'" text-anchor="middle" fill="#ffbd00" font-family="Arial" font-size="18" font-weight="950">'+fmtDec(sv,1)+'</text>'+
      '<text x="'+(x+w*.92)+'" y="'+(cy+6)+'" text-anchor="middle" fill="#e4ebef" font-family="Arial" font-size="15" font-weight="750">'+(p.gaa==null?"–":fmtDec(p.gaa))+'</text>'+
      '<text x="'+(x+w*.98)+'" y="'+(cy+6)+'" text-anchor="middle" fill="#e4ebef" font-family="Arial" font-size="15" font-weight="750">'+p.so+'</text>';
  });
  return o+'</g>';
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
function legacyBoard(kind){
  const metric=kind==="goals"?"g":kind==="assists"?"a":"p", rows=skaters(metric).slice(0,3), lm=logos();
  const {w:W,h:H}=format(), m=Math.round(W*.052), top=S.format==="story"?360:S.format==="wide"?315:300;
  const maxes={
    g:Math.max(1,...rows.map(p=>p.g)),a:Math.max(1,...rows.map(p=>p.a)),p:Math.max(1,...rows.map(p=>p.p)),gp:Math.max(1,...rows.map(p=>p.gp)),
    gpg:Math.max(.01,...rows.map(p=>p.gp?p.g/p.gp:0)),apg:Math.max(.01,...rows.map(p=>p.gp?p.a/p.gp:0)),ppg:Math.max(.01,...rows.map(p=>p.gp?p.p/p.gp:0))
  };
  let o="";
  if(S.format==="wide"){
    const gap=18, cardW=W-m*2, cardH=190;
    let y=top;
    rows.forEach((p,i)=>{o+=leaderboardWideCard(p,i+1,kind,m,y,cardW,cardH,lm.get(String(p.sports_gamer_team_id))||"",maxes);y+=cardH+gap});
  }else{
    const gap=S.format==="story"?26:18, cardW=W-m*2;
    const cardH=S.format==="story"?390:S.format==="square"?225:298;
    let y=top;
    rows.forEach((p,i)=>{o+=leaderboardCard(p,i+1,kind,m,y,cardW,cardH,lm.get(String(p.sports_gamer_team_id))||"",maxes);y+=cardH+gap});
  }
  return base(o);
}
function legacyGoalieSvg(){
  const rows=goalies().slice(0,3), lm=logos();
  const {w:W,h:H}=format(), m=Math.round(W*.052), top=S.format==="story"?360:S.format==="wide"?315:300;
  const svs=rows.map(p=>p.sv*(p.sv<=1?100:1)).filter(Number.isFinite), gaas=rows.map(p=>Number(p.gaa)).filter(Number.isFinite);
  const maxes={sv:Math.max(1,...svs),gp:Math.max(1,...rows.map(p=>p.gp)),maxGaa:Math.max(1,...gaas)};
  let o="";
  if(S.format==="wide"){
    const gap=18, cardW=W-m*2, cardH=190;
    let y=top;
    rows.forEach((p,i)=>{o+=goalieWideCard(p,i+1,m,y,cardW,cardH,lm.get(String(p.sports_gamer_team_id))||"",maxes);y+=cardH+gap});
  }else{
    const gap=S.format==="story"?26:18, cardW=W-m*2;
    const cardH=S.format==="story"?390:S.format==="square"?225:298;
    let y=top;
    rows.forEach((p,i)=>{o+=goalieCard(p,i+1,m,y,cardW,cardH,lm.get(String(p.sports_gamer_team_id))||"",maxes);y+=cardH+gap});
  }
  return base(o);
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
function svgText(x,y,value,size=24,color="#f4f7fa",weight=700,extra=""){
  return '<text x="'+x+'" y="'+y+'" fill="'+color+'" font-family="Arial, sans-serif" font-size="'+size+'" font-weight="'+weight+'" '+extra+'>'+esc(value)+'</text>';
}
function base(content){
  const {w:W,h:H}=format(),m=Math.round(W*.052),c=comp(),wide=S.format==="wide";
  const headingSize=Math.min(wide?82:70,(W-m*2)/Math.max(1,title().length)*1.55);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+defs()+
    '<defs><linearGradient id="editorialShade" x2="0" y2="1"><stop stop-color="#06111d" stop-opacity=".96"/><stop offset=".6" stop-color="#06111d" stop-opacity=".88"/><stop offset="1" stop-color="#06111d" stop-opacity=".96"/></linearGradient></defs>'+background(W,H)+
    '<rect width="'+W+'" height="'+H+'" fill="url(#editorialShade)"/><path d="M'+W*.68+' 0 L'+W+' 0 L'+W*.35+' '+H+' H'+W*.2+' Z" fill="#77bfff" opacity=".025"/>'+
    '<rect x="'+m+'" y="48" width="6" height="56" rx="3" fill="#ffbd00"/>'+
    (c.logo?'<image href="'+esc(c.logo)+'" x="'+(m+20)+'" y="40" width="72" height="72" preserveAspectRatio="xMidYMid meet"/>':'')+
    svgText(m+112,72,c.label,27,"#f4f7fa",800)+svgText(m+112,97,"SVENSK eHOCKEY",12,"#a2b6c9",700,'letter-spacing="2.4"')+
    svgText(W-m,78,"SWNWORKS / STUDIO",12,"#a2b6c9",700,'text-anchor="end" letter-spacing="2"')+
    '<line x1="'+m+'" y1="132" x2="'+(W-m)+'" y2="132" stroke="#7b9ab6" opacity=".24"/>'+
    svgText(m,178,subtitle(),15,"#ffcf4a",700,'letter-spacing="3"')+svgText(m,252,title(),headingSize,"#f4f7fa",900,'letter-spacing="-2"')+
    content+'<line x1="'+m+'" y1="'+(H-65)+'" x2="'+(W-m)+'" y2="'+(H-65)+'" stroke="#7b9ab6" opacity=".24"/>'+
    svgText(m,H-33,"SVENSK eHOCKEY · NHL 27",13,"#a2b6c9",700,'letter-spacing="1.5"')+
    svgText(W-m,H-33,"SWNWORKS",13,"#a2b6c9",700,'text-anchor="end" letter-spacing="2"')+'</svg>';
}
function editorialCard(p,rank,kind,x,y,w,h,logo,maxValue){
  const goalie=kind==="goalies",primary=goalie?fmtDec(p.sv*(p.sv<=1?100:1),1):kind==="goals"?p.g:kind==="assists"?p.a:p.p;
  const label=goalie?"RÄDDNINGAR %":kind==="goals"?"MÅL":kind==="assists"?"ASSIST":"POÄNG";
  const accent=rank===1?"#ffcf4a":rank===2?"#cbd9e5":"#bca58a",wide=w>1400;
  const pad=24,pw=wide?150:Math.min(196,h-36),px=x+pad,py=y+18,ph=h-36,tx=px+pw+28,right=x+w-28;
  const nameW=right-tx-82,nameSize=Math.min(38,nameW/Math.max(1,String(p.display_gamertag||"").length)*1.55);
  const vals=goalie?[['MATCHER',p.gp],['GAA',p.gaa==null?'–':fmtDec(p.gaa)],['NOLLOR',p.so]]:
    kind==="goals"?[['MATCHER',p.gp],['ASSIST',p.a],['POÄNG',p.p]]:kind==="assists"?[['MATCHER',p.gp],['MÅL',p.g],['POÄNG',p.p]]:[['MATCHER',p.gp],['MÅL',p.g],['ASSIST',p.a]];
  let o='<g><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="20" fill="#0c1c2c" stroke="#294055"/><rect x="'+x+'" y="'+(y+22)+'" width="5" height="'+(h-44)+'" rx="2" fill="'+accent+'"/>'+
    '<rect x="'+px+'" y="'+py+'" width="'+pw+'" height="'+ph+'" rx="12" fill="#122b3e"/>';
  const portrait=portraitUrl(p);o+=portrait?portraitImage(portrait,px+6,py+6,pw-12,ph-12):silhouetteSvg(px+6,py+6,pw-12,ph-12);
  o+='<rect x="'+(px+10)+'" y="'+(py+10)+'" width="40" height="32" rx="8" fill="'+accent+'"/>'+svgText(px+30,py+33,String(rank).padStart(2,'0'),19,"#07121c",900,'text-anchor="middle"');
  o+=svgText(tx,y+51,clip(p.display_gamertag,32),nameSize,"#fff",800)+svgText(tx,y+78,clip(p.team_name_in_league||"",42),17,"#a2b6c9",600);
  if(logo)o+=img(logo,right-58,y+20,58);
  const sy=wide?y+113:y+112,statsX=tx+(goalie?200:150),step=(right-statsX)/3;
  o+=svgText(tx,sy,label,12,"#a2b6c9",700,'letter-spacing="1.5"')+svgText(tx,sy+53,primary,goalie?52:64,accent,900);
  vals.forEach((v,i)=>{const sx=statsX+i*step;o+=svgText(sx,sy,v[0],11,"#a2b6c9",700,'letter-spacing="1"')+svgText(sx,sy+47,v[1],32,"#f4f7fa",800)});
  if(h>=255){const rate=goalie?null:p.gp?(kind==="goals"?p.g:kind==="assists"?p.a:p.p)/p.gp:0;
    o+='<line x1="'+tx+'" y1="'+(y+h-65)+'" x2="'+right+'" y2="'+(y+h-65)+'" stroke="#294055"/>'+svgText(tx,y+h-30,goalie?"RANKAD EFTER RÄDDNINGSPROCENT":label+" / MATCH",12,"#a2b6c9",700,'letter-spacing="1"')+svgText(right,y+h-28,goalie?"SV%":fmtDec(rate),20,accent,800,'text-anchor="end"');
  }
  return o+'</g>';
}
function editorialBoard(kind){
  const rows=kind==="goalies"?goalies().slice(0,3):skaters(kind==="goals"?"g":kind==="assists"?"a":"p").slice(0,3),lm=logos();
  const {w:W,h:H}=format(),m=Math.round(W*.052),top=S.format==="story"?360:300,gap=20;
  const cardH=Math.min(S.format==="story"?445:320,(H-95-top-gap*2)/3);
  let o="";rows.forEach((p,i)=>o+=editorialCard(p,i+1,kind,m,top+i*(cardH+gap),W-m*2,cardH,lm.get(String(p.sports_gamer_team_id))||""));
  if(!rows.length)o+=svgText(W/2,H/2,"Ingen matchstatistik ännu",30,"#a2b6c9",700,'text-anchor="middle"');
  return base(o);
}
function board(kind){return editorialBoard(kind)}
function goalieSvg(){return editorialBoard("goalies")}
function build(){return S.kind==="table"?tableSvg():S.kind==="groups"?groupsSvg():S.kind==="goalies"?goalieSvg():S.kind==="leaders"?leadersSvg():board(S.kind)}
function render(){
  sync();$("#preview").innerHTML=build();$("#sizeLabel").textContent=format().label;$("#kindLabel").textContent=TIT[S.kind];
  $("#stageField").hidden=S.kind==="table"||S.kind==="groups";$("#groupField").hidden=S.kind!=="table";$("#countField").hidden=true;
}
function safe(){return (comp().code+"-"+TIT[S.kind]).toLowerCase().replace(/å/g,"a").replace(/ä/g,"a").replace(/ö/g,"o").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function dl(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
function dataUrl(blob){return new Promise((ok,no)=>{const f=new FileReader();f.onload=()=>ok(f.result);f.onerror=no;f.readAsDataURL(blob)})}
async function inline(svg){
  const d=new DOMParser().parseFromString(svg,"image/svg+xml"),ims=[...d.querySelectorAll("image")];
  await Promise.all(ims.map(async el=>{const h=el.getAttribute("href")||"";if(!h||h.startsWith("data:"))return;try{const r=await fetch(h,{mode:"cors",cache:"no-store",signal:AbortSignal.timeout(8000)});if(!r.ok)throw 0;el.setAttribute("href",await dataUrl(await r.blob()))}catch(e){console.warn("Bild kunde inte bäddas in",h);el.remove()}}));
  return new XMLSerializer().serializeToString(d.documentElement);
}
async function expSvg(){const s=await inline(build());dl(new Blob([s],{type:"image/svg+xml;charset=utf-8"}),safe()+".svg")}
async function expPng(){const s=await inline(build()),{w,h}=format(),u=URL.createObjectURL(new Blob([s],{type:"image/svg+xml;charset=utf-8"})),im=new Image();try{await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=u});const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.drawImage(im,0,0,w,h);const b=await new Promise(ok=>c.toBlob(ok,"image/png",1));if(!b)throw new Error("PNG-export misslyckades");dl(b,safe()+".png")}finally{URL.revokeObjectURL(u)}}

$$("[data-kind]").forEach(b=>b.onclick=()=>{$$("[data-kind]").forEach(x=>x.classList.toggle("active",x===b));S.kind=b.dataset.kind;render()});
["stage","group","count","format","bg","logos"].forEach(id=>$("#"+id).addEventListener("change",render));
["title","subtitle"].forEach(id=>$("#"+id).addEventListener("input",render));
$("#league").onchange=()=>{S.league=Number($("#league").value||527);S.group=null;load()};
async function exportGraphic(type){
  const button=$("#"+type),label=button.textContent;
  $("#png").disabled=$("#svg").disabled=true;button.textContent="Exporterar…";
  try{await (type==="png"?expPng():expSvg())}catch(e){alert(e.message)}
  finally{$("#png").disabled=$("#svg").disabled=false;button.textContent=label}
}
$("#refresh").onclick=load;$("#svg").onclick=()=>exportGraphic("svg");$("#png").onclick=()=>exportGraphic("png");
render();load();
})();

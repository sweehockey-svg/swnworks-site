/* First-party, approved-account feature measurement. Never collect form values. */
(() => {
 'use strict';
 let client,context,visit=crypto.randomUUID(),lastPage='',lastUser='',lastInput=Date.now(),visibleSince=document.hidden?0:Date.now();
 const sent=new Map();
 function current(){const c=context?.();return c?.user&&c.approved?c:null;}
 function notice(c){
  let node=document.getElementById('cockpitUsageNotice');
  if(!node){node=document.createElement('aside');node.id='cockpitUsageNotice';node.style.cssText='flex:0 0 auto;padding:9px 20px;background:#10242f;color:#bacdd7;font:12px/1.5 system-ui;border-bottom:1px solid #294654';(document.querySelector('.app-shell')||document.body).prepend(node);}
  node.replaceChildren(document.createTextNode('Användningsmätning: öppnade vyer, lag, spelarkort och ungefärlig aktiv tid sparas i 90 dagar för utveckling och support. Bara administratörer kan se uppgifterna. Inga anteckningstexter eller sökningar registreras. Kontakt: '));
  const contact=document.createElement('a');contact.href='mailto:info@swnworks.se';contact.textContent='info@swnworks.se';contact.style.color='#ffd24d';node.append(contact);
  if(c.admin){const a=document.createElement('a');a.href='/commentator-cockpit/admin/';a.textContent=' · Öppna användningsadmin ↗';a.style.color='#ffd24d';node.append(a);}
 }
 async function track(event,feature,extra={}){
  const c=current();if(!c)return;
  const key=JSON.stringify([c.user.id,event,feature,c.league,c.team_id,extra.player_id]);
  if(Date.now()-(sent.get(key)||0)<3000)return;sent.set(key,Date.now());
  try{await client.functions.invoke('commentator-usage',{body:{action:'record',event,feature,league:c.league||'legacy',team_id:c.team_id||null,player_id:extra.player_id||null,visit_id:visit}});}catch{/* Measurement must never block the cockpit. */}
 }
 function check(){
  const c=current();
  if(!c){lastUser='';lastPage='';document.getElementById('cockpitUsageNotice')?.remove();return;}
  if(lastUser!==c.user.id){lastUser=c.user.id;lastPage='';visit=crypto.randomUUID();sent.clear();notice(c);}
  const page=[c.league,c.team_id||'home'].join(':');
  if(page!==lastPage){lastPage=page;void track('page_open',c.team_id?'cockpit':'home');}
 }
 function attach(sb,getContext){
  if(client)return;client=sb;context=getContext;
  for(const type of ['pointerdown','keydown','scroll','touchstart'])document.addEventListener(type,()=>{lastInput=Date.now();},{passive:true,capture:true});
  document.addEventListener('visibilitychange',()=>{visibleSince=document.hidden?0:Date.now();});
  setInterval(check,2000);check();
  setInterval(()=>{if(!document.hidden&&visibleSince&&Date.now()-visibleSince>=55000&&Date.now()-lastInput<120000)void track('active_minute','cockpit');},60000);
 }
 window.CockpitUsage=Object.freeze({attach,track});
})();

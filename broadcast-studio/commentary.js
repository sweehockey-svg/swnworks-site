/* Two-commentator entry point. Never requests microphone access on page load. */
const commentaryEntryBase=document.currentScript?.src||new URL('commentary.js',document.baseURI).href;
(async()=>{
 'use strict';
 const params=new URLSearchParams(location.search),presenter=document.body.dataset.commentaryRole==='presenter',viewer=!presenter&&!!document.getElementById('broadcast');
 if(!viewer&&(params.get('obs')==='1'||params.get('viewer')==='1'))return;
 const anchor=presenter?document.getElementById('commentatorControls'):viewer?document.querySelector('.tv-video .toolbar'):document.querySelector('.scene-dock');
 if(!anchor)return;
 for(const [name,ready] of [['commentary-duo.js',()=>window.CommentaryDuo],['commentary-engine.js',()=>window.createCommentaryEngine]]){
  if(ready())continue;
  try{await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL(name+'?v=20261022-interview-1',commentaryEntryBase).href;script.onload=resolve;script.onerror=reject;document.head.append(script);});}
  catch{const error=document.createElement('p');error.textContent='Kommentatorsverktyget kunde inte laddas. Ladda om sidan.';anchor.after(error);return;}
 }
 const group=document.createElement('div');group.className='commentary-duo';anchor.after(group);
 const engines=[],manager=window.CommentaryDuo.createManager();
 let audienceContext,audienceLimiter;
 const audioOutput=()=>{
  if(!audienceContext){audienceContext=new (window.AudioContext||window.webkitAudioContext)();audienceLimiter=audienceContext.createDynamicsCompressor();audienceLimiter.threshold.value=-6;audienceLimiter.knee.value=6;audienceLimiter.ratio.value=12;audienceLimiter.attack.value=.003;audienceLimiter.release.value=.15;audienceLimiter.connect(audienceContext.destination);}
  return {context:audienceContext,destination:audienceLimiter};
 };
 window.addEventListener('pagehide',()=>{void audienceContext?.close();},{once:true});
 if(presenter){
  let invite,slot;
  try{invite=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(location.hash.slice(1)),c=>c.charCodeAt(0))));slot=Number(invite.slot??0);if(![0,1,2].includes(slot))throw Error();}
  catch{group.textContent='Ogiltig kommentatorslänk. Be om en ny privat länk.';return;}
  if(slot===2){const heading=document.querySelector('main>h1'),intro=document.querySelector('main>.intro');if(heading)heading.textContent='Intervju i Match-TV';if(intro)intro.textContent='Du är intervjugäst. Starta mikrofonen i väntrummet och använd hörlurar. Studion tar in dig i sändning när det är dags.';}
  engines.push(window.createCommentaryEngine({slot,manager,anchor:group,invite}));
  const monitor=document.createElement('div');monitor.className='commentary-monitor';group.append(monitor);
  for(const other of [0,1,2].filter(other=>other!==slot))engines.push(window.createCommentaryEngine({slot:other,manager,anchor:monitor,listenOnly:true,monitor:true,monitorInvite:invite,audioOutput}));
 }else{
  if(viewer){
   const toolbar=document.createElement('div');toolbar.className='commentary-actions';
   const listen=document.createElement('button');listen.type='button';listen.textContent='Lyssna på kommentering och intervju';
   const stop=document.createElement('button');stop.type='button';stop.textContent='Stäng av rösterna';
   listen.onclick=()=>engines.forEach(e=>e?.listen());stop.onclick=()=>engines.forEach(e=>e?.stopListening());
   toolbar.append(listen,stop);group.append(toolbar);
  }else{
   const note=document.createElement('p');note.className='commentary-duo-note';note.textContent='Två kommentatorer: skapa en privat länk per plats. Använd hörlurar. Varje kommentator kan lyssna på kollegan på sin sida. Mikrofonknappen här skickar ljud till tittarna, den är inte ett lokalt ljudprov.';group.append(note);
  }
  for(const slot of [0,1,2])engines.push(window.createCommentaryEngine({slot,manager,anchor:group,listenOnly:viewer,audioOutput:viewer?audioOutput:undefined}));
  if(!viewer)window.__sehStopCommentary=async()=>{await Promise.all(engines.map(e=>e?.stop()));window.__sehCommentarySession=null;};
 }
})();

/* Two independently signed microphone slots; TURN keeps the existing room authority. */
(()=>{
 'use strict';
 const TTL=21600000;
 const valid=s=>!!s&&/^[a-f0-9-]{36}$/.test(s.room)&&s.publicKey?.kty==='EC'&&s.publicKey?.crv==='P-256'&&typeof s.publicKey.x==='string'&&Number.isFinite(s.startedAt)&&s.startedAt<=Date.now()+60000&&Date.now()-s.startedAt<TTL;
 function select(root,slot){
  if(!valid(root)||![0,1,2].includes(slot))return null;
  if(root.version!==2)return slot===0?root:null;
  const entry=root.slots?.[slot];
  return entry&&entry.publicKey?.kty==='EC'&&entry.publicKey?.crv==='P-256'?{room:root.room,startedAt:root.startedAt,publicKey:entry.publicKey,slot}:null;
 }
 function createManager(){
  let root=null,rootKeys=null,admissionKeys=null,pending=null,localSlot=null;
  const publish=()=>window.__sehPublishBroadcastState?.();
  const setSlot=(slot,entry,write=true)=>{
   if(localSlot===slot&&!entry)localSlot=null;
   const current=window.__sehCommentarySession;
   if(!root||current?.room!==root.room)return;
   root={...current,slots:[...(current.slots||[null,null])]};root.slots[slot]=entry;
   window.__sehCommentarySession=root.slots.some(Boolean)?root:null;
   if(write)publish();
  };
  async function ensure(){
   if(rootKeys&&valid(root)&&window.__sehCommentarySession?.room===root.room)return;
   if(pending)return pending;
   pending=(async()=>{
    if(valid(window.__sehCommentarySession)&&!window.confirm('En ljudsession finns redan. Skapa en ny? Gamla länkar, båda kommentatorerna och eventuell intervjugäst avslutas när du skapar nya länkar.'))throw Error('Behöll befintlig kommentatorsession.');
    rootKeys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
    admissionKeys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
    root={version:2,room:crypto.randomUUID(),publicKey:await crypto.subtle.exportKey('jwk',rootKeys.publicKey),admissionKey:await crypto.subtle.exportKey('jwk',admissionKeys.publicKey),startedAt:Date.now(),slots:[null,null,null]};
    window.__sehCommentarySession=root;
   })();
   try{await pending;}finally{pending=null;}
  }
  async function createSlot(slot){
   if(![0,1,2].includes(slot))throw Error('Ogiltig kommentatorsplats');
   await ensure();
   const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
   const publicKey=await crypto.subtle.exportKey('jwk',pair.publicKey);
   // Private keys live only in this page and the private invitation fragment.
   setSlot(slot,{publicKey,...(slot===2?{onAir:false}:{})},false);
   return {room:root.room,startedAt:root.startedAt,publicKey,privateKey:await crypto.subtle.exportKey('jwk',pair.privateKey),relayPrivateKey:await crypto.subtle.exportKey('jwk',rootKeys.privateKey),slot,version:2};
  }
  async function admission(onAir){
   const current=window.__sehCommentarySession;
   if(!admissionKeys||!current?.slots?.[2]||current.room!==root?.room)throw Error('Skapa en ny intervjulänk i den här fliken först.');
   const timestamp=Math.max(Date.now(),Number(current.slots[2].admissionAt||0)+1);
   setSlot(2,{...current.slots[2],onAir:onAir===true,admissionAt:timestamp});
   const payload={type:'admission',room:current.room,slot:2,onAir:onAir===true,timestamp,key:current.slots[2].publicKey.x};
   const signature=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},admissionKeys.privateKey,new TextEncoder().encode(JSON.stringify(payload))))));
   return {payload,signature};
  }
  return {createSlot,setSlot,publish,admission,claimLocal(slot){if(localSlot!==null&&localSlot!==slot)throw Error('En lokal mikrofon används redan. Skicka den andra länken till kollegan.');localSlot=slot;}};
 }
 const api={valid,select,createManager};
 if(typeof module!=='undefined')module.exports=api;
 if(typeof window!=='undefined')window.CommentaryDuo=api;
})();

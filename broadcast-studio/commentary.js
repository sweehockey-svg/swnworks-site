/* Audio-only commentary. Supabase carries signalling, never microphone audio. */
(() => {
  'use strict';
  const presenter=document.body.dataset.commentaryRole==='presenter';
  const viewer=!presenter&&!!document.getElementById('broadcast');
  const params=new URLSearchParams(location.search);
  if(!viewer&&(params.get('obs')==='1'||params.get('viewer')==='1'))return;
  const MAX_PEERS=50, RATE=24000;
  const ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'}]};
  const peers=new Map(), id=crypto.randomUUID();
  const cfg=window.EHOCKEY_CONFIG||{};
  let client,channel,stream,keys,session,starting=false,disposed=false,generation=0;
  let ctx,source,delay,gain,currentTrack,receiverAudio,viewerEnabled=false,joinedAt=0,lastRequest=0;
  let pollTimer,retryTimer,startingToken=0,invite=null,joining=false,expiryTimer;
  const panel=document.createElement('section');
  panel.className='commentary-panel';
  panel.setAttribute('aria-label',viewer?'Kommentatorsljud':'Mikrofon till Match-TV');
  panel.innerHTML=viewer
    ? '<h3>KOMMENTERING · BETA</h3><p class="commentary-status" role="status" aria-live="polite">Kontrollerar kommenteringen…</p><div class="commentary-actions"><button type="button" class="commentary-listen" aria-pressed="false">Lyssna på kommentering</button><label>Röstvolym<input class="commentary-volume" type="range" min="0" max="100" value="100"></label><label>Fördröj rösten <output class="commentary-delay-value">0 s</output><input class="commentary-delay" type="range" min="0" max="15" step="0.5" value="0"></label></div><small>Matchljudet styrs med ”Slå på ljud”. Om rösten ligger före bilden, öka fördröjningen. Ligger rösten efter, prova att ladda om matchbilden.</small>'
    : '<h3>MIKROFON TILL MATCH-TV · BETA</h3><p class="commentary-status" role="status" aria-live="polite">Mikrofon av</p><div class="commentary-actions"><button type="button" class="commentary-start">Starta kommentering</button><button type="button" class="commentary-mute" disabled aria-pressed="false">Tysta mikrofon</button><button type="button" class="commentary-stop" disabled>Stoppa</button></div><small>Endast rösten skickas till Match-TV. Använd hörlurar och låt den här fliken vara öppen. Mikrofonen fortsätter för den pågående sändningen när du förbereder nästa match. Testläge: upp till 50 anslutningar, men nätet kan begränsa antalet och vissa nät kräver en ljudreläserver som inte ingår här.</small>';
  const anchor=presenter?document.getElementById('commentatorControls'):viewer?document.querySelector('.tv-video .toolbar'):document.querySelector('.scene-dock');
  if(!anchor)return;
  anchor.after(panel);
  const $=s=>panel.querySelector(s), status=t=>$('.commentary-status').textContent=t;
  const bytes=value=>Uint8Array.from(atob(value),x=>x.charCodeAt(0));
  const base64=value=>btoa(String.fromCharCode(...new Uint8Array(value)));
  const encode=value=>new TextEncoder().encode(JSON.stringify(value));
  const signed=async payload=>({payload,signature:base64(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,encode(payload)))});
  async function verified(message){
    if(!session||!message?.payload||typeof message.signature!=='string'||message.signature.length>200)return false;
    try{
      const key=await crypto.subtle.importKey('jwk',session.publicKey,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
      return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,bytes(message.signature),encode(message.payload));
    }catch{return false;}
  }
  async function connect(room,onMessage){
    if(!client){
      const lib=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/+esm');
      client=lib.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{storageKey:'seh-commentary-guest',persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    }
    const next=client.channel('seh-commentary:'+room,{config:{broadcast:{self:false}}});
    next.on('broadcast',{event:'signal'},({payload})=>{
      Promise.resolve(onMessage(payload)).catch(()=>status('Ljudanslutningen misslyckades. Försök igen.'));
    });
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Anslutningen tog för lång tid')),12000);
      next.subscribe(state=>{
        if(state==='SUBSCRIBED'){clearTimeout(timer);resolve();}
        else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(state)){clearTimeout(timer);reject(new Error('Ljudservern kunde inte nås'));}
      });
    }).catch(async error=>{await client.removeChannel(next);throw error;});
    return next;
  }
  const send=(payload,ch=channel)=>ch?.send({type:'broadcast',event:'signal',payload});
  function closePeer(peerId){
    const p=peers.get(peerId);if(!p)return;
    clearTimeout(p.timer);peers.delete(peerId);p.pc.close();
    if(!viewer&&session)hostStatus();
    if(viewer&&!disposed){detachAudio();status('Kommentatorn är frånkopplad. Försöker igen.');}
  }
  function hostStatus(){
    const count=[...peers.values()].filter(p=>p.pc.connectionState==='connected').length;
    status((stream?.getAudioTracks()[0]?.enabled?'Mikrofon på':'Mikrofon tyst')+' · '+count+' lyssnare anslutna');
    if(presenter&&session&&keys)void signed({type:'host-status',room:session.room,live:true,muted:!stream?.getAudioTracks()[0]?.enabled,count}).then(message=>send(message));
  }
  function watch(pc,peerId){
    const p={pc,timer:setTimeout(()=>closePeer(peerId),20000)};peers.set(peerId,p);
    pc.onconnectionstatechange=()=>{
      if(pc.connectionState==='connected'){
        clearTimeout(p.timer);if(viewer){joinedAt=Date.now();status('Kommentering ansluten');}else hostStatus();
      }else if(['failed','closed'].includes(pc.connectionState)){
        closePeer(peerId);
        if(viewer)status('Ingen direkt ljudanslutning. Försöker igen; nätet kan kräva en reläserver.');
      }else if(pc.connectionState==='disconnected'){
        if(viewer)status('Ljudanslutningen är bruten. Försöker återansluta.');
        p.timer=setTimeout(()=>closePeer(peerId),10000);
      }
    };
  }
  function iceComplete(pc){
    if(pc.iceGatheringState==='complete')return Promise.resolve();
    return new Promise(resolve=>{
      const done=()=>{clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',changed);resolve();};
      const changed=()=>{if(pc.iceGatheringState==='complete')done();};
      const timer=setTimeout(done,4000);pc.addEventListener('icegatheringstatechange',changed);
    });
  }
  async function hostSignal(message){
    if(message?.payload?.type==='end'&&message.payload.room===session?.room&&await verified(message)){await stopHost(false);status('Studion har avslutat kommenteringen. Be om en ny länk.');invite=null;return;}
    if(!presenter&&message?.payload?.type==='host-status'&&message.payload.room===session?.room&&await verified(message)){
      status(message.payload.live?'Kommentator '+(message.payload.muted?'tyst':'ansluten')+' · '+Number(message.payload.count||0)+' lyssnare':'Kommentatorns mikrofon är av');return;
    }
    if(!session||!stream||!message||message.room!==session.room)return;
    if(message.type==='answer'){
      const p=peers.get(message.from);
      if(p&&p.pc.signalingState==='have-local-offer'&&typeof message.sdp==='string'&&message.sdp.length<30000)
        await p.pc.setRemoteDescription({type:'answer',sdp:message.sdp});
      return;
    }
    if(message.type!=='join'||typeof message.from!=='string'||!/^[a-f0-9-]{36}$/.test(message.from)||peers.has(message.from)||peers.size>=MAX_PEERS)return;
    const activeSession=session,pc=new RTCPeerConnection(ICE);watch(pc,message.from);
    try{
      const sender=pc.addTrack(stream.getAudioTracks()[0],stream);
      const settings=sender.getParameters();settings.encodings=[{maxBitrate:RATE}];
      await sender.setParameters(settings).catch(()=>{});
      const offer=await pc.createOffer();
      const opus=offer.sdp.match(/a=rtpmap:(\d+) opus\/48000/i);
      if(opus)offer.sdp=offer.sdp.replace(new RegExp('(a=fmtp:'+opus[1]+' [^\\r\\n]*)'),'$1;maxaveragebitrate=24000;stereo=0;usedtx=1');
      await pc.setLocalDescription(offer);await iceComplete(pc);
      if(session!==activeSession||!peers.has(message.from))return;
      await send(await signed({type:'offer',room:session.room,to:message.from,sdp:pc.localDescription.sdp}));
    }catch{closePeer(message.from);}
  }
  async function stopHost(publish=true){
    clearTimeout(expiryTimer);
    if(channel&&keys&&session){const outgoing=channel;void signed(presenter?{type:'host-status',room:session.room,live:false,count:0}:{type:'end',room:session.room}).then(message=>send(message,outgoing));}
    startingToken++;starting=false;
    stream?.getTracks().forEach(track=>track.stop());stream=null;
    session=null;keys=null;
    for(const peerId of [...peers.keys()])closePeer(peerId);
    const old=channel;channel=null;if(old&&client)void client.removeChannel(old);
    if(!presenter){window.__sehCommentarySession=null;if(publish)window.__sehPublishBroadcastState?.();}
    const oldLink=panel.querySelector('.commentary-invite');
    if(oldLink){oldLink.hidden=true;oldLink.querySelector('input').value='';}
    $('.commentary-start').disabled=false;$('.commentary-stop').disabled=true;
    $('.commentary-mute').disabled=true;$('.commentary-mute').textContent='Tysta mikrofon';
    $('.commentary-mute').setAttribute('aria-pressed','false');status('Mikrofon av');
  }
  async function startHost(){
    if(starting||stream)return;
    if(presenter&&(!invite||Date.now()-invite.startedAt>21600000)){status('Kommentatorslänken saknas eller har gått ut. Be studion om en ny länk.');return;}
    if(!presenter&&!window.__sehStudioHasProgram?.()){status('Visa först en match i sändning. Mikrofonen är fortfarande av.');return;}
    if(!presenter&&session){await stopHost();}
    if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){status('Mikrofon kräver en webbläsare med WebRTC och en säker anslutning.');return;}
    const token=++startingToken;starting=true;$('.commentary-start').disabled=true;$('.commentary-stop').disabled=false;
    status('Välj mikrofon och tillåt åtkomst…');
    try{
      const captured=await navigator.mediaDevices.getUserMedia({video:false,audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      if(token!==startingToken||disposed){captured.getTracks().forEach(t=>t.stop());return;}
      stream=captured;
      keys=presenter?{privateKey:await crypto.subtle.importKey('jwk',invite.privateKey,{name:'ECDSA',namedCurve:'P-256'},false,['sign'])}:await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
      const nextSession=presenter?{room:invite.room,publicKey:invite.publicKey,startedAt:invite.startedAt}:{room:crypto.randomUUID(),publicKey:await crypto.subtle.exportKey('jwk',keys.publicKey),startedAt:Date.now()};
      const next=await connect(nextSession.room,hostSignal);
      if(token!==startingToken||disposed){void client.removeChannel(next);return;}
      channel=next;session=nextSession;if(!presenter)window.__sehCommentarySession=nextSession;
      expiryTimer=setTimeout(()=>{void stopHost();if(presenter)invite=null;},Math.max(0,nextSession.startedAt+21600000-Date.now()));
      for(const track of stream.getTracks())track.onended=()=>void stopHost();
      if(!presenter)window.__sehPublishBroadcastState();$('.commentary-mute').disabled=false;hostStatus();
    }catch(error){await stopHost();status(error.name==='NotAllowedError'?'Mikrofonåtkomst nekades. Ingen kommentering skickas.':'Kunde inte starta kommenteringen: '+String(error.message||error).slice(0,130));}
    finally{if(token===startingToken)starting=false;}
  }
  function detachAudio(){source?.disconnect();source=null;currentTrack=null;if(gain)gain.gain.value=0;if(receiverAudio){receiverAudio.pause();receiverAudio.srcObject=null;receiverAudio.remove();receiverAudio=null;}}
  async function stopViewer(){
    generation++;joining=false;detachAudio();
    const old=channel;channel=null;
    for(const peerId of [...peers.keys()])closePeer(peerId);
    if(old){void send({type:'leave',room:session?.room,from:id},old);void client.removeChannel(old);}
  }
  async function viewerSignal(message){
    if(!viewerEnabled||!session||message?.payload?.room!==session.room||message.payload.to!==id||message.payload.type!=='offer')return;
    const activeSession=session,token=generation;
    if(!await verified(message)||session!==activeSession||token!==generation||peers.size)return;
    if(typeof message.payload.sdp!=='string'||message.payload.sdp.length>30000)return;
    const pc=new RTCPeerConnection(ICE);watch(pc,'host');
    pc.ontrack=event=>{
      if(!viewerEnabled||token!==generation||!ctx)return;
      detachAudio();currentTrack=event.track;
      delay.disconnect();delay=ctx.createDelay(15);delay.delayTime.value=Number($('.commentary-delay').value);delay.connect(gain);gain.gain.value=Number($('.commentary-volume').value)/100;
      const received=new MediaStream([event.track]);
      // Keep Chromium's remote-media decoder running while Web Audio handles volume/delay.
      receiverAudio=document.createElement('audio');receiverAudio.muted=true;receiverAudio.autoplay=true;receiverAudio.hidden=true;receiverAudio.srcObject=received;panel.append(receiverAudio);
      void receiverAudio.play().catch(()=>status('Tryck av och på kommenteringen för att starta ljudet.'));
      source=ctx.createMediaStreamSource(received);source.connect(delay);
      void ctx.resume();
    };
    try{
      await pc.setRemoteDescription({type:'offer',sdp:message.payload.sdp});
      await pc.setLocalDescription(await pc.createAnswer());await iceComplete(pc);
      if(token!==generation)return;
      await send({type:'answer',room:activeSession.room,from:id,sdp:pc.localDescription.sdp});
    }catch{closePeer('host');status('Kommenteringen kunde inte anslutas. Försöker igen.');}
  }
  async function joinViewer(){
    if(!session||!viewerEnabled||channel||disposed||joining)return;
    joining=true;
    const token=generation,activeSession=session;
    status('Ansluter till kommentatorn…');
    try{
      const next=await connect(activeSession.room,viewerSignal);
      if(token!==generation||disposed){void client.removeChannel(next);return;}
      channel=next;lastRequest=Date.now();await send({type:'join',room:session.room,from:id});
    }catch{status('Kunde inte nå kommenteringen. Försöker igen.');}
    finally{if(token===generation)joining=false;}
  }
  async function poll(){
    if(disposed)return;
    try{
      const res=await fetch(cfg.supabaseUrl+'/rest/v1/broadcast_studio_state?channel=eq.sec21-bronze-test&select=state',{headers:{apikey:cfg.supabasePublishableKey},cache:'no-store',signal:AbortSignal.timeout(8000)});
      if(!res.ok)throw new Error('HTTP '+res.status);
      const rows=await res.json(),next=rows?.[0]?.state?.commentary;
      const valid=next&&/^[a-f0-9-]{36}$/.test(next.room)&&next.publicKey?.kty==='EC'&&next.publicKey?.crv==='P-256'&&Number.isFinite(next.startedAt)&&Date.now()-next.startedAt<21600000;
      if((valid?next.room:null)!==(session?.room||null)){
        await stopViewer();session=valid?next:null;
        if(!session)status('Ingen kommentering pågår');
        else if(!viewerEnabled)status('Kommentering finns · tryck för att lyssna');
      }
      if(!valid&&!session)status('Ingen kommentering pågår');
      $('.commentary-listen').disabled=!session&&!viewerEnabled;
      if(session&&viewerEnabled)void joinViewer();
    }catch{status('Kontakten med kommenteringen är bruten. Matchbilden påverkas inte.');}
    finally{if(!disposed)pollTimer=setTimeout(poll,10000);}
  }
  if(viewer){
    $('.commentary-listen').onclick=async()=>{
      viewerEnabled=!viewerEnabled;
      $('.commentary-listen').textContent=viewerEnabled?'Stäng av kommentering':'Lyssna på kommentering';
      $('.commentary-listen').setAttribute('aria-pressed',String(viewerEnabled));
      if(!viewerEnabled){await stopViewer();status(session?'Kommentering av · tryck för att lyssna':'Ingen kommentering pågår');return;}
      try{
        if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();delay=ctx.createDelay(15);gain=ctx.createGain();delay.connect(gain);gain.connect(ctx.destination);}
        gain.gain.value=Number($('.commentary-volume').value)/100;delay.delayTime.value=Number($('.commentary-delay').value);
        await ctx.resume();await joinViewer();
      }catch{viewerEnabled=false;$('.commentary-listen').textContent='Lyssna på kommentering';$('.commentary-listen').setAttribute('aria-pressed','false');status('Kunde inte starta ljudet. Prova Chrome eller Edge.');}
    };
    $('.commentary-volume').oninput=()=>{if(gain)gain.gain.setTargetAtTime(Number($('.commentary-volume').value)/100,ctx.currentTime,0.05);};
    $('.commentary-delay').oninput=()=>{
      const value=Number($('.commentary-delay').value);$('.commentary-delay-value').textContent=value+' s';
      if(delay)delay.delayTime.setTargetAtTime(value,ctx.currentTime,0.1);
    };
    retryTimer=setInterval(()=>{
      if(!session||!viewerEnabled||disposed)return;
      if(channel&&!peers.size&&Date.now()-lastRequest>12000){lastRequest=Date.now();void send({type:'join',room:session.room,from:id});}
      else if(!channel)void joinViewer();
    },5000);
    void poll();
  }else{
    if(presenter){
      panel.querySelector('h3').textContent='DIN MIKROFON · MATCH-TV';
      panel.querySelector('small').textContent='Använd hörlurar. Starta kommenteringen när studion är redo. Endast mikrofonljudet skickas till tittarna; ingen video laddas upp från din dator. Låt sidan vara öppen. Tittarna justerar eventuell ljudfördröjning i Match-TV.';
      try{
        invite=JSON.parse(new TextDecoder().decode(bytes(location.hash.slice(1))));
        if(!/^[a-f0-9-]{36}$/.test(invite.room)||invite.privateKey?.kty!=='EC'||!invite.privateKey?.d||invite.publicKey?.crv!=='P-256'||!Number.isFinite(invite.startedAt)||Date.now()-invite.startedAt>21600000)throw new Error();
        status('Redo · mikrofonen är av');
      }catch{invite=null;$('.commentary-start').disabled=true;status('Ogiltig kommentatorslänk. Be studion om en ny länk.');}
    }else{
      $('.commentary-start').textContent='Testa mikrofon här';
      const inviteButton=document.createElement('button');inviteButton.type='button';inviteButton.textContent='Skapa länk till kommentator';
      $('.commentary-actions').prepend(inviteButton);
      const linkBox=document.createElement('div');linkBox.hidden=true;linkBox.className='commentary-invite';
      linkBox.innerHTML='<label>Privat kommentatorslänk<input type="text" readonly aria-label="Kommentatorslänk"></label><button type="button">Kopiera länk</button><small>Skicka länken privat till kommentatorn. Den ger mikrofonåtkomst till den här ljudsessionen, gäller i sex timmar och avslutas med Stoppa. Personen kan vara på en annan ort.</small>';
      panel.append(linkBox);
      linkBox.querySelector('button').onclick=async()=>{try{await navigator.clipboard.writeText(linkBox.querySelector('input').value);status('Länken kopierad. Skicka den privat till kommentatorn.');}catch{linkBox.querySelector('input').select();status('Markera och kopiera länken med Ctrl+C.');}};
      inviteButton.onclick=async()=>{
        if(starting)return;
        if(!window.__sehStudioHasProgram?.()){status('Visa först en match i sändning.');return;}
        inviteButton.disabled=true;
        try{
          await stopHost();keys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
          const nextSession={room:crypto.randomUUID(),publicKey:await crypto.subtle.exportKey('jwk',keys.publicKey),startedAt:Date.now()};
          const secret={...nextSession,privateKey:await crypto.subtle.exportKey('jwk',keys.privateKey)};
          channel=await connect(nextSession.room,hostSignal);session=nextSession;
          expiryTimer=setTimeout(()=>void stopHost(),21600000);
          window.__sehCommentarySession=nextSession;window.__sehPublishBroadcastState();
          const url=new URL('commentator.html',document.baseURI);url.hash=base64(encode(secret));
          linkBox.querySelector('input').value=url.href;linkBox.hidden=false;
          $('.commentary-stop').disabled=false;status('Kommentatorslänk klar · väntar på kommentatorn');
        }catch(error){await stopHost();status('Kunde inte skapa kommentatorslänken: '+String(error.message).slice(0,100));}
        finally{inviteButton.disabled=false;}
      };
    }
    $('.commentary-start').onclick=startHost;$('.commentary-stop').onclick=()=>void stopHost();
    $('.commentary-mute').onclick=()=>{
      const track=stream?.getAudioTracks()[0];if(!track)return;track.enabled=!track.enabled;
      $('.commentary-mute').textContent=track.enabled?'Tysta mikrofon':'Slå på mikrofon';
      $('.commentary-mute').setAttribute('aria-pressed',String(!track.enabled));hostStatus();
    };
  }
  window.addEventListener('pagehide',()=>{
    disposed=true;clearTimeout(pollTimer);clearInterval(retryTimer);
    if(viewer){void stopViewer();void ctx?.close();}else void stopHost(false);
  },{once:true});
})();

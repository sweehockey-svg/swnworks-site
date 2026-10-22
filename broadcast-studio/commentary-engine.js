/* Audio-only commentary. Supabase carries signalling, never microphone audio. */
window.createCommentaryEngine=function(options){
  'use strict';
  const {slot,manager,listenOnly=false,monitor=false}=options;
  const interview=slot===2;
  let manifest=null,guestOnAir=false,lastAdmission=0;
  async function readManifest(){
    const response=await fetch(cfg.supabaseUrl+'/rest/v1/broadcast_studio_state?channel=eq.'+encodeURIComponent(commentaryChannel)+'&select=state',{headers:{apikey:cfg.supabasePublishableKey},cache:'no-store',signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw Error('Ljudstatus kunde inte hämtas');
    manifest=(await response.json())?.[0]?.state?.commentary;
    return manifest;
  }
  function gateGuest(onAir){
    guestOnAir=onAir===true;
    for(const [peerId,p]of peers)if(!p.backstage){const track=p.pc.getSenders()[0]?.track;if(track)track.enabled=guestOnAir;}
    const button=panel.querySelector('.commentary-admit');
    if(button){button.textContent=guestOnAir?'Ta ur sändning':'Ta in i sändning';button.setAttribute('aria-pressed',String(guestOnAir));}
    panel.dataset.onAir=String(guestOnAir);
  }
  function manifestGate(root){
    const entry=root?.slots?.[2],stamp=Number(entry?.admissionAt||0);
    // A delayed database read must never undo a newer signed take-out command.
    if(stamp>=lastAdmission){lastAdmission=stamp;gateGuest(entry?.onAir===true);}
  }
  async function monitorAllowed(message){
    const p=message?.payload,root=await readManifest();
    if(!p||!['monitor-join','monitor-answer'].includes(p.type)||p.room!==session?.room||root?.room!==session?.room||p.slot!==slot||![0,1,2].includes(p.credentialSlot)||p.credentialSlot===slot||!Number.isFinite(p.timestamp)||Math.abs(Date.now()-p.timestamp)>15000)return false;
    const source=window.CommentaryDuo.select(root,p.credentialSlot);
    if(!source)return false;
    try{const key=await crypto.subtle.importKey('jwk',source.publicKey,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,bytes(message.signature),encode(p));}catch{return false;}
  }
  const presenter=!listenOnly&&document.body.dataset.commentaryRole==='presenter';
  const viewer=listenOnly;
  const params=new URLSearchParams(location.search);
  if(!viewer&&(params.get('obs')==='1'||params.get('viewer')==='1'))return;
  const commentaryLocale=({sv:'sv',en:'en',fi:'fi',de:'de'}[params.get('lang')||document.documentElement.lang]||'sv');
  const commentaryChannel=({sv:'sec21-bronze-test',en:'broadcast-en',fi:'broadcast-fi',de:'broadcast-de'}[commentaryLocale]);
  const MAX_PEERS=50, RATE=24000;
  const ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'}]};
  let turnRequest=null,turnRoom='',turnUntil=0,relayKeys;
  let micContext,micGain,micSource,outgoingStream,hostMuted=false,hostVolume=1,lastHostSeen=0,lastControlAt=0,claims=new Set();
  async function relayConfig(){
    const active=session;
    if(!active||!keys)throw new Error('Kommentatorsession saknas');
    if(turnRoom!==active.room||(turnUntil>0&&turnUntil<Date.now()+60000)){turnRoom=active.room;turnRequest=null;turnUntil=0;}
    if(!turnRequest){
      turnRequest=(async()=>{
        const payload={type:'turn-credentials',room:active.room,timestamp:Date.now()};
        const message={payload,signature:base64(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},relayKeys?.privateKey||keys.privateKey,encode(payload)))};
        const response=await fetch('https://match-tv-turn.sweehockey.workers.dev/credentials',{
          method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(message),signal:AbortSignal.timeout(15000)
        });
        if(!response.ok)throw new Error('Ljudrelä kunde inte anslutas ('+response.status+')');
        const data=await response.json();
        if(!validRelay(data.iceServers)||data.expiresAt<=Date.now())throw new Error('Ogiltigt svar från ljudrelä');
        turnUntil=data.expiresAt;return {iceServers:data.iceServers};
      })().catch(error=>{turnRequest=null;throw error;});
    }
    return turnRequest;
  }
  function validRelay(servers){
    return Array.isArray(servers)&&servers.length>0&&servers.length<=8&&servers.every(server=>{
      const urls=Array.isArray(server.urls)?server.urls:[server.urls];
      return urls.length>0&&urls.length<=8&&urls.every(url=>typeof url==='string'&&/^(stun|turn|turns):(stun|turn)\.cloudflare\.com:\d+(\?transport=(udp|tcp))?$/.test(url))&&
        (server.username===undefined||typeof server.username==='string'&&server.username.length<512)&&
        (server.credential===undefined||typeof server.credential==='string'&&server.credential.length<512);
    });
  }
  const peers=new Map(), id=crypto.randomUUID();
  const cfg=window.EHOCKEY_CONFIG||{};
  let client,channel,stream,keys,session,starting=false,disposed=false,generation=0;
  let ctx,source,delay,gain,currentTrack,receiverAudio,viewerEnabled=false,joinedAt=0,lastRequest=0;
  let pollTimer,retryTimer,startingToken=0,invite=null,joining=false,expiryTimer;
  const panel=document.createElement('section');
  panel.className='commentary-panel';panel.dataset.commentarySlot=String(slot);panel.dataset.commentaryMode=viewer?'listener':'host';
  panel.setAttribute('aria-label',viewer?'Kommentatorsljud':'Mikrofon till Match-TV');
  panel.innerHTML=viewer
    ? '<h3>KOMMENTERING · BETA</h3><p class="commentary-status" role="status" aria-live="polite">Kontrollerar kommenteringen…</p><div class="commentary-actions"><button type="button" class="commentary-listen" aria-pressed="false">Lyssna på kommentering</button><label>Röstvolym<input class="commentary-volume" type="range" min="0" max="100" value="100"></label><label>Fördröj rösten <output class="commentary-delay-value">0 s</output><input class="commentary-delay" type="range" min="0" max="15" step="0.5" value="0"></label></div><small>Matchljudet styrs med ”Slå på ljud”. Om rösten ligger före bilden, öka fördröjningen. Ligger rösten efter, prova att ladda om matchbilden.</small>'
    : '<h3>MIKROFON TILL MATCH-TV · BETA</h3><p class="commentary-status" role="status" aria-live="polite">Mikrofon av</p><div class="commentary-actions"><button type="button" class="commentary-start">Starta kommentering</button><button type="button" class="commentary-mute" disabled aria-pressed="false">Tysta mikrofon</button><button type="button" class="commentary-stop" disabled>Stoppa</button></div><small>Endast rösten skickas till Match-TV. Använd hörlurar och låt den här fliken vara öppen. Mikrofonen fortsätter för den pågående sändningen när du förbereder nästa match. Testläge: upp till 50 anslutningar. Ljudrelä hjälper anslutningen mellan olika nät. Antalet lyssnare beror även på kommentatorns nät.</small>';
  const anchor=options.anchor;
  if(!anchor)return;
  anchor.append(panel);
  panel.querySelector('h3').textContent=(monitor?'MEDHÖRNING · ':'')+(interview?'INTERVJUGÄST':monitor?'KOMMENTATOR '+(slot+1):'KOMMENTATOR '+(slot+1));
  if(monitor){panel.querySelector('small').textContent=interview?'Privat medhörning av intervjugästen, även i väntrummet. Använd hörlurar.':'Bara denna kommentators röst. Använd hörlurar. Egen mikrofon går aldrig till medhörningen.';panel.querySelector('.commentary-delay')?.closest('label')?.remove();}
  if(!viewer){const label=document.createElement('label');label.textContent='Mikrofonnivå till tittarna';const slider=document.createElement('input');slider.className='commentary-send-volume';slider.type='range';slider.min='0';slider.max='100';slider.value='100';label.append(slider);panel.querySelector('.commentary-actions').append(label);}

  const $=s=>panel.querySelector(s), status=t=>$('.commentary-status').textContent=t;
  const bytes=value=>Uint8Array.from(atob(value),x=>x.charCodeAt(0));
  const base64=value=>btoa(String.fromCharCode(...new Uint8Array(value)));
  const encode=value=>new TextEncoder().encode(JSON.stringify(value));
  const signed=async input=>{const payload={...input,slot};return {payload,signature:base64(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,encode(payload)))};};
  async function verified(message){
    if(!session||!message?.payload||Number(message.payload.slot??0)!==slot||typeof message.signature!=='string'||message.signature.length>200)return false;
    try{
      const key=await crypto.subtle.importKey('jwk',session.publicKey,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
      return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,bytes(message.signature),encode(message.payload));
    }catch{return false;}
  }
  async function connect(room,onMessage){
    if(!client){
      const lib=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/+esm');
      client=lib.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{storageKey:'seh-commentary-guest-'+slot+(viewer?'-listener':'-host'),persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
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
  const send=(payload,ch=channel)=>ch?.send({type:'broadcast',event:'signal',payload:payload?.payload?payload:{...payload,slot}});
  function closePeer(peerId){
    const p=peers.get(peerId);if(!p)return;
    clearTimeout(p.timer);peers.delete(peerId);if(interview&&!viewer)p.pc.getSenders().forEach(sender=>sender.track?.stop());p.pc.close();
    if(!viewer&&session)hostStatus();
    if(viewer&&!disposed){detachAudio();status('Kommentatorn är frånkopplad. Försöker igen.');}
  }
  function hostStatus(){
    const count=[...peers.values()].filter(p=>p.pc.connectionState==='connected').length;
    status((interview?(guestOnAir?'I sändning · ':'Väntrum · '):'')+(stream?.getAudioTracks()[0]?.enabled?'Mikrofon på':'Mikrofon tyst')+' · '+count+' lyssnare anslutna');
    if(presenter&&session&&keys)void signed({type:'host-status',room:session.room,live:true,muted:hostMuted,volume:hostVolume,from:id,count}).then(message=>send(message));
  }
  function watch(pc,peerId){
    const p={pc,timer:setTimeout(()=>closePeer(peerId),20000)};peers.set(peerId,p);
    pc.onconnectionstatechange=()=>{
      if(pc.connectionState==='connected'){
        clearTimeout(p.timer);if(viewer){joinedAt=Date.now();status('Kommentering ansluten');}else hostStatus();
      }else if(['failed','closed'].includes(pc.connectionState)){
        closePeer(peerId);
        if(viewer)status('Ljudanslutningen misslyckades. Försöker igen via ljudrelä.');
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
      const timer=setTimeout(done,12000);pc.addEventListener('icegatheringstatechange',changed);
    });
  }
  async function hostSignal(message){
    let authenticatedBackstage=false,credentialSlot=null;
    if(interview&&message?.payload?.type==='admission'){
      const p=message.payload;
      if(p.room!==session?.room||p.key!==session?.publicKey?.x||!Number.isFinite(p.timestamp)||Math.abs(Date.now()-p.timestamp)>60000||p.timestamp<=lastAdmission)return;
      const root=await readManifest();if(root?.room!==session.room||!root.admissionKey)return;
      try{const key=await crypto.subtle.importKey('jwk',root.admissionKey,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);if(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,bytes(message.signature),encode(p))&&p.timestamp>=lastAdmission){lastAdmission=p.timestamp;gateGuest(p.onAir);hostStatus();}}catch{}
      return;
    }
    if(interview&&message?.payload?.type==='monitor-join'){
      if(!await monitorAllowed(message))return;
      authenticatedBackstage=true;credentialSlot=message.payload.credentialSlot;
      message={...message.payload,type:'join'};
    }
    if(interview&&message?.payload?.type==='monitor-answer'){
      const p=peers.get(message.payload.from);
      if(!p?.backstage||p.credentialSlot!==message.payload.credentialSlot||!await monitorAllowed(message))return;
      authenticatedBackstage=true;message={...message.payload,type:'answer'};
    }
    if(message?.payload&&Number(message.payload.slot??0)!==slot)return;
    if(message&&!message.payload&&Number(message.slot??0)!==slot)return;
    if(message?.payload?.type==='control'&&message.payload.room===session?.room&&await verified(message)){
      const stamp=message.payload.timestamp;if(!Number.isFinite(stamp)||Math.abs(Date.now()-stamp)>60000||stamp<=lastControlAt)return;lastControlAt=stamp;
      hostMuted=message.payload.muted===true;hostVolume=Math.max(0,Math.min(1,Number(message.payload.volume)||0));applyMicSettings();hostStatus();return;
    }
    if(message?.payload?.type==='claim'&&message.payload.room===session?.room&&Math.abs(Date.now()-Number(message.payload.timestamp))<5000&&/^[a-f0-9-]{36}$/.test(message.payload.from)&&await verified(message)){claims.add(message.payload.from);if(stream)hostStatus();return;}
    if(message?.payload?.type==='host-status'&&message.payload.room===session?.room&&await verified(message)){
      if(message.payload.live&&message.payload.from!==id)lastHostSeen=Date.now();
      if(!presenter){hostMuted=message.payload.muted===true;hostVolume=Math.max(0,Math.min(1,Number(message.payload.volume??1)));applyMicSettings();$('.commentary-mute').disabled=false;}
    }
    if(message?.type==='host-probe'&&message.room===session?.room&&stream){hostStatus();return;}
    if(message?.type==='leave'&&message.room===session?.room){closePeer(message.from);return;}
    if(message?.payload?.type==='end'&&message.payload.room===session?.room&&await verified(message)){await stopHost(false);status('Studion har avslutat kommenteringen. Be om en ny länk.');invite=null;return;}
    if(!presenter&&message?.payload?.type==='host-status'&&message.payload.room===session?.room&&await verified(message)){
      status(message.payload.live?'Kommentator '+(message.payload.muted?'tyst':'ansluten')+' · '+Number(message.payload.count||0)+' lyssnare':'Kommentatorns mikrofon är av');return;
    }
    if(!session||!stream||!message||message.room!==session.room)return;
    if(message.type==='answer'){
      const p=peers.get(message.from);
      if(p?.backstage&&!authenticatedBackstage)return;
      if(p&&p.pc.signalingState==='have-local-offer'&&typeof message.sdp==='string'&&message.sdp.length<30000)
        await p.pc.setRemoteDescription({type:'answer',sdp:message.sdp});
      return;
    }
    if(message.type!=='join'||typeof message.from!=='string'||!/^[a-f0-9-]{36}$/.test(message.from)||peers.has(message.from)||peers.size>=MAX_PEERS)return;
    const activeSession=session;
    if(interview){
      try{const root=await readManifest();if(root?.room!==session.room)return;manifestGate(root);}catch{return;}
      if(!guestOnAir&&!authenticatedBackstage)return;
    }
    let relay;
    try{relay=await relayConfig();}catch(error){status(String(error.message||'Ljudrelä kunde inte anslutas'));return;}
    if(session!==activeSession||!stream||peers.has(message.from)||peers.size>=MAX_PEERS)return;
    const pc=new RTCPeerConnection(relay);watch(pc,message.from);Object.assign(peers.get(message.from),{backstage:authenticatedBackstage,credentialSlot,credentialKey:authenticatedBackstage?manifest?.slots?.[credentialSlot]?.publicKey?.x:null});
    try{
      const sentStream=outgoingStream||stream;
      // A separate cloned track per guest peer makes admission enforceable at the sender.
      const audioTrack=interview?sentStream.getAudioTracks()[0].clone():sentStream.getAudioTracks()[0];
      if(interview)audioTrack.enabled=authenticatedBackstage||guestOnAir;
      const sender=pc.addTrack(audioTrack,sentStream);
      const settings=sender.getParameters();settings.encodings=[{maxBitrate:RATE}];
      await sender.setParameters(settings).catch(()=>{});
      const offer=await pc.createOffer();
      const opus=offer.sdp.match(/a=rtpmap:(\d+) opus\/48000/i);
      if(opus)offer.sdp=offer.sdp.replace(new RegExp('(a=fmtp:'+opus[1]+' [^\\r\\n]*)'),'$1;maxaveragebitrate=24000;stereo=0;usedtx=1');
      await pc.setLocalDescription(offer);await iceComplete(pc);
      if(session!==activeSession||!peers.has(message.from))return;
      await send(await signed({type:'offer',room:session.room,to:message.from,sdp:pc.localDescription.sdp,iceServers:relay.iceServers}));
    }catch{closePeer(message.from);}
  }
  async function stopHost(publish=true){
    clearTimeout(expiryTimer);
    let goodbye;
    if(channel&&keys&&session&&(!presenter||stream)){const outgoing=channel;goodbye=signed(presenter?{type:'host-status',room:session.room,live:false,count:0}:{type:'end',room:session.room}).then(message=>send(message,outgoing));}
    startingToken++;starting=false;
    stream?.getTracks().forEach(track=>track.stop());stream=null;
    outgoingStream?.getTracks().forEach(track=>track.stop());outgoingStream=null;
    micSource?.disconnect();micSource=null;micGain=null;void micContext?.close();micContext=null;
    session=null;keys=null;turnRequest=null;turnRoom='';
    for(const peerId of [...peers.keys()])closePeer(peerId);
    const old=channel;channel=null;
    if(old&&client){if(goodbye)void goodbye.catch(()=>{}).finally(()=>client.removeChannel(old));else void client.removeChannel(old);}
    if(!presenter)manager.setSlot(slot,null,publish);
    const oldLink=panel.querySelector('.commentary-invite');
    if(oldLink){oldLink.hidden=true;oldLink.querySelector('input').value='';}
    $('.commentary-start').disabled=false;$('.commentary-stop').disabled=true;
    $('.commentary-mute').disabled=true;$('.commentary-mute').textContent='Tysta mikrofon';
    if(interview){gateGuest(false);lastAdmission=0;const admit=$('.commentary-admit');if(admit)admit.disabled=true;}
    $('.commentary-mute').setAttribute('aria-pressed','false');status('Mikrofon av');
  }
  function applyMicSettings(){
    if(micGain)micGain.gain.setTargetAtTime(hostMuted?0:hostVolume,micContext.currentTime,.02);
    const track=stream?.getAudioTracks()[0];if(track)track.enabled=!hostMuted;
    $('.commentary-mute').textContent=hostMuted?'Slå på mikrofon':'Tysta mikrofon';
    $('.commentary-mute').setAttribute('aria-pressed',String(hostMuted));
    $('.commentary-send-volume').value=String(Math.round(hostVolume*100));
  }
  async function importInvitation(secret){
    keys={privateKey:await crypto.subtle.importKey('jwk',secret.privateKey,{name:'ECDSA',namedCurve:'P-256'},false,['sign'])};
    relayKeys=secret.relayPrivateKey?{privateKey:await crypto.subtle.importKey('jwk',secret.relayPrivateKey,{name:'ECDSA',namedCurve:'P-256'},false,['sign'])}:keys;
    return {room:secret.room,publicKey:secret.publicKey,startedAt:secret.startedAt,slot};
  }
  async function startHost(){
    if(starting||stream)return;
    if(presenter&&(!invite||Date.now()-invite.startedAt>21600000)){status('Kommentatorslänken saknas eller har gått ut. Be studion om en ny länk.');return;}
    if(!presenter&&!window.__sehStudioHasProgram?.()){status('Visa först en match i sändning. Mikrofonen är fortfarande av.');return;}
    if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){status('Mikrofon kräver WebRTC och en säker anslutning.');return;}
    if(!presenter&&session)await stopHost();
    const token=++startingToken;starting=true;$('.commentary-start').disabled=true;$('.commentary-stop').disabled=false;
    status('Ansluter kommentatorsplats…');
    try{
      micContext=new (window.AudioContext||window.webkitAudioContext)();void micContext.resume();
      if(!presenter)manager.claimLocal(slot);
      const secret=presenter?invite:await manager.createSlot(slot);
      const nextSession=await importInvitation(secret);
      session=nextSession;
      if(interview){const root=await readManifest();if(root?.room!==session.room||window.CommentaryDuo.select(root,slot)?.publicKey?.x!==session.publicKey.x)throw Error('Intervjulänken har avslutats.');if(root.slots?.[2]?.onAir===true)throw Error('Be studion ta ur gästen ur sändning innan mikrofonen startas igen.');gateGuest(false);}
      const next=await connect(session.room,hostSignal);
      if(token!==startingToken||disposed){void client.removeChannel(next);return;}
      channel=next;lastHostSeen=0;claims=new Set([id]);
      await send(await signed({type:'claim',room:session.room,from:id,timestamp:Date.now()}));
      await send({type:'host-probe',room:session.room,from:id});
      await new Promise(resolve=>setTimeout(resolve,700));
      if(lastHostSeen>Date.now()-3000)throw new Error('Den här kommentatorsplatsen används redan. Be om den andra länken.');
      if([...claims].sort()[0]!==id)throw new Error('Kommentatorsplatsen öppnas redan i en annan flik. Använd den andra länken.');
      if(token!==startingToken||disposed)return;
      status('Tillåt mikrofonåtkomst. Endast mikrofonen skickas.');
      const captured=await navigator.mediaDevices.getUserMedia({video:false,audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      if(token!==startingToken||disposed){captured.getTracks().forEach(t=>t.stop());return;}
      stream=captured;
      micSource=micContext.createMediaStreamSource(stream);micGain=micContext.createGain();
      const destination=micContext.createMediaStreamDestination();
      micSource.connect(micGain);micGain.connect(destination);outgoingStream=destination.stream;
      await micContext.resume();applyMicSettings();
      if(!presenter)manager.publish();
      expiryTimer=setTimeout(()=>{void stopHost();if(presenter)invite=null;},Math.max(0,session.startedAt+21600000-Date.now()));
      for(const track of stream.getTracks())track.onended=()=>void stopHost();
      $('.commentary-mute').disabled=false;hostStatus();
    }catch(error){await stopHost();status(error.name==='NotAllowedError'?'Mikrofonåtkomst nekades. Ingen kommentering skickas.':'Kunde inte starta kommenteringen: '+String(error.message||error).slice(0,160));}
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
    if(message.payload.iceServers&&!validRelay(message.payload.iceServers))return;
    const pc=new RTCPeerConnection(message.payload.iceServers?{iceServers:message.payload.iceServers}:ICE);watch(pc,'host');
    pc.ontrack=event=>{
      if(!viewerEnabled||token!==generation||!ctx)return;
      detachAudio();currentTrack=event.track;
      delay.disconnect();delay=ctx.createDelay(15);delay.delayTime.value=Number($('.commentary-delay')?.value||0);delay.connect(gain);gain.gain.value=Number($('.commentary-volume').value)/100;
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
      const answer={type:'answer',room:activeSession.room,from:id,sdp:pc.localDescription.sdp};
      await send(interview&&monitor?await signedMonitor({...answer,type:'monitor-answer'}):answer);
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
      channel=next;lastRequest=Date.now();await requestJoin();
    }catch{status('Kunde inte nå kommenteringen. Försöker igen.');}
    finally{if(token===generation)joining=false;}
  }
  async function requestJoin(){
    if(interview&&monitor){
      if(!options.monitorInvite)return;
      await send(await signedMonitor({type:'monitor-join',room:session.room,from:id}));
    }else await send({type:'join',room:session.room,from:id});
  }
  async function signedMonitor(input){
    const secret=options.monitorInvite;
    const payload={...input,slot,credentialSlot:Number(secret.slot??0),timestamp:Date.now()};
    const key=await crypto.subtle.importKey('jwk',secret.privateKey,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
    return {payload,signature:base64(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,encode(payload)))};
  }
  async function poll(){
    if(disposed)return;
    try{
      const res=await fetch(cfg.supabaseUrl+'/rest/v1/broadcast_studio_state?channel=eq.'+encodeURIComponent(commentaryChannel)+'&select=state',{headers:{apikey:cfg.supabasePublishableKey},cache:'no-store',signal:AbortSignal.timeout(8000)});
      if(!res.ok)throw new Error('HTTP '+res.status);
      const rows=await res.json();manifest=rows?.[0]?.state?.commentary;
      const next=interview&&!monitor&&manifest?.slots?.[2]?.onAir!==true?null:window.CommentaryDuo.select(manifest,slot);
      const valid=next&&/^[a-f0-9-]{36}$/.test(next.room)&&next.publicKey?.kty==='EC'&&next.publicKey?.crv==='P-256'&&Number.isFinite(next.startedAt)&&Date.now()-next.startedAt<21600000;
      if((valid?next.room+':'+next.publicKey.x:null)!==(session?session.room+':'+session.publicKey.x:null)){
        await stopViewer();session=valid?next:null;
        if(!session)status('Ingen kommentering pågår');
        else if(!viewerEnabled)status('Kommentering finns · tryck för att lyssna');
      }
      if(!valid&&!session)status('Ingen kommentering pågår');
      $('.commentary-listen').disabled=!interview&&!session&&!viewerEnabled;
      if(interview&&!monitor&&!session)status('Intervjugästen är inte i sändning');
      if(session&&viewerEnabled)void joinViewer();
    }catch{status('Kontakten med kommenteringen är bruten. Matchbilden påverkas inte.');}
    finally{if(!disposed)pollTimer=setTimeout(poll,3000);}
  }
  if(viewer){
    $('.commentary-listen').onclick=async()=>{
      viewerEnabled=!viewerEnabled;
      $('.commentary-listen').textContent=viewerEnabled?'Stäng av kommentering':'Lyssna på kommentering';
      $('.commentary-listen').setAttribute('aria-pressed',String(viewerEnabled));
      if(!viewerEnabled){await stopViewer();status(session?'Kommentering av · tryck för att lyssna':'Ingen kommentering pågår');return;}
      try{
        if(!ctx){const output=options.audioOutput?.();ctx=output?.context||new (window.AudioContext||window.webkitAudioContext)();delay=ctx.createDelay(15);gain=ctx.createGain();delay.connect(gain);gain.connect(output?.destination||ctx.destination);}
        gain.gain.value=Number($('.commentary-volume').value)/100;delay.delayTime.value=Number($('.commentary-delay')?.value||0);
        await ctx.resume();await joinViewer();
      }catch{viewerEnabled=false;$('.commentary-listen').textContent='Lyssna på kommentering';$('.commentary-listen').setAttribute('aria-pressed','false');status('Kunde inte starta ljudet. Prova Chrome eller Edge.');}
    };
    $('.commentary-volume').oninput=()=>{if(gain)gain.gain.setTargetAtTime(Number($('.commentary-volume').value)/100,ctx.currentTime,0.05);};
    if($('.commentary-delay'))$('.commentary-delay').oninput=()=>{
      const value=Number($('.commentary-delay').value);$('.commentary-delay-value').textContent=value+' s';
      if(delay)delay.delayTime.setTargetAtTime(value,ctx.currentTime,0.1);
    };
    retryTimer=setInterval(()=>{
      if(!session||!viewerEnabled||disposed)return;
      if(channel&&!peers.size&&Date.now()-lastRequest>12000){lastRequest=Date.now();void requestJoin();}
      else if(!channel)void joinViewer();
    },5000);
    void poll();
  }else{
    if(presenter){
      panel.querySelector('h3').textContent=interview?'DIN MIKROFON · INTERVJUGÄST':'DIN MIKROFON · KOMMENTATOR '+(slot+1);
      if(interview)panel.querySelector('small').textContent='Använd hörlurar. Din mikrofon startar i väntrummet. Kommentatorerna kan lyssna på dig där, men tittarna hör dig först när studion tar in dig i sändning. Ingen kamera används.';
      panel.querySelector('small').textContent='Använd hörlurar. Starta kommenteringen när studion är redo. Endast mikrofonljudet skickas till tittarna; ingen video laddas upp från din dator. Låt sidan vara öppen. Tittarna justerar eventuell ljudfördröjning i Match-TV.';
      try{
        invite=options.invite||JSON.parse(new TextDecoder().decode(bytes(location.hash.slice(1))));
        if(Number(invite.slot??0)!==slot)throw new Error();
        if(!/^[a-f0-9-]{36}$/.test(invite.room)||invite.privateKey?.kty!=='EC'||!invite.privateKey?.d||invite.publicKey?.crv!=='P-256'||!Number.isFinite(invite.startedAt)||Date.now()-invite.startedAt>21600000)throw new Error();
        status('Redo · mikrofonen är av');
      }catch{invite=null;$('.commentary-start').disabled=true;status('Ogiltig kommentatorslänk. Be studion om en ny länk.');}
    }else{
      $('.commentary-start').textContent='Starta mikrofon här';
      const inviteButton=document.createElement('button');inviteButton.type='button';inviteButton.textContent='Skapa länk till kommentator';
      if(interview){
        inviteButton.textContent='Skapa intervjulänk';$('.commentary-start').hidden=true;
        const admit=document.createElement('button');admit.type='button';admit.className='commentary-admit';admit.textContent='Ta in i sändning';admit.disabled=true;admit.setAttribute('aria-pressed','false');
        admit.onclick=async()=>{admit.disabled=true;try{const message=await manager.admission(!guestOnAir);gateGuest(message.payload.onAir);await send(message);status(guestOnAir?'Intervjugästen är i sändning':'Intervjugästen är i väntrummet');}catch(error){status(String(error.message));}finally{admit.disabled=!session;}};
        $('.commentary-actions').append(admit);
        panel.querySelector('small').textContent='Gästen börjar i väntrummet och kan prata med kommentatorerna via medhörningen. Ta in/ur sändning styr bara gästen. Hörlurar krävs. Stoppa avslutar intervjulänken.';
      }
      $('.commentary-actions').prepend(inviteButton);
      const linkBox=document.createElement('div');linkBox.hidden=true;linkBox.className='commentary-invite';
      linkBox.innerHTML='<label>Privat kommentatorslänk<input type="text" readonly aria-label="Kommentatorslänk"></label><button type="button">Kopiera länk</button><small>Skicka länken privat till kommentatorn. Den ger mikrofonåtkomst till den här ljudsessionen, gäller i sex timmar och avslutas med Stoppa. Personen kan vara på en annan ort.</small>';
      panel.append(linkBox);
      if(interview){linkBox.querySelector('label').firstChild.textContent='Privat intervjulänk';linkBox.querySelector('input').setAttribute('aria-label','Intervjulänk');linkBox.querySelector('small').textContent='Skicka länken privat till gästen. Bara ljud, ingen kamera. Gästen börjar i väntrummet. Länken gäller i sex timmar och avslutas med Stoppa.';}
      linkBox.querySelector('button').onclick=async()=>{try{await navigator.clipboard.writeText(linkBox.querySelector('input').value);status('Länken kopierad. Skicka den privat till kommentatorn.');}catch{linkBox.querySelector('input').select();status('Markera och kopiera länken med Ctrl+C.');}};
      inviteButton.onclick=async()=>{
        if(starting)return;
        if(!window.__sehStudioHasProgram?.()){status('Visa först en match i sändning.');return;}
        inviteButton.disabled=true;
        try{
          await stopHost();
          const secret=await manager.createSlot(slot),nextSession=await importInvitation(secret);
          channel=await connect(nextSession.room,hostSignal);session=nextSession;
          expiryTimer=setTimeout(()=>void stopHost(),21600000);
          manager.publish();
          if(interview){gateGuest(false);$('.commentary-admit').disabled=false;}
          const url=new URL('commentator.html',document.baseURI);url.searchParams.set('lang',commentaryLocale);url.hash=base64(encode(secret));
          linkBox.querySelector('input').value=url.href;linkBox.hidden=false;
          $('.commentary-stop').disabled=false;status('Kommentatorslänk klar · väntar på kommentatorn');
        }catch(error){await stopHost();status('Kunde inte skapa kommentatorslänken: '+String(error.message).slice(0,100));}
        finally{inviteButton.disabled=false;}
      };
    }

    $('.commentary-start').onclick=startHost;$('.commentary-stop').onclick=()=>void stopHost();
    const controls=async()=>{
      applyMicSettings();
      if(!presenter&&channel&&keys&&session)await send(await signed({type:'control',room:session.room,muted:hostMuted,volume:hostVolume,timestamp:Date.now()}));
      if(stream)hostStatus();
    };
    $('.commentary-mute').onclick=()=>{hostMuted=!hostMuted;void controls();};
    $('.commentary-send-volume').oninput=()=>{hostVolume=Number($('.commentary-send-volume').value)/100;void controls();};
  }
  let revokeTimer;
  if(presenter)revokeTimer=setInterval(async()=>{
    if(!stream||!session||disposed)return;
    try{
      const response=await fetch(cfg.supabaseUrl+'/rest/v1/broadcast_studio_state?channel=eq.'+encodeURIComponent(commentaryChannel)+'&select=state',{headers:{apikey:cfg.supabasePublishableKey},cache:'no-store',signal:AbortSignal.timeout(8000)});
      if(!response.ok)return;
      const root=(await response.json())?.[0]?.state?.commentary,next=window.CommentaryDuo.select(root,slot);
      if(!next||next.room!==session.room||next.publicKey?.x!==session.publicKey?.x){await stopHost(false);invite=null;$('.commentary-start').disabled=true;status('Platsen har avslutats av studion. Be om en ny länk.');}
      else if(interview){manifestGate(root);for(const [peerId,p]of peers)if(p.backstage&&window.CommentaryDuo.select(root,p.credentialSlot)?.publicKey?.x!==p.credentialKey)closePeer(peerId);}
    }catch{}
  },3000);
  window.addEventListener('pagehide',()=>{
    disposed=true;clearTimeout(pollTimer);clearInterval(retryTimer);clearInterval(revokeTimer);
    if(viewer){void stopViewer();if(!options.audioOutput)void ctx?.close();}else void stopHost(false);
  },{once:true});
  return {panel,stop:()=>viewer?stopViewer():stopHost(false),listen:()=>{if(viewer&&!viewerEnabled&&!$('.commentary-listen').disabled)$('.commentary-listen').click();},stopListening:()=>{if(viewer&&viewerEnabled)$('.commentary-listen').click();},setDelay:value=>{const input=$('.commentary-delay');if(input){input.value=value;input.oninput?.();}}};
};

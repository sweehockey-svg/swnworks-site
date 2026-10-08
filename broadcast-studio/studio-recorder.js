(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  if(params.get('obs')==='1'&&params.get('recording')==='1'){
    document.title='Inspelningsbild · SWNWORKS';
    const audioButton=document.createElement('button');audioButton.className='recording-audio-start';
    audioButton.textContent='Aktivera matchljud · klicka innan du spelar in';
    audioButton.onclick=()=>{const video=document.getElementById('directVideo');if(video){video.muted=false;if(video.currentSrc)void video.play().catch(()=>{});}audioButton.remove();};
    document.body.append(audioButton);return;
  }
  if(params.get('obs')==='1'||params.get('viewer')==='1')return;
  const panel=document.createElement('section');panel.className='recorder-panel block';
  panel.innerHTML=`<h3>SPELA IN MATCHEN · BETA</h3>
    <p>Spela in grafik, matchljud och din mikrofon till datorn. Ingen video laddas upp från studion.</p>
    <ol><li>Öppna inspelningsbilden och aktivera ljudet där.</li><li>Välj en ny videofil på datorn.</li><li>Starta och välj fliken <b>Inspelningsbild · SWNWORKS</b>. Kryssa i <b>Dela flikljud</b>.</li></ol>
    <a id="recordOutput" class="recorder-output" target="_blank" rel="noopener">1. Öppna inspelningsbild ↗</a>
    <div class="recorder-options"><label><input id="recordTabAudio" type="checkbox" checked> Matchljud från fliken</label><label><input id="recordMic" type="checkbox" checked> Min mikrofon</label></div>
    <div class="recorder-actions"><button id="recordFile" type="button">2. Välj videofil</button><button id="recordStart" type="button" disabled>3. Starta inspelning</button><button id="recordStop" type="button" disabled>Stoppa och spara</button></div>
    <p id="recordStatus" role="status" aria-live="polite">Välj först var videon ska sparas.</p><p id="recordMetrics"></p>
    <video id="recordPreview" muted autoplay playsinline hidden aria-label="Bild som spelas in"></video>
    <p class="recorder-note">Chrome eller Edge på dator. Använd hörlurar. Låt datorn och båda flikarna vara igång. Filen färdigställs när du stoppar; stäng inte fliken under inspelning eller sparning. Börja med ett kort ljudtest innan en hel match.</p>
    <a href="https://studio.youtube.com/" target="_blank" rel="noopener">Ladda upp den sparade videon i YouTube Studio ↗</a>`;
  document.querySelector('.stream-dock')?.prepend(panel);
  const el=id=>panel.querySelector('#'+id),status=el('recordStatus'),metrics=el('recordMetrics');
  const output=new URL(location.href);output.search='?obs=1&recording=1'+(params.get('preview')==='1'?'&preview=1':'');el('recordOutput').href=output.href;
  const supported=!!(window.showSaveFilePicker&&navigator.mediaDevices?.getDisplayMedia&&window.MediaRecorder&&window.AudioContext&&window.SWNRecording);
  const mime=supported?['video/webm;codecs=vp8,opus','video/webm'].find(type=>MediaRecorder.isTypeSupported(type)):null;
  let handle=null,session=null,capture=null,mic=null,context=null,wake=null,timer=null,started=0,busy=false,active=false;
  function buttons(){
    el('recordFile').disabled=!supported||!mime||busy||active;
    el('recordStart').disabled=!handle||busy||active;
    el('recordStop').disabled=!active||busy;
    el('recordMic').disabled=busy||active;el('recordTabAudio').disabled=busy||active;
  }
  async function cleanup(){
    clearInterval(timer);timer=null;capture?.getTracks().forEach(t=>t.stop());mic?.getTracks().forEach(t=>t.stop());
    capture=null;mic=null;el('recordPreview').srcObject=null;el('recordPreview').hidden=true;
    try{await context?.close();}catch{} context=null;
    try{await wake?.release();}catch{} wake=null;
  }
  function permissionError(error){
    return error.name==='NotAllowedError'?'Behörighet saknas eller valet avbröts. Tillåt skärmdelning och mikrofon om du vill spela in.':error.name==='AbortError'?'Valet avbröts. Ingen inspelning startades.':error.message||'Inspelningen kunde inte startas.';
  }
  el('recordFile').onclick=async()=>{
    handle=null;busy=true;buttons();
    try{
      const label=document.querySelector('#headline')?.value||'match';
      const safe=label.replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,70)||'match';
      const stamp=new Date().toISOString().replace(/[:.]/g,'-');
      const chosen=await window.showSaveFilePicker({suggestedName:safe+'-'+stamp+'.webm',types:[{description:'Matchvideo (WebM)',accept:{'video/webm':['.webm']}}]});
      if((await chosen.getFile()).size){status.textContent='Välj ett nytt filnamn så att en tidigare video inte skrivs över.';return;}
      handle=chosen;status.textContent='Vald fil: '+handle.name+'. Starta och välj inspelningsbildens flik.';
    }catch(error){status.textContent=permissionError(error);}finally{busy=false;buttons();}
  };
  el('recordStart').onclick=async()=>{
    if(!handle||busy||active)return;
    busy=true;buttons();status.textContent='Välj inspelningsbildens flik och dela flikljudet.';
    try{
      capture=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:'browser',width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:30,max:30}},audio:el('recordTabAudio').checked,selfBrowserSurface:'exclude',surfaceSwitching:'exclude',systemAudio:'exclude'});
      const hasTabAudio=capture.getAudioTracks().length>0;
      if(el('recordTabAudio').checked&&!hasTabAudio)throw new Error('Flikljudet saknas. Starta igen och kryssa i Dela flikljud.');
      if(el('recordMic').checked)mic=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
      if(!capture.getVideoTracks().some(track=>track.readyState==='live'))throw new Error('Bilddelningen avslutades innan inspelningen startade.');
      const tracks=[...capture.getVideoTracks()];
      if(hasTabAudio||mic){
        context=new AudioContext();await context.resume();const mix=context.createMediaStreamDestination();
        for(const source of [hasTabAudio?new MediaStream(capture.getAudioTracks()):null,mic].filter(Boolean)){
          const input=context.createMediaStreamSource(source),gain=context.createGain();gain.gain.value=hasTabAudio&&mic?0.7:1;input.connect(gain).connect(mix);
        }
        tracks.push(...mix.stream.getAudioTracks());
      }
      if((await handle.getFile()).size)throw new Error('Filen innehåller redan data. Välj en ny videofil.');
      const targetHandle=handle;
      session=SWNRecording.createSession({Recorder:MediaRecorder,openWriter:()=>targetHandle.createWritable(),onFailure:error=>{status.textContent=error.message;},onChange:state=>{
        metrics.textContent=state.phase==='recording'||state.phase==='saving'||state.phase==='finishing'?Math.floor((Date.now()-started)/60000)+' min · '+(state.bytes/1024/1024).toFixed(1)+' MB skrivna':'';
        if(state.phase==='saving'||state.phase==='finishing'){busy=true;status.textContent='Färdigställer videofilen. Låt fliken vara öppen…';buttons();}
        if(state.phase==='saved'||state.phase==='failed'){
          busy=true;handle=null;
          status.textContent=state.error?'Inspelningen avbröts: '+state.error.message+' Filen kan vara ofullständig; kontrollera den innan uppladdning.':'Sparat '+targetHandle.name+' ('+(state.bytes/1024/1024).toFixed(1)+' MB). Spela upp filen och kontrollera ljudet före uppladdning.';
          void cleanup().finally(()=>{active=false;busy=false;buttons();});buttons();
        }
      }});
      started=Date.now();await session.start(new MediaStream(tracks),{mimeType:mime,videoBitsPerSecond:6000000,audioBitsPerSecond:128000});
      capture.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>void session.stop(),{once:true}));
      mic?.getAudioTracks().forEach(track=>track.addEventListener('ended',()=>{status.textContent='Mikrofonen kopplades bort. Inspelningen stoppas för att spara filen.';void session.stop();},{once:true}));
      el('recordPreview').srcObject=new MediaStream(capture.getVideoTracks());el('recordPreview').hidden=false;
      active=true;status.textContent='SPELAR IN · Flikljud: '+(hasTabAudio?'på':'av')+' · Mikrofon: '+(mic?'på':'av')+'. Kontrollera bilden nedan.';
      timer=setInterval(()=>{const s=session.state;metrics.textContent=Math.floor((Date.now()-started)/60000)+' min · '+(s.bytes/1024/1024).toFixed(1)+' MB skrivna';},1000);
      try{wake=await navigator.wakeLock?.request('screen');wake?.addEventListener('release',()=>{wake=null;});}catch{}
    }catch(error){status.textContent=permissionError(error);await cleanup();}
    finally{busy=['saving','finishing'].includes(session?.state.phase);buttons();}
  };
  el('recordStop').onclick=()=>{busy=true;buttons();void session?.stop();};
  window.addEventListener('beforeunload',event=>{if(active||busy){event.preventDefault();event.returnValue='';}});
  document.addEventListener('visibilitychange',()=>{if(active&&!document.hidden&&!wake&&!busy)navigator.wakeLock?.request('screen').then(lock=>{wake=lock;lock.addEventListener('release',()=>{wake=null;});}).catch(()=>{});});
  if(!supported||!mime)status.textContent='Inspelning till disk kräver Chrome eller Edge på dator. Öppna studion där för att prova.';
  buttons();
})();

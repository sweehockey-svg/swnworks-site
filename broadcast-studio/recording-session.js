/* Local recording lifecycle. No upload, credentials or server storage. */
(function(root){
  'use strict';
  function createSession({Recorder,openWriter,onChange=()=>{},onFailure=()=>{},maxPendingBytes=64*1024*1024}){
    let recorder,writer,stream,queue=Promise.resolve(),pending=0,bytes=0,error=null,phase='idle',completion,resolveCompletion;
    const report=()=>onChange({phase,bytes,pending,error});
    const release=()=>{stream?.getTracks().forEach(track=>track.stop());};
    function fail(reason){
      if(!error){error=reason instanceof Error?reason:new Error(String(reason));onFailure(error);}
      stop();
    }
    function stop(){
      if(phase==='recording'){
        phase='saving';report();
        try{recorder.stop();}catch(e){fail(e);void finish();}
      }
      return completion;
    }
    async function finish(){
      if(phase==='finishing'||phase==='saved'||phase==='failed')return;
      phase='finishing';report();release();
      try{await queue;await writer.close();}catch(e){if(!error){error=e;onFailure(e);}}
      if(!bytes&&!error)error=new Error('Videon innehåller ingen inspelad data. Gör ett nytt kort test.');
      phase=error?'failed':'saved';report();resolveCompletion({bytes,error});
    }
    async function start(capture,options){
      if(phase!=='idle')throw new Error('Inspelningen är redan startad.');
      stream=capture;phase='starting';report();
      try{
        recorder=new Recorder(stream,options);
        writer=await openWriter();
        completion=new Promise(resolve=>{resolveCompletion=resolve;});
        recorder.ondataavailable=event=>{
          if(!event.data?.size)return;
          pending+=event.data.size;
          queue=queue.then(async()=>{try{await writer.write(event.data);bytes+=event.data.size;}finally{pending-=event.data.size;report();}}).catch(fail);
          if(pending>maxPendingBytes)fail(new Error('Disken hinner inte med. Inspelningen stoppas och försöker spara det som hunnit spelas in.'));
        };
        recorder.onerror=event=>fail(event.error||new Error('Webbläsaren kunde inte fortsätta spela in.'));
        recorder.onstop=()=>void finish();
        stream.getVideoTracks().forEach(track=>track.addEventListener('ended',stop,{once:true}));
        phase='recording';recorder.start(1000);report();
      }catch(e){
        phase='failed';error=e;release();
        try{await writer?.abort();}catch{}
        report();throw e;
      }
    }
    return {start,stop,get state(){return {phase,bytes,pending,error};}};
  }
  if(typeof module==='object'&&module.exports)module.exports={createSession};
  else root.SWNRecording={createSession};
})(typeof window==='object'?window:globalThis);

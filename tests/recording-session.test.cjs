const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createSession}=require('../broadcast-studio/recording-session.js');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(options={}){
  let recorder,closed=false,released=false;const writes=[],events=[];
  const track={stop(){released=true;},addEventListener(name,fn){if(name==='ended')this.end=fn;}};
  class Recorder{
    constructor(){recorder=this;}
    start(interval){assert.equal(interval,1000);}
    chunk(size=4){this.ondataavailable({data:new Blob(['x'.repeat(size)])});}
    stop(){queueMicrotask(()=>{this.chunk(2);this.onstop();});}
  }
  const session=createSession({Recorder,openWriter:async()=>({write:async blob=>{await options.beforeWrite?.();if(options.diskError)throw Error('Disk full');writes.push(blob.size);},close:async()=>{closed=true;},abort:async()=>{}}),onChange:s=>events.push(s.phase),...options});
  return {session,track,writes,events,get recorder(){return recorder;},get closed(){return closed;},get released(){return released;},start:()=>session.start({getTracks:()=>[track],getVideoTracks:()=>[track]},{} )};
}
test('writes sequentially and includes final recording chunk before closing',async()=>{
  const f=fixture();await f.start();f.recorder.chunk(8);f.recorder.chunk(12);
  const result=await f.session.stop();assert.deepEqual(f.writes,[8,12,2]);assert.equal(result.bytes,22);assert.equal(result.error,null);assert.ok(f.closed);assert.ok(f.released);assert.equal(f.session.state.phase,'saved');
});
test('ending screen sharing finalizes the file once',async()=>{
  const f=fixture();await f.start();f.recorder.chunk();f.track.end();f.track.end();await tick();await f.session.stop();
  assert.deepEqual(f.writes,[4,2]);assert.equal(f.events.filter(e=>e==='saved').length,1);
});
test('disk failure stops capture and reports an incomplete recording',async()=>{
  const f=fixture({diskError:true});await f.start();f.recorder.chunk();await tick();const result=await f.session.stop();assert.match(result.error.message,/Disk full/);assert.equal(f.session.state.phase,'failed');assert.ok(f.released);assert.ok(f.closed);
});
test('slow storage has a bounded queue and stops instead of accumulating an hour in RAM',async()=>{
  let unblock;const wait=new Promise(resolve=>{unblock=resolve;});const f=fixture({maxPendingBytes:10,beforeWrite:()=>wait});await f.start();f.recorder.chunk(8);f.recorder.chunk(8);assert.equal(f.session.state.phase,'saving');unblock();const result=await f.session.stop();assert.match(result.error.message,/Disken hinner inte/);assert.equal(f.session.state.phase,'failed');
});
test('file permission errors release capture without claiming success',async()=>{
  const f=fixture({openWriter:async()=>{throw Error('Permission denied');}});await assert.rejects(f.start(),/Permission denied/);assert.ok(f.released);assert.equal(f.session.state.phase,'failed');
});

const fs=require('node:fs'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=p=>fs.readFileSync(__dirname+'/'+p,'utf8');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let published=null,turnChecks=0;const bus=new Map();
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required','--use-fake-device-for-media-stream','--disable-features=WebRtcHideLocalIpsWithMdns,LocalNetworkAccessChecks,LocalNetworkAccessChecksWebRTC']});
try{
 async function page(role,fragment='',frequency=440){
  const page=await browser.newPage();await page.context().grantPermissions(['microphone']);page.on('pageerror',e=>{throw Error('Browser script error: '+e.message);});
  await page.exposeBinding('testPublish',(_source,value)=>{published=JSON.parse(JSON.stringify(value));});
  await page.exposeBinding('testBusJoin',({page},name,token)=>{bus.set(token,{page,name});});
  await page.exposeBinding('testBusLeave',(_source,token)=>bus.delete(token));
  await page.exposeBinding('testBusSend',async(_source,name,token,message)=>{for(const [other,entry]of [...bus])if(entry.name===name&&other!==token&&!entry.page.isClosed())await entry.page.evaluate(({other,message})=>window.testListeners[other]?.({payload:message}),{other,message});return'ok';});
  await page.route('**/*',async route=>{
   const url=route.request().url();
   if(url.startsWith('https://duo.test/'))return route.fulfill({contentType:'text/html',body:'<html lang="sv"><meta charset="utf-8"><body '+(role==='presenter'?'data-commentary-role="presenter"':'')+'>'+(role==='director'?'<section class="scene-dock"></section>':role==='presenter'?'<div id="commentatorControls"></div>':'<div class="tv-video"><div class="toolbar"></div></div><iframe id="broadcast"></iframe>')+'</body></html>'});
   if(url.includes('/rest/v1/broadcast_studio_state'))return route.fulfill({contentType:'application/json',body:JSON.stringify([{state:{commentary:published}}])});
   if(url.includes('match-tv-turn.')&&route.request().method()==='POST'){
    const message=route.request().postDataJSON();assert.equal(message.payload.room,published.room);
    const key=await webcrypto.subtle.importKey('jwk',published.publicKey,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
    assert(await webcrypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,Buffer.from(message.signature,'base64'),new TextEncoder().encode(JSON.stringify(message.payload))));turnChecks++;
    return route.fulfill({contentType:'application/json',body:JSON.stringify({expiresAt:Date.now()+3600000,iceServers:[{urls:'stun:stun.cloudflare.com:3478'}]})});
   }
   if(url.includes('@supabase/supabase-js@2.115.0/+esm'))return route.fulfill({contentType:'application/javascript',body:'export const createClient=()=>window.testSupabaseFactory();'});
   return route.abort();
  });
  await page.goto('https://duo.test/'+role+fragment);
  await page.evaluate(({frequency})=>{
   window.EHOCKEY_CONFIG={supabaseUrl:'https://supa.test',supabasePublishableKey:'test-public-key'};
   window.__sehStudioHasProgram=()=>true;window.__sehPublishBroadcastState=()=>window.testPublish(window.__sehCommentarySession);
   window.testListeners={};window.testSupabaseFactory=()=>({channel(name){const token=crypto.randomUUID();return{on(_type,_event,fn){window.testListeners[token]=fn;return this;},async subscribe(fn){await window.testBusJoin(name,token);fn('SUBSCRIBED');},send:message=>window.testBusSend(name,token,message.payload),token};},removeChannel:ch=>{delete window.testListeners[ch.token];return window.testBusLeave(ch.token);}});
   window.fakeMicCount=0;
   const NativePC=window.RTCPeerConnection;window.testPCs=[];window.RTCPeerConnection=class extends NativePC{constructor(...args){super(...args);window.testPCs.push(this);}};
   navigator.mediaDevices.getUserMedia=async()=>{
    const c=new AudioContext(),o=c.createOscillator(),g=c.createGain(),d=c.createMediaStreamDestination();o.frequency.value=frequency;g.gain.value=.15;o.connect(g);g.connect(d);o.start();await c.resume();window.fakeMicCount++;
    const track=d.stream.getAudioTracks()[0],stop=track.stop.bind(track);track.stop=()=>{if(track.readyState!=='ended'){window.fakeMicCount--;stop();void c.close();}};
    return d.stream;
   };
  },{frequency});
  await page.addStyleTag({content:read('commentary.css')});
  await page.addScriptTag({content:read('commentary-duo.js')});
  // Speed up gathering of local host candidates; real RTCPeerConnection/audio is retained.
  await page.addScriptTag({content:read('commentary-engine.js').replace('const timer=setTimeout(done,12000)','const timer=setTimeout(done,1000)')});
  await page.addScriptTag({content:read('commentary.js')});
  return page;
 }
 const director=await page('director');director.on('dialog',d=>d.accept());
 assert.equal(await director.evaluate(()=>fakeMicCount),0,'No microphone requested on load');
 assert.equal(await director.locator('[data-commentary-mode="host"]').count(),2);
 for(const slot of [0,1]){await director.locator('[data-commentary-slot="'+slot+'"] .commentary-actions button').first().click();await director.locator('[data-commentary-slot="'+slot+'"] .commentary-invite:not([hidden])').waitFor();}
 assert.equal(published.version,2);assert.equal(published.slots.filter(Boolean).length,2);assert(!JSON.stringify(published).includes('privateKey'));
 const invites=await director.locator('.commentary-invite input').evaluateAll(es=>es.map(e=>new URL(e.value).hash));
 const secrets=invites.map(h=>JSON.parse(Buffer.from(h.slice(1),'base64').toString('utf8')));
 const forgedKey=await webcrypto.subtle.importKey('jwk',secrets[1].privateKey,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const victimKey=await webcrypto.subtle.importKey('jwk',secrets[0].publicKey,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 const fakePayload=new TextEncoder().encode(JSON.stringify({type:'offer',slot:0,room:published.room}));
 assert.equal(await webcrypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},victimKey,await webcrypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},forgedKey,fakePayload),fakePayload),false,'Slot 2 cannot sign as slot 1');
 const p1=await page('presenter',invites[0],440),p2=await page('presenter',invites[1],880);
 for(const p of [p1,p2])assert.equal(await p.evaluate(()=>fakeMicCount),0);
 await p1.locator('[data-commentary-mode="host"] .commentary-start').click();
 await p2.locator('[data-commentary-mode="host"] .commentary-start').click();
 await p1.waitForFunction(()=>fakeMicCount===1);await p2.waitForFunction(()=>fakeMicCount===1);
 const duplicate=await page('presenter',invites[0],660);await duplicate.locator('[data-commentary-mode="host"] .commentary-start').click();await duplicate.waitForFunction(()=>[...document.querySelectorAll('.commentary-status')].some(x=>x.textContent.includes('används redan')),{},{timeout:15000});assert.equal(await duplicate.evaluate(()=>fakeMicCount),0);await duplicate.close();
 const viewer=await page('viewer');await viewer.getByText('Lyssna på båda kommentatorerna',{exact:true}).click();
 await viewer.waitForFunction(()=>document.querySelectorAll('audio').length===2,{},{timeout:45000});
 for(const p of [p1,p2]){await p.locator('[data-commentary-mode="listener"] .commentary-listen').click();await p.waitForFunction(()=>document.querySelectorAll('audio').length===1,{},{timeout:45000});}
 assert.equal(await p1.locator('[data-commentary-mode="listener"]').getAttribute('data-commentary-slot'),'1');
 assert.equal(await p2.locator('[data-commentary-mode="listener"]').getAttribute('data-commentary-slot'),'0');
 async function peak(p,slot){return p.evaluate(async slot=>{const audio=document.querySelector('[data-commentary-mode="listener"][data-commentary-slot="'+slot+'"] audio'),c=new AudioContext(),s=c.createMediaStreamSource(audio.srcObject),n=c.createAnalyser();n.fftSize=4096;s.connect(n);await c.resume();await new Promise(r=>setTimeout(r,350));const v=new Float32Array(n.frequencyBinCount);n.getFloatFrequencyData(v);let max=0;for(let i=1;i<v.length;i++)if(v[i]>v[max])max=i;const frequency=max*c.sampleRate/n.fftSize;s.disconnect();await c.close();return frequency;},slot);}
 async function level(p,slot){return p.evaluate(async slot=>{const a=document.querySelector('[data-commentary-slot="'+slot+'"][data-commentary-mode="listener"] audio');if(!a?.srcObject)return 0;const c=new AudioContext(),s=c.createMediaStreamSource(a.srcObject),n=c.createAnalyser();n.fftSize=2048;s.connect(n);await c.resume();await new Promise(r=>setTimeout(r,250));const v=new Float32Array(n.fftSize);n.getFloatTimeDomainData(v);const rms=Math.sqrt(v.reduce((a,b)=>a+b*b,0)/v.length);s.disconnect();await c.close();return rms;},slot);}
 await wait(4000);const before=[await level(viewer,0),await level(viewer,1)];
 if(!before.every(v=>v>.01))console.log(JSON.stringify({levels:before,viewer:await viewer.evaluate(async()=>Promise.all(testPCs.map(async p=>({state:p.connectionState,audio:[...(await p.getStats()).values()].filter(x=>['inbound-rtp','outbound-rtp'].includes(x.type)).map(x=>({type:x.type,bytes:x.bytesReceived||x.bytesSent,level:x.audioLevel}))})))),hosts:await Promise.all([p1,p2].map(p=>p.evaluate(async()=>({states:testPCs.map(p=>p.connectionState),statuses:[...document.querySelectorAll('.commentary-status')].map(x=>x.textContent)}))))}));
 assert(before.every(v=>v>.01),'Both voices carry real audio');
 assert(Math.abs(await peak(p1,1)-880)<30,'First commentator hears colleague, not own 440 Hz tone');
 assert(Math.abs(await peak(p2,0)-440)<30,'Second commentator hears colleague, not own 880 Hz tone');
 const mute=director.locator('[data-commentary-slot="0"] .commentary-mute');await mute.waitFor();await mute.click();await wait(1400);
 assert(await level(viewer,0)<.005,'Muted voice must be silent');assert(await level(viewer,1)>.01,'Other voice stays audible');
 await mute.click();await wait(1200);assert(await level(viewer,0)>.01,'Voice resumes');
 await director.locator('[data-commentary-slot="1"] .commentary-send-volume').fill('20');await director.locator('[data-commentary-slot="1"] .commentary-send-volume').dispatchEvent('input');await wait(1200);
 const reduced=await level(viewer,1);assert(reduced<before[1]*.5&&reduced>.001,'Independent send volume applies');
 await director.locator('[data-commentary-slot="0"] .commentary-stop').click();
 await p1.waitForFunction(()=>fakeMicCount===0,{},{timeout:15000});assert.equal(await p2.evaluate(()=>fakeMicCount),1,'Stopping slot 1 must not stop slot 2');
 assert.equal(published.slots[0],null);assert(published.slots[1]);
 await director.evaluate(async()=>{await window.__sehStopCommentary();await window.__sehPublishBroadcastState();});
 await p2.waitForFunction(()=>fakeMicCount===0,{},{timeout:15000});assert.equal(published,null);
 const endedRoom=secrets[0].room;
 await director.locator('[data-commentary-slot="0"] .commentary-actions button').first().click();await director.locator('[data-commentary-slot="0"] .commentary-invite:not([hidden])').waitFor();assert(published.room!==endedRoom,'New invitation after stop-all uses a fresh room');
 await director.locator('[data-commentary-slot="0"] .commentary-stop').click();assert.equal(published,null);
 assert(turnChecks>=2,'TURN requests remain signed by the existing room authority');
 await director.setViewportSize({width:390,height:900});assert(await director.evaluate(()=>document.documentElement.scrollWidth<=390),'Mobile controls must fit');
 await director.screenshot({path:__dirname+'/commentary-duo-test.png',fullPage:true});
 console.log('PASS: two signed private links, real two-track WebRTC, both listener voices, mix-minus monitoring, independent mute/volume, slot-only stop, end-all revocation, no microphone on load; synthetic tones only, no production writes.');
}finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});


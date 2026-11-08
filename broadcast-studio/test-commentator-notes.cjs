const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=file=>fs.readFileSync(__dirname+'/'+file,'utf8');
const room='8d96313c-4ad1-4e0d-98e5-ccff6cdd1fc9';
const invitation=(slot,seat)=>Buffer.from(JSON.stringify({room,slot,publicKey:{x:seat.repeat(43)},privateKey:{kty:'EC',d:seat.toUpperCase().repeat(43)}})).toString('base64');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800}}),errors=[],writes=[],urls=[];
  const origin='https://notes.test',base=origin+'/broadcast-studio/',pagePath='commentator.html';
  await context.route('**/*',r=>{
   const url=new URL(r.request().url());
   urls.push(url.href);
   if(r.request().method()!=='GET')writes.push(r.request().method());
   if(url.origin!==origin)return r.abort();
   if(url.pathname.endsWith('/'+pagePath))return r.fulfill({contentType:'text/html',body:read(pagePath)});
   const file=url.pathname.split('/').pop();
   if(file==='commentator-notes.js'||file==='studio-language.js')return r.fulfill({contentType:'application/javascript',body:read(file)});
   if(file==='commentator-notes.css'||file==='commentary.css')return r.fulfill({contentType:'text/css',body:read(file)});
   if(['commentary-duo.js','commentary-engine.js','commentary.js','broadcast-config.js'].includes(file))return r.fulfill({contentType:'application/javascript',body:''});
   if(url.searchParams.get('obs')==='1')return r.fulfill({contentType:'text/html',body:'<h1>Broadcast output fixture</h1>'});
   return r.abort();
  });
  async function open(slot,seat,lang='sv'){
   const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base+pagePath+'?lang='+lang+'#'+invitation(slot,seat));
   if(slot!==2)await p.locator('#privateNotes textarea').waitFor({state:'visible'});
   return p;
  }
  const first=await open(0,'a'),input=first.locator('#privateNotes textarea');
  await input.waitFor({state:'visible'});
  const note='Privat stödord: ta upp förstakedjan i pausen.';
  await input.fill(note);
  assert.equal(await first.locator('.notes-status').innerText(),'Sparat på den här enheten');
  assert.match(await first.evaluate(()=>Object.keys(localStorage)[0]),/^swn-commentator-notes:v1:sv:[0-9a-f]{64}$/);
  const match=first.locator('#broadcast'),pos=async locator=>locator.boundingBox();
  assert((await pos(input)).x>(await pos(match)).x+(await pos(match)).width-1,'Notes appear beside video on desktop');
  assert.equal(await first.frameLocator('#broadcast').locator('textarea').count(),0);
  assert(!await first.frameLocator('#broadcast').locator('body').innerText().then(s=>s.includes(note)));
  await first.reload();
  await input.waitFor({state:'visible'});
  assert.equal(await input.inputValue(),note);
  await first.setViewportSize({width:390,height:844});
  const matchPos=await pos(match);
  assert((await pos(input)).y>=matchPos.y+matchPos.height,'Notes follow the match on narrow screens');
  assert.equal(await first.evaluate(()=>document.documentElement.scrollWidth),390);
  const second=await open(1,'b');
  assert.equal(await second.locator('#privateNotes textarea').inputValue(),'');
  const reissued=await open(0,'c');
  assert.equal(await reissued.locator('#privateNotes textarea').inputValue(),'');
  const guest=await open(2,'d');
  assert.equal(await guest.locator('#privateNotes').isVisible(),false);
  const finnish=await open(0,'a','fi');
  assert.equal(await finnish.locator('#privateNotes summary').innerText(),'Omat muistiinpanot');
  assert.equal(await finnish.locator('#privateNotes textarea').inputValue(),'');
  const direct=await context.newPage();
  await direct.goto(base+pagePath);
  assert.equal(await direct.locator('#privateNotes').isVisible(),false);
  const obs=await context.newPage();
  await obs.goto(base+'SV/?obs=1');
  assert.equal(await obs.locator('#privateNotes').count(),0);
  assert(urls.every(url=>!decodeURIComponent(url).includes(note)));
  assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  console.log('PASS local notes persist across reloads, are isolated by link, and stay out of the match iframe and OBS.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

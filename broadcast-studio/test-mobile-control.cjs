const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),errors=[];
 const state={scene:'live',lineupSide:'home',home:'111',away:'222',hs:3,as:2,subline:'Testlaget A – Testlaget B',twitchChannel:'unchanged',lineups:{home:{G:'333'}},transientSource:{expires_at:new Date(Date.now()+3600000).toISOString()}};
 const original=structuredClone(state),writes=[];let offline=false,deny=false;
 const html=fs.readFileSync(__dirname+'/mobile.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link[^>]*>/g,'').replace(' data-studio-locked','');
 await context.route('https://fixture.invalid/**',async route=>{
  const req=route.request();
  if(req.url().includes('/rpc/')){const body=req.postDataJSON();writes.push(body);assert.deepEqual(Object.keys(body).sort(),['p_channel','p_lineup_side','p_scene']);assert.equal(req.headers().authorization,'Bearer fixture-token');if(deny)return route.fulfill({status:403,body:'{}'});state.scene=body.p_scene;if(body.p_scene==='lineup')state.lineupSide=body.p_lineup_side;return route.fulfill({contentType:'application/json',body:JSON.stringify(state)});}
  if(req.url().includes('/rest/'))return route.fulfill({status:offline?503:200,contentType:'application/json',body:JSON.stringify([{state}])});
  return route.fulfill({contentType:'text/html',body:html});
 });
 async function open(){const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('https://fixture.invalid/mobile.html');await page.evaluate(()=>{window.EHOCKEY_CONFIG={supabaseUrl:'https://fixture.invalid',supabasePublishableKey:'fixture-key'};window.SWNStudioAccess={session:async()=>({access_token:'fixture-token'})};});await page.addScriptTag({content:fs.readFileSync(__dirname+'/mobile-control.js','utf8')});await page.waitForFunction(()=>document.querySelector('[data-scene="live"]').disabled===false);return page;}
 const a=await open(),b=await open();assert.equal(writes.length,0,'opening never changes program');
 await a.locator('[data-scene="lineup"][data-lineup-side="away"]').click();await a.locator('[data-scene="lineup"][data-lineup-side="away"].active').waitFor();
 await b.locator('[data-scene="lineup"][data-lineup-side="away"].active').waitFor({timeout:5000});
 await b.locator('[data-scene="goalies"]').click();await a.locator('[data-scene="goalies"].active').waitFor({timeout:5000});
 const {scene,lineupSide,...rest}=state,{scene:oldScene,lineupSide:oldSide,...oldRest}=original;assert.deepEqual(rest,oldRest,'match data preserved');assert(writes.every(x=>x.p_channel==='sec21-bronze-test'));
 assert(await a.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile fits viewport');
 await a.screenshot({path:__dirname+'/mobile-control-preview.png',fullPage:true});
 offline=true;await a.waitForFunction(()=>document.querySelector('#connectionText').textContent==='OFFLINE',{timeout:5000});assert(await a.locator('[data-scene="live"]').isDisabled());
 offline=false;await a.waitForFunction(()=>!document.querySelector('[data-scene="live"]').disabled,{timeout:5000});
 deny=true;const deniedResponse=a.waitForResponse(r=>r.url().includes('/rpc/')&&r.status()===403);await a.locator('[data-scene="stats"]').click();await deniedResponse;
 assert.equal(state.scene,'goalies','denied writes leave program unchanged');
 state.transientSource.expires_at='2020-01-01T00:00:00Z';await a.waitForFunction(()=>document.querySelector('#broadcastStatus').textContent.includes('Ingen aktiv match'),{timeout:5000});assert(await a.locator('[data-scene="live"]').isDisabled());
 assert.deepEqual(errors,[]);console.log('PASS two controllers sync, scene-only RPC, scoped token, no load writes, preserved match data, mobile layout, offline/denied/expired locks');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

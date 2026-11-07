const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),errors=[];
 const state={scene:'live',lineupSide:'home',home:'111',away:'222',lineupTeamNames:{111:'Testlaget A',222:'Testlaget B'},hs:3,as:2,subline:'TESTLAGET A – TESTLAGET B',twitchChannel:'unchanged',lineups:{home:{G:'333'}},seriesFormat:'5',seriesHome:'0',seriesAway:'0',transientSource:{ticket:'fixture.ticket',expires_at:new Date(Date.now()+3600000).toISOString()}};
 const original=structuredClone(state),writes=[];let offline=false,deny=false;
 const html=fs.readFileSync(__dirname+'/mobile.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link[^>]*>/g,'').replace(' data-studio-locked','');
 await context.route('https://fixture.invalid/**',async route=>{
  const req=route.request();
  if(req.url().includes('/rpc/')){
   const body=req.postDataJSON();writes.push(body);
   assert.equal(req.headers().authorization,'Bearer fixture-token');
   if(deny)return route.fulfill({status:403,body:'{}'});
   if(req.url().endsWith('broadcast_studio_set_team_order')){
    assert.deepEqual(Object.keys(body).sort(),['p_action','p_channel','p_expected']);
    assert.equal(body.p_expected.home,state.home);
    assert.equal(body.p_expected.away,state.away);
    assert.equal(body.p_expected.liveTeamsReversed,state.liveTeamsReversed===true);
    state.liveTeamsReversed=!state.liveTeamsReversed;
    if(body.p_action==='swap'){
     [state.home,state.away]=[state.away,state.home];
     [state.seriesHome,state.seriesAway]=[state.seriesAway,state.seriesHome];
     [state.hs,state.as]=[state.as,state.hs];
    }else assert.equal(body.p_action,'live');
   }else if(req.url().endsWith('broadcast_studio_set_series_wins')){
    assert.deepEqual(Object.keys(body).sort(),['p_away','p_channel','p_expected','p_home']);
    assert.equal(body.p_expected.seriesFormat,'5');
    assert.equal(body.p_expected.ticket,'fixture.ticket');
    if(body.p_expected.seriesHome!==state.seriesHome||body.p_expected.seriesAway!==state.seriesAway)return route.fulfill({status:400,body:'{}'});
    state.seriesHome=String(body.p_home);state.seriesAway=String(body.p_away);
   }else if(req.url().endsWith('broadcast_studio_set_music')){
    assert.deepEqual(Object.keys(body).sort(),['p_channel','p_mode','p_scene']);
    if(body.p_scene!==state.scene||state.scene==='live')return route.fulfill({status:400,body:'{}'});
    state.sceneMusic=body.p_mode==='off'?{...state.sceneMusic,muted:true}:{...state.sceneMusic,muted:false,[body.p_scene]:body.p_mode};
   }else{
    assert.deepEqual(Object.keys(body).sort(),['p_channel','p_lineup_side','p_scene']);
    state.scene=body.p_scene;if(body.p_scene==='lineup')state.lineupSide=body.p_lineup_side;
   }
   return route.fulfill({contentType:'application/json',body:JSON.stringify(state)});
  }
  if(req.url().includes('/rest/'))return route.fulfill({status:offline?503:200,contentType:'application/json',body:JSON.stringify([{state}])});
  return route.fulfill({contentType:'text/html',body:html});
 });
 async function open(){const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('https://fixture.invalid/mobile.html');await page.evaluate(()=>{window.EHOCKEY_CONFIG={supabaseUrl:'https://fixture.invalid',supabasePublishableKey:'fixture-key'};window.SWNStudioAccess={session:async()=>({access_token:'fixture-token'})};});await page.addScriptTag({content:fs.readFileSync(__dirname+'/mobile-control.js','utf8')});await page.waitForFunction(()=>document.querySelector('[data-scene="live"]').disabled===false);return page;}
 const a=await open(),b=await open();assert.equal(writes.length,0,'opening never changes program');
 assert.equal(await a.locator('[data-scene="stats"]').count(),0);
 assert.equal(await a.locator('[data-scene="matchup"]').count(),1);
 assert.equal(await a.locator('[data-scene="teamcompare"]').count(),1);
 assert.equal(await a.locator('[data-lineup-side="home"]').textContent(),'Testlaget A');
 assert.equal(await a.locator('[data-lineup-side="away"]').textContent(),'Testlaget B');
 const names=state.lineupTeamNames;
 delete state.lineupTeamNames;
 await a.waitForFunction(()=>document.querySelector('[data-lineup-side="home"]').textContent==='TESTLAGET A');
 state.lineupTeamNames=names;
 assert.deepEqual(await a.locator('[data-scene]').evaluateAll(buttons=>buttons.slice(0,4).map(b=>[b.dataset.scene,b.dataset.lineupSide||null])),[['opening',null],['live',null],['lineup','home'],['lineup','away']]);
 assert.equal(await a.locator('.live-group [data-scene]').count(),1);
 assert.equal(await a.locator('[data-scene="defense"]').count(),1);
 assert.equal(await a.locator('[data-scene="lowerthird"]').count(),0);
 assert.equal(await a.locator('[data-scene="defenseleaders"]').count(),1,'Backar remains available');
 assert(await a.locator('[data-music="high"]').isDisabled(),'Music is locked in Match Live');
 assert.equal(await a.locator('.series-editor').getAttribute('open'),null);
 await a.locator('#seriesSummary').click();
 assert.match(await a.locator('#seriesSummary').innerText(),/0–0 · Bäst av 5/);
 assert.equal(await a.locator('#mobileSeriesHome option').count(),4);
 await a.locator('#mobileSeriesHome').selectOption('3');
 await a.locator('#mobileSeriesAway').selectOption('3');
 assert(await a.locator('#mobileSeriesSave').isDisabled(),'Both teams cannot win the same series');
 await a.locator('#mobileSeriesHome').selectOption('2');
 await a.locator('#mobileSeriesAway').selectOption('1');
 await a.locator('#mobileSeriesSave').click();
 await b.waitForFunction(()=>document.querySelector('#seriesSummary').textContent.includes('2–1'));
 assert.equal(state.scene,'live','Series score edit does not switch the active scene');
 assert.equal(state.seriesFormat,'5');
 await a.locator('#mobileSeriesHome').selectOption('3');
 state.seriesAway='2';
 await a.waitForFunction(()=>document.querySelector('#seriesSummary').textContent.includes('2–2'));
 assert.equal(await a.locator('#mobileSeriesHome').inputValue(),'2','Changed on-air score clears stale draft');
 assert(await a.locator('#mobileSeriesSave').isDisabled());
 await a.locator('[data-scene="lineup"][data-lineup-side="away"]').click();await a.locator('[data-scene="lineup"][data-lineup-side="away"].active').waitFor();
 await b.locator('[data-scene="lineup"][data-lineup-side="away"].active').waitFor({timeout:5000});
 await b.locator('[data-scene="goalies"]').click();await a.locator('[data-scene="goalies"].active').waitFor({timeout:5000});
 assert.equal(await a.locator('[data-music="low"]').getAttribute('aria-pressed'),'true');
 await a.locator('[data-music="off"]').click();
 await b.locator('[data-music="off"][aria-pressed="true"]').waitFor({timeout:5000});
 assert.deepEqual(state.sceneMusic,{muted:true});
 await b.locator('[data-scene="opening"]').click();
 await a.locator('[data-scene="opening"].active').waitFor({timeout:5000});
 assert.equal(await a.locator('[data-music="off"]').getAttribute('aria-pressed'),'true');
 await a.locator('[data-music="high"]').click();
 await b.locator('[data-music="high"][aria-pressed="true"]').waitFor({timeout:5000});
 await a.locator('[data-scene="goalies"]').click();
 await a.locator('[data-scene="goalies"].active').waitFor();
 assert.equal(await a.locator('[data-music="low"]').getAttribute('aria-pressed'),'true');
 const {scene,lineupSide,sceneMusic,seriesHome,seriesAway,...rest}=state,{scene:oldScene,lineupSide:oldSide,seriesHome:oldHome,seriesAway:oldAway,...oldRest}=original;assert.deepEqual(rest,oldRest,'match data preserved');assert(writes.every(x=>x.p_channel==='sec21-bronze-test'));
 assert(await a.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile fits viewport');
 if(process.env.MOBILE_TEST_SCREENSHOT)await a.screenshot({path:process.env.MOBILE_TEST_SCREENSHOT,fullPage:true});
 offline=true;await a.waitForFunction(()=>document.querySelector('#connectionText').textContent==='OFFLINE',{timeout:5000});assert(await a.locator('[data-scene="live"]').isDisabled());
 offline=false;await a.waitForFunction(()=>!document.querySelector('[data-scene="live"]').disabled,{timeout:5000});
 deny=true;const deniedResponse=a.waitForResponse(r=>r.url().includes('/rpc/')&&r.status()===403);await a.locator('[data-scene="teamcompare"]').click();await deniedResponse;
 assert.equal(state.scene,'goalies','denied writes leave program unchanged');
 state.transientSource.expires_at='2020-01-01T00:00:00Z';await a.waitForFunction(()=>document.querySelector('#broadcastStatus').textContent.includes('gått ut'),{timeout:5000});assert(await a.locator('[data-scene="live"]').isDisabled());
 state.transientSource.expires_at=new Date(Date.now()+3600000).toISOString();
 await a.waitForFunction(()=>!document.querySelector('[data-scene="live"]').disabled,{timeout:5000});
 state.publicNoMatch=true;
 await a.waitForFunction(()=>document.querySelector('#broadcastStatus').textContent.includes('Vänteskärmen är på'),{timeout:5000});
 assert(await a.locator('[data-scene="live"]').isDisabled());
 state.publicNoMatch=false;
 await a.waitForFunction(()=>!document.querySelector('[data-scene="live"]').disabled,{timeout:5000});
 deny=false;
 assert(await a.locator('#mobileFlipLiveTeams').isDisabled(),'Live overlay control is scoped to Match Live');
 await a.locator('[data-scene="live"]').click();
 await a.locator('[data-scene="live"].active').waitFor();
 const beforeFlip=structuredClone(state);
 await a.locator('#mobileFlipLiveTeams').click();
 await b.locator('#mobileFlipLiveTeams[aria-pressed="true"]').waitFor();
 assert.deepEqual(state,{...beforeFlip,liveTeamsReversed:true},'Live flip only affects the overlay');
 a.once('dialog',dialog=>dialog.accept());
 await a.locator('#mobileSwapTeams').click();
 await b.locator('#mobileFlipLiveTeams[aria-pressed="false"]').waitFor();
 assert.equal(state.home,beforeFlip.away);
 assert.equal(state.away,beforeFlip.home);
 assert.equal(state.hs,beforeFlip.as);
 assert.equal(state.seriesHome,beforeFlip.seriesAway);
 assert.equal(state.twitchChannel,beforeFlip.twitchChannel);
 assert.equal(await b.locator('[data-lineup-side="home"]').textContent(),'Testlaget B','Names follow team IDs when sides swap');
 assert.equal(await b.locator('[data-lineup-side="away"]').textContent(),'Testlaget A');
 assert.deepEqual(errors,[]);console.log('PASS two controllers sync, scene-only RPC, scoped token, no load writes, preserved match data, mobile layout, offline/denied/expired locks');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

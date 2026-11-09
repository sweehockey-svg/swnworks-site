const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=file=>fs.readFileSync(__dirname+'/'+file,'utf8');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const mode of ['signed-out','denied','allowed','operator']){
   const origin='https://presenter.test',base=origin+'/broadcast-studio/',writes=[],errors=[];
   let toolsLoads=0;
   const page=await browser.newPage({viewport:{width:1280,height:800}});
   page.on('pageerror',error=>errors.push(error.message));
   let state={leagueId:527,scene:'live',home:'111',away:'222',hs:3,as:2,lineupTeamNames:{111:'Testlaget A',222:'Testlaget B'},
    transientSource:{ticket:'fixture.ticket',expires_at:new Date(Date.now()+3600000).toISOString()}};
   await page.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url()),file=url.pathname.split('/').pop();
    const session=mode==='signed-out'?null:{access_token:'fixture-token'};
    if(url.hostname==='cdn.jsdelivr.net')return route.fulfill({contentType:'application/javascript',body:`window.supabase={createClient:()=>({
      auth:{onAuthStateChange(){},getSession:async()=>({data:{session:${JSON.stringify(session)}}}),getUser:async()=>({data:{user:{email:"fixture@example.test"}}})},
      rpc:async(name,args)=>({data:(name==="swn_studio_scene_access"&&args.p_channel==="sec21-bronze-test"&&${['allowed','operator'].includes(mode)})||(name==="swn_studio_sv_operator_access"&&${mode==='operator'})})
    })};`});
    if(url.origin!==origin)return route.abort();
    if(file==='presenter.html'||file==='mobile.html')return route.fulfill({contentType:'text/html',body:read(file)});
    if(url.searchParams.get('panel')==='tools'||url.searchParams.has('scope-test')){
     toolsLoads++;
     return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html data-studio-locked><head><link rel="stylesheet" href="/studio-access.css"></head><body><main>Admin tools</main><script src="../broadcast-config.js"></script><script src="https://cdn.jsdelivr.net/mock-supabase.js"></script><script src="/studio-access.js"></script></body></html>'});
    }
    if(file==='studio-access.js'||file==='studio-access.css')return route.fulfill({contentType:file.endsWith('.css')?'text/css':'application/javascript',body:read('../'+file)});
    if(file==='broadcast-config.js')return route.fulfill({contentType:'application/javascript',body:`window.EHOCKEY_CONFIG={supabaseUrl:${JSON.stringify(origin)},supabasePublishableKey:"fixture"};`});
    if(['mobile-control.js','commentator-notes.js','group-meetings.js','commentator-notes.css'].includes(file))return route.fulfill({contentType:file.endsWith('.css')?'text/css':'application/javascript',body:read(file)});
    if(url.pathname.endsWith('/rpc/broadcast_studio_set_scene')){
     assert.equal(req.headers().authorization,'Bearer fixture-token');
     const payload=req.postDataJSON();writes.push(payload);
     state={...state,scene:payload.p_scene};
     return route.fulfill({json:state});
    }
    if(url.pathname.endsWith('/rpc/broadcast_studio_set_match_result')){
     assert.equal(req.headers().authorization,'Bearer fixture-token');
     const payload=req.postDataJSON();writes.push(payload);
     state={...state,hs:String(payload.p_home),as:String(payload.p_away)};
     return route.fulfill({json:state});
    }
    if(url.pathname.endsWith('/rpc/broadcast_studio_set_music')){
     assert.equal(req.headers().authorization,'Bearer fixture-token');
     const payload=req.postDataJSON();writes.push(payload);
     state={...state,sceneMusic:{...state.sceneMusic,muted:payload.p_mode==='off',[payload.p_scene]:payload.p_mode}};
     return route.fulfill({json:state});
    }
    if(url.pathname.endsWith('/rpc/broadcast_studio_set_team_order')){
     assert.equal(req.headers().authorization,'Bearer fixture-token');
     const payload=req.postDataJSON();writes.push(payload);
     assert.equal(payload.p_action,'live');
     state={...state,liveTeamsReversed:!state.liveTeamsReversed};
     return route.fulfill({json:state});
    }
    if(url.pathname.endsWith('/broadcast_studio_state'))return route.fulfill({json:[{state}]});
    if(url.pathname.endsWith('/graphics-schedule'))return route.fulfill({json:{matches:[]}});
    if(url.searchParams.get('obs')==='1')return route.fulfill({contentType:'text/html',body:'<main>Match picture</main>'});
    return route.abort();
   });
   await page.goto(base+'presenter.html?lang=sv');
   assert.equal(await page.locator('h1,.intro').count(),0);
   await page.locator('#privateNotes textarea').waitFor({state:'visible'});
   const frame=page.frameLocator('#scenePicker');
   const series=page.frameLocator('#seriesPicker');
   const noteBox=await page.locator('#privateNotes').boundingBox(),seriesBox=await page.locator('#seriesPicker').boundingBox(),matchBox=await page.locator('#broadcast').boundingBox();
   assert(matchBox.y<=6&&matchBox.x<=8,'Match is close to the top and left edges');
   assert(seriesBox.y>=noteBox.y+noteBox.height,'Series controls sit under the notes');
   const original=page.locator('#originalFeed'),rawBox=await original.boundingBox();
   assert(rawBox.y>=seriesBox.y+seriesBox.height&&rawBox.width<=210,'Small original feed sits under the series editor');
   assert.match(await original.getAttribute('src'),/obs=1&viewer=1&feed=1/);
   assert.equal(toolsLoads,0);
   const tools=page.locator('#studioToolsFrame');
   assert.equal(await tools.getAttribute('src'),null);
   assert.equal(await tools.isVisible(),false);
   if(!['allowed','operator'].includes(mode)){
    await frame.locator('#compactLoginLink').waitFor({state:'visible'});
    assert.equal(await frame.locator('#compactLoginLink').getAttribute('href'),'mobile.html?lang=sv');
    assert.equal(await frame.locator('[data-scene="live"]').isVisible(),false);
    await series.locator('#compactLoginLink').waitFor({state:'visible'});
    assert.match(await series.locator('#compactLoginLink').innerText(),/serieläge/i);
    assert.equal(await series.locator('#seriesSummary').isVisible(),false);
    assert.equal(writes.length,0);
   }else{
    const live=frame.locator('[data-scene="live"].active');
    await live.waitFor({state:'visible'});
    assert.equal(await live.isEnabled(),true);
    await page.setViewportSize({width:1906,height:900});
    await page.waitForFunction(()=>document.getElementById('scenePicker').getBoundingClientRect().height===67);
    assert.deepEqual(await frame.locator('#compactPrimary > button[data-scene]').evaluateAll(buttons=>buttons.map(b=>b.dataset.scene)),
     ['opening','live','lineup','lineup','intermission','series','table','teamcompare','formguide','forwards','defense','goalies']);
    assert.deepEqual(await frame.locator('#compactSecondary > button[data-scene]').evaluateAll(buttons=>buttons.map(b=>b.dataset.scene)),
     ['matchup','groupmeetings','road','scorers','offense','defenseleaders','goalieleaders','keymatchup','spotlight','leaders']);
    assert.equal(await frame.locator('#compactScenes details').count(),0);
    await frame.locator('#compactSecondary [data-scene="matchup"]').waitFor({state:'visible'});
    const flipBox=await frame.locator('#mobileFlipLiveTeams').boundingBox(),liveBox=await live.boundingBox();
    assert.equal(flipBox.height,liveBox.height,'Flip and scene buttons have the same height');
    const goaliesBox=await frame.locator('[data-scene="goalies"]').boundingBox();
    const musicBox=await frame.locator('.compact-music').boundingBox();
    assert.equal(musicBox.y,goaliesBox.y,'Music stays on the upper row');
    assert.equal(flipBox.y,goaliesBox.y,'Flip stays on the upper row');
    assert(goaliesBox.x+goaliesBox.width<=musicBox.x&&musicBox.x+musicBox.width<=flipBox.x,'Music and flip sit to the right of Goalies');
    const desktopStrip=await page.locator('#scenePicker').boundingBox();
    assert(desktopStrip.y+desktopStrip.height<=900,'Both rows fit below the video on desktop');
    await page.setViewportSize({width:1280,height:800});
    await frame.locator('[data-scene="intermission"]').click();
    await frame.locator('[data-scene="intermission"].active').waitFor();
    assert.deepEqual(writes,[{p_channel:'sec21-bronze-test',p_scene:'intermission',p_lineup_side:null}]);
    assert.equal(state.hs,3);assert.equal(state.as,2);
    await page.setViewportSize({width:1920,height:1080});
    await series.locator('#seriesSummary').click();
    const editor=series.locator('.series-editor');
    const editorHeight=await editor.evaluate(el=>el.offsetHeight);
    assert(editorHeight<=172,'Open series editor uses at most 172 pixels on desktop');
    const inline=await series.locator('#mobileHomeGoals').evaluate(el=>el.offsetLeft>el.previousElementSibling.offsetLeft);
    assert(inline,'Score is next to its label on a wide sidebar');
    await series.locator('#mobileHomeGoals').fill('4');
    await series.locator('#mobileProgressResult').click();
    await series.locator('#mobileMatchResultStatus').getByText('Sparat i sändningen.').waitFor();
    assert.equal(writes[1].p_channel,'sec21-bronze-test');
    assert.equal(writes[1].p_home,4);
    assert.equal(state.scene,'intermission','Series editor leaves the live scene alone');
    assert.equal(await series.locator('#compactScenes').isVisible(),false);
    const music=frame.locator('.compact-music');
    assert.deepEqual(await music.locator('button').allTextContents(),['Hög','Låg','Av']);
    await music.locator('[data-music="high"]').click();
    await music.locator('[data-music="high"][aria-pressed="true"]').waitFor();
    assert.deepEqual(writes[2],{p_channel:'sec21-bronze-test',p_scene:'intermission',p_mode:'high'});
    await music.locator('[data-music="off"]').click();
    await music.locator('[data-music="off"][aria-pressed="true"]').waitFor();
    assert.equal(state.sceneMusic.muted,true);
    await frame.locator('[data-scene="live"]').click();
    await frame.locator('[data-scene="live"].active').waitFor();
    assert(await music.locator('[data-music="high"]').isDisabled());
    await frame.locator('#mobileFlipLiveTeams').click();
    await frame.locator('#mobileFlipLiveTeams[aria-pressed="true"]').waitFor();
    assert.match(await frame.locator('#mobileFlipLiveTeams').textContent(),/Testlaget B överst/);
    assert.deepEqual([state.home,state.away,state.hs,state.as],['111','222','4','2']);
   }
   await page.locator('#studioToolsTitle').click();
   const toolsPage=page.frameLocator('#studioToolsFrame');
   if(mode==='operator'){
    await toolsPage.locator('main').waitFor({state:'visible'});
    assert.match(await toolsPage.locator('#studio-session').innerText(),/SV-STUDION/);
    assert.equal(await toolsPage.locator('html[data-sv-studio-operator]').count(),1);
   }else{
    await toolsPage.locator('#studio-login').waitFor({state:'visible'});
    assert.equal(await toolsPage.locator('main').isVisible(),false,'Scene access does not unlock full studio tools');
   }
   assert.match(await tools.getAttribute('src'),/SV\/\?panel=tools/);
   const toolsBox=await tools.boundingBox(),workBox=await page.locator('.commentator-workspace').boundingBox();
   assert(toolsBox.width>=workBox.width-24,'Advanced section spans both presenter columns');
   assert.equal(toolsLoads,1);
   if(mode==='operator')for(const restricted of ['SV/?scope-test=1','fi/?panel=tools','en/?panel=tools','de/?panel=tools']){
    await page.goto(base+restricted);
    await page.locator('#studio-login').waitFor();
    await page.waitForFunction(()=>document.querySelector('#studio-login-status')?.textContent!=='Kontrollerar inloggningen…',null,{timeout:5000});
    assert.match(await page.locator('#studio-login-status').textContent(),/saknar behörighet|har inte tillgång/,restricted);
    assert.equal(await page.locator('main').isVisible(),false);
   }
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('PASS compact scenes use the existing signed-in channel gate, resize in the presenter, and do not change match data.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=file=>fs.readFileSync(__dirname+'/'+file,'utf8');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const mode of ['signed-out','denied','allowed']){
   const origin='https://presenter.test',base=origin+'/broadcast-studio/',writes=[],errors=[];
   const page=await browser.newPage({viewport:{width:1280,height:800}});
   page.on('pageerror',error=>errors.push(error.message));
   let state={leagueId:527,scene:'live',home:'111',away:'222',hs:3,as:2,lineupTeamNames:{111:'Testlaget A',222:'Testlaget B'},
    transientSource:{ticket:'fixture.ticket',expires_at:new Date(Date.now()+3600000).toISOString()}};
   await page.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url()),file=url.pathname.split('/').pop();
    const session=mode==='signed-out'?null:{access_token:'fixture-token'};
    if(url.hostname==='cdn.jsdelivr.net')return route.fulfill({contentType:'application/javascript',body:`window.supabase={createClient:()=>({
      auth:{onAuthStateChange(){},getSession:async()=>({data:{session:${JSON.stringify(session)}}}),getUser:async()=>({data:{user:{email:"fixture@example.test"}}})},
      rpc:async(name,args)=>({data:name==="swn_studio_scene_access"&&args.p_channel==="sec21-bronze-test"&&${mode==='allowed'}})
    })};`});
    if(url.origin!==origin)return route.abort();
    if(file==='presenter.html'||file==='mobile.html')return route.fulfill({contentType:'text/html',body:read(file)});
    if(file==='studio-access.js'||file==='studio-access.css')return route.fulfill({contentType:file.endsWith('.css')?'text/css':'application/javascript',body:read('../'+file)});
    if(file==='broadcast-config.js')return route.fulfill({contentType:'application/javascript',body:`window.EHOCKEY_CONFIG={supabaseUrl:${JSON.stringify(origin)},supabasePublishableKey:"fixture"};`});
    if(['mobile-control.js','commentator-notes.js','group-meetings.js','commentator-notes.css'].includes(file))return route.fulfill({contentType:file.endsWith('.css')?'text/css':'application/javascript',body:read(file)});
    if(url.pathname.endsWith('/rpc/broadcast_studio_set_scene')){
     assert.equal(req.headers().authorization,'Bearer fixture-token');
     const payload=req.postDataJSON();writes.push(payload);
     state={...state,scene:payload.p_scene};
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
   if(mode!=='allowed'){
    await frame.locator('#compactLoginLink').waitFor({state:'visible'});
    assert.equal(await frame.locator('#compactLoginLink').getAttribute('href'),'mobile.html?lang=sv');
    assert.equal(await frame.locator('[data-scene="live"]').isVisible(),false);
    assert.equal(writes.length,0);
   }else{
    const live=frame.locator('[data-scene="live"].active');
    await live.waitFor({state:'visible'});
    assert.equal(await live.isEnabled(),true);
    const bar=page.locator('#scenePicker'),initial=(await bar.boundingBox()).height;
    assert(initial<=72,'Quick controls fit within two compact rows on a laptop');
    await page.setViewportSize({width:1920,height:1080});
    await page.waitForFunction(()=>document.getElementById('scenePicker').getBoundingClientRect().height<=40);
    await page.setViewportSize({width:1280,height:800});
    assert.deepEqual(await frame.locator('#compactScenes > button').evaluateAll(buttons=>buttons.map(b=>b.dataset.scene)),
     ['opening','live','lineup','lineup','intermission','series','table','teamcompare','formguide','forwards','defense','goalies']);
    await frame.locator('[data-scene="intermission"]').click();
    await frame.locator('[data-scene="intermission"].active').waitFor();
    assert.deepEqual(writes,[{p_channel:'sec21-bronze-test',p_scene:'intermission',p_lineup_side:null}]);
    assert.equal(state.hs,3);assert.equal(state.as,2);
    await frame.locator('#compactExtra summary').click();
    await frame.locator('#compactExtra [data-scene="matchup"]').waitFor({state:'visible'});
    await page.waitForFunction(initial=>document.getElementById('scenePicker').getBoundingClientRect().height>initial,initial);
   }
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('PASS compact scenes use the existing signed-in channel gate, resize in the presenter, and do not change match data.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

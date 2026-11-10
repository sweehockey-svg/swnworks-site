const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=file=>fs.readFileSync(__dirname+'/'+file,'utf8');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const panel of [false,true]){
   const url='https://tools.test/broadcast-studio/SV/'+(panel?'?panel=tools':'');
   const page=await browser.newPage({viewport:{width:1400,height:900}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>r.request().url()===url?r.fulfill({contentType:'text/html',body:read('SV/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'')}):r.abort());
   await page.goto(url);
   await page.addStyleTag({content:read('broadcast-studio.css')});
   await page.addStyleTag({content:read('match-desk.css')});
   await page.evaluate(()=>{window.EHOCKEY_CONFIG={};document.documentElement.setAttribute('data-studio-locked','');});
   await page.addScriptTag({content:read('broadcast-studio.js')});
   await page.addScriptTag({content:read('match-desk.js')});
   await page.evaluate(()=>{
    document.querySelector('#tournament').closest('.block').insertAdjacentHTML('beforeend','<section class="stats-refresh"><button>Stats fixture</button></section>');
    document.querySelector('.stream-dock')?.insertAdjacentHTML('beforeend','<section class="recorder-panel">Recording fixture</section>');
    document.documentElement.removeAttribute('data-studio-locked');
   });
   assert.equal(await page.locator('.feed-monitor').isVisible(),!panel);
   assert.equal(await page.locator('.preview-shell').isVisible(),!panel);
   if(panel){
    const groups=page.locator('[data-tools-group]');
    await groups.first().waitFor();
    await page.locator('.scene-dock').evaluate(el=>el.insertAdjacentHTML('afterend','<section class="commentary-duo">Audio fixture</section>'));
    const tabs=page.locator('.presenter-tools-nav button');
    assert.deepEqual(await tabs.allTextContents(),['Förbered match','Grafik och lag','Sändning','Ljud och inspelning']);
    assert.equal(await page.locator('#studio-tools-prepare-button').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#deskEnd').isVisible(),false);
    assert.equal(await page.locator('.stats-refresh').isVisible(),false);
    await page.getByText('Statistik och tabell',{exact:true}).click();
    assert.equal(await page.locator('.stats-refresh').isVisible(),true);
    for(const [group,control] of [['prepare','#deskMatchSelect'],['prepare','#loadTwitch'],['prepare','.stats-refresh'],['graphics','#theme'],['graphics','#lineupEditors'],['broadcast','#deskTake'],['broadcast','#deskEnd'],['audio','.commentary-duo'],['audio','.recorder-panel']]){
     assert.equal(await page.locator(`[data-tools-group="${group}"] ${control}`).count(),1);
    }
    await page.locator('#twitchChannel').fill('fixture-channel');
    for(const group of ['broadcast','audio','graphics','prepare']){
     await page.locator(`#studio-tools-${group}-button`).click();
     assert.deepEqual(await groups.filter({visible:true}).evaluateAll(els=>els.map(el=>el.dataset.toolsGroup)),[group]);
    }
    assert.equal(await page.locator('#twitchChannel').inputValue(),'fixture-channel');
    await page.evaluate(()=>{
     for(const [side,id,name] of [['home','11','Hemmalaget'],['away','22','Bortalaget']]){
      const select=document.getElementById(side);select.add(new Option(name,id));select.value=id;
      select.dispatchEvent(new Event('change',{bubbles:true}));
     }
     const snapshot=window.__sehStudioSnapshot;
     window.__sehStudioSnapshot=()=>({...snapshot(),home:'11',away:'22',scene:'opening'});
     window.__sehStudioRestore=state=>{window.testPrepared=state;};
     window.__sehStudioTake=state=>{window.testTaken=state;return true;};
    });
    await page.getByText('Lagets Twitch-streamar',{exact:true}).click();
    await page.getByLabel('Hemmastream · Hemmalaget',{exact:true}).fill('https://www.twitch.tv/Fixture_Home');
    await page.getByLabel('Bortastream · Bortalaget',{exact:true}).fill('@Fixture_Away');
    await page.getByRole('button',{name:'Förhandsvisa · Bortastream · Bortalaget'}).click();
    assert.deepEqual(await page.evaluate(()=>({channel:testPrepared.twitchChannel,reversed:testPrepared.liveTeamsReversed,scene:testPrepared.scene,feeds:testPrepared.twitchTeamChannels})),
     {channel:'fixture_away',reversed:true,scene:'opening',feeds:{11:'fixture_home',22:'fixture_away'}});
    assert.equal(await page.evaluate(()=>window.testTaken),undefined,'A source preview does not publish anything');
    assert.deepEqual(await page.locator('main>aside,main>.workspace').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).display)),['contents','contents']);
    await page.setViewportSize({width:550,height:750});
    assert.equal(await page.locator('#studio-tools-prepare').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Tools fit the narrow viewport');
   }else assert.equal(await page.locator('[data-tools-group]').count(),0);
   assert.deepEqual(errors,[]);
   await page.close();
  }
  const presenter=await browser.newPage({viewport:{width:1400,height:900}});
  await presenter.route('https://tools.test/**',route=>{
   const url=new URL(route.request().url());
   if(url.pathname.endsWith('presenter.html'))return route.fulfill({contentType:'text/html',body:read('presenter.html')});
   if(url.searchParams.get('panel')==='tools')return route.fulfill({contentType:'text/html',body:'<!doctype html><html data-tools-ready><body style="margin:0"><div style="height:240px" id="fixture">Tools</div></body></html>'});
   return route.abort();
  });
  await presenter.goto('https://tools.test/broadcast-studio/presenter.html');
  await presenter.locator('#studioToolsTitle').click();
  await presenter.waitForFunction(()=>document.querySelector('#studioToolsFrame').clientHeight===240);
  await presenter.frameLocator('#studioToolsFrame').locator('#fixture').evaluate(el=>el.style.height='480px');
  await presenter.waitForFunction(()=>document.querySelector('#studioToolsFrame').clientHeight===480);
  await presenter.close();
  console.log('PASS presenter tools switch sections, preserve inputs, resize without extra scrollbars, and leave the main studio unchanged.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

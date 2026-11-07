const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=p=>fs.readFileSync(__dirname+'/'+p,'utf8');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 for(const lang of ['SV','en','fi','de']){
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.abort());
  await page.setContent('<base href="https://series.test/broadcast-studio/">'+read(lang+'/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'').replace(/<base\b[^>]*>/g,''));
  await page.addStyleTag({content:read('broadcast-studio.css')});await page.evaluate(()=>{window.EHOCKEY_CONFIG={};});
  await page.addScriptTag({content:read('studio-language.js')});
  await page.addScriptTag({content:read('broadcast-studio.js').replace('  function studioState(){','  window.seriesFixture={state:()=>studioState(),remote:s=>applyRemoteState(s)};\n  function studioState(){')});
  assert.equal(await page.locator('#showLiveSeries').count(),1);assert.equal(await page.locator('#showLiveSeries').isChecked(),false);
  for(const [bo,need] of [[3,2],[5,3],[7,4]]){
   await page.evaluate(({bo,need})=>{for(const [id,value] of [['seriesFormat',bo],['seriesHome',need],['seriesAway',1]])document.getElementById(id).value=value;document.getElementById('showLiveSeries').checked=true;document.getElementById('seriesFormat').dispatchEvent(new Event('change'));},{bo,need});
   assert.equal(await page.locator('.live-team-strip .homeTeam .live-series-wins i').count(),need);
   assert.equal(await page.locator('.live-team-strip .homeTeam .live-series-wins .won').count(),need);
   assert.equal(await page.locator('.live-team-strip .awayTeam .live-series-wins .won').count(),1);
  }
  const state=await page.evaluate(()=>seriesFixture.state());assert.equal(state.liveSeriesShow,true);
  await page.evaluate(s=>seriesFixture.remote({...s,scene:'live',seriesFormat:'5',seriesHome:'1',seriesAway:'0',liveSeriesShow:true}),state);
  assert.equal(await page.locator('.homeTeam .live-series-wins .won').count(),1);assert.equal(await page.locator('.awayTeam .live-series-wins .won').count(),0);
  assert.equal(await page.locator('.live-team-strip.has-series-wins').count(),1);
  await page.locator('#topSub').evaluate(el=>el.textContent='NORTHERN ZTARS HOCKEY vs SSK ACADEMY ESPORT');
  assert(await page.locator('#topSub').evaluate(el=>el.scrollWidth<=el.clientWidth),'Longest SCL matchup must fit compact banner');
  const size=await page.locator('.live-team-strip').evaluate(el=>({width:el.offsetWidth,height:el.offsetHeight}));assert.deepEqual(size,{width:162,height:72});
  assert(await page.locator('.live-team-strip .homeTeam').evaluate(el=>el.querySelector('.live-series-wins').getBoundingClientRect().top>=el.querySelector('b').getBoundingClientRect().bottom),'Marks below team name, including missing logo');
  if(lang==='SV'&&process.env.SERIES_TEST_SCREENSHOT){await page.locator('#screen').screenshot({path:process.env.SERIES_TEST_SCREENSHOT});}
  await page.evaluate(s=>seriesFixture.remote({...s,scene:'live',liveSeriesShow:false}),state);assert.equal(await page.locator('.live-team-strip.has-series-wins').count(),0);
  await page.evaluate(s=>{delete s.liveSeriesShow;seriesFixture.remote(s);},state);assert.equal(await page.locator('#showLiveSeries').isChecked(),false,'Old state must not enable series marks');
  assert.equal(await page.locator('#arenaMist').isChecked(),false,'Existing matches default to still background');
  await page.locator('#arenaMist').check();
  assert.equal(await page.evaluate(()=>seriesFixture.state().arenaMist),true,'Checkbox serializes to OBS state');
  const mistStyle=()=>page.locator('.background-package-layer').evaluate(el=>{const style=getComputedStyle(el,'::before');return {content:style.content,animation:style.animationName,duration:style.animationDuration,opacity:Number(style.opacity)};});
  for(const scene of ['opening','matchup','intermission']){
   await page.evaluate(({s,scene})=>seriesFixture.remote({...s,scene,backgroundPackage:'gamenight',arenaMist:true}),{s:state,scene});
   const mist=await mistStyle();
   assert.equal(mist.animation,'arena-mist-drift',lang+' '+scene);
   assert.equal(mist.duration,'10s','Mist should travel noticeably over a few seconds');
   assert(mist.opacity>=.45,'Moving layer must not be too faint against baked-in smoke');
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal((await mistStyle()).animation,'none','Reduced motion suppresses movement');
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const [scene,backgroundPackage,arenaMist] of [['live','gamenight',true],['table','gamenight',true],['opening','broadcast',true],['opening','gamenight',false]]){
   await page.evaluate(s=>seriesFixture.remote(s),{...state,scene,backgroundPackage,arenaMist});
   assert.equal((await mistStyle()).content,'none','No mist outside opted-in Game Night presentation scenes');
  }
  assert.deepEqual(errors,[],lang);await page.close();
 }
 const motionPage=await browser.newPage({viewport:{width:1920,height:1080},reducedMotion:'no-preference'});
 await motionPage.setContent('<body data-background="gamenight"><div class="screen arena-mist-enabled" data-arena-scene="opening" style="position:relative;width:1000px;height:563px"><div class="background-package-layer"></div></div></body>');
 await motionPage.route('**/*',r=>r.abort());
 await motionPage.addStyleTag({content:read('broadcast-studio.css')});
 const mistX=()=>motionPage.locator('.background-package-layer').evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el,'::before').transform).m41/el.offsetWidth);
 const start=await mistX();
 await motionPage.waitForFunction(start=>{const el=document.querySelector('.background-package-layer');return Math.abs(new DOMMatrixReadOnly(getComputedStyle(el,'::before').transform).m41/el.offsetWidth-start)>.1;},start,{timeout:3000});
 await motionPage.close();
 console.log('PASS SV/EN/FI/DE: series display, OBS state, mist motion and scene restrictions. Isolated browser; no production writes.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

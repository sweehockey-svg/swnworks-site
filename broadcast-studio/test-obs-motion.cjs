const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=file=>fs.readFileSync(__dirname+'/'+file,'utf8');
const source=read('broadcast-studio.js').replace('  function studioState(){','  window.motionFixture={state:()=>studioState(),remote:s=>applyRemoteState(s)};\n  function studioState(){');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const origin='https://motion.test',path='/broadcast-studio/SV/';
  const html=read('SV/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'');
  for(const [query,forced] of [['obs=1&motion=on',true],['obs=1',false],['obs=1&viewer=1&motion=on',false],['obs=1&preview=1&motion=on',false],['motion=on',false]]){
   const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',r=>r.request().url().startsWith(origin+path+'?')?r.fulfill({contentType:'text/html',body:html}):r.abort());
   await page.goto(origin+path+'?'+query);
   await page.addStyleTag({content:read('broadcast-studio.css')});
   await page.addScriptTag({content:read('studio-language.js')});
   await page.addScriptTag({content:source});
   const scene=(scene,arenaMist=true)=>page.evaluate(({scene,arenaMist})=>motionFixture.remote({...motionFixture.state(),scene,arenaMist,backgroundPackage:'gamenight'}),{scene,arenaMist});
   const effects=()=>page.locator('.background-package-layer').evaluate(el=>({
    mist:getComputedStyle(el,'::before').animationName,
    edge:getComputedStyle(el.querySelector('.arena-edge-lights')).display,
    center:getComputedStyle(el.querySelector('.arena-center-light')).display
   }));
   await scene('opening');
   assert.deepEqual(await effects(),forced?{mist:'arena-mist-drift',edge:'block',center:'block'}:{mist:'none',edge:'none',center:'none'},query);
   if(forced){
    const initial=await page.locator('.background-package-layer').evaluate(el=>getComputedStyle(el,'::before').transform);
    await page.waitForFunction(initial=>getComputedStyle(document.querySelector('.background-package-layer'),'::before').transform!==initial,initial);
    await scene('opening',false);
    assert.deepEqual(await effects(),{mist:'none',edge:'none',center:'none'});
    await scene('live');
    assert.deepEqual(await effects(),{mist:'none',edge:'none',center:'none'});
    assert.equal(await page.locator('.background-package-layer').isVisible(),false);
   }
   assert.deepEqual(errors,[],query);
   await page.close();
  }
  console.log('PASS motion=on overrides reduced motion only in OBS output, never in Match Live or when studio effects are off.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

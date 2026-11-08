const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=file=>fs.readFileSync(__dirname+'/'+file,'utf8');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const origin='https://feed.test',url=origin+'/broadcast-studio/SV/?obs=1&viewer=1&feed=1';
  let state={scene:'opening',publicNoMatch:false,twitchShow:false,videoSource:'direct',hlsUrl:origin+'/match.mp4'};
  const requests=[],errors=[],page=await browser.newPage({viewport:{width:210,height:118}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__played=0;
   HTMLMediaElement.prototype.load=function(){};
   HTMLMediaElement.prototype.play=function(){window.__played++;this.dispatchEvent(new Event('playing'));return Promise.resolve();};
   HTMLMediaElement.prototype.pause=function(){};
  });
  await page.route('**/*',r=>{
   const req=r.request();requests.push(req.method());
   if(req.url()===url)return r.fulfill({contentType:'text/html',body:read('SV/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'')});
   if(req.url().includes('/rest/v1/broadcast_studio_state'))return r.fulfill({json:[{state}]});
   return r.abort();
  });
  await page.goto(url);
  await page.addStyleTag({content:read('broadcast-studio.css')});
  await page.evaluate(origin=>{window.EHOCKEY_CONFIG={supabaseUrl:origin,supabasePublishableKey:'fixture'};},origin);
  await page.addScriptTag({content:read('broadcast-studio.js')});
  await page.waitForFunction(()=>window.__played>0&&document.getElementById('rawFeedStatus').hidden);
  const video=page.locator('#directVideo');
  assert.equal(await video.getAttribute('src'),origin+'/match.mp4');
  assert.equal(await video.evaluate(el=>el.muted&&!el.controls),true);
  assert.equal(await page.locator('.scene,.top,.bug').first().isVisible(),false);
  state={...state,scene:'series'};
  await page.waitForResponse(r=>r.url().includes('/rest/v1/broadcast_studio_state'));
  assert.equal(await page.evaluate(()=>window.__played),1,'Scene changes do not restart the original feed');
  state={...state,publicNoMatch:true};
  await page.locator('#rawFeedStatus').getByText('Ingen aktiv match eller stream').waitFor();
  assert.equal(await video.getAttribute('src'),null);
  assert(requests.every(method=>method==='GET'));assert.deepEqual(errors,[]);
  console.log('PASS raw feed starts while Opening is on air, stays muted across scenes and stops on the waiting screen.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

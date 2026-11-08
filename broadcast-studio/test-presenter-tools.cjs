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
    document.querySelector('.scene-dock').insertAdjacentHTML('afterend','<section class="commentary-duo">Audio fixture</section>');
    document.querySelector('.stream-dock')?.insertAdjacentHTML('beforeend','<section class="recorder-panel">Recording fixture</section>');
    document.documentElement.removeAttribute('data-studio-locked');
   });
   assert.equal(await page.locator('.feed-monitor').isVisible(),!panel);
   assert.equal(await page.locator('.preview-shell').isVisible(),!panel);
   if(panel){
    const groups=page.locator('[data-tools-group]');
    await groups.last().waitFor();
    assert.deepEqual(await groups.locator('h2').allTextContents(),['Förbered match','Grafik och lag','Sändning','Ljud och inspelning']);
    for(const [group,control] of [['prepare','#deskMatchSelect'],['prepare','#loadTwitch'],['graphics','#theme'],['graphics','#lineupEditors'],['broadcast','#deskTake'],['broadcast','#deskEnd'],['audio','.commentary-duo'],['audio','.recorder-panel']]){
     assert.equal(await page.locator(`[data-tools-group="${group}"] ${control}`).count(),1);
    }
   }else assert.equal(await page.locator('[data-tools-group]').count(),0);
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('PASS the presenter tools hide both video previews and group the remaining tools; the main studio is unchanged.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

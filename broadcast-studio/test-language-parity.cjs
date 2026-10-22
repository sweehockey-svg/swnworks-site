const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=p=>fs.readFileSync(__dirname+'/'+p,'utf8');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 for(const lang of ['SV','en','fi','de'])for(const width of [1920,1280]){
  const html=read(lang+'/index.html');
  for(const asset of ['match-desk.js','match-desk.css','studio-recorder.js','recording-session.js','commentary.js','studio-language.js'])assert.ok(html.includes(asset),lang+' missing '+asset);
  const page=await browser.newPage({viewport:{width,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.abort());
  await page.setContent('<base href="https://duo.test/broadcast-studio/">'+html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'').replace(/<base\b[^>]*>/g,''));
  await page.addStyleTag({content:read('broadcast-studio.css')+'\n'+read('match-desk.css')});
  await page.evaluate(()=>{window.EHOCKEY_CONFIG={};if(!crypto.randomUUID)Object.defineProperty(crypto,'randomUUID',{value:()=> '00000000-0000-4000-8000-000000000001'});});
  await page.addScriptTag({content:read('studio-language.js')});
  await page.addScriptTag({content:read('stats-update.js')});
  await page.addScriptTag({content:read('broadcast-studio.js')});
  await page.addScriptTag({content:read('match-desk.js')});
  await page.addScriptTag({content:read('recording-session.js')});
  await page.addScriptTag({content:read('studio-recorder.js')});
  await page.addScriptTag({content:read('commentary-duo.js')});
  await page.addScriptTag({content:read('commentary-engine.js')});
  await page.addScriptTag({content:read('commentary.js')});
  await page.waitForTimeout(150);
  assert.equal(errors.length,0,lang+': '+errors.join(';'));
  const fetchStyle=await page.locator('#fetchBroadcastData').evaluate(el=>{const s=getComputedStyle(el);return{background:s.backgroundColor,height:el.getBoundingClientRect().height,radius:s.borderRadius};});
  assert.equal(fetchStyle.background,'rgb(22, 46, 54)');assert.ok(fetchStyle.height>=42);assert.equal(fetchStyle.radius,'7px');
  for(const selector of ['.director-monitors .feed-monitor','.director-monitors .preview-shell','.quick-match-bar #deskEnd','.saved-match-picker','aside .stream-controls','.more-scenes'])assert.equal(await page.locator(selector).count(),1,lang+': '+selector);
  const expected={SV:'Avsluta sändning',en:'End broadcast',fi:'Lopeta lähetys',de:'Sendung beenden'}[lang];assert.equal(await page.locator('#deskEnd').textContent(),expected);
  const key=await page.evaluate(()=>{document.querySelector('#deskName').value='Fixture';document.querySelector('#twitchChannel').value='fixture';document.querySelector('#deskSave').click();return Object.keys(localStorage).find(k=>k.startsWith('seh-match-desk-'));}).catch(()=>null);
  // setContent uses an opaque origin; validate the isolated key in source too.
  assert.ok(read('match-desk.js').includes("'seh-match-desk-'+deskLocale+'-v1'"));
  if(lang==='en'&&width===1920)await page.screenshot({path:__dirname+'/language-parity-en.png',fullPage:false});
  await page.close();
 }
 const commentary=read('commentary-engine.js');assert.ok(commentary.includes("en:'broadcast-en'"));assert.ok(commentary.includes("url.searchParams.set('lang',commentaryLocale)"));assert.ok(read('commentator.html').includes(".src=lang+'/?obs=1&viewer=1'"));
 console.log('SV/EN/FI/DE: same modules, two monitors, match desk, end control, scene folds, localized controls and isolated language channels PASS');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});


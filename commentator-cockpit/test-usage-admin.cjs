const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let html=fs.readFileSync(__dirname+'/admin/index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link[^>]*>/g,'');
  await page.setContent(html);await page.addStyleTag({content:fs.readFileSync(__dirname+'/admin/admin.css','utf8')});
  await page.evaluate(()=>{
   window.COMMENTATOR_CONFIG={};window.session={user:{id:'admin'}};
   window.fixture={ok:true,generated_at:'2026-10-18T21:00:00Z',tracking_started_at:'2026-10-18T20:00:00Z',users:[{user_id:'1',email:'test@example.com',display_name:'Testkommentator A',active:true,last_sign_in_at:'2026-10-18T12:48:00Z',usage:{last_seen:'2026-10-18T13:55:00Z',page_opens:3,view_opens:8,player_opens:2,active_minutes:4},saved:[{kind:'notes',total:2}]},{user_id:'2',email:'other@example.com',display_name:'Testkommentator B <img src=x onerror=alert(1)>',active:true,usage:{},saved:[]}],timeline:[{owner_id:'1',event:'view_open',league_key:'hockeyettan',feature:'players',created_at:'2026-10-18T13:55:00Z',team_name:'Testlaget'}],logins:[{user_id:'1',created_at:'2026-10-18T12:48:00Z'}],features:[{feature:'players',event:'view_open',total:8}],timeline_total:1};
   window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:window.session}}),onAuthStateChange:f=>{window.authChanged=f;}},functions:{invoke:async(_name,{body})=>{window.lastBody=body;return window.deny?{error:{}}:{data:window.fixture};}}})};
  });
  await page.addScriptTag({content:fs.readFileSync(__dirname+'/admin/admin.js','utf8')});
  await page.locator('#dashboard').waitFor({state:'visible'});
  assert.equal(await page.locator('#users tr').count(),2);assert.equal(await page.locator('#users img').count(),0,'names escaped');
  assert((await page.locator('#users').innerText()).includes('14:48'),'Swedish timezone');
  await page.selectOption('#person','1');await page.waitForFunction(()=>window.lastBody?.user_id==='1');
  assert.equal(await page.locator('#users tr').count(),1);
  await page.selectOption('#person','');await page.waitForFunction(()=>window.lastBody?.user_id===null);
  await page.screenshot({path:__dirname+'/usage-admin-preview.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile viewport has no page overflow');
  await page.evaluate(()=>window.authChanged('SIGNED_OUT'));
  assert.equal(await page.locator('#users tr').count(),0,'logout clears private rendered rows');
  await page.evaluate(()=>{window.deny=true;window.session={user:{id:'ordinary'}};window.authChanged('SIGNED_IN');});
  await page.waitForFunction(()=>document.querySelector('#gate').innerText.includes('adminbehörighet'));
  assert.equal(await page.locator('#dashboard').isVisible(),false,'denied account no dashboard');assert.deepEqual(errors,[]);
  console.log('PASS admin rendering, Swedish dates, person filter, escaping, mobile, logout clearing, denied state');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

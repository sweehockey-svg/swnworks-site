// Isolated DOM fixture: real form/save functions, mocked network, no production writes.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const src=fs.readFileSync(process.argv[2]||__dirname+'/hockeyettan/cockpit.js','utf8');
function section(from,to){const a=src.indexOf(from),b=src.indexOf(to,a+from.length);assert(a>=0&&b>a,from);return src.slice(a,b);}
const functions=section('  async function invokeAccessAdmin(', '  function swahnworksAboutCard(')+section('  function restoreAccessFormDraft(', '  function bindAccountUi(');
const marker='accessForm.addEventListener("submit",async(event)=>{',a=src.indexOf(marker),b=src.indexOf('\n      });',a);
assert(a>=0&&b>a);const handler=src.slice(a+marker.length,b);
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.route('**/*',route=>route.abort());
 for(const key of ['hockeyettan','hockeytvaan','suomi-sarja']){
  await page.setContent('<main id="fixture"></main>');
  await page.addScriptTag({content:`(()=>{
   const state={accessAdminBusy:false,accessAdminError:'',accessAdminItems:[],competitionTeams:[{id:'FIRST-TEAM',canonical_name:'A-team'},{id:'VASBY-ID',canonical_name:'Väsby IK HK'}]};
   const league={accessKey:${JSON.stringify(key)},displayName:'Test league'},calls=[];
   let mode='success',admin=true,release;
   const isAccessAdmin=()=>admin,globalAdminAccess=()=>null;
   const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
   const client={functions:{invoke:async(name,{body})=>{calls.push(structuredClone(body));if(body.action==='list')return {data:{ok:true,items:[]}};if(mode==='hold')await new Promise(resolve=>release=resolve);if(mode==='throw')throw Error('offline');if(mode==='http')return {error:{message:'HTTP 500'}};return {data:mode==='fail'?{ok:false,error:'insert_failed'}:{ok:true}};}}};
   ${functions}
   function renderDrawer(){document.getElementById('fixture').innerHTML=accessAdminHtml();const f=document.getElementById('accessForm');f?.addEventListener('submit',async event=>{${handler}});document.getElementById('accessScope')?.addEventListener('change',()=>{document.getElementById('accessTeam').disabled=document.getElementById('accessScope').value!=='team';});}
   window.fixture={state,calls,setMode:v=>mode=v,setAdmin:v=>admin=v,release:()=>release?.(),refresh:refreshAccessAdminList,invoke:invokeAccessAdmin};renderDrawer();
  })();`});
  assert.deepEqual(errors,[],'Fixture script errors');
  assert.equal(await page.locator('#accessEmail').count(),1,'Form must render for '+key);
  for(const scope of ['team','league','admin']){
   await page.locator('#accessEmail').fill('form-test@example.invalid');await page.locator('#accessName').fill('Selected Person');await page.locator('#accessScope').selectOption(scope);
   if(scope==='team')await page.locator('#accessTeam').selectOption('VASBY-ID');
   await page.locator('#accessForm button').click();await page.waitForFunction(()=>!fixture.state.accessAdminBusy);
   const sent=await page.evaluate(()=>fixture.calls.filter(x=>x.action==='upsert').at(-1));
   assert.deepEqual(sent,{action:'upsert',email:'form-test@example.invalid',display_name:'Selected Person',scope,league_key:scope==='admin'?null:key,team_id:scope==='team'?'VASBY-ID':null});
  }
  for(const mode of ['fail','http','throw']){
   await page.evaluate(mode=>fixture.setMode(mode),mode);
   await page.locator('#accessEmail').fill('retry@example.invalid');await page.locator('#accessName').fill('Keep my name');await page.locator('#accessScope').selectOption('team');await page.locator('#accessTeam').selectOption('VASBY-ID');
   await page.locator('#accessForm button').click();await page.waitForFunction(()=>!fixture.state.accessAdminBusy&&fixture.state.accessAdminError);
   assert.equal(await page.locator('#accessEmail').inputValue(),'retry@example.invalid');assert.equal(await page.locator('#accessName').inputValue(),'Keep my name');assert.equal(await page.locator('#accessTeam').inputValue(),'VASBY-ID');
   assert(await page.locator('.account-message').isVisible());
   await page.evaluate(()=>fixture.refresh());assert(await page.evaluate(()=>fixture.state.accessAdminError));
  }
  await page.evaluate(()=>{fixture.calls.length=0;fixture.setMode('hold');});
  await page.locator('#accessForm button').click();await page.waitForFunction(()=>fixture.state.accessAdminBusy);
  assert(await page.locator('#accessForm button').isDisabled());
  await page.evaluate(()=>document.getElementById('accessForm').dispatchEvent(new Event('submit',{cancelable:true})));
  assert.equal(await page.evaluate(()=>fixture.calls.filter(x=>x.action==='upsert').length),1,'No duplicate request');
  await page.evaluate(()=>fixture.release());await page.waitForFunction(()=>!fixture.state.accessAdminBusy);
  const denied=await page.evaluate(async()=>{fixture.setAdmin(false);const before=fixture.calls.length;const result=await fixture.invoke({action:'upsert'});return {result,extra:fixture.calls.length-before};});assert.equal(denied.result.error,'admin_required');assert.equal(denied.extra,0);
 }
 console.log('PASS: selected team/name/scope survive re-render in all three leagues; save/HTTP/network failures stay visible and retain draft; list refresh preserves errors; duplicate requests blocked; non-admin rejected. Mock network only.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});

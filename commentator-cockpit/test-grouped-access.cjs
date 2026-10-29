// Real admin rendering and event handlers; isolated browser and mocked API only.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const src=fs.readFileSync(__dirname+'/hockeyettan/cockpit.js','utf8');
function section(a,b){const start=src.indexOf(a),end=src.indexOf(b,start);assert(start>=0&&end>start);return src.slice(start,end);}
const functions=section('  async function invokeAccessAdmin(','  function swahnworksAboutCard(')+section('  function restoreAccessFormDraft(','  let baseDataLoadPromise=');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage();await page.route('**/*',r=>r.abort());
 for(const key of ['hockeyettan','hockeytvaan','suomi-sarja']){
  await page.setContent('<main id="fixture"></main>');
  await page.addScriptTag({content:`(()=>{
   const state={authUser:null,accessAdminLoaded:true,accessAdminBusy:false,accessAdminError:'',competitionTeams:[{id:'A',canonical_name:'Tranås AIF'},{id:'B',canonical_name:'Nyköpings SK'},{id:'C',canonical_name:'Nytt lag'}],accessAdminItems:[]};
   const league={accessKey:${JSON.stringify(key)},displayName:'Testliga'},calls=[],storage=new Map();let confirmed=false,failId=null,admin=true;
   const window={confirm:()=>confirmed,setTimeout(){},location:{href:'https://example.invalid/commentator-cockpit/'+league.accessKey+'/',assign:url=>calls.push({navigate:url})}};
   const sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
   const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
   const isAccessAdmin=()=>admin,globalAdminAccess=()=>({id:'SELF'}),drawerBody=document.getElementById('fixture');
   const client={functions:{invoke:async(name,{body})=>{calls.push({...body});if(body.action==='list')return {data:{ok:true,items:state.accessAdminItems}};if(body.id===failId)return {data:{ok:false}};if(body.action==='deactivate')state.accessAdminItems.find(x=>x.id===body.id).active=false;return {data:{ok:true}};}}};
   ${functions}
   function reset(){state.accessAdminDraft=null;state.accessAdminError='';state.accessAdminItems=[{id:'1',email:' William@example.com ',display_name:'William',role:'commentator',team_id:'A',team_name:'Tranås AIF',league_key:league.accessKey,active:true},{id:'2',email:'william@example.com',display_name:'William',role:'commentator',team_id:'B',team_name:'Nyköpings SK',league_key:league.accessKey,active:true},{id:'SELF',email:'admin@example.com',display_name:'Admin',role:'admin',active:true}];calls.length=0;failId=null;confirmed=false;renderDrawer();}
   function renderDrawer(){drawerBody.innerHTML=accessAdminHtml();bindAccountUi();}
   globalThis.fixture={state,calls,storage,reset,render:renderDrawer,confirm:v=>confirmed=v,fail:v=>failId=v,setAdmin:v=>admin=v};reset();
  })();`});
  assert.equal(await page.locator('.access-person').count(),2);
  await page.addStyleTag({content:fs.readFileSync(__dirname+'/hockeyettan/cockpit.css','utf8')+'\nbody{display:block;padding:16px}#fixture{max-width:900px;margin:auto}'});
  await page.setViewportSize({width:420,height:900});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile horizontal overflow');
  assert(await page.locator('.access-row>em').first().isVisible(),'Mobile status remains visible');
  if(key==='hockeyettan'&&process.env.ACCESS_TEST_SCREENSHOT)await page.screenshot({path:process.env.ACCESS_TEST_SCREENSHOT,fullPage:true});
  await page.setViewportSize({width:1100,height:900});
  const william=page.locator('.access-person').filter({hasText:'William'});
  assert.equal(await william.locator('.access-row').count(),2);
  assert.equal(await page.locator('[data-access-deactivate="SELF"]').count(),0);
  await page.locator('#accessScope').selectOption('admin');
  await william.locator('[data-access-add-team]').click();
  assert.equal(await page.locator('#accessEmail').inputValue(),'william@example.com');
  assert.equal(await page.locator('#accessName').inputValue(),'William');
  assert.equal(await page.locator('#accessScope').inputValue(),'team');
  await page.locator('#accessTeam').selectOption('A');await page.locator('#accessForm button').click();
  assert.equal(await page.evaluate(()=>fixture.calls.filter(x=>x.action==='upsert').length),0);
  assert.match(await page.locator('.account-message').innerText(),/redan aktiv/);
  await page.locator('#accessTeam').selectOption('C');await page.locator('#accessForm button').click();
  await page.waitForFunction(()=>!fixture.state.accessAdminBusy);
  const payload=await page.evaluate(()=>fixture.calls.find(x=>x.action==='upsert'));
  assert.deepEqual(payload,{action:'upsert',email:'william@example.com',display_name:'William',scope:'team',league_key:key,team_id:'C'});
  await page.evaluate(()=>fixture.reset());await page.locator('[data-access-deactivate="1"]').click();await page.waitForFunction(()=>!fixture.state.accessAdminBusy);
  assert.equal(await page.evaluate(()=>fixture.state.accessAdminItems.find(x=>x.id==='2').active),true);
  await page.evaluate(()=>fixture.reset());await page.locator('[data-access-deactivate-all]').click();
  assert.equal(await page.evaluate(()=>fixture.calls.length),0,'Cancelled bulk must not call API');
  await page.evaluate(()=>{fixture.confirm(true);fixture.fail('2');});await page.locator('[data-access-deactivate-all]').click();await page.waitForFunction(()=>!fixture.state.accessAdminBusy);
  assert.equal(await page.evaluate(()=>fixture.calls.filter(x=>x.action==='deactivate').length),2);
  assert.match(await page.locator('.account-message').innerText(),/1 behörigheter/);
  await page.evaluate(()=>fixture.reset());
  const other=key==='hockeyettan'?'hockeytvaan':'hockeyettan';
  await page.locator('[data-access-person-league]').first().selectOption(other);await page.locator('[data-access-add-team]').first().click();
  const nav=await page.evaluate(()=>({url:fixture.calls.find(x=>x.navigate)?.navigate,draft:JSON.parse(fixture.storage.get('cockpit-access-add-team'))}));
  assert(nav.url.endsWith('/'+other+'/'));assert.equal(nav.draft.email,'william@example.com');assert.equal(nav.draft.scope,'team');
  await page.evaluate(()=>{fixture.setAdmin(false);fixture.render();});assert.equal(await page.locator('.access-person').count(),0);
 }
 console.log('PASS grouped identity, normalized email, add team without role escalation, duplicate guard, isolated deactivation, bulk confirmation/partial failure, cross-league draft, non-admin in all 3 leagues. No production writes.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=p=>fs.readFileSync(__dirname+'/'+p,'utf8'),src=read('broadcast-studio.js'),road=src.slice(src.indexOf('  function renderRoad()'),src.indexOf('  function renderLeaders()'));
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 for(const lang of ['SV','en','fi','de']){
  const page=await browser.newPage({viewport:{width:1400,height:1000}});await page.route('**/*',r=>r.abort());
  await page.setContent(read(lang+'/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'').replace(/<base\b[^>]*>/g,''));
  await page.addStyleTag({content:read('broadcast-studio.css')+'\n#screen{width:1280px!important;height:720px!important;transform:none!important}'});
  await page.addScriptTag({content:`(()=>{const $=s=>document.querySelector(s),LOCALE='sv';const toggle=document.createElement('input');toggle.id='showLiveSeries';toggle.type='checkbox';toggle.checked=true;document.body.append(toggle);$('#seriesHome').value=1;$('#seriesAway').value=0;const selectedTeam=side=>({team_name_in_league:side==='home'?'INVICTUS AEGIS':'LättyStugan HC'}),stage=(t,s)=>s==='regular'?{total_wins:12,goals_for:56,goals_against:25}:{total_wins:3,games_played:4},playoff=()=>({}),number=v=>v!=null&&v!==''&&Number.isFinite(Number(v))?Number(v):null,logo=()=>'',image=()=>'',esc=v=>String(v),tx=k=>({groupstage:'GRUPPSPEL',wins:'vinster',goals:'MÅL',playoffs:'SLUTSPEL',matchWins:'matchvinster',matches:'MATCHER',seriesState:'SERIELÄGE'}[k]||k),seriesBestOf=n=>'BÄST AV '+n;${road};document.querySelectorAll('.scene').forEach(e=>e.classList.remove('active'));$('.scene.road').classList.add('active');renderRoad();})();`});
  await page.evaluate(()=>{const screen=document.querySelector('#screen');document.body.replaceChildren(screen);document.body.style.display='block';});
  const result=await page.locator('#screen').evaluate(screen=>{const bug=screen.querySelector('.bug').getBoundingClientRect();return [...screen.querySelectorAll('.road-card')].map(card=>{const box=card.getBoundingClientRect();const steps=[...card.querySelectorAll('.road-step')];return {bottom:box.bottom,bugTop:bug.top,content:steps.every(s=>s.getBoundingClientRect().bottom<=box.bottom),rows:steps.length,text:card.innerText};});});
  for(const card of result){assert.equal(card.rows,3);assert(card.content,'Card content fits '+lang);assert(card.bottom<card.bugTop,'Card stays above footer '+lang);}
  assert(result[0].text.includes('1 matchvinst'));assert(!result[0].text.includes('1 matchvinster'));
  if(lang==='SV'&&process.env.ROAD_TEST_SCREENSHOT)await page.locator('#screen').screenshot({path:process.env.ROAD_TEST_SCREENSHOT});
  await page.close();
 }
 console.log('PASS road layout in all four languages: three rows fit above footer; singular matchvinst.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

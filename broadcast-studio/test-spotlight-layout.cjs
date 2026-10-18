const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const source=fs.readFileSync(__dirname+'/broadcast-studio.js','utf8'),css=fs.readFileSync(__dirname+'/broadcast-studio.css','utf8');
const portrait='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="700" height="1100"><rect width="700" height="1100" fill="#15354a"/></svg>');
const p={display_gamertag:'Tdxbz-',player_number:8,regular_points:18,regular_goals:1,regular_assists:17,regular_penalty_minutes:2};
const ctx={bestLineupSkater:side=>side==='home'?{p,slot:'RD'}:null,selectedTeam:()=>({team_name_in_league:'4N Team NA'}),total:(a,b)=>a==null&&b==null?null:Number(a||0)+Number(b||0),stat:x=>x??'–',tx:String,esc:String,playerFlag:()=>'',logo:()=>'',playerImage:()=>portrait,image:src=>'<img src="'+src+'">'};
vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function spotlightHtml()'),source.indexOf('  function renderRoleMatchups()')),ctx);
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 for(const [width,height] of [[1920,1080],[1280,720],[960,540]])for(const graphics of ['standard','gamenight']){
  const page=await browser.newPage({viewport:{width,height}});await page.route('**/*',route=>route.abort());
  await page.setContent('<html lang="sv"><head><style>'+css+'</style></head><body class="obs-preview" data-theme="broadcast" data-graphics="'+graphics+'"><main><div class="workspace"><div class="screen"><div class="scene spotlight active"><div class="spotlight-wrap">'+ctx.spotlightHtml()+'</div></div></div></div></main></body></html>');
  const result=await page.locator('.spotlight').evaluate(panel=>{
   const bounds=panel.getBoundingClientRect(),elements=[...panel.querySelectorAll('.spotlight-player>img,.spotlight-copy,.spotlight-copy h2,.spotlight-stats>div')];
   return {overflow:elements.map(el=>({name:el.className||el.tagName,rect:el.getBoundingClientRect()})).filter(({rect:r})=>r.bottom>bounds.bottom+1||r.top<bounds.top-1||r.left<bounds.left-1||r.right>bounds.right+1).map(x=>x.name),tops:[...panel.querySelectorAll('.spotlight-stats>div')].map(el=>el.getBoundingClientRect().top)};
  });
  assert.deepEqual(result.overflow,[],width+' '+graphics+' elements must remain inside the spotlight panel');
  assert.equal(new Set(result.tops.map(Math.round)).size,1,'All five statistics, including PIM, must fit on one row');
  await page.close();
 }
 console.log('Spotlight bounds passed: full portrait, five stats, footer clearance and both graphics packages at 1920, 1280 and 960 pixels.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});

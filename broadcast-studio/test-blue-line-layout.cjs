const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=p=>fs.readFileSync(__dirname+'/'+p,'utf8');
const js=read('broadcast-studio.js');
const imageHelper=js.slice(js.indexOf('  function image('),js.indexOf('  function playerFlag('));
const matchupCard=js.slice(js.indexOf('  function matchupCard('),js.indexOf('  function bestLineupSkater('));
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const lang of ['SV','en','fi','de']){
   const page=await browser.newPage({viewport:{width:1280,height:720}});
   await page.route(/^https?:/,r=>r.abort());
   await page.setContent(read(lang+'/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'').replace(/<base\b[^>]*>/g,''));
   await page.addStyleTag({content:read('broadcast-studio.css')+'\n#screen{width:1280px!important;height:720px!important;transform:none!important}'});
   await page.addScriptTag({content:`(()=>{
    const portrait='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2800"><rect width="1600" height="2800" fill="navy"/></svg>');
    const selectedTeam=side=>({team_name_in_league:side==='home'?'INVICTUS AEGIS':'LättyStugan HC'});
    const lineupPlayer=(side,slot)=>({player_number:27,display_gamertag:'Kungenanton02',portrait:side==='away'&&slot==='RD'?'':portrait,regular_skater_games:14,playoff_skater_games:4,regular_penalty_minutes:12,playoff_penalty_minutes:2});
    const playerImage=p=>p.portrait,playerFlag=()=>'',logo=()=>portrait,esc=String,stat=v=>v??'–',tx=k=>k==='group'?'GRUPPSPEL':'SLUTSPEL';
    ${imageHelper}
    ${matchupCard}
    const screen=document.querySelector('#screen');
    document.body.replaceChildren(screen);
    document.body.className='obs-preview';
    document.body.dataset.graphics='gamenight';
    screen.querySelectorAll('.scene').forEach(s=>s.classList.toggle('active',s.classList.contains('defense')));
    screen.querySelector('#defenseGrid').innerHTML=['home','away'].flatMap(side=>['LD','RD'].map(slot=>matchupCard(side,slot,'skater'))).join('');
   })();`});
   await page.locator('#defenseGrid img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
   for(const width of [1280,1920]){
    await page.setViewportSize({width,height:width*9/16});
    const result=await page.locator('#defenseGrid .role-card').evaluateAll(cards=>cards.map(card=>{
     const box=card.getBoundingClientRect(),info=card.querySelector('.role-info').getBoundingClientRect(),rows=[...card.querySelectorAll('.role-stat')];
     const last=rows.at(-1).getBoundingClientRect();
     const crop=card.querySelector('.portrait-crop'),rect=crop?.getBoundingClientRect();
     return {rows:rows.map(row=>row.firstElementChild.textContent),pim:[...rows.at(-1).querySelectorAll('b')].map(b=>b.textContent),clearance:Math.min(info.bottom,box.bottom)-last.bottom,
      portrait:crop?{clipped:getComputedStyle(crop).overflow==='hidden',zoom:new DOMMatrix(getComputedStyle(crop.firstElementChild).transform).a,fits:rect.height>0&&rect.right<=info.left+1}:null};
    }));
    assert.equal(result.length,4);
    assert.equal(result.filter(card=>card.portrait).length,3);
    for(const card of result){
     assert.deepEqual(card.rows,['GP','G','A','P','PIM']);
     assert.deepEqual(card.pim,['12','2']);
     assert(card.clearance>=4,`${lang} ${width}px: last stat needs breathing room, got ${card.clearance}px`);
     if(card.portrait)assert.deepEqual(card.portrait,{clipped:true,zoom:1.55,fits:true});
    }
   }
   await page.close();
  }
  console.log('PASS Blue Line: all five rows in both columns fit every card at 720p and 1080p, with large portraits and fallback.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

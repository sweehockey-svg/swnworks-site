const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=file=>fs.readFileSync(__dirname+'/'+file,'utf8');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1906,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const root='https://lineups.test/broadcast-studio/';
  const studio=read('SV/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'');
  const fixture=read('broadcast-studio.js').replace('  function studioState(){',`  window.lineupFixture={seed:(teams,players)=>{data.teams=teams;data.players=players;renderAllCompetitionData();},apply:s=>applyRemoteState(viewerState(s))};
  function studioState(){`);
  await page.route('**/*',route=>{
   const url=route.request().url();
   if(!url.startsWith(root))return route.abort();
   if(url.includes('/presenter.html'))return route.fulfill({contentType:'text/html; charset=utf-8',body:read('presenter.html')});
   if(url.includes('/SV/')&&url.includes('obs=1')&&!url.includes('feed=1'))return route.fulfill({contentType:'text/html; charset=utf-8',body:studio.replace('</body>','<script>window.EHOCKEY_CONFIG={};</script><script src="fixture.js"></script></body>')});
   if(url.endsWith('/fixture.js'))return route.fulfill({contentType:'application/javascript; charset=utf-8',body:fixture});
   if(url.includes('commentator-notes.css'))return route.fulfill({contentType:'text/css',body:read('commentator-notes.css')});
   if(url.includes('commentator-notes.js'))return route.fulfill({contentType:'application/javascript; charset=utf-8',body:read('commentator-notes.js')});
   return route.fulfill({contentType:'text/html',body:'<!doctype html>'});
  });
  await page.goto(root+'presenter.html?lang=sv');
  const away=['RD','G','LD','RW','C','LW'],home=['LW','C','RW','LD','G','RD'];
  const teams=[{sports_gamer_team_id:11,team_name_in_league:'Hemmalaget'},{sports_gamer_team_id:22,team_name_in_league:'Bortalaget'}];
  const players=[{sports_gamer_team_id:22,sports_gamer_player_id:221,player_number:19,display_gamertag:'AwayRD'},{sports_gamer_team_id:11,sports_gamer_player_id:111,player_number:0,display_gamertag:'HomeLW'}];
  const state={home:'11',away:'22',scene:'opening',lineups:{home:{LW:'111'},away:{RD:'221'}}};
  const frame=page.frame({url:/\/SV\/\?obs=1&viewer=1&presenter=1/});
  await frame.waitForFunction(()=>!!window.lineupFixture);
  await frame.evaluate(({teams,players,state})=>{lineupFixture.seed(teams,players);lineupFixture.apply(state);},{teams,players,state});
  const panels=page.locator('.presenter-lineup-team');
  await panels.last().waitFor();
  assert.deepEqual(await panels.locator('h3').allTextContents(),['Bortalaget','Hemmalaget']);
  assert.deepEqual(await panels.nth(0).locator('small').allTextContents(),['RD · #19',...away.slice(1)]);
  assert.deepEqual(await panels.nth(1).locator('small').allTextContents(),['LW · #0',...home.slice(1)]);
  assert.deepEqual(await panels.locator('li span').allTextContents(),['AwayRD','–','–','–','–','–','HomeLW','–','–','–','–','–']);
  assert.equal(await frame.locator('#presenterLineups').count(),0,'The video frame has no presenter panel');
  await page.evaluate(()=>window.postMessage({type:'seh-presenter-lineups',lineups:null},location.origin));
  assert.equal(await panels.count(),2,'Messages not from the broadcast frame are ignored');
  await frame.evaluate(s=>lineupFixture.apply({...s,publicNoMatch:true}),state);
  await page.locator('#presenterLineupStatus').waitFor();
  assert.equal(await panels.count(),0,'The roster clears when the broadcast goes idle');
  assert.deepEqual(errors,[]);
  console.log('Presenter lineups passed: both mirrored lines, number zero, empty slots, active match only, frame source checks.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

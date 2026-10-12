const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:1400,height:1000}});
 await page.route('**/*',route=>route.abort());
 await page.route('https://swnworks.se/graphics-studio/',route=>route.fulfill({body:'<html></html>',contentType:'text/html'}));
 await page.goto('https://swnworks.se/graphics-studio/');
 await page.setContent(fs.readFileSync(__dirname+'/index.html','utf8').replace('<head>','<head><base href="https://swnworks.se/graphics-studio/">').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,''));
 await page.addScriptTag({content:fs.readFileSync(__dirname+'/language.js','utf8')});
 let src=fs.readFileSync(__dirname+'/app.js','utf8');
 src=src.slice(0,src.indexOf('$$("[data-kind]")'))+`window.testRoster=(format,stats)=>{S.kind='roster';S.players=Array.from({length:11},(_,i)=>({sports_gamer_team_id:1,sports_gamer_player_id:i,team_name_in_league:'VBO STARS',display_gamertag:'Testspelare '+(i+1),is_current_roster:true,player_country:'SE',roster_preferred_position_abbreviation:i>8?'G':'RW',regular_skater_games:6,regular_goals:3,regular_assists:4,regular_points:7,regular_goalie_games:4,regular_goalie_save_percentage:82.5,regular_goalie_goals_against_average:2.25,regular_goalie_shutouts:1}));document.querySelector('#format').value=format;document.querySelector('#rosterDisplay').value=stats?'stats':'portraits';render();};})();`;
 await page.addScriptTag({content:src});
 for(const format of ['wide','portrait','square','story']){
  await page.evaluate(format=>window.testRoster(format,true),format);
  assert.equal(await page.locator('[data-roster-stats]').count(),11);
  assert.equal(await page.locator('#stageField').isVisible(),true);
  const clipped=await page.locator('[data-player-id]').evaluateAll(cards=>cards.some(card=>{const rect=card.querySelector('rect'),bottom=+rect.getAttribute('y')+(+rect.getAttribute('height'));return [...card.querySelectorAll('text')].some(text=>+text.getAttribute('y')>bottom);}));
  assert.equal(clipped,false,format+' statistics extend outside cards');
 }
 await page.evaluate(()=>window.testRoster('wide',true));
 await page.locator('#preview').screenshot({path:__dirname+'/../../roster-stats-proof.png'});
 await page.evaluate(()=>window.testRoster('wide',false));
 assert.equal(await page.locator('[data-roster-stats]').count(),0);assert.equal(await page.locator('#stageField').isVisible(),false);
 console.log('Roster layout passed: stats and default mode, all four formats, period visibility and card bounds.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:1400,height:1000}});
 await page.route('**/*',route=>route.abort());
 await page.route('https://swnworks.se/graphics-studio/',route=>route.fulfill({body:'<html></html>',contentType:'text/html'}));
 await page.goto('https://swnworks.se/graphics-studio/');
 await page.setContent(fs.readFileSync(__dirname+'/index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,''));
 await page.addScriptTag({content:fs.readFileSync(__dirname+'/language.js','utf8')});
 let src=fs.readFileSync(__dirname+'/app.js','utf8');
 src=src.slice(0,src.indexOf('$$("[data-kind]")'))+`window.testPlayer=(format)=>{S.kind='player';S.players=[{sports_gamer_team_id:1,sports_gamer_player_id:1,team_name_in_league:'TEST TEAM',display_gamertag:'Test Forward',is_current_roster:true,roster_preferred_position_abbreviation:'RW',regular_skater_games:6,regular_goals:3,regular_assists:4,regular_points:7},{sports_gamer_team_id:1,sports_gamer_player_id:2,team_name_in_league:'TEST TEAM',display_gamertag:'Test Goalie',is_current_roster:true,roster_preferred_position_abbreviation:'G',regular_goalie_games:4,regular_goalie_save_percentage:.825,regular_goalie_goals_against_average:2.25,regular_goalie_shutouts:1}];document.querySelector('#format').value=format;render();};document.querySelector('#singlePlayer').onchange=()=>{singlePlayerId=document.querySelector('#singlePlayer').value;render();};})();`;
 await page.addScriptTag({content:src});
 for(const format of ['wide','portrait','square','story']){
  await page.evaluate(format=>window.testPlayer(format),format);
  assert.equal(await page.locator('[data-single-player]').count(),1);
  assert.equal(await page.locator('#singlePlayer option').count(),2);
  assert.equal(await page.locator('#singlePlayerField').isVisible(),true);
  assert.equal(await page.locator('#rosterPlayersField').isVisible(),false);
  assert.equal(await page.locator('#stageField').isVisible(),true);
  await page.selectOption('#singlePlayer','2');
  assert.equal(await page.locator('[data-single-player]').getAttribute('data-single-player'),'2');
  assert((await page.locator('#preview').textContent()).includes('82,5'));
  const outside=await page.locator('#preview svg').first().evaluate(svg=>[...svg.querySelectorAll('text')].some(t=>+t.getAttribute('y')>+svg.getAttribute('height')-20));assert.equal(outside,false);
 }
 await page.evaluate(()=>window.testPlayer('portrait'));
 await page.locator('#preview').screenshot({path:__dirname+'/../../player-presentation-proof.png'});
 console.log('Player presentation passed: one player, goalie stats, picker and all formats.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

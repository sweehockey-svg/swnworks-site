const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=p=>fs.readFileSync(__dirname+'/'+p,'utf8');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required']});try{
 for(const lang of ['SV','en','fi','de']){
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.abort());
  await page.setContent('<base href="https://series.test/broadcast-studio/">'+read(lang+'/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'').replace(/<base\b[^>]*>/g,''));
  await page.addStyleTag({content:read('broadcast-studio.css')});await page.evaluate(()=>{window.EHOCKEY_CONFIG={};});
  await page.addScriptTag({content:read('studio-language.js')});
  await page.addScriptTag({content:read('broadcast-studio.js').replace('  function studioState(){','  window.seriesFixture={state:()=>studioState(),remote:s=>applyRemoteState(s),compare:teams=>{const prior=data.teams;data.teams=teams;renderTeamCompare();data.teams=prior;}};\n  function studioState(){')});
  await page.evaluate(()=>seriesFixture.remote({...seriesFixture.state(),scene:'lineup'}));
  await page.locator('.lineup .players').evaluate(grid=>{
   const card=document.createElement('div');
   card.className='player';
   card.innerHTML='<img alt=""><div class="player-info lineup-stage-info"><strong><span class="lineup-meta">#27 <img class="player-flag" alt=""></span><span class="lineup-gt">Testspelare</span></strong><small>14 GP · 3 G · 10 A<br>4 GP · 2 G · 3 A</small></div>';
   grid.replaceChildren(card);
  });
  const lineupCrop=await page.locator('.lineup .player').evaluate(card=>({
   zoom:new DOMMatrixReadOnly(getComputedStyle(card.firstElementChild).transform).a,
   flag:getComputedStyle(card.querySelector('.player-flag')).transform,
   stats:getComputedStyle(card.querySelector('.player-info')).transform
  }));
  assert.equal(lineupCrop.zoom,2.22,lang+' portrait zoom');
  const avatarZoom=await page.locator('.lineup .player>img').evaluate(img=>{
   img.src='https://fixture.invalid/players/1DEFAULTBILDID.png';
   return new DOMMatrixReadOnly(getComputedStyle(img).transform).a;
  });
  assert.equal(avatarZoom,1.62,lang+' fallback avatar uses a wider crop');
  assert.equal(lineupCrop.flag,'none','Flag stays at its original size');
  assert.equal(lineupCrop.stats,'none','Name and stats stay at their original size');
  assert.equal(await page.locator('[data-scene="defense"],.scene.defense').count(),2);
  assert.equal(await page.locator('[data-scene="lowerthird"],.scene.lowerthird').count(),0);
  await page.evaluate(()=>seriesFixture.remote({...seriesFixture.state(),scene:'defense'}));
  assert.equal(await page.evaluate(()=>seriesFixture.state().scene),'defense','Blue Line remains selectable');
  await page.evaluate(()=>seriesFixture.remote({...seriesFixture.state(),scene:'lowerthird'}));
  assert.equal(await page.evaluate(()=>seriesFixture.state().scene),'matchup','Retired scene safely falls back to Matchup');
  assert.equal(await page.locator('#showLiveSeries').count(),1);assert.equal(await page.locator('#showLiveSeries').isChecked(),false);
  for(const [bo,need] of [[3,2],[5,3],[7,4]]){
   await page.evaluate(({bo,need})=>{for(const [id,value] of [['seriesFormat',bo],['seriesHome',need],['seriesAway',1]])document.getElementById(id).value=value;document.getElementById('showLiveSeries').checked=true;document.getElementById('seriesFormat').dispatchEvent(new Event('change'));},{bo,need});
   assert.equal(await page.locator('.live-team-strip .homeTeam .live-series-wins i').count(),need);
   assert.equal(await page.locator('.live-team-strip .homeTeam .live-series-wins .won').count(),need);
   assert.equal(await page.locator('.live-team-strip .awayTeam .live-series-wins .won').count(),1);
  }
  const state=await page.evaluate(()=>seriesFixture.state());assert.equal(state.liveSeriesShow,true);
  const openingRound=page.locator('.opening-round');
  await page.evaluate(s=>seriesFixture.remote({...s,scene:'opening',seriesRound:'SLUTSPEL'}),state);
  assert.notEqual(await openingRound.getAttribute('hidden'),null,'Generic playoff default stays hidden');
  await page.evaluate(s=>seriesFixture.remote({...s,scene:'opening',seriesRound:' Semifinal '}),state);
  assert.equal(await openingRound.textContent(),'SEMIFINAL');
  assert.equal(await openingRound.getAttribute('hidden'),null);
  await page.locator('#seriesRound').fill('Kvartsfinal');
  assert.equal(await openingRound.textContent(),'KVARTSFINAL','Round updates from the studio input');
  await page.locator('#seriesRound').fill('');
  assert.notEqual(await openingRound.getAttribute('hidden'),null,'Blank round stays hidden');
  const presents={SV:'PRESENTERAR',en:'PRESENTS',fi:'ESITTÄÄ',de:'PRÄSENTIERT'}[lang];
  const presenter=page.locator('.opening>.eyebrow');
  await page.locator('#footerBrand').selectOption('sportsgamer');
  assert.equal(await presenter.textContent(),'SPORTSGAMER '+presents);
  const branded=await page.evaluate(()=>seriesFixture.state());
  assert.equal(branded.footerBrand,'sportsgamer');
  await page.evaluate(s=>seriesFixture.remote({...s,footerBrand:'seh'}),branded);
  assert.equal(await presenter.textContent(),'SVENSK eHOCKEY '+presents);
  await page.evaluate(s=>seriesFixture.remote(s),branded);
  assert.equal(await presenter.textContent(),'SPORTSGAMER '+presents,'Remote state updates Opening too');
  const showSeries=(home,seriesHome)=>page.evaluate(({s,home,seriesHome})=>seriesFixture.remote({...s,home,away:'222',scene:'series',graphicsPackage:'gamenight',backgroundPackage:'gamenight',arenaMist:true,seriesFormat:'5',seriesHome,seriesAway:'0'}),{s:state,home,seriesHome});
  await showSeries('111','1');
  const seriesStyle=await page.locator('.series-board').evaluate(board=>({
   background:getComputedStyle(board).backgroundImage,
   outline:getComputedStyle(board).borderTopWidth,
   namePlate:getComputedStyle(board.querySelector('.series-team>b')).clipPath
  }));
  assert.equal(seriesStyle.background,'none','Game Night series has no large blue panel');
  assert.equal(seriesStyle.outline,'0px');
  assert.match(seriesStyle.namePlate,/^polygon/,'Team names use the Opening-style nameplate');
  assert.equal(await page.locator('.series-dots .new-win').count(),0,'Initial series state does not pulse');
  await showSeries('111','2');
  const wonPulse=page.locator('#seriesHomeDots .new-win');
  assert.equal(await wonPulse.count(),1,'Only the new win pulses');
  assert.equal(await wonPulse.evaluate(el=>getComputedStyle(el).animationName),'series-win-pulse');
  await showSeries('111','2');
  assert.equal(await wonPulse.count(),1,'Unchanged snapshots do not restart the pulse');
  await showSeries('333','3');
  assert.equal(await page.locator('.series-dots .new-win').count(),0,'A different matchup does not pulse');
  await page.evaluate(s=>{
   seriesFixture.remote({...s,scene:'opening',graphicsPackage:'gamenight',backgroundPackage:'gamenight',arenaMist:true});
   const logo=document.querySelector('.opening-match .homeTeam>img');
   logo.src='data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E';logo.hidden=false;
  },state);
  const openingLight=()=>page.locator('.opening-match .homeTeam').evaluate(el=>getComputedStyle(el,'::before').animationName);
  assert.equal(await openingLight(),'opening-logo-light');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await openingLight(),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(s=>seriesFixture.remote({...s,scene:'teamcompare',graphicsPackage:'gamenight',backgroundPackage:'gamenight',arenaMist:true}),state);
  const duelCards=await page.locator('.tc-team,.goalie-person,.key-person').evaluateAll(cards=>cards.map(card=>({
   background:getComputedStyle(card).backgroundImage,border:getComputedStyle(card).borderColor
  })));
  assert.equal(duelCards.length,6);
  for(const card of duelCards){
   assert(card.background.includes('rgba(2, 12, 21, 0.98)'),lang+' duel card uses dark Game Night surface');
   assert.equal(card.border,'rgba(255, 189, 0, 0.42)');
  }
  const comparisonRows=()=>page.locator('#teamCompare .tc-row').evaluateAll(rows=>rows.map(row=>[...row.querySelectorAll('b')].map(el=>el.textContent)));
  assert.deepEqual((await comparisonRows()).slice(0,2),[['–','–','–','–'],['–','–','–','–']]);
  await page.evaluate(()=>seriesFixture.compare([
   {sports_gamer_team_id:'',team_name_in_league:'Test',team_logo_in_league:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%2F%3E',statistics_stage:'regular',games_played:14,total_wins:12,losses:2},
   {sports_gamer_team_id:'',team_name_in_league:'Test',statistics_stage:'playoffs',games_played:4,total_wins:3,losses:1}
  ]));
  const compare=await comparisonRows();
  assert.equal(compare.length,6);
  assert.deepEqual(compare.slice(0,3),[['14','4','14','4'],['12–2','3–1','12–2','3–1'],['86%','75%','86%','75%']]);
  assert(await page.locator('#teamCompare').evaluate(grid=>{
   const center=grid.querySelector('.tc-center').offsetHeight;
   return center>0&&[...grid.querySelectorAll('.tc-team')].every(card=>Math.abs(card.offsetHeight-center)<=1);
  }),lang+' team cards align with the six-row table');
  const duelCard=page.locator('#teamCompare .tc-team').first();
  assert.equal(await duelCard.locator('img').evaluate(logo=>logo.offsetHeight),168);
  const light=()=>duelCard.evaluate(card=>getComputedStyle(card,'::before').animationName);
  assert.equal(await light(),'team-duel-light');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await light(),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('#arenaMist').uncheck();
  assert.equal(await light(),'none','Light follows the same motion toggle as mist');
  await page.evaluate(s=>seriesFixture.remote({...s,scene:'live',seriesFormat:'5',seriesHome:'1',seriesAway:'0',liveSeriesShow:true}),state);
  assert.equal(await page.locator('.homeTeam .live-series-wins .won').count(),1);assert.equal(await page.locator('.awayTeam .live-series-wins .won').count(),0);
  assert.equal(await page.locator('.live-team-strip.has-series-wins').count(),1);
  await page.evaluate(s=>seriesFixture.remote({...s,scene:'live',seriesHome:'1',seriesAway:'0',liveSeriesShow:true,liveTeamsReversed:true}),state);
  assert.equal(await page.locator('.live-team-strip > :first-child.awayTeam').count(),1);
  assert.equal(await page.locator('.live-team-strip .homeTeam .live-series-wins .won').count(),1,'Win marks stay attached to home team');
  assert.equal(await page.evaluate(()=>seriesFixture.state().liveTeamsReversed),true);
  await page.locator('#topSub').evaluate(el=>el.textContent='NORTHERN ZTARS HOCKEY vs SSK ACADEMY ESPORT');
  assert(await page.locator('#topSub').evaluate(el=>el.scrollWidth<=el.clientWidth),'Longest SCL matchup must fit compact banner');
  const size=await page.locator('.live-team-strip').evaluate(el=>({width:el.offsetWidth,height:el.offsetHeight}));assert.deepEqual(size,{width:162,height:72});
  assert(await page.locator('.live-team-strip .homeTeam').evaluate(el=>el.querySelector('.live-series-wins').getBoundingClientRect().top>=el.querySelector('b').getBoundingClientRect().bottom),'Marks below team name, including missing logo');
  if(lang==='SV'&&process.env.SERIES_TEST_SCREENSHOT){await page.locator('#screen').screenshot({path:process.env.SERIES_TEST_SCREENSHOT});}
  await page.evaluate(s=>seriesFixture.remote({...s,scene:'live',liveSeriesShow:false}),state);assert.equal(await page.locator('.live-team-strip.has-series-wins').count(),0);
  await page.evaluate(s=>{delete s.liveSeriesShow;seriesFixture.remote(s);},state);assert.equal(await page.locator('#showLiveSeries').isChecked(),false,'Old state must not enable series marks');
  assert.equal(await page.locator('#arenaMist').isChecked(),false,'Existing matches default to still background');
  assert.deepEqual(state.sceneMusic,{});
  await page.locator('#music-scene').selectOption('opening');
  assert.equal(await page.locator('#music-level').inputValue(),'high');
  await page.locator('#music-scene').selectOption('intermission');
  assert.equal(await page.locator('#music-level').inputValue(),'low');
  await page.locator('#music-level').selectOption('off');
  const music=await page.evaluate(()=>seriesFixture.state());
  assert.deepEqual(music.sceneMusic,{muted:true});
  await page.evaluate(s=>seriesFixture.remote({...s,scene:'opening'}),music);
  assert.notEqual(await page.locator('.scene-music-credit').getAttribute('hidden'),null,'Off carries across scenes');
  assert.equal(await page.locator('#music-level').inputValue(),'off');
  await page.locator('#music-scene').selectOption('opening');
  await page.locator('#music-level').selectOption('high');
  assert.equal(await page.locator('.scene-music-credit').getAttribute('hidden'),null);
  await page.locator('#music-scene').selectOption('intermission');
  assert.equal(await page.locator('#music-level').inputValue(),'low');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.sceneMusic),undefined,'Director never starts music audio');
  await page.locator('#arenaMist').check();
  assert.equal(await page.evaluate(()=>seriesFixture.state().arenaMist),true,'Checkbox serializes to OBS state');
  const mistStyle=()=>page.locator('.background-package-layer').evaluate(el=>{const style=getComputedStyle(el,'::before');return {content:style.content,animation:style.animationName,duration:style.animationDuration,opacity:Number(style.opacity),display:getComputedStyle(el).display};});
  const edgeLight=()=>page.locator('.arena-edge-lights').evaluate(el=>({display:getComputedStyle(el).display,animations:[...el.children].map(light=>getComputedStyle(light).animationName),timings:[...el.children].map(light=>getComputedStyle(light).animationDelay)}));
  const centerLight=()=>page.locator('.arena-center-light').evaluate(el=>({display:getComputedStyle(el).display,animation:getComputedStyle(el).animationName}));
  const scenes=await page.locator('[data-scene]').evaluateAll(buttons=>[...new Set(buttons.map(b=>b.dataset.scene))].filter(scene=>scene!=='live'));
  for(const scene of [...scenes,'idle','nextmatch']){
   await page.evaluate(({s,scene})=>seriesFixture.remote({...s,scene,backgroundPackage:'gamenight',arenaMist:true}),{s:state,scene});
   // The live video may remain visible during the outgoing scene transition.
   await page.waitForFunction(()=>!document.querySelector('#screen').classList.contains('live-mode'),null,{timeout:3000});
   const mist=await mistStyle();
   assert.equal(mist.animation,'arena-mist-drift',lang+' '+scene);
   assert.equal(mist.duration,'10s','Mist should travel noticeably over a few seconds');
   assert(mist.opacity>=.45,'Moving layer must not be too faint against baked-in smoke');
   assert.equal(mist.display,'block',lang+' '+scene);
   const lights=await edgeLight();
   assert.equal(lights.display,'block');
   assert.deepEqual(lights.animations,Array(6).fill('arena-edge-pulse'));
   assert.equal(new Set(lights.timings).size,6,'Edge pulses are staggered');
   assert.deepEqual(await centerLight(),{display:'block',animation:'arena-center-shimmer'});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal((await mistStyle()).animation,'none','Reduced motion suppresses movement');
  assert.equal((await edgeLight()).display,'none','Reduced motion also hides the edge lights');
  assert.equal((await centerLight()).display,'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const [scene,backgroundPackage,arenaMist] of [['live','gamenight',true],['live','gamenight',false],['live','broadcast',true],['opening','broadcast',true],['opening','gamenight',false]]){
   await page.evaluate(s=>seriesFixture.remote(s),{...state,scene,backgroundPackage,arenaMist});
   const mist=await mistStyle();
   assert.equal(mist.content,'none','No mist in Match Live, when off or outside Game Night');
   assert.equal((await edgeLight()).display,'none','Edge lights also stay off');
   assert.equal((await centerLight()).display,'none','Center shimmer also stays off');
   if(scene==='live')assert.equal(mist.display,'none','Live never displays the background layer');
  }
  assert.deepEqual(errors,[],lang);await page.close();
 }
 const obs=await browser.newPage();
 const origin='https://series.test';
 await obs.route('**/*',r=>{
  const url=new URL(r.request().url());
  if(url.origin!==origin)return r.abort();
  if(url.pathname==='/broadcast-studio/assets/aztrozmurfen-superhero-in-the-game.mp3')return r.fulfill({contentType:'audio/mpeg',path:__dirname+'/assets/aztrozmurfen-superhero-in-the-game.mp3'});
  if(url.pathname!=='/broadcast-studio/SV/')return r.abort();
  return r.fulfill({contentType:'text/html',body:read('SV/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'')});
 });
 await obs.goto(origin+'/broadcast-studio/SV/?obs=1');
 await obs.evaluate(()=>{
  window.EHOCKEY_CONFIG={};
  const Audio=window.Audio;
  window.Audio=function(src){return window.testMusicAudio=new Audio(src);};
 });
 await obs.addScriptTag({content:read('studio-language.js')});
 await obs.addScriptTag({content:read('broadcast-studio.js').replace('  function studioState(){','  window.seriesFixture={state:()=>studioState(),remote:s=>applyRemoteState(s)};\n  function studioState(){')});
 const setMusicScene=(scene,sceneMusic={})=>obs.evaluate(({scene,sceneMusic})=>seriesFixture.remote({...seriesFixture.state(),scene,sceneMusic}),{scene,sceneMusic});
 assert.equal(await obs.evaluate(()=>!!window.testMusicAudio),false,'Output waits for program state');
 await setMusicScene('opening');
 await obs.waitForFunction(()=>window.testMusicAudio?.currentTime>.05);
 assert.equal(await obs.evaluate(()=>testMusicAudio.volume),.32);
 assert.equal(await obs.evaluate(()=>testMusicAudio.loop),true);
 assert.equal(await obs.locator('.scene-music-credit').getAttribute('hidden'),null);
 await setMusicScene('table');
 assert.equal(await obs.evaluate(()=>testMusicAudio.volume),.10);
 assert.equal(await obs.evaluate(()=>testMusicAudio.paused),false);
 assert.notEqual(await obs.locator('.scene-music-credit').getAttribute('hidden'),null);
 await setMusicScene('live',{live:'high'});
 assert.equal(await obs.evaluate(()=>testMusicAudio.paused),true,'Never plays during Match Live');
 await setMusicScene('opening');
 await obs.waitForFunction(()=>window.testMusicAudio?.currentTime>.05&&!testMusicAudio.paused);
 await setMusicScene('matchup',{muted:true});
 assert.equal(await obs.evaluate(()=>testMusicAudio.paused),true,'Off stops the track');
 await setMusicScene('opening',{muted:true});
 assert.equal(await obs.evaluate(()=>testMusicAudio.paused),true,'Changing scenes does not restart music');
 await setMusicScene('opening',{opening:'low'});
 await obs.waitForFunction(()=>window.testMusicAudio?.currentTime>.05&&!testMusicAudio.paused);
 assert.equal(await obs.evaluate(()=>testMusicAudio.volume),.10,'Low explicitly resumes playback');
 await obs.close();
 const motionPage=await browser.newPage({viewport:{width:1920,height:1080},reducedMotion:'no-preference'});
 await motionPage.setContent('<body data-background="gamenight"><div class="screen arena-mist-enabled" data-arena-scene="opening" style="position:relative;width:1000px;height:563px"><div class="background-package-layer"></div></div></body>');
 await motionPage.route('**/*',r=>r.abort());
 await motionPage.addStyleTag({content:read('broadcast-studio.css')});
 const mistX=()=>motionPage.locator('.background-package-layer').evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el,'::before').transform).m41/el.offsetWidth);
 const start=await mistX();
 await motionPage.waitForFunction(start=>{const el=document.querySelector('.background-package-layer');return Math.abs(new DOMMatrixReadOnly(getComputedStyle(el,'::before').transform).m41/el.offsetWidth-start)>.1;},start,{timeout:3000});
 await motionPage.close();
 console.log('PASS SV/EN/FI/DE: series display, OBS state, mist motion and real MP3 playback with per-scene volume, credit and live silence. Isolated browser; no production writes.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

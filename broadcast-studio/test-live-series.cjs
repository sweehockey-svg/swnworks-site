const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=p=>fs.readFileSync(__dirname+'/'+p,'utf8');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required']});try{
 for(const lang of ['SV','en','fi','de']){
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.abort());
  await page.setContent('<base href="https://series.test/broadcast-studio/">'+read(lang+'/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'').replace(/<base\b[^>]*>/g,''));
  await page.addStyleTag({content:read('broadcast-studio.css')});await page.evaluate(()=>{window.EHOCKEY_CONFIG={};});
  await page.addScriptTag({content:read('studio-language.js')});
  await page.addScriptTag({content:read('group-meetings.js')});
  await page.addScriptTag({content:read('broadcast-studio.js').replace('  function studioState(){','  window.seriesFixture={state:()=>studioState(),remote:s=>applyRemoteState(s),standings:teams=>{data.teams=teams;},seedPlayers:players=>{data.players=players;renderSeries();},compare:teams=>{const prior=data.teams;data.teams=teams;renderTeamCompare();data.teams=prior;}};\n  function studioState(){')});
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
  assert.equal(await page.locator('[data-scene="stats"],.scene.stats').count(),0);
  assert.equal(await page.locator('[data-scene="matchup"],.scene.matchup').count(),2,'VS scene stays available');
  await page.evaluate(()=>seriesFixture.remote({...seriesFixture.state(),scene:'stats'}));
  assert.equal(await page.evaluate(()=>seriesFixture.state().scene),'teamcompare','Legacy Stats shows Lagduellen');
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
  const seriesHistory=(wins,results)=>page.evaluate(({s,wins,results})=>seriesFixture.remote({...s,scene:'series',seriesFormat:'5',seriesHome:wins,seriesAway:'0',seriesShowResults:true,seriesResults:results}),{s:state,wins,results});
  await seriesHistory('1',['3–1']);
  assert.equal(await page.locator('#seriesResultsList span').count(),1);
  await seriesHistory('0',['3–1']);
  assert.notEqual(await page.locator('#seriesResults').getAttribute('hidden'),null,'Old history does not show at 0–0');
  await seriesHistory('0',[]);
  assert.equal(await page.locator('#seriesR1').inputValue(),'','A reset clears the saved score field');
  const openingRound=page.locator('.opening-round');
  await page.evaluate(s=>seriesFixture.remote({...s,scene:'opening',seriesRound:'SLUTSPEL'}),state);
  assert.notEqual(await openingRound.getAttribute('hidden'),null,'Generic playoff default stays hidden');
  await page.evaluate(s=>seriesFixture.remote({...s,scene:'opening',seriesRound:' Semifinal '}),state);
  assert.equal(await openingRound.textContent(),'SEMIFINAL');
  assert.equal(await openingRound.getAttribute('hidden'),null);
  assert.equal(await page.locator('#topRound').textContent(),'SEMIFINAL');
  assert.equal(await page.locator('#topRound').evaluate(el=>getComputedStyle(el).display),'none','Opening does not repeat the round');
  for(const scene of ['lineup','live']){
   await page.evaluate(({s,scene})=>seriesFixture.remote({...s,scene,headline:'SCL 27',seriesRound:'Semifinal'}),{s:state,scene});
   const roundTag=await page.locator('#topRound').evaluate(el=>({text:el.textContent,width:el.clientWidth,scroll:el.scrollWidth}));
   assert.equal(roundTag.text,'SEMIFINAL');
   assert(roundTag.width>0&&roundTag.scroll<=roundTag.width,lang+' round fits in '+scene+' header');
  }
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
  const champion=page.locator('.series-champion');
  const finalRound={SV:'Final',en:'Grand Final',fi:'Finaali',de:'Finale'}[lang];
  const championship=(scene,round,hw,aw,format='5')=>page.evaluate(({s,scene,round,hw,aw,format})=>seriesFixture.remote({...s,scene,home:'111',away:'222',lineupTeamNames:{111:'Fixture Home',222:'Fixture Away'},seriesRound:round,seriesFormat:format,seriesHome:hw,seriesAway:aw}),{s:state,scene,round,hw,aw,format});
  await championship('series',finalRound,'2','2');
  assert.equal(await champion.isVisible(),false,'An undecided final keeps the normal series board');
  await championship('series','Semifinal','3','1');
  assert.equal(await champion.isVisible(),false,'Winning a semifinal does not make a champion');
  await championship('series','Bronsfinal','3','1');
  assert.equal(await champion.isVisible(),false,'Winning the bronze match does not make a champion');
  await championship('live',finalRound,'3','1');
  assert.equal(await page.evaluate(()=>seriesFixture.state().scene),'live','Clinching does not change the active live scene');
  await champion.waitFor({state:'hidden'});
  const confetti=champion.locator('.champion-confetti');
  assert.equal(await confetti.locator('i').first().evaluate(el=>getComputedStyle(el).animationName),'none','No celebration while the live scene is on air');
  await championship('series',finalRound,'3','1');
  assert(await champion.isVisible());
  assert.equal(await champion.locator('.champion-team').textContent(),'Fixture Home');
  assert.equal(await champion.locator('.champion-result b').textContent(),'3–1');
  assert.equal(await confetti.locator('i').count(),184);
  const rainStarts=await confetti.locator('i:not(.confetti-burst,.confetti-ambient)').evaluateAll(pieces=>pieces.map(piece=>parseFloat(piece.style.getPropertyValue('--x'))));
  assert.equal(new Set(rainStarts).size,108,'The rain has no repeating vertical lanes');
  assert(Math.min(...rainStarts)<5&&Math.max(...rainStarts)>95,'The rain covers both sides of the scene');
  const burst=confetti.locator('.confetti-burst');
  assert.equal(await burst.count(),40);
  assert.deepEqual(await burst.evaluateAll(pieces=>[...new Set(pieces.map(piece=>piece.style.getPropertyValue('--x')))]),['3%','97%']);
  assert.equal(await burst.first().evaluate(el=>getComputedStyle(el).animationName),'champion-confetti-burst');
  assert.equal(await burst.first().evaluate(el=>getComputedStyle(el).animationIterationCount),'1');
  const ambient=confetti.locator('.confetti-ambient');
  assert.equal(await ambient.count(),36);
  assert.equal(await ambient.evaluateAll(pieces=>new Set(pieces.map(piece=>piece.style.getPropertyValue('--x'))).size),36,'Looping rain is distributed across separate positions');
  assert.deepEqual(await ambient.first().evaluate(el=>{const css=getComputedStyle(el);return [css.animationName,css.animationIterationCount,css.animationDelay];}),['champion-confetti-ambient','infinite','6s']);
  const effect=await confetti.locator('i').first().evaluate(el=>{
   const style=getComputedStyle(el);return [style.animationName,style.animationIterationCount,style.animationFillMode];
  });
  assert.deepEqual(effect,['champion-confetti-fall','1','both']);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await confetti.isVisible(),false,'Respect reduced motion');
  await page.emulateMedia({reducedMotion:'no-preference'});
  assert.equal(await page.locator('.series-board').isVisible(),false);
  const rosterRows=[
   {sports_gamer_team_id:111,sports_gamer_player_id:1,display_gamertag:'Regular only',regular_skater_games:'4',player_image:'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22150%22/%3E'},
   {sports_gamer_team_id:111,sports_gamer_player_id:1,display_gamertag:'Regular only',regular_skater_games:'2'},
   {sports_gamer_team_id:111,sports_gamer_player_id:2,display_gamertag:'Playoff only',playoff_skater_games:3},
   {sports_gamer_team_id:111,sports_gamer_player_id:3,display_gamertag:'Goalie only',regular_goalie_games:2},
   {sports_gamer_team_id:111,sports_gamer_player_id:4,display_gamertag:'No appearances',regular_skater_games:0},
   {sports_gamer_team_id:222,sports_gamer_player_id:5,display_gamertag:'Opponent',playoff_goalie_games:1},
   ...Array.from({length:12},(_,i)=>({sports_gamer_team_id:111,sports_gamer_player_id:100+i,display_gamertag:'Teammate_'+i,playoff_goalie_games:1}))
  ];
  await page.route(/\/players\/1DEFAULTBILDID\.png$/i,r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1086" height="1446"><ellipse cx="543" cy="420" rx="260" ry="380"/></svg>'}));
  const rosterLayout=()=>champion.evaluate(async card=>{
   const roster=card.querySelector('.champion-roster'),tiles=[...roster.querySelectorAll('.champion-player')];
   const photo=roster.querySelector('img[src^="data:"]'),avatar=roster.querySelector('img[src*="1DEFAULTBILDID.png"]');
   await avatar.decode();
   return {width:roster.offsetWidth,rows:new Set(tiles.map(tile=>tile.offsetTop)).size,
    zoom:new DOMMatrixReadOnly(getComputedStyle(photo).transform).a,avatar:getComputedStyle(avatar).transform,
    avatarFit:getComputedStyle(avatar).objectFit,avatarWidth:avatar.offsetWidth,portraitWidth:avatar.parentElement.clientWidth};
  });
  await page.evaluate(players=>seriesFixture.seedPlayers(players),rosterRows.slice(0,10));
  const seven=await rosterLayout();
  assert.equal(await champion.locator('.champion-player').count(),7);
  assert.equal(seven.rows,1);
  assert.equal(seven.zoom,1.22);
  await page.evaluate(players=>seriesFixture.seedPlayers(players),rosterRows.slice(0,11));
  const eight=await rosterLayout();
  assert.equal(await champion.locator('.champion-player').count(),8);
  assert.equal(eight.rows,1);
  assert(eight.width>seven.width,'The eight-player roster uses more horizontal room');
  assert.equal(eight.zoom,1.14);
  assert.equal(eight.avatar,'none');
  assert.equal(eight.avatarFit,'cover','The fallback portrait keeps its original aspect ratio');
  assert.equal(eight.avatarWidth,eight.portraitWidth,'The fallback portrait uses the full card width');
  await page.evaluate(players=>seriesFixture.seedPlayers(players),rosterRows);
  const names=await champion.locator('.champion-player>b').allTextContents();
  assert.equal(names.length,15,'All participants fit without cutting the roster');
  assert.deepEqual(names.slice(0,3),['Regular only','Playoff only','Goalie only']);
  assert.equal(await champion.locator('.champion-portrait img').count(),15,'Every participant gets a portrait slot');
  const fits=await champion.evaluate(card=>{
   const scene=card.parentElement.getBoundingClientRect(),last=card.querySelector('.champion-result').getBoundingClientRect();
   const rows=new Set([...card.querySelectorAll('.champion-player')].map(p=>Math.round(p.getBoundingClientRect().y)));
   return {rows:rows.size,bottom:last.bottom,limit:scene.bottom};
  });
  assert(fits.rows===2&&fits.bottom<=fits.limit,'Larger roster wraps to two rows inside the scene: '+JSON.stringify(fits));
  await page.evaluate(players=>seriesFixture.seedPlayers(players),rosterRows.slice(0,-2));
  const composition=await champion.evaluate(card=>{
   const tiles=[...card.querySelectorAll('.champion-player')],rows={};
   for(const tile of tiles){const y=Math.round(tile.getBoundingClientRect().y);rows[y]=(rows[y]||0)+1;}
   const avatar=card.querySelector('.champion-portrait img[src*="1DEFAULTBILDID.png"]');
   const photo=card.querySelector('.champion-portrait img[src^="data:"]');
   return {rows:Object.values(rows),tileHeight:tiles[0].offsetHeight,avatarTransform:getComputedStyle(avatar).transform,photoTransform:getComputedStyle(photo).transform};
  });
  assert.deepEqual(composition.rows,[7,6]);
  assert(composition.tileHeight>=171,'Portraits use more of the available height');
  assert.equal(composition.avatarTransform,'none');
  assert.notEqual(composition.photoTransform,'none','Real photos keep their own crop');
  await championship('series',finalRound,'2','4','7');
  assert.equal(await champion.locator('.champion-team').textContent(),'Fixture Away');
  assert.equal(await champion.locator('.champion-result b').textContent(),'4–2');
  assert.deepEqual(await champion.locator('.champion-player>b').allTextContents(),['Opponent'],'A different winner only shows their own team');
  await championship('series',finalRound,'3','3');
  assert.equal(await champion.isVisible(),false,'Impossible results must not crown either team');
  assert(await page.locator('.series-board').isVisible());
  await page.evaluate(()=>seriesFixture.seedPlayers([]));
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
   assert.deepEqual(lights.animations,['arena-edge-pulse','arena-edge-pulse','arena-inner-edge-pulse','arena-edge-pulse','arena-edge-pulse','arena-edge-pulse']);
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
  await page.route('https://series.test/functions/v1/graphics-schedule?league=527',r=>r.fulfill({json:{matches:[
   {id:135997,stage:'regular',homeId:7103,awayId:6709,homeScore:4,awayScore:3,date:'2026-10-06'},
   {id:136003,stage:'regular',homeId:6709,awayId:7103,homeScore:6,awayScore:2,date:'2026-10-07'},
   ...Array.from({length:5},(_,i)=>({id:137100+i,stage:'playoffs',homeId:8000+i,home:'Opponent '+(i+1),awayId:7103,homeScore:2,awayScore:5,date:'2026-11-0'+(i+1)})),
   {id:137109,stage:'playoffs',homeId:7103,awayId:6709,homeScore:15,awayScore:0,date:'2026-11-09'}
  ]}}));
  await page.route('https://series.test/functions/v1/graphics-schedule?league=527&goals=135997,136003',r=>r.fulfill({json:{scorers:{
   136003:{6709:[{id:12593,name:'Jordan NHL',goals:2},{id:15085,name:'Dan Larsson',goals:4}],7103:[{id:16128,name:'Oscar Tkaczyk',goals:2}]}
  }}}));
  await page.evaluate(()=>{
   window.EHOCKEY_CONFIG={supabaseUrl:'https://series.test',supabasePublishableKey:'fixture'};
   seriesFixture.remote({...seriesFixture.state(),scene:'groupmeetings',leagueId:527,home:'6709',away:'7103'});
  });
  const groupScores=page.locator('#groupMeetings .group-meeting-scores>div');
  await groupScores.nth(1).waitFor({state:'visible'});
  const totals=page.locator('#groupMeetings .group-meeting-side>b');
  assert.deepEqual(await totals.allTextContents(),['6','2','3','4'],lang+' group-stage results');
  await groupScores.first().locator('.group-meeting-scorers').first().waitFor({state:'visible'});
  assert.match(await groupScores.first().locator('.group-meeting-side').first().innerText(),/Jordan NHL ×2/);
  assert.equal(await groupScores.nth(1).locator('.group-meeting-scorers').count(),0,'Scores stay when no report is available');
  const summary=page.locator('.group-meeting-summary'),summaryText=await summary.innerText();
  assert.match(summaryText,/9–6/,lang+' summary adds the two results');
  if(lang==='SV')assert.match(summaryText,/^En seger var · Totalt 9–6 till /);
  for(const width of [1920,1280]){
   await page.setViewportSize({width,height:width*9/16});
   const diffs=await groupScores.evaluateAll(rows=>rows.map(row=>{
    const [left,dash,right]=row.querySelectorAll('.group-meeting-side>b,.group-meeting-divider>b');
    return Math.max(Math.abs(left.getBoundingClientRect().top-dash.getBoundingClientRect().top),
     Math.abs(right.getBoundingClientRect().top-dash.getBoundingClientRect().top));
   }));
   assert(diffs.every(d=>d<1),lang+' dash must align with the scores, not the scorers');
  }
  await page.evaluate(()=>seriesFixture.remote({...seriesFixture.state(),scene:'groupmeetings',home:'7103',away:'6709'}));
  assert.deepEqual(await totals.allTextContents(),['2','6','4','3'],lang+' results follow the displayed teams');
  assert.match(await groupScores.first().locator('.group-meeting-side').first().innerText(),/Oscar Tkaczyk ×2/);
  assert.equal(await summary.innerText(),summaryText,'Aggregate winner and totals stay the same after reversing sides');
  await page.evaluate(()=>seriesFixture.remote({...seriesFixture.state(),scene:'road',seriesRound:'FINAL',seriesHome:'1',seriesAway:'0',liveSeriesShow:true,graphicsPackage:'gamenight'}));
  const road=page.locator('.scene.road.active .road-card').first();
  await road.locator('.road-history li').last().waitFor();
  assert.deepEqual(await road.locator('.road-opponent b').allTextContents(),['Opponent 1','Opponent 2','Opponent 3','Opponent 4','Opponent 5']);
  assert.deepEqual(await road.locator('.road-games span').allTextContents(),['5–2','5–2','5–2','5–2','5–2']);
  assert.doesNotMatch(await road.innerText(),/15–0|FINAL/);
  assert(await road.evaluate(el=>el.querySelector('.road-history li:last-child').getBoundingClientRect().bottom<=el.getBoundingClientRect().bottom),
   lang+' five previous opponents fit in the playoff path graphic');
  await page.evaluate(()=>{
   const fixtures=Array.from({length:16},(_,i)=>({sports_gamer_team_id:100+i,effective_group_id:i<8?42:9,
    team_name_in_league:'Fixture Team '+i,statistics_stage:'regular',table_points:30-(i%8)}));
   const setup=seriesFixture.state();
   for(const [home,away] of [['100','108'],['108','100']]){
    seriesFixture.standings(fixtures);
    seriesFixture.remote({...setup,scene:'table',home,away,graphicsPackage:'gamenight'});
    const panels=[...document.querySelectorAll('.bt-panel')];
    if(panels.length!==2)throw Error('Missing split group table');
    if(!panels[0].querySelector('.bt-panel-title').textContent.endsWith(' 1')||
       !panels[1].querySelector('.bt-panel-title').textContent.endsWith(' 2'))throw Error('Groups are not ordered');
    if(panels[0].querySelector('.bt-team strong').textContent!=='Fixture Team 8'||
       panels[1].querySelector('.bt-team strong').textContent!=='Fixture Team 0')throw Error('Team ranking changed');
    if(panels.some(panel=>panel.querySelectorAll('.bt-row.selected').length!==1))throw Error('Missing selected team highlight');
   }
  });
  const tables=await page.locator('.bt-panel').evaluateAll(panels=>panels.map(panel=>{
   const row=panel.querySelector('.bt-row'),scene=panel.closest('.scene');
   return [getComputedStyle(row).fontSize,getComputedStyle(row.querySelector('.bt-team strong')).fontSize,
    panel.getBoundingClientRect().bottom<=scene.getBoundingClientRect().bottom];
  }));
  assert.deepEqual(tables,[['14px','16px',true],['14px','16px',true]],lang+' larger split standings fit on screen');
  assert.deepEqual(errors,[],lang);await page.close();
 }
 const obs=await browser.newPage();
 const loopWarnings=[];
 obs.on('console',msg=>{if(msg.text().includes('Champion loop fell back'))loopWarnings.push(msg.text());});
 const origin='https://series.test';
 await obs.route('**/*',r=>{
  const url=new URL(r.request().url());
  if(url.origin!==origin)return r.abort();
  if(url.pathname==='/broadcast-studio/assets/aztrozmurfen-superhero-in-the-game.mp3')return r.fulfill({contentType:'audio/mpeg',path:__dirname+'/assets/aztrozmurfen-superhero-in-the-game.mp3'});
  if(url.pathname==='/broadcast-studio/assets/champion.mp3')return r.fulfill({contentType:'audio/mpeg',path:__dirname+'/assets/champion.mp3'});
  if(url.pathname!=='/broadcast-studio/SV/')return r.abort();
  return r.fulfill({contentType:'text/html',body:read('SV/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'')});
 });
 await obs.goto(origin+'/broadcast-studio/SV/?obs=1');
 await obs.evaluate(()=>{
  window.EHOCKEY_CONFIG={};
  const Audio=window.Audio;
  window.Audio=function(src){
   const audio=new Audio(src);
   if(!src.startsWith('blob:'))return window.testMusicAudio=audio;
   window.testChampionAudio=audio;
   const play=audio.play.bind(audio);audio.play=()=>{window.testChampionPlays=(window.testChampionPlays||0)+1;return play();};
   return audio;
  };
 });
 await obs.addScriptTag({content:read('studio-language.js')});
 await obs.addScriptTag({content:read('broadcast-studio.js').replace('  function studioState(){','  window.seriesFixture={state:()=>studioState(),remote:s=>applyRemoteState(s),loop:()=>championLoop,disableLoop:()=>{championLoop=false;}};\n  function studioState(){')});
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
 const showFinal=(scene,sceneMusic,homeWins=3)=>obs.evaluate(({scene,sceneMusic,homeWins})=>seriesFixture.remote({...seriesFixture.state(),scene,sceneMusic,home:'111',away:'222',lineupTeamNames:{111:'Home team',222:'Away team'},seriesRound:'Final',seriesHome:String(homeWins),seriesAway:'1'}),{scene,sceneMusic,homeWins});
 await showFinal('series',{series:'high'},2);
 assert.equal(await obs.evaluate(()=>window.testChampionPlays||0),0,'No pop for an undecided final');
 await showFinal('live',{series:'high'});
 assert.equal(await obs.evaluate(()=>window.testChampionPlays||0),0,'No pop in Match Live');
 await showFinal('series',{series:'low'});
 await obs.waitForFunction(()=>window.testChampionAudio?.currentTime>.02);
 assert.equal(await obs.evaluate(()=>testChampionAudio.volume),.16);
 await showFinal('series',{series:'low'});
 assert.equal(await obs.evaluate(()=>testChampionPlays),1,'Polling the same champion does not replay the pop');
 await showFinal('series',{muted:true});
 assert(await obs.evaluate(()=>testChampionAudio.paused),'Off stops the pop');
 await showFinal('live',{muted:true});
 await showFinal('series',{muted:true});
 await showFinal('series',{series:'high'});
 assert.equal(await obs.evaluate(()=>testChampionPlays),1,'Opening muted never plays a late pop');
 await showFinal('live',{series:'high'});
 await setMusicScene('opening',{opening:'high'});
 await obs.waitForFunction(()=>testMusicAudio.currentTime>.05&&!testMusicAudio.paused);
 await showFinal('series',{series:'high'});
 await obs.waitForFunction(()=>window.testChampionAudio?.currentTime>.02);
 assert.equal(await obs.evaluate(()=>testMusicAudio.paused),true,'The previous song stops before the celebration intro');
 assert.deepEqual(await obs.evaluate(()=>[testChampionPlays,testChampionAudio.volume,testChampionAudio.loop]),[2,.42,false]);
 await obs.waitForFunction(()=>{const loop=seriesFixture.loop();return loop===false||(testChampionAudio.ended&&loop?.node&&loop.context.currentTime>loop.startedAt+.03);},null,{timeout:6000});
 assert.notEqual(await obs.evaluate(()=>seriesFixture.loop()===false),true,loopWarnings.join('\n'));
 assert.equal(await obs.evaluate(()=>seriesFixture.loop().gain.gain.value.toFixed(2)),'0.32','Champion song starts high after the pop');
 const seam=await obs.evaluate(async()=>{
  const {node,buffer,start,end}=seriesFixture.loop(),rate=buffer.sampleRate;
  const offline=new OfflineAudioContext(buffer.numberOfChannels,Math.round(rate*.04),rate);
  const copy=offline.createBufferSource();
  copy.buffer=buffer;copy.loop=node.loop;copy.loopStart=node.loopStart;copy.loopEnd=node.loopEnd;
  copy.connect(offline.destination);copy.start(0,end-Math.round(rate*.02)/rate);
  const rendered=await offline.startRendering(),channels=Array.from({length:rendered.numberOfChannels},(_,i)=>rendered.getChannelData(i));
  let longest=0,quiet=0;
  for(let i=0;i<rendered.length;i++){
   quiet=channels.every(channel=>Math.abs(channel[i])<.0001)?quiet+1:0;
   longest=Math.max(longest,quiet);
  }
  return {start,end,longestQuietMs:longest/rate*1000};
 });
 assert(seam.start>.22&&seam.start<.24&&seam.end>303.5&&seam.end<303.56&&seam.longestQuietMs<5,JSON.stringify(seam));
 console.log('Champion loop seam: '+seam.longestQuietMs.toFixed(2)+' ms below -80 dBFS in both channels.');
 await showFinal('series',{series:'low'});
 assert.deepEqual(await obs.evaluate(()=>[testChampionPlays,seriesFixture.loop().gain.gain.value.toFixed(2),testMusicAudio.paused]),[2,'0.10',true]);
 await showFinal('series',{muted:true});
 assert(await obs.evaluate(()=>!seriesFixture.loop().node&&testMusicAudio.paused),'Champion music remains controllable after the entrance');
 await obs.evaluate(()=>seriesFixture.disableLoop());
 await showFinal('series',{series:'low'});
 await obs.waitForFunction(()=>new URL(testMusicAudio.src).pathname.endsWith('/champion.mp3')&&!testMusicAudio.paused&&testMusicAudio.currentTime>.03);
 assert.equal(await obs.evaluate(()=>testMusicAudio.volume),.10,'The HTML audio fallback can still play the winner track');
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

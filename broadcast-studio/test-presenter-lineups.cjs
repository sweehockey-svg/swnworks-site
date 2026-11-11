const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=file=>fs.readFileSync(__dirname+'/'+file,'utf8');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1906,height:900}}),errors=[],writes=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(!['GET','HEAD','OPTIONS'].includes(request.method()))writes.push(request.url());});
  const root='https://lineups.test/broadcast-studio/';
  const studioSource=read('SV/index.html');
  const obsBoot=studioSource.match(/<script>[^<]*document\.body\.classList\.add\("obs-preview"\)[^<]*<\/script>/)?.[0]||'';
  const studio=studioSource.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'');
  const fixture=read('broadcast-studio.js').replace('  function studioState(){',`  window.lineupFixture={seed:(teams,players,reference)=>{data.teams=teams;data.players=players;currentSourceReference=reference||null;renderAllCompetitionData();},apply:s=>applyRemoteState(viewerState(s))};
  function studioState(){`);
  await page.route('**/*',route=>{
   const url=route.request().url();
   const portrait=url.match(/^https:\/\/www\.svenskehockey\.se\/players\/(3429|2807|flacken)\.png$/);
   if(portrait)return route.fulfill({contentType:'image/png',...(process.env.SWN_COMMENTATOR_PORTRAITS&&portrait[1]!=='flacken'
    ?{path:process.env.SWN_COMMENTATOR_PORTRAITS+'/'+portrait[1]+'.png'}
    :{body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=','base64')})});
   if(!url.startsWith(root))return route.abort();
   if(url.includes('/presenter.html'))return route.fulfill({contentType:'text/html; charset=utf-8',body:read('presenter.html')});
   if(url.includes('/SV/')&&url.includes('obs=1')&&!url.includes('feed=1'))return route.fulfill({contentType:'text/html; charset=utf-8',body:studio.replace('</head>','<link rel="stylesheet" href="/broadcast-studio/broadcast-studio.css"></head>').replace('</body>',`<script>window.EHOCKEY_CONFIG={};const FixtureAudio=window.Audio;window.Audio=function(src){const audio=new FixtureAudio(src);if(src.startsWith('blob:'))window.testPop=audio;return audio;};</script><script src="tournament-scenes.js"></script><script src="fixture.js"></script></body>`)});
   if(url.endsWith('/aztrozmurfen-superhero-in-the-game.mp3'))return route.fulfill({contentType:'audio/mpeg',path:__dirname+'/assets/aztrozmurfen-superhero-in-the-game.mp3'});
   if(url.endsWith('/fixture.js'))return route.fulfill({contentType:'application/javascript; charset=utf-8',body:fixture});
   if(url.endsWith('/tournament-scenes.js'))return route.fulfill({contentType:'application/javascript; charset=utf-8',body:read('tournament-scenes.js')});
   if(url.includes('commentator-notes.css'))return route.fulfill({contentType:'text/css',body:read('commentator-notes.css')});
   if(url.includes('broadcast-studio.css'))return route.fulfill({contentType:'text/css',body:read('broadcast-studio.css')});
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
  const tourTeam={sports_gamer_team_id:33,team_name_in_league:'Tredje laget'};
  const tourPlayers=Array.from({length:10},(_,i)=>({sports_gamer_team_id:33,sports_gamer_player_id:i+1000,display_gamertag:'TourPlayer'+i,
   regular_skater_games:5,regular_goals:10-i,regular_assists:3,regular_points:13-i,
   playoff_skater_games:2,playoff_goals:i,playoff_assists:2,playoff_points:i+2,
   regular_goalie_games:i<2?2:3,regular_goalie_save_percentage:i<2?.95:.80-i/100,regular_goalie_shutouts:0}));
  await frame.evaluate(({teams,tourPlayers,state})=>{
   lineupFixture.seed(teams,tourPlayers);lineupFixture.apply({...state,scene:'tourpointsplayoff'});
  },{teams:[...teams,tourTeam],tourPlayers,state});
  const tournament=frame.locator('.tournament-broadcast.active');
  assert.match(await tournament.locator('.tour-heading').innerText(),/Slutspel[\s\S]*Turneringens poängliga/i);
  assert.match(await tournament.locator('.tour-podium-card').first().innerText(),/TourPlayer9[\s\S]*Tredje laget/);
  assert.equal(await tournament.locator('.tour-ranking>div').count(),8);
  assert(await tournament.evaluate(el=>el.querySelector('.tour-ranking').getBoundingClientRect().bottom<=el.getBoundingClientRect().bottom));
  await frame.evaluate(s=>lineupFixture.apply({...s,scene:'tourgoaliesregular'}),state);
  assert.match(await tournament.locator('.tour-podium-card').first().innerText(),/TourPlayer2/);
  assert.doesNotMatch(await tournament.innerText(),/TourPlayer[01]\b/);
  const commentators=[['phyreon3429','Alexander “Phyreon” Sundman','3429'],['troublemakingswe','Alex “troublemakingswe” Rautiainen','2807']];
  for(const selector of ['#commentator1','#commentator2']){
   const options=await frame.locator(selector+' option').evaluateAll(rows=>rows.map(o=>[o.value,o.textContent]));
   for(const [key,name] of commentators)assert(options.some(row=>row[0]===key&&row[1]===name),key+' is available in both slots');
  }
  await frame.evaluate(s=>lineupFixture.apply(s),{...state,graphicsPackage:'gamenight',commentator1:'phyreon3429',commentator2:'troublemakingswe',liveCommentatorsShow:true});
  for(const selector of ['#openingCommentators','#liveCommentators']){
   assert.deepEqual(await frame.locator(selector+' b').allTextContents(),commentators.map(c=>c[1]));
   assert.deepEqual(await frame.locator(selector+' img').evaluateAll(imgs=>imgs.map(img=>img.getAttribute('src'))),
    commentators.map(c=>'https://www.svenskehockey.se/players/'+c[2]+'.png'));
   assert.deepEqual(await frame.locator(selector+' .commentator-portrait').evaluateAll(rows=>rows.map(el=>
    [getComputedStyle(el).overflow,el.style.getPropertyValue('--portrait-width')])),[['hidden','175%'],['hidden','110%']]);
  }
  if(process.env.SWN_COMMENTATOR_SCREENSHOT){
   await frame.locator('#openingCommentators img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
   await frame.locator('#openingCommentators').screenshot({path:process.env.SWN_COMMENTATOR_SCREENSHOT});
  }
  await frame.evaluate(s=>lineupFixture.apply(s),{...state,commentator1:'flacken',commentator2:''});
  for(const selector of ['#openingCommentators','#liveCommentators']){
   assert.equal(await frame.locator(selector+' .commentator-portrait').count(),0,'Flacken keeps his original crop');
   assert.equal(await frame.locator(selector+' img').getAttribute('src'),'https://www.svenskehockey.se/players/flacken.png');
  }
  await frame.evaluate(({teams,players,state})=>{lineupFixture.seed(teams,players);lineupFixture.apply(state);},{teams,players,state});
  const panels=page.locator('.presenter-lineup-team');
  await panels.last().waitFor();
  assert.deepEqual(await panels.locator('h3').allTextContents(),['Bortalaget','Hemmalaget']);
  assert.deepEqual(await panels.nth(0).locator('small').allTextContents(),['RD · #19',...away.slice(1)]);
  assert.deepEqual(await panels.nth(1).locator('small').allTextContents(),['LW · #0',...home.slice(1)]);
  assert.deepEqual(await panels.locator('li span').allTextContents(),['AwayRD','–','–','–','–','–','HomeLW','–','–','–','–','–']);
  const colors={LW:'rgb(121, 223, 114)',C:'rgb(255, 118, 118)',RW:'rgb(127, 185, 255)',LD:'rgb(88, 221, 218)',G:'rgb(207, 157, 255)',RD:'rgb(255, 218, 85)'};
  const marks=await panels.locator('li').evaluateAll(cells=>cells.map(cell=>[cell.dataset.position,getComputedStyle(cell.querySelector('small')).color]));
  assert.deepEqual(marks,[...away,...home].map(position=>[position,colors[position]]));
  const feeds={videoSource:'twitch',twitchTeamChannels:{11:'home_feed',22:'away_feed'}};
  await frame.evaluate(s=>lineupFixture.apply(s),{...state,...feeds,twitchChannel:'away_feed',liveTeamsReversed:false});
  await panels.first().filter({hasText:'Hemmalaget'}).waitFor();
  assert.deepEqual(await panels.locator('h3').allTextContents(),['Hemmalaget','Bortalaget']);
  assert.deepEqual(await panels.nth(0).locator('li').evaluateAll(cells=>cells.map(cell=>cell.dataset.position)),away);
  assert.deepEqual(await panels.nth(1).locator('li').evaluateAll(cells=>cells.map(cell=>cell.dataset.position)),home);
  await frame.evaluate(s=>lineupFixture.apply(s),{...state,...feeds,twitchChannel:'home_feed',liveTeamsReversed:true});
  await panels.first().filter({hasText:'Bortalaget'}).waitFor();
  assert.equal(await frame.locator('#presenterLineups').count(),0,'The video frame has no presenter panel');
  await page.evaluate(()=>window.postMessage({type:'seh-presenter-lineups',lineups:null},location.origin));
  assert.equal(await panels.count(),2,'Messages not from the broadcast frame are ignored');
  const reserve={sports_gamer_team_id:11,sports_gamer_player_id:112,player_number:18,display_gamertag:'ReserveGoalie',roster_preferred_position_abbreviation:'G',regular_goalie_games:3,regular_goalie_save_percentage:.8531,regular_goalie_goals_against_average:1.75,regular_goalie_shutouts:0};
  await page.evaluate(()=>window.addEventListener('message',event=>{
   if(event.source===document.getElementById('broadcast').contentWindow&&event.data?.type==='seh-presenter-lineups'){window.testRoster=event.data.picker;window.testLineups=event.data.lineups;}
  }));
  await frame.evaluate(({teams,players,reserve,state})=>{
   const transientSource={ticket:'fixture.ticket'};
   lineupFixture.seed(teams,[...players,reserve],transientSource);
   lineupFixture.apply({...state,transientSource,scene:'spotlight',presentedPlayer:{id:'112',team:'11'}});
  },{teams,players,reserve,state});
  await page.waitForFunction(()=>window.testRoster?.teams.some(team=>team.id==='11'&&team.choices.some(player=>player.id==='112')));
  assert.equal(await page.evaluate(()=>window.testLineups.find(team=>team.id==='11').players.LW.id),'111');
  assert(await page.getByRole('button',{name:'Visa HomeLW i sändningen'}).isDisabled(),'The correct lineup player is available but requires scene access');
  const spotlight=frame.locator('#spotlightCard');
  assert.match(await spotlight.textContent(),/Spelarpresentation.*ReserveGoalie.*G · #18.*SV%/is);
  assert.deepEqual(await spotlight.locator('thead th').allTextContents(),['GRUPPSPEL','SLUTSPEL']);
  assert.deepEqual(await spotlight.getByRole('row',{name:/Hållna nollor/}).locator('td').allTextContents(),['0','–']);
  assert.deepEqual(await spotlight.getByRole('row',{name:/Räddningsprocent/}).locator('td').allTextContents(),['85,31 %','–']);
  assert.deepEqual(await spotlight.getByRole('row',{name:/Insläppta mål/}).locator('td').allTextContents(),['1,75','–']);
  assert.equal(await spotlight.locator('.spotlight-total b').textContent(),'3');
  await frame.evaluate(s=>lineupFixture.apply({...s,scene:'spotlight',presentedPlayer:{id:'112',team:'22'}}),state);
  assert.doesNotMatch(await spotlight.textContent(),/ReserveGoalie/);
  await frame.evaluate(s=>lineupFixture.apply({...s,scene:'spotlight'}),state);
  assert.doesNotMatch(await spotlight.textContent(),/ReserveGoalie|Spelarpresentation/);
  await frame.evaluate(s=>lineupFixture.apply(s),state);
  const audio=page.getByRole('button',{name:'Lyssna här'});
  assert.equal(await audio.getAttribute('aria-pressed'),'false','Presenter starts muted');
  assert.equal(await frame.evaluate(()=>document.documentElement.dataset.sceneMusic),undefined);
  await audio.click();
  await frame.waitForFunction(()=>document.documentElement.dataset.sceneMusic==='playing',null,{timeout:7000});
  await frame.evaluate(s=>lineupFixture.apply({...s,scene:'series',seriesRound:'Final',seriesHome:'3',seriesAway:'2'}),state);
  await frame.waitForFunction(()=>window.testPop?.currentTime>.01,null,{timeout:7000});
  await audio.click();
  await frame.waitForFunction(()=>document.documentElement.dataset.sceneMusic===undefined);
  assert.equal(await frame.evaluate(()=>testPop.paused),true);
  const slots=['LW','C','RW','LD','RD','G'];
  const all=teams.flatMap((team,i)=>slots.map((slot,j)=>({sports_gamer_team_id:team.sports_gamer_team_id,sports_gamer_player_id:100*i+j+1,display_gamertag:`Team${i+1}_${slot}_LongName`,player_number:j+1,roster_preferred_position_abbreviation:slot,
   ...(slot==='G'?{regular_goalie_games:4,regular_goalie_save_percentage:.88}:{regular_skater_games:5,regular_goals:7-j,regular_points:slot==='LW'?15:12-j}),
   ...(slot==='C'?{regular_faceoff_wins:9,regular_faceoff_losses:3,playoff_skater_games:2,playoff_points:3,playoff_faceoff_wins:0,playoff_faceoff_losses:4}:{})})));
  const setup=Object.fromEntries(['home','away'].map((side,i)=>[side,Object.fromEntries(slots.map((slot,j)=>[slot,String(100*i+j+1)]))]));
  const both={scene:'duallineup',home:'11',away:'22',lineups:setup,transientSource:{ticket:'fixture.ticket'}};
  const complete=await frame.evaluate(({teams,all,both})=>{
   lineupFixture.seed(teams,all,both.transientSource);lineupFixture.apply(both);
   const scene=document.querySelector('.scene.duallineup'),box=scene.getBoundingClientRect();
   return [...scene.querySelectorAll('.dual-lineup-team')].map(team=>{
    const cards=[...team.querySelectorAll('.dual-lineup-player')];
    const rows=Object.values(cards.reduce((out,card)=>{const y=Math.round(card.getBoundingClientRect().top);out[y]=(out[y]||0)+1;return out;},{}));
    return {name:team.querySelector('strong').textContent,rows,fits:cards.every(card=>{const tag=card.querySelector('.dual-lineup-tag').getBoundingClientRect();return tag.bottom<=box.bottom+.5&&tag.width>0;})};
   });
  },{teams,all,both});
  assert.deepEqual(complete,[{name:'Hemmalaget',rows:[3,2,1],fits:true},{name:'Bortalaget',rows:[3,2,1],fits:true}]);
  assert.equal(await frame.locator('.scene.duallineup.active img').count(),12);
  const clickableCard=frame.getByRole('button',{name:'Visa i sändningen: Team2_G_LongName'});
  assert(await clickableCard.isDisabled(),'The card waits for the authenticated controller');
  await page.evaluate(()=>{
   const viewer=document.getElementById('broadcast');
   window.addEventListener('message',event=>{
    if(event.source===viewer.contentWindow&&event.data?.type==='seh-presenter-lineup-player')window.testPlayerClick=event.data;
   });
   viewer.contentWindow.postMessage({type:'seh-presenter-lineup-control',enabled:true},location.origin);
  });
  await clickableCard.click();
  await page.waitForFunction(()=>!!window.testPlayerClick);
  assert.deepEqual(await page.evaluate(()=>window.testPlayerClick),{type:'seh-presenter-lineup-player',ticket:'fixture.ticket',team:'22',id:'106'});
  const editorState={...both,lineups:{...both.lineups,home:{...both.lineups.home,RW:''}}};
  await frame.evaluate(s=>lineupFixture.apply(s),editorState);
  await page.evaluate(()=>{
   const viewer=document.getElementById('broadcast');
   const control=document.getElementById('scenePicker').contentDocument;
   const button=control.createElement('button');button.id='presentPlayerButton';control.body.append(button);
   window.lineupEdit=action=>viewer.contentWindow.postMessage({type:'seh-presenter-lineup-edit',action},location.origin);
   window.addEventListener('message',event=>{
    if(event.source===viewer.contentWindow&&event.data?.type==='seh-presenter-lineup-save')window.testLineupSave=event.data;
   });
   window.lineupEdit('start');
  });
  const editCard=(side,slot)=>frame.locator('.scene.duallineup [data-side="'+side+'"] [data-position="'+slot+'"][data-edit-slot]');
  const drag=async(from,to)=>{
   await from.scrollIntoViewIfNeeded();
   await to.scrollIntoViewIfNeeded();
   const a=await from.boundingBox(),b=await to.boundingBox();
   await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
   await page.mouse.down();
   await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:8});
   await page.mouse.up();
  };
  await editCard('home','LW').waitFor({state:'visible'});
  await frame.waitForFunction(()=>!document.getElementById('screen').classList.contains('scene-switching'));
  await drag(editCard('home','LW'),editCard('away','C'));
  assert.match(await editCard('home','LW').textContent(),/Team1_LW/,'Cannot move across teams');
  await drag(editCard('home','LW'),editCard('home','C'));
  assert.match(await editCard('home','LW').textContent(),/Team1_C/);
  await drag(editCard('home','C'),editCard('home','RW'));
  assert.match(await editCard('home','RW').textContent(),/Team1_LW/);
  assert.match(await editCard('home','C').textContent(),/EJ VALD/);
  assert.deepEqual(await frame.evaluate(()=>window.__sehTwitchState.lineups),editorState.lineups,'Draft does not alter the on-air state');
  await page.evaluate(()=>window.lineupEdit('save'));
  await page.waitForFunction(()=>!!window.testLineupSave);
  const edited={...editorState.lineups,home:{...editorState.lineups.home,LW:'2',C:'',RW:'1'}};
  assert.deepEqual(await page.evaluate(()=>window.testLineupSave),{type:'seh-presenter-lineup-save',ticket:'fixture.ticket',home:'11',away:'22',base:editorState.lineups,lineups:edited});
  await page.frameLocator('#scenePicker').locator('body').evaluate(()=>parent.postMessage({type:'seh-presenter-lineup-save-result',ok:false},location.origin));
  await page.getByText('Kunde inte bekräfta ändringen.',{exact:false}).waitFor();
  await page.evaluate(()=>window.lineupEdit('cancel'));
  await editCard('home','LW').waitFor({state:'detached'});
  assert.match(await frame.locator('.scene.duallineup [data-side="home"] [data-position="LW"]').textContent(),/Team1_LW/);
  await frame.evaluate(({teams,all,reserve,state})=>{
   lineupFixture.seed(teams,[...all,reserve,{...reserve,sports_gamer_team_id:22,sports_gamer_player_id:115,display_gamertag:'AwayReserve'}],state.transientSource);
   lineupFixture.apply(state);
  },{teams,all,reserve,state:editorState});
  await page.evaluate(()=>window.lineupEdit('start'));
  await editCard('home','C').click();
  const reserveMenu=page.locator('#lineupReservePlayer');
  await reserveMenu.waitFor();
  assert.deepEqual(await reserveMenu.locator('option').allTextContents(),['Välj reserv','#18 · ReserveGoalie','#3 · Team1_RW_LongName']);
  await reserveMenu.selectOption('112');
  await editCard('home','C').filter({hasText:'ReserveGoalie'}).waitFor();
  assert.deepEqual(await frame.evaluate(()=>window.__sehTwitchState.lineups),editorState.lineups);
  await page.evaluate(()=>window.lineupEdit('cancel'));
  await editCard('home','C').waitFor({state:'detached'});
  const cases=[
   ['lineup','away','RW',103],['lineup','home','C',2],['scorers','home','LW',1],['offense','away','LW',101],
   ['defenseleaders','away','RD',105],['goalieleaders','home','G',6],['leaders','home','LW',1],
   ['forwards','away','RW',103],['defense','home','LD',4],['goalies','away','G',106],['keymatchup','home','LW',1],
   ['series','home','C',2]
  ];
  for(const [scene,side,slot,id] of cases){
   await page.evaluate(()=>{window.testPlayerClick=null;});
   await frame.evaluate(s=>lineupFixture.apply(s),{...both,scene,lineupSide:side,seriesRound:'Final',seriesHome:'3',seriesAway:'0'});
   const label='Visa i sändningen: Team'+(side==='home'?1:2)+'_'+slot+'_LongName';
   const target=frame.locator('.scene.'+scene+'.active:not(.scene-leave)').getByRole('button',{name:label});
   if(scene==='leaders')await target.press('Enter');
   else await target.click();
   await page.waitForFunction(()=>!!window.testPlayerClick);
   assert.deepEqual(await page.evaluate(()=>window.testPlayerClick),{type:'seh-presenter-lineup-player',ticket:'fixture.ticket',team:side==='home'?'11':'22',id:String(id)},scene);
  }
  assert.deepEqual(writes,[],'The renderer sends the request to the presenter, never directly to the broadcast API');
  await page.evaluate(()=>{
   const obs=document.createElement('iframe');obs.id='separateObs';obs.style.cssText='display:block;width:100%;height:auto;aspect-ratio:16/9';obs.src='SV/?obs=1';document.body.append(obs);
  });
  await page.frameLocator('#separateObs').locator('#screen').waitFor({state:'attached'});
  const obs=page.frame({url:/\/SV\/\?obs=1$/});
  await obs.waitForFunction(()=>!!window.lineupFixture);
  assert(obsBoot,'Found the real OBS boot code');
  await obs.addScriptTag({content:obsBoot.replace(/^<script>|<\/script>$/g,'')});
  await obs.evaluate(({teams,all,both})=>{lineupFixture.seed(teams,all);lineupFixture.apply(both);},{teams,all,both});
  assert.equal(await obs.locator('.scene.duallineup.active img').count(),12);
  assert.equal(await obs.locator('[data-lineup-player],.dual-lineup-player:is(button)').count(),0,'Separate OBS output has no clickable cards in any rendered scene');
  await obs.evaluate(s=>lineupFixture.apply({...s,scene:'spotlight',presentedPlayer:{team:'22',id:'106'}}),both);
  assert.match(await obs.locator('.scene.spotlight.active').textContent(),/Team2_G_LongName.*SV%/is);
  await obs.evaluate(s=>lineupFixture.apply({...s,scene:'spotlight',presentedPlayer:{team:'22',id:'102'}}),both);
  const center=obs.locator('.scene.spotlight.active');
  assert.deepEqual(await center.getByRole('row',{name:/Poäng \/ match/}).locator('td').allTextContents(),['2,20','1,50']);
  assert.deepEqual(await center.getByRole('row',{name:/Tekningsprocent/}).locator('td').allTextContents(),['75,0 %','0,0 %']);
  const fits=()=>center.locator('.spotlight-stage-stats').evaluate(table=>{
   const stats=table.getBoundingClientRect(),bounds=table.closest('.spotlight-wrap').getBoundingClientRect();
   return {ok:stats.top>=bounds.top-1&&stats.bottom<=bounds.bottom+1&&stats.right<=bounds.right+1,stats:stats.toJSON(),bounds:bounds.toJSON(),viewport:[innerWidth,innerHeight]};
  });
  const wideFit=await fits();
  assert(wideFit.ok,'The full skater table fits the OBS scene: '+JSON.stringify(wideFit));
  await page.setViewportSize({width:850,height:620});
  const narrowFit=await fits();
  assert(narrowFit.ok,'The full skater table fits at a smaller viewport: '+JSON.stringify(narrowFit));
  await obs.evaluate(s=>lineupFixture.apply({...s,scene:'spotlight',presentedPlayer:{team:'22',id:'101'}}),both);
  assert.equal(await center.getByRole('row',{name:/Tekningsprocent/}).count(),0);
  await frame.evaluate(s=>lineupFixture.apply({...s,publicNoMatch:true}),state);
  await page.locator('#presenterLineupStatus').waitFor();
  assert.equal(await panels.count(),0,'The roster clears when the broadcast goes idle');
  assert.deepEqual(errors,[]);
  console.log('Presenter lineups and local audio passed: music and pop play only after enabling local sound, and the roster follows the match.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

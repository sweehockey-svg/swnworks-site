const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=file=>fs.readFileSync(__dirname+'/'+file,'utf8');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const mode of ['signed-out','denied','allowed','operator']){
   const origin='https://presenter.test',base=origin+'/broadcast-studio/',writes=[],errors=[];
   let toolsLoads=0;
   const page=await browser.newPage({viewport:{width:1280,height:800}});
   page.on('pageerror',error=>errors.push(error.message));
   const baseLineups={home:{LW:'41',C:'',RW:'',LD:'',RD:'',G:''},away:{LW:'',C:'',RW:'',LD:'',RD:'',G:'43'}};
   const updatedLineups={...baseLineups,home:{...baseLineups.home,LW:'',C:'41'}};
   const reserveLineups={...updatedLineups,home:{...updatedLineups.home,C:'42'}};
   let state={leagueId:527,scene:'live',home:'111',away:'222',hs:3,as:2,lineupTeamNames:{111:'Testlaget A',222:'Testlaget B'},lineups:baseLineups,
    videoSource:'twitch',twitchChannel:'test_home',twitchTeamChannels:{111:'test_home',222:'test_away'},
    transientSource:{ticket:'fixture.ticket',expires_at:new Date(Date.now()+3600000).toISOString()}};
   const lineupMessage={type:'seh-presenter-lineups',
    lineups:[{side:'away',id:'222',name:'Testlaget B',players:{G:{id:'43',gt:'Målvakt B'}}},{side:'home',id:'111',name:'Testlaget A',players:{LW:{id:'41',gt:'Forward A'}}}],
    picker:{ticket:'fixture.ticket',teams:[{id:'111',name:'Testlaget A',choices:[{id:'41',name:'Forward A'},{id:'42',name:'Reserv A',number:'27'}]},{id:'222',name:'Testlaget B',choices:[{id:'43',name:'Målvakt B'}]}]}};
   await page.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url()),file=url.pathname.split('/').pop();
    const session=mode==='signed-out'?null:{access_token:'fixture-token'};
    if(url.hostname==='cdn.jsdelivr.net')return route.fulfill({contentType:'application/javascript',body:`window.supabase={createClient:()=>({
      auth:{onAuthStateChange(){},getSession:async()=>({data:{session:${JSON.stringify(session)}}}),getUser:async()=>({data:{user:{email:"fixture@example.test"}}})},
      rpc:async(name,args)=>({data:(name==="swn_studio_scene_access"&&args.p_channel==="sec21-bronze-test"&&${['allowed','operator'].includes(mode)})||(name==="swn_studio_sv_operator_access"&&${mode==='operator'})})
    })};`});
    if(url.origin!==origin)return route.abort();
    if(file==='presenter.html'||file==='mobile.html')return route.fulfill({contentType:'text/html',body:read(file)});
    if(url.searchParams.get('panel')==='tools'||url.searchParams.has('scope-test')){
     toolsLoads++;
     return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html data-studio-locked><head><link rel="stylesheet" href="/studio-access.css"></head><body><main>Admin tools</main><script src="../broadcast-config.js"></script><script src="https://cdn.jsdelivr.net/mock-supabase.js"></script><script src="/studio-access.js"></script></body></html>'});
    }
    if(file==='studio-access.js'||file==='studio-access.css')return route.fulfill({contentType:file.endsWith('.css')?'text/css':'application/javascript',body:read('../'+file)});
    if(file==='broadcast-config.js')return route.fulfill({contentType:'application/javascript',body:`window.EHOCKEY_CONFIG={supabaseUrl:${JSON.stringify(origin)},supabasePublishableKey:"fixture"};`});
    if(['mobile-control.js','commentator-notes.js','group-meetings.js','tournament-scenes.js','commentator-notes.css'].includes(file))return route.fulfill({contentType:file.endsWith('.css')?'text/css':'application/javascript',body:read(file)});
    if(url.pathname.endsWith('/rpc/broadcast_studio_set_scene')){
     assert.equal(req.headers().authorization,'Bearer fixture-token');
     const payload=req.postDataJSON();writes.push(payload);
     state={...state,scene:payload.p_scene};
     delete state.presentedPlayer;
     return route.fulfill({json:state});
    }
    if(url.pathname.endsWith('/rpc/broadcast_studio_set_match_result')){
     assert.equal(req.headers().authorization,'Bearer fixture-token');
     const payload=req.postDataJSON();writes.push(payload);
     state={...state,hs:String(payload.p_home),as:String(payload.p_away)};
     return route.fulfill({json:state});
    }
    if(url.pathname.endsWith('/rpc/broadcast_studio_set_music')){
     assert.equal(req.headers().authorization,'Bearer fixture-token');
     const payload=req.postDataJSON();writes.push(payload);
     state={...state,sceneMusic:{...state.sceneMusic,muted:payload.p_mode==='off',[payload.p_scene]:payload.p_mode}};
     return route.fulfill({json:state});
    }
    if(url.pathname.endsWith('/functions/v1/broadcast-lineups')){
     assert.equal(req.headers().authorization,'Bearer fixture-token');
     const payload=req.postDataJSON();writes.push(payload);
     assert.deepEqual(payload.p_expected.baseLineups,updatedLineups);
     assert.deepEqual(payload.p_expected.lineups,reserveLineups);
     state={...state,lineups:reserveLineups};
     return route.fulfill({json:state});
    }
    if(url.pathname.endsWith('/rpc/broadcast_studio_set_team_order')){
     assert.equal(req.headers().authorization,'Bearer fixture-token');
     const payload=req.postDataJSON();writes.push(payload);
     if(payload.p_action==='present-player'){
      assert.equal(payload.p_expected.ticket,'fixture.ticket');
      state={...state,scene:'spotlight',presentedPlayer:{id:payload.p_expected.playerId,team:payload.p_expected.playerTeam}};
     }else if(payload.p_action==='reorder-lineups'){
      assert.equal(state.scene,'duallineup');
      assert.equal(payload.p_expected.ticket,'fixture.ticket');
      assert.deepEqual(payload.p_expected.baseLineups,baseLineups);
      assert.deepEqual(payload.p_expected.lineups,updatedLineups);
      state={...state,lineups:payload.p_expected.lineups};
     }else if(payload.p_action==='team-strip'||payload.p_action==='commentators'){
      const field=payload.p_action==='team-strip'?'liveTeamStripShow':'liveCommentatorsShow';
      assert.equal(payload.p_expected.overlayVisible,field==='liveTeamStripShow'?state[field]!==false:state[field]===true);
      state={...state,[field]:!payload.p_expected.overlayVisible};
     }else if(payload.p_action==='stream-away'){
      assert.equal(payload.p_expected.twitchChannel,'test_home');
      state={...state,twitchChannel:'test_away',liveTeamsReversed:true};
     }else{
      assert.equal(payload.p_action,'live');
      state={...state,liveTeamsReversed:!state.liveTeamsReversed};
     }
     return route.fulfill({json:state});
    }
    if(url.pathname.endsWith('/broadcast_studio_state'))return route.fulfill({json:[{state}]});
    if(url.pathname.endsWith('/graphics-schedule'))return route.fulfill({json:{matches:[]}});
    if(url.searchParams.get('obs')==='1')return route.fulfill({contentType:'text/html; charset=utf-8',body:`<main>Match picture</main>${url.searchParams.get('presenter')==='1'?`<button id="mockCard" disabled>Forward A in graphics</button><script>
     const card=document.getElementById("mockCard");
     parent.postMessage(${JSON.stringify(lineupMessage)},location.origin);
     addEventListener("message",event=>{if(event.source===parent&&event.origin===location.origin&&event.data?.type==="seh-presenter-lineup-control")card.disabled=!event.data.enabled;});
     card.onclick=()=>parent.postMessage({type:"seh-presenter-lineup-player",ticket:"fixture.ticket",team:"111",id:"41"},location.origin);
     window.lineupStatus=(editing,changed,choosing)=>parent.postMessage({type:"seh-presenter-lineup-edit-status",available:true,editing,changed,choosing},location.origin);
     let reserved=false;
     addEventListener("message",event=>{
      if(event.source!==parent||event.origin!==location.origin||event.data?.type!=="seh-presenter-lineup-edit")return;
      if(event.data.action==="start")lineupStatus(true,false);
      if(event.data.action==="cancel")lineupStatus(false,false);
      if(event.data.action==="reserve"){reserved=event.data.id==="42";lineupStatus(true,reserved,false);}
      if(event.data.action==="save")parent.postMessage({type:"seh-presenter-lineup-save",ticket:"fixture.ticket",home:"111",away:"222",base:reserved?${JSON.stringify(updatedLineups)}:${JSON.stringify(baseLineups)},lineups:reserved?${JSON.stringify(reserveLineups)}:${JSON.stringify(updatedLineups)}},location.origin);
     });
    </script>`:''}`});
    return route.abort();
   });
   await page.goto(base+'presenter.html?lang=sv');
   assert.equal(await page.locator('h1,.intro').count(),0);
   await page.locator('#privateNotes textarea').waitFor({state:'visible'});
   const frame=page.frameLocator('#scenePicker');
   const series=page.frameLocator('#seriesPicker');
   const streams=page.frameLocator('#streamPicker'),streamPanel=streams.locator('#teamStreamSwitch');
   const noteBox=await page.locator('#privateNotes').boundingBox(),seriesBox=await page.locator('#seriesPicker').boundingBox(),matchBox=await page.locator('#broadcast').boundingBox();
   assert(matchBox.y<=6&&matchBox.x<=8,'Match is close to the top and left edges');
   assert(seriesBox.y>=noteBox.y+noteBox.height,'Series controls sit under the notes');
   const original=page.locator('#originalFeed'),rawBox=await original.boundingBox();
   assert(rawBox.y>=seriesBox.y+seriesBox.height&&rawBox.width<=210,'Small original feed sits under the series editor');
   assert.match(await original.getAttribute('src'),/obs=1&viewer=1&feed=1/);
   assert.equal(toolsLoads,0);
   const tools=page.locator('#studioToolsFrame');
   assert.equal(await tools.getAttribute('src'),null);
   assert.equal(await tools.isVisible(),false);
   if(!['allowed','operator'].includes(mode)){
    await frame.locator('#compactLoginLink').waitFor({state:'visible'});
    assert.equal(await frame.locator('#compactLoginLink').getAttribute('href'),'mobile.html?lang=sv');
    assert.equal(await frame.locator('[data-scene="live"]').isVisible(),false);
    assert.equal(await frame.locator('#presentPlayerButton').isVisible(),false);
    const lineupLink=page.getByRole('button',{name:'Visa Forward A i sändningen'});
    await lineupLink.waitFor();
    assert(await lineupLink.isDisabled(),'A lineup cannot be taken on air without scene access');
    assert(await page.frameLocator('#broadcast').locator('#mockCard').isDisabled());
    await series.locator('#compactLoginLink').waitFor({state:'visible'});
    assert.match(await series.locator('#compactLoginLink').innerText(),/serieläge/i);
    assert.equal(await series.locator('#seriesSummary').isVisible(),false);
    assert.equal(await streamPanel.isVisible(),false,'Stream controls are not visible without channel access');
    assert.equal(writes.length,0);
   }else{
    const live=frame.locator('[data-scene="live"].active');
    await live.waitFor({state:'visible'});
    assert.equal(await live.isEnabled(),true);
    await page.setViewportSize({width:1906,height:900});
    await frame.locator('#tournamentControls > [data-scene="tourstats"]').waitFor();
    assert.deepEqual(await frame.locator('#compactPrimary > button[data-scene]').evaluateAll(buttons=>buttons.map(b=>b.dataset.scene)),
     ['opening','live','lineup','lineup','intermission','series','teamcompare','formguide','forwards','defense','goalies']);
    assert.deepEqual(await frame.locator('#tournamentControls > button[data-scene]').evaluateAll(buttons=>buttons.map(b=>b.dataset.scene)),
     ['table','tourpoints','tourgoalies','tourstats']);
    assert.deepEqual(await frame.locator('#compactSecondary > button[data-scene]').evaluateAll(buttons=>buttons.map(b=>b.dataset.scene)),
     ['duallineup','matchup','groupmeetings','road','scorers','offense','defenseleaders','goalieleaders','keymatchup','spotlight','leaders']);
    assert.equal(await frame.locator('#compactScenes details').count(),0);
    await frame.locator('#compactSecondary [data-scene="matchup"]').waitFor({state:'visible'});
    const flipBox=await frame.locator('#mobileFlipLiveTeams').boundingBox(),liveBox=await live.boundingBox();
    assert.equal(flipBox.height,liveBox.height,'Flip and scene buttons have the same height');
    const goaliesBox=await frame.locator('[data-scene="goalies"]').boundingBox();
    const musicBox=await frame.locator('.compact-music').boundingBox();
    assert.equal(musicBox.y,goaliesBox.y,'Music stays on the upper row');
    assert.equal(flipBox.y,goaliesBox.y,'Flip stays on the upper row');
    assert(goaliesBox.x+goaliesBox.width<=musicBox.x&&musicBox.x+musicBox.width<=flipBox.x,'Music and flip sit to the right of Goalies');
    const desktopStrip=await page.locator('#scenePicker').boundingBox();
    const tournamentRow=await frame.locator('#tournamentControls').boundingBox();
    assert(tournamentRow.y+tournamentRow.height<=desktopStrip.y+desktopStrip.height,'The tournament row fits in the control strip');
    assert(desktopStrip.y+desktopStrip.height<=900,'Scene rows fit below the video on desktop: '+JSON.stringify({desktopStrip,tournamentRow}));
    const stripToggle=frame.getByRole('button',{name:'Visa lagruta',exact:true});
    const commentatorToggle=frame.getByRole('button',{name:'Visa kommentatorer',exact:true});
    const [stripBox,commentatorBox]=await Promise.all([stripToggle.boundingBox(),commentatorToggle.boundingBox()]);
    assert(stripBox.y>=flipBox.y+flipBox.height&&commentatorBox.y===stripBox.y,'Overlay toggles sit directly below the flip button');
    assert.equal(await stripToggle.getAttribute('aria-pressed'),'true');
    assert.equal(await commentatorToggle.getAttribute('aria-pressed'),'false');
    const desktopPicture=await page.locator('#broadcast').boundingBox();
    assert(Math.abs(desktopPicture.width-desktopStrip.width)<1,'Large screens keep the existing full-width preview');
    await page.setViewportSize({width:1366,height:720});
    const laptopPicture=await page.locator('#broadcast').boundingBox();
    const laptopStrip=await page.locator('#scenePicker').boundingBox();
    const laptopSidebar=await page.locator('.presenter-sidebar').boundingBox();
    assert(laptopPicture.width<laptopStrip.width-30,'Only the video shrinks on laptop screens');
    assert(Math.abs(laptopPicture.width/laptopPicture.height-16/9)<.01,'The video keeps its 16:9 ratio');
    const withoutCap=await page.locator('#broadcastPreview').evaluate(el=>{
     el.style.maxWidth='none';
     const box=document.querySelector('.presenter-sidebar').getBoundingClientRect(),scene=document.querySelector('#scenePicker').getBoundingClientRect();
     el.style.removeProperty('max-width');
     return {x:box.x,width:box.width,controlsWidth:scene.width};
    });
    assert.deepEqual(withoutCap,{x:laptopSidebar.x,width:laptopSidebar.width,controlsWidth:laptopStrip.width});
    if(mode==='allowed'){
     const grip=page.getByRole('slider',{name:'Storlek på sändningsbilden'});
     const handle=await grip.boundingBox();
     const x=handle.x+handle.width/2,y=handle.y+handle.height/2;
     await page.mouse.move(x,y);await page.mouse.down();
     await page.mouse.move(x-130,y,{steps:6});await page.mouse.up();
     const smaller=await page.locator('#broadcast').boundingBox();
     assert(Math.abs(smaller.width-(laptopPicture.width-130))<2,'Dragging the corner reduces the preview width');
     assert(Math.abs(smaller.width/smaller.height-16/9)<.01,'Manual resizing keeps 16:9');
     assert.equal((await page.locator('#scenePicker').boundingBox()).width,laptopStrip.width);
     assert.equal((await page.locator('.presenter-sidebar').boundingBox()).width,laptopSidebar.width);
     assert.equal(await page.evaluate(()=>localStorage.getItem('swn-presenter-preview-width-v1')),String(Math.round(smaller.width)));
     await grip.press('ArrowRight');
     assert((await page.locator('#broadcast').boundingBox()).width>smaller.width,'The grip also works with arrow keys');
     await page.getByRole('button',{name:'Återställ automatisk storlek'}).click();
     assert(Math.abs((await page.locator('#broadcast').boundingBox()).width-laptopPicture.width)<1,'Auto restores the responsive size');
     assert.equal(await page.evaluate(()=>localStorage.getItem('swn-presenter-preview-width-v1')),null);
    }
    await page.setViewportSize({width:1280,height:800});
    await frame.locator('[data-scene="intermission"]').click();
    await frame.locator('[data-scene="intermission"].active').waitFor();
    assert.deepEqual(writes,[{p_channel:'sec21-bronze-test',p_scene:'intermission',p_lineup_side:null}]);
    await frame.locator('#tournamentControls > [data-scene="tourpoints"]').click();
    await frame.getByRole('button',{name:'Slutspel',exact:true}).click();
    await frame.locator('[data-scene="tourpointsplayoff"].active').waitFor();
    assert.equal(writes.at(-1).p_scene,'tourpointsplayoff');
    await frame.locator('[data-scene="intermission"]').click();
    await frame.locator('[data-scene="intermission"].active').waitFor();
    writes.splice(1);
    assert.equal(state.hs,3);assert.equal(state.as,2);
    await page.setViewportSize({width:1920,height:1080});
    await series.locator('#seriesSummary').click();
    const editor=series.locator('.series-editor');
    const editorHeight=await editor.evaluate(el=>el.offsetHeight);
    assert(editorHeight<=172,'Open series editor uses at most 172 pixels on desktop');
    const inline=await series.locator('#mobileHomeGoals').evaluate(el=>el.offsetLeft>el.previousElementSibling.offsetLeft);
    assert(inline,'Score is next to its label on a wide sidebar');
    await series.locator('#mobileHomeGoals').fill('4');
    await series.locator('#mobileProgressResult').click();
    await series.locator('#mobileMatchResultStatus').getByText('Sparat i sändningen.').waitFor();
    assert.equal(writes[1].p_channel,'sec21-bronze-test');
    assert.equal(writes[1].p_home,4);
    assert.equal(state.scene,'intermission','Series editor leaves the live scene alone');
    assert.equal(await series.locator('#compactScenes').isVisible(),false);
    const music=frame.locator('.compact-music');
    assert.deepEqual(await music.locator('button').allTextContents(),['Hög','Låg','Av']);
    await music.locator('[data-music="high"]').click();
    await music.locator('[data-music="high"][aria-pressed="true"]').waitFor();
    assert.deepEqual(writes[2],{p_channel:'sec21-bronze-test',p_scene:'intermission',p_mode:'high'});
    await music.locator('[data-music="off"]').click();
    await music.locator('[data-music="off"][aria-pressed="true"]').waitFor();
    assert.equal(state.sceneMusic.muted,true);
    await frame.locator('[data-scene="live"]').click();
    await frame.locator('[data-scene="live"].active').waitFor();
    assert(await music.locator('[data-music="high"]').isDisabled());
    await frame.locator('#mobileFlipLiveTeams').click();
    await frame.locator('#mobileFlipLiveTeams[aria-pressed="true"]').waitFor();
    assert.match(await frame.locator('#mobileFlipLiveTeams').textContent(),/Testlaget B överst/);
    assert.deepEqual([state.home,state.away,state.hs,state.as],['111','222','4','2']);
    await frame.getByRole('button',{name:'Båda lagen',exact:true}).click();
    await frame.locator('[data-scene="duallineup"].active').waitFor();
    assert.deepEqual(writes.at(-1),{p_channel:'sec21-bronze-test',p_scene:'duallineup',p_lineup_side:null});
    const viewer=page.frame({url:/[?&]presenter=1/});
    await viewer.evaluate(()=>lineupStatus(false,false));
    await page.getByRole('button',{name:'Redigera laguppställning'}).click();
    const saveLineup=page.getByRole('button',{name:'Spara i sändningen',exact:true});
    await saveLineup.waitFor();
    assert(await saveLineup.isDisabled());
    const beforeLineup=structuredClone(state),writesBeforeLineup=writes.length;
    await viewer.evaluate(()=>lineupStatus(true,true));
    assert.equal(writes.length,writesBeforeLineup,'A draft has not written to the server');
    await saveLineup.click();
    await page.getByText('Sparat i sändningen.',{exact:true}).waitFor();
    assert.deepEqual(state,{...beforeLineup,lineups:updatedLineups},'Only the lineup changed on air');
    await viewer.evaluate(()=>lineupStatus(false,false));
    await page.getByRole('button',{name:'Redigera laguppställning'}).click();
    await saveLineup.waitFor();
    await viewer.evaluate(()=>parent.postMessage({type:'seh-presenter-lineup-reserves',ticket:'fixture.ticket',side:'home',slot:'C',team:'Testlaget A',current:'Forward A',choices:[{id:'42',name:'Reserv A',number:'27'}]},location.origin));
    const reservePick=page.getByRole('combobox',{name:'Testlaget A · C · Forward A'});
    await reservePick.selectOption('42');
    assert.deepEqual(state.lineups,updatedLineups,'A reserve choice remains a draft until Save');
    const savedReserve=page.waitForResponse(response=>response.url().endsWith('/functions/v1/broadcast-lineups')&&response.ok());
    await saveLineup.click();await savedReserve;
    assert.deepEqual(state,{...beforeLineup,lineups:reserveLineups});
    await viewer.evaluate(()=>lineupStatus(false,false));
    const beforeOverlays=structuredClone(state);
    await stripToggle.click();
    await frame.locator('[data-overlay="team-strip"][aria-pressed="false"]').waitFor();
    await commentatorToggle.click();
    await frame.locator('[data-overlay="commentators"][aria-pressed="true"]').waitFor();
    assert.deepEqual(state,{...beforeOverlays,liveTeamStripShow:false,liveCommentatorsShow:true});
    const awayStream=streams.getByRole('button',{name:'Testlaget B',exact:true});
    await awayStream.waitFor();
    const [feedDesktop,pickerDesktop]=await Promise.all([original.boundingBox(),streamPanel.boundingBox()]);
    assert(pickerDesktop.x>=feedDesktop.x+feedDesktop.width,'Stream controls are to the right of the original video');
    assert(pickerDesktop.y<feedDesktop.y+feedDesktop.height,'Both controls are on the same row');
    assert.equal(await series.locator('#teamStreamSwitch').isVisible(),false,'The series editor has no duplicate stream controls');
    const beforeFeed=structuredClone(state);
    await awayStream.click();
    await streams.locator('[data-team-stream="away"][aria-pressed="true"]').waitFor();
    assert.deepEqual(state,{...beforeFeed,twitchChannel:'test_away',liveTeamsReversed:true});
    const player=frame.locator('#presentPlayerButton');
    assert.equal(await player.evaluate(el=>el.previousElementSibling.dataset.scene),'leaders');
    await player.click();
    const menu=page.getByRole('dialog',{name:'Spelarpresentation'}),option=menu.getByRole('button',{name:'#27 · Reserv A'});
    await option.waitFor();
    const [menuBox,playerBox]=await Promise.all([menu.boundingBox(),player.boundingBox()]);
    assert(menuBox.y+menuBox.height<=playerBox.y,'Player picker opens above its button');
    assert.equal(await menu.getByRole('button',{name:'Målvakt B'}).count(),1);
    await option.click();
    await frame.locator('#presentPlayerButton.active').waitFor();
    assert.deepEqual(state.presentedPlayer,{id:'42',team:'111'});
    assert.equal(await menu.isVisible(),false);
    const lineupLink=page.getByRole('button',{name:'Visa Målvakt B i sändningen'});
    await Promise.all([lineupLink.click(),page.waitForResponse(response=>
     response.ok()&&response.url().endsWith('/rpc/broadcast_studio_set_team_order')&&response.request().postDataJSON().p_expected.playerId==='43')]);
    assert.deepEqual(state.presentedPlayer,{id:'43',team:'222'});
    assert.equal(await menu.isVisible(),false,'The lineup shortcut goes straight to the presentation');
    const graphCard=page.frameLocator('#broadcast').locator('#mockCard');
    await Promise.all([graphCard.click(),page.waitForResponse(response=>
     response.ok()&&response.url().endsWith('/rpc/broadcast_studio_set_team_order')&&response.request().postDataJSON().p_expected.playerId==='41')]);
    assert.deepEqual(state.presentedPlayer,{id:'41',team:'111'});
    assert.equal(state.scene,'spotlight');
    await frame.locator('[data-scene="spotlight"]').click();
    await frame.locator('[data-scene="spotlight"].active').waitFor();
    assert.equal(state.presentedPlayer,undefined);
    await page.setViewportSize({width:320,height:800});
    const [feedNarrow,pickerNarrow]=await Promise.all([original.boundingBox(),streamPanel.boundingBox()]);
    assert(pickerNarrow.y>=feedNarrow.y+feedNarrow.height,'On narrow screens stream controls wrap below the video');
    state.publicNoMatch=true;
    await page.waitForFunction(()=>document.getElementById('streamPicker').offsetHeight===0);
    await page.setViewportSize({width:1920,height:1080});
   }
   await page.locator('#studioToolsTitle').click();
   const toolsPage=page.frameLocator('#studioToolsFrame');
   if(mode==='operator'){
    await toolsPage.locator('main').waitFor({state:'visible'});
    assert.match(await toolsPage.locator('#studio-session').innerText(),/SV-STUDION/);
    assert.equal(await toolsPage.locator('html[data-sv-studio-operator]').count(),1);
   }else{
    await toolsPage.locator('#studio-login').waitFor({state:'visible'});
    assert.equal(await toolsPage.locator('main').isVisible(),false,'Scene access does not unlock full studio tools');
   }
   assert.match(await tools.getAttribute('src'),/SV\/\?panel=tools/);
   const toolsBox=await tools.boundingBox(),workBox=await page.locator('.commentator-workspace').boundingBox();
   assert(toolsBox.width>=workBox.width-24,'Advanced section spans both presenter columns');
   assert.equal(toolsLoads,1);
   if(mode==='operator')for(const restricted of ['SV/?scope-test=1','fi/?panel=tools','en/?panel=tools','de/?panel=tools']){
    await page.goto(base+restricted);
    await page.locator('#studio-login').waitFor();
    await page.waitForFunction(()=>document.querySelector('#studio-login-status')?.textContent!=='Kontrollerar inloggningen…',null,{timeout:5000});
    assert.match(await page.locator('#studio-login-status').textContent(),/saknar behörighet|har inte tillgång/,restricted);
    assert.equal(await page.locator('main').isVisible(),false);
   }
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('PASS compact scenes use the existing signed-in channel gate, resize in the presenter, and do not change match data.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

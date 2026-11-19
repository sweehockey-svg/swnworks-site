(() => {
  'use strict';
  const cockpit=window.CommentatorCockpit;
  if(!cockpit) return;
  const screen=document.getElementById('cockpitScreen');
  const drawer=document.getElementById('drawer');
  const nav=document.getElementById('mobileNav');
  const toggle=document.getElementById('mobileModeToggle');
  const small=window.matchMedia('(max-width: 760px)');
  let full=true,openedFor='';
  try{full=localStorage.getItem('cockpit-mobile-full-v2')!=='false';}catch{}

  function openPanel(panel,compose=false){
    if(!cockpit.state.teamDataLoaded||screen.classList.contains('hidden')) return;
    document.querySelectorAll('.deck-key').forEach(button=>button.classList.toggle('active',button.dataset.panel===panel));
    cockpit.openPanel(panel);
    if(compose){
      cockpit.state.noteEditorOpen=true;
      document.getElementById('noteEditor').open=true;
      document.getElementById('noteBody')?.focus();
    }
    update();
  }

  function update(){
    const ready=!screen.classList.contains('hidden')&&cockpit.state.teamDataLoaded;
    const compact=small.matches&&!full;
    document.body.classList.toggle('mobile-notes',compact&&ready);
    nav.classList.toggle('hidden',!ready);
    toggle.textContent=full?'Enkelt anteckningsläge':'Hela cockpiten';
    toggle.setAttribute('aria-pressed',String(full));
    const game=cockpit.state.nextGame;
    const name=id=>cockpit.state.teamById.get(id)?.canonical_name||'Lag';
    document.getElementById('mobileMatchContext').textContent=game
      ?name(game.home_team_id)+' – '+name(game.away_team_id)
      :cockpit.state.selectedTeam?.canonical_name||'';
    nav.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(drawer.classList.contains('open')&&drawer.dataset.panel===button.dataset.mobilePanel)));
    if(ready&&compact&&openedFor!==cockpit.state.selectedTeam?.id){
      openedFor=cockpit.state.selectedTeam.id;
      openPanel('notes');
    }
  }

  document.querySelectorAll('[data-mobile-panel]').forEach(button=>button.addEventListener('click',()=>openPanel(button.dataset.mobilePanel,button.classList.contains('mobile-primary'))));
  // The cockpit's outside-click handler must leave this navigation open.
  nav.addEventListener('click',event=>event.stopPropagation());
  document.querySelector('.mobile-hub').addEventListener('click',event=>event.stopPropagation());
  toggle.addEventListener('click',()=>{
    full=!full;
    try{localStorage.setItem('cockpit-mobile-full-v2',String(full));}catch{}
    document.getElementById('closeDrawer').click();
    update();
  });
  small.addEventListener('change',update);
  new MutationObserver(update).observe(screen,{attributes:true,attributeFilter:['class']});
  new MutationObserver(()=>{
    nav.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(drawer.classList.contains('open')&&drawer.dataset.panel===button.dataset.mobilePanel)));
  }).observe(drawer,{attributes:true,attributeFilter:['class','data-panel']});

  let syncing=false;
  async function refreshNotes(){
    if(syncing||document.visibilityState==='hidden'||!cockpit.state.authUser||!cockpit.state.teamDataLoaded) return;
    syncing=true;
    try{
      await cockpit.syncNotes();
      // Reuse draft restoration when refreshing the list after another device saves.
      if(drawer.classList.contains('open')&&drawer.dataset.panel==='notes'&&!drawer.contains(document.activeElement)) cockpit.openPanel('notes');
    }catch(error){console.warn('Note sync retry failed',error);}
    finally{syncing=false;}
  }
  window.addEventListener('online',refreshNotes);
  window.addEventListener('focus',refreshNotes);
  document.addEventListener('visibilitychange',refreshNotes);
  update();
})();

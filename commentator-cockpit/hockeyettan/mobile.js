(() => {
  'use strict';
  const cockpit=window.CommentatorCockpit;
  if(!cockpit) return;
  const drawer=document.getElementById('drawer');
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
})();

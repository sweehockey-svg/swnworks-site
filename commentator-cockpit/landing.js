(() => {
  'use strict';
  const list=document.querySelector('.cc-preview-tabs');
  if(!list) return;
  const tabs=[...list.querySelectorAll('[role="tab"]')];
  const titles=['Redo före nedsläpp.','Nära matchen. Hela vägen.','Dina ord. På rätt plats.'];
  function activate(tab,focus=false){
    tabs.forEach((item,index)=>{
      const selected=item===tab;
      item.setAttribute('aria-selected',String(selected));
      item.tabIndex=selected?0:-1;
      document.getElementById(item.getAttribute('aria-controls')).hidden=!selected;
      if(selected) document.getElementById('previewTitle').textContent=titles[index];
    });
    if(focus) tab.focus();
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activate(tab));
    tab.addEventListener('keydown',event=>{
      let next;
      if(event.key==='ArrowRight') next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft') next=(index+tabs.length-1)%tabs.length;
      else if(event.key==='Home') next=0;
      else if(event.key==='End') next=tabs.length-1;
      else return;
      event.preventDefault();activate(tabs[next],true);
    });
  });
})();

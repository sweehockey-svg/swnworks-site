(() => {
  'use strict';
  const controls=document.querySelector('.controls'),preview=document.querySelector('.toolbar');
  const design=document.getElementById('sender')?.closest('section');
  if(!controls||!preview||!design)return;
  const panel=document.createElement('dialog');
  panel.id='designPanel';
  panel.className='design-panel';
  panel.setAttribute('aria-labelledby','designPanelTitle');
  panel.innerHTML='<div class="design-panel-header"><div><span>GRAPHICS STUDIO</span><h2 id="designPanelTitle">Design & export</h2></div><button type="button" class="panel-close" aria-label="Stäng Design & export">✕</button></div>';
  const body=document.createElement('div');
  body.className='design-panel-body';
  const tournament=document.getElementById('league')?.closest('section');
  const data=document.getElementById('dataStatus')?.closest('section');
  if(tournament)body.append(tournament);
  // Keep tournament and group choices above the template-specific fields.
  if(tournament){
    for(const id of ['groupField','filterGroupField']){
      const field=document.getElementById(id);
      if(field)tournament.insertBefore(field,document.getElementById('refresh'));
    }
  }
  if(data)body.append(data);
  body.append(design);
  const actions=controls.querySelector('.actions'),note=controls.querySelector('.note');
  if(actions)body.append(actions);
  if(note)body.append(note);
  panel.append(body);
  const layout=document.querySelector('.layout'),wide=window.matchMedia('(min-width: 1100px)');
  layout.append(panel);
  const open=document.createElement('button');
  open.type='button';
  open.className='design-panel-open';
  open.textContent='Design & export';
  open.setAttribute('aria-haspopup','dialog');
  open.setAttribute('aria-controls',panel.id);
  open.setAttribute('aria-expanded','false');
  preview.append(open);
  function showPanel(){
    if(wide.matches){layout.classList.add('design-docked');panel.show()}
    else panel.showModal();
    open.setAttribute('aria-expanded','true');
  }
  open.addEventListener('click',()=>{if(panel.open)panel.close();else showPanel()});
  panel.querySelector('.panel-close').addEventListener('click',()=>panel.close());
  panel.addEventListener('click',event=>{
    if(event.target!==panel)return;
    const r=panel.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)panel.close();
  });
  panel.addEventListener('close',()=>{layout.classList.remove('design-docked');open.setAttribute('aria-expanded','false');open.focus()});
  wide.addEventListener('change',()=>{
    if(panel.open)panel.close();
    if(wide.matches)showPanel();
  });
  if(wide.matches)showPanel();
})();

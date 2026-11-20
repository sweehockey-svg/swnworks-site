(() => {
  'use strict';
  const api=window.CommentatorCockpit,workspace=document.querySelector('.cockpit .workspace');
  if(!api||!workspace)return;
  const choices={overview:'Överblick',standings:'Tabell',feed:'Matchfeed',special:'PP/BP',facts:'Snabbfakta',league:'Övriga matcher',notes:'Notes',lines:'Matchkedjor',players:'Spelarstatistik',goalies:'Målvakter',h2h:'Tidigare möten'};
  const defaults=['overview','feed','facts'];
  const original={overview:workspace.querySelector('.match-panel'),feed:workspace.querySelector('.event-panel'),facts:workspace.querySelector('.assistant-panel')};
  const parking=document.createElement('div');parking.className='dashboard-parking';parking.hidden=true;workspace.after(parking);
  const bar=document.createElement('details');bar.className='dashboard-toolbar';
  bar.innerHTML='<summary>Min dashboard · välj paneler</summary><div class="dashboard-settings">'+['Vänster','Mitten','Höger'].map((name,i)=>'<label><span data-dashboard-position>'+name+'</span><select data-dashboard-slot="'+i+'">'+Object.entries(choices).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')+'</select></label>').join('')+'<button type="button" data-dashboard-preset>Tabell · feed · PP/BP</button><button type="button" data-dashboard-before>Inför match</button><button type="button" data-dashboard-live>Under match</button><button type="button" data-dashboard-reset>Återställ standard</button><small>Layouten sparas för ditt konto i den här webbläsaren. På mindre skärmar staplas panelerna.</small></div>';
  workspace.before(bar);
  function updatePositionLabels(){
    const columns=window.getComputedStyle(workspace).gridTemplateColumns.trim().split(/\s+/).length;
    const labels=columns===1?['Överst','Mitten','Nederst']:columns===2?['Överst till vänster','Överst till höger','Nederst']:['Vänster','Mitten','Höger'];
    bar.querySelectorAll('[data-dashboard-position]').forEach((label,i)=>{label.textContent=labels[i];});
  }
  window.addEventListener('resize',updatePositionLabels);
  window.addEventListener('cockpit:render',updatePositionLabels);
  updatePositionLabels();
  const slots=defaults.map(()=>{const node=document.createElement('div');node.className='dashboard-slot';workspace.append(node);return node;});
  const extra={};
  for(const key of Object.keys(choices).filter(key=>!original[key])){const panel=document.createElement('section');panel.className='panel dashboard-widget';panel.innerHTML='<div class="panel-head"><h2>'+choices[key]+'</h2></div><div class="dashboard-widget-body"></div>';extra[key]=panel;parking.append(panel);}
  const selects=[...bar.querySelectorAll('select')];let layout=[...defaults],owner='';
  function storageKey(){return 'cockpit-dashboard-v1:'+api.state.authUser?.id+':hockeyettan';}
  function valid(value){return Array.isArray(value)&&value.length===3&&new Set(value).size===3&&value.every(key=>Object.hasOwn(choices,key));}
  function persist(){if(!api.state.authUser?.id)return;try{localStorage.setItem(storageKey(),JSON.stringify(layout));}catch{}}
  function paint(){
    for(const node of Object.values({...original,...extra}))if(node)parking.append(node);
    layout.forEach((key,i)=>{selects[i].value=key;slots[i].replaceChildren(original[key]||extra[key]);});
    workspace.classList.add('dashboard-workspace');refreshWidgets();
  }
  function refreshWidgets(){
    const widgets=api.widgets;
    if(!widgets)return;
    for(const key of Object.keys(choices).filter(key=>!original[key])){
      if(!layout.includes(key))continue;
      const body=extra[key].querySelector('.dashboard-widget-body');
      const html=widgets[key+'Html']?.()||'<p>Underlag saknas.</p>';
      if(body.dataset.html!==html){body.dataset.html=html;const scroll=extra[key].scrollTop;body.innerHTML=html;extra[key].scrollTop=scroll;const select=body.querySelector('[data-dashboard-player-team]');if(select){select.value=extra[key].dataset.team||'both';select.dispatchEvent(new Event('change',{bubbles:true}));}}
    }
    document.querySelectorAll('[data-league-board]').forEach(node=>{const html=widgets.leagueHtml();if(node.innerHTML!==html)node.innerHTML=html;});
  }
  function restoreOwner(){
    const id=api.state.authUser?.id||'guest';if(id===owner){refreshWidgets();return;}
    owner=id;layout=[...defaults];
    if(id!=='guest')try{const saved=JSON.parse(localStorage.getItem(storageKey())||'null');if(valid(saved))layout=saved;}catch{}
    paint();
  }
  selects.forEach((select,i)=>select.addEventListener('change',()=>{const previous=layout[i],duplicate=layout.indexOf(select.value);if(duplicate!==-1&&duplicate!==i)layout[duplicate]=previous;layout[i]=select.value;persist();paint();}));
  bar.querySelector('[data-dashboard-preset]').onclick=()=>{layout=['standings','feed','special'];persist();paint();};
  bar.querySelector('[data-dashboard-before]').onclick=()=>{layout=['lines','players','notes'];persist();paint();};
  bar.querySelector('[data-dashboard-live]').onclick=()=>{layout=['standings','feed','league'];persist();paint();};
  bar.querySelector('[data-dashboard-reset]').onclick=()=>{layout=[...defaults];persist();paint();};
  workspace.addEventListener('click',event=>{const button=event.target.closest('[data-dashboard-open]');if(button)api.openPanel(button.dataset.dashboardOpen);});
  workspace.addEventListener('change',event=>{if(event.target.matches('[data-dashboard-player-team]')){const panel=event.target.closest('.dashboard-widget');panel.dataset.team=event.target.value;panel.querySelectorAll('[data-dashboard-player-group]').forEach(group=>group.hidden=event.target.value!=='both'&&group.dataset.dashboardPlayerGroup!==event.target.value);}});
  window.addEventListener('cockpit:render',restoreOwner);restoreOwner();
})();

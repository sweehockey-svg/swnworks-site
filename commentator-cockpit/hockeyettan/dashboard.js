(() => {
  'use strict';
  const api=window.CommentatorCockpit,workspace=document.querySelector('.cockpit .workspace');
  if(!api||!workspace)return;
  const choices={overview:'Överblick',standings:'Tabell',feed:'Matchfeed',special:'PP/BP',facts:'Snabbfakta',league:'Övriga matcher',notes:'Notes',lines:'Matchkedjor',players:'Spelarstatistik',goalies:'Målvakter',h2h:'Tidigare möten'};
  const defaults=['overview','feed','facts'];
  const original={overview:workspace.querySelector('.match-panel'),feed:workspace.querySelector('.event-panel'),facts:workspace.querySelector('.assistant-panel')};
  const parking=document.createElement('div');parking.className='dashboard-parking';parking.hidden=true;workspace.after(parking);
  const slots=defaults.map((_,i)=>{
    const node=document.createElement('div');node.className='dashboard-slot';
    node.innerHTML='<div class="dashboard-panel-controls"><select data-dashboard-slot="'+i+'" aria-label="Välj innehåll i panel '+(i+1)+'">'+Object.entries(choices).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')+'</select></div><div class="dashboard-panel-content"></div>';
    workspace.append(node);return node;
  });
  const bar=document.createElement('details');bar.className='dashboard-layout-menu';
  bar.innerHTML='<summary>Layout</summary><div class="dashboard-layout-options"><button type="button" data-dashboard-before>Inför match</button><button type="button" data-dashboard-live>Under match</button><button type="button" data-dashboard-preset>Tabell · feed · PP/BP</button><button type="button" data-dashboard-reset>Återställ standard</button><small>Sparas för ditt konto i den här webbläsaren.</small></div>';
  slots[0].querySelector('.dashboard-panel-controls').append(bar);
  const extra={};
  for(const key of Object.keys(choices).filter(key=>!original[key])){const panel=document.createElement('section');panel.className='panel dashboard-widget';panel.innerHTML='<div class="panel-head"><h2>'+choices[key]+'</h2></div><div class="dashboard-widget-body"></div>';extra[key]=panel;parking.append(panel);}
  const selects=[...workspace.querySelectorAll('[data-dashboard-slot]')];let layout=[...defaults],owner='';
  function storageKey(){return 'cockpit-dashboard-v1:'+api.state.authUser?.id+':hockeyettan';}
  function valid(value){return Array.isArray(value)&&value.length===3&&new Set(value).size===3&&value.every(key=>Object.hasOwn(choices,key));}
  function persist(){if(!api.state.authUser?.id)return;try{localStorage.setItem(storageKey(),JSON.stringify(layout));}catch{}}
  function paint(){
    for(const node of Object.values({...original,...extra}))if(node)parking.append(node);
    layout.forEach((key,i)=>{selects[i].value=key;slots[i].querySelector('.dashboard-panel-content').replaceChildren(original[key]||extra[key]);});
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
  bar.querySelector('[data-dashboard-preset]').onclick=()=>{layout=['standings','feed','special'];persist();paint();bar.open=false;};
  bar.querySelector('[data-dashboard-before]').onclick=()=>{layout=['lines','players','notes'];persist();paint();bar.open=false;};
  bar.querySelector('[data-dashboard-live]').onclick=()=>{layout=['standings','feed','league'];persist();paint();bar.open=false;};
  bar.querySelector('[data-dashboard-reset]').onclick=()=>{layout=[...defaults];persist();paint();bar.open=false;};
  workspace.addEventListener('click',event=>{const button=event.target.closest('[data-dashboard-open]');if(button)api.openPanel(button.dataset.dashboardOpen);});
  workspace.addEventListener('change',event=>{if(event.target.matches('[data-dashboard-player-team]')){const panel=event.target.closest('.dashboard-widget');panel.dataset.team=event.target.value;panel.querySelectorAll('[data-dashboard-player-group]').forEach(group=>group.hidden=event.target.value!=='both'&&group.dataset.dashboardPlayerGroup!==event.target.value);}});
  window.addEventListener('cockpit:render',restoreOwner);restoreOwner();
})();

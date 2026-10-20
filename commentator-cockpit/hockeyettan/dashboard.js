(() => {
  'use strict';
  const api=window.CommentatorCockpit,workspace=document.querySelector('.cockpit .workspace');
  if(!api||!workspace)return;
  const choices={overview:'Överblick',standings:'Tabell',feed:'Matchfeed',special:'PP/BP',facts:'Snabbfakta',league:'Övriga matcher'};
  const defaults=['overview','feed','facts'];
  const original={overview:workspace.querySelector('.match-panel'),feed:workspace.querySelector('.event-panel'),facts:workspace.querySelector('.assistant-panel')};
  const parking=document.createElement('div');parking.className='dashboard-parking';parking.hidden=true;workspace.after(parking);
  const bar=document.createElement('details');bar.className='dashboard-toolbar';
  bar.innerHTML='<summary>Min dashboard · välj paneler</summary><div class="dashboard-settings">'+['Vänster','Mitten','Höger'].map((name,i)=>'<label>'+name+'<select data-dashboard-slot="'+i+'">'+Object.entries(choices).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')+'</select></label>').join('')+'<button type="button" data-dashboard-preset>Tabell · feed · PP/BP</button><button type="button" data-dashboard-reset>Återställ standard</button><small>Layouten sparas för ditt konto i den här webbläsaren. På mindre skärmar staplas panelerna.</small></div>';
  workspace.before(bar);
  const slots=defaults.map(()=>{const node=document.createElement('div');node.className='dashboard-slot';workspace.append(node);return node;});
  const extra={};
  for(const key of ['standings','special','league']){const panel=document.createElement('section');panel.className='panel dashboard-widget';panel.innerHTML='<div class="panel-head"><h2>'+choices[key]+'</h2></div><div class="dashboard-widget-body"></div>';extra[key]=panel;parking.append(panel);}
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
    for(const key of ['standings','special','league']){
      if(!layout.includes(key))continue;
      const body=extra[key].querySelector('.dashboard-widget-body');
      const html=key==='standings'?widgets.standingsHtml():key==='special'?widgets.specialHtml():widgets.leagueHtml();
      if(body.innerHTML!==html){const scroll=extra[key].scrollTop;body.innerHTML=html;extra[key].scrollTop=scroll;}
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
  bar.querySelector('[data-dashboard-reset]').onclick=()=>{layout=[...defaults];persist();paint();};
  window.addEventListener('cockpit:render',restoreOwner);restoreOwner();
})();

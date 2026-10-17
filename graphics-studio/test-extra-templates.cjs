const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const fields=new Map(),buttons=[],counter={};
const el=()=>({dataset:{},value:'',hidden:false,append(n){buttons.push(n)},prepend(){},closest(){return null},checkValidity(){return true},querySelectorAll(){return []},querySelector(){return counter},addEventListener(){}});
const list=el();list.closest=()=>({querySelector:()=>counter});list.querySelectorAll=()=>Array(18+buttons.length);
const document={createElement:()=>el(),getElementById:id=>{if(!fields.has(id))fields.set(id,el());return fields.get(id)},querySelector:s=>s==='.kinds'?list:el()};
const context={window:{GraphicsWeeklyTeam:require('./weekly-team.js')},document};vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/extra-templates.js','utf8'),context);
const S={kind:'game_night',logos:true,teams:[{sports_gamer_team_id:1,team_name_in_league:'Alpha'},{sports_gamer_team_id:2,team_name_in_league:'Beta'}],players:Array.from({length:6},(_,i)=>({sports_gamer_player_id:i+1,sports_gamer_team_id:1,display_gamertag:'Player '+i,team_name_in_league:'Alpha'}))};
let size={w:1080,h:1350};
const escape=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const api={S,TIT:{},format:()=>size,base:s=>'<svg>'+s+'</svg>',logos:()=>new Map([['1','logo1'],['2','logo2']]),img:(u,x,y,w)=>'<image href="'+escape(u)+'"/>',svgText:(x,y,t,size)=>'<text x="'+x+'" y="'+y+'">'+escape(t)+'</text>',esc:escape,portraitUrl:()=>'',normalizedPortrait:()=>'',rosterStatsValues:()=>[['GP',4],['G',2],['A',3],['P',5]],render(){}};
api.nationFlag=()=>'';
const templates=context.window.createExtraGraphicsTemplates(api);
assert.equal(buttons.length,7);assert.equal(counter.textContent,'25 MALLAR');
assert.equal(buttons.at(-1).dataset.kind,'welcome_player');
const set=(id,v)=>document.getElementById(id).value=String(v);
set('extraTeamA',1);set('extraTeamB',2);set('extraPlayerA','1:1');set('extraPlayerB','1:2');
set('extraHomeScore',3);set('extraAwayScore',2);set('extraSeriesFormat',5);set('extraSeriesHome',2);set('extraSeriesAway',1);
set('extraMvpGoals',2);set('extraMvpAssists',3);set('extraWelcome','<welcome>');set('extraDate','2026-10-20');set('extraTime','21:00');set('extraWatch','Match-TV');
['LW','C','RW','LD','RD','G'].forEach((s,i)=>set('extraSix'+s,'1:'+(i+1)));
for(const [w,h] of [[1080,1350],[1080,1080],[1080,1920],[1920,1080]]){
 size={w,h};
 for(const button of buttons){S.kind=button.dataset.kind;const svg=templates.graphic();assert(svg.startsWith('<svg>'));assert(!/NaN|undefined/.test(svg),S.kind);assert(!svg.includes('Välj'),S.kind);}
}
S.kind='player_duel';set('extraPlayerB','1:1');assert(templates.graphic().includes('olika spelare'));
S.kind='weekly_six';set('extraSixG','1:1');assert(templates.graphic().includes('olika spelare'));
S.kind='playoff_series';set('extraSeriesHome',4);assert(templates.graphic().includes('Kontrollera'));
console.log('Seven templates passed in all four formats; duplicate selections, series validation and appended order verified.');
S.teams[0].statistics_stage='regular';S.teams[0].effective_group_id=10;
S.teams[1].statistics_stage='regular';S.teams[1].effective_group_id=20;
S.players.push({sports_gamer_team_id:2,sports_gamer_player_id:99,display_gamertag:'Other group',team_name_in_league:'Beta'});
for(const button of buttons){
 S.kind=button.dataset.kind;S.filterGroup=10;templates.sync();
 assert(fields.get('extraTeamA').innerHTML.includes('Alpha'));
 assert(!fields.get('extraTeamA').innerHTML.includes('Beta'));
 assert(!fields.get('extraPlayerA').innerHTML.includes('Other group'));
}
S.kind='weekly_six';set('extraSixG','1:1');S.filterGroup=20;templates.sync();
assert.equal(fields.get('extraSixG').value,'');
assert(fields.get('extraSixG').innerHTML.includes('Other group'));
assert(!fields.get('extraSixG').innerHTML.includes('Player 1'));
S.filterGroup=null;templates.sync();assert(fields.get('extraSixG').innerHTML.includes('Player 1'));
console.log('All seven templates filter teams/players by group; changing group clears weekly selections; all groups restores options.');

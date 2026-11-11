const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/broadcast-studio.js','utf8');
const code=src.slice(src.indexOf('  let roadLoadLeague='),src.indexOf('  function renderLeaders()'));
const controls={roadGrid:{innerHTML:''},showLiveSeries:{checked:true},seriesFormat:{value:'5'},seriesHome:{value:'1'},seriesAway:{value:'0'},seriesRound:{value:'FINAL'}};
let regular={},post={},summary={},matches=null;
const vm=require('node:vm'), ctx={window:{}};
vm.runInNewContext(fs.readFileSync(__dirname+'/group-meetings.js','utf8'),ctx);
const groupMeetings={...ctx.window.BroadcastGroupMeetings,completed:()=>matches};
const number=v=>v!=null&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
const render=new Function('$','selectedTeam','stage','playoff','number','logo','image','esc','tx','LOCALE','activeLeagueId','activeScene','groupMeetings','team',code+';return renderRoad;')(
 id=>controls[id.slice(1)],side=>({team_name_in_league:side,sports_gamer_team_id:side==='home'?1:2}),(_,phase)=>phase==='regular'?regular:post,()=>summary,number,()=>'',()=>'',v=>String(v),v=>v,'sv',527,'opening',groupMeetings,id=>({team_name_in_league:'Team '+id}));
function html(){render();return controls.roadGrid.innerHTML;}
assert.match(html(),/kunde inte hämtas/);
regular={total_wins:12,goals_for:56,goals_against:25};summary={regular_season_seed:2};
post={games_played:4,total_wins:3};assert.match(html(),/#2 · 12 wins · 56–25 goals/);assert.match(html(),/4 matches · 3 matchWins/);
matches=[];assert.match(html(),/Inga tidigare slutspelsmöten/);
const date=n=>'2026-11-0'+n+'T20:00:00Z';
matches=[
 {stage:'playoffs',homeId:1,awayId:2,homeScore:15,awayScore:0,date:date(8)},
 {stage:'playoffs',homeId:1,awayId:4,homeScore:3,awayScore:1,date:date(7)},
 {stage:'playoffs',homeId:3,awayId:1,homeScore:2,awayScore:5,date:date(5)},
 {stage:'playoffs',homeId:1,awayId:3,homeScore:1,awayScore:4,date:date(4)},
 {stage:'regular',homeId:5,awayId:1,homeScore:3,awayScore:4,date:date(1)}
];
const out=html();assert.match(out,/Team 3[\s\S]*1–1[\s\S]*1–4[\s\S]*5–2[\s\S]*Team 4[\s\S]*1–0/);
assert.match(out,/9–7/);assert.doesNotMatch(out,/FINAL|15–0|Team 5|BO5|Slutspelet totalt/);
console.log('PASS playoff path: previous opponents, game scores from the correct side, no current series, graceful fallback.');

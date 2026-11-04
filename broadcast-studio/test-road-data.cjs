const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/broadcast-studio.js','utf8');
const code=src.slice(src.indexOf('  function renderRoad()'),src.indexOf('  function renderLeaders()'));
const controls={roadGrid:{innerHTML:''},showLiveSeries:{checked:false},seriesFormat:{value:'5'},seriesHome:{value:'1'},seriesAway:{value:'0'},seriesRound:{value:'SEMIFINAL'}};
let regular={},post={},summary={};
const number=v=>v!=null&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
const render=new Function('$','selectedTeam','stage','playoff','number','logo','image','esc','tx','seriesBestOf','LOCALE',code+';return renderRoad;')(
 id=>controls[id.slice(1)],side=>({team_name_in_league:side}),(_,phase)=>phase==='regular'?regular:post,()=>summary,number,()=>'',()=>'',v=>String(v),v=>v,n=>'BO'+n,'sv');
function html(){render();return controls.roadGrid.innerHTML;}
assert(!html().includes('#–'));assert(!html().includes('<strong>'));assert(html().includes('dataMissing'));
regular={total_wins:12,goals_for:56,goals_against:25};let out=html();assert(out.includes('12 wins'));assert(out.includes('56–25'));assert(!out.includes('series</strong>'));assert(!out.includes('#'));
summary={regular_season_seed:2,series_won:0,series_lost:0,matched_playoff_game_wins:0};out=html();assert(out.includes('#2'));assert(out.includes('0–0 series'));assert(out.includes('0 matchWins'));
summary={};post={games_played:4,total_wins:3};out=html();assert(out.includes('3 matchWins'));assert(out.includes('4 matches'));assert(!out.includes('series</strong>'));
controls.showLiveSeries.checked=true;out=html();assert(out.includes('SEMIFINAL'));assert(out.includes('1 matchvinst'));assert(out.includes('0 matchWins'));assert(out.includes('BO5'));assert(!out.includes('liveTournamentData'));
regular={total_wins:null,goals_for:null,goals_against:null};post={};summary={};controls.showLiveSeries.checked=false;assert(!html().includes('<strong>'));
console.log('PASS road data: missing values hidden, real totals and seed preserved, zero retained, postseason wins not confused with series, manual current series explicitly separate.');

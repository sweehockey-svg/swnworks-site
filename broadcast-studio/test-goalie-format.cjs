const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/broadcast-studio.js','utf8');
const functions=source.slice(source.indexOf('  function goaliePct('),source.indexOf('  function matchupCard('));
for(const locale of ['sv','en','fi','de']){
 const ctx={LOCALE:locale,Intl,number:v=>v==null||v===''||!Number.isFinite(Number(v))?null:Number(v)};
 vm.createContext(ctx);vm.runInContext(functions,ctx);
 const decimal=locale==='en'?'.':',';
 assert.equal(ctx.goaliePct(.7549),'75'+decimal+'49');
 assert.equal(ctx.goaliePct(75.49),'75'+decimal+'49');
 assert.equal(ctx.goalieDecimal(4.1667),'4'+decimal+'17');
 assert.equal(ctx.goalieDecimal(3),'3'+decimal+'00');
 assert.equal(ctx.goaliePct(null),'–');
 assert.equal(ctx.goaliePct(-.5),'–');
 assert.equal(ctx.goalieStageValue({regular_goalie_games:0,regular_goalie_save_percentage:0},'regular','sv'),'–');
 assert.equal(ctx.goalieStageValue({regular_goalie_games:6,regular_goalie_save_percentage:.7549},'regular','sv'),'75'+decimal+'49');
}
const portrait=source.split(/\r?\n/).find(line=>line.includes('const goaliePortrait ='));
assert(portrait.includes("esc(x.p.display_gamertag)+'</b><small>G'"),'Gamertag has its own headline, jersey number belongs in metadata');
const css=fs.readFileSync(__dirname+'/broadcast-studio.css','utf8');
assert.match(css,/\.goalie-name b\{[^}]*white-space:normal;overflow-wrap:anywhere/);
console.log('Goalie matchup: SV% and GAA precision, localized decimals, missing games, zero values and untruncated gamertag passed.');

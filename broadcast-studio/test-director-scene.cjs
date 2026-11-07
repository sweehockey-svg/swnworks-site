const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/broadcast-studio.js','utf8');
const read=src.slice(src.indexOf('  async function followProgramScene()'),src.indexOf('  async function pullState()'));
const key=src.split('\n').find(line=>line.includes('const sceneKey='));
const calls=[],scenes=[],statuses=[],music=[],series={seriesHome:{value:"0"},seriesAway:{value:"0"}};
const document={hidden:false,querySelectorAll:()=>['opening','lineup','live'].map(scene=>({dataset:{scene}}))};
const ctx=vm.createContext({console,document,calls,scenes,statuses,music,series,window:{dispatchEvent:e=>statuses.push(e.detail)},CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail;}}});
vm.runInContext(`
let directorRestoring=false,directorReading=false,directorWrites=0,remoteTimer=0,directorRevision=0;
let programState={home:'prepared-home',away:'prepared-away',scene:'opening',lineupSide:'home',lineups:{home:{G:'player'}}};
let programHeld=false;
let incoming={scene:'opening',home:'on-air-home',lineupSide:'home'},publicNoMatch=true,publicNextMatch=null,delay=null;
const applyScene=(...args)=>scenes.push(args);
const setSceneMusic=settings=>music.push(settings);
const syncSceneMusic=()=>{};
const $=id=>series[id.slice(1)];
const renderSeries=()=>{};
const remoteRequest=async method=>{calls.push(method);if(delay)await delay;return [{state:incoming}];};
${key}
let directorSceneKey=sceneKey(incoming);
${read}
`,ctx);
const run=code=>vm.runInContext(code,ctx);
(async()=>{
 await run('followProgramScene()');assert.equal(scenes.length,0);
 run("incoming={...incoming,scene:'lineup',lineupSide:'away'}");
 await run('followProgramScene()');assert.equal(JSON.stringify(scenes.at(-1)),JSON.stringify(['lineup','away']));
 assert.equal(run('programState.home'),'prepared-home');assert.equal(run('programState.lineups.home.G'),'player');assert.equal(run('publicNoMatch'),false);
 await run('followProgramScene()');assert.equal(scenes.length,1,'unchanged state does not rerender');
 run("incoming={...incoming,sceneMusic:{lineup:'off'}}");await run('followProgramScene()');
 assert.equal(scenes.length,1,'music-only changes do not switch scenes');
 assert.equal(music.at(-1).lineup,'off');
 assert.equal(run('programState.sceneMusic.lineup'),'off');
 run("incoming={...incoming,seriesHome:'2',seriesAway:'1'}");await run('followProgramScene()');
 assert.equal(series.seriesHome.value,'2');assert.equal(series.seriesAway.value,'1');
 assert.equal(scenes.length,1,'Series-only changes do not switch scenes');
 run("programHeld=true;incoming={...incoming,seriesHome:'3'}");await run('followProgramScene()');
 assert.equal(run('programState.seriesHome'),'3');
 assert.equal(series.seriesHome.value,'2','Prepared match keeps its own wins');
 run("incoming={...incoming,scene:'idle',publicNoMatch:true}");await run('followProgramScene()');
 assert.equal(scenes.length,1,'waiting screen does not replace prepared scene');assert.equal(statuses.at(-1).publicNoMatch,true);
 run("incoming={scene:'live'};directorWrites=1");await run('followProgramScene()');assert.equal(scenes.length,1);
 run('directorWrites=0;delay=new Promise(resolve=>globalThis.release=resolve)');
 const pending=run('followProgramScene()');run('directorRevision++;release();delay=null');await pending;
 assert.equal(scenes.length,1,'stale read does not undo local edit');
 await run('followProgramScene()');assert.equal(scenes.at(-1)[0],'live');
 assert(calls.every(method=>method==='GET'),'scene following never writes');
 console.log('PASS director follows mobile scene and lineup side, preserves prepared match, no write-back, ignores stale reads and idle scene');
})().catch(error=>{console.error(error);process.exitCode=1;});

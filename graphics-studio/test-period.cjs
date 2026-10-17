const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const weekly=require('./weekly-team.js');
for(const [start,end,valid] of [['2026-10-12','2026-10-16',true],['2026-10-16','2026-10-16',true],['2026-10-16','2026-10-12',false],['2026-02-30','2026-03-01',false],['','2026-10-16',false]])assert.equal(weekly.validRange(start,end),valid);
const fields=new Map(),buttons=[];
const el=()=>({dataset:{},value:'',events:{},addEventListener(k,fn){this.events[k]=fn},append(n){buttons.push(n)},prepend(){},closest(){return {querySelector:()=>({})}},querySelectorAll(){return []},checkValidity(){return true}});
const list=el();list.querySelectorAll=()=>Array(18+buttons.length);
const document={createElement:el,getElementById:id=>{if(!fields.has(id))fields.set(id,el());return fields.get(id)},querySelector:s=>s==='.kinds'?list:el()};
let request,resolveRequest;
const context={document,window:{GraphicsWeeklyTeam:weekly,SWNStudioAccess:{session:async()=>({access_token:'test'})},EHOCKEY_CONFIG:{supabaseUrl:'https://example.invalid',supabasePublishableKey:'test'}},fetch:async(url,options)=>{request={url,body:JSON.parse(options.body)};return new Promise(resolve=>{resolveRequest=()=>resolve({ok:true,json:async()=>({supported:true,matches:1,complete:true,start:'2026-10-12',end:'2026-10-16',candidates:[]})})})}};
vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/extra-templates.js','utf8'),context);
const templates=context.window.createExtraGraphicsTemplates({S:{kind:'weekly_six',league:532,players:[],teams:[]},TIT:{},esc:String,render(){}});
const get=id=>document.getElementById(id);
get('extraWeek').value='2026-10-12';get('extraWeekEnd').value='2026-10-16';get('extraForwardMetric').value='total';
(async()=>{
 const pending=get('extraAutoWeek').events.click();await new Promise(setImmediate);
 assert.equal(request.url,'https://example.invalid/rest/v1/rpc/graphics_period_candidates');
 assert.deepEqual(request.body,{p_league:532,p_start:'2026-10-12',p_end:'2026-10-16'});
 get('extraWeekEnd').value='2026-10-15';resolveRequest();await pending;
 assert(!get('extraWeekStatus').textContent.includes('platser fyllda'),'Stale response must not apply after end date changes');
 const languageContext={window:{},localStorage:{getItem:()=>null,setItem(){}},NodeFilter:{SHOW_TEXT:4},document:{documentElement:{},querySelector:()=>({}),body:{},createTreeWalker:()=>({nextNode:()=>false}),querySelectorAll:()=>[]}};
 vm.createContext(languageContext);vm.runInContext(fs.readFileSync(__dirname+'/language.js','utf8'),languageContext);
 const L=languageContext.window.GraphicsLanguage;
 for(const [lang,title] of [['en','TEAM OF THE WEEK'],['fi','VIIKON JOUKKUE'],['sv','VECKANS LAG']]){L.set(lang);assert.equal(L.t('VECKANS LAG'),title)}
 console.log('Custom period: weekday starts, inclusive single day, invalid dates, RPC parameters, stale responses and three languages passed.');
})().catch(error=>{console.error(error);process.exitCode=1});

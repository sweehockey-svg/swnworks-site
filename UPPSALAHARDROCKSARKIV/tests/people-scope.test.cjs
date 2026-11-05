const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const src=fs.readFileSync(__dirname+'/../app.js','utf8');
const start=src.indexOf('  function renderPeopleIndex()'),end=src.indexOf('  // Graph edges',start),code=src.slice(start,end);
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage();await page.setContent('<main id="app"></main>');
 await page.addScriptTag({content:`(()=>{const app=document.querySelector('#app'),$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],escapeHtml=v=>String(v),pageHeader=()=>'',registryFooter=()=>'';
 const verified=[{id:'1',canonical_name:'Anna Andersson'},{id:'2',canonical_name:'Bo Berg'}],review=[{id:'3',canonical_name:'Cecilia Carlsson'}];
 const uppsalaPeople=()=>verified,unreviewedBandPeople=()=>review,membershipsForPerson=()=>[],bandName=()=>'',personSearchName=p=>p.canonical_name,personIndexName=(p,o)=>o==='surname'?p.canonical_name.split(' ').at(-1):p.canonical_name,personCard=p=>'<article data-person="'+p.id+'">'+p.canonical_name+'</article>';
 function bindRegistry(get,render,id,events){const update=()=>{const rows=get();$('#'+id).innerHTML=render(rows);$('#registry-count').textContent=rows.length;};for(const [el,event]of events)el.addEventListener(event,update);update();return update;}
 ${code};renderPeopleIndex();})();`});
 const count=async n=>assert.equal(await page.locator('#registry-count').textContent(),String(n));
 await count(3);assert.equal(await page.locator('input[data-person-scope]:checked').count(),0);
 await page.locator('[data-person-scope="verified"]').check();await count(2);
 await page.locator('[data-person-scope="review"]').check();await count(1);assert.equal(await page.locator('[data-person-scope="verified"]').isChecked(),false);
 await page.locator('[data-person-scope="review"]').uncheck();await count(3);
 await page.locator('#people-search').fill('Anna');await count(1);await page.locator('[data-person-scope="review"]').check();await count(0);assert.equal(await page.locator('#people-search').inputValue(),'Anna');
 await page.locator('#registry-reset').click();await count(3);assert.equal(await page.locator('input[data-person-scope]:checked').count(),0);
 await page.locator('[data-letter="B"]').click();await count(1);await page.locator('#registry-reset').click();await count(3);
 console.log('PASS all by default, exclusive checkbox filters, unchecked restores all, search retained, count/letters/reset correct.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

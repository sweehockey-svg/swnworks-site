const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/TheSw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const read=file=>fs.readFileSync(__dirname+'/'+file,'utf8');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const base=read('broadcast-studio.css'),fiCss=read('game-night-fi.css');
  const file=read('fi/index.html');
  assert.match(file,/href="game-night-fi\.css\?v=/);
  for(const lang of ['SV','en','de'])assert(!read(lang+'/index.html').includes('game-night-fi.css'));
  const html=file.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'').replace(/<base\b[^>]*>/g,'');
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  await page.route('**/*',r=>{
   const url=new URL(r.request().url());
   if(url.href==='https://fixture.test/fi/')return r.fulfill({contentType:'text/html',body:html});
   if(url.pathname==='/broadcast-studio/assets/game-night-background-photo.webp')return r.fulfill({path:__dirname+'/assets/game-night-background-photo.webp'});
   if(url.pathname.endsWith('/assets/arena-mist.svg'))return r.fulfill({path:__dirname+'/assets/arena-mist.svg'});
   return r.abort();
  });
  await page.goto('https://fixture.test/fi/');
  await page.addStyleTag({content:base});
  await page.addStyleTag({content:fiCss});
  await page.evaluate(()=>{
   const screen=document.querySelector('#screen');
   document.body.replaceChildren(screen);
   document.documentElement.classList.add('obs-preview');
   document.body.className='obs-preview';
   Object.assign(document.body.dataset,{background:'gamenight',graphics:'gamenight',theme:'broadcast'});
   screen.style.cssText='width:1280px!important;height:720px!important;transform:none!important';
   screen.classList.add('arena-mist-enabled');
   screen.querySelector('#topTitle').textContent='FCL 27';
   screen.querySelector('#topSub').textContent='KOTIJOUKKUE vs VIERASJOUKKUE';
   screen.querySelectorAll('.opening-match .team>img').forEach((img,i)=>{
    img.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="'+(i?'#e45343':'#8ec9ff')+'" d="M12 20 50 6 88 20v33L50 94 12 53z"/><text x="50" y="58" text-anchor="middle" font-size="31" font-weight="bold" fill="#0b1829">'+(i?'V':'K')+'</text></svg>');
   });
  });
  const inspect=()=>page.evaluate(()=>{
   const css=s=>getComputedStyle(document.querySelector(s));
   return {
    title:css('.opening h1 span').backgroundImage,vs:css('.opening-match em').color,
    filter:css('.background-package-layer').filter,logo:css('.opening-match .team>img').filter,
    mist:getComputedStyle(document.querySelector('.background-package-layer'),'::before').animationName
   };
  });
  const fi=await inspect();
  assert.match(fi.title,/232, 246, 255/);
  assert.equal(fi.vs,'rgb(156, 208, 255)');
  assert.match(fi.filter,/grayscale/);
  assert.doesNotMatch(fi.logo,/grayscale/);
  assert.match(fi.logo,/109, 173, 244/);
  assert.equal(fi.mist,'arena-mist-drift');
  if(process.env.FI_NIGHT_QA_PATH)await page.screenshot({path:process.env.FI_NIGHT_QA_PATH});
  await page.evaluate(()=>document.documentElement.lang='sv');
  const sv=await inspect();
  assert.match(sv.title,/255, 224, 123/);
  assert.equal(sv.filter,'none');
  await page.evaluate(()=>{
   document.documentElement.lang='fi';
   document.body.dataset.background='broadcast';
   document.body.dataset.graphics='standard';
  });
  const standard=await inspect();
  assert.equal(standard.filter,'none');
  assert.doesNotMatch(standard.title,/232, 246, 255/);
  await page.evaluate(()=>{
   document.body.dataset.background='gamenight';
   document.body.dataset.graphics='gamenight';
   document.querySelector('.screen').classList.add('live-mode');
  });
  assert.equal(await page.locator('.background-package-layer').isVisible(),false);
  assert.equal((await inspect()).mist,'none');
  console.log('PASS Finnish Game Night palette, unfiltered team logos, animated mist, and no change to Swedish or Match Live background.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

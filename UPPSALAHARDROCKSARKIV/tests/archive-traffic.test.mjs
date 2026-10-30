
var trafficAssert=(await import('node:assert/strict')).default;
function runTrackerTest(options={}) {
  const listeners={},calls=[],loc={hostname:options.hostname || 'swnworks.se',hash:'#/band/always-war'};
  const nav={globalPrivacyControl:options.gpc || false,doNotTrack:options.dnt?'1':'0'};
  const win={ARCHIVE_CONFIG:{supabaseUrl:'https://example.test',publishableKey:'test-public'},addEventListener:(name,fn)=>listeners[name]=fn};
  function simulateTracker(window,navigator,location,document,fetch,AbortSignal,URL) {
(() => {
  'use strict';
  // Counts document openings and hash-route views; no cookies, visitor IDs,
  // search terms, form contents, raw referrer URLs or IP addresses are sent.
  const cfg=window.ARCHIVE_CONFIG;
  if (!cfg || location.hostname!=='swnworks.se' && location.hostname!=='www.swnworks.se') return;
  const respectsPrivacy=()=>navigator.globalPrivacyControl===true || navigator.doNotTrack==='1' || window.doNotTrack==='1';
  if (respectsPrivacy()) return;
  function archivePath(hash) {
  let path;
  try { path=decodeURIComponent(String(hash || '#/').replace(/^#/,'').split('?')[0]); } catch { return '/404'; }
  if (!path.startsWith('/')) path='/'+path;
  if (path==='/sok' || path.startsWith('/sok/')) return '/sok';
  if (path==='/kontakt' || path.startsWith('/kontakt/')) return '/kontakt';
  if (['/','/band','/personer','/utgavor','/videor','/tidslinje','/natverket','/kallor','/om'].includes(path)) return path;
  if (/^\/(band|person|utgava)\/[a-z0-9][a-z0-9-]{0,159}$/.test(path) || /^\/videor\/[A-Za-z0-9_-]{11}$/.test(path)) return path;
  return '/404';
}

function archiveSource(referrer) {
  if (!referrer) return 'direct';
  let host;
  try { host=new URL(referrer).hostname.toLowerCase(); } catch { return 'direct'; }
  const domain = value => host===value || host.endsWith('.'+value);
  if (domain('swnworks.se')) return 'internal';
  if (domain('google.com') || domain('google.se') || /^([a-z0-9-]+\.)*google\.(co\.[a-z]{2}|[a-z]{2,3})$/.test(host)) return 'google';
  for (const [domainName,label] of [['bing.com','bing'],['duckduckgo.com','duckduckgo'],['facebook.com','facebook'],['fb.com','facebook'],['instagram.com','instagram'],['youtube.com','youtube'],['youtu.be','youtube'],['reddit.com','reddit']]) if (domain(domainName)) return label;
  return 'other';
}
  const source=archiveSource(document.referrer);
  let lastPath=null;
  function record() {
    if (respectsPrivacy()) return;
    const path=archivePath(location.hash);
    if (path===lastPath) return;
    const entry=lastPath===null;
    lastPath=path;
    // The collector is independent of rendering. Errors never interrupt the archive.
    fetch(cfg.supabaseUrl+'/functions/v1/archive-traffic',{
      method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},
      body:JSON.stringify({path,source,entry}),credentials:'omit',referrerPolicy:'no-referrer',
      keepalive:true,signal:AbortSignal.timeout(5000)
    }).catch(()=>{});
  }
  window.addEventListener('hashchange',record);
  window.addEventListener('popstate',record);
  record();
})();

  }
  simulateTracker(win,nav,loc,{referrer:options.referrer || ""},(...args)=>{calls.push(args);return Promise.resolve({ok:true});},AbortSignal,URL);
  return {listeners,calls,loc};
}
var clientTest=runTrackerTest({referrer:'https://www.google.se/search?q=private-search'});
trafficAssert.equal(clientTest.calls.length,1);
trafficAssert.deepEqual(JSON.parse(clientTest.calls[0][1].body),{path:'/band/always-war',source:'google',entry:true});
trafficAssert.equal(clientTest.calls[0][1].referrerPolicy,'no-referrer');
trafficAssert.equal(clientTest.calls[0][1].credentials,'omit');
clientTest.listeners.hashchange();trafficAssert.equal(clientTest.calls.length,1);
clientTest.loc.hash='#/sok/private-search';clientTest.listeners.hashchange();
trafficAssert.deepEqual(JSON.parse(clientTest.calls[1][1].body),{path:'/sok',source:'google',entry:false});
clientTest.listeners.popstate();trafficAssert.equal(clientTest.calls.length,2);
trafficAssert.equal(runTrackerTest({dnt:true}).calls.length,0);
trafficAssert.equal(runTrackerTest({gpc:true}).calls.length,0);
trafficAssert.equal(runTrackerTest({hostname:'localhost'}).calls.length,0);
trafficAssert.equal(JSON.parse(runTrackerTest({referrer:'https://m.facebook.com/path?private=1'}).calls[0][1].body).source,'facebook');
trafficAssert.equal(JSON.parse(runTrackerTest({referrer:'https://facebook.com.attacker.test'}).calls[0][1].body).source,'other');
var edgeHandler,edgeCalls=[],edgeFailure=false;
{
const Deno={serve:fn=>{edgeHandler=fn;},env:{get:name=>({SUPABASE_SECRET_KEYS:JSON.stringify({default:'sb_secret_test_only'}),SUPABASE_URL:'https://example.test'})[name]}};
const fetch=async (url,opts)=>{edgeCalls.push({url,opts});return {ok:!edgeFailure};};
function archivePath(hash) {
  let path;
  try { path=decodeURIComponent(String(hash || '#/').replace(/^#/,'').split('?')[0]); } catch { return '/404'; }
  if (!path.startsWith('/')) path='/'+path;
  if (path==='/sok' || path.startsWith('/sok/')) return '/sok';
  if (path==='/kontakt' || path.startsWith('/kontakt/')) return '/kontakt';
  if (['/','/band','/personer','/utgavor','/videor','/tidslinje','/natverket','/kallor','/om'].includes(path)) return path;
  if (/^\/(band|person|utgava)\/[a-z0-9][a-z0-9-]{0,159}$/.test(path) || /^\/videor\/[A-Za-z0-9_-]{11}$/.test(path)) return path;
  return '/404';
}

function archiveSource(referrer) {
  if (!referrer) return 'direct';
  let host;
  try { host=new URL(referrer).hostname.toLowerCase(); } catch { return 'direct'; }
  const domain = value => host===value || host.endsWith('.'+value);
  if (domain('swnworks.se')) return 'internal';
  if (domain('google.com') || domain('google.se') || /^([a-z0-9-]+\.)*google\.(co\.[a-z]{2}|[a-z]{2,3})$/.test(host)) return 'google';
  for (const [domainName,label] of [['bing.com','bing'],['duckduckgo.com','duckduckgo'],['facebook.com','facebook'],['fb.com','facebook'],['instagram.com','instagram'],['youtube.com','youtube'],['youtu.be','youtube'],['reddit.com','reddit']]) if (domain(domainName)) return label;
  return 'other';
}

const allowedOrigins=new Set(['https://swnworks.se','https://www.swnworks.se']);
const expectedPublishableKey='test-public';
// Environment secrets stay on the backend; no secret is returned or logged.
function backendKey() {
  try { const keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}'); if(keys.default) return keys.default; } catch {}
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}
Deno.serve(async request => {
  const origin=request.headers.get('origin') || '';
  const headers={'Access-Control-Allow-Origin':allowedOrigins.has(origin)?origin:'https://swnworks.se',
    'Access-Control-Allow-Headers':'apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS',
    'Vary':'Origin','Cache-Control':'no-store'};
  const reply=status=>new Response(null,{status,headers});
  if (!allowedOrigins.has(origin)) return reply(403);
  if (request.method==='OPTIONS') return reply(204);
  if (request.method!=='POST') return reply(405);
  if (request.headers.get('apikey')!==expectedPublishableKey) return reply(401);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply(415);
  if (Number(request.headers.get('content-length') || 0)>1024) return reply(413);
  try {
    const text=await request.text();
    if (text.length>1024) return reply(413);
    const payload=JSON.parse(text);
    if (!payload || typeof payload.path!=='string' || typeof payload.entry!=='boolean' || typeof payload.source!=='string') return reply(400);
    const path=archivePath('#'+payload.path);
    if (path!==payload.path) return reply(400);
    if (!['direct','internal','google','bing','duckduckgo','facebook','instagram','youtube','reddit','other'].includes(payload.source)) return reply(400);
    // Global Privacy Control and Do Not Track are also honoured by the browser tracker.
    if (request.headers.get('sec-gpc')==='1' || request.headers.get('dnt')==='1') return reply(204);
    const key=backendKey(), base=Deno.env.get('SUPABASE_URL');
    if (!key || !base) return reply(503);
    const dbHeaders={'apikey':key,'Content-Type':'application/json'};
    if (!key.startsWith('sb_secret_')) dbHeaders['Authorization']='Bearer '+key;
    const result=await fetch(base+'/rest/v1/rpc/record_archive_traffic',{
      method:'POST',headers:dbHeaders,
      body:JSON.stringify({p_path:path,p_source:payload.source,p_entry:payload.entry}),
      signal:AbortSignal.timeout(5000)
    });
    return reply(result.ok?204:503);
  } catch { return reply(400); }
});

}
function trafficRequest(data,options={}) {
  return new Request('https://example.test/functions/v1/archive-traffic',{
    method:options.method || 'POST',headers:{origin:'https://swnworks.se',apikey:'test-public','content-type':'application/json',...(options.headers || {})},
    ...(options.method==='OPTIONS'||options.method==='GET'?{}:{body:typeof data==='string'?data:JSON.stringify(data)})
  });
}
var sample={path:'/band/always-war',source:'google',entry:true};
trafficAssert.equal((await edgeHandler(trafficRequest(sample))).status,204);
trafficAssert.equal(edgeCalls.length,1);
trafficAssert.deepEqual(JSON.parse(edgeCalls[0].opts.body),{p_path:'/band/always-war',p_source:'google',p_entry:true});
trafficAssert.equal(edgeCalls[0].opts.headers.Authorization,undefined);
trafficAssert.equal((await edgeHandler(trafficRequest(sample,{headers:{origin:'https://attacker.test'}}))).status,403);
trafficAssert.equal((await edgeHandler(trafficRequest(sample,{headers:{apikey:'wrong'}}))).status,401);
trafficAssert.equal((await edgeHandler(trafficRequest({...sample,path:'/sok/private-search'}))).status,400);
trafficAssert.equal((await edgeHandler(trafficRequest({...sample,source:'https://private.example/?name=secret'}))).status,400);
trafficAssert.equal((await edgeHandler(trafficRequest(sample,{headers:{'sec-gpc':'1'}}))).status,204);
trafficAssert.equal(edgeCalls.length,1);
trafficAssert.equal((await edgeHandler(trafficRequest(sample,{method:'OPTIONS'}))).status,204);
trafficAssert.equal((await edgeHandler(trafficRequest(sample,{method:'GET'}))).status,405);
trafficAssert.equal((await edgeHandler(trafficRequest('x'.repeat(1200)))).status,413);
trafficAssert.equal((await edgeHandler(trafficRequest('{invalid'))).status,400);
edgeFailure=true;trafficAssert.equal((await edgeHandler(trafficRequest(sample))).status,503);
console.log('Passed: visit/pageview distinction, hash/popstate deduplication, sanitized routes and sources, no search terms or raw referrers, DNT/GPC, localhost exclusion, collector authentication/origin/method/payload limits, private RPC and failure handling.');

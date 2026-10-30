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
const expectedPublishableKey="sb_publishable_JCGVXsls6k47XTmum8tgig_OiE7HhQb";
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

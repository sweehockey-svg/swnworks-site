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

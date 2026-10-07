// Public logo mirrors make PNG/SVG export independent of third-party CORS.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('./',import.meta.url);
const config=await readFile(new URL('../broadcast-studio/broadcast-config.js',root),'utf8');
const url=config.match(/supabaseUrl:\s*"([^"]+)"/)[1];
const key=config.match(/supabasePublishableKey:\s*"([^"]+)"/)[1];
const app=await readFile(new URL('app.js',root),'utf8');
const urls=new Set([...app.matchAll(/logo:"(https:[^"]+)"/g)].map(m=>m[1]));
const response=await fetch(url+'/rest/v1/v_broadcast_teams_public?select=team_logo_in_league&sports_gamer_league_id=in.(520,523,524,525,526,527,529)',{headers:{apikey:key}});
if(!response.ok)throw Error('Logo inventory HTTP '+response.status);
for(const team of await response.json())if(team.team_logo_in_league)urls.add(team.team_logo_in_league);
await mkdir(new URL('logo-assets/',root),{recursive:true});
const manifest={};
for(const source of urls){
  try{
    const r=await fetch(source,{signal:AbortSignal.timeout(20000)});
    if(!r.ok)throw Error('HTTP '+r.status);
    const type=(r.headers.get('content-type')||'').split(';')[0];
    const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/svg+xml':'svg','image/gif':'gif'}[type];
    if(!ext)throw Error('Unsupported image type '+type);
    const file=createHash('sha256').update(source).digest('hex').slice(0,20)+'.'+ext;
    await writeFile(new URL('logo-assets/'+file,root),Buffer.from(await r.arrayBuffer()));
    manifest[source]='logo-assets/'+file;
  }catch(error){console.warn('Logo mirror failed:',source,error.message);}
}
await writeFile(new URL('logo-assets.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log('Mirrored '+Object.keys(manifest).length+' of '+urls.size+' public logos');

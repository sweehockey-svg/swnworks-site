const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/broadcast-studio.js','utf8');
const match=source.match(/hls\.on\(Hls\.Events\.MANIFEST_PARSED,\(\)=>\{([\s\S]*?)\n     \}\);/);
assert(match,'HLS manifest callback exists');
const onManifest=new Function('hls','RAW_FEED','setStatus','tx','tryDirectPlay',match[1]);
const renditions=[
  {height:360,width:640,bitrate:700000},
  {height:720,width:1280,bitrate:3000000},
  {height:1080,width:1920,bitrate:6000000},
  {height:1440,width:2560,bitrate:9000000}
];
function check(levels,raw,index,height){
  const hls={levels};
  let status,played=false;
  onManifest(hls,raw,s=>{status=s;},x=>x,()=>{played=true;});
  assert.equal(hls.startLevel,index);
  assert.equal(hls.nextAutoLevel,index);
  assert.equal(hls.autoLevelCapping,index);
  assert(!('currentLevel' in hls)&&!('nextLevel' in hls),'No manual level lock');
  assert.match(status,new RegExp(height+'p$'));
  assert(played);
}
check(renditions,false,2,1080);
check(renditions.slice(0,2),false,1,720);
check(renditions,true,0,360);
console.log('PASS: 1080p program feed, 720p source fallback, low-bandwidth preview, automatic HLS mode.');

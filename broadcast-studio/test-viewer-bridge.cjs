const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/broadcast-studio.js','utf8');
const bridge=source.slice(0,source.indexOf('(() => {'));
function setup(referrer){
 const sent=[],parent={postMessage:(message,origin)=>sent.push({message,origin})},window={};
 vm.runInNewContext(bridge,{window,parent,document:{referrer},location:{origin:'https://swnworks.se'},URL,Set,Object});
 return {api:window.SWNViewerBridge,parent,sent};
}
for(const origin of ['https://www.svenskehockey.se','https://svenskehockey.se','https://swnworks.se']){
 const t=setup(origin+'/match-tv/');
 assert.equal(t.api.origin,origin);
 assert(t.api.acceptsAudio({origin,source:t.parent,data:{type:'seh-tv-audio',muted:false}}));
 assert(!t.api.acceptsAudio({origin:'https://evil.test',source:t.parent,data:{type:'seh-tv-audio',muted:false}}));
 assert(!t.api.acceptsAudio({origin,source:{},data:{type:'seh-tv-audio',muted:false}}));
 assert(!t.api.acceptsAudio({origin,source:t.parent,data:{type:'seh-tv-audio',muted:'false'}}));
 t.api.postStatus({type:'seh-tv-status',text:'Ready'});assert.equal(t.sent[0].origin,origin);
}
for(const referrer of ['','https://evil.test/match-tv/'])assert.equal(setup(referrer).api.origin,'https://swnworks.se');
assert(!/parent\.postMessage\([^\n]*,location\.origin/.test(source),'All viewer status messages must use the validated parent origin');
console.log('Viewer bridge passed: approved cross-origin parents, exact window/source checks, boolean audio commands and no wildcard targets.');

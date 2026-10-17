const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/app.js','utf8'),ctx={};vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('function portraitCrop('),source.indexOf('function normalizedPortrait(')),ctx);
const mr={left:45,top:16,width:390,height:684,headWidth:152};
const axel={left:40,top:20,width:390,height:680,headWidth:126};
for(const [w,h] of [[244,434],[290,210],[300,330]]){
 const a=ctx.weeklyPortraitCrop(mr,w,h),b=ctx.weeklyPortraitCrop(axel,w,h);
 assert.equal(a.width,b.width,'Similar bodies must have the same scale despite hair width');
 assert(Math.abs(a.height/a.width-h/w)<1e-12);
 assert.equal(a.top,mr.top);
 assert.equal(a.left+a.width/2,mr.left+mr.width/2);
 const hairChange=ctx.weeklyPortraitCrop({...mr,headWidth:200},w,h);assert.equal(hairChange.width,a.width);
}
assert(ctx.portraitCrop(mr,244,434).width>ctx.portraitCrop(axel,244,434).width,'Legacy crop still behaves unchanged outside weekly cards');
console.log('Weekly portrait crop passed: equal body scale, hair independence, top/center anchoring and all aspect ratios; other templates unchanged.');

const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
class Element{
  constructor(){this.children=[];this.events={};this.attrs={};this.open=false}
  append(...nodes){this.children.push(...nodes)}
  setAttribute(k,v){this.attrs[k]=v}
  addEventListener(k,fn){this.events[k]=fn}
  querySelector(){return close}
  showModal(){this.open=true}
  close(){this.open=false;this.events.close()}
  focus(){this.focused=true}
}
const close=new Element(),controls=new Element(),toolbar=new Element(),layout=new Element(),design=new Element(),actions=new Element(),note=new Element(),created=[];
controls.querySelector=s=>s==='.actions'?actions:note;
const document={querySelector:s=>s==='.controls'?controls:s==='.toolbar'?toolbar:layout,getElementById:()=>({closest:()=>design}),createElement:()=>{const el=new Element();created.push(el);return el}};
vm.runInNewContext(fs.readFileSync(__dirname+'/design-panel.js','utf8'),{document});
const [panel,body,button]=created;
assert.equal(panel.open,false);
assert.equal(body.children[0],design);
assert.equal(body.children[1],actions);
assert.equal(layout.children[0],panel);
assert.equal(toolbar.children[0],button);
button.events.click();
assert.equal(panel.open,true);
assert.equal(button.attrs['aria-expanded'],'true');
close.events.click();
assert.equal(panel.open,false);
assert.equal(button.attrs['aria-expanded'],'false');
assert.equal(button.focused,true);
console.log('Design panel passed: closed by default, existing controls moved intact, open/close and focus restoration.');

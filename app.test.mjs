import test from 'node:test';
import assert from 'node:assert/strict';
test('UI handlers complete the demo, persist edits, escape names, and suspend invalid travel',async()=>{
 const elements=new Map(), storage=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',hidden:true,checked:false,handlers:{},attributes:{},addEventListener(event,fn){this.handlers[event]=fn;},setAttribute(key,value){this.attributes[key]=value;}});return elements.get(id);};
 globalThis.document={getElementById:element,querySelector:()=>element('local-tag')};
 globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 globalThis.confirm=()=>true;
 await import('./app.mjs');
 assert.equal((element('rounds').innerHTML.match(/class="match /g)||[]).length,15);
 element('demo').handlers.click();assert.match(element('rounds').innerHTML,/Atlas United/);
 element('demo-next').handlers.click();assert.match(element('status').textContent,/1 conflicting match/);
 element('demo-next').handlers.click();assert.match(element('rounds').innerHTML,/Makeup 1/);assert.match(element('status').textContent,/0 unresolved conflicts/);
 element('demo-next').handlers.click();assert.match(element('optimize').textContent,/optimized/);assert.equal(JSON.parse(storage.get('roundhouse-v1')).optimized,true);
 element('teams').handlers.change({target:{dataset:{name:'0'},value:'<script>bad</script>'}});assert.ok(!element('rounds').innerHTML.includes('<script>bad'));assert.match(element('rounds').innerHTML,/&lt;script&gt;/);
 element('teams').handlers.change({target:{dataset:{coordinate:'0',field:'lat'},value:'91',setAttribute(){}}});assert.equal(element('optimize').disabled,true);assert.match(element('travel').innerHTML,/Enter valid coordinates/);
 element('reset').handlers.click();assert.equal(JSON.parse(storage.get('roundhouse-v1')).teams[0].name,'Atlas');assert.ok(element('demo-panel').hidden);
});

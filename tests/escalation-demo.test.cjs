const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function run(seen=false,blocked=false){
 const elements={};let writes=0;
 const get=id=>elements[id]??={textContent:'',listeners:{},addEventListener(k,f){this.listeners[k]=f},setAttribute(){},showModal(){this.open=true},close(){this.open=false},focus(){this.focused=true}};
 const sample={weak:{score:20},strong:{score:95}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../escalation-demo.js'),'utf8'),{document:{getElementById:get},localStorage:{getItem(){if(blocked)throw Error();return seen?'seen':null},setItem(){if(blocked)throw Error();writes++}},samples:sample,evaluate:s=>({score:s.score,ready_to_escalate:s.score>=75})});
 return {get,writes:()=>writes,click:id=>get(id).listeners.click()};
}
test('first visit opens demo; navigation reaches live scores and completion persists dismissal',()=>{
 const h=run();assert.equal(h.get('featureDemo').open,true);assert.equal(h.get('demoBack').disabled,true);
 for(let i=0;i<4;i++)h.click('demoNext');
 assert.match(h.get('demoExample').textContent,/95\/100/);h.click('demoNext');h.click('demoNext');
 assert.equal(h.get('featureDemo').open,false);assert.equal(h.writes(),1);assert.equal(h.get('showDemo').focused,true);
});
test('return visit stays closed, replay works, and skip or Escape dismisses',()=>{
 const h=run(true);assert.ok(!h.get('featureDemo').open);h.click('showDemo');assert.equal(h.get('featureDemo').open,true);
 h.click('skipDemo');assert.equal(h.get('featureDemo').open,false);h.click('showDemo');
 h.get('featureDemo').listeners.cancel({preventDefault(){}});assert.equal(h.get('featureDemo').open,false);
});
test('unavailable storage does not block skipping the demo',()=>{
 const h=run(false,true);h.click('skipDemo');assert.equal(h.get('featureDemo').open,false);
});

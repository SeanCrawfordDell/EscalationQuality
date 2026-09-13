const test=require('node:test'),assert=require('node:assert/strict'),core=require('../log-helper-core.js');
test('all supported solutions and symptoms produce explained, linked collection plans',()=>{
 for(const os of Object.keys(core.guides))for(const symptom of Object.keys(core.symptoms)){
  const plan=core.plan({os,symptom});assert.ok(plan.items.length>=3);assert.ok(plan.items.some(item=>item.url.startsWith('https://')));assert.ok(plan.items.every(item=>item.title&&item.how&&item.why));assert.match(core.text(plan),/not yet collected/);
 }
});
test('PowerEdge hardware collection is conditional and Windows scenarios choose targeted evidence',()=>{
 assert.ok(core.plan({platform:'PowerEdge R750'}).items.some(i=>i.title.includes('TSR')));
 assert.ok(!core.plan({platform:'Other virtual machine'}).items.some(i=>i.title.includes('TSR')));
 assert.ok(core.plan({os:'Windows Server',symptom:'network'}).items.some(i=>i.title.includes('Packet Monitor')));
 assert.ok(!core.plan({os:'Redhat',symptom:'network'}).items.some(i=>i.title.includes('Packet Monitor')));
});
test('unavailable hosts defer host collection; unknown solutions use a safe fallback',()=>{
 const offline=core.plan({os:'Windows Server',symptom:'performance',reachable:false});assert.match(offline.items[1].how,/after access is restored/);assert.ok(!offline.items.some(i=>i.title==='Performance Monitor capture'));
 const unknown=core.plan({os:'Custom OS',symptom:'unsupported'});assert.equal(unknown.symptom,'general');assert.ok(unknown.items.some(i=>i.title==='Identify the affected product'));
});
const vm=require('node:vm'),fs=require('node:fs');
function ui({canAdd=true,failCopy=false,saveResult=true}={}) {
 const elements={}, node=()=>({value:'',textContent:'',children:[],listeners:{},options:[],append(...items){this.children.push(...items)},replaceChildren(...items){this.children=items},addEventListener(k,f){this.listeners[k]=f},showModal(){this.open=true},close(){this.open=false;this.listeners.close?.()},focus(){},select(){}}),get=id=>elements[id]??=node();
 get('os').options=[{value:'Windows Server',textContent:'Windows Server'}];
 let id='one',adds=0,copied='';const window={};
 vm.runInNewContext(fs.readFileSync(require.resolve('../log-helper.js'),'utf8'),{window,document:{getElementById:get,createElement:node},LogHelperCore:core,navigator:{clipboard:{async writeText(text){if(failCopy)throw Error();copied=text}}}});
 window.LogHelper.init({context:()=>({id,os:'Windows Server',platform:'PowerEdge R750',symptom:'network'}),canAdd:()=>canAdd,addLabel:'Add plan',add(){adds++;return saveResult}});
 return {get,click:id=>get(id).listeners.click(),adds:()=>adds,copied:()=>copied,setId:value=>id=value};
}
test('helper prefills context, appends once, and blocks mutation if the selected case changes',()=>{
 const h=ui();h.click('openLogHelper');assert.equal(h.get('helperOS').value,'Windows Server');assert.equal(h.get('helperSymptom').value,'network');h.click('helperAdd');h.click('helperAdd');assert.equal(h.adds(),1);
 h.click('openLogHelper');h.setId('two');h.click('helperAdd');assert.equal(h.adds(),1);assert.match(h.get('helperStatus').textContent,/case changed/);
 const ro=ui({canAdd:false});ro.click('openLogHelper');assert.equal(ro.get('helperAdd').disabled,true);ro.click('helperAdd');assert.equal(ro.adds(),0);
});
test('helper copy failure exposes a manual fallback; failed saves never claim success',async()=>{
 const h=ui({failCopy:true,saveResult:false});h.click('openLogHelper');await h.click('helperCopy');assert.equal(h.get('helperPlain').open,true);assert.match(h.get('helperStatus').textContent,/Copy failed/);h.click('helperAdd');assert.match(h.get('helperStatus').textContent,/saving failed/);
 const ok=ui();ok.click('openLogHelper');await ok.click('helperCopy');assert.match(ok.copied(),/LOG COLLECTION PLAN/);
});

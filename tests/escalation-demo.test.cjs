const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function harness(){
 const nodes={},docEvents={},windowEvents={};
 class Element {
  constructor(){this.hidden=false;this.open=false;this.disabled=false;this.style={};this.attributes={};this.handlers={};this.dataset={};this.classes=new Set();this.classList={add:k=>this.classes.add(k),remove:k=>this.classes.delete(k),contains:k=>this.classes.has(k)};}
  addEventListener(k,f){this.handlers[k]=f;}setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k]??null;}removeAttribute(k){delete this.attributes[k];}
  append(){}querySelector(){return null;}closest(){return this;}show(){this.open=true;}close(){this.open=false;}focus(){document.activeElement=this;}
  scrollIntoView(){this.scrolled=true;}getBoundingClientRect(){return this===get('featureDemo')?{top:600,bottom:880,left:800,right:1240}:{top:30,bottom:400,left:20,right:750};}
 }
 const get=id=>nodes[id]??=new Element(),body=new Element();
 const document={body,activeElement:null,getElementById:get,createElement:()=>new Element(),querySelector:selector=>get(selector),querySelectorAll:()=>[],addEventListener:(k,f)=>docEvents[k]=f};
 const window={innerWidth:1280,innerHeight:900,scrollY:120,scrollTo:options=>window.restoredScroll=options.top,addEventListener:(k,f)=>windowEvents[k]=f};
 const target=get('#target');target.parentElement=body;target.hidden=true;target.tagName='DETAILS';target.classList.add('collapsed');
 vm.runInNewContext(fs.readFileSync(require.resolve('../guided-tour.js'),'utf8'),{window,document,requestAnimationFrame:fn=>fn()});
 const tour=window.GuidedTour.create({triggerId:'showDemo',steps:[{target:'#target',title:'First section',what:'What it is',why:'Why to use it'},{target:'#second',title:'Second section',what:'Next section',why:'Next reason'}]});
 return {get,tour,target,body,window,docEvents,click:id=>get(id).handlers.click()};
}
test('tour is user initiated and reveals the real target with what and why',()=>{
 const h=harness();assert.equal(h.get('featureDemo').open,false);h.click('showDemo');
 assert.equal(h.get('featureDemo').open,true);assert.equal(h.target.hidden,false);assert.equal(h.target.open,true);assert.equal(h.target.scrolled,true);
 assert.equal(h.get('demoTitle').textContent,'First section');assert.equal(h.get('demoExample').textContent,'Why to use it');assert.equal(h.get('demoBack').disabled,true);
});
test('Back and Next restore temporary section state and completion returns to the page',()=>{
 const h=harness();h.tour.open();h.click('demoNext');assert.equal(h.target.hidden,true);assert.equal(h.target.open,false);assert.equal(h.target.classList.contains('collapsed'),true);
 h.click('demoBack');assert.equal(h.target.hidden,false);h.click('demoNext');h.click('demoNext');
 assert.equal(h.get('featureDemo').open,false);assert.equal(h.body.classList.contains('tour-running'),false);assert.equal(h.window.restoredScroll,120);
});
test('Skip and Escape clean up highlighted and expanded state',()=>{
 const h=harness();h.tour.open();h.click('skipDemo');assert.equal(h.target.hidden,true);assert.equal(h.get('featureDemo').open,false);
 h.tour.open();let prevented=false;h.docEvents.keydown({key:'Escape',preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(h.target.hidden,true);assert.equal(h.get('featureDemo').open,false);
});
test('tour configurations cover the current evidence workflow and generated DE title',()=>{
 function config(file){let captured;vm.runInNewContext(fs.readFileSync(require.resolve(file),'utf8'),{GuidedTour:{create:options=>captured=options}});return captured;}
 const notes=config('../case-notes-demo.js'),de=config('../escalation-demo.js');
 assert.ok(notes.steps.some(s=>s.stage==='evidence'));assert.ok(notes.steps.some(s=>s.stage==='resolve'));assert.equal(de.steps[0].target,'#caseTitle');
 for(const tour of [notes,de])for(const step of tour.steps){assert.ok(step.target);assert.ok(step.what);assert.ok(step.why);}
});

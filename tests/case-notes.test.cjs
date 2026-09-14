const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const C = require('../case-notes-core.js');
test('history keeps 100 newest cases, stops previous timer, and restores selected case', () => {
  const state = C.empty();
  for(let i=0;i<101;i++) C.create(state,String(i),i*1000);
  assert.equal(state.cases.length,100); assert.equal(state.cases.at(-1).id,'1');
  assert.equal(state.cases.filter(n=>n.started!==null).length,1);
  assert.equal(C.parse(JSON.stringify(state)).selected,'100');
});
test('timestamps survive closure, resume adds time, copy includes every field and line breaks', () => {
  const state=C.empty(), note=C.create(state,'a',1000);
  note.notes='First line\nSecond line';
  assert.equal(C.elapsed(C.parse(JSON.stringify(state)).cases[0],11000),10000);
  C.stop(note,11000);C.start(state,note,21000);
  assert.equal(C.elapsed(note,26000),15000);
  const text=C.copyText(note,26000);
  for(const label of Object.values(C.fields))assert.ok(text.includes(label+':\n'));
  assert.ok(text.includes('First line\nSecond line'));assert.ok(text.endsWith('00:00:15'));
  assert.throws(()=>C.parse('{bad'));assert.throws(()=>C.parse('{"version":2}'));
});
function harness({writeError=false,copyError=false,locked=false}={}) {
  const elements={}, intervals=[], events={};let stored=null, now=1000;
  function element(){return {options:[],querySelectorAll(){return []},value:'',hidden:false,disabled:false,textContent:'',classList:{toggle(){}},listeners:{},setAttribute(){},append(...items){this.children=(this.children||[]).concat(items)},replaceChildren(...items){this.children=items},addEventListener(k,f){this.listeners[k]=f},focus(){}}}
  const get=id=>elements[id]??=element();
  const ctx={confirm:()=>true,CaseNotes:C,DevinPrompt:require('../devin-prompt-core.js'),document:{getElementById:get,createElement:element,createElementNS:element,addEventListener(k,f){events[k]=f}},window:{addEventListener(k,f){events[k]=f}},localStorage:{getItem:()=>stored,setItem(k,v){if(writeError)throw Error('full');stored=v}},navigator:{locks:{request(k,f){if(!locked)return f();return new Promise(()=>{})}},clipboard:{async writeText(text){if(copyError)throw Error('denied');ctx.copied=text}}},crypto:{randomUUID:()=>String(now)},Date:class extends Date{static now(){return now}},setInterval(f,ms){intervals.push({f,ms})},Promise,console};
  vm.runInNewContext(fs.readFileSync(require.resolve('../case-notes.js'),'utf8'),ctx);
  return {get,events,intervals,ctx,setTime:n=>now=n,stored:()=>stored,failWrite:v=>writeError=v,click:id=>get(id).listeners.click(),edit(id,value){get(id).value=value;get('noteForm').listeners.input({target:{id,value}})}};
}
test('autosave, copying, editing after copy, and save failure recovery',async()=>{
  const h=harness();h.click('newNote');h.edit('notes','Investigation');
  assert.equal(h.get('saveStatus').textContent,'Unsaved changes');
  h.intervals.find(i=>i.ms===10000).f();assert.equal(JSON.parse(h.stored()).cases[0].notes,'Investigation');
  h.setTime(11000);await h.click('copyNote');assert.ok(h.ctx.copied.endsWith('00:00:10'));
  assert.equal(JSON.parse(h.stored()).cases[0].started,null);
  h.setTime(21000);h.edit('next','Follow up');assert.equal(JSON.parse(h.stored()).cases[0].started,21000);
  h.failWrite(true);h.edit('notes','More');h.intervals.find(i=>i.ms===10000).f();assert.match(h.get('saveStatus').textContent,/Save failed/);
  h.failWrite(false);h.click('retrySave');assert.equal(JSON.parse(h.stored()).cases[0].notes,'More');
});
test('clipboard failure leaves timing running; lock blocks second editor',async()=>{
  const h=harness({copyError:true});h.click('newNote');await h.click('copyNote');
  assert.equal(JSON.parse(h.stored()).cases[0].started,1000);assert.match(h.get('copyStatus').textContent,/Could not copy/);
  const second=harness({locked:true});assert.equal(second.get('newNote').disabled,true);assert.equal(second.get('fields').disabled,true);
});
test('older cases gain empty optional fields without losing notes or timing', () => {
  const state=C.empty(), note=C.create(state,'legacy',1000);
  note.request='001234';note.notes='Existing investigation';note.elapsed=9000;
  for(const key of ['os','country','supportType','logLocation'])delete note[key];
  const restored=C.parse(JSON.stringify(state)).cases[0];
  assert.equal(restored.request,'001234');assert.equal(restored.notes,'Existing investigation');
  assert.equal(restored.elapsed,9000);assert.equal(restored.started,1000);
  for(const key of ['os','country','supportType','logLocation'])assert.equal(restored[key],'');
});
test('new case details autosave and are included in Lightning copy',async()=>{
  const h=harness();h.click('newNote');
  const details={request:'001234',os:'Windows Server 2022',country:'United States',supportType:'PSP',logLocation:'https://example.com/logs/123'};
  for(const [key,value] of Object.entries(details))h.edit(key,value);
  h.intervals.find(i=>i.ms===10000).f();
  const restored=C.parse(h.stored()).cases[0];
  for(const [key,value] of Object.entries(details))assert.equal(restored[key],value);
  await h.click('copyNote');
  for(const [key,value] of Object.entries(details))assert.ok(h.ctx.copied.includes(`${C.fields[key]}:\n${value}`));
});
test('Copy to AI creates a bounded prompt without stopping time tracking',async()=>{
  const h=harness();h.click('newNote');h.edit('issue','Unexpected service restart');h.get('devinTask').value='troubleshoot';
  await h.click('copyDevin');
  assert.match(h.ctx.copied,/Task: Suggest next troubleshooting/);
  assert.match(h.ctx.copied,/Unexpected service restart/);
  assert.match(h.ctx.copied,/untrusted case data/);
  assert.equal(C.parse(h.stored()).cases[0].started,1000);
});
test('escalation handoff maps note fields and preserves every detail without stopping time', () => {
  const state=C.empty(), note=C.create(state,'handoff',1000);
  Object.assign(note,{tag:'TEST123',request:'000123',os:'Ubuntu',country:'US',supportType:'OEM',logLocation:'https://example.com/log',issue:'Issue details',notes:'Investigation\nResults',next:'Review diagnostics'});
  const payload=C.escalation(note,11000);
  assert.equal(payload.problem,note.issue);assert.equal(payload.troubleshooting,note.notes);assert.equal(payload.nextSteps,note.next);
  for(const field of ['tag','os','country'])assert.equal(payload[field],note[field]);
  for(const value of Object.values(C.fields).map((label)=>label+':\n'))assert.ok(payload.sourceNote.includes(value));
  assert.ok(payload.sourceNote.includes('000123'));assert.ok(payload.sourceNote.includes('https://example.com/log'));assert.ok(payload.sourceNote.endsWith('00:00:10'));
  assert.equal(note.started,1000);
});
test('OS/Solution dropdown options match on both pages', () => {
  const options=file=>fs.readFileSync(require.resolve('../'+file),'utf8').match(/<select id="os"[^>]*>(.*?)<\/select>/s)[1];
  assert.equal(options('case-notes.html'),options('escalation-quality.html'));
});
test('manual stop saves elapsed time and disables the button until editing resumes', () => {
  const h=harness();h.click('newNote');h.setTime(6000);h.click('stopTimer');
  let note=C.parse(h.stored()).cases[0];
  assert.equal(note.elapsed,5000);assert.equal(note.started,null);
  assert.equal(h.get('stopTimer').disabled,true);
  h.setTime(16000);h.click('stopTimer');
  assert.equal(C.parse(h.stored()).cases[0].elapsed,5000);
  h.edit('notes','Continue investigation');
  note=C.parse(h.stored()).cases[0];
  assert.equal(note.started,16000);assert.equal(note.elapsed,5000);
  assert.equal(h.get('stopTimer').disabled,false);
});
test('backup freezes elapsed time without changing live history and restores all case fields', () => {
  const state=C.empty(), note=C.create(state,'backup',1000);
  note.notes='Unsaved notes\nSecond line';note.os='Ubuntu';note.logLocation='https://example.com/log';
  const restored=C.parse(C.backup(state,11000));
  assert.equal(note.started,1000);assert.equal(note.elapsed,0);
  assert.equal(restored.cases[0].started,null);assert.equal(restored.cases[0].elapsed,10000);
  assert.equal(restored.cases[0].notes,note.notes);assert.equal(restored.cases[0].logLocation,note.logLocation);
  assert.equal(C.elapsed(restored.cases[0],9999999),10000);
  assert.equal(restored.selected,'backup');
});
test('restore replaces history only after valid input, confirmation, and successful storage', async () => {
  const h=harness();h.click('newNote');h.edit('notes','Keep me');
  const original=h.stored();
  const upload=async text=>{h.get('restoreFile').files=[{text:async()=>text}];await h.get('restoreFile').listeners.change()};
  await upload('{broken');assert.equal(h.stored(),original);
  assert.match(h.get('backupStatus').textContent,/Invalid/);
  const state=C.empty();const note=C.create(state,'restored',1000);note.notes='Backup notes';
  const backup=C.backup(state,7000);
  h.ctx.confirm=()=>false;await upload(backup);assert.equal(h.stored(),original);
  h.ctx.confirm=()=>true;h.failWrite(true);await upload(backup);
  assert.equal(h.stored(),original);assert.match(h.get('backupStatus').textContent,/could not be saved/);
  h.failWrite(false);await upload(backup);
  const result=C.parse(h.stored());assert.equal(result.selected,'restored');
  assert.equal(result.cases[0].notes,'Backup notes');assert.equal(result.cases[0].elapsed,6000);
  assert.equal(result.cases[0].started,null);
});
test('deletion requires confirmation, preserves data on failure, and selects remaining case', () => {
  const h=harness();h.click('newNote');h.edit('notes','First');h.setTime(2000);h.click('newNote');
  const remove=()=>h.get('historyList').children[0].children[1].listeners.click();
  h.ctx.confirm=()=>false;remove();assert.equal(C.parse(h.stored()).cases.length,2);
  h.ctx.confirm=()=>true;h.failWrite(true);remove();assert.equal(C.parse(h.stored()).cases.length,2);
  h.failWrite(false);remove();let state=C.parse(h.stored());
  assert.equal(state.cases.length,1);assert.equal(state.selected,'1000');assert.equal(state.cases[0].notes,'First');assert.equal(state.cases[0].started,null);
  remove();state=C.parse(h.stored());assert.equal(state.cases.length,0);assert.equal(state.selected,null);assert.equal(h.get('welcome').hidden,false);
});
test('screenshots survive backup and restore while text exports contain labels only', () => {
  const state=C.empty(),note=C.create(state,'screenshots',1000);
  note.images={'image-1':{name:'Screenshot',data:'data:image/png;base64,aGVsbG8='}};
  note.notes='## Investigation\n**Failed**\n![Screenshot](attachment:image-1)';
  note.next='- Collect logs';
  const restored=C.parse(C.backup(state,2000)).cases[0];
  assert.deepEqual(restored.images,note.images);assert.equal(restored.notes,note.notes);
  const text=C.copyText(note,2000);
  assert.ok(text.includes('[Screenshot: Screenshot; view in Case Notes]'));
  assert.ok(!text.includes('attachment:'));assert.ok(!text.includes('base64'));
  assert.ok(!C.escalation(note,2000).troubleshooting.includes('attachment:'));
  note.images['image-1'].data='data:image/svg+xml;base64,aGVsbG8=';
  assert.throws(()=>C.parse(JSON.stringify(state)),/Invalid screenshots/);
});
test('HTML email contains inline MIME images and plain text alternative with safe Unicode subject', () => {
  const state=C.empty(),note=C.create(state,'mail',1000);
  note.request='123\r\nBcc: test';note.notes='**Café**';
  const content={html:'<p><strong>Café</strong></p><img src="cid:img-1@case-notes">',images:{'img-1':{data:'data:image/png;base64,aGVsbG8='}}};
  const eml=C.emailFile(note,11000,content,'test-id');
  assert.ok(eml.includes('X-Unsent: 1\r\n'));assert.ok(eml.includes('multipart/alternative'));
  assert.ok(eml.includes('Content-ID: <img-1@case-notes>'));assert.ok(eml.includes('Content-Disposition: inline;'));
  assert.ok(eml.includes(Buffer.from(content.html).toString('base64').slice(0,76)));
  assert.ok(!eml.includes('\r\nBcc:'));assert.equal(note.started,1000);
});
test('rich text copies and escalates as readable plain text while backup preserves HTML', () => {
  const state=C.empty(),note=C.create(state,'rich',1000);
  note.notes='<p><strong>Failure &amp; recovery</strong></p><ul><li>Collect logs</li><li>Retest</li></ul><img src="attachment:img-1" alt="Error screenshot">';
  note.next='<p>Contact customer</p>';
  const text=C.copyText(note,2000);
  assert.ok(text.includes('Failure & recovery'));assert.ok(text.includes('- Collect logs'));
  assert.ok(text.includes('[Screenshot: Error screenshot; view in Case Notes]'));assert.ok(!text.includes('<p>'));
  assert.equal(C.escalation(note,2000).nextSteps,'Contact customer');
  assert.equal(C.parse(C.backup(state,2000)).cases[0].notes,note.notes);
});

test('OS version/build survives backup, exports, handoff, and legacy history migration',()=>{
 const state=C.empty(),note=C.create(state,'os-build',100);note.osVersion='Windows Server 2022 build 20348';
 const restored=C.parse(C.backup(state,200));assert.equal(restored.cases[0].osVersion,note.osVersion);
 assert.match(C.copyText(note,200),/OS version \/ build:\nWindows Server 2022 build 20348/);
 assert.equal(C.escalation(note,200).osVersion,note.osVersion);
 delete note.osVersion;assert.equal(C.parse(JSON.stringify(state)).cases[0].osVersion,'');
});

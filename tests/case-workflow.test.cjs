const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../case-notes-core.js'),W=require('../case-workflow-core.js');
test('legacy cases load without workflow and new workflow survives backup and versions',()=>{
 const state=C.empty(),note=C.create(state,'workflow',1000),before=structuredClone(state);
 assert.equal(C.parse(JSON.stringify(state)).cases[0].toolkit.workflow,undefined);
 Object.assign(W.ensure(note),{fix:'Changed VLAN',verification:'Customer workload passed',prevention:'Monitor for 24 hours',confirmed:true,knowledge:'Reviewed draft'});
 note.toolkit.workflow.results.events='No recurrence in System log';
 C.checkpoint(state,before,2000);
 const restored=C.parse(C.backup(state,3000));
 assert.deepEqual(restored.cases[0].toolkit.workflow,note.toolkit.workflow);
 assert.equal(restored.revisions.workflow[0].note.toolkit.workflow,undefined);
 assert.ok(C.copyText(note,3000).includes('Customer workload passed'));
 assert.ok(C.escalation(note,3000).sourceNote.includes('No recurrence in System log'));
});
test('malformed workflow imports are rejected',()=>{
 for(const change of [w=>w.confirmed='yes',w=>w.results=[],w=>w.results.constructor='bad',w=>w.fix=null]){
  const s=C.empty(),n=C.create(s,'bad',1000);change(W.ensure(n));assert.throws(()=>C.parse(JSON.stringify(s)),/workflow/);
 }
});
test('routing respects platform and does not recommend Windows diagnostics for Linux',()=>{
 const n=C.create(C.empty(),'route',1000);n.os='Redhat';n.issue='Slow virtual machines';n.toolkit.issueType='performance';assert.deepEqual(W.recommendations(n),[]);
 n.os='Windows Server';n.issue='Hyper-V virtual machines slow';assert.equal(W.recommendations(n)[0].id,'perf');
 n.os='Azure Local';n.issue='Registration endpoint blocked';n.toolkit.issueType='network';assert.equal(W.recommendations(n)[0].id,'urls');assert.equal(W.recommendations(n).length,3);
});
test('verification requires recorded results and customer confirmation',()=>{
 const n=C.create(C.empty(),'close',1000),w=W.ensure(n);assert.equal(W.gaps(n).length,4);
 Object.assign(w,{fix:' ',verification:'Pass',confirmed:true,prevention:'Monitor'});assert.deepEqual(W.gaps(n),['Resolution / workaround']);
 w.fix='Reconfigured';assert.deepEqual(W.gaps(n),[]);
});
test('prevention separates explicit repeats from configuration similarity',()=>{
 const s=C.empty(),a=C.create(s,'a',1000),b=C.create(s,'b',2000);
 for(const n of [a,b]){n.platform='PowerEdge R750';n.os='Windows Server';n.osVersion='2022';}
 W.ensure(b).repeatOf='SR-previous';a.toolkit.status='Completed';
 const result=W.prevention(s.cases);assert.equal(result.repeats.length,1);assert.equal(result.unverified.length,1);assert.equal(result.groups.length,1);
 b.osVersion='2019';assert.equal(W.prevention(s.cases).groups.length,0);
});
test('knowledge candidate uses recorded facts and makes missing validation explicit',()=>{
 const n=C.create(C.empty(),'draft',1000);n.notes='<p>Observed timeout</p>';
 const draft=W.knowledge(n,C.plainText);assert.ok(draft.includes('Observed timeout'));assert.ok(draft.includes('[Add test and result]'));assert.ok(draft.includes('Customer confirmed: Not yet'));
});

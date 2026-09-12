"use strict";
window.CaseToolkit = (() => {
  const core=CaseToolkitCore, $=id=>document.getElementById(id);
  let api;
  const notify=text=>$("toolkitStatus").textContent=text;
  const bindings={caseIssueType:"issueType",followupOwner:"owner",followupStatus:"status",caseImpact:"impact",caseQuestions:"questions",customerDraft:"customerDraft",summaryDraft:"summaryDraft"};
  function localDate(iso) {
    if(!iso)return "";
    const date=new Date(iso), pad=n=>String(n).padStart(2,"0");
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function refreshChecklist() {
    const note=api?.current();if(!note)return;
    const data=core.ensure(note);
    $("templatePreview").textContent=core.templates[data.issueType].prompts.join(" · ");
    $("logChecklistIntro").textContent=note.os ? `Suggested evidence for ${note.os} · ${core.templates[data.issueType].name}.` : "Select OS/Solution above for product-specific collection guidance.";
    $("logChecklist").replaceChildren(...core.checklist(note).map(item=>{
      const row=document.createElement("div");row.className="checklist-item";
      const label=document.createElement("label"),check=document.createElement("input");check.type="checkbox";check.checked=!!data.checks[item.id];check.disabled=!api.canEdit();
      check.addEventListener("change",()=>api.mutate(current=>{core.ensure(current).checks[item.id]=check.checked;}));
      label.append(check,document.createTextNode(item.text));row.append(label);
      if(item.url){const link=document.createElement("a");link.href=item.url;link.textContent=item.label+" ↗";link.target="_blank";link.rel="noopener noreferrer";row.append(link);}
      return row;
    }));
  }
  function refresh() {
    const note=api?.current();if(!note)return;
    const data=core.ensure(note);
    for(const [id,key] of Object.entries(bindings))$(id).value=data[key];
    $("followupDue").value=localDate(data.due);
    notify("");refreshChecklist();
  }
  async function copyDraft(key) {
    const note=api.current();if(!note || !api.canEdit())return;
    const draft=core.ensure(note)[key];
    if(!draft.trim()){notify("Generate or enter a draft first.");return;}
    try{await navigator.clipboard.writeText(draft);notify("Draft copied as plain text. Review it before sharing. Time tracking is unchanged.");}
    catch{notify("Could not copy. Select the draft text and copy it manually.");}
  }
  function init(options) {
    api=options;
    const dialog=$("toolkitDialog");
    document.querySelectorAll("[data-toolkit]").forEach(button=>{
      button.addEventListener("click",()=>{
        if(!api.current())return;
        refresh();
        document.querySelectorAll("#toolkitFields > section").forEach(panel=>{
          panel.hidden=panel.id!==`toolkit-${button.dataset.toolkit}`;
          if(!panel.hidden)$("toolkitTitle").textContent=panel.dataset.title;
        });
        dialog.showModal();
      });
    });
    $("closeToolkit").addEventListener("click",()=>dialog.close());
    dialog.addEventListener("close",()=>api.save());
    Object.entries(bindings).forEach(([id,key])=>{
      $(id).addEventListener("input",()=>{
        if(!api.canEdit())return;
        api.mutate(note=>{core.ensure(note)[key]=$(id).value;},false);
        if(key==="issueType")refreshChecklist();
      });
    });
    $("followupDue").addEventListener("change",()=>{
      if(!api.canEdit())return;
      const value=$("followupDue").value;
      if(value && !Number.isFinite(new Date(value).getTime())){notify("Enter a valid follow-up date and time.");return;}
      api.mutate(note=>{core.ensure(note).due=value ? new Date(value).toISOString() : "";});
    });
    $("applyTemplate").addEventListener("click",()=>{
      if(!api.current() || !api.canEdit())return;
      api.mutate(note=>{
        const data=core.ensure(note);
        // Markdown parses legacy notes; rich HTML remains intact and is sanitized by the editor.
        note.notes=marked.parse(note.notes,{gfm:true,breaks:true})+core.templateHtml(data.issueType);
        note.next=marked.parse(note.next,{gfm:true,breaks:true})+'<h3>Next steps</h3><p><strong>Action:</strong> [Add next action]</p><p><strong>Owner:</strong> [Assign owner]</p><p><strong>Follow-up:</strong> [Agree date and time]</p>';
      });
      api.refreshEditors();notify("Template appended. Replace the bracketed prompts with case details.");
    });
    for(const [id,key,build] of [["generateCustomer","customerDraft",note=>core.customerUpdate(note,CaseNotes.plainText)],["generateSummary","summaryDraft",note=>core.summary(note,CaseNotes.plainText,CaseNotes.duration(CaseNotes.elapsed(note,Date.now())))]] ) {
      $(id).addEventListener("click",()=>{
        const note=api.current();if(!note || !api.canEdit())return;
        if(core.ensure(note)[key] && !confirm("Replace the existing draft with an updated draft from this case?"))return;
        api.mutate(current=>{core.ensure(current)[key]=build(current);});
        $(key).value=core.ensure(note)[key];notify("Draft generated from the current case. Review and edit before sharing; nothing has been sent.");
      });
    }
    $("copyCustomer").addEventListener("click",()=>copyDraft("customerDraft"));
    $("copySummary").addEventListener("click",()=>copyDraft("summaryDraft"));
  }
  return {init,refresh,refreshChecklist,setEditable(value){$("toolkitFields").disabled=!value;
    document.querySelectorAll("[data-toolkit]").forEach(button=>{button.disabled=!api?.current();});}};
})();

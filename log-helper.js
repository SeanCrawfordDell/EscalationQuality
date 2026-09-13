"use strict";
window.LogHelper = (() => {
  function init(api) {
    const $=id=>document.getElementById(id), dialog=$("logHelperDialog");
    let activePlan, sourceId, platform="", added=false;
    function render() {
      activePlan=LogHelperCore.plan({os:$("helperOS").value,platform,symptom:$("helperSymptom").value,reachable:null});
      $("helperResults").replaceChildren(...activePlan.items.map(item=>{
        const section=document.createElement("section"),heading=document.createElement("h3"),how=document.createElement("p"),why=document.createElement("p");
        heading.textContent=item.title;how.textContent=item.how;why.textContent="Why: "+item.why;section.append(heading,how,why);
        if(item.url){const link=document.createElement("a");link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Collection guide ↗";section.append(link);}
        return section;
      }));
      $("helperPlanText").value=LogHelperCore.text(activePlan);
      added=false;$("helperStatus").textContent="";$("helperAdd").disabled=!api.canAdd();
    }
    $("openLogHelper").addEventListener("click",()=>{
      const context=api.context();sourceId=context.id;
      $("helperOS").replaceChildren(...[...$("os").options].map(item=>{const option=document.createElement("option");option.value=item.value;option.textContent=item.textContent;return option;}));
      $("helperOS").value=context.os || "";platform=context.platform || "";
      $("helperSymptom").value=Object.hasOwn(LogHelperCore.symptoms,context.symptom)?context.symptom:"general";
      $("helperAdd").textContent=api.addLabel;
      render();dialog.showModal();
    });
    for(const id of ["helperOS","helperSymptom"]) $(id).addEventListener("change",render);
    $("closeLogHelper").addEventListener("click",()=>dialog.close());
    dialog.addEventListener("close",()=>$("openLogHelper").focus());
    $("helperCopy").addEventListener("click",async()=>{
      try{await navigator.clipboard.writeText($("helperPlanText").value);$("helperStatus").textContent="Collection plan copied.";}
      catch{$("helperStatus").textContent="Copy failed. Expand Plain text plan to select and copy it manually.";$("helperPlain").open=true;$("helperPlanText").focus();$("helperPlanText").select();}
    });
    $("helperAdd").addEventListener("click",()=>{
      if(added)return;
      if(!api.canAdd() || api.context().id!==sourceId){$("helperStatus").textContent="The case changed or is read-only. Reopen the helper for the current case.";return;}
      const saved=api.add($("helperPlanText").value);
      added=true;$("helperAdd").disabled=true;
      $("helperStatus").textContent=saved===false?"Plan added, but saving failed. Keep the page open and check the save status.":"Collection plan added. Collection status has not changed.";
    });
  }
  return {init};
})();

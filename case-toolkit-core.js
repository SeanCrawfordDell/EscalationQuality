"use strict";
const CaseToolkitCore = (() => {
  const templates = {
    general: { name:"General investigation", prompts:["Observed behavior", "Business impact and affected users", "Expected behavior", "First occurrence and frequency", "Recent changes", "Troubleshooting actions and results", "Evidence collected"] },
    boot: { name:"Boot failure", prompts:["Last successful boot", "Failure stage and exact on-screen message", "Recent firmware, OS, or hardware changes", "Boot device and storage visibility", "Recovery actions attempted and results", "Available console screenshots and logs"] },
    crash: { name:"Crash / unexpected restart", prompts:["Crash time and time zone", "Stop code, panic, or error text", "Workload active at failure", "Frequency and affected systems", "Recent changes", "Crash dump and event log location", "Actions attempted and results"] },
    network: { name:"Network connectivity", prompts:["Source and destination", "Affected interface, VLAN, and route", "Scope: one host or multiple systems", "Expected versus observed connectivity", "DNS and name resolution observations", "Recent network changes", "Tests performed and results"] },
    performance: { name:"Performance degradation", prompts:["Affected workload and business impact", "Normal baseline versus current behavior", "Start time and duration", "CPU, memory, storage, and network observations", "Recent changes", "Measurements and comparison results"] }
  };
  const statuses = ["Open", "In progress", "Waiting on customer", "Completed"];
  function defaults() { return { issueType:"general", impact:"", questions:"", owner:"", due:"", status:"Open", checks:{}, timeline:[], timelineAction:"", timelineResult:"", customerDraft:"", summaryDraft:"" }; }
  function ensure(note) {
    if (!note.toolkit) note.toolkit = defaults();
    return note.toolkit;
  }
  function validate(note) {
    const data = ensure(note);
    if (!data || typeof data !== "object" || !Object.hasOwn(templates,data.issueType) || !statuses.includes(data.status) || !["impact","questions","owner","due","customerDraft","summaryDraft","timelineAction","timelineResult"].every(k=>typeof data[k]==="string") || (data.due && !Number.isFinite(Date.parse(data.due))) || !data.checks || typeof data.checks!=="object" || Array.isArray(data.checks) || !Object.values(data.checks).every(v=>typeof v==="boolean") || !Array.isArray(data.timeline) || !data.timeline.every(e=>e && typeof e.id==="string" && Number.isFinite(e.at) && e.at>=0 && typeof e.action==="string" && typeof e.result==="string")) throw Error("Invalid case toolkit data");
    return data;
  }
  const overdue = (note, now) => !!note.toolkit?.due && note.toolkit.status !== "Completed" && Date.parse(note.toolkit.due) < now;
  const escape = text => text.replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function templateHtml(key) {
    const preset=templates[key];
    return `<h3>${escape(preset.name)}</h3>`+preset.prompts.map(prompt=>`<p><strong>${escape(prompt)}:</strong> [Add details]</p>`).join("");
  }
  const guides = {
    "Windows Server": ["windows", "Export System, Application, and relevant role event logs for the incident window", "Microsoft support tools", "https://github.com/DellProSupportGse/Tools"],
    "Redhat": ["rhel", "Collect an sos report using the Red Hat procedure", "Red Hat sos report guide", "https://access.redhat.com/solutions/3592"],
    "Ubuntu": ["ubuntu", "Collect an sos report using the Ubuntu procedure", "Ubuntu sos report reference", "https://manpages.ubuntu.com/manpages/focal/man1/sosreport.1.html"],
    "Debian": ["debian", "Export relevant journal and service logs around the incident", "Debian troubleshooting guide", "https://wiki.debian.org/TroubleShooting"],
    "Nutanix": ["nutanix", "Collect Prism log bundles and relevant cluster health results", "Nutanix Prism log collection", "https://next.nutanix.com/how-it-works-22/running-nutanix-cluster-check-log-collector-using-prism-web-console-37399"],
    "ESX": ["esx", "Collect the affected ESXi host support bundle and vCenter bundle if relevant", "Broadcom diagnostic collection", "https://knowledge.broadcom.com/external/article/326299"],
    "VCF": ["vcf", "Identify the affected VCF component; collect ESXi/vCenter bundles when those components are involved", "Broadcom ESXi / vCenter collection", "https://knowledge.broadcom.com/external/article/326299"],
    "Azure Stack Hub": ["ash", "Collect the requested Azure Stack Hub diagnostic logs with support guidance", "Microsoft Azure Stack Hub collection", "https://learn.microsoft.com/en-us/azure-stack/operator/azure-stack-get-azurestacklog"],
    "Azure Local": ["azlocal", "Collect Azure Local diagnostic logs for the affected nodes and incident window", "Microsoft Azure Local collection", "https://learn.microsoft.com/en-us/azure/azure-local/manage/collect-logs"]
  };
  function checklist(note) {
    const data=ensure(note);
    const list=[{id:"incident",text:"Record the incident timestamp, time zone, affected systems, and exact errors"},{id:"versions",text:"Record OS/build, firmware, and relevant component versions"}];
    const guide=guides[note.os];
    if(guide) list.push({id:guide[0],text:guide[1],label:guide[2],url:guide[3]});
    const specifics={boot:"Capture the boot console or failure screen and boot-device observations",crash:"Locate the crash dump / panic record and logs preceding the restart",network:"Record source/destination, interface configuration, and connectivity test results",performance:"Capture time-aligned resource metrics and a normal-performance comparison",general:"Capture reproduction steps and observed results"};
    list.push({id:"issue-"+data.issueType,text:specifics[data.issueType]},{id:"location",text:"Attach collected evidence to the case and record its Log Location"});
    return list;
  }
  function extraText(note) {
    const data=ensure(note), sections=[];
    if(data.impact)sections.push("Business impact:\n"+data.impact);
    if(data.questions)sections.push("Remaining questions:\n"+data.questions);
    if(data.owner || data.due || data.status!=="Open")sections.push(`Follow-up:\nStatus: ${data.status}\nOwner: ${data.owner || "Not assigned"}\nDue: ${data.due || "Not scheduled"}`);
    const checked=checklist(note).filter(item=>data.checks[item.id]);
    if(checked.length)sections.push("Evidence checklist completed:\n"+checked.map(item=>"- "+item.text).join("\n"));
    return sections.join("\n\n");
  }
  function customerUpdate(note, plain) {
    const data=ensure(note);
    const customerText = value => plain(value).replace(/\[Screenshot:[^\]]*\]/g, "").trim();
    const actions=customerText(note.notes) || "[Add a customer-facing description of the work completed]";
    return `Hello,\n\nHere is an update on Service Request ${note.request || "[number]"}.\n\nIssue we are investigating:\n${note.issue || "[Describe the issue]"}\n\nProgress so far:\n${actions}\n\nNext steps:\n${customerText(note.next) || "[Add the next action]"}\n\n${data.due ? "Next follow-up: "+new Date(data.due).toLocaleString() : "Next follow-up: [Confirm date and time]"}\n\nPlease let us know if the symptoms or business impact change.\n\nThank you.`;
  }
  function concise(text, limit = 900) {
    const lines=text.split("\n").filter(line=>line.trim());
    const compact=lines.slice(0,6).join("\n");
    return compact.length>limit || lines.length>6 ? compact.slice(0,limit)+"\n[See full case notes for remaining details]" : compact;
  }
  function summary(note, plain, elapsed) {
    const data=ensure(note);
    return `HANDOFF SUMMARY\nService Request: ${note.request || "Not provided"}\nService Tag: ${note.tag || "Not provided"}\nSystem/Platform: ${note.platform || "Not provided"}\nOS/Solution: ${note.os || "Not provided"}\n\nIssue:\n${note.issue || "Not recorded"}\n\nBusiness impact:\n${data.impact || "Not recorded"}\n\nInvestigation:\n${concise(plain(note.notes)) || "Not recorded"}\n\nNext steps:\n${plain(note.next) || "Not recorded"}\n\nRemaining questions:\n${data.questions || "Not recorded"}\n\nEvidence location: ${note.logLocation || "Not recorded"}\nOwner: ${data.owner || "Not assigned"}\nStatus: ${data.status}\nFollow-up due: ${data.due ? new Date(data.due).toLocaleString() : "Not scheduled"}\nTime spent: ${elapsed}`;
  }
  return {templates,statuses,defaults,ensure,validate,overdue,templateHtml,checklist,extraText,customerUpdate,summary};
})();
if(typeof module!=="undefined")module.exports=CaseToolkitCore;

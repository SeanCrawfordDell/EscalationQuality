"use strict";
// Curated guidance checked against the linked vendor documentation on 2026-09-13.
const LogHelperCore = (() => {
  const symptoms = {general:"Other / general issue",boot:"Boot failure",crash:"Crash / unexpected restart",performance:"Performance / slow response",network:"Network connectivity",storage:"Storage / disk errors"};
  const guides = {
    "Windows Server":["Windows event logs","Export System, Application, and affected-role event logs covering the incident window. The Dell LogCollector documentation provides collection options.","Shows service failures and system events around the incident.","https://github.com/DellProSupportGse/Tools#-logcollector"],
    "Redhat":["sos report","Collect an sos report from each affected host using the procedure for its RHEL version.","Captures system configuration and diagnostic logs for comparison.","https://access.redhat.com/solutions/3592"],
    "Ubuntu":["sos report","Use the installed sos version's report procedure to package diagnostic data from the affected host.","Packages configuration and logs needed for system troubleshooting.","https://manpages.ubuntu.com/manpages/focal/man1/sos.1.html"],
    "Debian":["System and service journal","Export the journal for the affected boot and incident time range; include the affected service's entries.","Correlates kernel and service failures with the reported time.","https://manpages.debian.org/trixie/systemd/journalctl.1.en.html"],
    "ESX":["ESXi support bundle","Collect the affected host's diagnostic bundle through vSphere Client; include vCenter diagnostics if the failure involves management operations.","Provides host configuration and logs for hypervisor investigation.","https://knowledge.broadcom.com/external/article/326299"],
    "VCF":["Affected VCF component diagnostics","Identify the affected component first. For ESXi or vCenter failures collect their diagnostic bundles; for other components use that component's support collection procedure.","Avoids treating an ESXi bundle as complete evidence for every VCF component.","https://knowledge.broadcom.com/external/article/326299"],
    "Nutanix":["Prism log bundle","Use Prism Log Collector for the affected cluster/nodes and incident time window. Include existing relevant health-check results.","Correlates cluster services and node events.","https://next.nutanix.com/how-it-works-22/running-nutanix-cluster-check-log-collector-using-prism-web-console-37399"],
    "Azure Local":["Azure Local diagnostic collection","Follow Microsoft's collection workflow for the affected nodes and incident window. Choose collection/upload options appropriate to the support case.","Provides cluster diagnostic context across the affected nodes.","https://learn.microsoft.com/en-us/azure/azure-local/manage/collect-logs"],
    "Azure Stack Hub":["Azure Stack Hub diagnostic logs","Have the authorized operator collect diagnostics for the affected role, nodes, and incident window using the documented privileged-endpoint workflow.","Targets infrastructure-role failures rather than unrelated guest logs.","https://learn.microsoft.com/en-us/azure-stack/operator/azure-stack-get-azurestacklog?view=azs-2601"]
  };
  const specific = {
    general:["Exact error and affected-component logs","Capture the exact error, affected component/version, and available application or service logs around the occurrence.","Gives the investigator a concrete starting point."],
    boot:["Boot console and last successful boot","Capture the console failure screen, failed boot stage, last successful boot time, and recent changes. Preserve existing boot logs if accessible.","Helps distinguish firmware, boot-device, and OS startup failures."],
    crash:["Crash evidence","Preserve the existing crash dump or panic/diagnostic-screen evidence, exact crash time, and preceding system events. Do not trigger a new crash just to collect evidence.","Identifies the failure signature and events preceding the restart."],
    performance:["Time-aligned performance evidence","Record the affected workload, normal baseline, and CPU, memory, disk-latency, and network metrics during the slowdown.","Shows which resource changed at the same time as the symptom."],
    network:["Connection details and interface evidence","Record source, destination, port, time, and affected interface/VLAN. Preserve interface errors and relevant service/network logs; use a scoped packet capture if needed.","Distinguishes name resolution, routing, transport, and application symptoms."],
    storage:["Storage-path and controller evidence","Record affected disks/volumes/datastores and paths. Preserve controller/storage events, I/O errors, and latency observations around the incident.","Correlates device, path, and workload-level failures."]
  };
  function plan({os="",platform="",symptom="general",reachable=true}={}) {
    if (!Object.hasOwn(symptoms,symptom)) symptom="general";
    const items=[],add=(title,how,why,url="")=>items.push({title,how,why,url});
    add("Incident context","Record occurrence time and time zone, affected systems, exact errors, and recent changes.","Lets support correlate evidence from different sources.");
    if (/poweredge|idrac|^r\d{3}\b|^t\d{3}\b/i.test(platform)) add("PowerEdge SupportAssist / TSR collection","From a reachable iDRAC, export a SupportAssist collection with relevant hardware and Lifecycle Controller data. OS data depends on available integration.","Adds hardware inventory and controller events even when the host OS is unavailable.","https://www.dell.com/support/kbdoc/en-us/000126308/export-a-supportassist-collection-via-idrac9");
    const guide=Object.hasOwn(guides,os)?guides[os]:null;
    if (guide) add(guide[0],reachable!==false?guide[1]+(reachable===null?" If the system is unavailable, preserve existing logs and defer host collection until access is restored.":""):"If the host is unavailable, preserve any existing bundle and collect accessible management-plane logs. Complete this collection after access is restored. "+guide[1],guide[2],guide[3]);
    else add("Identify the affected product","Confirm OS/Solution and version before choosing a product collector. Preserve existing component logs in the meantime.","Avoids recommending an incompatible collection tool.");
    add(...specific[symptom]);
    if(os==="Windows Server" && symptom==="performance" && reachable!==false) add("Performance Monitor capture","Use the Microsoft scenario guide to capture counters during the slowdown and retain the resulting performance log.","Provides measurable resource usage over time.","https://learn.microsoft.com/en-us/troubleshoot/windows-server/performance/troubleshoot-performance-problems-in-windows");
    if(os==="Windows Server" && symptom==="network" && reachable!==false) add("Scoped Packet Monitor capture","Follow the Pktmon guide to filter the affected traffic, capture the reproduction window, and stop the capture afterwards.","Helps locate packet drops in the Windows networking stack.","https://learn.microsoft.com/en-us/windows-server/networking/technologies/pktmon/pktmon");
    if(os==="Windows Server" && symptom==="crash") add("Existing Windows memory dump","Preserve the available memory dump from the affected system along with the stop code and incident timestamp.","Enables analysis of the Windows crash signature.","https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/stop-code-error-troubleshooting");
    return {os,platform,symptom,reachable,items};
  }
  function text(plan) {
    return `LOG COLLECTION PLAN — not yet collected\nOS/Solution: ${plan.os || "Not selected"}\nSystem/Platform: ${plan.platform || "Not provided"}\nScenario: ${symptoms[plan.symptom]}\nSystem accessible: ${plan.reachable===null?"Not specified":plan.reachable?"Yes":"No"}\n\n`+plan.items.map((item,i)=>`${i+1}. ${item.title}\n${item.how}\nWhy: ${item.why}${item.url?"\nGuide: "+item.url:""}`).join("\n\n")+"\n\nAfter collection: attach the evidence to the case and record its Log Location.";
  }
  return {symptoms,guides,plan,text};
})();
if(typeof module!=="undefined")module.exports=LogHelperCore;

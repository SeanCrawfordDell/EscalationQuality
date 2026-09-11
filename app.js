/*
Secure code generated utilizing Code Guardian.
Applicable rules used: CG-INPUT-001.2, CG-INPUT-001.1, CG-INPUT-001.3, CG-INPUT-001.4, CG-INPUT-001.5, CG-INPUT-001.6, CG-INPUT-001.7, CG-INPUT-001.8
*/
"use strict";

const fieldIds = ["problem", "impact", "timeline", "expected", "country", "tag", "os", "errors", "reproduction", "troubleshooting", "results", "evidence", "changes", "workaround", "request"];
const required = ["problem", "impact", "timeline", "expected", "country", "tag", "os", "reproduction", "troubleshooting", "results", "evidence", "request"];
const labels = {
  problem: "problem statement", impact: "business impact", timeline: "timeline and frequency", expected: "expected behavior", country: "customer country", tag: "system type / service tag", os: "operating system & version", errors: "exact errors and timestamps", reproduction: "reproduction steps", troubleshooting: "troubleshooting performed", results: "results and observations", evidence: "are there logs uploaded to the case", changes: "recent changes", workaround: "current workaround", request: "requested senior assistance"
};
const weakPhrases = /^(n\/a|na|none|unknown|not working|broken|issue|problem|see above|same)$/i;
const specificityTerms = /\b(error|code|version|build|firmware|user|device|host|server|client|minute|hour|percent|failed|timeout|intermittent|always|every|since|affected|blocked)\b/i;
const evidenceTerms = /\b(log|trace|screenshot|diagnostic|timestamp|event|dump|bundle|capture|report|case|attachment|error code)\b/i;
const resultTerms = /\b(result|observed|confirmed|remained|changed|passed|failed|resolved|returned|showed|revealed|reproduced|did not|no change)\b/i;

const samples = {
  weak: { problem:"System not working", impact:"Users affected", timeline:"Started recently", expected:"It should work", country:"US", tag:"Server", os:"Windows", errors:"Unknown", reproduction:"Try to use it", troubleshooting:"Restarted and checked things", results:"No change", evidence:"No", changes:"Unknown", workaround:"None", request:"Please help" },
  strong: { problem:"PowerEdge R750 iDRAC web interface returns HTTP 503 after login while Redfish API remains available. The issue affects only the management UI on one host.", impact:"The infrastructure team cannot use the UI to complete a scheduled firmware compliance review for host DC2-HV-047. One of 24 hosts is affected; production workloads continue running, but the maintenance window closes at 22:00 UTC.", timeline:"First observed 2026-09-10 at 14:18 UTC after the monthly credential rotation. Reproduces on every login attempt. Last confirmed at 16:42 UTC.", expected:"After authentication, the iDRAC dashboard should load and display system health and firmware inventory.", country:"US", tag:"PowerEdge R750, service tag ABC1234, asset DC2-HV-047", os:"Windows Server 2022 Standard Edition", errors:"Browser network trace: GET /restgui/start.html returned 503 at 2026-09-10 16:42:11 UTC. Lifecycle log event: RAC0182 at 16:41:58 UTC. No TLS or DNS errors observed.", reproduction:"1. Browse to the management address from VLAN 120.\n2. Authenticate with an authorized local test account.\n3. Wait for the dashboard to load.\n4. Observe HTTP 503 after approximately 30 seconds.\n5. Call /redfish/v1/Systems with the same account and observe HTTP 200.", troubleshooting:"1. Tested Chrome and Edge to exclude browser cache.\n2. Tested from a second workstation on VLAN 120.\n3. Restarted only the iDRAC management controller.\n4. Exported the Lifecycle Controller log and browser network trace.\n5. Compared settings with healthy host DC2-HV-046.", results:"1. Both browsers returned the same 503.\n2. The second workstation reproduced the failure.\n3. Controller restart restored the UI for 12 minutes, then the 503 returned.\n4. RAC0182 appears immediately before each failure.\n5. Proxy and session-timeout settings match the healthy host; firmware differs (7.10.30.00 versus 7.10.20.00).", evidence:"Yes", changes:"iDRAC firmware updated from 7.10.20.00 to 7.10.30.00 on 2026-09-09 at 23:20 UTC. Credentials rotated at 13:50 UTC today. No network configuration changes are known.", workaround:"Redfish API remains available for inventory. There is no workaround for UI-only tasks; maintenance can be deferred for 24 hours.", request:"Please determine whether RAC0182 and the recurring UI service failure are a known issue in iDRAC9 7.10.30.00 and advise whether rollback to 7.10.20.00 is supported before the maintenance window closes." } errors:"Browser network trace: GET /restgui/start.html returned 503 at 2026-09-10 16:42:11 UTC. Lifecycle log event: RAC0182 at 16:41:58 UTC. No TLS or DNS errors observed.", reproduction:"1. Browse to the management address from VLAN 120.\n2. Authenticate with an authorized local test account.\n3. Wait for the dashboard to load.\n4. Observe HTTP 503 after approximately 30 seconds.\n5. Call /redfish/v1/Systems with the same account and observe HTTP 200.", troubleshooting:"1. Tested Chrome and Edge to exclude browser cache.\n2. Tested from a second workstation on VLAN 120.\n3. Restarted only the iDRAC management controller.\n4. Exported the Lifecycle Controller log and browser network trace.\n5. Compared settings with healthy host DC2-HV-046.", results:"1. Both browsers returned the same 503.\n2. The second workstation reproduced the failure.\n3. Controller restart restored the UI for 12 minutes, then the 503 returned.\n4. RAC0182 appears immediately before each failure.\n5. Proxy and session-timeout settings match the healthy host; firmware differs (7.10.30.00 versus 7.10.20.00).", evidence:"Attached: DC2-HV-047_LC-log_20260910.zip and browser-trace-1642.har. Relevant timestamps are 16:41–16:43 UTC. Internal incident INC-10482.", changes:"iDRAC firmware updated from 7.10.20.00 to 7.10.30.00 on 2026-09-09 at 23:20 UTC. Credentials rotated at 13:50 UTC today. No network configuration changes are known.", workaround:"Redfish API remains available for inventory. There is no workaround for UI-only tasks; maintenance can be deferred for 24 hours.", request:"Please determine whether RAC0182 and the recurring UI service failure are a known issue in iDRAC9 7.10.30.00 and advise whether rollback to 7.10.20.00 is supported before the maintenance window closes."
  }
};

function value(id) { return document.getElementById(id).value.trim(); }
function addFinding(target, field, reason, kind) { target.push({ field, reason, kind }); }
function hasDetail(text, minimum) { return text.length >= minimum && !weakPhrases.test(text); }
function numberedSteps(text) { return (text.match(/(?:^|\n)\s*(?:\d+[.)]|[-•])/g) || []).length; }
function data() { return Object.fromEntries(fieldIds.map(id => [id, value(id)])); }

function evaluate(form) {
  const blockers = [], warnings = [], strengths = [];
  required.forEach(id => {
    if (!form[id]) addFinding(blockers, id, "Required information is missing.", "blocker");
    else if (weakPhrases.test(form[id])) addFinding(blockers, id, "The response is too vague to support an escalation.", "blocker");
  });

  if (form.problem && !hasDetail(form.problem, 45)) addFinding(warnings, "problem", "Name the affected component, failure, and scope in concrete terms.", "warning");
  if (form.impact && (!hasDetail(form.impact, 45) || !/\b(\d+|one|two|three|all|single|multiple|production|customer|user|team|blocked|degraded)\b/i.test(form.impact))) addFinding(warnings, "impact", "Quantify who or what is affected and explain the operational consequence.", "warning");
  if (form.timeline && !/\b(\d{1,2}[:/]\d{1,2}|\d{4}-\d{2}-\d{2}|utc|am|pm|daily|hourly|every|constant|intermittent|first|last|since)\b/i.test(form.timeline)) addFinding(warnings, "timeline", "Add when the issue began, its frequency, and the latest occurrence.", "warning");

  if (form.reproduction && numberedSteps(form.reproduction) < 2) addFinding(warnings, "reproduction", "Use at least two ordered steps so another technician can reproduce the issue.", "warning");
  if (form.troubleshooting && numberedSteps(form.troubleshooting) < 2) addFinding(warnings, "troubleshooting", "Separate the troubleshooting actions into distinct steps.", "warning");
  if (form.results && (!hasDetail(form.results, 55) || !resultTerms.test(form.results))) addFinding(warnings, "results", "Record the observed outcome of each troubleshooting action.", "warning");
  if (!form.errors) addFinding(warnings, "errors", "Provide exact errors and timestamps, or explicitly state that no error is displayed.", "warning");
  if (!form.evidence) addFinding(warnings, "evidence", "Please indicate whether logs have been uploaded to the case.", "warning");
  if (!form.changes) addFinding(warnings, "changes", "Document recent changes or explicitly state that none are known.", "warning");
  if (!form.workaround) addFinding(warnings, "workaround", "Describe the current workaround and limitations, or state that none exists.", "warning");
  if (form.request && (!hasDetail(form.request, 35) || /^(help|please help|investigate|advise)$/i.test(form.request))) addFinding(warnings, "request", "State the specific decision, diagnosis, or action needed from the senior technician.", "warning");

  const completedRequired = required.filter(id => hasDetail(form[id], id === "tag" || id === "country" || id === "os" ? 2 : 15)).length;
  const completeness = Math.round(30 * completedRequired / required.length);
  const coreText = [form.problem, form.impact, form.timeline, form.os].join(" ");
  const specificity = Math.min(20, Math.round((Math.min(coreText.length, 500) / 500 * 12) + (specificityTerms.test(coreText) ? 4 : 0) + (/\d/.test(coreText) ? 4 : 0)));
  const reproduction = Math.min(15, (hasDetail(form.reproduction, 60) ? 6 : form.reproduction ? 2 : 0) + Math.min(numberedSteps(form.reproduction), 5) + (form.expected ? 4 : 0));
  const evidenceText = [form.errors, form.timeline].join(" ");
  const evidence = Math.min(15, (hasDetail(form.errors, 20) ? 5 : form.errors ? 1 : 0) + (form.evidence === "Yes" ? 5 : 0) + (evidenceTerms.test(evidenceText) ? 3 : 0) + (/\d/.test(evidenceText) ? 2 : 0));
  const troubleshooting = Math.min(15, (hasDetail(form.troubleshooting, 60) ? 5 : form.troubleshooting ? 2 : 0) + Math.min(numberedSteps(form.troubleshooting), 4) + (hasDetail(form.results, 60) ? 4 : form.results ? 1 : 0) + (resultTerms.test(form.results) ? 2 : 0));
  const clearRequest = !form.request ? 0 : hasDetail(form.request, 50) ? 5 : 2;
  const categories = { completeness, specificity, reproducibility:reproduction, evidence, troubleshooting, clear_request:clearRequest };
  const score = Object.values(categories).reduce((sum, item) => sum + item, 0);

  if (score >= 80 && blockers.length === 0) strengths.push({ field:"overall", reason:"The escalation provides enough structured context for a senior technician to begin investigation.", kind:"strength" });
  if (numberedSteps(form.reproduction) >= 3) strengths.push({ field:"reproduction", reason:"Reproduction steps are clearly separated and actionable.", kind:"strength" });
  if (numberedSteps(form.troubleshooting) >= 3 && hasDetail(form.results, 80)) strengths.push({ field:"troubleshooting", reason:"Actions and observed results provide a useful investigation trail.", kind:"strength" });
  if (form.evidence === "Yes") strengths.push({ field:"evidence", reason:"Logs have been uploaded to the case for review.", kind:"strength" });
  if (hasDetail(form.request, 55)) strengths.push({ field:"request", reason:"The requested senior-level assistance is explicit.", kind:"strength" });

  const ready = score >= 75 && blockers.length === 0;
  const status = ready ? "ready" : blockers.length ? "blocked" : "needs_improvement";
  return { status, score, ready_to_escalate:ready, categories, blocking_issues:blockers, warnings, strengths };
}

function makeCard(item) {
  const card = document.createElement("div");
  card.className = `feedback-card ${item.kind}`;
  const title = document.createElement("strong");
  title.textContent = labels[item.field] || item.field;
  const reason = document.createElement("p");
  reason.textContent = item.reason;
  card.append(title, reason);
  return card;
}

function renderList(containerId, sectionId, countId, items) {
  const container = document.getElementById(containerId);
  container.replaceChildren(...items.map(makeCard));
  document.getElementById(sectionId).hidden = items.length === 0;
  if (countId) document.getElementById(countId).textContent = String(items.length);
}

function render(result) {
  document.getElementById("emptyState").hidden = true;
  document.getElementById("reviewState").hidden = false;
  document.getElementById("resultsPanel").classList.remove("empty");
  const state = result.status === "ready" ? { css:"ready", pill:"Ready", title:"Ready to escalate", summary:"No blocking information gaps were found." } : result.status === "blocked" ? { css:"blocked", pill:"Not ready", title:"Complete the required details", summary:"Resolve the blocking issues before escalation." } : { css:"review", pill:"Improve", title:"Nearly ready", summary:"There are no missing required fields, but the content needs more detail." };
  const pill = document.getElementById("statusPill");
  pill.className = `status-pill ${state.css}`;
  pill.textContent = state.pill;
  document.getElementById("resultTitle").textContent = state.title;
  document.getElementById("resultSummary").textContent = state.summary;
  document.getElementById("scoreValue").textContent = String(result.score);
  document.getElementById("scoreBar").style.width = `${result.score}%`;
  document.getElementById("scoreRing").style.borderColor = result.status === "ready" ? "#12b76a" : result.status === "blocked" ? "#d92d20" : "#eaaa08";
  const maxima = { completeness:30, specificity:20, reproducibility:15, evidence:15, troubleshooting:15, clear_request:5 };
  const categoryGrid = document.getElementById("categoryGrid");
  categoryGrid.replaceChildren(...Object.entries(result.categories).map(([name, score]) => {
    const item = document.createElement("div");
    item.className = "category";
    const label = document.createElement("span");
    label.textContent = name.replace("_", " ");
    const scoreText = document.createElement("strong");
    scoreText.textContent = `${score} / ${maxima[name]}`;
    item.append(label, scoreText);
    return item;
  }));
  renderList("blockers", "blockersSection", "blockerCount", result.blocking_issues);
  renderList("warnings", "warningsSection", "warningCount", result.warnings);
  renderList("strengths", "strengthsSection", null, result.strengths);
  document.getElementById("jsonOutput").textContent = JSON.stringify(result, null, 2);
  document.getElementById("copySection").hidden = !result.ready_to_escalate;
}

function loadSample(kind) {
  fieldIds.forEach(id => {
    document.getElementById(id).value = samples[kind][id] || "";
    document.getElementById(id).classList.remove("invalid");
  });
  render(evaluate(data()));
}

document.getElementById("escalationForm").addEventListener("submit", event => {
  event.preventDefault();
  const form = data();
  required.forEach(id => document.getElementById(id).classList.toggle("invalid", !form[id]));
  render(evaluate(form));
});
document.getElementById("loadWeak").addEventListener("click", () => loadSample("weak"));
document.getElementById("loadStrong").addEventListener("click", () => loadSample("strong"));
document.getElementById("clearForm").addEventListener("click", () => {
  document.getElementById("escalationForm").reset();
  fieldIds.forEach(id => document.getElementById(id).classList.remove("invalid"));
  document.getElementById("emptyState").hidden = false;
  document.getElementById("reviewState").hidden = true;
  document.getElementById("resultsPanel").classList.add("empty");
});

function copyEscalationData() {
  const form = data();
  const copyText = Object.entries(form).map(([id, value]) => {
    if (!value) return "";
    const label = (labels[id] || id).toUpperCase();
    return `${label}:\n${value}`;
  }).filter(Boolean).join("\n\n");
  
  navigator.clipboard.writeText(copyText).then(() => {
    const button = document.getElementById("copyButton");
    const originalText = button.textContent;
    button.textContent = "Copied!";
    button.style.background = "#12b76a";
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = "";
    }, 2000);
  }).catch(err => {
    console.error("Failed to copy:", err);
    alert("Failed to copy to clipboard. Please select and copy the text manually.");
  });
}

document.getElementById("copyButton").addEventListener("click", copyEscalationData);

function copyEscalationData() {
  const form = data();
  const copyText = Object.entries(form).map(([id, value]) => {
    if (!value) return "";
    const label = (labels[id] || id).toUpperCase();
    return `${label}:\n${value}`;
  }).filter(Boolean).join("\n\n");
  
  navigator.clipboard.writeText(copyText).then(() => {
    const button = document.getElementById("copyButton");
    const originalText = button.textContent;
    button.textContent = "Copied!";
    button.style.background = "#12b76a";
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = "";
    }, 2000);
  }).catch(err => {
    console.error("Failed to copy:", err);
    alert("Failed to copy to clipboard. Please select and copy the text manually.");
  });
}

document.getElementById("copyButton").addEventListener("click", copyEscalationData);
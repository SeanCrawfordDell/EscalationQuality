"use strict";
(() => {
  const key = "dell-support.de-escalation-demo.v1";
  const dialog = document.getElementById("featureDemo");
  const trigger = document.getElementById("showDemo");
  const steps = [
    ["A stronger escalation starts here", "Build a clear handoff for a senior technician. This short demo walks through the details to capture, the readiness review, and the feedback you can act on.", "THE WORKFLOW", "Describe the issue → Add technical context → Document investigation → Plan log collection → Review → Copy the escalation"],
    ["Describe the issue and its impact", "Explain what is failing, who is affected, when it happens, and what you expected. Required labels help you identify the essential details.", "FROM VAGUE TO SPECIFIC", "“System not working” → “The iDRAC web interface returns HTTP 503 after login on one host. Production workloads continue, but the team cannot complete its maintenance review.”"],
    ["Give the next technician a starting point", "Add the system type or service tag, choose OS/Solution and Customer Country, and capture exact errors plus repeatable reproduction steps.", "REPRODUCTION EXAMPLE", "1. Open the management interface.\n2. Sign in with an authorized account.\n3. Wait 30 seconds.\n4. Observe HTTP 503 instead of the dashboard."],
    ["Record the investigation and next steps", "List troubleshooting actions and their observed results, answer Have you Gathered Logs? and record the log location. Choosing No reveals the reason logs cannot be obtained. Pair individual actions with their observed outcomes.", "ACTION + RESULT", "Action: Restarted the management controller.\nResult: The interface recovered for 12 minutes, then failed again."],
    ["Choose the right logs for the issue", "Select Which logs should I collect? beside Have you Gathered Logs? The popup starts with your case’s OS/Solution. Choose What is happening? to see guidance for boot failures, crashes, performance, networking, storage, or a general issue. System/Platform is taken from the case details.", "EXAMPLE: WINDOWS SERVER + NETWORK CONNECTIVITY", "The helper suggests Windows event logs, connection and interface details, and a scoped Packet Monitor capture. Each recommendation explains what to collect, why it helps, and links to collection guidance where available."],
    ["Use the collection plan", "Open the collection guide links for instructions. Copy plan puts the plan on your clipboard. Add to escalation saves it under the collapsed Planned log collection section. In Case Notes, the same helper is beside Log Location and Add to Next Steps appends the plan to your notes.", "PLAN FIRST, THEN COLLECT", "Adding a plan does not collect logs or change Have you Gathered Logs? After gathering the evidence, update that answer and record its Log Location. Changes to the escalation require another review before copying."],
    ["Turn feedback into a ready handoff", "Review escalation checks five categories. A score of at least 75 with no blocking issues is ready. Blocking issues identify missing essentials; recommendations suggest improvements. Click feedback to jump to the field, then review the copy preview. Edits require a fresh review before copying.", "LIVE SAMPLE REVIEW", ""],
    ["Bring your notes, or explore with samples", "Escalate to DE in Case Notes opens a fresh request with matching fields populated and the complete original note attached. Drafts save automatically in this browser. The weak and strong sample buttons ask before replacing current form details. Use Feature demo any time to replay this tour.", "READY FOR YOUR CASE", "Complete the remaining fields, select Review escalation, address the feedback, and copy your ready handoff. Your shared Dark/Light preference also applies here."]
  ];
  let index = 0;
  function render() {
    const [title, description, label, example] = steps[index];
    document.getElementById("demoProgress").textContent = `Step ${index + 1} of ${steps.length}`;
    document.getElementById("demoTitle").textContent = title;
    document.getElementById("demoDescription").textContent = description;
    document.getElementById("demoExampleLabel").textContent = label;
    let content = example;
    if (label === "LIVE SAMPLE REVIEW") {
      const weak = evaluate(samples.weak), strong = evaluate(samples.strong);
      content = `Weak sample: ${weak.score}/100 — ${weak.ready_to_escalate ? "Ready" : "Needs improvement"}\nStrong sample: ${strong.score}/100 — ${strong.ready_to_escalate ? "Ready to escalate" : "Needs improvement"}\n\nThese scores come from the same evaluator used for your case. Recommendations can still appear on a ready escalation.`;
    }
    document.getElementById("demoExample").textContent = content;
    document.getElementById("demoBack").disabled = index === 0;
    document.getElementById("demoNext").textContent = index === steps.length - 1 ? "Start my escalation" : "Next";
    // Announce each step without moving focus away from the navigation buttons.
    document.getElementById("demoProgress").setAttribute("aria-live", "polite");
  }
  function open() { index = 0; render(); dialog.showModal(); }
  function finish() {
    try { localStorage.setItem(key, "seen"); } catch { /* Replay remains available without storage. */ }
    dialog.close(); trigger.focus();
  }
  trigger.addEventListener("click", open);
  document.getElementById("skipDemo").addEventListener("click", finish);
  document.getElementById("demoBack").addEventListener("click", () => { if (index > 0) { index--; render(); } });
  document.getElementById("demoNext").addEventListener("click", () => { if (index === steps.length - 1) finish(); else { index++; render(); } });
  dialog.addEventListener("cancel", event => { event.preventDefault(); finish(); });
  let seen = false;
  try { seen = localStorage.getItem(key) === "seen"; } catch { /* Show the tour if preferences are unavailable. */ }
  if (!seen) open();
})();

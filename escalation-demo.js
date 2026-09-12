"use strict";
(() => {
  const key = "dell-support.de-escalation-demo.v1";
  const dialog = document.getElementById("featureDemo");
  const trigger = document.getElementById("showDemo");
  const steps = [
    ["A stronger escalation starts here", "Build a clear handoff for a senior technician. This short demo walks through the details to capture, the readiness review, and the feedback you can act on.", "THE WORKFLOW", "Describe the issue → Add technical context → Document investigation → Review → Copy the escalation"],
    ["Describe the issue and its impact", "Explain what is failing, who is affected, when it happens, and what you expected. Required labels help you identify the essential details.", "FROM VAGUE TO SPECIFIC", "“System not working” → “The iDRAC web interface returns HTTP 503 after login on one host. Production workloads continue, but the team cannot complete its maintenance review.”"],
    ["Give the next technician a starting point", "Add the system type or service tag, choose OS/Solution and Customer Country, and capture exact errors plus repeatable reproduction steps.", "REPRODUCTION EXAMPLE", "1. Open the management interface.\n2. Sign in with an authorized account.\n3. Wait 30 seconds.\n4. Observe HTTP 503 instead of the dashboard."],
    ["Record the investigation and next steps", "List troubleshooting actions and their observed results, indicate whether logs are uploaded, and state the assistance you need. Windows cases without logs prompt you to collect them or use the available bypass when appropriate.", "ACTION + RESULT + REQUEST", "Action: Restarted the management controller.\nResult: The interface recovered for 12 minutes, then failed again.\nRequest: Review the recurring service failure and advise the next diagnostic step."],
    ["Turn feedback into a ready handoff", "Review escalation checks six categories. A score of at least 75 with no blocking issues is ready. Blocking issues identify missing essentials; recommendations suggest improvements. Once ready, Copy escalation data copies the handoff.", "LIVE SAMPLE REVIEW", ""],
    ["Bring your notes, or explore with samples", "Escalate to DE in Case Notes opens a fresh request with matching fields populated and the complete original note attached. The weak and strong sample buttons let you explore the reviewer, but replace current form details. Use Feature demo any time to replay this tour.", "READY FOR YOUR CASE", "Complete the remaining fields, select Review escalation, address the feedback, and copy your ready handoff. Your shared Dark/Light preference also applies here."]
  ];
  let index = 0;
  function render() {
    const [title, description, label, example] = steps[index];
    document.getElementById("demoProgress").textContent = `Step ${index + 1} of ${steps.length}`;
    document.getElementById("demoTitle").textContent = title;
    document.getElementById("demoDescription").textContent = description;
    document.getElementById("demoExampleLabel").textContent = label;
    let content = example;
    if (index === 4) {
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

"use strict";
(() => {
  const key = "dell-support.case-notes-demo.v1";
  const dialog = document.getElementById("featureDemo");
  const trigger = document.getElementById("tutorialDemo");
  const steps = [
    ["Welcome to Case Notes", "This short tour covers how to capture a case, track your time automatically, get AI help, and hand off a clean escalation. Skip demo any time, or replay it later with the Tutorial Demo button.", "THE WORKFLOW", "New Note → Capture Case Details → Document in Notes/Action Plan → Copy to Lightning, Email, or Escalate to DE"],
    ["Start a case and capture the details", "Select + New Note to begin. Time tracking starts automatically as soon as you start typing. Case Details, Notes, and Action Plan / Next Steps are each their own collapsible section — click the arrow at the top-left of a section to collapse or expand it.", "CASE DETAILS SECTION", "Service Tag, System/Platform, Service Request Number, OS/Solution, OS version, Customer Country, OS Support, Log Location, and Issue Description."],
    ["Not sure where to start? Load an example", "Load Example fills the form with a realistic, well-structured case so you can see what good documentation looks like, then replace it with your own details.", "GOOD CASE NOTES LOOK LIKE", "A clear issue description, numbered troubleshooting steps with outcomes, and a concrete action plan with owners and next steps."],
    ["Document your investigation", "Notes and Action Plan / Next Steps are rich text editors. Use the toolbar for bold, lists, and links, paste screenshots directly with Ctrl+V / ⌘V, and resize any pasted image by dragging its corner.", "TIP", "Screenshots stay attached to the case and are included in Email to Case and backups, but Copy to Lightning keeps plain text only."],
    ["Time tracking, automatically", "Tracking starts the moment you start or resume editing a case. Stop Time Tracking freezes the session; the timer keeps showing that session's duration until you resume. Total time on case adds every session together.", "SESSION VS. TOTAL", "Session: 00:04:12 (this sitting) · Total time on case: 01:12:45 (every session combined)"],
    ["Use the Case Toolkit", "Templates, Follow-ups, Customer Update, and Handoff Summary live in the Case Toolkit above Copy to Lightning. Templates add prompts for common issue types, Follow-ups track owner and due date, and Customer Update / Handoff Summary draft shareable write-ups from your notes.", "BUILT FROM YOUR NOTES", "Customer Update and Handoff Summary reuse your Issue, Notes, and Action Plan text — review and edit the wording before sharing."],
    ["Ask AI to help", "Choose a task from Ask AI to, such as Review the case or Recommend logs to collect, then Copy to AI to copy a ready-to-paste prompt with your case data. Add your Own AI Prompt/skills lets you save custom tasks for your team.", "SAFE BY DESIGN", "The prompt marks your case data as untrusted content and asks the AI to flag anything that should be redacted before sharing further."],
    ["Never lose your notes", "Every case autosaves in this browser as you type. Backup History downloads your last 100 cases as a file, and Restore History brings a backup back — handy when switching machines or clearing browser data.", "GOOD HABIT", "Download a backup before clearing browser data, reinstalling, or handing off a shared workstation."],
    ["Hand off with one click", "Email to Case builds an HTML email with your notes and screenshots inline. Copy to Lightning copies a complete plain-text note and stops the timer. Escalate to DE opens a new escalation request with your case details and full note already attached.", "READY WHEN YOU ARE", "Start a case, capture what you know, and use Tutorial Demo any time from the top of this page to replay this tour."]
  ];
  let index = 0;
  function render() {
    const [title, description, label, example] = steps[index];
    document.getElementById("demoProgress").textContent = `Step ${index + 1} of ${steps.length}`;
    document.getElementById("demoTitle").textContent = title;
    document.getElementById("demoDescription").textContent = description;
    document.getElementById("demoExampleLabel").textContent = label;
    document.getElementById("demoExample").textContent = example;
    document.getElementById("demoBack").disabled = index === 0;
    document.getElementById("demoNext").textContent = index === steps.length - 1 ? "Start my case" : "Next";
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

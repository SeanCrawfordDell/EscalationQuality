"use strict";
(() => {
  const key = "dell-support.case-notes.v1";
  const $ = id => document.getElementById(id);
  let state = CaseNotes.empty(), dirty = false, writable = false, copying = false, release;
  let loadFailed = false;
  const selected = () => state.cases.find(note => note.id === state.selected);
  function status(text, error = false) {
    $("saveStatus").textContent = text;
    $("saveStatus").classList.toggle("error", error);
    $("retrySave").hidden = !error || !writable;
  }
  function save() {
    if (!writable || !dirty) return !dirty;
    try {
      localStorage.setItem(key, JSON.stringify(state));
      dirty = false; status("Saved · " + new Date().toLocaleTimeString()); return true;
    } catch {
      status("Save failed. Changes remain in this tab. Free browser storage and retry before leaving.", true);
      return false;
    }
  }
  function load() {
    try { state = CaseNotes.parse(localStorage.getItem(key)); loadFailed = false; }
    catch {
      loadFailed = true;
      $("lockNotice").hidden = false;
      $("lockNotice").textContent = "Case history could not be read. Editing is disabled to protect stored notes. Check browser storage access and reload.";
    }
  }
  function history() {
    const query = $("search").value.trim().toLowerCase();
    const matches = state.cases.filter(note => [note.tag, note.request, note.issue].some(value => value.toLowerCase().includes(query)));
    $("caseCount").textContent = `${state.cases.length} / 100`;
    $("historyList").replaceChildren(...matches.map(note => {
      const button = document.createElement("button"); button.className = "case-item";
      button.setAttribute("aria-current", String(note.id === state.selected));
      button.disabled = copying;
      const title = document.createElement("strong"); title.textContent = note.tag || note.request || "Untitled case";
      const issue = document.createElement("span"); issue.textContent = note.issue || "No issue description yet";
      const meta = document.createElement("small"); meta.textContent = `${note.request ? note.request + " · " : ""}${new Date(note.created).toLocaleString()}`;
      button.append(title, issue, meta);
      const row = document.createElement("div"); row.className = "case-row";
      const remove = document.createElement("button");
      remove.className = "delete-case"; remove.type = "button";
      const caseName = note.tag || note.request || "Untitled case";
      remove.setAttribute("aria-label", "Delete case " + caseName);
      remove.title = "Delete case";
      remove.disabled = !writable || copying;
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("viewBox", "0 0 24 24"); icon.setAttribute("aria-hidden", "true");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7");
      icon.append(path); remove.append(icon);
      remove.addEventListener("click", () => {
        if (!writable || copying) return;
        if (!confirm(`Delete case ${caseName}? This permanently removes this note from browser history. Download a backup first if you want to keep it.`)) return;
        const updated = { ...state, cases: state.cases.filter(item => item.id !== note.id) };
        if (updated.selected === note.id) updated.selected = updated.cases[0]?.id || null;
        try {
          localStorage.setItem(key, JSON.stringify(updated));
        } catch {
          $("backupStatus").textContent = "Could not delete the case. Check browser storage and try again. Your case has not been removed.";
          return;
        }
        state = updated; dirty = false; status("Saved"); render();
        $("backupStatus").textContent = "Case deleted.";
        $("copyStatus").textContent = "Copy all fields and tracked time as plain text.";
      });
      row.append(button, remove);
      button.addEventListener("click", () => {
        if (copying || (writable && !save())) return;
        state.selected = note.id;
        if (writable) { dirty = true; save(); }
        render();
      }); return row;
    }));
    if (!matches.length) $("historyList").textContent = query ? "No matching cases." : "No cases yet.";
  }
  function controls() {
    $("backupHistory").disabled = loadFailed || copying;
    $("restoreHistory").disabled = !writable || copying;
    $("fields").disabled = !writable || copying;
    $("newNote").disabled = $("startNote").disabled = !writable || copying;
    $("copyNote").disabled = $("escalateNote").disabled = !writable || copying;
    $("stopTimer").disabled = !writable || copying || !selected() || selected().started === null;
  }
  function tick() {
    const note = selected(); if (!note) return;
    $("elapsed").textContent = CaseNotes.duration(CaseNotes.elapsed(note, Date.now()));
    $("timerState").textContent = note.started === null ? "Timer stopped" : "Tracking time";
    $("stopTimer").disabled = !writable || copying || note.started === null;
  }
  function render() {
    const note = selected();
    $("welcome").hidden = !!note; $("noteEditor").hidden = !note;
    if (note) Object.keys(CaseNotes.fields).forEach(field => {
      const input = $(field);
      // Preserve free-text values saved before these dropdowns were introduced.
      if (field === "country" || field === "os") {
        input.querySelectorAll("[data-legacy-option]").forEach(option => option.remove());
        const match = Array.from(input.options).find(option =>
          option.value === note[field] || option.textContent.toLowerCase() === note[field].toLowerCase());
        if (!match && note[field]) {
          const option = document.createElement("option");
          option.value = note[field]; option.textContent = note[field];
          option.setAttribute("data-legacy-option", ""); input.append(option);
        }
        input.value = match ? match.value : note[field];
      } else input.value = note[field];
    });
    controls(); history(); tick();
  }
  function newNote() {
    if (!writable || copying || !save()) return;
    CaseNotes.create(state, crypto.randomUUID(), Date.now()); dirty = true; save(); render();
    $("copyStatus").textContent = "Copy all fields and tracked time as plain text.";
    $("tag").focus();
  }
  $("backupHistory").addEventListener("click", () => {
    if (loadFailed || copying) return;
    try {
      const text = CaseNotes.backup(state, Date.now());
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "case-history-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      $("backupStatus").textContent = `Backup download started: ${state.cases.length} cases, including unsaved edits. Restored timers will be stopped.`;
    } catch {
      $("backupStatus").textContent = "Backup could not be created. Your history has not changed. Please try again.";
    }
  });
  $("restoreHistory").addEventListener("click", () => {
    if (writable && !copying) $("restoreFile").click();
  });
  $("restoreFile").addEventListener("change", async () => {
    const file = $("restoreFile").files[0];
    $("restoreFile").value = "";
    if (!file || !writable || copying) return;
    let restored;
    try {
      const raw = await file.text();
      if (!writable || copying) return;
      if (raw.trim() === "null") throw Error("Not a backup");
      restored = CaseNotes.parse(raw);
      // Backups freeze elapsed time; never count time spent in an archive.
      restored.cases.forEach(note => { note.started = null; });
    } catch {
      $("backupStatus").textContent = "Invalid or unsupported backup. Choose a Case Notes JSON backup with at most 100 cases. Current history was not changed.";
      return;
    }
    if (!confirm(`Restore ${restored.cases.length} cases? This replaces your current ${state.cases.length} cases, including unsaved edits. Download a backup first if you want to keep them. Restored timers will be stopped.`)) return;
    try {
      // Commit to storage before replacing in-memory notes, so failure is non-destructive.
      localStorage.setItem(key, JSON.stringify(restored));
    } catch {
      $("backupStatus").textContent = "Restore could not be saved. Check available browser storage and try again. Current history was not changed.";
      return;
    }
    state = restored; dirty = false;
    $("search").value = "";
    status("Saved"); render();
    $("copyStatus").textContent = "Copy all fields and tracked time as plain text.";
    $("backupStatus").textContent = `Restored ${state.cases.length} cases. Timers are stopped; editing a case resumes tracking.`;
  });
  $("stopTimer").addEventListener("click", () => {
    const note = selected();
    if (!note || !writable || copying || note.started === null) return;
    const now = Date.now();
    CaseNotes.stop(note, now); note.updated = now; dirty = true;
    save(); tick();
  });
  $("newNote").addEventListener("click", newNote);
  $("startNote").addEventListener("click", newNote);
  $("search").addEventListener("input", history);
  $("retrySave").addEventListener("click", save);
  $("noteForm").addEventListener("submit", event => event.preventDefault());
  $("noteForm").addEventListener("input", event => {
    if (!writable || copying || !Object.hasOwn(CaseNotes.fields, event.target.id)) return;
    const note = selected(); if (!note) return;
    const now = Date.now(); const restarting = note.started === null;
    CaseNotes.start(state, note, now);
    note[event.target.id] = event.target.value; note.updated = now; dirty = true;
    status("Unsaved changes");
    $("copyStatus").textContent = "Copy all fields and tracked time as plain text.";
    if (restarting) save();
    tick(); history();
  });
  $("escalateNote").addEventListener("click", () => {
    const note = selected();
    if (!note || !writable || copying || !save()) return;
    try {
      const token = crypto.randomUUID();
      sessionStorage.setItem("dell-support.escalation." + token, JSON.stringify(CaseNotes.escalation(note, Date.now())));
      window.location.assign("escalation-quality.html#import=" + token);
    } catch {
      $("copyStatus").textContent = "Could not open the escalation. Check browser storage access and try again. Your note is still here.";
    }
  });
  $("copyNote").addEventListener("click", async () => {
    const note = selected(); if (!note || !writable || copying) return;
    save(); // Copy remains available even if storage is full.
    const now = Date.now(); const text = CaseNotes.copyText(note, now);
    copying = true; controls(); history();
    try {
      await navigator.clipboard.writeText(text);
      CaseNotes.stop(note, now); note.updated = now; dirty = true;
      const saved = save();
      $("copyStatus").textContent = saved ? "Copied to clipboard. Timer stopped. Ready to paste into Lightning." : "Copied to clipboard. Timer stopped, but saving failed. Keep this tab open and retry saving.";
    } catch {
      $("copyStatus").textContent = "Could not copy. Timer was not stopped. Allow clipboard access and try Copy to Lightning again.";
    } finally { copying = false; controls(); history(); tick(); }
  });
  setInterval(() => { if (dirty) save(); }, 10000);
  setInterval(tick, 1000);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
  window.addEventListener("beforeunload", event => {
    save();
    if (dirty || copying) { event.preventDefault(); event.returnValue = ""; }
  });
  window.addEventListener("pagehide", () => { save(); writable = false; release?.(); release = null; });
  window.addEventListener("storage", event => {
    if (!writable && (event.key === key || event.key === null)) { load(); render(); }
  });
  async function acquire() {
    load(); render();
    if (loadFailed) return;
    if (!navigator.locks) {
      $("lockNotice").textContent = "Read-only: this browser cannot protect notes against simultaneous editing. Open this site over HTTPS or localhost in a browser supporting Web Locks.";
      return;
    }
    $("lockNotice").hidden = false;
    $("lockNotice").textContent = "Read-only while another tab is editing Case Notes. Close that tab to edit here.";
    try {
      await navigator.locks.request("dell-support.case-notes.editor", async () => {
        load();
        if (loadFailed) return;
        writable = true; $("lockNotice").hidden = true; render();
        await new Promise(resolve => { release = resolve; });
      });
    } catch {
      $("lockNotice").textContent = "Unable to acquire the editor lock. Reload to try again.";
    }
  }
  window.addEventListener("pageshow", event => { if (event.persisted) acquire(); });
  acquire();
})();

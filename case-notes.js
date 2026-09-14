"use strict";
(() => {
  const key = "dell-support.case-notes.v1";
  const $ = id => document.getElementById(id);
  let state = CaseNotes.empty(), dirty = false, writable = false, copying = false, release;
  let loadFailed = false;
  const sidebarKey = "dell-support.case-history-collapsed";
  function setHistoryCollapsed(collapsed) {
    $("caseHistory").hidden = collapsed;
    $("notesLayout").classList.toggle("history-collapsed", collapsed);
    $("toggleHistory").setAttribute("aria-expanded", String(!collapsed));
    $("toggleHistory").textContent = collapsed ? "Show Recent Cases" : "Hide Recent Cases";
  }
  let historyCollapsed = false;
  try { historyCollapsed = localStorage.getItem(sidebarKey) === "true"; } catch { /* Use expanded default. */ }
  setHistoryCollapsed(historyCollapsed);
  $("toggleHistory").addEventListener("click", () => {
    historyCollapsed = !historyCollapsed;
    setHistoryCollapsed(historyCollapsed);
    try { localStorage.setItem(sidebarKey, String(historyCollapsed)); } catch { /* Still works for this visit. */ }
  });
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
    const filter = $("followupFilter").value || "all";
    const matches = state.cases.filter(note => {
      const status = note.toolkit?.status || "Open";
      const overdue = !!note.toolkit?.due && status !== "Completed" && Date.parse(note.toolkit.due) < Date.now();
      return [note.tag, note.request, note.issue].some(value => value.toLowerCase().includes(query)) && (filter === "all" || filter === "overdue" && overdue || filter === "active" && status !== "Completed" || filter === "completed" && status === "Completed");
    });
    $("caseCount").textContent = `${state.cases.length} / 100`;
    $("historyList").replaceChildren(...matches.map(note => {
      const button = document.createElement("button"); button.className = "case-item";
      button.setAttribute("aria-current", String(note.id === state.selected));
      button.disabled = copying;
      const title = document.createElement("strong"); title.textContent = note.tag || note.request || "Untitled case";
      const issue = document.createElement("span"); issue.textContent = note.issue || "No issue description yet";
      const meta = document.createElement("small"); meta.textContent = `${note.request ? note.request + " · " : ""}${new Date(note.created).toLocaleString()}`;
      button.append(title, issue, meta);
      if (note.toolkit) {
        const badge = document.createElement("small");
        const late = note.toolkit.due && note.toolkit.status !== "Completed" && Date.parse(note.toolkit.due) < Date.now();
        badge.className = late ? "followup-badge overdue" : "followup-badge";
        badge.textContent = `${late ? "Overdue · " : ""}${note.toolkit.status}${note.toolkit.owner ? " · " + note.toolkit.owner : ""}${note.toolkit.due ? " · " + new Date(note.toolkit.due).toLocaleString() : ""}`;
        button.append(badge);
      }
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
    $("newNote").disabled = $("startNote").disabled = $("customizeFields").disabled = !writable || copying;
    $("emailNote").disabled = $("copyNote").disabled = $("escalateNote").disabled = $("copyDevin").disabled = !writable || copying;
    $("devinTask").disabled = !writable || copying;
    $("stopTimer").disabled = !writable || copying || !selected() || selected().started === null;
    window.CaseMarkdown?.setEditable(writable && !copying);
    window.CaseToolkit?.setEditable(writable && !copying);
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
    if (note) {
      const effectiveFields = CaseNotes.getEffectiveFields(state);
      const fieldGrid = $("fields").querySelector(".field-grid");
      
      // Create a map of field IDs to their container elements for reordable fields
      const fieldContainers = new Map();
      const otherElements = []; // Elements that shouldn't be reordered (rich text fields, etc.)
      
      Array.from(fieldGrid.children).forEach(child => {
        const input = child.querySelector('[id]');
        if (input && effectiveFields.some(f => f.id === input.id)) {
          fieldContainers.set(input.id, child);
        } else {
          otherElements.push(child);
        }
      });
      
      // Create custom field containers if they don't exist
      effectiveFields.forEach(({ id, label }) => {
        if (!fieldContainers.has(id) && state.fieldConfig.customFields[id]) {
          const fieldContainer = document.createElement("label");
          fieldContainer.className = "field";
          fieldContainer.innerHTML = `<input id="${id}" type="text" placeholder="${label}" autocomplete="off">`;
          fieldContainers.set(id, fieldContainer);
        }
      });
      
      // Clear the grid and rebuild it in the correct order
      fieldGrid.innerHTML = '';
      
      // Add fields in the configured order
      effectiveFields.forEach(({ id }) => {
        const fieldContainer = fieldContainers.get(id);
        if (fieldContainer) {
          fieldGrid.appendChild(fieldContainer);
        }
      });
      
      // Add back the other elements (rich text fields, etc.) at the end
      otherElements.forEach(element => {
        fieldGrid.appendChild(element);
      });
      
      // Now populate values
      effectiveFields.forEach(({ id }) => {
        const fieldElement = $(id);
        if (fieldElement) {
          // Preserve free-text values saved before these dropdowns were introduced.
          if (id === "country" || id === "os") {
            fieldElement.querySelectorAll("[data-legacy-option]").forEach(option => option.remove());
            const match = Array.from(fieldElement.options).find(option =>
              option.value === note[id] || option.textContent.toLowerCase() === note[id].toLowerCase());
            if (!match && note[id]) {
              const option = document.createElement("option");
              option.value = note[id]; option.textContent = note[id];
              option.setAttribute("data-legacy-option", ""); fieldElement.append(option);
            }
            fieldElement.value = match ? match.value : note[id];
          } else if (fieldElement.value !== undefined) {
            fieldElement.value = note[id];
          }
        }
      });
    }
    controls(); history(); tick();
    window.CaseMarkdown?.refresh();
    window.CaseToolkit?.refresh();
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
  
  // Field customization
  function renderFieldCustomizer() {
    const effectiveFields = CaseNotes.getEffectiveFields(state);
    const orderList = $("fieldOrderList");
    orderList.innerHTML = "";
    
    effectiveFields.forEach(({ id, label }) => {
      const item = document.createElement("div");
      item.className = "field-order-item";
      item.draggable = true;
      item.dataset.fieldId = id;
      
      const isBuiltin = CaseNotes.fields[id];
      item.innerHTML = `
        <span class="field-handle">⋮⋮</span>
        <span class="field-name">${label}</span>
        ${isBuiltin ? '<span class="field-builtin">✓ Built-in</span>' : ''}
      `;
      
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", id);
        item.classList.add("dragging");
      });
      
      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
      });
      
      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = orderList.querySelector(".dragging");
        if (dragging && dragging !== item) {
          const rect = item.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          if (e.clientY < midY) {
            orderList.insertBefore(dragging, item);
          } else {
            orderList.insertBefore(dragging, item.nextSibling);
          }
        }
      });
      
      orderList.appendChild(item);
    });
    
    // Render custom fields list
    const customList = $("customFieldsList");
    customList.innerHTML = "";
    Object.entries(state.fieldConfig.customFields).forEach(([id, label]) => {
      const item = document.createElement("div");
      item.className = "custom-field-item";
      item.innerHTML = `
        <span class="field-id">${id}</span>
        <span class="field-label">${label}</span>
        <button class="remove-field" type="button" data-field-id="${id}">Remove</button>
      `;
      item.querySelector(".remove-field").addEventListener("click", () => {
        if (confirm(`Remove custom field "${label}"? This will remove the field from all existing cases.`)) {
          try {
            CaseNotes.removeCustomField(state, id);
            dirty = true;
            renderFieldCustomizer();
            $("customizerStatus").textContent = "Custom field removed. Save to apply changes.";
          } catch (e) {
            $("customizerStatus").textContent = e.message;
          }
        }
      });
      customList.appendChild(item);
    });
  }
  
  $("customizeFields").addEventListener("click", () => {
    if (!writable || copying) return;
    renderFieldCustomizer();
    $("fieldCustomizer").showModal();
    $("customizerStatus").textContent = "";
  });
  
  $("closeCustomizer").addEventListener("click", () => {
    $("fieldCustomizer").close();
  });
  
  $("addCustomField").addEventListener("click", () => {
    const fieldId = $("newFieldId").value.trim();
    const fieldLabel = $("newFieldLabel").value.trim();
    
    if (!fieldId || !fieldLabel) {
      $("customizerStatus").textContent = "Enter both field ID and label.";
      return;
    }
    
    try {
      CaseNotes.addCustomField(state, fieldId, fieldLabel);
      dirty = true;
      $("newFieldId").value = "";
      $("newFieldLabel").value = "";
      renderFieldCustomizer();
      $("customizerStatus").textContent = "Custom field added. Save to apply changes.";
    } catch (e) {
      $("customizerStatus").textContent = e.message;
    }
  });
  
  $("saveFieldConfig").addEventListener("click", () => {
    const orderList = $("fieldOrderList");
    const newOrder = Array.from(orderList.children).map(item => item.dataset.fieldId);
    
    try {
      CaseNotes.reorderFields(state, newOrder);
      save();
      $("fieldCustomizer").close();
      render(); // Re-render form with new field order
      $("copyStatus").textContent = "Field configuration saved.";
    } catch (e) {
      $("customizerStatus").textContent = e.message;
    }
  });
  
  $("resetFields").addEventListener("click", () => {
    if (confirm("Reset all fields to default order and remove custom fields? This cannot be undone.")) {
      state.fieldConfig = { order: [...CaseNotes.defaultFieldOrder], customFields: {} };
      // Remove custom fields from all cases
      state.cases.forEach(note => {
        Object.keys(CaseNotes.fields).forEach(key => {
          if (!Object.hasOwn(note, key)) note[key] = "";
        });
        Object.keys(state.fieldConfig.customFields).forEach(key => {
          delete note[key];
        });
      });
      dirty = true;
      save();
      $("fieldCustomizer").close();
      render();
      $("copyStatus").textContent = "Fields reset to default.";
    }
  });
  $("search").addEventListener("input", history);
  $("followupFilter").addEventListener("change", history);
  setInterval(() => { if (!$("historyList").contains(document.activeElement)) history(); }, 60000);
  $("retrySave").addEventListener("click", save);
  $("noteForm").addEventListener("submit", event => event.preventDefault());
  $("noteForm").addEventListener("input", event => {
    if (!writable || copying) return;
    const effectiveFields = CaseNotes.getEffectiveFields(state);
    const fieldIds = effectiveFields.map(f => f.id);
    if (!fieldIds.includes(event.target.id)) return;
    const note = selected(); if (!note) return;
    const now = Date.now(); const restarting = note.started === null;
    CaseNotes.start(state, note, now);
    note[event.target.id] = event.target.value; note.updated = now; dirty = true;
    status("Unsaved changes");
    $("copyStatus").textContent = "Copy all fields and tracked time as plain text.";
    if (restarting) save();
    tick(); history();
    if (event.target.id === "os") window.CaseToolkit?.refreshChecklist();
  });
  $("emailNote").addEventListener("click", () => {
    const note = selected();
    if (!note || !writable || copying) return;
    if (!note.request.trim()) {
      $("copyStatus").textContent = "Enter a Service Request Number before creating the email.";
      $("request").focus();
      return;
    }
    save();
    try {
      const now = Date.now();
      const content = window.CaseMarkdown.emailHtml(note, now);
      const message = CaseNotes.emailFile(note, now, content, crypto.randomUUID());
      const url = URL.createObjectURL(new Blob([message], { type: "message/rfc822" }));
      const link = document.createElement("a"); link.href = url;
      link.download = "case-" + note.request.replace(/[^a-zA-Z0-9-]/g, "_").slice(0, 80) + ".eml";
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      $("copyStatus").textContent = "HTML email downloaded with inline screenshots. Open the .eml file in your email app, add the recipient, and send. Some apps open it as a message; use Forward or Edit as New if needed.";
    } catch {
      $("copyStatus").textContent = "Could not create the email file. Your note is unchanged. Try again, or use Copy to Lightning for a plain-text copy.";
    }
  });
  $("escalateNote").addEventListener("click", () => {
    const note = selected();
    if (!note || !writable || copying || !save()) return;
    try {
      const token = crypto.randomUUID();
      sessionStorage.setItem("dell-support.escalation." + token, JSON.stringify(CaseNotes.escalation(note, Date.now(), state.fieldConfig)));
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
  $("copyDevin").addEventListener("click", async () => {
    const note = selected(); if (!note || !writable || copying) return;
    save();
    const text = DevinPrompt.build($("devinTask").value, "Case Notes", CaseNotes.copyText(note, Date.now()));
    copying = true; controls(); history();
    try {
      await navigator.clipboard.writeText(text);
      $("devinStatus").textContent = "Copied for AI. Open your AI tool, paste the prompt, and review its suggestions before applying them.";
    } catch {
      $("devinStatus").textContent = "Could not copy the AI prompt. Allow clipboard access and try again.";
    } finally { copying = false; controls(); history(); }
  });
  setInterval(() => { if (dirty) save(); }, 10000);
  setInterval(tick, 1000);
  function updateFloatingActions() {
    const actions = $("copyActions");
    if (!actions?.getBoundingClientRect) return;
    const rect = actions.getBoundingClientRect();
    actions.classList.toggle("is-floating", window.scrollY > 0 && Math.abs(rect.bottom - (window.innerHeight - 16)) < 3);
  }
  window.addEventListener("scroll", updateFloatingActions, { passive:true });
  window.addEventListener("resize", updateFloatingActions);
  updateFloatingActions();
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
  window.CaseMarkdown?.init({
    current: selected,
    canEdit: () => writable && !copying,
    update(field, value, images) {
      const note = selected();
      if (!note || !writable || copying) return;
      if (images) note.images = images;
      $(field).value = value;
      $(field).dispatchEvent(new Event("input", { bubbles: true }));
      if (images) save();
    }
  });
  window.CaseToolkit?.init({
    save,
    current: selected,
    canEdit: () => writable && !copying,
    mutate(change, immediate = true) {
      const note = selected(); if (!note || !writable || copying) return;
      change(note);
      const now = Date.now(); CaseNotes.start(state, note, now); note.updated = now;
      dirty = true; status("Unsaved changes");
      if (immediate) save();
      tick(); history();
    },
    refreshEditors: () => { const note = selected(); if (!note) return; $("notes").value = note.notes; $("next").value = note.next; window.CaseMarkdown?.refresh(); }
  });
  window.LogHelper?.init({
    context: () => { const note=selected(); return {id:note?.id,os:note?.os,platform:note?.platform,symptom:note?.toolkit?.issueType}; },
    canAdd: () => !!selected() && writable && !copying,
    addLabel: "Add to Next Steps",
    add(text) {
      const note=selected(); if(!note || !writable || copying)return false;
      const escaped=text.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
      note.next=marked.parse(note.next,{gfm:true,breaks:true})+"<p>"+escaped.replace(/\n/g,"<br>")+"</p>";
      $("next").value=note.next;$("next").dispatchEvent(new Event("input",{bubbles:true}));
      window.CaseMarkdown?.refresh();return save();
    }
  });
  acquire();
})();

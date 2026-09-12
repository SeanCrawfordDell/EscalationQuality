"use strict";
// Pure case operations, shared with the Node regression tests.
const CaseNotes = (() => {
  const fields = { tag: "Service Tag", request: "Service Request Number", os: "OS/Solution", country: "Customer Country", supportType: "OEM or PSP", logLocation: "Log Location", issue: "Issue Description", notes: "Notes", next: "Action Plan / Next Steps" };
  const empty = () => ({ version: 1, selected: null, cases: [] });
  const elapsed = (note, now) => note.elapsed + (note.started === null ? 0 : Math.max(0, now - note.started));
  function stop(note, now) { note.elapsed = elapsed(note, now); note.started = null; }
  function start(state, note, now) {
    if (note.started !== null) return;
    state.cases.forEach(item => { if (item.started !== null) stop(item, now); });
    note.started = now;
  }
  function create(state, id, now) {
    state.cases.forEach(item => { if (item.started !== null) stop(item, now); });
    const note = { id, created: now, updated: now, elapsed: 0, started: now, ...Object.fromEntries(Object.keys(fields).map(key => [key, ""])) };
    state.cases.unshift(note); state.cases = state.cases.slice(0, 100); state.selected = id;
    return note;
  }
  function duration(ms) {
    const seconds = Math.floor(ms / 1000);
    return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, "0")).join(":");
  }
  function copyText(note, now) {
    return [...Object.entries(fields).map(([key, label]) => `${label}:\n${note[key]}`), `Time Spent:\n${duration(elapsed(note, now))}`].join("\n\n");
  }
  function backup(state, now) {
    const snapshot = parse(JSON.stringify(state));
    snapshot.cases.forEach(note => stop(note, now));
    return JSON.stringify(snapshot, null, 2);
  }
  function escalation(note, now) {
    return { problem: note.issue, tag: note.tag, os: note.os, country: note.country,
      troubleshooting: note.notes, request: note.next, sourceNote: copyText(note, now) };
  }
  function parse(raw) {
    if (raw === null) return empty();
    const state = JSON.parse(raw);
    if (state.version !== 1 || !Array.isArray(state.cases) || state.cases.length > 100) throw Error("Invalid history");
    const ids = new Set(); let running = 0;
    for (const note of state.cases) {
      // Older saved cases predate these optional fields; retain all existing data.
      if (note && typeof note === "object") {
        for (const key of ["os", "country", "supportType", "logLocation"]) {
          if (!Object.hasOwn(note, key)) note[key] = "";
        }
      }
      if (!note || typeof note.id !== "string" || ids.has(note.id) || ![note.created, note.updated, note.elapsed].every(n => Number.isFinite(n) && n >= 0) || !(note.started === null || (Number.isFinite(note.started) && note.started >= 0)) || !Object.keys(fields).every(key => typeof note[key] === "string")) throw Error("Invalid case");
      ids.add(note.id); if (note.started !== null) running++;
    }
    if (running > 1 || !(state.selected === null || ids.has(state.selected))) throw Error("Invalid selection");
    state.cases.sort((a, b) => b.created - a.created);
    return state;
  }
  return { fields, empty, elapsed, stop, start, create, duration, copyText, backup, escalation, parse };
})();
if (typeof module !== "undefined") module.exports = CaseNotes;

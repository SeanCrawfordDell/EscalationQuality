"use strict";
// Pure case operations, shared with the Node regression tests.
const CaseNotes = (() => {
  const Toolkit = typeof module !== "undefined" ? require("./case-toolkit-core.js") : CaseToolkitCore;
  const fields = { tag: "Service Tag", platform: "System/Platform", request: "Service Request Number", os: "OS/Solution", osVersion: "OS version / build", country: "Customer Country", supportType: "OS Support", logLocation: "Log Location", issue: "Issue Description", notes: "Notes", next: "Action Plan / Next Steps" };
  const defaultFieldOrder = Object.keys(fields);
  const empty = () => ({ version: 2, selected: null, cases: [], fieldConfig: { order: [...defaultFieldOrder], customFields: {} } });
  const elapsed = (note, now) => note.elapsed + (note.started === null ? 0 : Math.max(0, now - note.started));
  const lastSession = (note, now) => note.started === null ? (note.lastSession || 0) : Math.max(0, now - note.started);
  function stop(note, now) {
    if (note.started !== null) note.lastSession = Math.max(0, now - note.started);
    note.elapsed = elapsed(note, now); note.started = null;
  }
  function start(state, note, now) {
    if (note.started !== null) return;
    state.cases.forEach(item => { if (item.started !== null) stop(item, now); });
    note.started = now;
  }
  function create(state, id, now) {
    state.cases.forEach(item => { if (item.started !== null) stop(item, now); });
    const fieldConfig = state.fieldConfig || { order: [...defaultFieldOrder], customFields: {} };
    const allFields = { ...fields, ...fieldConfig.customFields };
    const note = { toolkit: Toolkit.defaults(), id, created: now, updated: now, elapsed: 0, started: now, lastSession: 0, ...Object.fromEntries(Object.keys(allFields).map(key => [key, ""])) };
    state.cases.unshift(note); state.cases = state.cases.slice(0, 100); state.selected = id;
    return note;
  }
  function duration(ms) {
    const seconds = Math.floor(ms / 1000);
    return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, "0")).join(":");
  }
  function plainImages(text) {
    let plain = text.replace(/!\[([^\]]*)\]\(attachment:[a-zA-Z0-9-]+\)/g, (_, label) => `[Screenshot: ${label || "image"}; view in Case Notes]`);
    if (/<[a-z][^>]*>/i.test(plain)) {
      plain = plain.replace(/<img\b[^>]*>/gi, tag => {
        const label = /alt="([^"]*)"/i.exec(tag)?.[1] || "image";
        return `[Screenshot: ${label}; view in Case Notes]`;
      }).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
        .replace(/<li\b[^>]*>/gi, "\n- ")
        .replace(/<br\s*\/?>|<\/(?:p|div|h[1-6]|li|tr|blockquote|pre)>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (full, entity) => {
          const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
          if (entity[0] !== "#") return named[entity.toLowerCase()] || full;
          const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
          return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : full;
        }).replace(/\n{3,}/g, "\n\n").trim();
    }
    return plain;
  }
  function copyText(note, now, fieldConfig = null) {
    const extra = Toolkit.extraText(note);
    const config = fieldConfig || { order: [...defaultFieldOrder], customFields: {} };
    const allFields = { ...fields, ...config.customFields };
    const orderedFields = config.order.filter(key => allFields[key]).concat(Object.keys(config.customFields).filter(key => !config.order.includes(key)));
    return [...orderedFields.map(key => `${allFields[key] || key}:\n${plainImages(note[key] || "")}`), ...(extra ? [extra] : []), `Time Spent:\n${duration(elapsed(note, now))}`].join("\n\n");
  }
  function emailFile(note, now, content, token) {
    if (!/^[a-zA-Z0-9-]+$/.test(token)) throw Error("Invalid email ID");
    const base64 = text => btoa(Array.from(new TextEncoder().encode(text), byte => String.fromCharCode(byte)).join(""));
    const wrap = text => (text.match(/.{1,76}/g) || []).join("\r\n");
    const requestNumber = note.request.replace(/[\r\n]+/g, " ").trim();
    const subject = `Service Request # ${requestNumber} - Case Notes`;
    const subjectHeader = (Array.from(subject).join("").match(/.{1,20}/gu) || []).map(chunk => `=?UTF-8?B?${base64(chunk)}?=`).join("\r\n ");
    const related = "related-" + token, alternative = "alternative-" + token;
    const lines = ["MIME-Version: 1.0", "X-Unsent: 1", "Date: " + new Date(now).toUTCString(), "Subject: " + subjectHeader,
      `Content-Type: multipart/related; boundary="${related}"`, "", `--${related}`,
      `Content-Type: multipart/alternative; boundary="${alternative}"`, "",
      `--${alternative}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", wrap(base64(copyText(note, now))),
      `--${alternative}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", wrap(base64(content.html)), `--${alternative}--`];
    for (const [id, image] of Object.entries(content.images)) {
      const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image.data);
      if (!/^[a-zA-Z0-9-]+$/.test(id) || !match) throw Error("Invalid screenshot");
      const filename = `screenshot-${id}.${match[1] === "jpeg" ? "jpg" : match[1]}`;
      lines.push(`--${related}`, `Content-Type: image/${match[1]}; name="${filename}"`, "Content-Transfer-Encoding: base64",
        `Content-ID: <${id}@case-notes>`, `Content-Disposition: inline; filename="${filename}"`, "", wrap(match[2]));
    }
    lines.push(`--${related}--`, "");
    return lines.join("\r\n");
  }
  function backup(state, now) {
    const snapshot = parse(JSON.stringify(state));
    snapshot.cases.forEach(note => stop(note, now));
    return JSON.stringify(snapshot, null, 2);
  }
  function escalation(note, now, fieldConfig = null) {
    const config = fieldConfig || { order: [...defaultFieldOrder], customFields: {} };
    const customFieldsData = {};
    Object.keys(config.customFields).forEach(key => {
      if (note[key]) customFieldsData[config.customFields[key]] = note[key];
    });
    return { problem: note.issue, tag: note.tag, os: note.os, country: note.country,
      osVersion: note.osVersion || "", serviceRequest: note.request, platform: note.platform || "", supportType: note.supportType || "", logLocation: note.logLocation || "", impact: note.toolkit?.impact || "", checks: note.toolkit?.checks || {}, issueType: note.toolkit?.issueType || "general",
      troubleshooting: plainImages(note.notes), nextSteps: plainImages(note.next), sourceNote: copyText(note, now, config), customFields: customFieldsData };
  }
  function parse(raw) {
    if (raw === null) return empty();
    const state = JSON.parse(raw);
    if (state.version === 1) {
      state.version = 2;
      state.fieldConfig = { order: [...defaultFieldOrder], customFields: {} };
    }
    if (state.version !== 2 || !Array.isArray(state.cases) || state.cases.length > 100) throw Error("Invalid history");
    if (!state.fieldConfig) state.fieldConfig = { order: [...defaultFieldOrder], customFields: {} };
    const ids = new Set(); let running = 0;
    const allFields = { ...fields, ...state.fieldConfig.customFields };
    for (const note of state.cases) {
      // Older saved cases predate these optional fields; retain all existing data.
      if (note && typeof note === "object") {
        for (const key of ["os", "country", "supportType", "logLocation", "platform", "osVersion"]) {
          if (!Object.hasOwn(note, key)) note[key] = "";
        }
        // Add custom fields to existing notes
        for (const key of Object.keys(state.fieldConfig.customFields)) {
          if (!Object.hasOwn(note, key)) note[key] = "";
        }
        // Older saved cases predate per-session tracking.
        if (!Object.hasOwn(note, "lastSession")) note.lastSession = 0;
      }
      if (!note || typeof note.id !== "string" || ids.has(note.id) || ![note.created, note.updated, note.elapsed, note.lastSession].every(n => Number.isFinite(n) && n >= 0) || !(note.started === null || (Number.isFinite(note.started) && note.started >= 0)) || !Object.keys(allFields).every(key => typeof note[key] === "string")) throw Error("Invalid case");
      if (!Object.hasOwn(note, "images")) note.images = {};
      if (!note.images || typeof note.images !== "object" || Array.isArray(note.images) || !Object.entries(note.images).every(([id, image]) => /^[a-zA-Z0-9-]+$/.test(id) && image && typeof image.name === "string" && typeof image.data === "string" && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image.data))) throw Error("Invalid screenshots");
      Toolkit.validate(note);
      ids.add(note.id); if (note.started !== null) running++;
    }
    if (running > 1 || !(state.selected === null || ids.has(state.selected))) throw Error("Invalid selection");
    state.cases.sort((a, b) => b.created - a.created);
    return state;
  }
  function addCustomField(state, fieldId, fieldLabel) {
    if (!/^[a-zA-Z0-9_-]+$/.test(fieldId)) throw Error("Invalid field ID");
    if (fields[fieldId] || state.fieldConfig.customFields[fieldId]) throw Error("Field already exists");
    state.fieldConfig.customFields[fieldId] = fieldLabel;
    state.fieldConfig.order.push(fieldId);
    // Add empty value to all existing cases
    state.cases.forEach(note => note[fieldId] = "");
    return state;
  }
  function removeCustomField(state, fieldId) {
    if (fields[fieldId]) throw Error("Cannot remove built-in field");
    if (!state.fieldConfig.customFields[fieldId]) throw Error("Custom field not found");
    delete state.fieldConfig.customFields[fieldId];
    state.fieldConfig.order = state.fieldConfig.order.filter(id => id !== fieldId);
    // Remove field from all existing cases
    state.cases.forEach(note => delete note[fieldId]);
    return state;
  }
  function reorderFields(state, newOrder) {
    if (!Array.isArray(newOrder)) throw Error("Invalid order");
    const allFields = { ...fields, ...state.fieldConfig.customFields };
    if (!newOrder.every(id => allFields[id])) throw Error("Invalid field in order");
    if (newOrder.length !== Object.keys(allFields).length) throw Error("Missing fields in order");
    state.fieldConfig.order = newOrder;
    return state;
  }
  function getEffectiveFields(state) {
    const allFields = { ...fields, ...state.fieldConfig.customFields };
    return state.fieldConfig.order.filter(key => allFields[key]).map(key => ({ id: key, label: allFields[key] }));
  }
  return { fields, defaultFieldOrder, empty, elapsed, lastSession, stop, start, create, duration, plainText: plainImages, copyText, emailFile, backup, escalation, parse, addCustomField, removeCustomField, reorderFields, getEffectiveFields };
})();
if (typeof module !== "undefined") module.exports = CaseNotes;

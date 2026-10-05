// TOPBAR lead behavior rules adapted to V40.
// UI rendering stays in V40 page modules; this file owns lead relationships and state rules.
const LeadRules = (() => {
  const key = "v40.leadRules";
  const saved = (() => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } })();
  const activity = saved.activity || {};
  const lastUsed = saved.lastUsed || {};
  const edits = saved.edits || {};

  leads.forEach((l) => { if (edits[l.id]) Object.assign(l, edits[l.id]); });

  const digits = (value) => String(value || "").replace(/\D/g, "").slice(-10);
  const email = (value) => String(value || "").trim().toLowerCase();
  const persist = () => localStorage.setItem(key, JSON.stringify({ activity, lastUsed, edits }));

  function byId(id) { return leads.find((l) => String(l.id) === String(id)) || null; }
  function byNumber(number) {
    const d = digits(number);
    return d.length === 10 ? leads.find((l) => (l.phones || []).some((p) => digits(p[2] || p[1]) === d)) || null : null;
  }
  function byEmail(address) {
    const target = email(address);
    return target ? leads.find((l) => (l.emails || []).some((e) => email(Array.isArray(e) ? e[1] : e) === target)) || null : null;
  }
  function update(id, fields) {
    const l = byId(id);
    if (!l) return null;
    Object.assign(l, fields);
    edits[l.id] = { ...(edits[l.id] || {}), ...fields };
    persist();
    return l;
  }
  function log(id, type, text, meta = {}) {
    const l = byId(id);
    if (!l) return null;
    const item = { id: "lr-" + Date.now() + "-" + Math.random().toString(36).slice(2,7), type, text, at: Date.now(), ...meta };
    (activity[l.id] ||= []).unshift(item);
    persist();
    return item;
  }
  function history(id) { return activity[String(id)] || activity[id] || []; }
  function options(kind, l) {
    if (!l) return [];
    if (kind === "email") return (l.emails || []).map((e) => {
      const value = Array.isArray(e) ? e[1] : e;
      return { value, label: value };
    });
    const phones = kind === "call" ? (l.phones || []) : (l.phones || []).filter((p) => String(p[0]).toLowerCase() === "mobile");
    return phones.map((p) => ({ value: p[2] || digits(p[1]), label: p[0] + " · " + p[1] }));
  }
  function target(kind, l) {
    const opts = options(kind, l);
    const remembered = lastUsed[l?.id]?.[kind];
    return opts.find((o) => o.value === remembered)?.value || opts[0]?.value || "";
  }
  function remember(kind, id, value) {
    if (!id || !value) return;
    (lastUsed[id] ||= {})[kind] = value;
    persist();
  }
  function perform(kind, id, value) {
    const l = byId(id);
    if (!l) return null;
    const chosen = value || target(kind, l);
    if (!chosen) return null;
    remember(kind, l.id, chosen);
    if (kind === "sms" || kind === "wa" || kind === "email") update(l.id, { status: "ATTEMPTED" });
    log(l.id, kind, `${kind === "wa" ? "WhatsApp" : kind === "sms" ? "Text" : kind === "email" ? "Email" : "Call"} · ${chosen}`, { target: chosen });
    return { lead: l, target: chosen };
  }
  function select(id) {
    const l = byId(id);
    if (!l) return null;
    if (String(state.id) !== String(id)) log(l.id, "lead", "Lead opened");
    state.id = String(id);
    return l;
  }
  return { byId, byNumber, byEmail, update, log, history, options, target, remember, perform, select };
})();

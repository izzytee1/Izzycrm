const listEl = $("#list");
const commsEl = $("#commsBody");
function lead() { return leads.find((l) => l.id === state.id) || leads[0]; }
function initials(name) { return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase(); }

function visible() {
  const q = state.q.trim().toLowerCase();
  return leads.filter((l) => {
    if (!q) return true;
    return [l.name, l.company, l.city, ...(l.phones || []).map((p) => p[1])].join(" ").toLowerCase().includes(q);
  });
}
function renderList() {
  const rows = visible();
  $("#leadCount").textContent = String(rows.length);
  listEl.innerHTML = rows.map((l, i) => `
    <button class="lead-row${l.id === state.id ? " on" : ""}" data-id="${l.id}">
      <span class="av c${(i % 5) + 1}">${initials(l.name)}</span>
      <span class="co">${esc(l.company)}</span>
      <span class="rev num">${esc(l.revenue || "")}</span>
      <span class="meta">${esc(l.name)}</span>
      <span class="tiny when">${esc(l.timestamp || "")}</span>
    </button>`).join("") || `<div class="section empty">No leads match.</div>`;
}
function detailFact(label, value, numeric = false) {
  const shown = value == null ? "" : String(value);
  return `<div class="detail-fact"><div class="detail-label">${esc(label)}</div><div class="detail-value${numeric ? " num-detail" : ""}">${esc(shown)}</div></div>`;
}
function detailIcon(path) {
  return `<svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"></path></svg>`;
}
function renderDetail() {
  const l = lead();
  const phoneFacts = (l.phones || []).slice(0, 2).map((p, i) => `<div class="detail-fact"><div class="detail-label">${i === 0 ? "Mobile" : "Landline"}</div><a class="detail-value num-detail" href="tel:${esc(String(p[1]).replace(/[^\d+]/g, ""))}">${esc(p[1])}</a></div>`).join("");
  const emailFacts = (l.emails || []).map((e) => `<div class="detail-fact"><div class="detail-label">Email</div><a class="detail-value" style="font-weight:400" href="mailto:${esc(e[1])}">${esc(e[1])}</a></div>`).join("");
  const activity = [...(l.sms || []), ...(l.mail || []), ...(l.calls || [])].slice(-3).reverse();
  const summaryParts = [];
  if (l.company) summaryParts.push(`${l.company}${l.industry ? " operates in " + l.industry.toLowerCase() : ""}.`);
  if (l.deposits) summaryParts.push(`Recent deposits are ${l.deposits}${l.position ? ", with a " + l.position + " position noted" : ""}.`);
  if (l.use) summaryParts.push(`Funding purpose: ${l.use}.`);
  const bankRows = (l.statements || []).map(r => `<tr><td>${esc(r[0])}</td><td class="num-detail">${esc(r[1])}</td><td class="num-detail">${esc(r[2])}</td></tr>`).join("");
  const profile = [
    l.dba ? detailFact("DBA", l.dba) : "",
    detailFact("EIN", l.ein || "", true),
    detailFact("SSN", l.ssn || "", true),
    detailFact("Start date", l.opened || "", true),
    detailFact("Industry", String(l.industry || "").split("·")[0].trim()),
    detailFact("Applied", l.applied || "", true)
  ].join("");
  const bankFacts = [
    detailFact("Bank", l.bankName || ""),
    detailFact("Account #", l.account || "", true)
  ].join("");
  $("#desk").innerHTML = `<div class="detail-shell">
    <div class="detail-head">
      <div class="detail-name">${esc(l.company)}</div>
      <div class="detail-sub"><span>${esc(l.name)}</span><svg class="pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.2"/></svg>${l.address ? `<span>${esc(l.address)}</span>` : `<span>${esc(l.city || "")}</span>`}</div>
    </div>
    <div class="detail-body">
      <div class="detail-pair profile-pair">
        <section class="detail-section">
          <div class="detail-title">${detailIcon("M4 20V10l8-6 8 6v10M9 20v-6h6v6")}<span>Company Profile</span></div>
          <div class="detail-facts">${profile}</div>
        </section>
        <section class="detail-section">
          <div class="detail-title">${detailIcon("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87")}<span>Direct Contacts</span></div>
          <div class="detail-contact">${phoneFacts}${emailFacts || (!phoneFacts ? `<div class="detail-empty">No direct contacts on file.</div>` : "")}</div>
        </section>
      </div>
      <div class="detail-pair">
        <section class="detail-section">
          <div class="detail-title">${detailIcon("M3 10h18M5 10V7l7-4 7 4v3M5 10v9M9 10v9M15 10v9M19 10v9M3 19h18")}<span>Banking &amp; Cash Flow</span></div>
          <div class="detail-facts">${bankFacts}</div>
          ${bankRows ? `<table class="stmt-table"><thead><tr><th>Month</th><th>Deposits</th><th>Balance</th></tr></thead><tbody>${bankRows}</tbody></table>` : `<div class="detail-empty" style="margin-top:12px">No bank statements on file.</div>`}
        </section>
        <section class="detail-section">
          <div class="detail-title">${detailIcon("M12 8v4l3 2M21 12a9 9 0 1 1-9-9")}<span>Activity Stream</span></div>
          <div class="activity-list">${activity.length ? activity.map(a => `<div class="activity-item"><div class="activity-time">${esc(a[2] || "")}</div><div class="activity-text">${esc(a[1] || "")}</div></div>`).join("") : `<div class="detail-empty">No activity yet.</div>`}</div>
        </section>
      </div>
           <div class="detail-pair">
      <section class="detail-section">
        <div class="detail-title">${detailIcon("M4 19V9M10 19V5M16 19v-7M22 19V3")}<span>Executive Summary</span></div>
        <p class="summary">${esc(summaryParts.join(" ") || "No financial summary available yet.")}</p>
      </section>
      <section class="detail-section">
        <div class="detail-title">${detailIcon("M4 4h16v16H4zM8 9h8M8 13h8M8 17h5")}<span>Notes & Directives</span></div>
        <textarea class="notes-area" data-note-id="${esc(l.id)}" placeholder="Add a note…">${esc(l.notes || "")}</textarea>
      </section>
      </div>
    </div>
  </div>`;
}
function renderComms() {
  const l = lead();
  const who = $("#dockWho"); if (who) who.textContent = l.name;
  document.querySelectorAll("#commTabs button").forEach((b) => b.classList.toggle("on", b.dataset.comm === state.comm));
  const composer = $("#composer");
  if (composer) composer.classList.toggle("hidden", state.comm === "people");
  $("#box").placeholder = state.comm === "mail" ? "Email" : state.comm === "calls" ? "Log a call" : "Message";
  if (state.comm === "people") {
    commsEl.innerHTML = `<div class="thread">${(l.people || []).map((p) => `<div class="contact-line"><div class="lab">${esc(p[0])}</div><div class="val">${esc(p[1])}${p[2] ? "<div class='tiny'>" + esc(p[2]) + "</div>" : ""}</div></div>`).join("") || `<div class="empty">No people yet.</div>`}</div>`;
    return;
  }
  const channel = state.comm === "mail" ? "Email" : state.comm === "calls" ? "Call" : "SMS";
  const items = l[state.comm] || [];
  commsEl.innerHTML = `<div class="thread">${items.map((m) => {
    const kind = m[0] === "miss" ? "Missed" : m[0] === "no" ? "No answer" : m[0] === "out" ? "Out" : "In";
    const phone = m[3] ? " · " + esc(m[3]) : "";
    return `<div class="bubble ${m[0] === "out" ? "out" : "in"}${m[0] === "miss" || m[0] === "no" ? " miss" : ""}"><span class="ch">${channel} · ${kind}</span><div>${esc(m[1])}</div><div class="t">${esc(m[2] || "")}${phone}</div></div>`;
  }).join("") || `<div class="empty">Nothing here yet.</div>`}</div>`;
  commsEl.scrollTop = commsEl.scrollHeight;
}
function render() { renderList(); renderDetail(); renderComms(); }


document.addEventListener("input", (e) => {
  if (e.target.matches(".notes-area")) { const l = leads.find(x => x.id === e.target.dataset.noteId); if (l) l.notes = e.target.value; }
});

document.addEventListener("click", (e) => {
  const row = e.target.closest(".lead-row");
  if (row) { state.id = row.dataset.id; render(); return; }
  const comm = e.target.closest("[data-comm]");
  if (comm) { state.comm = comm.dataset.comm; renderComms(); return; }
  if (e.target.closest("#attachBtn")) { $("#file").click(); return; }
});

$("#composer").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("#box").value.trim();
  const fileName = state.fileName;
  if (!text && !fileName) return;
  const l = lead();
  const body = [text, fileName ? "Attached " + fileName : ""].filter(Boolean).join("\n");
  const key = state.comm === "mail" ? "mail" : state.comm === "calls" ? "calls" : state.comm === "people" ? "calls" : "sms";
  if (state.comm === "people") l.calls.push(["out", body, nowLabel()]);
  else l[key].push(["out", body, nowLabel()]);
  $("#box").value = "";
  state.fileName = "";
  $("#file").value = "";
  if (state.comm === "people") state.comm = "calls";
  renderComms();
  toast("Sent");
});
$("#file").addEventListener("change", () => {
  const f = $("#file").files[0];
  state.fileName = f ? f.name : "";
  if (f) toast("Attached " + f.name);
});

$("#q").addEventListener("input", (e) => {
  state.q = e.target.value;
  if (state.view === "scanner") reorderRows();
  else renderList();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
    e.preventDefault(); $("#q").focus();
  }
});

$("#newLead").addEventListener("click", () => {
  $("#overlay").classList.remove("hidden");
  $("#overlay").innerHTML = `<form class="sheet" id="leadForm">
    <h2>New lead</h2>
    <label>Name</label><input name="name" required>
    <label>Company</label><input name="company" required>
    <label>City</label><input name="city">
    <label>Phone</label><input name="phone">
    <div class="actions"><button class="btn" type="button" id="cancelLead">Cancel</button><button class="btn primary" type="submit">Save</button></div>
  </form>`;
});
$("#overlay").addEventListener("click", (e) => { if (e.target.id === "overlay" || e.target.id === "cancelLead") $("#overlay").classList.add("hidden"); });
$("#overlay").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const name = String(f.get("name")).trim();
  const id = "n" + Date.now();
  leads.unshift({
    id, revenue: "", timestamp: "", name, title: "", company: String(f.get("company")).trim(), city: String(f.get("city") || "").trim(),
    stage: "New", score: 0, star: false, mine: true, due: "", phones: f.get("phone") ? [["Mobile", String(f.get("phone")).trim()]] : [],
    emails: [], people: [["Owner", name, String(f.get("phone") || "")]],
    sms: [], mail: [], calls: [], owner: "Cole Brennan", file: "FG-" + id.slice(-4).toUpperCase(),
    source: "", deposits: "", ask: "", offer: "", position: "", fico: "", use: ""
  });
  state.id = id;
  $("#overlay").classList.add("hidden");
  render();
  toast("Lead saved");
});


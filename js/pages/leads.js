const listEl = $("#list");
const commsEl = $("#commsBody");
function lead() { return leads.find((l) => l.id === state.id) || leads[0]; }
function initials(name) { return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase(); }
function money(value) { return Number.isFinite(Number(value)) ? "$" + Math.round(Number(value)).toLocaleString("en-US") : ""; }
function yearsSince(dateText) {
  if (!dateText) return "";
  const then = new Date(dateText + "T00:00:00");
  if (Number.isNaN(then.getTime())) return "";
  const now = new Date();
  let years = now.getFullYear() - then.getFullYear();
  if (now < new Date(now.getFullYear(), then.getMonth(), then.getDate())) years--;
  return years;
}
function fmtDate(dateText) {
  if (!dateText) return "";
  const d = new Date(dateText + "T00:00:00");
  return Number.isNaN(d.getTime()) ? String(dateText) : d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}
function statementRows(l) {
  const b = l.bank;
  if (!b) return [];
  const count = Math.max(1, Math.min(Number(b.months) || 1, 6));
  const now = new Date();
  const rows = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1 - i, 1);
    const vary = (k) => 0.85 + 0.3 * (((Number(l.id) * 97 + i * 31 + k * 17) % 100) / 100);
    rows.push([
      d.toLocaleDateString("en-US", { month:"short" }).toUpperCase(),
      money(Math.round(b.deposits * vary(1) / 100) * 100),
      money(Math.round(b.balance * vary(2) / 100) * 100)
    ]);
  }
  return rows;
}
function buildSummary(l) {
  const b = l.bank;
  if (!b) return "No bank statements on file yet, so there is nothing to summarize.";
  const load = b.deposits ? Math.round((Number(b.obligations || 0) / Number(b.deposits)) * 100) : 0;
  const nsf = Number(b.nsf || 0);
  return `Deposits average about ${money(Math.round(Number(b.deposits || 0) / 1000) * 1000)} a month. Loan payments take about ${load}% of deposits, ${load < 25 ? "so there is room for new funding" : "so the monthly load is already heavy"}. ${nsf === 0 ? "There are no NSF fees in the recent statements." : `There ${nsf === 1 ? "is 1 NSF fee" : "are " + nsf + " NSF fees"} in the recent statements, so cash flow gets tight at times.`}`;
}

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
  const phoneFacts = (l.phones || []).map((p) => `<div class="detail-fact"><div class="detail-label">${esc(p[0] || "Phone")}</div><a class="detail-value num-detail" href="tel:${esc(String(p[2] || p[1]).replace(/[^\\d+]/g, ""))}">${esc(p[1])}</a></div>`).join("");
  const emailFacts = (l.emails || []).map((e) => `<div class="detail-fact"><div class="detail-label">Email</div><a class="detail-value" style="font-weight:400" href="mailto:${esc(e[1])}">${esc(e[1])}</a></div>`).join("");
  const liveActivity = LeadRules.history(l.id).map((h) => ["", h.text, new Date(h.at).toLocaleString([], { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" })]);
  const seedActivity = (l.history || []).map((h) => ["", h.subject + (h.preview ? " — " + h.preview : ""), h.date]);
  const activity = liveActivity.concat(seedActivity).slice(0, 4);
  const bankRows = statementRows(l).map(r => `<tr><td>${esc(r[0])}</td><td class="num-detail">${esc(r[1])}</td><td class="num-detail">${esc(r[2])}</td></tr>`).join("");
  const profile = [
    l.dba ? detailFact("DBA", l.dba) : "",
    detailFact("EIN", l.ein || "", true),
    detailFact("Birth date", l.dob ? `${fmtDate(l.dob)} · age ${yearsSince(l.dob)}` : ""),
    detailFact("SSN", l.ssn || "", true),
    detailFact("Start date", l.started ? `${fmtDate(l.started)} · ${yearsSince(l.started)} yrs` : "", true),
    detailFact("Industry", l.industry || ""),
    detailFact("Applied", fmtDate(l.applied), true),
    l.address2 ? detailFact("Address 2", l.address2) : "",
    l.address3 ? detailFact("Address 3", l.address3) : ""
  ].join("");
  const bankFacts = [
    detailFact("Bank", l.bank?.name || l.bankName || ""),
    detailFact("Account #", l.bank?.account || l.account || "", true)
  ].join("");
  $("#desk").innerHTML = `<div class="detail-shell">
    <div class="detail-head">
      <div class="detail-name">${esc(l.legal || l.company)}</div>
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
      <section class="detail-section detail-full banking-section">
        <div class="detail-title">${detailIcon("M3 10h18M5 10V7l7-4 7 4v3M5 10v9M9 10v9M15 10v9M19 10v9M3 19h18")}<span>Banking &amp; Cash Flow</span></div>
        <div class="detail-facts bank-facts">${bankFacts}</div>
        ${bankRows ? `<table class="stmt-table"><thead><tr><th>Month</th><th>Deposits</th><th>Balance</th></tr></thead><tbody>${bankRows}</tbody></table>` : `<div class="detail-empty" style="margin-top:12px">No bank statements on file.</div>`}
      </section>
      <section class="detail-section detail-full">
        <div class="detail-title">${detailIcon("M4 19V9M10 19V5M16 19v-7M22 19V3")}<span>Executive Summary</span></div>
        <p class="summary">${esc(buildSummary(l))}</p>
      </section>
      <section class="detail-section detail-full">
        <div class="detail-title">${detailIcon("M12 8v4l3 2M21 12a9 9 0 1 1-9-9")}<span>Activity Stream</span></div>
        <div class="activity-list">${activity.length ? activity.map(a => `<div class="activity-item"><div class="activity-time">${esc(a[2] || "")}</div><div class="activity-text">${esc(a[1] || "")}</div></div>`).join("") : `<div class="detail-empty">No activity yet.</div>`}</div>
      </section>
      <section class="detail-section detail-full notes-section">
        <button class="detail-title notes-toggle" type="button" aria-expanded="false">
          ${detailIcon("M4 4h16v16H4zM8 9h8M8 13h8M8 17h5")}<span>Notes &amp; Directives</span><span class="notes-chevron" aria-hidden="true">⌄</span>
        </button>
        <div class="notes-content" hidden>
          <textarea class="notes-area" data-note-id="${esc(l.id)}" placeholder="Add a note…">${esc(l.notes || "")}</textarea>
          <div class="notes-actions"><button class="btn notes-save" type="button" data-note-id="${esc(l.id)}">Save</button></div>
        </div>
      </section>
    </div>
  </div>`;
}
function commFmtTime(at) { return new Date(at).toLocaleTimeString([], { hour:"numeric", minute:"2-digit" }); }
function commFmtDay(at) { const d=new Date(at), now=new Date(); return d.toDateString()===now.toDateString() ? "Today" : d.toLocaleDateString([], { weekday:"short", month:"short", day:"numeric" }); }
function commPhone(n) { const d=String(n||"").replace(/\D/g,""); return d.length===10 ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}` : n; }
function commLeadForNumber(n) { return LeadRules.byNumber(n); }
function commName(n) { const x=commLeadForNumber(n); return x ? x.name : commPhone(n); }
function commAvatar(n) {
  const x=commLeadForNumber(n), i=x ? Math.max(0,leads.findIndex(l=>l.id===x.id)) : 0;
  return `<span class="av c${(i%5)+1} comm-lead-av">${esc(initials(x?.name||commPhone(n)))}</span>`;
}
function commContactActions(n, channel="text") {
  const x=commLeadForNumber(n), email=x?.emails?.[0]?.[1]||"";
  return `<span class="comm-actions"><button type="button" data-contact-action="message" data-number="${esc(n)}" aria-label="Message">⌁</button><button type="button" data-contact-action="call" data-number="${esc(n)}" aria-label="Call">⌕</button><button type="button" data-contact-action="wa" data-number="${esc(n)}" aria-label="WhatsApp">W</button>${email?`<button type="button" data-contact-action="email" data-email="${esc(email)}" aria-label="Email">✉</button>`:""}</span>`;
}
function commMessagesForLead(l, channel) { return COMM_DATA.messages.filter(m => LeadRules.byNumber(m.number)?.id === l.id && (!channel || m.channel===channel)); }
function commCallsForLead(l) { return COMM_DATA.calls.filter(c => LeadRules.byNumber(c.number)?.id === l.id); }
function receipt(m, service) {
  if (m.dir !== "out") return "";
  if (service === "wa") {
    const ticks = m.status === "sent" ? "✓" : "✓✓";
    return `<span class="wa-ticks${m.status === "read" ? " read" : ""}" title="${m.status === "read" && m.readAt ? "Read " + commFmtTime(m.readAt) : (m.status || "sent")}">${ticks}</span>`;
  }
  if (service !== "imessage") return "";
  if (m.status === "read") return `<span class="comm-receipt">Read${m.readAt ? " " + commFmtTime(m.readAt) : ""}</span>`;
  return m.status === "delivered" ? '<span class="comm-receipt">Delivered</span>' : "";
}
function threadHtml(l, channel) {
  const rows=commMessagesForLead(l,channel).sort((a,b)=>a.at-b.at);
  if(!rows.length) return '<div class="comm-empty">No messages yet.</div>';
  let lastDay="";
  return '<div class="topbar-chat '+(channel==="wa"?"wa-chat":"")+'">'+rows.map(m=>{
    const day=commFmtDay(m.at), sep=day!==lastDay?'<div class="comm-day">'+esc(day)+'</div>':""; lastDay=day;
    const service=channel==="wa"?"wa":COMM_DATA.imessageNumbers.has(m.number)?"imessage":"sms";
    return sep+`<div class="msg-line ${m.dir}"><div class="msg-bubble ${service}">${esc(m.text)}</div><div class="msg-meta">${esc(commFmtTime(m.at))}${receipt(m,service)}</div></div>`;
  }).join("")+'</div>';
}
function threadListHtml(l, channel) {
  const rows=commMessagesForLead(l,channel);
  const groups=new Map();
  rows.forEach(m=>{ const prev=groups.get(m.number); if(!prev||m.at>prev.at) groups.set(m.number,m); });
  if(!groups.size) return '<div class="comm-empty">No conversations yet.</div>';
  return '<div class="comm-list">'+[...groups.values()].sort((a,b)=>b.at-a.at).map(m=>{
    const unread=rows.some(x=>x.number===m.number&&x.unread);
    const service=channel==="wa"?"WhatsApp":COMM_DATA.imessageNumbers.has(m.number)?"iMessage":"SMS";
    return `<button class="comm-row" type="button" data-thread="${esc(m.number)}" data-channel="${channel}">${commAvatar(m.number)}<span class="comm-row-main"><b>${esc(commName(m.number))}</b><small>${service} · ${esc(commPhone(m.number))}</small><span>${esc(m.text)}</span></span><span class="comm-row-time">${esc(commFmtTime(m.at))}${unread?'<i></i>':""}</span></button>`;
  }).join("")+'</div>';
}
function callListHtml(l) {
  const rows=commCallsForLead(l).sort((a,b)=>b.at-a.at);
  if(!rows.length) return '<div class="comm-empty">No calls yet.</div>';
  return '<div class="comm-list">'+rows.map(c=>`<div class="comm-row call-row"><span class="comm-call-icon ${c.dir}">${c.dir==="missed"?"↙":c.dir==="out"?"↗":"↙"}</span><span class="comm-row-main"><b>${esc(commName(c.number))}</b><small>${c.dir==="missed"?"Missed":c.dir==="out"?"Outgoing":"Incoming"} · Phone ${c.phone}</small><span>${esc(commPhone(c.number))}${c.seconds?" · "+Math.floor(c.seconds/60)+"m "+c.seconds%60+"s":""}</span></span><span class="comm-row-time">${esc(commFmtTime(c.at))}</span></div>`).join("")+'</div>';
}
function renderComms() {
  const l=lead(), who=$("#dockWho"); if(who) who.textContent=l.name;
  const msgBadge=$("#commMsgBadge"), callBadge=$("#commCallBadge"), emailBadge=$("#commEmailBadge");
  const unread=COMM_DATA.messages.filter(m=>m.dir==="in"&&m.unread).length;
  const missed=COMM_DATA.calls.filter(c=>c.dir==="missed"&&!c.seen).length;
  if(msgBadge) msgBadge.textContent=unread||"";
  if(callBadge) callBadge.textContent=missed||"";
  if(emailBadge) emailBadge.textContent=typeof mail!=="undefined" ? (mail.unreadCount()||"") : "";
  if(!state.comm || state.comm==="sms") state.comm="all";
  document.querySelectorAll("#commTabs button").forEach(b=>b.classList.toggle("on",b.dataset.comm===state.comm));
  const composer=$("#composer");
  if(composer) composer.classList.toggle("hidden",state.comm==="people"||state.comm==="calls"||state.comm==="all");
  if(state.comm==="mail"){
    if(composer) composer.classList.add("hidden");
    commsEl.innerHTML=`<div class="comm-panel-head email-comm-head"><b>Email</b><span>${esc(l.name)}</span></div><div id="commEmailHost" class="comm-email-host"></div>`;
    const host=document.getElementById("commEmailHost"); if(typeof mail!=="undefined"&&host) mail.mount(host,"compact");
    return;
  }
  if(state.comm==="people"){ commsEl.innerHTML=`<div class="comm-panel-head"><b>Contacts</b><span>${esc(l.company)}</span></div><div class="comm-contacts">${(l.people||[]).map((p,i)=>{const n=(l.phones||[])[i]?.[2]||(l.phones||[])[0]?.[2]||"";return `<div class="comm-contact-card"><span class="av c${(Math.max(0,leads.findIndex(x=>x.id===l.id))%5)+1}">${esc(initials(p[1]))}</span><span class="comm-contact-main"><b>${esc(p[1])}</b><small>${esc(p[0])}</small><span class="num-detail">${esc(p[2]||commPhone(n))}</span></span>${n?commContactActions(n):""}</div>`;}).join("")||'<div class="comm-empty">No people yet.</div>'}</div>`; return; }
  if(state.comm==="calls"){
    COMM_DATA.calls.filter(c=>LeadRules.byNumber(c.number)?.id===l.id).forEach(c=>c.seen=true);
    const filter=state.callFilter||"all"; const old=commCallsForLead(l), filtered=filter==="missed"?old.filter(c=>c.dir==="missed"):old;
    commsEl.innerHTML=`<div class="comm-panel-head"><b>Calls</b><span>${esc(l.name)}</span></div><div class="comm-channel-switch call-switch"><button type="button" data-call-filter="all" class="${filter==="all"?"on":""}">All</button><button type="button" data-call-filter="missed" class="${filter==="missed"?"on":""}">Missed</button></div>${filtered.length?'<div class="comm-list">'+filtered.sort((a,b)=>b.at-a.at).map(c=>`<div class="comm-row call-row"><span class="comm-call-icon ${c.dir}">${c.dir==="out"?"↗":"↙"}</span><span class="comm-row-main"><b>${esc(commName(c.number))}</b><small>${c.dir==="missed"?"Missed":c.dir==="out"?"Outgoing":"Incoming"} · Phone ${c.phone}</small><span class="num-detail">${esc(commPhone(c.number))}${c.seconds?" · "+Math.floor(c.seconds/60)+":"+String(c.seconds%60).padStart(2,"0"):" · no answer"}</span></span><span class="comm-row-time">${esc(commFmtTime(c.at))}</span></div>`).join("")+'</div>':'<div class="comm-empty">No calls.</div>'}`; return;
  }
  if(state.comm==="all"){
    const texts=commMessagesForLead(l), calls=commCallsForLead(l);
    const mails=typeof mail!=="undefined"?mail.recent().filter(m=>!m.leadId||String(m.leadId)===String(l.id)):[];
    const all=[...texts.map(x=>({...x,kind:"message"})),...calls.map(x=>({...x,kind:"call"})),...mails.map(x=>({...x,kind:"email"}))].sort((a,b)=>b.at-a.at);
    commsEl.innerHTML=`<div class="comm-panel-head"><b>Recent</b><span>${esc(l.name)}</span></div><div class="comm-list">${all.map(x=>x.kind==="email"?`<button class="comm-row" type="button" data-open-comm-email="${esc(x.id)}"><span class="comm-call-icon">✉</span><span class="comm-row-main"><b>${esc(x.name||"Email")}</b><small>Email · ${esc(x.peer||x.account||"")}</small><span>${esc(x.subject||"")}</span></span><span class="comm-row-time">${esc(commFmtTime(x.at))}</span></button>`:x.kind==="call"?`<div class="comm-row call-row"><span class="comm-call-icon ${x.dir}">${x.dir==="out"?"↗":"↙"}</span><span class="comm-row-main"><b>${x.dir==="missed"?"Missed call":x.dir==="out"?"Outgoing call":"Incoming call"}</b><small>${esc(commPhone(x.number))}</small></span><span class="comm-row-time">${esc(commFmtTime(x.at))}</span></div>`:`<button class="comm-row" type="button" data-thread="${esc(x.number)}" data-channel="${x.channel}">${commAvatar(x.number)}<span class="comm-row-main"><b>${x.channel==="wa"?"WhatsApp":COMM_DATA.imessageNumbers.has(x.number)?"iMessage":"SMS"}</b><small>${esc(commPhone(x.number))}</small><span>${esc(x.text)}</span></span><span class="comm-row-time">${esc(commFmtTime(x.at))}</span></button>`).join("")||'<div class="comm-empty">No recent communications.</div>'}</div>`; return;
  }
  const channel=state.messageChannel||"text";
  $("#box").placeholder=channel==="wa"?"Message":"iMessage";
  if(state.threadNumber){
    commsEl.innerHTML=`<div class="comm-thread-head ${channel==="wa"?"wa":""}"><button type="button" data-thread-back aria-label="Back">‹</button>${commAvatar(state.threadNumber)}<div class="comm-thread-who"><b>${esc(commName(state.threadNumber))}</b><span>${channel==="wa"?"WhatsApp":COMM_DATA.imessageNumbers.has(state.threadNumber)?"iMessage":"SMS"} · <span class="num-detail">${esc(commPhone(state.threadNumber))}</span></span></div>${commContactActions(state.threadNumber,channel)}</div>${threadHtml(l,channel)}`;
  } else {
    commsEl.innerHTML=`<div class="comm-channel-switch"><button type="button" data-msg-channel="text" class="${channel==="text"?"on":""}">Messages</button><button type="button" data-msg-channel="wa" class="${channel==="wa"?"on":""}">WhatsApp</button></div>${threadListHtml(l,channel)}`;
  }
  commsEl.scrollTop=commsEl.scrollHeight;
}
function render() { renderList(); renderDetail(); renderComms(); }


document.addEventListener("click", (e) => {
  const notesToggle = e.target.closest(".notes-toggle");
  if (notesToggle) {
    const content = notesToggle.parentElement.querySelector(".notes-content");
    const opening = content.hidden;
    content.hidden = !opening;
    notesToggle.setAttribute("aria-expanded", String(opening));
    return;
  }
  const notesSave = e.target.closest(".notes-save");
  if (notesSave) {
    const area = notesSave.closest(".notes-content").querySelector(".notes-area");
    const l = leads.find(x => x.id === notesSave.dataset.noteId);
    if (l) { l.notes = area.value; LeadRules.update(l.id, { notes: area.value }); LeadRules.log(l.id, "note", "Notes updated"); }
    toast("Notes saved");
    return;
  }
  const row = e.target.closest(".lead-row");
  if (row) { LeadRules.select(row.dataset.id); render(); return; }
  const comm = e.target.closest("[data-comm]");
  if (comm) { state.comm=comm.dataset.comm; state.threadNumber=""; renderComms(); return; }
  if(e.target.closest("#commContactsBtn")){ state.comm="people"; state.threadNumber=""; renderComms(); return; }
  const callFilter=e.target.closest("[data-call-filter]"); if(callFilter){ state.callFilter=callFilter.dataset.callFilter; renderComms(); return; }
  const emailRow=e.target.closest("[data-open-comm-email]"); if(emailRow&&typeof mail!=="undefined"){ state.comm="mail"; renderComms(); mail.openThread(emailRow.dataset.openCommEmail); return; }
    const channelBtn=e.target.closest("[data-msg-channel]");
  if(channelBtn){ state.messageChannel=channelBtn.dataset.msgChannel; state.threadNumber=""; renderComms(); return; }
  const threadBtn=e.target.closest("[data-thread]");
  if(threadBtn){ state.messageChannel=threadBtn.dataset.channel; state.threadNumber=threadBtn.dataset.thread; COMM_DATA.messages.forEach(m=>{if(m.number===state.threadNumber&&m.channel===state.messageChannel)m.unread=false;}); renderComms(); return; }
  if(e.target.closest("[data-thread-back]")){ state.threadNumber=""; renderComms(); return; }
  const contactAction=e.target.closest("[data-contact-action]");
  if(contactAction){
    const action=contactAction.dataset.contactAction, number=contactAction.dataset.number||"";
    if(action==="message"||action==="wa"){ state.comm="messages"; state.messageChannel=action==="wa"?"wa":"text"; state.threadNumber=number; renderComms(); return; }
    if(action==="call"){ const x=LeadRules.byNumber(number); if(x){ LeadRules.perform("call",x.id,number); toast("Call added to activity"); } return; }
    if(action==="email"){ state.comm="mail"; renderComms(); return; }
  }
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
  const ruleKind = state.comm === "mail" ? "email" : state.comm === "calls" || state.comm === "people" ? "call" : (state.messageChannel === "wa" ? "wa" : "sms");
  const target = LeadRules.target(ruleKind, l);
  if (state.comm === "messages" && state.threadNumber && text) { COMM_DATA.messages.push({id:"cm"+Date.now(),channel:state.messageChannel||"text",number:state.threadNumber,dir:"out",text,at:Date.now(),phone:1,unread:false,status:"sent"}); }
  if (target) LeadRules.perform(ruleKind, l.id, target);
  else LeadRules.log(l.id, ruleKind, body);
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


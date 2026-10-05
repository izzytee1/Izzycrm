function audience() {
  const fromLeads = leads.map((l) => ({
    id: l.id, company: l.company, contact: l.name, rep: l.owner || "Cole Brennan",
    email: (l.emails && l.emails[0] && l.emails[0][1]) || "",
    mobile: ((l.phones || []).find((p) => p[0] === "Mobile") || ["", ""])[1],
    state: (l.city || "").split(", ").pop() || "",
    city: (l.city || "").split(",")[0],
    status: l.stage, revenue: l.amount || 0, whatsapp: !l.smsUnsub, contacted: (l.sms || []).length + (l.mail || []).length > 0,
    emailUnsub: !!l.emailUnsub, smsUnsub: !!l.smsUnsub, leadId: l.id
  }));
  return fromLeads.concat(extraAudience.map((r) => Object.assign({ leadId: "", emailUnsub: false, smsUnsub: false }, r)));
}
function sideMatches(side, row) {
  if (!side.reps.includes(row.rep)) return false;
  if (side.status !== "all" && row.status !== side.status) return false;
  if (side.state && row.state !== side.state) return false;
  if (side.city && !String(row.city).toLowerCase().includes(side.city.toLowerCase())) return false;
  if (side.revenue && row.revenue < Number(side.revenue)) return false;
  if (side.contacted === "yes" && !row.contacted) return false;
  if (side.contacted === "no" && row.contacted) return false;
  return true;
}
function destinations(side) {
  return audience().filter((row) => sideMatches(side, row)).filter((row) => side.channel === "Email" ? row.email && !row.emailUnsub : row.mobile && !row.smsUnsub && (side.channel !== "WhatsApp" || row.whatsapp));
}
function fillTemplate(body, row, rep) {
  const parts = String(row.contact || "").split(" ");
  return body.replace(/\{\{first\}\}/g, parts[0] || "").replace(/\{\{last\}\}/g, parts.slice(1).join(" ")).replace(/\{\{company\}\}/g, row.company || "").replace(/\{\{rep\}\}/g, rep || row.rep).replace(/\{\{repPhone\}\}/g, "(917) 555-0101").replace(/\{\{repEmail\}\}/g, "cole@forgecapital.com");
}

function renderSide(key) {
  const side = campaign[key];
  const rows = destinations(side);
  const templates = key === "email" ? emailTemplates : smsTemplates;
  const tpl = templates[side.template];
  const sample = rows[0];
  const preview = sample ? fillTemplate(tpl.body, sample, side.reps[0] || sample.rep) : "No matching recipients.";
  const senders = key === "email" ? emailSenders : smsPhones;
  return `<section class="panel"><div class="panel-h">${key === "email" ? "Email" : "SMS"}</div><div class="panel-b">
    <div class="field">Campaign<input class="camp-name" data-camp="${key}" data-k="name" value="${esc(side.name)}"></div>
    <div class="count-line"><span>${rows.length} destinations</span><span>${side.run}</span></div>
    <div class="rep-box">${campaignReps.map(r => `<label><input type="checkbox" data-camp-rep="${key}" value="${esc(r)}" ${side.reps.includes(r) ? "checked" : ""}>${esc(r.split(" ")[0])}</label>`).join("")}<button class="btn" data-rep-all="${key}" type="button" style="height:30px">All</button><button class="btn" data-rep-clear="${key}" type="button" style="height:30px">Clear</button></div>
    <div class="filters" style="margin-top:4px">
      <label>Status<select data-camp="${key}" data-k="status">${["all", "New", "Contacted", "Qualified", "In review", "Approved", "Funded", "Attempted"].map(s => `<option ${side.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
      <label>State<select data-camp="${key}" data-k="state"><option value="">All</option>${["NY", "NJ"].map(s => `<option ${side.state === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
      <label>Template<select data-camp="${key}" data-k="template">${Object.keys(templates).map(id => `<option value="${id}" ${side.template === id ? "selected" : ""}>${esc(templates[id].name)}</option>`).join("")}</select></label>
      ${key === "sms" ? `<label>Channel<select data-camp="sms" data-k="channel"><option ${side.channel === "SMS" ? "selected" : ""}>SMS</option><option ${side.channel === "WhatsApp" ? "selected" : ""}>WhatsApp</option></select></label>` : `<label>Mode<select data-camp="email" data-k="mode"><option value="individual" ${side.mode === "individual" ? "selected" : ""}>Individual</option><option value="bcc" ${side.mode === "bcc" ? "selected" : ""}>BCC</option></select></label>`}
      <button class="btn" data-adv="${key}" type="button" style="height:30px">Filters</button>
    </div>
    <div class="adv ${side.adv ? "open" : ""}">
      <label>City<input data-camp="${key}" data-k="city" value="${esc(side.city)}"></label>
      <label>Min revenue<input data-camp="${key}" data-k="revenue" type="number" value="${side.revenue || ""}"></label>
      <label>Contacted<select data-camp="${key}" data-k="contacted"><option value="all">All</option><option value="yes" ${side.contacted === "yes" ? "selected" : ""}>Previously contacted</option><option value="no" ${side.contacted === "no" ? "selected" : ""}>Not contacted</option></select></label>
      <label>Delay sec<input data-camp="${key}" data-k="delay" type="number" value="${side.delay}"></label>
    </div>
    <div class="field" style="margin-top:4px">Senders<div class="rep-box">${senders.map(s => `<label><input type="checkbox" data-sender="${key}" value="${esc(s)}" ${side.senders.includes(s) ? "checked" : ""}>${esc(s)}</label>`).join("")}</div></div>
    <div class="tpl">${esc(preview)}${key === "sms" ? `<div class="sub">${preview.length} characters</div>` : ""}</div>
    <div class="preview-row" style="margin-top:4px"><b>Company</b><b>Contact</b><b>Rep</b><b>Destination</b></div>
    ${rows.slice(0, 4).map(r => `<div class="preview-row"><span class="camp-co">${esc(r.company)}</span><span>${esc(r.contact)}</span><span class="sub">${esc(r.rep.split(" ")[0])}</span><span class="mono">${esc(key === "email" ? r.email : r.mobile)}</span></div>`).join("")}
    <div class="scan-controls" style="margin-top:4px">
      <button class="btn" data-draft="${key}" type="button">Draft</button>
      <button class="btn solid" data-start="${key}" type="button">Start</button>
      <button class="btn" data-pause="${key}" type="button">Pause</button>
      <button class="btn" data-resume="${key}" type="button">Resume</button>
      <button class="btn" data-stop="${key}" type="button">Stop</button>
    </div>
    <div class="count-line"><span>Sent ${side.sent}</span><span>Delivered ${side.delivered}</span><span>${key === "email" ? "Opened" : "Read"} ${side.opened}</span><span>Replies ${side.replies}</span><span>Failed ${side.failed}</span></div>
    <div class="count-line"><span>Elapsed ${side.elapsed}s</span><span>Remaining ${side.queue.length ? Math.max(0, (side.queue.length - side.index) * side.delay) : 0}s</span></div>
  </div></section>`;
}
function feedBlock(items) {
  return items.slice(0, 8).map(f => `<div class="feed-row"><span class="sub">${esc(f.time)}</span><span>${esc(f.channel)}</span><span>${esc(f.contact)} · <span class="camp-co">${esc(f.company)}</span></span><span class="sub">${esc(f.result)}</span></div>`).join("") || `<div class="sub">No sends yet.</div>`;
}
function renderCampaign() {
  $("#campaignView").innerHTML = `<div class="camp">
    <div class="camp-split">${renderSide("email")}${renderSide("sms")}</div>
    <div class="camp-lower">
      <section class="panel"><div class="panel-h">Email live feed</div><div class="panel-b" id="emailFeed">${feedBlock(campaign.email.feed)}</div></section>
      <section class="panel"><div class="panel-h">SMS live feed</div><div class="panel-b" id="smsFeed">${feedBlock(campaign.sms.feed)}</div></section>
    </div>
    <section class="panel"><div class="panel-h">History</div><div class="panel-b">${campaignHistory.map(h => `<div class="hist-row"><b class="camp-name">${esc(h.name)}</b><span>${esc(h.channel)}</span><span class="sub">${esc(h.by.split(" ")[0])}</span><span class="mono">${h.sent}</span><span class="mono">${h.replies}</span><span class="sub">${esc(h.status)}</span></div>`).join("")}</div></section>
  </div>`;
}
function pushActivity(rec) { activityRecords.unshift(rec); }
function validateSide(side) {
  const rows = destinations(side);
  if (!side.name.trim()) return "Name the campaign";
  if (!rows.length) return "No recipients";
  if (!side.template) return "Choose a template";
  if (!side.senders.length) return "Choose a sender";
  return "";
}
function confirmStart(key) {
  const side = campaign[key];
  const err = validateSide(side);
  if (err) { toast(err); return; }
  const rows = destinations(side);
  $("#overlay").classList.remove("hidden");
  $("#overlay").innerHTML = `<form class="sheet" id="campConfirm"><h2>Start ${esc(side.name)}</h2>
    <p class="summary">${esc(side.channel)} · ${rows.length} recipients · ${esc(side.reps.join(", ") || "No reps")} · ${esc((key === "email" ? emailTemplates : smsTemplates)[side.template].name)} · ${esc(side.senders.join(", "))} · ${esc(side.mode || side.channel)} · ${side.when} · ${side.delay}s delay</p>
    <div class="actions"><button class="btn" type="button" id="cancelLead">Cancel</button><button class="btn solid" type="submit">Start</button></div></form>`;
  $("#campConfirm").addEventListener("submit", (e) => { e.preventDefault(); $("#overlay").classList.add("hidden"); beginSend(key); });
}
function beginSend(key) {
  const side = campaign[key];
  side.queue = destinations(side);
  side.index = 0; side.sent = 0; side.delivered = 0; side.opened = 0; side.replies = 0; side.failed = 0; side.run = "sending"; side.elapsed = 0;
  pushActivity({ id: "c" + Date.now(), group: "Today", time: nowLabel(), type: "Campaign started", action: "Started " + side.name, company: side.queue[0].company, contact: side.queue[0].contact, rep: side.reps[0] || "Cole Brennan", channel: side.channel, result: "Sending", detail: side.name, campaign: side.name });
  clearInterval(side.timer);
  side.timer = setInterval(() => tickSend(key), Math.max(400, side.delay * 200));
  renderCampaign();
}
function tickSend(key) {
  const side = campaign[key];
  if (side.run !== "sending") return;
  side.elapsed += side.delay;
  const row = side.queue[side.index];
  if (!row) { side.run = "completed"; clearInterval(side.timer); pushActivity({ id: "d" + Date.now(), group: "Today", time: nowLabel(), type: "Campaign completed", action: "Completed " + side.name, company: "", contact: "", rep: side.reps[0] || "", channel: side.channel, result: "Completed", detail: side.name, campaign: side.name }); renderCampaign(); return; }
  side.index += 1; side.sent += 1; side.delivered += 1;
  if (side.channel === "Email" && side.index % 2 === 0) side.opened += 1;
  side.feed.unshift({ time: nowLabel(), channel: side.channel, contact: row.contact, company: row.company, result: "Sent" });
  const lead = leads.find((l) => l.id === row.leadId);
  if (lead) {
    const body = fillTemplate((key === "email" ? emailTemplates : smsTemplates)[side.template].body, row, side.reps[0]);
    if (key === "email") lead.mail.push(["out", body, nowLabel()]);
    else lead.sms.push(["out", body, nowLabel()]);
    if (["New", "Contacted"].includes(lead.stage)) lead.stage = "Attempted";
  }
  pushActivity({ id: "s" + Date.now(), group: "Today", time: nowLabel(), type: key === "email" ? "Email sent" : "SMS sent", action: "Campaign send", company: row.company, contact: row.contact, rep: row.rep, channel: side.channel, result: "Sent", detail: side.name, leadId: row.leadId, campaign: side.name });
  if (state.view === "campaign") renderCampaign();
}

function bindCampaignPage(){
  $("#campaignView").addEventListener("input",e=>{const key=e.target.dataset.camp;if(!key)return;campaign[key][e.target.dataset.k]=e.target.value;});
  $("#campaignView").addEventListener("change",e=>{const key=e.target.dataset.camp;if(key){campaign[key][e.target.dataset.k]=e.target.value;renderCampaign();}if(e.target.dataset.campRep)campaign[e.target.dataset.campRep].reps=[...document.querySelectorAll(`[data-camp-rep="${e.target.dataset.campRep}"]:checked`)].map(n=>n.value);if(e.target.dataset.sender)campaign[e.target.dataset.sender].senders=[...document.querySelectorAll(`[data-sender="${e.target.dataset.sender}"]:checked`)].map(n=>n.value);if(e.target.dataset.campRep||e.target.dataset.sender)renderCampaign();});
  $("#campaignView").addEventListener("click",e=>{const all=e.target.closest("[data-rep-all]"),clear=e.target.closest("[data-rep-clear]"),adv=e.target.closest("[data-adv]"),draft=e.target.closest("[data-draft]"),start=e.target.closest("[data-start]"),pause=e.target.closest("[data-pause]"),resume=e.target.closest("[data-resume]"),stop=e.target.closest("[data-stop]");if(all){campaign[all.dataset.repAll].reps=campaignReps.slice();renderCampaign();}if(clear){campaign[clear.dataset.repClear].reps=[];renderCampaign();}if(adv){campaign[adv.dataset.adv].adv=!campaign[adv.dataset.adv].adv;renderCampaign();}if(draft){campaign[draft.dataset.draft].run="draft";toast("Draft saved");renderCampaign();}if(start)confirmStart(start.dataset.start);if(pause){const s=campaign[pause.dataset.pause];if(s.run==="sending"){s.run="paused";clearInterval(s.timer);toast("Paused");renderCampaign();}else toast("Nothing to pause");}if(resume){const s=campaign[resume.dataset.resume];if(s.run==="paused"){s.run="sending";s.timer=setInterval(()=>tickSend(resume.dataset.resume),Math.max(400,s.delay*200));renderCampaign();}else toast("Nothing to continue");}if(stop){const s=campaign[stop.dataset.stop];if(s.run==="sending"||s.run==="paused"){s.run="stopped";clearInterval(s.timer);toast("Stopped");renderCampaign();}else toast("Nothing to stop");}});
}

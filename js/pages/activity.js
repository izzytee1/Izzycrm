function activityFiltered() {
  return activityRecords.filter((r) => {
    if (activityState.type !== "all" && r.type !== activityState.type) return false;
    if (activityState.channel !== "all" && r.channel !== activityState.channel) return false;
    if (!activityState.reps.includes(r.rep)) return false;
    if (activityState.company !== "all" && r.company !== activityState.company) return false;
    if (activityState.range !== "all" && r.group !== activityState.range) return false;
    if (activityState.result !== "all" && r.result !== activityState.result) return false;
    const q = activityState.q.trim().toLowerCase();
    if (!q) return true;
    return [r.company, r.contact, r.rep, r.action, r.detail, r.phone, r.subject].join(" ").toLowerCase().includes(q);
  });
}
function renderActivity() {
  const rows = activityFiltered();
  const companies = Array.from(new Set(activityRecords.map((r) => r.company)));
  const types = Array.from(new Set(activityRecords.map((r) => r.type)));
  const results = Array.from(new Set(activityRecords.map((r) => r.result)));
  let last = "";
  const feed = rows.map((r) => {
    const day = r.group !== last ? `<div class="day">${esc(r.group)}</div>` : "";
    last = r.group;
    const open = activityState.open === r.id ? `<div class="act-detail">${esc(r.detail)}${r.subject ? " · " + esc(r.subject) : ""}${r.duration ? " · " + esc(r.duration) : ""}${r.campaign ? " · " + esc(r.campaign) : ""}${r.from ? " · " + esc(r.from) + " → " + esc(r.to) : ""}${r.leadId ? ` <button class="btn" data-open-lead="${esc(r.leadId)}" type="button" style="height:26px;padding:0 8px;font-size:11px">Open lead</button>` : ""}</div>` : "";
    return `${day}<button class="act-row" data-act="${esc(r.id)}"><span><b>${esc(r.company)}</b><div class="sub">${esc(r.contact)}</div></span><span>${esc(r.action)}</span><span class="sub">${esc(r.channel)}</span><span class="sub">${esc(r.rep.split(" ")[0])}</span><span class="sub">${esc(r.result)}</span><span class="sub">${esc(r.time)}</span></button>${open}`;
  }).join("");
  const today = activityRecords.filter((r) => r.group === "Today").length;
  $("#activityView").innerHTML = `<div class="act">
    <section class="panel act-one"><div class="panel-h">Filters</div><div class="panel-b filters">
      <label>Search<input id="actQ" value="${esc(activityState.q)}" placeholder="Company, contact, rep"></label>
      <label>Type<select id="actType">${["all"].concat(types).map(t => `<option ${t === activityState.type ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
      <label>Channel<select id="actChannel">${["all", "Calls", "Email", "SMS", "WhatsApp", "Scanner", "CRM"].map(t => `<option ${t === activityState.channel ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
      <label>Company<select id="actCo"><option value="all">all</option>${companies.map(c => `<option ${c === activityState.company ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
      <label>Date<select id="actRange">${["all", "Today", "Yesterday", "Earlier"].map(t => `<option ${t === activityState.range ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
      <label>Result<select id="actResult">${["all"].concat(results).map(t => `<option ${t === activityState.result ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
      <div class="rep-box">${activityReps.map(r => `<label><input type="checkbox" data-act-rep="${esc(r)}" ${activityState.reps.includes(r) ? "checked" : ""}>${esc(r.split(" ")[0])}</label>`).join("")}<button class="btn" id="actAll" type="button" style="height:30px">All reps</button><button class="btn" id="actClear" type="button" style="height:30px">Clear</button></div>
    </div>
    <div class="panel-h">History</div><div class="panel-b">${feed || `<div class="sub">No matches.</div>`}</div></section>
  </div>`;
}

function bindActivityPage(){
  $("#activityView").addEventListener("input", (e) => {
    if (e.target.id !== "actQ") return;
    activityState.q = e.target.value;
    const caret = e.target.selectionStart ?? activityState.q.length;
    requestAnimationFrame(() => {
      renderActivity();
      const input = $("#actQ");
      if (input) { input.focus({ preventScroll: true }); input.setSelectionRange(caret, caret); }
    });
  });
  $("#activityView").addEventListener("change", (e) => {
    if (e.target.id === "actType") activityState.type = e.target.value;
    if (e.target.id === "actChannel") activityState.channel = e.target.value;
    if (e.target.id === "actCo") activityState.company = e.target.value;
    if (e.target.id === "actRange") activityState.range = e.target.value;
    if (e.target.id === "actResult") activityState.result = e.target.value;
    if (e.target.dataset.actRep) activityState.reps = [...document.querySelectorAll("[data-act-rep]:checked")].map(n => n.dataset.actRep);
    renderActivity();
  });
  $("#activityView").addEventListener("click", (e) => {
    const row=e.target.closest("[data-act]"); if(row){activityState.open=activityState.open===row.dataset.act?"":row.dataset.act;renderActivity();}
    if(e.target.id==="actAll"){activityState.reps=activityReps.slice();renderActivity();}
    if(e.target.id==="actClear"){activityState.reps=[];renderActivity();}
    const lead=e.target.closest("[data-open-lead]"); if(lead){state.id=lead.dataset.openLead;setView("leads");}
  });
}

const CRM_ROUTES = new Set(["leads", "email", "scanner", "campaign", "activity"]);

function routeFromHash() {
  const route = (location.hash || "").slice(1).toLowerCase();
  return CRM_ROUTES.has(route) ? route : "leads";
}

function resetViewportTop() {
  requestAnimationFrame(() => window.scrollTo(window.scrollX, 0));
}

function setView(name) {
  const route = CRM_ROUTES.has(name) ? name : "leads";
  state.view = route;
  document.body.dataset.page = route === "email" ? "mail" : route;
  document.querySelectorAll(".nav-links a").forEach((a) => a.classList.toggle("on", a.dataset.nav === route));
  $("#leadsView").classList.toggle("hidden", route !== "leads");
  $("#scannerView").classList.toggle("hidden", route !== "scanner");
  $("#activityView").classList.toggle("hidden", route !== "activity");
  $("#campaignView").classList.toggle("hidden", route !== "campaign");
  $("#emailView").classList.toggle("hidden", route !== "email");
  if (route === "leads") render();
  if (route === "scanner") renderScanner();
  if (route === "activity") renderActivity();
  if (route === "campaign") renderCampaign();
  if (route === "email") mail.mount(document.getElementById("emailHost"), "full");
  resetViewportTop();
}

function syncRoute() {
  const route = routeFromHash();
  if (location.hash !== "#" + route) history.replaceState(null, "", "#" + route);
  setView(route);
}

function bindNavigation() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  document.addEventListener("click", (e) => {
    const nav = e.target.closest(".nav-links [data-nav]");
    if (!nav) return;
    const route = nav.dataset.nav;
    if (!CRM_ROUTES.has(route)) return;
    e.preventDefault();
    if (location.hash !== "#" + route) history.pushState(null, "", "#" + route);
    setView(route);
  });
  window.addEventListener("popstate", syncRoute);
  window.addEventListener("hashchange", syncRoute);
}

function bindPages(){
  const main=document.querySelector('.main');let drag=null;
  document.querySelectorAll('.resize').forEach(handle=>{handle.addEventListener('pointerdown',e=>{const panel=handle.dataset.panel==='1'?document.querySelector('#panel1'):document.querySelector('#desk');drag={handle,panel,x:e.clientX,w:panel.getBoundingClientRect().width};handle.classList.add('on');handle.setPointerCapture(e.pointerId);});handle.addEventListener('pointermove',e=>{if(!drag||drag.handle!==handle)return;const width=Math.max(220,drag.w+e.clientX-drag.x);main.style.setProperty(drag.panel.id==='panel1'?'--p1':'--p2',width+'px');});handle.addEventListener('pointerup',()=>{handle.classList.remove('on');drag=null;});});
  $('#scannerView').addEventListener('click',e=>{if(e.target.closest('#dropZone'))$('#scanFile').click();if(e.target.closest('#scanStart'))scannerAdapter.start();if(e.target.closest('#scanPause'))scannerAdapter.pause();if(e.target.closest('#scanResume'))scannerAdapter.resume();if(e.target.closest('#scanStop'))scannerAdapter.stop();if(e.target.closest('#scanExport'))scannerAdapter.exportXlsx();if(e.target.closest('#scanClear'))scannerAdapter.clearStorage();if(e.target.closest('#saveSettings'))saveSettings();if(e.target.closest('#auditToggle')){scannerSession.auditOpen=!scannerSession.auditOpen;$('#auditToggle').textContent=scannerSession.auditOpen?'Hide':'Show';paintScanner();}if(e.target.closest('#gridToggle')){const wrap=$('#gridWrap');const open=wrap.style.display==='none';wrap.style.display=open?'':'none';$('#gridToggle').textContent=open?'Close':'Open';}});
  $('#scannerView').addEventListener('change',e=>{if(e.target.id==='scanFile')scannerAdapter.ingest(e.target.files);if(e.target.id==='scanSort'){scannerSession.sort=e.target.value;reorderRows();}});
  $('#scannerView').addEventListener('dragover',e=>{if(!e.target.closest('#dropZone'))return;e.preventDefault();$('#dropZone').classList.add('on');});
  $('#scannerView').addEventListener('dragleave',e=>{if(e.target.closest('#dropZone'))$('#dropZone').classList.remove('on');});
  $('#scannerView').addEventListener('drop',e=>{if(!e.target.closest('#dropZone'))return;e.preventDefault();$('#dropZone').classList.remove('on');scannerAdapter.ingest(e.dataTransfer.files);});
  $('#scannerView').addEventListener('pointerdown',e=>{const handle=e.target.closest('.col-resizer');if(!handle)return;const th=handle.parentElement,x=e.clientX,w=th.getBoundingClientRect().width;const move=ev=>{th.style.width=Math.max(48,w+ev.clientX-x)+'px';th.style.minWidth=th.style.width;};const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);});
}
function boot() {
  document.body.classList.add("js-ready");
  loadSettings();
  bindActivityPage();
  bindCampaignPage();
  bindPages();
  bindNavigation();
  if (location.hash !== "#leads") history.replaceState(null, "", location.pathname + location.search + "#leads");
  setView("leads");
}

boot();
mail.ready.catch(() => {});

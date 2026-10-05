const state = { id: "ns", q: "", comm: "sms", fileName: "", view: "leads", stage: "all", sort: "newest" };
const $ = (s) => document.querySelector(s);
let toastTimer = 0;
function esc(s) { return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
function nowLabel() { return new Date().toLocaleTimeString([], {hour:"numeric", minute:"2-digit"}); }
function toast(msg, actions = [], ms = actions.length ? 10000 : 2200) {
  const el = $("#toast");
  if (!el) return;
  el.innerHTML = `<span>${esc(msg)}</span>${actions.map((a,i)=>` <button type="button" data-toast-action="${i}" style="margin-left:8px;border:0;background:transparent;color:inherit;text-decoration:underline;cursor:pointer">${esc(a.label)}</button>`).join("")}`;
  el._actions = actions; el.classList.remove("hidden"); clearTimeout(toastTimer); toastTimer = setTimeout(()=>el.classList.add("hidden"), ms);
}
document.addEventListener("click",e=>{ const b=e.target.closest("[data-toast-action]"); if(!b)return; const el=$("#toast"); const a=el?._actions?.[Number(b.dataset.toastAction)]; el?.classList.add("hidden"); if(a?.run)a.run(); });

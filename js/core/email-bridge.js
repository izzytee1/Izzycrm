const store = {
  read(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v??fallback;}catch{return fallback;}},
  write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{dispatchEvent(new Event('savefail'));return false;}}
};
const sample=(key,empty)=>(window.SAMPLE_DATA||{})[key]??empty;
const user={name:'Sam'};
const canSee=rep=>true;
const person=name=>({name,full:name||'Sam',title:''});
const fullName=l=>l?.name||'';
function avatar(name,{photo='',size='',tint='',letters=2}={}){const words=String(name||'').trim().split(/\s+/).filter(Boolean);const init=((words[0]||'')[0]||'')+(words.length>1?words[words.length-1][0]:'');return `<span class=\"avatar ${esc(size)}\" style=\"--avatar-tint:${esc(tint||'#8B949E')}\">${photo?`<img src=\"${esc(photo)}\" alt=\"\">`:esc(init.slice(0,letters).toUpperCase()||'?')}</span>`;}
function suggestReply({kind='email',text='',lead=null}={}){const t=String(text).toLowerCase();if(t.includes('when')||t.includes('timeline'))return 'Thanks for checking in. I’ll confirm the timing and follow up shortly.';if(t.includes('question')||t.includes('?'))return 'Thanks for the note. I’ll review this and get you a clear answer shortly.';return 'Thanks for the update. I’ll review this and follow up shortly.';}
function writeFromPrompt(prompt,{name='',tone='professional',length='medium',sender=''}={}){const hello=name?`Hi ${name},\n\n`:'';const sign=sender?`\n\nBest,\n${sender}`:'';return {subject:String(prompt).slice(0,72)||'Follow-up',text:`${hello}${String(prompt).trim()}${sign}`};}
function logActivity(leadId,kind,detail){if(typeof activityRecords!=='undefined'){const l=leads.find(x=>x.id===leadId);activityRecords.unshift({id:'mail-'+Date.now(),group:'Today',time:nowLabel(),type:'Email sent',action:detail||'Email sent',company:l?.company||'',contact:l?.name||'',rep:user.name,channel:'Email',result:'Sent',detail:detail||'',leadId});}}
const leadByEmail=email=>leads.find(l=>(l.emails||[]).some(e=>String(Array.isArray(e)?e[1]:e).toLowerCase()===String(email).toLowerCase()))||null;
const ago=minutes=>Date.now()-minutes*60000;
const ZONE='America/New_York';
const _tf=new Map();
function _timeFormat(opts,zone=ZONE){const k=zone+JSON.stringify(opts);if(!_tf.has(k))_tf.set(k,new Intl.DateTimeFormat('en-US',{timeZone:zone,...opts}));return _tf.get(k);}
const showTime=(ts,opts,zone)=>_timeFormat(opts,zone).format(ts);
const clockTime=(ts,zone)=>showTime(ts,{hour:'numeric',minute:'2-digit'},zone);
const WEEKDAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function wall(ts=Date.now()){const p=Object.fromEntries(_timeFormat({year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',weekday:'short',hourCycle:'h23'}).formatToParts(ts).map(x=>[x.type,x.value]));return{y:+p.year,mo:p.month-1,d:+p.day,h:+p.hour%24,mi:+p.minute,wd:WEEKDAYS.indexOf(p.weekday)};}
function fromWall(y,mo,d,h=0,mi=0){const want=Date.UTC(y,mo,d,h,mi);const offset=t=>{const w=wall(t);return Date.UTC(w.y,w.mo,w.d,w.h,w.mi)-t;};return want-offset(want-offset(want));}
function daysAgo(ts){const a=wall(),b=wall(ts);return Math.round((Date.UTC(a.y,a.mo,a.d)-Date.UTC(b.y,b.mo,b.d))/86400000);}
const pad2=n=>String(n).padStart(2,'0');
const inputValue=ts=>{const w=wall(ts);return `${w.y}-${pad2(w.mo+1)}-${pad2(w.d)}T${pad2(w.h)}:${pad2(w.mi)}`;};
function fromInput(text){const m=String(text).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);return m?fromWall(+m[1],m[2]-1,+m[3],+m[4],+m[5]):NaN;}
function timeAgo(ts){const m=Math.floor((Date.now()-ts)/60000);if(m<1)return'Just now';if(m<60)return m+'m ago';const h=Math.floor(m/60);if(h<24)return h+'h ago';const d=Math.floor(h/24);return(d<7?d+'d':Math.floor(d/7)+'w')+' ago';}
const rem=n=>n/16+'rem';
const mi=(name,size=16,width=size)=>`<svg class="mi" width="${rem(width)}" height="${rem(size)}" aria-hidden="true"><use href="#m-${name}"/></svg>`;
const ic=(name,size=16)=>`<svg class="ic" width="${rem(size)}" height="${rem(size)}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const clamp=(v,lo,hi)=>Math.min(Math.max(v,lo),hi);
const pop=document.getElementById('emailPop'); let popAnchor=null; let popItems=[];
function openPop(anchor,items,{list=false}={}){popAnchor=anchor;popItems=items;pop.hidden=false;pop.className='email-pop'+(list?' list':'');pop.innerHTML=items.map((it,i)=>it.run?`<button class="${it.cls||''}" data-email-pop="${i}" type="button">${it.icon?ic(it.icon,13):''}${esc(it.label)}</button>`:`<div class="pop-note">${esc(it.label)}</div>`).join('');const r=anchor.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;pop.style.left=clamp(r.left,8,innerWidth-w-8)+'px';pop.style.top=clamp(r.bottom+6+h>innerHeight-8?r.top-6-h:r.bottom+6,8,innerHeight-h-8)+'px';}
function closePop(){popAnchor=null;popItems=[];pop.hidden=true;}
pop.addEventListener('click',e=>{const b=e.target.closest('[data-email-pop]');if(!b)return;const item=popItems[Number(b.dataset.emailPop)];closePop();item?.run?.();});
addEventListener('scroll',closePop,true);
const askBox=document.getElementById('emailAskDialog');
function ask({title,text='',html='',ok='',danger=false}){return new Promise(resolve=>{askBox.innerHTML=`<div class="email-ask-head">${esc(title)}</div><div class="email-ask-body">${html||esc(text)}</div><div class="email-ask-foot"><button class="btn" type="button" data-ask="cancel">Cancel</button>${ok?`<button class="btn ${danger?'':'solid'}" type="button" data-ask="ok">${esc(ok)}</button>`:''}</div>`;askBox.showModal();askBox.addEventListener('click',function h(e){const b=e.target.closest('[data-ask]');if(!b)return;askBox.removeEventListener('click',h);const yes=b.dataset.ask==='ok';askBox.close();resolve(yes);});});}
function onMailChange(){}

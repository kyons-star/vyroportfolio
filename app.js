"use strict";
(() => {
const CFG = window.VYRO_CONFIG || {};
const KEY=CFG.STORAGE_KEY;let mem=null;
const seed={name:"Maria Santos",email:"maria.santos@email.com",phone:"+63 912 345 6789",address:"Cebu City, Philippines",about:"Third-year IT student who enjoys building clean, usable websites and learning how people interact with software.",photo:"",skills:["HTML","CSS","JavaScript","Supabase","UI Design","Figma"],edu:[{school:"Cebu Technological University",degree:"BS Information Technology",years:"2023 - Present"},{school:"Cebu City National Science High School",degree:"STEM Strand",years:"2021 - 2023"}],projects:[{title:"Barangay Info System",desc:"Web app for resident records",link:""},{title:"Cafe Menu App",desc:"Responsive ordering page",link:""}],exp:[{role:"Intern, Web Support",company:"Local Government Office",years:"2025"},{role:"Freelance Designer",company:"Posters and logos",years:"2024"}],links:[{label:"GitHub",url:"github.com/mariasantos"},{label:"LinkedIn",url:"linkedin.com/in/mariasantos"}],template:2,updatedAt:Date.now()};
function rd(){try{const r=localStorage.getItem(KEY);if(r)return JSON.parse(r)}catch(e){}return mem||(mem={p_demo:{...seed}})}
function wr(o){mem=o;try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}}
async function lcreate(d){const o=rd(),id="p"+Date.now().toString(36);o[id]={template:1,...d,updatedAt:Date.now()};wr(o);return id}
async function lread(id){const o=rd();return o[id]?{id,...o[id]}:null}
async function lreadAll(){return Object.entries(rd()).map(([id,v])=>({id,...v})).sort((a,b)=>b.updatedAt-a.updatedAt)}
async function lupdate(id,d){const o=rd();o[id]={...o[id],...d,updatedAt:Date.now()};wr(o)}
async function ldelete(id){const o=rd();delete o[id];wr(o);try{const c=crdAll();delete c[id];cwr(c)}catch(e){}}
/* ---- Comments ----
   Local mode (default): saved in this browser.
   Online mode: fill in both values below. Needs two Supabase tables (portfolios + comments):
     create table portfolios (id text primary key, data jsonb not null, updated_at bigint not null);
     alter table portfolios enable row level security;
     create policy "p_read" on portfolios for select using (true);
     create policy "p_add" on portfolios for insert with check (true);
     create policy "p_edit" on portfolios for update using (true);
     create policy "p_remove" on portfolios for delete using (true);
     create table comments (id uuid primary key default gen_random_uuid(), portfolio_id text not null,
       name text not null, body text not null, created_at timestamptz default now());
     alter table comments enable row level security;
     create policy "read" on comments for select using (true);
     create policy "add" on comments for insert with check (true);
     create policy "remove" on comments for delete using (true);  -- anyone can delete; tighten once you add logins */
const SUPABASE_URL=CFG.SUPABASE_URL,SUPABASE_KEY=CFG.SUPABASE_KEY,CKEY=CFG.COMMENTS_KEY,COMMENTS_ON=!!(SUPABASE_URL&&SUPABASE_KEY);
let cmem={};
function crdAll(){try{const r=localStorage.getItem(CKEY);if(r)return JSON.parse(r)}catch(e){}return cmem}
function cwr(o){cmem=o;try{localStorage.setItem(CKEY,JSON.stringify(o))}catch(e){}}
const sbq=(tbl,path,opt={})=>fetch(SUPABASE_URL+"/rest/v1/"+tbl+path,{...opt,headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY,"Content-Type":"application/json",...(opt.headers||{})}}).then(async r=>{if(!r.ok)throw new Error(await r.text()||r.statusText);const t=await r.text();return t?JSON.parse(t):null});
const sb=(path,opt)=>sbq("comments",path,opt);
const isOnline=COMMENTS_ON;
async function readComments(pid){
  if(COMMENTS_ON)return (await sb("?portfolio_id=eq."+encodeURIComponent(pid)+"&order=created_at.desc")).map(c=>({id:c.id,name:c.name,body:c.body,at:Date.parse(c.created_at)}));
  return (crdAll()[pid]||[]).slice().sort((a,b)=>b.at-a.at)}
async function addComment(pid,name,body){
  if(COMMENTS_ON){await sb("",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({portfolio_id:pid,name,body})});return}
  const o=crdAll();(o[pid]=o[pid]||[]).push({id:"c"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name,body,at:Date.now()});cwr(o)}
async function deleteComment(pid,cid){
  if(COMMENTS_ON){await sb("?id=eq."+encodeURIComponent(cid),{method:"DELETE"});return}
  const o=crdAll();o[pid]=(o[pid]||[]).filter(c=>c.id!==cid);cwr(o)}

const pid_=()=>"p"+Date.now().toString(36)+Math.random().toString(36).slice(2,4);
const prow=(r)=>({id:r.id,...r.data,updatedAt:Number(r.updated_at)});
async function createPortfolio(d){
  if(!COMMENTS_ON)return lcreate(d);
  const id=pid_();await sbq("portfolios","",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({id,data:{template:1,...d},updated_at:Date.now()})});return id}
async function readPortfolio(id){
  if(!COMMENTS_ON)return lread(id);
  const r=await sbq("portfolios","?id=eq."+encodeURIComponent(id)+"&select=*");return r[0]?prow(r[0]):null}
async function readAllPortfolios(){
  if(!COMMENTS_ON)return lreadAll();
  return (await sbq("portfolios","?select=*&order=updated_at.desc")).map(prow)}
async function updatePortfolio(id,d){
  if(!COMMENTS_ON)return lupdate(id,d);
  const cur=await readPortfolio(id);if(!cur)throw new Error("Portfolio not found");
  const {id:_i,updatedAt:_u,...rest}=cur;
  await sbq("portfolios","?id=eq."+encodeURIComponent(id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({data:{...rest,...d},updated_at:Date.now()})})}
async function deletePortfolio(id){
  if(!COMMENTS_ON)return ldelete(id);
  await sb("?portfolio_id=eq."+encodeURIComponent(id),{method:"DELETE"});
  await sbq("portfolios","?id=eq."+encodeURIComponent(id),{method:"DELETE"})}

function esc(value) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, (c) => map[c]);
}
function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
function safeUrl(url) {
  return /^https?:\/\//i.test(url) ? url : "https://" + url;
}
function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
function go(hash) {
  location.hash = hash;
}
function stepper(current) {
  const steps = ["Information", "Template", "Preview"];
  const items = steps.map((label, i) => {
    const n = i + 1;
    const state = n === current ? "current" : n < current ? "done" : "";
    return `<li class="${state}" ${n === current ? 'aria-current="step"' : ""}>
              <span class="num">${n < current ? "&#10003;" : n}</span>${label}</li>`;
  });
  return `<ol class="stepper" aria-label="Progress">${items.join("")}</ol>`;
}
function showError(fieldId, message) {
  document.getElementById("error").textContent = message;
  const field = document.getElementById(fieldId);
  field.setAttribute("aria-invalid", "true");
  field.focus();
}
function avatar(d) {
  return d.photo
    ? `<img class="av" src="${d.photo}" alt="${esc(d.name)}">`
    : `<div class="av">${esc(initials(d.name))}</div>`;
}
function list(items) {
  if (!items.length) return "<p>—</p>";
  return `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
}
function contactLine(d) {
  return [d.email, d.phone, d.address].filter(Boolean).map(esc).join(" | ");
}
function educationItems(d) {
  return (d.edu || []).map((e) => `<b>${esc(e.degree)}</b> ${esc(e.school)} <i>${esc(e.years)}</i>`);
}
function experienceItems(d) {
  return (d.exp || []).map((e) => `<b>${esc(e.role)}</b> ${esc(e.company)} <i>${esc(e.years)}</i>`);
}
function projectItems(d) {
  return (d.projects || []).map((p) => {
    const title = p.link
      ? `<a href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener">${esc(p.title)}</a>`
      : esc(p.title);
    return `<b>${title}</b> ${esc(p.desc)}`;
  });
}
function linkItems(d) {
  return (d.links || []).map(
    (l) => `<a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label || l.url)}</a>`
  );
}
const none = '<p class="none">Nothing added yet.</p>';
function entry(title, sub, meta, link) {
  const t = link
    ? `<a href="${esc(safeUrl(link))}" target="_blank" rel="noopener">${esc(title)}</a>`
    : esc(title);
  return `<div class="en"><div class="eh"><b>${t}</b>${meta ? `<span>${esc(meta)}</span>` : ""}</div>
    ${sub ? `<div class="es">${esc(sub)}</div>` : ""}</div>`;
}
const eduEntries = (d) => (d.edu || []).map((e) => entry(e.degree, e.school, e.years)).join("");
const expEntries = (d) => (d.exp || []).map((e) => entry(e.role, e.company, e.years)).join("");
const prjEntries = (d) => (d.projects || []).map((p) => entry(p.title, p.desc, "", p.link)).join("");
const contactBits = (d) => [d.email, d.phone, d.address].filter(Boolean).map(esc);
const linkButtons = (d) => (d.links || [])
  .map((l) => `<a class="btnl" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label || l.url)}</a>`)
  .join("");
function simple(d) {
  const skills = (d.skills || []).map((s) => `<span>${esc(s)}</span>`).join("");
  const links = linkItems(d).map((l) => `<span>${l}</span>`).join("");
  return `
  <article class="pf t1">
    <div class="t1h">
      ${avatar(d)}
      <div>
        <h1>${esc(d.name)}</h1>
        <div class="cl">${contactBits(d).map((c) => `<span>${c}</span>`).join("")}</div>
      </div>
    </div>
    <div class="t1b">
      <aside>
        <h2>Skills</h2><div class="tags">${skills || none}</div>
        <h2>Links</h2><div class="tags">${links || none}</div>
      </aside>
      <div class="t1m">
        <h2>About</h2><p style="margin:0">${esc(d.about)}</p>
        <h2>Experience</h2>${expEntries(d) || none}
        <h2>Projects</h2>${prjEntries(d) || none}
        <h2>Education</h2>${eduEntries(d) || none}
      </div>
    </div>
  </article>`;
}
function modern(d) {
  const card = (icon, title, body, wide) =>
    `<div class="c ${wide ? "wide" : ""}"><h2><i>${icon}</i>${title}</h2>${body}</div>`;
  const chips = (d.skills || []).map((s) => `<span class="chip">${esc(s)}</span>`).join("") || none;
  const projects = (d.projects || []).map((p) => `
    <div class="en"><div class="eh"><b>${esc(p.title)}</b></div><div class="es">${esc(p.desc)}</div>
    ${p.link ? `<a class="btnl" href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener">View project</a>` : ""}</div>`).join("") || none;
  const stat = (n, label) => `<div><b>${n}</b><small>${label}</small></div>`;
  return `
  <article class="pf t2">
    <div class="ban">
      ${avatar(d)}
      <div>
        <h1>${esc(d.name)}</h1>
        <div class="pills">${contactBits(d).map((c) => `<span>${c}</span>`).join("")}</div>
      </div>
    </div>
    <div class="stats">
      ${stat((d.projects || []).length, "Projects")}${stat((d.skills || []).length, "Skills")}${stat((d.exp || []).length, "Experience")}
    </div>
    <div class="cards">
      ${card("&#10022;", "About me", `<p style="margin:0">${esc(d.about)}</p>`, true)}
      ${card("&#9733;", "Skills", chips)}
      ${card("&#10148;", "Experience", `<div class="tl">${expEntries(d) || none}</div>`)}
      ${card("&#10070;", "Projects", projects, true)}
      ${card("&#9998;", "Education", `<div class="tl">${eduEntries(d) || none}</div>`)}
      ${card("&#9993;", "Links", linkButtons(d) || none)}
    </div>
  </article>`;
}
function creative(d) {
  const bars = (d.skills || []).map((s, i) => `
    <span class="sp sp${i % 3}">${esc(s)}</span>`).join("") || none;
  const projects = (d.projects || []).map((p, i) => `
    <div class="pn"><big>${String(i + 1).padStart(2, "0")}</big>
      <b>${p.link ? `<a href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener">${esc(p.title)}</a>` : esc(p.title)}</b>
      <p>${esc(p.desc)}</p></div>`).join("") || none;
  const ti = (b, s, y, k) => `<div class="ti"><small>${k}</small><b>${esc(b)}</b><span>${esc(s)}</span><i>${esc(y)}</i></div>`;
  const journey = [
    ...(d.exp || []).map((e) => ti(e.role, e.company, e.years, "Work")),
    ...(d.edu || []).map((e) => ti(e.degree, e.school, e.years, "Study"))
  ].join("") || none;
  return `
  <article class="pf t3">
    <aside class="side">
      ${avatar(d)}
      <h1>${esc(d.name)}</h1>
      <p>${esc(d.about)}</p>
      <p class="ct">${contactBits(d).join("<br>")}</p>
      ${linkItems(d).map((l) => `<div class="lk">${l}</div>`).join("")}
    </aside>
    <div class="main">
      <section><h2>Skills</h2><div class="sks">${bars}</div></section>
      <section><h2>Projects</h2><div class="pg">${projects}</div></section>
      <section><h2>Journey</h2><div class="tl3">${journey}</div></section>
    </div>
  </article>`;
}
const TEMPLATES = { 1: simple, 2: modern, 3: creative };
const TEMPLATE_INFO = [
  { name: "Simple",   text: "Clean and professional, single column." },
  { name: "Modern",   text: "Cards, sections and a gradient header." },
  { name: "Creative", text: "Bold colours and a tilted profile panel." }
];
const THUMBNAILS = {
  1: `<div style="padding:12px;background:#fff;height:100%">
        <div style="font:14px Georgia">Name</div>
        <hr style="border:0;border-top:1px solid #ccc">
        <div style="height:6px;background:#ddd;margin:6px 0"></div>
        <div style="height:6px;background:#ddd;width:70%"></div>
      </div>`,
  2: `<div style="background:#eef2fb;height:100%">
        <div style="height:42px;background:linear-gradient(135deg,#3b5bdb,#7048e8)"></div>
        <div style="display:flex;gap:6px;padding:8px">
          <div style="flex:1;height:50px;background:#fff;border-radius:8px"></div>
          <div style="flex:1;height:50px;background:#fff;border-radius:8px"></div>
        </div>
      </div>`,
  3: `<div style="background:#1b1030;height:100%;display:flex;gap:8px;padding:10px">
        <div style="width:35%;background:#ffb703;border-radius:14px 2px;transform:rotate(-2deg)"></div>
        <div style="flex:1">
          <div style="height:8px;background:#ff6b9d;width:60%;margin:6px 0"></div>
          <div style="height:6px;background:#3a2760;margin:4px 0"></div>
          <div style="height:6px;background:#3a2760;width:80%"></div>
        </div>
      </div>`
};
const app = document.getElementById("app");
const LOADING = '<p class="load">Loading…</p>';
const PREVIEW_PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCADwAPADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6gooooAKKKKACiiigAooooAKKo6rq8Gkw+bMfoPWqGmeLrHUnCAlCTgbu9Q6kU+VvUDdooBzyKKsAooooAKKKKACiiigAorL1bxDZ6QQJ25PYVLpetWurJut3B9qnnjflvqBfoooqgCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA5TxzodxqtsrQMRsHIFcZ4T0O+j1oRNuYAZ59PWvXWAIORkVytnJBa69O4X5mk2fSvOxOGg6sKr3uB1MS7I1X0GKdQDnmivRAKKKKACiiigAoopk0qwxs7HAAzQB5p8RbG6ub3bA3AAJ+lavgDQbvT1EszMAR0NSpK2ra4rbN0YbGfauyRAihVAAFedQoKVaVYB1FFFeiAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFQz3KQrknJ9KTkkrsCViACSa4y/uIba8lnA6Sbs+taOratsGySTYxBxGO4+tcVqF4m4gM2Dxya8THZhDSMNWiWzvIvE9ubdX2N0pP+EohYZBUexrzU3wjXAdsDnrRJrLkAbhx7VySzio9hcx6K/ib+6Upg8SSHulebPrkin74/KhfETL1kFSs0qvqDkemp4ickcKatrrTYBMRP0ryyPxOY2yJFH1FaMXjZQgBIz3NbxzWa3BSPSRq8SrmRGT61g+LPEUcdiViY5J5APJrlJPGMTjJbJ+tctqeqyX9wS8jBS2etayzTmVirnq/guJJbfzwTzzg9jXVV5R4R8UDSiI5Cdh9a9MsNSg1CJZInBz2r0cHWhKCUWMt0UUV2AFFFFABRRRQAUUUUAFFFFABRRRQAUUVXuL+C1H7xwD6ZpN23AsU1nVBliBWFL4vshOIY3BbOD7VcVJJAJ5pN6HlVSsJ4mnHqK5NdXDiNip2jHHvWJq2pi0iRc5kbqfSrmo3Kxr8x4HSuH1/UzI5VeSO9fPY/FzqaX0M3JkWo6uzMctmubvdRLSHmlnd5pNuTk1C9mFBLc14l2RcryX4qFr/wB6rXKgMQKqEjJFFxXLc100jZU1CZGPU0xAKaxp6juSbz60u8+tQbqRm4pXYFkTMO9I0pJBz0qi0zA4BpVlY9apNlXN+yvww2scEV0/h/xJNpcykOSncZrz9HK/NWjb3xXA7VvQxUqUropM+gdG1231WEMjjdjkVqV4VofiCWwnV0kIHpmvVvD/AIlh1KJVZgHxX1mDx0a8ddy0zfooBz0orvGFFFFABRRRQAUUUUAFFFNdgilj2oArX115KFV5cjgV5n4p16VRKoc7ycBe9dN4r1yLSbSS4d8TkfIvpXlegte+JPEf2qTfKzNlgR8or53MMdzSdOL2Jkdh4L0ia9lS9vVYKPXvXoN1dxWsBO9QFHHNUJZV060VdiqQOgrz/wAU615gbbJtT1zXnRm2iWzU1zxYrFkVlrkbrW0dzyMmubv9TQ5/eqT9ayJNQKfPvyPrWVS76CO1S9QtuPWql1qOWKhuK5+LVxInytUZuWZicmuSSa3IZo3M+ehyapNIT3pnmE8k00sM9aSEK0hz9405ZSB96q7nHJ4pCcd6uxViW6lPy4P5U2WZtgwTTB0+lHWiw7D0bgZNWI17mqo9ak889xS5RFhpAvBpq3BU9ars+4VVuZlgjLuMqKXKBtw3+1h81dXo2uPbbWR+frXlsepxSH92rfWr9nqUkMgIY4rqpU5w99Fo+k/DXiuO+RYpmw/T611IIYZHSvnzRPEB2oyuA49DXr/hTxGmo26RSMPMAr6TAY72iUJ7lq7Olooor1RhRRRQAUUUUAFUdYuUtrUl22g9TV6uN+JOpLYaS+WwSOKxxEuWm2B5j4y8Rf27q8sSN+7XCg/Sur+Gmkrbo86Hf6sPWvKYGY3LMxyWOa9p+HOZtDdNu0Aj5vWvh780mA7xhrcOmWUt1cSCOFMgsema+YPG/wAYopbiS10qGQJkgtKQwPuK9N+PN/dT6VLZRkpHG53EHr714Fr/AIRtdLt0NxfhTtDg7cl8jOK9/AYaDV5EMypvGOpSsT5zc+hrW0XxnISsd3LhfU1xuMZpM45r03hqTVrGdj2qyvolYAyDaRkGtm2mEh+U5HY15p4P1QXNmbeYkyRn5D6ivQ9FUsgzXz2Owqg9BWNR0wAah/jH0q7Io2AVXKfNmvLsNEVwD5QGP4ahkdW2qDkgc1oMgZOlVnt1UE45oRSI8/K49SKF7U0hgeRUiDjpVtAOUUYpQaKQEVwrRxl+1YGr3pe1ZA+znrXR6nkWLFRyBxXmXi3UpLa1YZIdulduEw/tJBYZeeLU0tvIhxIe5FQweP5BIN6ELXEtI0jEk5JoPAzX00MFGKtYZ7f4R8VwXswxKAewzXrOia+2m3MEwJAJGa+UNIkvbCaK6jB8skcg1714Zubm+0gXM7bRGPu9c14uMoPD1faRKTPqTSb5NQsYp0IO4Vcrzb4UeKotTgNnnaycAE16TX0NCp7SCkUFFFFagFFFFABXk3xsumS2SMNgEYr1mvDPjtcsLiCIHALYrjx8rUGBwNnICwLHmvavAFzKvh1hEFBHOTXgVtKVG7zASO1e9eA1ZfBccrDazpnmvjI6SbJcjzf4uWU1/p106ldxzxnvXzzr8v8AaGBdM4dBtHpxX0r4rjM8rRvyh6ivN9W8I6fcbv3JBPevVwmM5HqQ5HiLW4H/AC1jH41GLd5XEceHY9NvNemv4Es4nBK7hVy28Lw2rqywRovYletetLNIW0QHJ+FtJurOVXkQjcRXr+lWO2EOBjNY9no7NIpCcD2rrrO2aOILjtXg4vFOpK4rEDQZ4pn2Riela8dmW5xVqKwDLnjiuG4GLHZEjpQ+n57VupCi8HFNfYrheOaBmF/Zg7qKeNPQDlK1leNgxx0podDzimIw7jTscrUAtXUdK6CSNWHFQGEHtTQGLcKHi2sOMV5H8QrSXzU2r8gzXt09l5gKgYJrjfEujxznE0e4D0rtwdf2c0yjwnG04zQeeK7DVPCC+cfJUoD3NZ48HXRcfvV/KvqI42lJXbAtadewxaT9nIBkZ1xn617H4dkNn4fCykAuu9f/AK9eaaF4LP2iOS4fcFIOBxXoGtu0GiBIlKhOB9K8nMK0ajXKy0bnwv1h9P8AFsYD4WV+QK+oonDxqw7gV8XeB9RYeIrInIIfk+tfZOlSebp8D+qiuzLZNxaYy3RRRXpgFFFFABXz98d7lxqMS5yinJHrX0DXgPxztsXyyuRtzXBmX8BiZ5/4YisbzUYoJIFHzDOW619EpFFb6HDbW6iONFwADmvm7TNRgs7qA28KO2fmZhzX0Vo863/hq1mXGWToK+Re5lI4LxFHmc/WubuLLcOe9dvr1ghky0qj8axn0xzH5hB8v261LdjLqcwmnQxqfM+YeuKkttGNy4ON0IPXH3a6IaCJhlC23vurY0/QsQmMZC+1SpyNUzkk0qRZAsa5HY1s2ektGN8p7dK23t4LFMHqPWs651ID7tEpaBcR4kjUk8Vk3l4wysbYqW5vTKuBWU6nfnNXShzhckSaXBLPSi5IIZjkD0rMvb5opQnATHJqvcazb28TbpNqsPlK9zXUqAXOgQqFOGyW9KlGyOPlhmuWsdZWKIEsCT129B9autqMUyg+ZjPTBo9gwNjzkPcUuQ/SsMXUfaSrMF4wwQcis5UnEZqhMHJrO1PTln+fbmr1veRyEBzgd6uGKCRflc81EGFzzvUdLGeFx+FZ66Wd4/wrv9R0dSC4rFayKy4xWntHshog03TtpHH6Va8TwLb6NyvVsfpWtp9ocjiq/j2Ex6QgI71abYzgfCak+IrYjgeZX2hogxpduP8AYFfH/g2zD6tDI2QquDmvr/Qplm0q3ZDkbRXv5ZsykX6KKK9UYUUUUAFeRfHDQftlulyEZtvp6167VHV9Jt9YtWt51BVhWOIpe1puAHxkbS8tZml2BiOw4r3j4T6+l7oUVrc/K8S4246VBrnwNeS6eaxlwGOcVe8JeCNT8LzZurhzFngKoIr5itgK0elzNo39U0eK7IkVQB15rLvIILcfLCeBzluF/CtzUmO0kHjrXOSwC8kVUz19a86UWjDqWNI0q41GUSbd8BPVRit17OGxBQDH1rQsI10ywVTgACsvUb5ZySOtDjoaLY5PXQDcHBwKwLpCimtbX5SHLA81wut67cWnzPKdnpWlKlziHalqpsc8ZrHi8TTTyMAmQPasm78QDWbhLa3l2OD83vXW6BFoOl2csmqmNpSMDecDJr3cLgkkM4+/1y6uPM6KFOBxXMX+qXn8bgoPauk8Uajo5uWSylVQRlsHjNcPcX0E9w0D3IEagn613LBxY0jRs/EBPDOcexrRHidUGA44rgEvoxnDY5pGuUck+bih4RIqx6Ra+JklPzNXQ2WrpIg2vyfevIbJmPSet/SdQmtJV8xiUU5P0rlxGGVgPVbW4dxkmtmzLYB3GuV0zWLa6iUIAGYcV0+nPui968OdPlZmzbiRZoyr8/Lx9ayRCpuCjDkVpwOFANVry2kExuIF3HHOKhKw0y/a26oyMvPOCmOTWV8TdNu4tPjlZQkBG4KRya6nwYjX14odNoU8gioPjZKoFtbKwRRivSp0F7GVSRoloebeEYFjRpSMDqK+iPhtqQvdFRN2SnFfP2kgQRiGI73c9q9++G2iS6XpKvNkNJzg1plMpuo+xSOyooor6IYUUUUAFFFFABTZI1kQqwyDTqa7BELE4AoA5LU4lE8kGenIFZul6aUuMkcZzzV4OL/WJWzhRxz3rREYUHYBmvlsQouq0jlluRajFJcqFEsYX0FYV5CIBgHJqzqjXS7scD2rk7+a934nYhP4ea4q8eVFXKGuSbnYV5z4tLGBgqByfXtXdXj7icnmuM8QAZLH+HmtcITc4DQ4otKubq6lId3A2g/w1l67rzXzMjtKyZzgGo/E11cRyyPbdG4IrjpZ3ycs27vzX02G+E0SLV7cs8vyF1X3rPkYk5yc09Jd5w2TmmSKQ3tXUiloREnPWlWjFHSmyi1BM0ZGGIwa6E3ZmtwynBxzXMqcVq6bIZBs55rOcVbUk7fwdI5kQFiR2r1XSycfhXm/hqyMKRyYIxXo2lsNg+lfP4uCvdESNZZSKtW80gbgnB61nhsVbsnJlUV50fisRHVnf+BdNLXXnYO08muR+NFnNe6tAkalsdhXq3g20jh08SAYLCrl54dsr67W4niVmU5GRX0kcLzYdU77nSlY89+Hfw6jFtDeX9uoI+YAjk16rHGsSBEACgYAFEcaxIEQAKOABTq6qFCNGPLEYUUUVuAUUUUAFFFFABWZrN0UhMSck9cdhWhNIIomc9AK5uST7TBJcK/L8Z9BXJjcQqNNvqTJ2OY1fUlguk+YBRgZJxW5pt8zxhiDtI61y2oSiOR1WGO4IJ++M1Y8Na7cXSPaSLEsiHlMcgdq+Vp1OaVzllub+qS/KzjPAzxXHakonJl81yw5CkV112rLEQ4wa5K/H7xqWIlcaZzl2CHJrldai80OPautvwBmuY1MfM1Xh3YaR5Zr+nsrN8pwTXEz24hucumV7g167qUSTMyuODXG6voylzgAivfw1e2jNEc+0tk0GEsolb+8Cc1lSAFjWndadJCSEQlfUVmujKeQRXoKomUQFeaChXk1LsJOatW2myXnG7A96bqJbhcop8xArqvD1h+8VsZxUWl+GhvzKPzrtdK02OCPCoPrXDiq+lkBu6QgaHbgdK6O0UxIMGsbTYQiqB2rdt1yMV5M3cllyOXcvNaGlMv2lVccNgAetZqjkAVq2MRM8DhfuNmuanD3yIfEe5+HIjFpcIbritOqekHOnQ/7oq5X10FaKR0hRRRVAFFFFABRRRQAUUUUAZXiG6NtYnaMsxAArMiUR2rR4wccCrGuzK9/BCz7QMnioZHJjZOFDjll618znVRuXKuhlUZw/iL/AELcy9T1xXDJcX+mXwuVL7ycnA6D+teleI7KO3twyEuSOrVw11cTgCKJ8xpnLN2+teJRlYwZ0+n+JGvoVNy21iOR6VHdfvSzJ8w9q4W6u5gjLC233HamW/iDVNMCIZWk39N1bSdwRt6i4UkHI/Cucv4nckqK2rbXhezKt1ArAjkDmtNbbT51+WADPqK2g+UtM8tu7OZ3OErHvdPlcHETHHtXq+o+H1bmCNF9xXOX2hahBna7MGB7dK7YYhIpM80bTZXOPKPPtVa58Oow/eIFauwuNK1dZVKk4AwazNQ0rVJpjujkfgc4rdYkq5z1hoUJlMZUE1qx6GYD8kQq1F4Y1YRmVISF+8SR39KsQ6frRtnUrIJD93A6U3iL9QuZ8drI6kqhwOM1qWFlIADluKuab4e1NrfDbwc5ORXT6d4cuvl3MwGe9ZSrJ7iuZlsDCq71YZ6cVt26sqqSpwfatKXSo4TFulB2nkGq17q8UDp5aggZGKwnVRDZctLXcNx+pzWxAIoXi3MB34rj/wDhIpi4VhiM9cd6vW97LJKAxwo+bb2IrFVUpXCO9z6C8M3S3WlRMvYYrWrzz4e+IkVPscvyjt6CvQgQRkV9Xh6qqU1JHShaKKK3AKKKKACiiigAooooA5HVI/tGu852oP6UTShVwvQCrF/KkWqSRsMMw4NUbhreOANJNhscjFfKZkr1XcwnuY3iK5EsKjpgYNee6xeRHMcbBUP3h3auy1Wfz87RiMfxtxXDanHb+YcKc56147VmZMpxkMwz0qa8gjuAmwgFaozOYsbaI7hsjPSjnaBE8MfkSZOTj+7Uy3U8cm5HbHoTRBJG3U1JLsI4ropu61KRaTWX43dqurqkFxE25QCPXvWAcVG8jbcDitoxLsa63NrIz8Kdoz060xLi1YZEafiKx4JfIyzHPOcetRrOcntk5rZQGbzzWzRNHyA3OBxzUCOEUAbDj2rLErE9af5hx1p8gzaF+gAAjAPtT/7RftgVipKcjmm32oNbIRHHvOPWs5qyEP1S7kIYiTmsJt7T7y2V7Cnm5kufmddp9KXbg1585O4mhAORWvFLiRHHA2gVkA81bjugAEP51F2OKsdhpN7JbkPE21uteoeF/FyXCJb3DfNjGTXiVtqawpyRWpp/iNBKMHaQeua9LAY2dKVuhSdj6KRw6hlOQaWuA8J+OI5WW2ncY6Bia72ORZUDqcg19dSrRqR5omiY6iiitQCiiigAooooA47xPC82po8LhGQZJJ9q5TVtVKRfOFZ+hK9K7O4ljbVZvNAIAxzXMa7BZlcpCSueMGvlcxmnWZhPc5u81oX0KxSKFUDAHY1n30tqUxsViB/BzVy+s7YjIfb7Vh3kCJkqW/OvHkjIzbiIO3ORjmoDEe1WGJPWkVgOtQCIkR1OeanRmxzQZVZcDrSA8VtTZpFElREZfFPBpCMNursiaWKko+cio1b58VYnXnNU5GKODW6EWR1qU4K/LUCEMOKlU7AapADHaKhaQZ+bmkml61VkkJFclRhYdK6E8VEZcVFnGSaqXF8sbYBrnVLmYMutKVpXu4EjyW+b0rDvdXaGHchGc45rJbVJZX+8Oa1WGYjpf7QaU4XpVq1abIIJrG0ty3JretpkQjNR7Pl2Jub2jXFxHIGDHjmvXvAvjIzotrdnB6AmvIbC6jXBGOa3LW9jh2FWK4IPBrpwOLnRqeRpFn0ICGGQcilrjPB/jCK9jW2nfD4+Uk9a7IEEZHIr66lUjUjzRNLi0UUVoAUHpRRQB5d4l8Qf2frktuEYkjsM1z99q8Lw5mLL9eK7/V/Djf2nPfSW5lRgNpUbsfhXFan4fi1aeQpDcDYefMXC18bmSlGtK6MJ7nOXfiO1WMKJBwMVi3WrJcg7JQK68+ALa7UD7OQcclV4qex+G1jbZ81CfqK8l1jKx58Zx03c1HIzkfK75/3a9Jfw3pVipC2iynsStZ8tlbpkizVQO+2hVvIaRwcV0qHa+8N6kVbSYFDyOldBeW9psLNag++01nPpaOC0UTKD2C1tCr5GkSrDIGiBJ5zTyQajezngU/u2wP8AZNUhNMjnKSf98muynUuaF913Cqslvmni5cj/AFb/APfJo85j/A//AHya6o3aEV8tE2O1OMnHWnsjv/yzf/vk0wwyZ/1b/wDfJq7DsV5DTFxnmp54ZAP9W/8A3yarOJEQt5b8f7JrKVFsRS1O4EWQtYMs29izHgA1Pqd08kuwRyZP+yaxNQlmiG3y5ef9k1UcOxMZNdGdSuTgGmQjDioIfMY4EUh7/dNW44Jcj91J/wB8mtpRcdBG3ZXIhUVfTUFY5JrCjim/55yf98mrKQy8fu5P++TXLOIWOhttT2svNbMWqptG6Vx9FzXJ28EuR+7k/wC+TWvaLKoGY5P++TXI4tGbbR22maz9mEUqMeADnoa9d8JeM4r+NIJ2w2MAmvn6GWRSP3cn/fJrZsNau7Z1McMgwR0U5rvy/FTpS8i4SZ9MghhkHINLXE+DfGQ1CNLeZJA/AGVOa7YHIzX1FKrGpHmibn//2Q==";
const PREVIEW = {
  name: "Miguel Santos", email: "miguel@email.com", phone: "0912 345 6789", address: "Cebu City",
  about: "Hi, I'm Miguel! I'm just starting out in web design. I like making simple pages that look good and are easy to use.",
  photo: PREVIEW_PHOTO,
  skills: ["HTML", "CSS", "Canva", "Teamwork"],
  edu: [{ school: "Cebu Technological University", degree: "BS Information Technology", years: "2023 - Now" }],
  projects: [{ title: "My first website", desc: "A simple page about my hobbies", link: "" },
             { title: "School event poster", desc: "Made with Canva for my class", link: "" }],
  exp: [{ role: "Volunteer", company: "School Tech Club", years: "2025" }],
  links: [{ label: "Instagram", url: "instagram.com/miguel" }]
};
let carouselTimer = null;
const SLIDES = [{ id: 1, label: "Simple" }, { id: 2, label: "Modern" }, { id: 3, label: "Creative" }];
function pageHome() {
  const positions = ["pos-c", "pos-r", "pos-l"]; // start: Simple in the middle, Modern right, Creative left
  const slides = SLIDES.map((s, i) => `
    <figure class="slide ${positions[i]}" role="group" aria-roledescription="slide"
            aria-label="${i + 1} of ${SLIDES.length}: ${s.label} template" aria-hidden="${i !== 0}">
      <div class="slide-inner" inert>${TEMPLATES[s.id](PREVIEW)}</div>
      <figcaption>${s.label}</figcaption>
    </figure>`).join("");
  app.innerHTML = `
    <section class="home">
      <div>
        <span class="eyebrow">ONLINE PORTFOLIO TEMPLATE GENERATOR</span>
        <h1>Build a portfolio you are <em>proud to share.</em></h1>
        <p class="lead">Enter your details once, choose a Simple, Modern or Creative design, and get a clean portfolio page saved online. Edit or delete it any time.</p>
        <div class="row">
          <a class="glass glass-primary" href="#/create">
                        Create Portfolio <span class="btn-arrow" aria-hidden="true">&rarr;</span></a>
          <a class="glass" href="#/manage">Manage portfolios</a>
        </div>
      </div>
      <div class="car" role="region" aria-roledescription="carousel" aria-label="Template examples">
        <div class="car-frame" id="car-frame">${slides}</div>
      </div>
    </section>`;
  initCarousel();
}
const SLIDE_MS = 3000;
const INNER_WIDTH = 760; // width the templates are drawn at before being scaled down
function initCarousel() {
  const region = app.querySelector(".car");
  const frame = document.getElementById("car-frame");
  const slides = [...frame.querySelectorAll(".slide")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  const fit = () => {
    const scale = (frame.clientWidth * 0.6) / INNER_WIDTH;     // middle slide is 60% of the card width
    const innerHeight = (frame.clientHeight * 0.8) / scale;   // and 80% of its height
    slides.forEach((s) => {
      const inner = s.querySelector(".slide-inner");
      inner.style.transform = `scale(${scale})`;
      inner.style.height = `${innerHeight}px`;
    });
  };
  const show = (i) => {
    index = i % slides.length;
    slides.forEach((s, k) => {
      const place = (k - index + slides.length) % slides.length; // 0 = middle, 1 = right, 2 = left
      s.classList.remove("pos-l", "pos-c", "pos-r");
      s.classList.add(place === 0 ? "pos-c" : place === 1 ? "pos-r" : "pos-l");
      s.setAttribute("aria-hidden", place !== 0);
    });
  };
  const stop = () => { clearInterval(carouselTimer); carouselTimer = null; };
  const start = () => {
    stop();
    if (!reduceMotion) carouselTimer = setInterval(() => show(index + 1), SLIDE_MS);
  };
  region.addEventListener("mouseenter", stop);
  region.addEventListener("mouseleave", start);
  new ResizeObserver(fit).observe(frame);
  fit();
  show(0);
  start();
}
const GROUPS = {
  edu: {
    title: "Educational background", add: "Add education",
    fields: [["school", "School"], ["degree", "Degree / strand"], ["years", "Years"]]
  },
  projects: {
    title: "Projects", add: "Add project",
    fields: [["title", "Project title"], ["desc", "Description"], ["link", "Link (optional)"]]
  },
  exp: {
    title: "Work experience", add: "Add experience",
    fields: [["role", "Role"], ["company", "Company"], ["years", "Years"]]
  },
  links: {
    title: "Social media / website links", add: "Add link",
    fields: [["label", "Label (e.g. GitHub)"], ["url", "URL"]]
  }
};
let photoData = ""; // profile picture as a small base64 image
function groupRow(group, values = {}) {
  const inputs = GROUPS[group].fields
    .map(([key, label]) => `<label>${label}<input data-key="${key}" value="${esc(values[key])}"></label>`)
    .join("");
  return `
    <div class="item">
      ${inputs}
      <div class="row" style="margin-top:8px">
        <button type="button" class="btn sec sm" data-remove>Remove</button>
      </div>
    </div>`;
}
function groupSection(group, saved = []) {
  const rows = (saved.length ? saved : [{}]).map((v) => groupRow(group, v)).join("");
  return `
    <fieldset>
      <legend>${GROUPS[group].title}</legend>
      <div id="group-${group}">${rows}</div>
      <button type="button" class="btn sec sm" data-add="${group}">+ ${GROUPS[group].add}</button>
    </fieldset>`;
}
function resizePhoto(file) {
  if (!file) return;
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const size = 240;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const side = Math.min(img.width, img.height);
    canvas.getContext("2d").drawImage(
      img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size
    );
    photoData = canvas.toDataURL("image/jpeg", 0.8);
    URL.revokeObjectURL(url);
    document.getElementById("photo-preview").innerHTML =
      `<img src="${photoData}" alt="Profile preview">`;
  };
  img.src = url;
}
function collectForm() {
  const value = (id) => document.getElementById(id).value.trim();
  const data = {
    name: value("name"),
    email: value("email"),
    phone: value("phone"),
    address: value("address"),
    about: value("about"),
    photo: photoData,
    skills: value("skills").split(",").map((s) => s.trim()).filter(Boolean)
  };
  for (const group in GROUPS) {
    data[group] = [...document.querySelectorAll(`#group-${group} .item`)]
      .map((item) => {
        const entry = {};
        item.querySelectorAll("input").forEach((input) => (entry[input.dataset.key] = input.value.trim()));
        return entry;
      })
      .filter((entry) => Object.values(entry).some(Boolean));
  }
  return data;
}
async function pageCreate(id) {
  let saved = {};
  if (id) {
    app.innerHTML = LOADING;
    saved = await readPortfolio(id);
    if (!saved) return pageNotFound();
  }
  photoData = saved.photo || "";
  app.innerHTML = `
    ${stepper(1)}
    <h1>${id ? "Edit portfolio" : "Create portfolio"}</h1>
    <form id="form" novalidate>
      <p class="hint"><span class="req">*</span> Required field</p>
      <fieldset>
        <legend>Personal information</legend>
        <div class="photo">
          <div id="photo-preview">
            ${photoData ? `<img src="${photoData}" alt="Profile preview">` : '<div class="ph"></div>'}
          </div>
          <label>Profile picture<input type="file" id="photo" accept="image/*"></label>
        </div>
        <div class="g">
          <label>Full name <span class="req">*</span><input id="name" required value="${esc(saved.name)}"></label>
          <label>Email <span class="req">*</span><input id="email" type="email" required value="${esc(saved.email)}"></label>
          <label>Contact number<input id="phone" value="${esc(saved.phone)}"></label>
          <label>Address<input id="address" value="${esc(saved.address)}"></label>
        </div>
        <label style="margin-top:12px">About me<textarea id="about">${esc(saved.about)}</textarea></label>
      </fieldset>
      <fieldset>
        <legend>Skills</legend>
        <label>Separate skills with commas
          <textarea id="skills">${esc((saved.skills || []).join(", "))}</textarea>
        </label>
      </fieldset>
      ${groupSection("edu", saved.edu)}
      ${groupSection("projects", saved.projects)}
      ${groupSection("exp", saved.exp)}
      ${groupSection("links", saved.links)}
      <div id="error" class="err" role="alert"></div>
      <div class="row actions">
        <button class="btn" id="save-btn" type="submit">${id ? "Save changes" : "Save and choose template"}</button>
        <a class="btn sec" href="#/manage">Cancel</a>
      </div>
    </form>`;
  document.getElementById("photo").onchange = (e) => resizePhoto(e.target.files[0]);
  const formEl = document.getElementById("form");
  let dirty = false;
  formEl.addEventListener("input", () => (dirty = true));
  window.onbeforeunload = () => (dirty ? "" : undefined);
  app.onclick = (e) => {
    const addBtn = e.target.closest("[data-add]");
    const removeBtn = e.target.closest("[data-remove]");
    if (addBtn) {
      document.getElementById("group-" + addBtn.dataset.add).insertAdjacentHTML("beforeend", groupRow(addBtn.dataset.add));
    }
    if (removeBtn) removeBtn.closest(".item").remove();
  };
  document.getElementById("form").onsubmit = async (e) => {
    e.preventDefault();
    const error = document.getElementById("error");
    const data = collectForm();
    window.onbeforeunload = null;
    error.textContent = "";
    document.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    if (!data.name) return showError("name", "Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(data.email)) return showError("email", "Please enter a valid email, like name@example.com.");
    const button = document.getElementById("save-btn");
    button.disabled = true;
    button.textContent = "Saving…";
    try {
      if (id) {
        await updatePortfolio(id, data);
        toast("Portfolio updated");
        go("#/preview/" + id);
      } else {
        const newId = await createPortfolio(data);
        toast(isOnline ? "Saved to online database" : "Saved");
        go("#/templates/" + newId);
      }
    } catch (err) {
      error.textContent = "Could not save: " + err.message;
      button.disabled = false;
      button.textContent = "Try again";
    }
  };
}
async function pageTemplates(id) {
  app.innerHTML = LOADING;
  const portfolio = await readPortfolio(id);
  if (!portfolio) return pageNotFound();
  let selected = portfolio.template || 1;
  const cards = TEMPLATE_INFO.map((t, i) => `
    <button class="tp ${selected === i + 1 ? "on" : ""}" data-template="${i + 1}" aria-pressed="${selected === i + 1}">
      <div class="thumb">${THUMBNAILS[i + 1]}</div>
      <h3>Template ${i + 1}: ${t.name}</h3>
      <p>${t.text}</p>
    </button>`).join("");
  app.innerHTML = `
    ${stepper(2)}
    <h1>Choose a template</h1>
    <div class="tpls">${cards}</div>
    <div class="row">
      <button class="btn" id="generate">Generate portfolio</button>
      <a class="btn sec" href="#/create/${id}">Edit information</a>
    </div>`;
  app.onclick = (e) => {
    const card = e.target.closest("[data-template]");
    if (!card) return;
    selected = Number(card.dataset.template);
    app.querySelectorAll(".tp").forEach((el) => {
      const on = Number(el.dataset.template) === selected;
      el.classList.toggle("on", on);
      el.setAttribute("aria-pressed", on);
    });
  };
  document.getElementById("generate").onclick = async () => {
    try {
      await updatePortfolio(id, { template: selected });
      go("#/preview/" + id);
    } catch (err) {
      toast("Could not save template: " + err.message);
    }
  };
}
async function initComments(pid) {
  const list = document.getElementById("cm-list"), body = document.getElementById("cm-body"), nameEl = document.getElementById("cm-name");
  const fmt = (t) => new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  async function refresh() {
    try {
      const items = await readComments(pid);
      document.getElementById("cm-count").textContent = items.length;
      list.innerHTML = items.length
        ? items.map((c) => `<li><div class="ch"><span>${esc(c.name)}</span><small>${fmt(c.at)}</small></div><p class="cb">${esc(c.body)}</p><button type="button" class="cd" data-cdel="${esc(c.id)}">Delete</button></li>`).join("")
        : '<li class="cn">No comments yet. Be the first.</li>';
    } catch (err) { list.innerHTML = `<li class="cn">Could not load comments: ${esc(err.message)}</li>`; }
  }
  try { nameEl.value = localStorage.getItem("folio_commenter") || ""; } catch (e) {}
  body.oninput = () => (document.getElementById("cm-left").textContent = 500 - body.value.length);
  document.getElementById("cm-form").onsubmit = async (e) => {
    e.preventDefault();
    const err = document.getElementById("cm-err"), name = nameEl.value.trim(), text = body.value.trim(), btn = document.getElementById("cm-post");
    err.textContent = ""; [nameEl, body].forEach((el) => el.removeAttribute("aria-invalid"));
    if (!name) { err.textContent = "Please enter your name."; nameEl.setAttribute("aria-invalid", "true"); return nameEl.focus(); }
    if (!text) { err.textContent = "Please write a comment."; body.setAttribute("aria-invalid", "true"); return body.focus(); }
    btn.disabled = true; btn.textContent = "Posting…";
    try {
      await addComment(pid, name, text);
      try { localStorage.setItem("folio_commenter", name); } catch (e2) {}
      body.value = ""; document.getElementById("cm-left").textContent = 500;
      toast("Comment posted"); await refresh();
    } catch (e3) { err.textContent = "Could not post: " + e3.message; }
    btn.disabled = false; btn.textContent = "Post comment";
  };
  list.onclick = async (e) => {
    const b = e.target.closest("[data-cdel]");
    if (!b || !confirm("Delete this comment?")) return;
    try { await deleteComment(pid, b.dataset.cdel); toast("Comment deleted"); await refresh(); }
    catch (err) { toast("Could not delete: " + err.message); }
  };
  await refresh();
}
async function pagePreview(id) {
  app.innerHTML = LOADING;
  const portfolio = await readPortfolio(id);
  if (!portfolio) return pageNotFound();
  app.innerHTML = `
    ${stepper(3)}
    <div class="row" style="margin:0">
      <a class="btn sec sm" href="#/templates/${id}">Change template</a>
      <a class="btn sec sm" href="#/create/${id}">Edit</a>
      <a class="btn sec sm" href="#/manage">Manage</a>
      <button class="btn sec sm" id="print-btn" type="button">Print / Save as PDF</button>
      <button class="btn sec sm" id="export-btn" type="button">Download as web page</button>
    </div>
    ${TEMPLATES[portfolio.template || 1](portfolio)}
    <section class="cm" aria-labelledby="cm-title">
      <h2 id="cm-title">Comments <span id="cm-count" class="tag">0</span></h2>
      <p class="hint">Leave feedback on this portfolio.${COMMENTS_ON ? "" : " Comments are saved in this browser only."}</p>
      <form id="cm-form" novalidate>
        <label>Your name<input id="cm-name" maxlength="60" autocomplete="name"></label>
        <label>Comment<textarea id="cm-body" maxlength="500"></textarea></label>
        <div class="cc"><span id="cm-left">500</span> characters left</div>
        <div id="cm-err" class="err" role="alert"></div>
        <div><button class="btn sm" id="cm-post" type="submit">Post comment</button></div>
      </form>
      <ul id="cm-list" aria-live="polite"><li class="cn">Loading comments…</li></ul>
    </section>`;
  initComments(id);
  document.getElementById("print-btn").onclick = () => window.print();
  document.getElementById("export-btn").onclick = async () => {
    let css = "";
    try { css = await (await fetch("style.css")).text(); }
    catch (e) { try { css = [...document.styleSheets].map((s) => [...s.cssRules].map((r) => r.cssText).join("\n")).join("\n"); } catch (e2) {} }
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(portfolio.name)} - Portfolio</title><style>${css}</style></head><body><main>${app.querySelector("article").outerHTML}</main></body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = (portfolio.name || "portfolio").toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".html";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Portfolio downloaded");
  };
}
async function pageManage() {
  app.innerHTML = LOADING;
  const portfolios = await readAllPortfolios();
  const cards = portfolios.map((p) => `
    <div class="mc">
      <div class="mwho">
        ${p.photo ? `<img class="mav" src="${p.photo}" alt="">` : `<div class="mav">${esc(initials(p.name))}</div>`}
        <div>
          <b class="ui">${esc(p.name)}</b><span class="tag">Template ${p.template || 1}</span><br>
          <small>${esc(p.email)}</small>
        </div>
      </div>
      <div class="row" style="margin:0">
        <a class="btn sec sm" href="#/preview/${p.id}">View</a>
        <a class="btn sec sm" href="#/create/${p.id}">Edit</a>
        <button class="btn sec sm" data-dup="${p.id}">Duplicate</button>
        <button class="btn del sm" data-delete="${p.id}">Delete</button>
      </div>
    </div>`).join("");
  app.innerHTML = `
    <h1>Manage portfolios</h1>
    ${portfolios.length ? cards : `<div class="empty"><p><b>No portfolios saved yet.</b></p><p>Create your first one and it will appear here.</p></div>`}
    <div class="row"><a class="btn" href="#/create">Create portfolio</a></div>`;
  app.onclick = async (e) => {
    const dup = e.target.closest("[data-dup]");
    if (dup) {
      const src = await readPortfolio(dup.dataset.dup);
      const { id: _id, updatedAt: _u, ...copy } = src;
      copy.name = copy.name + " (copy)";
      await createPortfolio(copy);
      toast("Portfolio duplicated");
      return pageManage();
    }
    const button = e.target.closest("[data-delete]");
    if (!button) return;
    if (!confirm("Delete this portfolio? This cannot be undone.")) return;
    try {
      await deletePortfolio(button.dataset.delete);
      toast("Portfolio deleted");
      pageManage();
    } catch (err) {
      toast("Could not delete: " + err.message);
    }
  };
}
function pageNotFound() {
  app.innerHTML = `
    <h1>Portfolio not found</h1>
    <p>It may have been deleted.</p>
    <a class="btn" href="#/manage">Back to Manage</a>`;
}
async function route() {
  const [, page = "home", id] = location.hash.split("/");
  document.querySelectorAll("nav a").forEach((a) => {
    const active = a.dataset.page === page;
    a.classList.toggle("on", active);
    active ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
  });
  app.classList.toggle("wide", page === "home");
  app.onclick = null;
  clearInterval(carouselTimer);
  window.scrollTo(0, 0);
  try {
    if (page === "create") await pageCreate(id);
    else if (page === "templates" && id) await pageTemplates(id);
    else if (page === "preview" && id) await pagePreview(id);
    else if (page === "manage") await pageManage();
    else pageHome();
  } catch (err) {
    app.innerHTML = `<div class="note bad">Something went wrong: ${esc(err.message)}.
      Try reloading the page.</div>`;
  }
}
async function showPage() {
  await route();
  app.focus({ preventScroll: true });
}
window.addEventListener("hashchange", showPage);
showPage();
})();
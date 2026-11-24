(function(){
'use strict';
const V=window.AntVillage,root=document.getElementById('region-activities');if(!V||!root)return;
const $=id=>document.getElementById(id),left=t=>Math.max(0,Math.ceil((t-Date.now())/1000)),time=t=>{const n=left(t);return Math.floor(n/60)+'m '+n%60+'s'};
let last='',onChange=()=>{};
function render(force=false){
 const p=V.activityPreview(),a=p.data,st=V.snapshot(),key=JSON.stringify(p)+':'+Math.floor(Date.now()/1000)+':'+st.petals;
 if(!force&&key===last)return;last=key;const content=$('regional-content'),col=$('regional-collection');content.replaceChildren();col.replaceChildren();
 $('regional-title').textContent={garden:'🌷 Flower Nursery',forest:'🍄 Forest Secrets',island:'⛵ Island Voyages',snow:'❄️ Snowlight Adventures'}[p.id];
 function btn(label,op,arg,disabled=false){const b=document.createElement('button');b.className='btn secondary';b.type='button';b.textContent=label;b.disabled=disabled||!p.valid;b.onclick=()=>{const r=V.activity(op,arg);$('regional-message').textContent=r.ok?r.message:r.error;render(true);if(r.ok)onChange()};return b}
 function row(title,desc,buttons){const d=document.createElement('div'),h=document.createElement('b'),t=document.createElement('p'),x=document.createElement('div');d.className='regional-task';h.textContent=title;t.textContent=desc;x.className='regional-actions';x.append(...buttons);d.append(h,t,x);content.append(d)}
 function tag(v){const t=document.createElement('span');t.textContent=v;col.append(t)}
 if(p.id==='garden'){
 const q=a.plant;if(!q)row('Choose a seed','Spend 1 petal. Water twice, then harvest.',p.seeds.map(n=>btn(n,'plant',n,st.petals<1)));
 else row(q.name,'Water '+q.water+'/2 · '+time(q.ready),[btn(q.water<2?'Water':'Harvest',q.water<2?'water':'harvest',null,left(q.ready)>0)]);
 for(const [k,n]of Object.entries(a.flowers))tag('🌷 '+k+' ×'+n);
 }else if(p.id==='forest'){
 const i=a.treasures.length;row('Hidden treasures',i<3?'Clue: '+p.clues[i]:'All treasures collected',p.spots.map(n=>btn(n,'search',n,i>=3)));
 row('Glowing plants',a.glow?'Growing · '+time(a.glow):'Discover one treasure, then plant a spore for 1 petal.',[btn(a.glow?'Harvest glowplant':'Plant spore',a.glow?'glow-harvest':'glow-plant',null,a.glow?left(a.glow)>0:!i||st.petals<1)]);
 a.treasures.forEach(n=>tag('🏺 '+n));tag('✨ Glowplants ×'+a.grown);
 }else if(p.id==='island'){
 const v=a.voyage;if(v)row(v.route,'Voyage · '+time(v.ready),[btn('Return and collect','dock',null,left(v.ready)>0)]);
 else row('Set sail','Choose a destination. Each route gives a different shell.',p.routes.map((n,i)=>btn(n+' · '+[2,5,10][i]+'m','sail',n)));
 for(const [k,n]of Object.entries(a.shells))tag('🐚 '+k+' ×'+n);tag('⛵ Voyages ×'+a.trips);
 }else{
 row('Snow expedition',a.trip?'Exploring · '+time(a.trip):'Find two ice crystals in a 5-minute expedition.',[btn(a.trip?'Collect ice':'Explore',a.trip?'snow-claim':'snow-start',null,!!a.trip&&left(a.trip)>0)]);
 row('Ice sculpture','Ice crystals: '+a.ice+' · 2 per sculpture',[btn('Carve ice deer','sculpt',null,a.ice<2)]);
 row('Aurora collection',p.night?'One collection per local night':'Return at night (18:00–06:00 local).',[btn('Collect aurora','aurora',null,!p.night||a.lastAuroraDay===p.day)]);
 tag('💎 Ice ×'+a.ice);tag('🦌 Sculptures ×'+a.sculptures);tag('🌌 Auroras ×'+a.auroras);
 }
}
window.AntRegionActivities={render,setOnChange(fn){onChange=fn}};setInterval(()=>{if(!document.hidden)render()},1000);render(true);
})();
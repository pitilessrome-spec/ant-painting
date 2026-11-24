/* ANT CANVAS Village V2 — construction, building upgrades, collectible chests. */
(function(){
'use strict';
const V=window.AntVillage,S=window.AntVillageScene;
if(!V||!S)return;
const $=id=>document.getElementById(id);
let selectedPlot=null,selectedItem=null,removePending=false,routeChoice='trail',roleChoice='scout';
function isNight(date=new Date()){const h=date.getHours();return h<6||h>=18;}
function syncDayNight(){const night=isNight();S.setNight(night);$('day-night').textContent=night?'🌙 Night · Auto':'☀️ Day · Auto';$('day-night').title='Local time · Day 06:00–18:00';}
function revealBuild(){const el=$('build-detail');if(el.getBoundingClientRect().top<0||el.getBoundingClientRect().bottom>window.innerHeight)el.scrollIntoView({block:'center',behavior:'smooth'});}
function announce(message){
 $('village-message').textContent=message;
 $('world-story').textContent=message;
 $('global-status').textContent=message;
}
function showCollectible(title,emoji,desc){
 $('reveal-title').textContent=title;
 $('reveal-emoji').textContent=emoji;
 $('reveal-desc').textContent=desc;
 $('reveal-modal').hidden=false;
 $('reveal-close').focus();
}
function missing(st,cost){
 const wood=Math.max(0,cost.wood-st.wood),petals=Math.max(0,cost.petals-st.petals);
 return [wood?wood+' more wood':'',petals?petals+' more petals':''].filter(Boolean).join(' + ');
}
function rewardText(r){return '🪵 +'+r.wood+' · 🌸 +'+r.petals+(r.chest?' · 🎁 +'+r.chest:'')}
const JOB_LABELS={wood:'🪵 Wood gatherer',petal:'🌸 Gardener',builder:'🔨 Builder',scout:'🧭 Scout'};
function renderWorkers(w=V.workPreview()){
 const list=$('worker-list');if(!list)return;
 $('worker-rate').textContent='🪵 '+w.woodRate+'/h · 🌸 '+w.petalRate+'/h · '+w.builders+' builders · '+w.scouts+' scouts';
 $('world-work-rate').textContent='🪵 '+w.woodRate+'/h · 🌸 '+w.petalRate+'/h · '+w.builders+' builders · '+w.scouts+' scouts';
 if(list.children.length!==w.roles.length){list.replaceChildren();for(let i=0;i<w.roles.length;i++){const row=document.createElement('label'),name=document.createElement('span'),sel=document.createElement('select');name.textContent='🐜 Ant '+(i+1);sel.setAttribute('aria-label','Ant '+(i+1)+' job');for(const [id,label] of Object.entries(JOB_LABELS)){const opt=document.createElement('option');opt.value=id;opt.textContent=label;sel.append(opt)}sel.onchange=()=>{const r=V.assignWorker(i,sel.value);announce(r.ok?'Ant '+(i+1)+' assigned: '+JOB_LABELS[sel.value]:r.error);render()};row.append(name,sel);list.append(row)}}
 [...list.querySelectorAll('select')].forEach((el,i)=>{if(document.activeElement!==el)el.value=w.roles[i];const a=w.workers[i];el.parentElement.firstElementChild.textContent='🐜 Ant '+(i+1)+' · Lv.'+a.level+' · '+a.status});
}
function renderColony(){const c=V.colonyPreview(),st=V.snapshot();$('colony-pop').textContent='🐜 '+c.population+' / '+c.capacity+' ants · 👑 Lv.'+c.queen;$('colony-storage').textContent='📦 Warehouse Lv.'+c.warehouse+' · '+c.maxHours+'h capacity';$('colony-deliveries').textContent=c.deliveries+' completed deliveries';for(const [kind,cost] of [['queen',c.queenCost],['warehouse',c.warehouseCost]]){const b=$('colony-'+kind);b.textContent=cost?'Upgrade '+kind+' · '+cost.wood+' 🪵 '+cost.petals+' 🌸':'Max level';b.disabled=!c.valid||!cost||!!missing(st,cost)}const start=$('hatch-start'),claim=$('hatch-claim');start.hidden=!!c.hatch;start.disabled=!c.valid||c.population>=c.capacity||!!missing(st,c.hatchCost);start.textContent='Hatch ant · '+c.hatchCost.wood+' 🪵 '+c.hatchCost.petals+' 🌸';claim.hidden=!c.hatch;claim.disabled=!c.valid||!c.hatch||c.hatch.remaining>0;claim.textContent=c.hatch?.remaining?'🥚 '+Math.ceil(c.hatch.remaining/1000)+'s until hatch':'🐜 Welcome new ant';$('hatch-note').textContent=c.population>=c.capacity?'Upgrade your queen to raise capacity.':c.hatch?'Egg in nursery':'Hatching takes 3 minutes · no ad required';const goals=$('colony-goals');const signature=V.colonyGoals().map(g=>g.id+g.progress+g.claimed+g.ready).join('|');if(goals.dataset.signature!==signature){goals.dataset.signature=signature;goals.replaceChildren();for(const g of V.colonyGoals()){const row=document.createElement('div'),label=document.createElement('span'),b=document.createElement('button');row.className='life-task';label.textContent=g.name+' · '+g.progress+'/'+g.goal;b.className='btn secondary';b.textContent=g.claimed?'Claimed':'Claim';b.disabled=!g.ready||g.claimed;b.onclick=()=>{const r=V.claimColonyGoal(g.id);announce(r.ok?'Achievement reward: '+rewardText(r):r.error);render()};row.append(label,b);goals.append(row)}}}
function renderRewards(){const w=V.workPreview();renderColony();$('world-work-stock').textContent=rewardText(w);$('world-work-collect').disabled=!w.valid||(!w.wood&&!w.petals);const q=V.upgradePreview();$('upgrade-status').textContent=q?V.catalog[q.item].name+' · '+q.region+' · '+(q.remaining?Math.ceil(q.remaining/1000)+'s left':'Ready to complete'):'No upgrade underway';$('upgrade-finish').hidden=!q;$('upgrade-finish').disabled=!q||q.remaining>0;for(const kind of ['gather','daily','chest','upgrade','expedition']){const b=$('ad-'+kind);b.disabled=!V.adTicket(kind)||typeof Ads==='undefined'||Ads.busy;}}
function showAdReward(kind){const ticket=V.adTicket(kind);if(!ticket)return announce('Reward not available or daily limit reached');if(typeof Ads==='undefined')return announce('Ad unavailable · free options remain');if(!Ads.ready)Ads.init();Ads.rewardedSlot(()=>{const r=V.applyAdReward(ticket);announce(r.ok?(kind==='upgrade'?'Upgrade completed!':kind==='expedition'?'Expedition time reduced by 50%':rewardText(r)):r.error);if(r.ok&&r.souvenir)showCollectible('A secret treasure!',r.souvenir.symbol,r.souvenir.name+' · '+rewardText(r));render();renderRewards()},()=>{announce('Ad skipped or unavailable · no reward granted');renderRewards()});renderRewards()}
function renderLife(){
 const p=V.lifePreview(),collect=$('life-collect'),sign=$('life-sign');
 $('life-stock').textContent=rewardText(p);
 $('life-time').textContent=p.work.storedHours>=p.maxHours?'Storage full · collect to resume':Number.isFinite(p.nextMs)?'Next work trip: '+Math.ceil(p.nextMs/1000)+'s · '+p.maxHours+'h capacity':'Assign gatherers to produce materials';renderWorkers(p.work);
 collect.disabled=!p.valid||(!p.wood&&!p.petals);
 sign.disabled=!p.valid||p.signClaimed;
 sign.textContent=p.signClaimed?'✓ Claimed today':'Claim day '+p.streak+' · '+rewardText(p.signReward);
 $('life-streak').textContent='7-day sign-in · Day '+p.streak+' / 7';
 $('life-calendar').replaceChildren();
 for(let i=1;i<=7;i++){const e=document.createElement('span');e.className='life-day'+(i===p.streak?' current':'');e.textContent=(i===7?'🎁 ':'')+i;$('life-calendar').appendChild(e)}
 const tasks=$('life-tasks');tasks.replaceChildren();
 for(const t of p.tasks){
  const row=document.createElement('div');row.className='life-task';
  const text=document.createElement('div');const b=document.createElement('b');b.textContent=t.label;const sub=document.createElement('small');sub.textContent=t.progress+' / '+t.goal+' · '+rewardText(t);text.append(b,sub);
  const btn=document.createElement('button');btn.type='button';btn.className='btn secondary';btn.textContent=t.claimed?'Claimed':'Claim';btn.disabled=!p.valid||t.claimed||t.progress<t.goal;
  btn.addEventListener('click',()=>{const r=V.claimDaily(t.id);announce(r.ok?'Task reward: '+rewardText(r):r.error);render()});row.append(text,btn);tasks.appendChild(row)
 }
 $('life-clock-note').textContent=p.valid?'Local time · daily reset at midnight.':'Device date moved backward. Rewards resume when the date catches up.';
}
function renderWorld(){
 const p=V.worldPreview(),r=p.regions.find(x=>x.id===p.active),d=new Date(),season=['winter','spring','summer','autumn'][Math.floor(((d.getMonth()+1)%12)/3)],day=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000),weather=r.id==='snow'?'snow':['clear','clear','rain','breeze'][((day%4)+4)%4];
 const panel=$('world-panel');panel.dataset.region=r.id;panel.dataset.season=season;panel.dataset.weather=weather;
 $('region-title').textContent=r.symbol+' '+r.name;$('world-weather').textContent=({clear:'☀️ Clear',rain:'🌧️ Rain',breeze:'🍃 Breeze',snow:'❄️ Snow'})[weather]+' · '+season;
 $('region-progress').textContent=p.paintings+' paintings · '+p.regions.filter(x=>x.unlocked).length+' / 4 regions unlocked';
 const list=$('region-list');list.replaceChildren();
 for(const x of p.regions){const b=document.createElement('button');b.type='button';b.className='region-card'+(x.id===p.active?' active':'');b.disabled=!x.unlocked;b.setAttribute('aria-pressed',String(x.id===p.active));const i=document.createElement('span'),t=document.createElement('b'),s=document.createElement('small');i.textContent=x.symbol;t.textContent=x.name;s.textContent=x.unlocked?x.plots+' / 8 built · '+(x.id===p.active?'Here':'Travel'):'🔒 Clear '+x.unlock+' paintings';b.append(i,t,s);b.onclick=()=>{const z=V.selectRegion(x.id);if(!z.ok){announce(z.error);return}selectedPlot=null;selectedItem=null;removePending=false;announce('Welcome to '+x.name+'!');render()};list.append(b)}
 const relics=$('world-relics');relics.replaceChildren();$('world-relic-count').textContent=p.relics.filter(x=>x.found).length+' / 12 relics found';
 for(const x of p.relics){const b=document.createElement('div');b.className='world-relic'+(x.found?' found':'');b.textContent=(x.found?x.symbol:'🔒')+' '+x.name;const s=document.createElement('small');s.textContent=x.region;b.append(s);relics.append(b)}
 const goals=$('region-goals');goals.replaceChildren();for(const t of V.milestones()){const row=document.createElement('div');row.className='life-task';const desc=document.createElement('div'),b=document.createElement('b'),small=document.createElement('small'),btn=document.createElement('button');b.textContent=t.name;small.textContent='Build '+Math.min(4,t.plots)+'/4 · Lv.2 '+Math.min(2,t.upgraded)+'/2 · Relics '+t.relics+'/3';desc.append(b,small);btn.type='button';btn.className='btn secondary';btn.textContent=t.claimed?'Claimed':'Claim';btn.disabled=!t.ready||t.claimed||!t.unlocked;btn.onclick=()=>{const r=V.claimMilestone(t.id);announce(r.ok?'Region mastered! '+rewardText(r):r.error);render()};row.append(desc,btn);goals.append(row)}
 renderExpedition(p)
}
function renderExpedition(p=V.worldPreview()){
 const e=p.expedition,route=$('exp-route'),role=$('exp-role');
 const routeKey=(e?e.region:p.active);if(route.dataset.region!==routeKey){route.dataset.region=routeKey;route.replaceChildren();for(const t of p.routes){const o=document.createElement('option');o.value=t.id;o.textContent=t.name+' · '+t.minutes+' min';route.append(o)}}
 if(!role.options.length)for(const a of p.roles){const o=document.createElement('option');o.value=a.id;o.textContent=a.name+' · '+a.skill;role.append(o)}
 route.value=e?e.route:routeChoice;role.value=e?e.role:roleChoice;route.disabled=role.disabled=!!e;$('exp-start').hidden=!!e;$('exp-claim').hidden=!e;$('exp-claim').disabled=!e||e.remaining>0;
 const t=p.routes.find(x=>x.id===(e?e.route:routeChoice)),a=p.roles.find(x=>x.id===(e?e.role:roleChoice)),r=p.regions.find(x=>x.id===(e?e.region:p.active));
 $('exp-status').textContent=e?(e.remaining>0?r.name+' · '+t.name+' · '+Math.ceil(e.remaining/60000)+' min left':'Expedition complete — claim your reward!'):'Explore '+r.name+' · '+rewardText({wood:t.wood+(a.id==='worker'?2:0),petals:t.petals+(a.id==='gardener'?2:0)})+(a.id==='scout'?' · Discover a new relic if not yet found':'');
 $('exp-count').textContent=p.completed+' completed expeditions'
}
function render(){
 const st=V.snapshot(),catalog=V.catalog;
 $('wood').textContent=st.wood.toLocaleString();
 $('petals').textContent=st.petals.toLocaleString();
 $('chests').textContent=V.unopenedChests().toLocaleString();
 $('placed').textContent=V.count()+' / 8';
 S.render(st,selectedPlot);
 const plotSelect=$('plot-select');plotSelect.replaceChildren();const none=document.createElement('option');none.value='';none.textContent='Select a plot';plotSelect.append(none);for(const i of [0,1,2,3,5,6,7,8]){const o=document.createElement('option');o.value=String(i);o.textContent='Plot '+([0,1,2,3,5,6,7,8].indexOf(i)+1)+' · '+(st.placements[i]?catalog[st.placements[i]].name:'Empty');plotSelect.append(o)}plotSelect.value=selectedPlot===null?'':String(selectedPlot);
 renderLife();renderWorld();window.AntRegionActivities?.render(true);
 const existing=selectedPlot===null?null:st.placements[selectedPlot];
 const refund=existing?V.refundCost(selectedPlot):null;
 const availableAfterRefund=refund?{wood:st.wood+refund.wood,petals:st.petals+refund.petals}:st;
 const shop=$('shop');shop.replaceChildren();
 for(const [id,item]of Object.entries(catalog)){
  if(!V.itemAllowed(id))continue;
  const btn=document.createElement('button');btn.type='button';
  btn.className='item'+(selectedItem===id?' selected':'');
  btn.setAttribute('aria-pressed',String(selectedItem===id));
  const emoji=document.createElement('span');emoji.className='item-emoji';emoji.textContent=item.symbol;
  const title=document.createElement('span');title.className='item-name';title.textContent=item.name;
  const cost=document.createElement('span');cost.className='item-cost';cost.textContent='🪵 '+item.wood+' · 🌸 '+item.petals;
  const short=missing(availableAfterRefund,item),status=document.createElement('span');status.className='item-status'+(short?' shortage':'');
  status.textContent=existing===id?'Current building':short?'Need '+short:refund?'✓ Affordable after refund':'✓ Affordable';
  btn.append(emoji,title,cost,status);
  btn.addEventListener('click',()=>{
   selectedItem=id;removePending=false;render();
   if(selectedPlot===null)announce('Choose an empty plot on the map first.');
   else if(existing===id)announce('Current building selected. You can upgrade or remove it.');
   else if(short)announce('Not enough materials: '+short+'.');
   else announce(item.name+' selected. Tap '+(existing?'Replace':'Build')+' to confirm.');
   revealBuild();
  });shop.appendChild(btn);
 }
 const item=selectedItem?catalog[selectedItem]:null;
 const cost=existing?V.upgradeCost(selectedPlot):null;
 const build=$('build'),upgrade=$('upgrade'),remove=$('remove'),cancel=$('remove-cancel'),queued=V.upgradePreview();
 const replacing=!!(existing&&item&&selectedItem!==existing);
 const buildShort=item?missing(availableAfterRefund,item):'',upgradeShort=cost?missing(st,cost):'';
 build.disabled=selectedPlot===null||!item||!!buildShort||!!(existing&&!replacing)||removePending;
 upgrade.disabled=!existing||!cost||!!upgradeShort||!!queued;
 if(!existing&&selectedPlot!==null&&item){
  $('build-detail').innerHTML='<b>Plot '+(selectedPlot+1)+' · '+item.name+'</b>🪵 '+item.wood+' · 🌸 '+item.petals+' · '+(buildShort?'Need '+buildShort:'✓ Materials ready — tap Build to confirm.');
  build.textContent=buildShort?'Not enough materials':'Build '+item.name;
 }else if(existing&&removePending){
  $('build-detail').innerHTML='<b>Remove '+catalog[existing].name+'?</b>Return 🪵 '+refund.wood+' · 🌸 '+refund.petals+'. The plot becomes empty. Confirm or cancel.';
 }else if(replacing){
  $('build-detail').innerHTML='<b>Replace '+catalog[existing].name+' → '+item.name+'</b>Refund 🪵 '+refund.wood+' · 🌸 '+refund.petals+'; new Lv.1 costs 🪵 '+item.wood+' · 🌸 '+item.petals+'. '+(buildShort?'Need '+buildShort:'✓ Ready — tap Replace to confirm.');
  build.textContent=buildShort?'Not enough materials':'Replace with '+item.name;
 }else if(existing){
  const lv=V.getLevel(selectedPlot);
  $('build-detail').innerHTML='<b>'+catalog[existing].name+' · Level '+lv+' / 3</b>'+catalog[existing].description+(cost?' · Upgrade: '+cost.wood+' wood + '+cost.petals+' petals. '+(upgradeShort?'Need '+upgradeShort:'✓ Ready to upgrade'):' · Fully upgraded!');
  build.textContent='Choose replacement below';
  $('build-detail').innerHTML+='<br>Choose another building below to replace it, or remove to refund all materials.';
 }else{
  $('build-detail').innerHTML='<b>Choose an empty plot</b>Select a glowing space in the village and choose a building from the workshop.';
  build.textContent='Build decoration';
 }
 upgrade.hidden=!existing||replacing||removePending;
 build.hidden=!!existing&&!replacing||removePending;
 remove.hidden=!existing;
 if(queued&&queued.region===st.world.active&&queued.slot===selectedPlot){build.disabled=true;remove.disabled=true}else remove.disabled=false;
 remove.textContent=removePending?'Confirm removal':'Remove';
 cancel.hidden=!removePending;
 upgrade.textContent=cost?(upgradeShort?'Need materials':'Upgrade to Lv.'+(V.getLevel(selectedPlot)+1)+' ✨'):'Upgrade maxed';
 const available=V.unopenedChests(),open=$('chest-open');
 $('chest-head').textContent=available?available+' unopened chest'+(available!==1?'s':''):'No unopened chests';
 $('chest-figure').setAttribute('aria-disabled',String(!available));open.disabled=!available;
 renderRewards();
 const discoveries=V.discoveries();
 const collection=$('collection');collection.replaceChildren();
 for(const thing of discoveries.items){
  const tile=document.createElement('div');tile.className='collectible'+(thing.unlocked?'':' locked');
  const ico=document.createElement('span');ico.className='symbol';ico.textContent=thing.unlocked?thing.symbol:'❔';
  const name=document.createElement('b');name.textContent=thing.unlocked?thing.name:'Hidden treasure';
  tile.title=thing.unlocked?thing.description:'Unlock by opening milestone chests';
  tile.append(ico,name);collection.appendChild(tile);
 }
 const combos=$('combos');combos.replaceChildren();
 for(const combo of discoveries.combos){
  const card=document.createElement('div');card.className='combo'+(combo.unlocked?' unlocked':'');
  const emoji=document.createElement('span');emoji.className='combo-icon';emoji.textContent=combo.symbol;
  const title=document.createElement('b');title.textContent=combo.unlocked?combo.name:'??? '+combo.name;
  const desc=document.createElement('span');desc.textContent=combo.unlocked?combo.description:'Upgrade '+combo.items.map(i=>catalog[i].name).join(' + ')+' to Lv.2';
  card.append(emoji,title,desc);combos.appendChild(card);
 }
}
document.getElementById('village-world').addEventListener('ant-worker-select',e=>{const i=e.detail.index;if(!Number.isInteger(i)||i<0||i>=V.workPreview().roles.length)return;announce('Ant '+(i+1)+' · '+JOB_LABELS[V.workPreview().roles[i]]);document.getElementById('manage-workers').click();const sel=$('worker-list').querySelectorAll('select')[i];if(sel){sel.scrollIntoView({block:'center'});sel.focus({preventScroll:true})}});
$('plot-select').addEventListener('change',e=>{selectedPlot=e.target.value===''?null:Number(e.target.value);selectedItem=null;removePending=false;render()});
$('world-work-collect').addEventListener('click',()=>{const r=V.collectAnts();announce(r.ok?'Ants delivered '+rewardText(r):r.error);render()});
S.onSelect(i=>{
 selectedPlot=i;selectedItem=null;removePending=false;
 const st=V.snapshot();
 announce(st.placements[i]?'Selected '+V.catalog[st.placements[i]].name+'. Upgrade, remove, or choose a replacement.':'Plot '+(i+1)+' selected. '+(selectedItem?'Confirm your selected building in the workshop.':'Choose a building in the workshop.'));
 render();
 revealBuild();
});
$('build').addEventListener('click',()=>{
 if(selectedPlot===null||!selectedItem)return;
 const existing=V.snapshot().placements[selectedPlot];
 const result=existing?V.replace(selectedPlot,selectedItem,existing):V.place(selectedPlot,selectedItem);
 if(!result.ok){announce('⚠️ '+result.error);return}
 announce('✨ '+V.catalog[selectedItem].name+' has joined your village!');
 showCollectible(existing?'Building replaced!':'New building!',V.catalog[selectedItem].symbol,'Your ants built '+V.catalog[selectedItem].name+'. '+(existing?'Old materials refunded, new building starts at level 1.':'Keep completing puzzles to expand your village.'));
 selectedItem=null;render();
});
$('remove').addEventListener('click',()=>{
 if(selectedPlot===null)return;
 const existing=V.snapshot().placements[selectedPlot];if(!existing)return;
 if(!removePending){removePending=true;selectedItem=null;render();return;}
 const result=V.remove(selectedPlot,existing);
 removePending=false;selectedItem=null;
 announce(result.ok?'Building removed · returned '+result.refund.wood+' wood and '+result.refund.petals+' petals.':'⚠️ '+result.error);
 render();
});
$('remove-cancel').addEventListener('click',()=>{removePending=false;render();});
$('upgrade').addEventListener('click',()=>{if(selectedPlot===null)return;const r=V.upgrade(selectedPlot);announce(r.ok?'Builders started the upgrade! Wait for free or watch an ad to finish.':r.error);render()});
for(const kind of ['queen','warehouse'])$('colony-'+kind).onclick=()=>{const r=V.colonyUpgrade(kind);announce(r.ok?kind+' upgraded to Lv.'+r.level:r.error);render()};$('hatch-start').onclick=()=>{const r=V.hatchStart();announce(r.ok?'Egg is incubating!':r.error);render()};$('hatch-claim').onclick=()=>{const r=V.hatchClaim();announce(r.ok?'A new worker joined your colony!':r.error);render()};
$('upgrade-finish').addEventListener('click',()=>{const r=V.finishUpgrade();announce(r.ok?'Building upgraded to Lv.'+r.level:r.error);if(r.ok)showCollectible('Building upgraded!',V.catalog[r.item].symbol,'Level '+r.level);render()});
for(const kind of ['gather','daily','chest','upgrade','expedition'])$('ad-'+kind).addEventListener('click',()=>showAdReward(kind));
setInterval(()=>{if(!document.hidden){renderRewards();const w=V.workPreview();$('life-stock').textContent=rewardText(w);$('life-collect').disabled=!w.valid||(!w.wood&&!w.petals);if(!$('worker-list').closest('[hidden]'))renderWorkers(w)}},1000);
$('exp-route').addEventListener('change',e=>{routeChoice=e.target.value;renderExpedition()});
$('exp-role').addEventListener('change',e=>{roleChoice=e.target.value;renderExpedition()});
$('exp-start').addEventListener('click',()=>{const r=V.expeditionStart(routeChoice,roleChoice);announce(r.ok?'Your ant has set out!':r.error);render()});
$('exp-claim').addEventListener('click',()=>{const r=V.expeditionClaim();announce(r.ok?'Expedition rewards: '+rewardText(r):r.error);if(r.ok&&r.relic)showCollectible('New relic discovered!',r.symbol,r.relic+' · '+rewardText(r));render()});
setInterval(renderExpedition,1000);
$('life-collect').addEventListener('click',()=>{const r=V.collectAnts();announce(r.ok?'Ants delivered '+rewardText(r):r.error);render()});
$('life-sign').addEventListener('click',()=>{const r=V.signIn();announce(r.ok?'Daily reward: '+rewardText(r.reward):r.error);render()});
setInterval(renderLife,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
window.addEventListener('storage',e=>{if(e.key==='ant_canvas_village_v1')render()});
$('chest-open').addEventListener('click',()=>{
 const result=V.openChest();
 if(!result.ok){announce('⚠️ '+result.error);return}
 $('treasure-result').textContent='+'+result.wood+' 🪵 · +'+result.petals+' 🌸 · '+result.souvenir.name;
 announce('🎁 Treasure found! Your ants discovered '+result.souvenir.name+'.');
 showCollectible('A secret treasure!',result.souvenir.symbol,result.souvenir.description+' · +'+result.wood+' wood, +'+result.petals+' petals');
 render();
});
$('reveal-close').addEventListener('click',()=>$('reveal-modal').hidden=true);
$('reveal-modal').addEventListener('click',e=>{if(e.target===$('reveal-modal'))$('reveal-modal').hidden=true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('reveal-modal').hidden=true});
$('day-night').addEventListener('click',()=>{
 syncDayNight();
 announce('Local time '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})+' · Day 06:00–18:00, night 18:00–06:00.');
});
syncDayNight();
setInterval(syncDayNight,15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncDayNight();});
window.addEventListener('focus',syncDayNight);
$('world-sound').addEventListener('click',()=>{
 const lines=['🐜 Your ants are delivering flowers to the garden.','🪵 Little workers are building new homes.','🌿 Your village is growing one masterpiece at a time.','✨ The residents are exploring the river path.'];
 const message=lines[Math.floor(Math.random()*lines.length)];
 announce(message);
});
window.AntRegionActivities?.setOnChange(render);
render();
})();

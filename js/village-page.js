/* ANT CANVAS Village V2 — construction, building upgrades, collectible chests. */
(function(){
'use strict';
const V=window.AntVillage,S=window.AntVillageScene;
if(!V||!S)return;
const $=id=>document.getElementById(id);
let selectedPlot=null,selectedItem=null,night=false;
function announce(message){
 $('village-message').textContent=message;
 $('world-story').textContent=message;
}
function showCollectible(title,emoji,desc){
 $('reveal-title').textContent=title;
 $('reveal-emoji').textContent=emoji;
 $('reveal-desc').textContent=desc;
 $('reveal-modal').hidden=false;
 $('reveal-close').focus();
}
function render(){
 const st=V.snapshot(),catalog=V.catalog;
 $('wood').textContent=st.wood.toLocaleString();
 $('petals').textContent=st.petals.toLocaleString();
 $('chests').textContent=V.unopenedChests().toLocaleString();
 $('placed').textContent=V.count()+' / 8';
 S.render(st,selectedPlot);
 const shop=$('shop');shop.replaceChildren();
 for(const [id,item]of Object.entries(catalog)){
  const btn=document.createElement('button');btn.type='button';
  btn.className='item'+(selectedItem===id?' selected':'');
  btn.setAttribute('aria-pressed',String(selectedItem===id));
  const emoji=document.createElement('span');emoji.className='item-emoji';emoji.textContent=item.symbol;
  const title=document.createElement('span');title.className='item-name';title.textContent=item.name;
  const cost=document.createElement('span');cost.className='item-cost';cost.textContent='🪵 '+item.wood+' · 🌸 '+item.petals;
  btn.append(emoji,title,cost);
  btn.addEventListener('click',()=>{selectedItem=id;render()});shop.appendChild(btn);
 }
 const item=selectedItem?catalog[selectedItem]:null;
 const existing=selectedPlot===null?null:st.placements[selectedPlot];
 const cost=existing?V.upgradeCost(selectedPlot):null;
 const build=$('build'),upgrade=$('upgrade');
 build.disabled=selectedPlot===null||!item||!!existing;
 upgrade.disabled=!existing||!cost;
 if(!existing&&selectedPlot!==null&&item){
  $('build-detail').innerHTML='<b>Plot '+(selectedPlot+1)+' · '+item.name+'</b>'+item.description+' · Build with '+item.wood+' wood and '+item.petals+' petals.';
  build.textContent='Build '+item.name;
 }else if(existing){
  const lv=V.getLevel(selectedPlot);
  $('build-detail').innerHTML='<b>'+catalog[existing].name+' · Level '+lv+' / 3</b>'+catalog[existing].description+(cost?' · Upgrade: '+cost.wood+' wood + '+cost.petals+' petals.':' · Fully upgraded!');
  build.textContent='Plot already built';
 }else{
  $('build-detail').innerHTML='<b>Choose an empty plot</b>Select a glowing space in the village and choose a building from the workshop.';
  build.textContent='Build decoration';
 }
 upgrade.textContent=cost?'Upgrade to Lv.'+(V.getLevel(selectedPlot)+1)+' ✨':'Upgrade maxed';
 const available=V.unopenedChests(),open=$('chest-open');
 $('chest-head').textContent=available?available+' unopened chest'+(available!==1?'s':''):'No unopened chests';
 $('chest-figure').setAttribute('aria-disabled',String(!available));open.disabled=!available;
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
S.onSelect(i=>{
 selectedPlot=i;
 const st=V.snapshot();
 announce(st.placements[i]?'Selected '+V.catalog[st.placements[i]].name+'. Upgrade it to add details.':'Plot '+(i+1)+' selected. Choose a building in the workshop.');
 render();
});
$('build').addEventListener('click',()=>{
 if(selectedPlot===null||!selectedItem)return;
 const result=V.place(selectedPlot,selectedItem);
 if(!result.ok){announce('⚠️ '+result.error);return}
 announce('✨ '+V.catalog[selectedItem].name+' has joined your village!');
 showCollectible('New building!',V.catalog[selectedItem].symbol,'Your ants built '+V.catalog[selectedItem].name+'. Keep completing puzzles to expand your village.');
 selectedItem=null;render();
});
$('upgrade').addEventListener('click',()=>{
 if(selectedPlot===null)return;
 const res=V.upgrade(selectedPlot);
 if(!res.ok){announce('⚠️ '+res.error);return}
 announce('⭐ Building upgraded to level '+res.level+'!');
 const unlock=res.combos&&res.combos.length;
 showCollectible(unlock?'Theme unlocked!':'Building upgraded!',unlock?'🎆':V.catalog[res.item].symbol,
  unlock?'A special building set is now glowing in your village.':'Your '+V.catalog[res.item].name+' looks even better at level '+res.level+'.');
 render();
});
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
 night=!night;S.setNight(night);
 $('day-night').textContent=night?'☀️ Day':'🌙 Night';
 $('day-night').setAttribute('aria-pressed',String(night));
 announce(night?'✨ The village has settled into a magical evening.':'☀️ A new bright day in your ant village!');
});
$('world-sound').addEventListener('click',()=>{
 const lines=['🐜 Your ants are delivering flowers to the garden.','🪵 Little workers are building new homes.','🌿 Your village is growing one masterpiece at a time.','✨ The residents are exploring the river path.'];
 const message=lines[Math.floor(Math.random()*lines.length)];
 announce(message);
});
render();
})();

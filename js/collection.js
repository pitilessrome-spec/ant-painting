/* ANT CANVAS – collection UI. Locked frames never render their pictures. */
(function(){
'use strict';
const $=id=>document.getElementById(id), P=window.AntCanvasProfile;
if(!P)return;
const PAGE=12, MAX=P.MAX_LEVEL, grid=$('collection-grid');
let from=Math.max(1,P.highest()+1-PAGE),shownLv=0;
function makeArt(lv,unit){
  const g=buildPicture(lv),pal=palette(lv),canvas=document.createElement('canvas');
  canvas.width=g.n*unit;canvas.height=g.n*unit;
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  for(let i=0;i<g.role.length;i++){
    c.fillStyle=pal[g.role[i]]||'#fff';
    c.fillRect((i%g.n)*unit,Math.floor(i/g.n)*unit,unit,unit);
  }
  return {canvas,theme:g.theme||'Mystery artwork'};
}
function updateStats(){
  $('col-total').textContent=P.count().toLocaleString();
  $('col-gems').textContent=(P.gemCount?.()||0).toLocaleString();$('col-daily').textContent=(P.dailyBest?.(new Date().toISOString().slice(0,10))||0)+'/3';
  $('col-series').textContent=P.displayCode();const relics=P.bossRelics?.()||[];$('col-boss').textContent=relics.length+'/4';$('col-boss-list').textContent=['Web Guardian','Iron Beetle','Frost Sentinel','Rainbow King'].map((n,i)=>(relics.includes(n)?['🕷','🪲','❄','🌈'][i]:'🔒')+' '+n).join(' · ');
  const rare=P.rarityTotal();
  $('col-rare').textContent=rare===null?'—':rare.toLocaleString();
}
function appendItem(lv){
  const owned=P.contains(lv),b=document.createElement('button');
  b.type='button';b.className='painting'+(owned?'':' locked');
  b.setAttribute('aria-label',owned?'Open artwork for level '+lv:'Locked level '+lv);
  const preview=document.createElement('div');preview.className='preview';
  if(owned){
    preview.appendChild(makeArt(lv,3).canvas);
    const rarity=P.rarity(lv),tag=document.createElement('span');
    tag.className='rarity '+rarity.id;tag.textContent=rarity.symbol+' '+rarity.title;
    preview.appendChild(tag);
  }else{
    const q=document.createElement('span');q.className='question';q.textContent='?';preview.appendChild(q);
  }
  const meta=document.createElement('div');meta.className='meta';
  const name=document.createElement('b');name.textContent='Level '+lv+(owned&&lv%5===0?' · 🎁 Secret':'');
  const sub=document.createElement('span');sub.textContent=owned?('★'.repeat(P.mastery?.(lv)||0)+(P.hasGem?.(lv)?' 💎 ':' ')+'Collected masterpiece').trim():'🔒 Mystery painting';
  meta.append(name,sub);b.append(preview,meta);
  if(owned)b.addEventListener('click',()=>openDetail(lv));
  else b.disabled=true;
  grid.appendChild(b);
}
function render(){
  from=Math.max(1,Math.min(MAX-PAGE+1,from));
  $('col-from').value=from;
  grid.replaceChildren();
  const frag=document.createDocumentFragment();
  // Avoid rendering any locked picture (not even into an offscreen canvas).
  for(let i=0;i<PAGE;i++)appendItem(from+i);
  $('col-prev').disabled=from===1;
  $('col-next').disabled=from>=MAX-PAGE+1;
}
function openDetail(lv){
  if(!P.contains(lv))return;
  shownLv=lv;
  const holder=$('detail-art');holder.replaceChildren();
  const normal=makeArt(lv,5),primary=document.createElement('div');
  primary.textContent='YOUR CLEARED ARTWORK';primary.style.cssText='font:900 11px system-ui;color:#53718d;margin:9px 0';
  holder.append(primary,normal.canvas);
  if(lv%5===0){
    const secret=document.createElement('div');
    secret.textContent='🎁 SECRET BONUS MASTERPIECE';
    secret.style.cssText='font:900 11px system-ui;color:#a67838;margin:16px 0 10px';
    holder.append(secret,makeArt(lv+100001000,5).canvas);
  }
  $('detail-title').textContent='Level '+lv+' · '+P.rarity(lv).symbol+' '+P.rarity(lv).title;
  const Pict=buildPicture(lv);
  $('detail-desc').textContent=(Pict.theme||'Mystery art')+' · Collected masterpiece';
  $('detail').hidden=false;
}
function closeDetail(){$('detail').hidden=true;shownLv=0;}
$('col-first').onclick=()=>{from=1;render()};
$('col-prev').onclick=()=>{from=Math.max(1,from-PAGE);render()};
$('col-next').onclick=()=>{from=Math.min(MAX-PAGE+1,from+PAGE);render()};
$('col-latest').onclick=()=>{from=Math.max(1,P.highest()+1-PAGE);render()};
$('col-go').onclick=()=>{from=Math.max(1,Math.min(MAX,Math.floor(Number($('col-from').value)||1)));render()};
$('detail-close').onclick=closeDetail;
$('detail').addEventListener('click',e=>{if(e.target===$('detail'))closeDetail()});
addEventListener('keydown',e=>{if(e.key==='Escape')closeDetail()});
$('detail-save').onclick=()=>{
 if(!P.contains(shownLv))return;
 const pic=makeArt(shownLv%5===0?shownLv+100001000:shownLv,8).canvas;
 const a=document.createElement('a');a.download='ant-canvas-'+(shownLv%5===0?'secret-':'')+'level-'+shownLv+'.png';a.href=pic.toDataURL('image/png');a.click();
};
updateStats();render();
})();
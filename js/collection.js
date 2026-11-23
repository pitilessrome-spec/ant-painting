/* ANT CANVAS – collection UI. Locked frames never render their pictures. */
(function(){
'use strict';
const $=id=>document.getElementById(id), P=window.AntCanvasProfile;
if(!P)return;
const PAGE=12, MAX=999999, grid=$('collection-grid');
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
  $('col-series').textContent=P.displayCode();
  // Exact count is feasible even for the game's current maximum (999,999).
  let rare=0;
  for(let i=1;i<=P.highest();i++)if(P.rarity(i).id!=='common')rare++;
  const max=P.highest();
  // Non-contiguous wins are included in the total but not in the streak.
  for(let i=max+1;i<=Math.min(MAX,max+1000);i++)if(P.contains(i)&&P.rarity(i).id!=='common')rare++;
  $('col-rare').textContent=rare.toLocaleString();
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
  const name=document.createElement('b');name.textContent='Level '+lv;
  const sub=document.createElement('span');sub.textContent=owned?'Collected masterpiece':'🔒 Mystery painting';
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
  const holder=$('detail-art');holder.replaceChildren(makeArt(lv,5).canvas);
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
 const pic=makeArt(shownLv,8).canvas;
 const a=document.createElement('a');a.download='ant-canvas-level-'+shownLv+'.png';a.href=pic.toDataURL('image/png');a.click();
};
updateStats();render();
})();
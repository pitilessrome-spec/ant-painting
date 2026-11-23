/* ANT CANVAS — real mystery artwork, painted pixel-by-pixel ONLY on visual ant removal. */
(function(){
 'use strict';
 const root=document.getElementById('stage');if(!root)return;
 const card=document.createElement('section');card.id='ant-mystery-preview';
 card.setAttribute('aria-label','Mystery picture slowly revealed by ants');
 card.style.cssText='position:absolute;left:10px;top:265px;z-index:24;width:111px;padding:5px 6px 6px;background:linear-gradient(145deg,#fff8ffef,#dfedffef);border:2px solid #fff;border-radius:14px;box-shadow:0 5px 13px #25367055;transform-origin:left bottom;transition:transform .2s;pointer-events:auto';
 card.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:2px"><span id="am-title" style="font:900 9px system-ui;color:#385985">🔒 MYSTERY</span><button id="am-toggle" type="button" aria-label="Minimize or expand mystery preview" style="border:0;background:#c3d4ef;color:#244268;border-radius:8px;font-weight:900;padding:1px 5px;cursor:pointer">−</button></div><div id="am-canvas-wrap" style="position:relative;text-align:center"><canvas id="am-canvas" width="48" height="48" style="width:82px;height:82px;image-rendering:pixelated;background:#bac5dc;border:2px solid #e5efff;border-radius:7px;box-shadow:0 2px 5px #35557f44"></canvas><span id="am-question" style="position:absolute;left:0;right:0;top:19px;font:900 34px system-ui;color:#fff;text-shadow:0 2px 8px #294273">?</span></div><div id="am-clue" style="text-align:center;color:#5a7394;font:850 9px system-ui">Remove blocks to reveal</div>';
 root.appendChild(card);
 const canvas=card.querySelector('#am-canvas'),ctx=canvas.getContext('2d'),label=card.querySelector('#am-clue');
 const question=card.querySelector('#am-question'),title=card.querySelector('#am-title'),toggle=card.querySelector('#am-toggle');
 let current=null,mask=null,revealed=0,collapsed=false,stage=-1;
 function blank(){
   if(!current)return;
   ctx.fillStyle='#afbad2';ctx.fillRect(0,0,current.n,current.n);
   ctx.fillStyle='#c6cfdf';
   for(let y=0;y<current.n;y++)for(let x=0;x<current.n;x++)if((x+y)%3===0)ctx.fillRect(x,y,1,1);
 }
 function begin(g){
   current=g;mask=new Uint8Array(g.n*g.n);revealed=0;stage=0;
   canvas.width=g.n;canvas.height=g.n;ctx.imageSmoothingEnabled=false;blank();
   title.textContent='🔒 MYSTERY ART';label.textContent='0% revealed';question.style.opacity='1';
   card.hidden=!!(window.AntHome&&window.AntHome.isOpen);
 }
 function reveal(i){
   if(!current||!mask||i<0||i>=mask.length||mask[i])return;
   mask[i]=1;revealed++;
   const x=i%current.n,y=Math.floor(i/current.n);
   ctx.fillStyle=current.pal[current.role[i]]||'#fff';
   ctx.fillRect(x,y,1,1);
   const ratio=revealed/mask.length;
   const next=ratio>=.99?3:ratio>=.6?2:ratio>=.3?1:0;
   question.style.opacity=String(Math.max(0,1-ratio*5));
   if(next!==stage){
     stage=next;
     if(next===1)label.textContent='🔎 '+(current.theme||'Surprise')+' clue!';
     else if(next===2)label.textContent='✨ Almost revealed!';
     else if(next===3)label.textContent='🎉 Masterpiece found!';
   }else if(revealed%16===0)label.textContent=Math.floor(ratio*100)+'% uncovered';
 }
 function complete(){
   if(!current)return;
   for(let i=0;i<current.n*current.n;i++)reveal(i);
   label.textContent='🎉 Masterpiece found!';title.textContent='✨ REVEALED';
 }
 function show(){
   card.hidden=false;
 }
 function hide(){card.hidden=true;}
 toggle.addEventListener('click',()=>{
   collapsed=!collapsed;
   card.querySelector('#am-canvas-wrap').hidden=collapsed;
   label.hidden=collapsed;toggle.textContent=collapsed?'+':'−';
   card.style.width=collapsed?'103px':'111px';
 });
 const style=document.createElement('style');
 style.textContent='#ant-mystery-preview[hidden]{display:none!important}#ant-mystery-preview #am-canvas-wrap[hidden]{display:none!important}@media(prefers-reduced-motion:reduce){#ant-mystery-preview{transition:none!important}}';
 document.head.appendChild(style);
 window.AntMystery=Object.freeze({begin,reveal,complete,show,hide,get count(){return revealed},get size(){return mask?mask.length:0}});
})();

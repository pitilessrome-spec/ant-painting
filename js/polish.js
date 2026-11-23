/* ANT CANVAS — first minute tutorial and picture reveal, no gameplay rule changes. */
(function(){
 'use strict';
 const stage=document.getElementById('stage');
 if(!stage)return;
 const FLAG='ant_tutorial_finished_v1';
 const mystery=document.createElement('div');
 mystery.id='ant-mystery';
 mystery.setAttribute('aria-live','polite');
 mystery.textContent='🎁 MYSTERY ART';
 mystery.style.cssText='position:absolute;left:13px;top:341px;z-index:41;border:1px solid #ffffffb8;border-radius:12px;height:32px;display:flex;align-items:center;background:#ffffffeb;color:#365181;padding:4px 9px;max-width:191px;white-space:nowrap;overflow:hidden;font:900 10px system-ui;box-shadow:0 3px 9px #1d3a6850';
 stage.appendChild(mystery);
 let mysteryStage=-1,mysteryLevel=0;
 let active=false,step=0,level=0,seen=false,autoTimer=null,lastQueued=0;
 try{seen=localStorage.getItem(FLAG)==='1'}catch(_){}
 const coach=document.createElement('section');
 coach.id='ant-coach';coach.hidden=true;coach.setAttribute('role','status');
 coach.setAttribute('aria-live','polite');
 coach.innerHTML='<div class="ant-coach-step">YOUR FIRST ANT ADVENTURE</div><div class="ant-coach-line"><span class="ant-coach-icon" aria-hidden="true">🐜</span><div><strong id="ant-coach-title">Pick your first color</strong><p id="ant-coach-note">Tap a colorful box below to load an empty slot.</p></div></div><button id="ant-coach-skip" type="button">Skip</button>';
 stage.appendChild(coach);
 const stages=[
  ['Pick your first color','Tap a colorful box below. Ants will work on matching blocks.','🎨'],
  ['Your ant team is ready!','Watch each ant march out. The slot number drops one by one.','🐜'],
  ['Look at them go!','Every ant carries away a matching piece. Clear the picture!','✨']
 ];
 function setStep(next){
  if(!active)return;
  step=next;
  const [title,note,icon]=stages[Math.min(2,next)];
  coach.querySelector('#ant-coach-title').textContent=title;
  coach.querySelector('#ant-coach-note').textContent=note;
  coach.querySelector('.ant-coach-icon').textContent=icon;
  coach.querySelector('.ant-coach-step').textContent='TIP '+(Math.min(next+1,3))+' / 3';
  coach.hidden=false;
 }
 function finish(){
  clearTimeout(autoTimer);autoTimer=null;
  active=false;coach.hidden=true;seen=true;
  try{localStorage.setItem(FLAG,'1')}catch(_){}
 }
 coach.querySelector('button').addEventListener('click',finish);
 function onLevelStart(lv){
  level=lv;mysteryStage=-1;mysteryLevel=lv;
  mystery.textContent='🎁 MYSTERY ART';mystery.hidden=false;
  clearTimeout(autoTimer);autoTimer=null;
  active=!seen&&lv===1;
  step=0;lastQueued=0;coach.hidden=true;
  if(active&&window.AntHome&&!window.AntHome.isOpen) setStep(0);
 }
 function onGameOpened(){
  if(!active || level!==1)return;
  setStep(step);
 }
 function onMenuOpened(){ coach.hidden=true; clearTimeout(autoTimer);autoTimer=null; }
 function onPlaced(game){
  if(!active||!game||game.lv!==1)return;
  if(step===0){
   const queued=game.slots.reduce((n,s)=>n+(s?s.q.length:0),0);
   if(queued>0){lastQueued=queued;setStep(1)}
   else{
    coach.querySelector('#ant-coach-title').textContent='Try another box';
    coach.querySelector('#ant-coach-note').textContent='This color is waiting. Pick a box that ants can clear next.';
   }
  }
 }
 function onTick(game){
  if(!active||step!==1||!game||game.lv!==1||(window.AntHome&&window.AntHome.isOpen))return;
  // The first visual launch proves that ants, rather than taps, drive the slot number.
  if(game.ants.length>0){
   setStep(2);
   autoTimer=setTimeout(finish,4700);
  }
 }
 function onProgress(game){
   if(!game||game.lv!==mysteryLevel)return;
   const pct=game.visualPct?game.visualPct():game.pct();
   const phase=pct>=70?2:pct>=30?1:0;
   if(phase===mysteryStage)return;
   mysteryStage=phase;
   if(phase===0)mystery.textContent='🎁 MYSTERY ART';
   else if(phase===1)mystery.textContent='🔎 CLUE: '+(game.theme||'Surprise');
   else mystery.textContent='✨ REVEAL CLOSE!';
 }
 function onWin(game,lv){
  finish();mystery.hidden=true;
  if(!game||!game.role||!game.pal)return;
  const card=document.querySelector('#win .card');
  if(!card)return;
  let flag=document.getElementById('ant-win-flag');
  if(!flag){
   flag=document.createElement('div');flag.id='ant-win-flag';flag.textContent='✨ MASTERPIECE UNLOCKED ✨';
   card.insertBefore(flag,card.firstChild);
  }
  if(window.AntCanvasProfile){const rarity=window.AntCanvasProfile.rarity(lv);flag.textContent=rarity.symbol+' '+rarity.title.toUpperCase()+' MASTERPIECE UNLOCKED';}
  const heading=card.querySelector('h2');
  if(heading)heading.textContent='Art revealed!';
  let frame=document.getElementById('ant-win-art');
  if(!frame){
   frame=document.createElement('div');frame.id='ant-win-art';
   const canvas=document.createElement('canvas');canvas.id='ant-win-pixels';
   canvas.setAttribute('aria-label','Completed level picture');canvas.setAttribute('role','img');
   frame.appendChild(canvas);
   const p=document.getElementById('winSub'); if(p)card.insertBefore(frame,p);
  }
  const canvas=frame.querySelector('canvas'),size=game.n,context=canvas.getContext('2d');
  canvas.width=size*3;canvas.height=size*3;context.imageSmoothingEnabled=false;
  context.fillStyle='#f0fcff';context.fillRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const idx=y*size+x;const col=game.pal[game.role[idx]];
   context.fillStyle=col||'#dceefa';context.fillRect(x*3,y*3,3,3);
  }
  frame.removeAttribute('hidden');
  frame.querySelector('canvas').style.animation='none';
  void frame.querySelector('canvas').offsetWidth;
  frame.querySelector('canvas').style.animation='';
  let stars=document.getElementById('ant-win-stars');
  if(!stars){
   stars=document.createElement('div');stars.id='ant-win-stars';
   stars.innerHTML='<span>⭐</span><span>🌟</span><span>⭐</span>';
   frame.insertAdjacentElement('afterend',stars);
  }
  stars.querySelectorAll('span').forEach(s=>{s.style.animation='none';void s.offsetWidth;s.style.animation=''});
 }
 window.AntPolish=Object.freeze({onLevelStart,onGameOpened,onMenuOpened,onPlaced,onTick,onProgress,onWin,get teaching(){return active}});
})();

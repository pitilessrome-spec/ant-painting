/* ANT CANVAS - high visibility colored ant cannon effects.
   Pure presentation: targets are supplied by the puzzle engine, never selected here. */
(function(){
 'use strict';
 let bolts=[],rings=[],shards=[],announce=0,flash=0,shake=0;
 const root=document.getElementById('stage');
 const banner=document.createElement('div');banner.id='ant-blast-announcement';
 banner.setAttribute('aria-live','polite');
 banner.textContent='🌈 COLOR BLAST!';
 banner.style.cssText='position:absolute;z-index:48;top:132px;left:22px;right:22px;pointer-events:none;text-align:center;font:1000 26px system-ui;color:#fff;text-shadow:0 3px #61207f,0 0 15px #f832f5,0 0 24px #fdd76d;opacity:0;transform:scale(.55) rotate(-7deg);transition:opacity .16s,transform .22s';
 const glow=document.createElement('div');glow.id='ant-blast-tunnel';
 glow.style.cssText='position:absolute;z-index:10;pointer-events:none;width:50px;height:26px;border-radius:50%;border:3px solid #fffcca;box-shadow:0 0 13px 6px #ff59dc,0 0 24px 12px #57dfff;opacity:0';
 if(root){root.append(banner);document.getElementById('board').appendChild(glow)}
 let count=0;
 function ready(){announce=1750;count=0;banner.style.opacity='1';banner.style.transform='scale(1.1) rotate(0)';}
 function fire(i,c){bolts.push({i,c,age:0,spark:Math.random()*6.28});count++}
 function reset(){bolts=[];rings=[];shards=[];announce=0;flash=0;shake=0;banner.style.opacity='0';glow.style.opacity='0';count=0}
 function draw(dt,fx,G,proj,onHit){
   if(!G)return;
   const hole=proj(G.n/2,G.n+.65,0);
   // The empowered ant is deliberately oversized so it reads on mobile screens.
   if(announce>0||bolts.length>0){
     const color=bolts.length?G.pal[bolts[0].c]:'#ff85e8';
     fx.save();fx.translate(hole[0],hole[1]);fx.shadowColor=color;fx.shadowBlur=23;
     fx.fillStyle='rgba(255,232,121,.36)';fx.beginPath();fx.arc(0,0,24,0,6.283);fx.fill();
     fx.strokeStyle='#ffffff';fx.lineWidth=2.6;fx.beginPath();fx.arc(0,0,20,0,6.283);fx.stroke();
     fx.shadowBlur=8;fx.lineWidth=2;fx.strokeStyle='#251c4c';fx.fillStyle=color;
     fx.beginPath();fx.ellipse(-8,3,10,8,-.15,0,6.283);fx.fill();fx.stroke();
     fx.fillStyle='#31264e';fx.beginPath();fx.ellipse(6,1,8,6,.1,0,6.283);fx.fill();fx.stroke();
     fx.fillStyle='#fff';fx.beginPath();fx.arc(9,-1,2,0,6.283);fx.fill();
     fx.strokeStyle='#372254';fx.lineWidth=3;fx.beginPath();fx.moveTo(4,-4);fx.lineTo(14,-17);fx.stroke();
     fx.strokeStyle=color;fx.lineWidth=9;fx.beginPath();fx.moveTo(8,-7);fx.lineTo(18,-21);fx.stroke();
     fx.strokeStyle='#fff1c9';fx.lineWidth=4;fx.beginPath();fx.moveTo(8,-7);fx.lineTo(18,-21);fx.stroke();
     fx.fillStyle='#fff';fx.beginPath();fx.arc(18,-21,5,0,6.283);fx.fill();
     fx.restore();
   }
   if(announce>0){
     announce=Math.max(0,announce-dt);
     if(announce<500)banner.style.opacity=String(announce/500);
     glow.style.left=(hole[0]-25)+'px';glow.style.top=(hole[1]-13)+'px';
     glow.style.opacity=String(Math.min(1,announce/200));
   }else glow.style.opacity='0';
   for(let j=bolts.length-1;j>=0;j--){
     const b=bolts[j];b.age+=dt*(G.speed||1);
     const t=Math.min(1,b.age/480),ease=t*t*(3-2*t);
     const end=proj(b.i%G.n+.5,Math.floor(b.i/G.n)+.5,0.25);
     const from=hole;
     const at=u=>[from[0]+(end[0]-from[0])*u,from[1]+(end[1]-from[1])*u-32*Math.sin(Math.PI*u)];
     const [x,y]=at(ease),[px,py]=at(Math.max(0,ease-.21));
     fx.save();fx.lineCap='round';fx.globalAlpha=.94;
     fx.shadowBlur=24;fx.shadowColor=G.pal[b.c];
     fx.strokeStyle=G.pal[b.c];fx.lineWidth=17;fx.beginPath();fx.moveTo(px,py);fx.lineTo(x,y);fx.stroke();
     fx.shadowBlur=5;fx.strokeStyle='#fffdf0';fx.lineWidth=5;fx.beginPath();fx.moveTo(px,py);fx.lineTo(x,y);fx.stroke();
     const grad=fx.createRadialGradient(x,y,1,x,y,19);grad.addColorStop(0,'#ffffff');grad.addColorStop(.35,G.pal[b.c]);grad.addColorStop(1,'rgba(255,255,255,0)');
     fx.fillStyle=grad;fx.beginPath();fx.arc(x,y,19,0,6.283);fx.fill();
     fx.fillStyle='#ffffff';fx.beginPath();fx.arc(x,y,5,0,6.283);fx.fill();
     fx.restore();
     if(t>=1){
       bolts.splice(j,1);onHit(b.i,b.c);flash=Math.max(flash,180);shake=170;
       rings.push({x:end[0],y:end[1],color:G.pal[b.c],age:0});
       for(let k=0;k<23;k++){
         const a=k*Math.PI*2/23+Math.random()*.1,sp=1.7+Math.random()*5;
         shards.push({x:end[0],y:end[1],vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.8,
           color:k%5===0?'#ffffff':k%4===0?'#ffdd5a':G.pal[b.c],age:0,size:2+Math.random()*4});
       }
     }
   }
   for(let j=rings.length-1;j>=0;j--){
     const a=rings[j];a.age+=dt;const t=Math.min(1,a.age/530);
     fx.save();fx.globalAlpha=(1-t)*.98;fx.shadowColor=a.color;fx.shadowBlur=18;
     for(let k=0;k<2;k++){
       fx.strokeStyle=k===0?a.color:'#ffffff';fx.lineWidth=(k===0?8:3)*(1-t)+.4;
       fx.beginPath();fx.arc(a.x,a.y,5+(k===0?44:29)*t,0,6.283);fx.stroke();
     }
     for(let k=0;k<8;k++){
       const angle=k*Math.PI/4;const inner=10+26*t,outer=18+43*t;
       fx.strokeStyle=k%2?'#ffef79':a.color;fx.lineWidth=3*(1-t)+.4;
       fx.beginPath();fx.moveTo(a.x+Math.cos(angle)*inner,a.y+Math.sin(angle)*inner);fx.lineTo(a.x+Math.cos(angle)*outer,a.y+Math.sin(angle)*outer);fx.stroke();
     }
     fx.restore();if(t>=1)rings.splice(j,1);
   }
   for(let j=shards.length-1;j>=0;j--){
     const q=shards[j];q.age+=dt;q.x+=q.vx*dt/16;q.y+=q.vy*dt/16;q.vy+=.17*dt/16;
     fx.save();fx.globalAlpha=Math.max(0,1-q.age/700);fx.fillStyle=q.color;fx.shadowBlur=6;fx.shadowColor=q.color;
     fx.translate(q.x,q.y);fx.rotate(q.age*.009+j);fx.fillRect(-q.size/2,-q.size/2,q.size,q.size);fx.restore();
     if(q.age>700)shards.splice(j,1);
   }
   if(flash>0){
     fx.save();fx.globalAlpha=flash/180*.22;fx.fillStyle='#ffffff';fx.fillRect(0,0,360,318);fx.restore();
     flash=Math.max(0,flash-dt);
   }
   if(shake>0){shake=Math.max(0,shake-dt)}
 }
 window.AntBlastFX=Object.freeze({fire,ready,reset,draw,get active(){return bolts.length},get impacts(){return rings.length}});
})();

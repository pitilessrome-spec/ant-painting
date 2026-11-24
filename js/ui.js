/* ANT CANVAS · page and UI logic */
const $=s=>document.querySelector(s);
const VW=360,VH=318,SPEEDS=[1,2,3];
const stage=$('#stage'),glc=$('#gl'),fxc=$('#fx'),fx=fxc.getContext('2d');
let S=1,DPR=1,G=null,LV=1,MAXLV=1,spIdx=0,x3ok=false,unlocks=2,reshuf=false,hintT=0,adT=0,adCb=null,SND=1,shown='',lastUI=0,PAR=[],anims=new Map(),shakeCol=-1,shakeUntil=0,toastH=0,PROJECTILES=[];
let R3=null,scene=null,cam=null,mesh=null,DM=null,VEC=null,CLR=null,CW=.1,ZC=0,ZTOP=0,AC=null;
let st={};try{st=JSON.parse(localStorage.getItem('mbh3'))||{}}catch(e){}
MAXLV=st.maxLv||1;SND=st.snd===undefined?1:st.snd;

function save(){try{localStorage.setItem('mbh3',JSON.stringify({lv:LV,maxLv:MAXLV,snd:SND}))}catch(e){}}
function beep(f,d,v){if(!SND)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(v||.05,AC.currentTime);g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toastH);toastH=setTimeout(()=>e.classList.remove('on'),1400)}
// Placeholder ad (provider "mock"): counts as watched after 1.5 seconds
function startMockAd(cb){adCb=cb;adT=1500;$('#ad').classList.add('on')}
// All rewarded ads go through the Ads layer; no reward unless the ad is watched
function ad(cb){Ads.rewarded(cb,()=>toast('No ad available right now, please try again later'))}
function rrPath(p,x,y,w,h,r){p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y)}
function mix(a,b,t){const x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16);return '#'+[16,8,0].map(s=>{const p=x>>s&255,q=y>>s&255;return Math.round(p+(q-p)*t).toString(16).padStart(2,'0')}).join('')}
function tokStyle(role){const base=G.pal[role];const r=parseInt(base.slice(1,3),16),g=parseInt(base.slice(3,5),16),b=parseInt(base.slice(5,7),16);const lum=.299*r+.587*g+.114*b;return `--c:${base};--l:${mix(base,'#ffffff',.3)};--d:${mix(base,'#000000',.3)};--t:${lum>168?'#2b2d42':'#ffffff'}`}

/* ---------- 3D tray and cells (three.js orthographic camera, angled view) ---------- */
function init3D(){
 if(typeof THREE==='undefined')return;
 R3=new THREE.WebGLRenderer({canvas:glc,antialias:true,alpha:true});
 R3.shadowMap.enabled=true;R3.shadowMap.type=THREE.PCFSoftShadowMap;R3.shadowMap.autoUpdate=false;
 scene=new THREE.Scene();
 cam=new THREE.OrthographicCamera(-2,2,VH/VW*2,-VH/VW*2,.1,60);
 cam.position.set(0,4.2,8.6);cam.lookAt(0,-.2,0);cam.updateMatrixWorld();
 scene.add(new THREE.HemisphereLight(0xffffff,0x9cc4ec,.95));
 const dl=new THREE.DirectionalLight(0xffffff,.75);dl.position.set(-2.5,5,4);dl.castShadow=true;
 dl.shadow.mapSize.set(1024,1024);
 Object.assign(dl.shadow.camera,{left:-2.8,right:2.8,top:2.8,bottom:-2.8,near:.5,far:20});
 dl.shadow.camera.updateProjectionMatrix();dl.shadow.bias=-.0008;scene.add(dl);
 const sh=new THREE.Shape();rrPath(sh,-1.74,-1.74,3.48,3.48,.32);
 const tg=new THREE.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:3,curveSegments:10});
 const tray=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({color:0xa8d4f4,roughness:.55,metalness:0}));
 tray.position.z=-.23;tray.receiveShadow=true;scene.add(tray);
 DM=new THREE.Object3D();VEC=new THREE.Vector3();CLR=new THREE.Color();
}
function buildBoard(){
 if(!R3||!G)return;
 if(mesh){scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();mesh=null}
 const n=G.n;CW=3.2/n;
 const d=CW*.75,bev=CW*.1,hs=CW*.44-bev;
 const sh=new THREE.Shape();rrPath(sh,-hs,-hs,hs*2,hs*2,Math.max(.002,CW*.16));
 const geo=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:true,bevelThickness:bev,bevelSize:bev*.9,bevelSegments:2,curveSegments:4});
 geo.translate(0,0,-d/2);
 ZC=-.02+d/2+bev;ZTOP=ZC+d/2+bev;
 mesh=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({roughness:.36,metalness:.02}),n*n);
 mesh.castShadow=true;mesh.receiveShadow=true;
 const C=new THREE.Color();
 for(let i=0;i<n*n;i++){setInst(i,1,0);mesh.setColorAt(i,C.set(G.pal[G.role[i]]))}
 mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
 scene.add(mesh);
 if(R3)R3.shadowMap.needsUpdate=true;
}
function setInst(i,sc,lift){const n=G.n,x=i%n,y=(i-x)/n;DM.position.set((x+.5-n/2)*CW,-(y+.5-n/2)*CW,ZC+lift);DM.scale.set(sc,sc,sc);DM.updateMatrix();mesh.setMatrixAt(i,DM.matrix)}
function proj(gx,gy,z){if(!cam||!G)return[VW/2,VH/2];const n=G.n;VEC.set((gx-n/2)*CW,-(gy-n/2)*CW,z).project(cam);return[(VEC.x+1)/2*VW,(1-VEC.y)/2*VH]}
function placeHole(){const n=G.n,p=proj(n/2,n+.9,0),h=$('#hole');h.style.left=(p[0]-24)+'px';h.style.top=(p[1]-7)+'px';h.style.width='48px';h.style.height='14px'}
function draw3D(dt){
 if(!R3||!mesh)return;
 if(anims.size){for(const [i,t0] of anims){const t=t0+dt,k=Math.min(1,t/300),e=1-Math.pow(1-k,3);setInst(i,Math.max(0,1-e),e*.22);if(k>=1)anims.delete(i);else anims.set(i,t)}
  mesh.instanceMatrix.needsUpdate=true;R3.shadowMap.needsUpdate=true}
 R3.render(scene,cam);
}
function fit(){
 S=Math.min(innerWidth/VW,innerHeight/640);
 stage.style.transform='translate(-50%,-50%) scale('+S+')';
 DPR=Math.min(3,(devicePixelRatio||1)*S);
 if(R3){R3.setPixelRatio(DPR);R3.setSize(VW,VH,false)}
 fxc.width=Math.round(VW*DPR);fxc.height=Math.round(VH*DPR);
}

/* ---------- Ants and particles (drawn on the 2D canvas) ---------- */
function burst(i,c){const n=G.n,p=proj(i%n+.5,Math.floor(i/n)+.5,ZTOP);for(let k=0;k<6;k++)PAR.push({x:p[0],y:p[1],vx:(Math.random()-.5)*2.6,vy:-Math.random()*2.4-.6,l:480,c:G.pal[c]})}
function drawAnt(a,now){
 const z=a.y<G.n+.2?ZTOP+.05:.02;
 const p=proj(a.x,a.y,z),q=proj(a.x+(a.ux||0)*.4,a.y+(a.uy||-1)*.4,z);
 const ang=Math.atan2(q[1]-p[1],q[0]-p[0]),s=CW*90/5,wig=Math.sin(now*.025+a.x*4)*.7;
 fx.save();fx.translate(p[0],p[1]);fx.rotate(ang);fx.scale(s,s);
 fx.fillStyle='rgba(20,30,60,.22)';fx.beginPath();fx.ellipse(.8,2.4,5.2,2.2,0,0,6.283);fx.fill();
 fx.strokeStyle='#26283a';fx.lineWidth=.45;fx.beginPath();
 for(let i=-1;i<=1;i++){const sg=i%2?1:-1;fx.moveTo(i*1.3,0);fx.lineTo(i*2.4+wig*sg,-3.2);fx.moveTo(i*1.3,0);fx.lineTo(i*2.4-wig*sg,3.2)}
 fx.stroke();
 fx.lineWidth=.35;fx.strokeStyle='#1a1c28';
 fx.fillStyle='#2a2d3f';fx.beginPath();fx.ellipse(0,0,2.1,1.6,0,0,6.283);fx.fill();fx.stroke();
 fx.fillStyle=G.pal[a.c];fx.beginPath();fx.ellipse(-3.4,0,2.8,2.2,0,0,6.283);fx.fill();fx.stroke();
 fx.fillStyle='#2a2d3f';fx.beginPath();fx.ellipse(3.1,0,1.9,1.6,0,0,6.283);fx.fill();fx.stroke();
 fx.fillStyle='#fff';fx.beginPath();fx.arc(3.8,-.8,.5,0,6.283);fx.arc(3.8,.8,.5,0,6.283);fx.fill();
 fx.strokeStyle='#1a1c28';fx.beginPath();fx.moveTo(4.6,-.6);fx.lineTo(6.2,-1.6);fx.moveTo(4.6,.6);fx.lineTo(6.2,1.6);fx.stroke();
 if(a.ph===1){fx.fillStyle=G.pal[a.c];fx.strokeStyle='rgba(0,0,0,.45)';fx.lineWidth=.35;fx.fillRect(-1.6,-1.4,2.8,2.8);fx.strokeRect(-1.6,-1.4,2.8,2.8)}
 fx.restore();
}
function blastParticles(i,c){
 const p=proj(i%G.n+.5,Math.floor(i/G.n)+.5,ZTOP);
 for(let k=0;k<15;k++)PAR.push({x:p[0],y:p[1],vx:(Math.random()-.5)*7,vy:(Math.random()-.5)*7-2,l:440,c:G.pal[c]});
}
function drawFX(dt,now){
 fx.setTransform(DPR,0,0,DPR,0,0);fx.clearRect(0,0,VW,VH);
 if(!G)return;
 for(const p of PAR){p.x+=p.vx*dt/16;p.y+=p.vy*dt/16;p.vy+=.12*dt/16;p.l-=dt}
 PAR=PAR.filter(p=>p.l>0);
 for(const p of PAR){fx.globalAlpha=Math.max(0,Math.min(1,p.l/400));fx.fillStyle=p.c;fx.fillRect(p.x-2.2,p.y-2.2,4.4,4.4)}
 fx.globalAlpha=1;
 // Colored bolts fly from the ant tunnel and hit only the already-authorized matching target.
 for(let i=PROJECTILES.length-1;i>=0;i--){
   const sh=PROJECTILES[i];sh.age+=dt*(G.speed||1);
   const t=Math.min(1,sh.age/290),smooth=1-Math.pow(1-t,2);
   const a=proj(G.n/2,G.n+.58,.02),b=proj(sh.i%G.n+.5,Math.floor(sh.i/G.n)+.5,ZTOP);
   const x=a[0]+(b[0]-a[0])*smooth,y=a[1]+(b[1]-a[1])*smooth;
   fx.save();fx.globalAlpha=Math.min(1,t*7);fx.strokeStyle=G.pal[sh.c];fx.lineWidth=3.8;fx.shadowBlur=11;fx.shadowColor=G.pal[sh.c];
   fx.beginPath();fx.moveTo(a[0]+(x-a[0])*.67,a[1]+(y-a[1])*.67);fx.lineTo(x,y);fx.stroke();
   fx.fillStyle='#fff';fx.beginPath();fx.arc(x,y,3.3,0,Math.PI*2);fx.fill();fx.restore();
   if(t>=1){anims.set(sh.i,0);blastParticles(sh.i,sh.c);G.visualDone=Math.min(G.total,(G.visualDone||0)+1);beep(800+Math.random()*260,.075,.035);PROJECTILES.splice(i,1)}
 }
 for(const a of G.ants)drawAnt(a,now);
 if(window.AntBlastFX)window.AntBlastFX.draw(dt,fx,G,proj,(i,c)=>{
   anims.set(i,0);blastParticles(i,c);
   G.visualDone=Math.min(G.total,(G.visualDone||0)+1);
   if(window.AntMystery)window.AntMystery.reveal(i);
   beep(840+Math.random()*220,.1,.05);
 });
}
function handleEv(){
 for(const e of G.ev){
  if(e.t==='eat'){anims.set(e.i,0);burst(e.i,e.c);G.visualDone=Math.min(G.total,(G.visualDone||0)+1);if(window.AntMystery)window.AntMystery.reveal(e.i);beep(560+Math.random()*420,.07,.035)}
  else if(e.t==='shot'){if(window.AntBlastFX)window.AntBlastFX.fire(e.i,e.c);else PROJECTILES.push({i:e.i,c:e.c,age:0})}
  else if(e.t==='blastReady'){if(window.AntBlastFX)window.AntBlastFX.ready();else toast('🌈 Color Blast!');beep(990,.17,.07)}
  else if(e.t==='claim'&&mesh){mesh.setColorAt(e.i,CLR.set(mix(G.pal[e.c],'#ffffff',.35)));mesh.instanceColor.needsUpdate=true}
  else if(e.t==='reshuffle')toast('No moves left, boxes reshuffled');
  else if(e.t==='stall')toast('No box can move right now. Think about what to load next');
 }
 G.ev.length=0;
}

/* ---------- UI (HTML) ---------- */
function renderUI(){
 if(!G)return;
 $('#lv').textContent='Level '+LV;
 $('#pv').textContent=G.visualPct()+'%';
 if(window.AntWorkshop)window.AntWorkshop.render(G);
 $('#spd').textContent=(spIdx===1&&!x3ok)?'×2 ▸ ×3 (ad)':'×'+SPEEDS[spIdx];
 $('#rsh').classList.toggle('off',LV<10);
 $('#rsh').textContent=reshuf?'Reshuffle ▶':'Reshuffle';
 let sh='';
 for(let i=0;i<G.cap;i++){const b=G.slots[i];sh+=b?`<div class="tile tk" style="${tokStyle(b.c)}"><span>${G.slotDisplayCount(b)}</span></div>`:'<div class="tile empty"></div>'}
 if(G.cap===4)sh+='<button type="button" class="tile unlock ad-slot" data-act="unlock" aria-label="Unlock fifth slot by watching a rewarded advertisement" title="Watch a rewarded ad to unlock the fifth slot">🎬<small>AD SLOT</small></button>';
 $('#slots').innerHTML=sh;
 const hc=G.state==='play'?G.hint():-1;
 let th='';
 const now=performance.now();
 for(let c=0;c<4;c++)for(let r=2;r>=0;r--){
   const b=G.cols[c][r];if(!b)continue;
   const play=false;
   const cls=['tk','tok'];
   if(play)cls.push('pl');
   if(r===0&&c===hc&&hintT>0)cls.push('hl');
   if(r===0&&c===shakeCol&&now<shakeUntil)cls.push('shk');
   th+=`<div class="${cls.join(' ')}" data-col="${c}" style="left:${24+c*80}px;top:${[0,40,74][r]}px;width:72px;height:${[52,46,38][r]}px;opacity:${[1,.85,.5][r]};z-index:${10-r};${tokStyle(b.c)}"><span>${b.n}</span>${play?'<i class="dot"></i>':''}</div>`;
 }
 $('#tok').innerHTML=th;
}

/* ---------- Levels and flow ---------- */
function newLevel(lv){
 LV=Math.max(1,Math.min((window.AntCanvasProfile&&window.AntCanvasProfile.MAX_LEVEL)||999999,Math.floor(Number(lv)||1)));
 window.ANT_CANVAS_CURRENT_LEVEL=LV;
 spIdx=Math.min(spIdx,LV>=10?1:0);x3ok=false;
 G=makeGame(LV,{speed:SPEEDS[spIdx]});
 window.ANT_CANVAS_GAME=G;
 if(window.AntBlastFX)window.AntBlastFX.reset();
 if(window.AntMystery)window.AntMystery.begin(G);
 MAXLV=Math.max(MAXLV,LV);reshuf=false;unlocks=3;shown='play';hintT=0;PAR=[];PROJECTILES=[];anims.clear();
 $('#win').classList.remove('on');$('#lose').classList.remove('on');
 buildBoard();placeHole();save();renderUI();Ads.gameplay(!window.AntHome||!window.AntHome.isOpen);
 if(window.AntTelegram) window.AntTelegram.onLevelStart(LV);
 if(window.AntPolish) window.AntPolish.onLevelStart(LV);
}
function onWin(){
 const firstCollect=window.AntCanvasProfile?window.AntCanvasProfile.complete(LV):false;
 const reward=firstCollect&&window.AntVillage?window.AntVillage.award(LV,window.AntCanvasProfile.rarity(LV)):null;
 if(window.AntTelegram) window.AntTelegram.onLevelComplete(LV);
 if(window.AntPolish) window.AntPolish.onWin(G,LV);
 if(window.AntMystery)window.AntMystery.complete();
 MAXLV=Math.max(MAXLV,Math.min((window.AntCanvasProfile&&window.AntCanvasProfile.MAX_LEVEL)||999999,LV+1));save();
 $('#winSub').textContent='Level '+LV+' complete · 100%'+(window.AntCanvasProfile?' · '+window.AntCanvasProfile.rarity(LV).symbol+' '+window.AntCanvasProfile.rarity(LV).title:'');
 const rewardEl=$('#winReward');if(rewardEl)rewardEl.textContent=reward?'🪵 +'+reward.wood+' wood  🌸 +'+reward.petals+' petals'+(reward.chest?'  🎁 BONUS CHEST!':''):'🖼️ Painting already collected';
 $('#win').classList.add('on');
 [523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.25,.05),i*120));
 for(let i=0;i<70;i++)PAR.push({x:Math.random()*VW,y:-10-Math.random()*60,vx:(Math.random()-.5)*1.2,vy:1+Math.random()*2,l:2600,c:G.pal[(Math.random()*8)|0]});
}

stage.addEventListener('pointerdown',e=>{
 if(!G||adT>0)return;
 const el=e.target.closest('[data-col],[data-act]');if(!el)return;
 if(el.dataset.col!==undefined){
   const c=+el.dataset.col,r=G.place(c);
   if(r===1){beep(520,.07,.05);renderUI();if(window.AntPolish)window.AntPolish.onPlaced(G)}
   else if(r===2)toast('All slots are full, wait a moment');
   else if(r===3){toast("This color can't be eaten yet");shakeCol=c;shakeUntil=performance.now()+400;renderUI()}
   return;
 }
 const a=el.dataset.act;
 if(a==='unlock'){
   if(G.cap!==4)return;
   if(!Ads.canRewardSlot()){toast('Rewarded ads coming soon · fifth slot not yet available');return}
   Ads.rewardedSlot(()=>{if(G&&G.cap===4){G.addSlot();renderUI();toast('🎉 Fifth slot unlocked by rewarded ad!')}},()=>toast('Ad skipped or unavailable · no slot unlocked'));
  }
 else if(a==='speed'){
   if(spIdx===0){ if(LV<10)toast('×2 unlocks at level 10'); else{spIdx=1;G.speed=SPEEDS[spIdx]} }
   else if(spIdx===1){ if(x3ok){spIdx=2;G.speed=SPEEDS[spIdx]} else ad(()=>{x3ok=true;spIdx=2;G.speed=SPEEDS[spIdx];renderUI();toast('×3 unlocked for this level')}) }
   else{ spIdx=0; G.speed=SPEEDS[spIdx] }
   renderUI()
 }
 else if(a==='hint')ad(()=>{hintT=6000;toast('The glowing box is the next one to load')});
 else if(a==='reshuffle'){
   if(LV<10)toast('Reshuffle unlocks at level 10');
   else if(G.ants.length)toast('Wait for the ants to finish first');
   else if(!reshuf){ G.reshuffle(); reshuf=true; toast('Boxes reshuffled'); renderUI(); }
   else ad(()=>{ if(G.reshuffle())toast('Boxes reshuffled'); renderUI(); });
 }
 else if(a==='prev'&&LV>1)newLevel(LV-1);
 else if(a==='next'&&LV<MAXLV)newLevel(LV+1);
 else if(a==='nextLv')Ads.midgame(()=>newLevel(LV+1));
 else if(a==='retry')newLevel(LV);
 else if(a==='viewGallery'){location.href='collection.html'}
 else if(a==='viewVillage'){location.href='village.html'}
 else if(a==='reviveAd')ad(()=>{G.revive();$('#lose').classList.remove('on');shown='play';renderUI()});
 else if(a==='snd'){SND=SND?0:1;save();toast(SND?'Sound on':'Sound off')}
});

let last=performance.now();
function frame(now){
 const dt=Math.min(50,now-last);last=now;
 if(adT>0){
   adT-=dt;$('#adbar').style.width=(100*Math.min(1,1-adT/1500))+'%';
   if(adT<=0){adT=0;$('#ad').classList.remove('on');const f=adCb;adCb=null;if(f)f()}
 }
 if(G){
   if(adT<=0&&!Ads.busy&&(!window.AntHome||!window.AntHome.isOpen)&&G.state==='play')G.tick(dt);
   if(window.AntPolish)window.AntPolish.onTick(G);
   handleEv();
   if(hintT>0)hintT-=dt;
   if(G.state!==shown){
     shown=G.state;
     if(shown==='win')onWin();
     else if(shown==='lose'){$('#lose').classList.add('on');beep(180,.4,.06);renderUI()}
   }
 }
 if(now-lastUI>90){renderUI();lastUI=now}
 draw3D(dt);drawFX(dt,now);
 requestAnimationFrame(frame);
}

init3D();
Ads.init();
if(window.AntTelegram) window.AntTelegram.init();
if(window.Telegram&&window.Telegram.WebApp){window.Telegram.WebApp.ready();window.Telegram.WebApp.expand();}
if(!R3)toast('3D view failed to load, please check your connection');
fit();window.addEventListener('resize',fit);
newLevel(st.lv||MAXLV);
if(window.AntHome)window.AntHome.afterBoot();
requestAnimationFrame(frame);
// Reveal only when the main menu exists and the 360x640 stage is correctly fitted.
// This prevents Telegram's initial blue blank panel and offscreen gameplay controls.
requestAnimationFrame(()=>requestAnimationFrame(()=>{
 if(window.AntHome&&window.AntHome.isOpen)document.documentElement.classList.add('ant-ready');
}));

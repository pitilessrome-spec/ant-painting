'use strict';
const {makeGame,SKILL_TYPES,iceLocked,bossLocked,treasureLocked}=require('./core');
const {createReward}=require('./reward'),config=require('./config');
const ads=createReward(wx,config.rewardedAdUnitId);
const canvas=wx.createCanvas(),ctx=canvas.getContext('2d'),info=wx.getSystemInfoSync(),ratio=Math.min(2,info.pixelRatio||1);
const W=360,H=640,scale=Math.min(info.windowWidth/W,info.windowHeight/H),ox=(info.windowWidth-W*scale)/2,oy=(info.windowHeight-H*scale)/2;
canvas.width=Math.round(info.windowWidth*ratio);canvas.height=Math.round(info.windowHeight*ratio);
const icons={bomb:'💣',wild:'🌈',frost:'❄',lightning:'⚡',wind:'🌀',key:'🔑',super:'🌟'};
let lv=1,best=1;try{const s=wx.getStorageSync('ant-wx-progress-v1');if(s&&Number.isInteger(s.best)&&s.best>=1){best=Math.min(1000000,s.best);lv=Math.min(best,Math.max(1,s.lv||1))}}catch(_){}
let G=makeGame(lv,{speed:3}),buttons=[],aim=null,notice='',noticeUntil=0,last=0,hidden=false,won=false,plan=null;
const showMsg=s=>{notice=s;noticeUntil=Date.now()+2300};
const store=()=>{try{wx.setStorageSync('ant-wx-progress-v1',{lv,best})}catch(_){}};
function newGame(n){lv=n;G=makeGame(lv,{speed:3});aim=null;plan=null;won=false;store()}
function label(s,x,y,size=13,color='#354c43'){ctx.fillStyle=color;ctx.font='bold '+size+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x,y)}
function box(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function button(x,y,w,h,s,fn,on=true){box(x,y,w,h,on?'#507f70':'#9ca9a3');label(s,x+w/2,y+h/2,11,'#fff');if(on)buttons.push({x,y,w,h,fn})}
const BX=12,BY=94,BS=336;
function draw(now){const dt=Math.min(50,Math.max(0,now-last||16));last=now;
 if(!hidden&&!ads.busy){G.tick(dt);for(const e of G.ev){if(e.t==='skillLoot')showMsg(icons[e.mode]+' +1 已搬回');if(e.t==='power')showMsg(icons[e.mode]+' '+e.count+(e.lost?' · 损失技能 '+e.lost:''));if(e.t==='skillRescue')showMsg('槽位堵塞，可使用技能解救')}G.ev.length=0;}
 if(G.state==='win'&&!won){won=true;best=Math.max(best,lv+1);store()}
 ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle='#e7f2df';ctx.fillRect(0,0,info.windowWidth,info.windowHeight);
 ctx.translate(ox,oy);ctx.scale(scale,scale);buttons=[];
 label('蚂蚁画布 · ANT CANVAS',180,20,17);label('第 '+lv+' 关  ·  '+G.pct()+'%',180,43,13);
 button(10,55,70,26,'上一关',()=>newGame(lv-1),lv>1);
 button(86,55,68,26,'重来',()=>newGame(lv),!ads.busy);
 button(160,55,78,26,plan===null?'预演':'取消预演',()=>{plan=plan===null?-1:null},G.state==='play');
 button(244,55,106,26,'下一关',()=>newGame(lv+1),lv<best);
 const n=G.n,u=BS/n,visible=new Set();for(const s of G.slots)for(const j of s?.q||[])visible.add(j.idx);for(const a of G.ants)if(a.ph===0)visible.add(a.idx);
 box(BX,BY,BS,BS,'#d6e5d0');
 const targets=aim?new Set(G.bombTargets(aim)):null;
 for(let i=0;i<G.total;i++){if(G.eaten[i]&&!visible.has(i))continue;const x=BX+i%n*u,y=BY+Math.floor(i/n)*u;
 box(x,y,u-.4,u-.4,G.pal[G.role[i]]);
 if(iceLocked(G.eaten,G.special.ice,n,i)||bossLocked(G.eaten,G.special,i)||treasureLocked(G.eaten,G.special,i)){box(x,y,u-.4,u-.4,'rgba(40,80,110,.45)')}
 if(G.special.skillAt[i]&&!G.skillDestroyed[i])label(icons[G.special.skillAt[i]],x+u/2,y+u/2,Math.max(5,u*.85),'#fff');
 else if(G.special.boss[i])label('◆',x+u/2,y+u/2,Math.max(5,u*.7),'#fff');
 if(targets?.has(i)){ctx.strokeStyle='#ffe069';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,u-1,u-1)}
 }
 if(aim)buttons.push({x:BX,y:BY,w:BS,h:BS,fn:(x,y)=>{const i=Math.floor((y-BY)/u)*n+Math.floor((x-BX)/u);if(G.usePower(aim,i))aim=null;else showMsg('请选择可达目标')}});
 for(const a of G.ants){if(a.mode==='blast')continue;const x=BX+a.x*u,y=BY+Math.min(n+.65,a.y)*u;ctx.fillStyle='#5b4332';ctx.beginPath();ctx.arc(x,y,Math.max(2,u*.28),0,Math.PI*2);ctx.fill();if(a.ph===1){box(x-2,y-5,5,5,G.pal[a.c]);if(G.special.skillAt[a.idx])label(icons[G.special.skillAt[a.idx]],x,y-3,6,'#fff')}}
 const boss=G.bossHealth();if(boss.total){label(boss.name+' · '+boss.remaining+'/'+boss.total,180,87,10);box(110,91,140*boss.remaining/boss.total,3,'#d76f8d')}
 const modes=G.skillOrder;for(let k=0;k<modes.length;k++){const m=modes[k];button(8+k*49,439,46,26,icons[m]+'×'+G.skills[m],()=>{if(['bomb','lightning','super'].includes(m)){aim=aim===m?null:m}else{G.usePower(m);aim=null}},G.powerReady(m)&&!ads.busy)}
 for(let k=0;k<G.slots.length;k++){const s=G.slots[k],w=340/G.slots.length;box(10+k*w,474,w-3,30,s?G.pal[s.c]:'#cbd9ca');label(s?String(G.slotDisplayCount(s)):'—',10+k*w+(w-3)/2,489,12)}
 for(let c=0;c<4;c++){const a=G.cols[c],x=10+c*86;for(let row=0;row<Math.min(2,a.length);row++){const b=a[row],y=514+row*32;box(x,y,80,29,G.pal[b.c]);label(String(b.n),x+40,y+15,14);if(row===0&&!aim&&G.state==='play'&&!ads.busy)buttons.push({x,y,w:80,h:29,fn:()=>{if(plan!==null&&plan!==c){const q=G.inspectBox(c);plan=c;showMsg(q?.full?'槽位满':q?'消除 '+q.own+' · 等待 '+q.waiting:'空色盒');return}plan=null;G.place(c)}})}}
 button(10,582,96,30,'提示',()=>{if(G.useHint()){const c=G.hint();showMsg('建议第 '+(c+1)+' 列')}},G.state==='play'&&!ads.busy);
 button(112,582,116,30,'广告加槽',async()=>{const game=G;if(await ads.show()&&G===game&&G.state==='play'&&G.cap<7)G.addSlot()},G.cap<7&&ads.available()&&!ads.busy&&G.state==='play');
 button(234,582,116,30,'分享',()=>wx.shareAppMessage({title:'蚂蚁画布'}),typeof wx.shareAppMessage==='function');
 if(Date.now()<noticeUntil)label(notice,180,626,11);else label(aim?'请选择攻击目标 · 会摧毁技能砖块':ads.available()?'自愿广告 · 游戏免费':'本地体验 · 广告未开通',180,626,11);
 if(G.state!=='play'){buttons=[];box(26,200,308,185,'#fff9df');label(G.state==='win'?'完成绘画！':'槽位堵塞',180,245,23);if(G.state==='win')button(80,280,200,38,'下一关',()=>newGame(lv+1));else{button(80,270,200,36,'重新挑战',()=>newGame(lv));button(80,314,200,36,'观看广告复活',async()=>{const game=G;if(await ads.show()&&G===game)G.revive()},ads.available()&&!ads.busy)}}
}
wx.onTouchEnd(e=>{if(ads.busy)return;const t=e.changedTouches?.[0];if(!t)return;const x=(t.clientX-ox)/scale,y=(t.clientY-oy)/scale;for(let k=buttons.length-1;k>=0;k--){const b=buttons[k];if(x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){b.fn(x,y);break}}});
wx.onHide(()=>{hidden=true;store()});wx.onShow(()=>{hidden=false;last=0});
if(typeof wx.showShareMenu==='function')wx.showShareMenu({menus:['shareAppMessage']});
if(typeof wx.onShareAppMessage==='function')wx.onShareAppMessage(()=>({title:'蚂蚁画布 · ANT CANVAS'}));
function frame(t){draw(t);requestAnimationFrame(frame)}requestAnimationFrame(frame);
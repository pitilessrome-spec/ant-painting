/* Original vector boss portraits and phase feedback. No changes to puzzle rules. */
(function(g){'use strict';
const themes={
 'Web Guardian':{body:'#9d76cb',edge:'#49295f',light:'#e9b9f5',attack:'WEB SHIELD',hint:'Clear nearby guards'},
 'Iron Beetle':{body:'#c89554',edge:'#513e39',light:'#ffe2a1',attack:'IRON CHARGE',hint:'Clear the entire lower armor layer'},
 'Frost Sentinel':{body:'#6ebfda',edge:'#225a85',light:'#e1fcff',attack:'FROST WAVE',hint:'Clear the guard in the same column'},
 'Rainbow King':{body:'#b47fde',edge:'#563271',light:'#ffefb0',attack:'PRISM BURST',hint:'Clear matching and mirrored guards'}
};
let age=0,phase=0,name=null,defeated=false;
function reset(){age=0;phase=0;name=null;defeated=false}
function hit(n,p,win){name=n;phase=p;age=win?900:680;defeated=win}
function oval(c,x,y,rx,ry,col,outline){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();if(outline){c.strokeStyle=outline;c.lineWidth=1.7;c.stroke()}}
function path(c,pts,col,width=2){c.strokeStyle=col;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke()}
function poly(c,pts,col,edge){c.fillStyle=col;c.strokeStyle=edge;c.lineWidth=1.5;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();c.stroke()}
function portrait(c,n,x,y,s=1,t=0){
 const a=themes[n];if(!a)return;c.save();c.translate(x,y);c.scale(s,s);c.translate(0,Math.sin(t/420)*1.2);
 oval(c,0,22,25,5,'#28334c40');c.lineCap='round';
 if(n==='Web Guardian'){for(const side of [-1,1])for(let j=0;j<4;j++)path(c,[[side*10,-12+j*7],[side*(22+j*2),-19+j*10],[side*(29+j%2*3),-15+j*12]],a.edge,3.5);oval(c,0,-7,17,20,a.body,a.edge);oval(c,0,9,13,11,a.light,a.edge);for(const x of [-6,6])oval(c,x,7,3.2,4,a.edge);poly(c,[[-7,17],[-4,24],[0,17]],'#fff',a.edge);poly(c,[[0,17],[4,24],[7,17]],'#fff',a.edge);}
 else if(n==='Iron Beetle'){for(const side of [-1,1])for(let j=0;j<3;j++)path(c,[[side*13,-8+j*11],[side*23,-12+j*12],[side*29,-4+j*12]],a.edge,4);oval(c,0,-1,20,24,a.body,a.edge);path(c,[[0,-23],[0,15]],a.edge,2.5);oval(c,0,13,12,10,a.light,a.edge);poly(c,[[-7,8],[-14,25],[-5,19],[0,11]],a.body,a.edge);poly(c,[[7,8],[14,25],[5,19],[0,11]],a.body,a.edge);for(const x of [-5,5])oval(c,x,13,2.4,3,a.edge);}
 else if(n==='Frost Sentinel'){poly(c,[[-24,-9],[-18,-24],[-6,-13],[0,-30],[10,-14],[22,-24],[25,7],[15,23],[-15,23]],a.body,a.edge);poly(c,[[-12,-14],[0,-21],[13,-13],[9,10],[0,18],[-9,10]],a.light,a.edge);for(const x of [-6,6])oval(c,x,-2,3,4,a.edge);path(c,[[-5,9],[0,11],[5,9]],a.edge,2);for(const x of [-27,27])poly(c,[[x,-5],[x+5,-16],[x+9,-3],[x+2,10]],a.light,a.edge)}
 else{for(let j=0;j<6;j++){const q=j*Math.PI/3;oval(c,Math.cos(q)*19,Math.sin(q)*19,8,11,['#ef98af','#f7ce79','#9ee1ad','#95c8f4','#be9af5','#f4a7e4'][j],a.edge)}oval(c,0,1,18,17,a.body,a.edge);poly(c,[[-17,-12],[-15,-28],[-5,-19],[0,-31],[7,-19],[17,-28],[16,-12]],a.light,a.edge);for(const x of [-6,6])oval(c,x,-1,3,4,a.edge);path(c,[[-7,8],[0,11],[7,8]],a.edge,2);}
 c.restore()
}
function draw(dt,c,G,proj,now,reduced){const boss=G.bossHealth(),a=themes[boss.name];if(!a)return;
 const h=G.special.markers.filter(i=>G.special.boss[i]&&!G.eaten[i]&&!cellLocked(G.eaten,G.special,G.n,i)&&expoAt(G.R().dist,G.n,i%G.n,Math.floor(i/G.n)));
 c.save();for(const i of h){const [x,y]=proj(i%G.n+.5,Math.floor(i/G.n)+.5,0.25);c.strokeStyle='#fff1a1';c.lineWidth=1.6;c.strokeRect(x-4,y-4,8,8)}c.restore();
 portrait(c,boss.name,39,78,.64,reduced?0:now);
 if(age<=0)return;age=Math.max(0,age-dt);if(reduced)return;const t=1-age/(defeated?900:680);c.save();c.globalAlpha=Math.max(0,(1-t)*.7);const x=39,y=78;
 if(name==='Web Guardian'){for(let k=0;k<8;k++){const p=k*Math.PI/4;path(c,[[x,y],[x+Math.cos(p)*70*t,y+Math.sin(p)*70*t]],a.light,1.5)}}
 else if(name==='Iron Beetle'){for(let k=0;k<3;k++)path(c,[[x,y],[x+50*t,y+(k-1)*18*t],[x+110*t,y+(k-1)*35*t]],a.light,3)}
 else if(name==='Frost Sentinel'){for(let k=0;k<8;k++){const p=k*Math.PI/4;const u=x+Math.cos(p)*68*t,v=y+Math.sin(p)*68*t;path(c,[[u-4,v],[u+4,v]],a.light,2);path(c,[[u,v-4],[u,v+4]],a.light,2)}}
 else{for(let k=0;k<3;k++){c.strokeStyle=['#ff9fcb','#fbe19e','#a6f7ef'][k];c.lineWidth=2;c.beginPath();c.arc(x,y,10+(35+k*15)*t,0,Math.PI*2);c.stroke()}}
 c.restore();
}
g.AntBossFX=Object.freeze({reset,hit,draw,portrait,themes});
})(window);
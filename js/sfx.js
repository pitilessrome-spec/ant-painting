/* Original, locally generated arcade sound samples. Single shared audio context. */
(function(g){'use strict';
let ctx=null,resuming=null,master=null,active=new Set(),last={},pending=null,muted=false;
const samples=new Map(),SR=22050,TAU=Math.PI*2;
function enabled(){try{const v=JSON.parse(localStorage.getItem('mbh3')||'{}')?.snd;return !muted&&v!==0&&v!==false}catch{return !muted}}
function init(){if(!ctx){const C=g.AudioContext||g.webkitAudioContext;if(!C)return false;ctx=new C();master=ctx.createGain();master.gain.value=.72;const limiter=ctx.createDynamicsCompressor?.();if(limiter){master.connect(limiter);limiter.connect(ctx.destination)}else master.connect(ctx.destination)}return true}
function unlock(){if(!enabled())return Promise.resolve(false);try{if(!init())return Promise.resolve(false);if(ctx.state==='running')return Promise.resolve(true);if(!resuming){ // call resume inside the real gesture, not a delayed frame
 const p=ctx.resume();resuming=Promise.resolve(p).then(()=>{resuming=null;const q=pending;pending=null;if(q&&performance.now()-q.at<900&&ctx.state==='running')emit(q.k,q.count);return ctx.state==='running'},()=>{resuming=null;return false})}return resuming}catch{return Promise.resolve(false)}}
function make(k,count){const duration={launch:.25,impact:.36,blast:.42,hit:.12,combo:.24,tap:.1,reward:.48,build:.48,win:.63,lose:.3}[k]||.15;const n=Math.ceil(SR*duration),a=new Float32Array(n);let seed=2279,lp=0,phase=0;
 const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1};
 for(let i=0;i<n;i++){const t=i/SR,u=t/duration,w=noise();lp+=.15*(w-lp);let v=0;const env=Math.min(1,t/.004)*Math.pow(1-u,1.7);
 if(k==='launch'){phase+=TAU*(200+1450*u*u)/SR;v=(.48*Math.sin(phase)+.18*Math.sin(phase*2)+.24*(w-lp))*env}
 else if(k==='impact'){phase+=TAU*(180*Math.exp(-12*t)+45)/SR;v=.75*Math.sin(phase)*Math.exp(-15*t)+.63*lp*Math.exp(-10*t)+.3*(w-lp)*Math.exp(-34*t);v*=Math.min(1,t/.002)}
 else if(k==='blast'){phase+=TAU*(220+1050*u)/SR;v=(Math.sin(phase)*.43+Math.sin(phase*1.5)*.23+.12*w)*env}
 else if(k==='hit'||k==='combo'||k==='tap'){const root=[440,523,587,659,784,880,988,1047,1175][Math.min(8,Math.max(0,Math.floor((count||1)/3)))];const note=k==='tap'?550:root;v=(.55*Math.sin(TAU*note*t)+.23*Math.sin(TAU*note*2*t)+.13*Math.sin(TAU*note*3*t))*Math.exp(-12*t)*env;if(k==='combo'&&t>.065)v+=.35*Math.sin(TAU*note*1.5*(t-.065))*Math.exp(-12*(t-.065))*env}
 else if(k==='lose')v=.5*Math.sin(TAU*(330*t-260*t*t))*env;
 else {for(let j=0;j<4;j++){const q=t-j*.085;if(q>=0)v+=.25*Math.sin(TAU*[523,659,784,1047][j]*q)*Math.exp(-9*q)*Math.min(1,q/.006)}v*=Math.min(1,(duration-t)/.035)}
 a[i]=Math.max(-.92,Math.min(.92,v*.82));}
 return a}
function emit(k,count=1){if(!enabled()||ctx?.state!=='running'||active.size>=12)return false;try{const bucket=k==='hit'||k==='combo'?Math.min(8,Math.max(0,Math.floor(count/3))):0,key=k+':'+bucket;let buf=samples.get(key);if(!buf){const a=make(k,count);buf=ctx.createBuffer(1,a.length,SR);buf.getChannelData(0).set(a);samples.set(key,buf)}const s=ctx.createBufferSource(),gain=ctx.createGain();s.buffer=buf;gain.gain.value=k==='impact'?.92:k==='launch'?.72:k==='combo'?.77:k==='hit'?.45:.64;s.connect(gain);gain.connect(master);active.add(s);s.onended=()=>{active.delete(s);s.disconnect();gain.disconnect()};s.start();return true}catch{return false}}
function play(k,count=1){if(!enabled())return false;const now=performance.now(),gap=k==='hit'?75:k==='launch'?85:k==='impact'?85:k==='combo'?180:140;if(now-(last[k]??-10000)<gap)return false;if(ctx?.state!=='running'){pending={k,count,at:now};return false}const ok=emit(k,count);if(ok)last[k]=now;return ok}
function setEnabled(on){muted=!on;pending=null;if(!on){for(const s of active){try{s.stop()}catch{}}active.clear()}else{unlock().then(ok=>{if(ok)emit('combo',6)})}}
function reset(){last={};pending=null}
if(g.document){for(const e of ['touchend','pointerup','pointerdown','keydown','click'])g.document.addEventListener(e,unlock,{capture:true,passive:true});g.document.addEventListener('visibilitychange',()=>{if(g.document.hidden){pending=null;for(const s of active){try{s.stop()}catch{}}}})}
g.AntSFX=Object.freeze({play,unlock,setEnabled,reset,enabled,get state(){return ctx?.state||'locked'}});
})(window);

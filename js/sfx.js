/* Original, locally generated arcade sound samples. Single shared audio context. */
(function(g){'use strict';
let ctx=null,resuming=null,master=null,active=new Set(),last={},pending=null,muted=false;
const samples=new Map(),SR=22050,TAU=Math.PI*2;
function enabled(){try{const v=JSON.parse(localStorage.getItem('mbh3')||'{}')?.snd;return !muted&&v!==0&&v!==false}catch{return !muted}}
function init(){if(!ctx){const C=g.AudioContext||g.webkitAudioContext;if(!C)return false;ctx=new C();master=ctx.createGain();master.gain.value=.72;const limiter=ctx.createDynamicsCompressor?.();if(limiter){master.connect(limiter);limiter.connect(ctx.destination)}else master.connect(ctx.destination)}return true}
function unlock(){if(!enabled())return Promise.resolve(false);try{if(!init())return Promise.resolve(false);if(ctx.state==='running')return Promise.resolve(true);{ // Retry resume on every real gesture: a pending pointerdown must not block iOS touchend.
 const p=ctx.resume();resuming=Promise.resolve(p).then(()=>{resuming=null;const q=pending;pending=null;if(q&&performance.now()-q.at<900&&ctx.state==='running')emit(q.k,q.count);return ctx.state==='running'},()=>{resuming=null;return false})}return resuming}catch{return Promise.resolve(false)}}
function make(k,count){const duration={lightning:.32,wind:.48,key:.42,super:.66,launch:.25,impact:.48,blast:.55,hit:.12,combo:.42,tap:.1,reward:.48,build:.48,win:.63,lose:.3}[k]||.15;const n=Math.ceil(SR*duration),a=new Float32Array(n);let seed=2279,lp=0,phase=0,bp=0;
 const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1};
 for(let i=0;i<n;i++){const t=i/SR,u=t/duration,w=noise();lp+=.15*(w-lp);let v=0;const env=Math.min(1,t/.004)*Math.pow(1-u,1.7);
 if(k==='launch'){phase+=TAU*(210+1900*u*u)/SR;bp+=.055*(w-bp);v=(.26*Math.sin(phase)+.16*Math.sin(phase*1.97)+.85*(lp-bp)+.3*(w-lp))*env*(.6+.4*Math.sin(Math.PI*u));v+=.38*w*Math.exp(-65*t)*Math.min(1,t/.002)}
 else if(k==='lightning'){phase+=TAU*(750+1500*Math.abs(Math.sin(t*42)))/SR;v=(.46*(w-lp)+.25*Math.sin(phase))*(.5+.5*Math.sin(t*100)**2)*env}
 else if(k==='wind'){phase+=TAU*(230+470*Math.sin(Math.PI*u))/SR;v=(.42*lp+.25*(w-lp)+.18*Math.sin(phase))*env}
 else if(k==='key'){for(let j=0;j<3;j++){const q=t-j*.075;if(q>=0)v+=.3*Math.sin(TAU*[784,1047,1568][j]*q)*Math.exp(-12*q)*Math.min(1,q/.004)}v*=Math.min(1,(duration-t)/.035)}
 else if(k==='super'){phase+=TAU*(180*Math.exp(-10*t)+52)/SR;v=(.64*Math.sin(phase)*Math.exp(-7*t)+.86*lp*Math.exp(-5*t)+.4*(w-lp)*Math.exp(-19*t))*Math.min(1,t/.004)*Math.min(1,(duration-t)/.06)}
 else if(k==='impact'){phase+=TAU*(245*Math.exp(-16*t)+68)/SR;bp+=.035*(w-bp);v=.74*Math.sin(phase)*Math.exp(-12*t)+1.25*(lp-bp)*Math.exp(-8*t)+.83*(w-lp)*Math.exp(-27*t);for(let j=0;j<5;j++){const q=t-.035-j*.029;if(q>0)v+=.20*Math.sin(TAU*(1800+j*310)*q)*Math.exp(-42*q)*Math.min(1,q/.002)}v*=Math.min(1,t/.002)*Math.min(1,(duration-t)/.025)}
 else if(k==='blast'){phase+=TAU*(220+1050*u)/SR;v=(Math.sin(phase)*.43+Math.sin(phase*1.5)*.23+.12*w)*env}
 else if(k==='combo'){const root=count>=25?659:count>=15?587:523;for(let j=0;j<4;j++){const q=t-j*.065;if(q>=0){const hz=root*[1,1.25,1.5,2][j];v+=(.32*Math.sin(TAU*hz*q)+.12*Math.sin(TAU*hz*2.01*q)+.08*Math.sin(TAU*hz*3.03*q))*Math.exp(-8*q)*Math.min(1,q/.004)}}v*=Math.min(1,(duration-t)/.03)}
 else if(k==='hit'||k==='tap'){const root=[440,523,587,659,784,880,988,1047,1175][Math.min(8,Math.max(0,Math.floor((count||1)/3)))];const note=k==='tap'?550:root;v=(.55*Math.sin(TAU*note*t)+.23*Math.sin(TAU*note*2*t)+.13*Math.sin(TAU*note*3*t))*Math.exp(-12*t)*env;if(k==='hit')v+=.12*(w-lp)*Math.exp(-35*t)}
 else if(k==='lose')v=.5*Math.sin(TAU*(330*t-260*t*t))*env;
 else {for(let j=0;j<4;j++){const q=t-j*.085;if(q>=0)v+=.25*Math.sin(TAU*[523,659,784,1047][j]*q)*Math.exp(-9*q)*Math.min(1,q/.006)}v*=Math.min(1,(duration-t)/.035)}
 a[i]=Math.max(-.92,Math.min(.92,v*.82));}
 return a}
function emit(k,count=1){if(!enabled()||ctx?.state!=='running'||active.size>=12)return false;try{const bucket=k==='hit'||k==='combo'?Math.min(8,Math.max(0,Math.floor(count/3))):0,key=k+':'+bucket;let buf=samples.get(key);if(!buf){const a=make(k,count);buf=ctx.createBuffer(1,a.length,SR);buf.getChannelData(0).set(a);samples.set(key,buf)}const s=ctx.createBufferSource(),gain=ctx.createGain();s.buffer=buf;gain.gain.value=k==='impact'?.98:k==='launch'?.82:k==='combo'?.85:k==='hit'?.38:.64;s.connect(gain);gain.connect(master);active.add(s);s.onended=()=>{active.delete(s);s.disconnect();gain.disconnect()};s.start();return true}catch{return false}}
function play(k,count=1){if(!enabled())return false;const now=performance.now(),gap=k==='hit'?75:k==='launch'?85:k==='impact'?85:k==='combo'?180:140;if(now-(last[k]??-10000)<gap)return false;if(ctx?.state!=='running'){pending={k,count,at:now};return false}const ok=emit(k,count);if(ok)last[k]=now;return ok}
function setEnabled(on){muted=!on;pending=null;if(!on){for(const s of active){try{s.stop()}catch{}}active.clear()}else{unlock().then(ok=>{if(ok)emit('combo',6)})}}
function reset(){last={};pending=null}
if(g.document){for(const e of ['touchend','pointerup','pointerdown','keydown','click'])g.document.addEventListener(e,unlock,{capture:true,passive:true});g.document.addEventListener('visibilitychange',()=>{if(g.document.hidden){pending=null;for(const s of active){try{s.stop()}catch{}}}})}
g.AntSFX=Object.freeze({play,unlock,setEnabled,reset,enabled,get state(){return ctx?.state||'locked'}});
})(window);

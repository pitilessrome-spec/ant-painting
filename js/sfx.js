/* Original synthesized game sound effects, shared with village. No network audio assets. */
(function(g){'use strict';let ctx=null,voices=0,last={},combo=0,lastHit=0;
function enabled(){try{return JSON.parse(localStorage.getItem('mbh3')||'{}').snd!==0}catch{return true}}
function unlock(){if(!enabled())return;try{const C=g.AudioContext||g.webkitAudioContext;if(!C)return;ctx=ctx||new C();if(ctx.state==='suspended')ctx.resume().catch(()=>{})}catch{}}
function tone(f,end,d,volume=.035,delay=0,type='sine'){if(!enabled()||!ctx||ctx.state!=='running'||voices>=16)return;try{const o=ctx.createOscillator(),v=ctx.createGain(),t=ctx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(end,t+d);v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(volume,t+.009);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v);v.connect(ctx.destination);voices++;o.onended=()=>{voices--;o.disconnect();v.disconnect()};o.start(t);o.stop(t+d+.01)}catch{}}
function play(k){if(!enabled())return;const now=performance.now(),gap=k==='hit'?75:k==='launch'?90:180;if(now-(last[k]??-10000)<gap)return;last[k]=now;
 if(k==='hit'){combo=now-lastHit<450?Math.min(6,combo+1):0;lastHit=now;const f=[523,587,659,784,880,988,1047][combo];tone(f,f*1.23,.105,.032);tone(f*2,f*1.7,.075,.012,.018)}
 else if(k==='launch'){tone(310,960,.16,.029,0,'triangle');tone(620,1180,.1,.012,.045)}
 else if(k==='blast'){tone(220,880,.28,.04,0,'triangle');[523,659,784,1047].forEach((f,i)=>tone(f,f*1.02,.18,.025,i*.045))}
 else if(k==='impact'){tone(190,85,.13,.04,0,'triangle');tone(880,1320,.16,.028,.025)}
 else if(k==='build'||k==='reward'||k==='win'){[523,659,784,1047].forEach((f,i)=>tone(f,f*1.01,.22,.032,i*.075))}
 else if(k==='tap'){tone(430,610,.08,.028)}
 else if(k==='lose'){tone(340,165,.27,.035,0,'triangle')}
}
function reset(){combo=0;lastHit=0;last={}}
if(g.document)for(const e of ['pointerdown','touchend','keydown','click'])g.document.addEventListener(e,unlock,{capture:true,passive:true});
g.AntSFX=Object.freeze({play,unlock,reset,enabled});
})(window);

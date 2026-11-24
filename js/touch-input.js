/* ANT CANVAS: one native touch gesture -> one activation. No synthetic timer or delayed double tap. */
(function(global){'use strict';
const SELECTOR='[data-col],[data-act],[data-home-action],[data-bomb-aim="1"],button,a[href]';
function stableKey(el){if(!el)return null;if(el.hasAttribute('data-col'))return '[data-col="'+el.dataset.col+'"][data-row="'+el.dataset.row+'"]';if(el.hasAttribute('data-act'))return '[data-act="'+el.dataset.act+'"]';return null}
function install(stage,doc=global.document){if(!stage||stage.dataset.touchInstalled)return;stage.dataset.touchInstalled='1';let tap=null,recent=[];
 const control=t=>t&&typeof t.closest==='function'?t.closest(SELECTOR):null;
 const safe=t=>t&&stage.contains(t)&&!t.disabled&&!t.closest('[hidden]');
 const scrolling=t=>!!t?.closest('.tgpanel,#win .card');
 const eventTime=()=>global.performance?.now?.()??Date.now();
 function start(e){if(e.touches.length!==1){tap=null;if(!scrolling(e.target)&&e.cancelable)e.preventDefault();return}const t=e.changedTouches[0],el=control(e.target),scroll=scrolling(e.target);if(scroll&&!el){tap=null;return}tap={id:t.identifier,x:t.clientX,y:t.clientY,el:safe(el)?el:null,key:stableKey(el),scroll,moved:false};if(!scroll&&e.cancelable)e.preventDefault()}
 function move(e){if(!tap)return;if(e.touches.length!==1){tap=null;return}const t=Array.from(e.changedTouches).find(x=>x.identifier===tap.id);if(t&&Math.hypot(t.clientX-tap.x,t.clientY-tap.y)>12)tap.moved=true;if(!tap.scroll&&e.cancelable)e.preventDefault()}
 function end(e){if(!tap)return;const t=Array.from(e.changedTouches).find(x=>x.identifier===tap.id);if(!t)return;const a=tap;tap=null;if(a.moved||Math.hypot(t.clientX-a.x,t.clientY-a.y)>12)return;if(e.cancelable)e.preventDefault();if(!a.el)return;
  let el=a.el;if(!safe(el)&&a.key)el=stage.querySelector(a.key);if(!safe(el))return;
  const at=control(doc.elementFromPoint(t.clientX,t.clientY));if(!at||at!==el&&(!a.key||stableKey(at)!==a.key))return;
  recent=recent.filter(r=>eventTime()-r.time<700);recent.push({x:t.clientX,y:t.clientY,time:eventTime()});if(el.dataset.bombAim==='1')el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:t.clientX,clientY:t.clientY}));else el.click();
 }
 function ghost(e){if(e.isTrusted&&e.detail!==0&&recent.some(r=>eventTime()-r.time<700&&Math.hypot(e.clientX-r.x,e.clientY-r.y)<28)){e.preventDefault();e.stopImmediatePropagation();}}
 stage.addEventListener('touchstart',start,{capture:true,passive:false});doc.addEventListener('touchmove',move,{capture:true,passive:false});doc.addEventListener('touchend',end,{capture:true,passive:false});doc.addEventListener('touchcancel',()=>{tap=null},{capture:true,passive:true});
 stage.addEventListener('click',ghost,true);stage.addEventListener('dblclick',e=>{if(e.cancelable)e.preventDefault()},{capture:true,passive:false});
 for(const type of ['gesturestart','gesturechange','gestureend'])doc.addEventListener(type,e=>{if(e.cancelable)e.preventDefault()},{passive:false});
}
global.AntTouch=Object.freeze({install});if(global.document)install(global.document.getElementById('stage'));
})(typeof window==='undefined'?globalThis:window);
/* ANT CANVAS — Hybrid ant workshop: classic hauling + optional colored blast ants.
   Effects never change which cells may be consumed or how many each box uses. */
(function(){
 'use strict';
 const KEY='ant_canvas_hybrid_mode_v1';
 let enabled=true;
 try{const saved=localStorage.getItem(KEY);if(saved!==null)enabled=saved==='1'}catch(_){}
 const style=document.createElement('style');
 style.textContent=[
 '#blast-hud{position:absolute;right:13px;top:341px;z-index:42;background:linear-gradient(145deg,#2a347de8,#633e9bed);border:1px solid #ffffffae;box-shadow:0 4px 13px #1022575c;border-radius:12px;color:#fff;min-width:111px;height:32px;padding:4px 8px;cursor:pointer;font-size:9px;display:flex;align-items:center;gap:5px;font-weight:950}',
 '#blast-hud .blast-text{white-space:nowrap}',
 '#blast-hud .blast-meter{position:absolute;bottom:2px;left:6px;right:6px;height:3px;border-radius:3px;background:#ffffff55;overflow:hidden}',
 '#blast-hud .blast-fill{display:block;height:100%;width:0;background:linear-gradient(90deg,#9bffde,#ffdf71)}',
 '#blast-hud.ready{animation:blast-ready 1.2s ease-in-out infinite}',
 '#blast-hud:focus-visible{outline:3px solid white;outline-offset:2px}',
 '#ant-home .ah-toggle{font:900 10px system-ui;border-radius:12px;border:1px solid #ffffff42;background:#ffffff20;color:#ffdfa4;padding:8px 9px;cursor:pointer;text-align:center;min-width:110px}',
 '#ant-home .ah-toggle b{display:block;color:#fff;font-size:12px}',
 '@keyframes blast-ready{0%,100%{box-shadow:0 4px 13px #1022575c}50%{box-shadow:0 4px 15px #ffe37aaa}}',
 '@media(prefers-reduced-motion:reduce){#blast-hud{animation:none!important}}'
 ].join('');
 document.head.appendChild(style);
 const stage=document.getElementById('stage');
 const hud=document.createElement('button');hud.id='blast-hud';hud.type='button';
 hud.title='Switch between hybrid color-blast ants and classic hauling ants';
 hud.innerHTML='<span aria-hidden="true">🌈</span><span class="blast-text">BLAST 0/42</span><span class="blast-meter"><i class="blast-fill"></i></span>';
 if(stage)stage.appendChild(hud);
 function render(game){
  const text=hud.querySelector('.blast-text'),meter=hud.querySelector('.blast-fill');
  hud.setAttribute('aria-pressed',enabled?'true':'false');
  const remaining=game&&game.blastRemaining||0,charge=game&&game.blastCharge||0;
  if(!enabled){text.textContent='🐜 CLASSIC';meter.style.width='0%'}
  else if(remaining){text.textContent='✨ COLOR BLAST';meter.style.width='100%'}
  else{text.textContent='🌈 '+charge+'/42';meter.style.width=(Math.min(100,charge/42*100))+'%'}
  hud.classList.toggle('ready',!!(enabled&&remaining));
  const hm=document.getElementById('ah-mode');
  if(hm)hm.textContent=enabled?'ON':'OFF';
 }
 function set(v){
  enabled=!!v;
  try{localStorage.setItem(KEY,enabled?'1':'0')}catch(_){}
  const g=window.ANT_CANVAS_GAME;
  if(g){g.blastEnabled=enabled;if(!enabled)g.blastRemaining=0}
  render(g);
 }
 function toggle(){set(!enabled)}
 hud.addEventListener('click',e=>{e.stopPropagation();toggle()});
 window.AntWorkshop=Object.freeze({get enabled(){return enabled},setEnabled:set,toggle,render});
 render(null);
})();

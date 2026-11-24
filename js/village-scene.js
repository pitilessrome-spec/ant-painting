/* ANT CANVAS illustrated village — SVG world and moving residents. */
(function(){
'use strict';
const svg=document.getElementById('village-world');if(!svg)return;
const points=[{id:0,x:165,y:267},{id:1,x:401,y:225},{id:2,x:751,y:268},{id:3,x:166,y:426},{id:5,x:788,y:424},{id:6,x:268,y:539},{id:7,x:502,y:531},{id:8,x:753,y:544}];
const routes=['M476 393Q365 325 168 269','M476 390Q446 299 401 225','M478 399Q608 303 753 266','M467 412Q325 406 166 428','M496 412Q633 423 788 426','M478 425Q381 510 268 540','M487 422Q495 490 502 532','M503 425Q644 532 753 542'];
function flower(x,y,c,s){
 const colors=[c,'#ffed91','#c6a4f4'];let p='';
 for(let i=0;i<5;i++){let a=i*Math.PI*2/5;p+='<circle cx="'+(Math.cos(a)*5.7).toFixed(2)+'" cy="'+(-15+Math.sin(a)*5.7).toFixed(2)+'" r="5" fill="'+colors[i%3]+'"/>';}
 return '<g class="flower" transform="translate('+x+' '+y+') scale('+(s||1)+')"><path d="M0 0V-15" stroke="#459461" stroke-width="3"/>'+p+'<circle cy="-15" r="3.4" fill="#fff4ad"/></g>';
}
function tree(x,y,s){
 return '<g transform="translate('+x+' '+y+') scale('+(s||1)+')" filter="url(#v-shadow)"><path d="M-8 0L-6 -77H9L7 0Z" fill="#a67656"/><circle cx="-24" cy="-80" r="29" fill="#65bb7e" stroke="#429b70" stroke-width="4"/><circle cx="6" cy="-96" r="35" fill="#90db9f" stroke="#49a97b" stroke-width="4"/><circle cx="33" cy="-80" r="29" fill="#5eba80" stroke="#48a374" stroke-width="4"/><path d="M-27 -102Q-7 -123 11 -110" stroke="#c5f6bc" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/></g>';
}
function ant(path,start,color,job=0){
 // Six independently alternating articulated legs, antennae and three body segments.
 // SVG animateMotion follows the curved road, including heading when returning home.
 const upper=(x,phase)=>'<g transform="translate('+x+' -3)"><g class="ant-leg '+(phase?'ant-step-b':'ant-step-a')+'"><animateTransform attributeName="transform" type="rotate" values="'+(phase?'-22;24;-22':'22;-23;22')+'" dur=".42s" repeatCount="indefinite"/><path d="M0 0L-2 -8L'+(x<0?-8:7)+' -12" fill="none" stroke="#4b344d" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="'+(x<0?-8:7)+'" cy="-12" r="1.8" fill="#60475c"/></g></g>';
 const lower=(x,phase)=>'<g transform="translate('+x+' 4)"><g class="ant-leg '+(phase?'ant-step-b':'ant-step-a')+'"><animateTransform attributeName="transform" type="rotate" values="'+(phase?'23;-22;23':'-22;23;-22')+'" dur=".42s" repeatCount="indefinite"/><path d="M0 0L-3 9L'+(x<0?-10:8)+' 13" fill="none" stroke="#47334b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="'+(x<0?-10:8)+'" cy="13" r="1.7" fill="#60415b"/></g></g>';
 const gear=job%3===0?
   '<g class="ant-cargo" transform="translate(-16 -10)"><path d="M0 2Q-11 -13 -19 -9Q-14 6 0 2" fill="#87d993" stroke="#3a977a" stroke-width="1.6"/><path d="M-1 2L-14 -7" stroke="#e4ffd6" stroke-width="1.5"/></g>':
   job%3===1?
   '<g class="ant-cargo"><circle cx="-16" cy="-12" r="6" fill="#ffa4a6" stroke="#fbd3b1" stroke-width="2"/><path d="M-16 -18Q-19 -23 -22 -18" stroke="#70a973" stroke-width="2" fill="none"/></g>':
   '<g class="ant-cargo" transform="translate(-15 -11)"><path d="M-10 -2L-7 -9H7L10 -2V5H-10Z" fill="#e2aa64" stroke="#96613e" stroke-width="2"/><path d="M-10 -2H10" stroke="#ffe1a3" stroke-width="2"/></g>';
 return '<g class="resident village-ant" aria-label="Worker ant walking along the village road">'+
  '<animateMotion dur="'+(17+job%3*2)+'s" begin="'+start+'s" path="'+path+'" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear" rotate="auto" repeatCount="indefinite"/>'+
  '<g transform="scale(1.35)">'+
  '<ellipse cx="-1" cy="9" rx="25" ry="6" fill="#235d4c" opacity=".24"/>'+
  '<g class="ant-bob">'+
  upper(-8,0)+upper(1,1)+upper(7,0)+lower(-8,1)+lower(1,0)+lower(7,1)+
  '<path d="M-13 0L-2 -1L8 -2" fill="none" stroke="#49354a" stroke-width="5.5" stroke-linecap="round"/>'+
  '<ellipse cx="-15" cy="0" rx="11.5" ry="9.2" fill="'+color+'" stroke="#483646" stroke-width="2"/>'+
  '<ellipse cx="-19" cy="-4" rx="5.2" ry="2.3" fill="#e9d2c6" opacity=".38" transform="rotate(-20 -19 -4)"/>'+
  '<ellipse cx="-1" cy="-1" rx="6.8" ry="6.7" fill="#9d6675" stroke="#483646" stroke-width="2"/>'+
  '<ellipse cx="11" cy="-4" rx="9" ry="8.4" fill="#b27785" stroke="#483646" stroke-width="2.3"/>'+
  '<ellipse cx="10" cy="-7.9" rx="6" ry="2.3" fill="#f4c3b1" opacity=".44" transform="rotate(-15 10 -8)"/>'+
  gear+
  '<g class="ant-feelers"><path d="M14 -10Q18 -24 23 -25M17 -9Q27 -19 32 -17" stroke="#5c3b53" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="23" cy="-25" r="2.5" fill="#c18e94"/><circle cx="32" cy="-17" r="2.5" fill="#c18e94"/></g>'+
  '<circle cx="16" cy="-7" r="3.4" fill="#fffdf8"/><circle cx="17" cy="-6.7" r="1.7" fill="#3b3549"/>'+
  '<circle cx="18" cy="-8.6" r=".7" fill="#fff"/>'+
  '<path d="M17 -1Q21 2 24 -2" stroke="#5c3c53" stroke-width="1.5" fill="none"/>'+
  '</g></g></g>';
}
function base(){
 let s='<defs>'+
 '<linearGradient id="v-sky" x2="0" y2="1"><stop stop-color="#70b7ef"/><stop offset="1" stop-color="#e0f9f2"/></linearGradient>'+
 '<linearGradient id="v-night" x2="0" y2="1"><stop stop-color="#182a60"/><stop offset="1" stop-color="#5a6cba"/></linearGradient>'+
 '<linearGradient id="v-grass" x2="0" y2="1"><stop stop-color="#b7ec91"/><stop offset="1" stop-color="#53b67a"/></linearGradient>'+
 '<linearGradient id="v-water" x2="0" y2="1"><stop stop-color="#d0faff"/><stop offset="1" stop-color="#4db5e5"/></linearGradient>'+
 '<linearGradient id="v-roof" x2="0" y2="1"><stop stop-color="#ffb38e"/><stop offset="1" stop-color="#d66382"/></linearGradient>'+
 '<linearGradient id="v-gold" x2="0" y2="1"><stop stop-color="#fff5a5"/><stop offset="1" stop-color="#f4af53"/></linearGradient>'+
 '<filter id="v-shadow" x="-40%" y="-50%" width="180%" height="220%"><feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#347462" flood-opacity=".43"/></filter>'+
 '</defs>'+
 '<rect class="sky-day" width="960" height="610" fill="url(#v-sky)"/><rect class="sky-night" width="960" height="610" fill="url(#v-night)" opacity="0"/>'+
 '<g class="is-day-only"><circle class="sun" cx="793" cy="95" r="50" fill="#fff1b3" opacity=".3"/><circle cx="793" cy="95" r="34" fill="#ffeca1" stroke="#fff6c5" stroke-width="7"/></g>'+
 '<g class="is-night-only"><circle cx="787" cy="95" r="32" fill="#fff0be"/><circle cx="801" cy="79" r="30" fill="#455490"/>'+
 Array.from({length:20},(_,i)=>'<circle class="firefly" cx="'+(50+i*48%865)+'" cy="'+(18+i*53%174)+'" r="2.7" fill="#fffbe1"/>').join('')+'</g>'+
 '<g fill="#fff" opacity=".87"><ellipse cx="156" cy="96" rx="68" ry="20"/><circle cx="124" cy="82" r="23"/><circle cx="173" cy="73" r="30"/><ellipse cx="610" cy="132" rx="82" ry="18"/><circle cx="583" cy="109" r="27"/><circle cx="633" cy="109" r="30"/></g>'+
 '<path d="M0 270Q144 137 288 231Q459 111 612 228Q779 121 960 230V610H0Z" fill="#c4e8ca"/>'+
 '<path d="M0 322Q145 233 290 287Q456 208 640 296Q811 211 960 310V610H0Z" fill="#91d7b0"/>'+
 '<path d="M0 360Q178 277 353 344Q518 271 725 343Q876 277 960 339V610H0Z" fill="url(#v-grass)"/>'+
 '<path d="M-10 520Q145 449 318 500Q505 557 672 482Q795 435 970 516V620H-10Z" fill="#43a879" opacity=".5"/>'+
 '<path d="M958 300Q778 313 702 388Q668 430 642 504Q618 560 586 620" stroke="#e3facd" stroke-width="96" fill="none"/>'+
 '<path d="M958 300Q778 313 702 388Q668 430 642 504Q618 560 586 620" stroke="url(#v-water)" stroke-width="62" fill="none" stroke-linecap="round"/>'+
 '<path class="water-streak" d="M941 319Q763 340 701 405Q662 466 614 572" stroke="#ddfdff" stroke-width="7" stroke-dasharray="16 20" fill="none"/>'+
 routes.map(r=>'<path d="'+r+'" stroke="#f6e9c5" fill="none" stroke-width="25" stroke-linecap="round"/><path d="'+r+'" stroke="#d1b78b" fill="none" stroke-width="3" stroke-dasharray="2 15" stroke-linecap="round"/>').join('')+
 '<path d="M641 456L710 472L696 491L629 472Z" fill="#a87757" stroke="#805c43" stroke-width="4"/><path d="M637 464L702 481M632 469L697 486" stroke="#e8c294" stroke-width="4"/>'+
 tree(32,356,1.02)+tree(933,352,1.04)+tree(70,559,.85)+tree(907,572,.75)+tree(316,190,.56)+tree(580,205,.5)+
 [[62,450,'#ffaac7'],[123,338,'#ffd18e'],[319,413,'#c8acff'],[589,313,'#ffeb8e'],[878,430,'#ff9ab9'],[349,574,'#ffe1a4'],[835,552,'#c5a9ff'],[525,468,'#ffc78b']].map(q=>flower(q[0],q[1],q[2],.8)).join('')+
 '<g transform="translate(486 394)" filter="url(#v-shadow)"><ellipse cy="18" rx="106" ry="29" fill="#397c56" opacity=".35"/>'+
 '<path d="M-64 17V-39Q-59 -85 0 -93Q59 -84 64 -39V17Z" fill="#ffe4ae" stroke="#ba8a67" stroke-width="5"/>'+
 '<path d="M-85 -40L-8 -110Q0 -118 8 -110L85 -40Q71 -16 56 -33L0 -81L-60 -29Q-72 -21 -85 -40Z" fill="url(#v-roof)" stroke="#aa6271" stroke-width="6" stroke-linejoin="round"/>'+
 '<path d="M-24 18V-19Q-24 -46 0 -47Q24 -46 24 -19V18Z" fill="#86594e" stroke="#6b4d48" stroke-width="4"/>'+
 '<circle cx="-46" cy="-23" r="13" fill="#a5e7f7" stroke="#fff7d1" stroke-width="5"/><circle cx="47" cy="-23" r="13" fill="#a5e7f7" stroke="#fff7d1" stroke-width="5"/>'+
 '<rect x="-12" y="-100" width="24" height="14" rx="3" fill="#fff5c8"/><text y="42" text-anchor="middle" font-weight="950" font-size="16" fill="#fff" stroke="#406c60" stroke-width="3" paint-order="stroke">ANT HOME</text></g>'+
 '<g id="village-residents">'+routes.slice(0,7).map((r,i)=>ant(r,-i*2.4,['#69516a','#775b78','#695371'][i%3],i)).join('')+'</g>'+
 '<g id="village-buildings"></g><g id="village-combo-effects"></g>';
 svg.innerHTML=s;
}
function structure(name,level){
 const enhanced=level>=2,royal=level>=3;
 let s='';
 if(name==='flower'){
  s='<ellipse rx="59" ry="19" fill="#65b47d" stroke="#b2f3ae" stroke-width="4"/>'+
  flower(-31,-5,'#ff9fc5',1.2)+flower(-7,-9,'#ffec81',1.45)+flower(22,-3,'#b4a2f4',1.2)+flower(45,-4,'#ff8eae',1.1);
  if(enhanced)s+=flower(-49,1,'#a2defd',.85)+flower(49,1,'#fff2b5',.85);
  if(royal)s+='<path d="M0 -25V-72" stroke="#987357" stroke-width="5"/><path class="building-flag" d="M0 -72L34 -61L0 -52Z" fill="#ffdc74"/>';
 }else if(name==='mushroom'){
  s='<path d="M-32 0V-53Q0 -70 31 -53V0Z" fill="#fff0d3" stroke="#c69b82" stroke-width="4"/>'+
  '<path d="M-56 -47Q-46 -112 0 -114Q46 -112 56 -47Q45 -26 30 -44Q0 -57 -29 -44Q-44 -25 -56 -47Z" fill="url(#v-roof)" stroke="#bb5e78" stroke-width="5"/>'+
  '<ellipse cx="-20" cy="-74" rx="12" ry="7" fill="#fffce3" transform="rotate(-20 -20 -74)"/>'+
  '<ellipse cx="18" cy="-86" rx="13" ry="7" fill="#fffce3"/><path d="M-14 0V-21Q-12 -41 0 -41Q14 -41 14 -21V0Z" fill="#936d5c"/>';
  if(enhanced)s+=flower(43,0,'#ffd9ea',.9);
  if(royal)s+='<circle class="firefly" cx="0" cy="-119" r="9" fill="#fff2a7"/>';
 }else if(name==='lantern'){
  s='<path d="M-7 0V-94H7V0Z" fill="#b77d54" stroke="#916044" stroke-width="4"/>'+
  '<path d="M-27 -94Q0 -121 27 -94L17 -59H-17Z" fill="#d97386" stroke="#a85873" stroke-width="4"/>'+
  '<path d="M-15 -91V-67H15V-91Z" fill="#ffeda0" stroke="#fff2cb" stroke-width="3"/>'+
  '<circle cy="-78" r="38" fill="#ffea8c" opacity=".22"/>';
  if(enhanced)s+='<circle class="firefly" cx="-31" cy="-77" r="7" fill="#fff1a6"/>';
  if(royal)s+='<circle class="firefly" cx="35" cy="-77" r="7" fill="#fff1a6"/>';
 }else if(name==='fountain'){
  s='<ellipse rx="62" ry="21" cy="-8" fill="#e2f4fc" stroke="#a6cbe0" stroke-width="6"/>'+
  '<ellipse rx="47" ry="14" cy="-12" fill="#69c7ed"/><path d="M-6 -13V-74H6V-13Z" fill="#eaf1e8" stroke="#acc6ce" stroke-width="3"/>'+
  '<ellipse rx="26" ry="10" cy="-75" fill="#d4eff4" stroke="#fff" stroke-width="3"/>'+
  '<path d="M0 -74Q-41 -107 -42 -40M0 -74Q41 -107 42 -40" stroke="#a6ebff" stroke-width="5" fill="none"/>';
  if(enhanced)s+='<path d="M-11 -81Q-56 -115 -53 -44M11 -81Q56 -115 53 -44" stroke="#eaffff" stroke-width="3" fill="none"/>';
  if(royal)s+='<circle class="firefly" cy="-114" r="9" fill="#fff2ae"/>';
 }else if(name==='butterfly'){
  s=tree(0,0,.78)+'<path d="M-15 -75Q-36 -104 -48 -83Q-45 -65 -15 -75M-15 -75Q-3 -110 18 -102Q23 -79 -15 -75" fill="#df92e7" stroke="#fff" stroke-width="2"/>'+
  '<path d="M20 -67Q49 -99 54 -73Q44 -58 20 -67M20 -67Q-1 -91 -10 -67Q-2 -48 20 -67" fill="#92c6f0" stroke="#fff" stroke-width="2"/>';
  if(enhanced)s+='<circle class="firefly" cx="-4" cy="-107" r="8" fill="#fff1a7"/>';
  if(royal)s+='<circle class="firefly" cx="31" cy="-90" r="8" fill="#fff1a7"/>';
 }else if(name==='castle'){
  s='<path d="M-48 0V-73H48V0Z" fill="#f5e4c8" stroke="#abb2b8" stroke-width="5"/>'+
  '<path d="M-65 0V-105H-31V0M31 0V-105H65V0" fill="#f4e1c9" stroke="#abb2b8" stroke-width="4"/>'+
  '<path d="M-66 -101V-118H-51V-109H-42V-118H-29V-101M30 -101V-118H44V-109H53V-118H67V-101" fill="#fff0d6" stroke="#abb2b8" stroke-width="4"/>'+
  '<path d="M-19 0V-29Q0 -56 19 -29V0Z" fill="#8f7471"/>'+
  '<path d="M-20 -76L0 -103L20 -76Z" fill="#d9869c"/>';
  if(enhanced)s+='<path d="M0 -105V-139" stroke="#a08764" stroke-width="5"/><path class="building-flag" d="M0 -139L37 -130L0 -119Z" fill="#ffdb76"/>';
  if(royal)s+='<circle class="firefly" cx="-49" cy="-127" r="7" fill="#fff1aa"/><circle class="firefly" cx="50" cy="-127" r="7" fill="#fff1aa"/>';
 }
 return s;
}
function plot(x,state,selected){
 const name=state.placements[x.id],level=Number(state.upgrades[x.id])||1,built=!!name;
 const label=built?window.AntVillage.catalog[name].name:'Build here';
 return '<g class="plot-interactive'+(selected===x.id?' selected':'')+'" data-plot="'+x.id+'" tabindex="0" role="button" aria-label="'+label+', plot '+(x.id+1)+'" transform="translate('+x.x+' '+x.y+')">'+
 '<ellipse rx="52" ry="18" cy="7" fill="#39855a" opacity=".26"/>'+
 '<ellipse class="plot-glow" rx="50" ry="17" cy="4" fill="'+(selected===x.id?'#fff3ab':'#9fe0a2')+'" stroke="'+(selected===x.id?'#fff5a7':'#c9f5c1')+'" stroke-width="'+(selected===x.id?6:2)+'" opacity="'+(built?'.56':'.40')+'"/>'+
 (built?'<g filter="url(#v-shadow)">'+structure(name,level)+'</g>':
  '<g class="empty-plot-sign" filter="url(#v-shadow)"><path d="M0 -3V-31" stroke="#956344" stroke-width="5" stroke-linecap="round"/>'+
  '<path d="M-27 -46Q0 -51 27 -46L27 -21Q0 -17 -27 -21Z" fill="#edc18e" stroke="#ad7b54" stroke-width="3" stroke-linejoin="round"/>'+
  '<path d="M-20 -39Q0 -42 19 -39" fill="none" stroke="#fff0bb" stroke-width="2" opacity=".8"/>'+
  '<text x="0" y="-26" class="plot-help">+</text>'+
  '<path d="M-31 4l-5 -7m9 3l-1 -9M34 5l3 -7m-11 4l-1 -6" stroke="#d9f7bd" stroke-width="2" stroke-linecap="round"/>'+
  '</g>')+
 (built&&level>=2?'<text class="plot-level" y="-132">'+('★'.repeat(level))+'</text>':'')+
 (built?'<text class="plot-name" y="34">'+label+'</text>':'')+'</g>';
}
function render(state,selected){
 const b=svg.querySelector('#village-buildings');if(b)b.innerHTML=points.map(p=>plot(p,state,selected)).join('');
 const fx=svg.querySelector('#village-combo-effects');
 if(fx&&window.AntVillage){
  const active=window.AntVillage.discoveries().active;
  fx.innerHTML=active.map((c,i)=>'<g class="is-night-only"><circle class="firefly" cx="'+(328+i*162)+'" cy="'+(352+i*19)+'" r="13" fill="#fff4a4" opacity=".4"/><text x="'+(314+i*165)+'" y="'+(322+i*18)+'" font-size="27">'+c.symbol+'</text></g>').join('');
 }
}
function setNight(on){document.getElementById('world-panel').classList.toggle('night',!!on);return !!on}
function onSelect(fn){
 svg.addEventListener('click',e=>{const target=e.target.closest('[data-plot]');if(target)fn(Number(target.getAttribute('data-plot')))});
 svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const target=e.target.closest('[data-plot]');if(target){e.preventDefault();fn(Number(target.getAttribute('data-plot')))}}});
}
base();window.AntVillageScene=Object.freeze({render,setNight,onSelect});
})();

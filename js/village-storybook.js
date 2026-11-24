/* ANT CANVAS · Storybook Village
 * Rendered scene and residents only. The saved village economy is unchanged.
 * All ant routes are continuous, closed, forward-only curves.
 */
(function(){
'use strict';
const svg=document.getElementById('village-world');
if(!svg)return;
const W=960,H=720;
svg.setAttribute('viewBox','0 0 '+W+' '+H);
const gardenPlots=[
 {id:0,x:157,y:280},{id:1,x:345,y:218},{id:2,x:766,y:260},
 {id:3,x:123,y:465},{id:5,x:828,y:425},
 {id:6,x:217,y:620},{id:7,x:435,y:622},{id:8,x:803,y:604}
];
const gardenRoads=[
 'M211 354 C267 300 345 265 414 243 C504 222 577 250 623 306 C657 350 647 412 617 468 C581 528 505 557 413 560 C307 564 225 529 187 478 C155 435 166 391 211 354 Z',
 'M211 354 Q177 322 157 280',
 'M353 269 Q333 247 345 218',
 'M623 306 Q682 272 766 260',
 'M175 433 Q145 465 123 465',
 'M641 410 Q683 431 720 434 Q774 437 828 425',
 'M249 526 Q217 579 217 620',
 'M435 560 Q434 591 435 622',
 'M828 425 Q861 513 803 604'
];
// Every resident follows the same continuous visible ring road in the forward direction.
// Varying initial positions and walking speeds prevent a line of synchronized workers.
let plots=gardenPlots,roads=gardenRoads,loops=[roads[0]],region='garden',generation=0;
const layouts={
 forest:[[160,295],[350,245],[740,270],[110,475],[820,450],[230,620],[475,630],[790,620]],
 island:[[180,280],[365,230],[730,280],[135,475],[825,445],[245,615],[485,630],[760,615]],
 snow:[[155,300],[345,245],[750,265],[120,470],[835,440],[240,615],[470,630],[790,615]]
};
function configureRegion(id){region=layouts[id]?id:'garden';if(region==='garden'){plots=gardenPlots;roads=gardenRoads}else{plots=layouts[region].map((p,i)=>({id:[0,1,2,3,5,6,7,8][i],x:p[0],y:p[1]}));const ring=region==='forest'?'M230 365 C290 280 520 235 660 310 C730 355 715 470 635 535 C520 595 290 570 205 480 C175 430 185 395 230 365Z':region==='island'?'M225 365 C320 255 550 250 685 335 C755 400 715 500 615 540 C475 595 285 565 210 465 C185 420 190 395 225 365Z':'M225 360 C325 270 545 250 685 325 C755 395 720 490 635 540 C485 605 280 570 205 470 C170 425 190 390 225 360Z';const anchors=[[230,365],[350,285],[685,325],[205,470],[715,440],[280,550],[475,570],[635,540]];roads=[ring,...plots.map((p,i)=>'M'+anchors[i][0]+' '+anchors[i][1]+' Q'+(p.x+anchors[i][0])/2+' '+anchors[i][1]+' '+p.x+' '+p.y)]}loops=[roads[0]];}

let seed=73191;
function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const n=(x)=>Number(x).toFixed(1);
const group=(x,y,s,inner,cls='')=>'<g '+(cls?'class="'+cls+'" ':'')+'transform="translate('+x+' '+y+') scale('+s+')">'+inner+'</g>';
const shadow=(rx,ry,cy=3)=>'<ellipse cx="0" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="#365e37" opacity=".22"/>';
const defs='<defs>'+
 [['sky','#67c2fa','#e3f5d5'],['night','#14264f','#645d99'],['far','#b4d8ce','#789fa8'],['hill','#c6e99a','#84be82'],['grass','#c1e677','#609e43'],['grass2','#a9d46a','#4d913e'],['river','#bceff5','#299cc9'],['cream','#fff4c9','#e0ae74'],['wood','#ebba7b','#a46a3c'],['roof','#ffb29a','#c95750'],['roof2','#f9a688','#a64f48'],['leaf','#b9df59','#4c8e3e'],['leaf2','#d8ee83','#70a644'],['stone','#e6ded0','#979b91'],['amber','#fff9be','#eca34c'],['ant','#9d6950','#4f342c']].map(a=>'<linearGradient id="sb-'+a[0]+'" x1="0" y1="0" x2="0.7" y2="1"><stop stop-color="'+a[1]+'"/><stop offset="1" stop-color="'+a[2]+'"/></linearGradient>').join('')+
 '<radialGradient id="sb-light"><stop stop-color="#fff9c9" stop-opacity=".95"/><stop offset="1" stop-color="#fff9c9" stop-opacity="0"/></radialGradient>'+
 '<radialGradient id="sb-sun"><stop stop-color="#fffbcf"/><stop offset=".52" stop-color="#fff2ae"/><stop offset="1" stop-color="#fff2ae" stop-opacity="0"/></radialGradient>'+
 '<filter id="sb-shadow" x="-45%" y="-45%" width="190%" height="220%"><feDropShadow dx="1" dy="7" stdDeviation="4" flood-color="#355a36" flood-opacity=".3"/></filter>'+
 '<filter id="sb-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>'+
 '<pattern id="sb-paper" patternUnits="userSpaceOnUse" width="19" height="19"><circle cx="3" cy="4" r=".7" fill="#fffbd1" opacity=".3"/><circle cx="13" cy="13" r=".8" fill="#346e43" opacity=".12"/></pattern>'+
 '</defs>';
function flower(x,y,s,c){
 let petals='';for(let i=0;i<5+guestCount;i++){const a=i*Math.PI*2/5;petals+='<ellipse cx="'+n(Math.sin(a)*4.7)+'" cy="'+n(-13+Math.cos(a)*4.7)+'" rx="4.1" ry="5.6" transform="rotate('+(-i*72)+' '+n(Math.sin(a)*4.7)+' '+n(-13+Math.cos(a)*4.7)+')" fill="'+c+'" stroke="#fff4cc" stroke-width=".55"/>';}
 return group(x,y,s,'<path d="M0 0Q-1 -7 0 -13M0 -4Q-7 -9 -9 -4M0 -7Q7 -12 9 -7" fill="none" stroke="#4b8b43" stroke-width="1.9" stroke-linecap="round"/>'+petals+'<circle cy="-13" r="3" fill="#ffd576" stroke="#e6a74f" stroke-width=".6"/>');
}
function flowerbed(x,y,s,count=14){
 let a=shadow(47,12);
 for(let i=0;i<count;i++){
  let px=(rnd()-.5)*84,py=(rnd()-.5)*21;
  a+=flower(n(px),n(py),n(.55+rnd()*.46),['#fff6d0','#f89cb6','#fbc1d0','#e6b7ee','#ffdf86'][i%5]);
 }
 return group(x,y,s,a,'sb-flowers');
}
function grass(x,y,s){
 return group(x,y,s,'<path d="M-7 0Q-10 -12 -4 -14Q-3 -8 0 0Q-1 -19 5 -23Q6 -10 3 0Q12 -17 16 -14Q14 -7 8 0" fill="#7fa63d" stroke="#a9c95a" stroke-width=".7"/><path d="M-2 0Q-6 -14 -12 -16M6 0Q9 -10 13 -12" stroke="#d1e383" stroke-width="1.2" fill="none"/>');
}
function rock(x,y,s){
 return group(x,y,s,shadow(21,6)+'<path d="M-20 -1L-15 -15L-1 -23L14 -18L23 -5L17 4L-12 5Z" fill="url(#sb-stone)" stroke="#a3aa97" stroke-width="1.4"/><path d="M-15 -15L-2 -22L8 -14L2 -9L-12 -8Z" fill="#f2eee1" opacity=".68"/><path d="M7 -14L15 -17L22 -5L12 -1Z" fill="#929b91" opacity=".48"/>');
}
function mushroom(x,y,s){
 return group(x,y,s,shadow(22,7)+'<path d="M-8 2Q-10 -19 -5 -34H7Q12 -15 9 2Z" fill="url(#sb-cream)" stroke="#bd966d" stroke-width="1.3"/><path d="M-26 -27Q-22 -53 0 -54Q25 -53 28 -27Q4 -15 -26 -27Z" fill="url(#sb-roof)" stroke="#b86a51" stroke-width="1.6"/><ellipse cx="-12" cy="-39" rx="6" ry="4" fill="#fff5d3"/><ellipse cx="8" cy="-44" rx="7" ry="4" fill="#fff5d3"/><ellipse cx="17" cy="-30" rx="4" ry="2.8" fill="#fff5d3"/>');
}
function canopy(x,y,s){
 let a=shadow(56,16)+'<path d="M-10 4Q-3 -44 -15 -86L7 -95Q17 -41 14 4Z" fill="url(#sb-wood)" stroke="#9a663d" stroke-width="2"/><path d="M-4 -28Q-31 -49 -39 -62M7 -32Q27 -52 42 -62" fill="none" stroke="#a26f46" stroke-width="8" stroke-linecap="round"/><path d="M3 -8Q7 -47 2 -79" fill="none" stroke="#efc58a" stroke-width="2.2" opacity=".8"/>';
 a+='<path d="M-63 -56Q-80 -80 -59 -103Q-67 -131 -31 -140Q-12 -166 18 -147Q54 -154 68 -121Q97 -99 67 -72Q52 -52 17 -62Q-24 -43 -63 -56Z" fill="url(#sb-leaf)" stroke="#538f3b" stroke-width="2"/>';
 for(let i=0;i<27;i++){
  const t=rnd()*Math.PI*2,r=Math.sqrt(rnd()),px=Math.cos(t)*55*r,py=-108+Math.sin(t)*37*r,sz=9+rnd()*9;
  a+='<ellipse cx="'+n(px)+'" cy="'+n(py)+'" rx="'+n(sz*1.1)+'" ry="'+n(sz*.72)+'" fill="'+['#c6e67b','#aed55a','#83ba47','#a1ce60','#e0efa0'][i%5]+'" opacity=".83" transform="rotate('+n(rnd()*60-30)+' '+n(px)+' '+n(py)+')"/>';
 }
 return group(x,y,s,a);
}
function bush(x,y,s){
 let a=shadow(35,7);
 for(let i=0;i<8;i++)a+='<ellipse cx="'+n(-29+i*8)+'" cy="'+n(-9-rnd()*12)+'" rx="'+n(10+rnd()*6)+'" ry="'+n(8+rnd()*7)+'" fill="'+['#7bb84a','#a9d56a','#91c356','#bcd87a'][i%4]+'" stroke="#83b14f" stroke-width=".6"/>';
 return group(x,y,s,a);
}
function lantern(x,y,s){
 return group(x,y,s,shadow(13,5)+'<path d="M0 2V-55Q0 -60 7 -60H12" fill="none" stroke="#815535" stroke-width="5" stroke-linecap="round"/><circle class="sb-lantern-halo" cx="12" cy="-40" r="33" fill="url(#sb-light)" opacity=".42"/><path d="M-1 -46L12 -58L25 -46L21 -24H3Z" fill="#b47b4e" stroke="#815535" stroke-width="2"/><path d="M4 -45H20L17 -28H7Z" fill="url(#sb-amber)" stroke="#ffefad" stroke-width="1.6"/><path d="M12 -45V-28M-3 -46H27" stroke="#8e653f" stroke-width="2"/>');
}
function windowShape(x,y,r){
 return '<g transform="translate('+x+' '+y+')"><circle r="'+(r+3)+'" fill="#b98351"/><circle r="'+r+'" fill="url(#sb-amber)" stroke="#ffe0a3" stroke-width="3"/><path d="M-'+r+' 0H'+r+'M0 -'+r+'V'+r+'" stroke="#a86b3e" stroke-width="3.6" stroke-linecap="round"/><path d="M-'+(r*.62)+' -'+(r*.6)+'Q0 -'+r+' '+(r*.5)+' -'+(r*.65)+'" fill="none" stroke="#fff7bd" stroke-width="2" opacity=".85"/></g>';
}
function cottage(x,y,s){
 let a=shadow(126,28);
 a+='<path d="M-91 4L-88 -80L-45 -128L47 -128L89 -80L93 3Q0 21 -91 4Z" fill="url(#sb-cream)" stroke="#bd865b" stroke-width="3.5"/>';
 a+='<path d="M75 -59L89 -80L93 3L75 9Z" fill="#d59c65" opacity=".72"/>';
 for(let i=0;i<11;i++){let px=-76+i*15;a+='<path d="M'+px+' -5l12 0" stroke="#b58e6e" stroke-width="4" stroke-linecap="round" opacity=".38"/>';}
 a+='<path d="M54 -113V-159H77V-94Z" fill="#d7af8a" stroke="#a77e60" stroke-width="3"/><path d="M52 -140H78M53 -126H77M63 -159V-140M69 -140V-126" stroke="#f7d9b2" stroke-width="2"/><rect x="49" y="-165" width="33" height="11" rx="4" fill="#ffe2bd" stroke="#b28b65" stroke-width="2"/>';
 for(let i=0;i<3;i++)a+='<circle class="sb-smoke" style="animation-delay:-'+(i*.9)+'s" cx="'+(67+i*3)+'" cy="'+(-174-i*6)+'" r="'+(8+i*3)+'" fill="#fff7e6" opacity=".7"/>';
 a+='<path d="M-106 -72L-9 -154Q0 -164 12 -154L108 -72Q102 -53 83 -59L0 -127L-82 -59Q-99 -53 -106 -72Z" fill="url(#sb-roof)" stroke="#a65a48" stroke-width="4" stroke-linejoin="round"/>';
 for(let i=0;i<5;i++){
  let u=i/5,v=(i+1)/5,xa=-10-91*u,ya=-151+76*u,xb=-10-91*v,yb=-151+76*v;
  a+='<path d="M'+n(xa+1)+' '+n(ya+6)+'Q'+n((xa+xb)/2+7)+' '+n((ya+yb)/2+11)+' '+n(xb+6)+' '+n(yb+6)+'" stroke="#ffd0ae" stroke-width="4" fill="none" stroke-linecap="round" opacity=".78"/>';
  a+='<path d="M'+n(-xa+1)+' '+n(ya+6)+'Q'+n(-(xa+xb)/2+7)+' '+n((ya+yb)/2+11)+' '+n(-xb-2)+' '+n(yb+6)+'" stroke="#c76750" stroke-width="3.3" fill="none" stroke-linecap="round" opacity=".9"/>';
 }
 // Fine roof tile seams, curved ceramic highlights and a warm stucco grain.
 for(let i=0;i<5;i++){
   const x=-15-i*14,y=-145+i*12;
   a+='<path d="M'+(x-6)+' '+(y+6)+'q3 7 9 9M'+(-x+4)+' '+(y+6)+'q-3 7 -9 9" fill="none" stroke="#a95747" stroke-width="1.35" opacity=".48"/>';
 }
 for(let i=0;i<29;i++){
  const px=-76+rnd()*151,py=-61+rnd()*65;
  if(Math.abs(px)<36)continue;
  a+='<ellipse cx="'+n(px)+'" cy="'+n(py)+'" rx="'+n(.7+rnd()*1.4)+'" ry=".75" fill="#bc906b" opacity=".19"/>';
 }
 a+=windowShape(0,-98,16)+windowShape(-54,-38,13)+windowShape(54,-38,13);
 for(const x of [-54,54])a+='<path d="M'+(x-17)+' -22h34l-4 8h-26Z" fill="url(#sb-wood)" stroke="#a46b43" stroke-width="1.4"/>'+flower(x-9,-18,.54,'#f6a2bf')+flower(x,-18,.55,'#fff2c5')+flower(x+9,-18,.54,'#f6a2bf');
 a+='<path d="M-31 7V-42Q-30 -75 0 -76Q31 -75 31 -42V7Z" fill="#cda270" stroke="#a6734b" stroke-width="4"/><path d="M-23 8V-42Q-23 -67 0 -69Q23 -67 23 -42V8Z" fill="url(#sb-wood)" stroke="#885730" stroke-width="3"/>';
 for(let px of [-13,0,13])a+='<path d="M'+px+' -55V5" stroke="#92603c" stroke-width="2" opacity=".75"/>';
 a+='<circle cx="14" cy="-18" r="3.7" fill="#ffe089" stroke="#906037" stroke-width="1.2"/><path d="M-39 9Q0 17 39 9V16Q0 28 -39 16Z" fill="#c0a58a" stroke="#98846d" stroke-width="2"/>';
 a+='<path d="M-39 -58Q-7 -93 39 -58" stroke="#f9ab8e" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-35 -60Q-7 -88 35 -60" stroke="#ffd1b0" stroke-width="3" fill="none"/>';
 a+=lantern(-88,-4,.64)+lantern(86,-3,.64);
 for(let i=0;i<14;i++){let px=-80+i*6.2,py=-75-Math.sin(i*.3)*24;a+='<ellipse cx="'+n(px)+'" cy="'+n(py)+'" rx="8" ry="4.2" transform="rotate('+(-30+i*11)+' '+n(px)+' '+n(py)+')" fill="'+(i%2?'#92c54d':'#69a83f')+'"/>';if(i%3===0)a+=flower(px,py+2,.65,'#fff6d0');}
 a+=flowerbed(-65,10,.66,12)+flowerbed(67,9,.66,11);
 a+='<g transform="translate(104 -45)"><path d="M0 51V-59Q0 -64 8 -64" fill="none" stroke="#98663e" stroke-width="5" stroke-linecap="round"/><path d="M0 -57H41" stroke="#9e6d43" stroke-width="5"/><path class="building-flag" d="M4 -54H39V-9L22 -16L4 -9Z" fill="#f299a4" stroke="#b66d65" stroke-width="2"/><ellipse cx="21" cy="-33" rx="12" ry="9" transform="rotate(-28 21 -33)" fill="#ffe1a2" stroke="#fbeac3" stroke-width="1.4"/><circle cx="14" cy="-34" r="2" fill="#79b972"/><circle cx="23" cy="-38" r="2" fill="#f28a9a"/><circle cx="28" cy="-30" r="2" fill="#78b7d6"/></g>';
 a+='<g transform="translate(0 26)"><path d="M-55 3V25M55 3V25" stroke="#a27343" stroke-width="5"/><rect x="-72" y="-13" width="144" height="27" rx="9" fill="url(#sb-wood)" stroke="#a36e40" stroke-width="2.4"/><path d="M-61 -7H60M-59 7H59" stroke="#ffe1a5" stroke-width="1.5" opacity=".6"/><text y="4" text-anchor="middle" font-size="13" font-family="Georgia,serif" font-weight="bold" fill="#fff4d4" stroke="#8f623d" stroke-width="1.2" paint-order="stroke">ANT ART STUDIO</text></g>';
 return group(x,y,s,a);
}
function bridge(x,y,s){
 let a='<path d="M-72 9Q0 -49 72 9L72 23Q0 -23 -72 23Z" fill="#a4774d" stroke="#754d34" stroke-width="3"/><path d="M-72 6Q0 -49 72 6" fill="none" stroke="#e7b478" stroke-width="15" stroke-linecap="round"/>';
 for(let i=0;i<12;i++){const xx=-65+i*12,yy=-32+Math.pow(xx/70,2)*37;a+='<path d="M'+xx+' '+n(yy-4)+'l2 18" stroke="#bc8656" stroke-width="2.7"/>';}
 a+='<path d="M-72 -16Q0 -65 72 -16" fill="none" stroke="#f6d2a2" stroke-width="5"/>';
 for(let xx of [-72,-44,0,44,72]){let yy=-50+Math.pow(xx/72,2)*34;a+='<path d="M'+xx+' '+n(yy)+'v33" stroke="#966039" stroke-width="7" stroke-linecap="round"/><circle cx="'+xx+'" cy="'+n(yy)+'" r="4" fill="#f0c390"/>';}
 return group(x,y,s,a);
}
function windmill(x,y,s){
 return group(x,y,s,'<path d="M-23 0L-15 -61H15L24 0Z" fill="url(#sb-cream)" stroke="#b99365" stroke-width="2"/><path d="M-27 -59L0 -86L26 -59Z" fill="url(#sb-roof)" stroke="#af6c50" stroke-width="2"/><path d="M-7 0V-16Q0 -28 7 -16V0" fill="#9e7044"/><g transform="translate(0 -48)"><g class="sb-windmill"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="13s" repeatCount="indefinite"/>'+[0,90,180,270].map(a=>'<g transform="rotate('+a+')"><path d="M0 0V-44" stroke="#9b754c" stroke-width="3"/><path d="M0 -11L12 -19L12 -43H0Z" fill="#fff4cc" stroke="#a98054" stroke-width="1.7"/><path d="M0 -26H12M5 -15V-43" stroke="#d1b58a" stroke-width="1"/></g>').join('')+'<circle r="5" fill="#bc8550" stroke="#ffdc96" stroke-width="1.5"/></g></g>');
}
function road(d,w){
 return '<path d="'+d+'" fill="none" stroke="#7ea74b" stroke-width="'+(w+7)+'" stroke-linecap="round" opacity=".25"/><path d="'+d+'" fill="none" stroke="#d7b97c" stroke-width="'+(w+2)+'" stroke-linecap="round"/><path d="'+d+'" fill="none" stroke="#f7e5b4" stroke-width="'+w+'" stroke-linecap="round"/><path d="'+d+'" fill="none" stroke="#d5b68a" stroke-width="2" stroke-dasharray="2 19" stroke-linecap="round" opacity=".7"/>';
}
function lily(x,y,s){
 return group(x,y,s,'<ellipse rx="25" ry="10" fill="#7cbd57" stroke="#bde27a" stroke-width="1.4"/><path d="M0 0L23 -5L25 1Z" fill="#79c9dc"/><path d="M-4 -1Q-8 -17 0 -19Q10 -15 4 -4Q19 -15 19 -4Q12 6 2 4Q-8 7 -17 -2Q-16 -13 -4 -1Z" fill="#fff0d4" stroke="#edb7a6" stroke-width="1.3"/><circle cy="-4" r="3.6" fill="#ffd27f"/>');
}
function scene(){
 seed=73191;
 if(region!=='garden'){regionalScene();return;}
 let a=defs+'<rect width="960" height="720" fill="url(#sb-sky)" class="sky-day"/><rect width="960" height="720" fill="url(#sb-night)" class="sky-night" opacity="0"/>'+
 '<g class="is-day-only"><circle cx="811" cy="93" r="77" fill="url(#sb-sun)"/><circle cx="811" cy="93" r="27" fill="#fff9ce"/></g>'+
 '<g class="is-night-only"><circle cx="811" cy="93" r="29" fill="#fff1bb"/><circle cx="824" cy="81" r="27" fill="#39487d"/>'+Array.from({length:36},(_,i)=>'<circle cx="'+(28+i*73%910)+'" cy="'+(15+i*47%160)+'" r="'+(i%3===0?2:1.2)+'" fill="#fff5bc" class="firefly"/>').join('')+'</g>';
 for(let [x,y,s] of [[125,92,.9],[365,74,1.13],[594,108,.78],[720,49,.64]]){
  a+=group(x,y,s,'<g fill="#fff7e9" opacity=".88"><ellipse rx="52" ry="13" cy="8"/><circle cx="-27" cy="-2" r="19"/><circle cx="0" cy="-12" r="25"/><circle cx="28" cy="-2" r="19"/></g>','is-day-only');
 }
 a+='<path d="M0 240Q112 127 256 184Q380 102 520 174Q685 90 816 172Q891 151 960 191V720H0Z" fill="url(#sb-far)"/>'+
 '<path d="M0 283Q120 191 256 245Q396 153 547 224Q690 155 960 249V720H0Z" fill="#b6d6a2"/>'+
 '<path d="M0 321Q162 213 332 270Q517 183 679 266Q833 214 960 255V720H0Z" fill="url(#sb-hill)"/>'+
 windmill(595,204,.61)+canopy(522,237,.45)+canopy(885,249,.58)+canopy(247,218,.43)+
 '<path d="M0 349Q156 250 331 324Q514 270 686 305Q835 256 960 300V720H0Z" fill="url(#sb-grass)"/>'+
 '<path d="M0 537Q126 473 297 552Q477 594 640 515Q823 441 960 530V720H0Z" fill="url(#sb-grass2)" opacity=".55"/>'+
 '<path d="M0 275H960V720H0Z" fill="url(#sb-paper)"/>';
 const river='M988 302 C885 296 826 328 788 366 C730 411 736 465 678 501 C631 530 625 587 589 630 C564 658 521 704 498 748';
 a+='<path d="'+river+'" fill="none" stroke="#4b834d" stroke-width="132" opacity=".27"/><path d="'+river+'" fill="none" stroke="#e9e2b0" stroke-width="121"/><path d="'+river+'" fill="none" stroke="#b1d9bc" stroke-width="106"/><path d="'+river+'" fill="none" stroke="url(#sb-river)" stroke-width="91" stroke-linecap="round"/>'+
 '<path class="water-streak" d="M975 291Q836 319 794 368Q742 434 708 483Q640 544 624 590Q572 675 516 727" fill="none" stroke="#e7ffff" stroke-width="3.5" stroke-dasharray="18 23" opacity=".8"/>';
 for(let i=0;i<45;i++){const t=i/45,xx=963-448*t+Math.sin(t*8)*16,yy=310+t*416;let off=(rnd()-.5)*52;a+='<path class="sb-water-glint" style="animation-delay:-'+n(rnd()*5)+'s" d="M'+n(xx+off)+' '+n(yy)+'q'+n(5+rnd()*9)+' -2 '+n(12+rnd()*14)+' 0" stroke="#f0ffff" stroke-width="'+n(.6+rnd()*1.8)+'" stroke-linecap="round" opacity="'+n(.25+rnd()*.55)+'" fill="none"/>';}
 a+=lily(648,567,.65)+lily(576,666,.81)+lily(834,342,.55);
 for(let i=0;i<115;i++){
  let x=19+rnd()*922,y=259+rnd()*447;
  if(plots.some(p=>Math.hypot(x-p.x,y-p.y)<71)||Math.hypot(x-471,y-425)<145||Math.abs(x-(963-(y-310)*1.08))<69)continue;
  a+=grass(n(x),n(y),n(.25+rnd()*.48));
 }
 a+=roads.map((d,i)=>road(d,i===0?32:21)).join('');
 a+=bridge(729,435,.84);
 for(const [x,y,s] of [[68,380,.9],[893,321,.9],[55,617,.92],[922,622,.97],[306,256,.49],[635,289,.5]])a+=canopy(x,y,s);
 for(const [x,y,s] of [[78,428,.85],[290,375,.56],[600,339,.6],[882,477,.76],[312,629,.65],[74,682,1.05],[917,692,.98]])a+=bush(x,y,s);
 for(const [x,y,s] of [[54,473,.9],[255,300,.78],[375,349,.75],[580,457,.75],[776,518,.7],[125,560,.9],[324,674,.9],[857,641,.9],[33,706,1.3],[930,705,1.3]])a+=flowerbed(x,y,s);
 for(const [x,y,s] of [[74,333,.6],[633,536,.75],[730,411,.65],[580,604,.9],[291,615,.65],[870,555,.75],[96,645,1.05]])a+=rock(x,y,s);
 a+=mushroom(48,586,1.25)+mushroom(87,595,.72)+mushroom(909,675,1.35)+mushroom(866,690,.7);
 a+=lantern(260,419,.75)+lantern(612,382,.7)+lantern(671,421,.75)+lantern(788,430,.75);
 a+=cottage(475,437,1.12);
 // Decorative fence and meadow edge details are scenery, not unlockable construction.
 for(const [x,y,k] of [[120,536,0.9],[309,592,.65],[790,506,.65]]){
  a+=group(x,y,k,'<path d="M-30 4Q0 13 30 4" stroke="#a7794b" stroke-width="2.7" fill="none"/><path d="M-30 -3Q0 6 30 -3" stroke="#d1a16b" stroke-width="3" fill="none"/>'+[-30,-10,10,30].map(i=>'<path d="M'+i+' 9V-12" stroke="#9b7047" stroke-width="4" stroke-linecap="round"/><circle cx="'+i+'" cy="-12" r="2.3" fill="#efcd93"/>').join(''));
 }
 // Small, independent decorative butterflies with fluttering wings and gentle continuous flight.
 const flights=[
  {path:'M287 183Q328 165 339 195Q308 221 287 183Z',c:'#f9c969',d:7},
  {path:'M838 552Q892 522 902 571Q865 606 838 552Z',c:'#f8b3d3',d:9},
  {path:'M109 583Q140 550 177 582Q140 610 109 583Z',c:'#e8c1fa',d:8}
 ];
 a+='<g pointer-events="none">'+flights.map((b,i)=>'<g class="sb-butterfly-flight"><animateMotion path="'+b.path+'" dur="'+b.d+'s" begin="-'+i*2+'s" repeatCount="indefinite"/><g class="sb-flutter"><path d="M0 1Q-12 -12 -14 -2Q-15 7 0 2Q13 -12 15 -3Q13 7 0 2Z" fill="'+b.c+'" stroke="#fff5d6" stroke-width="1.2"/><ellipse cx="0" cy="2" rx="1.5" ry="5" fill="#775241"/><path d="M0 -2Q-2 -7 -5 -8M0 -2Q2 -7 5 -8" fill="none" stroke="#775241" stroke-width="1"/></g></g>').join('')+'</g>';
 // Framing foliage brings the viewpoint into the miniature landscape.
 a+='<g pointer-events="none" opacity=".95">'+canopy(-16,181,1.25)+canopy(958,159,1.05)+'</g>';
 a+='<g id="village-buildings"></g><g id="village-combo-effects"></g><g id="village-residents"></g><g class="sb-night-shade" pointer-events="none"><rect width="960" height="720" fill="#152d69" opacity=".29"/></g>';
 a+='<g class="is-night-only" pointer-events="none">'+[[261,365],[612,328],[671,374],[788,376]].map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="45" fill="url(#sb-light)" opacity=".68"/>').join('')+Array.from({length:22},(_,i)=>'<circle class="firefly" cx="'+(45+i*127%870)+'" cy="'+(300+i*67%370)+'" r="2.9" fill="#fff5a3"/>').join('')+'</g>';
 svg.innerHTML=a;
}
function pine(x,y,k){return group(x,y,k,shadow(42,10)+'<path d="M-8 3V-90H8V3Z" fill="#796b65"/><path d="M-55 -30L0 -145L55 -30Z" fill="#466f7c" stroke="#b8dce1" stroke-width="2"/><path d="M-43 -69L0 -165L43 -69Z" fill="#537f90"/><path d="M0 -165L-25 -110L-7 -116L7 -103L28 -110Z M-40 -64L-53 -34L-19 -46L3 -37L23 -47L53 -34L40 -64L12 -55L0 -66L-15 -55Z" fill="#f0f8fa"/>')}
function palm(x,y,k){return group(x,y,k,shadow(42,10)+'<path d="M-8 0Q15 -57 2 -112L13 -112Q31 -60 7 0Z" fill="#c19462" stroke="#98693d" stroke-width="2"/>'+[-65,-33,0,35,68].map(a=>'<g transform="translate(7 -110) rotate('+a+')"><path d="M0 0Q-42 -35 -66 2Q-35 -8 0 0Z" fill="#4d9d69" stroke="#a9dd83" stroke-width="2"/></g>').join('')+'<circle cx="5" cy="-105" r="7" fill="#9d6d45"/>')}
function regionalDetails(forest,island,snow){
 let a='';
 if(forest){
  a+='<g opacity=".7"><path d="M0 180Q145 95 275 170T590 154T960 170V210Q830 168 690 220T355 208T0 230Z" fill="#677f4e"/><path d="M0 170Q120 112 230 145M730 157Q842 106 960 155" fill="none" stroke="#456944" stroke-width="9"/></g>';
  for(let i=0;i<36;i++){let x=12+rnd()*936,y=252+rnd()*450;if(plots.some(p=>Math.hypot(x-p.x,y-p.y)<72)||Math.hypot(x-475,y-430)<160)continue;a+=mushroom(n(x),n(y),n(.18+rnd()*.38));if(i%3===0)a+='<circle cx="'+n(x+8)+'" cy="'+n(y-18)+'" r="12" fill="url(#sb-light)" opacity=".6"/>'}
 }else if(island){
  a+='<g opacity=".85"><path d="M0 396Q38 375 69 400M2 430Q32 411 66 437M895 403Q930 369 960 376M902 486Q935 454 960 457" stroke="#e7ffff" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M30 523l28 -13 25 13-25 8Z" fill="#bf8150"/><path d="M56 513V478L78 507Z" fill="#fff2c2" stroke="#ddbb82" stroke-width="2"/></g>';
  for(let i=0;i<30;i++){let x=20+rnd()*920,y=274+rnd()*430;if(plots.some(p=>Math.hypot(x-p.x,y-p.y)<74)||Math.hypot(x-475,y-430)<155)continue;a+=group(n(x),n(y),n(.4+rnd()*.45),'<path d="M0 0Q-12 -15 -7 -25Q1 -22 1 -11Q10 -28 18 -24Q23 -15 5 0Z" fill="'+['#efae9c','#f4d58b','#cf8ead'][i%3]+'"/><circle cx="0" cy="-7" r="2" fill="#fff6d5"/>')}
 }else if(snow){
  a+='<g class="is-night-only" opacity=".65"><path d="M30 93Q210 14 390 105T740 65T960 82" fill="none" stroke="#9ce7bd" stroke-width="20" stroke-linecap="round"/><path d="M25 103Q210 35 390 120T735 80T960 100" fill="none" stroke="#c4a4ef" stroke-width="10" stroke-linecap="round"/></g>';
  for(let i=0;i<38;i++){let x=15+rnd()*930,y=295+rnd()*415;if(plots.some(p=>Math.hypot(x-p.x,y-p.y)<70)||Math.hypot(x-475,y-430)<150)continue;a+=group(n(x),n(y),n(.5+rnd()*.6),'<ellipse rx="15" ry="5" fill="#b5d5e1"/><path d="M-8 -1L-3 -16 3 -25 10 -10 7 0Z" fill="#aedbea" stroke="#f7feff" stroke-width="1.4"/>')}
 }
 return a;
}
function regionalScene(){
 const forest=region==='forest',island=region==='island',snow=region==='snow';
 const sky=forest?'#f3cf95':island?'#91e6e5':'#bfdaed',land=forest?'#8ea263':island?'#c9df91':'#e1eef2',far=forest?'#627b5c':island?'#6eaf9a':'#8aa9bd',pathColor=forest?'#cdb382':island?'#f9e4b4':'#d5e1df';
 let a=defs+'<rect width="960" height="720" fill="'+sky+'" class="sky-day"/><rect width="960" height="720" fill="url(#sb-night)" class="sky-night" opacity="0"/><g class="is-day-only"><circle cx="790" cy="80" r="56" fill="url(#sb-sun)"/><circle cx="790" cy="80" r="24" fill="#fff5c7"/></g><g class="is-night-only"><circle cx="790" cy="80" r="28" fill="#fff4c5"/>'+Array.from({length:30},(_,i)=>'<circle cx="'+(25+i*83%900)+'" cy="'+(15+i*47%150)+'" r="1.7" fill="#fff5d0"/>').join('')+'</g>';
 if(snow)a+='<path d="M0 300L120 85 245 270 365 60 520 280 705 100 960 310V720H0Z" fill="#91adc0"/><path d="M83 151L120 85 158 151 136 145 120 166 106 146Z M310 148L365 60 418 150 386 137 365 158 345 136Z M650 164L705 100 762 169 728 157 705 179 680 157Z" fill="#f8fbff"/>';
 else a+='<path d="M0 260Q120 110 260 230Q435 80 590 205Q770 120 960 250V720H0Z" fill="'+far+'"/>';
 a+='<path d="M0 330Q145 210 330 300Q530 205 710 285Q840 230 960 300V720H0Z" fill="'+land+'"/>';
 if(island){a+='<path d="M0 400Q90 330 90 450Q30 575 155 720H0Z M960 335Q865 400 900 520Q945 600 815 720H960Z" fill="#57c9ce" stroke="#f9edbc" stroke-width="15"/><path d="M0 470Q80 410 45 550M950 420Q875 500 939 590" fill="none" stroke="#e8ffff" stroke-width="4" stroke-dasharray="13 14"/>'}
 if(forest){for(let i=0;i<10;i++)a+=canopy(20+i*103,236+(i%3)*20,.65+(i%3)*.15);a+='<path d="M0 680Q210 600 360 720H0Z" fill="#7e784d"/>'}
 if(snow){a+='<ellipse cx="724" cy="555" rx="93" ry="34" fill="#9bd9e8" stroke="#f8fcff" stroke-width="9"/><path d="M672 549l40 -8 32 9 42 -10" fill="none" stroke="#d6f5fc" stroke-width="2"/>'}
 for(const [x,y,k] of [[40,365,1],[910,340,1],[65,625,.9],[905,635,1],[278,215,.6],[595,245,.6]])a+=forest?mushroom(x,y,k*2):island?palm(x,y,k):pine(x,y,k);
 a+=regionalDetails(forest,island,snow);
 a+=roads.map((d,i)=>'<path d="'+d+'" fill="none" stroke="'+far+'" stroke-opacity=".35" stroke-width="'+(i?24:42)+'" stroke-linecap="round"/><path d="'+d+'" fill="none" stroke="'+pathColor+'" stroke-width="'+(i?17:32)+'" stroke-linecap="round"/>').join('');
 if(forest)a+=group(475,427,1.25,shadow(115,22)+mushroom(-52,-4,2)+mushroom(48,-8,2.3)+mushroom(0,0,3.4)+windowShape(0,-61,13)+'<path d="M-20 3V-34Q0 -58 20 -34V3Z" fill="#815b41" stroke="#f0c88b" stroke-width="3"/>');
 if(island)a+=group(475,427,1.2,shadow(115,24)+'<path d="M-82 4V-65H82V4Z" fill="#efbd75" stroke="#ad7a49" stroke-width="3"/><path d="M-107 -60Q0 -157 107 -60Q0 -36 -107 -60Z" fill="#d5a047" stroke="#fce6a6" stroke-width="4"/><path d="M-15 4V-40Q0 -58 15 -40V4Z" fill="#926a43"/>'+windowShape(-48,-33,12)+windowShape(48,-33,12)+palm(105,10,.65));
 if(snow)a+=group(475,427,1.2,shadow(112,26)+'<path d="M-85 4V-71L0 -140 85 -71V4Z" fill="#987a65" stroke="#655e5b" stroke-width="3"/><path d="M-99 -71L0 -154 99 -71L82 -60 0 -133 -82 -60Z" fill="#f7fbff" stroke="#c5dae4" stroke-width="4"/><path d="M-20 4V-42Q0 -66 20 -42V4Z" fill="#6e635c"/>'+windowShape(-50,-34,12)+windowShape(50,-34,12)+windowShape(0,-97,12));
 a+=group(475,471,1,'<rect x="-100" y="-12" width="200" height="27" rx="8" fill="#72563e" stroke="#d9c5a2" stroke-width="2"/><text text-anchor="middle" y="6" fill="#fff4cf" font-size="14" font-weight="bold">'+(forest?'MUSHROOM HALL':island?'CORAL HARBOR':'SNOWLIGHT LODGE')+'</text>');
 for(const [x,y,k] of [[65,530,.8],[300,690,.8],[610,665,.8],[915,690,.9]])a+=forest?mushroom(x,y,k):island?group(x,y,k,'<path d="M-18 0Q-26 -24 0 -25Q26 -24 18 0Z" fill="#f49d83" stroke="#fff1c6" stroke-width="2"/><path d="M-12 -2L0 -21 12 -2" fill="none" stroke="#fff0cb" stroke-width="2"/>'):pine(x,y,k*.65);
 a+='<g id="village-buildings"></g><g id="village-combo-effects"></g><g id="village-residents"></g><g class="sb-night-shade" pointer-events="none"><rect width="960" height="720" fill="#152d69" opacity=".29"/></g><g class="is-night-only" pointer-events="none">'+[[-105,-60],[105,-60]].map(p=>'<circle cx="'+(475+p[0])+'" cy="'+(427+p[1])+'" r="65" fill="url(#sb-light)" opacity=".65"/>').join('')+'</g>';
 svg.innerHTML=a;
}
function building(id,lv){
 let a=shadow(49,13),s=lv===1?1:lv===2?1.10:1.19;
 if(id==='flower'){
  a+='<ellipse rx="48" ry="19" fill="#759f4a" stroke="#d8eda0" stroke-width="3"/>'+flowerbed(0,-4,1,lv===1?12:lv===2?19:28);
  if(lv>=2)a+=mushroom(-37,4,.35)+mushroom(37,4,.39);
 }else if(id==='mushroom'){
  a+=mushroom(0,0,1.65)+windowShape(0,-24,8);
  if(lv>=2)a+=mushroom(-35,1,.75)+flowerbed(28,2,.45,8);
 }else if(id==='lantern'){
  a+=lantern(-12,0,1.4);
  if(lv>=2)a+=lantern(20,3,1.1);
 }else if(id==='fountain'){
  a+='<ellipse rx="51" ry="18" fill="url(#sb-stone)" stroke="#a89f86" stroke-width="2"/><ellipse rx="43" ry="13" cy="-3" fill="url(#sb-river)" stroke="#d2f2ed" stroke-width="2"/><path d="M-6 -4L-4 -47H4L6 -4Z" fill="#e9dec3" stroke="#a6a18f" stroke-width="1.5"/><ellipse cy="-46" rx="22" ry="7" fill="#e3dfce" stroke="#b1b6ad" stroke-width="2"/><path class="sb-fountain" d="M0 -48Q-38 -75 -38 -7M0 -48Q38 -75 38 -7" fill="none" stroke="#e9ffff" stroke-width="3.5" stroke-linecap="round"/>';
  if(lv>=2)a+='<path d="M0 -52Q-51 -98 -47 -14M0 -52Q51 -98 47 -14" fill="none" stroke="#c7fbff" stroke-width="2.7"/>';
 }else if(id==='butterfly'){
  a+=canopy(0,0,.70)+flowerbed(0,0,.65,10);
  for(let i=0;i<(lv>=2?4:2);i++)a+='<g class="sb-butterfly" transform="translate('+(-37+i*24)+' '+(-83+(i%2)*15)+')"><path d="M0 0Q-15 -15 -16 -3Q-17 10 0 3Q16 -15 17 -3Q15 10 0 3Z" fill="'+(i%2?'#ffcc87':'#ef9fc5')+'" stroke="#fff5ce" stroke-width="1.3"/><ellipse ry="5" rx="1.5" fill="#795145"/></g>';
 }else if(id==='grove'){
  a+=mushroom(-25,0,1.35)+mushroom(20,2,1.1)+mushroom(0,-5,1.65)+'<circle cx="0" cy="-62" r="48" fill="url(#sb-light)" opacity=".7"/>';
 }else if(id==='dock'){
  a+='<ellipse rx="49" ry="20" fill="#60bfc8" stroke="#f7e9b3" stroke-width="4"/><path d="M-45 4L-45 -20 25 -20 25 4Z" fill="url(#sb-wood)" stroke="#a67b4b" stroke-width="2"/><path d="M-25 -20V-48L9 -48 22 -20Z" fill="#ffe0a2" stroke="#b28a5c" stroke-width="2"/><path d="M22 -48V-20L48 -24Z" fill="#ef9a7b"/>';
 }else if(id==='ice'){
  a+='<path d="M-35 0L-29 -57 0 -111 29 -57 35 0Z" fill="#a2dbe9" stroke="#f4ffff" stroke-width="3"/><path d="M0 -111V0M-29 -57L29 -57" stroke="#e7fdff" stroke-width="2"/>'+windowShape(0,-45,10)+'<circle cy="-98" r="20" fill="url(#sb-light)"/>';
 }else if(id==='castle'){
  a+='<path d="M-38 0V-62H38V0Z" fill="url(#sb-cream)" stroke="#b48a61" stroke-width="2.5"/><path d="M-51 0V-83H-24V0M24 0V-83H51V0" fill="url(#sb-stone)" stroke="#ad9f89" stroke-width="2.5"/><path d="M-55 -83L-38 -111L-20 -83ZM20 -83L38 -111L55 -83ZM-22 -61L0 -89L22 -61Z" fill="url(#sb-roof)" stroke="#ab6351" stroke-width="2.5"/><path d="M-12 0V-24Q0 -45 12 -24V0Z" fill="#9a6943"/>'+windowShape(-38,-54,6)+windowShape(38,-54,6)+windowShape(0,-47,7);
  if(lv>=2)a+='<path d="M0 -90V-114" stroke="#986c42" stroke-width="3"/><path d="M0 -114L25 -108L0 -101Z" fill="#ffd97d"/>';
 }
 if(lv===3)a+='<g class="sb-build-spark"><path d="M-42 -86l4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" fill="#fff6ad"/><path d="M42 -70l3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" fill="#fff6ad"/></g>';
 return '<g transform="scale('+s+')" filter="url(#sb-shadow)">'+a+'</g>';
}
const VISIT_NAMES=Object.freeze({flower:'Flower Garden',mushroom:'Mushroom House',lantern:'Firefly Lantern',fountain:'Rainbow Fountain',butterfly:'Butterfly Tree',castle:'Royal Ant Palace',grove:'Glow Mushroom Grove',dock:'Shell Harbor',ice:'Crystal Observatory'});
function plotNode(p,st,selected,readOnly=false){
 const id=st.placements[p.id],lv=Number(st.upgrades[p.id])||1,chosen=selected===p.id;
 const item=id&&Object.hasOwn(VISIT_NAMES,id)?{name:VISIT_NAMES[id]}:null,name=item?item.name:'Build here';
 if(readOnly){if(!item)return '';return group(p.x,p.y,1,building(id,Math.max(1,Math.min(3,lv)))+'<text class="plot-name" y="34">'+name+'</text>'+(lv>1?'<text class="plot-level" y="50">'+('★'.repeat(Math.max(1,Math.min(3,lv))))+'</text>':''));}
 const ring='<ellipse cy="3" rx="52" ry="18" fill="#a7d969" opacity=".5" stroke="#d6ec91" stroke-width="1.4"/><ellipse class="sb-plot-halo" cy="3" rx="49" ry="16" stroke="#fff0a5" stroke-width="'+(chosen?8:4)+'" fill="none" filter="url(#sb-glow)" opacity="'+(chosen?1:.68)+'"/><ellipse cy="3" rx="49" ry="16" stroke="#fff8c5" stroke-width="'+(chosen?3:1.8)+'" fill="none" opacity=".94"/>';
 const sign='<g filter="url(#sb-shadow)"><path d="M0 4V-40" stroke="#9c693f" stroke-width="6" stroke-linecap="round"/><rect x="-23" y="-47" width="46" height="25" rx="6" fill="url(#sb-wood)" stroke="#a06c40" stroke-width="2"/><path d="M-18 -41H18M-18 -27H18" stroke="#ffe0a7" stroke-width="1.5" opacity=".73"/><path d="M-8 -35L-1 -42L5 -36L1 -32L8 -25L4 -23L-3 -30L-7 -27L-13 -33Z" fill="#fff1c4" stroke="#a27850" stroke-width=".65"/></g>';
 return group(p.x,p.y,1,'<g class="plot-interactive'+(chosen?' selected':'')+'" data-plot="'+p.id+'" tabindex="0" role="button" aria-label="'+name+', plot '+(p.id+1)+'">'+
 '<ellipse cy="-3" rx="59" ry="29" fill="transparent" pointer-events="all"/>'+ring+
 (item?building(id,lv)+'<text class="plot-name" y="34">'+name+'</text>'+(lv>1?'<text class="plot-level" y="50">'+('★'.repeat(lv))+'</text>':''):sign)+
 '</g>');
}
function render(st,selected,options={}){
 const next=st.world?.active||'garden';if(next!==region){generation++;configureRegion(next);scene();residents()}
 const b=svg.querySelector('#village-buildings');
 if(b)b.innerHTML=plots.map(p=>{seed=73191+Math.imul(p.id+1,913);return plotNode(p,st,selected,!!options.readOnly)}).join('');
 const fx=svg.querySelector('#village-combo-effects');
 if(fx&&options.readOnly)fx.innerHTML='';
 if(fx&&!options.readOnly&&window.AntVillage){
  fx.innerHTML=window.AntVillage.discoveries().active.map((c,i)=>'<g transform="translate('+(333+i*130)+' '+(359+i*12)+')" class="sb-theme"><circle r="20" fill="url(#sb-light)"/><text text-anchor="middle" y="6" font-size="20">'+c.symbol+'</text></g>').join('');
 }
}
function setNight(on){document.getElementById('world-panel').classList.toggle('night',!!on);return !!on;}
function onSelect(fn){
 if(svg.dataset.readonly==='true')return;
 svg.addEventListener('click',e=>{const p=e.target.closest('[data-plot]');if(p)fn(Number(p.getAttribute('data-plot')));});
 svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const p=e.target.closest('[data-plot]');if(p){e.preventDefault();fn(Number(p.getAttribute('data-plot')));}}});
}
function antMarkup(job){
 let legs='';
 // Each of the six leg groups has its own joint and changes angle per frame.
 for(let side of [-1,1])for(let i=0;i<3;i++){
  legs+='<g transform="translate('+(-5+i*4)+' '+(side*3)+')"><g class="sb-ant-leg" data-leg="'+(side===-1?i:i+3)+'"><path d="M0 0L'+(i-1)*2+' '+(side*7)+'L'+((i-1)*5-2)+' '+(side*12)+'" stroke="#66432e" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></g>';
 }
 let cargo=job===0?'<g transform="translate(-15 -9) rotate(-30)"><path d="M-2 5Q-17 -9 1 -22Q12 -8 -2 5Z" fill="url(#sb-leaf2)" stroke="#4e873d" stroke-width="1.1"/><path d="M-2 5L1 -18" stroke="#e4eda8" stroke-width="1.2" fill="none"/></g>':job===1?'<g transform="translate(-13 -10)"><ellipse rx="8" ry="6" fill="#f4be66" stroke="#ad7944" stroke-width="1.3"/><path d="M-6 -1H6M-5 2H5" stroke="#fce2a3" stroke-width="1"/></g>':'<g transform="translate(-13 -10)"><rect x="-7" y="-6" width="14" height="11" rx="2" fill="url(#sb-wood)" stroke="#9b6039" stroke-width="1.3"/><path d="M-5 -2H5M-4 2H4" stroke="#ffe4ab" stroke-width="1.1"/></g>';
 return '<g class="sb-ant-shadow"><ellipse rx="15" ry="5" cy="4" fill="#31562c" opacity=".25"/></g><g class="sb-ant-heading"><g class="sb-ant-body">'+legs+
 '<ellipse cx="-11" cy="0" rx="10" ry="7.8" fill="url(#sb-ant)" stroke="#5f3a2a" stroke-width="1.4"/><path d="M-16 -6Q-11 0 -15 6M-9 -7Q-4 0 -8 7" stroke="#c48b5b" stroke-width="2" opacity=".8" fill="none"/>'+
 '<ellipse cx="1" cy="0" rx="5.4" ry="5.9" fill="#936044" stroke="#68412e" stroke-width="1.2"/><ellipse cx="10" cy="-2" rx="7.5" ry="7.4" fill="url(#sb-ant)" stroke="#68412e" stroke-width="1.3"/><ellipse cx="8" cy="-5" rx="3.7" ry="2" fill="#e0ae7e" opacity=".66"/>'+
 cargo+'<g class="sb-ant-antennae"><path d="M12 -7Q15 -16 20 -16M15 -5Q23 -12 26 -8" stroke="#68412e" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="20" cy="-16" r="1.5" fill="#9f6d4b"/><circle cx="26" cy="-8" r="1.5" fill="#9f6d4b"/></g>'+
 '<ellipse cx="14" cy="-4" rx="3.4" ry="3.8" fill="#fff8dc"/><circle cx="15" cy="-3.7" r="1.8" fill="#3c2f29"/><circle cx="15.5" cy="-4.6" r=".6" fill="#fff"/><path d="M13 3Q16 5 18 2" stroke="#52352a" stroke-width="1" fill="none"/></g></g>';
}
let guestCount=0;
function setGuests(count){const next=Math.max(0,Math.min(3,Math.trunc(Number(count)||0)));if(next===guestCount)return;guestCount=next;generation++;const layer=svg.querySelector('#village-residents');if(layer){layer.replaceChildren();residents()}}
function residents(){
 const NS='http://www.w3.org/2000/svg',layer=svg.querySelector('#village-residents');
 const motion=[];
 for(let i=0;i<5;i++){
  const route=document.createElementNS(NS,'path');route.setAttribute('d',loops[i%loops.length]);route.setAttribute('fill','none');route.setAttribute('stroke','none');layer.appendChild(route);
  const el=document.createElementNS(NS,'g');el.setAttribute('class','resident village-ant');el.setAttribute('pointer-events','none');el.innerHTML=antMarkup(i%3)+(i>=5?'<g transform="translate(0 -24)"><circle r="9" fill="#fff3ce" stroke="#b89b63"/><text text-anchor="middle" y="3" font-size="10" fill="#a05f4a">♥</text></g>':'');layer.appendChild(el);
  const len=route.getTotalLength(),phase=(i*.271)%1;
  motion.push({route,len,el,heading:el.querySelector('.sb-ant-heading'),body:el.querySelector('.sb-ant-body'),legs:[...el.querySelectorAll('.sb-ant-leg')],antennae:el.querySelector('.sb-ant-antennae'),distance:len*phase,speed:23+i*1.7,scale:0.84+(i%3)*.035});
 }
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let last=0;const run=generation;
 function step(now){
  if(run!==generation)return;
  if(svg.dataset.readonly==='true'&&svg.closest('[hidden]')){last=0;if(!reduced)requestAnimationFrame(step);return;}
  const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
  for(const m of motion){
   if(!reduced)m.distance=(m.distance+dt*m.speed)%m.len;
   const p=m.route.getPointAtLength(m.distance),q=m.route.getPointAtLength((m.distance+1.5)%m.len);
   const angle=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI;
   m.el.setAttribute('transform','translate('+n(p.x)+' '+n(p.y)+') scale('+m.scale+')');
   m.heading.setAttribute('transform','rotate('+n(angle)+')');
   const gait=m.distance/10*2*Math.PI;
   m.body.setAttribute('transform','translate(0 '+n(reduced?0:Math.sin(gait*2)*.75)+')');
   m.legs.forEach((leg,j)=>leg.setAttribute('transform','rotate('+n(reduced?0:Math.sin(gait+(j%2)*Math.PI)*(j<3?21:-21))+')'));
   m.antennae.setAttribute('transform','rotate('+n(reduced?0:Math.sin(gait*.45)*5)+' 12 -6)');
  }
  if(!reduced)requestAnimationFrame(step);
 }
 requestAnimationFrame(step);
}
scene();residents();
window.AntVillageScene=Object.freeze({render,setNight,onSelect,setGuests,version:'storybook-v1'});
})();
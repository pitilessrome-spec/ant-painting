/* ANT CANVAS · Storybook Village
 * Rendered scene and residents only. The saved village economy is unchanged.
 * Painted residents use surveyed walkable corridors, never arbitrary closure.
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
 forest:{points:[[170,238],[365,180],[690,195],[790,345],[195,459],[385,416],[610,594],[805,590]],routes:['M128 265Q235 306 344 249Q425 206 510 273Q613 316 710 241Q795 214 834 280Q864 341 780 370Q684 399 596 348Q485 292 408 343Q331 394 230 359Q126 332 128 265Z','M144 510Q254 558 390 476Q476 417 566 484Q625 538 775 523Q866 523 870 600Q859 666 753 657Q620 681 542 625Q465 571 373 597Q221 638 145 574Q123 545 144 510Z'],spurs:['M344 249Q365 218 365 180','M710 241L690 195','M230 359Q186 410 195 459','M390 476L385 416','M566 484Q578 550 610 594','M775 523L805 590','M408 343Q443 385 476 417']},
 island:{points:[[150,259],[335,264],[665,206],[817,321],[143,524],[325,604],[638,530],[810,605]],routes:['M99 279Q150 180 288 210Q370 235 389 299Q357 355 230 350Q103 350 99 279Z','M594 248Q663 170 772 234Q865 270 863 344Q801 400 689 345Q600 316 594 248Z','M86 542Q141 454 255 499Q354 529 365 605Q290 662 158 631Q83 607 86 542Z','M577 550Q660 463 771 520Q870 561 862 620Q782 680 657 648Q590 629 577 550Z'],spurs:['M389 299Q482 327 594 248','M230 350Q206 416 185 488','M689 345Q720 424 700 491','M365 605Q476 570 577 550']},
 snow:{points:[[230,210],[418,210],[600,305],[786,335],[141,435],[333,505],[580,615],[800,590]],routes:['M175 245Q260 170 395 253Q489 319 590 348Q716 395 835 373Q890 401 835 430Q729 464 589 420Q480 382 382 325Q260 260 175 285Q136 270 175 245Z','M92 479Q170 411 274 470Q402 547 511 537Q656 510 833 546Q885 574 844 640Q775 684 645 660Q475 616 330 622Q196 620 106 565Q67 537 92 479Z'],spurs:['M260 210L230 210','M395 253L418 210','M590 348L600 305','M835 373L786 335','M274 470L333 505','M511 537L580 615','M833 546L800 590','M382 325Q324 410 274 470']}
};
function configureRegion(id){
 region=Object.hasOwn(layouts,id)?id:'garden';
 if(region==='garden'){plots=gardenPlots;roads=gardenRoads;loops=[roads[0]];return}
 const l=layouts[region];plots=l.points.map((p,i)=>({id:[0,1,2,3,5,6,7,8][i],x:p[0],y:p[1]}));loops=l.routes;roads=[...l.routes,...l.spurs];
}

const PAINTED={"garden":{"points":[[11.7,23.5],[54,18.4],[94.5,23.6],[12.2,40.6],[89.5,43],[6.4,67.9],[58.6,85.8],[86.3,88.5]],"hot":[[67,58,"Plant"],[91,70,"Water"]],"routes":[[[33,30],[28,44],[35,51],[44,55],[57,48],[70,49],[58,57],[43,55],[31,49],[28,44]]]},"forest":{"points":[[93.8,11.6],[11.8,24.1],[5.9,50.7],[81.8,29.1],[95.1,49.7],[8,85],[58.5,74.2],[93.4,86.2]],"hot":[[14,71,"Treasure"],[18,46,"Grow glowplants"]],"routes":[[[52,38],[58,45],[62,53],[56,61],[43,65],[34,68],[40,60],[51,56],[58,45]],[[62,16],[72,18],[81,15],[72,18]]]},"island":{"points":[[20.2,20.9],[88,9],[92,22.4],[6.6,44.6],[94.5,36.7],[7.6,68.8],[93.4,63],[77.8,74.6]],"hot":[[37,73,"Sail"],[81,67,"Shells"]],"routes":[[[40,72],[48,65],[60,59],[71,52],[65,44],[55,41],[50,46],[60,55],[50,66]]]},"snow":{"points":[[61,91.8],[91.2,72.4],[37,86.4],[11.2,42],[27.2,35.8],[85.4,46.8],[43.8,13.3],[92.8,17.9]],"hot":[[58,45,"Sculpt"],[77,65,"Explore"],[76,16,"Aurora"],[26.3,67.8,"Ice lake"]],"routes":[[[15,44],[20,49],[25,54],[22,59],[31,64],[41,61],[45,54],[52,48],[45,54],[41,61],[31,64],[22,59],[25,54],[20,49]]]}},artReady={},artPending={};
// Walkable corridors marked on the 960x720 painted artwork; no edges between corridors.
const WALKABLE={"garden":[[[306,205],[320,224],[330,239],[317,251],[303,263]],[[369,378],[387,368],[410,361],[431,360],[451,365],[469,371]],[[502,350],[523,347],[544,339],[563,327]],[[423,621],[445,626],[468,640],[488,655],[515,666],[540,675]],[[20,550],[40,539],[63,531],[84,523]]],"forest":[[[544,99],[566,111],[589,118],[611,119],[634,109],[653,118],[680,124],[705,120],[730,111],[749,102]],[[248,305],[269,290],[290,282],[312,270],[333,250],[350,245]],[[510,282],[534,290],[554,303],[564,316],[555,329],[545,345],[549,360],[569,374],[594,389],[614,404],[630,415]],[[304,457],[319,451],[341,448],[357,450]],[[635,531],[653,524],[677,523],[696,526],[711,531]]],"island":[[[580,295],[608,286],[632,279],[655,272],[678,264],[700,264],[721,252],[744,246]],[[591,347],[610,362],[632,377],[650,389],[666,400],[689,417]],[[177,536],[204,542],[230,545],[258,548],[286,544],[309,543]],[[664,494],[676,508],[689,522],[707,538],[729,553],[754,570]],[[228,304],[250,312],[275,325],[298,334]]],"snow":[[[127,296],[145,301],[166,309],[186,321],[207,335],[222,345]],[[355,403],[374,395],[394,391],[415,393],[434,403],[447,417]],[[435,374],[446,361],[459,348],[472,336],[482,324]],[[709,245],[720,235],[728,225],[735,216]],[[640,563],[665,563],[685,555],[706,546],[728,537],[749,528],[769,521]]]};
function walkingRoutes(id){return WALKABLE[id].map(points=>points.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' '))}
let lastRender=null;
function artPath(id){return 'assets/maps/v36/'+id+'.webp'}
function requestArt(id){if(artReady[id]||artPending[id]||typeof Image==='undefined')return;artPending[id]=true;const im=new Image();im.onload=()=>{artReady[id]=true;if(region===id&&lastRender){generation++;configureRegion(id);scene();residents();render(...lastRender)}};im.onerror=()=>{};im.src=artPath(id)}
function paintedScene(){
 const a=PAINTED[region],ids=[0,1,2,3,5,6,7,8];
 plots=a.points.map((p,i)=>({id:ids[i],x:p[0]*9.6,y:p[1]*7.2,ordinal:i+1}));
 loops=walkingRoutes(region);roads=loops;
 let sparks='';for(let i=0;i<15;i++){const x=50+(i*117)%860,y=65+(i*83)%560;sparks+='<circle cx="'+x+'" cy="'+y+'" r="12" fill="url(#sb-light)" opacity=".7"/>'}
 let hot='';if(svg.dataset.readonly!=='true')for(const [x,y,name] of a.hot){const w=Math.max(80,name.length*8+22);hot+=group(x*9.6,y*7.2,1,'<g class="painted-activity" data-activity="1" role="button" tabindex="0" aria-label="'+name+'"><rect x="'+(-w/2)+'" y="-15" width="'+w+'" height="30" rx="15" fill="#fff5d9" stroke="#bb9257" stroke-width="2"/><text text-anchor="middle" y="5" font-size="13" font-weight="bold" fill="#6d4c2a">✦ '+name+'</text></g>')}
 svg.dataset.painted='true';
 svg.innerHTML=defs+'<image href="'+artPath(region)+'" width="960" height="720" preserveAspectRatio="none"/>'+(region==='snow'?'':'<g class="sb-night-shade" pointer-events="none"><rect width="960" height="720" fill="#182e63" opacity=".33"/></g>')+'<g class="is-night-only" pointer-events="none">'+sparks+'</g><g id="village-residents"></g><g id="village-buildings"></g><g id="village-combo-effects"></g>'+hot;
}
function paintedPlot(p,st,selected,readOnly){
 const id=st.placements[p.id],lv=Math.max(1,Math.min(3,Number(st.upgrades[p.id])||1)),name=VISIT_NAMES[id]||'Build site '+p.ordinal;
 const marks='<rect x="-43" y="-28" width="86" height="55" rx="12" fill="'+(id?'#dbe9b2':'#916130')+'" stroke="'+(selected===p.id?'#fff':'#fff2c2')+'" stroke-width="'+(selected===p.id?5:2)+'"/><text text-anchor="middle" y="17" font-size="13" font-weight="bold" fill="'+(id?'#4b6736':'#fff6d6')+'">'+(id?'Lv.'+lv:'Plot '+p.ordinal)+'</text>';
 const icons={flower:'🌼',mushroom:'🍄',lantern:'🏮',fountain:'⛲',butterfly:'🦋',castle:'🏰',grove:'✨',dock:'🐚',ice:'🔮'};
 const inner=marks+'<text text-anchor="middle" y="-1" font-size="26">'+(icons[id]||'🔨')+'</text>';
 const visual=id&&Object.hasOwn(VISIT_NAMES,id)?group(0,-29,.66,building(id,lv)):'';
 return group(p.x,p.y,1,readOnly?inner+visual:'<g class="plot-interactive" data-plot="'+p.id+'" tabindex="0" role="button" aria-label="'+name+'">'+inner+visual+'</g>');
}
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
 let petals='';for(let i=0;i<5;i++){const a=i*Math.PI*2/5;petals+='<ellipse cx="'+n(Math.sin(a)*4.7)+'" cy="'+n(-13+Math.cos(a)*4.7)+'" rx="4.1" ry="5.6" transform="rotate('+(-i*72)+' '+n(Math.sin(a)*4.7)+' '+n(-13+Math.cos(a)*4.7)+')" fill="'+c+'" stroke="#fff4cc" stroke-width=".55"/>';}
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
 seed=73191;svg.dataset.painted='false';requestArt(region);if(artReady[region]){paintedScene();return;}
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
// V3.5: three independent environments, with unique silhouettes and route networks.
const extraDefs='<defs><linearGradient id="m-forest" x2=".25" y2="1"><stop stop-color="#2e5550"/><stop offset=".42" stop-color="#728a60"/><stop offset="1" stop-color="#344e43"/></linearGradient><linearGradient id="m-bark" x2="1" y2=".2"><stop stop-color="#3d4437"/><stop offset=".45" stop-color="#886446"/><stop offset=".8" stop-color="#ae8056"/><stop offset="1" stop-color="#544b39"/></linearGradient><linearGradient id="m-water" x2=".35" y2="1"><stop stop-color="#b2eee0"/><stop offset=".45" stop-color="#42b9ba"/><stop offset="1" stop-color="#217f9c"/></linearGradient><linearGradient id="m-sand" x2=".3" y2="1"><stop stop-color="#fff5ce"/><stop offset="1" stop-color="#dfb87e"/></linearGradient><linearGradient id="m-snow" x2=".4" y2="1"><stop stop-color="#fffef9"/><stop offset=".55" stop-color="#e0edf2"/><stop offset="1" stop-color="#9db9cb"/></linearGradient><linearGradient id="m-cliff" x2=".2" y2="1"><stop stop-color="#a1adbe"/><stop offset="1" stop-color="#566d83"/></linearGradient><radialGradient id="m-mist"><stop stop-color="#fff3bd" stop-opacity=".8"/><stop offset="1" stop-color="#fff3bd" stop-opacity="0"/></radialGradient><filter id="m-depth" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#233b43" flood-opacity=".36"/></filter></defs>';
function plate(x,y,rx,ry,top,edge){return '<g filter="url(#m-depth)"><ellipse cx="'+x+'" cy="'+(y+16)+'" rx="'+rx+'" ry="'+ry+'" fill="'+edge+'"/><ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+top+'" stroke="#f6e7b8" stroke-opacity=".65" stroke-width="3"/></g>'}
function planks(d,w=25){return '<path d="'+d+'" stroke="#453b32" stroke-opacity=".6" stroke-width="'+(w+9)+'" fill="none" stroke-linecap="round"/><path d="'+d+'" stroke="#be9262" stroke-width="'+w+'" fill="none" stroke-linecap="round"/><path d="'+d+'" stroke="#7e5b43" stroke-width="'+(w-5)+'" stroke-dasharray="2 10" fill="none" opacity=".55"/><path d="'+d+'" stroke="#f5ca83" stroke-width="2" fill="none" opacity=".85"/>'}
function paths(color,edge,width){return roads.map((d,i)=>'<path d="'+d+'" stroke="'+edge+'" stroke-width="'+(i<loops.length?width+8:width-2)+'" stroke-linecap="round" fill="none"/><path d="'+d+'" stroke="'+color+'" stroke-width="'+(i<loops.length?width:width-8)+'" stroke-linecap="round" fill="none"/>').join('')}
function forestWorld(){
 let a='<rect width="960" height="720" fill="url(#m-forest)"/><ellipse cx="480" cy="98" rx="420" ry="230" fill="url(#m-mist)"/>';
 for(let i=0;i<16;i++){let x=-30+i*70,y=540+(i%3)*55,w=33+(i%4)*17;a+='<path d="M'+(x-w)+' 0Q'+(x+w)+' 160 '+(x-w*.35)+' '+y+'L'+(x+w)+' '+(y+35)+'Q'+(x+w*1.5)+' 250 '+(x+w)+' 0Z" fill="'+['#36584c','#466351','#56705a'][i%3]+'" opacity=".55"/>'}
 a+='<path d="M0 580Q210 510 371 574T700 551T960 577V720H0Z" fill="#344e42"/><path d="M0 632Q240 560 380 651T720 617T960 649V720H0Z" fill="#253e38"/>';
 a+='<path d="M416 0Q390 110 428 240Q462 350 435 495L395 654Q470 603 509 650L566 690Q501 522 541 383Q578 222 533 0Z" fill="url(#m-bark)" stroke="#514b38" stroke-width="5"/><path d="M450 0Q423 170 474 300T465 580M510 0Q546 174 502 324T516 597" stroke="#cf9d65" stroke-width="6" opacity=".44" fill="none"/><path d="M465 206Q260 162 84 235M522 248Q690 136 923 228M463 432Q266 362 36 486M514 511Q734 448 950 565" stroke="#554c38" stroke-width="45" fill="none" stroke-linecap="round"/>';
 for(const p of [[170,238,110,60],[365,180,98,50],[690,195,103,55],[790,345,110,55],[195,459,120,57],[385,416,104,54],[610,594,115,58],[805,590,118,56]])a+=plate(...p,'#aeaf72','#6e6648');
 for(const d of roads)a+=planks(d,loops.includes(d)?23:19);
 // The tree itself is the landmark, not a central cottage.
 a+=group(478,157,1.08,'<path d="M-53 1V-57Q0-115 53-57V1Z" fill="#d8ae76" stroke="#72533b" stroke-width="4"/><path d="M-65-51Q-46-103 0-109Q47-105 65-51Z" fill="#bd6f73" stroke="#6a4e42" stroke-width="4"/><path d="M-18 2V-25Q0-47 18-25V2Z" fill="#614b37"/>'+windowShape(-32,-38,9)+windowShape(32,-38,9)+'<rect x="-60" y="7" width="120" height="19" rx="7" fill="#664c37"/><text y="20" text-anchor="middle" font-size="11" fill="#fff1bc" font-weight="bold">TREETOP POST</text>');
 for(const p of [[35,175,1.05],[890,180,1.1],[55,444,.85],[912,465,1.15],[50,697,1.12],[905,712,1.12]])a+=canopy(...p);
 for(let i=0;i<35;i++){const x=20+rnd()*920,y=100+rnd()*590;if(plots.some(p=>Math.hypot(x-p.x,y-p.y)<90))continue;a+=mushroom(n(x),n(y),n(.2+rnd()*.4));a+='<circle cx="'+n(x+9)+'" cy="'+n(y-22)+'" r="2.8" fill="#ffefa0" opacity=".85"/>'}
 a+='<g class="is-night-only">'+Array.from({length:40},(_,i)=>'<circle cx="'+(24+i*83%914)+'" cy="'+(70+i*61%610)+'" r="9" fill="url(#sb-light)"/>').join('')+'</g>';
 return a;
}
function islandWorld(){
 let a='<rect width="960" height="720" fill="url(#m-water)"/>';
 // A lagoon and four separate islands, connected by actual wooden causeways.
 for(let i=0;i<32;i++){const x=(i*83+43)%960,y=35+(i*53)%650;a+='<path d="M'+x+' '+y+'q20 -7 40 0t40 0" fill="none" stroke="#d8ffff" stroke-opacity=".38" stroke-width="2.5" stroke-linecap="round" class="sb-water-glint"/>'}
 for(const [x,y,rx,ry] of [[242,263,210,126],[735,270,200,130],[224,558,207,126],[728,585,208,120]]){a+='<ellipse cx="'+x+'" cy="'+(y+8)+'" rx="'+(rx+17)+'" ry="'+(ry+17)+'" fill="#c4f1e4" opacity=".6"/>'+plate(x,y,rx,ry,'url(#m-sand)','#bc9c68');a+='<ellipse cx="'+x+'" cy="'+(y-3)+'" rx="'+(rx-25)+'" ry="'+(ry-28)+'" fill="#a7cb83" opacity=".8"/>'}
 for(const d of layouts.island.spurs)a+=planks(d,23);
 for(const d of loops)a+='<path d="'+d+'" stroke="#ceb282" stroke-width="29" fill="none" stroke-linecap="round"/><path d="'+d+'" stroke="#f7e2ad" stroke-width="22" fill="none" stroke-linecap="round"/>';
 // lighthouse on its own rock in the open lagoon
 a+=plate(488,432,72,39,'#e6d6ab','#899c93')+group(488,427,1,'<path d="M-27 0L-17-100H17L27 0Z" fill="#fff1d2" stroke="#ad9d83" stroke-width="3"/><path d="M-23-38H23L19-63H-19Z" fill="#d97768"/><rect x="-25" y="-116" width="50" height="26" rx="4" fill="#ffe9a0" stroke="#7c8d83" stroke-width="4"/><path d="M-32-116L0-143 32-116Z" fill="#bd6c60" stroke="#9a5d50" stroke-width="3"/><path d="M-8 0V-22Q0-34 8-22V0Z" fill="#9d8664"/><g class="is-night-only"><path d="M0-103L-248-150V-52Z" fill="#fff0a5" opacity=".26"/><circle cy="-103" r="54" fill="url(#sb-light)"/></g>');
 for(const p of [[65,285,.9],[389,223,.66],[575,275,.85],[896,302,1],[43,559,.8],[376,548,.74],[549,622,.85],[909,628,.9]])a+=palm(...p);
 for(let i=0;i<28;i++){const [cx,cy]=[[242,263],[735,270],[224,558],[728,585]][i%4];const t=rnd()*6.283,rx=130+rnd()*38,x=cx+Math.cos(t)*rx,y=cy+Math.sin(t)*(78+rnd()*16);if(plots.some(p=>Math.hypot(x-p.x,y-p.y)<64))continue;a+=group(n(x),n(y),.65,'<path d="M-12 0Q-17-18-10-22Q-2-18 0-7Q4-28 10-26Q19-21 10-6L18-17Q25-10 12 0Z" fill="'+['#f08c8d','#e5b779','#d597b6'][i%3]+'" stroke="#ffe5c3" stroke-width="1.3"/>')}
 for(const [x,y,k] of [[475,146,.8],[70,420,.6],[883,447,.8]])a+=group(x,y,k,'<ellipse rx="35" ry="9" fill="#267a92" opacity=".32"/><path d="M-32-4Q0 16 32-4L22 6H-20Z" fill="#b77951" stroke="#8b654e" stroke-width="2"/><path d="M-2-7V-57L27-8Z" fill="#fff3c8" stroke="#d6ad76" stroke-width="2"/><path d="M-6-9V-46L-25-9Z" fill="#efaa91"/>');
 return a;
}
function snowWorld(){
 let a='<rect width="960" height="720" fill="#c1dce8"/><circle cx="791" cy="75" r="42" fill="#fff4da"/>';
 a+='<path d="M0 259L110 76 218 244 349 24 505 256 659 51 827 243 950 94 960 720H0Z" fill="#8da7bc"/><path d="M78 133L110 76 146 136 124 127 110 148 95 126ZM295 112L349 24 402 115 370 98 349 123 327 94ZM612 126L659 51 706 130 680 115 659 136 638 112Z" fill="#f6fbff"/>';
 // Mountain terraces descend diagonally, with cliffs and a frozen lake instead of a central lawn.
 a+='<g filter="url(#m-depth)"><path d="M0 155Q250 100 430 188L560 291Q732 224 960 320V397Q713 355 547 390L406 276Q200 247 0 297Z" fill="url(#m-cliff)"/><path d="M0 155Q250 100 430 188L560 291Q732 224 960 320L960 359Q713 309 547 345L406 232Q200 203 0 254Z" fill="url(#m-snow)" stroke="#faffff" stroke-width="5"/><path d="M0 380Q180 345 340 438Q460 504 570 470T960 476V720H0Z" fill="url(#m-cliff)"/><path d="M0 366Q180 330 340 423Q460 489 570 455T960 461V674Q800 712 620 670T300 690T0 660Z" fill="url(#m-snow)" stroke="#faffff" stroke-width="5"/></g>';
 a+='<path d="M0 305Q102 267 170 298L218 333Q126 377 0 381Z" fill="#7bbdce" stroke="#e4f8fc" stroke-width="7"/><path d="M414 352L458 406 437 447 472 489" fill="none" stroke="#bcecf6" stroke-width="29" stroke-linecap="round"/><path d="M414 352L458 406 437 447 472 489" fill="none" stroke="#f4ffff" stroke-width="4" stroke-dasharray="8 10"/>';
 a+='<ellipse cx="466" cy="603" rx="93" ry="48" fill="#88cad9" stroke="#f6fcfe" stroke-width="10"/><path d="M401 596l40 -14 25 15 29 -8 25 15M447 582l9 -12M495 589l19 -13" stroke="#d6f3fc" stroke-width="2.6" fill="none"/>';
 a+=paths('#edf0e5','#a8b7bf',21);
 for(const p of [[44,240,.75],[130,208,.63],[495,233,.63],[903,363,.85],[54,477,.78],[248,389,.65],[898,528,.7],[47,695,1.0],[930,718,1]])a+=pine(...p);
 a+=group(490,193,.9,'<path d="M-57 0V-57L0-112 57-57V0Z" fill="#9e826c" stroke="#6d6a64" stroke-width="3"/><path d="M-68-57L0-124 68-57L56-47 0-108-56-47Z" fill="#fffafe" stroke="#bbcfdc" stroke-width="4"/><path d="M-13 0V-28Q0-43 13-28V0Z" fill="#765e50"/>'+windowShape(-32,-37,9)+windowShape(32,-37,9)+'<rect x="30" y="-102" width="12" height="39" fill="#927c73"/><path class="sb-smoke" d="M36-111q-12-12 0-20t-2-23" fill="none" stroke="#fff" stroke-width="8" opacity=".55"/>');
 // Alpine railway cabin and cable route, an unmistakable alpine silhouette.
 a+='<path d="M65 126L882 272" stroke="#697b8b" stroke-width="3" fill="none"/><path d="M65 126V210M882 272V345" stroke="#748695" stroke-width="8"/>'+group(692,238,.86,'<path d="M0-18V-4" stroke="#667785" stroke-width="3"/><rect x="-29" y="-4" width="58" height="39" rx="10" fill="#c96e67" stroke="#775b60" stroke-width="3"/><rect x="-19" y="3" width="38" height="17" rx="4" fill="#ffe6b6" stroke="#b38d7f" stroke-width="2"/><path d="M0 3V20" stroke="#b38d7f" stroke-width="2"/>');
 for(let i=0;i<42;i++){let x=15+rnd()*930,y=270+rnd()*430;if(plots.some(p=>Math.hypot(x-p.x,y-p.y)<65))continue;a+=group(n(x),n(y),n(.3+rnd()*.5),'<ellipse rx="15" ry="5" fill="#bfd5e2"/><path d="M-8-1L-3-16 3-25 10-10 7 0Z" fill="#addae9" stroke="#f7feff" stroke-width="1.4"/>')}
 a+='<g class="is-night-only" opacity=".72"><path d="M0 65Q220-13 390 85T740 42T960 52" stroke="#a2efc8" stroke-width="25" fill="none"/><path d="M0 82Q220 6 390 103T740 58T960 69" stroke="#c9b8ee" stroke-width="11" fill="none"/></g>';
 return a;
}
function regionalScene(){
 const artwork=region==='forest'?forestWorld():region==='island'?islandWorld():snowWorld();
 svg.innerHTML=defs+extraDefs+artwork+'<g id="village-buildings"></g><g id="village-combo-effects"></g><g id="village-residents"></g><g class="sb-night-shade" pointer-events="none"><rect width="960" height="720" fill="#152d69" opacity=".29"/></g>';
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
 if(artReady[region])return paintedPlot(p,st,selected,readOnly);
 const id=st.placements[p.id],lv=Number(st.upgrades[p.id])||1,chosen=selected===p.id;
 const item=id&&Object.hasOwn(VISIT_NAMES,id)?{name:VISIT_NAMES[id]}:null,name=item?item.name:'Build here';
 if(readOnly){if(!item)return '';return group(p.x,p.y,1,building(id,Math.max(1,Math.min(3,lv)))+'<text class="plot-name" y="34">'+name+'</text>'+(lv>1?'<text class="plot-level" y="50">'+('★'.repeat(Math.max(1,Math.min(3,lv))))+'</text>':''));}
 const ring='<ellipse cy="3" rx="52" ry="18" fill="'+(region==='snow'?'#a5d4e3':region==='island'?'#f5d78b':region==='forest'?'#bda66e':'#a7d969')+'" opacity=".5" stroke="#d6ec91" stroke-width="1.4"/><ellipse class="sb-plot-halo" cy="3" rx="49" ry="16" stroke="#fff0a5" stroke-width="'+(chosen?8:4)+'" fill="none" filter="url(#sb-glow)" opacity="'+(chosen?1:.68)+'"/><ellipse cy="3" rx="49" ry="16" stroke="#fff8c5" stroke-width="'+(chosen?3:1.8)+'" fill="none" opacity=".94"/>';
 const sign='<g filter="url(#sb-shadow)"><path d="M0 4V-40" stroke="#9c693f" stroke-width="6" stroke-linecap="round"/><rect x="-23" y="-47" width="46" height="25" rx="6" fill="url(#sb-wood)" stroke="#a06c40" stroke-width="2"/><path d="M-18 -41H18M-18 -27H18" stroke="#ffe0a7" stroke-width="1.5" opacity=".73"/><path d="M-8 -35L-1 -42L5 -36L1 -32L8 -25L4 -23L-3 -30L-7 -27L-13 -33Z" fill="#fff1c4" stroke="#a27850" stroke-width=".65"/></g>';
 return group(p.x,p.y,1,'<g class="plot-interactive'+(chosen?' selected':'')+'" data-plot="'+p.id+'" tabindex="0" role="button" aria-label="'+name+', plot '+(p.id+1)+'">'+
 '<ellipse cy="-3" rx="59" ry="29" fill="transparent" pointer-events="all"/>'+ring+
 (item?building(id,lv)+'<text class="plot-name" y="34">'+name+'</text>'+(lv>1?'<text class="plot-level" y="50">'+('★'.repeat(lv))+'</text>':''):sign)+
 '</g>');
}
function render(st,selected,options={}){
 lastRender=[st,selected,options];
 const jobs=currentJobs().join(',');if(jobs!==jobSignature){jobSignature=jobs;generation++;const layer=svg.querySelector('#village-residents');if(layer){layer.replaceChildren();residents()}}
 const next=st.world?.active||'garden';if(next!==region){generation++;configureRegion(next);scene();residents()}
 const b=svg.querySelector('#village-buildings');
 if(b)b.innerHTML=plots.map(p=>{seed=73191+Math.imul(p.id+1,913);return plotNode(p,st,selected,!!options.readOnly)}).join('');
 const fx=svg.querySelector('#village-combo-effects');
 if(fx&&(options.readOnly||region!=='garden'||artReady[region]))fx.innerHTML='';
 if(fx&&!options.readOnly&&window.AntVillage&&region==='garden'&&!artReady[region]){
  fx.innerHTML=window.AntVillage.discoveries().active.map((c,i)=>'<g transform="translate('+(333+i*130)+' '+(359+i*12)+')" class="sb-theme"><circle r="20" fill="url(#sb-light)"/><text text-anchor="middle" y="6" font-size="20">'+c.symbol+'</text></g>').join('');
 }
}
function setNight(on){document.getElementById('world-panel').classList.toggle('night',!!on);return !!on;}
function onSelect(fn){
 if(svg.dataset.readonly==='true')return;
 svg.addEventListener('click',e=>{const p=e.target.closest('[data-plot]');if(p)fn(Number(p.getAttribute('data-plot')));else if(e.target.closest('[data-activity]'))document.getElementById('region-activities')?.scrollIntoView({behavior:'smooth',block:'start'});});
 svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const p=e.target.closest('[data-plot]');if(p){e.preventDefault();fn(Number(p.getAttribute('data-plot')));}else if(e.target.closest('[data-activity]')){e.preventDefault();document.getElementById('region-activities')?.scrollIntoView({behavior:'smooth',block:'start'})}}});
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
 '<g class="sb-ant-cargo">'+cargo+'</g><g class="sb-ant-antennae"><path d="M12 -7Q15 -16 20 -16M15 -5Q23 -12 26 -8" stroke="#68412e" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="20" cy="-16" r="1.5" fill="#9f6d4b"/><circle cx="26" cy="-8" r="1.5" fill="#9f6d4b"/></g>'+
 '<ellipse cx="14" cy="-4" rx="3.4" ry="3.8" fill="#fff8dc"/><circle cx="15" cy="-3.7" r="1.8" fill="#3c2f29"/><circle cx="15.5" cy="-4.6" r=".6" fill="#fff"/><path d="M13 3Q16 5 18 2" stroke="#52352a" stroke-width="1" fill="none"/></g></g>';
}
let guestCount=0,jobSignature='';
function currentJobs(){return lastRender?.[0]?.work?.roles||['wood','wood','petal','petal','builder']}
function setGuests(count){const next=Math.max(0,Math.min(3,Math.trunc(Number(count)||0)));if(next===guestCount)return;guestCount=next;generation++;const layer=svg.querySelector('#village-residents');if(layer){layer.replaceChildren();residents()}}
function residents(){
 const NS='http://www.w3.org/2000/svg',layer=svg.querySelector('#village-residents');
 const motion=[];
 if(!artReady[region])return; // no workers on an unverified fallback
 for(let i=0;i<5+guestCount;i++){
  const route=document.createElementNS(NS,'path');route.setAttribute('d',loops[i%loops.length]);route.setAttribute('fill','none');route.setAttribute('stroke','none');layer.appendChild(route);
  const el=document.createElementNS(NS,'g');el.setAttribute('class','resident village-ant');el.setAttribute('pointer-events','none');const job=currentJobs()[i]||'scout',jobIndex=({wood:2,petal:0,builder:1,scout:1})[job]??0;el.setAttribute('data-job',job);el.innerHTML=antMarkup(jobIndex)+(i>=5?'<g transform="translate(0 -24)"><circle r="9" fill="#fff3ce" stroke="#b89b63"/><text text-anchor="middle" y="3" font-size="10" fill="#a05f4a">♥</text></g>':'');layer.appendChild(el);
  const len=route.getTotalLength(),phase=(i*.271)%1;
  motion.push({route,len,el,heading:el.querySelector('.sb-ant-heading'),body:el.querySelector('.sb-ant-body'),legs:[...el.querySelectorAll('.sb-ant-leg')],antennae:el.querySelector('.sb-ant-antennae'),cargo:el.querySelector('.sb-ant-cargo'),distance:len*phase,dir:1,pause:0,speed:10+i*1.1,scale:0.36+(i%3)*.025});
 }
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let last=0;const run=generation;
 function step(now){
  if(run!==generation)return;
  if(svg.closest('[hidden]')){last=0;if(!reduced)requestAnimationFrame(step);return;}
  const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
  for(const m of motion){
   if(!reduced){if(m.pause>0){m.pause=Math.max(0,m.pause-dt)}else{m.distance+=m.dir*dt*m.speed;if(m.distance>=m.len||m.distance<=0){m.distance=Math.max(0,Math.min(m.len,m.distance));m.dir*=-1;m.pause=1.4;}}}
   const p=m.route.getPointAtLength(m.distance),q=m.route.getPointAtLength(Math.max(0,Math.min(m.len,m.distance+m.dir*1.5)));
   const angle=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI;
   m.el.setAttribute('transform','translate('+n(p.x)+' '+n(p.y)+') scale('+m.scale+')');
   m.heading.setAttribute('transform','rotate('+n(angle)+')');
   // Visual work represents the assigned colony job. Production is calculated by the saved elapsed-time ledger, not animation frames.
   m.cargo.setAttribute('opacity',m.dir<0&&m.el.dataset.job!=='scout'?'1':'0');
   const still=reduced||m.pause>0,gait=m.distance/6*2*Math.PI;
   m.body.setAttribute('transform','translate(0 '+n(still?0:Math.sin(gait*2)*.75)+')');
   m.legs.forEach((leg,j)=>leg.setAttribute('transform','rotate('+n(still?0:Math.sin(gait+(j%2)*Math.PI)*(j<3?21:-21))+')'));
   m.antennae.setAttribute('transform','rotate('+n(still?0:Math.sin(gait*.45)*5)+' 12 -6)');
  }
  if(!reduced)requestAnimationFrame(step);
 }
 requestAnimationFrame(step);
}
scene();residents();
window.AntVillageScene=Object.freeze({render,setNight,onSelect,setGuests,version:'world-v38-jobs'});
})();
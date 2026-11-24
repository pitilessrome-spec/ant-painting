/* ANT CANVAS village atmosphere — details drawn inside the actual playable world. */
(function(){
'use strict';
const svg=document.getElementById('village-world');
const anchor=svg&&svg.querySelector('#village-residents');
if(!anchor)return;
const NS='http://www.w3.org/2000/svg';
const ambient=document.createElementNS(NS,'g');
ambient.id='village-ambience';
ambient.setAttribute('pointer-events','none');
function flowers(x,y,s){
 let petals='';
 const colors=['#ffb0cc','#ffdd7b','#b6b3ef','#93e1da'];
 for(let i=0;i<7;i++){
   const a=i*Math.PI/4,px=Math.cos(a)*20,py=Math.sin(a)*7;
   petals+='<path d="M'+px+' 1v-13" stroke="#408d65" stroke-width="2"/><circle cx="'+px+'" cy="'+(py-13)+'" r="5" fill="'+colors[i%4]+'" stroke="#fff8c9" stroke-width="1.5"/>';
 }
 return '<g class="v-garden-flowers" transform="translate('+x+' '+y+') scale('+s+')"><ellipse cy="7" rx="40" ry="12" fill="#3f9667" opacity=".34"/>'+petals+'</g>';
}
function bush(x,y,s){
 return '<g class="v-bush" transform="translate('+x+' '+y+') scale('+s+')"><ellipse cy="4" rx="46" ry="13" fill="#367b5b" opacity=".22"/>'+
 '<ellipse cx="-21" cy="-9" rx="21" ry="18" fill="#4fa87d" stroke="#378a72" stroke-width="2"/>'+
 '<ellipse cx="5" cy="-22" rx="26" ry="22" fill="#85d4a1" stroke="#4bad83" stroke-width="2"/>'+
 '<ellipse cx="27" cy="-7" rx="21" ry="17" fill="#66c48f" stroke="#459b78" stroke-width="2"/>'+
 '<path d="M-12 -29Q6 -45 20 -29" stroke="#bff6c1" stroke-width="6" fill="none" opacity=".8" stroke-linecap="round"/></g>';
}
function lantern(x,y,s){
 return '<g transform="translate('+x+' '+y+') scale('+s+')"><ellipse cy="4" rx="17" ry="6" fill="#377d60" opacity=".3"/>'+
 '<path d="M0 0V-49" stroke="#956647" stroke-width="6" stroke-linecap="round"/>'+
 '<path d="M-18 -48L0 -64L18 -48L13 -25H-13Z" fill="#c57988" stroke="#985e70" stroke-width="3"/>'+
 '<path d="M-12 -47H12V-31H-12Z" fill="#ffdf91" stroke="#fff7c9" stroke-width="2"/>'+
 '<circle class="v-lantern-glow is-night-only" cx="0" cy="-40" r="35" fill="#ffe69f" opacity=".22"/></g>';
}
function fence(x,y,s){
 const posts=[-61,-36,-11,14,39,64].map(function(dx){
  return '<path d="M'+(dx-6)+' 11V-22L'+dx+' -31L'+(dx+6)+' -22V11Z" />';
 }).join('');
 return '<g transform="translate('+x+' '+y+') scale('+s+')" fill="#fff3da" stroke="#c7a77e" stroke-width="2.5">'+
 '<path d="M-71 -13Q0 -23 71 -13M-71 4Q0 -5 71 4" fill="none" stroke="#af825b" stroke-width="7"/>'+posts+'</g>';
}
function butterfly(x,y,col,d,phase){
 return '<g class="v-butterfly"><animateMotion path="M'+x+' '+y+'Q'+(x+36)+' '+(y-20)+' '+(x+40)+' '+(y+13)+'Q'+(x+12)+' '+(y+22)+' '+x+' '+y+'" dur="'+d+'s" begin="'+phase+'s" rotate="auto" repeatCount="indefinite"/>'+
 '<g class="v-butterfly-wings"><path d="M0 0Q-22 -20 -24 -2Q-21 14 0 2Q22 -20 24 -2Q20 14 0 2Z" fill="'+col+'" stroke="#fff6dc" stroke-width="2"/>'+
 '<path d="M0 -6Q-6 -12 -10 -10M0 -6Q6 -12 10 -10" stroke="#58466a" stroke-width="2" fill="none"/><ellipse rx="2.7" ry="9" fill="#62465c"/></g></g>';
}
function reeds(x,y){
 return '<g transform="translate('+x+' '+y+')"><path d="M-8 0Q-12 -20 -5 -32M0 0Q5 -25 7 -40M7 0Q17 -16 16 -25" stroke="#4c9a75" stroke-width="4" fill="none" stroke-linecap="round"/>'+
 '<ellipse cx="7" cy="-40" rx="4" ry="10" fill="#b59a65"/><ellipse cx="-5" cy="-32" rx="3" ry="8" fill="#b59a65"/></g>';
}
const plants=[[62,373,1],[922,372,1],[64,581,1.12],[896,577,1],[337,287,.57],[573,276,.52]].map(function(p){return bush(p[0],p[1],p[2])}).join('')+
 [[119,375,.83],[324,479,.72],[587,484,.71],[828,491,.76],[350,562,.8],[88,438,.68]].map(function(p){return flowers(p[0],p[1],p[2])}).join('');
const rocks=[[150,478],[285,407],[572,446],[813,561],[94,516]].map(function(p){
 return '<g transform="translate('+p[0]+' '+p[1]+')"><ellipse rx="18" ry="8" fill="#bccbb9" stroke="#eaf1da" stroke-width="2"/><path d="M-9 -3Q0 -7 9 -3" stroke="#e7f2e6" stroke-width="2" fill="none"/></g>';
}).join('');
const pollen=Array.from({length:22},function(_,i){
 const x=23+(i*101)%915,y=275+(i*79)%291;
 if((x>350&&x<610&&y>305&&y<487)||(x>650&&x<900&&y>339&&y<550))return '';
 return '<ellipse cx="'+x+'" cy="'+y+'" rx="4" ry="2" fill="'+(i%3?'#dcf8bc':'#fff1a6')+'" opacity=".7" transform="rotate('+(i*29%150)+' '+x+' '+y+')"/>';
}).join('');
ambient.innerHTML=
 '<g class="v-floating-pollen">'+pollen+'</g>'+plants+rocks+
 fence(93,504,.83)+fence(883,497,.72)+
 lantern(351,359,.78)+lantern(617,353,.78)+
 reeds(690,367)+reeds(765,377)+reeds(699,510)+
 '<g class="v-water-garden"><ellipse cx="818" cy="344" rx="24" ry="8" fill="#71c58d" stroke="#c1f1b5" stroke-width="2"/>'+
 '<circle cx="812" cy="340" r="5" fill="#ffabc9"/><ellipse cx="675" cy="454" rx="20" ry="7" fill="#76c98b" stroke="#cff4b8" stroke-width="2"/>'+
 '<circle cx="668" cy="451" r="4" fill="#ffdf82"/></g>'+
 '<g transform="translate(488 486)"><path d="M0 0V-31" stroke="#906947" stroke-width="7"/>'+
 '<path d="M-72 -56Q0 -64 72 -56L69 -28Q0 -20 -69 -28Z" fill="#edc98e" stroke="#9c744d" stroke-width="4"/>'+
 '<path d="M-60 -49Q0 -53 57 -49" fill="none" stroke="#fff0be" stroke-width="2"/>'+
 '<text x="0" y="-34" font-size="13" font-family="system-ui" font-weight="900" fill="#76553c" text-anchor="middle">HAPPY ANT VILLAGE</text></g>'+
 '<g class="v-bird-group" stroke="#f7fff8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".88">'+
 '<path d="M331 80q11 -11 22 0q11 -11 22 0"/><path d="M368 103q8 -9 17 0q8 -9 17 0"/>'+
 '<path d="M650 62q12 -13 25 0q11 -13 23 0"/></g>'+
 butterfly(266,127,'#ffb9e8',6,-2)+butterfly(689,206,'#ffdc81',7,-4)+butterfly(120,400,'#a0deff',8,-3)+
 '<g class="is-night-only"><circle class="v-firefly" cx="420" cy="320" r="6" fill="#ffe795"/>'+
 '<circle class="v-firefly" cx="554" cy="358" r="6" fill="#ffe795"/>'+
 '<circle class="v-firefly" cx="267" cy="486" r="5" fill="#ffe795"/></g>';
anchor.parentNode.insertBefore(ambient,anchor);
const home=svg.querySelector('g[transform="translate(486 394)"]');
if(home)home.insertAdjacentHTML('beforeend',
 '<g class="v-home-details"><path d="M-57 -45V-106H-40V-65" fill="#ae806b" stroke="#8d5e64" stroke-width="3"/>'+
 '<rect x="-62" y="-113" width="26" height="10" rx="2" fill="#f6ddc0" stroke="#b0856b" stroke-width="2"/>'+
 '<circle class="v-chimney-smoke a" cx="-51" cy="-126" r="7" fill="#fff" opacity=".65"/>'+
 '<circle class="v-chimney-smoke b" cx="-54" cy="-139" r="9" fill="#fff" opacity=".38"/>'+
 '<path d="M-11 -98V-115" stroke="#a97a60" stroke-width="5"/>'+
 '<path class="building-flag" d="M-11 -116L22 -108L-11 -99Z" fill="#ffda87" stroke="#fff2c4" stroke-width="2"/></g>');
window.AntVillageAmbience=Object.freeze({ready:true});
})();
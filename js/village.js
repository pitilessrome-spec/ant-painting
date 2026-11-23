/* ANT CANVAS – persistent, cosmetic-only ant village and reward materials. */
(function(global){
'use strict';
const KEY='ant_canvas_village_v1';
const catalog=Object.freeze({
 flower:{name:'Flower Garden',symbol:'🌼',wood:3,petals:2,description:'A colorful little flower bed'},
 mushroom:{name:'Mushroom House',symbol:'🍄',wood:5,petals:3,description:'A cozy home for tiny ants'},
 lantern:{name:'Firefly Lantern',symbol:'🏮',wood:8,petals:4,description:'A warm light for night visits'},
 fountain:{name:'Rainbow Fountain',symbol:'⛲',wood:13,petals:8,description:'A sparkling village centerpiece'},
 butterfly:{name:'Butterfly Tree',symbol:'🦋',wood:15,petals:10,description:'Attracts magical butterflies'},
 castle:{name:'Royal Ant Palace',symbol:'🏰',wood:30,petals:20,description:'The ultimate village landmark'}
});
function safeGet(){try{const j=JSON.parse(localStorage.getItem(KEY)||'null');return j&&j.v===1?j:null}catch(_){return null}}
function write(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(_){return false}}
let state=safeGet()||{v:1,wood:0,petals:0,chests:0,placements:{},claimed:{},last:null};
state.placements=state.placements||{};state.claimed=state.claimed||{};
function snapshot(){return JSON.parse(JSON.stringify(state))}
function award(lv,rarity){
 if(!Number.isSafeInteger(lv)||lv<1||state.claimed[lv])return null;
 // The caller must verify a FIRST-TIME legitimate local level completion.
 state.claimed[lv]=1;
 let wood=2,petals=1;
 const r=rarity&&rarity.id||'common';
 if(r==='rare'){wood+=3;petals+=1}
 if(r==='epic'){wood+=5;petals+=3}
 if(r==='legendary'){wood+=12;petals+=6}
 const chest=lv%5===0;
 if(chest){wood+=7;petals+=4;state.chests++}
 state.wood+=wood;state.petals+=petals;
 state.last={lv,wood,petals,chest,rarity:r};
 write();
 return state.last;
}
function place(slot,item){
 const index=Number(slot);
 if(!Number.isInteger(index)||index<0||index>8)return {ok:false,error:'Invalid plot'};
 const it=catalog[item];
 if(!it)return {ok:false,error:'Choose a decoration'};
 if(state.placements[index])return {ok:false,error:'This plot is already decorated'};
 if(state.wood<it.wood||state.petals<it.petals)return {ok:false,error:'Not enough materials yet. Clear more paintings!'};
 state.wood-=it.wood;state.petals-=it.petals;
 state.placements[index]=item;write();
 return {ok:true,item};
}
function count(){return Object.keys(state.placements).length}
global.AntVillage=Object.freeze({award,place,snapshot,count,catalog});
})(typeof window==='undefined'?globalThis:window);

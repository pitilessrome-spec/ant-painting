/* ANT CANVAS – persistent, cosmetic-only ant village and reward materials. */
(function(global){
'use strict';
const KEY='ant_canvas_village_v1';
const catalog=Object.freeze({
 flower:{name:'Flower Garden',symbol:'🌼',wood:2,petals:1,description:'Your very first flowering garden'},
 mushroom:{name:'Mushroom House',symbol:'🍄',wood:5,petals:3,description:'A cozy home for tiny ants'},
 lantern:{name:'Firefly Lantern',symbol:'🏮',wood:8,petals:4,description:'A warm light for night visits'},
 fountain:{name:'Rainbow Fountain',symbol:'⛲',wood:13,petals:8,description:'A sparkling village centerpiece'},
 butterfly:{name:'Butterfly Tree',symbol:'🦋',wood:15,petals:10,description:'Attracts magical butterflies'},
 castle:{name:'Royal Ant Palace',symbol:'🏰',wood:30,petals:20,description:'The ultimate village landmark'}
});
function safeGet(){try{const j=JSON.parse(localStorage.getItem(KEY)||'null');return j&&j.v===1?j:null}catch(_){return null}}
function write(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(_){return false}}
let state=safeGet()||{v:1,wood:0,petals:0,chests:0,placements:{},claimedHigh:0,claimedExtra:[],last:null};
state.placements=state.placements||{};
if(!Number.isSafeInteger(state.claimedHigh)){
 const old=Object.keys(state.claimed||{}).map(Number).filter(Number.isSafeInteger).sort((a,b)=>a-b);
 let high=0;while(old.includes(high+1))high++;
 state.claimedHigh=high;state.claimedExtra=old.filter(x=>x>high);
 delete state.claimed;write();
}
state.claimedExtra=state.claimedExtra||[];
state.upgrades=state.upgrades||{};
state.openedChest=Number.isInteger(state.openedChest)?Math.max(0,state.openedChest):0;
state.souvenirs=state.souvenirs||{};
state.discovered=state.discovered||{};
const SOUVENIRS=Object.freeze([
 {id:'star',name:'Starlight Pebble',symbol:'⭐',description:'A shimmering keepsake from a secret chest'},
 {id:'crystal',name:'Moon Crystal',symbol:'💎',description:'The crystal ants found under the hill'},
 {id:'seed',name:'Rainbow Seed',symbol:'🌈',description:'A magical seed for future gardens'},
 {id:'shell',name:'River Shell',symbol:'🐚',description:'A souvenir from the village stream'},
 {id:'feather',name:'Golden Feather',symbol:'🪶',description:'A rare and brilliant tiny feather'},
 {id:'compass',name:'Explorer Compass',symbol:'🧭',description:'A travel charm from an adventurous ant'}
]);
const COMBOS=Object.freeze([
 {id:'garden',name:'Mushroom Meadow',symbol:'🌸',items:['flower','mushroom'],require:2,description:'A glowing garden around a cozy mushroom home'},
 {id:'festival',name:'Lantern Festival',symbol:'🎆',items:['lantern','fountain'],require:2,description:'The village glows with colorful night lights'},
 {id:'royal',name:'Royal Butterfly Grove',symbol:'🦋',items:['butterfly','castle'],require:2,description:'A royal garden visited by rare butterflies'}
]);
function getLevel(slot){return Math.max(1,Math.min(3,Number(state.upgrades[slot])||1))}
function upgradeCost(slot){
 const item=state.placements[slot];if(!item)return null;
 const level=getLevel(slot);if(level>=3)return null;
 return {wood:catalog[item].wood*level+2,petals:catalog[item].petals*level+1};
}
function activeCombos(){
 return COMBOS.filter(c=>c.items.every(id=>
   Object.keys(state.placements).some(k=>state.placements[k]===id&&getLevel(k)>=c.require)));
}
function refreshCombos(){
 const newly=[];
 for(const combo of activeCombos())if(!state.discovered[combo.id]){
   state.discovered[combo.id]=1;newly.push(combo.id);
 }
 return newly;
}
function upgrade(slot){
 const index=Number(slot),item=state.placements[index];
 if(!Number.isInteger(index)||index<0||index>8||!item)return {ok:false,error:'Choose an existing building'};
 const level=getLevel(index),cost=upgradeCost(index);
 if(!cost)return {ok:false,error:'This building is already at level 3'};
 if(state.wood<cost.wood||state.petals<cost.petals)return {ok:false,error:'Collect more materials to upgrade'};
 state.wood-=cost.wood;state.petals-=cost.petals;state.upgrades[index]=level+1;
 const combos=refreshCombos();write();
 return {ok:true,item,level:level+1,combos};
}
function unopenedChests(){return Math.max(0,state.chests-state.openedChest)}
function openChest(){
 if(unopenedChests()===0)return {ok:false,error:'Clear more paintings. Every fifth level brings a chest!'};
 const seq=state.openedChest,choice=SOUVENIRS[seq%SOUVENIRS.length];
 state.openedChest++;state.souvenirs[choice.id]=(state.souvenirs[choice.id]||0)+1;
 // Transparent, deterministic cosmetics; chests are never paid for.
 const wood=2+(seq%3),petals=1+(seq%2);
 state.wood+=wood;state.petals+=petals;write();
 return {ok:true,souvenir:choice,wood,petals,remaining:unopenedChests()};
}
function discoveries(){
 return {
  items:SOUVENIRS.map(item=>Object.assign({},item,{unlocked:!!state.souvenirs[item.id],count:state.souvenirs[item.id]||0})),
  combos:COMBOS.map(c=>Object.assign({},c,{unlocked:!!state.discovered[c.id]})),
  active:activeCombos()
 };
}

function alreadyAwarded(lv){return lv<=state.claimedHigh||state.claimedExtra.includes(lv)}
function trackAward(lv){
 if(lv===state.claimedHigh+1){
   state.claimedHigh=lv;
   while(state.claimedExtra.includes(state.claimedHigh+1)){
     state.claimedHigh++;
     state.claimedExtra=state.claimedExtra.filter(x=>x!==state.claimedHigh);
   }
 }else if(state.claimedExtra.length<1000)state.claimedExtra.push(lv);
 else return false;
 return true;
}
function snapshot(){return JSON.parse(JSON.stringify(state))}
function award(lv,rarity){
 if(!Number.isSafeInteger(lv)||lv<1||alreadyAwarded(lv))return null;
 // The caller must verify a FIRST-TIME local level completion.
 if(!trackAward(lv))return null;
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
 state.placements[index]=item;state.upgrades[index]=1;refreshCombos();write();
 return {ok:true,item};
}
// Refund the original build and each paid upgrade; these are cosmetic, non-transferable resources.
function refundCost(slot){
 const item=state.placements[slot],it=catalog[item];if(!it)return null;
 let wood=it.wood,petals=it.petals;
 for(let lv=1;lv<getLevel(slot);lv++){wood+=it.wood*lv+2;petals+=it.petals*lv+1}
 return {wood,petals};
}
function validBuiltPlot(index){return Number.isInteger(index)&&[0,1,2,3,5,6,7,8].includes(index)&&!!catalog[state.placements[index]]}
function redesign(slot,newItem,expectedItem){
 const index=Number(slot);
 if(!validBuiltPlot(index))return {ok:false,error:'Choose an existing building'};
 const previous=state.placements[index];
 if(previous!==expectedItem)return {ok:false,error:'Building changed; select it again'};
 if(newItem!==null&&(!Object.hasOwn(catalog,newItem)||previous===newItem))return {ok:false,error:'Choose a different building'};
 const refund=refundCost(index),cost=newItem===null?{wood:0,petals:0}:catalog[newItem];
 if(state.wood+refund.wood<cost.wood||state.petals+refund.petals<cost.petals)return {ok:false,error:'Not enough materials after refund; original building kept'};
 const before=snapshot();
 state.wood+=refund.wood-cost.wood;state.petals+=refund.petals-cost.petals;
 delete state.placements[index];delete state.upgrades[index];
 if(newItem!==null){state.placements[index]=newItem;state.upgrades[index]=1}
 refreshCombos();
 if(!write()){state=before;return {ok:false,error:'Could not save your village. No materials changed.'}}
 return {ok:true,previous,item:newItem,refund,cost};
}
function remove(slot,expectedItem){return redesign(slot,null,expectedItem)}
function replace(slot,item,expectedItem){if(typeof item!=='string')return {ok:false,error:'Choose a replacement'};return redesign(slot,item,expectedItem)}
function count(){return Object.keys(state.placements).length}
global.AntVillage=Object.freeze({award,place,upgrade,upgradeCost,getLevel,refundCost,remove,replace,openChest,unopenedChests,discoveries,snapshot,count,catalog,COMBOS,SOUVENIRS});
})(typeof window==='undefined'?globalThis:window);

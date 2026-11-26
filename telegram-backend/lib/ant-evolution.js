'use strict';
const SPECIES=Object.freeze({
 worker:{name:'普通工蚁',icon:'🐜',relic:null,unlock:0,attack:100,pierce:0,resist:0,carry:0},
 fire:{name:'火焰蚁',icon:'🔥',relic:'beetle',unlock:1,attack:112,pierce:0,resist:0,carry:0},
 thunder:{name:'雷霆蚁',icon:'⚡',relic:'beetle',unlock:2,attack:105,pierce:2,resist:0,carry:0},
 royal:{name:'皇家守卫蚁',icon:'🛡️',relic:'spider',unlock:1,attack:100,pierce:0,resist:2,carry:0},
 frost:{name:'冰晶蚁',icon:'❄️',relic:'frost',unlock:1,attack:102,pierce:0,resist:3,carry:0},
 life:{name:'生命蚁',icon:'🍀',relic:'spider',unlock:2,attack:100,pierce:0,resist:1,carry:0},
 wing:{name:'飞翼蚁',icon:'🪽',relic:'prism',unlock:1,attack:100,pierce:0,resist:0,carry:1},
 crystal:{name:'水晶蚁',icon:'💎',relic:'frost',unlock:2,attack:104,pierce:1,resist:0,carry:0},
 ancient:{name:'远古神蚁',icon:'👑',relic:'all',unlock:5,attack:110,pierce:2,resist:2,carry:1}
});
const COSTS=[0,0,2,4,6,10],RANKS=['','普通','稀有','史诗','传说','神话'],MULT=[0,100,145,210,320,480];
function stats(species,level=1){if(!Object.hasOwn(SPECIES,species)||!Number.isInteger(level)||level<1||level>5)throw Error('Invalid ant');const a=SPECIES[species];return {species,name:a.name,icon:a.icon,level,rarity:RANKS[level],power:Math.floor(MULT[level]*a.attack/100),pierce:a.pierce? a.pierce+Math.floor((level-1)/2):0,resist:a.resist? a.resist+Math.floor((level-1)/2):0,carry:a.carry? Math.min(2,1+Math.floor((level-1)/3)):0};}
function unlockable(species,relics){const a=SPECIES[species];return !!a&&(a.relic===null||(a.relic==='all'?['spider','beetle','frost','prism'].every(k=>relics.includes(k)):relics.includes(a.relic)))}
module.exports={SPECIES,COSTS,RANKS,stats,unlockable};
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
 castle:{name:'Royal Ant Palace',symbol:'🏰',wood:30,petals:20,description:'The ultimate village landmark'},
 grove:{name:'Glow Mushroom Grove',symbol:'🍄',wood:10,petals:5,description:'Golden spores light the forest path',region:'forest'},
 dock:{name:'Shell Harbor',symbol:'🐚',wood:15,petals:8,description:'A tiny harbor on the coral coast',region:'island'},
 ice:{name:'Crystal Observatory',symbol:'🔮',wood:20,petals:10,description:'Watch the northern lights from a crystal tower',region:'snow'}
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
const HOUR=3600000, MAX_HOURS=8;
const SIGN_REWARDS=Object.freeze([{wood:2,petals:1},{wood:3,petals:1},{wood:3,petals:2},{wood:4,petals:2},{wood:5,petals:2},{wood:5,petals:3},{wood:7,petals:4,chest:1}]);
const DAILY_TASKS=Object.freeze([{id:'paint1',label:'Complete 1 new painting',goal:1,key:'paint',wood:2,petals:1},{id:'paint3',label:'Complete 3 new paintings',goal:3,key:'paint',wood:4,petals:2},{id:'gather',label:'Collect ant materials once',goal:1,key:'gather',wood:2,petals:1}]);
function dayNumber(now){const d=new Date(now);return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000)}
function makeLife(now){return {lastGather:now,lastSign:null,streak:0,day:dayNumber(now),paint:0,gather:0,claimed:{}}}
if(!state.life||!Number.isFinite(state.life.lastGather)){state.life=makeLife(Date.now());write()}
function lifeDay(now){
 const day=dayNumber(now),l=state.life;
 if(day>l.day){l.day=day;l.paint=0;l.gather=0;l.claimed={}}
 return day===l.day;
}
function lifePreview(now=Date.now()){
 const l=state.life,day=dayNumber(now),valid=day>=l.day;
 const elapsed=Math.max(0,now-l.lastGather),hours=Math.min(MAX_HOURS,Math.floor(elapsed/HOUR));
 const streak=l.lastSign===day?l.streak:l.lastSign===day-1?l.streak%7+1:1;
 const tasks=DAILY_TASKS.map(t=>Object.assign({},t,{progress:day===l.day?Math.min(t.goal,l[t.key]||0):0,claimed:day===l.day&&!!l.claimed[t.id]}));
 return {hours,wood:hours,petals:Math.floor(hours/2),nextMs:hours>=MAX_HOURS?0:Math.max(0,HOUR-elapsed%HOUR),maxHours:MAX_HOURS,valid,streak,signClaimed:l.lastSign===day,signReward:SIGN_REWARDS[streak-1],tasks};
}
function lifeCommit(before,result){if(!write()){state=before;return {ok:false,error:'Could not save; no materials changed'}}return Object.assign({ok:true},result)}
function collectAnts(now=Date.now()){
 const p=lifePreview(now);if(!p.valid||p.hours<1)return {ok:false,error:'No materials ready yet'};
 const before=snapshot();lifeDay(now);
 // Keep partial hour, but discard time beyond the storage cap.
 state.life.lastGather=p.hours>=MAX_HOURS?now:state.life.lastGather+p.hours*HOUR;
 state.life.gather++;state.wood+=p.wood;state.petals+=p.petals;
 return lifeCommit(before,{wood:p.wood,petals:p.petals});
}
function signIn(now=Date.now()){
 const p=lifePreview(now);if(!p.valid||p.signClaimed)return {ok:false,error:'Daily reward already claimed or device time invalid'};
 const before=snapshot();lifeDay(now);state.life.lastSign=dayNumber(now);state.life.streak=p.streak;
 state.wood+=p.signReward.wood;state.petals+=p.signReward.petals;state.chests+=p.signReward.chest||0;
 return lifeCommit(before,{reward:p.signReward,streak:p.streak});
}
function claimDaily(id,now=Date.now()){
 const p=lifePreview(now),t=p.tasks.find(x=>x.id===id);
 if(!p.valid||!t||t.claimed||t.progress<t.goal)return {ok:false,error:'Task not complete or already claimed'};
 const before=snapshot();lifeDay(now);state.life.claimed[id]=true;state.wood+=t.wood;state.petals+=t.petals;
 return lifeCommit(before,{wood:t.wood,petals:t.petals});
}
// V3: independent region layouts, shared resources and persistent expeditions.
const REGIONS=Object.freeze([{id:'garden',name:'Storybook Garden',symbol:'🌿',unlock:0},{id:'forest',name:'Mushroom Forest',symbol:'🍄',unlock:5},{id:'island',name:'Coral Island',symbol:'🏝️',unlock:15},{id:'snow',name:'Snowlight Valley',symbol:'❄️',unlock:30}]);
const ROLES=Object.freeze([{id:'scout',name:'🧭 Scout',skill:'Discover relics'},{id:'worker',name:'🪵 Builder',skill:'Extra wood'},{id:'gardener',name:'🌸 Gardener',skill:'Extra petals'}]);
const ROUTES=Object.freeze([{id:'trail',name:'Hidden trail',minutes:5,wood:2,petals:1,relic:'Trail Token',symbol:'🍃'},{id:'river',name:'River crossing',minutes:10,wood:3,petals:2,relic:'River Gem',symbol:'💎'},{id:'ruins',name:'Ancient ruins',minutes:20,wood:5,petals:3,relic:'Ancient Seal',symbol:'🏺'}]);
const REGION_ROUTES={
 forest:[{name:'Firefly hollow',relic:'Golden Spore',symbol:'🍄'},{name:'Root bridge',relic:'Amber Leaf',symbol:'🍂'},{name:'Ancient oak',relic:'Forest Crown',symbol:'👑'}],
 island:[{name:'Shell beach',relic:'Pearl Shell',symbol:'🐚'},{name:'Coral lagoon',relic:'Coral Star',symbol:'⭐'},{name:'Sunken temple',relic:'Ocean Compass',symbol:'🧭'}],
 snow:[{name:'Frost trail',relic:'Snowflake',symbol:'❄️'},{name:'Frozen lake',relic:'Ice Crystal',symbol:'💎'},{name:'Aurora peak',relic:'Aurora Lantern',symbol:'🏮'}]
};
function routesFor(region){return ROUTES.map((t,i)=>({...t,...(REGION_ROUTES[region]?.[i]||{})}))}
function itemAllowed(id){const it=catalog[id];return !!it&&(!it.region||it.region===state.world.active)}
function ensureWorld(){if(!state.world||!REGIONS.some(r=>r.id===state.world.active)){state.world={active:'garden',maps:{},relics:{},expedition:null,completed:0};return true}state.world.maps=state.world.maps||{};state.world.relics=state.world.relics||{};return false}
if(ensureWorld())write();
function paintings(){return state.claimedHigh+state.claimedExtra.length}
function worldPreview(now=Date.now()){const w=state.world,n=paintings(),e=w.expedition;return {active:w.active,paintings:n,regions:REGIONS.map(r=>({...r,unlocked:n>=r.unlock,plots:r.id===w.active?Object.keys(state.placements).length:Object.keys(w.maps[r.id]?.placements||{}).length})),roles:ROLES,routes:routesFor(e?e.region:w.active),expedition:e?{...e,remaining:Math.max(0,e.finish-now)}:null,relics:REGIONS.flatMap(r=>routesFor(r.id).map(t=>({id:r.id+':'+t.id,name:t.relic,region:r.name,symbol:t.symbol,found:!!w.relics[r.id+':'+t.id]}))),completed:w.completed||0}}
function selectRegion(id){const r=REGIONS.find(x=>x.id===id),w=state.world;if(!r||paintings()<r.unlock)return {ok:false,error:'Region is locked'};if(id===w.active)return {ok:true};const before=snapshot();w.maps[w.active]={placements:state.placements,upgrades:state.upgrades};const next=w.maps[id]||{placements:{},upgrades:{}};state.placements=next.placements;state.upgrades=next.upgrades;delete w.maps[id];w.active=id;return lifeCommit(before,{region:id})}
function expeditionStart(route,role,now=Date.now()){const t=ROUTES.find(x=>x.id===route),a=ROLES.find(x=>x.id===role),w=state.world;if(!t||!a||!Number.isFinite(now)||!lifePreview(now).valid)return {ok:false,error:'Invalid expedition'};if(w.expedition)return {ok:false,error:'Claim your current expedition first'};const before=snapshot();w.expedition={region:w.active,route,role,start:now,finish:now+t.minutes*60000};return lifeCommit(before,{expedition:w.expedition})}
function expeditionClaim(now=Date.now()){const w=state.world,e=w.expedition;if(!e||!Number.isFinite(now)||now<e.finish||!lifePreview(now).valid)return {ok:false,error:'Expedition not ready'};const t=routesFor(e.region).find(x=>x.id===e.route);if(!t||!ROLES.some(x=>x.id===e.role))return {ok:false,error:'Invalid expedition'};const before=snapshot(),id=e.region+':'+e.route,found=!w.relics[id]&&e.role==='scout';const wood=t.wood+(e.role==='worker'?2:0),petals=t.petals+(e.role==='gardener'?2:0);if(found)w.relics[id]=true;state.wood+=wood;state.petals+=petals;w.completed=(w.completed||0)+1;w.expedition=null;return lifeCommit(before,{wood,petals,relic:found?t.relic:null,symbol:t.symbol})}
// Synchronize ordinary same-origin tabs; no server authority or anti-tamper guarantee.
if(global.addEventListener)global.addEventListener('storage',e=>{if(e.key===KEY){const next=safeGet();if(next&&next.life){state=next;ensureWorld()}}});
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

// V3.6: regional activities, saved in the existing village record. Local cosmetic progression.
const GARDEN_SEEDS=['Tulip','Sunflower','Cherry blossom'],FOREST_SPOTS=['Root cave','Firefly path','Secret pond'],FOREST_CLUES=['Look for bark and roots','Look for lights floating in the air','Look for a reflection in the water'],SEA_ROUTES=['Pearl shallows','Coral cave','Shipwreck bay'],SHELLS=['Pearl shell','Coral star','Golden spiral shell'];
function newActivity(id){return id==='garden'?{plant:null,flowers:{}}:id==='forest'?{treasures:[],glow:null,grown:0}:id==='island'?{voyage:null,shells:{},trips:0}:{trip:null,ice:0,sculptures:0,auroras:0,lastAuroraDay:null}}
function activityPreview(now=Date.now()){
 const id=state.world.active,a=state.world.activities?.[id]||newActivity(id),night=new Date(now).getHours()<6||new Date(now).getHours()>=18;
 return {id,data:JSON.parse(JSON.stringify(a)),night,valid:lifePreview(now).valid,day:dayNumber(now),seeds:GARDEN_SEEDS,spots:FOREST_SPOTS,clues:FOREST_CLUES,routes:SEA_ROUTES,shells:SHELLS};
}
function activity(action,arg,now=Date.now()){
 const p=activityPreview(now),id=p.id; if(!p.valid||!Number.isFinite(now))return {ok:false,error:'Device date invalid'};
 const before=snapshot();const a=p.data,fail=error=>({ok:false,error});let result='';
 if(id==='garden'){
  if(action==='plant'){if(a.plant||!GARDEN_SEEDS.includes(arg)||state.petals<1)return fail('Choose an affordable seed and an empty bed');state.petals--;a.plant={name:arg,water:0,ready:now+60000};result='Seed planted'}
  else if(action==='water'){if(!a.plant||a.plant.water>=2||now<a.plant.ready)return fail('Not ready to water');a.plant.water++;a.plant.ready=now+60000;result='Watered your flower'}
  else if(action==='harvest'){if(!a.plant||a.plant.water!==2||now<a.plant.ready)return fail('Flower is not ready');const name=a.plant.name;a.flowers[name]=(a.flowers[name]||0)+1;a.plant=null;state.petals+=3;result='Harvested '+name+' · +3 petals'}
  else return fail('Unknown garden action');
 }else if(id==='forest'){
  if(action==='search'){const i=a.treasures.length;if(i>=3||arg!==FOREST_SPOTS[i])return fail(i>=3?'All treasures collected':'Look at the clue again');a.treasures.push(arg);result='Discovered '+arg}
  else if(action==='glow-plant'){if(a.glow||a.treasures.length<1||state.petals<1)return fail('Discover treasure first and collect a petal');state.petals--;a.glow=now+300000;result='Glowing spore planted'}
  else if(action==='glow-harvest'){if(!a.glow||now<a.glow)return fail('Glowplant still growing');a.glow=null;a.grown++;result='Glowplant collected'}
  else return fail('Unknown forest action');
 }else if(id==='island'){
  if(action==='sail'){const i=SEA_ROUTES.indexOf(arg);if(i<0||a.voyage)return fail('Finish your current voyage');a.voyage={index:i,route:arg,ready:now+[120000,300000,600000][i]};result='Your ant has sailed'}
  else if(action==='dock'){if(!a.voyage||now<a.voyage.ready)return fail('Voyage still underway');const k=SHELLS[a.voyage.index];a.shells[k]=(a.shells[k]||0)+1;a.trips++;a.voyage=null;result='Collected '+k}
  else return fail('Unknown island action');
 }else if(id==='snow'){
  if(action==='snow-start'){if(a.trip)return fail('Finish your expedition first');a.trip=now+300000;result='Expedition started'}
  else if(action==='snow-claim'){if(!a.trip||now<a.trip)return fail('Expedition still underway');a.trip=null;a.ice+=2;result='Found two ice crystals'}
  else if(action==='sculpt'){if(a.ice<2)return fail('Two ice crystals required');a.ice-=2;a.sculptures++;result='Sculpture added to your collection'}
  else if(action==='aurora'){if(!p.night||a.lastAuroraDay===p.day)return fail('Collect once per local night');a.lastAuroraDay=p.day;a.auroras++;result='Aurora collected'}
  else return fail('Unknown snow action');
 }else return fail('Unknown region');
 state.world.activities=state.world.activities||{};state.world.activities[id]=a;return lifeCommit(before,{message:result});
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
 if(lifeDay(Date.now()))state.life.paint++;
 state.last={lv,wood,petals,chest,rarity:r};
 write();
 return state.last;
}
function place(slot,item){
 const index=Number(slot);
 if(!Number.isInteger(index)||![0,1,2,3,5,6,7,8].includes(index))return {ok:false,error:'Invalid plot'};
 const it=catalog[item];
 if(!Object.hasOwn(catalog,item)||!itemAllowed(item))return {ok:false,error:'This decoration belongs to another region'};
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
 if(newItem!==null&&(!Object.hasOwn(catalog,newItem)||!itemAllowed(newItem)||previous===newItem))return {ok:false,error:'Choose a different building'};
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
function milestones(){const w=state.world;return REGIONS.map(r=>{const map=r.id===w.active?state:w.maps[r.id]||{},n=Object.keys(map.placements||{}).length,lv=Object.values(map.upgrades||{}).filter(x=>x>=2).length,relics=routesFor(r.id).filter(t=>w.relics[r.id+':'+t.id]).length;return {id:r.id,name:r.name,unlocked:paintings()>=r.unlock,plots:n,upgraded:lv,relics,claimed:!!w.milestones?.[r.id],ready:n>=4&&lv>=2&&relics>=3}})}
function claimMilestone(id){const t=milestones().find(x=>x.id===id);if(!t||!t.unlocked||!t.ready||t.claimed)return {ok:false,error:'Region milestone is not ready'};const before=snapshot();state.world.milestones=state.world.milestones||{};state.world.milestones[id]=true;state.wood+=10;state.petals+=5;state.chests++;return lifeCommit(before,{wood:10,petals:5,chest:1})}
global.AntVillage=Object.freeze({award,place,upgrade,upgradeCost,getLevel,worldPreview,activityPreview,activity,itemAllowed,milestones,claimMilestone,selectRegion,expeditionStart,expeditionClaim,lifePreview,collectAnts,signIn,claimDaily,refundCost,remove,replace,openChest,unopenedChests,discoveries,snapshot,count,catalog,COMBOS,SOUVENIRS});
})(typeof window==='undefined'?globalThis:window);

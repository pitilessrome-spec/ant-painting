'use strict';
const {randomBytes,createHash}=require('node:crypto');
const A=require('./ant-evolution');
const SEASON='S0',BOSSES=Object.freeze({spider:'深渊蛛后',beetle:'黄金甲虫帝王',frost:'永冬冰霜领主',prism:'七彩混沌魔神'});
const TIERS=Object.freeze({small:{cap:2,recommended:2,base:1450,per:140,turns:64,interval:60000,deadline:480000},medium:{cap:3,recommended:3,base:2450,per:180,turns:68,interval:50000,deadline:540000},world:{cap:8,recommended:5,base:3900,per:250,turns:70,interval:40000,deadline:600000}});
const ENCOUNTERS=Object.freeze({
 beetle:{small:{name:'巨型瓢虫',regen:1,armor:4,slow:0,block:false,heal:0},medium:{name:'荆棘螳螂',regen:3,armor:0,slow:2,block:true,heal:.01},world:{name:'黄金圣甲王',regen:4,armor:24,slow:0,block:false,heal:.025}},
 spider:{small:{name:'毒菇史莱姆',regen:4,armor:0,slow:0,block:false,heal:.03},medium:{name:'幽灵蜈蚣',regen:3,armor:0,slow:3,block:false,heal:.01},world:{name:'深渊蛛后',regen:6,armor:0,slow:0,block:true,heal:.02}},
 prism:{small:{name:'巨钳寄居蟹',regen:1,armor:10,slow:0,block:false,heal:0},medium:{name:'珊瑚巨鲨',regen:2,armor:0,slow:1,block:true,heal:.005},world:{name:'七彩海渊巨兽',regen:5,armor:4,slow:2,block:false,heal:.015}},
 frost:{small:{name:'雪原巨蝎',regen:2,armor:0,slow:1,block:true,heal:0},medium:{name:'冰晶巨人',regen:2,armor:16,slow:3,block:false,heal:.01},world:{name:'极寒冰龙皇',regen:6,armor:8,slow:5,block:true,heal:.02}}
});
const WARDS={small:1,medium:2,world:3}, COMBO_MS=5500;
const fail=(message,status=409)=>{const e=Error(message);e.status=status;throw e};
const valid=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const alias=id=>'Ant '+createHash('sha256').update(String(id)).digest('hex').slice(0,8);
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296}}
function board(seed,round){const r=rng((seed+Math.imul(round,2654435761))>>>0);return Array.from({length:8},()=>Array.from({length:8},()=>({c:Math.floor(r()*4),skill:r()<.06?(r()<.55?'bomb':'lightning'):null})))}
function createPlayer(seed=randomBytes(4).readUInt32LE()){return {power:100,ant:A.stats('worker',1),seed,round:0,board:board(seed,0),skills:{bomb:0,lightning:0},seq:0,lastAt:0,damage:0,cleared:0,turns:0,combos:0,blocked:-1,slow:0}}
function createRoom(tier,boss,owner,now=Date.now()){if(!valid(TIERS,tier)||!valid(BOSSES,boss))fail('Unknown raid',400);return {rulesVersion:process.env.ANT_RAID_V6==='1'?6:5,season:SEASON,tier,boss,owner,status:'lobby',players:{[owner]:createPlayer()},createdAt:now,startedAt:null,finishedAt:null,maxHP:0,hp:0,phase:1,weak:0,armor:0,regenerated:0,rage:0,nextRageAt:null,retaliations:0,ward:0,combo:null,teamCombos:0,assisted:false}}
function join(s,id){if(valid(s.players,id))return false;if(s.status!=='lobby')fail('Raid already started');if(Object.keys(s.players).length>=TIERS[s.tier].cap)fail('Team is full');s.players[id]=createPlayer();return true}
function leave(s,id){if(s.status!=='lobby')fail('Cannot leave active raid');if(!valid(s.players,id))fail('Not a member',403);delete s.players[id];if(id===s.owner){s.owner=Object.keys(s.players)[0]||null;if(!s.owner)s.status='cancelled'}return true}
function start(s,id,now=Date.now()){if(s.owner!==id)fail('Only leader can start',403);if(s.status!=='lobby')fail('Raid already started');if(now-s.createdAt>24*60*60*1000)fail('Room expired');const n=Object.keys(s.players).length,t=TIERS[s.tier];s.maxHP=t.base+t.per*(n-1);s.hp=s.maxHP;s.ward=WARDS[s.tier];s.combo=null;s.startedAt=now;s.nextRageAt=now+t.interval;s.status='active';return true}
function expired(s,now){return s.status==='active'&&now-s.startedAt>=TIERS[s.tier].deadline}
function expose(p){return [...new Set(p.board.filter(a=>a.length).map(a=>a[0].c))]}
function counter(s,timed=false){if(timed)s.rage++;else s.phase++;s.retaliations++;s.ward=WARDS[s.tier]+Math.min(2,Math.floor(s.rage/2));s.combo=null;s.weak=(s.weak+1)%4;const tier=['small','medium','world'].indexOf(s.tier),profile=s.rulesVersion===6?ENCOUNTERS[s.boss][s.tier]:null,n=(profile?profile.regen:2+tier*2)+(s.phase===3?2:0)+Math.min(12,s.rage*2);
 for(const p of Object.values(s.players)){const r=rng(p.seed^Math.imul(s.retaliations,7789));for(let i=0;i<n;i++){const col=p.board[i%8];if(col.length<16){col.unshift({c:Math.floor(r()*4),skill:null});s.regenerated++}}if(profile){if(profile.block)p.blocked=(p.ant?.resist||0)>=2?-1:expose(p)[0]??-1;if(profile.slow)p.slow=Math.max(0,Math.min(6,profile.slow+s.rage)-(p.ant?.resist||0))}else if(s.boss==='spider')p.blocked=(p.ant?.resist||0)>=2?-1:expose(p)[0]??-1;else if(s.boss==='frost')p.slow=Math.max(0,Math.min(5,2+s.rage)-(p.ant?.resist||0))}
 if(profile){if(profile.armor)s.armor=Math.max(s.armor,profile.armor+Math.min(36,s.rage*4))}else if(s.boss==='beetle')s.armor=Math.max(s.armor,12+8*tier+Math.min(36,s.rage*4));s.hp+=Math.min(s.maxHP-s.hp,Math.floor(s.maxHP*(profile?Math.min(.06,profile.heal+(timed?s.rage*.003:0)):(timed?Math.min(.06,.012+s.rage*.004):.025))));
}
function advance(s,now){if(s.status!=='active')return false;if(expired(s,now)){s.status='failed';s.finishedAt=s.startedAt+TIERS[s.tier].deadline;return true}let changed=false;const t=TIERS[s.tier];while(now>=s.nextRageAt){counter(s,true);s.nextRageAt+=Math.max(15000,t.interval-s.rage*4000);changed=true}return changed}
function act(s,id,input,now=Date.now()){const p=s.players[id];if(!valid(s.players,id))fail('Not a member',403);if(!Number.isSafeInteger(input.seq)||input.seq<1)fail('Invalid sequence',400);
 if(input.seq<=p.seq)return {duplicate:true};if(input.seq!==p.seq+1)fail('Sequence mismatch');
 if(s.status!=='active')fail('Raid not active');if(advance(s,now)&&s.status!=='active')return {expired:true};
 if(now-p.lastAt<750)fail('Slow down',429);if(p.turns>=TIERS[s.tier].turns)fail('No turns left');
 let hit=0,cleared=0,comboBroken=false;const wardBefore=s.ward;
 if(input.kind==='color'){const color=input.color;if(!Number.isInteger(color)||color<0||color>3||!expose(p).includes(color))fail('Choose exposed color',400);if(p.blocked===color&&expose(p).length>1)fail('Web blocked color; choose another');
  // Select reachable bottom bricks of that color, never an arbitrary client damage amount.
  const limit=Math.max(2,(p.slow>0?4:7)+(p.ant?.carry||0)-Math.floor(s.rage/3));while(cleared<limit){const col=p.board.find(a=>a[0]?.c===color);if(!col)break;const tile=col.shift();cleared++;if(tile.skill)p.skills[tile.skill]++}
  hit=cleared*(color===s.weak?5:3)+Math.max(0,cleared-2)*2;if(s.armor>0){s.armor=Math.max(0,s.armor-1-(p.ant?.pierce||0));hit=cleared*3}
  p.blocked=-1;p.slow=Math.max(0,p.slow-1);p.cleared+=cleared;
  if(s.ward>0&&cleared>=2){const q=s.combo,validCombo=q&&q.until>=now;if(validCombo&&color===(s.weak+1)%4&&(q.player!==id||Object.keys(s.players).length===1)){s.ward--;s.combo=null;s.teamCombos++;p.combos++;comboBroken=true;}else if(color===s.weak){s.combo={player:id,until:now+COMBO_MS};}}
 }else if(input.kind==='skill'){const k=input.skill;if(!['bomb','lightning'].includes(k)||p.skills[k]<=0)fail('Skill not earned',400);p.skills[k]--;hit=k==='bomb'?24:32;if(s.armor){s.armor=0;hit+=10}p.blocked=-1;p.slow=Math.max(0,p.slow-1);
 }else fail('Unknown action',400);
 if(wardBefore>0){hit=Math.max(1,Math.floor(hit*(comboBroken?0.85:0.38)));}hit=Math.max(1,Math.floor(hit*p.power/100));p.seq++;p.lastAt=now;p.turns++;const applied=Math.min(s.hp,hit);s.hp-=applied;p.damage+=applied;
 if(s.hp<=0){s.status='won';s.finishedAt=now;s.hp=0}else{while(s.phase<3&&s.hp*100<=s.maxHP*(s.phase===1?70:40))counter(s);
 if(p.board.every(a=>a.length===0)){p.round++;p.board=board(p.seed,p.round)}
 if(Object.values(s.players).every(q=>q.turns>=TIERS[s.tier].turns)){s.status='failed';s.finishedAt=now}}
 return {damage:applied,cleared,comboBroken}
}
function view(s,id){if(!valid(s.players,id))fail('Not a member',403);const p=s.players[id];return {season:s.season,tier:s.tier,boss:s.boss,bossName:s.rulesVersion===6?ENCOUNTERS[s.boss][s.tier].name:BOSSES[s.boss],status:s.status,leader:s.owner===id,cap:TIERS[s.tier].cap,recommended:TIERS[s.tier].recommended,hp:s.hp,maxHP:s.maxHP,phase:s.phase,weak:s.weak,armor:s.armor,regenerated:s.regenerated,ward:s.ward,teamCombos:s.teamCombos,combo:s.combo&&s.combo.until>=Date.now()?{open:true,self:s.combo.player===id,until:s.combo.until,finishColor:(s.weak+1)%4}:null,rage:s.rage,retaliations:s.retaliations,nextRageAt:s.nextRageAt,deadlineAt:s.startedAt===null?null:s.startedAt+TIERS[s.tier].deadline,startedAt:s.startedAt,finishedAt:s.finishedAt,assisted:s.assisted,rankedEligible:s.rankedEligible??null,team:Object.entries(s.players).map(([k,v])=>({name:alias(k),self:k===id,damage:v.damage,turns:v.turns,combos:v.combos,ant:v.ant||A.stats('worker',1)})),me:{board:p.board,skills:p.skills,seq:p.seq,turns:p.turns,turnLimit:TIERS[s.tier].turns,power:p.power,ant:p.ant||A.stats('worker',1),blocked:p.blocked,slow:p.slow,available:expose(p)}}}
function roster(s){return createHash('sha256').update(Object.keys(s.players).sort().join(',')).digest('hex')}
function equip(s,id,ant){if(s.status!=='lobby'||!valid(s.players,id))fail('Equip only in your lobby');s.players[id].ant=A.stats(ant.species,ant.level);s.players[id].power=s.players[id].ant.power;return true}
function eligible(s){const ps=Object.values(s.players);return ps.length===1||ps.every(p=>p.turns>=3&&(p.damage>=Math.max(1,Math.floor(s.maxHP*.008))||p.combos>=2))}
module.exports={ENCOUNTERS,equip,eligible,WARDS,COMBO_MS,SEASON,BOSSES,TIERS,createRoom,join,leave,start,act,view,roster,alias,expired,advance};
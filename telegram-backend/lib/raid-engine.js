'use strict';
const {randomBytes,createHash}=require('node:crypto');
const SEASON='S0',BOSSES=Object.freeze({spider:'深渊蛛后',beetle:'黄金甲虫帝王',frost:'永冬冰霜领主',prism:'七彩混沌魔神'});
const TIERS=Object.freeze({small:{cap:2,recommended:2,base:540,per:260,turns:75},medium:{cap:3,recommended:3,base:900,per:380,turns:105},world:{cap:8,recommended:5,base:1550,per:560,turns:145}});
const fail=(message,status=409)=>{const e=Error(message);e.status=status;throw e};
const valid=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const alias=id=>'Ant '+createHash('sha256').update(String(id)).digest('hex').slice(0,8);
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296}}
function board(seed,round){const r=rng((seed+Math.imul(round,2654435761))>>>0);return Array.from({length:8},()=>Array.from({length:8},()=>({c:Math.floor(r()*4),skill:r()<.06?(r()<.55?'bomb':'lightning'):null})))}
function createPlayer(seed=randomBytes(4).readUInt32LE()){return {seed,round:0,board:board(seed,0),skills:{bomb:0,lightning:0},seq:0,lastAt:0,damage:0,cleared:0,turns:0,blocked:-1,slow:0}}
function createRoom(tier,boss,owner,now=Date.now()){if(!valid(TIERS,tier)||!valid(BOSSES,boss))fail('Unknown raid',400);return {season:SEASON,tier,boss,owner,status:'lobby',players:{[owner]:createPlayer()},createdAt:now,startedAt:null,finishedAt:null,maxHP:0,hp:0,phase:1,weak:0,armor:0,regenerated:0,assisted:false}}
function join(s,id){if(valid(s.players,id))return false;if(s.status!=='lobby')fail('Raid already started');if(Object.keys(s.players).length>=TIERS[s.tier].cap)fail('Team is full');s.players[id]=createPlayer();return true}
function leave(s,id){if(s.status!=='lobby')fail('Cannot leave active raid');if(!valid(s.players,id))fail('Not a member',403);delete s.players[id];if(id===s.owner){s.owner=Object.keys(s.players)[0]||null;if(!s.owner)s.status='cancelled'}return true}
function start(s,id,now=Date.now()){if(s.owner!==id)fail('Only leader can start',403);if(s.status!=='lobby')fail('Raid already started');if(now-s.createdAt>24*60*60*1000)fail('Room expired');const n=Object.keys(s.players).length,t=TIERS[s.tier];s.maxHP=t.base+t.per*(n-1);s.hp=s.maxHP;s.startedAt=now;s.status='active';return true}
function expired(s,now){return s.status==='active'&&now-s.startedAt>20*60*1000}
function expose(p){return [...new Set(p.board.filter(a=>a.length).map(a=>a[0].c))]}
function counter(s){s.phase++;s.weak=(s.weak+1)%4;const tier=['small','medium','world'].indexOf(s.tier),n=2+tier*2+(s.phase===3?2:0);
 for(const p of Object.values(s.players)){const r=rng(p.seed^Math.imul(s.phase,7789));for(let i=0;i<n;i++){const col=p.board[i%8];col.unshift({c:Math.floor(r()*4),skill:null});s.regenerated++}if(s.boss==='spider'){p.blocked=expose(p)[0]??-1}else if(s.boss==='frost')p.slow=2}
 if(s.boss==='beetle')s.armor=12+8*tier;
 // Recovery is bounded, never more than 3% of initial HP; phase never rolls back.
 const heal=Math.min(s.maxHP-s.hp,Math.floor(s.maxHP*.025));s.hp+=heal;
}
function act(s,id,input,now=Date.now()){const p=s.players[id];if(!valid(s.players,id))fail('Not a member',403);if(!Number.isSafeInteger(input.seq)||input.seq<1)fail('Invalid sequence',400);
 if(input.seq<=p.seq)return {duplicate:true};if(input.seq!==p.seq+1)fail('Sequence mismatch');
 if(s.status!=='active')fail('Raid not active');if(expired(s,now)){s.status='failed';s.finishedAt=now;return {expired:true}}
 if(now-p.lastAt<350)fail('Slow down',429);if(p.turns>=TIERS[s.tier].turns)fail('No turns left');
 let hit=0,cleared=0;
 if(input.kind==='color'){const color=input.color;if(!Number.isInteger(color)||color<0||color>3||!expose(p).includes(color))fail('Choose exposed color',400);if(p.blocked===color&&expose(p).length>1)fail('Web blocked color; choose another');
  // Select reachable bottom bricks of that color, never an arbitrary client damage amount.
  const limit=p.slow>0?4:7;while(cleared<limit){const col=p.board.find(a=>a[0]?.c===color);if(!col)break;const tile=col.shift();cleared++;if(tile.skill)p.skills[tile.skill]++}
  hit=cleared*(color===s.weak?5:3)+Math.max(0,cleared-2)*2;if(s.armor>0){s.armor--;hit=cleared*3}
  p.blocked=-1;p.slow=Math.max(0,p.slow-1);p.cleared+=cleared;
 }else if(input.kind==='skill'){const k=input.skill;if(!['bomb','lightning'].includes(k)||p.skills[k]<=0)fail('Skill not earned',400);p.skills[k]--;hit=k==='bomb'?24:32;if(s.armor){s.armor=0;hit+=10}p.blocked=-1;p.slow=Math.max(0,p.slow-1);
 }else fail('Unknown action',400);
 p.seq++;p.lastAt=now;p.turns++;const applied=Math.min(s.hp,hit);s.hp-=applied;p.damage+=applied;
 if(s.hp<=0){s.status='won';s.finishedAt=now;s.hp=0}else{while(s.phase<3&&s.hp*100<=s.maxHP*(s.phase===1?70:40))counter(s);
 if(p.board.every(a=>a.length===0)){p.round++;p.board=board(p.seed,p.round)}
 if(Object.values(s.players).every(q=>q.turns>=TIERS[s.tier].turns)){s.status='failed';s.finishedAt=now}}
 return {damage:applied,cleared}
}
function view(s,id){if(!valid(s.players,id))fail('Not a member',403);const p=s.players[id];return {season:s.season,tier:s.tier,boss:s.boss,bossName:BOSSES[s.boss],status:s.status,leader:s.owner===id,cap:TIERS[s.tier].cap,recommended:TIERS[s.tier].recommended,hp:s.hp,maxHP:s.maxHP,phase:s.phase,weak:s.weak,armor:s.armor,regenerated:s.regenerated,startedAt:s.startedAt,finishedAt:s.finishedAt,assisted:s.assisted,team:Object.entries(s.players).map(([k,v])=>({name:alias(k),self:k===id,damage:v.damage,turns:v.turns})),me:{board:p.board,skills:p.skills,seq:p.seq,turns:p.turns,turnLimit:TIERS[s.tier].turns,blocked:p.blocked,slow:p.slow,available:expose(p)}}}
function roster(s){return createHash('sha256').update(Object.keys(s.players).sort().join(',')).digest('hex')}
module.exports={SEASON,BOSSES,TIERS,createRoom,join,leave,start,act,view,roster,alias,expired};
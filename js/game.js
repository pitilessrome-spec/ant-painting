/* ANT CANVAS · game logic (box order, eating rules, revive and reshuffle) */
'use strict';
/* ---------- Difficulty: changes with the level ---------- */
function levelChallenge(lv){
  if(lv<3||lv%3!==0)return {id:'classic',name:'Classic',charge:42,shots:7,pace:200};
  const kind=Math.floor(lv/3)%3;
  return kind===1?{id:'rainbow',name:'Rainbow Rush',charge:18,shots:10,pace:165}:kind===2?{id:'precision',name:'Precision Puzzle',charge:42,shots:7,pace:200}:{id:'sprint',name:'Ant Sprint',charge:32,shots:7,pace:130};
}
function levelParams(lv) {
  const challenge=levelChallenge(lv);
  const sprint=challenge.id==='sprint',precision=challenge.id==='precision';
  return {
    challenge,
    cap: 4,   // 4 slots at the start; watching ads adds more (up to 7)
    cmin: sprint ? (lv<=10?4:lv<=300?6:14) : lv <= 10 ? 8 : lv <= 300 ? 12 : 30,
    cmax: sprint ? (lv<=10?10:lv<=300?15:25) : lv <= 10 ? 20 : lv <= 300 ? 30 : 50,
    // Chunked queues expose later boxes earlier, requiring planning.
    chunk: Math.min(6,(lv < 10 ? 1 : lv < 20 ? 2 : lv < 40 ? 3 : lv < 80 ? 4 : 5)+(precision?1:0)),
    hints: lv < 10 ? Infinity : lv < 40 ? 3 : 2,
    reshuffles: lv < 10 ? 0 : 1,
    revives: lv < 10 ? Infinity : 1
  };
}

const SKILL_TYPES=['bomb','wild','frost','lightning','wind','key','super'];
function specialCells(lv,n,random=Math.random){
 const ice=new Uint8Array(n*n),boss=new Uint8Array(n*n),guards=Array.from({length:n*n},()=>null);
 if(lv>=4&&lv%6===4)for(let y=1;y<n-1;y++)for(let x=0;x<n;x++)if((x*7+y*11+lv%19)%19===0)ice[y*n+x]=1;
 if(lv>=10&&lv%10===0){const mid=Math.floor(n/2);for(let y=mid-1;y<mid+2;y++)for(let x=mid-2;x<mid+2;x++)if(x>=0&&x<n&&y>=0&&y<n)boss[y*n+x]=1}
 // Boss shield dependencies always point downwards, never form a cycle.
 const kind=lv%10===0&&lv>=10?['Web Guardian','Iron Beetle','Frost Sentinel','Rainbow King'][(Math.floor(lv/10)-1)%4]:null;
 const layers=[[],[],[]];if(kind){const mid=Math.floor(n/2);for(let i=0;i<n*n;i++)if(boss[i])layers[mid+1-Math.floor(i/n)]?.push(i);
 for(let layer=1;layer<layers.length;layer++)for(const i of layers[layer]){
   const lower=layers[layer-1];
   guards[i]=kind==='Web Guardian'?lower.filter(j=>Math.abs(j%n-i%n)<=1):kind==='Frost Sentinel'?lower.filter(j=>j%n===i%n):kind==='Rainbow King'?lower.filter((j,k)=>j%n===i%n||k===(lower.length-1-lower.findIndex(v=>v%n===i%n))):lower.slice();
 }}
 const gem=lv>=5?Math.floor(n/3)*n+Math.floor(n/2):-1,markers=[];for(let i=0;i<n*n;i++)if(ice[i]||boss[i]||i===gem)markers.push(i);const skillAt=Object.create(null),secret=new Set(),treasureGuards=Array(n*n).fill(null);
 if(lv>=12&&lv%3===0&&gem>=0){for(const i of [gem-1,gem,gem+1])if(i>=0&&i+n<n*n&&!boss[i]){treasureGuards[i]=[i+n];if(!markers.includes(i))markers.push(i)}}
 {
 const count=8+Math.floor(random()*8),types=ice.some(v=>v)?['bomb','wild','frost']:['bomb','wild'];if(lv>=6)types.push('lightning');if(lv>=9)types.push('wind');if(treasureGuards.some(Boolean))types.push('key');if(lv>=15)types.push('super');
 const available=new Set(Array.from({length:n*n},(_,i)=>i).filter(i=>!ice[i]&&!boss[i]&&!treasureGuards[i]&&i!==gem));
 for(let i=types.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[types[i],types[j]]=[types[j],types[i]]}
 for(let k=0;k<count&&available.size;k++){const y=Math.max(0,n-1-Math.floor(n*k/count));let pool=Array.from(available).filter(j=>Math.abs(Math.floor(j/n)-y)<=1);if(k===0){const p=pool.filter(j=>Math.floor(j/n)===n-1);if(p.length)pool=p}if(!pool.length)pool=Array.from(available);const i=pool[Math.floor(random()*pool.length)];available.delete(i);skillAt[i]=types[k%types.length];markers.push(i)}
 }
 return {ice,boss,guards,layers,kind,gem,markers,skillAt,secret,treasureGuards,treasureOpen:false};
}
function iceLocked(eaten,ice,n,i){return !!ice?.[i]&&i+n<eaten.length&&!eaten[i+n]}
function bossLocked(eaten,special,i){return !!special?.guards?.[i]?.some(j=>!eaten[j])}
function treasureLocked(eaten,special,i){return !special?.treasureOpen&&!!special?.treasureGuards?.[i]?.some(j=>!eaten[j])}
function cellLocked(eaten,special,n,i){return iceLocked(eaten,special?.ice,n,i)||bossLocked(eaten,special,i)||treasureLocked(eaten,special,i)}
function dailyLevel(day){const d=Date.parse(day+'T00:00:00Z');return Number.isFinite(d)?3+(Math.floor(d/86400000)%30+30)%30:3;}
/* ---------- Eating rules ---------- */
// Starting from the hole, ants can only walk through eaten cells that connect to the hole
function reachDist(eaten, n) {
  const N = n * n;
  const dist = new Int16Array(N + n).fill(-1), par = new Int32Array(N + n).fill(-1);
  const q = new Int32Array(N + n); let h = 0, t = 0;
  for (let x = 0; x < n; x++) { dist[N + x] = 0; q[t++] = N + x; }
  while (h < t) {
    const i = q[h++];
    let x, y;
    if (i >= N) { x = i - N; y = n; } else { x = i % n; y = (i - x) / n; }
    const cand = y === n ? [[x, n - 1]] : [[x, y - 1], [x - 1, y], [x + 1, y]];
    for (const [a, b] of cand) {
      if (a < 0 || a >= n || b < 0 || b >= n) continue;
      const j = b * n + a;
      if (eaten[j] && dist[j] < 0) { dist[j] = dist[i] + 1; par[j] = i; q[t++] = j; }
    }
  }
  return { dist, par };
}
// Uneaten cells: the bottom row is always exposed; other cells need a neighbor that already connects to the hole
function expoAt(dist, n, x, y) {
  if (y + 1 >= n) return true;
  for (const [a, b] of [[x, y + 1], [x, y - 1], [x - 1, y], [x + 1, y]]) {
    if (a < 0 || a >= n || b < 0 || b >= n) continue;
    if (dist[b * n + a] >= 0) return true;
  }
  return false;
}
// The exposed cell of this color closest to the hole (ants always eat this one)
function nearestCell(eaten, n, role, c, dist, special) {
  let best = -1, bd = Infinity; const hx = n / 2, hy = n + 0.9;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x;
    if (eaten[i] || (c!==-1&&role[i] !== c) || cellLocked(eaten,special,n,i) || !expoAt(dist, n, x, y)) continue;
    const d = (x + 0.5 - hx) * (x + 0.5 - hx) + (y + 0.5 - hy) * (y + 0.5 - hy);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
// Simulate a correct play to build the box order: following this order always clears the level
function makeSeqFrom(role, n, init, R, cmin, cmax, special) {
  const N = n * n, eaten = Uint8Array.from(init);
  let left = 0; for (let i = 0; i < N; i++) if (!eaten[i]) left++;
  const seq = [];
  while (left > 0) {
    const { dist } = reachDist(eaten, n);
    const cnt = new Int32Array(32);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (!eaten[i] && !cellLocked(eaten,special,n,i) && expoAt(dist, n, x, y)) cnt[role[i]]++;
    }
    const cols = []; for (let c = 0; c < 32; c++) if (cnt[c] > 0) cols.push(c);
    if (!cols.length) throw new Error('no exposed cell');
    const c = cols[Math.floor(R() * cols.length)];
    const k = Math.min(cnt[c], cmin + Math.floor(R() * (cmax - cmin + 1)));
    for (let t = 0; t < k; t++) {
      const { dist: d2 } = reachDist(eaten, n);
      const i = nearestCell(eaten, n, role, c, d2, special);if(i<0)throw Error('invalid generated target');
      eaten[i] = 1;
    }
    seq.push({ c, n: k });
    left -= k;
  }
  return seq;
}

class Game {
  constructor(lv, o) {
    o = o || {};
    this.lv = lv; this.rand = o.rand || Math.random;
    const P = buildPicture(lv);
    this.n = P.n; this.role = P.role; this.pal = palette(lv); this.subj = P.subj; this.kind=P.kind; this.theme=P.theme;
    const prm = levelParams(lv);
    this.cmin = prm.cmin; this.cmax = prm.cmax;
    this.difficulty=prm;this.hintsUsed=0;this.reshufflesUsed=0;this.revivesUsed=0;
    const N = this.n * this.n;
    this.total = N; this.left = N;
    this.eaten = new Uint8Array(N);this.special=specialCells(lv,this.n,o.skillRand||Math.random);this.powerCredits=new Int32Array(32);this.pendingPowerCascade=false;this.skills=Object.fromEntries(SKILL_TYPES.map(k=>[k,0]));this.skillOrder=[];this.skillDelivered=new Uint8Array(N);this.skillDestroyed=new Uint8Array(N);this.skillsUsed=0;this.daily=o.daily||null;
    // Combat is independent of the tile-guard counter. Each resolved cell supplies at least 1 damage.
    this.battle=this.special.kind?{hp:N,max:N,phase:1,weak:this.role[N-1],armor:0,webMs:0,frostMs:0,webSlot:0,damage:0,delivered:0,shots:0,direct:0,attacks:0,regenPending:0,regenerated:0,healed:0,regenWaves:0,tier:Math.min(6,1+Math.floor((lv-10)/20))}:null;this.battleResolved=new Uint8Array(N);this.regenSeen=new Uint8Array(N);this.regenEligible=new Uint8Array(N);
    this.cap = o.cap || prm.cap; this.slots = new Array(this.cap).fill(null);
    this.cols = [[], [], [], []]; this.ants = []; this.ev = [];
    this.state = 'play'; this.speed = o.speed || 1; this._R = null; this.stalled = false;
    this.blastEnabled=typeof window!=='undefined'&&!!(window.AntWorkshop&&window.AntWorkshop.enabled);
    this.blastCharge=0;this.blastRemaining=0;this.blastShots=0;this.visualDone=0;
    this.challenge=prm.challenge;this.dispatches=0;this.directDispatches=0;this.cleanDispatches=0;this.peakWaiting=0;this.smartChain=0;this.bestSmartChain=0;
    this.visualMs = this.challenge.pace;   // time between ants leaving a slot (animation only)
    this.rebuild();
  }
  pct() { return Math.floor((this.total - this.left) / this.total * 100); }
  visualPct() { return Math.floor(Math.min(this.total,this.visualDone) / this.total * 100); }
  // UI count: logical remaining (n) + ants queued to walk (q).
  // Decrement only when each queued ant actually leaves the slot in tick().
  slotDisplayCount(s) { return s ? s.n + s.q.length : 0; }
  R() { if (!this._R) this._R = reachDist(this.eaten, this.n); return this._R; }

  // Rebuild the boxes from the uneaten cells (always clearable). Ants still queued in slots are released first so no cell is left hanging
  rebuild() {
    for (const s of this.slots) {
      if (!s) continue;
      for (const job of s.q) { this.spawnVisual(job); if(!this.special.skillAt[job.idx])this.ev.push({ t: 'eat', i: job.idx, c: job.c }); }
    }
    this.powerCredits.fill(0);this.pendingPowerCascade=false;
    const seq = makeSeqFrom(this.role, this.n, this.eaten, this.rand, this.cmin, this.cmax,this.special);
    this.cols = [[], [], [], []];
    seq.forEach((b, i) => this.cols[Math.floor(i / this.difficulty.chunk) % 4].push({ c: b.c, n: b.n, id: i }));
    this.slots.fill(null);
    this.stalled = false;
  }
  reshuffle() { if (this.state !== 'play'||this.reshufflesUsed>=this.difficulty.reshuffles) return false; this.reshufflesUsed++;this.rebuild(); return true; }
  revive() { if (this.state !== 'lose'||this.revivesUsed>=this.difficulty.revives) return false; this.revivesUsed++;this.addSlot(); this.rebuild(); this.state = 'play'; return true; }
  useHint() {if(this.state!=='play'||this.hintsUsed>=this.difficulty.hints)return false;this.hintsUsed++;return true;}
  addSlot() { if (this.cap < 7) { this.cap++; this.slots.push(null); } }

  // Can this color be eaten right now? Returns the cell to eat, or -1
  target(c) { return nearestCell(this.eaten, this.n, this.role, c, this.R().dist,this.special); }
  // Ant path: from the hole, only through eaten cells (computed before eating)
  route(i) {
    const n = this.n, N = n * n, { dist, par } = this.R();
    const x = i % n, y = (i - x) / n;
    let bj = -1, bd = Infinity, virt = false;
    for (const [a, b] of [[x, y + 1], [x, y - 1], [x - 1, y], [x + 1, y]]) {
      if (a < 0 || a >= n) continue;
      if (b >= n) { virt = true; break; }
      if (b < 0) continue;
      const j = b * n + a;
      if (dist[j] >= 0 && dist[j] < bd) { bd = dist[j]; bj = j; }
    }
    const list = [];
    if (!virt && bj >= 0) { for (let j = bj; j >= 0 && j < N; j = par[j]) list.push(j); list.reverse(); }
    return list;
  }
  eatCell(i) { if(this.eaten[i])return false;this.eaten[i]=1;this.left--;this._R=null;return true; }
  bossHealth(){let total=0,remaining=0,shielded=0;for(const i of this.special.markers)if(this.special.boss[i]){total++;if(!this.eaten[i]){remaining++;if(bossLocked(this.eaten,this.special,i))shielded++}}return {total,remaining,shielded,phase:this.special.layers.findIndex(layer=>layer.some(i=>!this.eaten[i]))+1,name:this.special.kind}}
  battleHealth(){const guards=this.bossHealth(),b=this.battle;return b?{...guards,total:b.max,remaining:b.hp,phase:b.phase,weak:b.weak,armor:b.armor,webMs:b.webMs,frostMs:b.frostMs,attacks:b.attacks,regenPending:b.regenPending,regenerated:b.regenerated,tier:b.tier}:guards}
  battleDamage(amount,mode,c){const b=this.battle;if(!b||b.hp<=0||!Number.isFinite(amount)||amount<=0)return 0;const old=b.hp; b.hp=Math.max(0,b.hp-Math.floor(amount));const actual=old-b.hp;b.damage+=actual;this.ev.push({t:'bossHit',amount:actual,mode,c,hp:b.hp});
    const next=b.hp===0?4:b.hp*100<=b.max*40?3:b.hp*100<=b.max*70?2:1;
    while(b.phase<next){b.phase++;if(b.phase===4){b.webMs=0;b.frostMs=0;b.armor=0;b.regenPending=0;this.ev.push({t:'bossDefeated'});break}b.attacks++;b.regenPending+=6+b.tier*4+(b.phase===3?4:0);const kind=this.special.kind;
      if(kind==='Web Guardian'){b.webSlot=(b.phase-2)%this.cap;b.webMs=1600+600*b.tier;}
      else if(kind==='Iron Beetle')b.armor=24+12*b.tier;
      else if(kind==='Frost Sentinel')b.frostMs=2000+600*b.tier;
      else {const colors=[...new Set(this.role)];b.weak=colors[(colors.indexOf(b.weak)+1)%colors.length];}
      this.ev.push({t:'bossCounter',name:kind,phase:b.phase,weak:b.weak});}
    return actual;
  }
  resolveBattleCell(i,mode,c){const b=this.battle;if(!b||!this.eaten[i]||this.battleResolved[i])return false;this.battleResolved[i]=1;if(mode==='blast')b.shots++;else {b.delivered++;this.regenEligible[i]=1;}let bonus=(this.special.boss[i]?3:0)+(c===b.weak?1:0)+(mode==='blast'?1:0);if(b.armor>0){b.armor--;bonus=0;}this.battleDamage(1+bonus,mode,c);return true;}
  regenerateBossTiles(){const b=this.battle;if(!b||!b.regenPending||!b.hp||this.ants.length||this.slots.some(s=>s&&s.q.length))return 0;
    const wanted=b.regenPending;b.regenPending=0;const targets=[];for(let i=this.total-1;i>=0&&targets.length<wanted;i--)if(this.eaten[i]&&this.battleResolved[i]&&this.regenEligible[i]&&!this.regenSeen[i]&&!this.special.markers.includes(i)){targets.push(i)}
    if(!targets.length)return 0;for(const i of targets){this.eaten[i]=0;this.battleResolved[i]=0;this.regenEligible[i]=0;this.regenSeen[i]=1;}this.left+=targets.length;this._R=null;this.rebuild();b.regenerated+=targets.length;b.regenWaves++;const healed=Math.min(targets.length,b.max-b.hp);b.hp+=healed;b.healed+=healed;this.ev.push({t:'bossRegen',targets,count:targets.length,healed});return targets.length;
  }
  bossPowerReady(mode){return !!this.battle&&this.battle.hp>0&&this.state==='play'&&['bomb','lightning','super','frost','wind'].includes(mode)&&this.skills[mode]>0&&(mode!=='frost'||this.battle.frostMs>0)&&(mode!=='wind'||this.battle.webMs>0);}
  attackBoss(mode){if(!this.bossPowerReady(mode))return false;const b=this.battle;this.skills[mode]--;this.skillsUsed++;b.direct++;let dmg={bomb:18,lightning:28,super:45,frost:8,wind:8}[mode];if(mode==='frost')b.frostMs=0;if(mode==='wind')b.webMs=0;if(b.armor>0&&['bomb','lightning','super'].includes(mode)){b.armor=0;dmg+=12;}this.battleDamage(dmg,mode,b.weak);this.ev.push({t:'bossSkill',mode});return true;}
  // Accurate one-box forecast; only compute on explicit inspection, never auto-play.
  inspectBox(ci){const b=this.cols[ci]?.[0];if(!b||this.state!=='play')return null;
    const eaten=this.eaten.slice(),credits=this.powerCredits.slice();const slots=this.slots.map(s=>s?{c:s.c,n:s.n}:null);
    const si=slots.indexOf(null);if(si<0)return {full:true};
    slots[si]={c:b.c,n:b.n};let moved=true,total=0,own=0,opened=0;
    while(moved){moved=false;for(let k=0;k<slots.length;k++){const s=slots[k];if(!s)continue;while(s.n>0){const i=nearestCell(eaten,this.n,this.role,s.c,reachDist(eaten,this.n).dist,this.special);if(i<0){if(credits[s.c]>0){credits[s.c]--;s.n--;total++;if(k===si)own++;moved=true;continue}break}eaten[i]=1;s.n--;total++;if(k===si)own++;moved=true}}}
    for(const i of this.special.markers)if(!eaten[i]&&cellLocked(this.eaten,this.special,this.n,i)&&!cellLocked(eaten,this.special,this.n,i))opened++;
    return {own,total,waiting:b.n-own,opened,free:slots.filter(s=>!s||s.n===0).length};
  }
  deliverSkill(i){
    const mode=this.special.skillAt[i];if(!mode||!this.eaten[i]||this.skillDelivered[i]||this.skillDestroyed[i])return false;
    this.skillDelivered[i]=1;if(!this.skillOrder.includes(mode))this.skillOrder.push(mode);this.skills[mode]++;this.ev.push({t:'skillLoot',mode,count:this.skills[mode]});return true;
  }
  powerReady(mode){if(!SKILL_TYPES.includes(mode)||!this.skills[mode]||this.state!=='play'||!this.left||this.battle?.regenPending)return false;
    if(mode==='frost')return this.special.markers.some(i=>!this.eaten[i]&&iceLocked(this.eaten,this.special.ice,this.n,i));
    if(mode==='key')return this.special.markers.some(i=>!this.eaten[i]&&treasureLocked(this.eaten,this.special,i));
    return this.target(-1)>=0;
  }
  bombTargets(mode='bomb'){if(!this.powerReady(mode))return [];
    if(mode==='frost')return this.special.markers.filter(i=>!this.eaten[i]&&iceLocked(this.eaten,this.special.ice,this.n,i));
    if(mode==='key')return this.special.markers.filter(i=>!this.eaten[i]&&treasureLocked(this.eaten,this.special,i));
    const dist=this.R().dist,n=this.n;return Array.from({length:this.total},(_,i)=>i).filter(i=>!this.eaten[i]&&!cellLocked(this.eaten,this.special,n,i)&&expoAt(dist,n,i%n,Math.floor(i/n)));
  }
  usePower(mode,target=null){
    if(!Number.isInteger(target)||!this.bombTargets(mode).includes(target))return false;
    if(mode==='key'||mode==='frost'){
      if(mode==='key')this.special.treasureGuards[target]=null;else this.special.ice[target]=0;
      this.skills[mode]--;this.skillsUsed++;this.pendingPowerCascade=true;this.stalled=false;this.ev.push({t:'power',mode,count:1,targets:[target]});return true;
    }
    const n=this.n,first=target,destructive=mode!=='wild',hits=[],limit={bomb:5,lightning:9,super:13,wild:6,wind:3}[mode],chainColor=this.role[first],radius=mode==='super'||mode==='wild'?2:1;
    for(let k=0;k<limit;k++){let i=-1;if(k===0)i=first;else if(mode==='lightning')i=this.target(chainColor);else{
      const dist=this.R().dist,fx=first%n,fy=Math.floor(first/n);
      for(let j=0;j<this.total;j++){const x=j%n,y=Math.floor(j/n);if(Math.abs(x-fx)+Math.abs(y-fy)<=radius&&!this.eaten[j]&&!cellLocked(this.eaten,this.special,n,j)&&expoAt(dist,n,x,y)){i=j;break}}
      if(i<0)break;const path=this.route(i);this.eatCell(i);const c=this.role[i];this.powerCredits[c]++;hits.push({idx:i,c,path});
    }
    if(!hits.length)return false;this.skills[mode]--;this.skillsUsed++;this.pendingPowerCascade=true;this.stalled=false;
    let lost=0;for(const h of hits){if(destructive){if(this.special.skillAt[h.idx]){this.skillDestroyed[h.idx]=1;lost++;}this.spawnVisual(h,'blast');this.ev.push({t:'shot',i:h.idx,c:h.c});}else{this.spawnVisual(h);if(!this.special.skillAt[h.idx])this.ev.push({t:'eat',i:h.idx,c:h.c});}}
    this.ev.push({t:'power',mode,count:hits.length,lost,targets:hits.map(h=>h.idx)});return true;
  }
  // Logic: boxes in slots eat whatever they can, in slot order, until nothing more can be eaten. Depends only on cells, never on time
  cascade() {
    let progress = true;
    while (progress) {
      progress = false;
      for (const s of this.slots) {
        if (!s) continue;
        while (s.n > 0) {
          const idx = this.target(s.c);
          if(idx<0){if(this.powerCredits[s.c]>0){this.powerCredits[s.c]--;s.n--;progress=true;continue}break}
          const path = this.route(idx);
          this.eatCell(idx);
          s.q.push({ idx, path, c: s.c });
          s.n--;
          progress = true;
        }
      }
    }
  }

  // Load the top box into a slot: allowed even if it cannot move yet; it waits in the slot
  // Returns 1 on success, 2 if all slots are full, 0 if there is no box
  place(ci) {
    if (this.state !== 'play') return 0;
    if(this.battle?.regenPending)return 2;
    const col = this.cols[ci], b = col && col[0];
    if (!b) return 0;
    const si = this.slots.indexOf(null);
    if (si < 0) return 2;
    col.shift();
    this.slots[si] = { c: b.c, n: b.n, id: b.id, q: [], t: 0 };
    this.stalled = false;
    const before=this.left;
    this.cascade();
    this.dispatches++;
    if(this.slots[si].n===0)this.cleanDispatches++;
    this.peakWaiting=Math.max(this.peakWaiting,this.slots.filter(s=>s&&s.n>0).length);
    if(this.left<before){this.directDispatches++;this.smartChain++;this.bestSmartChain=Math.max(this.bestSmartChain,this.smartChain)}else this.smartChain=0;
    return 1;
  }
  // Hint: the next box in order (following this order wins; verified in makeGame)
  hint() {
    let best = -1, bid = Infinity;
    this.cols.forEach((col, ci) => {
      const b = col[0];
      if (b && b.id < bid) { bid = b.id; best = ci; }
    });
    return best;
  }

  spawnVisual(job, mode) {
    const n = this.n, pts = [[n / 2, n + 0.9]];
    if(mode==='blast'){
      this.ants.push({mode:'blast',c:job.c,idx:job.idx,x:n/2,y:n+0.9,ux:0,uy:-1,age:0,done:false,ph:0});
      return;
    }
    for (const j of job.path) pts.push([j % n + 0.5, Math.floor(j / n) + 0.5]);
    pts.push([job.idx % n + 0.5, Math.floor(job.idx / n) + 0.5]);
    this.ants.push({ c: job.c, idx: job.idx, pts, k: 1, x: pts[0][0], y: pts[0][1], ph: 0, ux: 0, uy: -1 });
  }

  tick(dt) {
    if (this.state !== 'play') return;
    if(this.pendingPowerCascade){this.pendingPowerCascade=false;this.cascade()}
    const sp = this.speed,b=this.battle;if(b){b.webMs=Math.max(0,b.webMs-dt*sp);b.frostMs=Math.max(0,b.frostMs-dt*sp);}
    // 1) Boxes in slots release ants at a steady pace (animation only); finished slots are freed
    for (let si = 0; si < this.slots.length; si++) {
      const s = this.slots[si];
      if (!s) continue;
      if(b&&b.webMs>0&&si===b.webSlot)continue;
      if (!s.q.length) s.t = 0;
      else {
        s.t += dt * sp;
        if (s.t >= this.visualMs) {
          s.t = 0;
          const job = s.q.shift();
          const charged=this.blastEnabled&&this.blastRemaining>0&&!this.special.skillAt[job.idx];
          if(charged){
            this.blastRemaining--;this.blastShots++;
            this.spawnVisual(job,'blast');
            this.ev.push({t:'shot',i:job.idx,c:job.c});
          }else{
            this.spawnVisual(job);
            if(!this.special.skillAt[job.idx])this.ev.push({t:'eat',i:job.idx,c:job.c});
            if(this.blastEnabled){
              this.blastCharge++;
              if(this.blastCharge>=this.challenge.charge){
                this.blastCharge=0;this.blastRemaining=this.challenge.shots;
                this.ev.push({t:'blastReady'});
              }
            }
          }
        }
      }
      if (s.n <= 0 && !s.q.length) this.slots[si] = null;
    }
    // 2) Ants walk
    const step = 0.028 * dt * sp*(b&&b.frostMs>0?.55:1);
    for (const a of this.ants) {
      if(a.mode==='blast'){
        a.age+=dt*sp;
        const t=Math.min(1,a.age/460);
        a.x=this.n/2+Math.sin((a.idx%7)*.8)*.36;
        a.y=this.n+.9-.32*Math.sin(Math.PI*t);
        a.ux=0;a.uy=-1;
        if(t>=1)a.done=true;
        continue;
      }
      let d = step;
      while (d > 0 && !a.done) {
        const T = a.pts[a.k], dx = T[0] - a.x, dy = T[1] - a.y, L = Math.hypot(dx, dy);
        if (L <= d) {
          a.x = T[0]; a.y = T[1]; d -= L; a.k++;
          if (a.k >= a.pts.length) {
            if (a.ph === 0) { if(this.special.skillAt[a.idx])this.ev.push({t:'eat',i:a.idx,c:a.c});a.ph = 1; a.pts.reverse(); a.k = 1; }
            else a.done = true;
          }
        } else {
          a.ux = dx / L; a.uy = dy / L;
          a.x += a.ux * d; a.y += a.uy * d; d = 0;
        }
      }
    }
    for(const a of this.ants)if(a.done){if(a.mode!=='blast')this.deliverSkill(a.idx);this.resolveBattleCell(a.idx,a.mode==='blast'?'blast':'ant',a.c)}
    this.ants = this.ants.filter(a => !a.done);
    if(b?.regenPending){if(this.ants.length||this.slots.some(s=>s&&s.q.length))return;this.regenerateBossTiles();}
    // 3) Win / lose
    if (this.left <= 0 && !this.cols.some(c=>c.length)) {
      if (!this.ants.length && this.slots.every(s => !s) && (!this.battle||this.battle.hp===0)) this.state = 'win';
      return;
    }
    if (this.ants.length || this.slots.some(s => s && s.q.length)||b?.webMs>0) return;
    // Every box in the slots is stuck (no ants walking, none queued)
    const full = this.slots.every(s => s);
    const noBoxes = this.cols.every(c => c.length === 0);
    if (full || noBoxes) { if(SKILL_TYPES.some(mode=>this.powerReady(mode))){if(!this.stalled){this.stalled=true;this.ev.push({t:'skillRescue'})}return;}this.state = 'lose'; return; }
    if (this.slots.some(s => s) && !this.stalled) { this.stalled = true; this.ev.push({ t: 'stall' }); }
  }

  // Verification: keep loading the hinted box; can the level be cleared? (logic only, no timing)
  hintWins() {
    for (let guard = 0; guard < 100000 && this.left > 0; guard++) {
      for (let si = 0; si < this.slots.length; si++) {
        const s = this.slots[si];
        if (s && s.n <= 0) this.slots[si] = null;
      }
      if (this.slots.indexOf(null) < 0) return false;
      const c = this.hint();
      if (c < 0) return false;
      if (this.place(c) !== 1) return false;
    }
    return this.left <= 0;
  }
  mastery(){const rate=this.dispatches?this.directDispatches/this.dispatches:0;const tactical=!!this.special.kind||this.challenge.id==='precision',efficiency=this.dispatches?this.cleanDispatches/this.dispatches:0;const clean=this.hintsUsed===0&&this.reshufflesUsed===0&&this.revivesUsed===0&&this.cap===4;return {rate,efficiency:this.dispatches?this.cleanDispatches/this.dispatches:0,peakWaiting:this.peakWaiting,chain:this.bestSmartChain,dispatches:this.dispatches,stars:this.state==='win'?(clean&&rate>=.85&&(!tactical||efficiency>=.85)?3:rate>=.65?2:1):0,clean};}
  snapshot() {
    return {
      eaten: this.eaten.slice(), left: this.left,dispatches:this.dispatches,directDispatches:this.directDispatches,cleanDispatches:this.cleanDispatches,peakWaiting:this.peakWaiting,smartChain:this.smartChain,bestSmartChain:this.bestSmartChain,skills:{...this.skills},skillOrder:this.skillOrder.slice(),skillDelivered:this.skillDelivered.slice(),skillDestroyed:this.skillDestroyed.slice(),skillsUsed:this.skillsUsed,powerCredits:this.powerCredits.slice(),pendingPowerCascade:this.pendingPowerCascade,ice:this.special.ice.slice(),treasureOpen:this.special.treasureOpen,treasureGuards:this.special.treasureGuards.map(v=>v&&v.slice()),battle:this.battle?{...this.battle}:null,battleResolved:this.battleResolved.slice(),regenSeen:this.regenSeen.slice(),regenEligible:this.regenEligible.slice(),
      cols: this.cols.map(col => col.map(b => ({ ...b }))),
      slots: this.slots.map(s => s ? { ...s, q: [] } : null)
    };
  }
  restore(sn) {
    this.eaten = sn.eaten; this.left = sn.left; this.cols = sn.cols; this.slots = sn.slots;
    this.dispatches=sn.dispatches||0;this.directDispatches=sn.directDispatches||0;this.cleanDispatches=sn.cleanDispatches||0;this.peakWaiting=sn.peakWaiting||0;this.smartChain=sn.smartChain||0;this.bestSmartChain=sn.bestSmartChain||0;this.skills={...sn.skills};this.skillOrder=(sn.skillOrder||[]).slice();this.skillDelivered=sn.skillDelivered.slice();this.skillDestroyed=sn.skillDestroyed.slice();this.skillsUsed=sn.skillsUsed||0;this.powerCredits=sn.powerCredits?sn.powerCredits.slice():new Int32Array(32);this.pendingPowerCascade=!!sn.pendingPowerCascade;this.special.ice=sn.ice.slice();this.special.treasureOpen=!!sn.treasureOpen;if(sn.treasureGuards)this.special.treasureGuards=sn.treasureGuards.map(v=>v&&v.slice());this.battle=sn.battle?{...sn.battle}:null;this.battleResolved=sn.battleResolved.slice();this.regenSeen=sn.regenSeen.slice();this.regenEligible=sn.regenEligible.slice();
    this._R = null; this.ants = []; this.ev = []; this.stalled = false; this.state = 'play';
  }
}

// Generate a level: each random seed builds a box order, which is checked by always loading the hinted box; if it cannot be cleared, try the next seed
function makeGame(lv, o) {
  o = o || {};
  let last = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const playerSeed=canvasPlayerSeed();
    const raw=lv*977+3+attempt*7919;
    const boxSeed=lv>999999&&typeof window!=='undefined'&&window.AntCanvasProfile?window.AntCanvasProfile.levelSeed(lv,977+attempt*7919):playerSeed===0?raw:mix32(raw^mix32(playerSeed));
    const g = new Game(lv, Object.assign({}, o, { rand: rng(boxSeed) }));
    const sn = g.snapshot();
    const ok = g.hintWins();
    g.restore(sn);
    if (ok) return g;
    last = g;
  }
  return last;
}

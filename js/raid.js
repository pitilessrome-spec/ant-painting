'use strict';
/* ANT CANVAS · Raid page.
 * Online: every move goes to the raid service, which runs the rules and returns the room.
 * Practice: the same engine (js/raid-practice-engine.js, built from telegram-backend/lib) runs on this device.
 * Bosses are drawn by AntBossArt; each boss's V7 mechanic shows on the art, the board and the hint bar. */
(() => {
  const $ = id => document.getElementById(id), tg = window.Telegram?.WebApp;
  const API = 'https://ant-canvas-telegram-api.vercel.app/api/raid/';
  const ORDER = ['beetle', 'spider', 'prism', 'frost'];
  const WORLDS = { beetle: 'Storybook Garden', spider: 'Mushroom Forest', prism: 'Coral Island', frost: 'Snowlight Valley' };
  const CREATURES = {
    beetle: { small: ['Giant Ladybug', 'Flower Path'], medium: ['Thorn Mantis', 'Thorn Arena'], world: ['Golden Scarab King', 'Garden Palace'] },
    spider: { small: ['Toxic Slime', 'Toxic Bog'], medium: ['Phantom Centipede', 'Dark Fungus Cave'], world: ['Abyss Spider Queen', 'Glowing Web Cave'] },
    prism: { small: ['Giant Hermit Crab', 'Shell Shallows'], medium: ['Coral Shark', 'Deep Trench'], world: ['Rainbow Leviathan', 'Sunken Coral Temple'] },
    frost: { small: ['Snowfield Scorpion', 'Snowy Plain'], medium: ['Crystal Giant', 'Crystal Ruins'], world: ['Frost Dragon Emperor', 'Aurora Throne'] },
  };
  const TIPS = {
    'beetle:small': 'Spots light up tiles after each counterattack. Clear them for double damage before they rot into buds.',
    'beetle:medium': 'Thorned tiles cost an extra turn. A bomb burns every thorn. In phase 3 its scythe breaks combos.',
    'beetle:world': 'When it rolls the golden ball, clear gold in 3 different columns within 20 s or its armour thickens.',
    'spider:small': 'A 6-tile hit splits it in two. Hit both slime colours to merge it. Toxic tiles deal no damage.',
    'spider:medium': 'From phase 2 it fades out and hides its weakness. Glowing tiles reveal it for 15 s.',
    'spider:world': 'Clear egg tiles before they hatch: every hatchling heals the Queen. Royal Guard ants ignore her webs.',
    'prism:small': 'Big hits make it hide in its shell for 5 s. Lightning cracks it open.',
    'prism:medium': 'The tide shifts every column. Keep hitting: ten quiet seconds send it into a frenzy.',
    'prism:world': 'Its weakness rotates on a warned schedule. Clear 4 colours (2+ each) within 6 s to stun it.',
    'frost:small': 'Its sting freezes columns. Clear the same colour next door to thaw them.',
    'frost:medium': 'Three crystals shield it. Clear their colours to shatter them before you go for the core.',
    'frost:world': 'Its breath ices the bottom row. Aurora tiles charge a 60-damage burst.',
  };
  const TIER = { small: 'SMALL RAID', medium: 'ELITE HUNT', world: 'WORLD BOSS' };
  const COLORS = ['Pink', 'Blue', 'Gold', 'Green'], SWATCH = ['#f7a8c0', '#9fd2f2', '#ffd56b', '#a6dc8a'];
  const ANTS = { worker: 'Worker Ant', fire: 'Fire Ant', thunder: 'Thunder Ant', royal: 'Royal Guard Ant', frost: 'Frost Ant', life: 'Life Ant', wing: 'Wing Ant', crystal: 'Crystal Ant', ancient: 'Ancient Ant' };
  const RARITY = ['', 'Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
  const RELICS = { beetle: 'Golden Carapace', spider: "Queen's Silk", prism: 'Rainbow Scale', frost: 'Dragon Scale' };
  const MATERIALS = { beetle: 'Scarab Brick', spider: 'Glow Silk', prism: 'Sunken Treasure', frost: 'Aurora Energy' };
  const EVENTS = {
    spot: 'Spot hit ×2!', thorn: 'Thorns cost an extra turn', 'thorns-burned': 'The bomb burned the thorns', 'ball-stopped': 'Golden ball stopped!',
    'slime-split': 'The slime split in two!', 'slime-merged': 'Slime merged · +30', revealed: 'Revealed! Its weakness is visible', 'egg-cleared': 'Egg destroyed',
    'shell-closed': 'It hid in its shell', 'shell-cracked': 'Shell cracked!', 'prism-break': 'Prism break · stunned!', thaw: 'Column thawed',
    'crystal-broken': 'A crystal shattered!', 'ice-broken': 'Ice broken', 'aurora-burst': 'Aurora burst · +60!',
  };

  let state = null, selected = 'beetle', tier = 'world', busy = false, online = false, progress = null;
  let practice = null, antData = null, training = false, leaders = [];
  let wsUrl = null, socket = null, socketRoom = null, socketReady = false, dirty = false, retryAt = 0;
  let art = null, artKey = null, lastRet = -1, lastPhase = 1, defeated = false;

  const msg = text => { $('status').textContent = text; };
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const creature = (boss, t) => CREATURES[boss]?.[t] || CREATURES[boss]?.world || ['Unknown', ''];
  const secs = (t, now) => Math.max(0, Math.ceil((t - now) / 1000));
  const itemName = x => x.item_code === 'evolution_core' ? 'Evolution core'
    : x.item_code === 'relic_shard' ? RELICS[x.boss] + ' shard'
    : x.item_code === 'relic' ? RELICS[x.boss]
    : x.item_code === 'material' ? MATERIALS[x.boss]
    : creature(x.boss, x.tier)[0] + ' relic';

  // ---------------- boss art ----------------
  function showArt(boss, t) {
    const key = boss + ':' + t;
    if (artKey !== key && window.AntBossArt) { art = AntBossArt.mount($('arena'), key, { phase: state?.phase || 1 }); artKey = key; lastRet = -1; lastPhase = 1; defeated = false; }
    const [name, place] = creature(boss, t);
    $('arena-name').textContent = name;
    $('arena-desc').textContent = WORLDS[boss] + ' · ' + place;
    $('tier-badge').textContent = TIER[t];
    $('boss-tip').textContent = TIPS[key] || '';
  }
  function floatText(text) { const f = el('div', text, 'float'); $('floats').append(f); setTimeout(() => f.remove(), 1000); }

  // What the boss's mechanic is doing right now: hint text plus the art overlay.
  function mechanicInfo(s, now) {
    const m = s.mechanic; if (!m) return null;
    const tiles = s.me.board.flat(), count = k => tiles.filter(t => t.m === k).length;
    switch (m.type) {
      case 'spots': { const n = count('spot'), b = count('bud'); return { text: n ? `✨ ${n} glowing spot${n > 1 ? 's' : ''}: clear them for ×2 damage` + (b ? ` · ${b} bud${b > 1 ? 's' : ''} deal nothing` : '') : '✨ Spots appear after each counterattack', mark: ['spot', n > 0, Math.min(n, 7)] }; }
      case 'thorns': { const n = count('thorn'); return { text: (n ? `🌿 ${n} thorned tile${n > 1 ? 's' : ''}: each costs an extra turn · a bomb burns them` : '🌿 Thorns grow after each counterattack') + (m.scytheAt && m.scytheAt > now ? ` · ⚠ scythe in ${secs(m.scytheAt, now)} s — hold your combo` : ''), mark: ['thorns', n > 0] }; }
      case 'golden-ball': return m.ball ? { text: `🟡 Golden ball! Clear gold in ${m.ball.need} different columns · ${m.ball.have}/${m.ball.need} · ${secs(m.ball.until, now)} s`, mark: ['ball', true] } : { text: '🟡 Watch for the golden ball on its next rage', mark: ['ball', false] };
      case 'split': return m.split ? { text: `🫧 Split! Hit ${COLORS[m.split.colors[0]]}${m.split.hit[0] ? ' ✓' : ''} and ${COLORS[m.split.colors[1]]}${m.split.hit[1] ? ' ✓' : ''} to merge it · damage 60% until then`, mark: ['split', true] } : { text: `🫧 A 6-tile hit splits it · ☠ toxic tiles deal no damage (${count('toxic')})`, mark: ['split', false] };
      case 'fade': return m.hidden ? { text: '👻 Hidden: weakness unknown, damage halved · clear a ✦ glowing tile to reveal it', mark: ['hidden', true] } : { text: m.revealUntil && m.revealUntil > now ? `✦ Revealed for ${secs(m.revealUntil, now)} s — hit its weakness!` : '👻 From phase 2 it fades out · save ✦ glowing tiles', mark: ['hidden', false] };
      case 'eggs': { const n = count('egg'); return { text: `🥚 ${n} egg${n === 1 ? '' : 's'} on your board: clear them before they hatch · hatched ${m.hatched}` + (m.blocked2 >= 0 ? ` · ${COLORS[m.blocked2]} is webbed too` : ''), mark: ['eggs', n > 0, Math.min(n, 4)] }; }
      case 'shell': return m.shellUntil && m.shellUntil > now ? { text: `🐚 In its shell for ${secs(m.shellUntil, now)} s: 35% damage · ⚡ lightning cracks it`, mark: ['shell', true] } : { text: '🐚 Big hits make it hide · chip away with smaller moves', mark: ['shell', false] };
      case 'tide': { const t = secs(m.nextTide, now); return { text: `🌊 Tide in ${t} s: every column shifts ${m.dir < 0 ? 'left' : 'right'} · keep hitting or it frenzies`, mark: ['tide', t <= 3] }; }
      case 'prism': return { text: (m.stunUntil && m.stunUntil > now ? `💫 Stunned for ${secs(m.stunUntil, now)} s: ×1.6 damage!` : `🌈 Weakness shifts in ${secs(m.nextShift, now)} s` + (m.nextWeak !== null && m.nextWeak !== undefined ? ` → ${COLORS[m.nextWeak]}` : '') + ` · colours this round: ${(m.colorsHit || []).map(c => COLORS[c]).join(', ') || 'none'} (need 4, 2+ each)`), mark: ['stun', !!(m.stunUntil && m.stunUntil > now)] };
      case 'freeze': { const n = Object.keys(m.frozen || {}).length; return { text: n ? `❄️ ${n} frozen column${n > 1 ? 's' : ''}: clear the same colour next door to thaw` : '❄️ Its sting freezes columns', mark: ['sting', n > 0] }; }
      case 'crystals': { const alive = m.crystals.filter(k => k.hp > 0); return { text: alive.length ? `💎 Crystals ${alive.length}/3 shield it (${[100, 80, 55, 30][alive.length]}% damage) · ` + m.crystals.map(k => `${COLORS[k.c]} ${k.hp ? k.hp + ' left' : '✓'}`).join(' · ') : '💎 All crystals shattered — full damage!', mark: ['crystals', true, m.crystals.map(k => k.hp > 0)] }; }
      case 'aurora': return { text: `🌌 Aurora charge ${m.charge}/${m.need}: clear ✧ tiles for a 60-damage burst · 🧊 iced tiles need extra hits`, mark: ['aurora', true, m.charge] };
      default: return null;
    }
  }

  // ---------------- online service ----------------
  async function call(path, body = {}) {
    if (!tg?.initData) throw Error('Open the game from Telegram to raid online');
    const r = await fetch(API + path, { method: 'POST', headers: { Authorization: 'tma ' + tg.initData, 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(data.error || 'The raid service is not open yet');
    return data;
  }
  function disconnect() { if (socket) { const old = socket; socket = null; old.close(); } socketReady = false; socketRoom = null; $('sync-mode').textContent = practice ? 'Practice · offline' : 'Sync: polling'; }
  function connect() {
    if (practice || !state || !['lobby', 'active'].includes(state.status) || !wsUrl) { if (!practice) disconnect(); return; }
    if (socket && socketRoom === state.room) return;
    if (Date.now() < retryAt) return;
    disconnect();
    const room = state.room;
    try {
      const w = new WebSocket(wsUrl); socket = w; socketRoom = room;
      w.onopen = () => w.send(JSON.stringify({ type: 'subscribe', room, initData: tg.initData }));
      w.onmessage = e => {
        if (socket !== w) return;
        try {
          const d = JSON.parse(e.data); if (d.room !== room) return;
          if (d.type === 'ready') { socketReady = true; $('sync-mode').textContent = 'Sync: live'; }
          if (d.type === 'changed') { dirty = true; if (!busy && state?.room === room) { dirty = false; run('state', { room }); } }
        } catch (_) { /* ignore malformed relay messages */ }
      };
      w.onclose = () => { if (socket !== w) return; socket = null; socketReady = false; socketRoom = null; retryAt = Date.now() + 3000; $('sync-mode').textContent = 'Sync: polling (reconnecting)'; };
      w.onerror = () => w.close();
    } catch (_) { retryAt = Date.now() + 3000; }
  }
  function remember() { try { if (state && !practice) sessionStorage.setItem('raid_room', state.room); else sessionStorage.removeItem('raid_room'); } catch (_) { /* storage may be unavailable */ } }

  function announce(action) {
    if (!action) return;
    if (action.refresh) { msg('The boss struck back! Your board changed — pick again.'); return; }
    if (action.expired) { msg('Time is up.'); return; }
    const parts = [];
    if (action.damage) { parts.push('Dealt ' + action.damage + ' damage'); floatText('-' + action.damage); art?.hit(); }
    if (action.comboBroken) parts.push('Ward broken together!');
    for (const e of action.events || []) if (EVENTS[e.type]) parts.push(EVENTS[e.type]);
    if (parts.length) msg(parts.join(' · '));
  }

  async function run(path, data = {}) {
    if (practice) return;
    if (busy || !online) return;
    busy = true; render();
    try {
      if (path === 'act') data = { ...data, epoch: state.retaliations };
      const d = await call(path, data);
      if (path === 'leave') { state = null; remember(); await myRooms(); }
      else { state = d; remember(); announce(d.action); if (d.status === 'won') { msg(d.rankedEligible === false ? 'Boss defeated! Not every member met the participation rule, so this clear is unranked.' : 'Boss defeated! First-clear rank ' + (d.rank || '—')); await rankings(); await ants(); } else if (d.status === 'failed') msg('The raid failed. Regroup and try again.'); }
    } catch (e) { msg(e.message); }
    finally {
      busy = false; render(); connect();
      if (dirty && state && ['lobby', 'active'].includes(state.status)) { dirty = false; run('state', { room: state.room }); }
    }
  }

  // ---------------- practice (offline, same rules) ----------------
  function practiceView() { const { R, s } = practice; return { ...R.view(s, 'me', Date.now()), room: 'practice', code: '—', practice: true }; }
  function startPractice() {
    const P = window.AntRaidPractice; if (!P) { msg('Practice is not available in this build.'); return; }
    const R = P.engine, now = Date.now(), s = R.createRoom(tier, selected, 'me', now);
    R.start(s, 'me', now);
    practice = { R, s }; disconnect(); state = practiceView(); render();
    msg('Practice started · the boss counterattacks on a timer · nothing here is saved');
  }
  function practiceAct(input) {
    const { R, s } = practice;
    try { const r = R.act(s, 'me', { seq: s.players.me.seq + 1, ...input }, Date.now()); state = practiceView(); announce(r); if (state.status === 'won') msg('Boss defeated in practice! Try it online with friends.'); else if (state.status === 'failed') msg('Practice over. The boss held on — try another approach.'); }
    catch (e) { msg(e.status === 429 ? 'Your ants are still carrying — wait a moment.' : e.message); }
    render();
  }
  function act(input) { if (practice) practiceAct(input); else run('act', { room: state.room, seq: state.me.seq + 1, ...input }); }

  // ---------------- rendering ----------------
  function renderLobby() {
    document.querySelectorAll('#tiers [data-tier]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tier === tier)));
    $('bosses').replaceChildren(...ORDER.map(k => {
      const [name] = creature(k, tier), locked = online && progress && !progress.available.includes(k) && !progress.cleared.includes(k);
      const b = el('button', undefined, 'boss-card' + (locked ? ' locked' : ''));
      b.append(el('b', name), el('small', WORLDS[k] + (locked ? ' · 🔒 clear the previous world boss first' : '')));
      b.setAttribute('aria-pressed', String(k === selected));
      b.onclick = () => { selected = k; renderLobby(); showArt(selected, tier); };
      return b;
    }));
    const locked = online && progress && !progress.available.includes(selected) && !progress.cleared.includes(selected);
    $('create').disabled = busy || !online || locked;
    $('join').disabled = busy || !online;
  }

  // Rebuild the board and buttons only when they change, so a tap is never lost to a timer refresh.
  let boardKey = '';
  function renderBoard(s) {
    const frozen = s.mechanic?.frozen || {};
    const key = JSON.stringify([s.me.board, s.me.available, s.me.blocked, frozen, s.mechanic?.blocked2, s.weak, s.status, s.me.skills, s.me.turns, busy]);
    if (key === boardKey) return;
    boardKey = key;
    $('board').replaceChildren(...s.me.board.map((col, ci) => {
      const c = el('div', undefined, 'col' + (frozen[ci] > 0 ? ' frozen' : ''));
      col.slice(0, 7).forEach((t, i) => {
        const tile = el('div', t.skill === 'bomb' ? '💣' : t.skill === 'lightning' ? '⚡' : '', 'tile c' + t.c + (i === 0 ? ' exposed' : ''));
        if (t.m) { tile.dataset.m = t.m; if (t.m === 'ice') tile.dataset.hp = String(t.hp || 1); }
        c.append(tile);
      });
      if (col.length > 7) c.append(el('small', '+' + (col.length - 7), 'muted'));
      return c;
    }));
    const avail = s.me.available, blocked2 = s.mechanic?.blocked2 ?? -1;
    const open = i => !Object.keys(frozen).length || s.me.board.some((a, ci) => a[0]?.c === i && !(frozen[ci] > 0)) || !s.me.board.some((a, ci) => a.length && !(frozen[ci] > 0));
    $('colors').replaceChildren(...COLORS.map((name, i) => {
      const b = el('button', name, 'pick p' + i + (s.weak === i ? ' weak' : ''));
      const reason = !avail.includes(i) ? 'not at the bottom' : (s.me.blocked === i && avail.length > 1) || (blocked2 === i && avail.length > 2) ? 'webbed' : !open(i) ? 'frozen' : '';
      b.disabled = busy || s.status !== 'active' || !!reason || s.me.turns >= s.me.turnLimit;
      if (reason && avail.includes(i)) b.title = name + ' is ' + reason;
      b.onclick = () => act({ kind: 'color', color: i });
      return b;
    }));
    for (const k of ['bomb', 'lightning']) { $(k).textContent = (k === 'bomb' ? '💣' : '⚡') + ' ×' + s.me.skills[k]; $(k).disabled = busy || s.status !== 'active' || s.me.skills[k] <= 0 || s.me.turns >= s.me.turnLimit; }
  }

  function render() {
    const s = state, now = Date.now();
    $('lobby').hidden = !!s; $('room').hidden = !s;
    if (!s) { renderLobby(); showArt(selected, tier); renderAnts(); return; }
    showArt(s.boss, s.tier);
    if (art) {
      art.setPhase(s.phase);
      if (lastRet >= 0 && s.retaliations > lastRet) art.attack();
      lastRet = s.retaliations;
      if (s.phase > lastPhase) msg('Phase ' + s.phase + '! ' + creature(s.boss, s.tier)[0] + ' grows fiercer.');
      lastPhase = s.phase;
      if (s.status === 'won' && !defeated) { art.defeat(); defeated = true; }
    }
    const [name] = creature(s.boss, s.tier);
    $('room-title').textContent = name + ' · ' + s.team.length + '/' + s.cap + ' players';
    $('room-title').append(...(s.practice ? [' ', el('span', 'PRACTICE', 'practice-tag')] : []));
    $('room-code').textContent = s.practice ? 'Offline practice — rules identical to online raids.' : 'Invite code ' + s.code;
    $('invite').hidden = s.practice || s.status !== 'lobby';
    $('start').hidden = s.practice || s.status !== 'lobby' || !s.leader;
    $('leave').hidden = s.practice || s.status !== 'lobby';
    $('exit').hidden = !(s.practice || ['won', 'failed', 'cancelled'].includes(s.status));
    $('exit').textContent = s.practice && s.status === 'active' ? 'End practice' : 'Back to lobby';
    $('combat').hidden = s.status !== 'active';
    $('hp').style.width = (s.maxHP ? 100 * s.hp / s.maxHP : 100) + '%';
    $('hp-text').textContent = s.status === 'lobby' ? 'Waiting for the leader to start' : s.status === 'won' ? 'Defeated!' : s.status === 'failed' ? 'Raid failed' : `${s.hp} / ${s.maxHP} HP · Phase ${s.phase}`;
    const chips = [];
    if (s.status === 'active') {
      chips.push(s.weak === null || s.weak === undefined ? ['Weak: hidden'] : ['Weak: ' + COLORS[s.weak], SWATCH[s.weak]]);
      chips.push(['Ward ' + s.ward]);
      if (s.armor) chips.push(['Armour ' + s.armor]);
      chips.push(['Rage ' + s.rage + ' · next in ' + secs(s.nextRageAt, now) + ' s']);
    }
    $('chips').replaceChildren(...chips.map(([t, sw]) => { const c = el('span', undefined, 'chip'); if (sw) { const d = el('i', undefined, 'sw'); d.style.background = sw; c.append(d); } c.append(t); return c; }));
    const info = s.status === 'active' ? mechanicInfo(s, now) : null;
    $('mechanic').hidden = !info; if (info) $('mechanic').textContent = info.text;
    if (art && info?.mark) art.mark(...info.mark);
    const weak = s.weak === null || s.weak === undefined ? 'its weak colour' : COLORS[s.weak];
    $('combo').textContent = s.status !== 'active' ? '' : s.ward === 0 ? 'Ward broken — all-out attack!'
      : s.combo ? (s.combo.self && s.team.length > 1 ? `Waiting for a teammate to follow with ${COLORS[s.combo.finishColor]}` : `Follow up with ${COLORS[s.combo.finishColor]} to break a ward!`)
      : `Break the ward: clear 2+ ${weak}, then ${s.weak === null || s.weak === undefined ? 'the next colour' : COLORS[(s.weak + 1) % 4]} within 5.5 s` + (s.team.length > 1 ? ' (a teammate finishes it)' : '');
    $('team').replaceChildren(...s.team.map(p => {
      const li = el('li', undefined, p.self ? 'me' : '');
      li.append(el('span', p.name + (p.self ? ' · you' : '')), el('span', `${p.ant.icon} ${ANTS[p.ant.species] || p.ant.species} Lv${p.ant.level} · ${p.damage} dmg · ${p.combos} wards`));
      return li;
    }));
    if (s.status === 'active') {
      $('turns').textContent = 'Turns left ' + (s.me.turnLimit - s.me.turns) + (s.me.slow ? ' · slowed' : '');
      $('clock').textContent = (s.deadlineAt ? secs(s.deadlineAt, now) + ' s left' : '');
      renderBoard(s);
    }
    for (const k of ['start', 'leave', 'invite', 'exit']) $(k).disabled = busy;
    renderAnts();
  }

  // ---------------- meta panels ----------------
  async function myRooms() {
    try {
      const d = await call('my-rooms');
      $('resume-rooms').replaceChildren(...d.rooms.map(r => { const b = el('button', `${creature(r.boss, r.tier)[0]} · ${r.members} players · ${r.status === 'active' ? 'fighting' : 'lobby'} · continue`); b.onclick = () => run('state', { room: r.room }); return b; }));
      if (!d.rooms.length) $('resume-rooms').append(el('small', 'No unfinished raids', 'muted'));
    } catch (e) { /* offline: keep the hint */ }
  }
  async function ants() { try { antData = await call('ants'); renderAnts(); } catch (_) { /* offline */ } }
  function renderAnts() {
    if (!antData) return;
    $('ant-cores').textContent = 'Evolution cores: ' + antData.cores;
    $('ant-list').replaceChildren(...antData.ants.map(a => {
      const card = el('div', undefined, 'ant-card');
      card.append(el('strong', `${a.icon} ${ANTS[a.species] || a.species} · ${a.owned ? 'Lv' + a.stats.level + ' ' + (RARITY[a.stats.level] || '') : 'locked'}`),
        el('small', `Attack ${a.stats.power}% · Pierce ${a.stats.pierce} · Resist ${a.stats.resist} · Carry +${a.stats.carry}`));
      const train = el('button', a.nextCost === null ? 'Max level' : (a.owned ? 'Evolve' : 'Unlock') + ' · ' + a.nextCost + ' cores');
      train.disabled = training || !a.unlockable || a.nextCost === null || a.nextCost > antData.cores;
      train.onclick = async () => {
        if (training) return; training = true; renderAnts();
        try { antData = await call('ants/train', { species: a.species, requestId: crypto.randomUUID() }); msg(ANTS[a.species] + ' evolved!'); }
        catch (e) { msg(e.message); } finally { training = false; renderAnts(); }
      };
      card.append(train);
      if (a.owned && state?.status === 'lobby' && !state.practice) { const eq = el('button', 'Bring on this raid'); eq.disabled = busy; eq.onclick = () => run('equip', { room: state.room, species: a.species }); card.append(eq); }
      return card;
    }));
  }
  function renderRank() {
    $('rank-list').replaceChildren(...leaders.map(x => el('li', `${creature(x.boss, x.tier)[0]} · #${x.rank} · ${x.members.length} players · ${new Date(x.completed_at).toLocaleString()} · ${Math.round(x.duration_ms / 1000)} s · ${x.members.join(' / ')}`)));
    if (!leaders.length) $('rank-list').append(el('li', 'No verified clears yet'));
  }
  async function rankings() {
    try {
      leaders = (await call('leaderboard', { boss: $('rank-boss').value, tier: $('rank-tier').value, sort: $('rank-sort').value, division: $('division').value })).leaders; renderRank();
      const r = await call('rewards');
      $('rewards').replaceChildren(...r.rewards.map(x => el('li', `${creature(x.boss, x.tier)[0]} · #${x.rank} · ${new Date(x.granted_at).toLocaleDateString()}`)));
      if (!r.rewards.length) $('rewards').append(el('li', 'No trophies yet'));
      const inv = await call('inventory');
      $('inventory').replaceChildren(...inv.items.map(x => el('li', `${itemName(x)} ×${x.quantity}`)));
      if (!inv.items.length) $('inventory').append(el('li', 'Nothing stored yet'));
    } catch (_) { $('rank-list').replaceChildren(el('li', 'The leaderboard opens with online raids')); }
  }

  // ---------------- wiring ----------------
  const query = new URLSearchParams(location.search);
  if (ORDER.includes(query.get('boss'))) selected = query.get('boss');
  if (['small', 'medium', 'world'].includes(query.get('tier'))) tier = query.get('tier');
  document.querySelectorAll('#tiers [data-tier]').forEach(b => { b.onclick = () => { tier = b.dataset.tier; render(); }; });
  $('create').onclick = () => run('create', { tier, boss: selected });
  $('practice').onclick = startPractice;
  $('join').onclick = () => run('join', { code: $('code').value.trim().toLowerCase() });
  $('start').onclick = () => run('start', { room: state.room });
  $('leave').onclick = () => run('leave', { room: state.room });
  $('exit').onclick = () => { practice = null; state = null; remember(); disconnect(); render(); myRooms(); };
  for (const k of ['bomb', 'lightning']) $(k).onclick = () => act({ kind: 'skill', skill: k });
  $('invite').onclick = () => {
    const url = 'https://t.me/AntCanvasArtBot/antcanvas?startapp=raid_' + state.code;
    tg?.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent('Join my ANT CANVAS raid against ' + creature(state.boss, state.tier)[0] + '!'));
  };
  $('refresh').onclick = rankings;
  for (const id of ['division', 'rank-boss', 'rank-tier', 'rank-sort']) $(id).onchange = rankings;

  async function boot() {
    render();
    try {
      tg?.ready(); tg?.expand();
      const catalog = await call('catalog');
      wsUrl = catalog.wsUrl || null; online = true;
      try { progress = await call('progress'); } catch (_) { progress = null; }
      msg('Raid service connected');
      const invite = query.get('invite') || ((tg?.initDataUnsafe?.start_param || '').match(/^raid_([0-9a-f]{12})$/) || [])[1];
      if (invite) { $('code').value = invite; await run('join', { code: invite }); }
      else { let room; try { room = sessionStorage.getItem('raid_room'); } catch (_) { /* storage may be unavailable */ } if (room) await run('state', { room }); }
      await myRooms(); await rankings(); await ants();
    } catch (e) {
      online = false;
      msg('Online raids are not open here yet — try Practice to fight with the real rules.');
      $('refresh').disabled = true;
    }
    render();
  }

  let lastPoll = 0;
  setInterval(() => {
    if (practice) {
      const { R, s } = practice;
      if (s.status === 'active') { R.advance(s, Date.now()); state = practiceView(); render(); }
      return;
    }
    if (state && !busy && !document.hidden && ['lobby', 'active'].includes(state.status)) {
      connect();
      if (dirty || Date.now() - lastPoll >= (socketReady ? 4000 : 1800)) { dirty = false; lastPoll = Date.now(); run('state', { room: state.room }); }
      else if (state.status === 'active') render();
    }
  }, 500);
  window.addEventListener('pagehide', disconnect);
  boot();
})();
